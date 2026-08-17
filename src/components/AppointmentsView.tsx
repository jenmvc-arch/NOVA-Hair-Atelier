import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Phone, 
  Tag, 
  Sparkles, 
  X, 
  CheckCircle,
  Eye,
  Trash2,
  Bell,
  Send,
  MessageSquare,
  Mail,
  Smartphone
} from 'lucide-react';
import { Appointment, Stylist, CatalogItem } from '../types';

interface AppointmentsViewProps {
  appointments: Appointment[];
  onAddAppointment: (appt: Omit<Appointment, 'id' | 'checkedOut'>) => void;
  onCheckOutAppointment: (appt: Appointment) => void;
  onDeleteAppointment: (id: string) => void;
  stylists: Stylist[];
  catalog: CatalogItem[];
  sentReminders: Record<string, boolean>;
  onUpdateSentReminders: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export default function AppointmentsView({
  appointments,
  onAddAppointment,
  onCheckOutAppointment,
  onDeleteAppointment,
  stylists,
  catalog,
  sentReminders,
  onUpdateSentReminders,
}: AppointmentsViewProps) {
  // We can track the active date context for scheduling
  const [currentDateStr, setCurrentDateStr] = useState('2026-07-01'); // matching local time
  const [viewMode, setViewMode] = useState<'Day' | 'Month'>('Day');

  // Booking Form States
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [bookingDate, setBookingDate] = useState('2026-07-01');
  const [bookingTime, setBookingTime] = useState('09:00');
  const [selectedService, setSelectedService] = useState('');
  const [selectedStylist, setSelectedStylist] = useState('');

  // Reminder Dispatch States
  const [selectedReminderAppt, setSelectedReminderAppt] = useState<Appointment | null>(null);
  const [reminderChannel, setReminderChannel] = useState<'WhatsApp' | 'SMS' | 'Email'>('WhatsApp');
  const [reminderText, setReminderText] = useState('');

  const openReminderModal = (appt: Appointment) => {
    setSelectedReminderAppt(appt);
    setReminderChannel('WhatsApp');
    const formattedTime = appt.time.startsWith('13') ? '01:00 PM' :
                          appt.time.startsWith('14') ? '02:00 PM' :
                          appt.time.startsWith('15') ? '03:00 PM' :
                          appt.time.startsWith('16') ? '04:00 PM' :
                          appt.time.startsWith('17') ? '05:00 PM' :
                          appt.time.startsWith('09') ? '09:00 AM' :
                          appt.time.startsWith('10') ? '10:00 AM' :
                          appt.time.startsWith('11') ? '11:00 AM' :
                          appt.time.startsWith('12') ? '12:00 PM' : appt.time;

    const draft = `Hello ${appt.clientName}, this is a friendly reminder of your booking at NOVA Hair Atelier for a ${appt.serviceName} with ${appt.stylist} on ${appt.date} at ${formattedTime}. Please reply to confirm. We look forward to seeing you!`;
    setReminderText(draft);
  };

  const handleSendReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReminderAppt) return;
    
    onUpdateSentReminders(prev => ({
      ...prev,
      [selectedReminderAppt.id]: true
    }));
    
