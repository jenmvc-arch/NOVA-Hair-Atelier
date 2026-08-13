import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  ShoppingCart,
  Calendar,
  Phone,
  Sparkles,
  DollarSign,
  Plus,
  Gift,
  MessageSquare,
  Copy,
  Check,
  Edit3,
  X,
  Cake,
  PartyPopper,
  CalendarDays,
  UserPlus,
  ArrowRight,
  Clock,
  Coins,
  ShieldAlert,
  Heart,
  Award,
  Crown,
  Gem
} from 'lucide-react';
import { ClientRecord, Transaction } from '../types';

interface ClientsViewProps {
  existingClients: ClientRecord[];
  searchQuery: string;
  onSelectClientForPOS: (name: string, phone: string) => void;
  onBookForClient: (name: string, phone: string) => void;
  transactions: Transaction[];
  setExistingClients: React.Dispatch<React.SetStateAction<ClientRecord[]>>;
}

export function getLoyaltyTier(points: number) {
  if (points >= 1000) {
    return {
      name: 'Platinum Elite',
      minPoints: 1000,
      maxPoints: 1000,
      badgeBg: 'bg-indigo-50 border-indigo-200/60',
      badgeText: 'text-indigo-700',
      badgeBorder: 'border-indigo-200/60',
      iconColor: 'text-indigo-500 fill-indigo-200',
      percent: 100,
      nextTier: null,
      nextTierPoints: 0,
      description: 'VIP styling privileges, priority booking & double point days.'
    };
  } else if (points >= 500) {
    return {
      name: 'Gold Member',
      minPoints: 500,
      maxPoints: 1000,
      badgeBg: 'bg-amber-50 border-amber-200/60',
      badgeText: 'text-amber-700',
      badgeBorder: 'border-amber-200/60',
      iconColor: 'text-amber-500 fill-amber-200',
      percent: Math.min(100, Math.round(((points - 500) / 500) * 100)),
      nextTier: 'Platinum Elite',
      nextTierPoints: 1000,
      description: 'Exclusive hair spa invites & 15% off products.'
    };
  } else if (points >= 200) {
    return {
      name: 'Silver Member',
      minPoints: 200,
      maxPoints: 500,
      badgeBg: 'bg-slate-50 border-slate-200/60',
      badgeText: 'text-slate-700',
      badgeBorder: 'border-slate-200/60',
      iconColor: 'text-slate-500 fill-slate-200',
      percent: Math.min(100, Math.round(((points - 200) / 300) * 100)),
      nextTier: 'Gold Member',
      nextTierPoints: 500,
      description: 'Early access to festive booking & birthday treat package.'
    };
  } else {
    return {
      name: 'Bronze Member',
      minPoints: 0,
      maxPoints: 200,
      badgeBg: 'bg-orange-50 border-orange-200/40',
      badgeText: 'text-orange-800',
      badgeBorder: 'border-orange-200/40',
      iconColor: 'text-orange-600/70 fill-orange-200/50',
      percent: Math.min(100, Math.round((points / 200) * 100)),
      nextTier: 'Silver Member',
      nextTierPoints: 200,
      description: 'Earn points with every treatment and salon check-in.'
    };
  }
}

const FESTIVALS = [
  {
    id: 'raya',
    title: 'Hari Raya Aidilfitri',
    subject: '🌙 Raya Radiance Special',
    message: (name: string) => `Salam Aidilfitri ${name}! 🌙 Celebrate the festive season with gorgeous, glossy hair! Enjoy 15% off all premium hair coloring and treatment packages at NOVA Hair Atelier. Spots are filling up fast for festive preparation—book yours today! ✨`
  },
  {
    id: 'cny',
    title: 'Chinese New Year',
    subject: '🧧 CNY Hair Blessing & Refresh',
    message: (name: string) => `Gong Xi Fa Cai ${name}! 🧧 Welcome the Lunar New Year with a brand new crown of confidence! Enjoy RM88 off any Balayage or Highlight package + a complimentary scalp renewal treatment at NOVA Hair Atelier. Book today to shine bright! 🐉`
  },
  {
    id: 'deepavali',
    title: 'Deepavali Festival of Shine',
    subject: '🪔 Deepavali Glow Campaign',
    message: (name: string) => `Happy Deepavali ${name}! 🪔 Light up the festivities with ultimate hair shine! Book any hair service this festive week at NOVA Hair Atelier and receive a complimentary luxurious hair-revitalizing scalp massage. Let us style you! ✨`
  },
  {
    id: 'christmas',
    title: 'Christmas & New Year Celebration',
    subject: '🎄 Holiday Glitz Promotion',
    message: (name: string) => `Merry Christmas & Happy New Year ${name}! 🎄✨ Unveil your holiday hair glow with NOVA's Festive Package: 20% off styling services and an exclusive take-home treatment gift set. Book your slot now to secure your year-end look! ❄️`
  }
];

