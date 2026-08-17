import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import POSView from './components/POSView';
import DashboardView from './components/DashboardView';
import AppointmentsView from './components/AppointmentsView';
import ClientsView from './components/ClientsView';
import SettingsView from './components/SettingsView';
import MobileNav from './components/MobileNav';
import { CheckoutModal, InventoryModal, ReportsModal } from './components/Modals';

import { INITIAL_STYLISTS } from './data';
import { CatalogItem, CartItem, Appointment, Transaction, PaymentConfig, CompanyInfo, Employee, Stylist, ClientRecord, NovaAppState, NovaAppStateKey, PosState, ReminderRule } from './types';
import { loadSupabaseState, readLocalState, saveSupabaseState, writeLocalState } from './lib/appState';

type PersistenceStatus = 'loading' | 'supabase' | 'local';

const EXCLUDED_DEMO_EMPLOYEE_IDS = ['emp_1', 'emp_2', 'emp_3', 'emp_4'];

const sanitizeEmployees = (value: Employee[]): Employee[] => {
  return Array.isArray(value)
    ? value.filter(emp => !EXCLUDED_DEMO_EMPLOYEE_IDS.includes(emp.id))
    : [];
};

const sanitizePaymentConfig = (value: PaymentConfig): PaymentConfig => {
  const customMethods = Array.isArray(value.customMethods)
    ? value.customMethods.filter(
        (m: any) => !['pay_duitnow', 'pay_tng', 'pay_cash', 'pay_card'].includes(m.id)
      )
    : [];

  return {
    ...value,
    customMethods,
  };
};

const stylistsFromEmployees = (employees: Employee[], existingStylists: Stylist[] = INITIAL_STYLISTS): Stylist[] => {
  return sanitizeEmployees(employees).map(emp => {
    const existing = existingStylists.find(s => s.name === emp.name) || INITIAL_STYLISTS.find(s => s.name === emp.name);
    return {
      id: emp.id,
      name: emp.name,
      role: emp.position,
      utilization: existing ? existing.utilization : Math.floor(Math.random() * 40) + 40,
    };
  });
};

