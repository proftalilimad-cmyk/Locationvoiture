import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Filter,
  Users,
  Briefcase,
  Gauge,
  Fuel,
  Shield,
  CheckCircle2,
  XCircle,
  Plane,
  ArrowUpDown,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { BookingSearchWidget } from '../components/BookingSearchWidget';
import { VehicleDetailModal } from '../components/VehicleDetailModal';
import { Vehicle, VehicleCategoryCode } from '../types/domain';

export const FleetPage: React.FC = () => {
  const { searchVehicles, searchCriteria, setSelectedVehicleForBooking, t } = usePlatform();
  const navigate = useNavigate();

  const [results, setResults] = useState<
    Array<Vehicle & { availability: { available: boolean; reason?: string } }>
  >([]);
  const [category, setCategory] = useState<VehicleCategoryCode | 'ALL'>('ALL');
  const [transmission, setTransmission] = useState<'Automatic' | 'Manual' | 'ALL'>('ALL');
  const [brandFilter, setBrandFilter] = useState<string>('ALL');
  const [maxPriceMad, setMaxPriceMad] = useState<number>(4000);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'year_desc'>('price_asc');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [detailVehicle, setDetailVehicle] = useState<Vehicle | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const runSearch = useCallback(async () => {
    setErrorMsg(null);
    try {
      const list = await searchVehicles({
        category,
        transmission,
        maxDailyPriceMad: maxPriceMad,
      });
      setResults(list);
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  }, [searchVehicles, category, transmission, maxPriceMad]);

  useEffect(() => {
    runSearch();
  }, [runSearch, searchCriteria]);

  const brands = Array.from(new Set(results.map((v) => v.brand)));

  const filteredAndSorted = results
    .filter((v) => (brandFilter === 'ALL' ? true : v.brand === brandFilter))
    .filter((v) => (onlyAvailable ? v.availability.available : true))
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.dailyPriceMad - b.dailyPriceMad;
      if (sortBy === 'price_desc') return b.dailyPriceMad - a.dailyPriceMad;
      return b.year - a.year;
    });

  const handleBookVehicle = (vehicle: Vehicle & { availability: { available: boolean; reason?: string } }) => {
    if (!vehicle.availability.available) return;
    setSelectedVehicleForBooking(vehicle);
    navigate('/book');
  };

  return (
    <div className="min-h-screen bg-obsidian pb-20 pt-8 text-ivory">
      <div className="mx-auto max-w-7xl px-4">
        {/* Page Header */}
        <div className="mb-6">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-champagne">
            Catalogue & Disponibilités Kénitra
          </span>
          <h1 className="mt-1 font-serif text-3xl font-bold text-ivory sm:text-4xl">
            {t.fleet.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ivory-muted">{t.fleet.subtitle}</p>
        </div>

        {/* Search Engine Bar */}
        <BookingSearchWidget onSearchComplete={runSearch} compact />

        {errorMsg && (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-xs text-red-200">
            {errorMsg}
          </div>
        )}

        {/* Filters & Sorting Bar */}
        <div className="mt-8 rounded-2xl border border-obsidian-border bg-obsidian-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Category Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Filter className="mr-1 h-4 w-4 text-champagne" />
              {(
                [
                  'ALL',
                  'Economy',
                  'Compact',
                  'Sedan',
                  'SUV',
                  'Family',
                  'Premium',
                  'Luxury',
                ] as const
              ).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    category === cat
                      ? 'bg-champagne text-obsidian'
                      : 'border border-obsidian-border bg-obsidian text-ivory-muted hover:text-ivory'
                  }`}
                >
                  {cat === 'ALL' ? 'Toutes' : cat}
                </button>
              ))}
            </div>

            {/* Brand, Transmission, Max Price, Sort */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <select
                aria-label="Filtrer par marque"
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="rounded-lg border border-obsidian-border bg-obsidian px-3 py-1.5 text-ivory"
              >
                <option value="ALL">Toutes les marques</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filtrer par transmission"
                value={transmission}
                onChange={(e) => setTransmission(e.target.value as typeof transmission)}
                className="rounded-lg border border-obsidian-border bg-obsidian px-3 py-1.5 text-ivory"
              >
                <option value="ALL">Toutes boîtes</option>
                <option value="Automatic">Automatique</option>
                <option value="Manual">Manuelle</option>
              </select>

              <div className="flex items-center gap-2 rounded-lg border border-obsidian-border bg-obsidian px-3 py-1.5">
                <span className="text-ivory-subtle">Budget max :</span>
                <input
                  type="range"
                  min={350}
                  max={4000}
                  step={50}
                  value={maxPriceMad}
                  onChange={(e) => setMaxPriceMad(Number(e.target.value))}
                  className="w-24 accent-champagne"
                />
                <span className="font-mono font-bold text-champagne">{maxPriceMad} MAD</span>
              </div>

              <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-obsidian-border bg-obsidian px-3 py-1.5">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="accent-champagne"
                />
                <span>Disponibles uniquement</span>
              </label>

              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="h-3.5 w-3.5 text-champagne" />
                <select
                  aria-label="Trier les véhicules"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="rounded-lg border border-obsidian-border bg-obsidian px-2.5 py-1.5 text-ivory"
                >
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix décroissant</option>
                  <option value="year_desc">Année la plus récente</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicles Grid */}
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSorted.map((vehicle) => {
            const isAvail = vehicle.availability.available;
            const weeklyRate = Math.round(
              vehicle.dailyPriceMad * (1 - vehicle.weeklyDiscountPct / 100)
            );
            const monthlyRate = Math.round(
              vehicle.dailyPriceMad * (1 - vehicle.monthlyDiscountPct / 100)
            );

            return (
              <div
                key={vehicle.id}
                className={`flex flex-col justify-between overflow-hidden rounded-2xl border transition ${
                  isAvail
                    ? 'border-obsidian-border bg-obsidian-card hover:border-champagne/50 hover:shadow-gold-glow'
                    : 'border-red-900/40 bg-obsidian-card/60 opacity-85'
                }`}
              >
                <div>
                  <div className="relative bg-obsidian">
                    <img
                      src={vehicle.images[0]?.url}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="h-52 w-full object-cover"
                    />
                    <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-obsidian/90 px-3 py-1 font-mono text-[11px] font-bold text-champagne">
                        {vehicle.category} • {vehicle.year}
                      </span>
                      {vehicle.isDemoData && (
                        <span className="rounded bg-obsidian/90 px-2 py-1 font-mono text-[10px] text-ivory-muted">
                          {t.fleet.demoBadge}
                        </span>
                      )}
                    </div>

                    {/* Availability Pill */}
                    <div className="absolute bottom-3 right-3">
                      {isAvail ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-950/90 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Disponible ({searchCriteria.pickupDate} → {searchCriteria.returnDate})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-950/90 px-3 py-1 text-[11px] font-semibold text-red-300">
                          <XCircle className="h-3.5 w-3.5" />
                          Indisponible
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5">
                    <h2 className="font-serif text-lg font-bold text-ivory">
                      {vehicle.brand} {vehicle.model}
                    </h2>

                    {!isAvail && vehicle.availability.reason && (
                      <p className="mt-1.5 rounded-lg border border-red-500/30 bg-red-950/30 px-2.5 py-1.5 text-[11px] text-red-300">
                        {vehicle.availability.reason}
                      </p>
                    )}

                    {/* Specs */}
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-ivory-muted">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-obsidian px-2.5 py-1">
                        <Gauge className="h-3.5 w-3.5 text-champagne" />
                        {vehicle.transmission === 'Automatic' ? 'Automatique' : 'Manuelle'}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-obsidian px-2.5 py-1">
                        <Fuel className="h-3.5 w-3.5 text-champagne" />
                        {vehicle.fuelType}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-obsidian px-2.5 py-1">
                        <Users className="h-3.5 w-3.5 text-champagne" />
                        {vehicle.seats} Places
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-obsidian px-2.5 py-1">
                        <Briefcase className="h-3.5 w-3.5 text-champagne" />
                        {vehicle.luggage} Valises
                      </span>
                    </div>

                    {/* Mileage & Insurance */}
                    <div className="mt-3 space-y-1 text-xs text-ivory-subtle">
                      <p className="flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 text-champagne" />
                        <span>{vehicle.insuranceCoverage}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Plane className="h-3.5 w-3.5 text-champagne" />
                        <span>
                          Kilométrage : <strong className="text-ivory">{vehicle.mileagePolicy}</strong> •
                          Caution :{' '}
                          <strong className="font-mono text-champagne">
                            {vehicle.depositMad.toLocaleString()} MAD
                          </strong>
                        </span>
                      </p>
                    </div>

                    {/* Multi-tier Pricing */}
                    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-obsidian-border pt-3 text-center">
                      <div className="rounded-lg bg-obsidian p-2">
                        <span className="block text-[10px] text-ivory-subtle">Jour</span>
                        <span className="font-mono text-sm font-bold text-champagne">
                          {vehicle.dailyPriceMad} MAD
                        </span>
                      </div>
                      <div className="rounded-lg bg-obsidian p-2">
                        <span className="block text-[10px] text-ivory-subtle">Semaine</span>
                        <span className="font-mono text-sm font-bold text-ivory">
                          {weeklyRate} MAD/j
                        </span>
                      </div>
                      <div className="rounded-lg bg-obsidian p-2">
                        <span className="block text-[10px] text-ivory-subtle">Mois</span>
                        <span className="font-mono text-sm font-bold text-emerald-400">
                          {monthlyRate} MAD/j
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 border-t border-obsidian-border bg-obsidian/50 p-4">
                  <button
                    type="button"
                    onClick={() => setDetailVehicle(vehicle)}
                    className="rounded-xl border border-obsidian-border px-3.5 py-2.5 text-xs font-semibold text-ivory-muted hover:border-champagne/40 hover:text-ivory"
                  >
                    {t.fleet.detailsBtn}
                  </button>
                  <button
                    type="button"
                    disabled={!isAvail}
                    onClick={() => handleBookVehicle(vehicle)}
                    className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition ${
                      isAvail
                        ? 'bg-champagne text-obsidian hover:brightness-110'
                        : 'cursor-not-allowed bg-obsidian-border text-ivory-subtle'
                    }`}
                  >
                    {isAvail ? t.fleet.bookVehicle : t.fleet.unavailable}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <VehicleDetailModal
        vehicle={detailVehicle}
        onClose={() => setDetailVehicle(null)}
        onSelectForBooking={(v) => {
          setSelectedVehicleForBooking(v);
          navigate('/book');
        }}
      />
    </div>
  );
};
