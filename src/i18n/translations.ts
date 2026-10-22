import { Language } from '../types/domain';

export interface TranslationDictionary {
  dir: 'ltr' | 'rtl';
  langLabel: string;
  nav: {
    home: string;
    fleet: string;
    airportChauffeur: string;
    booking: string;
    customerPortal: string;
    chauffeurPortal: string;
    admin: string;
    bookNow: string;
  };
  hero: {
    badge: string;
    headline: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    trust1: string;
    trust2: string;
    trust3: string;
  };
  search: {
    title: string;
    pickupLocation: string;
    returnLocation: string;
    pickupDate: string;
    pickupTime: string;
    returnDate: string;
    returnTime: string;
    driverAge: string;
    airportDelivery: string;
    chauffeurService: string;
    submitBtn: string;
  };
  fleet: {
    title: string;
    subtitle: string;
    allCategories: string;
    perDay: string;
    weeklyRate: string;
    monthlyRate: string;
    depositLabel: string;
    mileageLabel: string;
    bookVehicle: string;
    detailsBtn: string;
    unavailable: string;
    demoBadge: string;
  };
  common: {
    currency: string;
    whatsappCta: string;
    loading: string;
  };
}

export const TRANSLATIONS: Record<Language, TranslationDictionary> = {
  fr: {
    dir: 'ltr',
    langLabel: 'Français',
    nav: {
      home: 'Accueil',
      fleet: 'Flotte Prestige',
      airportChauffeur: 'Aéroport & Chauffeur',
      booking: 'Réservation',
      customerPortal: 'Espace Client',
      chauffeurPortal: 'Portail Chauffeur',
      admin: 'Administration',
      bookNow: 'Réserver une voiture',
    },
    hero: {
      badge: 'KÉNITRA • GARE LGV • AÉROPORTS RBA, CMN & TNG',
      headline: 'Votre liberté commence ici.',
      subtitle:
        "Location de voitures premium à Kénitra. Réservez en ligne et profitez de notre service de livraison et d'accueil à l'aéroport.",
      primaryCta: 'Réserver une voiture',
      secondaryCta: 'Transfert aéroport avec chauffeur',
      trust1: 'Disponibilité garantie en temps réel',
      trust2: 'Accueil VIP Aéroports RBA, CMN & Gare LGV',
      trust3: 'Tarifs transparents en MAD • Caution séparée',
    },
    search: {
      title: 'Moteur de Recherche & Disponibilité Temps Réel',
      pickupLocation: 'Lieu de prise en charge',
      returnLocation: 'Lieu de restitution',
      pickupDate: 'Date de départ',
      pickupTime: 'Heure',
      returnDate: 'Date de retour',
      returnTime: 'Heure',
      driverAge: 'Âge du conducteur',
      airportDelivery: 'Livraison Aéroport VIP',
      chauffeurService: 'Avec Chauffeur Privé',
      submitBtn: 'Rechercher les véhicules disponibles',
    },
    fleet: {
      title: 'Collection Automobile & Flotte Kénitra',
      subtitle:
        'Des citadines automatiques récentes aux berlines exécutives et SUV de prestige, entretenus selon les standards constructeurs.',
      allCategories: 'Toutes les catégories',
      perDay: '/ jour',
      weeklyRate: 'Semaine (-12%)',
      monthlyRate: 'Mois (-25%)',
      depositLabel: 'Caution remboursable',
      mileageLabel: 'Kilométrage',
      bookVehicle: 'Sélectionner ce véhicule',
      detailsBtn: 'Fiche & Calendrier',
      unavailable: 'Indisponible sur ces dates',
      demoBadge: 'DONNÉES DÉMO — ÉDITABLE ADMIN',
    },
    common: {
      currency: 'MAD',
      whatsappCta: 'Conciergerie WhatsApp',
      loading: 'Chargement sécurisé...',
    },
  },
  ar: {
    dir: 'rtl',
    langLabel: 'العربية',
    nav: {
      home: 'الرئيسية',
      fleet: 'أسطول السيارات',
      airportChauffeur: 'المطار وسائق خاص',
      booking: ' الحجز',
      customerPortal: 'فضاء الزبناء',
      chauffeurPortal: 'بوابة السائقين',
      admin: 'الإدارة',
      bookNow: 'احجز سيارة الآن',
    },
    hero: {
      badge: 'القنيطرة • محطة البراق • مطارات الرباط والدار البيضاء وطنجة',
      headline: 'حريتكم تبدأ من هنا.',
      subtitle:
        'تأجير سيارات فاخرة في القنيطرة. احجز عبر الإنترنت واستفد من خدمة التسليم والاستقبال المميز في المطار.',
      primaryCta: 'احجز سيارة',
      secondaryCta: 'نقل المطار مع سائق خاص',
      trust1: 'توفر فوري ومؤكد في الوقت الفعلي',
      trust2: 'استقبال VIP بمطارات الرباط والدار البيضاء ومحطة البراق',
      trust3: 'أسعار شفافة بالدرهم المغربي • ضمان قابل للاسترداد',
    },
    search: {
      title: 'محرك البحث عن السيارات المتاحة',
      pickupLocation: 'مكان الاستلام',
      returnLocation: 'مكان الإرجاع',
      pickupDate: 'تاريخ الاستلام',
      pickupTime: 'الساعة',
      returnDate: 'تاريخ الإرجاع',
      returnTime: 'الساعة',
      driverAge: 'عمر السائق',
      airportDelivery: 'تسليم بالمطار VIP',
      chauffeurService: 'مع سائق خاص محترف',
      submitBtn: 'البحث عن السيارات المتوفرة',
    },
    fleet: {
      title: 'أسطول السيارات الفاخرة والاقتصادية بالقنيطرة',
      subtitle:
        'تشكيلة منتقاة من السيارات الأوتوماتيكية الحديثة، سيارات الدفع الرباعي، وسيارات رجال الأعمال مع سائق.',
      allCategories: 'جميع الفئات',
      perDay: '/ يوم',
      weeklyRate: 'أسبوعي (-12%)',
      monthlyRate: 'شهري (-25%)',
      depositLabel: 'الضمان القابل للاسترداد',
      mileageLabel: 'الكيلومترات',
      bookVehicle: 'اختر هذه السيارة',
      detailsBtn: 'التفاصيل والتقويم',
      unavailable: 'غير متوفرة في هذه التواريخ',
      demoBadge: 'بيانات تجريبية — قابلة للتعديل',
    },
    common: {
      currency: 'درهم',
      whatsappCta: 'تواصل عبر واتساب',
      loading: 'جاري التحميل...',
    },
  },
  en: {
    dir: 'ltr',
    langLabel: 'English',
    nav: {
      home: 'Home',
      fleet: 'Luxury Fleet',
      airportChauffeur: 'Airport & Chauffeur',
      booking: 'Book Online',
      customerPortal: 'Client Portal',
      chauffeurPortal: 'Chauffeur Portal',
      admin: 'Admin Dashboard',
      bookNow: 'Reserve a Vehicle',
    },
    hero: {
      badge: 'KÉNITRA • AL BORAQ TGV • RBA, CMN & TNG AIRPORTS',
      headline: 'Votre liberté commence ici.',
      subtitle:
        'Premium car rental in Kénitra. Book online and enjoy our signature airport delivery, meet-and-greet, and private chauffeur services.',
      primaryCta: 'Réserver une voiture',
      secondaryCta: 'Transfert aéroport avec chauffeur',
      trust1: 'Real-time concurrency-safe availability',
      trust2: 'VIP Meet & Greet at RBA, CMN & Kénitra TGV',
      trust3: 'Transparent MAD pricing • Separated security deposit',
    },
    search: {
      title: 'Real-Time Fleet Availability & Booking Engine',
      pickupLocation: 'Pickup Location',
      returnLocation: 'Return Location',
      pickupDate: 'Pickup Date',
      pickupTime: 'Time',
      returnDate: 'Return Date',
      returnTime: 'Time',
      driverAge: 'Driver Age',
      airportDelivery: 'VIP Airport Delivery',
      chauffeurService: 'With Private Chauffeur',
      submitBtn: 'Search Available Vehicles',
    },
    fleet: {
      title: 'Executive & Prestige Fleet in Kénitra',
      subtitle:
        'From automatic city cars to executive sedans, luxury SUVs, and chauffeur-driven VIP vans maintained to OEM standards.',
      allCategories: 'All Categories',
      perDay: '/ day',
      weeklyRate: 'Weekly (-12%)',
      monthlyRate: 'Monthly (-25%)',
      depositLabel: 'Refundable Deposit',
      mileageLabel: 'Mileage Policy',
      bookVehicle: 'Select Vehicle',
      detailsBtn: 'Specs & Calendar',
      unavailable: 'Unavailable for selected dates',
      demoBadge: 'DEMO DATA — EDITABLE IN ADMIN',
    },
    common: {
      currency: 'MAD',
      whatsappCta: 'WhatsApp Concierge',
      loading: 'Loading...',
    },
  },
};