export default function App() {
  // Main view navigation state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hasLoadedRemoteState, setHasLoadedRemoteState] = useState<boolean>(false);
  const [persistenceStatus, setPersistenceStatus] = useState<PersistenceStatus>('loading');

  // Primary State Engines
  const [catalog, setCatalog] = useState<CatalogItem[]>(() => readLocalState('catalog'));
  const [appointments, setAppointments] = useState<Appointment[]>(() => readLocalState('appointments'));
  const [transactions, setTransactions] = useState<Transaction[]>(() => readLocalState('transactions'));
  
  // Clients profile stats state
  const [existingClients, setExistingClients] = useState<ClientRecord[]>(() => readLocalState('clients'));

  // Employees list state
  const [employees, setEmployees] = useState<Employee[]>(() => sanitizeEmployees(readLocalState('employees')));

  // Dynamically computed or initialized stylists list
  const [stylists, setStylists] = useState<Stylist[]>(() => stylistsFromEmployees(readLocalState('employees')));

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
  const [cart, setCart] = useState<CartItem[]>(() => readLocalState('pos').cart);
  const [selectedStylist, setSelectedStylist] = useState<string>(() => readLocalState('pos').selectedStylist);
  const [clientName, setClientName] = useState<string>(() => readLocalState('pos').clientName);
  const [clientPhone, setClientPhone] = useState<string>(() => readLocalState('pos').clientPhone);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(() => sanitizePaymentConfig(readLocalState('paymentConfig')));
  const [ticketIndex, setTicketIndex] = useState<number>(() => readLocalState('pos').ticketIndex); // TX-9021

  // Company profile metadata state with persistence
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => readLocalState('companyInfo'));

  // Settings sub-view navigation state
  const [settingsSubTab, setSettingsSubTab] = useState<'payment' | 'sku' | 'company' | 'employee'>('payment');

  // Navigation Drawers & Notification Center
  const [notifications, setNotifications] = useState<string[]>(() => readLocalState('notifications'));
  const [sentReminders, setSentReminders] = useState<Record<string, boolean>>(() => readLocalState('sentReminders'));
  const [reminderRules, setReminderRules] = useState<ReminderRule[]>(() => readLocalState('reminderRules'));
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [showInventoryModal, setShowInventoryModal] = useState<boolean>(false);
  const [showReportsModal, setShowReportsModal] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPersistedState() {
      const remoteState = await loadSupabaseState();

      if (!isMounted) {
        return;
      }

      if (remoteState) {
        if (remoteState.catalog) setCatalog(remoteState.catalog);
        if (remoteState.appointments) setAppointments(remoteState.appointments);
        if (remoteState.transactions) setTransactions(remoteState.transactions);
        if (remoteState.clients) setExistingClients(remoteState.clients);
        if (remoteState.employees) setEmployees(sanitizeEmployees(remoteState.employees));
        if (remoteState.paymentConfig) setPaymentConfig(sanitizePaymentConfig(remoteState.paymentConfig));
        if (remoteState.companyInfo) setCompanyInfo(remoteState.companyInfo);
        if (remoteState.notifications) setNotifications(remoteState.notifications);
        if (remoteState.sentReminders) setSentReminders(remoteState.sentReminders);
        if (remoteState.reminderRules) setReminderRules(remoteState.reminderRules);
        if (remoteState.pos) {
          setCart(remoteState.pos.cart || []);
          setSelectedStylist(remoteState.pos.selectedStylist || 'Elara V.');
          setClientName(remoteState.pos.clientName || '');
          setClientPhone(remoteState.pos.clientPhone || '');
          setTicketIndex(remoteState.pos.ticketIndex || 9021);
        }
        setPersistenceStatus('supabase');
      } else {
        setPersistenceStatus('local');
      }

      setHasLoadedRemoteState(true);
    }

    loadPersistedState();

    return () => {
      isMounted = false;
    };
  }, []);

  const persistState = <K extends NovaAppStateKey>(
    key: K,
    value: NovaAppState[K]
  ) => {
    writeLocalState(key, value);

    if (!hasLoadedRemoteState) {
      return;
    }

    saveSupabaseState(key, value).then((savedToSupabase) => {
      setPersistenceStatus(savedToSupabase ? 'supabase' : 'local');
    });
  };

  useEffect(() => {
    persistState('catalog', catalog);
  }, [catalog, hasLoadedRemoteState]);

  useEffect(() => {
    persistState('appointments', appointments);
  }, [appointments, hasLoadedRemoteState]);

  useEffect(() => {
    persistState('transactions', transactions);
  }, [transactions, hasLoadedRemoteState]);

  useEffect(() => {
    persistState('clients', existingClients);
  }, [existingClients, hasLoadedRemoteState]);

  useEffect(() => {
    persistState('employees', sanitizeEmployees(employees));
  }, [employees, hasLoadedRemoteState]);

  useEffect(() => {
    persistState('paymentConfig', sanitizePaymentConfig(paymentConfig));
  }, [paymentConfig, hasLoadedRemoteState]);

  useEffect(() => {
    persistState('companyInfo', companyInfo);
  }, [companyInfo, hasLoadedRemoteState]);

  useEffect(() => {
    const posState: PosState = {
      cart,
      selectedStylist,
      clientName,
      clientPhone,
      ticketIndex,
    };
    persistState('pos', posState);
  }, [cart, selectedStylist, clientName, clientPhone, ticketIndex, hasLoadedRemoteState]);

  useEffect(() => {
    persistState('notifications', notifications);
  }, [notifications, hasLoadedRemoteState]);

  useEffect(() => {
    persistState('sentReminders', sentReminders);
  }, [sentReminders, hasLoadedRemoteState]);

  useEffect(() => {
    persistState('reminderRules', reminderRules);
  }, [reminderRules, hasLoadedRemoteState]);

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
    <div className="flex h-[100dvh] min-h-[100dvh] overflow-hidden bg-nova-beige font-sans text-nova-choco select-none">
      
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
      <div className="relative ml-0 flex h-full w-full flex-col md:ml-64 md:w-[calc(100%-16rem)]">
        
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
        <main className="h-full w-full overflow-x-hidden overflow-y-auto px-4 pb-24 pt-20 sm:px-6 md:px-8 md:pb-10 md:pt-24 lg:px-10">
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
                  sentReminders={sentReminders}
                  onUpdateSentReminders={setSentReminders}
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
                  reminderRules={reminderRules}
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
                  persistenceStatus={persistenceStatus}
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

      <MobileNav
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
        onOpenInventory={() => setShowInventoryModal(true)}
        onOpenReports={() => setShowReportsModal(true)}
      />
    </div>
  );
}
