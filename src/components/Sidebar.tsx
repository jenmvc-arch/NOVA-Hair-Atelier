import React from 'react';
import { motion } from 'motion/react';

import { 
  DollarSign, 
  Calendar, 
  Users, 
  Settings as SettingsIcon, 
  Plus, 
  LayoutDashboard,
  QrCode,
  ListPlus,
  Building,
  Briefcase
} from 'lucide-react';
import { CompanyInfo } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewAppointmentClick: () => void;
  settingsSubTab?: 'payment' | 'sku' | 'company' | 'employee';
  onSelectSettingsSubTab?: (subTab: 'payment' | 'sku' | 'company' | 'employee') => void;
  companyInfo?: CompanyInfo;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  onNewAppointmentClick,
  settingsSubTab = 'payment',
  onSelectSettingsSubTab,
  companyInfo
 }: SidebarProps) {
  const primaryItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard }, 
    { id: 'pos', name: 'POS', icon: DollarSign },
    { id: 'appointments', name: 'Appointment', icon: Calendar }, 
    { id: 'clients', name: 'Client Management', icon: Users },
  ];

  const secondarySettingsItems = [
    { id: 'payment', name: 'Payment Setup', icon: QrCode },
    { id: 'sku', name: 'SKU Catalog', icon: ListPlus },
    { id: 'company', name: 'Company Profile', icon: Building },
    { id: 'employee', name: 'Employee Management', icon: Briefcase },
  ];

  return (
    <nav className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col gap-2 border-r border-nova-sand/10 bg-white p-6 shadow-sm md:flex">
      {/* Brand logo section */}
      <div className="mb-10 flex flex-col items-center justify-center pt-4 min-h-[130px]">
        {companyInfo?.logo ? (
          <div className="w-32 h-32 rounded-full border-2 border-nova-sand/20 bg-[#f7f4f2] overflow-hidden flex items-center justify-center p-0 shadow-sm hover:border-nova-sand/40 hover:shadow-md transition-all duration-300">
            <img 
              src={companyInfo.logo} 
              alt={companyInfo.name || "Company Logo"} 
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <>
            <h1 className="font-serif text-6xl font-black tracking-widest text-nova-choco">NOVA</h1>
            <p className="font-accent text-3.5xl text-nova-sand -mt-1.5 select-none">Hair Atelier</p>
          </>
        )}
      </div>

      {/* Primary Navigation tabs */}
      <div className="space-y-1.5">
        <span className="text-[9px] font-extrabold text-nova-choco/35 uppercase tracking-wider px-5">Workspace Apps</span>
        <ul className="flex flex-col gap-1.5">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-nova-sand/20 text-nova-choco font-semibold border border-nova-sand/30 shadow-sm'
                      : 'text-nova-choco/70 hover:bg-nova-beige/40 hover:text-nova-choco'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-nova-sand stroke-[2.5px]' : 'text-nova-choco/60'}`} />
                  <span className="font-sans text-xs tracking-wide font-medium">{item.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Secondary Navigation tabs */}
      <div className="space-y-1.5 mt-5">
        <div className="flex items-center gap-1.5 px-5">
          <SettingsIcon className="w-3 h-3 text-nova-choco/40" />
          <span className="text-[9px] font-extrabold text-nova-choco/35 uppercase tracking-wider">Configuration</span>
        </div>
        <ul className="flex flex-col gap-1.5">
          {secondarySettingsItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === 'settings' && settingsSubTab === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    if (onSelectSettingsSubTab) {
                      onSelectSettingsSubTab(item.id as 'payment' | 'sku' | 'company' | 'employee');
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-nova-sand/20 text-nova-choco font-semibold border border-nova-sand/30 shadow-sm'
                      : 'text-nova-choco/70 hover:bg-nova-beige/40 hover:text-nova-choco'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-nova-sand stroke-[2.5px]' : 'text-nova-choco/60'}`} />
                  <span className="font-sans text-xs tracking-wide font-medium">{item.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Bottom Action Quick Appointment */}
      <div className="mt-auto pt-6 border-t border-nova-sand/15">
        <button
          onClick={onNewAppointmentClick}
          className="w-full bg-nova-sand hover:bg-nova-sand/90 text-nova-choco py-3.5 px-4 rounded-full font-semibold text-sm tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[2.5px]" />
          <span>New Appointment</span>
        </button>
      </div>
    </nav>
  );
}
