import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AbboudDatabaseState,
  AbboudVehicle,
  AgencySettings,
  ClientRecord,
  ContractRecord,
  ExpenseRecord,
  InvoicePaymentRecord,
  InvoiceRecord,
  MaintenanceRecord,
  ReservationRequest,
  VehicleCreditRecord,
} from '../types/abboud';
import type { ActiveAlertItem } from '../../server/abboudEngine';

export interface PublicShowcaseData {
  agency: {
    nomAgence: string;
    activite: string;
    ville: string;
    slogan: string;
    telephone1: string;
    telephone2: string;
    email: string;
    adresse: string;
  };
  totalVehiclesCount: number;
  models: Array<{
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
  }>;
  vehiclesPublicList: Array<{
    id: string;
    referenceInterne: string;
    marque: string;
    modele: string;
    photoUrl: string;
    photoIllustrative: boolean;
    annee: number | null;
    carburant: string;
    transmission: string;
    tarifJournalier: number | null;
    etat: AbboudVehicle['etat'];
  }>;
}

interface AbboudContextValue {
  publicData: PublicShowcaseData | null;
  adminToken: string | null;
  adminState: (AbboudDatabaseState & { alerts: ActiveAlertItem[] }) | null;
  loading: boolean;
  refreshPublic: () => Promise<void>;
  refreshAdmin: (overrideToken?: string) => Promise<void>;
  submitReservationRequest: (input: {
    modeleSouhaite: string;
    departSouhaite: string;
    retourSouhaite: string;
    lieuPriseEnCharge: string;
    nomClient: string;
    telephone: string;
    email?: string;
    message?: string;
  }) => Promise<{ confirmationMessage: string; request: ReservationRequest }>;
  loginAdmin: (password: string) => Promise<void>;
  logoutAdmin: () => void;
  updateVehicle: (vehicle: Partial<AbboudVehicle> & { id: string }) => Promise<AbboudVehicle>;
  upsertClient: (
    client: Partial<ClientRecord> & { nomComplet: string; telephone: string }
  ) => Promise<ClientRecord>;
  updateRequestStatus: (
    requestId: string,
    statut: ReservationRequest['statut']
  ) => Promise<ReservationRequest>;
  upsertContract: (input: {
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
  }) => Promise<{ contract: ContractRecord; invoice?: InvoiceRecord }>;
  extendContract: (params: {
    contractId: string;
    nouveauRetourPrevu: string;
    fraisSupplementairesAjoutes?: number;
  }) => Promise<ContractRecord>;
  registerReturn: (params: {
    contractId: string;
    retourReel: string;
    kmRetour: number | null;
    carburantRetour: string;
    observationsRetour: string;
    fraisRetourValides: number;
    cautionStatut?: ContractRecord['cautionStatut'];
    declarerEnEntretien?: boolean;
  }) => Promise<{ contract: ContractRecord; vehicle: AbboudVehicle }>;
  upsertInvoice: (params: {
    id?: string;
    contractId: string;
    dateEmission: string;
    dateEcheance: string;
    montantTotalFacture: number;
    statut?: InvoiceRecord['statut'];
    notes?: string;
  }) => Promise<InvoiceRecord>;
  recordPayment: (params: {
    invoiceId: string;
    datePaiement: string;
    montant: number;
    modePaiement: InvoicePaymentRecord['modePaiement'];
    referenceOperation?: string;
    notes?: string;
  }) => Promise<{ payment: InvoicePaymentRecord; invoice: InvoiceRecord }>;
  issueCreditNote: (params: {
    invoiceId: string;
    montant: number;
    motif: string;
    annulerFacture?: boolean;
  }) => Promise<InvoiceRecord>;
  addMaintenance: (
    params: Omit<MaintenanceRecord, 'id' | 'createdAt'> & {
      mettreVehiculeEnEntretien?: boolean;
    }
  ) => Promise<MaintenanceRecord>;
  upsertVehicleCredit: (
    params: Omit<VehicleCreditRecord, 'id' | 'createdAt' | 'paiements'> & { id?: string }
  ) => Promise<VehicleCreditRecord>;
  recordCreditInstallment: (params: {
    creditId: string;
    datePaiement: string;
    montantMensualiteVersee: number;
    partCapitalDocumentee?: number | null;
    partInteretsEtFrais?: number | null;
    nouveauSoldeCapitalCommunique?: number | null;
    reference?: string;
  }) => Promise<VehicleCreditRecord>;
  addExpense: (params: Omit<ExpenseRecord, 'id' | 'createdAt'>) => Promise<ExpenseRecord>;
  updateSettings: (updates: Partial<AgencySettings>) => Promise<AgencySettings>;
  changePassword: (newPassword: string) => Promise<void>;
  resetToInitialNineVehicles: () => Promise<void>;
  importBackup: (state: AbboudDatabaseState) => Promise<void>;
}

