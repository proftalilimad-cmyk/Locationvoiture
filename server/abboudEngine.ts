import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  AbboudDatabaseState,
  AbboudVehicle,
  AgencySettings,
  ClientRecord,
  ContractRecord,
  CreditInstallmentPayment,
  CreditNoteRecord,
  ExpenseRecord,
  InvoicePaymentRecord,
  InvoiceRecord,
  MaintenanceRecord,
  ReservationRequest,
  VehicleCreditRecord,
} from '../src/types/abboud';

const DATA_DIR = path.resolve(process.cwd(), 'server/data');
const DB_FILE_PATH = path.resolve(DATA_DIR, 'abboud-db.json');

export function createInitialNineVehicles(): AbboudVehicle[] {
  const specs: Array<{ ref: string; marque: string; modele: AbboudVehicle['modele']; photo: string }> = [
    { ref: 'P208-01', marque: 'Peugeot', modele: 'Peugeot 208', photo: '/abboud/peugeot-208.png' },
    { ref: 'P208-02', marque: 'Peugeot', modele: 'Peugeot 208', photo: '/abboud/peugeot-208.png' },
    { ref: 'COR-01', marque: 'Opel', modele: 'Opel Corsa', photo: '/abboud/opel-corsa.png' },
    { ref: 'COR-02', marque: 'Opel', modele: 'Opel Corsa', photo: '/abboud/opel-corsa.png' },
    { ref: 'TUC-01', marque: 'Hyundai', modele: 'Hyundai Tucson', photo: '/abboud/hyundai-tucson.png' },
    { ref: 'CLI-01', marque: 'Renault', modele: 'Renault Clio', photo: '/abboud/renault-clio.png' },
    { ref: 'CLI-02', marque: 'Renault', modele: 'Renault Clio', photo: '/abboud/renault-clio.png' },
    { ref: 'SAN-01', marque: 'Dacia', modele: 'Dacia Sandero', photo: '/abboud/dacia-sandero.png' },
    { ref: 'SAN-02', marque: 'Dacia', modele: 'Dacia Sandero', photo: '/abboud/dacia-sandero.png' },
  ];

  return specs.map((item, idx) => ({
    id: `veh-${idx + 1}-${item.ref.toLowerCase()}`,
    referenceInterne: item.ref,
    marque: item.marque,
    modele: item.modele,
    photoUrl: item.photo,
    photoIllustrative: true,
    // Strictly empty ("À renseigner") as required by Section 2 & 6
    immatriculation: '',
    annee: null,
    couleur: '',
    carburant: '',
    transmission: '',
    kilometrage: null,
    tarifJournalier: null,
    cautionDefaut: null,
    assuranceCompagnie: '',
    assuranceEcheance: '',
    assuranceJustificatif: '',
    controleTechniqueEcheance: '',
    controleTechniqueJustificatif: '',
    prochaineVidangeKm: null,
    prochaineVidangeDate: '',
    etat: 'a_renseigner',
    notes: '',
  }));
}

export function createInitialAbboudState(): AbboudDatabaseState {
  return {
    settings: {
      nomAgence: 'ABBOUD CAR RENTAL',
      activite: 'Location de voitures à Kénitra, Maroc',
      ville: 'Kénitra, Maroc',
      slogan: 'Roulez librement, louez facilement.',
      telephone1: '07 24 77 44 40',
      telephone2: '07 01 12 36 37',
      email: 'abboudcar59@gmail.com',
      // Unconfirmed legal & address fields left empty ("À renseigner")
      adresse: '',
      ice: '',
      identifiantFiscal: '',
      registreCommerce: '',
      patente: '',
      cnss: '',
      tauxTvaPct: null,
      delaiAlerteEcheanceJours: 30,
      delaiAlerteVidangeKm: 1000,
    },
    vehicles: createInitialNineVehicles(),
    reservationRequests: [],
    clients: [],
    contracts: [],
    invoices: [],
    payments: [],
    maintenances: [],
    credits: [],
    expenses: [],
  };
}

export interface ActiveAlertItem {
  id: string;
  categorie: 'retard_retour' | 'vidange_km' | 'vidange_date' | 'assurance' | 'controle_technique';
  severite: 'urgent' | 'attention';
  vehicleId?: string;
  referenceInterne?: string;
  contractId?: string;
  titre: string;
  detail: string;
}

export class AbboudRentalEngine {
  private db: AbboudDatabaseState;
  private persistToDisk: boolean;
  private lockPromise: Promise<void> = Promise.resolve();
  private adminSessions = new Set<string>();
  private adminPasswordHash: string;

  constructor(options?: { persistToDisk?: boolean; initialState?: AbboudDatabaseState }) {
    this.persistToDisk = options?.persistToDisk ?? true;
    this.adminPasswordHash = this.hashPassword('abboud2026');

    if (options?.initialState) {
      this.db = structuredClone(options.initialState);
    } else if (this.persistToDisk && fs.existsSync(DB_FILE_PATH)) {
      try {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        this.db = JSON.parse(raw) as AbboudDatabaseState;
        let upgradedPhotos = false;
        for (const v of this.db.vehicles) {
          if (v.photoUrl && v.photoUrl.startsWith('/abboud/') && v.photoUrl.endsWith('.svg')) {
            v.photoUrl = v.photoUrl.replace(/\.svg$/, '.png');
            upgradedPhotos = true;
          }
        }
        if (upgradedPhotos) {
          this.saveToDisk();
        }
      } catch {
        this.db = createInitialAbboudState();
        this.saveToDisk();
      }
    } else {
      this.db = createInitialAbboudState();
      if (this.persistToDisk) {
        this.saveToDisk();
      }
    }
  }

