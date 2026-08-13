import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import POSView from './components/POSView';
import DashboardView from './components/DashboardView';
import AppointmentsView from './components/AppointmentsView';
import ClientsView from './components/ClientsView';
import SettingsView from './components/SettingsView';
import { CheckoutModal, InventoryModal, ReportsModal } from './components/Modals';

import { 
  INITIAL_CATALOG, 
  INITIAL_STYLISTS, 
  INITIAL_APPOINTMENTS, 
  INITIAL_TRANSACTIONS 
} from './data';
import { CatalogItem, CartItem, Appointment, Transaction, PaymentConfig, CompanyInfo, Employee, Stylist, ClientRecord, PaymentMethodItem } from './types';

export default function App() {
  // Main view navigation state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Primary State Engines
  const [catalog, setCatalog] = useState<CatalogItem[]>(INITIAL_CATALOG);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  
  // Clients profile stats state
  const [existingClients, setExistingClients] = useState<ClientRecord[]>(() => {
    const hasPurged = localStorage.getItem('nova_mock_data_purged_v2');
    if (!hasPurged) {
      localStorage.removeItem('nova_clients');
      localStorage.setItem('nova_mock_data_purged_v2', 'true');
    }

    const cached = localStorage.getItem('nova_clients');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // ignore
      }
    }
    
    // Default seed clients to showcase CRM features, loyalty tiers and upcoming birthdays (July 2026)
    return [
      {
        name: 'Vanessa Tan',
        phone: '012-345-6789',
        visits: 12,
        spend: 1850.00,
        points: 450,
        birthday: '1995-07-12',
        registeredAt: '2024-03-10',
        customerCategory: 'Existing',
        acquisitionSource: 'Instagram',
        stylistNotes: 'Always prefers cold water wash. Loves ash-blonde tones and long layers.',
        hairProfileNotes: 'Allergy: Sensitive to ammonia dyes. Loves tea on arrival.'
      },
      {
        name: 'Marcus Lim',
        phone: '011-889-2233',
        visits: 4,
        spend: 420.00,
        points: 210,
        birthday: '1992-07-28',
        registeredAt: '2025-01-15',
        customerCategory: 'Existing',
        acquisitionSource: 'Facebook',
        stylistNotes: 'Requested neat undercut style. Low maintenance styling preference.',
        hairProfileNotes: 'Hates heavy hair gel products.'
      },
      {
        name: 'Elara Vance',
        phone: '016-777-8899',
        visits: 28,
        spend: 5400.00,
        points: 1250,
        birthday: '1988-11-04',
        registeredAt: '2023-06-01',
        customerCategory: 'Existing',
        acquisitionSource: 'Friend Referral',
        stylistNotes: 'VIP styling privileges. Performs keratin treatment twice a year.',
        hairProfileNotes: 'Treatment History: Scalp therapy session completed Dec 2025.'
      },
      {
        name: 'Chloe Song',
        phone: '019-222-1100',
        visits: 8,
        spend: 1200.00,
        points: 620,
        birthday: '1994-07-02',
        registeredAt: '2024-11-20',
        customerCategory: 'Existing',
        acquisitionSource: 'XiaoHongShu',
        stylistNotes: 'Prefers ammonia-free dye. Likes cold blow dry style.',
        hairProfileNotes: 'Allergy: Slight scalp irritation with high volume peroxide.'
      },
      {
        name: 'Ryan Goh',
        phone: '017-333-4455',
        visits: 1,
        spend: 150.00,
        points: 15,
        registeredAt: '2026-06-30',
        customerCategory: 'New',
        acquisitionSource: 'Walk-In',
        stylistNotes: 'First-time visit. Walked in for a casual summer cut.'
      }
    ];
  });

  // Employees list state
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const cached = localStorage.getItem('nova_employees');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed.filter(emp => !['emp_1', 'emp_2', 'emp_3', 'emp_4'].includes(emp.id));
        }
      } catch (e) {
        // ignore
      }
    }
    return [];
  });

  // Dynamically computed or initialized stylists list
  const [stylists, setStylists] = useState<Stylist[]>(() => {
    let currentEmployees: Employee[] = [];
    const cached = localStorage.getItem('nova_employees');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          currentEmployees = parsed.filter(emp => !['emp_1', 'emp_2', 'emp_3', 'emp_4'].includes(emp.id));
        }
      } catch (e) {
        // ignore
      }
    }
    return currentEmployees.map(emp => {
      const existing = INITIAL_STYLISTS.find(s => s.name === emp.name);
      return {
        id: emp.id,
        name: emp.name,
        role: emp.position,
        utilization: existing ? existing.utilization : Math.floor(Math.random() * 40) + 40
      };
    });
  });

  useEffect(() => {
    localStorage.setItem('nova_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('nova_clients', JSON.stringify(existingClients));
  }, [existingClients]);

  // Sync stylists list when employees change
  useEffect(() => {
    setStylists(prevStylists => {
      return employees.map(emp => {
        const existing = prevStylists.find(s => s.name === emp.name) || INITIAL_STYLISTS.find(s => s.name === emp.name);
        return {
          id: emp.id,
          name: emp.name,
          role: emp.position,
          utilization: existing ? existing.utilization : Math.floor(Math.random() * 40) + 40
        };
      });
    });
  }, [employees]);

  // POS State Engines
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedStylist, setSelectedStylist] = useState<string>('Elara V.');
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(() => {
    const saved = localStorage.getItem('nova_payment_config');
    const defaultMethods: PaymentMethodItem[] = [];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.customMethods && Array.isArray(parsed.customMethods)) {
          // Filter out the dummy methods to keep the state clean of dummy data
          parsed.customMethods = parsed.customMethods.filter(
            (m: any) => !['pay_duitnow', 'pay_tng', 'pay_cash', 'pay_card'].includes(m.id)
          );
        } else {
          parsed.customMethods = defaultMethods;
        }
        return parsed;
      } catch (e) {
        // Fallback
      }
    }
    return {
      bankName: 'Maybank',
      accountName: 'NOVA Hair Atelier',
      accountNo: '514012345678',
      duitNowQR: '',
      tngQR: '',
      customMethods: defaultMethods,
    };
  });
  const [ticketIndex, setTicketIndex] = useState<number>(9021); // TX-9021

  useEffect(() => {
    localStorage.setItem('nova_payment_config', JSON.stringify(paymentConfig));
  }, [paymentConfig]);

  // Company profile metadata state with persistence
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => {
    const saved = localStorage.getItem('nova_company_info');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return {
      name: 'NOVA Hair Atelier',
      address: 'Lot G-12, Ground Floor, Bangsar Village, Kuala Lumpur',
      operatingHours: '10:00 AM - 08:00 PM Daily',
      ssmNumber: '202603123456 (AS-9988-X)',
      contactInfo: '+60 3-2284 9021',
      logo: '',
      dailyHours: [
        { day: 'Monday', isOpen: true, openTime: '10:00 AM', closeTime: '08:00 PM' },
        { day: 'Tuesday', isOpen: true, openTime: '10:00 AM', closeTime: '08:00 PM' },
        { day: 'Wednesday', isOpen: true, openTime: '10:00 AM', closeTime: '08:00 PM' },
        { day: 'Thursday', isOpen: true, openTime: '10:00 AM', closeTime: '08:00 PM' },
        { day: 'Friday', isOpen: true, openTime: '10:00 AM', closeTime: '08:00 PM' },
        { day: 'Saturday', isOpen: true, openTime: '10:00 AM', closeTime: '08:00 PM' },
        { day: 'Sunday', isOpen: false, openTime: '10:00 AM', closeTime: '08:00 PM' },
      ],
    };
  });

  useEffect(() => {
    localStorage.setItem('nova_company_info', JSON.stringify(companyInfo));
  }, [companyInfo]);

  // Settings sub-view navigation state
  const [settingsSubTab, setSettingsSubTab] = useState<'payment' | 'sku' | 'company' | 'employee'>('payment');

  // Navigation Drawers & Notification Center
  const [notifications, setNotifications] = useState<string[]>([
    'Atelier Station ST-1 online and synced successfully.',
    'Inventory stock list verified.',
  ]);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [showInventoryModal, setShowInventoryModal] = useState<boolean>(false);
  const [showReportsModal, setShowReportsModal] = useState<boolean>(false);

  // Auto-sync search queries to avoid stale inputs
  useEffect(() => {
    setSearchQuery('');
  }, [activeTab]);

  // Cart Handlers
  const handleAddToCart = (name: string, price: number, category: 'Services' | 'Retail') => {
    const newItem: CartItem = {
      id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name,
      price,
      stylist: selectedStylist,
      category,
    };
    setCart((prev) => [...prev, newItem]);
    
    // Quick notification alerts
    const shortStylist = selectedStylist.split(' ')[0];
    setNotifications((prev) => [
      `Added "${name}" with ${shortStylist} to current ticket.`,
      ...prev,
    ]);
  };

  const handleRemoveFromCart = (id: string) => {
    const item = cart.find((i) => i.id === id);
    if (item) {
      setCart((prev) => prev.filter((i) => i.id !== id));
      setNotifications((prev) => [`Removed "${item.name}" from current ticket.`, ...prev]);
    }
  };

  // Appointment Actions
  const handleAddAppointment = (appt: Omit<Appointment, 'id' | 'checkedOut'>) => {
    const newAppt: Appointment = {
      ...appt,
      id: `appt_${Date.now()}`,
      checkedOut: false,
    };
    setAppointments((prev) => [...prev, newAppt]);
    
    // Auto-register new client if they don't exist yet
    const clientExists = existingClients.some(
      (c) => c.name.toLowerCase() === appt.clientName.toLowerCase()
    );
    if (!clientExists) {
      setExistingClients((prev) => [
        ...prev,
        {
          name: appt.clientName,
          phone: appt.clientPhone,
          visits: 0,
          spend: 0.0,
          lastStylist: appt.stylist,
        },
      ]);
    }

    setNotifications((prev) => [
      `New appointment scheduled for ${appt.clientName} (${appt.time}) on ${appt.date}.`,
      ...prev,
    ]);
  };

  const handleCheckOutAppointment = (appt: Appointment) => {
    setClientName(appt.clientName);
    setClientPhone(appt.clientPhone);
    setSelectedStylist(appt.stylist);
    
    // Transfer scheduled service into the active checkout ticket
    const newItem: CartItem = {
      id: `cart_tx_${Date.now()}`,
      name: appt.serviceName,
      price: appt.price,
      stylist: appt.stylist,
      category: 'Services',
    };
    setCart([newItem]);
    
    // Set appointment checkedOut in state
    setAppointments((prev) =>
      prev.map((a) => (a.id === appt.id ? { ...a, checkedOut: true } : a))
    );

    setActiveTab('pos');
    setNotifications((prev) => [
      `Scheduled booking for ${appt.clientName} loaded into checkout register.`,
      ...prev,
    ]);
  };

  const handleDeleteAppointment = (id: string) => {
    const appt = appointments.find((a) => a.id === id);
    if (appt) {
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      setNotifications((prev) => [
        `Appointment for ${appt.clientName} cancelled.`,
        ...prev,
      ]);
    }
  };

  // POS Checkout completion handler
  const handlePaymentComplete = (txDetails: {
    clientName: string;
    clientPhone: string;
    items: CartItem[];
    subtotal: number;
    tax: number;
    total: number;
    pointsRedeemed?: number;
    pointsDiscount?: number;
    pointsEarned?: number;
  }) => {
    const newTxId = `TX-${ticketIndex}`;
    const newTx: Transaction = {
      id: newTxId,
      date: '2026-07-01', // fixed reference to current date
      ...txDetails,
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Update or create client analytics metrics & loyalty points
    setExistingClients((prev) => {
      const matchIdx = prev.findIndex(
        (c) => c.name.toLowerCase() === txDetails.clientName.toLowerCase()
      );
      const pointsRedeemed = txDetails.pointsRedeemed || 0;
      const pointsEarned = txDetails.pointsEarned || 0;

      if (matchIdx !== -1) {
        const copy = [...prev];
        const prevRecord = copy[matchIdx];
        const currentPoints = prevRecord.points || 0;
        const finalPoints = Math.max(0, currentPoints - pointsRedeemed + pointsEarned);

        copy[matchIdx] = {
          ...prevRecord,
          visits: prevRecord.visits + 1,
          spend: prevRecord.spend + txDetails.total,
          points: finalPoints,
          lastStylist: txDetails.items[0]?.stylist || prevRecord.lastStylist,
        };
        return copy;
      } else {
        return [
          ...prev,
          {
            name: txDetails.clientName,
            phone: txDetails.clientPhone,
            visits: 1,
            spend: txDetails.total,
            points: pointsEarned,
            lastStylist: txDetails.items[0]?.stylist || 'Elara V.',
          },
        ];
      }
    });

    // Reset checkout forms & ticket counters
    setCart([]);
    setClientName('');
    setClientPhone('');
    setTicketIndex((prev) => prev + 1);

    const loyaltyAppliedMsg = txDetails.pointsRedeemed
      ? ` (redeemed ${txDetails.pointsRedeemed} pts, earned +${txDetails.pointsEarned} pts)`
      : ` (earned +${txDetails.pointsEarned} pts)`;

    setNotifications((prev) => [
      `Billing Ticket #${newTxId} settled successfully for RM${txDetails.total.toFixed(2)}${loyaltyAppliedMsg}.`,
      ...prev,
    ]);
  };

  // Client List Quick Actions
  const handleSelectClientForPOS = (name: string, phone: string) => {
    setClientName(name);
    setClientPhone(phone);
    setActiveTab('pos');
    setNotifications((prev) => [
      `Client profile "${name}" loaded into POS register details.`,
      ...prev,
    ]);
  };

  const handleBookForClient = (name: string, phone: string) => {
    setClientName(name);
    setClientPhone(phone);
    setActiveTab('appointments');
  };

  // Custom catalogue configuration additions
  const handleAddCatalogItem = (item: Omit<CatalogItem, 'id'>) => {
    const newItem: CatalogItem = {
      ...item,
      id: `cat_${Date.now()}`,
    };
    setCatalog((prev) => [...prev, newItem]);
    setNotifications((prev) => [
      `Added custom catalog item "${item.name}" to inventory.`,
      ...prev,
    ]);
  };

  const handleRemoveCatalogItem = (id: string) => {
    const item = catalog.find((i) => i.id === id);
    if (item) {
      setCatalog((prev) => prev.filter((i) => i.id !== id));
      setNotifications((prev) => [
        `Removed "${item.name}" from catalog inventory.`,
        ...prev,
      ]);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-nova-beige text-nova-choco select-none font-sans">
      
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewAppointmentClick={() => {
          setActiveTab('appointments');
          setNotifications((prev) => [
            'Opened scheduler booking card workspace.',
            ...prev,
          ]);
        }}
        settingsSubTab={settingsSubTab}
        onSelectSettingsSubTab={setSettingsSubTab}
        companyInfo={companyInfo}
      />

      {/* Main Content Area */}
      <div className="ml-64 w-[calc(100%-16rem)] h-full flex flex-col relative">
        
        {/* Top Header Navbar */}
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeTab={activeTab}
          cartItemCount={cart.length}
          onCheckoutClick={() => {
            if (cart.length === 0) {
              alert('Cart is currently empty. Add custom items or click frequent services to checkout.');
              return;
            }
            setShowCheckoutModal(true);
          }}
          onOpenInventory={() => setShowInventoryModal(true)}
          onOpenReports={() => setShowReportsModal(true)}
          notifications={notifications}
          onClearNotifications={() => setNotifications([])}
        />

        {/* Dynamic Views Container */}
        <main className="pt-24 px-10 pb-10 overflow-y-auto h-full w-full">
          <AnimatePresence mode="wait">
            {activeTab === 'pos' && (
              <motion.div
                key="pos"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="w-full"
              >
                <POSView
                  cart={cart}
                  onAddToCart={handleAddToCart}
                  onRemoveFromCart={handleRemoveFromCart}
                  selectedStylist={selectedStylist}
                  setSelectedStylist={setSelectedStylist}
                  stylists={stylists}
                  clientName={clientName}
                  setClientName={setClientName}
                  clientPhone={clientPhone}
                  setClientPhone={setClientPhone}
                  catalog={catalog}
                  onCheckout={() => setShowCheckoutModal(true)}
                  ticketNumber={`#TX-${ticketIndex}`}
                  existingClients={existingClients}
                />
              </motion.div>
            )}

            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="w-full"
              >
                <DashboardView
                  transactions={transactions}
                  appointments={appointments}
                  stylists={stylists}
                />
              </motion.div>
            )}

            {activeTab === 'appointments' && (
              <motion.div
                key="appointments"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="w-full"
              >
                <AppointmentsView
                  appointments={appointments}
                  onAddAppointment={handleAddAppointment}
                  onCheckOutAppointment={handleCheckOutAppointment}
                  onDeleteAppointment={handleDeleteAppointment}
                  stylists={stylists}
                  catalog={catalog}
                />
              </motion.div>
            )}

            {activeTab === 'clients' && (
              <motion.div
                key="clients"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="w-full"
              >
                <ClientsView
                  existingClients={existingClients}
                  searchQuery={searchQuery}
                  onSelectClientForPOS={handleSelectClientForPOS}
                  onBookForClient={handleBookForClient}
                  transactions={transactions}
                  setExistingClients={setExistingClients}
                />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="w-full"
              >
                <SettingsView
                  paymentConfig={paymentConfig}
                  onUpdatePaymentConfig={setPaymentConfig}
                  catalog={catalog}
                  onAddCatalogItem={handleAddCatalogItem}
                  onRemoveCatalogItem={handleRemoveCatalogItem}
                  companyInfo={companyInfo}
                  onUpdateCompanyInfo={setCompanyInfo}
                  employees={employees}
                  onUpdateEmployees={setEmployees}
                  initialSubTab={settingsSubTab}
                  onSubTabChange={setSettingsSubTab}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Dynamic Overlay Dialog Modals */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        cart={cart}
        clientName={clientName}
        clientPhone={clientPhone}
        paymentConfig={paymentConfig}
        companyInfo={companyInfo}
        existingClients={existingClients}
        onPaymentComplete={handlePaymentComplete}
      />

      <InventoryModal
        isOpen={showInventoryModal}
        onClose={() => setShowInventoryModal(false)}
        catalog={catalog}
      />

      <ReportsModal
        isOpen={showReportsModal}
        onClose={() => setShowReportsModal(false)}
        transactions={transactions}
      />
    </div>
  );
}
