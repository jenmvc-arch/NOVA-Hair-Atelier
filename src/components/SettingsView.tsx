import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Plus, 
  Trash2, 
  ListPlus, 
  Sparkles, 
  QrCode, 
  Upload, 
  Check, 
  Trash,
  Building,
  MapPin,
  Clock,
  Phone,
  FileText,
  Image as ImageIcon,
  Briefcase,
  UserPlus,
  Edit2,
  X,
  Power,
  Database,
  Cloud
} from 'lucide-react';
import { CatalogItem, PaymentConfig, CompanyInfo, DailyOperatingHour, Employee, PaymentMethodItem } from '../types';
import { uploadFileToStorage, isSupabaseConfigured } from '../lib/supabase';

const TIME_OPTIONS = [
  '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM',
  '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM', '10:00 PM', '10:30 PM', '11:00 PM'
];

function generateHoursSummary(hours: DailyOperatingHour[]): string {
  if (!hours || hours.length === 0) return 'Closed All Days';
  const openDays = hours.filter(h => h.isOpen);
  if (openDays.length === 0) return 'Closed All Days';
  
  const firstOpen = openDays[0];
  const sameHours = openDays.every(h => h.openTime === firstOpen.openTime && h.closeTime === firstOpen.closeTime);
  
  if (sameHours && openDays.length === 7) {
    return `${firstOpen.openTime} - ${firstOpen.closeTime} Daily`;
  } else if (sameHours && openDays.length === 6 && !hours.find(h => h.day === 'Sunday')?.isOpen) {
    return `${firstOpen.openTime} - ${firstOpen.closeTime} Mon-Sat (Sun: Rest)`;
  }
  
  return hours.map(h => `${h.day.slice(0,3)}: ${h.isOpen ? `${h.openTime}-${h.closeTime}` : 'Rest'}`).join(', ');
}

interface SettingsViewProps {
  paymentConfig: PaymentConfig;
  onUpdatePaymentConfig: (config: PaymentConfig) => void;
  catalog: CatalogItem[];
  onAddCatalogItem: (item: Omit<CatalogItem, 'id'>) => void;
  onRemoveCatalogItem: (id: string) => void;
  companyInfo: CompanyInfo;
  onUpdateCompanyInfo: (info: CompanyInfo) => void;
  employees: Employee[];
  onUpdateEmployees: (employees: Employee[]) => void;
  initialSubTab?: 'payment' | 'sku' | 'company' | 'employee';
  onSubTabChange?: (subTab: 'payment' | 'sku' | 'company' | 'employee') => void;
  persistenceStatus?: 'loading' | 'supabase' | 'local';
}

