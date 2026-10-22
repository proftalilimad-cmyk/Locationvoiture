export type VehicleState =
  | 'a_renseigner'
  | 'disponible'
  | 'reservee'
  | 'louee'
  | 'en_entretien'
  | 'indisponible';

export type ModelName =
  | 'Peugeot 208'
  | 'Opel Corsa'
  | 'Hyundai Tucson'
  | 'Renault Clio'
  | 'Dacia Sandero';

export interface AbboudVehicle {
  id: string;
  referenceInterne: string; // e.g. P208-01 (Editable, NOT an immatriculation)
  marque: string;
  modele: ModelName | string;
  photoUrl: string;
  photoIllustrative: boolean;
  immatriculation: string; // Empty initially ("À renseigner")
  annee: number | null;
  couleur: string;
  carburant: '' | 'Essence' | 'Diesel' | 'Hybride' | 'Électrique';
  transmission: '' | 'Manuelle' | 'Automatique';
  kilometrage: number | null;
  tarifJournalier: number | null;
  cautionDefaut: number | null;
  assuranceCompagnie: string;
  assuranceEcheance: string; // YYYY-MM-DD or ""
  assuranceJustificatif: string;
  controleTechniqueEcheance: string; // YYYY-MM-DD or ""
  controleTechniqueJustificatif: string;
  prochaineVidangeKm: number | null;
  prochaineVidangeDate: string; // YYYY-MM-DD or ""
  etat: VehicleState;
  notes: string;
  isDemo?: boolean;
}

export interface ReservationRequest {
  id: string;
  referenceDemande: string;
  modeleSouhaite: string;
  departSouhaite: string;
  retourSouhaite: string;
  lieuPriseEnCharge: string;
  nomClient: string;
  telephone: string;
  email: string;
  message: string;
  statut: 'en_attente' | 'confirmee' | 'refusee' | 'annulee';
  contratIdLie?: string;
  createdAt: string;
  isDemo?: boolean;
}

export interface ClientDocumentItem {
  id: string;
  type: 'CIN' | 'Passeport' | 'Permis de conduire' | 'Justificatif domicile' | 'Autre';
  numeroPiece: string;
  dateExpiration: string;
  verifie: boolean;
  referenceStockagePrive: string;
}

export interface ClientRecord {
  id: string;
  nomComplet: string;
  telephone: string;
  email: string;
  cinOuPasseport: string;
  permisNumero: string;
  permisDateDelivrance: string;
  adresse: string;
  documents: ClientDocumentItem[];
  notes: string;
  createdAt: string;
  isDemo?: boolean;
}

export type ContractStatus = 'brouillon' | 'confirme' | 'en_cours' | 'cloture' | 'annule';

export interface ContractRecord {
  id: string;
  numeroContrat: string;
  clientId: string;
  vehicleId: string;
  departPrevu: string; // ISO or YYYY-MM-DDTHH:mm
  retourPrevu: string;
  retourReel: string; // "" until returned
  lieuDepart: string;
  lieuRetour: string;
  nbJours: number;
  tarifJournalierConvenu: number;
  fraisSupplementaires: number;
  remise: number;
  montantTotalLocation: number;
  // Security deposit strictly separated from rental revenue & invoice balance
  cautionMontant: number;
  cautionStatut: 'non_recue' | 'recue' | 'restituee' | 'retenue';
  cautionMode: string;
  // Vehicle state at departure & return
  kmDepart: number | null;
  carburantDepart: string;
  etatDepartNotes: string;
  kmRetour: number | null;
  carburantRetour: string;
  observationsRetour: string;
  fraisRetourValides: number;
  statut: ContractStatus;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export type InvoiceStatus =
  | 'brouillon'
  | 'emise'
  | 'partiellement_payee'
  | 'payee'
  | 'annulee';

export interface CreditNoteRecord {
  id: string;
  numeroAvoir: string;
  invoiceId: string;
  dateEmission: string;
  montant: number;
  motif: string;
}

export interface InvoicePaymentRecord {
  id: string;
  invoiceId: string;
  contractId: string;
  clientId: string;
  datePaiement: string;
  montant: number;
  modePaiement: 'Espèces' | 'Virement' | 'Chèque' | 'Carte / TPE';
  referenceOperation: string;
  notes: string;
  isDemo?: boolean;
}

export interface InvoiceRecord {
  id: string;
  numeroFacture: string;
  contractId: string;
  clientId: string;
  dateEmission: string;
  dateEcheance: string;
  montantTotalFacture: number;
  montantAvoirs: number;
  montantPayeAffecte: number;
  resteDu: number; // = Math.max(0, montantTotalFacture - montantAvoirs - montantPayeAffecte)
  statut: InvoiceStatus;
  notes: string;
  avoirs: CreditNoteRecord[];
  createdAt: string;
  isDemo?: boolean;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  dateIntervention: string;
  kilometrage: number | null;
  typeIntervention: 'Vidange et filtres' | 'Freinage' | 'Pneumatiques' | 'Révision générale' | 'Réparation mécanique' | 'Carrosserie';
  description: string;
  cout: number;
  prestataire: string;
  justificatifPrive: string;
  prochaineVidangeKmFixee: number | null;
  prochaineVidangeDateFixee: string;
  createdAt: string;
  isDemo?: boolean;
}

export interface CreditInstallmentPayment {
  id: string;
  datePaiement: string;
  montantMensualiteVersee: number;
  partCapitalDocumentee: number | null; // Optional documented principal part
  partInteretsEtFrais: number | null;
  reference: string;
}

export interface VehicleCreditRecord {
  id: string;
  vehicleId: string;
  organismeFinancier: string;
  referenceContratCredit: string;
  dateDebut: string;
  dureeMois: number;
  montantInitialFinancement: number;
  mensualiteTotale: number; // Includes principal + interest + insurance/fees
  echeancierDescription: string;
  soldeCapitalCommunique: number | null; // Official remaining principal communicated by the lender
  dateSoldeCommunique: string;
  paiements: CreditInstallmentPayment[];
  notes: string;
  createdAt: string;
  isDemo?: boolean;
}

export interface ExpenseRecord {
  id: string;
  dateDepense: string;
  categorie: 'Entretien / Garage' | 'Assurance' | 'Contrôle technique' | 'Carburant agence' | 'Loyer / Charges' | 'Lavage / Préparation' | 'Autre';
  vehicleId?: string;
  montant: number;
  prestataire: string;
  description: string;
  justificatifPrive: string;
  createdAt: string;
  isDemo?: boolean;
}

export interface AgencySettings {
  nomAgence: string;
  activite: string;
  ville: string;
  slogan: string;
  telephone1: string;
  telephone2: string;
  email: string;
  // Unconfirmed fields left empty ("À renseigner")
  adresse: string;
  ice: string;
  identifiantFiscal: string;
  registreCommerce: string;
  patente: string;
  cnss: string;
  tauxTvaPct: number | null;
  delaiAlerteEcheanceJours: number;
  delaiAlerteVidangeKm: number;
}

export interface AbboudDatabaseState {
  settings: AgencySettings;
  vehicles: AbboudVehicle[];
  reservationRequests: ReservationRequest[];
  clients: ClientRecord[];
  contracts: ContractRecord[];
  invoices: InvoiceRecord[];
  payments: InvoicePaymentRecord[];
  maintenances: MaintenanceRecord[];
  credits: VehicleCreditRecord[];
  expenses: ExpenseRecord[];
}
