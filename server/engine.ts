import crypto from 'node:crypto';
import {
  AirportCode,
  AirportServiceType,
  AirportTransferBooking,
  AvailabilityBlock,
  Booking,
  BookingHold,
  BookingStatus,
  ChauffeurMission,
  CompanySettings,
  CustomerInfo,
  PaymentPlan,
  PaymentRecord,
  PriceBreakdown,
  RefundRecord,
  SelectedExtra,
  SupportTicket,
  UserProfile,
  Vehicle,
  VehicleCategoryCode,
  VehicleInspectionRecord,
} from '../src/types/domain';
import { createInitialDatabaseState, DatabaseState } from './seedData';

const WEBHOOK_SECRET = 'kprc-hmac-secret-morocco-2026';

export function signWebhookPayload(sessionId: string, idempotencyKey: string, outcome: string): string {
  return crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(`${sessionId}:${idempotencyKey}:${outcome}`)
    .digest('hex');
}

export class RentalPlatformEngine {
  private db: DatabaseState;
  private lockPromise: Promise<void> = Promise.resolve();

  constructor(initialState?: DatabaseState) {
    this.db = initialState ?? createInitialDatabaseState();
  }

  public resetDatabase(): void {
    this.db = createInitialDatabaseState();
  }

  public getStateSnapshot(): DatabaseState {
    this.cleanupExpiredHolds();
    return this.db;
  }

  // Serialized mutex for concurrency-safe inventory locking (Acceptance Test #3)
  private async withLock<T>(fn: () => Promise<T> | T): Promise<T> {
    let release!: () => void;
    const nextLock = new Promise<void>((resolve) => {
      release = resolve;
    });
    const prevLock = this.lockPromise;
    this.lockPromise = prevLock.then(() => nextLock);
    await prevLock;
    try {
      return await fn();
    } finally {
      release();
    }
  }

  public cleanupExpiredHolds(now = new Date()): void {
    const nowIso = now.toISOString();
    for (const hold of this.db.bookingHolds) {
      if (hold.status === 'active' && hold.expiresAt <= nowIso) {
        hold.status = 'expired';
      }
    }
  }

  private logAudit(
    actorId: string,
    actorRole: UserProfile['role'] | 'system' | 'guest',
    action: string,
    entityType: string,
    entityId: string,
    summary: string
  ): void {
    this.db.auditLogs.unshift({
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      actorId,
      actorRole,
      action,
      entityType,
      entityId,
      summary,
      createdAt: new Date().toISOString(),
    });
  }

