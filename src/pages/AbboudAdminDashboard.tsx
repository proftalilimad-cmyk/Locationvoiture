import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Car,
  Users,
  CalendarClock,
  FileSignature,
  ArrowLeftRight,
  FileText,
  CreditCard,
  Wrench,
  ShieldCheck,
  Landmark,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  Lock,
  Printer,
  Download,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { useAbboud } from '../context/AbboudContext';
import { AbboudLogo } from '../components/AbboudLogo';
import { AbboudPrintModal } from '../components/AbboudPrintModal';
import {
  AbboudVehicle,
  ContractRecord,
  InvoicePaymentRecord,
  InvoiceRecord,
  MaintenanceRecord,
  VehicleState,
} from '../types/abboud';

type DashboardSection =
  | 'overview'
  | 'vehicles'
  | 'clients'
  | 'reservations'
  | 'contracts'
  | 'returns'
  | 'invoices'
  | 'payments'
  | 'maintenance'
  | 'compliance'
  | 'credits'
  | 'expenses'
  | 'reports'
  | 'settings';

export const AbboudAdminDashboard: React.FC = () => {
  const {
    adminToken,
    adminState,
    loginAdmin,
    logoutAdmin,
    updateVehicle,
    upsertClient,
    updateRequestStatus,
    upsertContract,
    extendContract,
    registerReturn,
    upsertInvoice,
    recordPayment,
    issueCreditNote,
    addMaintenance,
    upsertVehicleCredit,
    recordCreditInstallment,
    addExpense,
    updateSettings,
    changePassword,
    resetToInitialNineVehicles,
  } = useAbboud();

  const [section, setSection] = useState<DashboardSection>('overview');
  const [loginPassword, setLoginPassword] = useState('abboud2026');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Print modal state
  const [printMode, setPrintMode] = useState<'contract' | 'invoice' | null>(null);
  const [printContract, setPrintContract] = useState<ContractRecord | null>(null);
  const [printInvoice, setPrintInvoice] = useState<InvoiceRecord | null>(null);

  // Vehicle Editing & History Drawer State
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [vehicleEditForm, setVehicleEditForm] = useState<Partial<AbboudVehicle> | null>(null);

  // Client Form State
  const [clientForm, setClientForm] = useState({
    id: '',
    nomComplet: '',
    telephone: '',
    email: '',
    cinOuPasseport: '',
    permisNumero: '',
    permisDateDelivrance: '',
    adresse: '',
    notes: '',
  });

  // Contract Form State
  const [contractForm, setContractForm] = useState({
    id: '',
    clientId: '',
    vehicleId: '',
    departPrevu: '2026-10-20T09:00',
    retourPrevu: '2026-10-24T18:00',
    lieuDepart: 'Kénitra',
    lieuRetour: 'Kénitra',
    tarifJournalierConvenu: 300,
    fraisSupplementaires: 0,
    remise: 0,
    cautionMontant: 3000,
    cautionStatut: 'recue' as ContractRecord['cautionStatut'],
    cautionMode: 'Espèces / Chèque',
    kmDepart: '',
    carburantDepart: 'Plein',
    etatDepartNotes: '',
    statut: 'en_cours' as ContractRecord['statut'],
    fromRequestId: '',
    autoCreateInvoice: true,
  });

  // Return & Extension Form State
  const [returnForm, setReturnForm] = useState({
    contractId: '',
    retourReel: '2026-10-24T17:30',
    kmRetour: '',
    carburantRetour: 'Plein',
    observationsRetour: '',
    fraisRetourValides: 0,
    cautionStatut: 'restituee' as ContractRecord['cautionStatut'],
    declarerEnEntretien: false,
  });
  const [extendForm, setExtendForm] = useState({
    contractId: '',
    nouveauRetourPrevu: '2026-10-26T18:00',
    fraisSupplementairesAjoutes: 0,
  });

  // Payment & Credit Note Form State
  const [paymentForm, setPaymentForm] = useState({
    invoiceId: '',
    datePaiement: new Date().toISOString().slice(0, 10),
    montant: 500,
    modePaiement: 'Espèces' as InvoicePaymentRecord['modePaiement'],
    referenceOperation: '',
    notes: '',
  });
  const [avoirForm, setAvoirForm] = useState({
    invoiceId: '',
    montant: 100,
    motif: 'Remise commerciale / Avoir',
    annulerFacture: false,
  });

  // Maintenance Form State
  const [maintForm, setMaintForm] = useState({
    vehicleId: '',
    dateIntervention: new Date().toISOString().slice(0, 10),
    kilometrage: '',
    typeIntervention: 'Vidange et filtres' as MaintenanceRecord['typeIntervention'],
    description: '',
    cout: 450,
    prestataire: '',
    justificatifPrive: '',
    prochaineVidangeKmFixee: '',
    prochaineVidangeDateFixee: '',
    mettreVehiculeEnEntretien: false,
  });

  // Vehicle Credit Form State
  const [creditForm, setCreditForm] = useState({
    vehicleId: '',
    organismeFinancier: '',
    referenceContratCredit: '',
    dateDebut: '2026-01-01',
    dureeMois: 60,
    montantInitialFinancement: 150000,
    mensualiteTotale: 3100,
    echeancierDescription: '',
    soldeCapitalCommunique: '',
    dateSoldeCommunique: '',
    notes: '',
  });
  const [installmentForm, setInstallmentForm] = useState({
    creditId: '',
    datePaiement: new Date().toISOString().slice(0, 10),
    montantMensualiteVersee: 3100,
    partCapitalDocumentee: '',
    partInteretsEtFrais: '',
    nouveauSoldeCapitalCommunique: '',
    reference: '',
  });

  // Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    dateDepense: new Date().toISOString().slice(0, 10),
    categorie: 'Entretien / Garage' as const,
    vehicleId: '',
    montant: 200,
    prestataire: '',
    description: '',
    justificatifPrive: '',
  });

  // Password Change State
  const [newAdminPassword, setNewAdminPassword] = useState('');

  const notify = (type: 'ok' | 'err', text: string) => {
    setFeedback({ type, text });
  };

  // ===========================================================================
  // AUTHENTICATION SCREEN IF NOT LOGGED IN
  // ===========================================================================
  if (!adminToken || !adminState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0F14] px-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141720] p-8 shadow-2xl">
          <div className="text-center">
            <AbboudLogo variant="dark" size="md" className="mx-auto" />
            <h1 className="mt-4 text-xl font-extrabold text-white">
              Administration Privée — Kénitra
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Accès protégé côté serveur. Les clients, contrats, factures et documents ne sont
              jamais exposés sur le site public.
            </p>
          </div>

          {loginError && (
            <div className="mt-4 rounded-xl border border-red-500/40 bg-red-950/50 p-3 text-xs text-red-200">
              {loginError}
            </div>
          )}

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setLoginError(null);
              try {
                await loginAdmin(loginPassword);
              } catch (err) {
                setLoginError((err as Error).message);
              }
            }}
            className="mt-6 space-y-4"
          >
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                Mot de passe administrateur
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-red-500" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#090B10] py-2.5 pl-10 pr-4 font-mono text-sm text-white focus:border-red-500 focus:outline-none"
                />
              </div>
              <span className="mt-1 block font-mono text-[11px] text-slate-400">
                Mot de passe initial de validation : <strong>abboud2026</strong> (modifiable dans
                Paramètres)
              </span>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-red-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition hover:bg-red-500"
            >
              Se connecter au Dashboard
            </button>
          </form>

          <div className="mt-6 border-t border-white/10 pt-4 text-center">
            <Link to="/" className="text-xs font-semibold text-slate-400 hover:text-white">
              ← Retourner au site public ABBOUD CAR RENTAL
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // COMPUTED METRICS FOR DASHBOARD & REPORTS
  // ===========================================================================
  const {
    settings,
    vehicles,
    reservationRequests,
    clients,
    contracts,
    invoices,
    payments,
    maintenances,
    credits,
    expenses,
    alerts,
  } = adminState;

  const activeContracts = contracts.filter((c) => c.statut === 'en_cours');
  const confirmedOrActiveContracts = contracts.filter(
    (c) => c.statut === 'confirme' || c.statut === 'en_cours'
  );
  const overdueContracts = activeContracts.filter(
    (c) => !c.retourReel && new Date(c.retourPrevu).getTime() < Date.now()
  );

  // Strict distinction between Invoiced Revenue (Facturation) and Collected Cash (Encaissements)
  const validInvoices = invoices.filter(
    (i) => i.statut !== 'brouillon' && i.statut !== 'annulee'
  );
  const totalFacturationNet = validInvoices.reduce(
    (sum, i) => sum + Math.max(0, i.montantTotalFacture - i.montantAvoirs),
    0
  );
  const totalRecettesEncaissees = payments.reduce((sum, p) => sum + p.montant, 0);
  const totalImpayesClients = validInvoices.reduce((sum, i) => sum + i.resteDu, 0);
  const totalCautionsDetenues = contracts
    .filter((c) => c.cautionStatut === 'recue')
    .reduce((sum, c) => sum + c.cautionMontant, 0);
  const totalMaintenancesCost = maintenances.reduce((sum, m) => sum + m.cout, 0);
  const totalExpensesCost = expenses.reduce((sum, e) => sum + e.montant, 0);
  const totalChargesExploitation = totalMaintenancesCost + totalExpensesCost;

  const sidebarItems: Array<{ id: DashboardSection; label: string; icon: any; badge?: number }> = [
    { id: 'overview', label: 'Vue d’ensemble', icon: LayoutDashboard },
    { id: 'vehicles', label: 'Parc automobile (9)', icon: Car, badge: vehicles.length },
    { id: 'clients', label: 'Clients', icon: Users, badge: clients.length || undefined },
    {
      id: 'reservations',
      label: 'Réservations',
      icon: CalendarClock,
      badge: reservationRequests.filter((r) => r.statut === 'en_attente').length || undefined,
    },
    {
      id: 'contracts',
      label: 'Contrats',
      icon: FileSignature,
      badge: confirmedOrActiveContracts.length || undefined,
    },
    {
      id: 'returns',
      label: 'Départs et retours',
      icon: ArrowLeftRight,
      badge: overdueContracts.length || undefined,
    },
    { id: 'invoices', label: 'Factures', icon: FileText, badge: invoices.length || undefined },
    { id: 'payments', label: 'Paiements et impayés', icon: CreditCard },
    { id: 'maintenance', label: 'Entretien et vidanges', icon: Wrench },
    { id: 'compliance', label: 'Contrôle tech. & assurance', icon: ShieldCheck },
    { id: 'credits', label: 'Crédits véhicules', icon: Landmark },
    { id: 'expenses', label: 'Dépenses', icon: Receipt },
    { id: 'reports', label: 'Rapports', icon: BarChart3 },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  const getEtatLabel = (etat: VehicleState) => {
    const map: Record<VehicleState, { label: string; cls: string }> = {
      a_renseigner: { label: 'À renseigner', cls: 'bg-slate-200 text-slate-700' },
      disponible: { label: 'Disponible', cls: 'bg-emerald-100 text-emerald-800' },
      reservee: { label: 'Réservée', cls: 'bg-amber-100 text-amber-800' },
      louee: { label: 'Louée (Sortie)', cls: 'bg-red-100 text-red-800 font-bold' },
      en_entretien: { label: 'En entretien', cls: 'bg-orange-100 text-orange-800 font-semibold' },
      indisponible: { label: 'Indisponible', cls: 'bg-slate-300 text-slate-800' },
    };
    return map[etat] || map.a_renseigner;
  };

  const handleExportReportsCsv = () => {
    const headers = [
      'Ref Interne',
      'Modele',
      'Immatriculation',
      'Etat',
      'Nb Contrats',
      'Facturation MAD',
      'Encaisse MAD',
      'Reste Du MAD',
      'Entretiens & Depenses MAD',
      'Resultat Encaisse Net MAD',
    ];

    const rows = vehicles.map((v) => {
      const vContracts = contracts.filter((c) => c.vehicleId === v.id && c.statut !== 'annule');
      const vContractIds = new Set(vContracts.map((c) => c.id));
      const vInvoices = validInvoices.filter((i) => vContractIds.has(i.contractId));
      const fact = vInvoices.reduce(
        (s, i) => s + Math.max(0, i.montantTotalFacture - i.montantAvoirs),
        0
      );
      const enc = vInvoices.reduce((s, i) => s + i.montantPayeAffecte, 0);
      const reste = vInvoices.reduce((s, i) => s + i.resteDu, 0);
      const mntCost = maintenances
        .filter((m) => m.vehicleId === v.id)
        .reduce((s, m) => s + m.cout, 0);
      const expCost = expenses
        .filter((e) => e.vehicleId === v.id)
        .reduce((s, e) => s + e.montant, 0);
      const charges = mntCost + expCost;
      return [
        v.referenceInterne,
        v.modele,
        v.immatriculation || 'A renseigner',
        v.etat,
        vContracts.length,
        fact,
        enc,
        reste,
        charges,
        enc - charges,
      ];
    });

    const csv =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `rapport-abboud-car-rental-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJsonBackup = () => {
    const blob = new Blob([JSON.stringify(adminState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sauvegarde-abboud-car-rental-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen bg-[#F1F5F9] text-slate-900">
      {/* ANTHRACITE SIDEBAR MENU */}
      <aside className="flex w-68 shrink-0 flex-col justify-between bg-[#111318] text-slate-200 print:hidden">
        <div>
          <div className="border-b border-white/10 px-5 py-4">
            <AbboudLogo variant="dark" size="sm" />
            <span className="mt-1 block font-mono text-[10px] uppercase tracking-widest text-red-400">
              Gestion Privée • Kénitra
            </span>
          </div>

          <nav className="space-y-0.5 p-3">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSection(item.id);
                    setFeedback(null);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition ${
                    active
                      ? 'bg-red-600 text-white shadow'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </span>
                  {item.badge !== undefined && (
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                        active ? 'bg-white text-red-600' : 'bg-red-600/20 text-red-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-white/10 p-4 space-y-2 text-xs">
          <Link
            to="/"
            className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-slate-300 hover:text-white"
          >
            <span>Voir le site public 3D</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={logoutAdmin}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-red-400 hover:bg-red-950/40"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* MAIN LIGHT CONTENT WORKSPACE */}
      <div className="flex-1 overflow-x-hidden">
        {/* Top Operational Bar */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4 print:hidden">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">
              {sidebarItems.find((i) => i.id === section)?.label} — {settings.nomAgence}
            </h1>
            <p className="text-xs text-slate-500">
              Tél : {settings.telephone1} / {settings.telephone2} • {settings.email}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                const latestCtr = contracts[0] || null;
                const latestInv = invoices[0] || null;
                setPrintContract(latestCtr);
                setPrintInvoice(latestInv);
                setPrintMode('contract');
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E3A8A] px-3 py-1.5 font-bold text-white shadow-sm hover:bg-blue-900"
            >
              <FileSignature className="h-3.5 w-3.5" />
              Contrat Officiel (Auto-rempli)
            </button>
            <button
              type="button"
              onClick={() => {
                const latestCtr = contracts[0] || null;
                const latestInv = invoices[0] || null;
                setPrintContract(latestCtr);
                setPrintInvoice(latestInv);
                setPrintMode('invoice');
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 font-bold text-white shadow-sm hover:bg-red-700"
            >
              <FileText className="h-3.5 w-3.5" />
              Facture Officielle (Auto-remplie)
            </button>
            <button
              type="button"
              onClick={handleDownloadJsonBackup}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5 text-red-600" />
              Sauvegarde JSON
            </button>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {feedback && (
            <div
              className={`flex items-center justify-between rounded-xl border p-4 text-xs font-semibold ${
                feedback.type === 'ok'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  : 'border-red-300 bg-red-50 text-red-900'
              }`}
            >
              <span className="flex items-center gap-2">
                {feedback.type === 'ok' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                {feedback.text}
              </span>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="underline opacity-80"
              >
                Fermer
              </button>
            </div>
          )}

          {/* ================================================================= */}
          {/* 1. VUE D'ENSEMBLE (OVERVIEW)                                      */}
          {/* ================================================================= */}
          {section === 'overview' && (
            <div className="space-y-6">
              {/* KPI Strip */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="text-xs font-medium text-slate-500">Parc total</span>
                  <p className="mt-1 font-mono text-2xl font-extrabold text-slate-900">
                    {vehicles.length}
                  </p>
                  <span className="text-[11px] text-slate-500">
                    {vehicles.filter((v) => v.etat === 'disponible').length} dispo. /{' '}
                    {vehicles.filter((v) => v.etat === 'a_renseigner').length} à renseigner
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="text-xs font-medium text-slate-500">Locations en cours</span>
                  <p className="mt-1 font-mono text-2xl font-extrabold text-red-600">
                    {activeContracts.length}
                  </p>
                  <span className="text-[11px] text-slate-500">Voitures sorties</span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="text-xs font-medium text-slate-500">Retours attendus</span>
                  <p className="mt-1 font-mono text-2xl font-extrabold text-slate-900">
                    {activeContracts.filter((c) => !c.retourReel).length}
                  </p>
                  <span className="text-[11px] text-slate-500">En attente de clôture</span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="text-xs font-medium text-slate-500">Retards</span>
                  <p className="mt-1 font-mono text-2xl font-extrabold text-red-600">
                    {overdueContracts.length}
                  </p>
                  <span className="text-[11px] text-slate-500">Dépassement retour prévu</span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="text-xs font-medium text-slate-500">Soldes clients dus</span>
                  <p className="mt-1 font-mono text-2xl font-extrabold text-slate-900">
                    {totalImpayesClients.toLocaleString()} <span className="text-xs">MAD</span>
                  </p>
                  <span className="text-[11px] text-slate-500">Reste à encaisser</span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="text-xs font-medium text-slate-500">Échéances & Alertes</span>
                  <p className="mt-1 font-mono text-2xl font-extrabold text-amber-600">
                    {alerts.length}
                  </p>
                  <span className="text-[11px] text-slate-500">Entretien / Assurance / CT</span>
                </div>
              </div>

              {/* MAIN OPERATIONAL TABLE (EXACT 12 REQUIRED COLUMNS) */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      Tableau Principal de Suivi du Parc & des Contrats (9 véhicules)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Répond immédiatement à : « Quelle voiture est sortie ? Avec quel client ? Pour
                      quel contrat ? Quand revient-elle ? Combien reste-t-il à payer ? »
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSection('contracts')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Nouveau Contrat
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                        <th className="p-2.5 font-bold">Véhicule</th>
                        <th className="p-2.5 font-bold">Immatriculation</th>
                        <th className="p-2.5 font-bold">Client</th>
                        <th className="p-2.5 font-bold">Contrat</th>
                        <th className="p-2.5 font-bold">Départ</th>
                        <th className="p-2.5 font-bold">Retour prévu</th>
                        <th className="p-2.5 font-bold">Retour réel</th>
                        <th className="p-2.5 font-bold">Montant total</th>
                        <th className="p-2.5 font-bold">Payé</th>
                        <th className="p-2.5 font-bold">Reste dû</th>
                        <th className="p-2.5 font-bold">État</th>
                        <th className="p-2.5 font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {vehicles.map((veh) => {
                        // Find current active/confirmed or latest contract for this vehicle
                        const activeCtr =
                          contracts.find(
                            (c) =>
                              c.vehicleId === veh.id &&
                              (c.statut === 'en_cours' || c.statut === 'confirme')
                          ) || contracts.find((c) => c.vehicleId === veh.id);
                        const cli = activeCtr
                          ? clients.find((cl) => cl.id === activeCtr.clientId)
                          : undefined;
                        const inv = activeCtr
                          ? invoices.find((i) => i.contractId === activeCtr.id)
                          : undefined;

                        const totalMad = inv
                          ? Math.max(0, inv.montantTotalFacture - inv.montantAvoirs)
                          : activeCtr?.montantTotalLocation ?? null;
                        const payeMad = inv ? inv.montantPayeAffecte : 0;
                        const resteMad =
                          inv !== undefined
                            ? inv.resteDu
                            : totalMad !== null
                            ? Math.max(0, totalMad - payeMad)
                            : null;

                        const badge = getEtatLabel(veh.etat);

                        return (
                          <tr key={veh.id} className="hover:bg-slate-50">
                            <td className="p-2.5">
                              <span className="font-mono font-bold text-red-600">
                                {veh.referenceInterne}
                              </span>
                              <span className="block font-semibold text-slate-900">
                                {veh.modele}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono">
                              {veh.immatriculation || (
                                <span className="italic text-slate-400">À renseigner</span>
                              )}
                            </td>
                            <td className="p-2.5">
                              {cli ? (
                                <div>
                                  <span className="font-semibold text-slate-900">
                                    {cli.nomComplet}
                                  </span>
                                  <span className="block font-mono text-[11px] text-slate-500">
                                    {cli.telephone}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="p-2.5 font-mono">
                              {activeCtr ? (
                                <span className="font-semibold text-slate-800">
                                  {activeCtr.numeroContrat}
                                </span>
                              ) : (
                                <span className="text-slate-400">Aucun contrat actif</span>
                              )}
                            </td>
                            <td className="p-2.5 font-mono text-[11px]">
                              {activeCtr ? activeCtr.departPrevu.replace('T', ' ') : '—'}
                            </td>
                            <td className="p-2.5 font-mono text-[11px]">
                              {activeCtr ? activeCtr.retourPrevu.replace('T', ' ') : '—'}
                            </td>
                            <td className="p-2.5 font-mono text-[11px]">
                              {activeCtr?.retourReel
                                ? activeCtr.retourReel.replace('T', ' ')
                                : '—'}
                            </td>
                            <td className="p-2.5 font-mono font-semibold">
                              {totalMad !== null ? `${totalMad} MAD` : '—'}
                            </td>
                            <td className="p-2.5 font-mono text-emerald-700 font-semibold">
                              {activeCtr ? `${payeMad} MAD` : '—'}
                            </td>
                            <td className="p-2.5 font-mono font-bold text-red-600">
                              {resteMad !== null ? `${resteMad} MAD` : '—'}
                            </td>
                            <td className="p-2.5">
                              <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] ${badge.cls}`}>
                                {badge.label}
                              </span>
                            </td>
                            <td className="p-2.5">
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setVehicleEditForm(veh);
                                    setSelectedVehicleId(veh.id);
                                    setSection('vehicles');
                                  }}
                                  className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                                >
                                  Fiche
                                </button>
                                {activeCtr && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPrintContract(activeCtr);
                                      setPrintMode('contract');
                                    }}
                                    className="rounded bg-red-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-red-700"
                                  >
                                    PDF
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Active Alerts Box */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-slate-900">
                  Prochaines Échéances & Alertes Actives ({alerts.length})
                </h3>
                {alerts.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Aucune alerte déclenchée pour le moment. Les alertes d&apos;entretien, de
                    vidange, d&apos;assurance et de contrôle technique se déclenchent automatiquement
                    dès que leurs seuils ou dates sont renseignés sur les véhicules.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {alerts.map((al) => (
                      <div
                        key={al.id}
                        className={`flex items-center justify-between rounded-lg border p-3 text-xs ${
                          al.severite === 'urgent'
                            ? 'border-red-300 bg-red-50 text-red-900'
                            : 'border-amber-300 bg-amber-50 text-amber-900'
                        }`}
                      >
                        <div>
                          <span className="font-bold">{al.titre}</span>
                          <p className="text-[11px] opacity-90">{al.detail}</p>
                        </div>
                        <span className="rounded bg-white/80 px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
                          {al.severite}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 2. PARC AUTOMOBILE (9 INDIVIDUAL VEHICLES & HISTORY)              */}
          {/* ================================================================= */}
          {section === 'vehicles' && (
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-7">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-base font-extrabold text-slate-900">
                    Les 9 Fiches Individuelles du Parc Automobile
                  </h2>
                  <p className="text-xs text-slate-500">
                    Cliquez sur un véhicule pour renseigner son immatriculation, son kilométrage, son
                    tarif, son état ou consulter son historique complet.
                  </p>

                  <div className="mt-4 space-y-3">
                    {vehicles.map((v) => {
                      const badge = getEtatLabel(v.etat);
                      const isSelected = selectedVehicleId === v.id;
                      return (
                        <div
                          key={v.id}
                          onClick={() => {
                            setSelectedVehicleId(v.id);
                            setVehicleEditForm({ ...v });
                          }}
                          className={`cursor-pointer rounded-xl border p-4 transition ${
                            isSelected
                              ? 'border-red-600 bg-red-50/30 ring-1 ring-red-600'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={v.photoUrl}
                                alt={v.modele}
                                className="h-14 w-24 rounded-lg border border-slate-200 bg-slate-950 object-cover"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-xs font-bold text-white">
                                    {v.referenceInterne}
                                  </span>
                                  <span className="text-sm font-extrabold text-slate-900">
                                    {v.modele}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-slate-600">
                                  Immatriculation :{' '}
                                  <strong className="font-mono">
                                    {v.immatriculation || 'À renseigner'}
                                  </strong>{' '}
                                  • Km :{' '}
                                  <strong className="font-mono">
                                    {v.kilometrage !== null ? `${v.kilometrage} km` : 'À renseigner'}
                                  </strong>{' '}
                                  • Tarif :{' '}
                                  <strong className="font-mono text-red-600">
                                    {v.tarifJournalier !== null
                                      ? `${v.tarifJournalier} MAD/j`
                                      : 'À renseigner'}
                                  </strong>
                                </p>
                              </div>
                            </div>

                            <span className={`rounded-full px-3 py-1 text-xs ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Vehicle Editor & History */}
              <div className="space-y-6 lg:col-span-5">
                {vehicleEditForm && vehicleEditForm.id ? (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        await updateVehicle(
                          vehicleEditForm as Partial<AbboudVehicle> & { id: string }
                        );
                        notify(
                          'ok',
                          `Fiche du véhicule ${vehicleEditForm.referenceInterne} enregistrée.`
                        );
                      } catch (err) {
                        notify('err', (err as Error).message);
                      }
                    }}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <h3 className="text-sm font-extrabold text-slate-900">
                        Éditer la fiche : {vehicleEditForm.modele} ({vehicleEditForm.referenceInterne})
                      </h3>
                      <span className="font-mono text-[11px] text-slate-500">
                        Réf. interne modifiable
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700">
                          Référence interne *
                        </label>
                        <input
                          type="text"
                          required
                          value={vehicleEditForm.referenceInterne || ''}
                          onChange={(e) =>
                            setVehicleEditForm({
                              ...vehicleEditForm,
                              referenceInterne: e.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700">
                          État du véhicule *
                        </label>
                        <select
                          value={vehicleEditForm.etat || 'a_renseigner'}
                          onChange={(e) =>
                            setVehicleEditForm({
                              ...vehicleEditForm,
                              etat: e.target.value as VehicleState,
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-semibold"
                        >
                          <option value="a_renseigner">À renseigner</option>
                          <option value="disponible">Disponible</option>
                          <option value="reservee">Réservée</option>
                          <option value="louee">Louée</option>
                          <option value="en_entretien">En entretien</option>
                          <option value="indisponible">Indisponible</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700">
                          Immatriculation
                        </label>
                        <input
                          type="text"
                          placeholder="À renseigner (ex: 12345-A-15)"
                          value={vehicleEditForm.immatriculation || ''}
                          onChange={(e) =>
                            setVehicleEditForm({
                              ...vehicleEditForm,
                              immatriculation: e.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700">Année</label>
                        <input
                          type="number"
                          placeholder="À renseigner"
                          value={vehicleEditForm.annee ?? ''}
                          onChange={(e) =>
                            setVehicleEditForm({
                              ...vehicleEditForm,
                              annee: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700">Couleur</label>
                        <input
                          type="text"
                          placeholder="À renseigner"
                          value={vehicleEditForm.couleur || ''}
                          onChange={(e) =>
                            setVehicleEditForm({ ...vehicleEditForm, couleur: e.target.value })
                          }
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700">Carburant</label>
                        <select
                          value={vehicleEditForm.carburant || ''}
                          onChange={(e) =>
                            setVehicleEditForm({
                              ...vehicleEditForm,
                              carburant: e.target.value as AbboudVehicle['carburant'],
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        >
                          <option value="">À renseigner</option>
                          <option value="Diesel">Diesel</option>
                          <option value="Essence">Essence</option>
                          <option value="Hybride">Hybride</option>
                          <option value="Électrique">Électrique</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700">Transmission</label>
                        <select
                          value={vehicleEditForm.transmission || ''}
                          onChange={(e) =>
                            setVehicleEditForm({
                              ...vehicleEditForm,
                              transmission: e.target.value as AbboudVehicle['transmission'],
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        >
                          <option value="">À renseigner</option>
                          <option value="Manuelle">Manuelle</option>
                          <option value="Automatique">Automatique</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700">
                          Kilométrage actuel (km)
                        </label>
                        <input
                          type="number"
                          placeholder="À renseigner"
                          value={vehicleEditForm.kilometrage ?? ''}
                          onChange={(e) =>
                            setVehicleEditForm({
                              ...vehicleEditForm,
                              kilometrage: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700">
                          Tarif journalier (MAD)
                        </label>
                        <input
                          type="number"
                          placeholder="À renseigner"
                          value={vehicleEditForm.tarifJournalier ?? ''}
                          onChange={(e) =>
                            setVehicleEditForm({
                              ...vehicleEditForm,
                              tarifJournalier: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block font-semibold text-slate-700">
                          Photo du véhicule (URL ou Importer un fichier PNG/JPG/WebP)
                        </label>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            value={vehicleEditForm.photoUrl || ''}
                            onChange={(e) =>
                              setVehicleEditForm({
                                ...vehicleEditForm,
                                photoUrl: e.target.value,
                                photoIllustrative: false,
                              })
                            }
                            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 font-mono"
                          />
                          <label className="cursor-pointer rounded-lg border border-red-300 bg-red-50 px-3 py-2 font-bold text-red-700 hover:bg-red-100">
                            Importer une photo...
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = () => {
                                  if (typeof reader.result === 'string') {
                                    setVehicleEditForm({
                                      ...vehicleEditForm,
                                      photoUrl: reader.result,
                                      photoIllustrative: false,
                                    });
                                  }
                                };
                                reader.readAsDataURL(file);
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-red-600 py-2.5 font-bold text-white hover:bg-red-700"
                    >
                      Enregistrer les modifications du véhicule
                    </button>

                    {/* Vehicle Specific History */}
                    <div className="border-t border-slate-200 pt-4 space-y-2">
                      <h4 className="font-bold text-slate-800">
                        Historique du véhicule ({vehicleEditForm.referenceInterne})
                      </h4>
                      <p className="text-slate-600">
                        • Locations enregistrées :{' '}
                        <strong>
                          {contracts.filter((c) => c.vehicleId === vehicleEditForm.id).length}
                        </strong>
                      </p>
                      <p className="text-slate-600">
                        • Interventions d&apos;entretien :{' '}
                        <strong>
                          {maintenances.filter((m) => m.vehicleId === vehicleEditForm.id).length}
                        </strong>
                      </p>
                      <p className="text-slate-600">
                        • Dépenses rattachées :{' '}
                        <strong>
                          {expenses.filter((ex) => ex.vehicleId === vehicleEditForm.id).length}
                        </strong>
                      </p>
                    </div>
                  </form>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-xs text-slate-500">
                    Sélectionnez l&apos;un des 9 véhicules dans la liste à gauche pour modifier sa
                    fiche ou consulter son historique.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 3. CLIENTS                                                        */}
          {/* ================================================================= */}
          {section === 'clients' && (
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-base font-extrabold text-slate-900">
                    Répertoire Clients ({clients.length})
                  </h2>
                  {clients.length === 0 ? (
                    <p className="mt-4 rounded-lg bg-slate-50 p-6 text-center text-xs text-slate-500">
                      Aucun client enregistré pour le moment. Utilisez le formulaire ci-contre pour
                      ajouter un client.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {clients.map((cl) => {
                        const clContracts = contracts.filter((c) => c.clientId === cl.id);
                        const clInvoices = validInvoices.filter((i) => i.clientId === cl.id);
                        const clReste = clInvoices.reduce((s, i) => s + i.resteDu, 0);
                        return (
                          <div
                            key={cl.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 text-xs"
                          >
                            <div>
                              <p className="text-sm font-bold text-slate-900">{cl.nomComplet}</p>
                              <p className="font-mono text-slate-600">
                                Tél : {cl.telephone} • CIN/Passeport :{' '}
                                {cl.cinOuPasseport || 'À renseigner'} • Permis :{' '}
                                {cl.permisNumero || 'À renseigner'}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <a
                                href={`https://wa.me/${cl.telephone.replace(/\D+/g, '').replace(/^0/, '212')}?text=${encodeURIComponent(`Bonjour ${cl.nomComplet}, l'agence ABBOUD CAR RENTAL Kénitra vous contacte.`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg bg-[#25D366] px-3 py-1.5 font-bold text-white hover:brightness-110"
                              >
                                WhatsApp
                              </a>
                              <div className="text-right font-mono">
                                <span className="block text-slate-600">
                                  {clContracts.length} contrat(s)
                                </span>
                                <span className="font-bold text-red-600">
                                  Solde dû : {clReste} MAD
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-5">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await upsertClient(clientForm);
                      setClientForm({
                        id: '',
                        nomComplet: '',
                        telephone: '',
                        email: '',
                        cinOuPasseport: '',
                        permisNumero: '',
                        permisDateDelivrance: '',
                        adresse: '',
                        notes: '',
                      });
                      notify('ok', 'Fiche client enregistrée.');
                    } catch (err) {
                      notify('err', (err as Error).message);
                    }
                  }}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 text-xs"
                >
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Ajouter / Modifier un Client
                  </h3>
                  <div>
                    <label className="block font-semibold text-slate-700">Nom complet *</label>
                    <input
                      type="text"
                      required
                      value={clientForm.nomComplet}
                      onChange={(e) =>
                        setClientForm({ ...clientForm, nomComplet: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700">Téléphone *</label>
                      <input
                        type="text"
                        required
                        value={clientForm.telephone}
                        onChange={(e) =>
                          setClientForm({ ...clientForm, telephone: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700">E-mail</label>
                      <input
                        type="email"
                        value={clientForm.email}
                        onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700">
                        N° CIN ou Passeport
                      </label>
                      <input
                        type="text"
                        value={clientForm.cinOuPasseport}
                        onChange={(e) =>
                          setClientForm({ ...clientForm, cinOuPasseport: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700">
                        N° Permis de conduire
                      </label>
                      <input
                        type="text"
                        value={clientForm.permisNumero}
                        onChange={(e) =>
                          setClientForm({ ...clientForm, permisNumero: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700">Adresse</label>
                    <input
                      type="text"
                      value={clientForm.adresse}
                      onChange={(e) => setClientForm({ ...clientForm, adresse: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-red-600 py-2.5 font-bold text-white hover:bg-red-700"
                  >
                    Enregistrer le client
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 4. RÉSERVATIONS (DEMANDES REÇUES DU SITE PUBLIC)                  */}
          {/* ================================================================= */}
          {section === 'reservations' && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-extrabold text-slate-900">
                Demandes de Réservation Reçues ({reservationRequests.length})
              </h2>
              <p className="text-xs text-slate-500">
                Les demandes envoyées depuis le site public arrivent ici en attente de confirmation
                et ne bloquent aucun véhicule tant qu&apos;un contrat n&apos;est pas créé.
              </p>

              {reservationRequests.length === 0 ? (
                <p className="mt-4 rounded-lg bg-slate-50 p-6 text-center text-xs text-slate-500">
                  Aucune demande de réservation en attente.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {reservationRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-red-600">
                          {req.referenceDemande} • {req.modeleSouhaite}
                        </span>
                        <p className="mt-0.5 font-bold text-slate-900">
                          Client : {req.nomClient} ({req.telephone})
                        </p>
                        <p className="font-mono text-slate-600">
                          Du {req.departSouhaite.replace('T', ' ')} au{' '}
                          {req.retourSouhaite.replace('T', ' ')} • Lieu : {req.lieuPriseEnCharge}
                        </p>
                        {req.message && <p className="mt-1 text-slate-500">« {req.message} »</p>}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={`https://wa.me/${req.telephone.replace(/\D+/g, '').replace(/^0/, '212')}?text=${encodeURIComponent(`Bonjour ${req.nomClient}, nous avons bien reçu votre demande ${req.referenceDemande} pour le modèle ${req.modeleSouhaite} chez ABBOUD CAR RENTAL Kénitra.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-[#25D366] px-3 py-1.5 font-bold text-white hover:brightness-110"
                        >
                          WhatsApp Client
                        </a>
                        <select
                          value={req.statut}
                          onChange={(e) =>
                            updateRequestStatus(
                              req.id,
                              e.target.value as typeof req.statut
                            )
                          }
                          className="rounded-lg border border-slate-300 px-2.5 py-1.5 font-semibold"
                        >
                          <option value="en_attente">En attente de confirmation</option>
                          <option value="confirmee">Confirmée</option>
                          <option value="refusee">Refusée</option>
                          <option value="annulee">Annulée</option>
                        </select>
                        <button
                          type="button"
                          onClick={async () => {
                            const newCli = await upsertClient({
                              nomComplet: req.nomClient,
                              telephone: req.telephone,
                              email: req.email,
                            });
                            const matchingVeh =
                              vehicles.find((v) => v.modele === req.modeleSouhaite) || vehicles[0];
                            setContractForm((prev) => ({
                              ...prev,
                              clientId: newCli.id,
                              vehicleId: matchingVeh.id,
                              departPrevu: req.departSouhaite,
                              retourPrevu: req.retourSouhaite,
                              lieuDepart: req.lieuPriseEnCharge,
                              fromRequestId: req.id,
                            }));
                            setSection('contracts');
                          }}
                          className="rounded-lg bg-red-600 px-3 py-1.5 font-bold text-white hover:bg-red-700"
                        >
                          Créer Contrat →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* 5. CONTRATS (AVEC BLOCAGE DES CHEVAUCHEMENTS & CAUTION SÉPARÉE)   */}
          {/* ================================================================= */}
          {section === 'contracts' && (
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-base font-extrabold text-slate-900">
                    Contrats de Location ({contracts.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Tout chevauchement de dates pour un même véhicule sur des contrats confirmés ou
                    en cours est automatiquement bloqué. La caution reste strictement séparée du
                    chiffre d&apos;affaires.
                  </p>

                  {contracts.length === 0 ? (
                    <p className="mt-4 rounded-lg bg-slate-50 p-6 text-center text-xs text-slate-500">
                      Aucun contrat enregistré. Créez un contrat via le formulaire à droite.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {contracts.map((c) => {
                        const veh = vehicles.find((v) => v.id === c.vehicleId);
                        const cli = clients.find((cl) => cl.id === c.clientId);
                        return (
                          <div
                            key={c.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 text-xs"
                          >
                            <div>
                              <span className="font-mono font-bold text-red-600">
                                {c.numeroContrat} • {c.statut.toUpperCase()}
                              </span>
                              <p className="mt-0.5 font-bold text-slate-900">
                                {veh?.referenceInterne} ({veh?.modele}) — Client :{' '}
                                {cli?.nomComplet || 'Client'}
                              </p>
                              <p className="font-mono text-slate-600">
                                {c.departPrevu.replace('T', ' ')} → {c.retourPrevu.replace('T', ' ')}{' '}
                                ({c.nbJours} j)
                              </p>
                              <p className="text-slate-600">
                                Total location : <strong>{c.montantTotalLocation} MAD</strong> •
                                Caution séparée : <strong>{c.cautionMontant} MAD</strong> (
                                {c.cautionStatut})
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const linkedInv =
                                    invoices.find((i) => i.contractId === c.id) || null;
                                  setPrintContract(c);
                                  setPrintInvoice(linkedInv);
                                  setPrintMode('contract');
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-[#1E3A8A] px-3 py-1.5 font-bold text-white hover:bg-blue-900"
                              >
                                <Printer className="h-3.5 w-3.5" /> Contrat Officiel
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const linkedInv =
                                    invoices.find((i) => i.contractId === c.id) || null;
                                  setPrintContract(c);
                                  setPrintInvoice(linkedInv);
                                  setPrintMode('invoice');
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 font-bold text-white hover:bg-red-700"
                              >
                                <FileText className="h-3.5 w-3.5" /> Facture Officielle
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-5">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const res = await upsertContract({
                        ...contractForm,
                        kmDepart: contractForm.kmDepart ? Number(contractForm.kmDepart) : null,
                      });
                      setPrintContract(res.contract);
                      setPrintInvoice(res.invoice || null);
                      setPrintMode('contract');
                      notify(
                        'ok',
                        'Contrat enregistré et pré-rempli automatiquement dans le Contrat Officiel & la Facture Officielle.'
                      );
                    } catch (err) {
                      notify('err', (err as Error).message);
                    }
                  }}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 text-xs"
                >
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Nouveau Contrat de Location
                  </h3>

                  <div>
                    <label className="block font-semibold text-slate-700">Client *</label>
                    <select
                      required
                      value={contractForm.clientId}
                      onChange={(e) =>
                        setContractForm({ ...contractForm, clientId: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    >
                      <option value="">-- Sélectionner un client --</option>
                      {clients.map((cl) => (
                        <option key={cl.id} value={cl.id}>
                          {cl.nomComplet} ({cl.telephone})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700">
                      Véhicule du parc (9 unités) *
                    </label>
                    <select
                      required
                      value={contractForm.vehicleId}
                      onChange={(e) =>
                        setContractForm({ ...contractForm, vehicleId: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    >
                      <option value="">-- Sélectionner un véhicule --</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.referenceInterne} — {v.modele} ({v.etat})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700">Départ prévu *</label>
                      <input
                        type="datetime-local"
                        required
                        value={contractForm.departPrevu}
                        onChange={(e) =>
                          setContractForm({ ...contractForm, departPrevu: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700">Retour prévu *</label>
                      <input
                        type="datetime-local"
                        required
                        value={contractForm.retourPrevu}
                        onChange={(e) =>
                          setContractForm({ ...contractForm, retourPrevu: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700">
                        Tarif convenu / jour (MAD) *
                      </label>
                      <input
                        type="number"
                        required
                        value={contractForm.tarifJournalierConvenu}
                        onChange={(e) =>
                          setContractForm({
                            ...contractForm,
                            tarifJournalierConvenu: Number(e.target.value),
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700">
                        Caution séparée (MAD)
                      </label>
                      <input
                        type="number"
                        value={contractForm.cautionMontant}
                        onChange={(e) =>
                          setContractForm({
                            ...contractForm,
                            cautionMontant: Number(e.target.value),
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700">Frais éventuels</label>
                      <input
                        type="number"
                        value={contractForm.fraisSupplementaires}
                        onChange={(e) =>
                          setContractForm({
                            ...contractForm,
                            fraisSupplementaires: Number(e.target.value),
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700">Remise (MAD)</label>
                      <input
                        type="number"
                        value={contractForm.remise}
                        onChange={(e) =>
                          setContractForm({ ...contractForm, remise: Number(e.target.value) })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700">Statut du contrat</label>
                    <select
                      value={contractForm.statut}
                      onChange={(e) =>
                        setContractForm({
                          ...contractForm,
                          statut: e.target.value as ContractRecord['statut'],
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-semibold"
                    >
                      <option value="brouillon">Brouillon</option>
                      <option value="confirme">Confirmé</option>
                      <option value="en_cours">En cours (Véhicule sorti)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-red-600 py-2.5 font-bold text-white hover:bg-red-700"
                  >
                    Valider le contrat & générer la facture
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 6. DÉPARTS ET RETOURS (PROLONGATION & CLÔTURE SANS REMISE AUTO)    */}
          {/* ================================================================= */}
          {section === 'returns' && (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Return Closure Form */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const res = await registerReturn({
                      ...returnForm,
                      kmRetour: returnForm.kmRetour ? Number(returnForm.kmRetour) : null,
                    });
                    notify(
                      'ok',
                      `Retour enregistré. État du véhicule ${res.vehicle.referenceInterne} : ${res.vehicle.etat}.`
                    );
                  } catch (err) {
                    notify('err', (err as Error).message);
                  }
                }}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 text-xs"
              >
                <h2 className="text-base font-extrabold text-slate-900">
                  Enregistrer un Retour & Clôturer le Contrat
                </h2>
                <p className="text-slate-500">
                  Un véhicule déclaré en entretien au retour n&apos;est jamais remis
                  automatiquement en disponibilité.
                </p>

                <div>
                  <label className="block font-semibold text-slate-700">Contrat concerné *</label>
                  <select
                    required
                    value={returnForm.contractId}
                    onChange={(e) =>
                      setReturnForm({ ...returnForm, contractId: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="">-- Sélectionner un contrat --</option>
                    {contracts
                      .filter((c) => c.statut !== 'cloture' && c.statut !== 'annule')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.numeroContrat} — Départ {c.departPrevu.slice(0, 10)}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700">
                      Date et heure réelles de retour *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={returnForm.retourReel}
                      onChange={(e) =>
                        setReturnForm({ ...returnForm, retourReel: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700">
                      Kilométrage au retour (km)
                    </label>
                    <input
                      type="number"
                      value={returnForm.kmRetour}
                      onChange={(e) => setReturnForm({ ...returnForm, kmRetour: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700">Niveau carburant</label>
                    <input
                      type="text"
                      value={returnForm.carburantRetour}
                      onChange={(e) =>
                        setReturnForm({ ...returnForm, carburantRetour: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700">
                      Frais supplémentaires validés (MAD)
                    </label>
                    <input
                      type="number"
                      value={returnForm.fraisRetourValides}
                      onChange={(e) =>
                        setReturnForm({
                          ...returnForm,
                          fraisRetourValides: Number(e.target.value),
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700">
                    Observations au retour
                  </label>
                  <input
                    type="text"
                    value={returnForm.observationsRetour}
                    onChange={(e) =>
                      setReturnForm({ ...returnForm, observationsRetour: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>

                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-orange-300 bg-orange-50 p-3 font-semibold text-orange-900">
                  <input
                    type="checkbox"
                    checked={returnForm.declarerEnEntretien}
                    onChange={(e) =>
                      setReturnForm({ ...returnForm, declarerEnEntretien: e.target.checked })
                    }
                    className="h-4 w-4 accent-red-600"
                  />
                  <span>
                    Déclarer ce véhicule « En entretien » (ne pas remettre en disponibilité)
                  </span>
                </label>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-red-600 py-2.5 font-bold text-white hover:bg-red-700"
                >
                  Valider le retour et clôturer le contrat
                </button>
              </form>

              {/* Prolongation Form */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await extendContract(extendForm);
                    notify('ok', 'Prolongation enregistrée après vérification de disponibilité.');
                  } catch (err) {
                    notify('err', (err as Error).message);
                  }
                }}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 text-xs"
              >
                <h2 className="text-base font-extrabold text-slate-900">
                  Prolonger un Contrat en Cours
                </h2>
                <p className="text-slate-500">
                  Vérifie automatiquement l&apos;absence de chevauchement avec un autre contrat
                  confirmé sur le même véhicule.
                </p>

                <div>
                  <label className="block font-semibold text-slate-700">Contrat à prolonger *</label>
                  <select
                    required
                    value={extendForm.contractId}
                    onChange={(e) =>
                      setExtendForm({ ...extendForm, contractId: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="">-- Sélectionner un contrat --</option>
                    {contracts
                      .filter((c) => c.statut !== 'cloture' && c.statut !== 'annule')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.numeroContrat} (Retour actuel : {c.retourPrevu.replace('T', ' ')})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700">
                    Nouvelle date et heure de retour prévues *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={extendForm.nouveauRetourPrevu}
                    onChange={(e) =>
                      setExtendForm({ ...extendForm, nouveauRetourPrevu: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-slate-900 py-2.5 font-bold text-white hover:bg-slate-800"
                >
                  Valider la prolongation
                </button>
              </form>
            </div>
          )}

          {/* ================================================================= */}
          {/* 7. FACTURES (BROUILLON, ÉMISE, PARTIELLEMENT PAYÉE, PAYÉE, AVOIR) */}
          {/* ================================================================= */}
          {section === 'invoices' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-extrabold text-slate-900">
                  Factures Client ({invoices.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Formule stricte : <strong>reste dû = total facturé − paiements affectés à la facture</strong>{' '}
                  (net d&apos;avoirs).
                </p>

                {invoices.length === 0 ? (
                  <p className="mt-4 rounded-lg bg-slate-50 p-6 text-center text-xs text-slate-500">
                    Aucune facture enregistrée.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {invoices.map((inv) => {
                      const cli = clients.find((c) => c.id === inv.clientId);
                      const ctr = contracts.find((c) => c.id === inv.contractId);
                      return (
                        <div
                          key={inv.id}
                          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-red-600">
                              {inv.numeroFacture} • État : {inv.statut.toUpperCase()}
                            </span>
                            <p className="mt-0.5 font-bold text-slate-900">
                              Client : {cli?.nomComplet || 'Client'} • Contrat :{' '}
                              {ctr?.numeroContrat || inv.contractId}
                            </p>
                            <p className="font-mono text-slate-600">
                              Facturé : {inv.montantTotalFacture} MAD • Avoirs : {inv.montantAvoirs}{' '}
                              MAD • Payé :{' '}
                              <strong className="text-emerald-700">
                                {inv.montantPayeAffecte} MAD
                              </strong>{' '}
                              • Reste dû :{' '}
                              <strong className="text-red-600">{inv.resteDu} MAD</strong>
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setPrintInvoice(inv);
                                setPrintContract(ctr || null);
                                setPrintMode('invoice');
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 font-bold text-white"
                            >
                              <Printer className="h-3.5 w-3.5" /> Imprimer Facture PDF
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Issue Credit Note / Avoir */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await issueCreditNote(avoirForm);
                    notify('ok', 'Avoir / annulation enregistré avec historique.');
                  } catch (err) {
                    notify('err', (err as Error).message);
                  }
                }}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 text-xs max-w-xl"
              >
                <h3 className="text-sm font-extrabold text-slate-900">
                  Émettre un Avoir ou Annuler une Facture
                </h3>
                <select
                  required
                  value={avoirForm.invoiceId}
                  onChange={(e) => setAvoirForm({ ...avoirForm, invoiceId: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="">-- Sélectionner une facture --</option>
                  {invoices.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.numeroFacture} (Reste dû : {i.resteDu} MAD)
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Montant de l'avoir (MAD)"
                    value={avoirForm.montant}
                    onChange={(e) =>
                      setAvoirForm({ ...avoirForm, montant: Number(e.target.value) })
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Motif de l'avoir"
                    value={avoirForm.motif}
                    onChange={(e) => setAvoirForm({ ...avoirForm, motif: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={avoirForm.annulerFacture}
                    onChange={(e) =>
                      setAvoirForm({ ...avoirForm, annulerFacture: e.target.checked })
                    }
                  />
                  <span>Marquer la facture comme annulée</span>
                </label>
                <button
                  type="submit"
                  className="rounded-xl bg-red-600 px-5 py-2.5 font-bold text-white"
                >
                  Enregistrer l&apos;avoir
                </button>
              </form>
            </div>
          )}

          {/* ================================================================= */}
          {/* 8. PAIEMENTS ET IMPAYÉS                                           */}
          {/* ================================================================= */}
          {section === 'payments' && (
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-7 space-y-6">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-base font-extrabold text-slate-900">
                    Historique des Paiements Reçus ({payments.length})
                  </h2>
                  {payments.length === 0 ? (
                    <p className="mt-4 rounded-lg bg-slate-50 p-6 text-center text-xs text-slate-500">
                      Aucun règlement enregistré.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-2.5">
                      {payments.map((p) => {
                        const inv = invoices.find((i) => i.id === p.invoiceId);
                        const cli = clients.find((c) => c.id === p.clientId);
                        return (
                          <div
                            key={p.id}
                            className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-xs"
                          >
                            <div>
                              <span className="font-mono font-bold text-emerald-700">
                                +{p.montant} MAD ({p.modePaiement})
                              </span>
                              <p className="text-slate-700">
                                Facture : <strong>{inv?.numeroFacture}</strong> • Client :{' '}
                                {cli?.nomComplet}
                              </p>
                            </div>
                            <span className="font-mono text-slate-500">{p.datePaiement}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-5">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const res = await recordPayment(paymentForm);
                      notify(
                        'ok',
                        `Paiement enregistré. Nouveau reste dû sur ${res.invoice.numeroFacture} : ${res.invoice.resteDu} MAD.`
                      );
                    } catch (err) {
                      notify('err', (err as Error).message);
                    }
                  }}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 text-xs"
                >
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Affecter un Paiement (Partiel ou Total) à une Facture
                  </h3>
                  <select
                    required
                    value={paymentForm.invoiceId}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, invoiceId: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="">-- Sélectionner une facture --</option>
                    {invoices.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.numeroFacture} — Reste dû : {i.resteDu} MAD
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700">
                        Montant versé (MAD) *
                      </label>
                      <input
                        type="number"
                        required
                        value={paymentForm.montant}
                        onChange={(e) =>
                          setPaymentForm({ ...paymentForm, montant: Number(e.target.value) })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700">Mode *</label>
                      <select
                        value={paymentForm.modePaiement}
                        onChange={(e) =>
                          setPaymentForm({
                            ...paymentForm,
                            modePaiement: e.target.value as InvoicePaymentRecord['modePaiement'],
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                      >
                        <option value="Espèces">Espèces</option>
                        <option value="Virement">Virement</option>
                        <option value="Chèque">Chèque</option>
                        <option value="Carte / TPE">Carte / TPE</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-red-600 py-2.5 font-bold text-white hover:bg-red-700"
                  >
                    Enregistrer le paiement
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 9. ENTRETIEN ET VIDANGES                                          */}
          {/* ================================================================= */}
          {section === 'maintenance' && (
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-base font-extrabold text-slate-900">
                    Historique des Vidanges & Entretiens ({maintenances.length})
                  </h2>
                  {maintenances.length === 0 ? (
                    <p className="mt-4 rounded-lg bg-slate-50 p-6 text-center text-xs text-slate-500">
                      Aucune intervention enregistrée.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {maintenances.map((m) => {
                        const v = vehicles.find((vh) => vh.id === m.vehicleId);
                        return (
                          <div
                            key={m.id}
                            className="rounded-xl border border-slate-200 p-4 text-xs"
                          >
                            <div className="flex justify-between font-bold">
                              <span>
                                {v?.referenceInterne} ({v?.modele}) — {m.typeIntervention}
                              </span>
                              <span className="font-mono text-red-600">{m.cout} MAD</span>
                            </div>
                            <p className="mt-1 text-slate-600">
                              Date : {m.dateIntervention} • Km : {m.kilometrage ?? 'N/A'} •
                              Prestataire : {m.prestataire || 'Non précisé'}
                            </p>
                            {m.prochaineVidangeKmFixee && (
                              <p className="font-mono text-emerald-700">
                                Prochaine vidange fixée à : {m.prochaineVidangeKmFixee} km
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-5">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await addMaintenance({
                        ...maintForm,
                        kilometrage: maintForm.kilometrage
                          ? Number(maintForm.kilometrage)
                          : null,
                        prochaineVidangeKmFixee: maintForm.prochaineVidangeKmFixee
                          ? Number(maintForm.prochaineVidangeKmFixee)
                          : null,
                      });
                      notify('ok', 'Entretien / vidange enregistré.');
                    } catch (err) {
                      notify('err', (err as Error).message);
                    }
                  }}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 text-xs"
                >
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Enregistrer une Vidange ou Intervention
                  </h3>
                  <select
                    required
                    value={maintForm.vehicleId}
                    onChange={(e) => setMaintForm({ ...maintForm, vehicleId: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="">-- Sélectionner un véhicule --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.referenceInterne} — {v.modele}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700">Date *</label>
                      <input
                        type="date"
                        required
                        value={maintForm.dateIntervention}
                        onChange={(e) =>
                          setMaintForm({ ...maintForm, dateIntervention: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700">Kilométrage</label>
                      <input
                        type="number"
                        value={maintForm.kilometrage}
                        onChange={(e) =>
                          setMaintForm({ ...maintForm, kilometrage: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700">Coût (MAD)</label>
                      <input
                        type="number"
                        value={maintForm.cout}
                        onChange={(e) =>
                          setMaintForm({ ...maintForm, cout: Number(e.target.value) })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700">
                        Seuil prochaine vidange (km)
                      </label>
                      <input
                        type="number"
                        placeholder="Ex: 60000"
                        value={maintForm.prochaineVidangeKmFixee}
                        onChange={(e) =>
                          setMaintForm({
                            ...maintForm,
                            prochaineVidangeKmFixee: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Prestataire / Garage & Référence justificatif"
                    value={maintForm.prestataire}
                    onChange={(e) => setMaintForm({ ...maintForm, prestataire: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-red-600 py-2.5 font-bold text-white"
                  >
                    Enregistrer l&apos;intervention
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 10. CONTRÔLE TECHNIQUE ET ASSURANCE                               */}
          {/* ================================================================= */}
          {section === 'compliance' && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-extrabold text-slate-900">
                Échéances Contrôle Technique & Assurance par Véhicule (9 unités)
              </h2>
              <p className="text-xs text-slate-500">
                Renseignez les dates d&apos;expiration pour déclencher les alertes automatiques.
              </p>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="p-2.5">Véhicule</th>
                      <th className="p-2.5">Échéance Assurance</th>
                      <th className="p-2.5">Échéance Contrôle Technique</th>
                      <th className="p-2.5">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {vehicles.map((v) => (
                      <tr key={v.id}>
                        <td className="p-2.5 font-bold">
                          {v.referenceInterne} — {v.modele}
                        </td>
                        <td className="p-2.5">
                          <input
                            type="date"
                            value={v.assuranceEcheance || ''}
                            onChange={(e) =>
                              updateVehicle({ id: v.id, assuranceEcheance: e.target.value })
                            }
                            className="rounded border border-slate-300 px-2.5 py-1 font-mono"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="date"
                            value={v.controleTechniqueEcheance || ''}
                            onChange={(e) =>
                              updateVehicle({
                                id: v.id,
                                controleTechniqueEcheance: e.target.value,
                              })
                            }
                            className="rounded border border-slate-300 px-2.5 py-1 font-mono"
                          />
                        </td>
                        <td className="p-2.5 text-slate-500">Sauvegarde automatique</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 11. CRÉDITS VÉHICULES (SÉPARÉS DES DETTES CLIENTS)                */}
          {/* ================================================================= */}
          {section === 'credits' && (
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-7 space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-base font-extrabold text-slate-900">
                    Crédits & Financements Véhicules de l&apos;Agence ({credits.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Strictement séparés des dettes clients. Le capital restant dû n&apos;est jamais
                    calculé en soustrayant naïvement les mensualités globales (qui incluent intérêts
                    et frais) du montant initial.
                  </p>

                  {credits.length === 0 ? (
                    <p className="mt-4 rounded-lg bg-slate-50 p-6 text-center text-xs text-slate-500">
                      Aucun dossier de crédit véhicule renseigné.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {credits.map((crd) => {
                        const v = vehicles.find((vh) => vh.id === crd.vehicleId);
                        const totalVerse = crd.paiements.reduce(
                          (s, p) => s + p.montantMensualiteVersee,
                          0
                        );
                        return (
                          <div
                            key={crd.id}
                            className="rounded-xl border border-slate-200 p-4 text-xs space-y-1.5"
                          >
                            <div className="flex justify-between font-bold text-slate-900">
                              <span>
                                {v?.referenceInterne} ({v?.modele}) — {crd.organismeFinancier}
                              </span>
                              <span className="font-mono text-red-600">
                                Mensualité : {crd.mensualiteTotale} MAD / mois
                              </span>
                            </div>
                            <p className="font-mono text-slate-600">
                              Montant initial financé : {crd.montantInitialFinancement} MAD • Durée
                              : {crd.dureeMois} mois
                            </p>
                            <p className="font-mono text-slate-700">
                              Cumul des échéances versées (intérêts inclus) :{' '}
                              <strong>{totalVerse} MAD</strong> ({crd.paiements.length}{' '}
                              échéance(s))
                            </p>
                            <p className="font-mono font-bold text-slate-900">
                              Solde en capital communiqué / documenté :{' '}
                              {crd.soldeCapitalCommunique !== null
                                ? `${crd.soldeCapitalCommunique} MAD`
                                : 'À communiquer par l’organisme'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-5">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await upsertVehicleCredit({
                        ...creditForm,
                        soldeCapitalCommunique: creditForm.soldeCapitalCommunique
                          ? Number(creditForm.soldeCapitalCommunique)
                          : null,
                      });
                      notify('ok', 'Dossier de crédit véhicule enregistré.');
                    } catch (err) {
                      notify('err', (err as Error).message);
                    }
                  }}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 text-xs"
                >
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Ajouter un Crédit Véhicule
                  </h3>
                  <select
                    required
                    value={creditForm.vehicleId}
                    onChange={(e) =>
                      setCreditForm({ ...creditForm, vehicleId: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="">-- Véhicule financé --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.referenceInterne} — {v.modele}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="Organisme de financement (ex: Wafasalaf, Vivalis...)"
                    value={creditForm.organismeFinancier}
                    onChange={(e) =>
                      setCreditForm({ ...creditForm, organismeFinancier: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700">
                        Montant initial (MAD)
                      </label>
                      <input
                        type="number"
                        value={creditForm.montantInitialFinancement}
                        onChange={(e) =>
                          setCreditForm({
                            ...creditForm,
                            montantInitialFinancement: Number(e.target.value),
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700">
                        Mensualité (MAD)
                      </label>
                      <input
                        type="number"
                        value={creditForm.mensualiteTotale}
                        onChange={(e) =>
                          setCreditForm({
                            ...creditForm,
                            mensualiteTotale: Number(e.target.value),
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700">
                      Solde en capital communiqué par l&apos;organisme (MAD, facultatif)
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 132000"
                      value={creditForm.soldeCapitalCommunique}
                      onChange={(e) =>
                        setCreditForm({
                          ...creditForm,
                          soldeCapitalCommunique: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-red-600 py-2.5 font-bold text-white"
                  >
                    Enregistrer le crédit véhicule
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 12. DÉPENSES                                                      */}
          {/* ================================================================= */}
          {section === 'expenses' && (
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-base font-extrabold text-slate-900">
                    Journal des Dépenses ({expenses.length})
                  </h2>
                  {expenses.length === 0 ? (
                    <p className="mt-4 rounded-lg bg-slate-50 p-6 text-center text-xs text-slate-500">
                      Aucune dépense enregistrée.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-2.5">
                      {expenses.map((ex) => {
                        const v = vehicles.find((vh) => vh.id === ex.vehicleId);
                        return (
                          <div
                            key={ex.id}
                            className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-xs"
                          >
                            <div>
                              <span className="font-bold text-slate-900">
                                {ex.categorie}{' '}
                                {v ? `(${v.referenceInterne} ${v.modele})` : '(Agence)'}
                              </span>
                              <p className="text-slate-600">{ex.description}</p>
                            </div>
                            <span className="font-mono font-bold text-red-600">
                              -{ex.montant} MAD
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-5">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await addExpense({
                        ...expenseForm,
                        vehicleId: expenseForm.vehicleId || undefined,
                      });
                      notify('ok', 'Dépense enregistrée.');
                    } catch (err) {
                      notify('err', (err as Error).message);
                    }
                  }}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 text-xs"
                >
                  <h3 className="text-sm font-extrabold text-slate-900">Ajouter une Dépense</h3>
                  <select
                    value={expenseForm.vehicleId}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, vehicleId: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="">Dépense générale d&apos;agence</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        Véhicule {v.referenceInterne} — {v.modele}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={expenseForm.dateDepense}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, dateDepense: e.target.value })
                      }
                      className="rounded-lg border border-slate-300 px-3 py-2 font-mono"
                    />
                    <input
                      type="number"
                      placeholder="Montant (MAD)"
                      value={expenseForm.montant}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, montant: Number(e.target.value) })
                      }
                      className="rounded-lg border border-slate-300 px-3 py-2 font-mono"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Description de la dépense"
                    value={expenseForm.description}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, description: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-red-600 py-2.5 font-bold text-white"
                  >
                    Enregistrer la dépense
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 13. RAPPORTS (FACTURATION VS ENCAISSEMENT + EXPORT CSV & PRINT)   */}
          {/* ================================================================= */}
          {section === 'reports' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Rapports Financiers & Exploitation par Véhicule
                  </h2>
                  <p className="text-xs text-slate-500">
                    Distinction stricte entre la <strong>Facturation émise</strong> (créances
                    facturées) et les <strong>Recettes encaissées</strong> (trésorerie réellement
                    perçue), hors cautions.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportReportsCsv}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white"
                  >
                    <Download className="h-4 w-4" /> Exporter CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700"
                  >
                    <Printer className="h-4 w-4" /> Imprimer Rapport
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <span className="text-xs text-slate-500">Facturation Nette Émise</span>
                  <p className="mt-1 font-mono text-xl font-extrabold text-slate-900">
                    {totalFacturationNet.toLocaleString()} MAD
                  </p>
                  <span className="text-[10px] text-slate-500">
                    Total facturé net d&apos;avoirs
                  </span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <span className="text-xs text-slate-500">Recettes Encaissées</span>
                  <p className="mt-1 font-mono text-xl font-extrabold text-emerald-700">
                    {totalRecettesEncaissees.toLocaleString()} MAD
                  </p>
                  <span className="text-[10px] text-slate-500">Trésorerie réellement perçue</span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <span className="text-xs text-slate-500">Impayés / Reste à recouvrer</span>
                  <p className="mt-1 font-mono text-xl font-extrabold text-red-600">
                    {totalImpayesClients.toLocaleString()} MAD
                  </p>
                  <span className="text-[10px] text-slate-500">Facturation − Encaissements</span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <span className="text-xs text-slate-500">Dépenses & Entretiens</span>
                  <p className="mt-1 font-mono text-xl font-extrabold text-slate-800">
                    {totalChargesExploitation.toLocaleString()} MAD
                  </p>
                  <span className="text-[10px] text-slate-500">Charges opérationnelles</span>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                  <span className="text-xs text-amber-900">Cautions Détenues (Hors CA)</span>
                  <p className="mt-1 font-mono text-xl font-extrabold text-amber-900">
                    {totalCautionsDetenues.toLocaleString()} MAD
                  </p>
                  <span className="text-[10px] text-amber-800">Non incluses dans les recettes</span>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 14. PARAMÈTRES                                                    */}
          {/* ================================================================= */}
          {section === 'settings' && (
            <div className="grid gap-6 lg:grid-cols-2">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await updateSettings(settings);
                    notify('ok', 'Paramètres de l’agence enregistrés.');
                  } catch (err) {
                    notify('err', (err as Error).message);
                  }
                }}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 text-xs"
              >
                <h2 className="text-base font-extrabold text-slate-900">
                  Identité de l&apos;Agence & Mentions Fiscales (À renseigner)
                </h2>
                <p className="text-slate-500">
                  Aucune adresse précise ni identifiant légal n&apos;est inventé par défaut.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700">Téléphone 1</label>
                    <input
                      type="text"
                      value={settings.telephone1}
                      onChange={(e) => updateSettings({ telephone1: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700">Téléphone 2</label>
                    <input
                      type="text"
                      value={settings.telephone2}
                      onChange={(e) => updateSettings({ telephone2: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700">E-mail</label>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) => updateSettings({ email: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700">
                      Adresse Agence (À renseigner)
                    </label>
                    <input
                      type="text"
                      placeholder="À renseigner"
                      value={settings.adresse}
                      onChange={(e) => updateSettings({ adresse: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700">ICE (À renseigner)</label>
                    <input
                      type="text"
                      placeholder="À renseigner"
                      value={settings.ice}
                      onChange={(e) => updateSettings({ ice: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700">
                      Identifiant Fiscal IF (À renseigner)
                    </label>
                    <input
                      type="text"
                      placeholder="À renseigner"
                      value={settings.identifiantFiscal}
                      onChange={(e) =>
                        updateSettings({ identifiantFiscal: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                    />
                  </div>
                </div>
              </form>

              <div className="space-y-4">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await changePassword(newAdminPassword);
                      setNewAdminPassword('');
                      notify('ok', 'Mot de passe administrateur modifié avec succès.');
                    } catch (err) {
                      notify('err', (err as Error).message);
                    }
                  }}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 text-xs"
                >
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Sécurité & Mot de Passe Administrateur
                  </h3>
                  <input
                    type="password"
                    placeholder="Nouveau mot de passe (min. 6 caractères)"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-slate-900 px-5 py-2.5 font-bold text-white"
                  >
                    Mettre à jour le mot de passe
                  </button>
                </form>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 text-xs">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Réinitialisation à l&apos;État Initial Strict (9 Véhicules Confirmés)
                  </h3>
                  <p className="text-slate-500">
                    Réinitialise la base de données avec uniquement les 9 véhicules confirmés
                    (P208-01 à SAN-02) et vide les autres tables.
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      await resetToInitialNineVehicles();
                      notify(
                        'ok',
                        'Base réinitialisée à l’état initial strict (9 véhicules confirmés).'
                      );
                    }}
                    className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 font-bold text-red-700 hover:bg-red-100"
                  >
                    Réinitialiser aux 9 véhicules initiaux
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PRINT CONTRACT / INVOICE MODAL */}
      {printMode && (
        <AbboudPrintModal
          mode={printMode}
          settings={settings}
          contract={printContract}
          invoice={printInvoice}
          client={
            clients.find(
              (c) => c.id === (printContract?.clientId || printInvoice?.clientId)
            ) || null
          }
          vehicle={
            vehicles.find((v) => v.id === printContract?.vehicleId) || null
          }
          payments={
            printInvoice
              ? payments.filter((p) => p.invoiceId === printInvoice.id)
              : []
          }
          allContracts={contracts}
          allClients={clients}
          allVehicles={vehicles}
          allInvoices={invoices}
          onClose={() => {
            setPrintMode(null);
            setPrintContract(null);
            setPrintInvoice(null);
          }}
        />
      )}
    </div>
  );
};
