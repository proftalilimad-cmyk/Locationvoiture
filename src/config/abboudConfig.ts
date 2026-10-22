/**
 * Configuration centrale facilement modifiable pour Abboud Location (Kénitra, Maroc)
 * en 3 langues : Français (fr), Arabe (ar) et Anglais (en).
 * Toutes les informations non confirmées sont explicitement signalées par des champs
 * identifiés (« À compléter / Sur demande ») afin de ne jamais inventer de tarifs,
 * d'adresse postale, de disponibilités ou de conditions commerciales.
 */

import { AbboudLang, LocalizedText } from './abboudTranslations';

export interface AbboudCatalogueVehicle {
  id: string;
  marque: string;
  modele: string;
  nomComplet: string;
  categorie: string;
  photoUrl: string;
  photoAlt: string;
  transmission: string;
  carburant: string;
  places: string;
  tarif: string;
  disponibilite: string;
}

export interface AbboudMultilingualVehicle {
  id: string;
  marque: string;
  modele: string;
  nomComplet: string;
  photoUrl: string;
  categorie: LocalizedText;
  photoAlt: LocalizedText;
  transmission: LocalizedText;
  carburant: LocalizedText;
  places: LocalizedText;
  tarif: LocalizedText;
  disponibilite: LocalizedText;
}

export const ABBOUD_AGENCY_CONFIG = {
  nom: 'Abboud Location',
  nomComplet: 'Abboud Location — Location de voitures à Kénitra',
  slogan: 'Roulez librement, louez facilement.',
  ville: 'Kénitra',
  region: 'Rabat-Salé-Kénitra',
  pays: 'Maroc',
  codePaysIso: 'MA',

  // Coordonnées vérifiées (modifiables ici en un seul endroit)
  telephonePrincipal: '07 24 77 44 40',
  telephonePrincipalIntl: '+212724774440',
  whatsappPrincipalDigits: '212724774440',

  telephoneSecondaire: '07 01 12 36 37',
  telephoneSecondaireIntl: '+212701123637',
  whatsappSecondaireDigits: '212701123637',

  email: 'abboudcar59@gmail.com',

  // Champs clairement identifiés à compléter par l'agence (non inventés)
  adressePostale: '[Adresse exacte à compléter par l’agence — Kénitra, Maroc]',
  adressePostaleI18n: {
    fr: '[Adresse exacte à compléter par l’agence — Kénitra, Maroc]',
    ar: '[العنوان الدقيق يُستكمل من طرف الوكالة — القنيطرة، المغرب]',
    en: '[Exact address to be completed by the agency — Kenitra, Morocco]',
  },
  horairesOuverture: '[Horaires d’ouverture à compléter par l’agence]',
  horairesOuvertureI18n: {
    fr: '[Horaires d’ouverture à compléter par l’agence]',
    ar: '[أوقات العمل تُستكمل من طرف الوكالة]',
    en: '[Opening hours to be completed by the agency]',
  },
  mentionsLegales: {
    raisonSociale: '[Dénomination sociale à compléter]',
    formeJuridique: '[Forme juridique à compléter]',
    ice: '[Numéro ICE à compléter]',
    registreCommerce: '[Numéro RC Kénitra à compléter]',
    identifiantFiscal: '[Identifiant Fiscal (IF) à compléter]',
    patente: '[Numéro de Patente à compléter]',
    hebergeur: '[Coordonnées de l’hébergeur à compléter lors de la mise en ligne]',
  },
  mentionsLegalesI18n: {
    fr: {
      raisonSociale: '[Dénomination sociale à compléter]',
      formeJuridique: '[Forme juridique à compléter]',
      ice: '[Numéro ICE à compléter]',
      registreCommerce: '[Numéro RC Kénitra à compléter]',
      identifiantFiscal: '[Identifiant Fiscal (IF) à compléter]',
      patente: '[Numéro de Patente à compléter]',
      hebergeur: '[Coordonnées de l’hébergeur à compléter lors de la mise en ligne]',
    },
    ar: {
      raisonSociale: '[التسمية الاجتماعية تُستكمل من طرف الوكالة]',
      formeJuridique: '[الشكل القانوني يُستكمل من طرف الوكالة]',
      ice: '[رقم التعريف الموحد للمقاولة ICE يُستكمل]',
      registreCommerce: '[رقم السجل التجاري بالقنيطرة يُستكمل]',
      identifiantFiscal: '[المعرف الضريبي IF يُستكمل]',
      patente: '[رقم الضريبة المهنية (الباتنتا) يُستكمل]',
      hebergeur: '[بيانات مستضيف الموقع تُستكمل عند النشر]',
    },
    en: {
      raisonSociale: '[Company legal name to be completed]',
      formeJuridique: '[Legal form to be completed]',
      ice: '[ICE number to be completed]',
      registreCommerce: '[Kenitra Trade Register (RC) number to be completed]',
      identifiantFiscal: '[Tax ID (IF) to be completed]',
      patente: '[Business Tax (Patente) number to be completed]',
      hebergeur: '[Hosting provider details to be completed upon publication]',
    },
  },

  // Lieux de prise en charge proposés dans le formulaire (modifiables)
  lieuxPriseEnCharge: [
    'Agence à Kénitra (lieu exact à convenir)',
    'Kénitra Centre-Ville (sur rendez-vous)',
    'Gare ONCF Kénitra (sur rendez-vous)',
    'Axe Kénitra – Rabat (selon conditions à confirmer avec l’agence)',
    'Autre lieu à Kénitra ou région Rabat (à préciser dans votre message)',
  ],
  lieuxPriseEnChargeI18n: {
    fr: [
      'Agence à Kénitra (lieu exact à convenir)',
      'Kénitra Centre-Ville (sur rendez-vous)',
      'Gare ONCF Kénitra (sur rendez-vous)',
      'Axe Kénitra – Rabat (selon conditions à confirmer avec l’agence)',
      'Autre lieu à Kénitra ou région Rabat (à préciser dans votre message)',
    ],
    ar: [
      'مقر الوكالة بالقنيطرة (يتم تحديد المكان بالاتفاق)',
      'وسط مدينة القنيطرة (بموعد مسبق)',
      'محطة القطار القنيطرة ONCF (بموعد مسبق)',
      'محور القنيطرة – الرباط (حسب الشروط المؤكدة مع الوكالة)',
      'مكان آخر بالقنيطرة أو جهة الرباط (يرجى تحديده في رسالتكم)',
    ],
    en: [
      'Agency in Kenitra (exact meeting point to be arranged)',
      'Kenitra City Center (by appointment)',
      'Kenitra ONCF Train Station (by appointment)',
      'Kenitra – Rabat Axis (subject to conditions confirmed with the agency)',
      'Another location in Kenitra or Rabat region (please specify in your notes)',
    ],
  },
};

