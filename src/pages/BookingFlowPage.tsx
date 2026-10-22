import React, { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  Lock,
  Clock,
  CreditCard,
  AlertCircle,
  FileText,
  MessageCircle,
  Tag,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import {
  Booking,
  CustomerInfo,
  PaymentPlan,
  PaymentRecord,
  PriceBreakdown,
} from '../types/domain';
import { ContractModal } from '../components/ContractModal';

export const BookingFlowPage: React.FC = () => {
  const {
    db,
    searchCriteria,
    setSearchCriteria,
    selectedVehicleForBooking,
    setSelectedVehicleForBooking,
    activeHold,
    createHold,
    calculatePrice,
    createBooking,
    createPaymentSession,
    triggerPaymentWebhook,
    currentUser,
  } = usePlatform();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [vehicleId, setVehicleId] = useState<string>(
    selectedVehicleForBooking?.id || db.vehicles[2]?.id || db.vehicles[0]?.id
  );
  const [extraQuantities, setExtraQuantities] = useState<Record<string, number>>({});
  const [promoCode, setPromoCode] = useState<string>('');
  const [flightNumber, setFlightNumber] = useState<string>('');
  const [customDeliveryAddress, setCustomDeliveryAddress] = useState<string>('');
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlan>('deposit_30');

  const [customer, setCustomer] = useState<CustomerInfo>({
    fullName: currentUser?.fullName.split('—')[0].trim() || 'Amine Tazi',
    email: currentUser?.email || 'amine.tazi@client.ma',
    phone: currentUser?.phone || '+212 6 63 11 22 33',
    whatsapp: currentUser?.whatsapp || '+212663112233',
    countryOfResidence: 'Maroc',
    driverAge: searchCriteria.driverAge || 32,
    licenseNumber: 'MA-14-892310',
    licenseIssueDate: '2016-05-15',
  });

  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [paymentSessionData, setPaymentSessionData] = useState<{
    payment: PaymentRecord;
    signedWebhookTokens: {
      successSignature: string;
      failedSignature: string;
      cancelledSignature: string;
    };
  } | null>(null);
  const [paymentAlert, setPaymentAlert] = useState<{
    type: 'error' | 'warning' | 'success';
    text: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);
  const [contractModalOpen, setContractModalOpen] = useState<boolean>(false);

  const selectedVehicle = db.vehicles.find((v) => v.id === vehicleId) || db.vehicles[0];
  const pickupAt = `${searchCriteria.pickupDate}T${searchCriteria.pickupTime}:00.000Z`;
  const returnAt = `${searchCriteria.returnDate}T${searchCriteria.returnTime}:00.000Z`;

  const refreshPricing = useCallback(async () => {
    if (!selectedVehicle) return;
    try {
      const extraCodes = Object.entries(extraQuantities)
        .filter(([, q]) => q > 0)
        .map(([code, quantity]) => ({ code, quantity }));
      const breakdown = await calculatePrice({
        vehicleId: selectedVehicle.id,
        pickupAt,
        returnAt,
        pickupLocationCode: searchCriteria.pickupLocationCode,
        returnLocationCode: searchCriteria.returnLocationCode,
        extraCodes,
        withChauffeur: searchCriteria.withChauffeur,
        airportDelivery: searchCriteria.airportDelivery,
        promoCode,
        paymentPlan,
      });
      setPriceBreakdown(breakdown);
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  }, [
    selectedVehicle,
    pickupAt,
    returnAt,
    searchCriteria.pickupLocationCode,
    searchCriteria.returnLocationCode,
    searchCriteria.withChauffeur,
    searchCriteria.airportDelivery,
    extraQuantities,
    promoCode,
    paymentPlan,
    calculatePrice,
  ]);

  useEffect(() => {
    refreshPricing();
  }, [refreshPricing]);

  // Step 1 -> Step 2: Create concurrency-safe reservation hold
  const handleStep1Continue = async () => {
    setErrorMsg(null);
    setBusy(true);
    try {
      await createHold(selectedVehicle.id, pickupAt, returnAt);
      setSelectedVehicleForBooking(selectedVehicle);
      setStep(2);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Step 3 -> Step 4: Validate customer info
  const handleStep3Continue = () => {
    setErrorMsg(null);
    if (!customer.fullName.trim() || !customer.email.trim() || !customer.whatsapp.trim()) {
      setErrorMsg('Veuillez renseigner votre nom complet, email et numéro WhatsApp.');
      return;
    }
    if (!searchCriteria.withChauffeur && !customer.licenseNumber.trim()) {
      setErrorMsg('Le numéro de permis de conduire est obligatoire pour toute location sans chauffeur.');
      return;
    }
    if (!searchCriteria.withChauffeur && customer.driverAge < selectedVehicle.minDriverAge) {
      setErrorMsg(
        `L'âge minimum requis pour ${selectedVehicle.brand} ${selectedVehicle.model} est de ${selectedVehicle.minDriverAge} ans.`
      );
      return;
    }
    setStep(4);
  };

  // Step 4 -> Step 5: Create server-side booking & payment session
  const handleProceedToPayment = async () => {
    setErrorMsg(null);
    setPaymentAlert(null);
    setBusy(true);
    try {
      const extraCodes = Object.entries(extraQuantities)
        .filter(([, q]) => q > 0)
        .map(([code, quantity]) => ({ code, quantity }));

      const { booking } = await createBooking({
        vehicleId: selectedVehicle.id,
        pickupLocationCode: searchCriteria.pickupLocationCode,
        returnLocationCode: searchCriteria.returnLocationCode,
        customDeliveryAddress,
        pickupAt,
        returnAt,
        extraCodes,
        customer,
        paymentPlan,
        withChauffeur: searchCriteria.withChauffeur,
        airportDelivery: searchCriteria.airportDelivery,
        flightNumber: flightNumber || undefined,
        promoCode: promoCode || undefined,
      });

      setCreatedBooking(booking);

      if (paymentPlan === 'pay_on_arrival') {
        setStep(6);
      } else {
        const sessionInfo = await createPaymentSession(booking.id);
        setPaymentSessionData(sessionInfo);
        setStep(5);
      }
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Step 5: Simulate Gateway Outcome (Success / Failed / Cancelled) via verified server webhook
  const handleGatewayOutcome = async (outcome: 'success' | 'failed' | 'cancelled') => {
    if (!paymentSessionData || !createdBooking) return;
    setBusy(true);
    setPaymentAlert(null);
    try {
      const signature =
        outcome === 'success'
          ? paymentSessionData.signedWebhookTokens.successSignature
          : outcome === 'failed'
          ? paymentSessionData.signedWebhookTokens.failedSignature
          : paymentSessionData.signedWebhookTokens.cancelledSignature;

      const result = await triggerPaymentWebhook({
        sessionId: paymentSessionData.payment.sessionId,
        idempotencyKey: paymentSessionData.payment.idempotencyKey,
        outcome,
        signature,
      });

      if (result.booking) {
        setCreatedBooking(result.booking);
      }

      if (outcome === 'success') {
        setPaymentAlert({
          type: 'success',
          text: `Paiement vérifié par webhook HMAC (Reçu ${result.payment.receiptNumber}).`,
        });
        setStep(6);
      } else if (outcome === 'failed') {
        // Create a fresh recovery session so the customer can retry immediately
        const recoverySession = await createPaymentSession(createdBooking.id);
        setPaymentSessionData(recoverySession);
        setPaymentAlert({
          type: 'error',
          text: 'Transaction refusée par la banque émettrice. Une nouvelle session sécurisée a été générée pour vous permettre de réessayer.',
        });
      } else {
        const recoverySession = await createPaymentSession(createdBooking.id);
        setPaymentSessionData(recoverySession);
        setPaymentAlert({
          type: 'warning',
          text: 'Paiement annulé. Votre réservation reste maintenue temporairement : vous pouvez relancer le paiement ou choisir le règlement à la livraison.',
        });
      }
    } catch (err) {
      setPaymentAlert({ type: 'error', text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const stepsList = [
    { num: 1, label: '1. Véhicule & Dates' },
    { num: 2, label: '2. Options & Extras' },
    { num: 3, label: '3. Conducteur' },
    { num: 4, label: '4. Récapitulatif' },
    { num: 5, label: '5. Paiement Sécurisé' },
    { num: 6, label: '6. Confirmation' },
  ];

  const cleanWhatsapp = db.companySettings.whatsapp.replace(/[^0-9]/g, '');

  return (
    <div className="min-h-screen bg-obsidian pb-24 pt-8 text-ivory">
      <div className="mx-auto max-w-7xl px-4">
        {/* Progress Stepper */}
        <div className="mb-8 rounded-2xl border border-obsidian-border bg-obsidian-card p-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {stepsList.map((s) => (
              <div
                key={s.num}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${
                  step === s.num
                    ? 'bg-champagne text-obsidian shadow-gold-glow'
                    : step > s.num
                    ? 'border border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                    : 'bg-obsidian text-ivory-subtle'
                }`}
              >
                <span className="font-mono">{s.label}</span>
              </div>
            ))}
          </div>

          {activeHold && activeHold.status === 'active' && step < 6 && (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-champagne/30 bg-obsidian px-4 py-2 text-xs">
              <span className="flex items-center gap-2 text-champagne">
                <Clock className="h-4 w-4" />
                Verrouillage de disponibilité actif (Hold ID :{' '}
                <strong className="font-mono">{activeHold.id}</strong>) — Protection anti-double
                réservation activée.
              </span>
              <span className="font-mono text-[11px] text-ivory-muted">
                Expire à {activeHold.expiresAt.slice(11, 16)} UTC
              </span>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-xs text-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Column: Active Step Form */}
          <div className="lg:col-span-8">
            {/* STEP 1: CHOOSE VEHICLE & DATES */}
            {step === 1 && (
              <div className="rounded-2xl border border-obsidian-border bg-obsidian-card p-6 space-y-6">
                <h2 className="font-serif text-2xl font-bold text-ivory">
                  Étape 1 — Sélection du véhicule, des dates et du lieu
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-ivory-muted">
                      Modèle de véhicule souhaité :
                    </label>
                    <select
                      value={vehicleId}
                      onChange={(e) => setVehicleId(e.target.value)}
                      className="w-full rounded-xl border border-obsidian-border bg-obsidian px-4 py-3 text-sm text-ivory focus:border-champagne focus:outline-none"
                    >
                      {db.vehicles
                        .filter((v) => v.status !== 'archived')
                        .map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.brand} {v.model} ({v.year}) — {v.category} — {v.dailyPriceMad} MAD/jour
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ivory-muted">
                      Lieu de prise en charge :
                    </label>
                    <select
                      value={searchCriteria.pickupLocationCode}
                      onChange={(e) =>
                        setSearchCriteria((prev) => ({
                          ...prev,
                          pickupLocationCode: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3 py-2.5 text-xs text-ivory"
                    >
                      {db.locations.map((loc) => (
                        <option key={loc.code} value={loc.code}>
                          {loc.nameFr} {loc.deliveryFeeMad > 0 ? `(+${loc.deliveryFeeMad} MAD)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ivory-muted">
                      Lieu de restitution :
                    </label>
                    <select
                      value={searchCriteria.returnLocationCode}
                      onChange={(e) =>
                        setSearchCriteria((prev) => ({
                          ...prev,
                          returnLocationCode: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3 py-2.5 text-xs text-ivory"
                    >
                      {db.locations.map((loc) => (
                        <option key={loc.code} value={loc.code}>
                          {loc.nameFr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ivory-muted">
                      Date de prise en charge :
                    </label>
                    <input
                      type="date"
                      value={searchCriteria.pickupDate}
                      onChange={(e) =>
                        setSearchCriteria((prev) => ({ ...prev, pickupDate: e.target.value }))
                      }
                      className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3 py-2.5 font-mono text-xs text-ivory"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ivory-muted">
                      Date de restitution :
                    </label>
                    <input
                      type="date"
                      value={searchCriteria.returnDate}
                      onChange={(e) =>
                        setSearchCriteria((prev) => ({ ...prev, returnDate: e.target.value }))
                      }
                      className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3 py-2.5 font-mono text-xs text-ivory"
                    />
                  </div>
                </div>

                {searchCriteria.pickupLocationCode === 'CUSTOM_HOTEL' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ivory-muted">
                      Nom de l&apos;hôtel ou adresse précise de livraison à Kénitra / Rabat :
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Hôtel Urban Kénitra, Avenue Mohammed V"
                      value={customDeliveryAddress}
                      onChange={(e) => setCustomDeliveryAddress(e.target.value)}
                      className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3 py-2.5 text-xs text-ivory"
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-4 border-t border-obsidian-border pt-4">
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-ivory">
                    <input
                      type="checkbox"
                      checked={searchCriteria.airportDelivery}
                      onChange={(e) =>
                        setSearchCriteria((prev) => ({
                          ...prev,
                          airportDelivery: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 accent-champagne"
                    />
                    <span>Livraison & Accueil Aéroport VIP</span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-2 text-xs text-ivory">
                    <input
                      type="checkbox"
                      checked={searchCriteria.withChauffeur}
                      onChange={(e) =>
                        setSearchCriteria((prev) => ({
                          ...prev,
                          withChauffeur: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 accent-champagne"
                    />
                    <span>Location avec Chauffeur Privé (+{db.companySettings.chauffeurDailyRateMad} MAD/j)</span>
                  </label>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleStep1Continue}
                    className="inline-flex items-center gap-2 rounded-xl bg-champagne px-6 py-3 text-xs font-bold uppercase tracking-wider text-obsidian shadow-gold-glow hover:brightness-110"
                  >
                    {busy ? 'Vérification disponibilité...' : 'Verrouiller la disponibilité & Continuer'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: SELECT EXTRAS */}
            {step === 2 && (
              <div className="rounded-2xl border border-obsidian-border bg-obsidian-card p-6 space-y-6">
                <h2 className="font-serif text-2xl font-bold text-ivory">
                  Étape 2 — Options & Équipements sur-mesure
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  {db.extras.map((extra) => {
                    const qty = extraQuantities[extra.code] || 0;
                    return (
                      <div
                        key={extra.code}
                        className={`flex flex-col justify-between rounded-xl border p-4 transition ${
                          qty > 0
                            ? 'border-champagne bg-champagne/10'
                            : 'border-obsidian-border bg-obsidian'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-semibold text-ivory">{extra.nameFr}</h3>
                            <span className="font-mono text-xs font-bold text-champagne">
                              {extra.priceMad} MAD {extra.perDay ? '/j' : 'forfait'}
                            </span>
                          </div>
                          <p className="mt-1.5 text-xs text-ivory-muted">{extra.descriptionFr}</p>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-obsidian-border/60 pt-3">
                          <span className="text-xs text-ivory-subtle">Quantité :</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setExtraQuantities((prev) => ({
                                  ...prev,
                                  [extra.code]: Math.max(0, (prev[extra.code] || 0) - 1),
                                }))
                              }
                              className="h-7 w-7 rounded border border-obsidian-border bg-obsidian-card font-mono text-xs font-bold text-ivory"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-mono text-xs font-bold text-champagne">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setExtraQuantities((prev) => ({
                                  ...prev,
                                  [extra.code]: Math.min(4, (prev[extra.code] || 0) + 1),
                                }))
                              }
                              className="h-7 w-7 rounded border border-champagne/40 bg-champagne/20 font-mono text-xs font-bold text-champagne"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-obsidian-border px-4 py-2.5 text-xs font-semibold text-ivory-muted"
                  >
                    <ArrowLeft className="h-4 w-4" /> Retour
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-2 rounded-xl bg-champagne px-6 py-3 text-xs font-bold uppercase tracking-wider text-obsidian"
                  >
                    Continuer vers les coordonnées <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: CUSTOMER INFORMATION */}
            {step === 3 && (
              <div className="rounded-2xl border border-obsidian-border bg-obsidian-card p-6 space-y-6">
                <h2 className="font-serif text-2xl font-bold text-ivory">
                  Étape 3 — Coordonnées du Conducteur / Client
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-ivory-muted">Nom complet *</label>
                    <input
                      type="text"
                      required
                      value={customer.fullName}
                      onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })}
                      className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 text-xs text-ivory"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-ivory-muted">Adresse Email *</label>
                    <input
                      type="email"
                      required
                      value={customer.email}
                      onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                      className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 text-xs text-ivory"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-ivory-muted">
                      Téléphone / WhatsApp *
                    </label>
                    <input
                      type="text"
                      required
                      value={customer.whatsapp}
                      onChange={(e) =>
                        setCustomer({
                          ...customer,
                          whatsapp: e.target.value,
                          phone: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 font-mono text-xs text-ivory"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-ivory-muted">
                      Pays de résidence *
                    </label>
                    <input
                      type="text"
                      value={customer.countryOfResidence}
                      onChange={(e) =>
                        setCustomer({ ...customer, countryOfResidence: e.target.value })
                      }
                      className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 text-xs text-ivory"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-ivory-muted">
                      Âge du conducteur *
                    </label>
                    <input
                      type="number"
                      min={18}
                      max={85}
                      value={customer.driverAge}
                      onChange={(e) =>
                        setCustomer({ ...customer, driverAge: Number(e.target.value) })
                      }
                      className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 font-mono text-xs text-ivory"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-ivory-muted">
                      Numéro de Vol (Optionnel — pour livraison Aéroport)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: AT 781 / AF 1596"
                      value={flightNumber}
                      onChange={(e) => setFlightNumber(e.target.value)}
                      className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 font-mono text-xs text-ivory"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-ivory-muted">
                      Numéro de permis de conduire {!searchCriteria.withChauffeur && '*'}
                    </label>
                    <input
                      type="text"
                      value={customer.licenseNumber}
                      onChange={(e) => setCustomer({ ...customer, licenseNumber: e.target.value })}
                      className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 font-mono text-xs text-ivory"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-ivory-muted">
                      Date d&apos;obtention du permis
                    </label>
                    <input
                      type="date"
                      value={customer.licenseIssueDate}
                      onChange={(e) =>
                        setCustomer({ ...customer, licenseIssueDate: e.target.value })
                      }
                      className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 font-mono text-xs text-ivory"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-obsidian-border px-4 py-2.5 text-xs font-semibold text-ivory-muted"
                  >
                    <ArrowLeft className="h-4 w-4" /> Retour
                  </button>
                  <button
                    type="button"
                    onClick={handleStep3Continue}
                    className="inline-flex items-center gap-2 rounded-xl bg-champagne px-6 py-3 text-xs font-bold uppercase tracking-wider text-obsidian"
                  >
                    Vérifier le récapitulatif <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: BOOKING SUMMARY & PAYMENT PLAN SELECTION */}
            {step === 4 && priceBreakdown && (
              <div className="rounded-2xl border border-obsidian-border bg-obsidian-card p-6 space-y-6">
                <h2 className="font-serif text-2xl font-bold text-ivory">
                  Étape 4 — Récapitulatif de Réservation & Mode de Règlement
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-obsidian-border bg-obsidian p-4 text-xs space-y-1.5">
                    <span className="font-semibold uppercase tracking-wider text-champagne">
                      Itinéraire & Dates
                    </span>
                    <p className="font-bold text-ivory">
                      {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.year})
                    </p>
                    <p className="text-ivory-muted">
                      Prise en charge : <strong>{searchCriteria.pickupLocationCode}</strong> le{' '}
                      {searchCriteria.pickupDate} à {searchCriteria.pickupTime}
                    </p>
                    <p className="text-ivory-muted">
                      Restitution : <strong>{searchCriteria.returnLocationCode}</strong> le{' '}
                      {searchCriteria.returnDate} à {searchCriteria.returnTime}
                    </p>
                    <p className="font-mono text-champagne">
                      Durée totale : {priceBreakdown.rentalDays} jour(s)
                    </p>
                  </div>

                  <div className="rounded-xl border border-obsidian-border bg-obsidian p-4 text-xs space-y-1.5">
                    <span className="font-semibold uppercase tracking-wider text-champagne">
                      Client & Permis
                    </span>
                    <p className="font-bold text-ivory">{customer.fullName}</p>
                    <p className="text-ivory-muted">{customer.email}</p>
                    <p className="text-ivory-muted">WhatsApp : {customer.whatsapp}</p>
                    <p className="font-mono text-ivory-subtle">
                      Permis : {customer.licenseNumber} ({customer.driverAge} ans)
                    </p>
                  </div>
                </div>

                {/* Promo Code Input */}
                <div className="rounded-xl border border-obsidian-border bg-obsidian p-4">
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ivory">
                    <Tag className="h-3.5 w-3.5 text-champagne" />
                    Code Promotionnel (Ex: BIENVENUE10 ou KENITRAVIP)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Entrez votre code promo"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      className="flex-1 rounded-lg border border-obsidian-border bg-obsidian-card px-3 py-2 font-mono text-xs text-ivory"
                    />
                  </div>
                </div>

                {/* Payment Plan Choice (Section 5) */}
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-champagne">
                    Choisissez votre formule de paiement sécurisé :
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        plan: 'deposit_20' as PaymentPlan,
                        title: 'Acompte 20% en ligne',
                        desc: 'Bloquez votre véhicule immédiatement et réglez 80% à la remise des clés.',
                      },
                      {
                        plan: 'deposit_30' as PaymentPlan,
                        title: 'Acompte 30% en ligne (Recommandé)',
                        desc: 'Formule privilégiée avec accueil prioritaire et solde de 70% sur place.',
                      },
                      {
                        plan: 'deposit_50' as PaymentPlan,
                        title: 'Acompte 50% en ligne',
                        desc: 'Payez la moitié maintenant et la moitié lors de la prise en charge.',
                      },
                      {
                        plan: 'full_100' as PaymentPlan,
                        title: 'Paiement Intégral 100% en ligne',
                        desc: 'Aucun solde de location à régler au comptoir (hors caution remboursable).',
                      },
                      ...(db.companySettings.allowPayOnArrival
                        ? [
                            {
                              plan: 'pay_on_arrival' as PaymentPlan,
                              title: 'Paiement à l’arrivée / Livraison',
                              desc: 'Réservation soumise à validation téléphonique par un agent.',
                            },
                          ]
                        : []),
                    ].map((opt) => (
                      <button
                        key={opt.plan}
                        type="button"
                        onClick={() => setPaymentPlan(opt.plan)}
                        className={`rounded-xl border p-4 text-left transition ${
                          paymentPlan === opt.plan
                            ? 'border-champagne bg-champagne/15'
                            : 'border-obsidian-border bg-obsidian hover:border-champagne/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-ivory">{opt.title}</span>
                          {paymentPlan === opt.plan && (
                            <CheckCircle2 className="h-4 w-4 text-champagne" />
                          )}
                        </div>
                        <p className="mt-1 text-[11px] text-ivory-muted">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-obsidian-border px-4 py-2.5 text-xs font-semibold text-ivory-muted"
                  >
                    <ArrowLeft className="h-4 w-4" /> Retour
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleProceedToPayment}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-champagne to-champagne-light px-6 py-3 text-xs font-bold uppercase tracking-wider text-obsidian shadow-gold-glow"
                  >
                    {busy
                      ? 'Création de la session...'
                      : paymentPlan === 'pay_on_arrival'
                      ? 'Confirmer la réservation (Paiement sur place)'
                      : `Procéder au paiement sécurisé (${priceBreakdown.amountDueOnlineMad} MAD)`}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: SECURE HOSTED CHECKOUT GATEWAY (MOROCCAN ACQUIRING ABSTRACTION) */}
            {step === 5 && createdBooking && paymentSessionData && (
              <div className="rounded-2xl border border-champagne/40 bg-obsidian-card p-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-obsidian-border pb-4">
                  <div className="flex items-center gap-2.5">
                    <Lock className="h-5 w-5 text-champagne" />
                    <div>
                      <h2 className="font-serif text-xl font-bold text-ivory">
                        Étape 5 — Passerelle de Paiement Sécurisée (Hosted Checkout)
                      </h2>
                      <p className="text-xs text-ivory-muted">
                        Abstraction Monétique Maroc ({db.companySettings.paymentGatewayName}) •
                        Aucune donnée bancaire ni CVV stockée sur nos serveurs
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-amber-500/40 bg-amber-950/50 px-3 py-1 font-mono text-[11px] text-amber-300">
                    {db.companySettings.paymentGatewayLive
                      ? 'Passerelle Live'
                      : 'Mode Sandbox de Vérification'}
                  </span>
                </div>

                {paymentAlert && (
                  <div
                    className={`rounded-xl border p-4 text-xs ${
                      paymentAlert.type === 'error'
                        ? 'border-red-500/40 bg-red-950/40 text-red-200'
                        : paymentAlert.type === 'warning'
                        ? 'border-amber-500/40 bg-amber-950/40 text-amber-200'
                        : 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200'
                    }`}
                  >
                    {paymentAlert.text}
                  </div>
                )}

                <div className="rounded-xl border border-obsidian-border bg-obsidian p-5 space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-ivory-muted">Référence réservation :</span>
                    <span className="font-mono font-bold text-ivory">
                      {createdBooking.reference}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ivory-muted">Session ID Serveur :</span>
                    <span className="font-mono text-champagne">
                      {paymentSessionData.payment.sessionId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ivory-muted">Clé d&apos;idempotence :</span>
                    <span className="font-mono text-ivory-subtle">
                      {paymentSessionData.payment.idempotencyKey}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-obsidian-border pt-3 text-sm font-bold">
                    <span className="text-ivory">Montant appelé en ligne maintenant :</span>
                    <span className="font-mono text-lg text-champagne">
                      {paymentSessionData.payment.amountMad} MAD
                    </span>
                  </div>
                  <div className="flex justify-between text-ivory-subtle">
                    <span>Solde à régler lors de la remise des clés :</span>
                    <span className="font-mono">{createdBooking.balanceDueAtPickupMad} MAD</span>
                  </div>
                  <div className="flex justify-between text-ivory-subtle">
                    <span>Caution remboursable (non débitée en ligne) :</span>
                    <span className="font-mono">{createdBooking.refundableDepositMad} MAD</span>
                  </div>
                </div>

                <div className="rounded-xl border border-champagne/30 bg-obsidian p-5">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-champagne">
                    <CreditCard className="h-4 w-4" />
                    Simulateur de Réponse Webhook Signé (Tests d&apos;Acceptation Section 5 & 16)
                  </h3>
                  <p className="mt-1.5 text-xs text-ivory-muted">
                    Le statut de la réservation n&apos;est jamais validé par le navigateur seul :
                    chaque bouton déclenche un appel Webhook signé HMAC-SHA256 vers{' '}
                    <code className="text-champagne">/api/payments/webhook</code>.
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleGatewayOutcome('success')}
                      className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-lg transition hover:bg-emerald-500"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Autoriser le Paiement (Succès)
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleGatewayOutcome('failed')}
                      className="flex items-center justify-center gap-2 rounded-xl border border-red-500/50 bg-red-950/50 px-4 py-3 text-xs font-bold text-red-200 transition hover:bg-red-900/60"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Simuler Échec Carte (Reprise)
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleGatewayOutcome('cancelled')}
                      className="flex items-center justify-center gap-2 rounded-xl border border-obsidian-border bg-obsidian-card px-4 py-3 text-xs font-semibold text-ivory-muted hover:text-ivory"
                    >
                      Annuler la transaction
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: BOOKING CONFIRMATION */}
            {step === 6 && createdBooking && (
              <div className="rounded-2xl border border-emerald-500/40 bg-obsidian-card p-6 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold uppercase tracking-widest text-emerald-400">
                      Étape 6 — Réservation Enregistrée & Confirmée
                    </span>
                    <h2 className="mt-1 font-serif text-2xl font-bold text-ivory">
                      Merci {createdBooking.customer.fullName}, votre véhicule est réservé !
                    </h2>
                    <p className="mt-1 text-xs text-ivory-muted">
                      Un email récapitulatif ainsi que votre contrat numérique ont été générés.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 rounded-xl border border-obsidian-border bg-obsidian p-5 sm:grid-cols-3 text-xs">
                  <div>
                    <span className="text-ivory-subtle">Référence officielle :</span>
                    <p className="mt-0.5 font-mono text-base font-bold text-champagne">
                      {createdBooking.reference}
                    </p>
                  </div>
                  <div>
                    <span className="text-ivory-subtle">Code d&apos;accès Portail Invité :</span>
                    <p className="mt-0.5 font-mono text-base font-bold text-ivory">
                      {createdBooking.accessToken}
                    </p>
                  </div>
                  <div>
                    <span className="text-ivory-subtle">Statut réservation :</span>
                    <p className="mt-0.5 font-mono text-sm font-bold uppercase text-emerald-400">
                      {createdBooking.status}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setContractModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-champagne px-5 py-3 text-xs font-bold text-obsidian shadow-gold-glow"
                  >
                    <FileText className="h-4 w-4" />
                    Télécharger Contrat PDF, État des Lieux & Reçu
                  </button>

                  <a
                    href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
                      `Bonjour ${db.companySettings.brandName}, je viens de finaliser ma réservation ${createdBooking.reference} (${createdBooking.vehicleTitle}) du ${createdBooking.pickupAt.slice(0, 10)} au ${createdBooking.returnAt.slice(0, 10)}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-600/20 px-5 py-3 text-xs font-bold text-emerald-300"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Recevoir le suivi sur WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Persistent Live Price Summary Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 rounded-2xl border border-champagne/35 bg-obsidian-card p-5 shadow-glass">
              <h3 className="font-serif text-base font-bold text-ivory">
                Résumé Tarifaire Temps Réel
              </h3>
              <p className="text-[11px] text-ivory-subtle">
                Calculé et vérifié côté serveur en Dirhams Marocains (MAD)
              </p>

              {selectedVehicle && (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-obsidian-border bg-obsidian p-3">
                  <img
                    src={selectedVehicle.images[0]?.url}
                    alt={selectedVehicle.model}
                    className="h-14 w-24 rounded-lg object-cover"
                  />
                  <div>
                    <p className="text-xs font-bold text-ivory">
                      {selectedVehicle.brand} {selectedVehicle.model}
                    </p>
                    <span className="font-mono text-[11px] text-champagne">
                      {selectedVehicle.category} • {selectedVehicle.year}
                    </span>
                  </div>
                </div>
              )}

              {priceBreakdown && (
                <div className="mt-4 space-y-2.5 text-xs">
                  <div className="flex justify-between text-ivory-muted">
                    <span>
                      Location ({priceBreakdown.rentalDays} j ×{' '}
                      {priceBreakdown.effectiveDailyRateMad} MAD) :
                    </span>
                    <span className="font-mono text-ivory">
                      {priceBreakdown.baseSubtotalMad} MAD
                    </span>
                  </div>

                  {priceBreakdown.selectedExtras.map((ex) => (
                    <div key={ex.extraCode} className="flex justify-between text-ivory-muted">
                      <span>
                        {ex.nameFr} (×{ex.quantity}) :
                      </span>
                      <span className="font-mono text-ivory">{ex.totalPriceMad} MAD</span>
                    </div>
                  ))}

                  {priceBreakdown.deliveryFeeMad > 0 && (
                    <div className="flex justify-between text-ivory-muted">
                      <span>Livraison / Accueil Aéroport :</span>
                      <span className="font-mono text-ivory">
                        {priceBreakdown.deliveryFeeMad} MAD
                      </span>
                    </div>
                  )}

                  {priceBreakdown.chauffeurSupplementMad > 0 && (
                    <div className="flex justify-between text-ivory-muted">
                      <span>Service Chauffeur Privé :</span>
                      <span className="font-mono text-ivory">
                        {priceBreakdown.chauffeurSupplementMad} MAD
                      </span>
                    </div>
                  )}

                  {priceBreakdown.discountMad > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Remise promotionnelle ({promoCode}) :</span>
                      <span className="font-mono">-{priceBreakdown.discountMad} MAD</span>
                    </div>
                  )}

                  <div className="border-t border-obsidian-border pt-2.5">
                    <div className="flex justify-between text-[11px] text-ivory-subtle">
                      <span>Montant HT :</span>
                      <span className="font-mono">{priceBreakdown.subtotalHtMad} MAD</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-ivory-subtle">
                      <span>TVA ({db.companySettings.vatRatePct}%) :</span>
                      <span className="font-mono">{priceBreakdown.taxAmountMad} MAD</span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between font-bold text-ivory">
                      <span>Total Location TTC :</span>
                      <span className="font-mono text-xl text-champagne">
                        {priceBreakdown.totalPayableMad} MAD
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-obsidian-border bg-obsidian p-3 space-y-1">
                    <div className="flex justify-between text-emerald-400 font-semibold">
                      <span>À régler en ligne maintenant :</span>
                      <span className="font-mono">{priceBreakdown.amountDueOnlineMad} MAD</span>
                    </div>
                    <div className="flex justify-between text-ivory-muted">
                      <span>Solde à la prise en charge :</span>
                      <span className="font-mono">
                        {priceBreakdown.balanceDueAtPickupMad} MAD
                      </span>
                    </div>
                  </div>

                  {/* Strictly separated security deposit */}
                  <div className="rounded-xl border border-champagne/30 bg-obsidian p-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 font-semibold text-champagne">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Caution remboursable :
                      </span>
                      <span className="font-mono font-bold text-ivory">
                        {priceBreakdown.refundableDepositMad.toLocaleString()} MAD
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-ivory-subtle">
                      Séparée du paiement de location • Empreinte ou dépôt restitué au retour.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ContractModal
        booking={contractModalOpen ? createdBooking : null}
        initialTab="contract"
        onClose={() => setContractModalOpen(false)}
      />
    </div>
  );
};
