import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  AirportCode,
  AirportServiceType,
  AirportTransferBooking,
  AvailabilityBlock,
  Booking,
  BookingHold,
  BookingStatus,
  ChauffeurMission,
  CompanySettings,
  CustomerInfo,
  Language,
  PaymentPlan,
  PaymentRecord,
  PriceBreakdown,
  RefundRecord,
  SupportTicket,
  UserProfile,
  Vehicle,
  VehicleCategoryCode,
  VehicleInspectionRecord,
} from '../types/domain';
import { createInitialDatabaseState, DatabaseState } from '../../server/seedData';
import { TRANSLATIONS, TranslationDictionary } from '../i18n/translations';

export interface SearchCriteria {
  pickupLocationCode: string;
  returnLocationCode: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  driverAge: number;
  airportDelivery: boolean;
  withChauffeur: boolean;
}

interface PlatformContextValue {
  db: DatabaseState;
  loading: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationDictionary;
  sessionToken: string;
  currentUser: UserProfile | null;
  switchUserProfile: (profileId: string | null) => void;
  searchCriteria: SearchCriteria;
  setSearchCriteria: React.Dispatch<React.SetStateAction<SearchCriteria>>;
  selectedVehicleForBooking: Vehicle | null;
  setSelectedVehicleForBooking: (v: Vehicle | null) => void;
  activeHold: BookingHold | null;
  refreshState: () => Promise<void>;
  searchVehicles: (params?: Partial<SearchCriteria> & {
    category?: VehicleCategoryCode | 'ALL';
    transmission?: 'Automatic' | 'Manual' | 'ALL';
    maxDailyPriceMad?: number;
  }) => Promise<Array<Vehicle & { availability: { available: boolean; reason?: string } }>>;
  calculatePrice: (params: {
    vehicleId: string;
    pickupAt: string;
    returnAt: string;
    pickupLocationCode: string;
    returnLocationCode: string;
    extraCodes: Array<{ code: string; quantity: number }>;
    withChauffeur?: boolean;
    airportDelivery?: boolean;
    promoCode?: string;
    paymentPlan: PaymentPlan;
  }) => Promise<PriceBreakdown>;
  createHold: (vehicleId: string, pickupAt: string, returnAt: string) => Promise<BookingHold>;
  createBooking: (params: {
    vehicleId: string;
    pickupLocationCode: string;
    returnLocationCode: string;
    customDeliveryAddress?: string;
    pickupAt: string;
    returnAt: string;
    extraCodes: Array<{ code: string; quantity: number }>;
    customer: CustomerInfo;
    paymentPlan: PaymentPlan;
    withChauffeur?: boolean;
    airportDelivery?: boolean;
    flightNumber?: string;
    promoCode?: string;
  }) => Promise<{ booking: Booking; paymentSession?: PaymentRecord }>;
  createPaymentSession: (bookingId: string) => Promise<{
    payment: PaymentRecord;
    signedWebhookTokens: {
      successSignature: string;
      failedSignature: string;
      cancelledSignature: string;
    };
  }>;
  triggerPaymentWebhook: (params: {
    sessionId: string;
    idempotencyKey: string;
    outcome: 'success' | 'failed' | 'cancelled';
    signature: string;
  }) => Promise<{
    payment: PaymentRecord;
    booking?: Booking;
    airportTransfer?: AirportTransferBooking;
    alreadyProcessed: boolean;
  }>;
  issueRefund: (paymentId: string, amountMad: number, reason: string) => Promise<RefundRecord>;
  calculateAirportPrice: (params: {
    serviceType: AirportServiceType;
    airportCode: AirportCode;
    vehicleCategory: VehicleCategoryCode;
    passengers: number;
    isRoundTrip: boolean;
    flightArrivalAt: string;
    meetAndGreet: boolean;
    childSeats: number;
    waitingMinutes: number;
    durationHours?: number;
  }) => Promise<AirportTransferBooking['priceBreakdown']>;
  bookAirportTransfer: (params: {
    serviceType: AirportServiceType;
    airportCode: AirportCode;
    flightNumber: string;
    airline: string;
    flightArrivalAt: string;
    passengers: number;
    luggageCount: number;
    destinationAddress: string;
    vehicleCategory: VehicleCategoryCode;
    durationHours?: number;
    isRoundTrip: boolean;
    meetAndGreet: boolean;
    childSeats: number;
    waitingMinutes: number;
    customerName: string;
    customerEmail: string;
    customerWhatsapp: string;
    specialInstructions?: string;
    payOnline?: boolean;
  }) => Promise<{ transfer: AirportTransferBooking; paymentSession?: PaymentRecord; successSignature?: string }>;
  fetchChauffeurMissions: (actorProfileId?: string) => Promise<ChauffeurMission[]>;
  updateMissionStatus: (params: {
    missionId: string;
    status?: ChauffeurMission['status'];
    flightStatus?: ChauffeurMission['flightStatus'];
    operationalNotes?: string;
  }) => Promise<ChauffeurMission>;
  fetchCustomerPortal: (params: {
    actorProfileId?: string;
    guestReference?: string;
    guestEmailOrToken?: string;
  }) => Promise<{
    bookings: Booking[];
    transfers: AirportTransferBooking[];
    payments: PaymentRecord[];
  }>;
  upsertVehicle: (vehicle: Partial<Vehicle> & { brand: string; model: string }) => Promise<Vehicle>;
  addAvailabilityBlock: (block: Omit<AvailabilityBlock, 'id'>) => Promise<AvailabilityBlock>;
  updateBookingAdmin: (params: {
    bookingId: string;
    status?: BookingStatus;
    returnAt?: string;
    contractSignatureName?: string;
    departureInspection?: VehicleInspectionRecord;
    returnInspection?: VehicleInspectionRecord;
  }) => Promise<Booking>;
  assignChauffeur: (transferId: string, chauffeurId: string) => Promise<AirportTransferBooking>;
  updateSettings: (updates: Partial<CompanySettings>) => Promise<CompanySettings>;
  submitSupportTicket: (ticket: Omit<SupportTicket, 'id' | 'status' | 'createdAt'>) => Promise<SupportTicket>;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Erreur HTTP ${res.status}`);
  }
  return data as T;
}

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<DatabaseState>(() => createInitialDatabaseState());
  const [loading, setLoading] = useState<boolean>(true);
  const [language, setLanguage] = useState<Language>('fr');
  const [sessionToken] = useState<string>(() => `SES-CLIENT-${Math.random().toString(36).slice(2, 10)}`);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => db.profiles[5] || null); // Default Amine Tazi (customer)
  const [selectedVehicleForBooking, setSelectedVehicleForBooking] = useState<Vehicle | null>(null);
  const [activeHold, setActiveHold] = useState<BookingHold | null>(null);

  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    pickupLocationCode: 'KENITRA_CENTRE',
    returnLocationCode: 'KENITRA_CENTRE',
    pickupDate: '2026-11-02',
    pickupTime: '10:00',
    returnDate: '2026-11-06',
    returnTime: '10:00',
    driverAge: 30,
    airportDelivery: false,
    withChauffeur: false,
  });

  const refreshState = useCallback(async () => {
    try {
      const res = await fetch('/api/bootstrap');
      if (res.ok) {
        const snapshot = (await res.json()) as DatabaseState;
        setDb(snapshot);
        setCurrentUser((prev) => {
          if (!prev) return null;
          return snapshot.profiles.find((p) => p.id === prev.id) || prev;
        });
      }
    } catch {
      // Fallback to local state if offline
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  // Sync HTML dir, lang, and brand CSS variables
  useEffect(() => {
    const dict = TRANSLATIONS[language];
    document.documentElement.lang = language;
    document.documentElement.dir = dict.dir;
  }, [language]);

  useEffect(() => {
    document.documentElement.style.setProperty('--brand-primary', db.companySettings.primaryColorHex);
    document.documentElement.style.setProperty('--brand-primary-light', db.companySettings.accentColorHex);
    document.title = `${db.companySettings.brandName} | Location de Voitures Premium & Chauffeur Aéroport Kénitra`;
  }, [db.companySettings]);

  const switchUserProfile = (profileId: string | null) => {
    if (!profileId) {
      setCurrentUser(null);
      return;
    }
    const found = db.profiles.find((p) => p.id === profileId) || null;
    setCurrentUser(found);
  };

  const searchVehicles: PlatformContextValue['searchVehicles'] = async (params) => {
    const merged = { ...searchCriteria, ...params };
    const pickupAt = `${merged.pickupDate}T${merged.pickupTime}:00.000Z`;
    const returnAt = `${merged.returnDate}T${merged.returnTime}:00.000Z`;
    const data = await apiPost<{
      results: Array<Vehicle & { availability: { available: boolean; reason?: string } }>;
    }>('/api/vehicles/search', {
      pickupAt,
      returnAt,
      pickupLocationCode: merged.pickupLocationCode,
      category: params?.category,
      transmission: params?.transmission,
      maxDailyPriceMad: params?.maxDailyPriceMad,
      driverAge: merged.driverAge,
      withChauffeur: merged.withChauffeur,
      sessionToken,
    });
    return data.results;
  };

  const calculatePrice: PlatformContextValue['calculatePrice'] = async (params) => {
    const data = await apiPost<{ breakdown: PriceBreakdown }>('/api/pricing/calculate', params);
    return data.breakdown;
  };

  const createHold: PlatformContextValue['createHold'] = async (vehicleId, pickupAt, returnAt) => {
    const data = await apiPost<{ hold: BookingHold }>('/api/holds/create', {
      vehicleId,
      pickupAt,
      returnAt,
      sessionToken,
      ttlMinutes: 15,
    });
    setActiveHold(data.hold);
    await refreshState();
    return data.hold;
  };

  const createBooking: PlatformContextValue['createBooking'] = async (params) => {
    const data = await apiPost<{ booking: Booking; paymentSession?: PaymentRecord }>('/api/bookings/create', {
      ...params,
      sessionToken,
      profileId: currentUser?.id,
    });
    await refreshState();
    return data;
  };

  const createPaymentSession: PlatformContextValue['createPaymentSession'] = async (bookingId) => {
    return apiPost('/api/payments/session', { bookingId });
  };

  const triggerPaymentWebhook: PlatformContextValue['triggerPaymentWebhook'] = async (params) => {
    const res = await apiPost<{
      payment: PaymentRecord;
      booking?: Booking;
      airportTransfer?: AirportTransferBooking;
      alreadyProcessed: boolean;
    }>('/api/payments/webhook', params);
    await refreshState();
    return res;
  };

  const issueRefund: PlatformContextValue['issueRefund'] = async (paymentId, amountMad, reason) => {
    const actorProfileId =
      currentUser && ['super_admin', 'agency_manager'].includes(currentUser.role)
        ? currentUser.id
        : 'usr-super-admin';
    const res = await apiPost<{ refund: RefundRecord }>('/api/payments/refund', {
      paymentId,
      amountMad,
      reason,
      actorProfileId,
    });
    await refreshState();
    return res.refund;
  };

  const calculateAirportPrice: PlatformContextValue['calculateAirportPrice'] = async (params) => {
    const res = await apiPost<{ breakdown: AirportTransferBooking['priceBreakdown'] }>(
      '/api/airport/price',
      params
    );
    return res.breakdown;
  };

  const bookAirportTransfer: PlatformContextValue['bookAirportTransfer'] = async (params) => {
    const res = await apiPost<{
      transfer: AirportTransferBooking;
      paymentSession?: PaymentRecord;
      successSignature?: string;
    }>('/api/airport/book', {
      ...params,
      profileId: currentUser?.id,
    });
    await refreshState();
    return res;
  };

  const fetchChauffeurMissions: PlatformContextValue['fetchChauffeurMissions'] = async (actorProfileId) => {
    const id = actorProfileId || currentUser?.id || '';
    const res = await apiPost<{ missions: ChauffeurMission[] }>('/api/chauffeur/missions', {
      actorProfileId: id,
    });
    return res.missions;
  };

  const updateMissionStatus: PlatformContextValue['updateMissionStatus'] = async (params) => {
    const actorProfileId = currentUser?.id || 'usr-chauffeur-1';
    const res = await apiPost<{ mission: ChauffeurMission }>('/api/chauffeur/mission-update', {
      ...params,
      actorProfileId,
    });
    await refreshState();
    return res.mission;
  };

  const fetchCustomerPortal: PlatformContextValue['fetchCustomerPortal'] = async (params) => {
    return apiPost('/api/customer/portal', params);
  };

  const upsertVehicle: PlatformContextValue['upsertVehicle'] = async (vehicle) => {
    const actorProfileId =
      currentUser && ['super_admin', 'agency_manager', 'booking_agent'].includes(currentUser.role)
        ? currentUser.id
        : 'usr-super-admin';
    const res = await apiPost<{ vehicle: Vehicle }>('/api/admin/vehicle', {
      actorProfileId,
      vehicle,
    });
    await refreshState();
    return res.vehicle;
  };

  const addAvailabilityBlock: PlatformContextValue['addAvailabilityBlock'] = async (block) => {
    const actorProfileId =
      currentUser && ['super_admin', 'agency_manager', 'booking_agent'].includes(currentUser.role)
        ? currentUser.id
        : 'usr-super-admin';
    const res = await apiPost<{ block: AvailabilityBlock }>('/api/admin/block', {
      actorProfileId,
      block,
    });
    await refreshState();
    return res.block;
  };

  const updateBookingAdmin: PlatformContextValue['updateBookingAdmin'] = async (params) => {
    const actorProfileId = currentUser?.id || 'usr-super-admin';
    const res = await apiPost<{ booking: Booking }>('/api/admin/booking-update', {
      ...params,
      actorProfileId,
    });
    await refreshState();
    return res.booking;
  };

  const assignChauffeur: PlatformContextValue['assignChauffeur'] = async (transferId, chauffeurId) => {
    const actorProfileId =
      currentUser && ['super_admin', 'agency_manager', 'booking_agent'].includes(currentUser.role)
        ? currentUser.id
        : 'usr-super-admin';
    const res = await apiPost<{ transfer: AirportTransferBooking }>('/api/admin/assign-chauffeur', {
      actorProfileId,
      transferId,
      chauffeurId,
    });
    await refreshState();
    return res.transfer;
  };

  const updateSettings: PlatformContextValue['updateSettings'] = async (updates) => {
    const actorProfileId =
      currentUser && ['super_admin', 'agency_manager'].includes(currentUser.role)
        ? currentUser.id
        : 'usr-super-admin';
    const res = await apiPost<{ settings: CompanySettings }>('/api/admin/settings', {
      actorProfileId,
      updates,
    });
    await refreshState();
    return res.settings;
  };

  const submitSupportTicket: PlatformContextValue['submitSupportTicket'] = async (ticket) => {
    const res = await apiPost<{ ticket: SupportTicket }>('/api/support/ticket', ticket);
    await refreshState();
    return res.ticket;
  };

  return (
    <PlatformContext.Provider
      value={{
        db,
        loading,
        language,
        setLanguage,
        t: TRANSLATIONS[language],
        sessionToken,
        currentUser,
        switchUserProfile,
        searchCriteria,
        setSearchCriteria,
        selectedVehicleForBooking,
        setSelectedVehicleForBooking,
        activeHold,
        refreshState,
        searchVehicles,
        calculatePrice,
        createHold,
        createBooking,
        createPaymentSession,
        triggerPaymentWebhook,
        issueRefund,
        calculateAirportPrice,
        bookAirportTransfer,
        fetchChauffeurMissions,
        updateMissionStatus,
        fetchCustomerPortal,
        upsertVehicle,
        addAvailabilityBlock,
        updateBookingAdmin,
        assignChauffeur,
        updateSettings,
        submitSupportTicket,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
};

export function usePlatform(): PlatformContextValue {
  const ctx = useContext(PlatformContext);
  if (!ctx) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return ctx;
}
