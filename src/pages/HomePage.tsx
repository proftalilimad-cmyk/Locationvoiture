import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plane,
  ShieldCheck,
  Car,
  Award,
  ArrowRight,
  Users,
  Briefcase,
  Gauge,
  Fuel,
  CheckCircle2,
  MapPin,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { BookingSearchWidget } from '../components/BookingSearchWidget';
import { Showroom3D } from '../components/Showroom3D';
import { VehicleDetailModal } from '../components/VehicleDetailModal';
import { Vehicle, VehicleCategoryCode } from '../types/domain';
import { LOCAL_SEO_ROUTES } from '../components/Footer';

export const HomePage: React.FC = () => {
  const { db, t, setSelectedVehicleForBooking } = usePlatform();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategoryCode | 'ALL'>('ALL');
  const [detailVehicle, setDetailVehicle] = useState<Vehicle | null>(null);

  const categories: Array<VehicleCategoryCode | 'ALL'> = [
    'ALL',
    'Economy',
    'Compact',
    'Sedan',
    'SUV',
    'Family',
    'Premium',
    'Luxury',
  ];

  const visibleVehicles = db.vehicles
    .filter((v) => v.status !== 'archived')
    .filter((v) => (selectedCategory === 'ALL' ? true : v.category === selectedCategory));

  const handleSelectForBooking = (vehicle: Vehicle) => {
    setSelectedVehicleForBooking(vehicle);
    navigate('/book');
  };

  return (
    <div className="min-h-screen bg-obsidian text-ivory">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden border-b border-obsidian-border bg-gradient-to-b from-obsidian via-obsidian-light to-obsidian pb-16 pt-10 lg:pt-14">
        {/* Subtle Champagne-Gold Radial Glow */}
        <div
          className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[960px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{
            background: `radial-gradient(circle, ${db.companySettings.primaryColorHex} 0%, transparent 70%)`,
          }}
        />

        <div className="mx-auto max-w-7xl px-4">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            {/* Hero Copy & CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="lg:col-span-6"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-champagne/40 bg-champagne/10 px-3.5 py-1 font-mono text-[11px] font-semibold tracking-wider text-champagne">
                <Award className="h-3.5 w-3.5" />
                {t.hero.badge}
              </span>

              <h1 className="mt-5 font-serif text-4xl font-bold leading-tight tracking-tight text-ivory sm:text-5xl lg:text-6xl">
                {t.hero.headline}
              </h1>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-ivory-muted sm:text-lg">
                {t.hero.subtitle}
              </p>

              {/* Primary & Secondary CTAs */}
              <div className="mt-7 flex flex-wrap items-center gap-3.5">
                <Link
                  to="/book"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-champagne to-champagne-light px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-obsidian shadow-gold-glow transition hover:brightness-110"
                >
                  <Car className="h-4 w-4" />
                  {t.hero.primaryCta}
                </Link>

                <Link
                  to="/airport-chauffeur"
                  className="inline-flex items-center gap-2 rounded-xl border border-champagne/50 bg-obsidian-card/80 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-champagne transition hover:bg-champagne/15"
                >
                  <Plane className="h-4 w-4" />
                  {t.hero.secondaryCta}
                </Link>
              </div>

              {/* Trust Pillars */}
              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[t.hero.trust1, t.hero.trust2, t.hero.trust3].map((pill, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-xl border border-obsidian-border bg-obsidian-card/60 px-3 py-2 text-xs text-ivory-muted"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-champagne" />
                    <span>{pill}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* 3D & Studio Luxury Vehicle Showcase */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-6"
            >
              <Showroom3D
                primaryVehicleImage="/vehicles/mercedes-classe-s-500-amg-2025.svg"
                primaryVehicleName="Mercedes-Benz Classe S 500 L AMG Executive (2025)"
                accentColor={db.companySettings.primaryColorHex}
              />
            </motion.div>
          </div>

          {/* Prominent Booking Search Engine Directly Inside Hero */}
          <div className="mt-10">
            <BookingSearchWidget />
          </div>
        </div>
      </section>

      {/* 2. FLEET CATALOGUE PREVIEW */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-champagne">
              Catalogue Kénitra Prestige
            </span>
            <h2 className="mt-1 font-serif text-3xl font-bold text-ivory">{t.fleet.title}</h2>
            <p className="mt-2 max-w-2xl text-sm text-ivory-muted">{t.fleet.subtitle}</p>
          </div>
          <Link
            to="/fleet"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-champagne hover:underline"
          >
            Voir toute la flotte & les filtres <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Category Filter Pills */}
        <div className="mt-6 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                selectedCategory === cat
                  ? 'bg-champagne text-obsidian shadow-gold-glow'
                  : 'border border-obsidian-border bg-obsidian-card text-ivory-muted hover:border-champagne/40 hover:text-ivory'
              }`}
            >
              {cat === 'ALL' ? t.fleet.allCategories : cat}
            </button>
          ))}
        </div>

        {/* Vehicle Cards Grid */}
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibleVehicles.slice(0, 6).map((vehicle) => {
            const weeklyRate = Math.round(
              vehicle.dailyPriceMad * (1 - vehicle.weeklyDiscountPct / 100)
            );
            return (
              <div
                key={vehicle.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-obsidian-border bg-obsidian-card transition hover:border-champagne/50 hover:shadow-gold-glow"
              >
                <div>
                  <div className="relative overflow-hidden bg-obsidian">
                    <img
                      src={vehicle.images[0]?.url}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-obsidian/90 px-3 py-1 font-mono text-[11px] font-bold text-champagne backdrop-blur">
                        {vehicle.category} • {vehicle.year}
                      </span>
                      {vehicle.isDemoData && (
                        <span className="rounded bg-obsidian/90 px-2 py-1 font-mono text-[10px] text-ivory-muted">
                          {t.fleet.demoBadge}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-serif text-lg font-bold text-ivory">
                      {vehicle.brand} {vehicle.model}
                    </h3>

                    {/* Spec Badges */}
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
                        {vehicle.seats} pl.
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-obsidian px-2.5 py-1">
                        <Briefcase className="h-3.5 w-3.5 text-champagne" />
                        {vehicle.luggage} bag.
                      </span>
                    </div>

                    {/* Pricing & Deposit */}
                    <div className="mt-4 flex items-baseline justify-between border-t border-obsidian-border pt-4">
                      <div>
                        <span className="font-mono text-2xl font-bold text-champagne">
                          {vehicle.dailyPriceMad} MAD
                        </span>
                        <span className="text-xs text-ivory-subtle"> {t.fleet.perDay}</span>
                        <p className="font-mono text-[11px] text-emerald-400">
                          Dès {weeklyRate} MAD/j à la semaine
                        </p>
                      </div>
                      <div className="text-right text-[11px] text-ivory-subtle">
                        <span className="block">{t.fleet.depositLabel}</span>
                        <span className="font-mono font-semibold text-ivory">
                          {vehicle.depositMad.toLocaleString()} MAD
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
                    className="rounded-xl border border-obsidian-border px-3.5 py-2.5 text-xs font-semibold text-ivory-muted transition hover:border-champagne/40 hover:text-ivory"
                  >
                    {t.fleet.detailsBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectForBooking(vehicle)}
                    className="flex-1 rounded-xl bg-champagne py-2.5 text-xs font-bold text-obsidian transition hover:brightness-110"
                  >
                    {t.fleet.bookVehicle}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. SIGNATURE AIRPORT PICKUP & PRIVATE CHAUFFEUR SERVICES */}
      <section className="border-y border-obsidian-border bg-obsidian-light py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="font-mono text-xs font-semibold uppercase tracking-widest text-champagne">
                Service Signature Kénitra Prestige
              </span>
              <h2 className="mt-1 font-serif text-3xl font-bold text-ivory">
                4 Services Aéroport & Chauffeur Privé Sur-Mesure
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-ivory-muted">
                Distinction claire entre la location en conduite libre livrée à votre terminal et le
                transport exécutif avec chauffeur professionnel.
              </p>
            </div>
            <Link
              to="/airport-chauffeur"
              className="rounded-xl bg-champagne px-5 py-3 text-xs font-bold uppercase tracking-wider text-obsidian shadow-gold-glow"
            >
              Simuler un tarif Aéroport / Chauffeur
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                code: 'A',
                title: 'Livraison Véhicule à l’Aéroport',
                subtitle: 'Conduite Libre (Self-Drive)',
                desc: 'Un agent livre votre voiture de location directement à l’aéroport Rabat-Salé (RBA), Casablanca (CMN), Tanger (TNG) ou Gare LGV Kénitra.',
                price: 'Dès 100 MAD',
              },
              {
                code: 'B',
                title: 'Accueil VIP Meet & Greet',
                subtitle: 'Remise Prioritaire Terminal',
                desc: 'Votre agent vous accueille dès la sortie douane avec pancarte nominative, porte vos bagages et effectue la remise express sur tablette.',
                price: 'Option +120 MAD',
              },
              {
                code: 'C',
                title: 'Transfert Privé Aéroport',
                subtitle: 'Avec Chauffeur Professionnel',
                desc: 'Un chauffeur bilingue en costume vous conduit en Berline Exécutive, SUV ou Van Classe V entre l’aéroport et votre adresse à Kénitra.',
                price: 'Dès 450 MAD (RBA)',
              },
              {
                code: 'D',
                title: 'Mise à Disposition Chauffeur',
                subtitle: 'Demi-journée, Journée ou Séjour',
                desc: 'Réservez un véhicule de prestige avec chauffeur dédié pour vos rendez-vous ministériels, Atlantic Free Zone ou déplacements inter-villes.',
                price: 'Dès 650 MAD / jour',
              },
            ].map((srv) => (
              <div
                key={srv.code}
                className="flex flex-col justify-between rounded-2xl border border-obsidian-border bg-obsidian p-5 transition hover:border-champagne/50"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-champagne/15 font-mono text-xs font-bold text-champagne">
                      {srv.code}
                    </span>
                    <span className="font-mono text-xs font-semibold text-champagne">
                      {srv.price}
                    </span>
                  </div>
                  <h3 className="mt-4 font-serif text-lg font-bold text-ivory">{srv.title}</h3>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-champagne">
                    {srv.subtitle}
                  </span>
                  <p className="mt-2.5 text-xs leading-relaxed text-ivory-muted">{srv.desc}</p>
                </div>

                <Link
                  to="/airport-chauffeur"
                  className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-champagne hover:underline"
                >
                  Réserver ce service <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>

          {/* Distance & Time Telemetry Bar */}
          <div className="mt-8 grid gap-4 rounded-2xl border border-obsidian-border bg-obsidian p-5 sm:grid-cols-2 lg:grid-cols-4">
            {db.companySettings.airportRates.map((rate) => (
              <div key={rate.airportCode} className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-champagne/10 font-mono text-xs font-bold text-champagne">
                  {rate.airportCode === 'KENITRA_TGV' ? 'TGV' : rate.airportCode}
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-ivory">{rate.airportNameFr}</p>
                  <p className="flex items-center gap-2 font-mono text-[11px] text-ivory-subtle">
                    <MapPin className="h-3 w-3 text-champagne" /> {rate.distanceToKenitraKm} km •{' '}
                    <Clock className="h-3 w-3 text-champagne" /> ~{rate.estimatedMinutes} min
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FAQ & LOCAL SEO HUB */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-champagne">
              Questions Fréquentes
            </span>
            <h2 className="mt-1 font-serif text-2xl font-bold text-ivory">
              Tout savoir sur votre location à Kénitra
            </h2>
            <div className="mt-6 space-y-3">
              {db.companySettings.faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-obsidian-border bg-obsidian-card p-5"
                >
                  <h3 className="flex items-start gap-2.5 text-sm font-semibold text-ivory">
                    <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-champagne" />
                    <span>{faq.questionFr}</span>
                  </h3>
                  <p className="mt-2 pl-6 text-xs leading-relaxed text-ivory-muted">
                    {faq.answerFr}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-champagne/30 bg-obsidian-card p-6">
              <span className="font-mono text-xs font-semibold uppercase tracking-widest text-champagne">
                Référencement Local & Mobilité Régionale
              </span>
              <h3 className="mt-1 font-serif text-xl font-bold text-ivory">
                Nos points de prise en charge dédiés
              </h3>
              <p className="mt-2 text-xs text-ivory-muted">
                Accédez directement aux pages optimisées par destination et type de service :
              </p>
              <div className="mt-4 space-y-2">
                {LOCAL_SEO_ROUTES.map((item) => (
                  <Link
                    key={item.slug}
                    to={`/seo/${item.slug}`}
                    className="flex items-center justify-between rounded-xl border border-obsidian-border bg-obsidian px-4 py-2.5 text-xs font-medium text-ivory transition hover:border-champagne/50 hover:text-champagne"
                  >
                    <span>{item.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-champagne" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <VehicleDetailModal
        vehicle={detailVehicle}
        onClose={() => setDetailVehicle(null)}
        onSelectForBooking={handleSelectForBooking}
      />
    </div>
  );
};
