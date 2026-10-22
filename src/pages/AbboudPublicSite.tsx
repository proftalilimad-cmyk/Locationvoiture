import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  ShieldCheck,
  Calendar,
  Car,
  Users,
  Fuel,
  Settings2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Info,
  FileText,
  Clock,
  Lock,
  Copy,
  Check,
  ExternalLink,
  Menu,
  X,
  Globe,
} from 'lucide-react';
import { AbboudLogo } from '../components/AbboudLogo';
import { useAbboud } from '../context/AbboudContext';
import {
  ABBOUD_AGENCY_CONFIG,
  AbboudPageSlug,
  buildWhatsAppLink,
  getLocalizedVehicles,
  getLocalizedFaq,
} from '../config/abboudConfig';
import {
  AbboudLang,
  ABBOUD_LANGUAGES,
  ABBOUD_LOCALIZED_SEO,
  ABBOUD_UI_TEXT,
} from '../config/abboudTranslations';

interface AbboudPublicSiteProps {
  pageSlug?: AbboudPageSlug;
}

const VALID_LANGS: AbboudLang[] = ['fr', 'ar', 'en'];

export const AbboudPublicSite: React.FC<AbboudPublicSiteProps> = ({
  pageSlug = 'accueil',
}) => {
  const { submitReservationRequest } = useAbboud();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Language state: URL ?lang=... > localStorage > 'fr'
  const [lang, setLang] = useState<AbboudLang>(() => {
    const urlLang = new URLSearchParams(window.location.search).get('lang') as AbboudLang | null;
    if (urlLang && VALID_LANGS.includes(urlLang)) {
      return urlLang;
    }
    const saved = localStorage.getItem('abboud_lang') as AbboudLang | null;
    if (saved && VALID_LANGS.includes(saved)) {
      return saved;
    }
    return 'fr';
  });

  const isRtl = lang === 'ar';
  const t = ABBOUD_UI_TEXT[lang];
  const seoMeta = ABBOUD_LOCALIZED_SEO[lang][pageSlug] || ABBOUD_LOCALIZED_SEO[lang].accueil;
  const localizedVehicles = getLocalizedVehicles(lang);
  const localizedFaq = getLocalizedFaq(lang);
  const pickupLocations = ABBOUD_AGENCY_CONFIG.lieuxPriseEnChargeI18n[lang];
  const legalPlaceholders = ABBOUD_AGENCY_CONFIG.mentionsLegalesI18n[lang];
  const addressPlaceholder = ABBOUD_AGENCY_CONFIG.adressePostaleI18n[lang];
  const hoursPlaceholder = ABBOUD_AGENCY_CONFIG.horairesOuvertureI18n[lang];

  const handleLanguageChange = (newLang: AbboudLang) => {
    setLang(newLang);
    localStorage.setItem('abboud_lang', newLang);
    const nextParams = new URLSearchParams(searchParams);
    if (newLang === 'fr') {
      nextParams.delete('lang');
    } else {
      nextParams.set('lang', newLang);
    }
    setSearchParams(nextParams, { replace: true });
  };

  // Sync URL query param if user navigates with ?lang=...
  useEffect(() => {
    const qLang = searchParams.get('lang') as AbboudLang | null;
    if (qLang && VALID_LANGS.includes(qLang) && qLang !== lang) {
      setLang(qLang);
      localStorage.setItem('abboud_lang', qLang);
    }
  }, [searchParams, lang]);

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // FAQ accordion state
  const [openFaqId, setOpenFaqId] = useState<string>(
    localizedFaq[0]?.id || 'documents-necessaires'
  );

  // Reservation Request Form state
  const [nomComplet, setNomComplet] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [villeClient, setVilleClient] = useState('');
  const [modeleSouhaite, setModeleSouhaite] = useState(
    localizedVehicles[0]?.nomComplet || 'Peugeot 208'
  );
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [lieuPriseEnCharge, setLieuPriseEnCharge] = useState(pickupLocations[0]);
  const [commentaire, setCommentaire] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Keep default pickup location in sync with active language if untouched
  useEffect(() => {
    const allPickupValues = [
      ...ABBOUD_AGENCY_CONFIG.lieuxPriseEnChargeI18n.fr,
      ...ABBOUD_AGENCY_CONFIG.lieuxPriseEnChargeI18n.ar,
      ...ABBOUD_AGENCY_CONFIG.lieuxPriseEnChargeI18n.en,
    ];
    if (allPickupValues.includes(lieuPriseEnCharge)) {
      const idx =
        ABBOUD_AGENCY_CONFIG.lieuxPriseEnChargeI18n.fr.indexOf(lieuPriseEnCharge) !== -1
          ? ABBOUD_AGENCY_CONFIG.lieuxPriseEnChargeI18n.fr.indexOf(lieuPriseEnCharge)
          : ABBOUD_AGENCY_CONFIG.lieuxPriseEnChargeI18n.ar.indexOf(lieuPriseEnCharge) !== -1
          ? ABBOUD_AGENCY_CONFIG.lieuxPriseEnChargeI18n.ar.indexOf(lieuPriseEnCharge)
          : ABBOUD_AGENCY_CONFIG.lieuxPriseEnChargeI18n.en.indexOf(lieuPriseEnCharge);
      if (idx >= 0 && pickupLocations[idx]) {
        setLieuPriseEnCharge(pickupLocations[idx]);
      } else {
        setLieuPriseEnCharge(pickupLocations[0]);
      }
    }
  }, [lang, pickupLocations, lieuPriseEnCharge]);

  // Honest reservation request summary (no fake send confirmation)
  const [preparedRequestSummary, setPreparedRequestSummary] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Section refs for smooth scrolling
  const catalogueRef = useRef<HTMLElement | null>(null);
  const formRef = useRef<HTMLElement | null>(null);
  const agenceRef = useRef<HTMLElement | null>(null);
  const faqRef = useRef<HTMLElement | null>(null);
  const contactRef = useRef<HTMLElement | null>(null);
  const mentionsRef = useRef<HTMLElement | null>(null);

  // Dynamic SEO <title>, <meta name="description">, <html lang="..." dir="...">, and JSON-LD
  useEffect(() => {
    document.title = seoMeta.title;
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', seoMeta.description);

    const pathMap: Record<AbboudPageSlug, string> = {
      accueil: '/',
      vehicules: '/vehicules',
      reservation: '/reservation',
      agence: '/agence',
      faq: '/faq',
      contact: '/contact',
      'mentions-legales': '/mentions-legales',
    };
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    const basePath = pathMap[pageSlug] || '/';
    const langSuffix = lang === 'fr' ? '' : `?lang=${lang}`;
    canonical.setAttribute('href', `${window.location.origin}${basePath}${langSuffix}`);

    // Dynamic hreflang alternate links for Google multilingual SEO (fr, ar, en, x-default)
    const hreflangDefs: { hreflang: string; suffix: string }[] = [
      { hreflang: 'fr', suffix: '' },
      { hreflang: 'ar', suffix: '?lang=ar' },
      { hreflang: 'en', suffix: '?lang=en' },
      { hreflang: 'x-default', suffix: '' },
    ];
    hreflangDefs.forEach(({ hreflang, suffix }) => {
      let altLink = document.querySelector(
        `link[rel="alternate"][hreflang="${hreflang}"]`
      ) as HTMLLinkElement | null;
      if (!altLink) {
        altLink = document.createElement('link');
        altLink.rel = 'alternate';
        altLink.hreflang = hreflang;
        document.head.appendChild(altLink);
      }
      altLink.href = `${window.location.origin}${basePath}${suffix}`;
    });

    const verifiedJsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'AutoRental',
          '@id': `${window.location.origin}/#autorental`,
          name: ABBOUD_AGENCY_CONFIG.nom,
          description: seoMeta.description,
          url: window.location.origin,
          inLanguage: lang,
          telephone: ABBOUD_AGENCY_CONFIG.telephonePrincipalIntl,
          contactPoint: [
            {
              '@type': 'ContactPoint',
              telephone: ABBOUD_AGENCY_CONFIG.telephonePrincipalIntl,
              contactType: 'customer service',
              areaServed: 'MA',
              availableLanguage: ['fr', 'ar', 'en'],
            },
            {
              '@type': 'ContactPoint',
              telephone: ABBOUD_AGENCY_CONFIG.telephoneSecondaireIntl,
              contactType: 'reservations',
              areaServed: 'MA',
              availableLanguage: ['fr', 'ar', 'en'],
            },
          ],
          email: ABBOUD_AGENCY_CONFIG.email,
          areaServed: [
            {
              '@type': 'City',
              name: 'Kénitra',
              containedInPlace: {
                '@type': 'AdministrativeArea',
                name: 'Rabat-Salé-Kénitra',
              },
            },
            {
              '@type': 'City',
              name: 'Rabat',
              containedInPlace: {
                '@type': 'AdministrativeArea',
                name: 'Rabat-Salé-Kénitra',
              },
            },
            {
              '@type': 'AdministrativeArea',
              name: 'Rabat-Salé-Kénitra',
            },
          ],
        },
        {
          '@type': 'FAQPage',
          mainEntity: localizedFaq.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.reponse,
            },
          })),
        },
      ],
    };

    let ldScript = document.getElementById('abboud-jsonld') as HTMLScriptElement | null;
    if (!ldScript) {
      ldScript = document.createElement('script');
      ldScript.id = 'abboud-jsonld';
      ldScript.type = 'application/ld+json';
      document.head.appendChild(ldScript);
    }
    ldScript.textContent = JSON.stringify(verifiedJsonLd);
  }, [pageSlug, lang, isRtl, seoMeta, localizedFaq]);

  // Scroll to target section when navigating via readable SEO URLs
  useEffect(() => {
    setMobileMenuOpen(false);
    const map: Record<AbboudPageSlug, React.RefObject<HTMLElement | null> | null> = {
      accueil: null,
      vehicules: catalogueRef,
      reservation: formRef,
      agence: agenceRef,
      faq: faqRef,
      contact: contactRef,
      'mentions-legales': mentionsRef,
    };
    const targetRef = map[pageSlug];
    if (targetRef && targetRef.current) {
      setTimeout(() => {
        targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    } else if (pageSlug === 'accueil' && !location.hash) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pageSlug, location.pathname, location.hash]);

  const handleSelectVehicleForQuote = (vehicleName: string) => {
    setModeleSouhaite(vehicleName);
    setPreparedRequestSummary(null);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const buildRequestMessageText = () => {
    return t.form.summaryTemplate({
      vehicle: modeleSouhaite,
      start: dateDebut || '—',
      end: dateFin || '—',
      location: lieuPriseEnCharge,
      name: nomComplet.trim(),
      phone: telephone.trim(),
      email: email.trim() || undefined,
      city: villeClient.trim() || undefined,
      notes: commentaire.trim() || undefined,
    });
  };

  const handlePrepareRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!nomComplet.trim() || !telephone.trim() || !modeleSouhaite) {
      setFormError(t.form.errorRequired);
      return;
    }
    if (!dateDebut || !dateFin) {
      setFormError(t.form.errorDates);
      return;
    }
    if (dateFin < dateDebut) {
      setFormError(t.form.errorDateOrder);
      return;
    }

    const summary = buildRequestMessageText();
    setPreparedRequestSummary(summary);

    // Save locally for /admin dashboard when running on same workstation
    try {
      await submitReservationRequest({
        modeleSouhaite,
        departSouhaite: dateDebut,
        retourSouhaite: dateFin,
        lieuPriseEnCharge,
        nomClient: nomComplet.trim(),
        telephone: telephone.trim(),
        email: email.trim(),
        message: [villeClient.trim() ? `Ville: ${villeClient.trim()}` : '', commentaire.trim()]
          .filter(Boolean)
          .join(' — '),
      });
    } catch {
      // Never show a fake remote confirmation; user sends via WhatsApp/Email/Phone
    }
  };

  const handleCopySummary = async () => {
    if (!preparedRequestSummary) return;
    try {
      await navigator.clipboard.writeText(preparedRequestSummary);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    } catch {
      // ignore clipboard errors
    }
  };

  const defaultWhatsAppMessage = t.hero.defaultWhatsappHello;
  const mainWhatsAppHref = buildWhatsAppLink(
    ABBOUD_AGENCY_CONFIG.whatsappPrincipalDigits,
    defaultWhatsAppMessage
  );

  const buildLangPath = (basePath: string) => {
    return lang === 'fr' ? basePath : `${basePath}?lang=${lang}`;
  };

  const navItems: { label: string; to: string; slug: AbboudPageSlug }[] = [
    { label: t.nav.accueil, to: buildLangPath('/'), slug: 'accueil' },
    { label: t.nav.vehicules, to: buildLangPath('/vehicules'), slug: 'vehicules' },
    { label: t.nav.reservation, to: buildLangPath('/reservation'), slug: 'reservation' },
    { label: t.nav.agence, to: buildLangPath('/agence'), slug: 'agence' },
    { label: t.nav.faq, to: buildLangPath('/faq'), slug: 'faq' },
    { label: t.nav.contact, to: buildLangPath('/contact'), slug: 'contact' },
  ];

  const DirectionalArrow = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-[#F8FAFC] text-[#0B192C] flex flex-col selection:bg-[#C89D54] selection:text-white ${
        isRtl ? "font-['Cairo',sans-serif]" : "font-['Inter',sans-serif]"
      }`}
    >
      {/* Top Info Bar (Navy Blue & Gold) */}
      <div className="bg-[#07111E] text-slate-200 border-b border-[#C89D54]/25 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5 font-medium text-white">
              <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
              {t.topBarLocation}
            </span>
            <a
              href={`mailto:${ABBOUD_AGENCY_CONFIG.email}`}
              className="hidden md:inline-flex items-center gap-1.5 text-slate-300 hover:text-[#D4AF37] transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
              {ABBOUD_AGENCY_CONFIG.email}
            </a>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            {/* Language Switcher (FR | العربية | EN) */}
            <div
              role="group"
              aria-label="Sélecteur de langue / Language switcher / اختيار اللغة"
              className="inline-flex items-center bg-[#0B192C] border border-[#C89D54]/40 rounded-lg p-0.5"
            >
              <Globe className="w-3.5 h-3.5 text-[#D4AF37] mx-1.5 hidden sm:inline" />
              {ABBOUD_LANGUAGES.map((l) => {
                const active = lang === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => handleLanguageChange(l.code)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                      active
                        ? 'bg-[#C89D54] text-[#0B192C] shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {l.label}
                  </button>
                );
              })}
            </div>

            <a
              href={`tel:${ABBOUD_AGENCY_CONFIG.telephonePrincipalIntl}`}
              dir="ltr"
              className="inline-flex items-center gap-1.5 font-semibold text-white hover:text-[#D4AF37] transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
              {ABBOUD_AGENCY_CONFIG.telephonePrincipal}
            </a>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <a
              href={`tel:${ABBOUD_AGENCY_CONFIG.telephoneSecondaireIntl}`}
              dir="ltr"
              className="hidden sm:inline-flex items-center gap-1.5 font-semibold text-white hover:text-[#D4AF37] transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
              {ABBOUD_AGENCY_CONFIG.telephoneSecondaire}
            </a>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-[#D4AF37] transition-colors border border-white/10 rounded px-2 py-0.5"
            >
              <Lock className="w-3 h-3" />
              {t.adminSpace}
            </Link>
            <a
              href="/abboud-location-hostinger.zip"
              download="abboud-location-hostinger.zip"
              className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#C89D54]/20 text-[#D4AF37] hover:bg-[#C89D54] hover:text-[#0B192C] transition-colors border border-[#C89D54]/50 rounded px-2.5 py-0.5"
            >
              <ExternalLink className="w-3 h-3" />
              ZIP Hostinger
            </a>
          </div>
        </div>
      </div>

      {/* Main Header / Navigation */}
      <header className="sticky top-0 z-40 bg-[#0B192C]/95 backdrop-blur-md border-b border-[#C89D54]/30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <Link
            to={buildLangPath('/')}
            aria-label="Abboud Location Kénitra"
            className="shrink-0"
          >
            <AbboudLogo size="md" variant="dark" />
          </Link>

          {/* Desktop Navigation */}
          <nav
            aria-label="Navigation principale"
            className="hidden lg:flex items-center gap-1 xl:gap-2"
          >
            {navItems.map((item) => {
              const isActive = pageSlug === item.slug;
              return (
                <Link
                  key={item.slug}
                  to={item.to}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#C89D54]/20 text-[#D4AF37] border border-[#C89D54]/40'
                      : 'text-slate-200 hover:text-[#D4AF37] hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Header CTA Buttons */}
          <div className="hidden sm:flex items-center gap-2.5">
            <a
              href={`tel:${ABBOUD_AGENCY_CONFIG.telephonePrincipalIntl}`}
              dir="ltr"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#C89D54]/50 text-white hover:bg-[#C89D54]/15 text-xs font-bold transition-colors"
            >
              <Phone className="w-4 h-4 text-[#D4AF37]" />
              <span>{ABBOUD_AGENCY_CONFIG.telephonePrincipal}</span>
            </a>
            <a
              href={mainWhatsAppHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C89D54] hover:bg-[#b88d44] text-[#0B192C] text-xs font-extrabold tracking-wide shadow-md transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label="Menu"
            className="lg:hidden inline-flex items-center justify-center p-2.5 rounded-xl border border-[#C89D54]/40 text-white hover:bg-white/10"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0B192C] border-t border-[#C89D54]/25 px-4 pt-3 pb-6 space-y-3">
            {/* Mobile language switcher */}
            <div className="flex items-center justify-between bg-[#07111E] p-2 rounded-xl border border-[#C89D54]/30">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#D4AF37]" />
                Langue / اللغة / Language
              </span>
              <div className="flex items-center gap-1">
                {ABBOUD_LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => handleLanguageChange(l.code)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      lang === l.code
                        ? 'bg-[#C89D54] text-[#0B192C]'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.slug}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold ${
                    pageSlug === item.slug
                      ? 'bg-[#C89D54]/20 text-[#D4AF37] border border-[#C89D54]/40'
                      : 'text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to={buildLangPath('/mentions-legales')}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/5"
              >
                {t.nav.mentions}
              </Link>
            </div>
            <div className="pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <a
                href={`tel:${ABBOUD_AGENCY_CONFIG.telephonePrincipalIntl}`}
                dir="ltr"
                className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[#C89D54]/50 text-white font-bold text-sm"
              >
                <Phone className="w-4 h-4 text-[#D4AF37]" />
                {ABBOUD_AGENCY_CONFIG.telephonePrincipal}
              </a>
              <a
                href={mainWhatsAppHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#C89D54] text-[#0B192C] font-extrabold text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                {t.hero.btnWhatsapp}
              </a>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* ===================================================================
            PARTIE 1 : ACCUEIL (HERO) — Seul et unique <h1> de la page
        =================================================================== */}
        <section className="relative bg-gradient-to-br from-[#07111E] via-[#0B192C] to-[#132A4A] text-white overflow-hidden border-b-4 border-[#C89D54]">
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 80% 20%, #D4AF37 0%, transparent 45%)',
            }}
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left Column: Unique H1 + Short Presentation + 2 Action Buttons */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C89D54]/15 border border-[#C89D54]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t.hero.badge}</span>
                </div>

                {/* UNIQUE H1 ON EVERY PAGE */}
                <h1
                  className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white ${
                    isRtl
                      ? "font-['Cairo',sans-serif]"
                      : "font-['Plus_Jakarta_Sans',sans-serif]"
                  }`}
                >
                  {seoMeta.h1}
                </h1>

                <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl">
                  {t.hero.description}
                </p>

                {/* Deux boutons principaux exigés */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                  <Link
                    to={buildLangPath('/vehicules')}
                    onClick={(e) => {
                      if (pageSlug === 'vehicules') {
                        e.preventDefault();
                        catalogueRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-[#C89D54] hover:bg-[#d6ad63] text-[#0B192C] font-extrabold text-sm sm:text-base shadow-lg shadow-[#C89D54]/20 transition-all"
                  >
                    <Car className="w-5 h-5" />
                    <span>{t.hero.btnDiscover}</span>
                    <DirectionalArrow className="w-4 h-4" />
                  </Link>

                  <a
                    href={mainWhatsAppHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-white hover:bg-slate-100 text-[#0B192C] font-extrabold text-sm sm:text-base border-2 border-[#C89D54] shadow-lg transition-all"
                  >
                    <MessageCircle className="w-5 h-5 text-[#16A34A]" />
                    <span>{t.hero.btnWhatsapp}</span>
                  </a>
                </div>

                {/* Direct Telephone Strip */}
                <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-slate-300">
                  <span className="font-semibold text-[#D4AF37]">
                    {t.hero.directCallLabel}
                  </span>
                  <a
                    href={`tel:${ABBOUD_AGENCY_CONFIG.telephonePrincipalIntl}`}
                    dir="ltr"
                    className="inline-flex items-center gap-1.5 font-bold text-white hover:text-[#D4AF37] transition-colors"
                  >
                    <Phone className="w-4 h-4 text-[#D4AF37]" />
                    {ABBOUD_AGENCY_CONFIG.telephonePrincipal}
                  </a>
                  <a
                    href={`tel:${ABBOUD_AGENCY_CONFIG.telephoneSecondaireIntl}`}
                    dir="ltr"
                    className="inline-flex items-center gap-1.5 font-bold text-white hover:text-[#D4AF37] transition-colors"
                  >
                    <Phone className="w-4 h-4 text-[#D4AF37]" />
                    {ABBOUD_AGENCY_CONFIG.telephoneSecondaire}
                  </a>
                </div>

                {/* Key reassurance pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {t.hero.pillars.map((pillar, idx) => (
                    <div
                      key={idx}
                      className="bg-white/5 border border-[#C89D54]/25 rounded-xl p-3.5"
                    >
                      <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                        {pillar.title}
                      </p>
                      <p className="text-xs text-slate-300 mt-1">{pillar.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Large Vehicle Showcase Visual */}
              <div className="lg:col-span-5">
                <div className="relative rounded-2xl bg-gradient-to-b from-[#132A4A] to-[#0B192C] p-6 border border-[#C89D54]/40 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                      {t.hero.visualCardBadge}
                    </span>
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/10 text-slate-200 font-medium">
                      {ABBOUD_AGENCY_CONFIG.slogan}
                    </span>
                  </div>

                  <div className="relative h-56 sm:h-64 flex items-center justify-center">
                    <img
                      src="/abboud/hyundai-tucson.png"
                      alt={localizedVehicles[2]?.photoAlt || 'Hyundai Tucson Abboud Location'}
                      width={520}
                      height={280}
                      decoding="async"
                      fetchPriority="high"
                      className="max-h-full max-w-full object-contain drop-shadow-[0_20px_25px_rgba(0,0,0,0.65)]"
                    />
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-white">
                        {t.hero.visualCardModels}
                      </p>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {t.hero.visualCardStatus}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectVehicleForQuote('Hyundai Tucson')}
                      className="px-4 py-2 rounded-lg bg-[#C89D54] hover:bg-[#d6ad63] text-[#0B192C] font-bold text-xs transition-colors"
                    >
                      {t.hero.visualCardBtn}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            PARTIE 2 : CATALOGUE DE VÉHICULES
        =================================================================== */}
        <section
          ref={catalogueRef}
          id="catalogue-vehicules"
          className="py-16 lg:py-20 bg-white border-b border-slate-200 scroll-mt-20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#9A7432] bg-[#C89D54]/15 px-3 py-1 rounded-full">
                  <Car className="w-3.5 h-3.5" />
                  {t.catalogue.badge}
                </span>
                <h2
                  className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B192C] mt-3 ${
                    isRtl
                      ? "font-['Cairo',sans-serif]"
                      : "font-['Plus_Jakarta_Sans',sans-serif]"
                  }`}
                >
                  {t.catalogue.h2}
                </h2>
                <p className="text-slate-600 mt-2 max-w-2xl text-sm sm:text-base">
                  {t.catalogue.intro}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={`tel:${ABBOUD_AGENCY_CONFIG.telephonePrincipalIntl}`}
                  dir="ltr"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B192C] text-white text-xs sm:text-sm font-bold hover:bg-[#132A4A] transition-colors"
                >
                  <Phone className="w-4 h-4 text-[#D4AF37]" />
                  <span>
                    {t.catalogue.callBtn} {ABBOUD_AGENCY_CONFIG.telephonePrincipal}
                  </span>
                </a>
              </div>
            </div>

            {/* Vehicle Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {localizedVehicles.map((vehicle) => {
                const vehicleWhatsappHref = buildWhatsAppLink(
                  ABBOUD_AGENCY_CONFIG.whatsappPrincipalDigits,
                  t.catalogue.whatsappQuoteTemplate(vehicle.nomComplet)
                );

                return (
                  <article
                    key={vehicle.id}
                    className="group bg-[#F8FAFC] rounded-2xl border border-slate-200 hover:border-[#C89D54] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden"
                  >
                    {/* Large Vehicle Photo */}
                    <div className="relative bg-gradient-to-b from-[#0B192C] to-[#162B49] h-56 p-6 flex items-center justify-center overflow-hidden">
                      <span
                        className={`absolute top-3.5 ${
                          isRtl ? 'right-3.5' : 'left-3.5'
                        } px-3 py-1 rounded-full bg-[#C89D54]/20 border border-[#C89D54]/40 text-[#D4AF37] text-[11px] font-bold`}
                      >
                        {vehicle.categorie}
                      </span>
                      <img
                        src={vehicle.photoUrl}
                        alt={vehicle.photoAlt}
                        width={400}
                        height={220}
                        loading="lazy"
                        decoding="async"
                        className="max-h-40 w-auto object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_14px_18px_rgba(0,0,0,0.55)]"
                      />
                    </div>

                    {/* Vehicle Body */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                      <div>
                        <div className="flex items-baseline justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-[#9A7432]">
                              {t.catalogue.brandLabel} {vehicle.marque}
                            </p>
                            <h3
                              className={`text-xl font-extrabold text-[#0B192C] mt-0.5 ${
                                isRtl
                                  ? "font-['Cairo',sans-serif]"
                                  : "font-['Plus_Jakarta_Sans',sans-serif]"
                              }`}
                            >
                              {vehicle.nomComplet}
                            </h3>
                          </div>
                          <span className="text-xs font-semibold text-slate-500">
                            {t.catalogue.modelLabel} {vehicle.modele}
                          </span>
                        </div>

                        {/* Specs List: Transmission, Carburant, Nombre de places */}
                        <dl className="mt-4 pt-4 border-t border-slate-200 space-y-2.5 text-xs sm:text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <dt className="inline-flex items-center gap-2 text-slate-600 font-medium">
                              <Settings2 className="w-4 h-4 text-[#C89D54] shrink-0" />
                              <span>{t.catalogue.transmissionLabel}</span>
                            </dt>
                            <dd className="font-semibold text-[#0B192C] text-end">
                              {vehicle.transmission}
                            </dd>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <dt className="inline-flex items-center gap-2 text-slate-600 font-medium">
                              <Fuel className="w-4 h-4 text-[#C89D54] shrink-0" />
                              <span>{t.catalogue.fuelLabel}</span>
                            </dt>
                            <dd className="font-semibold text-[#0B192C] text-end">
                              {vehicle.carburant}
                            </dd>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <dt className="inline-flex items-center gap-2 text-slate-600 font-medium">
                              <Users className="w-4 h-4 text-[#C89D54] shrink-0" />
                              <span>{t.catalogue.seatsLabel}</span>
                            </dt>
                            <dd className="font-semibold text-[#0B192C] text-end">
                              {vehicle.places}
                            </dd>
                          </div>
                        </dl>

                        {/* Honest pricing & availability notice */}
                        <div className="mt-4 p-3 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#0B192C]">
                            {t.catalogue.rateLabel}{' '}
                            <span className="text-[#9A7432]">{vehicle.tarif}</span>
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {vehicle.disponibilite}
                          </span>
                        </div>
                      </div>

                      {/* CTA Buttons: Demander un tarif */}
                      <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleSelectVehicleForQuote(vehicle.nomComplet)}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0B192C] hover:bg-[#132A4A] text-white font-bold text-xs sm:text-sm transition-colors"
                        >
                          <span>{t.catalogue.askQuoteBtn}</span>
                          <DirectionalArrow className="w-4 h-4 text-[#D4AF37]" />
                        </button>

                        <a
                          href={vehicleWhatsappHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#C89D54] hover:bg-[#b88d44] text-[#0B192C] font-extrabold text-xs sm:text-sm transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Transparency Note */}
            <div className="mt-8 p-4 rounded-xl bg-[#0B192C]/5 border border-[#0B192C]/15 flex items-start gap-3 text-xs sm:text-sm text-slate-700">
              <Info className="w-5 h-5 text-[#9A7432] shrink-0 mt-0.5" />
              <p>
                <strong>{t.catalogue.noteTitle}</strong> {t.catalogue.noteBody}
              </p>
            </div>
          </div>
        </section>

        {/* ===================================================================
            PARTIE 3 : FORMULAIRE DE DEMANDE DE RÉSERVATION
        =================================================================== */}
        <section
          ref={formRef}
          id="formulaire-reservation"
          className="py-16 lg:py-20 bg-[#F8FAFC] border-b border-slate-200 scroll-mt-20"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#9A7432] bg-[#C89D54]/15 px-3.5 py-1 rounded-full">
                <Calendar className="w-3.5 h-3.5" />
                {t.form.badge}
              </span>
              <h2
                className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B192C] mt-3 ${
                  isRtl
                    ? "font-['Cairo',sans-serif]"
                    : "font-['Plus_Jakarta_Sans',sans-serif]"
                }`}
              >
                {t.form.h2}
              </h2>
              <p className="text-slate-600 mt-2 text-sm sm:text-base">{t.form.subtitle}</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
              {/* Top Notice Banner */}
              <div className="bg-[#0B192C] text-white px-6 py-4 border-b-2 border-[#C89D54] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs sm:text-sm">
                  <ShieldCheck className="w-5 h-5 text-[#D4AF37] shrink-0" />
                  <span>
                    <strong>{t.form.honestBannerTitle}</strong> {t.form.honestBannerBody}
                  </span>
                </div>
              </div>

              <div className="p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form Column */}
                <form onSubmit={handlePrepareRequest} className="lg:col-span-7 space-y-5">
                  <h3 className="text-lg font-extrabold text-[#0B192C] border-b border-slate-200 pb-2">
                    {t.form.step1Title}
                  </h3>

                  {formError && (
                    <div
                      role="alert"
                      className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm font-medium"
                    >
                      {formError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="abboud-vehicule"
                        className="block text-xs font-bold uppercase tracking-wider text-[#0B192C] mb-1.5"
                      >
                        {t.form.vehicleField}
                      </label>
                      <select
                        id="abboud-vehicule"
                        value={modeleSouhaite}
                        onChange={(e) => setModeleSouhaite(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-[#0B192C] focus:border-[#0B192C] focus:outline-none"
                      >
                        {localizedVehicles.map((v) => (
                          <option key={v.id} value={v.nomComplet}>
                            {v.nomComplet} ({v.categorie})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="abboud-lieu"
                        className="block text-xs font-bold uppercase tracking-wider text-[#0B192C] mb-1.5"
                      >
                        {t.form.pickupLocationField}
                      </label>
                      <select
                        id="abboud-lieu"
                        value={lieuPriseEnCharge}
                        onChange={(e) => setLieuPriseEnCharge(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-[#0B192C] focus:border-[#0B192C] focus:outline-none"
                      >
                        {pickupLocations.map((lieu) => (
                          <option key={lieu} value={lieu}>
                            {lieu}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="abboud-date-debut"
                        className="block text-xs font-bold uppercase tracking-wider text-[#0B192C] mb-1.5"
                      >
                        {t.form.startDateField}
                      </label>
                      <input
                        id="abboud-date-debut"
                        type="date"
                        required
                        value={dateDebut}
                        onChange={(e) => setDateDebut(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-[#0B192C] focus:border-[#0B192C] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="abboud-date-fin"
                        className="block text-xs font-bold uppercase tracking-wider text-[#0B192C] mb-1.5"
                      >
                        {t.form.endDateField}
                      </label>
                      <input
                        id="abboud-date-fin"
                        type="date"
                        required
                        value={dateFin}
                        onChange={(e) => setDateFin(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-[#0B192C] focus:border-[#0B192C] focus:outline-none"
                      />
                    </div>
                  </div>

                  <h3 className="text-lg font-extrabold text-[#0B192C] border-b border-slate-200 pb-2 pt-2">
                    {t.form.step2Title}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="abboud-nom"
                        className="block text-xs font-bold uppercase tracking-wider text-[#0B192C] mb-1.5"
                      >
                        {t.form.fullNameField}
                      </label>
                      <input
                        id="abboud-nom"
                        type="text"
                        required
                        placeholder={t.form.fullNamePlaceholder}
                        value={nomComplet}
                        onChange={(e) => setNomComplet(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-[#0B192C] focus:border-[#0B192C] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="abboud-telephone"
                        className="block text-xs font-bold uppercase tracking-wider text-[#0B192C] mb-1.5"
                      >
                        {t.form.phoneField}
                      </label>
                      <input
                        id="abboud-telephone"
                        type="tel"
                        required
                        placeholder={t.form.phonePlaceholder}
                        value={telephone}
                        onChange={(e) => setTelephone(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-[#0B192C] focus:border-[#0B192C] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="abboud-email"
                        className="block text-xs font-bold uppercase tracking-wider text-[#0B192C] mb-1.5"
                      >
                        {t.form.emailField}
                      </label>
                      <input
                        id="abboud-email"
                        type="email"
                        placeholder={t.form.emailPlaceholder}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-[#0B192C] focus:border-[#0B192C] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="abboud-ville"
                        className="block text-xs font-bold uppercase tracking-wider text-[#0B192C] mb-1.5"
                      >
                        {t.form.cityField}
                      </label>
                      <input
                        id="abboud-ville"
                        type="text"
                        placeholder={t.form.cityPlaceholder}
                        value={villeClient}
                        onChange={(e) => setVilleClient(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-[#0B192C] focus:border-[#0B192C] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="abboud-commentaire"
                      className="block text-xs font-bold uppercase tracking-wider text-[#0B192C] mb-1.5"
                    >
                      {t.form.messageField}
                    </label>
                    <textarea
                      id="abboud-commentaire"
                      rows={3}
                      placeholder={t.form.messagePlaceholder}
                      value={commentaire}
                      onChange={(e) => setCommentaire(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-[#0B192C] focus:border-[#0B192C] focus:outline-none"
                    />
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t.form.disclaimerText}
                  </p>

                  <div className="pt-1">
                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[#0B192C] hover:bg-[#132A4A] text-white font-extrabold text-sm sm:text-base shadow-md transition-all"
                    >
                      <FileText className="w-5 h-5 text-[#D4AF37]" />
                      <span>{t.form.submitBtn}</span>
                    </button>
                  </div>
                </form>

                {/* Right Column: Actionable transmission panel & Direct WhatsApp */}
                <div className="lg:col-span-5 flex flex-col justify-between bg-[#F8FAFC] rounded-2xl p-6 border border-slate-200 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-base font-extrabold text-[#0B192C] flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-[#9A7432]" />
                      <span>{t.form.sidebarTitle}</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {t.form.sidebarBody}
                    </p>

                    <div className="space-y-2.5 pt-1">
                      <a
                        href={buildWhatsAppLink(
                          ABBOUD_AGENCY_CONFIG.whatsappPrincipalDigits,
                          nomComplet && dateDebut && dateFin
                            ? buildRequestMessageText()
                            : t.catalogue.whatsappQuoteTemplate(modeleSouhaite)
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-[#C89D54] hover:bg-[#b88d44] text-[#0B192C] font-extrabold text-xs sm:text-sm shadow-sm transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{t.form.sidebarWhatsapp1}</span>
                      </a>

                      <a
                        href={buildWhatsAppLink(
                          ABBOUD_AGENCY_CONFIG.whatsappSecondaireDigits,
                          nomComplet && dateDebut && dateFin
                            ? buildRequestMessageText()
                            : t.catalogue.whatsappQuoteTemplate(modeleSouhaite)
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white hover:bg-slate-50 text-[#0B192C] border border-[#C89D54] font-bold text-xs sm:text-sm transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 text-[#9A7432]" />
                        <span>{t.form.sidebarWhatsapp2}</span>
                      </a>

                      <a
                        href={`tel:${ABBOUD_AGENCY_CONFIG.telephonePrincipalIntl}`}
                        dir="ltr"
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0B192C] hover:bg-[#132A4A] text-white font-bold text-xs sm:text-sm transition-colors"
                      >
                        <Phone className="w-4 h-4 text-[#D4AF37]" />
                        <span>{t.form.sidebarCall1}</span>
                      </a>

                      <a
                        href={`tel:${ABBOUD_AGENCY_CONFIG.telephoneSecondaireIntl}`}
                        dir="ltr"
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white hover:bg-slate-100 text-[#0B192C] border border-slate-300 font-bold text-xs sm:text-sm transition-colors"
                      >
                        <Phone className="w-4 h-4 text-[#0B192C]" />
                        <span>{t.form.sidebarCall2}</span>
                      </a>
                    </div>
                  </div>

                  {/* Process Steps */}
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-[#0B192C]">
                      {t.form.sidebarProcessTitle}
                    </p>
                    <ol className="space-y-2 text-xs text-slate-600">
                      {t.form.sidebarSteps.map((stepText, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#0B192C] text-[#D4AF37] font-bold flex items-center justify-center shrink-0 text-[11px]">
                            {idx + 1}
                          </span>
                          <span>{stepText}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>

              {/* Honest Request Summary Box after form submission */}
              {preparedRequestSummary && (
                <div
                  role="region"
                  aria-live="polite"
                  className="mx-6 mb-8 sm:mx-8 lg:mx-10 p-6 rounded-2xl bg-[#0B192C] text-white border-2 border-[#C89D54] space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2 text-[#D4AF37] text-xs font-extrabold uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t.form.readyBannerBadge}</span>
                    </div>
                  </div>

                  <p className="text-sm sm:text-base font-bold text-white">
                    {t.form.readyBannerTitle}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-300">{t.form.readyBannerBody}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <a
                      href={buildWhatsAppLink(
                        ABBOUD_AGENCY_CONFIG.whatsappPrincipalDigits,
                        preparedRequestSummary
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-[#C89D54] hover:bg-[#d6ad63] text-[#0B192C] font-extrabold text-xs sm:text-sm transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{t.form.sendWhatsapp1}</span>
                    </a>

                    <a
                      href={buildWhatsAppLink(
                        ABBOUD_AGENCY_CONFIG.whatsappSecondaireDigits,
                        preparedRequestSummary
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-[#0B192C] font-extrabold text-xs sm:text-sm transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 text-[#16A34A]" />
                      <span>{t.form.sendWhatsapp2}</span>
                    </a>

                    <a
                      href={`mailto:${ABBOUD_AGENCY_CONFIG.email}?subject=${encodeURIComponent(
                        t.form.mailSubject(modeleSouhaite, nomComplet)
                      )}&body=${encodeURIComponent(preparedRequestSummary)}`}
                      className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs sm:text-sm transition-colors"
                    >
                      <Mail className="w-4 h-4 text-[#D4AF37]" />
                      <span>{t.form.sendEmail}</span>
                    </a>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-300">
                        {t.form.summaryLabel}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopySummary}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D4AF37] hover:underline"
                      >
                        {copiedSummary ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>{t.form.copiedBtn}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>{t.form.copyBtn}</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-3.5 rounded-xl bg-[#07111E] border border-white/10 text-xs text-slate-200 whitespace-pre-wrap font-mono leading-relaxed">
                      {preparedRequestSummary}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ===================================================================
            PARTIE 4 : PRÉSENTATION DE L’AGENCE (SEO « location de voitures à Kénitra »)
        =================================================================== */}
        <section
          ref={agenceRef}
          id="presentation-agence"
          className="py-16 lg:py-20 bg-white border-b border-slate-200 scroll-mt-20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-7 space-y-5">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#9A7432] bg-[#C89D54]/15 px-3.5 py-1 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {t.agency.badge}
                </span>

                <h2
                  className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B192C] ${
                    isRtl
                      ? "font-['Cairo',sans-serif]"
                      : "font-['Plus_Jakarta_Sans',sans-serif]"
                  }`}
                >
                  {t.agency.h2}
                </h2>

                <p className="text-slate-700 leading-relaxed text-sm sm:text-base">
                  {t.agency.p1}
                </p>

                <p className="text-slate-700 leading-relaxed text-sm sm:text-base">
                  {t.agency.p2}
                </p>

                <p className="text-slate-700 leading-relaxed text-sm sm:text-base">
                  {t.agency.p3}
                </p>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <div className="bg-[#0B192C] text-white rounded-2xl p-6 border-s-4 border-[#C89D54] shadow-lg space-y-3">
                  <h3 className="text-lg font-extrabold text-[#D4AF37]">
                    {t.agency.card1Title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {t.agency.card1Body}
                  </p>
                </div>

                <div className="bg-[#F8FAFC] rounded-2xl p-6 border border-slate-200 space-y-3">
                  <h3 className="text-lg font-extrabold text-[#0B192C]">
                    {t.agency.card2Title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {t.agency.card2Body}
                  </p>
                </div>

                <div className="bg-[#F8FAFC] rounded-2xl p-6 border border-slate-200 space-y-3">
                  <h3 className="text-lg font-extrabold text-[#0B192C]">
                    {t.agency.card3Title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {t.agency.card3Body}
                  </p>
                  <div className="pt-1 flex flex-wrap gap-2">
                    <Link
                      to={buildLangPath('/vehicules')}
                      className="text-xs font-bold text-[#9A7432] hover:underline inline-flex items-center gap-1"
                    >
                      <span>{t.agency.card3BtnCatalog}</span>
                      <DirectionalArrow className="w-3.5 h-3.5" />
                    </Link>
                    <span className="text-slate-300">•</span>
                    <Link
                      to={buildLangPath('/reservation')}
                      className="text-xs font-bold text-[#9A7432] hover:underline inline-flex items-center gap-1"
                    >
                      <span>{t.agency.card3BtnForm}</span>
                      <DirectionalArrow className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            PARTIE 5 : FAQ (Documents nécessaires, Caution, Assurance, Conditions)
        =================================================================== */}
        <section
          ref={faqRef}
          id="faq-location"
          className="py-16 lg:py-20 bg-[#F8FAFC] border-b border-slate-200 scroll-mt-20"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#9A7432] bg-[#C89D54]/15 px-3.5 py-1 rounded-full">
                {t.faqSection.badge}
              </span>
              <h2
                className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B192C] mt-3 ${
                  isRtl
                    ? "font-['Cairo',sans-serif]"
                    : "font-['Plus_Jakarta_Sans',sans-serif]"
                }`}
              >
                {t.faqSection.h2}
              </h2>
              <p className="text-slate-600 mt-2 text-sm sm:text-base">
                {t.faqSection.intro}
              </p>
            </div>

            <div className="space-y-4">
              {localizedFaq.map((item) => {
                const isOpen = openFaqId === item.id;
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
                  >
                    <h3>
                      <button
                        type="button"
                        onClick={() => setOpenFaqId(isOpen ? '' : item.id)}
                        aria-expanded={isOpen}
                        className="w-full px-6 py-5 text-start flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="space-y-1">
                          <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#9A7432]">
                            {item.categorie}
                          </span>
                          <p className="text-base sm:text-lg font-extrabold text-[#0B192C]">
                            {item.question}
                          </p>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-[#0B192C] shrink-0 transition-transform duration-200 ${
                            isOpen ? 'rotate-180 text-[#C89D54]' : ''
                          }`}
                        />
                      </button>
                    </h3>

                    {isOpen && (
                      <div className="px-6 pb-6 pt-2 border-t border-slate-100 space-y-3 text-sm text-slate-700 leading-relaxed">
                        <p>{item.reponse}</p>
                        {item.infoACompleter && (
                          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 font-medium">
                            {item.infoACompleter}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===================================================================
            PARTIE 6 : CONTACT (Téléphones, WhatsApp, Adresse à compléter, Carte de Kénitra)
        =================================================================== */}
        <section
          ref={contactRef}
          id="contact-kenitra"
          className="py-16 lg:py-20 bg-white border-b border-slate-200 scroll-mt-20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#9A7432] bg-[#C89D54]/15 px-3.5 py-1 rounded-full">
                <MapPin className="w-3.5 h-3.5" />
                {t.contactSection.badge}
              </span>
              <h2
                className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B192C] mt-3 ${
                  isRtl
                    ? "font-['Cairo',sans-serif]"
                    : "font-['Plus_Jakarta_Sans',sans-serif]"
                }`}
              >
                {t.contactSection.h2}
              </h2>
              <p className="text-slate-600 mt-2 max-w-2xl text-sm sm:text-base">
                {t.contactSection.intro}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Contact Information Cards */}
              <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                <div className="bg-[#0B192C] text-white rounded-2xl p-6 border border-[#C89D54]/40 space-y-4">
                  <h3 className="text-lg font-extrabold text-[#D4AF37]">
                    {t.contactSection.phonesTitle}
                  </h3>

                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-300">
                          {t.contactSection.mainLineLabel}
                        </p>
                        <a
                          href={`tel:${ABBOUD_AGENCY_CONFIG.telephonePrincipalIntl}`}
                          dir="ltr"
                          className="text-lg font-extrabold text-white hover:text-[#D4AF37] inline-block"
                        >
                          {ABBOUD_AGENCY_CONFIG.telephonePrincipal}
                        </a>
                      </div>
                      <a
                        href={mainWhatsAppHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-lg bg-[#C89D54] text-[#0B192C] font-extrabold text-xs inline-flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{t.contactSection.whatsappBtn}</span>
                      </a>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-300">
                          {t.contactSection.secondLineLabel}
                        </p>
                        <a
                          href={`tel:${ABBOUD_AGENCY_CONFIG.telephoneSecondaireIntl}`}
                          dir="ltr"
                          className="text-lg font-extrabold text-white hover:text-[#D4AF37] inline-block"
                        >
                          {ABBOUD_AGENCY_CONFIG.telephoneSecondaire}
                        </a>
                      </div>
                      <a
                        href={buildWhatsAppLink(
                          ABBOUD_AGENCY_CONFIG.whatsappSecondaireDigits,
                          defaultWhatsAppMessage
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs inline-flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-4 h-4 text-[#D4AF37]" />
                        <span>{t.contactSection.whatsappBtn}</span>
                      </a>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10">
                    <p className="text-xs text-slate-300">{t.contactSection.emailLabel}</p>
                    <a
                      href={`mailto:${ABBOUD_AGENCY_CONFIG.email}`}
                      className="text-sm font-bold text-[#D4AF37] hover:underline break-all"
                    >
                      {ABBOUD_AGENCY_CONFIG.email}
                    </a>
                  </div>
                </div>

                {/* Clearly Identified Placeholders for Street Address & Opening Hours */}
                <div className="bg-[#F8FAFC] rounded-2xl p-6 border border-slate-200 space-y-4">
                  <h3 className="text-base font-extrabold text-[#0B192C] flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#9A7432]" />
                    <span>{t.contactSection.addressHoursTitle}</span>
                  </h3>

                  <div className="space-y-3 text-xs sm:text-sm">
                    <div>
                      <p className="font-bold text-[#0B192C]">
                        {t.contactSection.cityServedLabel}
                      </p>
                      <p className="text-slate-700">{t.contactSection.cityServedValue}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
                        {t.contactSection.exactAddressLabel}
                      </p>
                      <p className="text-xs text-amber-800 mt-0.5 font-medium">
                        {addressPlaceholder}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{t.contactSection.openingHoursLabel}</span>
                      </p>
                      <p className="text-xs text-amber-800 mt-0.5 font-medium">
                        {hoursPlaceholder}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Embedded Map of Kénitra */}
              <div className="lg:col-span-7 flex flex-col">
                <div className="bg-[#F8FAFC] rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex-1 flex flex-col">
                  <div className="px-5 py-3.5 bg-[#0B192C] text-white flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-bold flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#D4AF37]" />
                      {t.contactSection.mapTitle}
                    </span>
                    <span className="text-[11px] text-slate-300">
                      {t.contactSection.mapBadge}
                    </span>
                  </div>

                  <div className="relative flex-1 min-h-[340px] bg-slate-100">
                    <iframe
                      title={t.contactSection.mapTitle}
                      src="https://www.openstreetmap.org/export/embed.html?bbox=-6.6350%2C34.2250%2C-6.5300%2C34.2850&layer=mapnik&marker=34.2610%2C-6.5802"
                      className="w-full h-full min-h-[340px] border-0"
                      loading="lazy"
                    />
                  </div>

                  <div className="px-5 py-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                    <span>{t.contactSection.mapFooterNote}</span>
                    <a
                      href="https://www.openstreetmap.org/?mlat=34.2610&mlon=-6.5802#map=13/34.2610/-6.5802"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-[#0B192C] hover:text-[#9A7432]"
                    >
                      <span>{t.contactSection.mapOpenLink}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION MENTIONS LÉGALES (avec champs clairement identifiés à compléter)
        =================================================================== */}
        <section
          ref={mentionsRef}
          id="mentions-legales"
          className="py-14 bg-[#F8FAFC] border-b border-slate-200 scroll-mt-20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#9A7432]">
                  {t.legalSection.badge}
                </span>
                <h2
                  className={`text-xl sm:text-2xl font-extrabold text-[#0B192C] mt-1 ${
                    isRtl
                      ? "font-['Cairo',sans-serif]"
                      : "font-['Plus_Jakarta_Sans',sans-serif]"
                  }`}
                >
                  {t.legalSection.h2}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  {t.legalSection.intro}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-slate-700">
                <div className="space-y-2">
                  <h3 className="font-extrabold text-[#0B192C]">
                    {t.legalSection.col1Title}
                  </h3>
                  <ul className="space-y-1.5">
                    <li>
                      <strong>{t.legalSection.commercialNameLabel}</strong>{' '}
                      {ABBOUD_AGENCY_CONFIG.nom} (Kénitra, Maroc)
                    </li>
                    <li>
                      <strong>{t.legalSection.legalNameLabel}</strong>{' '}
                      <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                        {legalPlaceholders.raisonSociale} — {legalPlaceholders.formeJuridique}
                      </span>
                    </li>
                    <li>
                      <strong>{t.legalSection.hqAddressLabel}</strong>{' '}
                      <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                        {addressPlaceholder}
                      </span>
                    </li>
                    <li>
                      <strong>{t.legalSection.phonesLabel}</strong>{' '}
                      <span dir="ltr">
                        {ABBOUD_AGENCY_CONFIG.telephonePrincipal} /{' '}
                        {ABBOUD_AGENCY_CONFIG.telephoneSecondaire}
                      </span>
                    </li>
                    <li>
                      <strong>{t.legalSection.emailLabel}</strong> {ABBOUD_AGENCY_CONFIG.email}
                    </li>
                    <li>
                      <strong>{t.legalSection.iceLabel}</strong>{' '}
                      <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                        {legalPlaceholders.ice}
                      </span>
                    </li>
                    <li>
                      <strong>{t.legalSection.rcLabel}</strong>{' '}
                      <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                        {legalPlaceholders.registreCommerce} /{' '}
                        {legalPlaceholders.identifiantFiscal} / {legalPlaceholders.patente}
                      </span>
                    </li>
                    <li>
                      <strong>{t.legalSection.hostLabel}</strong>{' '}
                      <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                        {legalPlaceholders.hebergeur}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-extrabold text-[#0B192C]">
                    {t.legalSection.col2Title}
                  </h3>
                  <p>
                    <strong>{t.legalSection.natureTitle}</strong> {t.legalSection.natureBody}
                  </p>
                  <p>
                    <strong>{t.legalSection.privacyTitle}</strong> {t.legalSection.privacyBody}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ===================================================================
          PARTIE 7 : PIED DE PAGE (Liens utiles et mentions légales)
      =================================================================== */}
      <footer className="bg-[#07111E] text-slate-300 border-t-4 border-[#C89D54]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-white/10">
            {/* Brand Column */}
            <div className="md:col-span-5 space-y-4">
              <AbboudLogo size="md" variant="dark" />
              <p className="text-xs sm:text-sm text-slate-300 max-w-sm leading-relaxed">
                {t.footer.description}
              </p>
              <p className="text-xs font-bold text-[#D4AF37]">
                « {ABBOUD_AGENCY_CONFIG.slogan} »
              </p>

              {/* Footer Language Switcher */}
              <div className="pt-2 flex items-center gap-2">
                {ABBOUD_LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => handleLanguageChange(l.code)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      lang === l.code
                        ? 'bg-[#C89D54] text-[#0B192C] border-[#C89D54]'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:text-white'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Useful Internal Links (SEO) */}
            <div className="md:col-span-4 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#D4AF37]">
                {t.footer.navTitle}
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                <li>
                  <Link
                    to={buildLangPath('/')}
                    className="hover:text-[#D4AF37] transition-colors"
                  >
                    {t.nav.accueil}
                  </Link>
                </li>
                <li>
                  <Link
                    to={buildLangPath('/vehicules')}
                    className="hover:text-[#D4AF37] transition-colors"
                  >
                    {t.nav.vehicules}
                  </Link>
                </li>
                <li>
                  <Link
                    to={buildLangPath('/reservation')}
                    className="hover:text-[#D4AF37] transition-colors"
                  >
                    {t.nav.reservation}
                  </Link>
                </li>
                <li>
                  <Link
                    to={buildLangPath('/agence')}
                    className="hover:text-[#D4AF37] transition-colors"
                  >
                    {t.nav.agence}
                  </Link>
                </li>
                <li>
                  <Link
                    to={buildLangPath('/faq')}
                    className="hover:text-[#D4AF37] transition-colors"
                  >
                    {t.nav.faq}
                  </Link>
                </li>
                <li>
                  <Link
                    to={buildLangPath('/contact')}
                    className="hover:text-[#D4AF37] transition-colors"
                  >
                    {t.nav.contact}
                  </Link>
                </li>
                <li>
                  <Link
                    to={buildLangPath('/mentions-legales')}
                    className="hover:text-[#D4AF37] transition-colors"
                  >
                    {t.nav.mentions}
                  </Link>
                </li>
                <li>
                  <Link to="/admin" className="hover:text-[#D4AF37] transition-colors">
                    {t.adminSpace}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Direct Contact Summary */}
            <div className="md:col-span-3 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#D4AF37]">
                {t.footer.contactTitle}
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li>
                  <a
                    href={`tel:${ABBOUD_AGENCY_CONFIG.telephonePrincipalIntl}`}
                    dir="ltr"
                    className="font-bold text-white hover:text-[#D4AF37] inline-flex items-center gap-2"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                    {t.footer.callLine1}
                  </a>
                </li>
                <li>
                  <a
                    href={`tel:${ABBOUD_AGENCY_CONFIG.telephoneSecondaireIntl}`}
                    dir="ltr"
                    className="font-bold text-white hover:text-[#D4AF37] inline-flex items-center gap-2"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                    {t.footer.callLine2}
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${ABBOUD_AGENCY_CONFIG.email}`}
                    className="hover:text-[#D4AF37] inline-flex items-center gap-2 break-all"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
                    {ABBOUD_AGENCY_CONFIG.email}
                  </a>
                </li>
                <li className="text-xs text-slate-400 pt-1">
                  {ABBOUD_AGENCY_CONFIG.ville}, {ABBOUD_AGENCY_CONFIG.pays}
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>
              © {new Date().getFullYear()} {ABBOUD_AGENCY_CONFIG.nom} (Kénitra, Maroc).{' '}
              {t.footer.rights}
            </p>
            <div className="flex items-center gap-4">
              <Link
                to={buildLangPath('/mentions-legales')}
                className="hover:text-[#D4AF37] transition-colors"
              >
                {t.nav.mentions}
              </Link>
              <span>•</span>
              <Link
                to={buildLangPath('/contact')}
                className="hover:text-[#D4AF37] transition-colors"
              >
                {t.nav.contact}
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ===================================================================
          BOUTON WHATSAPP FLOTTANT PERMANENT
      =================================================================== */}
      <a
        href={mainWhatsAppHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t.footer.floatingWhatsappTitle}
        className={`fixed bottom-5 ${
          isRtl ? 'left-5' : 'right-5'
        } z-50 inline-flex items-center gap-2.5 px-4 py-3.5 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white font-extrabold text-xs sm:text-sm shadow-2xl border-2 border-white transition-transform hover:scale-105`}
      >
        <MessageCircle className="w-5 h-5 fill-white" />
        <span className="hidden sm:inline">{t.footer.floatingWhatsappText}</span>
      </a>
    </div>
  );
};

export default AbboudPublicSite;
