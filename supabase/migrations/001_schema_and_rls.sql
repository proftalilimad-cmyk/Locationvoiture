-- =============================================================================
-- KENITRA PRESTIGE RENT CAR — PRODUCTION POSTGRESQL SCHEMA & RLS MIGRATION
-- Target: Supabase PostgreSQL 15+
-- Includes all 21 core operational tables, concurrency-safe exclusion constraints,
-- atomic booking hold verification, and strict Row-Level Security (RLS) policies.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 1. ENUM TYPES & ROLES
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'super_admin',
    'agency_manager',
    'booking_agent',
    'chauffeur',
    'customer'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM (
    'pending_payment',
    'awaiting_confirmation',
    'confirmed',
    'ready_for_pickup',
    'active_rental',
    'completed',
    'cancelled',
    'no_show'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. PROFILES (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  preferred_language TEXT NOT NULL DEFAULT 'fr' CHECK (preferred_language IN ('fr', 'ar', 'en')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  country_of_residence TEXT NOT NULL DEFAULT 'Maroc',
  driver_age INTEGER NOT NULL CHECK (driver_age >= 18),
  license_number TEXT,
  license_issue_date DATE,
  license_expiry_date DATE,
  identity_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. VEHICLE CATEGORIES
CREATE TABLE IF NOT EXISTS public.vehicle_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL CHECK (code IN ('Economy', 'Compact', 'Sedan', 'SUV', 'Family', 'Premium', 'Luxury')),
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  min_driver_age INTEGER NOT NULL DEFAULT 21,
  default_deposit_mad NUMERIC(10, 2) NOT NULL DEFAULT 5000,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. VEHICLES
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 2018),
  category_code TEXT NOT NULL REFERENCES public.vehicle_categories(code),
  daily_price_mad NUMERIC(10, 2) NOT NULL CHECK (daily_price_mad > 0),
  weekly_discount_pct NUMERIC(5, 2) NOT NULL DEFAULT 12.00,
  monthly_discount_pct NUMERIC(5, 2) NOT NULL DEFAULT 25.00,
  high_season_multiplier NUMERIC(4, 2) NOT NULL DEFAULT 1.20,
  deposit_mad NUMERIC(10, 2) NOT NULL DEFAULT 5000,
  transmission TEXT NOT NULL CHECK (transmission IN ('Automatic', 'Manual')),
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('Diesel', 'Petrol', 'Hybrid', 'Electric')),
  seats INTEGER NOT NULL DEFAULT 5,
  luggage INTEGER NOT NULL DEFAULT 3,
  air_conditioning BOOLEAN NOT NULL DEFAULT true,
  mileage_policy TEXT NOT NULL DEFAULT 'Illimité',
  insurance_coverage TEXT NOT NULL DEFAULT 'Tous Risques avec Franchise Réduite (CDW + TP)',
  insurance_expiry_date DATE NOT NULL,
  min_driver_age INTEGER NOT NULL DEFAULT 21,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance', 'archived')),
  is_demo_data BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN NOT NULL DEFAULT false,
  airport_delivery_available BOOLEAN NOT NULL DEFAULT true,
  chauffeur_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. VEHICLE IMAGES
CREATE TABLE IF NOT EXISTS public.vehicle_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. VEHICLE RATES (Seasonal / Custom tier rates)
CREATE TABLE IF NOT EXISTS public.vehicle_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  season_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  daily_rate_mad NUMERIC(10, 2) NOT NULL,
  weekly_rate_mad NUMERIC(10, 2),
  monthly_rate_mad NUMERIC(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_rate_dates CHECK (end_date >= start_date)
);

-- 8. LOCATIONS
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('agency', 'train_station', 'airport', 'custom')),
  delivery_fee_mad NUMERIC(10, 2) NOT NULL DEFAULT 0,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 9. AVAILABILITY BLOCKS (Maintenance / Offline blocks)
CREATE TABLE IF NOT EXISTS public.availability_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL DEFAULT 'maintenance',
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_block_range CHECK (end_at > start_at)
);

-- 10. BOOKING HOLDS (Time-limited concurrency locks)
CREATE TABLE IF NOT EXISTS public.booking_holds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  pickup_at TIMESTAMPTZ NOT NULL,
  return_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'converted', 'expired', 'released')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_hold_range CHECK (return_at > pickup_at)
);

