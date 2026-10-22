import { describe, it, expect, beforeEach } from 'vitest';
import { AbboudRentalEngine, createInitialAbboudState } from '../../server/abboudEngine';

describe('ABBOUD CAR RENTAL — Validation & Acceptance Tests (Section 6)', () => {
  let engine: AbboudRentalEngine;
  let adminToken: string;

  beforeEach(() => {
    engine = new AbboudRentalEngine({
      persistToDisk: false,
      initialState: createInitialAbboudState(),
    });
    adminToken = engine.loginAdmin('abboud2026').token;
  });

  it('1. Initial state contains strictly the 9 confirmed vehicles across 5 models with unconfirmed fields left blank', () => {
    const pub = engine.getPublicShowcaseData();
    expect(pub.totalVehiclesCount).toBe(9);
    expect(pub.models).toHaveLength(5);

    const expectedCounts: Record<string, number> = {
      'Peugeot 208': 2,
      'Opel Corsa': 2,
      'Hyundai Tucson': 1,
      'Renault Clio': 2,
      'Dacia Sandero': 2,
    };
    for (const m of pub.models) {
      expect(m.quantiteTotale).toBe(expectedCounts[m.modele]);
    }

    const state = engine.getAdminState(adminToken);
    expect(state.vehicles.map((v) => v.referenceInterne)).toEqual([
      'P208-01',
      'P208-02',
      'COR-01',
      'COR-02',
      'TUC-01',
      'CLI-01',
      'CLI-02',
      'SAN-01',
      'SAN-02',
    ]);

    // Unconfirmed fields must be empty initially
    for (const v of state.vehicles) {
      expect(v.immatriculation).toBe('');
      expect(v.tarifJournalier).toBeNull();
      expect(v.kilometrage).toBeNull();
      expect(v.etat).toBe('a_renseigner');
    }

    // Other operational collections start empty
    expect(state.clients).toHaveLength(0);
    expect(state.contracts).toHaveLength(0);
    expect(state.invoices).toHaveLength(0);
    expect(state.payments).toHaveLength(0);
  });

  it('2. Public reservation request returns "Demande reçue, en attente de confirmation" without blocking a vehicle', () => {
    const res = engine.submitPublicReservationRequest({
      modeleSouhaite: 'Peugeot 208',
      departSouhaite: '2026-11-10T10:00',
      retourSouhaite: '2026-11-14T10:00',
      lieuPriseEnCharge: 'Kénitra',
      nomClient: 'Youssef Alami',
      telephone: '06 11 22 33 44',
      message: 'Demande pour 4 jours',
    });

    expect(res.confirmationMessage).toBe('Demande reçue, en attente de confirmation');
    expect(res.request.statut).toBe('en_attente');

    // No vehicle was automatically blocked
    const state = engine.getAdminState(adminToken);
    expect(state.vehicles.every((v) => v.etat === 'a_renseigner')).toBe(true);
  });

  it('3. Admin authentication protects private data and public endpoint never leaks sensitive records', () => {
    expect(() => engine.getAdminState(undefined)).toThrow(/Non autorisé/);
    expect(() => engine.getAdminState('invalid-token')).toThrow(/Non autorisé/);

    const pub = engine.getPublicShowcaseData() as Record<string, unknown>;
    expect(pub.clients).toBeUndefined();
    expect(pub.contracts).toBeUndefined();
    expect(pub.invoices).toBeUndefined();
    expect(pub.payments).toBeUndefined();
  });

  it('4. Blocks overlapping confirmed/active contracts on the same vehicle, including simultaneous requests', async () => {
    const state = engine.getAdminState(adminToken);
    const vehicle = state.vehicles[0]; // P208-01
    engine.updateVehicle(adminToken, { id: vehicle.id, etat: 'disponible', tarifJournalier: 300 });

    const clientA = engine.upsertClient(adminToken, {
      nomComplet: 'Client Alpha',
      telephone: '0600000001',
    });
    const clientB = engine.upsertClient(adminToken, {
      nomComplet: 'Client Beta',
      telephone: '0600000002',
    });

    // Simultaneous confirmation attempts for P208-01 on overlapping dates
    const attempt1 = engine.upsertContract(adminToken, {
      clientId: clientA.id,
      vehicleId: vehicle.id,
      departPrevu: '2026-12-01T09:00',
      retourPrevu: '2026-12-05T18:00',
      tarifJournalierConvenu: 300,
      statut: 'confirme',
    });

    const attempt2 = engine.upsertContract(adminToken, {
      clientId: clientB.id,
      vehicleId: vehicle.id,
      departPrevu: '2026-12-03T10:00',
      retourPrevu: '2026-12-07T18:00',
      tarifJournalierConvenu: 300,
      statut: 'confirme',
    });

    const outcomes = await Promise.allSettled([attempt1, attempt2]);
    expect(outcomes.filter((o) => o.status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.filter((o) => o.status === 'rejected')).toHaveLength(1);
  });

  it('5. Accurately calculates partial payments (reste dû = total facturé - paiements) and separates caution from revenue', async () => {
    const state = engine.getAdminState(adminToken);
    const vehicle = state.vehicles[2]; // COR-01
    engine.updateVehicle(adminToken, { id: vehicle.id, etat: 'disponible' });

    const client = engine.upsertClient(adminToken, {
      nomComplet: 'Karim Tazi',
      telephone: '0655443322',
    });

    const { contract, invoice } = await engine.upsertContract(adminToken, {
      clientId: client.id,
      vehicleId: vehicle.id,
      departPrevu: '2026-11-01T10:00',
      retourPrevu: '2026-11-05T10:00', // 4 days
      tarifJournalierConvenu: 350, // 4 * 350 = 1400
      fraisSupplementaires: 100, // +100 = 1500
      remise: 50, // -50 = 1450
      cautionMontant: 5000, // Caution must NOT be added to invoice total!
      cautionStatut: 'recue',
      statut: 'en_cours',
      autoCreateInvoice: true,
    });

    expect(contract.montantTotalLocation).toBe(1450);
    expect(contract.cautionMontant).toBe(5000);
    expect(invoice).toBeDefined();
    expect(invoice!.montantTotalFacture).toBe(1450);
    expect(invoice!.resteDu).toBe(1450);

    // Record first partial payment of 600
    const res1 = engine.recordInvoicePayment(adminToken, {
      invoiceId: invoice!.id,
      datePaiement: '2026-11-01',
      montant: 600,
      modePaiement: 'Espèces',
    });
    expect(res1.invoice.montantPayeAffecte).toBe(600);
    expect(res1.invoice.resteDu).toBe(850);
    expect(res1.invoice.statut).toBe('partiellement_payee');

    // Record remaining payment of 850
    const res2 = engine.recordInvoicePayment(adminToken, {
      invoiceId: invoice!.id,
      datePaiement: '2026-11-05',
      montant: 850,
      modePaiement: 'Virement',
    });
    expect(res2.invoice.resteDu).toBe(0);
    expect(res2.invoice.statut).toBe('payee');
  });

  it('6. Handles returns, extensions, maintenance alerts, and does NOT return a maintenance vehicle to disponible', async () => {
    const state = engine.getAdminState(adminToken);
    const vehicle = state.vehicles[4]; // TUC-01 (Hyundai Tucson)
    engine.updateVehicle(adminToken, {
      id: vehicle.id,
      etat: 'disponible',
      kilometrage: 49200,
      prochaineVidangeKm: 50000,
    });

    const client = engine.upsertClient(adminToken, {
      nomComplet: 'Salma Bennani',
      telephone: '0677889900',
    });

    const { contract } = await engine.upsertContract(adminToken, {
      clientId: client.id,
      vehicleId: vehicle.id,
      departPrevu: '2026-11-10T10:00',
      retourPrevu: '2026-11-12T10:00',
      tarifJournalierConvenu: 500,
      statut: 'en_cours',
      autoCreateInvoice: true,
    });

    // Extend contract by 2 days
    const extended = await engine.extendContract(adminToken, {
      contractId: contract.id,
      nouveauRetourPrevu: '2026-11-14T10:00',
    });
    expect(extended.nbJours).toBe(4);
    expect(extended.montantTotalLocation).toBe(2000);

    // Register return with declarerEnEntretien = true and kmRetour = 50150 (triggers oil change alert)
    const returned = await engine.registerContractReturn(adminToken, {
      contractId: contract.id,
      retourReel: '2026-11-14T11:30',
      kmRetour: 50150,
      carburantRetour: 'Plein',
      observationsRetour: 'Bruit plaquettes de frein — mise en entretien',
      fraisRetourValides: 0,
      cautionStatut: 'restituee',
      declarerEnEntretien: true,
    });

    // Must remain 'en_entretien' and NOT become 'disponible'!
    expect(returned.vehicle.etat).toBe('en_entretien');
    expect(returned.vehicle.kilometrage).toBe(50150);

    // Verify oil change alert is triggered from the entered values
    const alerts = engine.computeActiveAlerts();
    expect(alerts.some((a) => a.vehicleId === vehicle.id && a.categorie === 'vidange_km')).toBe(true);
  });

  it('7. Vehicle financing credits never naively subtract gross monthly installments (including interest) from principal', () => {
    const state = engine.getAdminState(adminToken);
    const vehicle = state.vehicles[0];

    const credit = engine.upsertVehicleCredit(adminToken, {
      vehicleId: vehicle.id,
      organismeFinancier: 'Wafasalaf / Leasing Auto',
      referenceContratCredit: 'CRD-208-01',
      dateDebut: '2026-01-01',
      dureeMois: 60,
      montantInitialFinancement: 180000,
      mensualiteTotale: 3650, // includes interest & insurance
      echeancierDescription: '60 mensualités de 3650 MAD TTC',
      soldeCapitalCommunique: 165000,
      dateSoldeCommunique: '2026-10-01',
      notes: '',
    });

    // Record a monthly installment WITHOUT a documented capital split or lender capital update:
    // soldeCapitalCommunique must NOT be reduced by 3650!
    const afterInstallment = engine.recordCreditInstallment(adminToken, {
      creditId: credit.id,
      datePaiement: '2026-11-01',
      montantMensualiteVersee: 3650,
    });

    expect(afterInstallment.soldeCapitalCommunique).toBe(165000);
  });
});
