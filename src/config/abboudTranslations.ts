import { AbboudPageSlug } from './abboudConfig';

export type AbboudLang = 'fr' | 'ar' | 'en';

export interface LocalizedText {
  fr: string;
  ar: string;
  en: string;
}

export const ABBOUD_LANGUAGES: {
  code: AbboudLang;
  label: string;
  shortLabel: string;
  dir: 'ltr' | 'rtl';
}[] = [
  { code: 'fr', label: 'Français', shortLabel: 'FR', dir: 'ltr' },
  { code: 'ar', label: 'العربية', shortLabel: 'عربي', dir: 'rtl' },
  { code: 'en', label: 'English', shortLabel: 'EN', dir: 'ltr' },
];

export const ABBOUD_LOCALIZED_SEO: Record<
  AbboudLang,
  Record<
    AbboudPageSlug,
    {
      title: string;
      description: string;
      h1: string;
    }
  >
> = {
  fr: {
    accueil: {
      title: 'Location de voitures à Kénitra avec Abboud | Kénitra & Axe Rabat',
      description:
        'Besoin d’une location de voitures à Kénitra ou pour vos trajets Kénitra – Rabat ? Abboud Location propose des citadines et SUV (Peugeot 208, Renault Clio, Dacia Sandero, Opel Corsa, Hyundai Tucson). Demandez un tarif sur WhatsApp.',
      h1: 'Location de voitures à Kénitra avec Abboud',
    },
    vehicules: {
      title: 'Catalogue de voitures à louer à Kénitra & Axe Rabat | Abboud Location',
      description:
        'Découvrez le catalogue de véhicules d’Abboud Location à Kénitra (région Rabat-Salé-Kénitra) : Peugeot 208, Opel Corsa, Hyundai Tucson, Renault Clio et Dacia Sandero. Demandez votre tarif par WhatsApp.',
      h1: 'Notre catalogue de voitures à louer à Kénitra',
    },
    reservation: {
      title: 'Demande de réservation de voiture à Kénitra & Rabat | Abboud Location',
      description:
        'Envoyez votre demande de réservation de voiture à Kénitra (et déplacements vers Rabat) auprès d’Abboud Location. Choisissez votre véhicule, vos dates et recevez une confirmation rapide sur WhatsApp.',
      h1: 'Demander une réservation de voiture à Kénitra',
    },
    agence: {
      title: 'Agence de location de voitures à Kénitra (Axe Kénitra – Rabat) | Abboud',
      description:
        'Découvrez Abboud Location, agence de location automobile à Kénitra au cœur de la région Rabat-Salé-Kénitra. Service réactif et transparent pour vos trajets à Kénitra, Rabat et au Maroc.',
      h1: 'Abboud Location : votre agence de location automobile à Kénitra',
    },
    faq: {
      title: 'FAQ Location de voiture à Kénitra & Rabat : Documents, Caution, Assurance',
      description:
        'Toutes les réponses à vos questions sur la location de voitures à Kénitra et dans la région de Rabat avec Abboud Location : documents requis, caution, assurance et conditions.',
      h1: 'Questions fréquentes sur la location de voitures à Kénitra',
    },
    contact: {
      title: 'Contacter Abboud Location à Kénitra (Région Rabat-Salé-Kénitra)',
      description:
        'Contactez Abboud Location à Kénitra par téléphone (07 24 77 44 40 / 07 01 12 36 37), WhatsApp ou e-mail pour toute demande de location de voiture à Kénitra et vers Rabat.',
      h1: 'Contacter Abboud Location à Kénitra',
    },
    'mentions-legales': {
      title: 'Mentions légales et confidentialité | Abboud Location Kénitra',
      description:
        'Consultez les mentions légales, les conditions d’utilisation du site et la politique de confidentialité de l’agence Abboud Location à Kénitra, Maroc.',
      h1: 'Mentions légales et politique de confidentialité',
    },
  },
  ar: {
    accueil: {
      title: 'كراء السيارات بالقنيطرة مع عبود | القنيطرة ومحور الرباط',
      description:
        'هل تبحث عن كراء السيارات بالقنيطرة أو لتنقلاتك بين القنيطرة والرباط؟ وكالة Abboud Location تقترح سيارات اقتصادية و SUV (بيجو 208، رينو كليو، داسيا سانديرو، أوبل كورسا، هيونداي توكسون). اطلب التسعيرة عبر واتساب.',
      h1: 'كراء السيارات بالقنيطرة مع وكالة عبود (Abboud)',
    },
    vehicules: {
      title: 'أسطول السيارات للكراء بالقنيطرة وجهـة الرباط | Abboud Location',
      description:
        'اكتشف أسطول سيارات Abboud Location في القنيطرة (جهة الرباط-سلا-القنيطرة): بيجو 208، أوبل كورسا، هيونداي توكسون، رينو كليو وداسيا سانديرو. اطلب التسعيرة عبر واتساب.',
      h1: 'أسطول سياراتنا للكراء في القنيطرة',
    },
    reservation: {
      title: 'طلب حجز سيارة في القنيطرة والرباط | Abboud Location',
      description:
        'أرسل طلب حجز سيارة في القنيطرة (ولتنقلاتكم نحو الرباط) لدى وكالة Abboud Location. اختر السيارة والتواريخ وتوصل بتأكيد سريع عبر واتساب.',
      h1: 'طلب حجز سيارة في القنيطرة',
    },
    agence: {
      title: 'وكالتكم لكراء السيارات بالقنيطرة (جهة الرباط-سلا-القنيطرة) | Abboud',
      description:
        'تعرف على Abboud Location، وكالة كراء السيارات بالقنيطرة في قلب محور القنيطرة – الرباط. خدمة سريعة، عقود واضحة ومواكبة مهنية.',
      h1: 'Abboud Location: وكالتكم لكراء السيارات بالقنيطرة',
    },
    faq: {
      title: 'الأسئلة الشائعة حول كراء السيارات بالقنيطرة والرباط: الوثائق والضمان',
      description:
        'جميع الإجابات عن أسئلتكم بخصوص كراء السيارات بالقنيطرة وجهة الرباط مع Abboud Location: الوثائق المطلوبة، مبلغ الضمان (Caution)، التأمين وشروط الكراء.',
      h1: 'الأسئلة الشائعة حول كراء السيارات بالقنيطرة',
    },
    contact: {
      title: 'اتصل بوكالة Abboud Location بالقنيطرة (جهة الرباط-سلا-القنيطرة)',
      description:
        'تواصل مع وكالة Abboud Location بالقنيطرة عبر الهاتف (07 24 77 44 40 / 07 01 12 36 37) أو واتساب لأي طلب كراء سيارة بالقنيطرة ومحور الرباط.',
      h1: 'اتصل بوكالة Abboud Location في القنيطرة',
    },
    'mentions-legales': {
      title: 'البيانات القانونية وسياسة الخصوصية | Abboud Location القنيطرة',
      description:
        'اطلع على البيانات القانونية وشروط الاستخدام وسياسة الخصوصية الخاصة بوكالة Abboud Location في القنيطرة، المغرب.',
      h1: 'البيانات القانونية وسياسة الخصوصية',
    },
  },
  en: {
    accueil: {
      title: 'Car Rental in Kenitra with Abboud | Kenitra & Rabat Axis',
      description:
        'Looking for car rental in Kenitra or for travel between Kenitra and Rabat? Abboud Location offers city cars and SUVs (Peugeot 208, Renault Clio, Dacia Sandero, Opel Corsa, Hyundai Tucson). Request a quote on WhatsApp.',
      h1: 'Car Rental in Kenitra with Abboud',
    },
    vehicules: {
      title: 'Car Rental Fleet in Kenitra & Rabat Region | Abboud Location',
      description:
        'Explore the Abboud Location vehicle catalogue in Kenitra (Rabat-Salé-Kénitra region): Peugeot 208, Opel Corsa, Hyundai Tucson, Renault Clio, and Dacia Sandero.',
      h1: 'Our Car Rental Catalogue in Kenitra',
    },
    reservation: {
      title: 'Car Rental Reservation Request in Kenitra & Rabat | Abboud Location',
      description:
        'Submit your car rental request in Kenitra (and for trips to Rabat) with Abboud Location. Choose your vehicle and dates for fast confirmation via WhatsApp.',
      h1: 'Request a Car Rental in Kenitra',
    },
    agence: {
      title: 'Your Car Rental Agency in Kenitra (Kenitra – Rabat Axis) | Abboud',
      description:
        'Discover Abboud Location, your car rental agency in Kenitra at the heart of the Rabat-Salé-Kénitra region. Responsive service and clear contracts.',
      h1: 'Abboud Location: Your Car Rental Agency in Kenitra',
    },
    faq: {
      title: 'Car Rental FAQ in Kenitra & Rabat: Documents, Deposit, Insurance',
      description:
        'Answers to frequently asked questions about renting a car in Kenitra and the Rabat region with Abboud Location: required documents, deposit, insurance, and terms.',
      h1: 'Frequently Asked Questions About Car Rental in Kenitra',
    },
    contact: {
      title: 'Contact Abboud Location in Kenitra (Rabat-Salé-Kénitra Region)',
      description:
        'Contact Abboud Location in Kenitra by phone (07 24 77 44 40 / 07 01 12 36 37), WhatsApp, or email for your car rental in Kenitra and the Rabat axis.',
      h1: 'Contact Abboud Location in Kenitra',
    },
    'mentions-legales': {
      title: 'Legal Notice & Privacy Policy | Abboud Location Kenitra',
      description:
        'Read the legal notice, terms of website use, and privacy policy of Abboud Location car rental agency in Kenitra, Morocco.',
      h1: 'Legal Notice & Privacy Policy',
    },
  },
};