export const ABBOUD_MULTILINGUAL_VEHICLES: AbboudMultilingualVehicle[] = [
  {
    id: 'peugeot-208',
    marque: 'Peugeot',
    modele: '208',
    nomComplet: 'Peugeot 208',
    photoUrl: '/abboud/peugeot-208.png',
    categorie: {
      fr: 'Citadine polyvalente',
      ar: 'سيارة مدينة متعددة الاستعمالات',
      en: 'Versatile City Car',
    },
    photoAlt: {
      fr: 'Peugeot 208 proposée à la location à Kénitra par Abboud Location (visuel illustratif)',
      ar: 'سيارة بيجو 208 مقترحة للكراء بالقنيطرة لدى وكالة Abboud Location (صورة توضيحية)',
      en: 'Peugeot 208 available for car rental in Kenitra with Abboud Location (illustrative photo)',
    },
    transmission: {
      fr: 'Manuelle (à confirmer selon véhicule)',
      ar: 'يدوي (يُؤكد حسب السيارة المتوفرة)',
      en: 'Manual (to be confirmed per unit)',
    },
    carburant: {
      fr: 'Essence / Diesel (à confirmer)',
      ar: 'بنزين / ديزل (يُؤكد مع الوكالة)',
      en: 'Petrol / Diesel (to be confirmed)',
    },
    places: {
      fr: '5 places',
      ar: '5 مقاعد',
      en: '5 seats',
    },
    tarif: {
      fr: 'Tarif sur demande',
      ar: 'التسعيرة عند الطلب',
      en: 'Rate on request',
    },
    disponibilite: {
      fr: 'Disponibilité à confirmer par l’agence',
      ar: 'التوفر يُؤكد من طرف الوكالة',
      en: 'Availability confirmed by the agency',
    },
  },
  {
    id: 'opel-corsa',
    marque: 'Opel',
    modele: 'Corsa',
    nomComplet: 'Opel Corsa',
    photoUrl: '/abboud/opel-corsa.png',
    categorie: {
      fr: 'Citadine moderne',
      ar: 'سيارة مدينة عصرية',
      en: 'Modern City Car',
    },
    photoAlt: {
      fr: 'Opel Corsa disponible sur demande chez Abboud Location à Kénitra (visuel illustratif)',
      ar: 'سيارة أوبل كورسا متوفرة عند الطلب لدى Abboud Location بالقنيطرة (صورة توضيحية)',
      en: 'Opel Corsa available on request at Abboud Location in Kenitra (illustrative photo)',
    },
    transmission: {
      fr: 'Manuelle (à confirmer selon véhicule)',
      ar: 'يدوي (يُؤكد حسب السيارة المتوفرة)',
      en: 'Manual (to be confirmed per unit)',
    },
    carburant: {
      fr: 'Essence / Diesel (à confirmer)',
      ar: 'بنزين / ديزل (يُؤكد مع الوكالة)',
      en: 'Petrol / Diesel (to be confirmed)',
    },
    places: {
      fr: '5 places',
      ar: '5 مقاعد',
      en: '5 seats',
    },
    tarif: {
      fr: 'Tarif sur demande',
      ar: 'التسعيرة عند الطلب',
      en: 'Rate on request',
    },
    disponibilite: {
      fr: 'Disponibilité à confirmer par l’agence',
      ar: 'التوفر يُؤكد من طرف الوكالة',
      en: 'Availability confirmed by the agency',
    },
  },
  {
    id: 'hyundai-tucson',
    marque: 'Hyundai',
    modele: 'Tucson',
    nomComplet: 'Hyundai Tucson',
    photoUrl: '/abboud/hyundai-tucson.png',
    categorie: {
      fr: 'SUV familial & routier',
      ar: 'سيارة دفع رباعي SUV عائلية وللطريق',
      en: 'Family & Touring SUV',
    },
    photoAlt: {
      fr: 'SUV Hyundai Tucson pour location de voiture à Kénitra avec Abboud Location (visuel illustratif)',
      ar: 'سيارة هيونداي توكسون SUV لكراء السيارات بالقنيطرة مع Abboud Location (صورة توضيحية)',
      en: 'Hyundai Tucson SUV for car rental in Kenitra with Abboud Location (illustrative photo)',
    },
    transmission: {
      fr: 'Automatique / Manuelle (à confirmer)',
      ar: 'أوتوماتيك / يدوي (يُؤكد مع الوكالة)',
      en: 'Automatic / Manual (to be confirmed)',
    },
    carburant: {
      fr: 'Diesel / Essence (à confirmer)',
      ar: 'ديزل / بنزين (يُؤكد مع الوكالة)',
      en: 'Diesel / Petrol (to be confirmed)',
    },
    places: {
      fr: '5 places',
      ar: '5 مقاعد',
      en: '5 seats',
    },
    tarif: {
      fr: 'Tarif sur demande',
      ar: 'التسعيرة عند الطلب',
      en: 'Rate on request',
    },
    disponibilite: {
      fr: 'Disponibilité à confirmer par l’agence',
      ar: 'التوفر يُؤكد من طرف الوكالة',
      en: 'Availability confirmed by the agency',
    },
  },
  {
    id: 'renault-clio',
    marque: 'Renault',
    modele: 'Clio',
    nomComplet: 'Renault Clio',
    photoUrl: '/abboud/renault-clio.png',
    categorie: {
      fr: 'Citadine économique',
      ar: 'سيارة مدينة اقتصادية',
      en: 'Economical City Car',
    },
    photoAlt: {
      fr: 'Renault Clio en location à Kénitra chez Abboud Location (visuel illustratif)',
      ar: 'سيارة رينو كليو للكراء بالقنيطرة لدى وكالة Abboud Location (صورة توضيحية)',
      en: 'Renault Clio car rental in Kenitra at Abboud Location (illustrative photo)',
    },
    transmission: {
      fr: 'Manuelle (à confirmer selon véhicule)',
      ar: 'يدوي (يُؤكد حسب السيارة المتوفرة)',
      en: 'Manual (to be confirmed per unit)',
    },
    carburant: {
      fr: 'Essence / Diesel (à confirmer)',
      ar: 'بنزين / ديزل (يُؤكد مع الوكالة)',
      en: 'Petrol / Diesel (to be confirmed)',
    },
    places: {
      fr: '5 places',
      ar: '5 مقاعد',
      en: '5 seats',
    },
    tarif: {
      fr: 'Tarif sur demande',
      ar: 'التسعيرة عند الطلب',
      en: 'Rate on request',
    },
    disponibilite: {
      fr: 'Disponibilité à confirmer par l’agence',
      ar: 'التوفر يُؤكد من طرف الوكالة',
      en: 'Availability confirmed by the agency',
    },
  },
  {
    id: 'dacia-sandero',
    marque: 'Dacia',
    modele: 'Sandero',
    nomComplet: 'Dacia Sandero',
    photoUrl: '/abboud/dacia-sandero.png',
    categorie: {
      fr: 'Berline compacte pratique',
      ar: 'سيارة مدمجة عملية ومريحة',
      en: 'Practical Compact Hatchback',
    },
    photoAlt: {
      fr: 'Dacia Sandero proposée par l’agence Abboud Location à Kénitra (visuel illustratif)',
      ar: 'سيارة داسيا سانديرو مقترحة من طرف وكالة Abboud Location بالقنيطرة (صورة توضيحية)',
      en: 'Dacia Sandero offered by Abboud Location in Kenitra (illustrative photo)',
    },
    transmission: {
      fr: 'Manuelle (à confirmer selon véhicule)',
      ar: 'يدوي (يُؤكد حسب السيارة المتوفرة)',
      en: 'Manual (to be confirmed per unit)',
    },
    carburant: {
      fr: 'Essence / Diesel (à confirmer)',
      ar: 'بنزين / ديزل (يُؤكد مع الوكالة)',
      en: 'Petrol / Diesel (to be confirmed)',
    },
    places: {
      fr: '5 places',
      ar: '5 مقاعد',
      en: '5 seats',
    },
    tarif: {
      fr: 'Tarif sur demande',
      ar: 'التسعيرة عند الطلب',
      en: 'Rate on request',
    },
    disponibilite: {
      fr: 'Disponibilité à confirmer par l’agence',
      ar: 'التوفر يُؤكد من طرف الوكالة',
      en: 'Availability confirmed by the agency',
    },
  },
];