const AbboudContext = createContext<AbboudContextValue | null>(null);

async function apiRequest<T>(url: string, body?: unknown, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    method: body !== undefined ? 'POST' : 'GET',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Erreur HTTP ${res.status}`);
  }
  return data as T;
}

export const AbboudProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [publicData, setPublicData] = useState<PublicShowcaseData | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('abboud_admin_token');
    } catch {
      return null;
    }
  });
  const [adminState, setAdminState] = useState<
    (AbboudDatabaseState & { alerts: ActiveAlertItem[] }) | null
  >(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshPublic = useCallback(async () => {
    try {
      const data = await apiRequest<PublicShowcaseData>('/api/abboud/public');
      setPublicData(data);
    } catch {
      // ignore offline
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAdmin = useCallback(
    async (overrideToken?: string) => {
      const tok = overrideToken ?? adminToken;
      if (!tok) return;
      try {
        const state = await apiRequest<AbboudDatabaseState & { alerts: ActiveAlertItem[] }>(
          '/api/abboud/admin/state',
          { token: tok },
          tok
        );
        setAdminState(state);
      } catch {
        setAdminToken(null);
        setAdminState(null);
        try {
          sessionStorage.removeItem('abboud_admin_token');
        } catch {
          // ignore
        }
      }
    },
    [adminToken]
  );

  useEffect(() => {
    refreshPublic();
    if (adminToken) {
      refreshAdmin(adminToken);
    }
  }, [refreshPublic, refreshAdmin, adminToken]);

  const loginAdmin = async (password: string) => {
    const res = await apiRequest<{ token: string }>('/api/abboud/auth/login', { password });
    setAdminToken(res.token);
    try {
      sessionStorage.setItem('abboud_admin_token', res.token);
    } catch {
      // ignore
    }
    await refreshAdmin(res.token);
  };

  const logoutAdmin = () => {
    setAdminToken(null);
    setAdminState(null);
    try {
      sessionStorage.removeItem('abboud_admin_token');
    } catch {
      // ignore
    }
  };

  const submitReservationRequest: AbboudContextValue['submitReservationRequest'] = async (
    input
  ) => {
    const res = await apiRequest<{ confirmationMessage: string; request: ReservationRequest }>(
      '/api/abboud/reservation-request',
      input
    );
    if (adminToken) {
      await refreshAdmin();
    }
    return res;
  };

  const updateVehicle: AbboudContextValue['updateVehicle'] = async (vehicle) => {
    const res = await apiRequest<{ vehicle: AbboudVehicle }>(
      '/api/abboud/admin/vehicle',
      { vehicle },
      adminToken
    );
    await Promise.all([refreshAdmin(), refreshPublic()]);
    return res.vehicle;
  };

  const upsertClient: AbboudContextValue['upsertClient'] = async (client) => {
    const res = await apiRequest<{ client: ClientRecord }>(
      '/api/abboud/admin/client',
      { client },
      adminToken
    );
    await refreshAdmin();
    return res.client;
  };

  const updateRequestStatus: AbboudContextValue['updateRequestStatus'] = async (
    requestId,
    statut
  ) => {
    const res = await apiRequest<{ request: ReservationRequest }>(
      '/api/abboud/admin/request-status',
      { requestId, statut },
      adminToken
    );
    await refreshAdmin();
    return res.request;
  };

  const upsertContract: AbboudContextValue['upsertContract'] = async (contract) => {
    const res = await apiRequest<{ contract: ContractRecord; invoice?: InvoiceRecord }>(
      '/api/abboud/admin/contract',
      { contract },
      adminToken
    );
    await Promise.all([refreshAdmin(), refreshPublic()]);
    return res;
  };

  const extendContract: AbboudContextValue['extendContract'] = async (params) => {
    const res = await apiRequest<{ contract: ContractRecord }>(
      '/api/abboud/admin/contract-extend',
      params,
      adminToken
    );
    await refreshAdmin();
    return res.contract;
  };

  const registerReturn: AbboudContextValue['registerReturn'] = async (params) => {
    const res = await apiRequest<{ contract: ContractRecord; vehicle: AbboudVehicle }>(
      '/api/abboud/admin/contract-return',
      params,
      adminToken
    );
    await Promise.all([refreshAdmin(), refreshPublic()]);
    return res;
  };

  const upsertInvoice: AbboudContextValue['upsertInvoice'] = async (invoice) => {
    const res = await apiRequest<{ invoice: InvoiceRecord }>(
      '/api/abboud/admin/invoice',
      { invoice },
      adminToken
    );
    await refreshAdmin();
    return res.invoice;
  };

  const recordPayment: AbboudContextValue['recordPayment'] = async (payment) => {
    const res = await apiRequest<{ payment: InvoicePaymentRecord; invoice: InvoiceRecord }>(
      '/api/abboud/admin/payment',
      { payment },
      adminToken
    );
    await refreshAdmin();
    return res;
  };

  const issueCreditNote: AbboudContextValue['issueCreditNote'] = async (params) => {
    const res = await apiRequest<{ invoice: InvoiceRecord }>(
      '/api/abboud/admin/credit-note',
      params,
      adminToken
    );
    await refreshAdmin();
    return res.invoice;
  };

  const addMaintenance: AbboudContextValue['addMaintenance'] = async (maintenance) => {
    const res = await apiRequest<{ maintenance: MaintenanceRecord }>(
      '/api/abboud/admin/maintenance',
      { maintenance },
      adminToken
    );
    await Promise.all([refreshAdmin(), refreshPublic()]);
    return res.maintenance;
  };

  const upsertVehicleCredit: AbboudContextValue['upsertVehicleCredit'] = async (credit) => {
    const res = await apiRequest<{ credit: VehicleCreditRecord }>(
      '/api/abboud/admin/vehicle-credit',
      { credit },
      adminToken
    );
    await refreshAdmin();
    return res.credit;
  };

  const recordCreditInstallment: AbboudContextValue['recordCreditInstallment'] = async (
    params
  ) => {
    const res = await apiRequest<{ credit: VehicleCreditRecord }>(
      '/api/abboud/admin/credit-installment',
      params,
      adminToken
    );
    await refreshAdmin();
    return res.credit;
  };

  const addExpense: AbboudContextValue['addExpense'] = async (expense) => {
    const res = await apiRequest<{ expense: ExpenseRecord }>(
      '/api/abboud/admin/expense',
      { expense },
      adminToken
    );
    await refreshAdmin();
    return res.expense;
  };

  const updateSettings: AbboudContextValue['updateSettings'] = async (updates) => {
    const res = await apiRequest<{ settings: AgencySettings }>(
      '/api/abboud/admin/settings',
      { updates },
      adminToken
    );
    await Promise.all([refreshAdmin(), refreshPublic()]);
    return res.settings;
  };

  const changePassword: AbboudContextValue['changePassword'] = async (newPassword) => {
    await apiRequest('/api/abboud/admin/password', { newPassword }, adminToken);
  };

  const resetToInitialNineVehicles: AbboudContextValue['resetToInitialNineVehicles'] = async () => {
    await apiRequest('/api/abboud/admin/reset', {}, adminToken);
    await Promise.all([refreshAdmin(), refreshPublic()]);
  };

  const importBackup: AbboudContextValue['importBackup'] = async (state) => {
    await apiRequest('/api/abboud/admin/import', { state }, adminToken);
    await Promise.all([refreshAdmin(), refreshPublic()]);
  };

  return (
    <AbboudContext.Provider
      value={{
        publicData,
        adminToken,
        adminState,
        loading,
        refreshPublic,
        refreshAdmin,
        submitReservationRequest,
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
        importBackup,
      }}
    >
      {children}
    </AbboudContext.Provider>
  );
};

export function useAbboud(): AbboudContextValue {
  const ctx = useContext(AbboudContext);
  if (!ctx) {
    throw new Error('useAbboud must be used within an AbboudProvider');
  }
  return ctx;
}