export default function ClientsView({
  existingClients,
  searchQuery: globalSearchQuery,
  onSelectClientForPOS,
  onBookForClient,
  transactions,
  setExistingClients,
}: ClientsViewProps) {
  // Local search query for extra flexibility
  const [localSearch, setLocalSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'birthday'>('all');

  // New Client Form State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newBirthday, setNewBirthday] = useState('');
  const [newPoints, setNewPoints] = useState(100);
  const [newCategory, setNewCategory] = useState<'New' | 'Existing'>('New');
  const [newSource, setNewSource] = useState<'Facebook' | 'Google' | 'Instagram' | 'XiaoHongShu' | 'Friend Referral' | 'Walk-In' | 'Others'>('Walk-In');
  const [newSourceOther, setNewSourceOther] = useState('');
  const [newStylistNotes, setNewStylistNotes] = useState('');
  const [newHairProfileNotes, setNewHairProfileNotes] = useState('');

  // Edit Client Info State (inside detail CRM view)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBirthday, setEditBirthday] = useState('');
  const [editPoints, setEditPoints] = useState(0);
  const [editCategory, setEditCategory] = useState<'New' | 'Existing'>('New');
  const [editSource, setEditSource] = useState<'Facebook' | 'Google' | 'Instagram' | 'XiaoHongShu' | 'Friend Referral' | 'Walk-In' | 'Others'>('Walk-In');
  const [editSourceOther, setEditSourceOther] = useState('');
  const [editStylistNotes, setEditStylistNotes] = useState('');
  const [editHairProfileNotes, setEditHairProfileNotes] = useState('');
  const [notesSavedSuccess, setNotesSavedSuccess] = useState(false);
  const [hairNotesSavedSuccess, setHairNotesSavedSuccess] = useState(false);
  const [activeCrmTab, setActiveCrmTab] = useState<'overview' | 'history' | 'campaigns'>('overview');

  // Synchronize stylist notes when client selection changes
  React.useEffect(() => {
    if (selectedClient) {
      setEditStylistNotes(selectedClient.stylistNotes || '');
      setEditHairProfileNotes(selectedClient.hairProfileNotes || '');
    } else {
      setEditStylistNotes('');
      setEditHairProfileNotes('');
    }
  }, [selectedClient]);

  // AI Refine Copywriter States
  const [selectedReminderId, setSelectedReminderId] = useState<string>('');
  const [activeMessageDraft, setActiveMessageDraft] = useState<string>('');
  const [aiInstruction, setAiInstruction] = useState<string>('');
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [previousDraft, setPreviousDraft] = useState<string>('');
  const [aiError, setAiError] = useState<string>('');

  // Marketing states
  const [selectedFestival, setSelectedFestival] = useState(FESTIVALS[0].id);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Notifications or Simulation Dispatch popups
  const [simulatedDispatchMsg, setSimulatedDispatchMsg] = useState<string | null>(null);

  // Combine global search from header with local search input
  const activeSearchQuery = useMemo(() => {
    return (localSearch || globalSearchQuery).toLowerCase().trim();
  }, [localSearch, globalSearchQuery]);

  // Current month (July / Month 7)
  const currentMonthNum = 7; // e.g. July based on local date "2026-07-01"

  // Check if a client has birthday this month
  const isBirthdayThisMonth = (bday?: string) => {
    if (!bday) return false;
    const parts = bday.split('-');
    if (parts.length < 2) return false;
    return parseInt(parts[1], 10) === currentMonthNum;
  };

  const filteredClients = useMemo(() => {
    let list = existingClients;
    if (filterType === 'birthday') {
      list = list.filter((c) => isBirthdayThisMonth(c.birthday));
    }
    if (!activeSearchQuery) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(activeSearchQuery) ||
        c.phone.toLowerCase().includes(activeSearchQuery)
    );
  }, [existingClients, activeSearchQuery, filterType]);

  // Quick statistics
  const stats = useMemo(() => {
    const total = existingClients.length;
    const totalPoints = existingClients.reduce((sum, c) => sum + (c.points || 0), 0);
    const avgPoints = total > 0 ? Math.round(totalPoints / total) : 0;
    
    // Check birthdays matching month of July (07)
    const upcomingBdays = existingClients.filter((c) => isBirthdayThisMonth(c.birthday));

    return { total, avgPoints, bdaysThisMonth: upcomingBdays.length };
  }, [existingClients]);

  // Find dynamic service history matching currently selected client
  const clientServiceHistory = useMemo(() => {
    if (!selectedClient) return [];
    return transactions.filter(
      (tx) =>
        (selectedClient.phone && tx.clientPhone === selectedClient.phone) ||
        tx.clientName.toLowerCase() === selectedClient.name.toLowerCase()
    );
  }, [selectedClient, transactions]);

  // Generate dynamic service follow-up and return timelines based on rules
  const clientReminders = useMemo(() => {
    if (!selectedClient) return { lastService: "", detectedCategory: "General", recommendedReminders: [], manualReminders: [] };

    // Load custom rules from localStorage
    let rules = [];
    const cached = localStorage.getItem('nova_reminder_rules');
    if (cached) {
      try {
        rules = JSON.parse(cached);
      } catch (e) { }
    }
    if (!rules || rules.length === 0) {
      rules = [
        { id: 'hc_monthly', category: 'Hair Cut', timeline: 'Monthly', purpose: 'Remind for haircut service', message: "Hi {name}! It's been about a month since your last haircut service at NOVA Hair Atelier. We'd love to help you refresh and maintain your perfect shape. Reply here to secure your preferred slot! 💇‍♀️" },
        { id: 'tr_nextday', category: 'Treatment', timeline: 'Next Day', purpose: 'Follow Up', message: "Hi {name}! We hope your hair and scalp are feeling absolutely amazing after your treatment yesterday at NOVA Hair Atelier! How is your hair feeling? Reply here if you have any questions! ✨" },
        { id: 'tr_monthly', category: 'Treatment', timeline: 'Monthly', purpose: 'Remind to come back', message: "Hi {name}! Your hair is due for its monthly nourishing treatment to keep it resilient and glowing. Your session at NOVA Hair Atelier is ready for booking! Reply to secure your spot. 🌿" },
        { id: 'cl_nextday', category: 'Coloring', timeline: 'Next Day', purpose: 'Follow Up', message: "Hi {name}! We hope you love your new color from yesterday! Remember to wash with cool water to keep it vibrant. Let us know how you're loving it! 🎨" },
        { id: 'cl_monthly', category: 'Coloring', timeline: 'Monthly', purpose: 'Touch Up and return', message: "Hi {name}! It's been about a month since your color session at NOVA Hair Atelier. We recommend a root touch-up or toner glaze to keep it absolutely stunning! Reply here to book. 💖" }
      ];
    }

    // Determine what last service they had
    let lastServiceName = "Premium Styling & Cut";
    let detectedCategory = "General";
    
    if (clientServiceHistory.length > 0 && clientServiceHistory[0].items.length > 0) {
      const firstService = clientServiceHistory[0].items.find(i => i.category === 'Services');
      if (firstService) {
        lastServiceName = firstService.name;
        const cleanName = lastServiceName.toLowerCase();
        if (cleanName.includes('cut') || cleanName.includes('trim') || cleanName.includes('style') || cleanName.includes('layer') || cleanName.includes('fringe')) {
          detectedCategory = "Hair Cut";
        } else if (cleanName.includes('treatment') || cleanName.includes('scalp') || cleanName.includes('spa') || cleanName.includes('olaplex') || cleanName.includes('nourish') || cleanName.includes('mask') || cleanName.includes('cond')) {
          detectedCategory = "Treatment";
        } else if (cleanName.includes('color') || cleanName.includes('highlight') || cleanName.includes('balayage') || cleanName.includes('tint') || cleanName.includes('foil') || cleanName.includes('bleach') || cleanName.includes('tone')) {
          detectedCategory = "Coloring";
        }
      }
    }

    // Format utility with token substitution
    const formatMessage = (template: string) => {
      return template
        .replace(/{name}/g, selectedClient.name)
        .replace(/{service}/g, lastServiceName)
        .replace(/{stylist}/g, selectedClient.lastStylist || "Elara V.");
    };

    const matchedRules = rules.filter((r: any) => r.category === detectedCategory);
    const otherRules = rules.filter((r: any) => r.category !== detectedCategory);

    return {
      lastService: lastServiceName,
      detectedCategory,
      recommendedReminders: matchedRules.map((r: any) => ({
        ...r,
        formattedMessage: formatMessage(r.message),
        isRecommended: true
      })),
      manualReminders: otherRules.map((r: any) => ({
        ...r,
        formattedMessage: formatMessage(r.message),
        isRecommended: false
      }))
    };
  }, [selectedClient, clientServiceHistory]);

  // Handle adding new client
  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    const exists = existingClients.some(
      (c) => c.phone === newPhone.trim() || c.name.toLowerCase() === newName.trim().toLowerCase()
    );

    if (exists) {
      alert('A client with this name or phone number already exists.');
      return;
    }

    const client: ClientRecord = {
      name: newName.trim(),
      phone: newPhone.trim(),
      visits: 0,
      spend: 0,
      points: Number(newPoints) || 0,
      lastStylist: 'Elara V.',
      birthday: newBirthday || undefined,
      registeredAt: new Date().toISOString().split('T')[0],
      customerCategory: newCategory,
      acquisitionSource: newSource,
      acquisitionSourceOther: newSource === 'Others' ? newSourceOther.trim() : undefined,
      stylistNotes: newStylistNotes.trim(),
      hairProfileNotes: newHairProfileNotes.trim(),
    };

    setExistingClients((prev) => [client, ...prev]);
    
    // Clean up
    setNewName('');
    setNewPhone('');
    setNewBirthday('');
    setNewPoints(100);
    setNewCategory('New');
    setNewSource('Walk-In');
    setNewSourceOther('');
    setNewStylistNotes('');
    setNewHairProfileNotes('');
    setShowAddModal(false);
    
    // Optional details
    setSelectedClient(client);
  };

  // Open Edit Profile Mode
  const startEditing = () => {
    if (!selectedClient) return;
    setEditName(selectedClient.name);
    setEditPhone(selectedClient.phone);
    setEditBirthday(selectedClient.birthday || '');
    setEditPoints(selectedClient.points || 0);
    setEditCategory(selectedClient.customerCategory || 'New');
    setEditSource(selectedClient.acquisitionSource || 'Walk-In');
    setEditSourceOther(selectedClient.acquisitionSourceOther || '');
    setEditStylistNotes(selectedClient.stylistNotes || '');
    setEditHairProfileNotes(selectedClient.hairProfileNotes || '');
    setIsEditingProfile(true);
  };

  // Save profile edits
  const handleSaveProfile = () => {
    if (!selectedClient || !editName.trim() || !editPhone.trim()) return;

    setExistingClients((prev) => {
      return prev.map((c) => {
        if (c.phone === selectedClient.phone || c.name === selectedClient.name) {
          const updated = {
            ...c,
            name: editName.trim(),
            phone: editPhone.trim(),
            birthday: editBirthday || undefined,
            points: Number(editPoints) || 0,
            customerCategory: editCategory,
            acquisitionSource: editSource,
            acquisitionSourceOther: editSource === 'Others' ? editSourceOther.trim() : undefined,
            stylistNotes: editStylistNotes.trim(),
            hairProfileNotes: editHairProfileNotes.trim(),
          };
          // Sync selectedClient immediately
          setSelectedClient(updated);
          return updated;
        }
        return c;
      });
    });
    setIsEditingProfile(false);
  };

  // Quick Save Stylist Notes directly from the overview screen
  const handleSaveNotesDirectly = () => {
    if (!selectedClient) return;

    setExistingClients((prev) => {
      return prev.map((c) => {
        if (c.phone === selectedClient.phone || c.name === selectedClient.name) {
          const updated = {
            ...c,
            stylistNotes: editStylistNotes.trim(),
          };
          // Sync selectedClient immediately
          setSelectedClient(updated);
          return updated;
        }
        return c;
      });
    });

    setNotesSavedSuccess(true);
    setTimeout(() => {
      setNotesSavedSuccess(false);
    }, 2500);
  };

  // Quick Save Hair Profile Notes directly from the overview screen
  const handleSaveHairNotesDirectly = () => {
    if (!selectedClient) return;

    setExistingClients((prev) => {
      return prev.map((c) => {
        if (c.phone === selectedClient.phone || c.name === selectedClient.name) {
          const updated = {
            ...c,
            hairProfileNotes: editHairProfileNotes.trim(),
          };
          // Sync selectedClient immediately
          setSelectedClient(updated);
          return updated;
        }
        return c;
      });
    });

    setHairNotesSavedSuccess(true);
    setTimeout(() => {
      setHairNotesSavedSuccess(false);
    }, 2500);
  };

  // Trigger clipboard copy alert
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Simulate or fire actual WhatsApp message
  const triggerWhatsAppDispatch = (phone: string, text: string) => {
    const encoded = encodeURIComponent(text);
    const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encoded}`;
    
    // Simulate premium visual feedback
    setSimulatedDispatchMsg(text);
    setTimeout(() => {
      setSimulatedDispatchMsg(null);
    }, 4000);

    // Open link in standard safety
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      // Ignore pop up blocks silently
    }
  };

  // Call server-side API to refine message draft with Gemini
  const handleRefineMessage = async () => {
    if (!activeMessageDraft.trim()) return;
    setIsRefining(true);
    setAiError('');
    try {
      const response = await fetch('/api/refine-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalMessage: activeMessageDraft,
          instruction: aiInstruction,
          clientName: selectedClient?.name || 'Client',
          birthday: selectedClient?.birthday,
          loyaltyPoints: selectedClient?.points || 0
        })
      });
      const data = await response.json();
      if (response.ok && data.refinedMessage) {
        setPreviousDraft(activeMessageDraft);
        setActiveMessageDraft(data.refinedMessage);
        setAiInstruction('');
      } else {
        setAiError(data.error || 'Failed to refine draft using Gemini AI.');
      }
    } catch (err: any) {
      setAiError(err.message || 'Error communicating with AI service.');
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Simulation dispatch message popup */}
      {simulatedDispatchMsg && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-stone-900 text-white rounded-3xl p-5 shadow-2xl border border-amber-400/30 animate-fade-in font-sans">
          <div className="flex items-center gap-2 mb-2">
            <PartyPopper className="w-5 h-5 text-amber-400 animate-bounce" />
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Campaign Message Dispatched!</h4>
          </div>
          <p className="text-[11px] leading-relaxed text-stone-200 italic mb-2">
            "{simulatedDispatchMsg.substring(0, 100)}..."
          </p>
          <div className="text-[10px] text-stone-400 flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Simulating WhatsApp API route on {selectedClient?.phone}</span>
          </div>
        </div>
      )}

      {/* Top Insights & Analytics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-5 border border-nova-sand/15 flex items-center justify-between shadow-sm">
          <div className="font-sans">
            <span className="text-[11px] font-extrabold text-nova-choco/40 uppercase tracking-wider block">Registered Members</span>
            <span className="text-2xl font-serif font-black text-nova-choco mt-1 block">{stats.total} clients</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-nova-sand/10 flex items-center justify-center text-nova-sand">
            <Users className="w-6 h-6 stroke-[2px]" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-nova-sand/15 flex items-center justify-between shadow-sm">
          <div className="font-sans">
            <span className="text-[11px] font-extrabold text-nova-choco/40 uppercase tracking-wider block">Avg Points Balance</span>
            <span className="text-2xl font-serif font-black text-nova-choco mt-1 block">{stats.avgPoints} pts</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
            <Coins className="w-6 h-6 stroke-[2px]" />
          </div>
        </div>

        <div className="bg-amber-500/5 rounded-3xl p-5 border border-amber-500/15 flex items-center justify-between shadow-sm">
          <div className="font-sans">
            <span className="text-[11px] font-extrabold text-amber-800/60 uppercase tracking-wider block">Birthdays This Month (July)</span>
            <span className="text-2xl font-serif font-black text-amber-950 mt-1 block flex items-center gap-1.5">
              <span>{stats.bdaysThisMonth} Upcoming</span>
              <Cake className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
            <PartyPopper className="w-6 h-6 stroke-[2px]" />
          </div>
        </div>
      </div>

      {/* Main Container Layout */}
      <div className="grid grid-cols-1 gap-6 items-start">
        {/* Left Side: Directory Registry */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-nova-sand/15 font-sans flex flex-col transition-all duration-300">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 border-b border-nova-sand/15 pb-4">
            <div>
              <h2 className="font-serif text-xl font-bold text-nova-choco flex items-center gap-2">
                <Users className="w-5.5 h-5.5 text-nova-sand stroke-[2.2px]" />
                <span>Client Loyalty & CRM Registry</span>
              </h2>
              <p className="text-xs text-nova-choco/60 mt-0.5">Manage customer credentials, birthdays, spending profile, and target campaigns.</p>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 bg-nova-choco hover:bg-nova-choco/90 text-white font-bold text-xs px-4 py-2.5 rounded-2xl transition-all shadow-sm shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register New Client</span>
            </button>
          </div>

          {/* Quick Filter Search Bar */}
          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-nova-choco/30" />
            <input
              type="text"
              placeholder="Search registry by name or mobile number..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full text-xs font-medium pl-10 pr-4 py-3 rounded-2xl bg-nova-beige/25 border border-nova-sand/15 text-nova-choco placeholder-nova-choco/30 focus:outline-none focus:ring-1 focus:ring-nova-sand transition-all"
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-nova-choco/40 hover:text-nova-choco transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Registry Segmented Controls / Quick Filters */}
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterType === 'all'
                  ? 'bg-nova-choco text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200/80'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>All Clients ({existingClients.length})</span>
            </button>
            <button
              onClick={() => setFilterType('birthday')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterType === 'birthday'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-500/10 text-amber-800 hover:bg-amber-500/20'
              }`}
            >
              <Cake className="w-3.5 h-3.5" />
              <span>July Birthdays ({stats.bdaysThisMonth})</span>
            </button>
          </div>

          {filteredClients.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center py-24 text-nova-choco/40">
              <Search className="w-10 h-10 text-nova-sand/50 stroke-[1.5px] mb-3" />
              <p className="text-sm font-semibold italic">No client profiles match your filters</p>
              <p className="text-[11px] mt-1 text-nova-choco/30">Reset search or register them as a new member profile.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans">
                <thead>
                  <tr className="border-b border-nova-sand/15 text-[10px] font-extrabold text-nova-choco/50 uppercase tracking-wider">
                    <th className="py-3 px-3">Client Information</th>
                    <th className="py-3 px-3 text-center">Visits</th>
                    <th className="py-3 px-3 text-right">Lifetime Spend</th>
                    <th className="py-3 px-3 text-center">Loyalty Balance</th>
                    <th className="py-3 px-3">Birthday / Details</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nova-sand/10">
                  {filteredClients.map((client, idx) => {
                    const active = selectedClient?.phone === client.phone;
                    const bdayMonth = isBirthdayThisMonth(client.birthday);
                    return (
                      <tr
                        key={idx}
                        onClick={() => {
                          setSelectedClient(client);
                          setIsEditingProfile(false);
                          setActiveCrmTab('overview');
                        }}
                        className={`cursor-pointer transition-colors text-xs font-semibold ${
                          active
                            ? 'bg-nova-beige/40 text-nova-choco'
                            : bdayMonth
                            ? 'bg-amber-500/5 hover:bg-amber-500/10 text-nova-choco border-l-2 border-l-amber-500'
                            : 'hover:bg-nova-beige/10 text-nova-choco/80'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-nova-choco text-sm flex items-center gap-1.5">
                              {client.name}
                              {bdayMonth && (
                                <span className="inline-flex items-center gap-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-700 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                  🍰 Birthday Month
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-nova-choco/50 font-mono font-medium mt-0.5">{client.phone}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-nova-choco">{client.visits}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-nova-choco">
                          RM {client.spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="inline-flex items-center gap-0.5 bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full font-extrabold text-[10px]">
                              <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                              <span>{client.points || 0} pts</span>
                            </span>
                            {(() => {
                              const tier = getLoyaltyTier(client.points || 0);
                              return (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-wider border ${tier.badgeBg} ${tier.badgeText}`}>
                                  {tier.name === 'Platinum Elite' ? (
                                    <Crown className="w-2.5 h-2.5 text-indigo-500 fill-indigo-100" />
                                  ) : tier.name === 'Gold Member' ? (
                                    <Award className="w-2.5 h-2.5 text-amber-500 fill-amber-100" />
                                  ) : tier.name === 'Silver Member' ? (
                                    <Gem className="w-2.5 h-2.5 text-slate-500 fill-slate-100" />
                                  ) : (
                                    <Award className="w-2.5 h-2.5 text-orange-600/70 fill-orange-100" />
                                  )}
                                  <span>{tier.name}</span>
                                </span>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col text-[10px]">
                            {client.birthday ? (
                              <span className={`inline-flex items-center gap-1.5 font-bold ${bdayMonth ? 'text-amber-700 font-extrabold' : 'text-nova-choco/70'}`}>
                                {bdayMonth ? (
                                  <Cake className="w-3.5 h-3.5 text-amber-500 animate-bounce shrink-0" style={{ animationDuration: '3s' }} />
                                ) : (
                                  <CalendarDays className="w-3.5 h-3.5 text-nova-choco/40 shrink-0" />
                                )}
                                <span>{client.birthday}</span>
                              </span>
                            ) : (
                              <span className="text-stone-400 font-medium italic flex items-center gap-1.5">
                                <CalendarDays className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                                <span>Not configured</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end items-center gap-2">
                            <button
                              onClick={() => onSelectClientForPOS(client.name, client.phone)}
                              className="p-1.5 rounded-xl hover:bg-nova-sand/20 text-nova-choco hover:text-nova-sand transition-all"
                              title="Checkout in POS"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onBookForClient(client.name, client.phone)}
                              className="p-1.5 rounded-xl hover:bg-nova-sand/20 text-nova-choco hover:text-nova-sand transition-all"
                              title="Book Appointment"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedClient(client);
                                setIsEditingProfile(false);
                                setActiveCrmTab('overview');
                              }}
                              className="p-1.5 rounded-xl bg-nova-sand/10 hover:bg-nova-sand/20 text-nova-choco transition-all text-[10px] font-extrabold"
                            >
                              Profile CRM
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Floating Customer CRM Portal Overlay Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-nova-sand/15 shadow-2xl animate-scale-in flex flex-col overflow-hidden max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-nova-sand/15 bg-stone-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-nova-sand/10 flex items-center justify-center text-nova-sand shrink-0">
                  <Users className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-black text-nova-choco flex items-center gap-2">
                    {selectedClient.name}
                  </h3>
                  <p className="text-xs font-mono text-nova-choco/50 mt-0.5">{selectedClient.phone}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedClient(null);
                  setIsEditingProfile(false);
                }}
                className="p-1.5 bg-stone-200/60 hover:bg-stone-200 rounded-full text-stone-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Premium Sticky Navigation Tabs */}
            <div className="flex border-b border-nova-sand/15 bg-stone-50/50 px-6 pt-2 gap-4">
              <button
                onClick={() => {
                  setIsEditingProfile(false);
                  setActiveCrmTab('overview');
                }}
                className={`pb-3 text-xs font-bold transition-all relative ${activeCrmTab === 'overview' ? 'text-nova-choco border-b-2 border-nova-sand' : 'text-nova-choco/50 hover:text-nova-choco/80'}`}
              >
                Overview & Profile
              </button>
              <button
                onClick={() => {
                  setIsEditingProfile(false);
                  setActiveCrmTab('history');
                }}
                className={`pb-3 text-xs font-bold transition-all relative ${activeCrmTab === 'history' ? 'text-nova-choco border-b-2 border-nova-sand' : 'text-nova-choco/50 hover:text-nova-choco/80'}`}
              >
                Service History ({clientServiceHistory.length})
              </button>
              <button
                onClick={() => {
                  setIsEditingProfile(false);
                  setActiveCrmTab('campaigns');
                }}
                className={`pb-3 text-xs font-bold transition-all relative ${activeCrmTab === 'campaigns' ? 'text-nova-choco border-b-2 border-nova-sand' : 'text-nova-choco/50 hover:text-nova-choco/80'}`}
              >
                Reminders & Campaigns
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="p-6 overflow-y-auto flex-grow max-h-[55vh]">
              {activeCrmTab === 'overview' && (
                <div className="space-y-5 animate-fade-in">
                  {/* Stats Badges Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 text-center">
                      <span className="text-[9px] text-amber-800 uppercase tracking-widest block font-extrabold">Points Balance</span>
                      <span className="text-amber-600 font-serif font-black text-sm block mt-1 flex items-center justify-center gap-1">
                        <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                        {selectedClient.points || 0} pts
                      </span>
                    </div>
                    <div className="bg-nova-sand/5 border border-nova-sand/10 rounded-2xl p-4 text-center">
                      <span className="text-[9px] text-nova-choco/40 uppercase tracking-widest block font-extrabold">Lifetime Spend</span>
                      <span className="text-nova-choco font-mono font-bold text-sm block mt-1">
                        RM {selectedClient.spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="bg-stone-50 border border-stone-200/50 rounded-2xl p-4 text-center">
                      <span className="text-[9px] text-stone-500 uppercase tracking-widest block font-extrabold">Salon Visits</span>
                      <span className="text-nova-choco font-serif font-black text-sm block mt-1">
                        {selectedClient.visits} visits
                      </span>
                    </div>
                  </div>

                  {/* Loyalty Tier Progress Bar & Status Card */}
                  {(() => {
                    const points = selectedClient.points || 0;
                    const tier = getLoyaltyTier(points);
                    
                    return (
                      <div className="bg-stone-50 border border-nova-sand/20 p-5 rounded-2xl text-nova-choco shadow-sm">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-3 border-b border-nova-sand/10">
                          <div>
                            <span className="text-[9px] font-extrabold uppercase text-nova-choco/40 tracking-wider">Loyalty Club Tier Status</span>
                            <h4 className="font-serif text-base font-black text-nova-choco mt-1 flex items-center gap-1.5">
                              {tier.name === 'Platinum Elite' ? (
                                <Crown className="w-5 h-5 text-indigo-500 fill-indigo-100" />
                              ) : tier.name === 'Gold Member' ? (
                                <Award className="w-5 h-5 text-amber-500 fill-amber-100" />
                              ) : tier.name === 'Silver Member' ? (
                                <Gem className="w-5 h-5 text-slate-500 fill-slate-100" />
                              ) : (
                                <Award className="w-5 h-5 text-orange-600/70 fill-orange-100" />
                              )}
                              <span>{tier.name}</span>
                            </h4>
                          </div>
                          
                          <div className="sm:text-right">
                            <span className="text-[9px] text-nova-choco/40 uppercase tracking-wider block font-bold">Points Balance</span>
                            <span className="font-mono text-sm font-black text-nova-choco flex items-center sm:justify-end gap-1 mt-0.5">
                              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                              {points} pts
                            </span>
                          </div>
                        </div>

                        {/* Visual Progress Track */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-extrabold text-nova-choco/60">
                            <span>{tier.minPoints} pts</span>
                            {tier.nextTier ? (
                              <span className="flex items-center gap-1">
                                <span>Next: </span>
                                <span className="text-nova-sand font-black uppercase">{tier.nextTier}</span>
                                <span>({tier.nextTierPoints} pts)</span>
                              </span>
                            ) : (
                              <span className="text-indigo-600 font-black uppercase flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
                                <span>Ultimate Level Unlocked!</span>
                              </span>
                            )}
                          </div>
                          
                          {/* Real progress bar with tailwind gradient styling */}
                          <div className="w-full h-3.5 bg-stone-200/60 rounded-full overflow-hidden p-[2px] border border-stone-200">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                tier.name === 'Platinum Elite' 
                                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600' 
                                  : tier.name === 'Gold Member' 
                                  ? 'bg-gradient-to-r from-amber-500 to-yellow-600' 
                                  : tier.name === 'Silver Member' 
                                  ? 'bg-gradient-to-r from-slate-400 to-slate-600' 
                                  : 'bg-gradient-to-r from-orange-400 to-orange-500'
                              }`}
                              style={{ width: `${tier.percent}%` }}
                            />
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-nova-choco/50 font-bold">
                            <span>Current Progress: {tier.percent}%</span>
                            {tier.nextTier ? (
                              <span>Need {tier.nextTierPoints - points} pts to level up</span>
                            ) : (
                              <span>Enjoying peak benefits</span>
                            )}
                          </div>
                        </div>

                        {/* Perks Bullet Area */}
                        <div className="mt-4 pt-3 border-t border-nova-sand/10 flex items-start gap-2 text-[11px] bg-white p-3 rounded-xl border border-stone-200/50">
                          <Gift className="w-4 h-4 text-nova-sand shrink-0 mt-0.5" />
                          <div>
                            <span className="font-extrabold text-nova-choco uppercase text-[9px] tracking-wider block">Active Tier Perks</span>
                            <p className="text-nova-choco/70 font-medium leading-relaxed mt-0.5">{tier.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Profile Edit or Info Sheet */}
                  {isEditingProfile ? (
                    <div className="bg-nova-beige/10 border border-nova-sand/20 p-5 rounded-2xl space-y-4 text-xs font-semibold text-nova-choco">
                      <h4 className="font-extrabold text-nova-choco/80 uppercase tracking-wide text-[10px]">Modify Demographic Record</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-nova-choco/50 uppercase tracking-wider mb-1">Full Name</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-nova-sand/25 focus:ring-1 focus:ring-nova-sand bg-white text-nova-choco focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-nova-choco/50 uppercase tracking-wider mb-1">Mobile Number</label>
                          <input
                            type="text"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full text-xs font-mono font-bold px-3 py-2.5 rounded-xl border border-nova-sand/25 focus:ring-1 focus:ring-nova-sand bg-white text-nova-choco focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-nova-choco/50 uppercase tracking-wider mb-1">Birthday Date</label>
                          <input
                            type="date"
                            value={editBirthday}
                            onChange={(e) => setEditBirthday(e.target.value)}
                            className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-nova-sand/25 focus:ring-1 focus:ring-nova-sand bg-white text-nova-choco focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-nova-choco/50 uppercase tracking-wider mb-1">Adjust Loyalty Points</label>
                          <input
                            type="number"
                            value={editPoints}
                            onChange={(e) => setEditPoints(Number(e.target.value))}
                            className="w-full text-xs font-mono font-bold px-3 py-2.5 rounded-xl border border-nova-sand/25 focus:ring-1 focus:ring-nova-sand bg-white text-nova-choco focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-nova-choco/50 uppercase tracking-wider mb-1">Customer Category</label>
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value as any)}
                            className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-nova-sand/25 focus:ring-1 focus:ring-nova-sand bg-white text-nova-choco focus:outline-none cursor-pointer"
                          >
                            <option value="New">New</option>
                            <option value="Existing">Existing</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-nova-choco/50 uppercase tracking-wider mb-1">How they heard about us?</label>
                          <select
                            value={editSource}
                            onChange={(e) => setEditSource(e.target.value as any)}
                            className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-nova-sand/25 focus:ring-1 focus:ring-nova-sand bg-white text-nova-choco focus:outline-none cursor-pointer"
                          >
                            <option value="Walk-In">Walk-In</option>
                            <option value="Facebook">Facebook</option>
                            <option value="Google">Google</option>
                            <option value="Instagram">Instagram</option>
                            <option value="XiaoHongShu">XiaoHongShu</option>
                            <option value="Friend Referral">Friend Referral</option>
                            <option value="Others">Others (Please specify)</option>
                          </select>
                        </div>
                      </div>

                      {editSource === 'Others' && (
                        <div>
                          <label className="block text-[10px] text-nova-choco/50 uppercase tracking-wider mb-1">Specify Other Source</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. TikTok, Event, Flyer"
                            value={editSourceOther}
                            onChange={(e) => setEditSourceOther(e.target.value)}
                            className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-nova-sand/25 focus:ring-1 focus:ring-nova-sand bg-white text-nova-choco focus:outline-none placeholder-stone-300"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] text-nova-choco/50 uppercase tracking-wider mb-1">Stylist Notes (General Journal)</label>
                        <textarea
                          value={editStylistNotes}
                          onChange={(e) => setEditStylistNotes(e.target.value)}
                          placeholder="e.g. Scalp is sensitive, prefers ammonia-free color, likes tea on arrival."
                          className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-nova-sand/25 focus:ring-1 focus:ring-nova-sand bg-white text-nova-choco focus:outline-none placeholder-stone-300 h-20 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-nova-choco/50 uppercase tracking-wider mb-1">Permanent Hair Profile (Preferences, Allergies & Past Treatments)</label>
                        <textarea
                          value={editHairProfileNotes}
                          onChange={(e) => setEditHairProfileNotes(e.target.value)}
                          placeholder="Allergic to specific dyes/chemicals? Hair thickness preferences? Bleach/Keratin treatment history?"
                          className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-nova-sand/25 focus:ring-1 focus:ring-nova-sand bg-white text-nova-choco focus:outline-none placeholder-stone-300 h-20 resize-none"
                        />
                      </div>

                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          onClick={() => setIsEditingProfile(false)}
                          className="bg-white hover:bg-stone-50 border border-stone-200 px-4 py-2 rounded-xl text-stone-600 font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          className="bg-nova-choco hover:bg-nova-choco/90 text-white px-5 py-2 rounded-xl font-bold transition-colors"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-nova-beige/15 border border-nova-sand/15 p-5 rounded-2xl text-nova-choco">
                      <div className="flex justify-between items-center mb-4 pb-2 border-b border-nova-sand/10">
                        <h4 className="font-serif text-sm font-bold text-nova-choco">Demographics & Credentials</h4>
                        <button
                          onClick={startEditing}
                          className="flex items-center gap-1.5 bg-white hover:bg-stone-50 text-nova-choco border border-nova-sand/30 font-bold text-[10px] px-3 py-1.5 rounded-xl transition-all shadow-sm"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-nova-sand" />
                          <span>Edit Credentials</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-6 text-xs font-semibold">
                        <div>
                          <span className="block text-[10px] uppercase text-nova-choco/40 tracking-wider">Birthday Anniversary</span>
                          <span className="font-bold flex items-center gap-1.5 mt-1 text-stone-800">
                            <Cake className="w-4 h-4 text-amber-500 shrink-0" />
                            {selectedClient.birthday ? (
                              <>
                                {selectedClient.birthday}
                                {isBirthdayThisMonth(selectedClient.birthday) && (
                                  <span className="text-[9px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.5 rounded">July Birthday Month 🎂</span>
                                )}
                              </>
                            ) : (
                              <span className="text-nova-choco/30 italic">Not set</span>
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-nova-choco/40 tracking-wider">Registration Date</span>
                          <span className="font-bold text-stone-800 block mt-1">
                            {selectedClient.registeredAt || '2024-01-15'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-nova-choco/40 tracking-wider">Default Preferred Stylist</span>
                          <span className="font-bold text-stone-800 block mt-1">
                            {selectedClient.lastStylist || 'Elara V.'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-nova-choco/40 tracking-wider">Customer Category</span>
                          <span className="font-bold text-stone-800 block mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${selectedClient.customerCategory === 'New' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-stone-100 text-stone-700 border border-stone-200'}`}>
                              {selectedClient.customerCategory || 'New'}
                            </span>
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-nova-choco/40 tracking-wider">How They Heard About Us</span>
                          <span className="font-bold text-stone-800 block mt-1">
                            {selectedClient.acquisitionSource || 'Walk-In'}
                            {selectedClient.acquisitionSource === 'Others' && selectedClient.acquisitionSourceOther && (
                              <span className="text-stone-500 font-medium ml-1">({selectedClient.acquisitionSourceOther})</span>
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-nova-choco/40 tracking-wider">Quick Actions</span>
                          <div className="flex items-center gap-3 mt-1.5">
                            <button
                              onClick={() => {
                                onSelectClientForPOS(selectedClient.name, selectedClient.phone);
                                setSelectedClient(null);
                              }}
                              className="text-[10px] font-bold text-white bg-nova-choco hover:bg-nova-choco/90 px-3 py-1.5 rounded-lg transition-all"
                            >
                              POS Checkout
                            </button>
                            <button
                              onClick={() => {
                                onBookForClient(selectedClient.name, selectedClient.phone);
                                setSelectedClient(null);
                              }}
                              className="text-[10px] font-bold text-nova-choco bg-nova-sand/15 hover:bg-nova-sand/30 px-3 py-1.5 rounded-lg transition-all"
                            >
                              Book Appointment
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Standalone Stylist Notes Card */}
                  <div className="bg-nova-sand/5 border border-nova-sand/15 p-5 rounded-2xl text-nova-choco">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-nova-sand/10">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-xl bg-nova-sand/10 text-nova-choco">
                          <Edit3 className="w-4 h-4 text-nova-sand" />
                        </span>
                        <div>
                          <h4 className="font-serif text-sm font-bold text-nova-choco">Stylist Hair Journal & Preferences</h4>
                          <p className="text-[10px] text-nova-choco/50">Record chemical formulas, scalp conditions, or tea/coffee preferences.</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={handleSaveNotesDirectly}
                        className={`flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-all shadow-sm ${
                          notesSavedSuccess
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-nova-choco hover:bg-nova-choco/90 text-white border-nova-choco'
                        }`}
                      >
                        {notesSavedSuccess ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Saved Successfully</span>
                          </>
                        ) : (
                          <>
                            <span>Save Notes</span>
                          </>
                        )}
                      </button>
                    </div>

                    <textarea
                      value={editStylistNotes}
                      onChange={(e) => setEditStylistNotes(e.target.value)}
                      placeholder="e.g. Scalp is sensitive, prefers ammonia-free color, likes tea on arrival. Used 6% developer for balayage."
                      className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-nova-sand/25 focus:ring-1 focus:ring-nova-sand bg-white text-nova-choco focus:outline-none placeholder-stone-300 min-h-[100px] resize-y animate-fade-in"
                    />
                    
                    {selectedClient.stylistNotes && (
                      <div className="mt-2.5 flex items-center justify-between text-[9px] font-mono text-nova-choco/40 bg-stone-50/50 p-2 rounded-lg border border-stone-200/40">
                        <span>Notes are synchronized for future appointments</span>
                        <span>{selectedClient.stylistNotes.length} characters recorded</span>
                      </div>
                    )}
                  </div>

                  {/* Standalone Permanent Hair Profile & Allergies Card */}
                  <div className="bg-amber-50/45 border border-amber-200/70 p-5 rounded-2xl text-nova-choco">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-amber-200/50">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-xl bg-amber-100 text-amber-800">
                          <ShieldAlert className="w-4 h-4 text-amber-700" />
                        </span>
                        <div>
                          <h4 className="font-serif text-sm font-bold text-amber-950 flex items-center gap-1.5">
                            <span>Permanent Hair Profile & Allergies</span>
                            <span className="text-[9px] uppercase tracking-wider font-sans font-extrabold px-1.5 py-0.5 bg-amber-200/60 text-amber-900 rounded-full">Vital Info</span>
                          </h4>
                          <p className="text-[10px] text-amber-900/60 font-semibold">Track hair preferences, chemical allergies, and past treatment history.</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={handleSaveHairNotesDirectly}
                        className={`flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-all shadow-sm ${
                          hairNotesSavedSuccess
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-amber-800 hover:bg-amber-900 text-white border-amber-800'
                        }`}
                      >
                        {hairNotesSavedSuccess ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Saved Successfully</span>
                          </>
                        ) : (
                          <>
                            <span>Save Profile</span>
                          </>
                        )}
                      </button>
                    </div>

                    <textarea
                      value={editHairProfileNotes}
                      onChange={(e) => setEditHairProfileNotes(e.target.value)}
                      placeholder="e.g. ALLERGIES: PPD dye allergy, sensitive scalp. PREFERENCES: Loves cold tones, long layers, hates brassy hues. TREATMENTS: Had keratin treatment Dec 2025."
                      className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-amber-200 focus:ring-1 focus:ring-amber-500 bg-white text-stone-850 focus:outline-none placeholder-stone-400 min-h-[100px] resize-y animate-fade-in"
                    />
                    
                    {selectedClient.hairProfileNotes && (
                      <div className="mt-2.5 flex items-center justify-between text-[9px] font-mono text-amber-800/60 bg-white p-2 rounded-lg border border-amber-100/60">
                        <span className="flex items-center gap-1 font-bold">
                          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                          <span>Always visible during check-ins & appointment history</span>
                        </span>
                        <span>{selectedClient.hairProfileNotes.length} characters recorded</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeCrmTab === 'history' && (
                <div className="space-y-4 animate-fade-in">
                  <h4 className="font-serif text-sm font-bold text-nova-choco flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-nova-sand" />
                    <span>Purchase & Treatment Service Logs ({clientServiceHistory.length})</span>
                  </h4>

                  {clientServiceHistory.length === 0 ? (
                    <div className="text-center py-12 text-nova-choco/40 bg-nova-light rounded-2xl border border-dashed border-nova-sand/25">
                      <ShoppingCart className="w-8 h-8 text-nova-sand/40 stroke-[1.5px] mx-auto mb-2" />
                      <p className="font-bold italic text-xs">First-Time Member</p>
                      <p className="text-[10px] mt-0.5">No checkout history has been recorded on this loyalty profile yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {clientServiceHistory.map((tx, tIdx) => (
                        <div key={tIdx} className="bg-stone-50 border border-nova-sand/15 rounded-2xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-stone-800">{tx.id}</span>
                              <span className="text-[10px] font-mono text-stone-400 font-bold bg-white px-2 py-0.5 rounded border border-stone-200">{tx.date}</span>
                            </div>
                            <div className="space-y-1 mt-2.5 font-bold text-nova-choco/80 text-[11px]">
                              {tx.items.map((it, iIdx) => (
                                <div key={iIdx} className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-nova-sand"></span>
                                  <span>{it.name} (by {it.stylist})</span>
                                  <span className="text-[10px] font-medium text-stone-400">({it.category})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="block text-[9px] uppercase tracking-wider text-stone-400 font-bold">Total Amount</span>
                            <span className="text-sm font-mono font-black text-nova-choco mt-0.5 block">
                              RM {tx.total.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeCrmTab === 'campaigns' && (
                <div className="space-y-6 animate-fade-in text-nova-choco">
                  {/* Dashboard Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-stone-50 border border-nova-sand/15 p-4 rounded-2xl">
                    <div>
                      <h4 className="font-serif text-sm font-bold text-nova-choco flex items-center gap-1.5">
                        <Gift className="w-4 h-4 text-nova-sand animate-pulse" />
                        <span>Highly Targeted Campaign Drafts & Autopilot Triggers</span>
                      </h4>
                      <p className="text-[10px] text-nova-choco/60 mt-0.5">
                        Select a target timeline trigger below to load its draft template into the AI workspace.
                      </p>
                    </div>
                    {clientReminders.lastService && (
                      <div className="bg-nova-sand/10 border border-nova-sand/25 px-3 py-1.5 rounded-xl text-right">
                        <span className="text-[9px] text-nova-choco/40 uppercase font-bold tracking-wider block">Last Visit Category</span>
                        <span className="text-[10px] font-black block text-nova-choco">
                          {clientReminders.lastService} ({clientReminders.detectedCategory})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 1. Timeline Triggers Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Recommended Timelines (Based on service obtained) */}
                    <div className="bg-white border border-nova-sand/20 p-4 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                        <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                          🎯 Recommended Timelines (Auto-Detected)
                        </span>
                      </div>
                      
                      {clientReminders.recommendedReminders.length === 0 ? (
                        <p className="text-[11px] text-stone-400 italic py-2">No category-specific autopilot rules triggered for this profile yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {clientReminders.recommendedReminders.map((rem: any) => (
                            <button
                              key={rem.id}
                              onClick={() => {
                                setActiveMessageDraft(rem.formattedMessage);
                                setSelectedReminderId(rem.id);
                                setPreviousDraft('');
                                setAiError('');
                              }}
                              className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${selectedReminderId === rem.id ? 'border-indigo-500 bg-indigo-50/20 shadow-sm' : 'border-stone-100 bg-stone-50/50 hover:bg-stone-50'}`}
                            >
                              <div className="flex justify-between items-center font-bold">
                                <span className="text-stone-800">{rem.category} - {rem.timeline}</span>
                                <span className="text-[9px] font-extrabold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded uppercase">Recommended</span>
                              </div>
                              <p className="text-[10px] text-stone-500 mt-1 font-medium">{rem.purpose}</p>
                              <p className="text-[9px] text-stone-400 mt-1.5 italic line-clamp-1">{rem.formattedMessage}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Manual Settings Triggers (Other timelines) */}
                    <div className="bg-white border border-nova-sand/20 p-4 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                        <span className="text-[10px] font-black text-stone-600 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          ⚙️ Manual Settings Triggers
                        </span>
                      </div>
                      
                      {clientReminders.manualReminders.length === 0 ? (
                        <p className="text-[11px] text-stone-400 italic py-2">No additional manual timelines available.</p>
                      ) : (
                        <div className="space-y-2 max-h-[160px] overflow-y-auto">
                          {clientReminders.manualReminders.map((rem: any) => (
                            <button
                              key={rem.id}
                              onClick={() => {
                                setActiveMessageDraft(rem.formattedMessage);
                                setSelectedReminderId(rem.id);
                                setPreviousDraft('');
                                setAiError('');
                              }}
                              className={`w-full text-left p-2.5 rounded-xl border text-[11px] transition-all ${selectedReminderId === rem.id ? 'border-stone-500 bg-stone-100/50 shadow-sm' : 'border-stone-100 bg-stone-50/20 hover:bg-stone-50'}`}
                            >
                              <div className="flex justify-between items-center font-bold">
                                <span className="text-stone-700">{rem.category} - {rem.timeline}</span>
                                <span className="text-[9px] font-medium text-stone-400">Manual</span>
                              </div>
                              <p className="text-[9px] text-stone-400 mt-0.5">{rem.purpose}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. Birthday and Festival Special Greetings row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Birthday Offer Campaign */}
                    <div className="bg-amber-500/5 border border-amber-500/15 p-4 rounded-2xl space-y-3">
                      <span className="text-[10px] font-black text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 w-max">
                        <Cake className="w-3.5 h-3.5 text-amber-600" />
                        <span>Birthday Special Coupon</span>
                      </span>
                      <p className="text-[10px] text-amber-900/80 leading-relaxed font-semibold">
                        Nourishing Birthday template including a RM50 off voucher (Code: NOVA-BDAY-RM50) + scalp detox.
                      </p>
                      <button
                        onClick={() => {
                          const msg = `Happy Birthday, ${selectedClient.name}! 🎂🎉 NOVA Hair Atelier wishes you a fantastic year! To celebrate your special day, enjoy RM50 off (Code: NOVA-BDAY-RM50) valid on any services this month, plus a complimentary scalp detox treatment. Book today! 💇‍♀️✨`;
                          setActiveMessageDraft(msg);
                          setSelectedReminderId('birthday_campaign');
                          setPreviousDraft('');
                          setAiError('');
                        }}
                        className="w-full bg-white hover:bg-amber-100/35 border border-amber-200 text-amber-800 font-extrabold text-[10px] py-2 rounded-xl transition-all"
                      >
                        Load Birthday Special Template
                      </button>
                    </div>

                    {/* Festival Campaigns */}
                    <div className="bg-white border border-nova-sand/25 p-4 rounded-2xl space-y-3">
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider w-max block">
                        📢 Seasonal Festival Campaigns
                      </span>
                      <div className="flex gap-2">
                        <select
                          value={selectedFestival}
                          onChange={(e) => setSelectedFestival(e.target.value)}
                          className="flex-grow text-[11px] font-bold px-2 py-1.5 rounded-xl border border-nova-sand/25 bg-stone-50 text-nova-choco focus:outline-none cursor-pointer"
                        >
                          {FESTIVALS.map((fest) => (
                            <option key={fest.id} value={fest.id}>
                              {fest.title}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            const fObj = FESTIVALS.find(f => f.id === selectedFestival)!;
                            const msg = fObj.message(selectedClient.name);
                            setActiveMessageDraft(msg);
                            setSelectedReminderId(`festival_${fObj.id}`);
                            setPreviousDraft('');
                            setAiError('');
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-xl transition-all"
                        >
                          Load Festival
                        </button>
                      </div>
                      <p className="text-[9px] text-stone-400 italic line-clamp-1">
                        Active: {FESTIVALS.find(f => f.id === selectedFestival)?.subject}
                      </p>
                    </div>
                  </div>

                  {/* 3. AI Copilot Message Drafting Workspace (MANDATORY CLIENT PERSISTENCE) */}
                  <div className="bg-stone-50/50 border border-nova-sand/25 p-4 rounded-3xl space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-nova-sand/10">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-nova-sand" />
                        <span className="text-xs font-black uppercase tracking-wider">Draft Crafting & AI Refiner Workspace</span>
                      </div>
                      {selectedReminderId && (
                        <span className="text-[9px] font-mono font-bold text-stone-400 uppercase bg-white px-2 py-0.5 rounded border border-stone-200">
                          ID: {selectedReminderId}
                        </span>
                      )}
                    </div>

                    {activeMessageDraft ? (
                      <div className="space-y-4">
                        {/* Text Editor Area */}
                        <div>
                          <label className="block text-[9px] uppercase text-stone-400 font-bold tracking-wider mb-1">Message Body (Manual Edits Welcome)</label>
                          <textarea
                            value={activeMessageDraft}
                            onChange={(e) => {
                              setActiveMessageDraft(e.target.value);
                              setPreviousDraft('');
                            }}
                            className="w-full h-28 text-[11px] font-medium leading-relaxed px-3.5 py-3 rounded-2xl border border-nova-sand/20 bg-white text-stone-800 focus:ring-1 focus:ring-nova-sand focus:outline-none shadow-inner"
                            placeholder="Type or edit message..."
                          />
                        </div>

                        {/* AI Copilot Refinement Panel */}
                        <div className="bg-nova-beige/10 border border-nova-sand/20 rounded-2xl p-3.5 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-nova-choco/80 uppercase tracking-wide flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
                              <span>Refine Draft with Gemini AI Copilot</span>
                            </span>
                            {previousDraft && (
                              <button
                                onClick={() => {
                                  setActiveMessageDraft(previousDraft);
                                  setPreviousDraft('');
                                }}
                                className="text-[9px] font-extrabold text-nova-choco bg-white border border-nova-sand/35 hover:bg-stone-50 px-2 py-1 rounded-lg transition-all"
                              >
                                ↩ Undo AI Change
                              </button>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={aiInstruction}
                              onChange={(e) => setAiInstruction(e.target.value)}
                              placeholder="e.g. Translate to Mandarin, make it sound warmer, add a 15% discount coupon"
                              className="flex-grow text-[11px] font-semibold px-3 py-2 rounded-xl border border-nova-sand/15 bg-white text-nova-choco focus:outline-none focus:ring-1 focus:ring-nova-sand placeholder-stone-400"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRefineMessage();
                              }}
                            />
                            <button
                              onClick={handleRefineMessage}
                              disabled={isRefining || !aiInstruction.trim()}
                              className="bg-nova-choco hover:bg-nova-choco/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-[10px] px-4 py-2 rounded-xl shrink-0 flex items-center justify-center gap-1.5 transition-all shadow-sm"
                            >
                              {isRefining ? (
                                <>
                                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                  <span>Writing...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                                  <span>AI Refine</span>
                                </>
                              )}
                            </button>
                          </div>

                          {aiError && (
                            <p className="text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2">{aiError}</p>
                          )}
                          {previousDraft && !isRefining && !aiError && (
                            <p className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1 font-bold">✓ AI Refined successfully! Feel free to copy or dispatch.</p>
                          )}
                        </div>

                        {/* Dispatch Options */}
                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            onClick={() => copyToClipboard(activeMessageDraft)}
                            className="inline-flex items-center gap-1 bg-white hover:bg-stone-50 border border-stone-200 font-bold text-[10px] text-stone-700 px-4 py-2 rounded-xl transition-all shadow-sm"
                          >
                            {copiedText === activeMessageDraft ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-stone-400" />
                                <span>Copy Draft Message</span>
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => triggerWhatsAppDispatch(selectedClient.phone, activeMessageDraft)}
                            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 font-extrabold text-[10px] text-white px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Dispatch WhatsApp</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10 bg-white/50 rounded-2xl border border-dashed border-nova-sand/15 text-stone-400">
                        <Sparkles className="w-6 h-6 text-nova-sand/30 mx-auto mb-2" />
                        <p className="font-bold text-[11px]">Drafting Desk is Empty</p>
                        <p className="text-[9px] max-w-xs mx-auto mt-0.5">
                          Select one of the autopilot reminder timelines, birthday coupon templates, or festival template triggers above to begin drafting.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-50 border-t border-nova-sand/15 flex justify-end">
              <button
                onClick={() => {
                  setSelectedClient(null);
                  setIsEditingProfile(false);
                }}
                className="bg-nova-choco hover:bg-nova-choco/90 text-white text-xs font-bold px-5 py-2.5 rounded-2xl transition-all shadow-sm"
              >
                Close Portal Card
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add Client Dialog Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-nova-sand/15 shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-5 border-b border-nova-sand/15 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-nova-choco" />
                <h3 className="font-serif text-lg font-bold text-nova-choco">Register New Salon Client</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 bg-stone-100 hover:bg-stone-200 rounded-full text-stone-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddClient} className="space-y-4 text-xs font-semibold text-nova-choco">
              <div>
                <label className="block text-[10px] uppercase text-nova-choco/50 tracking-wider mb-1.5">Client Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vanessa Tan"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-nova-sand/25 focus:ring-1 focus:ring-nova-sand bg-white text-nova-choco focus:outline-none placeholder-stone-300"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-nova-choco/50 tracking-wider mb-1.5">WhatsApp / Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 012-345-6789"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full text-xs font-mono font-bold px-3 py-2.5 rounded-xl border border-nova-sand/25 focus:ring-1 focus:ring-nova-sand bg-white text-nova-choco focus:outline-none placeholder-stone-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-nova-choco/50 tracking-wider mb-1.5">Birthday Date</label>
                  <input
                    type="date"
                    value={newBirthday}
                    onChange={(e) => setNewBirthday(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-nova-sand/25 focus:ring-1 focus:ring-nova-sand bg-white text-nova-choco focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-nova-choco/50 tracking-wider mb-1.5">Initial Gift Points</label>
                  <input
                    type="number"
                    min="0"
                    value={newPoints}
                    onChange={(e) => setNewPoints(Number(e.target.value))}
                    className="w-full text-xs font-mono font-bold px-3 py-2.5 rounded-xl border border-nova-sand/25 focus:ring-1 focus:ring-nova-sand bg-white text-nova-choco focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-nova-choco/50 tracking-wider mb-1.5">Customer Category *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-nova-sand/25 focus:ring-1 focus:ring-nova-sand bg-white text-nova-choco focus:outline-none cursor-pointer"
                  >
                    <option value="New">New</option>
                    <option value="Existing">Existing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-nova-choco/50 tracking-wider mb-1.5">How they heard about us? *</label>
                  <select
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value as any)}
                    className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-nova-sand/25 focus:ring-1 focus:ring-nova-sand bg-white text-nova-choco focus:outline-none cursor-pointer"
                  >
                    <option value="Walk-In">Walk-In</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Google">Google</option>
                    <option value="Instagram">Instagram</option>
                    <option value="XiaoHongShu">XiaoHongShu</option>
                    <option value="Friend Referral">Friend Referral</option>
                    <option value="Others">Others (Please specify)</option>
                  </select>
                </div>
              </div>

              {newSource === 'Others' && (
                <div>
                  <label className="block text-[10px] uppercase text-nova-choco/50 tracking-wider mb-1.5">Please specify other source *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TikTok, Banner, Event"
                    value={newSourceOther}
                    onChange={(e) => setNewSourceOther(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-nova-sand/25 focus:ring-1 focus:ring-nova-sand bg-white text-nova-choco focus:outline-none placeholder-stone-300"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase text-nova-choco/50 tracking-wider mb-1.5">Stylist Notes (General Journal)</label>
                <textarea
                  placeholder="e.g. Scalp is sensitive, prefers ammonia-free color, likes tea on arrival."
                  value={newStylistNotes}
                  onChange={(e) => setNewStylistNotes(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-nova-sand/25 focus:ring-1 focus:ring-nova-sand bg-white text-nova-choco focus:outline-none placeholder-stone-300 h-20 resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-nova-choco/50 tracking-wider mb-1.5">Permanent Hair Profile (Preferences, Allergies & Treatments)</label>
                <textarea
                  placeholder="e.g. ALLERGIES: PPD dye allergy, sensitive scalp. PREFERENCES: Loves ash-blonde tones, hates brassy hues."
                  value={newHairProfileNotes}
                  onChange={(e) => setNewHairProfileNotes(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-nova-sand/25 focus:ring-1 focus:ring-nova-sand bg-white text-nova-choco focus:outline-none placeholder-stone-300 h-20 resize-none"
                />
              </div>

              <div className="pt-4 flex gap-2 justify-end border-t border-nova-sand/15 mt-5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-white hover:bg-stone-50 border border-stone-200 px-4 py-2.5 rounded-xl text-stone-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-nova-choco hover:bg-nova-choco/90 text-white px-5 py-2.5 rounded-xl font-bold transition-colors"
                >
                  Complete Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