    alert(`Boutique dispatch notification successfully sent to ${selectedReminderAppt.clientName} via ${reminderChannel}!`);
    setSelectedReminderAppt(null);
  };

  // Handle Date Navigation
  const handlePrevDay = () => {
    const d = new Date(currentDateStr);
    d.setDate(d.getDate() - 1);
    setCurrentDateStr(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(currentDateStr);
    d.setDate(d.getDate() + 1);
    setCurrentDateStr(d.toISOString().split('T')[0]);
  };

  // Format Date for Header display
  const headerDateFormatted = useMemo(() => {
    const d = new Date(currentDateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [currentDateStr]);

  // Daily Time Slots List
  const timeSlots = [
    { label: '09:00 AM', value: '09:00' },
    { label: '10:00 AM', value: '10:00' },
    { label: '11:00 AM', value: '11:00' },
    { label: '12:00 PM', value: '12:00' },
    { label: '01:00 PM', value: '13:00' }, // mapped appropriately
    { label: '02:00 PM', value: '14:00' },
    { label: '03:00 PM', value: '15:00' },
    { label: '04:00 PM', value: '16:00' },
    { label: '05:00 PM', value: '17:00' },
  ];

  // Scheduled appointments matching the selected date
  const selectedDayAppointments = useMemo(() => {
    return appointments.filter(
      (appt) => appt.date === currentDateStr && !appt.checkedOut
    );
  }, [appointments, currentDateStr]);

  // List of active services from the catalog
  const servicesCatalog = useMemo(() => {
    return catalog.filter((item) => item.category === 'Services');
  }, [catalog]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim() || !selectedService || !selectedStylist) {
      alert('Please fill out all booking details.');
      return;
    }

    const matchedService = catalog.find((item) => item.name === selectedService);
    const servicePrice = matchedService ? matchedService.price : 100;

    const newApptData = {
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      date: bookingDate,
      time: bookingTime,
      serviceName: selectedService,
      stylist: selectedStylist,
      price: servicePrice,
    };

    onAddAppointment(newApptData);

    // Reset Form
    setClientName('');
    setClientPhone('');
    setSelectedService('');
    setSelectedStylist('');
    
    // Construct dummy/temp appointment representation to pass to the reminder modal
    const tempAppt: Appointment = {
      ...newApptData,
      id: `appt_temp_${Date.now()}`,
      checkedOut: false,
    };

    // Open reminder dispatch window immediately
    openReminderModal(tempAppt);
    alert('Appointment booked successfully! You can now proceed to send a customized reminder to the client.');
  };

  // Generate Month Calendar Grid Data (July 2026 as reference)
  const monthCalendarDays = useMemo(() => {
    // July 2026: starts on Wednesday (3), 31 days
    const daysInMonth = 31;
    const startOffset = 3; // Wednesday start
    const calendarCells = [];

    // Pre-month filler
    for (let i = 24 + startOffset; i < 24 + startOffset + startOffset; i++) {
      // placeholders
    }

    // Reference dates array
    const dates = [];
    // Include 4 weeks filler representing late June to early August
    for (let dayNum = 24; dayNum <= 30; dayNum++) {
      dates.push({ dayNum, dateStr: `2026-06-${dayNum}`, isCurrentMonth: false });
    }
    for (let dayNum = 1; dayNum <= 31; dayNum++) {
      const pad = dayNum < 10 ? '0' + dayNum : dayNum;
      dates.push({ dayNum, dateStr: `2026-07-${pad}`, isCurrentMonth: true });
    }
    for (let dayNum = 1; dayNum <= 7; dayNum++) {
      dates.push({ dayNum, dateStr: `2026-08-0${dayNum}`, isCurrentMonth: false });
    }

    // Chunk into 5 weeks of 7 days
    return dates.slice(0, 35);
  }, []);

  return (
    <section className="flex h-full flex-col gap-5 font-sans animate-fade-in md:gap-8 xl:flex-row">
      {/* Left: Schedule Column */}
      <div className="flex min-h-0 w-full flex-col xl:min-h-[500px] xl:w-3/5">
        <div className="flex flex-grow flex-col rounded-3xl border border-nova-sand/15 bg-white p-4 shadow-sm md:p-6">
          {/* Schedule Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-xl font-bold text-nova-choco">
                {viewMode === 'Day' ? 'Daily Schedule' : 'Calendar Overview'}
              </h2>
              {/* Day/Month view switcher */}
              <div className="flex bg-nova-light rounded-full p-0.5 border border-nova-sand/20 ml-2">
                <button
                  onClick={() => setViewMode('Day')}
                  className={`px-3.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all duration-200 ${
                    viewMode === 'Day'
                      ? 'bg-nova-sand text-nova-choco shadow-sm'
                      : 'text-nova-choco/60 hover:text-nova-choco'
                  }`}
                >
                  Day View
                </button>
                <button
                  onClick={() => setViewMode('Month')}
                  className={`px-3.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all duration-200 ${
                    viewMode === 'Month'
                      ? 'bg-nova-sand text-nova-choco shadow-sm'
                      : 'text-nova-choco/60 hover:text-nova-choco'
                  }`}
                >
                  Month View
                </button>
              </div>
            </div>

            {/* Navigators */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevDay}
                className="p-1.5 rounded-full hover:bg-nova-beige/35 text-nova-choco transition-all border border-nova-sand/10"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.2px]" />
              </button>
              <div className="flex items-center gap-1.5 text-nova-choco font-semibold text-sm">
                <CalendarIcon className="w-4 h-4 text-nova-sand" />
                <span>{headerDateFormatted}</span>
              </div>
              <button
                onClick={handleNextDay}
                className="p-1.5 rounded-full hover:bg-nova-beige/35 text-nova-choco transition-all border border-nova-sand/10"
              >
                <ChevronRight className="w-4 h-4 stroke-[2.2px]" />
              </button>
            </div>
          </div>

          {/* Core Schedule Rendering */}
          <div className="flex-grow overflow-y-auto pr-1">
            {viewMode === 'Day' ? (
              /* DAY VIEW: chronological vertical hours blocks */
              <div className="space-y-4 max-h-[420px]">
                {timeSlots.map((slot) => {
                  // Find if there is an appointment scheduled in this block
                  const appt = selectedDayAppointments.find(
                    (a) => a.time.startsWith(slot.value) || (slot.value === '12:00' && a.time === '12:00')
                  );

                  return (
                    <div key={slot.value} className="flex gap-4 items-start group">
                      {/* Left Hour Label */}
                      <div className="w-18 pt-2.5 text-right font-bold text-xs font-mono text-nova-choco/40 shrink-0">
                        {slot.label}
                      </div>

                      {/* Right Slot Container */}
                      <div className="flex-grow">
                        {appt ? (
                          <div
                            className={`p-4 rounded-2xl shadow-sm hover:scale-[1.005] hover:shadow-md border-l-4 transition-all duration-200 cursor-pointer ${
                              appt.stylist === 'Elara V.'
                                ? 'bg-nova-beige/45 border-nova-sand hover:bg-nova-beige/60'
                                : appt.stylist === 'Julian M.'
                                ? 'bg-nova-choco/5 border-nova-choco hover:bg-nova-choco/10'
                                : 'bg-amber-50/40 border-amber-600/60 hover:bg-amber-50/60'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-sm text-nova-choco tracking-wide">{appt.clientName}</span>
                                  <span className="text-[10px] font-mono text-nova-choco/50 tracking-normal font-normal mr-2">
                                    ({appt.clientPhone})
                                  </span>
                                  {sentReminders[appt.id] && (
                                    <span className="text-[9px] font-bold text-green-700 bg-green-100/60 px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></span>
                                      Reminder Sent
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-nova-choco/60 font-sans">
                                  {appt.serviceName} with <span className="font-semibold">{appt.stylist}</span>
                                </p>
                              </div>

                              {/* Interactive Actions within scheduled item */}
                              <div className="flex items-center gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={() => openReminderModal(appt)}
                                  className="flex min-h-10 items-center gap-1 rounded-full border border-nova-sand/35 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-nova-choco shadow-sm transition-all hover:bg-nova-sand/10"
                                  title="Send Client Reminder"
                                >
                                  <Bell className="w-3 h-3 text-nova-sand stroke-[2.5px]" />
                                  <span>Remind</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onCheckOutAppointment(appt)}
                                  className="flex min-h-10 items-center gap-1 rounded-full bg-nova-sand px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-nova-choco shadow-sm transition-all hover:bg-nova-sand/90"
                                  title="Checkout Client"
                                >
                                  <CheckCircle className="w-3 h-3 stroke-[2.5px]" />
                                  <span>Checkout</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteAppointment(appt.id)}
                                  className="flex min-h-10 min-w-10 items-center justify-center rounded-full p-1 text-red-500 transition-colors hover:bg-red-50"
                                  title="Cancel Appointment"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Free slot */
                          <div className="h-16 border-t border-nova-sand/15 flex items-center text-xs text-nova-choco/25 italic font-sans pl-2 select-none group-hover:text-nova-choco/40 transition-colors">
                            Available slot (Double-click or use form to book)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* MONTH VIEW: grid calendar layout matching mockup 3 */
              <div className="flex-grow flex flex-col">
                {/* Week Day Labels */}
                <div className="grid grid-cols-7 text-center mb-2">
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((lbl) => (
                    <span key={lbl} className="text-[10px] font-extrabold text-nova-choco/40 tracking-wider">
                      {lbl}
                    </span>
                  ))}
                </div>

                {/* Grid Cells */}
                <div className="grid min-h-[280px] max-h-[380px] flex-grow grid-cols-7 grid-rows-5 gap-1 border-t border-nova-sand/15 pt-2 sm:gap-1.5">
                  {monthCalendarDays.map((cell, idx) => {
                    const dayAppts = appointments.filter(
                      (appt) => appt.date === cell.dateStr && !appt.checkedOut
                    );
                    const isSelected = cell.dateStr === currentDateStr;

                    return (
                      <div
                        key={idx}
                        onClick={() => setCurrentDateStr(cell.dateStr)}
                        className={`p-2 rounded-2xl flex flex-col justify-between cursor-pointer border min-h-[58px] transition-all duration-200 ${
                          isSelected
                            ? 'bg-nova-sand/20 border-nova-sand shadow-sm'
                            : cell.isCurrentMonth
                            ? 'bg-nova-light/45 border-transparent hover:bg-nova-beige/25 hover:border-nova-sand/20'
                            : 'bg-transparent border-transparent opacity-30 hover:opacity-50'
                        }`}
                      >
                        <span className={`text-[11px] font-bold ${isSelected ? 'text-nova-choco' : 'text-nova-choco/60'}`}>
                          {cell.dayNum}
                        </span>

                        {/* Appointment notifications markers */}
                        <div className="space-y-1">
                          {dayAppts.length > 0 && (
                            <div className="flex flex-col gap-0.5">
                              {dayAppts.slice(0, 2).map((a, aIdx) => (
                                <div
                                  key={aIdx}
                                  className="text-[8px] font-bold truncate bg-nova-choco/5 text-nova-choco px-1 py-0.5 rounded-sm scale-95 border-l-2 border-nova-sand"
                                >
                                  {a.clientName.split(' ')[0]}
                                </div>
                              ))}
                              {dayAppts.length > 2 && (
                                <span className="text-[7.5px] font-extrabold text-nova-sand uppercase tracking-wider text-center block">
                                  +{dayAppts.length - 2} Appts
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Book New Appointment Side Form */}
      <div className="flex w-full flex-col xl:w-2/5">
        <div className="rounded-3xl border border-nova-sand/15 bg-white p-4 shadow-sm md:p-6">
          <h3 className="font-serif text-lg font-semibold mb-5 text-nova-choco flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-nova-sand" />
            <span>Book New Appointment</span>
          </h3>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold mb-1.5 text-nova-choco/70 uppercase tracking-wide">
                Client Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-nova-sand" />
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-full border border-nova-sand/30 text-sm font-sans text-nova-choco bg-nova-light/45 focus:outline-none focus:border-nova-choco focus:bg-white focus:ring-2 focus:ring-nova-sand/20 transition-all duration-200"
                  placeholder="Search or enter name"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold mb-1.5 text-nova-choco/70 uppercase tracking-wide">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-nova-sand" />
                <input
                  type="tel"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-full border border-nova-sand/30 text-sm font-sans text-nova-choco bg-nova-light/45 focus:outline-none focus:border-nova-choco focus:bg-white focus:ring-2 focus:ring-nova-sand/20 transition-all duration-200"
                  placeholder="(555) 000-0000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-bold mb-1.5 text-nova-choco/70 uppercase tracking-wide">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full border border-nova-sand/30 text-xs font-sans text-nova-choco bg-nova-light/45 focus:outline-none focus:border-nova-choco focus:bg-white focus:ring-2 focus:ring-nova-sand/20 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1.5 text-nova-choco/70 uppercase tracking-wide">
                  Time
                </label>
                <select
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full border border-nova-sand/30 text-xs font-sans text-nova-choco bg-white focus:outline-none focus:border-nova-choco focus:ring-2 focus:ring-nova-sand/20 transition-all duration-200"
                >
                  <option value="09:00">09:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="13:00">01:00 PM</option>
                  <option value="14:00">02:00 PM</option>
                  <option value="15:00">03:00 PM</option>
                  <option value="16:00">04:00 PM</option>
                  <option value="17:00">05:00 PM</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold mb-1.5 text-nova-choco/70 uppercase tracking-wide">
                Service
              </label>
              <select
                required
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full px-4 py-2.5 rounded-full border border-nova-sand/30 text-xs font-sans text-nova-choco bg-white focus:outline-none focus:border-nova-choco focus:ring-2 focus:ring-nova-sand/20 transition-all duration-200"
              >
                <option value="">Select Service</option>
                {servicesCatalog.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name} (RM {item.price})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold mb-1.5 text-nova-choco/70 uppercase tracking-wide">
                Stylist
              </label>
              <select
                required
                value={selectedStylist}
                onChange={(e) => setSelectedStylist(e.target.value)}
                className="w-full px-4 py-2.5 rounded-full border border-nova-sand/30 text-xs font-sans text-nova-choco bg-white focus:outline-none focus:border-nova-choco focus:ring-2 focus:ring-nova-sand/20 transition-all duration-200"
              >
                <option value="">Select Stylist</option>
                {stylists.map((st) => (
                  <option key={st.id} value={st.name}>
                    {st.name} ({st.role})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-nova-choco hover:bg-nova-choco/95 text-white py-3.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all mt-4 shadow-md hover:scale-[1.01] active:scale-[0.99]"
            >
              Confirm Booking
            </button>
          </form>
        </div>
      </div>

      {/* Client Reminder Dialog Modal overlay */}
      {selectedReminderAppt && (
        <div className="fixed inset-0 bg-nova-choco/40 backdrop-blur-md flex items-center justify-center z-50 p-4 font-sans animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-nova-sand/20 relative flex flex-col">
            <button
              type="button"
              onClick={() => setSelectedReminderAppt(null)}
              className="absolute right-4 top-4 text-nova-choco/60 hover:text-nova-choco hover:bg-nova-beige/30 p-1.5 rounded-full transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-lg font-bold mb-4 text-nova-choco flex items-center gap-2">
              <Bell className="w-5.5 h-5.5 text-nova-sand stroke-[2.2px] animate-bounce" />
              <span>Send Client Appointment Reminder</span>
            </h3>

            <form onSubmit={handleSendReminder} className="space-y-4">
              {/* Recipient info panel */}
              <div className="bg-nova-light/40 border border-nova-sand/15 rounded-2xl p-3.5 space-y-1 text-xs text-left">
                <div className="flex justify-between">
                  <span className="font-semibold text-nova-choco/50 uppercase tracking-wider text-[9px]">Recipient Client</span>
                  <span className="font-bold text-nova-choco">{selectedReminderAppt.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-nova-choco/50 uppercase tracking-wider text-[9px]">Phone Number</span>
                  <span className="font-mono text-nova-choco font-bold">{selectedReminderAppt.clientPhone}</span>
                </div>
              </div>

              {/* Notification Channel selector */}
              <div className="text-left">
                <label className="block text-[10px] font-extrabold mb-1.5 text-nova-choco/60 uppercase tracking-wider">
                  Dispatch Notification Channel
                </label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-nova-light/60 rounded-xl border border-nova-sand/15">
                  {(['WhatsApp', 'SMS', 'Email'] as const).map((ch) => {
                    const ChIcon = ch === 'WhatsApp' ? MessageSquare : ch === 'SMS' ? Smartphone : Mail;
                    const isActive = reminderChannel === ch;
                    return (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => setReminderChannel(ch)}
                        className={`py-2 px-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                          isActive
                            ? 'bg-nova-sand text-nova-choco shadow-sm font-extrabold'
                            : 'text-nova-choco/60 hover:bg-nova-sand/10 hover:text-nova-choco'
                        }`}
                      >
                        <ChIcon className={`w-3.5 h-3.5 ${isActive ? 'text-nova-choco stroke-[2.2px]' : 'text-nova-choco/50'}`} />
                        <span>{ch}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Draft Message Editor */}
              <div className="text-left">
                <label className="block text-[10px] font-extrabold mb-1.5 text-nova-choco/60 uppercase tracking-wider">
                  Draft Notification Message
                </label>
                <textarea
                  required
                  rows={4}
                  value={reminderText}
                  onChange={(e) => setReminderText(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-nova-sand/30 text-xs font-sans text-nova-choco bg-white focus:outline-none focus:border-nova-choco leading-relaxed resize-none focus:ring-1 focus:ring-nova-sand"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReminderAppt(null)}
                  className="flex-1 border border-nova-sand/30 hover:bg-nova-light/40 text-nova-choco/70 font-bold text-xs py-3 rounded-full uppercase tracking-wider transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-nova-choco hover:bg-nova-choco/95 text-white font-bold text-xs py-3 rounded-full uppercase tracking-wider transition-all shadow-md flex justify-center items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Dispatch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
