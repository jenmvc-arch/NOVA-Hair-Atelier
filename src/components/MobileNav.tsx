import React, { useState } from 'react';
import {
  BarChart3,
  Briefcase,
  Building,
  Calendar,
  ChevronRight,
  DollarSign,
  LayoutDashboard,
  ListPlus,
  MoreHorizontal,
  PackageSearch,
  Plus,
  QrCode,
  Settings,
  Users,
  X,
} from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewAppointmentClick: () => void;
  settingsSubTab: 'payment' | 'sku' | 'company' | 'employee';
  onSelectSettingsSubTab: (subTab: 'payment' | 'sku' | 'company' | 'employee') => void;
  onOpenInventory: () => void;
  onOpenReports: () => void;
}

const primaryItems = [
  { id: 'dashboard', name: 'Home', icon: LayoutDashboard },
  { id: 'pos', name: 'POS', icon: DollarSign },
  { id: 'appointments', name: 'Bookings', icon: Calendar },
  { id: 'clients', name: 'Clients', icon: Users },
];

const settingsItems = [
  { id: 'payment', name: 'Payment Setup', icon: QrCode },
  { id: 'sku', name: 'SKU Catalog', icon: ListPlus },
  { id: 'company', name: 'Company Profile', icon: Building },
  { id: 'employee', name: 'Employees', icon: Briefcase },
] as const;

export default function MobileNav({
  activeTab,
  setActiveTab,
  onNewAppointmentClick,
  settingsSubTab,
  onSelectSettingsSubTab,
  onOpenInventory,
  onOpenReports,
}: MobileNavProps) {
  const [showMore, setShowMore] = useState(false);

  const openPrimaryTab = (tab: string) => {
    setActiveTab(tab);
    setShowMore(false);
  };

  const openSettings = (subTab: MobileNavProps['settingsSubTab']) => {
    setActiveTab('settings');
    onSelectSettingsSubTab(subTab);
    setShowMore(false);
  };

  return (
    <>
      {showMore && (
        <div
          className="fixed inset-0 z-[60] bg-nova-choco/35 backdrop-blur-sm md:hidden"
          onClick={() => setShowMore(false)}
        >
          <section
            className="absolute inset-x-0 bottom-0 rounded-t-[2rem] bg-white p-5 shadow-2xl"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-nova-choco/40">
                  Atelier Tools
                </p>
                <h2 className="mt-1 font-serif text-xl font-bold text-nova-choco">More Workspace</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowMore(false)}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-nova-beige/50 text-nova-choco"
                aria-label="Close more menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  onNewAppointmentClick();
                  setShowMore(false);
                }}
                className="flex min-h-14 items-center gap-3 rounded-2xl bg-nova-sand px-4 text-left text-sm font-bold text-nova-choco"
              >
                <Plus className="h-5 w-5" />
                <span>New Appointment</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenInventory();
                  setShowMore(false);
                }}
                className="flex min-h-14 items-center gap-3 rounded-2xl border border-nova-sand/25 bg-nova-beige/25 px-4 text-left text-sm font-bold text-nova-choco"
              >
                <PackageSearch className="h-5 w-5 text-nova-sand" />
                <span>Inventory</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenReports();
                  setShowMore(false);
                }}
                className="flex min-h-14 items-center gap-3 rounded-2xl border border-nova-sand/25 bg-nova-beige/25 px-4 text-left text-sm font-bold text-nova-choco"
              >
                <BarChart3 className="h-5 w-5 text-nova-sand" />
                <span>Reports</span>
              </button>
              <button
                type="button"
                onClick={() => openSettings(settingsSubTab)}
                className="flex min-h-14 items-center gap-3 rounded-2xl border border-nova-sand/25 bg-nova-beige/25 px-4 text-left text-sm font-bold text-nova-choco"
              >
                <Settings className="h-5 w-5 text-nova-sand" />
                <span>Settings</span>
              </button>
            </div>

            <div className="mt-6 border-t border-nova-sand/15 pt-5">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-nova-choco/40">
                <Settings className="h-3.5 w-3.5" />
                <span>Configuration</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {settingsItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === 'settings' && settingsSubTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openSettings(item.id)}
                      className={`flex min-h-12 items-center justify-between rounded-xl px-3 text-left text-xs font-bold ${
                        isActive
                          ? 'bg-nova-sand/20 text-nova-choco'
                          : 'bg-nova-light text-nova-choco/70'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-nova-sand" />
                        {item.name}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 opacity-40" />
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-nova-sand/20 bg-white/95 shadow-[0_-8px_30px_rgba(67,44,26,0.08)] backdrop-blur-md md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Mobile navigation"
      >
        <div className="grid grid-cols-5">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openPrimaryTab(item.id)}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-extrabold ${
                  isActive ? 'text-nova-choco' : 'text-nova-choco/45'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span
                  className={`flex h-8 w-12 items-center justify-center rounded-full ${
                    isActive ? 'bg-nova-sand/25 text-nova-sand' : ''
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span>{item.name}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setShowMore(true)}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-extrabold ${
              showMore || activeTab === 'settings' ? 'text-nova-choco' : 'text-nova-choco/45'
            }`}
            aria-expanded={showMore}
          >
            <span
              className={`flex h-8 w-12 items-center justify-center rounded-full ${
                showMore || activeTab === 'settings' ? 'bg-nova-sand/25 text-nova-sand' : ''
              }`}
            >
              <MoreHorizontal className="h-5 w-5" />
            </span>
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
