import React, { useEffect, useState, useCallback } from 'react';
import {
  UserCheck,
  ShieldCheck,
  FileText,
  Plane,
  Calendar,
  Search,
  Lock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Phone,
  XCircle,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import {
  AirportTransferBooking,
  Booking,
  ChauffeurMission,
  PaymentRecord,
} from '../types/domain';
import { ContractModal } from '../components/ContractModal';

export const PortalPage: React.FC = () => {
  const {
    db,
    currentUser,
    switchUserProfile,
    fetchCustomerPortal,
    fetchChauffeurMissions,
    updateMissionStatus,
    updateBookingAdmin,
    submitSupportTicket,
  } = usePlatform();

  const [portalMode, setPortalMode] = useState<'customer' | 'guest_lookup' | 'chauffeur'>(
    currentUser?.role === 'chauffeur' ? 'chauffeur' : 'customer'
  );

  // Customer data
  const [customerBookings, setCustomerBookings] = useState<Booking[]>([]);
  const [customerTransfers, setCustomerTransfers] = useState<AirportTransferBooking[]>([]);
  const [customerPayments, setCustomerPayments] = useState<PaymentRecord[]>([]);

  // Guest lookup inputs
  const [guestRef, setGuestRef] = useState<string>('KPRC-2026-8421');
  const [guestEmailOrToken, setGuestEmailOrToken] = useState<string>('amine.tazi@client.ma');

  // Chauffeur missions
  const [missions, setMissions] = useState<ChauffeurMission[]>([]);

  // Support ticket
  const [supportSubject, setSupportSubject] = useState<string>('');
  const [supportMessage, setSupportMessage] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Contract modal
  const [selectedContractBooking, setSelectedContractBooking] = useState<Booking | null>(null);
  const [contractTab, setContractTab] = useState<
    'confirmation' | 'contract' | 'inspection' | 'receipt'
  >('contract');

  const loadAuthenticatedCustomer = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await fetchCustomerPortal({ actorProfileId: currentUser.id });
      setCustomerBookings(data.bookings);
      setCustomerTransfers(data.transfers);
      setCustomerPayments(data.payments);
    } catch (err) {
      setFeedback({ type: 'error', text: (err as Error).message });
    }
  }, [currentUser, fetchCustomerPortal]);

  const loadChauffeurMissions = useCallback(async () => {
    if (!currentUser) return;
    try {
      const list = await fetchChauffeurMissions(currentUser.id);
      setMissions(list);
    } catch (err) {
      setMissions([]);
      setFeedback({ type: 'error', text: (err as Error).message });
    }
  }, [currentUser, fetchChauffeurMissions]);

  useEffect(() => {
    setFeedback(null);
    if (portalMode === 'customer' && currentUser) {
      loadAuthenticatedCustomer();
    } else if (portalMode === 'chauffeur' && currentUser) {
      loadChauffeurMissions();
    }
  }, [portalMode, currentUser, loadAuthenticatedCustomer, loadChauffeurMissions]);

  const handleGuestLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const data = await fetchCustomerPortal({
        guestReference: guestRef,
        guestEmailOrToken,
      });
      setCustomerBookings(data.bookings);
      setCustomerTransfers(data.transfers);
      setCustomerPayments(data.payments);
      setFeedback({
        type: 'success',
        text: `Accès vérifié pour la référence ${guestRef}.`,
      });
    } catch (err) {
      setFeedback({ type: 'error', text: (err as Error).message });
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await updateBookingAdmin({ bookingId, status: 'cancelled' });
      await loadAuthenticatedCustomer();
      setFeedback({
        type: 'success',
        text: 'Votre demande d’annulation a été enregistrée conformément à la politique de l’agence.',
      });
    } catch (err) {
      setFeedback({ type: 'error', text: (err as Error).message });
    }
  };

  const handleExtendBooking = async (booking: Booking) => {
    const currentReturn = new Date(booking.returnAt);
    const extendedIso = new Date(currentReturn.getTime() + 86400000).toISOString();
    try {
      await updateBookingAdmin({
        bookingId: booking.id,
        returnAt: extendedIso,
      });
      await loadAuthenticatedCustomer();
      setFeedback({
        type: 'success',
        text: `Date de retour prolongée au ${extendedIso.slice(0, 10)} après vérification de disponibilité.`,
      });
    } catch (err) {
      setFeedback({ type: 'error', text: (err as Error).message });
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject.trim() || !supportMessage.trim()) return;
    await submitSupportTicket({
      customerName: currentUser?.fullName || 'Client Portail',
      customerEmail: currentUser?.email || guestEmailOrToken,
      bookingReference: customerBookings[0]?.reference,
      subject: supportSubject,
      message: supportMessage,
    });
    setSupportSubject('');
    setSupportMessage('');
    setFeedback({
      type: 'success',
      text: 'Votre demande d’assistance a été transmise à la conciergerie Kénitra Prestige.',
    });
  };

  return (
    <div className="min-h-screen bg-obsidian pb-24 pt-8 text-ivory">
      <div className="mx-auto max-w-7xl px-4">
        {/* Top Portal Header & Mode Switcher */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-obsidian-border bg-obsidian-card p-6">
          <div>
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-champagne">
              Portail Sécurisé & Isolation des Données (RLS)
            </span>
            <h1 className="mt-1 font-serif text-3xl font-bold text-ivory">
              Espace Client & Portail Chauffeurs
            </h1>
            <p className="mt-1 text-xs text-ivory-muted">
              Consultez vos réservations, téléchargez vos contrats PDF et reçus, ou gérez vos
              missions chauffeurs assignées.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                switchUserProfile('usr-customer-1');
                setPortalMode('customer');
              }}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                portalMode === 'customer'
                  ? 'bg-champagne text-obsidian shadow-gold-glow'
                  : 'border border-obsidian-border bg-obsidian text-ivory-muted'
              }`}
            >
              <UserCheck className="mr-1.5 inline h-4 w-4" />
              Mon Compte Client
            </button>

            <button
              type="button"
              onClick={() => setPortalMode('guest_lookup')}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                portalMode === 'guest_lookup'
                  ? 'bg-champagne text-obsidian shadow-gold-glow'
                  : 'border border-obsidian-border bg-obsidian text-ivory-muted'
              }`}
            >
              <Search className="mr-1.5 inline h-4 w-4" />
              Accès Invité (Référence)
            </button>

            <button
              type="button"
              onClick={() => {
                switchUserProfile('usr-chauffeur-1');
                setPortalMode('chauffeur');
              }}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                portalMode === 'chauffeur'
                  ? 'bg-champagne text-obsidian shadow-gold-glow'
                  : 'border border-obsidian-border bg-obsidian text-ivory-muted'
              }`}
            >
              <ShieldCheck className="mr-1.5 inline h-4 w-4" />
              Portail Chauffeur (Missions)
            </button>
          </div>
        </div>

        {feedback && (
          <div
            className={`mb-6 flex items-center gap-2 rounded-xl border p-4 text-xs ${
              feedback.type === 'success'
                ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200'
                : 'border-red-500/40 bg-red-950/40 text-red-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* MODE 1 & 2: CUSTOMER PORTAL OR GUEST LOOKUP */}
        {(portalMode === 'customer' || portalMode === 'guest_lookup') && (
          <div className="space-y-8">
            {portalMode === 'customer' ? (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-obsidian-border bg-obsidian-card p-4 text-xs">
                <div className="flex items-center gap-3">
                  <Lock className="h-4 w-4 text-champagne" />
                  <span>
                    Connecté en tant que :{' '}
                    <strong className="text-ivory">{currentUser?.fullName}</strong> (
                    {currentUser?.email}) — Seules vos propres réservations sont accessibles.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-ivory-subtle">Tester un autre compte client :</span>
                  <button
                    type="button"
                    onClick={() => switchUserProfile('usr-customer-1')}
                    className={`rounded px-2.5 py-1 font-mono ${
                      currentUser?.id === 'usr-customer-1'
                        ? 'bg-champagne text-obsidian font-bold'
                        : 'border border-obsidian-border bg-obsidian text-ivory-muted'
                    }`}
                  >
                    Amine Tazi
                  </button>
                  <button
                    type="button"
                    onClick={() => switchUserProfile('usr-customer-2')}
                    className={`rounded px-2.5 py-1 font-mono ${
                      currentUser?.id === 'usr-customer-2'
                        ? 'bg-champagne text-obsidian font-bold'
                        : 'border border-obsidian-border bg-obsidian text-ivory-muted'
                    }`}
                  >
                    Claire Dubois
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleGuestLookup}
                className="rounded-2xl border border-champagne/30 bg-obsidian-card p-6"
              >
                <h2 className="font-serif text-lg font-bold text-ivory">
                  Consultation de réservation sans création de compte obligatoire
                </h2>
                <p className="mt-1 text-xs text-ivory-muted">
                  Saisissez votre référence de réservation (ex: KPRC-2026-8421 ou KPRC-2026-9104)
                  ainsi que l&apos;email ou le jeton d&apos;accès associé.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <input
                    type="text"
                    required
                    placeholder="Référence (ex: KPRC-2026-8421)"
                    value={guestRef}
                    onChange={(e) => setGuestRef(e.target.value)}
                    className="rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 font-mono text-xs text-ivory"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Email ou Code d'accès (ex: amine.tazi@client.ma)"
                    value={guestEmailOrToken}
                    onChange={(e) => setGuestEmailOrToken(e.target.value)}
                    className="rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 text-xs text-ivory"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-champagne px-5 py-2.5 text-xs font-bold text-obsidian"
                  >
                    Rechercher ma réservation
                  </button>
                </div>
              </form>
            )}

            {/* Vehicle Bookings List */}
            <div>
              <h2 className="mb-4 font-serif text-xl font-bold text-ivory">
                Mes Réservations de Véhicules ({customerBookings.length})
              </h2>
              <div className="grid gap-5">
                {customerBookings.map((bkg) => (
                  <div
                    key={bkg.id}
                    className="rounded-2xl border border-obsidian-border bg-obsidian-card p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-obsidian-border pb-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={bkg.vehicleImage}
                          alt={bkg.vehicleTitle}
                          className="h-16 w-28 rounded-xl border border-obsidian-border object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-champagne">
                              {bkg.reference}
                            </span>
                            <span className="rounded-full border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-0.5 font-mono text-[10px] uppercase text-emerald-300">
                              {bkg.status}
                            </span>
                          </div>
                          <h3 className="mt-1 font-serif text-lg font-bold text-ivory">
                            {bkg.vehicleTitle}
                          </h3>
                          <p className="text-xs text-ivory-muted">
                            Départ : <strong>{bkg.pickupLocationCode}</strong> (
                            {bkg.pickupAt.slice(0, 10)}) → Retour :{' '}
                            <strong>{bkg.returnLocationCode}</strong> ({bkg.returnAt.slice(0, 10)})
                          </p>
                        </div>
                      </div>

                      <div className="text-right font-mono text-xs">
                        <span className="block text-ivory-subtle">Total Location TTC</span>
                        <span className="text-lg font-bold text-champagne">
                          {bkg.totalPayableMad} MAD
                        </span>
                        <span className="block text-[11px] text-emerald-400">
                          Payé : {bkg.amountPaidMad} MAD • Solde : {bkg.balanceDueAtPickupMad} MAD
                        </span>
                        <span className="block text-[11px] text-ivory-subtle">
                          Caution séparée : {bkg.refundableDepositMad} MAD
                        </span>
                      </div>
                    </div>

                    {/* Actions: Contract PDF, Receipt, Extend, Cancel */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setContractTab('contract');
                            setSelectedContractBooking(bkg);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-champagne px-3.5 py-2 text-xs font-bold text-obsidian"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Contrat de Location PDF & Signature
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setContractTab('receipt');
                            setSelectedContractBooking(bkg);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2 text-xs font-semibold text-ivory hover:border-champagne/40"
                        >
                          Reçu de Paiement ({customerPayments.find((p) => p.bookingId === bkg.id)?.receiptNumber || 'Facture'})
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setContractTab('inspection');
                            setSelectedContractBooking(bkg);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2 text-xs font-semibold text-ivory-muted hover:text-ivory"
                        >
                          Fiche État des Lieux
                        </button>
                      </div>

                      {bkg.status !== 'cancelled' && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleExtendBooking(bkg)}
                            className="inline-flex items-center gap-1 rounded-xl border border-obsidian-border bg-obsidian px-3 py-2 text-xs text-champagne hover:border-champagne"
                          >
                            <Calendar className="h-3.5 w-3.5" /> +1 Jour (Prolonger)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelBooking(bkg.id)}
                            className="inline-flex items-center gap-1 rounded-xl border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs text-red-300 hover:bg-red-950/60"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Demander l&apos;annulation
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Airport Transfers & Assigned Chauffeur Details */}
            <div>
              <h2 className="mb-4 font-serif text-xl font-bold text-ivory">
                Mes Transferts Aéroport & Chauffeur Assigné ({customerTransfers.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {customerTransfers.map((trf) => (
                  <div
                    key={trf.id}
                    className="rounded-2xl border border-obsidian-border bg-obsidian-card p-5 text-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-champagne">{trf.reference}</span>
                      <span className="rounded-full bg-champagne/15 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-champagne">
                        {trf.status}
                      </span>
                    </div>
                    <p className="font-serif text-base font-bold text-ivory">
                      Aéroport {trf.airportCode} → {trf.destinationAddress}
                    </p>
                    <p className="text-ivory-muted">
                      Vol : <strong>{trf.flightNumber}</strong> ({trf.airline}) • Arrivée :{' '}
                      {trf.flightArrivalAt.slice(0, 16).replace('T', ' ')}
                    </p>
                    {trf.assignedChauffeurName && (
                      <div className="rounded-xl border border-champagne/30 bg-obsidian p-3">
                        <span className="block text-[11px] text-champagne font-semibold">
                          Chauffeur Privé Assigné :
                        </span>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="font-bold text-ivory">{trf.assignedChauffeurName}</span>
                          <span className="flex items-center gap-1 font-mono text-emerald-400">
                            <Phone className="h-3.5 w-3.5" /> {trf.assignedChauffeurPhone}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Support Request Form */}
            <form
              onSubmit={handleSupportSubmit}
              className="rounded-2xl border border-obsidian-border bg-obsidian-card p-6 space-y-4"
            >
              <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-ivory">
                <MessageSquare className="h-5 w-5 text-champagne" />
                Contacter l&apos;Assistance & Conciergerie Client
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Objet de votre demande (ex: Modification horaire vol)"
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  className="rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 text-xs text-ivory"
                />
                <input
                  type="text"
                  placeholder="Votre message détaillé..."
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  className="rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 text-xs text-ivory"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-champagne px-5 py-2.5 text-xs font-bold text-obsidian"
              >
                Envoyer la demande au support
              </button>
            </form>
          </div>
        )}

        {/* MODE 3: CHAUFFEUR MISSION PORTAL (Acceptance Test #8) */}
        {portalMode === 'chauffeur' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-champagne/30 bg-obsidian-card p-4 text-xs">
              <div>
                <span className="font-semibold text-champagne">
                  Portail Chauffeur (Filtrage RLS Strict par Chauffeur Assigné) :
                </span>
                <p className="text-ivory-muted">
                  Chauffeur actif : <strong className="text-ivory">{currentUser?.fullName}</strong>{' '}
                  — Vous voyez exclusivement vos propres missions assignées.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-ivory-subtle">Changer de chauffeur :</span>
                <button
                  type="button"
                  onClick={() => switchUserProfile('usr-chauffeur-1')}
                  className={`rounded px-3 py-1.5 font-mono ${
                    currentUser?.id === 'usr-chauffeur-1'
                      ? 'bg-champagne text-obsidian font-bold'
                      : 'border border-obsidian-border bg-obsidian text-ivory-muted'
                  }`}
                >
                  Karim El Mansouri (chf-01)
                </button>
                <button
                  type="button"
                  onClick={() => switchUserProfile('usr-chauffeur-2')}
                  className={`rounded px-3 py-1.5 font-mono ${
                    currentUser?.id === 'usr-chauffeur-2'
                      ? 'bg-champagne text-obsidian font-bold'
                      : 'border border-obsidian-border bg-obsidian text-ivory-muted'
                  }`}
                >
                  Youssef Benjelloun (chf-02)
                </button>
              </div>
            </div>

            <div className="grid gap-5">
              {missions.map((msn) => (
                <div
                  key={msn.id}
                  className="rounded-2xl border border-obsidian-border bg-obsidian-card p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-obsidian-border pb-4">
                    <div>
                      <span className="font-mono text-xs font-bold text-champagne">
                        MISSION {msn.reference} • Chauffeur : {msn.chauffeurName}
                      </span>
                      <h3 className="mt-1 font-serif text-xl font-bold text-ivory">
                        {msn.serviceLabel}
                      </h3>
                      <p className="mt-1 text-xs text-ivory-muted">
                        Client : <strong className="text-ivory">{msn.customerName}</strong> (WhatsApp
                        : {msn.customerWhatsapp})
                      </p>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <span className="rounded-full bg-champagne/20 px-3 py-1 text-champagne font-bold">
                        {msn.status.toUpperCase()}
                      </span>
                      <p className="mt-2 text-ivory-muted">
                        Horaire : {msn.scheduledAt.slice(0, 16).replace('T', ' ')}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 text-xs">
                    <div className="rounded-xl border border-obsidian-border bg-obsidian p-3.5">
                      <span className="text-ivory-subtle">Lieu de prise en charge & Vol :</span>
                      <p className="mt-1 font-semibold text-ivory">{msn.pickupLocation}</p>
                      <p className="font-mono text-champagne">
                        Vol {msn.flightNumber || 'N/A'} ({msn.airline || 'N/A'}) — Statut vol :{' '}
                        {msn.flightStatus.toUpperCase()}
                      </p>
                    </div>
                    <div className="rounded-xl border border-obsidian-border bg-obsidian p-3.5">
                      <span className="text-ivory-subtle">Destination :</span>
                      <p className="mt-1 font-semibold text-ivory">{msn.dropoffLocation}</p>
                      <p className="text-ivory-muted">Notes : {msn.operationalNotes}</p>
                    </div>
                  </div>

                  {/* Mission & Flight Status Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-obsidian-border pt-4 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-ivory-muted">Progression Mission :</span>
                      {(
                        [
                          { code: 'en_route', label: 'En route vers Aéroport' },
                          { code: 'arrived_pickup', label: 'Sur place (Pancarte VIP)' },
                          { code: 'in_progress', label: 'Client à bord' },
                          { code: 'completed', label: 'Mission terminée' },
                        ] as const
                      ).map((st) => (
                        <button
                          key={st.code}
                          type="button"
                          onClick={async () => {
                            await updateMissionStatus({
                              missionId: msn.id,
                              status: st.code,
                            });
                            await loadChauffeurMissions();
                          }}
                          className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                            msn.status === st.code
                              ? 'bg-champagne text-obsidian'
                              : 'border border-obsidian-border bg-obsidian text-ivory-muted hover:text-ivory'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <Plane className="h-3.5 w-3.5 text-champagne" />
                      <span className="text-ivory-muted">Statut Vol Manuel :</span>
                      <select
                        value={msn.flightStatus}
                        onChange={async (e) => {
                          await updateMissionStatus({
                            missionId: msn.id,
                            flightStatus: e.target.value as ChauffeurMission['flightStatus'],
                          });
                          await loadChauffeurMissions();
                        }}
                        className="rounded-lg border border-obsidian-border bg-obsidian px-2.5 py-1.5 font-mono text-ivory"
                      >
                        <option value="scheduled">Programmé</option>
                        <option value="on_time">À l&apos;heure</option>
                        <option value="delayed">Retardé</option>
                        <option value="landed">Atterri</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ContractModal
        booking={selectedContractBooking}
        initialTab={contractTab}
        onClose={() => setSelectedContractBooking(null)}
      />
    </div>
  );
};