export function getLocalizedVehicles(lang: AbboudLang): AbboudCatalogueVehicle[] {
  return ABBOUD_MULTILINGUAL_VEHICLES.map((v) => ({
    id: v.id,
    marque: v.marque,
    modele: v.modele,
    nomComplet: v.nomComplet,
    photoUrl: v.photoUrl,
    categorie: v.categorie[lang],
    photoAlt: v.photoAlt[lang],
    transmission: v.transmission[lang],
    carburant: v.carburant[lang],
    places: v.places[lang],
    tarif: v.tarif[lang],
    disponibilite: v.disponibilite[lang],
  }));
}

export const ABBOUD_CATALOGUE_VEHICLES: AbboudCatalogueVehicle[] = getLocalizedVehicles('fr');

export interface FaqItem {
  id: string;
  categorie: string;
  question: string;
  reponse: string;
  infoACompleter?: string;
}

export interface MultilingualFaqItem {
  id: string;
  categorie: LocalizedText;
  question: LocalizedText;
  reponse: LocalizedText;
  infoACompleter: LocalizedText;
}

export const ABBOUD_MULTILINGUAL_FAQ: MultilingualFaqItem[] = [
  {
    id: 'documents-necessaires',
    categorie: {
      fr: 'Documents nécessaires',
      ar: 'الوثائق المطلوبة',
      en: 'Required Documents',
    },
    question: {
      fr: 'Quels documents faut-il présenter pour louer une voiture à Kénitra ?',
      ar: 'ما هي الوثائق المطلوبة لكراء سيارة في القنيطرة؟',
      en: 'What documents are required to rent a car in Kenitra?',
    },
    reponse: {
      fr: 'Pour toute location de voiture auprès d’Abboud Location à Kénitra, le conducteur doit présenter une pièce d’identité en cours de validité (Carte Nationale d’Identité pour les résidents au Maroc ou Passeport valide) ainsi qu’un permis de conduire original et valide. Si un second conducteur est prévu, ses documents originaux devront également être inscrits sur le contrat de location.',
      ar: 'لكل عملية كراء سيارة لدى وكالة Abboud Location بالقنيطرة، يجب على السائق الإدلاء بوثيقة هوية سارية المفعول (البطاقة الوطنية للتعريف للمقيمين بالمغرب أو جواز سفر ساري المفعول) بالإضافة إلى رخصة سياقة أصلية وسارية الصلاحية. وفي حالة وجود سائق ثانٍ، يجب تسجيل وثائقه الأصلية أيضاً في عقد الكراء.',
      en: 'For any car rental with Abboud Location in Kenitra, the driver must present a valid identity document (National ID Card for residents in Morocco or a valid Passport) along with an original, valid driving license. If a second driver is planned, their original documents must also be registered on the rental agreement.',
    },
    infoACompleter: {
      fr: '[Âge minimum et ancienneté minimale du permis de conduire : à confirmer par l’agence lors de votre demande]',
      ar: '[السن الأدنى والأقدمية الدنيا لرخصة السياقة: يتم تأكيدهما من طرف الوكالة عند طلبكم]',
      en: '[Minimum driver age and minimum driving license seniority: confirmed by the agency upon request]',
    },
  },
  {
    id: 'caution-depot-garantie',
    categorie: {
      fr: 'Caution',
      ar: 'مبلغ الضمان (Caution)',
      en: 'Security Deposit',
    },
    question: {
      fr: 'Comment fonctionne la caution (dépôt de garantie) ?',
      ar: 'كيف يعمل مبلغ الضمان (Caution)؟',
      en: 'How does the security deposit (caution) work?',
    },
    reponse: {
      fr: 'La caution est un dépôt de garantie distinct du prix de la location. Elle est destinée à couvrir d’éventuels frais non prévus au contrat (manque de carburant au retour, dépassement non signalé ou dommages constatés lors de l’état des lieux de restitution). Elle est restituée à la clôture du contrat lorsque le véhicule est rendu conformément à l’état des lieux de départ.',
      ar: 'الضمان (Caution) هو مبلغ إيداع مستقل تماماً عن ثمن الكراء. يهدف إلى تغطية أي مصاريف إضافية غير منصوص عليها في العقد (نقص الوقود عند الإرجاع، تأخر غير معلن أو أضرار مسجلة أثناء معاينة الإرجاع). ويتم استرجاع الضمان بالكامل عند إغلاق العقد وإرجاع السيارة مطابقة لحالتها عند الانطلاق.',
      en: 'The security deposit (caution) is a guarantee kept strictly separate from the rental fee. It is intended to cover potential unforeseen charges (missing fuel on return, unannounced late return, or damage noted during the return inspection). It is returned in full upon contract closure when the vehicle is brought back in accordance with the departure check-in report.',
    },
    infoACompleter: {
      fr: '[Montant exact de la caution et modes de dépôt acceptés (chèque, espèces, empreinte) : communiqués par l’agence selon le modèle choisi]',
      ar: '[المبلغ الدقيق للضمان وطرق الإيداع المقبولة: يتم تحديدها من طرف الوكالة حسب نوع السيارة المختارة]',
      en: '[Exact security deposit amount and accepted deposit methods: communicated by the agency depending on the selected model]',
    },
  },
  {
    id: 'assurance-couverture',
    categorie: {
      fr: 'Assurance',
      ar: 'التأمين والتغطية',
      en: 'Insurance Coverage',
    },
    question: {
      fr: 'Quelle est la couverture d’assurance incluse dans la location ?',
      ar: 'ما هي التغطية التأمينية المشمولة في عقد الكراء؟',
      en: 'What insurance coverage is included in the rental?',
    },
    reponse: {
      fr: 'Chaque véhicule fait l’objet d’un contrat de location écrit précisant les conditions d’assurance applicables et le montant éventuel de la franchise. Avant la prise en charge du véhicule à Kénitra, notre équipe vous détaille les garanties incluses ainsi que la conduite à tenir en cas d’incident ou de sinistre.',
      ar: 'يخضع كل كراء سيارة لعقد مكتوب يوضح شروط التأمين المطبقة ومبلغ التحمل (Franchise) المحتمل. قبل استلام السيارة في القنيطرة، يشرح لكم فريقنا جميع الضمانات المشمولة والإجراءات الواجب اتباعها في حالة وقوع عطب أو حادث.',
      en: 'Every vehicle is covered by a written rental agreement specifying applicable insurance terms and any deductible (excess) amount. Before taking delivery of the vehicle in Kenitra, our team explains the included coverage and the procedure to follow in the event of an incident.',
    },
    infoACompleter: {
      fr: '[Détail des garanties d’assurance et montant des franchises par catégorie : à compléter par l’agence]',
      ar: '[تفاصيل ضمانات التأمين ومبلغ التحمل حسب الفئة: تُستكمل من طرف الوكالة]',
      en: '[Detailed insurance coverage and deductible amounts by category: to be completed by the agency]',
    },
  },
  {
    id: 'conditions-location-reservation',
    categorie: {
      fr: 'Conditions de location',
      ar: 'شروط الكراء والحجز',
      en: 'Rental & Booking Conditions',
    },
    question: {
      fr: 'Comment se déroule la réservation et la remise du véhicule à Kénitra ?',
      ar: 'كيف تتم عملية الحجز وتسليم السيارة في القنيطرة؟',
      en: 'How do booking confirmation and vehicle handover work in Kenitra?',
    },
    reponse: {
      fr: 'L’envoi d’une demande via notre formulaire en ligne ou par WhatsApp constitue une demande de réservation préalable. Un conseiller d’Abboud Location vous recontacte par téléphone ou WhatsApp pour vous confirmer la disponibilité réelle du véhicule aux dates souhaitées, vous communiquer le tarif exact et convenir du lieu de remise à Kénitra. Un état des lieux complet (kilométrage, niveau de carburant, équipements) est signé au départ comme au retour.',
      ar: 'يُعد إرسال طلب عبر النموذج الإلكتروني أو عبر واتساب بمثابة طلب حجز أولي. يتواصل معكم مستشار من وكالة Abboud Location عبر الهاتف أو واتساب لتأكيد التوفر الفعلي للسيارة في التواريخ المطلوبة، وإبلاغكم بالتسعيرة الدقيقة والاتفاق على مكان التسليم في القنيطرة. يتم توقيع معاينة شاملة لحالة السيارة (العداد، مستوى الوقود، التجهيزات) عند الانطلاق وعند الإرجاع.',
      en: 'Submitting a request via our online form or WhatsApp constitutes a preliminary reservation request. An Abboud Location advisor contacts you by phone or WhatsApp to confirm real-time availability for your dates, provide the exact rate, and arrange the pickup point in Kenitra. A complete vehicle condition report (mileage, fuel level, equipment) is signed at both pickup and return.',
    },
    infoACompleter: {
      fr: '[Conditions d’annulation, kilométrage inclus et politique de prolongation : communiqués lors de la confirmation]',
      ar: '[شروط الإلغاء، الكيلومترات المشمولة وسياسة تمديد الكراء: يتم توضيحها عند تأكيد الحجز]',
      en: '[Cancellation policy, included mileage, and extension terms: communicated upon booking confirmation]',
    },
  },
];

export function getLocalizedFaq(lang: AbboudLang): FaqItem[] {
  return ABBOUD_MULTILINGUAL_FAQ.map((f) => ({
    id: f.id,
    categorie: f.categorie[lang],
    question: f.question[lang],
    reponse: f.reponse[lang],
    infoACompleter: f.infoACompleter[lang],
  }));
}

export const ABBOUD_FAQ_ITEMS: FaqItem[] = getLocalizedFaq('fr');

export type AbboudPageSlug =
  | 'accueil'
  | 'vehicules'
  | 'reservation'
  | 'agence'
  | 'faq'
  | 'contact'
  | 'mentions-legales';

export function buildWhatsAppLink(phoneDigits: string, text: string): string {
  const clean = phoneDigits.replace(/\D+/g, '');
  const intl = clean.startsWith('0')
    ? `212${clean.slice(1)}`
    : clean.startsWith('212')
    ? clean
    : `212${clean}`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}
