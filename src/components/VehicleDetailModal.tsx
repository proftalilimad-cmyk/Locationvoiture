import React, { useState } from 'react';
import {
  X,
  Users,
  Briefcase,
  Fuel,
  Gauge,
  Shield,
  CheckCircle2,
  Calendar,
  Plane,
  AlertTriangle,
} from 'lucide-react';
import { Vehicle } from '../types/domain';
import { usePlatform } from '../context/PlatformContext';

interface VehicleDetailModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onSelectForBooking: (vehicle: Vehicle) => void;
}

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
  vehicle,
  onClose,
  onSelectForBooking,
}) => {
  const { db } = usePlatform();
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  if (!vehicle) return null;

  const weeklyDailyMad = Math.round(vehicle.dailyPriceMad * (1 - vehicle.weeklyDiscountPct / 100));
  const monthlyDailyMad = Math.round(vehicle.dailyPriceMad * (1 - vehicle.monthlyDiscountPct / 100));
  const highSeasonDailyMad = Math.round(vehicle.dailyPriceMad * vehicle.highSeasonMultiplier);

  // Build 14-day availability calendar starting Oct 16, 2026
  const baseDate = new Date('2026-10-16T10:00:00.000Z');
  const calendarDays = Array.from({ length: 14 }, (_, idx) => {
    const d = new Date(baseDate.getTime() + idx * 86400000);
    const iso = d.toISOString();
    const dateLabel = iso.slice(5, 10);

    const isBooked = db.bookings.some(
      (b) =>
        b.vehicleId === vehicle.id &&
        !['cancelled', 'no_show'].includes(b.status) &&
        new Date(b.pickupAt) <= d &&
        new Date(b.returnAt) >= d
    );
    const isBlocked = db.availabilityBlocks.some(
      (blk) =>
        blk.vehicleId === vehicle.id &&
        new Date(blk.startAt) <= d &&
        new Date(blk.endAt) >= d
    );

    return {
      dateLabel,
      status: isBlocked ? 'maintenance' : isBooked ? 'booked' : 'available',
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-champagne/40 bg-obsidian-light p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-obsidian-border pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-champagne/15 px-3 py-0.5 font-mono text-xs font-semibold text-champagne">
                {vehicle.category} • {vehicle.year}
              </span>
              {vehicle.isDemoData && (
                <span className="rounded border border-obsidian-border bg-obsidian px-2 py-0.5 font-mono text-[10px] text-ivory-subtle">
                  DONNÉES DÉMO — ÉDITABLE DANS L&apos;ADMIN
                </span>
              )}
            </div>
            <h2 className="mt-1 font-serif text-2xl font-bold text-ivory">
              {vehicle.brand} {vehicle.model}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-obsidian-border p-2 text-ivory-muted hover:text-ivory"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Gallery & Pricing Grid */}
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="overflow-hidden rounded-xl border border-obsidian-border bg-obsidian">
              <img
                src={vehicle.images[activeImageIdx]?.url || vehicle.images[0]?.url}
                alt={vehicle.model}
                className="h-64 w-full object-cover"
              />
            </div>
            {vehicle.images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {vehicle.images.map((img, i) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveImageIdx(i)}
                    className={`overflow-hidden rounded-lg border transition ${
                      activeImageIdx === i
                        ? 'border-champagne ring-1 ring-champagne'
                        : 'border-obsidian-border opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt={img.caption} className="h-14 w-24 object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Key Specifications */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-obsidian-border bg-obsidian p-3">
                <span className="text-[11px] text-ivory-subtle">Transmission</span>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-ivory">
                  <Gauge className="h-3.5 w-3.5 text-champagne" />
                  {vehicle.transmission === 'Automatic' ? 'Automatique' : 'Manuelle'}
                </p>
              </div>
              <div className="rounded-xl border border-obsidian-border bg-obsidian p-3">
                <span className="text-[11px] text-ivory-subtle">Motorisation</span>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-ivory">
                  <Fuel className="h-3.5 w-3.5 text-champagne" />
                  {vehicle.fuelType}
                </p>
              </div>
              <div className="rounded-xl border border-obsidian-border bg-obsidian p-3">
                <span className="text-[11px] text-ivory-subtle">Capacité</span>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-ivory">
                  <Users className="h-3.5 w-3.5 text-champagne" />
                  {vehicle.seats} Places
                </p>
              </div>
              <div className="rounded-xl border border-obsidian-border bg-obsidian p-3">
                <span className="text-[11px] text-ivory-subtle">Bagages</span>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-ivory">
                  <Briefcase className="h-3.5 w-3.5 text-champagne" />
                  {vehicle.luggage} Valises
                </p>
              </div>
            </div>

            {/* Availability Calendar */}
            <div className="mt-5 rounded-xl border border-obsidian-border bg-obsidian p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-ivory">
                  <Calendar className="h-4 w-4 text-champagne" />
                  Calendrier de Disponibilité (14 prochains jours)
                </span>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" /> Libre
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <span className="h-2 w-2 rounded-full bg-amber-400" /> Réservé
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((day) => (
                  <div
                    key={day.dateLabel}
                    className={`rounded-lg border px-2 py-1.5 text-center font-mono text-[11px] ${
                      day.status === 'available'
                        ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300'
                        : 'border-amber-500/30 bg-amber-950/30 text-amber-300 line-through'
                    }`}
                  >
                    {day.dateLabel}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Pricing Matrix, Insurance, Conditions */}
          <div className="flex flex-col justify-between lg:col-span-5">
            <div className="space-y-4">
              {/* Configurable Daily / Weekly / Monthly / Seasonal Pricing */}
              <div className="rounded-xl border border-champagne/30 bg-obsidian p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-champagne">
                  Grille Tarifaire (MAD TTC)
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  <div className="rounded-lg border border-obsidian-border bg-obsidian-card p-2.5">
                    <span className="text-[11px] text-ivory-subtle">Tarif Journalier</span>
                    <p className="font-mono text-lg font-bold text-ivory">
                      {vehicle.dailyPriceMad} <span className="text-xs text-champagne">MAD/j</span>
                    </p>
                  </div>
                  <div className="rounded-lg border border-obsidian-border bg-obsidian-card p-2.5">
                    <span className="text-[11px] text-ivory-subtle">
                      Semaine (-{vehicle.weeklyDiscountPct}%)
                    </span>
                    <p className="font-mono text-lg font-bold text-champagne">
                      {weeklyDailyMad} <span className="text-xs">MAD/j</span>
                    </p>
                  </div>
                  <div className="rounded-lg border border-obsidian-border bg-obsidian-card p-2.5">
                    <span className="text-[11px] text-ivory-subtle">
                      Mensuel (-{vehicle.monthlyDiscountPct}%)
                    </span>
                    <p className="font-mono text-lg font-bold text-emerald-400">
                      {monthlyDailyMad} <span className="text-xs">MAD/j</span>
                    </p>
                  </div>
                  <div className="rounded-lg border border-obsidian-border bg-obsidian-card p-2.5">
                    <span className="text-[11px] text-ivory-subtle">Haute Saison Été</span>
                    <p className="font-mono text-lg font-bold text-ivory-muted">
                      {highSeasonDailyMad} <span className="text-xs">MAD/j</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Deposit, Mileage & Insurance */}
              <div className="rounded-xl border border-obsidian-border bg-obsidian p-4 text-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-obsidian-border pb-2">
                  <span className="text-ivory-muted">Caution remboursable :</span>
                  <span className="font-mono font-bold text-champagne">
                    {vehicle.depositMad.toLocaleString()} MAD
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-obsidian-border pb-2">
                  <span className="text-ivory-muted">Politique kilométrique :</span>
                  <span className="font-semibold text-ivory">{vehicle.mileagePolicy}</span>
                </div>
                <div className="flex items-center justify-between border-b border-obsidian-border pb-2">
                  <span className="text-ivory-muted">Âge minimum requis :</span>
                  <span className="font-semibold text-ivory">{vehicle.minDriverAge} ans</span>
                </div>
                <div>
                  <span className="flex items-center gap-1.5 font-semibold text-ivory">
                    <Shield className="h-3.5 w-3.5 text-champagne" />
                    Couverture d&apos;assurance incluse :
                  </span>
                  <p className="mt-1 text-ivory-muted">{vehicle.insuranceCoverage}</p>
                </div>
              </div>

              {/* Equipment & Rental Conditions */}
              <div className="rounded-xl border border-obsidian-border bg-obsidian p-4 text-xs">
                <h4 className="mb-2 font-semibold text-ivory">Équipements & Conditions :</h4>
                <ul className="space-y-1.5 text-ivory-muted">
                  {vehicle.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-champagne" />
                      <span>{feat}</span>
                    </li>
                  ))}
                  {vehicle.airportDeliveryAvailable && (
                    <li className="flex items-center gap-2 text-champagne">
                      <Plane className="h-3.5 w-3.5 shrink-0" />
                      <span>Livraison disponible à RBA, CMN, TNG et Gare LGV Kénitra</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-obsidian-border px-4 py-3 text-xs font-semibold text-ivory-muted hover:text-ivory"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectForBooking(vehicle);
                  onClose();
                }}
                className="flex-1 rounded-xl bg-gradient-to-r from-champagne to-champagne-light py-3 text-xs font-bold uppercase tracking-wider text-obsidian shadow-gold-glow hover:brightness-110"
              >
                Réserver ce véhicule maintenant
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
