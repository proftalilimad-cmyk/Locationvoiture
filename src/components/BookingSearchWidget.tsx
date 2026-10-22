import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Clock,
  User,
  Plane,
  ShieldCheck,
  Search,
  AlertCircle,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';

interface BookingSearchWidgetProps {
  onSearchComplete?: () => void;
  compact?: boolean;
}

export const BookingSearchWidget: React.FC<BookingSearchWidgetProps> = ({
  onSearchComplete,
  compact = false,
}) => {
  const { db, language, t, searchCriteria, setSearchCriteria } = usePlatform();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getLocationName = (loc: (typeof db.locations)[number]) => {
    if (language === 'ar') return loc.nameAr;
    if (language === 'en') return loc.nameEn;
    return loc.nameFr;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!searchCriteria.pickupLocationCode || !searchCriteria.returnLocationCode) {
      setErrorMsg('Veuillez sélectionner un lieu de prise en charge et de restitution.');
      return;
    }

    const pickupIso = `${searchCriteria.pickupDate}T${searchCriteria.pickupTime}:00.000Z`;
    const returnIso = `${searchCriteria.returnDate}T${searchCriteria.returnTime}:00.000Z`;
    const pMs = new Date(pickupIso).getTime();
    const rMs = new Date(returnIso).getTime();

    if (Number.isNaN(pMs) || Number.isNaN(rMs) || rMs <= pMs) {
      setErrorMsg('La date et l’heure de retour doivent être postérieures à la date de départ.');
      return;
    }

    if (searchCriteria.driverAge < 21 && !searchCriteria.withChauffeur) {
      setErrorMsg(
        'L’âge minimum en conduite libre est de 21 ans. Pour les moins de 21 ans, activez l’option "Avec Chauffeur Privé".'
      );
      return;
    }

    if (onSearchComplete) {
      onSearchComplete();
    } else {
      navigate('/fleet');
    }
  };

  return (
    <form
      onSubmit={handleSearchSubmit}
      className={`rounded-2xl border border-champagne/35 bg-obsidian-light/85 p-5 shadow-glass backdrop-blur-xl ${
        compact ? '' : 'md:p-7'
      }`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-obsidian-border pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-champagne" />
          <h2 className="font-serif text-sm font-semibold tracking-wide text-ivory sm:text-base">
            {t.search.title}
          </h2>
        </div>
        <span className="font-mono text-[11px] text-champagne">
          Ville par défaut : Kénitra • Disponibilité Serveur Temps Réel
        </span>
      </div>

      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-2.5 text-xs text-red-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Pickup Location */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ivory-muted">
            <MapPin className="h-3.5 w-3.5 text-champagne" />
            {t.search.pickupLocation}
          </label>
          <select
            value={searchCriteria.pickupLocationCode}
            onChange={(e) => {
              const code = e.target.value;
              const isAirport = ['RBA', 'CMN', 'TNG'].includes(code);
              setSearchCriteria((prev) => ({
                ...prev,
                pickupLocationCode: code,
                airportDelivery: isAirport ? true : prev.airportDelivery,
              }));
            }}
            className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3 py-2.5 text-xs text-ivory focus:border-champagne focus:outline-none"
          >
            {db.locations.map((loc) => (
              <option key={loc.code} value={loc.code}>
                {getLocationName(loc)} {loc.deliveryFeeMad > 0 ? `(+${loc.deliveryFeeMad} MAD)` : '(Gratuit)'}
              </option>
            ))}
          </select>
        </div>

        {/* Return Location */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ivory-muted">
            <MapPin className="h-3.5 w-3.5 text-champagne" />
            {t.search.returnLocation}
          </label>
          <select
            value={searchCriteria.returnLocationCode}
            onChange={(e) =>
              setSearchCriteria((prev) => ({ ...prev, returnLocationCode: e.target.value }))
            }
            className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3 py-2.5 text-xs text-ivory focus:border-champagne focus:outline-none"
          >
            {db.locations.map((loc) => (
              <option key={loc.code} value={loc.code}>
                {getLocationName(loc)}
              </option>
            ))}
          </select>
        </div>

        {/* Pickup Date & Time */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-ivory-muted">
              <Calendar className="h-3.5 w-3.5 text-champagne" />
              {t.search.pickupDate}
            </label>
            <input
              type="date"
              value={searchCriteria.pickupDate}
              onChange={(e) =>
                setSearchCriteria((prev) => ({ ...prev, pickupDate: e.target.value }))
              }
              className="w-full rounded-xl border border-obsidian-border bg-obsidian px-2.5 py-2.5 font-mono text-xs text-ivory focus:border-champagne focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-ivory-muted">
              <Clock className="h-3.5 w-3.5 text-champagne" />
              {t.search.pickupTime}
            </label>
            <input
              type="time"
              value={searchCriteria.pickupTime}
              onChange={(e) =>
                setSearchCriteria((prev) => ({ ...prev, pickupTime: e.target.value }))
              }
              className="w-full rounded-xl border border-obsidian-border bg-obsidian px-2 py-2.5 font-mono text-xs text-ivory focus:border-champagne focus:outline-none"
            />
          </div>
        </div>

        {/* Return Date & Time */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-ivory-muted">
              <Calendar className="h-3.5 w-3.5 text-champagne" />
              {t.search.returnDate}
            </label>
            <input
              type="date"
              value={searchCriteria.returnDate}
              onChange={(e) =>
                setSearchCriteria((prev) => ({ ...prev, returnDate: e.target.value }))
              }
              className="w-full rounded-xl border border-obsidian-border bg-obsidian px-2.5 py-2.5 font-mono text-xs text-ivory focus:border-champagne focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-ivory-muted">
              <Clock className="h-3.5 w-3.5 text-champagne" />
              {t.search.returnTime}
            </label>
            <input
              type="time"
              value={searchCriteria.returnTime}
              onChange={(e) =>
                setSearchCriteria((prev) => ({ ...prev, returnTime: e.target.value }))
              }
              className="w-full rounded-xl border border-obsidian-border bg-obsidian px-2 py-2.5 font-mono text-xs text-ivory focus:border-champagne focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Bottom Row: Driver Age, Airport Delivery Toggle, Chauffeur Toggle & Submit */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-obsidian-border pt-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Driver Age */}
          <div className="flex items-center gap-2 rounded-xl border border-obsidian-border bg-obsidian px-3 py-2">
            <User className="h-4 w-4 text-champagne" />
            <span className="text-xs text-ivory-muted">{t.search.driverAge} :</span>
            <input
              type="number"
              min={18}
              max={85}
              value={searchCriteria.driverAge}
              onChange={(e) =>
                setSearchCriteria((prev) => ({
                  ...prev,
                  driverAge: Number(e.target.value) || 25,
                }))
              }
              className="w-14 rounded bg-obsidian-card px-2 py-0.5 text-center font-mono text-xs font-bold text-champagne focus:outline-none"
            />
            <span className="text-xs text-ivory-subtle">ans</span>
          </div>

          {/* Airport Delivery Option */}
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2 text-xs text-ivory transition hover:border-champagne/50">
            <input
              type="checkbox"
              checked={searchCriteria.airportDelivery}
              onChange={(e) =>
                setSearchCriteria((prev) => ({ ...prev, airportDelivery: e.target.checked }))
              }
              className="h-4 w-4 accent-champagne"
            />
            <Plane className="h-3.5 w-3.5 text-champagne" />
            <span>{t.search.airportDelivery}</span>
          </label>

          {/* Chauffeur Service Option */}
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2 text-xs text-ivory transition hover:border-champagne/50">
            <input
              type="checkbox"
              checked={searchCriteria.withChauffeur}
              onChange={(e) =>
                setSearchCriteria((prev) => ({ ...prev, withChauffeur: e.target.checked }))
              }
              className="h-4 w-4 accent-champagne"
            />
            <ShieldCheck className="h-3.5 w-3.5 text-champagne" />
            <span>{t.search.chauffeurService}</span>
          </label>
        </div>

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-champagne to-champagne-light px-6 py-3 text-xs font-bold uppercase tracking-wider text-obsidian shadow-gold-glow transition hover:brightness-110 sm:w-auto"
        >
          <Search className="h-4 w-4" />
          {t.search.submitBtn}
        </button>
      </div>
    </form>
  );
};