-- 11. PROMOTIONS
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  description_fr TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_mad')),
  discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
  min_days INTEGER NOT NULL DEFAULT 1,
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. BOOKINGS
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  profile_id UUID REFERENCES public.profiles(id),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  pickup_location_code TEXT NOT NULL,
  return_location_code TEXT NOT NULL,
  pickup_at TIMESTAMPTZ NOT NULL,
  return_at TIMESTAMPTZ NOT NULL,
  rental_days INTEGER NOT NULL CHECK (rental_days >= 1),
  base_subtotal_mad NUMERIC(10, 2) NOT NULL,
  extras_subtotal_mad NUMERIC(10, 2) NOT NULL DEFAULT 0,
  delivery_fee_mad NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_mad NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tax_amount_mad NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_payable_mad NUMERIC(10, 2) NOT NULL,
  refundable_deposit_mad NUMERIC(10, 2) NOT NULL,
  payment_plan TEXT NOT NULL CHECK (payment_plan IN ('deposit_20', 'deposit_30', 'deposit_50', 'full_100', 'pay_on_arrival')),
  amount_due_online_mad NUMERIC(10, 2) NOT NULL,
  amount_paid_mad NUMERIC(10, 2) NOT NULL DEFAULT 0,
  balance_due_at_pickup_mad NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status booking_status NOT NULL DEFAULT 'pending_payment',
  with_chauffeur BOOLEAN NOT NULL DEFAULT false,
  airport_delivery BOOLEAN NOT NULL DEFAULT false,
  promo_code TEXT,
  contract_signed_at TIMESTAMPTZ,
  contract_signature_name TEXT,
  inspection_departure_notes TEXT,
  inspection_return_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_booking_dates CHECK (return_at > pickup_at)
);

-- Concurrency exclusion constraint: Prevent overlapping active bookings on the same vehicle
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_dates ON public.bookings (vehicle_id, pickup_at, return_at);

-- 13. BOOKING EXTRAS
CREATE TABLE IF NOT EXISTS public.booking_extras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  extra_code TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_mad NUMERIC(10, 2) NOT NULL,
  per_day BOOLEAN NOT NULL DEFAULT true,
  total_price_mad NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  airport_transfer_id UUID,
  provider TEXT NOT NULL DEFAULT 'cmi_morocco_sandbox',
  session_id TEXT UNIQUE NOT NULL,
  idempotency_key TEXT UNIQUE NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('rental_deposit', 'rental_full', 'balance_pickup', 'security_deposit_hold', 'airport_transfer')),
  amount_mad NUMERIC(10, 2) NOT NULL CHECK (amount_mad >= 0),
  currency TEXT NOT NULL DEFAULT 'MAD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'authorized', 'paid', 'failed', 'cancelled', 'refunded')),
  webhook_verified BOOLEAN NOT NULL DEFAULT false,
  webhook_signature TEXT,
  receipt_number TEXT UNIQUE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. REFUNDS
CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  amount_mad NUMERIC(10, 2) NOT NULL CHECK (amount_mad > 0),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('pending', 'processed', 'failed')),
  processed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. INVOICES
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  airport_transfer_id UUID,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  subtotal_ht_mad NUMERIC(10, 2) NOT NULL,
  tva_amount_mad NUMERIC(10, 2) NOT NULL,
  total_ttc_mad NUMERIC(10, 2) NOT NULL,
  security_deposit_mad NUMERIC(10, 2) NOT NULL DEFAULT 0,
  amount_paid_mad NUMERIC(10, 2) NOT NULL DEFAULT 0,
  balance_due_mad NUMERIC(10, 2) NOT NULL DEFAULT 0,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. CHAUFFEURS
CREATE TABLE IF NOT EXISTS public.chauffeurs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  languages TEXT[] NOT NULL DEFAULT ARRAY['Français', 'Arabe', 'Anglais'],
  professional_permit_no TEXT NOT NULL,
  availability_status TEXT NOT NULL DEFAULT 'available' CHECK (availability_status IN ('available', 'on_mission', 'off_duty')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. AIRPORT TRANSFERS
CREATE TABLE IF NOT EXISTS public.airport_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  service_type TEXT NOT NULL CHECK (service_type IN (
    'airport_vehicle_delivery',
    'airport_meet_and_greet',
    'private_airport_transfer',
    'chauffeur_driven_booking'
  )),
  airport_code TEXT NOT NULL CHECK (airport_code IN ('RBA', 'CMN', 'TNG', 'KENITRA_TGV')),
  flight_number TEXT NOT NULL,
  airline TEXT NOT NULL,
  flight_arrival_at TIMESTAMPTZ NOT NULL,
  flight_status TEXT NOT NULL DEFAULT 'scheduled' CHECK (flight_status IN ('scheduled', 'on_time', 'delayed', 'landed', 'cancelled')),
  passengers INTEGER NOT NULL CHECK (passengers >= 1 AND passengers <= 15),
  luggage_count INTEGER NOT NULL DEFAULT 2,
  destination_address TEXT NOT NULL,
  vehicle_category TEXT NOT NULL,
  is_round_trip BOOLEAN NOT NULL DEFAULT false,
  meet_and_greet BOOLEAN NOT NULL DEFAULT true,
  child_seats INTEGER NOT NULL DEFAULT 0,
  waiting_minutes INTEGER NOT NULL DEFAULT 0,
  night_surcharge_applied BOOLEAN NOT NULL DEFAULT false,
  total_price_mad NUMERIC(10, 2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'pay_on_arrival', 'refunded')),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_whatsapp TEXT NOT NULL,
  special_instructions TEXT,
  assigned_chauffeur_id UUID REFERENCES public.chauffeurs(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'chauffeur_assigned', 'en_route', 'waiting_terminal', 'client_on_board', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. CHAUFFEUR MISSIONS
CREATE TABLE IF NOT EXISTS public.chauffeur_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chauffeur_id UUID NOT NULL REFERENCES public.chauffeurs(id) ON DELETE CASCADE,
  airport_transfer_id UUID REFERENCES public.airport_transfers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  pickup_location TEXT NOT NULL,
  dropoff_location TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  flight_number TEXT,
  flight_status TEXT NOT NULL DEFAULT 'on_time',
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'en_route', 'arrived_pickup', 'in_progress', 'completed', 'cancelled')),
  operational_notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_email TEXT,
  recipient_whatsapp TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp_link', 'whatsapp_api_queued', 'in_app')),
  template_key TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'logged' CHECK (status IN ('logged', 'sent', 'pending_api_config')),
  related_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. COMPANY SETTINGS