  private logNotification(
    recipientEmail: string | undefined,
    recipientWhatsapp: string | undefined,
    channel: 'email' | 'whatsapp_link' | 'whatsapp_api_queued' | 'in_app',
    templateKey: string,
    subject: string,
    body: string,
    relatedReference: string
  ): void {
    const status =
      channel === 'whatsapp_api_queued' && !this.db.companySettings.whatsappApiConnected
        ? 'pending_api_config'
        : 'sent';
    this.db.notifications.unshift({
      id: `not-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      recipientEmail,
      recipientWhatsapp,
      channel,
      templateKey,
      subject,
      body,
      status,
      relatedReference,
      createdAt: new Date().toISOString(),
    });
  }

  private rangesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
    const a0 = new Date(startA).getTime();
    const a1 = new Date(endA).getTime();
    const b0 = new Date(startB).getTime();
    const b1 = new Date(endB).getTime();
    return a0 < b1 && b0 < a1;
  }

  public isVehicleAvailable(
    vehicleId: string,
    pickupAt: string,
    returnAt: string,
    options?: { ignoreHoldSessionToken?: string; ignoreBookingId?: string }
  ): { available: boolean; reason?: string } {
    this.cleanupExpiredHolds();

    const pTime = new Date(pickupAt).getTime();
    const rTime = new Date(returnAt).getTime();
    if (Number.isNaN(pTime) || Number.isNaN(rTime) || rTime <= pTime) {
      return { available: false, reason: 'Dates de prise en charge et de restitution invalides.' };
    }

    const vehicle = this.db.vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) {
      return { available: false, reason: 'Véhicule introuvable.' };
    }
    if (vehicle.status === 'maintenance' || vehicle.status === 'archived') {
      return { available: false, reason: `Ce véhicule est actuellement en ${vehicle.status}.` };
    }

    // Check maintenance / availability blocks
    for (const block of this.db.availabilityBlocks) {
      if (block.vehicleId === vehicleId && this.rangesOverlap(pickupAt, returnAt, block.startAt, block.endAt)) {
        return {
          available: false,
          reason: `Véhicule indisponible sur cette période (${block.notes || block.reason}).`,
        };
      }
    }

    // Check active bookings
    const activeStatuses: BookingStatus[] = [
      'pending_payment',
      'awaiting_confirmation',
      'confirmed',
      'ready_for_pickup',
      'active_rental',
    ];
    for (const booking of this.db.bookings) {
      if (options?.ignoreBookingId && booking.id === options.ignoreBookingId) continue;
      if (
        booking.vehicleId === vehicleId &&
        activeStatuses.includes(booking.status) &&
        this.rangesOverlap(pickupAt, returnAt, booking.pickupAt, booking.returnAt)
      ) {
        return {
          available: false,
          reason: `Véhicule déjà réservé du ${booking.pickupAt.slice(0, 10)} au ${booking.returnAt.slice(0, 10)}.`,
        };
      }
    }

    // Check active reservation holds from other sessions
    for (const hold of this.db.bookingHolds) {
      if (hold.vehicleId !== vehicleId || hold.status !== 'active') continue;
      if (options?.ignoreHoldSessionToken && hold.sessionToken === options.ignoreHoldSessionToken) continue;
      if (this.rangesOverlap(pickupAt, returnAt, hold.pickupAt, hold.returnAt)) {
        return {
          available: false,
          reason: 'Ce véhicule fait actuellement l’objet d’une réservation en cours par un autre client.',
        };
      }
    }

    return { available: true };
  }

  public searchAvailableVehicles(params: {
    pickupAt: string;
    returnAt: string;
    pickupLocationCode?: string;
    category?: VehicleCategoryCode | 'ALL';
    transmission?: 'Automatic' | 'Manual' | 'ALL';
    maxDailyPriceMad?: number;
    driverAge?: number;
    withChauffeur?: boolean;
    sessionToken?: string;
  }): Array<Vehicle & { availability: { available: boolean; reason?: string } }> {
    const pTime = new Date(params.pickupAt).getTime();
    const rTime = new Date(params.returnAt).getTime();
    if (Number.isNaN(pTime) || Number.isNaN(rTime) || rTime <= pTime) {
      throw new Error('La date de restitution doit être postérieure à la date de prise en charge.');
    }

    return this.db.vehicles
      .filter((v) => v.status !== 'archived')
      .filter((v) => {
        if (params.category && params.category !== 'ALL' && v.category !== params.category) return false;
        if (params.transmission && params.transmission !== 'ALL' && v.transmission !== params.transmission)
          return false;
        if (params.maxDailyPriceMad && v.dailyPriceMad > params.maxDailyPriceMad) return false;
        if (params.withChauffeur && !v.chauffeurAvailable) return false;
        return true;
      })
      .map((v) => {
        const availability = this.isVehicleAvailable(v.id, params.pickupAt, params.returnAt, {
          ignoreHoldSessionToken: params.sessionToken,
        });
        if (availability.available && params.driverAge && params.driverAge < v.minDriverAge && !params.withChauffeur) {
          return {
            ...v,
            availability: {
              available: false,
              reason: `Âge minimum requis pour ce modèle : ${v.minDriverAge} ans (ou optez pour le service avec chauffeur).`,
            },
          };
        }
        return { ...v, availability };
      });
  }

  public calculateRentalPrice(params: {
    vehicleId: string;
    pickupAt: string;
    returnAt: string;
    pickupLocationCode: string;
    returnLocationCode: string;
    extraCodes: Array<{ code: string; quantity: number }>;
    withChauffeur?: boolean;
    airportDelivery?: boolean;
    promoCode?: string;
    paymentPlan: PaymentPlan;
  }): PriceBreakdown {
    const vehicle = this.db.vehicles.find((v) => v.id === params.vehicleId);
    if (!vehicle) {
      throw new Error('Véhicule introuvable pour le calcul tarifaire.');
    }

    const pickupMs = new Date(params.pickupAt).getTime();
    const returnMs = new Date(params.returnAt).getTime();
    if (Number.isNaN(pickupMs) || Number.isNaN(returnMs) || returnMs <= pickupMs) {
      throw new Error('Période de location invalide.');
    }

    const rentalDays = Math.max(1, Math.ceil((returnMs - pickupMs) / (1000 * 60 * 60 * 24)));

    // Check seasonal rate or duration discount
    let effectiveDailyRateMad = vehicle.dailyPriceMad;
    let tierApplied: PriceBreakdown['tierApplied'] = 'daily';

    const pickupDateStr = params.pickupAt.slice(0, 10);
    const matchingSeasonal = vehicle.seasonalRates.find(
      (sr) => pickupDateStr >= sr.startDate && pickupDateStr <= sr.endDate
    );

    if (matchingSeasonal) {
      effectiveDailyRateMad = matchingSeasonal.dailyRateMad;
      tierApplied = 'seasonal';
    } else if (rentalDays >= 30) {
      effectiveDailyRateMad = Math.round(vehicle.dailyPriceMad * (1 - vehicle.monthlyDiscountPct / 100));
      tierApplied = 'monthly';
    } else if (rentalDays >= 7) {
      effectiveDailyRateMad = Math.round(vehicle.dailyPriceMad * (1 - vehicle.weeklyDiscountPct / 100));
      tierApplied = 'weekly';
    }

    const baseSubtotalMad = effectiveDailyRateMad * rentalDays;

    // Extras calculation
    const selectedExtras: SelectedExtra[] = [];
    for (const item of params.extraCodes) {
      if (item.quantity <= 0) continue;
      const catalogExtra = this.db.extras.find((e) => e.code === item.code);
      if (!catalogExtra) continue;
      const totalPriceMad = catalogExtra.perDay
        ? catalogExtra.priceMad * item.quantity * rentalDays
        : catalogExtra.priceMad * item.quantity;
      selectedExtras.push({
        extraCode: catalogExtra.code,
        nameFr: catalogExtra.nameFr,
        quantity: item.quantity,
        unitPriceMad: catalogExtra.priceMad,
        perDay: catalogExtra.perDay,
        totalPriceMad,
      });
    }

    const extrasSubtotalMad = selectedExtras.reduce((sum, e) => sum + e.totalPriceMad, 0);

    // Location delivery fees
    const pickupLoc = this.db.locations.find((l) => l.code === params.pickupLocationCode);
    const returnLoc = this.db.locations.find((l) => l.code === params.returnLocationCode);
    let deliveryFeeMad = (pickupLoc?.deliveryFeeMad ?? 0) + (returnLoc && returnLoc.code !== pickupLoc?.code ? Math.round(returnLoc.deliveryFeeMad * 0.5) : 0);
    if (params.airportDelivery && deliveryFeeMad === 0) {
      deliveryFeeMad = 350;
    }

    const chauffeurSupplementMad = params.withChauffeur
      ? this.db.companySettings.chauffeurDailyRateMad * rentalDays
      : 0;

    const grossBeforeDiscount = baseSubtotalMad + extrasSubtotalMad + deliveryFeeMad + chauffeurSupplementMad;

    // Promo code check
    let discountMad = 0;
    if (params.promoCode) {
      const cleanCode = params.promoCode.trim().toUpperCase();
      const promo = this.db.promotions.find((p) => p.code.toUpperCase() === cleanCode && p.isActive);
      if (promo && rentalDays >= promo.minDays) {
        discountMad =
          promo.discountType === 'percentage'
            ? Math.round((baseSubtotalMad * promo.discountValue) / 100)
            : promo.discountValue;
      }
    }

    const totalPayableMad = Math.max(0, grossBeforeDiscount - discountMad);
    const vatRate = this.db.companySettings.vatRatePct / 100;
    const subtotalHtMad = Number((totalPayableMad / (1 + vatRate)).toFixed(2));
    const taxAmountMad = Number((totalPayableMad - subtotalHtMad).toFixed(2));

    // Security deposit is strictly separated from rental payable amount
    const refundableDepositMad = params.withChauffeur ? 0 : vehicle.depositMad;

    let depositPct = 100;
    if (params.paymentPlan === 'deposit_20') depositPct = 20;
    else if (params.paymentPlan === 'deposit_30') depositPct = 30;
    else if (params.paymentPlan === 'deposit_50') depositPct = 50;
    else if (params.paymentPlan === 'pay_on_arrival') depositPct = 0;

    const amountDueOnlineMad = Math.round((totalPayableMad * depositPct) / 100);
    const balanceDueAtPickupMad = totalPayableMad - amountDueOnlineMad;

    return {
      rentalDays,
      effectiveDailyRateMad,
      tierApplied,
      baseSubtotalMad,
      extrasSubtotalMad,
      deliveryFeeMad,
      chauffeurSupplementMad,
      discountMad,
      subtotalHtMad,
      taxAmountMad,
      totalPayableMad,
      refundableDepositMad,
      amountDueOnlineMad,
      balanceDueAtPickupMad,
      selectedExtras,
    };
  }

  public async createReservationHold(params: {
    vehicleId: string;
    pickupAt: string;
    returnAt: string;
    sessionToken: string;
    ttlMinutes?: number;
  }): Promise<BookingHold> {
    return this.withLock(() => {
      const check = this.isVehicleAvailable(params.vehicleId, params.pickupAt, params.returnAt, {
        ignoreHoldSessionToken: params.sessionToken,
      });
      if (!check.available) {
        throw new Error(check.reason || 'Véhicule indisponible sur ces dates.');
      }

      // Release previous active holds for this session on this vehicle
      for (const h of this.db.bookingHolds) {
        if (h.sessionToken === params.sessionToken && h.status === 'active') {
          h.status = 'released';
        }
      }

      const ttlMs = (params.ttlMinutes ?? 15) * 60 * 1000;
      const hold: BookingHold = {
        id: `hld-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        vehicleId: params.vehicleId,
        sessionToken: params.sessionToken,
        pickupAt: params.pickupAt,
        returnAt: params.returnAt,
        expiresAt: new Date(Date.now() + ttlMs).toISOString(),
        status: 'active',
      };

      this.db.bookingHolds.push(hold);
      return hold;
    });
  }

  public async createBooking(params: {
    vehicleId: string;
    pickupLocationCode: string;
    returnLocationCode: string;
    customDeliveryAddress?: string;
    pickupAt: string;
    returnAt: string;
    extraCodes: Array<{ code: string; quantity: number }>;
    customer: CustomerInfo;
    paymentPlan: PaymentPlan;
    withChauffeur?: boolean;
    airportDelivery?: boolean;
    flightNumber?: string;
    promoCode?: string;
    sessionToken: string;
    profileId?: string;
  }): Promise<{ booking: Booking; paymentSession?: PaymentRecord }> {
    return this.withLock(() => {
      const vehicle = this.db.vehicles.find((v) => v.id === params.vehicleId);
      if (!vehicle) {
        throw new Error('Véhicule introuvable.');
      }

      if (!params.withChauffeur && params.customer.driverAge < vehicle.minDriverAge) {
        throw new Error(
          `L’âge minimum du conducteur pour ${vehicle.brand} ${vehicle.model} est de ${vehicle.minDriverAge} ans.`
        );
      }

      const availability = this.isVehicleAvailable(params.vehicleId, params.pickupAt, params.returnAt, {
        ignoreHoldSessionToken: params.sessionToken,
      });
      if (!availability.available) {
        throw new Error(availability.reason || 'Ce véhicule n’est plus disponible pour ces dates.');
      }

      const breakdown = this.calculateRentalPrice({
        vehicleId: params.vehicleId,
        pickupAt: params.pickupAt,
        returnAt: params.returnAt,
        pickupLocationCode: params.pickupLocationCode,
        returnLocationCode: params.returnLocationCode,
        extraCodes: params.extraCodes,
        withChauffeur: params.withChauffeur,
        airportDelivery: params.airportDelivery,
        promoCode: params.promoCode,
        paymentPlan: params.paymentPlan,
      });

      // Convert any active hold for this session
      const matchingHold = this.db.bookingHolds.find(
        (h) => h.sessionToken === params.sessionToken && h.vehicleId === params.vehicleId && h.status === 'active'
      );
      if (matchingHold) {
        matchingHold.status = 'converted';
      }

      const reference = `KPRC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const accessToken = `TOK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const nowIso = new Date().toISOString();

      const initialStatus: BookingStatus =
        params.paymentPlan === 'pay_on_arrival' ? 'awaiting_confirmation' : 'pending_payment';

      const booking: Booking = {
        id: `bkg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        reference,
        accessToken,
        customerId: params.customer.id || `cust-${Date.now()}`,
        profileId: params.profileId,
        customer: params.customer,
        vehicleId: vehicle.id,
        vehicleTitle: `${vehicle.brand} ${vehicle.model} (${vehicle.year})`,
        vehicleCategory: vehicle.category,
        vehicleImage: vehicle.images[0]?.url || '/vehicles/mercedes-classe-c-220d-amg-2025.svg',
        pickupLocationCode: params.pickupLocationCode,
        returnLocationCode: params.returnLocationCode,
        customDeliveryAddress: params.customDeliveryAddress,
        pickupAt: params.pickupAt,
        returnAt: params.returnAt,
        rentalDays: breakdown.rentalDays,
        baseSubtotalMad: breakdown.baseSubtotalMad,
        extrasSubtotalMad: breakdown.extrasSubtotalMad,
        deliveryFeeMad: breakdown.deliveryFeeMad,
        chauffeurSupplementMad: breakdown.chauffeurSupplementMad,
        discountMad: breakdown.discountMad,
        taxAmountMad: breakdown.taxAmountMad,
        totalPayableMad: breakdown.totalPayableMad,
        refundableDepositMad: breakdown.refundableDepositMad,
        paymentPlan: params.paymentPlan,
        amountDueOnlineMad: breakdown.amountDueOnlineMad,
        amountPaidMad: 0,
        balanceDueAtPickupMad: breakdown.balanceDueAtPickupMad,
        status: initialStatus,
        withChauffeur: Boolean(params.withChauffeur),
        airportDelivery: Boolean(params.airportDelivery),
        flightNumber: params.flightNumber,
        promoCode: params.promoCode,
        extras: breakdown.selectedExtras,
        holdId: matchingHold?.id,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      this.db.bookings.unshift(booking);

      this.logAudit(
        params.profileId || 'guest',
        params.profileId ? 'customer' : 'guest',
        'BOOKING_CREATED',
        'booking',
        booking.id,
        `Création réservation ${booking.reference} (${booking.vehicleTitle}) — Total ${booking.totalPayableMad} MAD`
      );

      this.logNotification(
        booking.customer.email,
        booking.customer.whatsapp,
        'email',
        'booking_received',
        `Réservation ${booking.reference} enregistrée — KENITRA PRESTIGE RENT CAR`,
        `Bonjour ${booking.customer.fullName}, votre demande de réservation ${booking.reference} pour ${booking.vehicleTitle} a bien été enregistrée.`,
        booking.reference
      );

      let paymentSession: PaymentRecord | undefined;
      if (params.paymentPlan !== 'pay_on_arrival' && booking.amountDueOnlineMad > 0) {
        paymentSession = this.createPaymentSessionInternal({
          bookingId: booking.id,
          referenceCode: booking.reference,
          amountMad: booking.amountDueOnlineMad,
          refundableDepositHoldMad: booking.refundableDepositMad,
          paymentType: params.paymentPlan === 'full_100' ? 'rental_full' : 'rental_deposit',
        });
      }

      return { booking, paymentSession };
    });
  }

  private createPaymentSessionInternal(params: {
    bookingId?: string;
    airportTransferId?: string;
    referenceCode: string;
    amountMad: number;
    refundableDepositHoldMad: number;
    paymentType: PaymentRecord['paymentType'];
    provider?: PaymentRecord['provider'];
  }): PaymentRecord {
    const sessionId = `SES-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const idempotencyKey = `IDEM-${params.referenceCode}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const payment: PaymentRecord = {
      id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      bookingId: params.bookingId,
      airportTransferId: params.airportTransferId,
      referenceCode: params.referenceCode,
      provider: params.provider ?? 'cmi_morocco_sandbox',
      sessionId,
      idempotencyKey,
      paymentType: params.paymentType,
      amountMad: params.amountMad,
      refundableDepositHoldMad: params.refundableDepositHoldMad,
      currency: 'MAD',
      status: 'pending',
      webhookVerified: false,
      createdAt: new Date().toISOString(),
    };

    this.db.payments.unshift(payment);
    return payment;
  }

  public createPaymentSessionForBooking(bookingId: string): {
    payment: PaymentRecord;
    signedWebhookTokens: {
      successSignature: string;
      failedSignature: string;
      cancelledSignature: string;
    };
  } {
    const booking = this.db.bookings.find((b) => b.id === bookingId);
    if (!booking) {
      throw new Error('Réservation introuvable.');
    }

    let payment = this.db.payments.find((p) => p.bookingId === bookingId && p.status === 'pending');
    if (!payment) {
      payment = this.createPaymentSessionInternal({
        bookingId: booking.id,
        referenceCode: booking.reference,
        amountMad: booking.amountDueOnlineMad || booking.totalPayableMad,
        refundableDepositHoldMad: booking.refundableDepositMad,
        paymentType: booking.paymentPlan === 'full_100' ? 'rental_full' : 'rental_deposit',
      });
    }

    return {
      payment,
      signedWebhookTokens: {
        successSignature: signWebhookPayload(payment.sessionId, payment.idempotencyKey, 'success'),
        failedSignature: signWebhookPayload(payment.sessionId, payment.idempotencyKey, 'failed'),
        cancelledSignature: signWebhookPayload(payment.sessionId, payment.idempotencyKey, 'cancelled'),
      },
    };
  }

  public processPaymentWebhook(params: {
    sessionId: string;
    idempotencyKey: string;
    outcome: 'success' | 'failed' | 'cancelled';
    signature: string;
  }): {
    payment: PaymentRecord;
    booking?: Booking;
    airportTransfer?: AirportTransferBooking;
    alreadyProcessed: boolean;
  } {
    const payment = this.db.payments.find((p) => p.sessionId === params.sessionId);
    if (!payment) {
      throw new Error('Session de paiement introuvable.');
    }

    // Verify cryptographic HMAC webhook signature (Never mark paid from unverified frontend callback!)
    const expectedSig = signWebhookPayload(payment.sessionId, payment.idempotencyKey, params.outcome);
    if (params.signature !== expectedSig) {
      throw new Error('Signature de webhook invalide. Opération rejetée.');
    }

    // Idempotency protection
    if (payment.webhookVerified && payment.status === 'paid') {
      const booking = payment.bookingId ? this.db.bookings.find((b) => b.id === payment.bookingId) : undefined;
      const airportTransfer = payment.airportTransferId
        ? this.db.airportTransfers.find((t) => t.id === payment.airportTransferId)
        : undefined;
      return { payment, booking, airportTransfer, alreadyProcessed: true };
    }

    payment.webhookVerified = true;
    payment.webhookSignature = params.signature;

    const booking = payment.bookingId ? this.db.bookings.find((b) => b.id === payment.bookingId) : undefined;
    const airportTransfer = payment.airportTransferId
      ? this.db.airportTransfers.find((t) => t.id === payment.airportTransferId)
      : undefined;

    if (params.outcome === 'success') {
      payment.status = 'paid';
      payment.paidAt = new Date().toISOString();
      payment.receiptNumber = `REC-KPRC-${Date.now().toString().slice(-6)}`;

      if (booking) {
        booking.amountPaidMad = payment.amountMad;
        booking.balanceDueAtPickupMad = Math.max(0, booking.totalPayableMad - booking.amountPaidMad);
        booking.status = 'confirmed';
        booking.updatedAt = new Date().toISOString();

        this.logNotification(
          booking.customer.email,
          booking.customer.whatsapp,
          'email',
          'payment_confirmed',
          `Reçu de paiement ${payment.receiptNumber} — Réservation ${booking.reference}`,
          `Paiement de ${payment.amountMad} MAD validé. Votre véhicule ${booking.vehicleTitle} est confirmé.`,
          booking.reference
        );
      }

      if (airportTransfer) {
        airportTransfer.paymentStatus = 'paid';
        if (airportTransfer.status === 'pending') {
          airportTransfer.status = 'confirmed';
        }
      }

      this.logAudit(
        'system',
        'system',
        'PAYMENT_WEBHOOK_CONFIRMED',
        'payment',
        payment.id,
        `Paiement ${payment.receiptNumber} confirmé (${payment.amountMad} MAD) pour ${payment.referenceCode}`
      );
    } else if (params.outcome === 'failed') {
      payment.status = 'failed';
      if (booking && booking.status === 'pending_payment') {
        booking.updatedAt = new Date().toISOString();
      }
      this.logAudit(
        'system',
        'system',
        'PAYMENT_WEBHOOK_FAILED',
        'payment',
        payment.id,
        `Échec de paiement signalé par la passerelle pour ${payment.referenceCode}`
      );
    } else {
      payment.status = 'cancelled';
      this.logAudit(
        'system',
        'system',
        'PAYMENT_WEBHOOK_CANCELLED',
        'payment',
        payment.id,
        `Session de paiement annulée par l'utilisateur pour ${payment.referenceCode}`
      );
    }

    return { payment, booking, airportTransfer, alreadyProcessed: false };
  }

  public issueRefund(params: {
    paymentId: string;
    amountMad: number;
    reason: string;
    actorProfileId: string;
  }): RefundRecord {
    const actor = this.db.profiles.find((p) => p.id === params.actorProfileId);
    if (!actor || !['super_admin', 'agency_manager'].includes(actor.role)) {
      throw new Error('Accès refusé : seuls les administrateurs peuvent émettre un remboursement.');
    }

    const payment = this.db.payments.find((p) => p.id === params.paymentId);
    if (!payment || payment.status !== 'paid') {
      throw new Error('Seul un paiement confirmé peut être remboursé.');
    }
    if (params.amountMad <= 0 || params.amountMad > payment.amountMad) {
      throw new Error('Montant de remboursement invalide.');
    }

    payment.status = 'refunded';
    const refund: RefundRecord = {
      id: `ref-${Date.now()}`,
      paymentId: payment.id,
      bookingId: payment.bookingId,
      amountMad: params.amountMad,
      reason: params.reason,
      status: 'processed',
      processedBy: actor.fullName,
      createdAt: new Date().toISOString(),
    };

    this.db.refunds.unshift(refund);

    if (payment.bookingId) {
      const booking = this.db.bookings.find((b) => b.id === payment.bookingId);
      if (booking) {
        booking.amountPaidMad = Math.max(0, booking.amountPaidMad - params.amountMad);
        if (booking.amountPaidMad === 0) {
          booking.status = 'cancelled';
        }
        booking.updatedAt = new Date().toISOString();
      }
    }

    this.logAudit(
      actor.id,
      actor.role,
      'REFUND_PROCESSED',
      'refund',
      refund.id,
      `Remboursement de ${params.amountMad} MAD sur paiement ${payment.receiptNumber || payment.sessionId} (${params.reason})`
    );

    return refund;
  }

  // ===========================================================================
  // AIRPORT PICKUP & PRIVATE CHAUFFEUR PRICING & DISPATCH ENGINE
  // ===========================================================================
  public calculateAirportTransferPrice(params: {
    serviceType: AirportServiceType;
    airportCode: AirportCode;
    vehicleCategory: VehicleCategoryCode;
    passengers: number;
    isRoundTrip: boolean;
    flightArrivalAt: string;
    meetAndGreet: boolean;
    childSeats: number;
    waitingMinutes: number;
    durationHours?: number;
  }): AirportTransferBooking['priceBreakdown'] {
    const routeRate =
      this.db.companySettings.airportRates.find((r) => r.airportCode === params.airportCode) ||
      this.db.companySettings.airportRates[0];

    let baseFareMad = routeRate.baseTransferMad;
    if (params.serviceType === 'airport_vehicle_delivery') {
      baseFareMad = routeRate.deliveryOnlyMad;
    } else if (params.serviceType === 'airport_meet_and_greet') {
      baseFareMad = routeRate.deliveryOnlyMad + routeRate.meetAndGreetMad;
    } else if (params.serviceType === 'chauffeur_driven_booking') {
      const hours = Math.max(4, params.durationHours ?? 4);
      baseFareMad = Math.round((this.db.companySettings.chauffeurDailyRateMad / 8) * hours) + 250;
    }

    const categoryAddons: Record<VehicleCategoryCode, number> = {
      Economy: 0,
      Compact: 80,
      Sedan: 180,
      SUV: 300,
      Family: 380,
      Premium: 480,
      Luxury: 650,
    };

    const vehicleMultiplierMad =
      params.serviceType === 'airport_vehicle_delivery' ? 0 : categoryAddons[params.vehicleCategory] ?? 150;

    // Group passenger supplement over 4 passengers
    const extraPaxMad = params.passengers > 4 ? (params.passengers - 4) * 60 : 0;

    const singleLegMad = baseFareMad + vehicleMultiplierMad + extraPaxMad;
    const roundTripMad = params.isRoundTrip ? Math.round(singleLegMad * 0.9) : 0;

    // Check if arrival hour is between 22:00 and 06:00
    const arrivalDate = new Date(params.flightArrivalAt);
    const hour = Number.isNaN(arrivalDate.getTime()) ? 14 : arrivalDate.getUTCHours();
    const isNight = hour >= 22 || hour < 6;
    const nightSurchargeMad = isNight ? this.db.companySettings.nightSurchargeMad : 0;

    const meetAndGreetMad =
      params.meetAndGreet && params.serviceType !== 'airport_meet_and_greet' ? routeRate.meetAndGreetMad : 0;

    const waitingFeeMad =
      params.waitingMinutes > 60
        ? Math.ceil((params.waitingMinutes - 60) / 60) * this.db.companySettings.waitingHourRateMad
        : 0;

    const childSeatMad = params.childSeats * 60;

    const totalMad =
      singleLegMad + roundTripMad + nightSurchargeMad + meetAndGreetMad + waitingFeeMad + childSeatMad;

    return {
      baseFareMad: singleLegMad,
      vehicleMultiplierMad,
      roundTripMad,
      nightSurchargeMad,
      meetAndGreetMad,
      waitingFeeMad,
      childSeatMad,
      totalMad,
    };
  }

  public createAirportTransfer(params: {
    serviceType: AirportServiceType;
    airportCode: AirportCode;
    flightNumber: string;
    airline: string;
    flightArrivalAt: string;
    passengers: number;
    luggageCount: number;
    destinationAddress: string;
    vehicleCategory: VehicleCategoryCode;
    durationHours?: number;
    isRoundTrip: boolean;
    meetAndGreet: boolean;
    childSeats: number;
    waitingMinutes: number;
    customerName: string;
    customerEmail: string;
    customerWhatsapp: string;
    specialInstructions?: string;
    payOnline?: boolean;
    profileId?: string;
  }): { transfer: AirportTransferBooking; paymentSession?: PaymentRecord; successSignature?: string } {
    if (!params.flightNumber.trim() || !params.destinationAddress.trim() || !params.customerName.trim()) {
      throw new Error('Veuillez renseigner le numéro de vol, la destination et vos coordonnées.');
    }

    const priceBreakdown = this.calculateAirportTransferPrice(params);
    const reference = `TR-KPRC-${Math.floor(1000 + Math.random() * 9000)}`;
    const accessToken = `TOK-TRF-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Auto-assign an available chauffeur if possible
    const availableChauffeur = this.db.chauffeurs.find((c) => c.availabilityStatus === 'available') || this.db.chauffeurs[0];

    const transfer: AirportTransferBooking = {
      id: `trf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      reference,
      accessToken,
      profileId: params.profileId,
      serviceType: params.serviceType,
      airportCode: params.airportCode,
      flightNumber: params.flightNumber.toUpperCase(),
      airline: params.airline || 'Compagnie Internationale',
      flightArrivalAt: params.flightArrivalAt,
      flightStatus: 'scheduled',
      passengers: params.passengers,
      luggageCount: params.luggageCount,
      destinationAddress: params.destinationAddress,
      vehicleCategory: params.vehicleCategory,
      durationHours: params.durationHours,
      isRoundTrip: params.isRoundTrip,
      meetAndGreet: params.meetAndGreet,
      childSeats: params.childSeats,
      waitingMinutes: params.waitingMinutes,
      nightSurchargeApplied: priceBreakdown.nightSurchargeMad > 0,
      priceBreakdown,
      totalPriceMad: priceBreakdown.totalMad,
      paymentStatus: params.payOnline ? 'pending' : 'pay_on_arrival',
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerWhatsapp: params.customerWhatsapp,
      specialInstructions: params.specialInstructions,
      assignedChauffeurId: availableChauffeur?.id,
      assignedChauffeurName: availableChauffeur?.fullName,
      assignedChauffeurPhone: availableChauffeur?.phone,
      status: availableChauffeur ? 'chauffeur_assigned' : 'confirmed',
      createdAt: new Date().toISOString(),
    };

    this.db.airportTransfers.unshift(transfer);

    if (availableChauffeur) {
      const mission: ChauffeurMission = {
        id: `msn-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        chauffeurId: availableChauffeur.id,
        chauffeurName: availableChauffeur.fullName,
        airportTransferId: transfer.id,
        reference: transfer.reference,
        serviceLabel: `${transfer.serviceType} (${transfer.vehicleCategory})`,
        customerName: transfer.customerName,
        customerWhatsapp: transfer.customerWhatsapp,
        pickupLocation: `Aéroport / Gare ${transfer.airportCode} (${transfer.flightNumber})`,
        dropoffLocation: transfer.destinationAddress,
        scheduledAt: transfer.flightArrivalAt,
        flightNumber: transfer.flightNumber,
        airline: transfer.airline,
        flightStatus: 'scheduled',
        status: 'assigned',
        operationalNotes: transfer.specialInstructions || 'Accueil avec pancarte nominative VIP.',
        createdAt: new Date().toISOString(),
      };
      this.db.chauffeurMissions.unshift(mission);
    }

    this.logAudit(
      params.profileId || 'guest',
      params.profileId ? 'customer' : 'guest',
      'AIRPORT_TRANSFER_BOOKED',
      'airport_transfer',
      transfer.id,
      `Réservation transfert ${transfer.reference} (${transfer.airportCode} → ${transfer.destinationAddress}) — ${transfer.totalPriceMad} MAD`
    );

    this.logNotification(
      transfer.customerEmail,
      transfer.customerWhatsapp,
      'email',
      'airport_transfer_confirmed',
      `Confirmation Transfert Aéroport ${transfer.reference}`,
      `Votre service chauffeur / aéroport ${transfer.reference} sur le vol ${transfer.flightNumber} est enregistré.`,
      transfer.reference
    );

    if (params.payOnline) {
      const paymentSession = this.createPaymentSessionInternal({
        airportTransferId: transfer.id,
        referenceCode: transfer.reference,
        amountMad: transfer.totalPriceMad,
        refundableDepositHoldMad: 0,
        paymentType: 'airport_transfer',
      });
      const successSignature = signWebhookPayload(
        paymentSession.sessionId,
        paymentSession.idempotencyKey,
        'success'
      );
      return { transfer, paymentSession, successSignature };
    }

    return { transfer };
  }

  // ===========================================================================
  // ROLE-BASED ACCESS CONTROL (RBAC) — CHAUFFEUR & CUSTOMER ISOLATION
  // ===========================================================================
  public getMissionsForActor(actorProfileId: string): ChauffeurMission[] {
    const profile = this.db.profiles.find((p) => p.id === actorProfileId);
    if (!profile) {
      throw new Error('Authentification requise.');
    }

    if (['super_admin', 'agency_manager', 'booking_agent'].includes(profile.role)) {
      return this.db.chauffeurMissions;
    }

    if (profile.role === 'chauffeur') {
      const chauffeur = this.db.chauffeurs.find(
        (c) => c.profileId === profile.id || c.id === profile.chauffeurId
      );
      if (!chauffeur) return [];
      // Strictly filter to ONLY missions assigned to this chauffeur (Acceptance Test #8)
      return this.db.chauffeurMissions.filter((m) => m.chauffeurId === chauffeur.id);
    }

    throw new Error('Accès refusé : espace réservé aux chauffeurs et administrateurs.');
  }

  public updateChauffeurMissionStatus(params: {
    actorProfileId: string;
    missionId: string;
    status?: ChauffeurMission['status'];
    flightStatus?: ChauffeurMission['flightStatus'];
    operationalNotes?: string;
  }): ChauffeurMission {
    const profile = this.db.profiles.find((p) => p.id === params.actorProfileId);
    if (!profile) {
      throw new Error('Non authentifié.');
    }

    const mission = this.db.chauffeurMissions.find((m) => m.id === params.missionId);
    if (!mission) {
      throw new Error('Mission introuvable.');
    }

    if (profile.role === 'chauffeur') {
      const chauffeur = this.db.chauffeurs.find(
        (c) => c.profileId === profile.id || c.id === profile.chauffeurId
      );
      if (!chauffeur || mission.chauffeurId !== chauffeur.id) {
        throw new Error('Accès interdit : vous ne pouvez modifier que vos propres missions assignées.');
      }
    } else if (!['super_admin', 'agency_manager', 'booking_agent'].includes(profile.role)) {
      throw new Error('Accès refusé.');
    }

    if (params.status) {
      mission.status = params.status;
      if (params.status === 'completed') {
        mission.completedAt = new Date().toISOString();
      }
    }
    if (params.flightStatus) {
      mission.flightStatus = params.flightStatus;
    }
    if (params.operationalNotes !== undefined) {
      mission.operationalNotes = params.operationalNotes;
    }

    // Sync transfer status
    if (mission.airportTransferId) {
      const transfer = this.db.airportTransfers.find((t) => t.id === mission.airportTransferId);
      if (transfer) {
        if (params.flightStatus) transfer.flightStatus = params.flightStatus;
        if (params.status === 'en_route') transfer.status = 'en_route';
        else if (params.status === 'arrived_pickup') transfer.status = 'waiting_terminal';
        else if (params.status === 'in_progress') transfer.status = 'client_on_board';
        else if (params.status === 'completed') transfer.status = 'completed';
      }
    }

    this.logAudit(
      profile.id,
      profile.role,
      'MISSION_UPDATED',
      'chauffeur_mission',
      mission.id,
      `Mise à jour mission ${mission.reference} → statut: ${mission.status}, vol: ${mission.flightStatus}`
    );

    return mission;
  }

  public getCustomerPortalData(params: {
    actorProfileId?: string;
    guestReference?: string;
    guestEmailOrToken?: string;
  }): {
    bookings: Booking[];
    transfers: AirportTransferBooking[];
    payments: PaymentRecord[];
  } {
    // 1. Guest lookup with reference + email/token verification
    if (params.guestReference && params.guestEmailOrToken) {
      const refClean = params.guestReference.trim().toUpperCase();
      const credentialClean = params.guestEmailOrToken.trim().toLowerCase();

      const matchingBookings = this.db.bookings.filter(
        (b) =>
          b.reference.toUpperCase() === refClean &&
          (b.customer.email.toLowerCase() === credentialClean ||
            b.accessToken.toLowerCase() === credentialClean)
      );

      const matchingTransfers = this.db.airportTransfers.filter(
        (t) =>
          t.reference.toUpperCase() === refClean &&
          (t.customerEmail.toLowerCase() === credentialClean ||
            t.accessToken.toLowerCase() === credentialClean)
      );

      if (matchingBookings.length === 0 && matchingTransfers.length === 0) {
        throw new Error('Aucune réservation trouvée avec cette référence et cet email / code d’accès.');
      }

      const bookingIds = new Set(matchingBookings.map((b) => b.id));
      const transferIds = new Set(matchingTransfers.map((t) => t.id));
      const payments = this.db.payments.filter(
        (p) => (p.bookingId && bookingIds.has(p.bookingId)) || (p.airportTransferId && transferIds.has(p.airportTransferId))
      );

      return { bookings: matchingBookings, transfers: matchingTransfers, payments };
    }

    // 2. Authenticated customer lookup — strictly isolated to their own profile/email (Acceptance Test #9)
    if (!params.actorProfileId) {
      throw new Error('Authentification ou référence de réservation requise.');
    }

    const profile = this.db.profiles.find((p) => p.id === params.actorProfileId);
    if (!profile) {
      throw new Error('Profil utilisateur introuvable.');
    }

    const bookings = this.db.bookings.filter(
      (b) =>
        b.profileId === profile.id ||
        b.customer.email.toLowerCase() === profile.email.toLowerCase()
    );
    const transfers = this.db.airportTransfers.filter(
      (t) =>
        t.profileId === profile.id ||
        t.customerEmail.toLowerCase() === profile.email.toLowerCase()
    );

    const bookingIds = new Set(bookings.map((b) => b.id));
    const transferIds = new Set(transfers.map((t) => t.id));
    const payments = this.db.payments.filter(
      (p) => (p.bookingId && bookingIds.has(p.bookingId)) || (p.airportTransferId && transferIds.has(p.airportTransferId))
    );

    return { bookings, transfers, payments };
  }

  public getBookingByIdForActor(bookingId: string, actorProfileId?: string, accessToken?: string): Booking {
    const booking = this.db.bookings.find((b) => b.id === bookingId || b.reference === bookingId);
    if (!booking) {
      throw new Error('Réservation introuvable.');
    }

    if (accessToken && booking.accessToken === accessToken) {
      return booking;
    }

    if (!actorProfileId) {
      throw new Error('Accès non autorisé à cette réservation.');
    }

    const profile = this.db.profiles.find((p) => p.id === actorProfileId);
    if (!profile) {
      throw new Error('Profil invalide.');
    }

    if (['super_admin', 'agency_manager', 'booking_agent'].includes(profile.role)) {
      return booking;
    }

    if (
      booking.profileId === profile.id ||
      booking.customer.email.toLowerCase() === profile.email.toLowerCase()
    ) {
      return booking;
    }

    throw new Error('Accès interdit : vous ne pouvez pas consulter la réservation d’un autre client.');
  }

  // ===========================================================================
  // ADMIN OPERATIONS (FLEET, BOOKINGS, CHAUFFEUR DISPATCH, CONTRACTS, CMS)
  // ===========================================================================
  private assertStaffRole(actorProfileId: string): UserProfile {
    const profile = this.db.profiles.find((p) => p.id === actorProfileId);
    if (!profile || !['super_admin', 'agency_manager', 'booking_agent'].includes(profile.role)) {
      throw new Error('Accès réservé au personnel administratif autorisé.');
    }
    return profile;
  }

  public upsertVehicle(actorProfileId: string, vehicleInput: Partial<Vehicle> & { brand: string; model: string }): Vehicle {
    const actor = this.assertStaffRole(actorProfileId);

    if (vehicleInput.id) {
      const existing = this.db.vehicles.find((v) => v.id === vehicleInput.id);
      if (!existing) throw new Error('Véhicule introuvable.');
      Object.assign(existing, vehicleInput);
      this.logAudit(
        actor.id,
        actor.role,
        'VEHICLE_UPDATED',
        'vehicle',
        existing.id,
        `Mise à jour véhicule ${existing.brand} ${existing.model} (${existing.dailyPriceMad} MAD/j)`
      );
      return existing;
    }

    const slug = `${vehicleInput.brand}-${vehicleInput.model}-${vehicleInput.year || 2025}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');

    const newVehicle: Vehicle = {
      id: `veh-${Date.now()}`,
      slug,
      brand: vehicleInput.brand,
      model: vehicleInput.model,
      year: vehicleInput.year || 2025,
      category: vehicleInput.category || 'Sedan',
      dailyPriceMad: Number(vehicleInput.dailyPriceMad) || 500,
      weeklyDiscountPct: Number(vehicleInput.weeklyDiscountPct) ?? 12,
      monthlyDiscountPct: Number(vehicleInput.monthlyDiscountPct) ?? 25,
      highSeasonMultiplier: 1.2,
      depositMad: Number(vehicleInput.depositMad) || 5000,
      transmission: vehicleInput.transmission || 'Automatic',
      fuelType: vehicleInput.fuelType || 'Diesel',
      seats: Number(vehicleInput.seats) || 5,
      luggage: Number(vehicleInput.luggage) || 3,
      airConditioning: vehicleInput.airConditioning ?? true,
      mileagePolicy: vehicleInput.mileagePolicy || 'Illimité',
      insuranceCoverage: vehicleInput.insuranceCoverage || 'Tous Risques avec Franchise Réduite (CDW + TP)',
      insuranceExpiryDate: vehicleInput.insuranceExpiryDate || '2027-12-31',
      minDriverAge: Number(vehicleInput.minDriverAge) || 21,
      status: vehicleInput.status || 'available',
      isDemoData: Boolean(vehicleInput.isDemoData ?? false),
      featured: Boolean(vehicleInput.featured ?? true),
      airportDeliveryAvailable: vehicleInput.airportDeliveryAvailable ?? true,
      chauffeurAvailable: vehicleInput.chauffeurAvailable ?? true,
      features: vehicleInput.features || ['Climatisation automatique', 'CarPlay / Android Auto', 'Caméra de recul'],
      rentalConditions: vehicleInput.rentalConditions || ['Permis valide 2 ans minimum'],
      images: vehicleInput.images?.length
        ? vehicleInput.images
        : [
            {
              id: `img-${Date.now()}`,
              url: '/vehicles/mercedes-classe-c-220d-amg-2025.svg',
              caption: `${vehicleInput.brand} ${vehicleInput.model}`,
              isPrimary: true,
              isPlaceholder: true,
            },
          ],
      seasonalRates: vehicleInput.seasonalRates || [],
    };

    this.db.vehicles.unshift(newVehicle);
    this.logAudit(
      actor.id,
      actor.role,
      'VEHICLE_ADDED',
      'vehicle',
      newVehicle.id,
      `Ajout véhicule ${newVehicle.brand} ${newVehicle.model} au catalogue`
    );
    return newVehicle;
  }

  public addAvailabilityBlock(
    actorProfileId: string,
    block: Omit<AvailabilityBlock, 'id'>
  ): AvailabilityBlock {
    const actor = this.assertStaffRole(actorProfileId);
    const newBlock: AvailabilityBlock = {
      ...block,
      id: `blk-${Date.now()}`,
    };
    this.db.availabilityBlocks.push(newBlock);
    this.logAudit(
      actor.id,
      actor.role,
      'AVAILABILITY_BLOCKED',
      'availability_block',
      newBlock.id,
      `Blocage calendrier sur véhicule ${block.vehicleId} (${block.reason}: ${block.startAt.slice(0, 10)} → ${block.endAt.slice(0, 10)})`
    );
    return newBlock;
  }

  public updateBookingStatusOrDetails(params: {
    actorProfileId: string;
    bookingId: string;
    status?: BookingStatus;
    returnAt?: string;
    contractSignatureName?: string;
    departureInspection?: VehicleInspectionRecord;
    returnInspection?: VehicleInspectionRecord;
  }): Booking {
    const booking = this.db.bookings.find((b) => b.id === params.bookingId);
    if (!booking) throw new Error('Réservation introuvable.');

    const profile = this.db.profiles.find((p) => p.id === params.actorProfileId);
    const isStaff = profile && ['super_admin', 'agency_manager', 'booking_agent'].includes(profile.role);
    const isOwner =
      profile &&
      (booking.profileId === profile.id || booking.customer.email.toLowerCase() === profile.email.toLowerCase());

    if (!isStaff && !isOwner) {
      throw new Error('Action non autorisée sur cette réservation.');
    }

    if (params.status) {
      booking.status = params.status;
    }

    if (params.returnAt && params.returnAt !== booking.returnAt) {
      const check = this.isVehicleAvailable(booking.vehicleId, booking.pickupAt, params.returnAt, {
        ignoreBookingId: booking.id,
      });
      if (!check.available) {
        throw new Error(check.reason || 'Impossible de prolonger : le véhicule est réservé sur les nouvelles dates.');
      }
      booking.returnAt = params.returnAt;
    }

    if (params.contractSignatureName) {
      booking.contractSignatureName = params.contractSignatureName;
      booking.contractSignedAt = new Date().toISOString();
    }

    if (params.departureInspection) {
      booking.departureInspection = params.departureInspection;
    }

    if (params.returnInspection) {
      booking.returnInspection = params.returnInspection;
    }

    booking.updatedAt = new Date().toISOString();

    this.logAudit(
      profile?.id || 'customer',
      profile?.role || 'customer',
      'BOOKING_UPDATED',
      'booking',
      booking.id,
      `Mise à jour réservation ${booking.reference} → statut: ${booking.status}`
    );

    return booking;
  }

  public assignChauffeurToTransfer(params: {
    actorProfileId: string;
    transferId: string;
    chauffeurId: string;
  }): AirportTransferBooking {
    const actor = this.assertStaffRole(params.actorProfileId);
    const transfer = this.db.airportTransfers.find((t) => t.id === params.transferId);
    if (!transfer) throw new Error('Transfert aéroport introuvable.');

    const chauffeur = this.db.chauffeurs.find((c) => c.id === params.chauffeurId);
    if (!chauffeur) throw new Error('Chauffeur introuvable.');

    transfer.assignedChauffeurId = chauffeur.id;
    transfer.assignedChauffeurName = chauffeur.fullName;
    transfer.assignedChauffeurPhone = chauffeur.phone;
    transfer.status = 'chauffeur_assigned';

    let mission = this.db.chauffeurMissions.find((m) => m.airportTransferId === transfer.id);
    if (mission) {
      mission.chauffeurId = chauffeur.id;
      mission.chauffeurName = chauffeur.fullName;
    } else {
      mission = {
        id: `msn-${Date.now()}`,
        chauffeurId: chauffeur.id,
        chauffeurName: chauffeur.fullName,
        airportTransferId: transfer.id,
        reference: transfer.reference,
        serviceLabel: `${transfer.serviceType} (${transfer.vehicleCategory})`,
        customerName: transfer.customerName,
        customerWhatsapp: transfer.customerWhatsapp,
        pickupLocation: `Aéroport / Gare ${transfer.airportCode} (${transfer.flightNumber})`,
        dropoffLocation: transfer.destinationAddress,
        scheduledAt: transfer.flightArrivalAt,
        flightNumber: transfer.flightNumber,
        airline: transfer.airline,
        flightStatus: transfer.flightStatus,
        status: 'assigned',
        operationalNotes: transfer.specialInstructions || 'Mission assignée par le dispatch.',
        createdAt: new Date().toISOString(),
      };
      this.db.chauffeurMissions.unshift(mission);
    }

    this.logAudit(
      actor.id,
      actor.role,
      'CHAUFFEUR_ASSIGNED',
      'airport_transfer',
      transfer.id,
      `Chauffeur ${chauffeur.fullName} assigné au transfert ${transfer.reference}`
    );

    return transfer;
  }

  public updateCompanySettings(
    actorProfileId: string,
    updates: Partial<CompanySettings>
  ): CompanySettings {
    const actor = this.assertStaffRole(actorProfileId);
    this.db.companySettings = {
      ...this.db.companySettings,
      ...updates,
    };
    this.logAudit(
      actor.id,
      actor.role,
      'COMPANY_SETTINGS_UPDATED',
      'company_settings',
      '1',
      `Mise à jour identité & paramètres commerciaux (${this.db.companySettings.brandName})`
    );
    return this.db.companySettings;
  }

  public createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'status' | 'createdAt'>): SupportTicket {
    const record: SupportTicket = {
      ...ticket,
      id: `tkt-${Date.now()}`,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    this.db.supportTickets.unshift(record);
    return record;
  }
}

export const platformEngine = new RentalPlatformEngine();
