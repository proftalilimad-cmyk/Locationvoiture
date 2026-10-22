import React, { useState } from 'react';
import {
  X,
  Printer,
  FileText,
  CheckCircle2,
  ShieldCheck,
  PenTool,
  Camera,
  Receipt,
} from 'lucide-react';
import { Booking } from '../types/domain';
import { usePlatform } from '../context/PlatformContext';

interface ContractModalProps {
  booking: Booking | null;
  initialTab?: 'confirmation' | 'contract' | 'inspection' | 'receipt';
  onClose: () => void;
}

export const ContractModal: React.FC<ContractModalProps> = ({
  booking,
  initialTab = 'contract',
  onClose,
}) => {
  const { db, updateBookingAdmin } = usePlatform();
  const [activeTab, setActiveTab] = useState<'confirmation' | 'contract' | 'inspection' | 'receipt'>(
    initialTab
  );
  const [signatureInput, setSignatureInput] = useState(booking?.contractSignatureName || '');
  const [mileageKm, setMileageKm] = useState(booking?.departureInspection?.mileageKm || 12500);
  const [fuelLevelPct, setFuelLevelPct] = useState(
    booking?.departureInspection?.fuelLevelPct || 100
  );
  const [damageNotes, setDamageNotes] = useState(
    booking?.departureInspection?.damageNotes || 'RAS — Carrosserie, jantes et sellerie sans défaut.'
  );
  const [returnNotes, setReturnNotes] = useState(
    booking?.returnInspection?.damageNotes || 'RAS au retour — Restitution conforme.'
  );
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!booking) return null;

  const handleSignAndSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await updateBookingAdmin({
        bookingId: booking.id,
        contractSignatureName: signatureInput.trim() || booking.customer.fullName,
        departureInspection: {
          timestamp: new Date().toISOString(),
          inspectorName: 'Agent Kénitra Prestige',
          mileageKm: Number(mileageKm),
          fuelLevelPct: Number(fuelLevelPct),
          exteriorCondition: 'Vérifié conforme',
          interiorCondition: 'Propreté certifiée',
          damageNotes,
          photoUrls: [booking.vehicleImage],
          customerAcknowledged: true,
        },
        returnInspection: {
          timestamp: new Date().toISOString(),
          inspectorName: 'Agent Kénitra Prestige',
          mileageKm: Number(mileageKm) + booking.rentalDays * 140,
          fuelLevelPct: Number(fuelLevelPct),
          exteriorCondition: 'Contrôlé au retour',
          interiorCondition: 'Conforme',
          damageNotes: returnNotes,
          photoUrls: [booking.vehicleImage],
          customerAcknowledged: true,
        },
      });
      setFeedback('Contrat numérique et fiche d’état des lieux signés et horodatés dans le journal d’audit.');
    } catch (err) {
      setFeedback((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-champagne/40 bg-obsidian-light p-6 shadow-2xl">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-obsidian-border pb-4 print:hidden">
          <div className="flex items-center gap-2.5">
            <FileText className="h-5 w-5 text-champagne" />
            <div>
              <h2 className="font-serif text-lg font-bold text-ivory">
                Documents Officiels & Contrat Numérique — {booking.reference}
              </h2>
              <p className="text-xs text-ivory-muted">
                Accès sécurisé par rôle • Horodatage cryptographique & Audit Log actif
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintPdf}
              className="flex items-center gap-1.5 rounded-lg bg-champagne px-3.5 py-2 text-xs font-bold text-obsidian hover:brightness-110"
            >
              <Printer className="h-4 w-4" />
              Imprimer / Exporter PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-obsidian-border p-2 text-ivory-muted hover:text-ivory"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Document Type Tabs */}
        <div className="mt-4 flex flex-wrap gap-2 border-b border-obsidian-border pb-3 print:hidden">
          {[
            { id: 'confirmation', label: '1. Confirmation Réservation', icon: CheckCircle2 },
            { id: 'contract', label: '2. Contrat de Location', icon: FileText },
            { id: 'inspection', label: '3. État des Lieux Départ / Retour', icon: Camera },
            { id: 'receipt', label: '4. Reçu de Paiement & Caution', icon: Receipt },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-champagne text-obsidian'
                    : 'border border-obsidian-border bg-obsidian text-ivory-muted hover:text-ivory'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {feedback && (
          <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-2.5 text-xs text-emerald-200 print:hidden">
            {feedback}
          </div>
        )}

        {/* Printable Document Sheet */}
        <div className="mt-5 rounded-xl border border-obsidian-border bg-obsidian p-6 text-ivory">
          {/* Official Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-obsidian-border pb-4">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-champagne">
                {db.companySettings.brandName}
              </span>
              <p className="mt-1 text-xs text-ivory-muted">{db.companySettings.address}</p>
              <p className="text-xs text-ivory-muted">
                Tél : {db.companySettings.phone} • Email : {db.companySettings.email}
              </p>
            </div>
            <div className="text-right font-mono">
              <span className="inline-block rounded border border-champagne/40 bg-champagne/10 px-3 py-1 text-xs font-bold text-champagne">
                RÉF : {booking.reference}
              </span>
              <p className="mt-1 text-[11px] text-ivory-subtle">
                Émis le : {booking.createdAt.slice(0, 10)}
              </p>
            </div>
          </div>

          {/* Customer & Vehicle Summary */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-obsidian-border bg-obsidian-card p-4 text-xs">
              <h4 className="mb-2 font-semibold uppercase tracking-wider text-champagne">
                Locataire / Conducteur Principal
              </h4>
              <p className="font-semibold text-ivory">{booking.customer.fullName}</p>
              <p className="text-ivory-muted">Email : {booking.customer.email}</p>
              <p className="text-ivory-muted">Tél / WhatsApp : {booking.customer.whatsapp}</p>
              <p className="text-ivory-muted">
                Pays : {booking.customer.countryOfResidence} • Âge : {booking.customer.driverAge} ans
              </p>
              <p className="font-mono text-ivory-muted">
                Permis N° : {booking.customer.licenseNumber || 'Vérifié en agence'}
              </p>
            </div>

            <div className="rounded-xl border border-obsidian-border bg-obsidian-card p-4 text-xs">
              <h4 className="mb-2 font-semibold uppercase tracking-wider text-champagne">
                Véhicule & Période de Location
              </h4>
              <p className="font-semibold text-ivory">{booking.vehicleTitle}</p>
              <p className="text-ivory-muted">
                Départ : {booking.pickupLocationCode} ({booking.pickupAt.slice(0, 16).replace('T', ' ')})
              </p>
              <p className="text-ivory-muted">
                Retour : {booking.returnLocationCode} ({booking.returnAt.slice(0, 16).replace('T', ' ')})
              </p>
              <p className="font-mono text-champagne">
                Durée : {booking.rentalDays} jour(s) • Statut : {booking.status.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Tab Specific Content */}
          {activeTab === 'confirmation' && (
            <div className="mt-5 space-y-4 text-xs">
              <div className="rounded-xl border border-obsidian-border bg-obsidian-card p-4">
                <h4 className="mb-2 font-semibold text-champagne">
                  Instructions de Prise en Charge (Kénitra / Aéroport)
                </h4>
                <p className="leading-relaxed text-ivory-muted">
                  Présentez ce bon de confirmation (référence{' '}
                  <strong className="text-ivory">{booking.reference}</strong>) ainsi que votre
                  permis de conduire original et passeport / CIN. Si vous avez choisi la livraison
                  aéroport (RBA, CMN ou TNG), votre agent vous attendra à la sortie du terminal
                  arrivées avec une pancarte nominative.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'contract' && (
            <div className="mt-5 space-y-4 text-xs">
              <div className="rounded-xl border border-obsidian-border bg-obsidian-card p-4">
                <h4 className="mb-2 font-semibold uppercase tracking-wider text-champagne">
                  Clauses Contractuelles & Conditions Générales (Loi Marocaine)
                </h4>
                <ul className="list-disc space-y-1.5 pl-4 text-ivory-muted">
                  {db.companySettings.generalRentalConditionsFr.map((cond, idx) => (
                    <li key={idx}>{cond}</li>
                  ))}
                </ul>
              </div>

              {/* Electronic Signature Box */}
              <div className="rounded-xl border border-champagne/40 bg-obsidian-card p-4">
                <div className="flex items-center gap-2 font-semibold text-champagne">
                  <PenTool className="h-4 w-4" />
                  <span>Signature Électronique & Reconnaissance Client</span>
                </div>
                <p className="mt-1 text-ivory-muted">
                  En signant ci-dessous, le locataire reconnaît avoir pris connaissance des
                  conditions de location, du montant de la franchise et de l&apos;état du véhicule.
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    placeholder="Saisissez vos nom et prénom pour signer électroniquement"
                    value={signatureInput}
                    onChange={(e) => setSignatureInput(e.target.value)}
                    className="flex-1 rounded-lg border border-obsidian-border bg-obsidian px-3 py-2 font-serif text-sm italic text-champagne focus:border-champagne focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSignAndSave}
                    className="rounded-lg bg-champagne px-4 py-2 text-xs font-bold text-obsidian hover:brightness-110 print:hidden"
                  >
                    {saving ? 'Enregistrement...' : 'Valider Signature & État des Lieux'}
                  </button>
                </div>

                {booking.contractSignedAt && (
                  <p className="mt-2 font-mono text-[11px] text-emerald-400">
                    ✓ Signé électroniquement par &quot;{booking.contractSignatureName}&quot; le{' '}
                    {booking.contractSignedAt.slice(0, 19).replace('T', ' ')} UTC
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'inspection' && (
            <div className="mt-5 space-y-4 text-xs">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-obsidian-border bg-obsidian-card p-4">
                  <h4 className="mb-3 font-semibold text-champagne">
                    1. Fiche d&apos;Inspection Départ (Remise des Clés)
                  </h4>
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-ivory-subtle">Kilométrage départ (km) :</label>
                      <input
                        type="number"
                        value={mileageKm}
                        onChange={(e) => setMileageKm(Number(e.target.value))}
                        className="mt-1 w-full rounded border border-obsidian-border bg-obsidian px-2.5 py-1.5 font-mono text-ivory"
                      />
                    </div>
                    <div>
                      <label className="block text-ivory-subtle">Niveau carburant (%) :</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={fuelLevelPct}
                        onChange={(e) => setFuelLevelPct(Number(e.target.value))}
                        className="mt-1 w-full rounded border border-obsidian-border bg-obsidian px-2.5 py-1.5 font-mono text-ivory"
                      />
                    </div>
                    <div>
                      <label className="block text-ivory-subtle">Notes dommages / carrosserie :</label>
                      <textarea
                        rows={2}
                        value={damageNotes}
                        onChange={(e) => setDamageNotes(e.target.value)}
                        className="mt-1 w-full rounded border border-obsidian-border bg-obsidian p-2 text-ivory"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-obsidian-border bg-obsidian-card p-4">
                  <h4 className="mb-3 font-semibold text-champagne">
                    2. Fiche d&apos;Inspection Retour (Restitution)
                  </h4>
                  <div className="space-y-2.5">
                    <p className="text-ivory-muted">
                      Photo de référence de l&apos;état du véhicule enregistrée au dossier :
                    </p>
                    <img
                      src={booking.vehicleImage}
                      alt={booking.vehicleTitle}
                      className="h-28 w-full rounded-lg border border-obsidian-border object-cover"
                    />
                    <div>
                      <label className="block text-ivory-subtle">Observations au retour :</label>
                      <textarea
                        rows={2}
                        value={returnNotes}
                        onChange={(e) => setReturnNotes(e.target.value)}
                        className="mt-1 w-full rounded border border-obsidian-border bg-obsidian p-2 text-ivory"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end print:hidden">
                <button
                  type="button"
                  onClick={handleSignAndSave}
                  className="rounded-lg bg-champagne px-4 py-2 text-xs font-bold text-obsidian"
                >
                  Enregistrer les fiches d&apos;inspection Départ & Retour
                </button>
              </div>
            </div>
          )}

          {activeTab === 'receipt' && (
            <div className="mt-5 space-y-4 text-xs">
              <div className="rounded-xl border border-obsidian-border bg-obsidian-card p-4">
                <h4 className="mb-3 font-semibold uppercase tracking-wider text-champagne">
                  Décompte Financier & Séparation Stricte de la Caution
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-ivory-muted">Forfait location ({booking.rentalDays} jours) :</span>
                    <span className="font-mono text-ivory">{booking.baseSubtotalMad} MAD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ivory-muted">Options & Équipements :</span>
                    <span className="font-mono text-ivory">{booking.extrasSubtotalMad} MAD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ivory-muted">Frais de livraison / Aéroport :</span>
                    <span className="font-mono text-ivory">{booking.deliveryFeeMad} MAD</span>
                  </div>
                  {booking.discountMad > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Remise promotionnelle ({booking.promoCode}) :</span>
                      <span className="font-mono">-{booking.discountMad} MAD</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-obsidian-border pt-2 font-bold text-ivory">
                    <span>Total Location TTC (TVA 20% incluse : {booking.taxAmountMad} MAD) :</span>
                    <span className="font-mono text-base text-champagne">
                      {booking.totalPayableMad} MAD
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Montant réglé et vérifié :</span>
                    <span className="font-mono font-bold">{booking.amountPaidMad} MAD</span>
                  </div>
                  <div className="flex justify-between text-amber-300">
                    <span>Solde restant à régler à la remise des clés :</span>
                    <span className="font-mono font-bold">{booking.balanceDueAtPickupMad} MAD</span>
                  </div>
                </div>

                {/* Separated Security Deposit Notice */}
                <div className="mt-4 rounded-lg border border-champagne/40 bg-obsidian p-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-semibold text-champagne">
                      <ShieldCheck className="h-4 w-4" />
                      Dépôt de Garantie Remboursable (Caution Séparée) :
                    </span>
                    <span className="font-mono text-sm font-bold text-ivory">
                      {booking.refundableDepositMad.toLocaleString()} MAD
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-ivory-subtle">
                    Ce dépôt de garantie n&apos;est pas facturé dans le prix de location : il fait
                    l&apos;objet d&apos;une pré-autorisation ou caution en agence restituée au
                    retour du véhicule.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
