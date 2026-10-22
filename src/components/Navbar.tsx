import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Car,
  Plane,
  ShieldCheck,
  UserCheck,
  Globe,
  Menu,
  X,
  PhoneCall,
  Sparkles,
  CalendarCheck,
  Compass,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { Language } from '../types/domain';

export const Navbar: React.FC = () => {
  const { db, language, setLanguage, t, currentUser, switchUserProfile } = usePlatform();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: t.nav.home, icon: Compass },
    { path: '/fleet', label: t.nav.fleet, icon: Car },
    { path: '/airport-chauffeur', label: t.nav.airportChauffeur, icon: Plane },
    { path: '/book', label: t.nav.booking, icon: CalendarCheck },
    { path: '/account', label: t.nav.customerPortal, icon: UserCheck },
    { path: '/admin', label: t.nav.admin, icon: ShieldCheck },
  ];

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <header className="sticky top-0 z-50 border-b border-obsidian-border bg-obsidian/90 backdrop-blur-xl">
      {/* Top Concierge Bar */}
      <div className="border-b border-obsidian-border/60 bg-obsidian-light/90 px-4 py-1.5 text-xs text-ivory-muted">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-champagne">
              <Sparkles className="h-3.5 w-3.5" />
              {db.companySettings.address}
            </span>
            <a
              href={`tel:${db.companySettings.phone.replace(/\s+/g, '')}`}
              className="hidden items-center gap-1.5 hover:text-champagne sm:inline-flex"
            >
              <PhoneCall className="h-3.5 w-3.5 text-champagne" />
              {db.companySettings.phone}
            </a>
          </div>

          <div className="flex items-center gap-3">
            {/* Role Switcher for Demo / Acceptance Testing */}
            <div className="flex items-center gap-1.5">
              <span className="hidden text-[11px] text-ivory-subtle md:inline">Session :</span>
              <select
                aria-label="Sélecteur de rôle de démonstration"
                value={currentUser?.id || 'guest'}
                onChange={(e) =>
                  switchUserProfile(e.target.value === 'guest' ? null : e.target.value)
                }
                className="rounded border border-obsidian-border bg-obsidian px-2 py-0.5 text-[11px] text-ivory focus:border-champagne focus:outline-none"
              >
                <option value="guest">Visiteur (Invité)</option>
                {db.profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName.split('—')[0].trim()} ({p.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Multilingual Switcher (FR / AR RTL / EN) */}
            <div className="flex items-center gap-1 rounded border border-obsidian-border bg-obsidian p-0.5">
              <Globe className="mx-1 h-3.5 w-3.5 text-champagne" />
              {(['fr', 'ar', 'en'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`rounded px-2 py-0.5 text-[11px] font-medium transition ${
                    language === lang
                      ? 'bg-champagne text-obsidian font-semibold'
                      : 'text-ivory-muted hover:text-ivory'
                  }`}
                >
                  {lang === 'fr' ? 'FR' : lang === 'ar' ? 'العربية' : 'EN'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-champagne/50 bg-gradient-to-br from-champagne/25 to-obsidian font-serif text-sm font-bold tracking-wider text-champagne shadow-gold-glow">
            {db.companySettings.logoText}
          </div>
          <div>
            <span className="block font-serif text-base font-bold tracking-wider text-ivory group-hover:text-champagne transition sm:text-lg">
              {db.companySettings.brandName}
            </span>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-champagne">
              Kénitra • Rabat • Casablanca
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium tracking-wide transition ${
                  active
                    ? 'bg-champagne/15 text-champagne border border-champagne/40'
                    : 'text-ivory-muted hover:bg-obsidian-card hover:text-ivory'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Primary CTA */}
        <div className="hidden items-center gap-2.5 sm:flex">
          <Link
            to="/book"
            className="rounded-lg bg-gradient-to-r from-champagne to-champagne-light px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-obsidian shadow-gold-glow transition hover:brightness-110"
          >
            {t.nav.bookNow}
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menu"
          className="rounded-lg border border-obsidian-border p-2 text-ivory lg:hidden"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-obsidian-border bg-obsidian-light px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive(item.path)
                      ? 'bg-champagne/15 text-champagne border border-champagne/30'
                      : 'text-ivory-muted hover:bg-obsidian-card'
                  }`}
                >
                  <Icon className="h-4 w-4 text-champagne" />
                  {item.label}
                </Link>
              );
            })}
            <Link
              to="/book"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 rounded-lg bg-champagne py-3 text-center text-sm font-bold text-obsidian"
            >
              {t.nav.bookNow}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
