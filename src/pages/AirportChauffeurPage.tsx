import React, { useEffect, useState, useCallback } from 'react';
import {
  Plane,
  ShieldCheck,
  UserCheck,
  Car,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Sparkles,
  Moon,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import {
  AirportCode,
  AirportServiceType,
  AirportTransferBooking,
  VehicleCategoryCode,
} from '../types/domain';

export const AirportChauffeurPage: React.FC = () => {
  const {
    db,
    currentUser,
    calculateAirportPrice,
    bookAirportTransfer,
    triggerPaymentWebhook,
  } = usePlatform();

  const [serviceType, setServiceType] = useState<AirportServiceType>('private_airport_transfer');
  const [airportCode, setAirportCode] = useState<AirportCode>('CMN');
  const [flightNumber, setFlightNumber] = useState<string>('AT 205');
  const [airline, setAirline] = useState<string>('Royal Air Maroc');
  const [arrivalDate, setArrivalDate] = useState<string>('2026-11-05');
  const [arrivalTime, setArrivalTime] = useState<string>('22:45');
  const [passengers, setPassengers] = useState<number>(2);
  const [luggageCount, setLuggageCount] = useState<number>(3);
  const [destinationAddress, setDestinationAddress] = useState<string>(
    'Hôtel Urban Kénitra, Avenue Mohammed V, Kénitra'
  );
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategoryCode>('Luxury');
  const [durationHours, setDurationHours] = useState<number>(8);
  const [isRoundTrip, setIsRoundTrip] = useState<boolean>(false);
  const [meetAndGreet, setMeetAndGreet] = useState<boolean>(true);
  const [childSeats, setChildSeats] = useState<number>(0);
  const [waitingMinutes, setWaitingMinutes] = useState<number>(30);
  const [customerName, setCustomerName] = useState<string>(
    currentUser?.fullName.split('—')[0].trim() || 'Amine Tazi'
  );
  const [customerEmail, setCustomerEmail] = useState<string>(
    currentUser?.email || 'amine.tazi@client.ma'
  );
  const [customerWhatsapp, setCustomerWhatsapp] = useState<string>(
    currentUser?.whatsapp || '+212663112233'
  );
  const [specialInstructions, setSpecialInstructions] = useState<string>(
    'Accueil sortie douane avec pancarte nominative.'
  );
  const [payOnline, setPayOnline] = useState<boolean>(true);

  const [priceBreakdown, setPriceBreakdown] =
    useState<AirportTransferBooking['priceBreakdown'] | null>(null);
  const [confirmedTransfer, setConfirmedTransfer] = useState<AirportTransferBooking | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  const flightArrivalAt = `${arrivalDate}T${arrivalTime}:00.000Z`;

  const updatePrice = useCallback(async () => {
    try {
      const breakdown = await calculateAirportPrice({
        serviceType,
        airportCode,
        vehicleCategory,
        passengers,
        isRoundTrip,
        flightArrivalAt,
        meetAndGreet,
        childSeats,
        waitingMinutes,
        durationHours,
      });
      setPriceBreakdown(breakdown);
    } catch {
      // ignore transient errors
    }
  }, [
    calculateAirportPrice,
    serviceType,
    airportCode,
    vehicleCategory,
    passengers,
    isRoundTrip,
    flightArrivalAt,
    meetAndGreet,
    childSeats,
    waitingMinutes,
    durationHours,
  ]);

  useEffect(() => {
    updatePrice();
  }, [updatePrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setBusy(true);
    try {
      const { transfer, paymentSession, successSignature } = await bookAirportTransfer({
        serviceType,
        airportCode,
        flightNumber,
        airline,
        flightArrivalAt,
        passengers,
        luggageCount,
        destinationAddress,
        vehicleCategory,
        durationHours,
        isRoundTrip,
        meetAndGreet,
        childSeats,
        waitingMinutes,
        customerName,
        customerEmail,
        customerWhatsapp,
        specialInstructions,
        payOnline,
      });

      if (payOnline && paymentSession && successSignature) {
        const verified = await triggerPaymentWebhook({
          sessionId: paymentSession.sessionId,
          idempotencyKey: paymentSession.idempotencyKey,
          outcome: 'success',
          signature: successSignature,
        });
        setConfirmedTransfer(verified.airportTransfer || transfer);
      } else {
        setConfirmedTransfer(transfer);
      }
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const serviceCards: Array<{
    type: AirportServiceType;
    badge: string;
    title: string;
    mode: string;
    desc: string;
  }> = [
    {
      type: 'airport_vehicle_delivery',
      badge: 'SERVICE A • CONDUITE LIBRE',
      title: 'Livraison Véhicule à l’Aéroport',
      mode: 'Location Sans Chauffeur',
      desc: 'Un agent livre votre véhicule de location directement au terminal d’arrivée pour que vous preniez le volant immédiatement.',
    },
    {
      type: 'airport_meet_and_greet',
      badge: 'SERVICE B • ACCUEIL VIP',
      title: 'Accueil Meet & Greet Terminal',
      mode: 'Remise Prioritaire avec Pancarte',
      desc: 'Accueil personnalisé dans le hall arrivées avec pancarte nominative, assistance bagages et contrat signé sur tablette.',
    },
    {
      type: 'private_airport_transfer',
      badge: 'SERVICE C • CHAUFFEUR PRIVÉ',
      title: 'Transfert Privé Aéroport',
      mode: 'Transport Avec Chauffeur',
      desc: 'Un chauffeur professionnel bilingue vous conduit de l’aéroport RBA, CMN ou TNG jusqu’à votre hôtel ou résidence à Kénitra.',
    },
    {
      type: 'chauffeur_driven_booking',
      badge: 'SERVICE D • MISE À DISPOSITION',
      title: 'Véhicule Avec Chauffeur à la Durée',
      mode: 'Transport Exécutif Avec Chauffeur',
      desc: 'Réservez une berline ou un van VIP avec chauffeur dédié pour 4h, 8h ou plusieurs jours (missions d’affaires, délégations).',
    },
  ];

  const cleanWhatsapp = db.companySettings.whatsapp.replace(/[^0-9]/g, '');

  return (
    <div className="min-h-screen bg-obsidian pb-24 pt-8 text-ivory">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-8 rounded-2xl border border-champagne/30 bg-gradient-to-r from-obsidian-light via-obsidian-card to-obsidian-light p-6 md:p-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-champagne/40 bg-champagne/10 px-3 py-1 font-mono text-xs font-semibold text-champagne">
            <Plane className="h-3.5 w-3.5" />
            CONCIERGERIE AÉROPORT & CHAUFFEUR PRIVÉ — KÉNITRA, RABAT (RBA), CASABLANCA (CMN), TANGER (TNG)
          </span>
          <h1 className="mt-3 font-serif text-3xl font-bold text-ivory sm:text-4xl">
            Accueil Aéroport VIP & Service Chauffeur Privé
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-ivory-muted">
            Choisissez entre la livraison de votre véhicule de location en conduite libre (Services
            A & B) ou le transport exécutif avec chauffeur professionnel (Services C & D).
          </p>

          {/* Regulatory & Flight Tracking Status Notice */}
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-2 rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2 text-ivory-muted">
              <ShieldCheck className="h-4 w-4 text-champagne" />
              <span>Autorisation Transport Touristique / VTC Maroc & Assurance Passagers Incluse</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2 text-ivory-muted">
              <Clock className="h-4 w-4 text-champagne" />
              <span>
                Suivi des vols :{' '}
                <strong className="text-champagne">
                  {db.companySettings.flightApiConnected
                    ? 'API Temps Réel Active'
                    : 'Mise à jour manuelle par le Dispatch Chauffeurs'}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* 4 Distinct Service Selector Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {serviceCards.map((card) => {
            const active = serviceType === card.type;
            return (
              <button
                key={card.type}
                type="button"
                onClick={() => setServiceType(card.type)}
                className={`flex flex-col justify-between rounded-2xl border p-5 text-left transition ${
                  active
                    ? 'border-champagne bg-champagne/15 shadow-gold-glow'
                    : 'border-obsidian-border bg-obsidian-card hover:border-champagne/40'
                }`}
              >
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-champagne">
                    {card.badge}
                  </span>
                  <h2 className="mt-2 font-serif text-lg font-bold text-ivory">{card.title}</h2>
                  <span className="mt-0.5 inline-block rounded bg-obsidian px-2 py-0.5 text-[11px] font-medium text-ivory-subtle">
                    {card.mode}
                  </span>
                  <p className="mt-2.5 text-xs leading-relaxed text-ivory-muted">{card.desc}</p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-obsidian-border/60 pt-3 text-xs font-bold text-champagne">
                  <span>{active ? 'Service sélectionné' : 'Sélectionner ce service'}</span>
                  <CheckCircle2 className={`h-4 w-4 ${active ? 'opacity-100' : 'opacity-30'}`} />
                </div>
              </button>
            );
          })}
        </div>

        {errorMsg && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-xs text-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {confirmedTransfer ? (
          <div className="rounded-2xl border border-emerald-500/40 bg-obsidian-card p-6 space-y-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              <div>
                <span className="font-mono text-xs font-bold uppercase text-emerald-400">
                  Mission Aéroport / Chauffeur Confirmée
                </span>
                <h2 className="font-serif text-2xl font-bold text-ivory">
                  Référence : {confirmedTransfer.reference}
                </h2>
              </div>
            </div>

            <div className="grid gap-4 rounded-xl border border-obsidian-border bg-obsidian p-4 sm:grid-cols-3 text-xs">
              <div>
                <span className="text-ivory-subtle">Vol & Aéroport :</span>
                <p className="font-mono font-bold text-ivory">
                  {confirmedTransfer.airportCode} • Vol {confirmedTransfer.flightNumber} (
                  {confirmedTransfer.airline})
                </p>
              </div>
              <div>
                <span className="text-ivory-subtle">Chauffeur / Agent Assigné :</span>
                <p className="font-bold text-champagne">
                  {confirmedTransfer.assignedChauffeurName || 'En cours d’attribution'} (
                  {confirmedTransfer.assignedChauffeurPhone})
                </p>
              </div>
              <div>
                <span className="text-ivory-subtle">Montant Total & Statut :</span>
                <p className="font-mono font-bold text-emerald-400">
                  {confirmedTransfer.totalPriceMad} MAD ({confirmedTransfer.paymentStatus.toUpperCase()})
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
                  `Bonjour ${db.companySettings.brandName}, je confirme mon transfert aéroport ${confirmedTransfer.reference} sur le vol ${confirmedTransfer.flightNumber} (${confirmedTransfer.airportCode} → ${confirmedTransfer.destinationAddress}).`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white"
              >
                <MessageCircle className="h-4 w-4" />
                Envoyer les détails de vol sur WhatsApp
              </a>
              <button
                type="button"
                onClick={() => setConfirmedTransfer(null)}
                className="rounded-xl border border-obsidian-border px-4 py-3 text-xs font-semibold text-ivory-muted hover:text-ivory"
              >
                Nouvelle réservation de transfert
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Airport Booking Form */}
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-obsidian-border bg-obsidian-card p-6 space-y-6 lg:col-span-8"
            >
              <h2 className="font-serif text-xl font-bold text-ivory">
                Formulaire de Réservation Aéroport & Chauffeur
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-ivory-muted">
                    Aéroport d&apos;arrivée ou Gare LGV *
                  </label>
                  <select
                    value={airportCode}
                    onChange={(e) => setAirportCode(e.target.value as AirportCode)}
                    className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 text-xs text-ivory"
                  >
                    {db.companySettings.airportRates.map((r) => (
                      <option key={r.airportCode} value={r.airportCode}>
                        {r.airportNameFr} ({r.distanceToKenitraKm} km de Kénitra)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-ivory-muted">
                    Catégorie de véhicule souhaitée *
                  </label>
                  <select
                    value={vehicleCategory}
                    onChange={(e) => setVehicleCategory(e.target.value as VehicleCategoryCode)}
                    className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 text-xs text-ivory"
                  >
                    <option value="Sedan">Sedan Exécutif (Mercedes Classe C / Série 3)</option>
                    <option value="SUV">SUV Prestige (VW Touareg V6)</option>
                    <option value="Family">Van VIP 7 Places (Mercedes Classe V)</option>
                    <option value="Premium">Premium (Range Rover Velar)</option>
                    <option value="Luxury">First Class Diplomatique (Mercedes Classe S 500)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-ivory-muted">Numéro de vol *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: AT 205 / AF 1596"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 font-mono text-xs text-ivory"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-ivory-muted">
                    Compagnie aérienne *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Royal Air Maroc, Air France..."
                    value={airline}
                    onChange={(e) => setAirline(e.target.value)}
                    className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 text-xs text-ivory"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-ivory-muted">
                    Date d&apos;arrivée du vol *
                  </label>
                  <input
                    type="date"
                    required
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 font-mono text-xs text-ivory"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-ivory-muted">
                    Heure d&apos;atterrissage prévue * (Majoration nuit 22h–06h automatique)
                  </label>
                  <input
                    type="time"
                    required
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 font-mono text-xs text-ivory"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-ivory-muted">
                    Nombre de passagers (1 à 15) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={passengers}
                    onChange={(e) => setPassengers(Number(e.target.value))}
                    className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 font-mono text-xs text-ivory"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-ivory-muted">
                    Nombre de bagages *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={luggageCount}
                    onChange={(e) => setLuggageCount(Number(e.target.value))}
                    className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 font-mono text-xs text-ivory"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs text-ivory-muted">
                    Adresse de destination (Hôtel, Quartier, Atlantic Free Zone Kénitra, Rabat...) *
                  </label>
                  <input
                    type="text"
                    required
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 text-xs text-ivory"
                  />
                </div>

                {serviceType === 'chauffeur_driven_booking' && (
                  <div>
                    <label className="mb-1 block text-xs text-ivory-muted">
                      Durée de mise à disposition (heures) :
                    </label>
                    <select
                      value={durationHours}
                      onChange={(e) => setDurationHours(Number(e.target.value))}
                      className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 font-mono text-xs text-ivory"
                    >
                      <option value={4}>Demi-journée (4 heures)</option>
                      <option value={8}>Journée complète (8 heures)</option>
                      <option value={12}>Forfait Exécutif (12 heures)</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs text-ivory-muted">
                    Sièges bébé / rehausseurs requis :
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={4}
                    value={childSeats}
                    onChange={(e) => setChildSeats(Number(e.target.value))}
                    className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 font-mono text-xs text-ivory"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-ivory-muted">
                    Temps d&apos;attente estimé (60 premières min offertes) :
                  </label>
                  <select
                    value={waitingMinutes}
                    onChange={(e) => setWaitingMinutes(Number(e.target.value))}
                    className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 font-mono text-xs text-ivory"
                  >
                    <option value={30}>Standard (&le; 60 min — Gratuit)</option>
                    <option value={90}>90 minutes (+1h attente)</option>
                    <option value={120}>120 minutes (+1h attente)</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-4 border-t border-obsidian-border pt-4 text-xs">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isRoundTrip}
                    onChange={(e) => setIsRoundTrip(e.target.checked)}
                    className="h-4 w-4 accent-champagne"
                  />
                  <span>Aller-Retour (-10% sur le trajet retour)</span>
                </label>

                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={meetAndGreet}
                    onChange={(e) => setMeetAndGreet(e.target.checked)}
                    className="h-4 w-4 accent-champagne"
                  />
                  <span>Pancarte nominative VIP Meet & Greet au terminal</span>
                </label>

                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={payOnline}
                    onChange={(e) => setPayOnline(e.target.checked)}
                    className="h-4 w-4 accent-champagne"
                  />
                  <span>Régler et confirmer en ligne immédiatement</span>
                </label>
              </div>

              {/* Customer Contact */}
              <div className="grid gap-4 border-t border-obsidian-border pt-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-ivory-muted">Votre Nom *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3 py-2 text-xs text-ivory"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-ivory-muted">Email *</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3 py-2 text-xs text-ivory"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-ivory-muted">Numéro WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={customerWhatsapp}
                    onChange={(e) => setCustomerWhatsapp(e.target.value)}
                    className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3 py-2 font-mono text-xs text-ivory"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-ivory-muted">
                  Instructions spéciales (nom sur la pancarte, bagages hors format...) :
                </label>
                <input
                  type="text"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 text-xs text-ivory"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-gradient-to-r from-champagne to-champagne-light py-3.5 text-xs font-bold uppercase tracking-wider text-obsidian shadow-gold-glow hover:brightness-110"
              >
                {busy
                  ? 'Validation du transfert en cours...'
                  : `Confirmer la réservation (${priceBreakdown?.totalMad || 0} MAD)`}
              </button>
            </form>

            {/* Live Airport Pricing Breakdown Sidebar */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 rounded-2xl border border-champagne/35 bg-obsidian-card p-5 shadow-glass">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-champagne">
                  Moteur Tarifaire Aéroport
                </span>
                <h3 className="mt-1 font-serif text-lg font-bold text-ivory">
                  Devis Instantané Transparent
                </h3>

                {priceBreakdown && (
                  <div className="mt-4 space-y-2.5 text-xs">
                    <div className="flex justify-between text-ivory-muted">
                      <span>Forfait de base ({airportCode}) + catégorie :</span>
                      <span className="font-mono text-ivory">
                        {priceBreakdown.baseFareMad} MAD
                      </span>
                    </div>

                    {priceBreakdown.roundTripMad > 0 && (
                      <div className="flex justify-between text-ivory-muted">
                        <span>Trajet Retour (-10%) :</span>
                        <span className="font-mono text-ivory">
                          +{priceBreakdown.roundTripMad} MAD
                        </span>
                      </div>
                    )}

                    {priceBreakdown.meetAndGreetMad > 0 && (
                      <div className="flex justify-between text-ivory-muted">
                        <span>Accueil VIP Meet & Greet :</span>
                        <span className="font-mono text-ivory">
                          +{priceBreakdown.meetAndGreetMad} MAD
                        </span>
                      </div>
                    )}

                    {priceBreakdown.nightSurchargeMad > 0 && (
                      <div className="flex items-center justify-between text-amber-300">
                        <span className="flex items-center gap-1">
                          <Moon className="h-3.5 w-3.5" /> Majoration horaire nuit (22h–06h) :
                        </span>
                        <span className="font-mono">+{priceBreakdown.nightSurchargeMad} MAD</span>
                      </div>
                    )}

                    {priceBreakdown.waitingFeeMad > 0 && (
                      <div className="flex justify-between text-ivory-muted">
                        <span>Attente supplémentaire (&gt; 60 min) :</span>
                        <span className="font-mono text-ivory">
                          +{priceBreakdown.waitingFeeMad} MAD
                        </span>
                      </div>
                    )}

                    {priceBreakdown.childSeatMad > 0 && (
                      <div className="flex justify-between text-ivory-muted">
                        <span>Sièges enfant ({childSeats}) :</span>
                        <span className="font-mono text-ivory">
                          +{priceBreakdown.childSeatMad} MAD
                        </span>
                      </div>
                    )}

                    <div className="border-t border-obsidian-border pt-3 flex items-baseline justify-between font-bold">
                      <span className="text-ivory">Total Fixe Garanti TTC :</span>
                      <span className="font-mono text-2xl text-champagne">
                        {priceBreakdown.totalMad} MAD
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-5 rounded-xl border border-obsidian-border bg-obsidian p-3.5 text-[11px] text-ivory-muted space-y-1.5">
                  <p className="flex items-center gap-1.5 text-ivory font-semibold">
                    <Sparkles className="h-3.5 w-3.5 text-champagne" />
                    Engagements Inclus :
                  </p>
                  <p>• Péages autoroutiers (A1 / A5) et parking aéroport inclus</p>
                  <p>• Attente gratuite jusqu&apos;à 60 min après l&apos;atterrissage</p>
                  <p>• Attribution immédiate d&apos;un chauffeur professionnel</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
