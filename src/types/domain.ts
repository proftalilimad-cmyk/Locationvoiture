export type Language = 'fr' | 'ar' | 'en';

export type UserRole =
  | 'super_admin'
  | 'agency_manager'
  | 'booking_agent'
  | 'chauffeur'
  | 'customer';

export type VehicleCategoryCode =
  | 'Economy'
  | 'Compact'
  | 'Sedan'
  | 'SUV'
  | 'Family'
  | 'Premium'
  | 'Luxury';

export type BookingStatus =
  | 'pending_payment'
  | 'awaiting_confirmation'
  | 'confirmed'
  | 'ready_for_pickup'
  | 'active_rental'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type PaymentPlan =
  | 'deposit_20'
  | 'deposit_30'
  | 'deposit_50'
  | 'full_100'
  | 'pay_on_arrival';

export type AirportServiceType =
  | 'airport_vehicle_delivery'
  | 'airport_meet_and_greet'
  | 'private_airport_transfer'
  | 'chauffeur_driven_booking';

export type AirportCode = 'RBA' | 'CMN' | 'TNG' | 'KENITRA_TGV';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  whatsapp: string;
  role: UserRole;
  preferredLanguage: Language;
  chauffeurId?: string;
}

export interface LocationOption {
  code: string;
  nameFr: string;
  nameAr: string;
  nameEn: string;
  type: 'agency' | 'train_station' | 'airport' | 'custom';
  deliveryFeeMad: number;
  address: string;
}

export interface VehicleImage {
  id: string;
  url: string;
  caption: string;
  isPrimary: boolean;
  isPlaceholder?: boolean;
}

export interface SeasonalRate {
  id: string;
  seasonName: string;
  startDate: string;
  endDate: string;
  dailyRateMad: number;
}

export interface Vehicle {
  id: string;
  slug: string;
  brand: string;
  model: string;
  year: number;
  category: VehicleCategoryCode;
  dailyPriceMad: number;
  weeklyDiscountPct: number;
  monthlyDiscountPct: number;
  highSeasonMultiplier: number;
  depositMad: number;
  transmission: 'Automatic' | 'Manual';
  fuelType: 'Diesel' | 'Petrol' | 'Hybrid' | 'Electric';
  seats: number;
  luggage: number;
  airConditioning: boolean;
  mileagePolicy: string;
  insuranceCoverage: string;
  insuranceExpiryDate: string;
  minDriverAge: number;
  status: 'available' | 'rented' | 'maintenance' | 'archived';
  isDemoData: boolean;
  featured: boolean;
  airportDeliveryAvailable: boolean;
  chauffeurAvailable: boolean;
  features: string[];
  rentalConditions: string[];
  images: VehicleImage[];
  seasonalRates: SeasonalRate[];
}

export interface AvailabilityBlock {
  id: string;
  vehicleId: string;
  startAt: string;
  endAt: string;
  reason: 'maintenance' | 'offline_booking' | 'inspection';
  notes: string;
}

export interface BookingHold {
  id: string;
  vehicleId: string;
  sessionToken: string;
  pickupAt: string;
  returnAt: string;
  expiresAt: string;
  status: 'active' | 'converted' | 'expired' | 'released';
}

export interface ExtraCatalogItem {
  code: string;
  nameFr: string;
  nameAr: string;
  nameEn: string;
  descriptionFr: string;
  priceMad: number;
  perDay: boolean;
}

export interface SelectedExtra {
  extraCode: string;
  nameFr: string;
  quantity: number;
  unitPriceMad: number;
  perDay: boolean;
  totalPriceMad: number;
}

export interface CustomerInfo {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  whatsapp: string;
  countryOfResidence: string;
  driverAge: number;
  licenseNumber: string;
  licenseIssueDate: string;
}

export interface PriceBreakdown {
  rentalDays: number;
  effectiveDailyRateMad: number;
  tierApplied: 'daily' | 'weekly' | 'monthly' | 'seasonal';
  baseSubtotalMad: number;
  extrasSubtotalMad: number;
  deliveryFeeMad: number;
  chauffeurSupplementMad: number;
  discountMad: number;
  subtotalHtMad: number;
  taxAmountMad: number;
  totalPayableMad: number;
  refundableDepositMad: number;
  amountDueOnlineMad: number;
  balanceDueAtPickupMad: number;
  selectedExtras: SelectedExtra[];
}

export interface VehicleInspectionRecord {
  timestamp: string;
  inspectorName: string;
  mileageKm: number;
  fuelLevelPct: number;
  exteriorCondition: string;
  interiorCondition: string;
  damageNotes: string;
  photoUrls: string[];
  customerAcknowledged: boolean;
}

export interface Booking {
  id: string;
  reference: string;
  accessToken: string;
  customerId: string;
  profileId?: string;
  customer: CustomerInfo;
  vehicleId: string;
  vehicleTitle: string;
  vehicleCategory: VehicleCategoryCode;
  vehicleImage: string;
  pickupLocationCode: string;
  returnLocationCode: string;
  customDeliveryAddress?: string;
  pickupAt: string;
  returnAt: string;
  rentalDays: number;
  baseSubtotalMad: number;
  extrasSubtotalMad: number;
  deliveryFeeMad: number;
  chauffeurSupplementMad: number;
  discountMad: number;
  taxAmountMad: number;
  totalPayableMad: number;
  refundableDepositMad: number;
  paymentPlan: PaymentPlan;
  amountDueOnlineMad: number;
  amountPaidMad: number;
  balanceDueAtPickupMad: number;
  status: BookingStatus;
  withChauffeur: boolean;
  airportDelivery: boolean;
  flightNumber?: string;
  promoCode?: string;
  extras: SelectedExtra[];
  holdId?: string;
  contractSignedAt?: string;
  contractSignatureName?: string;
  departureInspection?: VehicleInspectionRecord;
  returnInspection?: VehicleInspectionRecord;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  bookingId?: string;
  airportTransferId?: string;
  referenceCode: string;
  provider: 'cmi_morocco_sandbox' | 'payzone_morocco_sandbox' | 'agency_pos';
  sessionId: string;
  idempotencyKey: string;
  paymentType:
    | 'rental_deposit'
    | 'rental_full'
    | 'balance_pickup'
    | 'security_deposit_hold'
    | 'airport_transfer';
  amountMad: number;
  refundableDepositHoldMad: number;
  currency: 'MAD';
  status: 'pending' | 'authorized' | 'paid' | 'failed' | 'cancelled' | 'refunded';
  webhookVerified: boolean;
  webhookSignature?: string;
  receiptNumber?: string;
  paidAt?: string;
  createdAt: string;
}