  private hashPassword(pw: string): string {
    return crypto.createHash('sha256').update(`abboud-salt:${pw}`).digest('hex');
  }

  private saveToDisk(): void {
    if (!this.persistToDisk) return;
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch {
      // ignore fs errors in read-only environments
    }
  }

  private async withLock<T>(fn: () => Promise<T> | T): Promise<T> {
    let release!: () => void;
    const nextLock = new Promise<void>((resolve) => {
      release = resolve;
    });
    const prev = this.lockPromise;
    this.lockPromise = prev.then(() => nextLock);
    await prev;
    try {
      return await fn();
    } finally {
      release();
    }
  }

  // ===========================================================================
  // AUTHENTICATION & SECURITY
  // ===========================================================================
  public loginAdmin(password: string): { token: string } {
    if (this.hashPassword(password) !== this.adminPasswordHash) {
      throw new Error('Mot de passe administrateur incorrect.');
    }
    const token = `adm-${crypto.randomBytes(16).toString('hex')}`;
    this.adminSessions.add(token);
    return { token };
  }

  public verifyAdminToken(token?: string): boolean {
    if (!token) return false;
    return this.adminSessions.has(token);
  }

  public assertAdmin(token?: string): void {
    if (!this.verifyAdminToken(token)) {
      throw new Error('Non autorisé : veuillez vous authentifier à l’administration.');
    }
  }