export const ABBOUD_UI_TEXT = {
  fr: {
    topBarLocation: 'Agence de location de voitures à Kénitra, Maroc',
    adminSpace: 'Espace Gestion',
    nav: {
      accueil: 'Accueil',
      vehicules: 'Catalogue de véhicules',
      reservation: 'Demande de réservation',
      agence: 'L’agence',
      faq: 'FAQ',
      contact: 'Contact',
      mentions: 'Mentions légales',
    },
    hero: {
      badge: 'Agence locale à Kénitra · Maroc',
      description:
        'Pour vos déplacements personnels, familiaux ou professionnels à Kénitra et au Maroc, Abboud Location met à votre disposition une sélection de citadines et de SUV entretenus avec soin. Contactez notre équipe pour vérifier la disponibilité aux dates de votre choix et obtenir un tarif personnalisé.',
      btnDiscover: 'Découvrir nos voitures',
      btnWhatsapp: 'Réserver sur WhatsApp',
      directCallLabel: 'Appel direct Kénitra :',
      pillars: [
        {
          title: 'Prise en charge à Kénitra',
          desc: 'Remise du véhicule sur rendez-vous à Kénitra selon vos besoins.',
        },
        {
          title: 'Contrat & état des lieux clairs',
          desc: 'Conditions, caution et assurance précisées par écrit avant le départ.',
        },
        {
          title: 'Assistance WhatsApp & Téléphone',
          desc: 'Réponse rapide de notre équipe locale au 07 24 77 44 40 ou 07 01 12 36 37.',
        },
      ],
      visualCardBadge: 'Catalogue Abboud Location · Kénitra',
      visualCardModels: 'Peugeot 208 · Opel Corsa · Hyundai Tucson · Renault Clio · Dacia Sandero',
      visualCardStatus: 'Disponibilité & tarif sur demande',
      visualCardBtn: 'Demander un tarif',
      defaultWhatsappHello:
        'Bonjour Abboud Location, je souhaite avoir des informations pour louer une voiture à Kénitra.',
    },
    catalogue: {
      badge: 'Catalogue de véhicules · Kénitra',
      h2: 'Nos modèles proposés à la location à Kénitra',
      intro:
        'Consultez les modèles de notre flotte à Kénitra. Les tarifs et la disponibilité exacte dépendent de la période et de la durée souhaitées : cliquez sur « Demander un tarif » pour recevoir une proposition confirmée par l’agence.',
      callBtn: 'Appeler le',
      brandLabel: 'Marque :',
      modelLabel: 'Modèle :',
      transmissionLabel: 'Transmission',
      fuelLabel: 'Carburant',
      seatsLabel: 'Nombre de places',
      rateLabel: 'Tarif :',
      askQuoteBtn: 'Demander un tarif',
      whatsappQuoteTemplate: (vehicleName: string) =>
        `Bonjour Abboud Location, je souhaite demander un tarif et vérifier la disponibilité pour le modèle ${vehicleName} à Kénitra.`,
      noteTitle: 'Note sur les caractéristiques et tarifs :',
      noteBody:
        'Les visuels sont présentés à titre illustratif. La motorisation exacte, la boîte de vitesses disponible, le tarif journalier ainsi que le montant de la caution vous sont communiqués et confirmés par l’agence avant toute validation de réservation.',
    },
    form: {
      badge: 'Formulaire de demande · Soumis à confirmation',
      h2: 'Formulaire de demande de réservation à Kénitra',
      subtitle:
        'Remplissez les informations ci-dessous pour préparer votre demande de réservation. Toute demande est soumise à confirmation de disponibilité et de tarif par l’agence Abboud Location.',
      honestBannerTitle: 'Fonctionnement transparent (sans fausse confirmation d’envoi) :',
      honestBannerBody:
        'Ce site n’étant pas relié à un serveur d’envoi automatique externe, la validation de ce formulaire prépare un récapitulatif complet de votre demande afin que vous puissiez le transmettre directement à l’agence en un clic sur WhatsApp, par e-mail ou par téléphone.',
      step1Title: '1. Détails de la location souhaitée',
      vehicleField: 'Véhicule souhaité *',
      pickupLocationField: 'Lieu de prise en charge à Kénitra *',
      startDateField: 'Date de départ souhaitée *',
      endDateField: 'Date de retour souhaitée *',
      step2Title: '2. Vos coordonnées de contact',
      fullNameField: 'Nom et prénom *',
      fullNamePlaceholder: 'Ex : Karim El Amrani',
      phoneField: 'Téléphone / WhatsApp *',
      phonePlaceholder: 'Ex : 06 00 00 00 00',
      emailField: 'E-mail (optionnel)',
      emailPlaceholder: 'Ex : client@exemple.ma',
      cityField: 'Ville de résidence (optionnel)',
      cityPlaceholder: 'Ex : Kénitra',
      messageField: 'Précisions complémentaires (heure souhaitée, question sur le tarif…)',
      messagePlaceholder:
        'Indiquez vos préférences horaires ou toute question destinée à l’agence…',
      disclaimerText:
        'En préparant cette demande, vous reconnaissez qu’il s’agit d’une demande de réservation préalable soumise à confirmation par l’agence Abboud Location. Aucun paiement en ligne n’est demandé.',
      submitBtn: 'Préparer ma demande de réservation',
      sidebarTitle: 'Besoin d’une réponse immédiate ?',
      sidebarBody:
        'Nos conseillers à Kénitra vous répondent directement par téléphone ou sur WhatsApp pour vous confirmer la disponibilité et le tarif.',
      sidebarWhatsapp1: 'WhatsApp Principal (07 24 77 44 40)',
      sidebarWhatsapp2: 'WhatsApp Secondaire (07 01 12 36 37)',
      sidebarCall1: 'Appeler le 07 24 77 44 40',
      sidebarCall2: 'Appeler le 07 01 12 36 37',
      sidebarProcessTitle: 'Étapes de confirmation :',
      sidebarSteps: [
        'Vous choisissez le véhicule, vos dates et le lieu de remise à Kénitra.',
        'Vous transmettez votre demande à l’agence via WhatsApp, téléphone ou e-mail.',
        'Abboud Location vérifie le planning réel et vous confirme le tarif et la disponibilité.',
      ],
      errorRequired: 'Veuillez renseigner votre nom, votre numéro de téléphone et le véhicule souhaité.',
      errorDates: 'Veuillez sélectionner une date de départ et une date de retour.',
      errorDateOrder: 'La date de retour doit être postérieure ou égale à la date de départ.',
      readyBannerBadge:
        'Demande prête à être transmise · En attente d’envoi à l’agence',
      readyBannerTitle:
        'Votre demande de réservation est prête : choisissez votre canal d’envoi',
      readyBannerBody:
        'Pour que notre équipe à Kénitra reçoive immédiatement votre demande (aucun envoi automatique en arrière-plan n’étant effectué sans votre action), cliquez sur l’un des boutons ci-dessous pour envoyer votre récapitulatif sur WhatsApp ou par e-mail :',
      sendWhatsapp1: 'Envoyer sur WhatsApp (07 24 77 44 40)',
      sendWhatsapp2: 'WhatsApp ligne 2 (07 01 12 36 37)',
      sendEmail: 'Envoyer par e-mail',
      copyBtn: 'Copier le récapitulatif',
      copiedBtn: 'Récapitulatif copié !',
      summaryLabel: 'Aperçu du message préparé :',
      mailSubject: (vehicle: string, name: string) =>
        `Demande de réservation - ${vehicle} - ${name}`,
      summaryTemplate: (data: {
        vehicle: string;
        start: string;
        end: string;
        location: string;
        name: string;
        phone: string;
        email?: string;
        city?: string;
        notes?: string;
      }) =>
        [
          'Bonjour Abboud Location (Kénitra),',
          'Je souhaite effectuer une demande de réservation (soumise à confirmation de disponibilité et de tarif par l’agence) :',
          `• Véhicule souhaité : ${data.vehicle}`,
          `• Date de départ : ${data.start}`,
          `• Date de retour : ${data.end}`,
          `• Lieu de prise en charge : ${data.location}`,
          `• Nom complet : ${data.name}`,
          `• Téléphone : ${data.phone}`,
          data.email ? `• E-mail : ${data.email}` : null,
          data.city ? `• Ville : ${data.city}` : null,
          data.notes ? `• Précisions : ${data.notes}` : null,
          'Merci de me confirmer la disponibilité et le tarif correspondant.',
        ]
          .filter(Boolean)
          .join('\n'),
    },
    agency: {
      badge: 'Présentation de l’agence · Kénitra & Axe Rabat',
      h2: 'Votre partenaire de confiance pour la location de voitures à Kénitra et sur l’axe Kénitra – Rabat',
      p1: 'Située à Kénitra, au cœur de la région Rabat-Salé-Kénitra, l’agence Abboud Location accompagne les particuliers, les familles, les Marocains résidant à l’étranger (MRE) ainsi que les professionnels à la recherche d’un service de location de voitures à Kénitra fiable, clair et réactif pour leurs déplacements à Kénitra, vers Rabat et dans tout le Maroc.',
      p2: 'Que vous souhaitiez louer une voiture à Kénitra pour circuler aisément en centre-ville, rejoindre la gare ONCF de Kénitra, vous rendre vers Mehdia, effectuer des trajets réguliers entre Kénitra et Rabat ou parcourir les axes autoroutiers du Royaume, notre catalogue réunit des véhicules adaptés à chaque usage : citadines maniables (Peugeot 208, Renault Clio, Opel Corsa), berlines compactes pratiques (Dacia Sandero) et SUV spacieux (Hyundai Tucson).',
      p3: 'Chez Abboud Location, chaque location automobile à Kénitra repose sur des engagements simples : une confirmation directe des disponibilités et des modalités de prise en charge avant tout déplacement, un contrat de location écrit et un état des lieux contradictoire au départ comme à la restitution du véhicule.',
      card1Title: 'Citadines & SUV pour vos trajets à Kénitra et vers Rabat',
      card1Body:
        'Une sélection centrée sur des modèles reconnus pour leur confort de conduite et leur polyvalence, aussi bien pour les trajets urbains à Kénitra que pour la liaison autoroutière Kénitra – Rabat.',
      card2Title: 'Accompagnement humain et transparence contractuelle',
      card2Body:
        'Pas de frais cachés ni de promesses automatisées : vous échangez directement avec un responsable d’Abboud Location à Kénitra qui vous précise le tarif, la caution et les documents requis.',
      card3Title: 'Réservation simple par WhatsApp ou téléphone',
      card3Body:
        'Contactez-nous directement au 07 24 77 44 40 ou au 07 01 12 36 37 pour obtenir une réponse rapide sur la disponibilité d’une voiture à Kénitra.',
      card3BtnCatalog: 'Voir les véhicules',
      card3BtnForm: 'Faire une demande',
    },
    faqSection: {
      badge: 'Questions fréquentes · FAQ',
      h2: 'Tout savoir sur la location de voiture à Kénitra (Documents, Caution, Assurance)',
      intro:
        'Retrouvez ci-dessous les réponses aux questions essentielles concernant les documents à fournir, le dépôt de garantie (caution), l’assurance et les modalités de réservation chez Abboud Location.',
    },
    contactSection: {
      badge: 'Contact & Localisation · Kénitra',
      h2: 'Contacter Abboud Location à Kénitra',
      intro:
        'Notre équipe est joignable par téléphone, sur WhatsApp ou par e-mail pour répondre à vos questions et confirmer votre réservation de véhicule à Kénitra.',
      phonesTitle: 'Téléphones & WhatsApp (Vérifiés)',
      mainLineLabel: 'Ligne principale — Appel & WhatsApp',
      secondLineLabel: 'Ligne secondaire — Appel & WhatsApp',
      whatsappBtn: 'WhatsApp',
      emailLabel: 'Adresse e-mail',
      addressHoursTitle: 'Adresse & Horaires à Kénitra',
      cityServedLabel: 'Ville desservie :',
      cityServedValue: 'Kénitra, Maroc (Région Rabat-Salé-Kénitra)',
      exactAddressLabel: 'Adresse exacte de l’agence :',
      openingHoursLabel: 'Horaires d’ouverture :',
      mapTitle: 'Carte de localisation — Kénitra, Maroc',
      mapBadge: 'Kénitra · Maroc',
      mapFooterNote:
        'Zone d’intervention : Kénitra (Centre-Ville, Gare ONCF Kénitra, Mehdia et alentours sur rendez-vous).',
      mapOpenLink: 'Ouvrir Kénitra sur OpenStreetMap',
    },
    legalSection: {
      badge: 'Informations juridiques · Transparence',
      h2: 'Mentions légales & Politique de confidentialité',
      intro:
        'Les champs encadrés ci-dessous identifient clairement les informations administratives et légales devant être complétées par l’agence Abboud Location avant publication définitive.',
      col1Title: 'Éditeur du site & Identification de l’agence',
      commercialNameLabel: 'Nom commercial :',
      legalNameLabel: 'Raison sociale / Forme juridique :',
      hqAddressLabel: 'Adresse du siège social :',
      phonesLabel: 'Téléphones :',
      emailLabel: 'E-mail :',
      iceLabel: 'ICE :',
      rcLabel: 'RC / IF / Patente :',
      hostLabel: 'Hébergeur :',
      col2Title: 'Conditions d’utilisation & Données personnelles',
      natureTitle: 'Nature des informations et demandes en ligne :',
      natureBody:
        'Les informations présentées sur ce site (catalogue de véhicules, caractéristiques indicatives) sont fournies à titre d’information. Toute demande effectuée via le formulaire ou par WhatsApp constitue une demande de réservation préalable, soumise à confirmation expresse de disponibilité et de tarif par l’agence Abboud Location.',
      privacyTitle: 'Protection des données personnelles (Loi n° 09-08 au Maroc) :',
      privacyBody:
        'Les informations que vous saisissez dans le formulaire (nom, téléphone, dates souhaitées) servent uniquement à préparer votre demande de location auprès d’Abboud Location. Elles ne font l’objet d’aucune cession commerciale à des tiers.',
    },
    footer: {
      description:
        'Agence de location de voitures à Kénitra, au Maroc. Citadines, berlines compactes et SUV sur demande par WhatsApp ou par téléphone.',
      navTitle: 'Navigation & Pages utiles',
      contactTitle: 'Contact direct — Kénitra',
      callLine1: 'Appeler : 07 24 77 44 40',
      callLine2: 'Appeler : 07 01 12 36 37',
      rights: 'Tous droits réservés.',
      floatingWhatsappTitle: 'Contacter Abboud Location sur WhatsApp',
      floatingWhatsappText: 'WhatsApp Devis',
    },
  },
  ar: {
    topBarLocation: 'وكالة كراء السيارات بالقنيطرة، المغرب',
    adminSpace: 'فضاء التسيير',
    nav: {
      accueil: 'الرئيسية',
      vehicules: 'أسطول السيارات',
      reservation: 'طلب حجز',
      agence: 'عن الوكالة',
      faq: 'الأسئلة الشائعة',
      contact: 'اتصل بنا',
      mentions: 'البيانات القانونية',
    },
    hero: {
      badge: 'وكالة محلية بالقنيطرة · المغرب',
      description:
        'لتنقلاتكم الشخصية أو العائلية أو المهنية في مدينة القنيطرة وجميع أنحاء المغرب، تضع وكالة Abboud Location رهن إشارتكم مجموعة مختارة من السيارات الاقتصادية وسيارات الدفع الرباعي (SUV) المعتنى بها. تواصلوا مع فريقنا للتأكد من التوفر في التواريخ المطلوبة والحصول على تسعيرة مناسبة.',
      btnDiscover: 'اكتشف سياراتنا',
      btnWhatsapp: 'احجز عبر واتساب',
      directCallLabel: 'اتصال مباشر بالقنيطرة:',
      pillars: [
        {
          title: 'التسليم في القنيطرة',
          desc: 'تسليم واستلام السيارة بموعد مسبق في مدينة القنيطرة حسب احتياجاتكم.',
        },
        {
          title: 'عقد ومعاينة واضحة',
          desc: 'توضيح الشروط ومبلغ الضمان والتأمين كتابياً قبل استلام السيارة.',
        },
        {
          title: 'مواكبة عبر واتساب والهاتف',
          desc: 'رد سريع من فريقنا المحلي على الرقم 07 24 77 44 40 أو 07 01 12 36 37.',
        },
      ],
      visualCardBadge: 'أسطول Abboud Location · القنيطرة',
      visualCardModels: 'بيجو 208 · أوبل كورسا · هيونداي توكسون · رينو كليو · داسيا سانديرو',
      visualCardStatus: 'التوفر والتسعيرة عند الطلب',
      visualCardBtn: 'اطلب التسعيرة',
      defaultWhatsappHello:
        'السلام عليكم وكالة Abboud Location، أود الاستفسار حول كراء سيارة في مدينة القنيطرة.',
    },
    catalogue: {
      badge: 'أسطول السيارات · القنيطرة',
      h2: 'موديلات السيارات المقترحة للكراء في القنيطرة',
      intro:
        'تصفحوا موديلات أسطولنا في القنيطرة. تختلف التسعيرة والتوفر الفعلي حسب الفترة ومدة الكراء المطلوبة: اضغطوا على « اطلب التسعيرة » للتوصل بعرض مؤكد من طرف الوكالة.',
      callBtn: 'اتصل بـ',
      brandLabel: 'العلامة:',
      modelLabel: 'الموديل:',
      transmissionLabel: 'ناقل الحركة',
      fuelLabel: 'الوقود',
      seatsLabel: 'عدد المقاعد',
      rateLabel: 'التسعيرة:',
      askQuoteBtn: 'اطلب التسعيرة',
      whatsappQuoteTemplate: (vehicleName: string) =>
        `السلام عليكم وكالة Abboud Location، أود طلب التسعيرة والتأكد من توفر سيارة ${vehicleName} في القنيطرة.`,
      noteTitle: 'ملاحظة بخصوص المواصفات والأسعار:',
      noteBody:
        'الصور المعروضة توضيحية. يتم تأكيد نوع المحرك المتاح وناقل الحركة والتسعيرة اليومية ومبلغ الضمان من طرف الوكالة قبل أي تأكيد نهائي للحجز.',
    },
    form: {
      badge: 'نموذج طلب حجز · خاضع لتأكيد الوكالة',
      h2: 'نموذج طلب حجز سيارة في القنيطرة',
      subtitle:
        'املا المعلومات أسفله لإعداد طلب الحجز الخاص بك. كل طلب يبقى خاضعاً لتأكيد التوفر والتسعيرة من طرف وكالة Abboud Location.',
      honestBannerTitle: 'طريقة عمل واضحة وشفافة (بدون تأكيد إرسال وهمي):',
      honestBannerBody:
        'نظراً لعدم ارتباط الموقع بخادم إرسال خارجي تلقائي، فإن المصادقة على هذا النموذج تقوم بإعداد ملخص كامل لطلبكم لتتمكنوا من إرساله مباشرة إلى الوكالة بنقرة واحدة عبر واتساب أو البريد الإلكتروني أو الهاتف.',
      step1Title: '1. تفاصيل الكراء المطلوب',
      vehicleField: 'السيارة المطلوبة *',
      pickupLocationField: 'مكان استلام السيارة بالقنيطرة *',
      startDateField: 'تاريخ الانطلاق المطلوب *',
      endDateField: 'تاريخ العودة المطلوب *',
      step2Title: '2. بيانات الاتصال الخاصة بكم',
      fullNameField: 'الاسم الكامل *',
      fullNamePlaceholder: 'مثال: كريم العمراني',
      phoneField: 'رقم الهاتف / واتساب *',
      phonePlaceholder: 'مثال: 06 00 00 00 00',
      emailField: 'البريد الإلكتروني (اختياري)',
      emailPlaceholder: 'مثال: client@exemple.ma',
      cityField: 'مدينة الإقامة (اختياري)',
      cityPlaceholder: 'مثال: القنيطرة',
      messageField: 'ملاحظات إضافية (التوقيت المفضل، استفسار حول السعر...)',
      messagePlaceholder: 'أشر إلى التوقيت المناسب لك أو أي سؤال موجه للوكالة...',
      disclaimerText:
        'بإعداد هذا الطلب، تقرون بأنه عبارة عن طلب حجز أولي خاضع لتأكيد التوفر من طرف وكالة Abboud Location. لا يُطلب أي أداء مالي عبر الإنترنت.',
      submitBtn: 'إعداد طلب الحجز الخاص بي',
      sidebarTitle: 'هل تحتاجون إلى إجابة فورية؟',
      sidebarBody:
        'مستشارونا في القنيطرة يجيبونكم مباشرة عبر الهاتف أو واتساب لتأكيد التوفر والتسعيرة.',
      sidebarWhatsapp1: 'واتساب الرئيسي (07 24 77 44 40)',
      sidebarWhatsapp2: 'واتساب الثانوي (07 01 12 36 37)',
      sidebarCall1: 'اتصال بـ 07 24 77 44 40',
      sidebarCall2: 'اتصال بـ 07 01 12 36 37',
      sidebarProcessTitle: 'مراحل تأكيد الحجز:',
      sidebarSteps: [
        'تختارون السيارة، التواريخ ومكان التسليم في القنيطرة.',
        'ترسلون طلبكم إلى الوكالة عبر واتساب أو الهاتف أو البريد الإلكتروني.',
        'تتحقق Abboud Location من الجدول الفعلي وتؤكد لكم التسعيرة والتوفر.',
      ],
      errorRequired: 'يرجى إدخال الاسم الكامل ورقم الهاتف والسيارة المطلوبة.',
      errorDates: 'يرجى تحديد تاريخ الانطلاق وتاريخ العودة.',
      errorDateOrder: 'يجب أن يكون تاريخ العودة بعد أو يساوي تاريخ الانطلاق.',
      readyBannerBadge: 'الطلب جاهز للإرسال · في انتظار إرساله للوكالة',
      readyBannerTitle: 'طلب الحجز جاهز: اختر وسيلة الإرسال إلى الوكالة',
      readyBannerBody:
        'لكي يتوصل فريقنا في القنيطرة بطلبكم فوراً (حيث لا يتم أي إرسال خفي بدون تدخلكم)، اضغطوا على أحد الأزرار أسفله لإرسال الملخص عبر واتساب أو البريد الإلكتروني:',
      sendWhatsapp1: 'إرسال عبر واتساب (07 24 77 44 40)',
      sendWhatsapp2: 'واتساب الخط 2 (07 01 12 36 37)',
      sendEmail: 'إرسال عبر البريد الإلكتروني',
      copyBtn: 'نسخ الملخص',
      copiedBtn: 'تم نسخ الملخص!',
      summaryLabel: 'معاينة الرسالة المُعدّة:',
      mailSubject: (vehicle: string, name: string) =>
        `طلب حجز سيارة - ${vehicle} - ${name}`,
      summaryTemplate: (data: {
        vehicle: string;
        start: string;
        end: string;
        location: string;
        name: string;
        phone: string;
        email?: string;
        city?: string;
        notes?: string;
      }) =>
        [
          'السلام عليكم وكالة Abboud Location (القنيطرة)،',
          'أود تقديم طلب حجز سيارة (خاضع لتأكيد التوفر والتسعيرة من طرف الوكالة):',
          `• السيارة المطلوبة : ${data.vehicle}`,
          `• تاريخ الانطلاق : ${data.start}`,
          `• تاريخ العودة : ${data.end}`,
          `• مكان الاستلام : ${data.location}`,
          `• الاسم الكامل : ${data.name}`,
          `• الهاتف : ${data.phone}`,
          data.email ? `• البريد الإلكتروني : ${data.email}` : null,
          data.city ? `• المدينة : ${data.city}` : null,
          data.notes ? `• ملاحظات : ${data.notes}` : null,
          'شكراً لتأكيد التوفر والتسعيرة المناسبة.',
        ]
          .filter(Boolean)
          .join('\n'),
    },
    agency: {
      badge: 'تقديم الوكالة · القنيطرة ومحور الرباط',
      h2: 'شريككم الموثوق لكراء السيارات بالقنيطرة وعلى محور القنيطرة – الرباط',
      p1: 'تتواجد وكالة Abboud Location بمدينة القنيطرة، في قلب جهة الرباط-سلا-القنيطرة، وتواكب الأفراد والعائلات ومغاربة العالم (MRE) والمهنيين الباحثين عن خدمة كراء السيارات بالقنيطرة تتميز بالوضوح والسرعة والمصداقية لتنقلاتهم داخل القنيطرة ونحو الرباط وباقي مدن المغرب.',
      p2: 'سواء كنتم ترغبون في كراء سيارة بالقنيطرة للتنقل داخل وسط المدينة، أو الوصول إلى محطة القطار القنيطرة (ONCF)، أو التوجه نحو شاطئ المهدية، أو التنقل اليومي بين القنيطرة والرباط عبر الطريق السيار، فإن أسطولنا يضم سيارات ملائمة لكل استعمال: سيارات اقتصادية عملية (بيجو 208، رينو كليو، أوبل كورسا)، سيارات مدمجة مريحة (داسيا سانديرو) وسيارات رباعية الدفع عائلية (هيونداي توكسون).',
      p3: 'في وكالة Abboud Location، يرتكز كل عقد كراء سيارة بالقنيطرة على التزامات واضحة: تأكيد مباشر للتوفر وشروط الاستلام قبل التنقل، عقد كراء مكتوب، ومعاينة دقيقة لحالة السيارة عند الانطلاق وعند الإرجاع.',
      card1Title: 'سيارات اقتصادية و SUV لتنقلاتكم بالقنيطرة ونحو الرباط',
      card1Body:
        'تشكيلة مختارة بعناية من السيارات المعروفة براحتها في السياقة واعتماديتها، سواء للتنقل الحضري في القنيطرة أو للربط الطرقي بين القنيطرة والرباط.',
      card2Title: 'مواكبة مهنية وشفافية في العقود',
      card2Body:
        'بدون مصاريف خفية أو وعود آلية غير مؤكدة: تتواصلون مباشرة مع مسؤول وكالة Abboud Location بالقنيطرة ليوضح لكم التسعيرة والضمان والوثائق المطلوبة.',
      card3Title: 'حجز سهل عبر واتساب أو الهاتف',
      card3Body:
        'اتصلوا بنا مباشرة على الرقم 07 24 77 44 40 أو 07 01 12 36 37 للحصول على رد سريع حول توفر سيارة في القنيطرة.',
      card3BtnCatalog: 'عرض السيارات',
      card3BtnForm: 'تقديم طلب',
    },
    faqSection: {
      badge: 'الأسئلة الشائعة · FAQ',
      h2: 'كل ما يجب معرفته حول كراء السيارات بالقنيطرة (الوثائق، الضمان، التأمين)',
      intro:
        'تجدون أسفله الإجابات عن الأسئلة الأساسية المتعلقة بالوثائق المطلوبة، مبلغ الضمان (Caution)، التغطية التأمينية وشروط الحجز لدى وكالة Abboud Location.',
    },
    contactSection: {
      badge: 'الاتصال والموقع · القنيطرة',
      h2: 'اتصل بوكالة Abboud Location في القنيطرة',
      intro:
        'فريقنا رهن إشارتكم عبر الهاتف أو واتساب أو البريد الإلكتروني للإجابة عن استفساراتكم وتأكيد حجز سيارتكم في القنيطرة.',
      phonesTitle: 'الهاتف و واتساب (أرقام مؤكدة)',
      mainLineLabel: 'الخط الرئيسي — اتصال و واتساب',
      secondLineLabel: 'الخط الثانوي — اتصال و واتساب',
      whatsappBtn: 'واتساب',
      emailLabel: 'البريد الإلكتروني',
      addressHoursTitle: 'العنوان وأوقات العمل بالقنيطرة',
      cityServedLabel: 'المدينة المغطاة:',
      cityServedValue: 'القنيطرة، المغرب (جهة الرباط-سلا-القنيطرة)',
      exactAddressLabel: 'العنوان الدقيق للوكالة:',
      openingHoursLabel: 'أوقات العمل:',
      mapTitle: 'خريطة الموقع — القنيطرة، المغرب',
      mapBadge: 'القنيطرة · المغرب',
      mapFooterNote:
        'نطاق الخدمة: القنيطرة (وسط المدينة، محطة القطار القنيطرة ONCF، المهدية والنواحي بموعد مسبق).',
      mapOpenLink: 'فتح خريطة القنيطرة على OpenStreetMap',
    },
    legalSection: {
      badge: 'معلومات قانونية · شفافية',
      h2: 'البيانات القانونية وسياسة الخصوصية',
      intro:
        'الحقول المؤطرة أسفله تحدد بوضوح المعلومات الإدارية والقانونية التي يتعين على وكالة Abboud Location استكمالها قبل النشر النهائي.',
      col1Title: 'ناشر الموقع وتعريف الوكالة',
      commercialNameLabel: 'الاسم التجاري:',
      legalNameLabel: 'التسمية الاجتماعية / الشكل القانوني:',
      hqAddressLabel: 'عنوان المقر الاجتماعي:',
      phonesLabel: 'الهاتف:',
      emailLabel: 'البريد الإلكتروني:',
      iceLabel: 'التعريف الموحد للمقاولة (ICE):',
      rcLabel: 'السجل التجاري / المعرف الضريبي / الباتنتا:',
      hostLabel: 'مستضيف الموقع:',
      col2Title: 'شروط الاستخدام وحماية المعطيات الشخصية',
      natureTitle: 'طبيعة المعلومات والطلبات عبر الموقع:',
      natureBody:
        'المعلومات المعروضة على هذا الموقع (أسطول السيارات، المواصفات الإرشادية) مقدمة على سبيل الإخبار. كل طلب يتم إعداده عبر النموذج أو عبر واتساب يُعتبر طلب حجز أولي خاضعاً لتأكيد صريح للتوفر والتسعيرة من طرف وكالة Abboud Location.',
      privacyTitle: 'حماية المعطيات الشخصية (القانون رقم 09-08 بالمغرب):',
      privacyBody:
        'المعطيات التي تدخلونها في النموذج (الاسم، الهاتف، التواريخ المطلوبة) تُستعمل حصرياً لإعداد طلب الكراء الخاص بكم لدى وكالة Abboud Location ولا يتم تفويتها لأي طرف ثالث.',
    },
    footer: {
      description:
        'وكالة كراء السيارات بالقنيطرة، المغرب. سيارات اقتصادية، مدمجة ورباعية الدفع (SUV) عند الطلب عبر واتساب أو الهاتف.',
      navTitle: 'التصفح والصفحات المفيدة',
      contactTitle: 'اتصال مباشر — القنيطرة',
      callLine1: 'اتصال: 07 24 77 44 40',
      callLine2: 'اتصال: 07 01 12 36 37',
      rights: 'جميع الحقوق محفوظة.',
      floatingWhatsappTitle: 'تواصل مع Abboud Location عبر واتساب',
      floatingWhatsappText: 'واتساب للحجز',
    },
  },
  en: {
    topBarLocation: 'Car Rental Agency in Kenitra, Morocco',
    adminSpace: 'Management Portal',
    nav: {
      accueil: 'Home',
      vehicules: 'Vehicles',
      reservation: 'Reservation Request',
      agence: 'About Us',
      faq: 'FAQ',
      contact: 'Contact',
      mentions: 'Legal Notice',
    },
    hero: {
      badge: 'Local Agency in Kenitra · Morocco',
      description:
        'For your personal, family, or business travel in Kenitra and across Morocco, Abboud Location provides a carefully maintained selection of city cars and SUVs. Contact our local team to check availability for your dates and receive a tailored rate.',
      btnDiscover: 'Explore our cars',
      btnWhatsapp: 'Book on WhatsApp',
      directCallLabel: 'Direct call in Kenitra:',
      pillars: [
        {
          title: 'Pickup in Kenitra',
          desc: 'Vehicle handover by appointment in Kenitra according to your schedule.',
        },
        {
          title: 'Clear Contract & Inspection',
          desc: 'Rental terms, deposit, and insurance detailed in writing before departure.',
        },
        {
          title: 'WhatsApp & Phone Support',
          desc: 'Fast response from our local team at 07 24 77 44 40 or 07 01 12 36 37.',
        },
      ],
      visualCardBadge: 'Abboud Location Fleet · Kenitra',
      visualCardModels: 'Peugeot 208 · Opel Corsa · Hyundai Tucson · Renault Clio · Dacia Sandero',
      visualCardStatus: 'Availability & rates on request',
      visualCardBtn: 'Request a quote',
      defaultWhatsappHello:
        'Hello Abboud Location, I would like information about renting a car in Kenitra.',
    },
    catalogue: {
      badge: 'Vehicle Catalogue · Kenitra',
      h2: 'Our Cars Available for Rent in Kenitra',
      intro:
        'Browse the models in our Kenitra fleet. Exact rates and availability depend on your desired dates and rental duration: click “Request a quote” to receive an agency-confirmed offer.',
      callBtn: 'Call',
      brandLabel: 'Brand:',
      modelLabel: 'Model:',
      transmissionLabel: 'Transmission',
      fuelLabel: 'Fuel',
      seatsLabel: 'Seats',
      rateLabel: 'Rate:',
      askQuoteBtn: 'Request a quote',
      whatsappQuoteTemplate: (vehicleName: string) =>
        `Hello Abboud Location, I would like to request a quote and check availability for the ${vehicleName} in Kenitra.`,
      noteTitle: 'Note on specifications and rates:',
      noteBody:
        'Vehicle visuals are shown for illustrative purposes. Exact engine type, transmission availability, daily rate, and security deposit amount are communicated and confirmed by the agency before any booking is finalized.',
    },
    form: {
      badge: 'Reservation Request Form · Subject to Confirmation',
      h2: 'Car Rental Request Form in Kenitra',
      subtitle:
        'Fill in the details below to prepare your reservation request. Every request is subject to availability and rate confirmation by Abboud Location.',
      honestBannerTitle: 'Transparent workflow (no fake send confirmation):',
      honestBannerBody:
        'Because this website is not connected to an automated external mail server, submitting this form prepares a structured summary of your request so you can send it directly to the agency in one click via WhatsApp, email, or phone.',
      step1Title: '1. Desired Rental Details',
      vehicleField: 'Desired Vehicle *',
      pickupLocationField: 'Pickup Location in Kenitra *',
      startDateField: 'Preferred Pickup Date *',
      endDateField: 'Preferred Return Date *',
      step2Title: '2. Your Contact Details',
      fullNameField: 'Full Name *',
      fullNamePlaceholder: 'e.g. Karim El Amrani',
      phoneField: 'Phone / WhatsApp *',
      phonePlaceholder: 'e.g. +212 6 00 00 00 00',
      emailField: 'Email (optional)',
      emailPlaceholder: 'e.g. client@example.com',
      cityField: 'City of Residence (optional)',
      cityPlaceholder: 'e.g. Kenitra',
      messageField: 'Additional notes (preferred time, rate inquiry…)',
      messagePlaceholder:
        'Share your preferred pickup time or any question for the agency…',
      disclaimerText:
        'By preparing this request, you acknowledge that it is a preliminary reservation request subject to confirmation by Abboud Location. No online payment is required.',
      submitBtn: 'Prepare my reservation request',
      sidebarTitle: 'Need an immediate answer?',
      sidebarBody:
        'Our advisors in Kenitra answer directly by phone or WhatsApp to confirm availability and pricing.',
      sidebarWhatsapp1: 'Primary WhatsApp (07 24 77 44 40)',
      sidebarWhatsapp2: 'Secondary WhatsApp (07 01 12 36 37)',
      sidebarCall1: 'Call 07 24 77 44 40',
      sidebarCall2: 'Call 07 01 12 36 37',
      sidebarProcessTitle: 'Confirmation Steps:',
      sidebarSteps: [
        'Select your preferred car, dates, and pickup location in Kenitra.',
        'Send your request to the agency via WhatsApp, phone, or email.',
        'Abboud Location checks real-time fleet availability and confirms your rate.',
      ],
      errorRequired: 'Please enter your full name, phone number, and desired vehicle.',
      errorDates: 'Please select both a pickup date and a return date.',
      errorDateOrder: 'The return date must be on or after the pickup date.',
      readyBannerBadge: 'Request Ready to Send · Awaiting Transmission to Agency',
      readyBannerTitle: 'Your reservation request is ready: choose your sending channel',
      readyBannerBody:
        'So that our team in Kenitra receives your request immediately (no silent background transmission is faked without your action), click one of the buttons below to send your summary via WhatsApp or email:',
      sendWhatsapp1: 'Send on WhatsApp (07 24 77 44 40)',
      sendWhatsapp2: 'WhatsApp Line 2 (07 01 12 36 37)',
      sendEmail: 'Send via Email',
      copyBtn: 'Copy Summary',
      copiedBtn: 'Summary Copied!',
      summaryLabel: 'Prepared message preview:',
      mailSubject: (vehicle: string, name: string) =>
        `Car Rental Request - ${vehicle} - ${name}`,
      summaryTemplate: (data: {
        vehicle: string;
        start: string;
        end: string;
        location: string;
        name: string;
        phone: string;
        email?: string;
        city?: string;
        notes?: string;
      }) =>
        [
          'Hello Abboud Location (Kenitra),',
          'I would like to submit a car rental request (subject to availability and rate confirmation by the agency):',
          `• Desired vehicle: ${data.vehicle}`,
          `• Pickup date: ${data.start}`,
          `• Return date: ${data.end}`,
          `• Pickup location: ${data.location}`,
          `• Full name: ${data.name}`,
          `• Phone: ${data.phone}`,
          data.email ? `• Email: ${data.email}` : null,
          data.city ? `• City: ${data.city}` : null,
          data.notes ? `• Notes: ${data.notes}` : null,
          'Thank you for confirming availability and pricing.',
        ]
          .filter(Boolean)
          .join('\n'),
    },
    agency: {
      badge: 'About the Agency · Kenitra & Rabat Axis',
      h2: 'Your Trusted Partner for Car Rental in Kenitra and the Kenitra – Rabat Axis',
      p1: 'Located in Kenitra, in the heart of the Rabat-Salé-Kénitra region, Abboud Location assists residents, families, Moroccans living abroad, international visitors, and business travelers looking for a reliable, transparent, and responsive car rental service in Kenitra for trips in Kenitra, towards Rabat, and across Morocco.',
      p2: 'Whether you want to rent a car in Kenitra to get around the city center, meet a train at Kenitra ONCF station, head to Mehdia beach, commute between Kenitra and Rabat, or travel along Morocco’s highways, our catalogue brings together vehicles suited to every journey: agile city cars (Peugeot 208, Renault Clio, Opel Corsa), practical compact cars (Dacia Sandero), and spacious SUVs (Hyundai Tucson).',
      p3: 'At Abboud Location, every car rental in Kenitra is built on straightforward commitments: direct availability and handover confirmation before you travel, a written rental agreement, and a joint vehicle condition check at both pickup and return.',
      card1Title: 'City Cars & SUVs for Trips in Kenitra and to Rabat',
      card1Body:
        'A fleet focused on models recognized for driving comfort and versatility, equally suited to urban driving in Kenitra and highway travel between Kenitra and Rabat.',
      card2Title: 'Personal Support & Contractual Transparency',
      card2Body:
        'No hidden fees or automated promises: you speak directly with an Abboud Location advisor in Kenitra who explains the rate, deposit, and required documents.',
      card3Title: 'Easy Booking via WhatsApp or Phone',
      card3Body:
        'Contact us directly at 07 24 77 44 40 or 07 01 12 36 37 for a fast answer on vehicle availability in Kenitra.',
      card3BtnCatalog: 'View vehicles',
      card3BtnForm: 'Make a request',
    },
    faqSection: {
      badge: 'Frequently Asked Questions · FAQ',
      h2: 'Everything You Need to Know About Car Rental in Kenitra (Documents, Deposit, Insurance)',
      intro:
        'Find answers below to key questions regarding required documents, the security deposit (caution), insurance coverage, and reservation terms with Abboud Location.',
    },
    contactSection: {
      badge: 'Contact & Location · Kenitra',
      h2: 'Contact Abboud Location in Kenitra',
      intro:
        'Our team is available by phone, on WhatsApp, or by email to answer your questions and confirm your car rental in Kenitra.',
      phonesTitle: 'Phones & WhatsApp (Verified)',
      mainLineLabel: 'Primary Line — Call & WhatsApp',
      secondLineLabel: 'Secondary Line — Call & WhatsApp',
      whatsappBtn: 'WhatsApp',
      emailLabel: 'Email Address',
      addressHoursTitle: 'Address & Opening Hours in Kenitra',
      cityServedLabel: 'Served City:',
      cityServedValue: 'Kenitra, Morocco (Rabat-Salé-Kénitra Region)',
      exactAddressLabel: 'Exact Agency Address:',
      openingHoursLabel: 'Opening Hours:',
      mapTitle: 'Location Map — Kenitra, Morocco',
      mapBadge: 'Kenitra · Morocco',
      mapFooterNote:
        'Service area: Kenitra (City Center, Kenitra ONCF Train Station, Mehdia, and surrounding areas by appointment).',
      mapOpenLink: 'Open Kenitra on OpenStreetMap',
    },
    legalSection: {
      badge: 'Legal Information · Transparency',
      h2: 'Legal Notice & Privacy Policy',
      intro:
        'The bracketed fields below clearly identify administrative and legal registration details to be completed by Abboud Location prior to final publication.',
      col1Title: 'Website Publisher & Agency Identification',
      commercialNameLabel: 'Trade Name:',
      legalNameLabel: 'Company Name / Legal Form:',
      hqAddressLabel: 'Registered Office Address:',
      phonesLabel: 'Phones:',
      emailLabel: 'Email:',
      iceLabel: 'ICE Number:',
      rcLabel: 'Trade Register (RC) / Tax ID (IF) / Patent:',
      hostLabel: 'Web Hosting Provider:',
      col2Title: 'Terms of Use & Personal Data Protection',
      natureTitle: 'Nature of Online Information and Requests:',
      natureBody:
        'Information displayed on this website (vehicle catalogue, indicative specifications) is provided for informational purposes. Any request submitted through the form or via WhatsApp constitutes a preliminary reservation request subject to explicit availability and rate confirmation by Abboud Location.',
      privacyTitle: 'Personal Data Protection (Moroccan Law No. 09-08):',
      privacyBody:
        'Information entered in the reservation request form (name, phone number, desired dates) is used solely to prepare your rental inquiry with Abboud Location and is never sold or shared with third parties.',
    },
    footer: {
      description:
        'Car rental agency in Kenitra, Morocco. City cars, compact sedans, and SUVs available on request via WhatsApp or phone.',
      navTitle: 'Navigation & Useful Links',
      contactTitle: 'Direct Contact — Kenitra',
      callLine1: 'Call: 07 24 77 44 40',
      callLine2: 'Call: 07 01 12 36 37',
      rights: 'All rights reserved.',
      floatingWhatsappTitle: 'Contact Abboud Location on WhatsApp',
      floatingWhatsappText: 'WhatsApp Quote',
    },
  },
};