export default function SettingsView({
  paymentConfig,
  onUpdatePaymentConfig,
  catalog,
  onAddCatalogItem,
  onRemoveCatalogItem,
  companyInfo,
  onUpdateCompanyInfo,
  employees,
  onUpdateEmployees,
  initialSubTab,
  onSubTabChange,
  persistenceStatus = 'local',
}: SettingsViewProps) {
  // Settings view split states
  const [subTab, setSubTab] = useState<'payment' | 'sku' | 'company' | 'employee'>('payment');

  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const changeSubTab = (tab: 'payment' | 'sku' | 'company' | 'employee') => {
    setSubTab(tab);
    if (onSubTabChange) {
      onSubTabChange(tab);
    }
  };

  // Payment Config States
  const [localConfig, setLocalConfig] = useState<PaymentConfig>({
    bankName: '',
    accountName: '',
    accountNo: '',
    duitNowQR: '',
    tngQR: '',
  });

  // Sync prop config on load
  useEffect(() => {
    setLocalConfig(paymentConfig);
  }, [paymentConfig]);

  // Custom Payment Methods form state
  const [editingMethodId, setEditingMethodId] = useState<string | null>(null);
  const [methodFormName, setMethodFormName] = useState('');
  const [methodFormType, setMethodFormType] = useState<'QR' | 'Bank Transfer' | 'Card' | 'Digital Wallet' | 'Cash' | 'Other'>('Card');
  const [methodFormDetails, setMethodFormDetails] = useState('');
  const [methodFormEnabled, setMethodFormEnabled] = useState(true);

  const updateAndSaveConfig = (newConfig: PaymentConfig) => {
    setLocalConfig(newConfig);
    onUpdatePaymentConfig(newConfig);
  };

  const handleAddOrEditMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!methodFormName.trim()) {
      alert('Please enter a payment method name.');
      return;
    }

    const currentMethods = localConfig.customMethods || [];
    let updatedConfig = { ...localConfig };

    if (editingMethodId) {
      // Editing
      const updated = currentMethods.map(m => {
        if (m.id === editingMethodId) {
          return {
            ...m,
            name: methodFormName.trim(),
            type: methodFormType,
            details: methodFormDetails.trim() || undefined,
            isEnabled: methodFormEnabled,
          };
        }
        return m;
      });
      updatedConfig.customMethods = updated;
      setEditingMethodId(null);
    } else {
      // Adding new
      const newMethod: PaymentMethodItem = {
        id: `pay_${Date.now()}`,
        name: methodFormName.trim(),
        type: methodFormType,
        details: methodFormDetails.trim() || undefined,
        isEnabled: methodFormEnabled,
      };
      updatedConfig.customMethods = [...currentMethods, newMethod];
    }

    updateAndSaveConfig(updatedConfig);

    // Reset form
    setMethodFormName('');
    setMethodFormType('Card');
    setMethodFormDetails('');
    setMethodFormEnabled(true);
  };

  const handleDeleteMethod = (id: string) => {
    if (confirm('Are you sure you want to delete this payment method?')) {
      const currentMethods = localConfig.customMethods || [];
      const filtered = currentMethods.filter(m => m.id !== id);
      const updatedConfig = {
        ...localConfig,
        customMethods: filtered,
      };
      updateAndSaveConfig(updatedConfig);
      if (editingMethodId === id) {
        setEditingMethodId(null);
        setMethodFormName('');
        setMethodFormType('Card');
        setMethodFormDetails('');
        setMethodFormEnabled(true);
      }
    }
  };

  const handleToggleMethod = (id: string) => {
    const currentMethods = localConfig.customMethods || [];
    const updated = currentMethods.map(m => {
      if (m.id === id) {
        return { ...m, isEnabled: !m.isEnabled };
      }
      return m;
    });
    const updatedConfig = {
      ...localConfig,
      customMethods: updated,
    };
    updateAndSaveConfig(updatedConfig);
  };

  const handleStartEditMethod = (method: PaymentMethodItem) => {
    setEditingMethodId(method.id);
    setMethodFormName(method.name);
    setMethodFormType(method.type);
    setMethodFormDetails(method.details || '');
    setMethodFormEnabled(method.isEnabled);
  };

  const handleCancelEditMethod = () => {
    setEditingMethodId(null);
    setMethodFormName('');
    setMethodFormType('Card');
    setMethodFormDetails('');
    setMethodFormEnabled(true);
  };

  // Catalog Item States
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemSKU, setItemSKU] = useState('');
  const [itemCategory, setItemCategory] = useState<'Services' | 'Retail'>('Services');
  const [itemImage, setItemImage] = useState('');

  // Company Info states
  const [compName, setCompName] = useState('');
  const [compAddress, setCompAddress] = useState('');
  const [compHours, setCompHours] = useState('');
  const [compSSM, setCompSSM] = useState('');
  const [compContact, setCompContact] = useState('');
  const [compLogo, setCompLogo] = useState('');
  const [compDailyHours, setCompDailyHours] = useState<DailyOperatingHour[]>([]);

  // Sync company info states on load
  useEffect(() => {
    if (companyInfo) {
      setCompName(companyInfo.name || '');
      setCompAddress(companyInfo.address || '');
      setCompHours(companyInfo.operatingHours || '');
      setCompSSM(companyInfo.ssmNumber || '');
      setCompContact(companyInfo.contactInfo || '');
      setCompLogo(companyInfo.logo || '');
      setCompDailyHours(companyInfo.dailyHours || [
        { day: 'Monday', isOpen: true, openTime: '10:00 AM', closeTime: '08:00 PM' },
        { day: 'Tuesday', isOpen: true, openTime: '10:00 AM', closeTime: '08:00 PM' },
        { day: 'Wednesday', isOpen: true, openTime: '10:00 AM', closeTime: '08:00 PM' },
        { day: 'Thursday', isOpen: true, openTime: '10:00 AM', closeTime: '08:00 PM' },
        { day: 'Friday', isOpen: true, openTime: '10:00 AM', closeTime: '08:00 PM' },
        { day: 'Saturday', isOpen: true, openTime: '10:00 AM', closeTime: '08:00 PM' },
        { day: 'Sunday', isOpen: false, openTime: '10:00 AM', closeTime: '08:00 PM' },
      ]);
    }
  }, [companyInfo]);

  // Employee Form States
  const [empName, setEmpName] = useState('');
  const [empGender, setEmpGender] = useState('Female');
  const [empPosition, setEmpPosition] = useState('');
  const [empType, setEmpType] = useState('Full-Time');

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim() || !empPosition.trim()) {
      alert('Please fill out all employee details.');
      return;
    }
    const newEmp: Employee = {
      id: `emp_${Date.now()}`,
      name: empName.trim(),
      gender: empGender,
      position: empPosition.trim(),
      employmentType: empType,
    };
    onUpdateEmployees([...employees, newEmp]);
    setEmpName('');
    setEmpPosition('');
    alert(`Successfully added ${newEmp.name} to the registry.`);
  };

  const handleRemoveEmployee = (id: string) => {
    if (confirm('Are you sure you want to remove this employee from the registry?')) {
      const remaining = employees.filter(emp => emp.id !== id);
      onUpdateEmployees(remaining);
    }
  };

  const handleSavePaymentConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePaymentConfig(localConfig);
    alert('Atelier payment channels updated successfully!');
  };

  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'duitNowQR' | 'tngQR') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadFileToStorage(file, 'app-assets');
      setLocalConfig(prev => ({
        ...prev,
        [field]: url
      }));
    } catch (err) {
      console.error('Failed uploading QR code image:', err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, field: 'duitNowQR' | 'tngQR') => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    try {
      const url = await uploadFileToStorage(file, 'app-assets');
      setLocalConfig(prev => ({
        ...prev,
        [field]: url
      }));
    } catch (err) {
      console.error('Failed uploading QR code image on drop:', err);
    }
  };

  const handleClearQR = (field: 'duitNowQR' | 'tngQR') => {
    setLocalConfig(prev => ({
      ...prev,
      [field]: ''
    }));
  };

  const handleItemImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadFileToStorage(file, 'app-assets');
      setItemImage(url);
    } catch (err) {
      console.error('Failed uploading catalog item image:', err);
    }
  };

  const handleAddCatalogItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !itemPrice) {
      alert('Please fill out item details.');
      return;
    }
    const priceNum = parseFloat(itemPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Please enter a valid price.');
      return;
    }

    onAddCatalogItem({
      name: itemName.trim(),
      price: priceNum,
      category: itemCategory,
      sku: itemSKU.trim() || undefined,
      image: itemImage || undefined,
    });

    setItemName('');
    setItemPrice('');
    setItemSKU('');
    setItemImage('');
    alert(`"${itemName}" successfully added to the Salon Catalogue!`);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadFileToStorage(file, 'app-assets');
      setCompLogo(url);
    } catch (err) {
      console.error('Failed uploading company logo:', err);
    }
  };

  const handleSaveCompanyInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCompanyInfo({
      name: compName,
      address: compAddress,
      operatingHours: compHours,
      ssmNumber: compSSM,
      contactInfo: compContact,
      logo: compLogo,
      dailyHours: compDailyHours,
    });
    alert('Company profile updated successfully!');
  };

  return (
    <div className="space-y-5 font-sans animate-fade-in md:space-y-6">
      {/* Sub-tab Selection Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-nova-sand/15 pb-4 gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-nova-choco">Atelier System Control Panel</h2>
          <p className="text-xs text-nova-choco/60 mt-0.5">Configure operational payment channels, custom SKU catalogue registries, or company profile metadata.</p>
        </div>

      </div>

      {subTab === 'payment' && (
        <div className="mx-auto max-w-2xl space-y-5 animate-fade-in md:space-y-6">
          <div className="rounded-3xl border border-nova-sand/15 bg-white p-4 shadow-sm md:p-6">
            <h3 className="font-serif text-lg font-semibold mb-5 text-nova-choco flex items-center gap-2">
              <QrCode className="w-5 h-5 text-nova-sand stroke-[2.2px]" />
              <span>Manage Payment Methods</span>
            </h3>

            <form onSubmit={handleSavePaymentConfig} className="space-y-5">
              {/* Bank account details form */}
              <div className="bg-nova-light/40 border border-nova-sand/10 rounded-2xl p-4 space-y-4">
                <span className="text-[10px] font-bold text-nova-choco/45 uppercase tracking-wider block border-b border-nova-sand/10 pb-1">
                  Atelier Bank Transfer Ledger
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold mb-1.5 text-nova-choco/70 uppercase tracking-wide">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={localConfig.bankName}
                      onChange={(e) => setLocalConfig({ ...localConfig, bankName: e.target.value })}
                      className="w-full px-4 py-2 rounded-full border border-nova-sand/30 text-xs font-sans text-nova-choco bg-white focus:outline-none focus:border-nova-choco"
                      placeholder="e.g. Maybank, CIMB"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold mb-1.5 text-nova-choco/70 uppercase tracking-wide">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={localConfig.accountName}
                      onChange={(e) => setLocalConfig({ ...localConfig, accountName: e.target.value })}
                      className="w-full px-4 py-2 rounded-full border border-nova-sand/30 text-xs font-sans text-nova-choco bg-white focus:outline-none focus:border-nova-choco"
                      placeholder="e.g. NOVA Hair Atelier"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold mb-1.5 text-nova-choco/70 uppercase tracking-wide">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={localConfig.accountNo}
                    onChange={(e) => setLocalConfig({ ...localConfig, accountNo: e.target.value })}
                    className="w-full px-4 py-2 rounded-full border border-nova-sand/30 text-xs font-sans text-nova-choco bg-white focus:outline-none focus:border-nova-choco font-mono"
                    placeholder="e.g. 514012345678"
                  />
                </div>
              </div>

              {/* QR Codes Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* DuitNow QR Upload */}
                <div className="bg-nova-light/40 border border-nova-sand/10 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#E11383] uppercase tracking-wider block border-b border-[#E11383]/10 pb-1 mb-3">
                      DuitNow QR Merchant Code
                    </span>
                    
                    {localConfig.duitNowQR ? (
                      <div className="flex flex-col items-center gap-2 bg-white p-3 rounded-xl border border-nova-sand/15 relative group">
                        <img src={localConfig.duitNowQR} alt="DuitNow QR" className="w-28 h-28 object-contain rounded" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={() => handleClearQR('duitNowQR')}
                          className="absolute top-2 right-2 p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-colors"
                          title="Delete QR image"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[9px] text-green-700 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[2.5px]" /> Custom QR Loaded
                        </span>
                      </div>
                    ) : (
                      <div
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, 'duitNowQR')}
                        className="border-2 border-dashed border-nova-sand/30 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-nova-choco bg-white transition-colors h-36 relative"
                      >
                        <Upload className="w-5 h-5 text-nova-sand mb-1.5" />
                        <p className="text-[10px] font-semibold text-nova-choco/70">Drag & Drop DuitNow QR</p>
                        <p className="text-[9px] text-nova-choco/40 mt-0.5">or click to browse files</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleQRUpload(e, 'duitNowQR')}
                          className="hidden"
                          id="duitnow-qr-file"
                        />
                        <label htmlFor="duitnow-qr-file" className="absolute inset-0 cursor-pointer w-full h-full" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Touch & Go QR Upload */}
                <div className="bg-nova-light/40 border border-nova-sand/10 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#005CA9] uppercase tracking-wider block border-b border-[#005CA9]/10 pb-1 mb-3">
                      Touch & Go QR Code
                    </span>
                    
                    {localConfig.tngQR ? (
                      <div className="flex flex-col items-center gap-2 bg-white p-3 rounded-xl border border-nova-sand/15 relative group">
                        <img src={localConfig.tngQR} alt="Touch & Go QR" className="w-28 h-28 object-contain rounded" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={() => handleClearQR('tngQR')}
                          className="absolute top-2 right-2 p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-colors"
                          title="Delete QR image"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[9px] text-green-700 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[2.5px]" /> Custom QR Loaded
                        </span>
                      </div>
                    ) : (
                      <div
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, 'tngQR')}
                        className="border-2 border-dashed border-nova-sand/30 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-nova-choco bg-white transition-colors h-36 relative"
                      >
                        <Upload className="w-5 h-5 text-nova-sand mb-1.5" />
                        <p className="text-[10px] font-semibold text-nova-choco/70">Drag & Drop TNG QR</p>
                        <p className="text-[9px] text-nova-choco/40 mt-0.5">or click to browse files</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleQRUpload(e, 'tngQR')}
                          className="hidden"
                          id="tng-qr-file"
                        />
                        <label htmlFor="tng-qr-file" className="absolute inset-0 cursor-pointer w-full h-full" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="flex min-h-12 w-full items-center justify-center gap-1.5 rounded-full bg-nova-choco py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:scale-[1.01] hover:bg-nova-choco/95 active:scale-[0.99]"
              >
                <Check className="w-4 h-4 stroke-[2.5px]" />
                <span>Save Payment Settings</span>
              </button>
            </form>

            {/* Business Meta Details */}
            <div className="mt-6 border-t border-nova-sand/15 pt-4 space-y-2.5 text-[11px] text-nova-choco/70 font-medium font-sans">
              <div className="flex justify-between items-center">
                <span>Business Currency</span>
                <span className="font-bold text-nova-choco font-mono">MYR (RM)</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Standard Operations</span>
                <span className="font-bold text-nova-choco">09:00 AM - 05:00 PM</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Primary Station Ingress</span>
                <span className="font-bold text-nova-choco">Main Station (ST-1)</span>
              </div>
            </div>
          </div>

          {/* Atelier Payment Methods Registry Card */}
          <div className="rounded-3xl border border-nova-sand/15 bg-white p-4 shadow-sm md:p-6">
            <h3 className="font-serif text-lg font-semibold mb-5 text-nova-choco flex items-center gap-2">
              <ListPlus className="w-5 h-5 text-nova-sand stroke-[2.2px]" />
              <span>Atelier Payment Methods Registry</span>
            </h3>

            {/* Form to Add or Edit */}
            <form onSubmit={handleAddOrEditMethod} className="bg-nova-light/40 border border-nova-sand/10 rounded-2xl p-4 mb-6 space-y-4">
              <div className="flex justify-between items-center border-b border-nova-sand/10 pb-2">
                <span className="text-[10px] font-bold text-nova-choco/65 uppercase tracking-wider">
                  {editingMethodId ? '✏️ Edit Payment Method' : '➕ Add Payment Method'}
                </span>
                {editingMethodId && (
                  <button
                    type="button"
                    onClick={handleCancelEditMethod}
                    className="text-[10px] text-red-500 hover:text-red-700 font-bold flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel Edit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold mb-1.5 text-nova-choco/70 uppercase tracking-wide">
                    Method Name
                  </label>
                  <input
                    type="text"
                    required
                    value={methodFormName}
                    onChange={(e) => setMethodFormName(e.target.value)}
                    className="w-full px-4 py-2 rounded-full border border-nova-sand/30 text-xs font-sans text-nova-choco bg-white focus:outline-none focus:border-nova-choco"
                    placeholder="e.g. GrabPay, Visa, Alipay"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-1.5 text-nova-choco/70 uppercase tracking-wide">
                    Channel Type
                  </label>
                  <select
                    value={methodFormType}
                    onChange={(e) => setMethodFormType(e.target.value as any)}
                    className="w-full px-4 py-2 rounded-full border border-nova-sand/30 text-xs font-sans text-nova-choco bg-white focus:outline-none focus:border-nova-choco"
                  >
                    <option value="Card">Card Payment</option>
                    <option value="Digital Wallet">Digital Wallet</option>
                    <option value="QR">QR Code</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Other">Other Type</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold mb-1.5 text-nova-choco/70 uppercase tracking-wide">
                  Internal Notes / Details (Optional)
                </label>
                <input
                  type="text"
                  value={methodFormDetails}
                  onChange={(e) => setMethodFormDetails(e.target.value)}
                  className="w-full px-4 py-2 rounded-full border border-nova-sand/30 text-xs font-sans text-nova-choco bg-white focus:outline-none focus:border-nova-choco"
                  placeholder="e.g. Counter Terminal ID, or instructions"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="method-enabled"
                    checked={methodFormEnabled}
                    onChange={(e) => setMethodFormEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-nova-sand/30 text-nova-choco focus:ring-nova-choco"
                  />
                  <label htmlFor="method-enabled" className="text-xs font-semibold text-nova-choco/80">
                    Enable for Checkout POS
                  </label>
                </div>

                <button
                  type="submit"
                  className="bg-nova-choco hover:bg-nova-choco/95 text-white px-5 py-2 rounded-full font-bold text-[11px] uppercase tracking-wider transition-all shadow-sm flex items-center gap-1"
                >
                  {editingMethodId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{editingMethodId ? 'Update Method' : 'Add to Registry'}</span>
                </button>
              </div>
            </form>

            {/* List of current methods */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-nova-choco/45 uppercase tracking-wider block">
                Registered Payment Methods ({localConfig.customMethods?.length || 0})
              </span>

              <div className="divide-y divide-nova-sand/10 border border-nova-sand/15 rounded-2xl overflow-hidden bg-white">
                {(localConfig.customMethods || []).map((method) => (
                  <div key={method.id} className="flex flex-col gap-3 p-3.5 transition-all duration-150 hover:bg-nova-light/20 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-sans font-bold text-xs text-nova-choco">{method.name}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          method.type === 'Cash' ? 'bg-green-100 text-green-800' :
                          method.type === 'Card' ? 'bg-blue-100 text-blue-800' :
                          method.type === 'QR' ? 'bg-[#E11383]/10 text-[#E11383]' :
                          method.type === 'Digital Wallet' ? 'bg-[#005CA9]/10 text-[#005CA9]' :
                          'bg-nova-sand/15 text-nova-choco/75'
                        }`}>
                          {method.type}
                        </span>
                        {!method.isEnabled && (
                          <span className="bg-red-50 text-red-600 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                            Disabled
                          </span>
                        )}
                      </div>
                      {method.details && (
                        <p className="text-[10px] text-nova-choco/60 mt-1 font-sans">{method.details}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleMethod(method.id)}
                        className={`flex min-h-10 min-w-10 items-center justify-center rounded-full transition-colors ${
                          method.isEnabled
                            ? 'bg-green-50 text-green-600 hover:bg-green-100'
                            : 'bg-red-50 text-red-400 hover:bg-red-100'
                        }`}
                        title={method.isEnabled ? "Disable Method" : "Enable Method"}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartEditMethod(method)}
                        className="flex min-h-10 min-w-10 items-center justify-center rounded-full bg-nova-light/40 text-nova-choco/75 transition-colors hover:bg-nova-sand/15"
                        title="Edit Method"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMethod(method.id)}
                        className="flex min-h-10 min-w-10 items-center justify-center rounded-full bg-red-50 text-red-500 transition-colors hover:bg-red-100"
                        title="Delete Method"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {(localConfig.customMethods || []).length === 0 && (
                  <div className="p-6 text-center text-nova-choco/40 text-xs">
                    No payment methods registered. Add one above.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Supabase Persistence Status Card */}
          <div className="bg-white rounded-3xl p-5 border border-nova-sand/15 shadow-sm flex items-start gap-3.5">
            <div className={`p-2.5 rounded-2xl ${persistenceStatus === 'supabase' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              <Cloud className="w-5 h-5 stroke-[2.2px]" />
            </div>
            <div className="text-xs text-nova-choco font-sans flex-grow">
              <div className="flex items-center justify-between">
                <h4 className="font-bold tracking-wide text-sm font-serif flex items-center gap-1.5">
                  <span>Supabase Cloud Save Integration</span>
                </h4>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  persistenceStatus === 'supabase' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {persistenceStatus === 'loading'
                    ? 'Checking Sync'
                    : persistenceStatus === 'supabase'
                      ? 'Supabase Synced'
                      : 'Local Fallback Mode'}
                </span>
              </div>
              <p className="leading-relaxed opacity-80 mt-1">
                {persistenceStatus === 'supabase'
                  ? 'Supabase is saving app data and file uploads. Appointments, POS tickets, transactions, clients, employees, catalog items, settings, reminders, logos, catalog images, and QR codes are synced to your project.'
                  : isSupabaseConfigured()
                    ? 'Supabase keys are configured, but the database save table may be missing or blocked by policy. Run the SQL setup script in Supabase, then refresh.'
                    : 'Supabase client is installed and ready. Provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables to enable database saves and storage bucket uploads.'}
              </p>
            </div>
          </div>

          {/* Info Banner styling */}
          <div className="bg-nova-sand/15 rounded-3xl p-5 border border-nova-sand/25 flex gap-3.5">
            <Sparkles className="w-5 h-5 text-nova-choco shrink-0 stroke-[2.2px] mt-0.5" />
            <div className="text-xs text-nova-choco font-sans">
              <h4 className="font-bold tracking-wide mb-1 text-sm font-serif">NOVA Hair Atelier Premium POS</h4>
              <p className="leading-relaxed opacity-85">
                Welcome to the Boutique Operations Workspace. This app features a responsive design and automatically synchronizes all booking appointments, customer spend indicators, and billing summaries offline using state managers.
              </p>
            </div>
          </div>
        </div>
      )}

      {subTab === 'sku' && (
        <div className="mx-auto max-w-2xl space-y-5 animate-fade-in md:space-y-6">
          <div className="flex flex-col rounded-3xl border border-nova-sand/15 bg-white p-4 shadow-sm md:p-6">
            <h3 className="font-serif text-lg font-semibold mb-5 text-nova-choco flex items-center gap-2">
              <ListPlus className="w-5 h-5 text-nova-sand stroke-[2.2px]" />
              <span>Add Custom Catalog Item & SKU</span>
            </h3>

            {/* Item Entry Form */}
            <form onSubmit={handleAddCatalogItem} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold mb-1.5 text-nova-choco/70 uppercase tracking-wide">
                    Item Name
                  </label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-full border border-nova-sand/30 text-sm font-sans text-nova-choco bg-nova-light/45 focus:outline-none focus:border-nova-choco focus:bg-white focus:ring-2 focus:ring-nova-sand/20 transition-all duration-200"
                    placeholder="e.g. 'Keratin Treatment'"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1.5 text-nova-choco/70 uppercase tracking-wide">
                    Price (RM)
                  </label>
                  <input
                    type="number"
                    required
                    step="1"
                    min="0"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-full border border-nova-sand/30 text-sm font-sans text-nova-choco bg-nova-light/45 focus:outline-none focus:border-nova-choco focus:bg-white focus:ring-2 focus:ring-nova-sand/20 transition-all duration-200 font-mono"
                    placeholder="95"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold mb-1.5 text-nova-choco/70 uppercase tracking-wide">
                    SKU / Barcode Code
                  </label>
                  <input
                    type="text"
                    value={itemSKU}
                    onChange={(e) => setItemSKU(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-full border border-nova-sand/30 text-sm font-sans text-nova-choco bg-nova-light/45 focus:outline-none focus:border-nova-choco focus:bg-white focus:ring-2 focus:ring-nova-sand/20 transition-all duration-200 font-mono"
                    placeholder="e.g. SKU-HAIR-TRT"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-2 text-nova-choco/70 uppercase tracking-wide">
                    Classification Category
                  </label>
                  <div className="flex gap-4 pt-1">
                    <label className="flex items-center gap-2 text-sm font-bold text-nova-choco/80 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="itemCategory"
                        checked={itemCategory === 'Services'}
                        onChange={() => setItemCategory('Services')}
                        className="w-4 h-4 text-nova-sand focus:ring-nova-sand border-nova-sand/30 focus:outline-none"
                      />
                      <span>Services</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm font-bold text-nova-choco/80 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="itemCategory"
                        checked={itemCategory === 'Retail'}
                        onChange={() => setItemCategory('Retail')}
                        className="w-4 h-4 text-nova-sand focus:ring-nova-sand border-nova-sand/30 focus:outline-none"
                      />
                      <span>Retail</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Optional Item Image Upload */}
              <div className="border border-dashed border-nova-sand/30 rounded-2xl p-4 bg-nova-light/20">
                <label className="block text-[11px] font-bold mb-1.5 text-nova-choco/70 uppercase tracking-wide">
                  Optional Catalog Item Image
                </label>
                <div className="flex items-center gap-4">
                  {itemImage ? (
                    <div className="relative group shrink-0">
                      <img src={itemImage} alt="Item Preview" className="w-16 h-16 rounded-xl object-cover border border-nova-sand/30" />
                      <button
                        type="button"
                        onClick={() => setItemImage('')}
                        className="absolute -top-1.5 -right-1.5 p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-colors"
                        title="Remove Image"
                      >
                        <Trash className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-nova-sand/10 border border-dashed border-nova-sand/30 flex items-center justify-center text-nova-choco/40 shrink-0">
                      <ImageIcon className="w-6 h-6 stroke-[1.5px]" />
                    </div>
                  )}
                  <div className="flex-grow">
                    <p className="text-[11px] font-semibold text-nova-choco/80">Upload a photograph or graphic representation</p>
                    <p className="text-[9px] text-nova-choco/40 mt-0.5">Supports PNG, JPG, WEBP.</p>
                    <div className="mt-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleItemImageUpload}
                        className="hidden"
                        id="item-image-file"
                      />
                      <label
                        htmlFor="item-image-file"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-nova-sand/25 hover:bg-nova-sand/35 text-nova-choco text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Select File</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="flex min-h-12 w-full items-center justify-center gap-1.5 rounded-full bg-nova-choco py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:scale-[1.01] hover:bg-nova-choco/95 active:scale-[0.99]"
              >
                <Plus className="w-4 h-4 stroke-[2.5px]" />
                <span>Add Catalog Item</span>
              </button>
            </form>

            {/* Existing Items Mini Scroll lists */}
            <div className="mt-6 pt-5 border-t border-nova-sand/15 flex-grow flex flex-col">
              <h4 className="text-[11px] font-bold mb-3.5 text-nova-choco/50 uppercase tracking-wider">
                Atelier Catalog SKU Items ({catalog.length})
              </h4>
              <div className="flex-grow overflow-y-auto max-h-60 space-y-2 pr-1">
                {catalog.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-2 px-3.5 bg-nova-light/40 border border-nova-sand/10 hover:bg-nova-beige/10 rounded-xl text-xs font-semibold text-nova-choco/90 transition-all duration-150"
                  >
                    <div className="flex items-center gap-2">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-7 h-7 rounded-lg object-cover border border-nova-sand/15 shrink-0"
                        />
                      ) : (
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded bg-nova-sand/20 text-nova-choco/70 uppercase font-sans flex items-center justify-center w-7 h-7 shrink-0`}>
                          {item.category === 'Services' ? 'Srv' : 'Rtl'}
                        </span>
                      )}
                      <div className="flex flex-col">
                        <span className="font-bold line-clamp-1">{item.name}</span>
                        {item.sku && <span className="text-[9px] text-nova-choco/40 font-mono">SKU: {item.sku}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span>RM {item.price.toFixed(2)}</span>
                      <button
                        onClick={() => onRemoveCatalogItem(item.id)}
                        className="text-red-500 hover:text-red-600 transition-colors p-1 cursor-pointer"
                        title="Delete item from inventory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {subTab === 'company' && (
        <div className="mx-auto max-w-2xl space-y-5 animate-fade-in md:space-y-6">
          <div className="rounded-3xl border border-nova-sand/15 bg-white p-4 shadow-sm md:p-6">
            <h3 className="font-serif text-lg font-semibold mb-5 text-nova-choco flex items-center gap-2">
              <Building className="w-5 h-5 text-nova-sand stroke-[2.2px]" />
              <span>Manage Company Profile</span>
            </h3>

            <form onSubmit={handleSaveCompanyInfo} className="space-y-5">
              {/* Logo Upload Section */}
              <div className="bg-nova-light/30 border border-nova-sand/10 rounded-2xl p-5">
                <label className="block text-[11px] font-bold mb-2 text-nova-choco/70 uppercase tracking-wide">
                  Company Brand Logo
                </label>
                <div className="flex items-center gap-5">
                  {compLogo ? (
                    <div className="relative shrink-0">
                      <img src={compLogo} alt="Company Logo" className="w-20 h-20 rounded-2xl object-contain bg-white p-2 border border-nova-sand/25" />
                      <button
                        type="button"
                        onClick={() => setCompLogo('')}
                        className="absolute -top-1.5 -right-1.5 p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-colors shadow-sm"
                        title="Remove Logo"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-nova-sand/10 border-2 border-dashed border-nova-sand/30 flex flex-col items-center justify-center text-nova-choco/40 shrink-0">
                      <Building className="w-8 h-8 stroke-[1.5px]" />
                      <span className="text-[8px] uppercase tracking-wider font-bold mt-1">No Logo</span>
                    </div>
                  )}
                  <div className="flex-grow">
                    <p className="text-[11px] font-bold text-nova-choco">Upload high-contrast vector brand asset</p>
                    <p className="text-[9px] text-nova-choco/55 mt-0.5">This logo is displayed beautifully in printable checkout success invoice sheets and WhatsApp messages.</p>
                    <div className="mt-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="company-logo-file"
                      />
                      <label
                        htmlFor="company-logo-file"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-nova-choco text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:bg-nova-choco/90 transition-all shadow-sm"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Select Logo File</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form inputs for Company Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold mb-1.5 text-nova-choco/70 uppercase tracking-wide flex items-center gap-1">
                    <Building className="w-3 h-3 text-nova-sand" />
                    <span>Company / Salon Name</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-full border border-nova-sand/30 text-sm font-sans text-nova-choco bg-nova-light/45 focus:outline-none focus:border-nova-choco focus:bg-white focus:ring-2 focus:ring-nova-sand/20 transition-all duration-200 font-semibold"
                    placeholder="e.g. NOVA Hair Atelier"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold mb-1.5 text-nova-choco/70 uppercase tracking-wide flex items-center gap-1">
                    <FileText className="w-3 h-3 text-nova-sand" />
                    <span>SSM Registration Number</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={compSSM}
                    onChange={(e) => setCompSSM(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-full border border-nova-sand/30 text-sm font-sans text-nova-choco bg-nova-light/45 focus:outline-none focus:border-nova-choco focus:bg-white focus:ring-2 focus:ring-nova-sand/20 transition-all duration-200 font-mono"
                    placeholder="e.g. 202603123456 (AS-9988-X)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold mb-1.5 text-nova-choco/70 uppercase tracking-wide flex items-center gap-1">
                    <Phone className="w-3 h-3 text-nova-sand" />
                    <span>Contact Phone / Email</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={compContact}
                    onChange={(e) => setCompContact(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-full border border-nova-sand/30 text-sm font-sans text-nova-choco bg-nova-light/45 focus:outline-none focus:border-nova-choco focus:bg-white focus:ring-2 focus:ring-nova-sand/20 transition-all duration-200"
                    placeholder="e.g. +60 12-345 6789"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold mb-1.5 text-nova-choco/70 uppercase tracking-wide flex items-center gap-1">
                    <Clock className="w-3 h-3 text-nova-sand" />
                    <span>Operating Hours Summary Text</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={compHours}
                      onChange={(e) => setCompHours(e.target.value)}
                      className="flex-grow px-4 py-2.5 rounded-full border border-nova-sand/30 text-sm font-sans text-nova-choco bg-nova-light/45 focus:outline-none focus:border-nova-choco focus:bg-white focus:ring-2 focus:ring-nova-sand/20 transition-all duration-200"
                      placeholder="e.g. 10:00 AM - 08:00 PM Daily"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const summary = generateHoursSummary(compDailyHours);
                        setCompHours(summary);
                      }}
                      className="px-4 py-2 rounded-full border border-nova-sand/30 text-xs font-bold text-nova-choco hover:bg-nova-sand/15 transition-all uppercase tracking-wider shrink-0 cursor-pointer"
                      title="Generate summary based on the daily hours schedule below"
                    >
                      ✨ Auto-Fill
                    </button>
                  </div>
                </div>
              </div>

              {/* Structured Weekly Days and Operating Hours Scheduler */}
              <div className="bg-nova-light/35 border border-nova-sand/10 rounded-3xl p-5 space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-nova-choco flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-nova-sand stroke-[2.2px]" />
                      <span>Weekly Operating Hours & Day Scheduler</span>
                    </h4>
                    <p className="text-[10px] text-nova-choco/55 mt-0.5">Toggle Operating vs Rest (Closed) for each day and choose the timing window.</p>
                  </div>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {compDailyHours.map((dayHour, idx) => (
                    <div 
                      key={dayHour.day} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-nova-sand/10 hover:border-nova-sand/20 transition-all duration-150"
                    >
                      <span className="text-xs font-bold text-nova-choco sm:w-24 shrink-0">{dayHour.day}</span>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...compDailyHours];
                            updated[idx] = {
                              ...dayHour,
                              isOpen: !dayHour.isOpen,
                              openTime: dayHour.openTime || '10:00 AM',
                              closeTime: dayHour.closeTime || '08:00 PM',
                            };
                            setCompDailyHours(updated);
                          }}
                          className={`px-3 py-1.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest cursor-pointer transition-all duration-150 ${
                            dayHour.isOpen
                              ? 'bg-green-55/15 border border-green-300 text-green-700'
                              : 'bg-red-55/15 border border-red-300 text-red-600'
                          }`}
                        >
                          {dayHour.isOpen ? '🟢 Operating' : '🔴 Rest / Closed'}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 flex-grow justify-end">
                        {dayHour.isOpen ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={dayHour.openTime || '10:00 AM'}
                              onChange={(e) => {
                                const updated = [...compDailyHours];
                                updated[idx] = { ...dayHour, openTime: e.target.value };
                                setCompDailyHours(updated);
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-nova-choco bg-nova-light/50 border border-nova-sand/25 rounded-lg focus:outline-none focus:border-nova-choco cursor-pointer"
                            >
                              {TIME_OPTIONS.map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                            <span className="text-[10px] text-nova-choco/50 font-bold uppercase tracking-wider">to</span>
                            <select
                              value={dayHour.closeTime || '08:00 PM'}
                              onChange={(e) => {
                                const updated = [...compDailyHours];
                                updated[idx] = { ...dayHour, closeTime: e.target.value };
                                setCompDailyHours(updated);
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-nova-choco bg-nova-light/50 border border-nova-sand/25 rounded-lg focus:outline-none focus:border-nova-choco cursor-pointer"
                            >
                              {TIME_OPTIONS.map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <span className="text-[10px] font-semibold text-nova-choco/40 italic">Rest / Closed Today</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1.5 text-nova-choco/70 uppercase tracking-wide flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-nova-sand" />
                  <span>Physical Address</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={compAddress}
                  onChange={(e) => setCompAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-nova-sand/30 text-sm font-sans text-nova-choco bg-nova-light/45 focus:outline-none focus:border-nova-choco focus:bg-white focus:ring-2 focus:ring-nova-sand/20 transition-all duration-200 leading-relaxed font-semibold"
                  placeholder="e.g. Lot G-12, Ground Floor, Bangsar Village, Kuala Lumpur"
                />
              </div>

              <button
                type="submit"
                className="flex min-h-12 w-full items-center justify-center gap-1.5 rounded-full bg-nova-choco py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:scale-[1.01] hover:bg-nova-choco/95 active:scale-[0.99]"
              >
                <Check className="w-4 h-4 stroke-[2.5px]" />
                <span>Save Company Profile</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {subTab === 'employee' && (
        <div className="mx-auto max-w-4xl space-y-5 animate-fade-in md:space-y-6">
          {/* Form to Add Employee */}
          <div className="rounded-3xl border border-nova-sand/15 bg-white p-4 shadow-sm md:p-6">
            <h3 className="font-serif text-lg font-semibold mb-5 text-nova-choco flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-nova-sand stroke-[2.2px]" />
              <span>Register New Employee</span>
            </h3>

            <form onSubmit={handleAddEmployee} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold mb-1.5 text-nova-choco/70 uppercase tracking-wide">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full border border-nova-sand/30 text-xs font-sans text-nova-choco bg-nova-light/45 focus:outline-none focus:border-nova-choco focus:bg-white focus:ring-2 focus:ring-nova-sand/20 transition-all duration-200"
                  placeholder="e.g. Liam Neeson"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1.5 text-nova-choco/70 uppercase tracking-wide">
                  Gender
                </label>
                <select
                  required
                  value={empGender}
                  onChange={(e) => setEmpGender(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full border border-nova-sand/30 text-xs font-sans text-nova-choco bg-white focus:outline-none focus:border-nova-choco focus:ring-2 focus:ring-nova-sand/20 transition-all duration-200"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1.5 text-nova-choco/70 uppercase tracking-wide">
                  Position / Role
                </label>
                <input
                  type="text"
                  required
                  value={empPosition}
                  onChange={(e) => setEmpPosition(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full border border-nova-sand/30 text-xs font-sans text-nova-choco bg-nova-light/45 focus:outline-none focus:border-nova-choco focus:bg-white focus:ring-2 focus:ring-nova-sand/20 transition-all duration-200"
                  placeholder="e.g. Master Stylist, Senior Colorist"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1.5 text-nova-choco/70 uppercase tracking-wide">
                  Employment Type
                </label>
                <select
                  required
                  value={empType}
                  onChange={(e) => setEmpType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full border border-nova-sand/30 text-xs font-sans text-nova-choco bg-white focus:outline-none focus:border-nova-choco focus:ring-2 focus:ring-nova-sand/20 transition-all duration-200"
                >
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>

              <div className="md:col-span-2 pt-2">
                <button
                  type="submit"
                  className="flex min-h-12 w-full items-center justify-center gap-1.5 rounded-full bg-nova-choco py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:scale-[1.01] hover:bg-nova-choco/95 active:scale-[0.99]"
                >
                  <Plus className="w-4 h-4 stroke-[2.5px]" />
                  <span>Register Employee</span>
                </button>
              </div>
            </form>
          </div>

          {/* Active Employee List Table */}
          <div className="rounded-3xl border border-nova-sand/15 bg-white p-4 shadow-sm md:p-6">
            <h3 className="font-serif text-lg font-semibold mb-5 text-nova-choco flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-nova-sand stroke-[2.2px]" />
              <span>Active Employee Registry ({employees.length})</span>
            </h3>

            {employees.length === 0 ? (
              <div className="py-12 text-center text-xs text-nova-choco/40 italic">
                No employees registered. Use the form above to add your first employee.
              </div>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                {employees.map((emp) => (
                  <article
                    key={emp.id}
                    className="rounded-2xl border border-nova-sand/15 bg-nova-light/25 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="truncate font-serif text-base font-bold text-nova-choco">
                          {emp.name}
                        </h4>
                        <p className="mt-1 text-xs font-semibold text-nova-sand">{emp.position}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEmployee(emp.id)}
                        className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 transition-colors hover:bg-red-100"
                        title="Remove Employee"
                        aria-label={`Remove ${emp.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                      <div className="rounded-xl bg-white/75 px-3 py-2">
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-nova-choco/40">
                          Gender
                        </span>
                        <span className="mt-1 block font-semibold text-nova-choco/75">{emp.gender}</span>
                      </div>
                      <div className="rounded-xl bg-white/75 px-3 py-2">
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-nova-choco/40">
                          Employment
                        </span>
                        <span className={`mt-1 inline-flex rounded-full px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide ${
                          emp.employmentType === 'Full-Time' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' :
                          emp.employmentType === 'Part-Time' ? 'bg-blue-50 text-blue-700 border border-blue-200/50' :
                          emp.employmentType === 'Contract' ? 'bg-amber-50 text-amber-700 border border-amber-200/50' :
                          'bg-gray-50 text-gray-700 border border-gray-200/50'
                        }`}>
                          {emp.employmentType}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
                </div>

                <div className="hidden overflow-x-auto rounded-2xl border border-nova-sand/15 md:block">
                <table className="w-full text-left text-xs text-nova-choco">
                  <thead>
                    <tr className="bg-nova-light/55 border-b border-nova-sand/15 text-[10px] font-extrabold uppercase tracking-wider text-nova-choco/50">
                      <th className="py-3.5 px-4 font-bold">Employee Name</th>
                      <th className="py-3.5 px-4 font-bold">Gender</th>
                      <th className="py-3.5 px-4 font-bold">Position</th>
                      <th className="py-3.5 px-4 font-bold">Employment Type</th>
                      <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nova-sand/10">
                    {employees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-nova-light/35 transition-colors">
                        <td className="py-4 px-4 font-bold text-nova-choco">{emp.name}</td>
                        <td className="py-4 px-4 font-medium text-nova-choco/70">{emp.gender}</td>
                        <td className="py-4 px-4 font-semibold text-nova-sand">{emp.position}</td>
                        <td className="py-4 px-4 font-semibold">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                            emp.employmentType === 'Full-Time' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' :
                            emp.employmentType === 'Part-Time' ? 'bg-blue-50 text-blue-700 border border-blue-200/50' :
                            emp.employmentType === 'Contract' ? 'bg-amber-50 text-amber-700 border border-amber-200/50' :
                            'bg-gray-50 text-gray-700 border border-gray-200/50'
                          }`}>
                            {emp.employmentType}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveEmployee(emp.id)}
                            className="p-1.5 rounded-full hover:bg-red-50 text-red-600/80 hover:text-red-600 transition-all cursor-pointer inline-flex items-center justify-center"
                            title="Remove Employee"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
