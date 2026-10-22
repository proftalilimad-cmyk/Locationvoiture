import React, { useState } from 'react';
import {
  LayoutDashboard,
  Car,
  CalendarCheck,
  Plane,
  DollarSign,
  Settings,
  ShieldAlert,
  Plus,
  Download,
  FileText,
  CheckCircle2,
  RefreshCcw,
  Wrench,
  Search,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { Booking, BookingStatus, Vehicle, VehicleCategoryCode } from '../types/domain';
import { ContractModal } from '../components/ContractModal';

export const AdminDashboardPage: React.FC = () => {
  const {
    db,
    currentUser,
    switchUserProfile,
    upsertVehicle,
    addAvailabilityBlock,
    updateBookingAdmin,
    assignChauffeur,
    issueRefund,
    updateSettings,
  } = usePlatform();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'fleet' | 'bookings' | 'chauffeurs' | 'finance' | 'cms' | 'audit'
  >('overview');

  const [bookingSearch, setBookingSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALL'>('ALL');
  const [contractBooking, setContractBooking] = useState<Booking | null>(null);
  const [adminFeedback, setAdminFeedback] = useState<string | null>(null);

  // New / Edit Vehicle Form State
  const [editingVehicle, setEditingVehicle] = useState<Partial<Vehicle> & { brand: string; model: string }>({
    brand: 'BMW',
    model: 'Série 5 520d Pack M',
    year: 2025,
    category: 'Premium',
    dailyPriceMad: 1850,
    depositMad: 15000,
    transmission: 'Automatic',
    fuelType: 'Diesel',
    seats: 5,
    luggage: 4,
    mileagePolicy: 'Illimité',
    insuranceExpiryDate: '2027-11-30',
    status: 'available',
    isDemoData: false,
  });

  // Maintenance Block Form State
  const [blockVehicleId, setBlockVehicleId] = useState<string>(db.vehicles[0]?.id || '');
  const [blockStartDate, setBlockStartDate] = useState<string>('2026-11-18');
  const [blockEndDate, setBlockEndDate] = useState<string>('2026-11-20');
  const [blockNotes, setBlockNotes] = useState<string>('Entretien périodique constructeur');

  // CMS Settings Form State
  const [cmsBrandName, setCmsBrandName] = useState<string>(db.companySettings.brandName);
  const [cmsLogoText, setCmsLogoText] = useState<string>(db.companySettings.logoText);
  const [cmsPrimaryColor, setCmsPrimaryColor] = useState<string>(
    db.companySettings.primaryColorHex
  );
  const [cmsPhone, setCmsPhone] = useState<string>(db.companySettings.phone);
  const [cmsWhatsapp, setCmsWhatsapp] = useState<string>(db.companySettings.whatsapp);
  const [cmsAddress, setCmsAddress] = useState<string>(db.companySettings.address);
  const [cmsAllowArrival, setCmsAllowArrival] = useState<boolean>(
    db.companySettings.allowPayOnArrival
  );

  // KPIs Calculation
  const activeBookings = db.bookings.filter((b) =>
    ['confirmed', 'ready_for_pickup', 'active_rental'].includes(b.status)
  );
  const availableVehiclesCount = db.vehicles.filter((v) => v.status === 'available').length;
  const maintenanceVehiclesCount =
    db.vehicles.filter((v) => v.status === 'maintenance').length + db.availabilityBlocks.length;
  const totalRevenuePaidMad = db.payments
    .filter((p) => p.status === 'paid')
    .reduce((acc, p) => acc + p.amountMad, 0);
  const totalOutstandingMad = db.bookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((acc, b) => acc + b.balanceDueAtPickupMad, 0);
  const totalDepositsHeldMad = activeBookings.reduce((acc, b) => acc + b.refundableDepositMad, 0);
  const fleetUtilizationPct = Math.min(
    100,
    Math.round(((activeBookings.length + 2) / Math.max(1, db.vehicles.length)) * 100)
  );

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    const saved = await upsertVehicle(editingVehicle);
    setAdminFeedback(`Véhicule ${saved.brand} ${saved.model} enregistré avec succès.`);
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    await addAvailabilityBlock({
      vehicleId: blockVehicleId,
      startAt: `${blockStartDate}T08:00:00.000Z`,
      endAt: `${blockEndDate}T18:00:00.000Z`,
      reason: 'maintenance',
      notes: blockNotes,
    });
    setAdminFeedback('Période de maintenance bloquée sur le calendrier de disponibilité.');
  };

  const handleExportAccountingCsv = () => {
    const headers = [
      'ID Paiement',
      'Reference',
      'Type',
      'Montant MAD',
      'Caution Separee MAD',
      'Statut',
      'Recu',
      'Date',
    ];
    const rows = db.payments.map((p) => [
      p.id,
      p.referenceCode,
      p.paymentType,
      p.amountMad,
      p.refundableDepositHoldMad,
      p.status,
      p.receiptNumber || '',
      p.createdAt,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `comptabilite-kenitra-prestige-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveCms = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      brandName: cmsBrandName,
      logoText: cmsLogoText,
      primaryColorHex: cmsPrimaryColor,
      phone: cmsPhone,
      whatsapp: cmsWhatsapp,
      address: cmsAddress,
      allowPayOnArrival: cmsAllowArrival,
    });
    setAdminFeedback('Identité de marque et paramètres commerciaux mis à jour en temps réel.');
  };

  const filteredBookings = db.bookings
    .filter((b) => (statusFilter === 'ALL' ? true : b.status === statusFilter))
    .filter((b) => {
      if (!bookingSearch.trim()) return true;
      const q = bookingSearch.toLowerCase();
      return (
        b.reference.toLowerCase().includes(q) ||
        b.customer.fullName.toLowerCase().includes(q) ||
        b.vehicleTitle.toLowerCase().includes(q)
      );
    });

  return (
    <div className="min-h-screen bg-obsidian pb-24 pt-8 text-ivory">
      <div className="mx-auto max-w-7xl px-4">
        {/* Top Admin Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-champagne/30 bg-obsidian-card p-6">
          <div>
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-champagne">
              PORTAIL D&apos;EXPLOITATION & DIRECTION (/admin)
            </span>
            <h1 className="mt-1 font-serif text-3xl font-bold text-ivory">
              Administration {db.companySettings.brandName}
            </h1>
            <p className="mt-1 text-xs text-ivory-muted">
              Opérateur actif :{' '}
              <strong className="text-champagne">
                {currentUser?.fullName || 'Imad Talil — Super Administrateur'}
              </strong>
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => switchUserProfile('usr-super-admin')}
              className="rounded-xl border border-champagne/40 bg-champagne/15 px-3.5 py-2 font-mono font-bold text-champagne"
            >
              Activer Rôle Super Admin
            </button>
          </div>
        </div>

        {adminFeedback && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-3 text-xs text-emerald-200">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              {adminFeedback}
            </span>
            <button
              type="button"
              onClick={() => setAdminFeedback(null)}
              className="text-emerald-300 underline"
            >
              Fermer
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-8 flex flex-wrap gap-2">
          {[
            { id: 'overview', label: 'Vue d’Ensemble (KPIs)', icon: LayoutDashboard },
            { id: 'fleet', label: 'Gestion Flotte & Calendrier', icon: Car },
            { id: 'bookings', label: 'Réservations & Contrats', icon: CalendarCheck },
            { id: 'chauffeurs', label: 'Chauffeurs & Aéroports', icon: Plane },
            { id: 'finance', label: 'Finances, Cautions & Remboursements', icon: DollarSign },
            { id: 'cms', label: 'CMS, Marque & Tarifs', icon: Settings },
            { id: 'audit', label: 'Sécurité & Audit Logs', icon: ShieldAlert },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                  activeTab === tab.id
                    ? 'bg-champagne text-obsidian shadow-gold-glow'
                    : 'border border-obsidian-border bg-obsidian-card text-ivory-muted hover:text-ivory'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {[
                { label: 'Réservations Totales', value: db.bookings.length, sub: 'En base active' },
                {
                  label: 'Locations Confirmées / Actives',
                  value: activeBookings.length,
                  sub: 'Prêtes ou en circulation',
                },
                {
                  label: 'Véhicules Disponibles',
                  value: `${availableVehiclesCount} / ${db.vehicles.length}`,
                  sub: `Taux d'utilisation : ${fleetUtilizationPct}%`,
                },
                {
                  label: 'Maintenance / Blocs',
                  value: maintenanceVehiclesCount,
                  sub: 'Périodes verrouillées',
                },
                {
                  label: 'Chiffre d’Affaires Encaissé',
                  value: `${totalRevenuePaidMad.toLocaleString()} MAD`,
                  sub: 'Paiements vérifiés par Webhook',
                },
                {
                  label: 'Soldes à Encaisser au Départ',
                  value: `${totalOutstandingMad.toLocaleString()} MAD`,
                  sub: 'Restant dû par les clients',
                },
                {
                  label: 'Cautions en Garantie (Séparées)',
                  value: `${totalDepositsHeldMad.toLocaleString()} MAD`,
                  sub: 'Dépôts remboursables',
                },
                {
                  label: 'Missions Aéroport & Chauffeurs',
                  value: db.airportTransfers.length,
                  sub: `${db.chauffeurs.length} chauffeurs actifs`,
                },
              ].map((kpi, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-obsidian-border bg-obsidian-card p-5"
                >
                  <span className="text-xs text-ivory-subtle">{kpi.label}</span>
                  <p className="mt-2 font-mono text-2xl font-bold text-champagne">{kpi.value}</p>
                  <p className="mt-1 text-[11px] text-ivory-muted">{kpi.sub}</p>
                </div>
              ))}
            </div>

            {/* Upcoming Pickups & Airport Missions */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-obsidian-border bg-obsidian-card p-5">
                <h2 className="font-serif text-lg font-bold text-ivory">
                  Prochains Départs & Retours Véhicules
                </h2>
                <div className="mt-4 space-y-3">
                  {db.bookings.slice(0, 4).map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between rounded-xl border border-obsidian-border bg-obsidian p-3.5 text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-champagne">{b.reference}</span>
                        <p className="font-semibold text-ivory">{b.vehicleTitle}</p>
                        <p className="text-ivory-muted">
                          Client : {b.customer.fullName} • Lieu : {b.pickupLocationCode}
                        </p>
                      </div>
                      <div className="text-right font-mono">
                        <span className="rounded bg-champagne/15 px-2 py-0.5 text-[10px] text-champagne uppercase">
                          {b.status}
                        </span>
                        <p className="mt-1 text-ivory-muted">{b.pickupAt.slice(0, 10)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-obsidian-border bg-obsidian-card p-5">
                <h2 className="font-serif text-lg font-bold text-ivory">
                  Missions Transferts Aéroport (RBA / CMN / TNG)
                </h2>
                <div className="mt-4 space-y-3">
                  {db.airportTransfers.slice(0, 4).map((trf) => (
                    <div
                      key={trf.id}
                      className="flex items-center justify-between rounded-xl border border-obsidian-border bg-obsidian p-3.5 text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-champagne">
                          {trf.reference} • Vol {trf.flightNumber}
                        </span>
                        <p className="font-semibold text-ivory">
                          {trf.airportCode} → {trf.destinationAddress}
                        </p>
                        <p className="text-ivory-muted">
                          Chauffeur : {trf.assignedChauffeurName || 'À assigner'}
                        </p>
                      </div>
                      <div className="text-right font-mono">
                        <span className="font-bold text-emerald-400">{trf.totalPriceMad} MAD</span>
                        <p className="text-[11px] text-ivory-subtle">{trf.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. FLEET MANAGEMENT TAB */}
        {activeTab === 'fleet' && (
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-7">
              <div className="rounded-2xl border border-obsidian-border bg-obsidian-card p-5">
                <h2 className="font-serif text-xl font-bold text-ivory">
                  Catalogue Flotte Actif ({db.vehicles.length} véhicules)
                </h2>
                <div className="mt-4 space-y-3">
                  {db.vehicles.map((v) => (
                    <div
                      key={v.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-obsidian-border bg-obsidian p-3.5 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={v.images[0]?.url}
                          alt={v.model}
                          className="h-12 w-20 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-bold text-ivory">
                            {v.brand} {v.model} ({v.year})
                          </p>
                          <p className="font-mono text-champagne">
                            {v.category} • {v.dailyPriceMad} MAD/j • Caution {v.depositMad} MAD
                          </p>
                          <p className="text-[11px] text-ivory-subtle">
                            Assurance expire le : {v.insuranceExpiryDate}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          aria-label={`Statut ${v.model}`}
                          value={v.status}
                          onChange={(e) =>
                            upsertVehicle({
                              ...v,
                              status: e.target.value as Vehicle['status'],
                            })
                          }
                          className="rounded-lg border border-obsidian-border bg-obsidian-card px-2.5 py-1.5 font-mono text-xs text-ivory"
                        >
                          <option value="available">Disponible</option>
                          <option value="rented">En location</option>
                          <option value="maintenance">En maintenance</option>
                          <option value="archived">Archivé</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => setEditingVehicle(v)}
                          className="rounded-lg border border-champagne/40 px-3 py-1.5 font-semibold text-champagne"
                        >
                          Éditer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Add/Edit Vehicle & Maintenance Block */}
            <div className="space-y-6 lg:col-span-5">
              <form
                onSubmit={handleSaveVehicle}
                className="rounded-2xl border border-champagne/30 bg-obsidian-card p-5 space-y-4 text-xs"
              >
                <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-ivory">
                  <Plus className="h-4 w-4 text-champagne" />
                  {editingVehicle.id ? 'Modifier le véhicule' : 'Ajouter un véhicule à la flotte'}
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-ivory-muted">Marque *</label>
                    <input
                      type="text"
                      required
                      value={editingVehicle.brand}
                      onChange={(e) =>
                        setEditingVehicle({ ...editingVehicle, brand: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-obsidian-border bg-obsidian px-3 py-2 text-ivory"
                    />
                  </div>
                  <div>
                    <label className="block text-ivory-muted">Modèle *</label>
                    <input
                      type="text"
                      required
                      value={editingVehicle.model}
                      onChange={(e) =>
                        setEditingVehicle({ ...editingVehicle, model: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-obsidian-border bg-obsidian px-3 py-2 text-ivory"
                    />
                  </div>
                  <div>
                    <label className="block text-ivory-muted">Catégorie</label>
                    <select
                      value={editingVehicle.category}
                      onChange={(e) =>
                        setEditingVehicle({
                          ...editingVehicle,
                          category: e.target.value as VehicleCategoryCode,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-obsidian-border bg-obsidian px-3 py-2 text-ivory"
                    >
                      {(['Economy', 'Compact', 'Sedan', 'SUV', 'Family', 'Premium', 'Luxury'] as const).map(
                        (c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-ivory-muted">Prix / jour (MAD)</label>
                    <input
                      type="number"
                      value={editingVehicle.dailyPriceMad}
                      onChange={(e) =>
                        setEditingVehicle({
                          ...editingVehicle,
                          dailyPriceMad: Number(e.target.value),
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-obsidian-border bg-obsidian px-3 py-2 font-mono text-ivory"
                    />
                  </div>
                  <div>
                    <label className="block text-ivory-muted">Caution (MAD)</label>
                    <input
                      type="number"
                      value={editingVehicle.depositMad}
                      onChange={(e) =>
                        setEditingVehicle({
                          ...editingVehicle,
                          depositMad: Number(e.target.value),
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-obsidian-border bg-obsidian px-3 py-2 font-mono text-ivory"
                    />
                  </div>
                  <div>
                    <label className="block text-ivory-muted">Expiration Assurance</label>
                    <input
                      type="date"
                      value={editingVehicle.insuranceExpiryDate}
                      onChange={(e) =>
                        setEditingVehicle({
                          ...editingVehicle,
                          insuranceExpiryDate: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-obsidian-border bg-obsidian px-3 py-2 font-mono text-ivory"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-champagne py-2.5 font-bold text-obsidian"
                  >
                    Enregistrer le véhicule
                  </button>
                  {editingVehicle.id && (
                    <button
                      type="button"
                      onClick={() =>
                        setEditingVehicle({
                          brand: '',
                          model: '',
                          year: 2025,
                          category: 'Sedan',
                          dailyPriceMad: 900,
                          depositMad: 8000,
                        })
                      }
                      className="rounded-xl border border-obsidian-border px-3 py-2.5 text-ivory-muted"
                    >
                      Nouveau
                    </button>
                  )}
                </div>
              </form>

              {/* Schedule Maintenance / Block Dates */}
              <form
                onSubmit={handleCreateBlock}
                className="rounded-2xl border border-obsidian-border bg-obsidian-card p-5 space-y-3 text-xs"
              >
                <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-ivory">
                  <Wrench className="h-4 w-4 text-champagne" />
                  Bloquer des dates (Maintenance / Indisponibilité)
                </h3>
                <select
                  value={blockVehicleId}
                  onChange={(e) => setBlockVehicleId(e.target.value)}
                  className="w-full rounded-lg border border-obsidian-border bg-obsidian px-3 py-2 text-ivory"
                >
                  {db.vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.brand} {v.model}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={blockStartDate}
                    onChange={(e) => setBlockStartDate(e.target.value)}
                    className="rounded-lg border border-obsidian-border bg-obsidian px-3 py-2 font-mono text-ivory"
                  />
                  <input
                    type="date"
                    value={blockEndDate}
                    onChange={(e) => setBlockEndDate(e.target.value)}
                    className="rounded-lg border border-obsidian-border bg-obsidian px-3 py-2 font-mono text-ivory"
                  />
                </div>
                <input
                  type="text"
                  value={blockNotes}
                  onChange={(e) => setBlockNotes(e.target.value)}
                  placeholder="Motif (ex: Révision périodique)"
                  className="w-full rounded-lg border border-obsidian-border bg-obsidian px-3 py-2 text-ivory"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl border border-champagne/40 bg-champagne/15 py-2.5 font-bold text-champagne"
                >
                  Verrouiller ces dates au calendrier
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 3. BOOKING MANAGEMENT TAB */}
        {activeTab === 'bookings' && (
          <div className="rounded-2xl border border-obsidian-border bg-obsidian-card p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-serif text-xl font-bold text-ivory">
                Planning & Gestion des Réservations ({filteredBookings.length})
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-2 rounded-xl border border-obsidian-border bg-obsidian px-3 py-2">
                  <Search className="h-3.5 w-3.5 text-champagne" />
                  <input
                    type="text"
                    placeholder="Rechercher réf, client, véhicule..."
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    className="bg-transparent text-ivory focus:outline-none"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="rounded-xl border border-obsidian-border bg-obsidian px-3 py-2 text-ivory"
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="pending_payment">Pending payment</option>
                  <option value="awaiting_confirmation">Awaiting confirmation</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="ready_for_pickup">Ready for pickup</option>
                  <option value="active_rental">Active rental</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No-show</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-obsidian-border text-ivory-subtle">
                    <th className="pb-3 pr-4">Référence</th>
                    <th className="pb-3 pr-4">Client</th>
                    <th className="pb-3 pr-4">Véhicule</th>
                    <th className="pb-3 pr-4">Période & Lieu</th>
                    <th className="pb-3 pr-4">Finances (MAD)</th>
                    <th className="pb-3 pr-4">Statut Opérationnel</th>
                    <th className="pb-3">Contrat / Inspection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-obsidian-border">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-obsidian/40">
                      <td className="py-3.5 pr-4 font-mono font-bold text-champagne">
                        {b.reference}
                      </td>
                      <td className="py-3.5 pr-4">
                        <p className="font-semibold text-ivory">{b.customer.fullName}</p>
                        <p className="text-[11px] text-ivory-muted">{b.customer.whatsapp}</p>
                      </td>
                      <td className="py-3.5 pr-4 font-medium text-ivory">{b.vehicleTitle}</td>
                      <td className="py-3.5 pr-4 font-mono text-[11px] text-ivory-muted">
                        {b.pickupAt.slice(0, 10)} → {b.returnAt.slice(0, 10)}
                        <br />
                        <span className="text-champagne">
                          {b.pickupLocationCode} → {b.returnLocationCode}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 font-mono">
                        <span className="font-bold text-ivory">Total: {b.totalPayableMad}</span>
                        <br />
                        <span className="text-emerald-400">Payé: {b.amountPaidMad}</span> •{' '}
                        <span className="text-amber-300">Solde: {b.balanceDueAtPickupMad}</span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <select
                          aria-label={`Statut ${b.reference}`}
                          value={b.status}
                          onChange={async (e) => {
                            await updateBookingAdmin({
                              bookingId: b.id,
                              status: e.target.value as BookingStatus,
                            });
                            setAdminFeedback(
                              `Statut de la réservation ${b.reference} mis à jour.`
                            );
                          }}
                          className="rounded-lg border border-obsidian-border bg-obsidian px-2.5 py-1.5 font-mono text-xs text-ivory"
                        >
                          <option value="pending_payment">Pending payment</option>
                          <option value="awaiting_confirmation">Awaiting confirmation</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="ready_for_pickup">Ready for pickup</option>
                          <option value="active_rental">Active rental</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="no_show">No-show</option>
                        </select>
                      </td>
                      <td className="py-3.5">
                        <button
                          type="button"
                          onClick={() => setContractBooking(b)}
                          className="inline-flex items-center gap-1 rounded-lg bg-champagne/20 px-3 py-1.5 font-semibold text-champagne hover:bg-champagne hover:text-obsidian"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Contrat & État des lieux
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. CHAUFFEUR & AIRPORT DISPATCH TAB */}
        {activeTab === 'chauffeurs' && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {db.chauffeurs.map((chf) => (
                <div
                  key={chf.id}
                  className="rounded-2xl border border-obsidian-border bg-obsidian-card p-5 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-champagne">
                      Permis Pro : {chf.professionalPermitNo}
                    </span>
                    <span className="rounded-full bg-emerald-950/60 px-2.5 py-0.5 font-mono text-[10px] text-emerald-300">
                      {chf.availabilityStatus}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-ivory">{chf.fullName}</h3>
                  <p className="text-ivory-muted">{chf.ratingNote}</p>
                  <p className="font-mono text-ivory">WhatsApp : {chf.whatsapp}</p>
                  <p className="text-ivory-subtle">Langues : {chf.languages.join(', ')}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-obsidian-border bg-obsidian-card p-6">
              <h2 className="mb-4 font-serif text-xl font-bold text-ivory">
                Dispatch des Transferts Aéroport & Attribution Chauffeurs
              </h2>
              <div className="space-y-3">
                {db.airportTransfers.map((trf) => (
                  <div
                    key={trf.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-obsidian-border bg-obsidian p-4 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-champagne">
                        {trf.reference} • {trf.serviceType}
                      </span>
                      <p className="mt-0.5 font-semibold text-ivory">
                        Aéroport {trf.airportCode} (Vol {trf.flightNumber} — {trf.airline}) →{' '}
                        {trf.destinationAddress}
                      </p>
                      <p className="text-ivory-muted">
                        Client : {trf.customerName} ({trf.customerWhatsapp}) •{' '}
                        {trf.passengers} passagers • {trf.totalPriceMad} MAD
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-ivory-subtle">Chauffeur assigné :</span>
                      <select
                        value={trf.assignedChauffeurId || ''}
                        onChange={async (e) => {
                          await assignChauffeur(trf.id, e.target.value);
                          setAdminFeedback(
                            `Chauffeur assigné au transfert ${trf.reference}.`
                          );
                        }}
                        className="rounded-lg border border-obsidian-border bg-obsidian-card px-3 py-1.5 text-ivory"
                      >
                        {db.chauffeurs.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.fullName} ({c.availabilityStatus})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. FINANCIAL MANAGEMENT TAB */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-obsidian-border bg-obsidian-card p-6">
              <div>
                <h2 className="font-serif text-xl font-bold text-ivory">
                  Journal Financier, Séparation des Cautions & Remboursements
                </h2>
                <p className="text-xs text-ivory-muted">
                  Export comptable CSV conforme • Séparation stricte entre paiements de location et
                  dépôts de garantie.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportAccountingCsv}
                className="inline-flex items-center gap-2 rounded-xl bg-champagne px-4 py-2.5 text-xs font-bold text-obsidian"
              >
                <Download className="h-4 w-4" />
                Exporter les écritures comptables (.CSV)
              </button>
            </div>

            <div className="rounded-2xl border border-obsidian-border bg-obsidian-card p-6">
              <h3 className="mb-4 font-serif text-lg font-bold text-ivory">
                Transactions & Paiements ({db.payments.length})
              </h3>
              <div className="space-y-3">
                {db.payments.map((pay) => (
                  <div
                    key={pay.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-obsidian-border bg-obsidian p-4 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-champagne">
                        {pay.receiptNumber || pay.sessionId} • Réf : {pay.referenceCode}
                      </span>
                      <p className="mt-0.5 text-ivory">
                        Type : <strong>{pay.paymentType}</strong> • Passerelle : {pay.provider}
                      </p>
                      <p className="font-mono text-[11px] text-ivory-subtle">
                        Webhook vérifié : {pay.webhookVerified ? 'OUI (HMAC-SHA256)' : 'En attente'}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right font-mono">
                        <span className="block text-sm font-bold text-emerald-400">
                          {pay.amountMad} MAD
                        </span>
                        <span className="block text-[10px] text-ivory-subtle">
                          Caution séparée : {pay.refundableDepositHoldMad} MAD
                        </span>
                        <span className="uppercase text-champagne">{pay.status}</span>
                      </div>

                      {pay.status === 'paid' && (
                        <button
                          type="button"
                          onClick={async () => {
                            await issueRefund(
                              pay.id,
                              pay.amountMad,
                              'Remboursement administratif sur demande client'
                            );
                            setAdminFeedback(
                              `Remboursement de ${pay.amountMad} MAD traité sur ${pay.referenceCode}.`
                            );
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-950/40 px-3 py-2 font-semibold text-amber-200 hover:bg-amber-900/50"
                        >
                          <RefreshCcw className="h-3.5 w-3.5" />
                          Rembourser
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 6. CMS & BRAND SETTINGS TAB */}
        {activeTab === 'cms' && (
          <form
            onSubmit={handleSaveCms}
            className="rounded-2xl border border-champagne/30 bg-obsidian-card p-6 space-y-6 text-xs"
          >
            <div>
              <h2 className="font-serif text-xl font-bold text-ivory">
                CMS & Paramètres de Marque Dynamiques
              </h2>
              <p className="text-ivory-muted">
                Modifiez le nom de la compagnie, le logo, la couleur champagne-or, le numéro
                WhatsApp et les règles commerciales en direct.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-ivory-muted">Nom de la marque :</label>
                <input
                  type="text"
                  value={cmsBrandName}
                  onChange={(e) => setCmsBrandName(e.target.value)}
                  className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 text-ivory"
                />
              </div>
              <div>
                <label className="mb-1 block text-ivory-muted">Monogramme Logo :</label>
                <input
                  type="text"
                  value={cmsLogoText}
                  onChange={(e) => setCmsLogoText(e.target.value)}
                  className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 font-mono text-ivory"
                />
              </div>
              <div>
                <label className="mb-1 block text-ivory-muted">
                  Couleur Primaire Champagne-Or (Hex) :
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={cmsPrimaryColor}
                    onChange={(e) => setCmsPrimaryColor(e.target.value)}
                    className="h-10 w-14 rounded border border-obsidian-border bg-obsidian"
                  />
                  <input
                    type="text"
                    value={cmsPrimaryColor}
                    onChange={(e) => setCmsPrimaryColor(e.target.value)}
                    className="flex-1 rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 font-mono text-ivory"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-ivory-muted">Téléphone Agence :</label>
                <input
                  type="text"
                  value={cmsPhone}
                  onChange={(e) => setCmsPhone(e.target.value)}
                  className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 font-mono text-ivory"
                />
              </div>
              <div>
                <label className="mb-1 block text-ivory-muted">Numéro WhatsApp Conciergerie :</label>
                <input
                  type="text"
                  value={cmsWhatsapp}
                  onChange={(e) => setCmsWhatsapp(e.target.value)}
                  className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 font-mono text-ivory"
                />
              </div>
              <div>
                <label className="mb-1 block text-ivory-muted">Adresse Agence Kénitra :</label>
                <input
                  type="text"
                  value={cmsAddress}
                  onChange={(e) => setCmsAddress(e.target.value)}
                  className="w-full rounded-xl border border-obsidian-border bg-obsidian px-3.5 py-2.5 text-ivory"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-obsidian-border pt-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={cmsAllowArrival}
                  onChange={(e) => setCmsAllowArrival(e.target.checked)}
                  className="h-4 w-4 accent-champagne"
                />
                <span>Autoriser l&apos;option &quot;Paiement à l&apos;arrivée / livraison&quot;</span>
              </label>
            </div>

            <button
              type="submit"
              className="rounded-xl bg-champagne px-6 py-3 font-bold uppercase tracking-wider text-obsidian shadow-gold-glow"
            >
              Enregistrer et Appliquer à Toute la Plateforme
            </button>
          </form>
        )}

        {/* 7. SECURITY & AUDIT LOGS TAB */}
        {activeTab === 'audit' && (
          <div className="rounded-2xl border border-obsidian-border bg-obsidian-card p-6 space-y-4">
            <h2 className="font-serif text-xl font-bold text-ivory">
              Journal d&apos;Audit Immuable & Traçabilité Sécurité ({db.auditLogs.length} entrées)
            </h2>
            <div className="space-y-2.5">
              {db.auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-obsidian-border bg-obsidian px-4 py-3 text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-champagne">[{log.action}]</span>{' '}
                    <span className="text-ivory">{log.summary}</span>
                  </div>
                  <div className="font-mono text-[11px] text-ivory-subtle">
                    Rôle: {log.actorRole} • {log.createdAt.slice(0, 19).replace('T', ' ')} UTC
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ContractModal
        booking={contractBooking}
        initialTab="contract"
        onClose={() => setContractBooking(null)}
      />
    </div>
  );
};