export interface RefundRecord {
  id: string;
  paymentId: string;
  bookingId?: string;
  amountMad: number;
  reason: string;
  status: 'pending' | 'processed' | 'failed';
  processedBy: string;
  createdAt: string;
}

export interface Chauffeur {
  id: string;
  profileId: string;
  fullName: string;
  phone: string;
  whatsapp: string;
  email: string;
  languages: string[];
  professionalPermitNo: string;
  availabilityStatus: 'available' | 'on_mission' | 'off_duty';
  ratingNote: string;
}

export interface AirportTransferBooking {
  id: string;
  reference: string;
  accessToken: string;
  profileId?: string;
  serviceType: AirportServiceType;
  airportCode: AirportCode;
  flightNumber: string;
  airline: string;
  flightArrivalAt: string;
  flightStatus: 'scheduled' | 'on_time' | 'delayed' | 'landed' | 'cancelled';
  passengers: number;
  luggageCount: number;
  destinationAddress: string;
  vehicleCategory: VehicleCategoryCode;
  durationHours?: number;
  isRoundTrip: boolean;
  meetAndGreet: boolean;
  childSeats: number;
  waitingMinutes: number;
  nightSurchargeApplied: boolean;
  priceBreakdown: {
    baseFareMad: number;
    vehicleMultiplierMad: number;
    roundTripMad: number;
    nightSurchargeMad: number;
    meetAndGreetMad: number;
    waitingFeeMad: number;
    childSeatMad: number;
    totalMad: number;
  };
  totalPriceMad: number;
  paymentStatus: 'pending' | 'paid' | 'pay_on_arrival' | 'refunded';
  customerName: string;
  customerEmail: string;
  customerWhatsapp: string;
  specialInstructions?: string;
  assignedChauffeurId?: string;
  assignedChauffeurName?: string;
  assignedChauffeurPhone?: string;
  status:
    | 'pending'
    | 'confirmed'
    | 'chauffeur_assigned'
    | 'en_route'
    | 'waiting_terminal'
    | 'client_on_board'
    | 'completed'
    | 'cancelled';
  createdAt: string;
}

export interface ChauffeurMission {
  id: string;
  chauffeurId: string;
  chauffeurName: string;
  airportTransferId?: string;
  bookingId?: string;
  reference: string;
  serviceLabel: string;
  customerName: string;
  customerWhatsapp: string;
  pickupLocation: string;
  dropoffLocation: string;
  scheduledAt: string;
  flightNumber?: string;
  airline?: string;
  flightStatus: 'scheduled' | 'on_time' | 'delayed' | 'landed' | 'cancelled';
  status:
    | 'assigned'
    | 'en_route'
    | 'arrived_pickup'
    | 'in_progress'
    | 'completed'
    | 'cancelled';
  operationalNotes: string;
  completedAt?: string;
  createdAt: string;
}

export interface Promotion {
  id: string;
  code: string;
  descriptionFr: string;
  discountType: 'percentage' | 'fixed_mad';
  discountValue: number;
  minDays: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export interface NotificationLog {
  id: string;
  recipientEmail?: string;
  recipientWhatsapp?: string;
  channel: 'email' | 'whatsapp_link' | 'whatsapp_api_queued' | 'in_app';
  templateKey: string;
  subject: string;
  body: string;
  status: 'logged' | 'sent' | 'pending_api_config';
  relatedReference: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  customerEmail: string;
  customerName: string;
  bookingReference?: string;
  subject: string;
  message: string;
  status: 'open' | 'resolved';
  createdAt: string;
}

export interface AirportRouteRate {
  airportCode: AirportCode;
  airportNameFr: string;
  distanceToKenitraKm: number;
  estimatedMinutes: number;
  baseTransferMad: number;
  deliveryOnlyMad: number;
  meetAndGreetMad: number;
}

export interface CompanySettings {
  brandName: string;
  brandTaglineFr: string;
  brandTaglineAr: string;
  brandTaglineEn: string;
  logoText: string;
  primaryColorHex: string;
  accentColorHex: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  depositPercentages: number[];
  defaultDepositPct: number;
  allowPayOnArrival: boolean;
  vatRatePct: number;
  nightSurchargeMad: number;
  waitingHourRateMad: number;
  chauffeurDailyRateMad: number;
  paymentGatewayLive: boolean;
  paymentGatewayName: string;
  flightApiConnected: boolean;
  whatsappApiConnected: boolean;
  ga4MeasurementId: string;
  transportLicenseNotice: string;
  cancellationPolicyFr: string;
  generalRentalConditionsFr: string[];
  faqs: Array<{ questionFr: string; answerFr: string }>;
  airportRates: AirportRouteRate[];
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorRole: UserRole | 'system' | 'guest';
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  createdAt: string;
}
