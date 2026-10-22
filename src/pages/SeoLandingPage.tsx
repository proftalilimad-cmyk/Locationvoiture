import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, CheckCircle2, ArrowRight, Plane, Car } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { BookingSearchWidget } from '../components/BookingSearchWidget';
import { LOCAL_SEO_ROUTES } from '../components/Footer';

interface SeoPageContent {
  title: string;
  subtitle: string;
  metaDescription: string;
  defaultLocationCode: string;
  highlights: string[];
  isTransferPage?: boolean;
}

const SEO_CONTENT_MAP: Record<string, SeoPageContent> = {
  'location-voiture-kenitra': {
    title: 'Location Voiture Kénitra — Agence Centre-Ville & Livraison Sur-Mesure',
    subtitle:
      'Réservez votre voiture automatique, berline ou SUV au cœur de Kénitra (Avenue Mohammed V) avec kilométrage illimité et tarifs transparents en MAD.',
    metaDescription:
      'Location voiture Kénitra pas cher et premium : citadines automatiques, berlines Mercedes et SUV. Disponibilité en temps réel et caution séparée.',
    defaultLocationCode: 'KENITRA_CENTRE',
    highlights: [
      'Retrait immédiat à notre agence principale Avenue Mohammed V à Kénitra',
      'Flotte 100% récente (2024–2025) avec boîte automatique et CarPlay',
      'Contrat de location numérique et état des lieux sur tablette en 3 minutes',
    ],
  },
  'location-voiture-gare-kenitra': {
    title: 'Location Voiture Gare de Kénitra (LGV Al Boraq)',
    subtitle:
      'Descendez du train à grande vitesse Al Boraq à la Gare de Kénitra et prenez le volant immédiatement grâce à notre service de remise sur le parvis.',
    metaDescription:
      'Location de voiture à la Gare TGV de Kénitra. Accueil personnalisé dès votre arrivée Al Boraq et remise immédiate des clés.',
    defaultLocationCode: 'KENITRA_TGV',
    highlights: [
      'Accueil personnalisé sur le Parvis Sud de la Gare LGV Kénitra',
      'Synchronisation avec les horaires d’arrivée des trains Al Boraq (Tanger / Casa / Rabat)',
      'Idéal pour vos missions professionnelles vers Atlantic Free Zone Kénitra',
    ],
  },
  'location-voiture-aeroport-rabat-sale': {
    title: 'Location Voiture Aéroport Rabat-Salé (RBA) — Livraison Terminal',
    subtitle:
      'À seulement 35 minutes de Kénitra : votre agent dédié vous accueille au Terminal Arrivées de l’Aéroport Rabat-Salé (RBA) avec votre véhicule prêt à partir.',
    metaDescription:
      'Location voiture Aéroport Rabat-Salé (RBA) avec livraison VIP au terminal et liaison directe vers Kénitra et Rabat.',
    defaultLocationCode: 'RBA',
    highlights: [
      'Aéroport le plus proche de Kénitra (38 km — 35 minutes par autoroute)',
      'Remise des clés directement au parking officiel Terminal 1 de Rabat-Salé',
      'Suivi de votre numéro de vol en cas de retard d’atterrissage',
    ],
  },
  'location-voiture-aeroport-casablanca': {
    title: 'Location Voiture Aéroport Casablanca Mohammed V (CMN)',
    subtitle:
      'Atterrissez à l’Aéroport Casablanca Mohammed V (CMN) et rejoignez Kénitra ou Rabat au volant d’une berline ou d’un SUV premium livré à votre terminal.',
    metaDescription:
      'Location voiture Aéroport Casablanca Mohammed V (CMN) avec livraison Terminal 1 & 2 et retour possible à Kénitra.',
    defaultLocationCode: 'CMN',
    highlights: [
      'Accueil personnalisé 24h/24 aux Terminaux 1 et 2 de l’aéroport CMN',
      'Option Aller Simple : prenez la voiture à CMN et restituez-la à Kénitra Centre',
      'Véhicules équipés de GPS Maroc et Wi-Fi 4G sur demande',
    ],
  },
  'transfert-aeroport-casablanca-kenitra': {
    title: 'Transfert Aéroport Casablanca (CMN) ↔ Kénitra avec Chauffeur Privé',
    subtitle:
      'Voyagez en toute sérénité après votre vol international : votre chauffeur bilingue vous accueille avec pancarte VIP à CMN et vous conduit directement à Kénitra.',
    metaDescription:
      'Transfert privé entre l’Aéroport Casablanca Mohammed V (CMN) et Kénitra en Mercedes Classe S, Classe V ou SUV avec chauffeur.',
    defaultLocationCode: 'CMN',
    isTransferPage: true,
    highlights: [
      'Tarif fixe garanti à l’avance incluant autoroute A1 et parking aéroport CMN',
      'Attente gratuite jusqu’à 60 minutes après l’atterrissage de votre vol',
      'Berlines exécutives Mercedes et Vans VIP 7 places pour familles et délégations',
    ],
  },
  'transfert-aeroport-rabat-kenitra': {
    title: 'Transfert Aéroport Rabat-Salé (RBA) ↔ Kénitra avec Chauffeur',
    subtitle:
      'Liaison rapide en 35 minutes entre l’Aéroport de Rabat-Salé (RBA) et votre hôtel, résidence ou entreprise à Kénitra.',
    metaDescription:
      'Navette privée et transfert VIP entre l’Aéroport Rabat-Salé (RBA) et Kénitra dès 450 MAD.',
    defaultLocationCode: 'RBA',
    isTransferPage: true,
    highlights: [
      'Trajet direct de 35 minutes entre le terminal RBA et Kénitra',
      'Accueil Meet & Greet avec pancarte nominative dès la sortie douane',
      'Service opéré sous autorisation de transport touristique / VTC conforme au Maroc',
    ],
  },
  'location-suv-kenitra': {
    title: 'Location SUV & 4x4 Premium à Kénitra (Touareg, Velar, Cayenne)',
    subtitle:
      'Découvrez notre gamme de SUV familiaux et exécutifs à Kénitra pour vos déplacements professionnels et séjours au Maroc.',
    metaDescription:
      'Location SUV à Kénitra : Volkswagen Touareg, Range Rover Velar et Porsche Cayenne disponibles immédiatement.',
    defaultLocationCode: 'KENITRA_CENTRE',
    highlights: [
      'Confort royal et coffre grand volume pour vos bagages',
      'Transmission automatique et motorisations Diesel ou Hybride récentes',
      'Assurance Tous Risques avec option rachat partiel de franchise',
    ],
  },
  'location-voiture-automatique-kenitra': {
    title: 'Location Voiture Automatique à Kénitra — Confort & Fluidité',
    subtitle:
      '100% de notre flotte à Kénitra est équipée de boîtes automatiques de dernière génération (DSG, 9G-Tronic, BVA) pour une conduite sans effort.',
    metaDescription:
      'Louez une voiture boîte automatique à Kénitra : Dacia Stepway BVA, Golf 8 DSG, Mercedes Classe C 9G-Tronic.',
    defaultLocationCode: 'KENITRA_CENTRE',
    highlights: [
      'Large choix de citadines, compactes et berlines 100% boîte automatique',
      'Tarifs dégressifs dès 7 jours (-12%) et au mois (-25%)',
      'Livraison rapide à Kénitra Centre, Gare LGV et Aéroports',
    ],
  },
  'location-voiture-avec-chauffeur-kenitra': {
    title: 'Location Voiture Avec Chauffeur Privé à Kénitra',
    subtitle:
      'Mise à disposition de véhicules de prestige avec chauffeur professionnel bilingue (Français, Arabe, Anglais) à la demi-journée, journée ou semaine.',
    metaDescription:
      'Location de voiture avec chauffeur à Kénitra pour missions d’affaires, Atlantic Free Zone, événements et transferts.',
    defaultLocationCode: 'KENITRA_CENTRE',
    isTransferPage: true,
    highlights: [
      'Aucune caution de garantie requise pour les formules avec chauffeur',
      'Chauffeurs expérimentés en tenue de ville connaissant parfaitement Kénitra, Rabat et Casa',
      'Idéal pour dirigeants, délégations industrielles et invités VIP',
    ],
  },
};

