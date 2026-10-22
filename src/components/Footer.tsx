import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Shield,
  Plane,
  Car,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';

export const LOCAL_SEO_ROUTES = [
  { slug: 'location-voiture-kenitra', label: 'Location voiture Kénitra' },
  { slug: 'location-voiture-gare-kenitra', label: 'Location voiture gare Kénitra (TGV)' },
  { slug: 'location-voiture-aeroport-rabat-sale', label: 'Location voiture aéroport Rabat-Salé' },
  { slug: 'location-voiture-aeroport-casablanca', label: 'Location voiture aéroport Casablanca' },
  { slug: 'transfert-aeroport-casablanca-kenitra', label: 'Transfert aéroport Casablanca Kénitra' },
  { slug: 'transfert-aeroport-rabat-kenitra', label: 'Transfert aéroport Rabat Kénitra' },
  { slug: 'location-suv-kenitra', label: 'Location SUV Kénitra' },
  { slug: 'location-voiture-automatique-kenitra', label: 'Location voiture automatique Kénitra' },
  { slug: 'location-voiture-avec-chauffeur-kenitra', label: 'Location voiture avec chauffeur Kénitra' },
];

export const Footer: React.FC = () => {
  const { db, t } = usePlatform();
  const cleanWhatsapp = db.companySettings.whatsapp.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
    `Bonjour ${db.companySettings.brandName}, je souhaite obtenir des informations pour une réservation de véhicule / transfert aéroport à Kénitra.`
  )}`;

  return (
    <>
      <footer className="border-t border-obsidian-border bg-obsidian-light pb-24 pt-16 text-ivory-muted md:pb-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {/* Brand Column */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-champagne/50 bg-obsidian font-serif text-sm font-bold text-champagne">
                  {db.companySettings.logoText}
                </div>
                <span className="font-serif text-lg font-bold text-ivory">
                  {db.companySettings.brandName}
                </span>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-ivory-muted">
                {db.companySettings.brandTaglineFr}
              </p>
              <div className="space-y-2 text-xs text-ivory-subtle">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-champagne" />
                  <span>{db.companySettings.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-champagne" />
                  <span>{db.companySettings.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-champagne" />
                  <span>{db.companySettings.email}</span>
                </div>
              </div>
            </div>

            {/* Navigation & Services */}
            <div>
              <h3 className="mb-4 font-serif text-sm font-semibold uppercase tracking-wider text-champagne">
                Services Signature
              </h3>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link to="/fleet" className="hover:text-champagne transition flex items-center gap-2">
                    <Car className="h-3.5 w-3.5 text-champagne" />
                    Catalogue Flotte Kénitra
                  </Link>
                </li>
                <li>
                  <Link
                    to="/airport-chauffeur"
                    className="hover:text-champagne transition flex items-center gap-2"
                  >
                    <Plane className="h-3.5 w-3.5 text-champagne" />
                    Livraison & Accueil VIP Aéroport
                  </Link>
                </li>
                <li>
                  <Link
                    to="/airport-chauffeur"
                    className="hover:text-champagne transition flex items-center gap-2"
                  >
                    <Shield className="h-3.5 w-3.5 text-champagne" />
                    Chauffeur Privé & Transfert RBA / CMN
                  </Link>
                </li>
                <li>
                  <Link to="/account" className="hover:text-champagne transition">
                    Espace Client & Contrats PDF
                  </Link>
                </li>
                <li>
                  <Link to="/admin" className="hover:text-champagne transition">
                    Portail Opérationnel Admin (/admin)
                  </Link>
                </li>
              </ul>
            </div>

            {/* Local SEO Pages Directory */}
            <div className="lg:col-span-2">
              <h3 className="mb-4 font-serif text-sm font-semibold uppercase tracking-wider text-champagne">
                Destinations & Pages Locales Kénitra — Rabat — Casablanca
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {LOCAL_SEO_ROUTES.map((route) => (
                  <Link
                    key={route.slug}
                    to={`/seo/${route.slug}`}
                    className="flex items-center gap-1.5 rounded border border-obsidian-border/60 bg-obsidian/50 px-3 py-2 text-xs text-ivory-muted transition hover:border-champagne/50 hover:text-champagne"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-champagne" />
                    {route.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Regulatory & Transparency Banner */}
          <div className="mt-10 rounded-xl border border-obsidian-border bg-obsidian p-4 text-xs text-ivory-subtle">
            <p className="mb-1 font-medium text-ivory-muted">
              Conformité Réglementaire & Transparence Opérationnelle :
            </p>
            <p>{db.companySettings.transportLicenseNotice}</p>
            <p className="mt-1 text-[11px]">
              Passerelle monétique :{' '}
              <span className="font-mono text-champagne">
                {db.companySettings.paymentGatewayLive
                  ? 'Production Active'
                  : 'Mode Sandbox Sécurisé (Aucun débit réel sans identifiants marchands)'}
              </span>{' '}
              • Suivi des vols :{' '}
              <span className="font-mono text-champagne">
                {db.companySettings.flightApiConnected
                  ? 'API Temps Réel Connectée'
                  : 'Suivi Opérationnel Manuel par le Dispatch'}
              </span>{' '}
              • WhatsApp Business API :{' '}
              <span className="font-mono text-champagne">
                {db.companySettings.whatsappApiConnected
                  ? 'Envoi Automatique Cloud API Actif'
                  : 'Lien Direct Pré-rempli Actif (API Automatique en attente de clé)'}
              </span>
            </p>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-obsidian-border/60 pt-6 text-xs text-ivory-subtle sm:flex-row">
            <p>
              © {new Date().getFullYear()} {db.companySettings.brandName} — Kénitra, Royaume du Maroc.
              Tous droits réservés.
            </p>
            <div className="flex items-center gap-4">
              <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="hover:text-champagne">
                Sitemap XML
              </a>
              <Link to="/account" className="hover:text-champagne">
                Gestion des réservations
              </Link>
              <Link to="/admin" className="hover:text-champagne">
                Administration
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Concierge Button (Desktop & Mobile) */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contact Conciergerie WhatsApp"
        className="fixed bottom-20 right-5 z-40 flex items-center gap-2.5 rounded-full border border-emerald-400/40 bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-xl transition hover:scale-105 hover:bg-emerald-500 md:bottom-6"
      >
        <MessageCircle className="h-5 w-5 fill-current" />
        <span className="hidden sm:inline">{t.common.whatsappCta}</span>
      </a>

      {/* Sticky Mobile-First Conversion Bar (Section 14) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between border-t border-obsidian-border bg-obsidian/95 px-4 py-3 backdrop-blur-lg md:hidden">
        <div>
          <span className="block text-[10px] uppercase tracking-wider text-champagne">
            Dès 340 MAD / jour
          </span>
          <span className="text-xs font-semibold text-ivory">Kénitra & Aéroports RBA/CMN</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-emerald-500/50 bg-emerald-600/20 px-3 py-2 text-xs font-semibold text-emerald-300"
          >
            WhatsApp
          </a>
          <Link
            to="/book"
            className="flex items-center gap-1.5 rounded-lg bg-champagne px-4 py-2 text-xs font-bold text-obsidian"
          >
            <Calendar className="h-3.5 w-3.5" />
            Réserver
          </Link>
        </div>
      </div>
    </>
  );
};