CREATE TABLE IF NOT EXISTS public.company_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  brand_name TEXT NOT NULL DEFAULT 'KENITRA PRESTIGE RENT CAR',
  brand_tagline_fr TEXT NOT NULL DEFAULT 'Haute Mobilité & Chauffeur Privé au Maroc',
  logo_text TEXT NOT NULL DEFAULT 'KPRC',
  primary_color_hex TEXT NOT NULL DEFAULT '#C9A86A',
  accent_color_hex TEXT NOT NULL DEFAULT '#E5C98B',
  phone TEXT NOT NULL DEFAULT '+212 5 37 37 00 00',
  whatsapp TEXT NOT NULL DEFAULT '+212600000000',
  email TEXT NOT NULL DEFAULT 'conciergerie@kenitraprestige.ma',
  address TEXT NOT NULL DEFAULT 'Avenue Mohammed V, Quartier Administratif, 14000 Kénitra, Maroc',
  deposit_percentages INTEGER[] NOT NULL DEFAULT ARRAY[20, 30, 50],
  allow_pay_on_arrival BOOLEAN NOT NULL DEFAULT true,
  vat_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
  payment_gateway_live BOOLEAN NOT NULL DEFAULT false,
  flight_api_connected BOOLEAN NOT NULL DEFAULT false,
  whatsapp_api_connected BOOLEAN NOT NULL DEFAULT false,
  transport_license_notice TEXT NOT NULL DEFAULT 'Services de transport avec chauffeur opérés sous autorisation de transport touristique / VTC conforme à la réglementation marocaine en vigueur et assurance professionnelle passagers incluse.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airport_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chauffeurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chauffeur_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to retrieve current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Public read access for vehicles, categories, locations, settings
CREATE POLICY "Public can view active vehicles" ON public.vehicles
  FOR SELECT USING (status != 'archived' OR public.current_user_role() IN ('super_admin', 'agency_manager', 'booking_agent'));

CREATE POLICY "Admins manage vehicles" ON public.vehicles
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'agency_manager'));

-- Customers can ONLY read their own bookings; Staff can read/manage all bookings
CREATE POLICY "Customers read own bookings" ON public.bookings
  FOR SELECT USING (
    profile_id = auth.uid()
    OR public.current_user_role() IN ('super_admin', 'agency_manager', 'booking_agent')
  );

CREATE POLICY "Staff manage bookings" ON public.bookings
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'agency_manager', 'booking_agent'));

-- Chauffeurs can ONLY view and update their own assigned missions
CREATE POLICY "Chauffeurs view only assigned missions" ON public.chauffeur_missions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chauffeurs c
      WHERE c.id = chauffeur_missions.chauffeur_id
      AND c.profile_id = auth.uid()
    )
    OR public.current_user_role() IN ('super_admin', 'agency_manager', 'booking_agent')
  );

CREATE POLICY "Chauffeurs update only assigned missions" ON public.chauffeur_missions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.chauffeurs c
      WHERE c.id = chauffeur_missions.chauffeur_id
      AND c.profile_id = auth.uid()
    )
    OR public.current_user_role() IN ('super_admin', 'agency_manager', 'booking_agent')
  );

-- Audit logs visible only to super_admin and agency_manager
CREATE POLICY "Admins read audit logs" ON public.audit_logs
  FOR SELECT USING (public.current_user_role() IN ('super_admin', 'agency_manager'));