export const SeoLandingPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { db, setSearchCriteria, setSelectedVehicleForBooking } = usePlatform();
  const navigate = useNavigate();

  const content =
    (slug && SEO_CONTENT_MAP[slug]) || SEO_CONTENT_MAP['location-voiture-kenitra'];

  useEffect(() => {
    document.title = `${content.title} | ${db.companySettings.brandName}`;
    setSearchCriteria((prev) => ({
      ...prev,
      pickupLocationCode: content.defaultLocationCode,
    }));
  }, [content, db.companySettings.brandName, setSearchCriteria]);

  return (
    <div className="min-h-screen bg-obsidian pb-24 pt-10 text-ivory">
      <div className="mx-auto max-w-7xl px-4">
        <div className="rounded-2xl border border-champagne/30 bg-obsidian-card p-6 md:p-10">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-champagne/40 bg-champagne/10 px-3 py-1 font-mono text-xs font-semibold text-champagne">
            <MapPin className="h-3.5 w-3.5" />
            DESTINATION LOCALE OPTIMISÉE • KÉNITRA, MAROC
          </span>

          <h1 className="mt-4 font-serif text-3xl font-bold text-ivory sm:text-4xl">
            {content.title}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-ivory-muted">
            {content.subtitle}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {content.highlights.map((h, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-xl border border-obsidian-border bg-obsidian p-3.5 text-xs text-ivory-muted"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-champagne" />
                <span>{h}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/book"
              className="inline-flex items-center gap-2 rounded-xl bg-champagne px-5 py-3 text-xs font-bold uppercase tracking-wider text-obsidian shadow-gold-glow"
            >
              <Car className="h-4 w-4" />
              Réserver un véhicule maintenant
            </Link>
            <Link
              to="/airport-chauffeur"
              className="inline-flex items-center gap-2 rounded-xl border border-champagne/40 bg-obsidian px-5 py-3 text-xs font-bold uppercase tracking-wider text-champagne"
            >
              <Plane className="h-4 w-4" />
              Simuler un transfert aéroport avec chauffeur
            </Link>
          </div>
        </div>

        {/* Embedded Search Engine */}
        <div className="mt-8">
          <BookingSearchWidget />
        </div>

        {/* Recommended Vehicles for this Local Route */}
        <div className="mt-12">
          <h2 className="font-serif text-2xl font-bold text-ivory">
            Véhicules recommandés pour cette destination
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {db.vehicles.slice(0, 3).map((v) => (
              <div
                key={v.id}
                className="flex flex-col justify-between overflow-hidden rounded-2xl border border-obsidian-border bg-obsidian-card"
              >
                <img
                  src={v.images[0]?.url}
                  alt={v.model}
                  className="h-48 w-full object-cover"
                />
                <div className="p-5">
                  <span className="font-mono text-xs text-champagne">
                    {v.category} • {v.year}
                  </span>
                  <h3 className="mt-1 font-serif text-lg font-bold text-ivory">
                    {v.brand} {v.model}
                  </h3>
                  <p className="mt-2 font-mono text-xl font-bold text-champagne">
                    {v.dailyPriceMad} MAD <span className="text-xs text-ivory-subtle">/ jour</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVehicleForBooking(v);
                      navigate('/book');
                    }}
                    className="mt-4 w-full rounded-xl bg-champagne py-2.5 text-xs font-bold text-obsidian"
                  >
                    Choisir ce véhicule
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cross-links to all 9 Local SEO Pages */}
        <div className="mt-12 rounded-2xl border border-obsidian-border bg-obsidian-card p-6">
          <h3 className="font-serif text-lg font-bold text-ivory">
            Autres itinéraires & services à Kénitra
          </h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {LOCAL_SEO_ROUTES.map((r) => (
              <Link
                key={r.slug}
                to={`/seo/${r.slug}`}
                className="flex items-center justify-between rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 text-xs text-ivory-muted hover:border-champagne/40 hover:text-champagne"
              >
                <span>{r.label}</span>
                <ArrowRight className="h-3.5 w-3.5 text-champagne" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