  public changeAdminPassword(token: string | undefined, newPassword: string): void {
    this.assertAdmin(token);
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Le nouveau mot de passe doit contenir au moins 6 caractères.');
    }
    this.adminPasswordHash = this.hashPassword(newPassword);
  }

  // ===========================================================================
  // PUBLIC SHOWCASE API (NEVER EXPOSES CLIENTS, CONTRACTS OR FINANCES)
  // ===========================================================================
  public getPublicShowcaseData() {
    const modelGroups: Array<{
      modele: string;
      marque: string;
      quantiteTotale: number;
      references: string[];
      photoUrl: string;
      photoIllustrative: boolean;
      disponiblesConfirmees: number;
      aRenseignerCount: number;
      tarifAffiche: number | null;
      carburantAffiche: string;
      transmissionAffichee: string;
    }> = [];

    const order = ['Peugeot 208', 'Opel Corsa', 'Hyundai Tucson', 'Renault Clio', 'Dacia Sandero'];
    for (const modelName of order) {
      const matching = this.db.vehicles.filter((v) => v.modele === modelName);
      if (matching.length === 0) continue;
      const first = matching[0];
      modelGroups.push({
        modele: modelName,
        marque: first.marque,
        quantiteTotale: matching.length,
        references: matching.map((v) => v.referenceInterne),
        photoUrl: first.photoUrl,
        photoIllustrative: first.photoIllustrative,
        disponiblesConfirmees: matching.filter((v) => v.etat === 'disponible').length,
        aRenseignerCount: matching.filter((v) => v.etat === 'a_renseigner').length,
        tarifAffiche: matching.find((v) => v.tarifJournalier !== null)?.tarifJournalier ?? null,
        carburantAffiche: matching.find((v) => v.carburant !== '')?.carburant ?? '',
        transmissionAffichee: matching.find((v) => v.transmission !== '')?.transmission ?? '',
      });
    }

    return {
      agency: {
        nomAgence: this.db.settings.nomAgence,
        activite: this.db.settings.activite,
        ville: this.db.settings.ville,
        slogan: this.db.settings.slogan,
        telephone1: this.db.settings.telephone1,
        telephone2: this.db.settings.telephone2,
        email: this.db.settings.email,
        adresse: this.db.settings.adresse,
      },
      totalVehiclesCount: this.db.vehicles.length,
      models: modelGroups,
      vehiclesPublicList: this.db.vehicles.map((v) => ({
        id: v.id,
        referenceInterne: v.referenceInterne,
        marque: v.marque,
        modele: v.modele,
        photoUrl: v.photoUrl,
        photoIllustrative: v.photoIllustrative,
        annee: v.annee,
        carburant: v.carburant,
        transmission: v.transmission,
        tarifJournalier: v.tarifJournalier,
        etat: v.etat,
      })),
    };
  }

  public submitPublicReservationRequest(input: {
    modeleSouhaite: string;
    departSouhaite: string;
    retourSouhaite: string;
    lieuPriseEnCharge: string;
    nomClient: string;
    telephone: string;
    email?: string;
    message?: string;
  }): { confirmationMessage: string; request: ReservationRequest } {
    if (!input.modeleSouhaite?.trim() || !input.nomClient?.trim() || !input.telephone?.trim()) {
      throw new Error('Veuillez renseigner le modèle souhaité, votre nom et votre numéro de téléphone.');
    }
    if (!input.departSouhaite || !input.retourSouhaite) {
      throw new Error('Veuillez indiquer les dates et heures de départ et de retour souhaitées.');
    }
    if (new Date(input.retourSouhaite).getTime() <= new Date(input.departSouhaite).getTime()) {
      throw new Error('La date/heure de retour doit être postérieure à la date/heure de départ.');
    }

    const reqRecord: ReservationRequest = {
      id: `dem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      referenceDemande: `DEM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      modeleSouhaite: input.modeleSouhaite.trim(),
      departSouhaite: input.departSouhaite,
      retourSouhaite: input.retourSouhaite,
      lieuPriseEnCharge: input.lieuPriseEnCharge?.trim() || 'Kénitra',
      nomClient: input.nomClient.trim(),
      telephone: input.telephone.trim(),
      email: input.email?.trim() || '',
      message: input.message?.trim() || '',
      statut: 'en_attente',
      createdAt: new Date().toISOString(),
    };

    this.db.reservationRequests.unshift(reqRecord);
    this.saveToDisk();

    return {
      confirmationMessage: 'Demande reçue, en attente de confirmation',
      request: reqRecord,
    };
  }

  // ===========================================================================
  // ADMIN STATE & ALERTS
  // ===========================================================================
  public getAdminState(token?: string): AbboudDatabaseState & { alerts: ActiveAlertItem[] } {
    this.assertAdmin(token);
    return {
      ...this.db,
      alerts: this.computeActiveAlerts(),
    };
  }

  public computeActiveAlerts(now = new Date()): ActiveAlertItem[] {
    const alerts: ActiveAlertItem[] = [];
    const nowMs = now.getTime();
    const alertDaysMs = (this.db.settings.delaiAlerteEcheanceJours || 30) * 86400000;
    const alertKmMargin = this.db.settings.delaiAlerteVidangeKm || 1000;

    // 1. Overdue active contracts
    for (const c of this.db.contracts) {
      if (c.statut === 'en_cours' && !c.retourReel) {
        const dueMs = new Date(c.retourPrevu).getTime();
        if (!Number.isNaN(dueMs) && dueMs < nowMs) {
          const veh = this.db.vehicles.find((v) => v.id === c.vehicleId);
          const cli = this.db.clients.find((cl) => cl.id === c.clientId);
          alerts.push({
            id: `al-ret-${c.id}`,
            categorie: 'retard_retour',
            severite: 'urgent',
            vehicleId: c.vehicleId,
            referenceInterne: veh?.referenceInterne,
            contractId: c.id,
            titre: `Retard de retour : ${veh?.referenceInterne || ''} (${veh?.modele || ''})`,
            detail: `Contrat ${c.numeroContrat} (${cli?.nomComplet || 'Client'}) — Retour prévu le ${c.retourPrevu.replace('T', ' ')}`,
          });
        }
      }
    }

    // 2. Vehicle alerts ONLY from values actually filled in
    for (const v of this.db.vehicles) {
      // Oil change mileage alert
      if (v.kilometrage !== null && v.prochaineVidangeKm !== null) {
        const remainingKm = v.prochaineVidangeKm - v.kilometrage;
        if (remainingKm <= alertKmMargin) {
          alerts.push({
            id: `al-vid-km-${v.id}`,
            categorie: 'vidange_km',
            severite: remainingKm <= 0 ? 'urgent' : 'attention',
            vehicleId: v.id,
            referenceInterne: v.referenceInterne,
            titre: `Vidange à prévoir (Kilométrage) — ${v.referenceInterne} (${v.modele})`,
            detail:
              remainingKm <= 0
                ? `Seuil dépassé de ${Math.abs(remainingKm)} km (Actuel: ${v.kilometrage} km / Seuil: ${v.prochaineVidangeKm} km)`
                : `Reste ${remainingKm} km avant vidange (Actuel: ${v.kilometrage} km / Seuil: ${v.prochaineVidangeKm} km)`,
          });
        }
      }

      // Oil change date alert
      if (v.prochaineVidangeDate) {
        const targetMs = new Date(v.prochaineVidangeDate).getTime();
        if (!Number.isNaN(targetMs) && targetMs - nowMs <= alertDaysMs) {
          alerts.push({
            id: `al-vid-dt-${v.id}`,
            categorie: 'vidange_date',
            severite: targetMs < nowMs ? 'urgent' : 'attention',
            vehicleId: v.id,
            referenceInterne: v.referenceInterne,
            titre: `Échéance date de vidange — ${v.referenceInterne} (${v.modele})`,
            detail: `Date prévue : ${v.prochaineVidangeDate}`,
          });
        }
      }

      // Insurance expiry alert
      if (v.assuranceEcheance) {
        const expMs = new Date(v.assuranceEcheance).getTime();
        if (!Number.isNaN(expMs) && expMs - nowMs <= alertDaysMs) {
          alerts.push({
            id: `al-ass-${v.id}`,
            categorie: 'assurance',
            severite: expMs < nowMs ? 'urgent' : 'attention',
            vehicleId: v.id,
            referenceInterne: v.referenceInterne,
            titre: `Échéance Assurance — ${v.referenceInterne} (${v.modele})`,
            detail: `Expiration assurance : ${v.assuranceEcheance}`,
          });
        }
      }

      // Technical inspection alert
      if (v.controleTechniqueEcheance) {
        const ctMs = new Date(v.controleTechniqueEcheance).getTime();
        if (!Number.isNaN(ctMs) && ctMs - nowMs <= alertDaysMs) {
          alerts.push({
            id: `al-ct-${v.id}`,
            categorie: 'controle_technique',
            severite: ctMs < nowMs ? 'urgent' : 'attention',
            vehicleId: v.id,
            referenceInterne: v.referenceInterne,
            titre: `Échéance Contrôle Technique — ${v.referenceInterne} (${v.modele})`,
            detail: `Expiration visite technique : ${v.controleTechniqueEcheance}`,
          });
        }
      }
    }

    return alerts;
  }

  // ===========================================================================
  // VEHICLES MANAGEMENT
  // ===========================================================================
  public updateVehicle(token: string | undefined, vehicleUpdate: Partial<AbboudVehicle> & { id: string }): AbboudVehicle {
    this.assertAdmin(token);
    const vehicle = this.db.vehicles.find((v) => v.id === vehicleUpdate.id);
    if (!vehicle) {
      throw new Error('Véhicule introuvable dans le parc.');
    }

    // Ensure unique internal reference if modified
    if (
      vehicleUpdate.referenceInterne &&
      vehicleUpdate.referenceInterne.trim() !== vehicle.referenceInterne
    ) {
      const dup = this.db.vehicles.find(
        (v) =>
          v.id !== vehicle.id &&
          v.referenceInterne.toLowerCase() === vehicleUpdate.referenceInterne!.trim().toLowerCase()
      );
      if (dup) {
        throw new Error(`La référence interne ${vehicleUpdate.referenceInterne} est déjà utilisée.`);
      }
    }

    Object.assign(vehicle, vehicleUpdate);
    this.saveToDisk();
    return vehicle;
  }

  // ===========================================================================
  // CLIENTS MANAGEMENT
  // ===========================================================================
  public upsertClient(
    token: string | undefined,
    input: Partial<ClientRecord> & { nomComplet: string; telephone: string }
  ): ClientRecord {
    this.assertAdmin(token);
    if (!input.nomComplet?.trim() || !input.telephone?.trim()) {
      throw new Error('Le nom complet et le téléphone du client sont obligatoires.');
    }

    if (input.id) {
      const existing = this.db.clients.find((c) => c.id === input.id);
      if (!existing) throw new Error('Client introuvable.');
      Object.assign(existing, input);
      this.saveToDisk();
      return existing;
    }

    const client: ClientRecord = {
      id: `cli-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nomComplet: input.nomComplet.trim(),
      telephone: input.telephone.trim(),
      email: input.email?.trim() || '',
      cinOuPasseport: input.cinOuPasseport?.trim() || '',
      permisNumero: input.permisNumero?.trim() || '',
      permisDateDelivrance: input.permisDateDelivrance || '',
      adresse: input.adresse?.trim() || '',
      documents: input.documents || [],
      notes: input.notes?.trim() || '',
      createdAt: new Date().toISOString(),
    };

    this.db.clients.unshift(client);
    this.saveToDisk();
    return client;
  }

  // ===========================================================================
  // RESERVATION REQUESTS MANAGEMENT
  // ===========================================================================
  public updateReservationRequestStatus(
    token: string | undefined,
    requestId: string,
    statut: ReservationRequest['statut']
  ): ReservationRequest {
    this.assertAdmin(token);
    const reqItem = this.db.reservationRequests.find((r) => r.id === requestId);
    if (!reqItem) throw new Error('Demande de réservation introuvable.');
    reqItem.statut = statut;
    this.saveToDisk();
    return reqItem;
  }

  // ===========================================================================
  // CONTRACTS, CONCURRENCY OVERLAP BLOCKING, EXTENSIONS & RETURNS
  // ===========================================================================
  private rangesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
    const a0 = new Date(startA).getTime();
    const a1 = new Date(endA).getTime();
    const b0 = new Date(startB).getTime();
    const b1 = new Date(endB).getTime();
    return a0 < b1 && b0 < a1;
  }

  public checkVehicleContractOverlap(
    vehicleId: string,
    departPrevu: string,
    retourPrevu: string,
    ignoreContractId?: string
  ): { conflict: boolean; reason?: string } {
    const startMs = new Date(departPrevu).getTime();
    const endMs = new Date(retourPrevu).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
      return { conflict: true, reason: 'Les dates de départ et de retour du contrat sont invalides.' };
    }

    const vehicle = this.db.vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) {
      return { conflict: true, reason: 'Véhicule introuvable.' };
    }
    if (vehicle.etat === 'en_entretien' || vehicle.etat === 'indisponible') {
      return {
        conflict: true,
        reason: `Le véhicule ${vehicle.referenceInterne} est actuellement déclaré "${vehicle.etat}".`,
      };
    }

    for (const c of this.db.contracts) {
      if (ignoreContractId && c.id === ignoreContractId) continue;
      if (c.vehicleId !== vehicleId) continue;
      if (c.statut !== 'confirme' && c.statut !== 'en_cours') continue;

      const effectiveEnd = c.retourReel || c.retourPrevu;
      if (this.rangesOverlap(departPrevu, retourPrevu, c.departPrevu, effectiveEnd)) {
        return {
          conflict: true,
          reason: `Chevauchement interdit : le véhicule ${vehicle.referenceInterne} fait déjà l'objet du contrat ${c.numeroContrat} (${c.statut}) du ${c.departPrevu.replace('T', ' ')} au ${effectiveEnd.replace('T', ' ')}.`,
        };
      }
    }

    return { conflict: false };
  }

  public async upsertContract(
    token: string | undefined,
    input: {
      id?: string;
      clientId: string;
      vehicleId: string;
      departPrevu: string;
      retourPrevu: string;
      lieuDepart?: string;
      lieuRetour?: string;
      tarifJournalierConvenu: number;
      fraisSupplementaires?: number;
      remise?: number;
      cautionMontant?: number;
      cautionStatut?: ContractRecord['cautionStatut'];
      cautionMode?: string;
      kmDepart?: number | null;
      carburantDepart?: string;
      etatDepartNotes?: string;
      statut: ContractRecord['statut'];
      fromRequestId?: string;
      autoCreateInvoice?: boolean;
    }
  ): Promise<{ contract: ContractRecord; invoice?: InvoiceRecord }> {
    this.assertAdmin(token);

    return this.withLock(() => {
      const client = this.db.clients.find((c) => c.id === input.clientId);
      if (!client) throw new Error('Client introuvable pour ce contrat.');

      const vehicle = this.db.vehicles.find((v) => v.id === input.vehicleId);
      if (!vehicle) throw new Error('Véhicule introuvable pour ce contrat.');

      // If confirming or starting the contract, strictly block overlaps
      if (input.statut === 'confirme' || input.statut === 'en_cours') {
        const check = this.checkVehicleContractOverlap(
          input.vehicleId,
          input.departPrevu,
          input.retourPrevu,
          input.id
        );
        if (check.conflict) {
          throw new Error(check.reason);
        }
      }

      const startMs = new Date(input.departPrevu).getTime();
      const endMs = new Date(input.retourPrevu).getTime();
      const nbJours = Math.max(1, Math.ceil((endMs - startMs) / 86400000));
      const tarif = Number(input.tarifJournalierConvenu) || 0;
      const frais = Number(input.fraisSupplementaires) || 0;
      const remise = Number(input.remise) || 0;
      const montantTotalLocation = Math.max(0, nbJours * tarif + frais - remise);

      const nowIso = new Date().toISOString();

      let contract: ContractRecord;
      if (input.id) {
        const existing = this.db.contracts.find((c) => c.id === input.id);
        if (!existing) throw new Error('Contrat introuvable.');
        Object.assign(existing, {
          clientId: input.clientId,
          vehicleId: input.vehicleId,
          departPrevu: input.departPrevu,
          retourPrevu: input.retourPrevu,
          lieuDepart: input.lieuDepart ?? existing.lieuDepart,
          lieuRetour: input.lieuRetour ?? existing.lieuRetour,
          nbJours,
          tarifJournalierConvenu: tarif,
          fraisSupplementaires: frais,
          remise,
          montantTotalLocation: montantTotalLocation + (existing.fraisRetourValides || 0),
          cautionMontant: input.cautionMontant ?? existing.cautionMontant,
          cautionStatut: input.cautionStatut ?? existing.cautionStatut,
          cautionMode: input.cautionMode ?? existing.cautionMode,
          kmDepart: input.kmDepart !== undefined ? input.kmDepart : existing.kmDepart,
          carburantDepart: input.carburantDepart ?? existing.carburantDepart,
          etatDepartNotes: input.etatDepartNotes ?? existing.etatDepartNotes,
          statut: input.statut,
          updatedAt: nowIso,
        });
        contract = existing;
      } else {
        const seq = String(this.db.contracts.length + 1).padStart(4, '0');
        contract = {
          id: `ctr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          numeroContrat: `CTR-${new Date().getFullYear()}-${seq}`,
          clientId: input.clientId,
          vehicleId: input.vehicleId,
          departPrevu: input.departPrevu,
          retourPrevu: input.retourPrevu,
          retourReel: '',
          lieuDepart: input.lieuDepart || 'Kénitra',
          lieuRetour: input.lieuRetour || 'Kénitra',
          nbJours,
          tarifJournalierConvenu: tarif,
          fraisSupplementaires: frais,
          remise,
          montantTotalLocation,
          cautionMontant: Number(input.cautionMontant) || 0,
          cautionStatut: input.cautionStatut || 'non_recue',
          cautionMode: input.cautionMode || 'Espèces / Chèque de garantie',
          kmDepart: input.kmDepart ?? vehicle.kilometrage,
          carburantDepart: input.carburantDepart || '',
          etatDepartNotes: input.etatDepartNotes || '',
          kmRetour: null,
          carburantRetour: '',
          observationsRetour: '',
          fraisRetourValides: 0,
          statut: input.statut,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        this.db.contracts.unshift(contract);
      }

      // Sync vehicle state
      if (contract.statut === 'en_cours') {
        vehicle.etat = 'louee';
      } else if (contract.statut === 'confirme' && vehicle.etat !== 'louee') {
        vehicle.etat = 'reservee';
      }

      // Link reservation request if converted
      if (input.fromRequestId) {
        const reqItem = this.db.reservationRequests.find((r) => r.id === input.fromRequestId);
        if (reqItem) {
          reqItem.statut = 'confirmee';
          reqItem.contratIdLie = contract.id;
        }
      }

      // Auto-create or sync invoice if requested
      let invoice = this.db.invoices.find((inv) => inv.contractId === contract.id);
      if (input.autoCreateInvoice && !invoice) {
        const invSeq = String(this.db.invoices.length + 1).padStart(4, '0');
        invoice = {
          id: `fac-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          numeroFacture: `FAC-${new Date().getFullYear()}-${invSeq}`,
          contractId: contract.id,
          clientId: contract.clientId,
          dateEmission: nowIso.slice(0, 10),
          dateEcheance: contract.retourPrevu.slice(0, 10),
          montantTotalFacture: contract.montantTotalLocation,
          montantAvoirs: 0,
          montantPayeAffecte: 0,
          resteDu: contract.montantTotalLocation,
          statut: contract.statut === 'brouillon' ? 'brouillon' : 'emise',
          notes: '',
          avoirs: [],
          createdAt: nowIso,
        };
        this.db.invoices.unshift(invoice);
      } else if (invoice) {
        this.recalculateInvoice(invoice.id, contract.montantTotalLocation);
      }

      this.saveToDisk();
      return { contract, invoice };
    });
  }

  public async extendContract(
    token: string | undefined,
    params: {
      contractId: string;
      nouveauRetourPrevu: string;
      fraisSupplementairesAjoutes?: number;
    }
  ): Promise<ContractRecord> {
    this.assertAdmin(token);
    return this.withLock(() => {
      const contract = this.db.contracts.find((c) => c.id === params.contractId);
      if (!contract) throw new Error('Contrat introuvable.');

      const check = this.checkVehicleContractOverlap(
        contract.vehicleId,
        contract.departPrevu,
        params.nouveauRetourPrevu,
        contract.id
      );
      if (check.conflict) {
        throw new Error(check.reason);
      }

      contract.retourPrevu = params.nouveauRetourPrevu;
      const startMs = new Date(contract.departPrevu).getTime();
      const endMs = new Date(contract.retourPrevu).getTime();
      contract.nbJours = Math.max(1, Math.ceil((endMs - startMs) / 86400000));
      if (params.fraisSupplementairesAjoutes) {
        contract.fraisSupplementaires += Number(params.fraisSupplementairesAjoutes);
      }
      contract.montantTotalLocation = Math.max(
        0,
        contract.nbJours * contract.tarifJournalierConvenu +
          contract.fraisSupplementaires +
          contract.fraisRetourValides -
          contract.remise
      );
      contract.updatedAt = new Date().toISOString();

      const linkedInvoice = this.db.invoices.find((i) => i.contractId === contract.id);
      if (linkedInvoice) {
        this.recalculateInvoice(linkedInvoice.id, contract.montantTotalLocation);
      }

      this.saveToDisk();
      return contract;
    });
  }

  public async registerContractReturn(
    token: string | undefined,
    params: {
      contractId: string;
      retourReel: string;
      kmRetour: number | null;
      carburantRetour: string;
      observationsRetour: string;
      fraisRetourValides: number;
      cautionStatut?: ContractRecord['cautionStatut'];
      declarerEnEntretien?: boolean;
    }
  ): Promise<{ contract: ContractRecord; vehicle: AbboudVehicle }> {
    this.assertAdmin(token);
    return this.withLock(() => {
      const contract = this.db.contracts.find((c) => c.id === params.contractId);
      if (!contract) throw new Error('Contrat introuvable.');

      const vehicle = this.db.vehicles.find((v) => v.id === contract.vehicleId);
      if (!vehicle) throw new Error('Véhicule introuvable.');

      contract.retourReel = params.retourReel || new Date().toISOString().slice(0, 16);
      contract.kmRetour = params.kmRetour;
      contract.carburantRetour = params.carburantRetour;
      contract.observationsRetour = params.observationsRetour;
      contract.fraisRetourValides = Number(params.fraisRetourValides) || 0;
      if (params.cautionStatut) {
        contract.cautionStatut = params.cautionStatut;
      }

      contract.montantTotalLocation = Math.max(
        0,
        contract.nbJours * contract.tarifJournalierConvenu +
          contract.fraisSupplementaires +
          contract.fraisRetourValides -
          contract.remise
      );
      contract.statut = 'cloture';
      contract.updatedAt = new Date().toISOString();

      if (params.kmRetour !== null && !Number.isNaN(Number(params.kmRetour))) {
        vehicle.kilometrage = Number(params.kmRetour);
      }

      // STRICT REQUIREMENT (Section 4):
      // "Ne remets pas automatiquement en disponibilité un véhicule déclaré en entretien."
      if (params.declarerEnEntretien || vehicle.etat === 'en_entretien') {
        vehicle.etat = 'en_entretien';
      } else if (vehicle.etat !== 'indisponible') {
        vehicle.etat = 'disponible';
      }

      const linkedInvoice = this.db.invoices.find((i) => i.contractId === contract.id);
      if (linkedInvoice) {
        this.recalculateInvoice(linkedInvoice.id, contract.montantTotalLocation);
      }

      this.saveToDisk();
      return { contract, vehicle };
    });
  }

  // ===========================================================================
  // INVOICES, PARTIAL PAYMENTS & CREDIT NOTES (AVOIRS)
  // ===========================================================================
  private recalculateInvoice(invoiceId: string, overrideTotalFacture?: number): InvoiceRecord {
    const invoice = this.db.invoices.find((i) => i.id === invoiceId);
    if (!invoice) throw new Error('Facture introuvable.');

    if (overrideTotalFacture !== undefined) {
      invoice.montantTotalFacture = overrideTotalFacture;
    }

    const totalAvoirs = invoice.avoirs.reduce((sum, a) => sum + a.montant, 0);
    invoice.montantAvoirs = totalAvoirs;

    const totalPayments = this.db.payments
      .filter((p) => p.invoiceId === invoice.id)
      .reduce((sum, p) => sum + p.montant, 0);
    invoice.montantPayeAffecte = totalPayments;

    // Exact formula: reste dû = total facturé − paiements affectés à la facture (net d'avoirs)
    const netFacture = Math.max(0, invoice.montantTotalFacture - invoice.montantAvoirs);
    invoice.resteDu = Math.max(0, netFacture - invoice.montantPayeAffecte);

    if (invoice.statut !== 'annulee') {
      if (netFacture === 0 && invoice.montantAvoirs > 0) {
        invoice.statut = 'annulee';
      } else if (invoice.resteDu === 0 && invoice.montantPayeAffecte > 0) {
        invoice.statut = 'payee';
      } else if (invoice.montantPayeAffecte > 0 && invoice.resteDu > 0) {
        invoice.statut = 'partiellement_payee';
      } else if (invoice.statut !== 'brouillon') {
        invoice.statut = 'emise';
      }
    }

    return invoice;
  }

  public createOrUpdateInvoice(
    token: string | undefined,
    params: {
      id?: string;
      contractId: string;
      dateEmission: string;
      dateEcheance: string;
      montantTotalFacture: number;
      statut?: InvoiceRecord['statut'];
      notes?: string;
    }
  ): InvoiceRecord {
    this.assertAdmin(token);
    const contract = this.db.contracts.find((c) => c.id === params.contractId);
    if (!contract) throw new Error('Contrat introuvable pour cette facture.');

    if (params.id) {
      const existing = this.db.invoices.find((i) => i.id === params.id);
      if (!existing) throw new Error('Facture introuvable.');
      existing.dateEmission = params.dateEmission;
      existing.dateEcheance = params.dateEcheance;
      if (params.statut) existing.statut = params.statut;
      if (params.notes !== undefined) existing.notes = params.notes;
      this.recalculateInvoice(existing.id, Number(params.montantTotalFacture));
      this.saveToDisk();
      return existing;
    }

    const seq = String(this.db.invoices.length + 1).padStart(4, '0');
    const invoice: InvoiceRecord = {
      id: `fac-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      numeroFacture: `FAC-${new Date().getFullYear()}-${seq}`,
      contractId: contract.id,
      clientId: contract.clientId,
      dateEmission: params.dateEmission || new Date().toISOString().slice(0, 10),
      dateEcheance: params.dateEcheance || contract.retourPrevu.slice(0, 10),
      montantTotalFacture: Number(params.montantTotalFacture),
      montantAvoirs: 0,
      montantPayeAffecte: 0,
      resteDu: Number(params.montantTotalFacture),
      statut: params.statut || 'emise',
      notes: params.notes || '',
      avoirs: [],
      createdAt: new Date().toISOString(),
    };

    this.db.invoices.unshift(invoice);
    this.recalculateInvoice(invoice.id);
    this.saveToDisk();
    return invoice;
  }

  public recordInvoicePayment(
    token: string | undefined,
    params: {
      invoiceId: string;
      datePaiement: string;
      montant: number;
      modePaiement: InvoicePaymentRecord['modePaiement'];
      referenceOperation?: string;
      notes?: string;
    }
  ): { payment: InvoicePaymentRecord; invoice: InvoiceRecord } {
    this.assertAdmin(token);
    const invoice = this.db.invoices.find((i) => i.id === params.invoiceId);
    if (!invoice) throw new Error('Facture introuvable.');
    const amount = Number(params.montant);
    if (Number.isNaN(amount) || amount <= 0) {
      throw new Error('Le montant du paiement doit être supérieur à 0.');
    }

    if (invoice.statut === 'brouillon') {
      invoice.statut = 'emise';
    }

    const payment: InvoicePaymentRecord = {
      id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      invoiceId: invoice.id,
      contractId: invoice.contractId,
      clientId: invoice.clientId,
      datePaiement: params.datePaiement || new Date().toISOString().slice(0, 10),
      montant: amount,
      modePaiement: params.modePaiement,
      referenceOperation: params.referenceOperation || '',
      notes: params.notes || '',
    };

    this.db.payments.unshift(payment);
    const updatedInvoice = this.recalculateInvoice(invoice.id);
    this.saveToDisk();
    return { payment, invoice: updatedInvoice };
  }

  public issueCreditNote(
    token: string | undefined,
    params: {
      invoiceId: string;
      montant: number;
      motif: string;
      annulerFacture?: boolean;
    }
  ): InvoiceRecord {
    this.assertAdmin(token);
    const invoice = this.db.invoices.find((i) => i.id === params.invoiceId);
    if (!invoice) throw new Error('Facture introuvable.');

    const creditNote: CreditNoteRecord = {
      id: `avr-${Date.now()}`,
      numeroAvoir: `AVR-${new Date().getFullYear()}-${String(invoice.avoirs.length + 1).padStart(3, '0')}`,
      invoiceId: invoice.id,
      dateEmission: new Date().toISOString().slice(0, 10),
      montant: Number(params.montant) || 0,
      motif: params.motif || 'Avoir commercial / Annulation',
    };

    invoice.avoirs.push(creditNote);
    if (params.annulerFacture) {
      invoice.statut = 'annulee';
    }
    this.recalculateInvoice(invoice.id);
    this.saveToDisk();
    return invoice;
  }

  // ===========================================================================
  // MAINTENANCE & OIL CHANGES
  // ===========================================================================
  public addMaintenanceRecord(
    token: string | undefined,
    params: Omit<MaintenanceRecord, 'id' | 'createdAt'> & {
      mettreVehiculeEnEntretien?: boolean;
    }
  ): MaintenanceRecord {
    this.assertAdmin(token);
    const vehicle = this.db.vehicles.find((v) => v.id === params.vehicleId);
    if (!vehicle) throw new Error('Véhicule introuvable.');

    const record: MaintenanceRecord = {
      id: `mnt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      vehicleId: params.vehicleId,
      dateIntervention: params.dateIntervention,
      kilometrage: params.kilometrage,
      typeIntervention: params.typeIntervention,
      description: params.description,
      cout: Number(params.cout) || 0,
      prestataire: params.prestataire,
      justificatifPrive: params.justificatifPrive,
      prochaineVidangeKmFixee: params.prochaineVidangeKmFixee,
      prochaineVidangeDateFixee: params.prochaineVidangeDateFixee,
      createdAt: new Date().toISOString(),
    };

    this.db.maintenances.unshift(record);

    if (params.kilometrage !== null && (vehicle.kilometrage === null || params.kilometrage > vehicle.kilometrage)) {
      vehicle.kilometrage = params.kilometrage;
    }
    if (params.prochaineVidangeKmFixee !== null && params.prochaineVidangeKmFixee !== undefined) {
      vehicle.prochaineVidangeKm = params.prochaineVidangeKmFixee;
    }
    if (params.prochaineVidangeDateFixee) {
      vehicle.prochaineVidangeDate = params.prochaineVidangeDateFixee;
    }
    if (params.mettreVehiculeEnEntretien) {
      vehicle.etat = 'en_entretien';
    }

    this.saveToDisk();
    return record;
  }

  // ===========================================================================
  // VEHICLE FINANCING CREDITS (STRICT CAPITAL SEPARATION)
  // ===========================================================================
  public upsertVehicleCredit(
    token: string | undefined,
    params: Omit<VehicleCreditRecord, 'id' | 'createdAt' | 'paiements'> & { id?: string }
  ): VehicleCreditRecord {
    this.assertAdmin(token);
    if (params.id) {
      const existing = this.db.credits.find((c) => c.id === params.id);
      if (!existing) throw new Error('Dossier de crédit introuvable.');
      Object.assign(existing, params);
      this.saveToDisk();
      return existing;
    }

    const credit: VehicleCreditRecord = {
      id: `crd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      vehicleId: params.vehicleId,
      organismeFinancier: params.organismeFinancier,
      referenceContratCredit: params.referenceContratCredit,
      dateDebut: params.dateDebut,
      dureeMois: Number(params.dureeMois) || 60,
      montantInitialFinancement: Number(params.montantInitialFinancement) || 0,
      mensualiteTotale: Number(params.mensualiteTotale) || 0,
      echeancierDescription: params.echeancierDescription || '',
      soldeCapitalCommunique:
        params.soldeCapitalCommunique !== null && params.soldeCapitalCommunique !== undefined
          ? Number(params.soldeCapitalCommunique)
          : null,
      dateSoldeCommunique: params.dateSoldeCommunique || '',
      paiements: [],
      notes: params.notes || '',
      createdAt: new Date().toISOString(),
    };

    this.db.credits.unshift(credit);
    this.saveToDisk();
    return credit;
  }

  public recordCreditInstallment(
    token: string | undefined,
    params: {
      creditId: string;
      datePaiement: string;
      montantMensualiteVersee: number;
      partCapitalDocumentee?: number | null;
      partInteretsEtFrais?: number | null;
      nouveauSoldeCapitalCommunique?: number | null;
      reference?: string;
    }
  ): VehicleCreditRecord {
    this.assertAdmin(token);
    const credit = this.db.credits.find((c) => c.id === params.creditId);
    if (!credit) throw new Error('Crédit véhicule introuvable.');

    const installment: CreditInstallmentPayment = {
      id: `ech-${Date.now()}`,
      datePaiement: params.datePaiement,
      montantMensualiteVersee: Number(params.montantMensualiteVersee) || 0,
      partCapitalDocumentee:
        params.partCapitalDocumentee !== undefined && params.partCapitalDocumentee !== null
          ? Number(params.partCapitalDocumentee)
          : null,
      partInteretsEtFrais:
        params.partInteretsEtFrais !== undefined && params.partInteretsEtFrais !== null
          ? Number(params.partInteretsEtFrais)
          : null,
      reference: params.reference || '',
    };

    credit.paiements.unshift(installment);

    // STRICT RULE: Never subtract gross mensualité (which includes interest & fees) from principal!
    // Only update soldeCapitalCommunique if explicitly communicated by lender OR if documented principal part is deducted from an already known capital balance.
    if (
      params.nouveauSoldeCapitalCommunique !== undefined &&
      params.nouveauSoldeCapitalCommunique !== null
    ) {
      credit.soldeCapitalCommunique = Number(params.nouveauSoldeCapitalCommunique);
      credit.dateSoldeCommunique = params.datePaiement;
    } else if (
      credit.soldeCapitalCommunique !== null &&
      installment.partCapitalDocumentee !== null
    ) {
      credit.soldeCapitalCommunique = Math.max(
        0,
        credit.soldeCapitalCommunique - installment.partCapitalDocumentee
      );
      credit.dateSoldeCommunique = params.datePaiement;
    }

    this.saveToDisk();
    return credit;
  }

  // ===========================================================================
  // EXPENSES & SETTINGS & BACKUP
  // ===========================================================================
  public addExpense(
    token: string | undefined,
    params: Omit<ExpenseRecord, 'id' | 'createdAt'>
  ): ExpenseRecord {
    this.assertAdmin(token);
    const expense: ExpenseRecord = {
      ...params,
      id: `dep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      montant: Number(params.montant) || 0,
      createdAt: new Date().toISOString(),
    };
    this.db.expenses.unshift(expense);
    this.saveToDisk();
    return expense;
  }

  public updateSettings(token: string | undefined, updates: Partial<AgencySettings>): AgencySettings {
    this.assertAdmin(token);
    this.db.settings = {
      ...this.db.settings,
      ...updates,
    };
    this.saveToDisk();
    return this.db.settings;
  }

  public resetToCleanNineVehiclesState(token: string | undefined): AbboudDatabaseState {
    this.assertAdmin(token);
    this.db = createInitialAbboudState();
    this.saveToDisk();
    return this.db;
  }

  public importDatabaseBackup(token: string | undefined, state: AbboudDatabaseState): AbboudDatabaseState {
    this.assertAdmin(token);
    if (!state || !Array.isArray(state.vehicles) || state.vehicles.length !== 9) {
      throw new Error('Fichier de sauvegarde invalide (les 9 véhicules du parc sont requis).');
    }
    this.db = state;
    this.saveToDisk();
    return this.db;
  }
}

export const abboudEngine = new AbboudRentalEngine({ persistToDisk: true });
