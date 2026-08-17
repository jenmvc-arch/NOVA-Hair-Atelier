import {
  CompanyInfo,
  Employee,
  NovaAppState,
  PaymentConfig,
  PaymentMethodItem,
  PosState,
  ReminderRule,
} from './types';
import {
  INITIAL_APPOINTMENTS,
  INITIAL_CATALOG,
  INITIAL_TRANSACTIONS,
} from './data';

export const DEFAULT_PAYMENT_METHODS: PaymentMethodItem[] = [];

export const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
  bankName: 'Maybank',
  accountName: 'NOVA Hair Atelier',
  accountNo: '514012345678',
  duitNowQR: '',
  tngQR: '',
  customMethods: DEFAULT_PAYMENT_METHODS,
};

export const DEFAULT_COMPANY_INFO: CompanyInfo = {
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

export const DEFAULT_POS_STATE: PosState = {
  cart: [],
  selectedStylist: 'Elara V.',
  clientName: '',
  clientPhone: '',
  ticketIndex: 9021,
};

export const DEFAULT_NOTIFICATIONS = [
  'Atelier Station ST-1 online and synced successfully.',
  'Inventory stock list verified.',
];

export const DEFAULT_REMINDER_RULES: ReminderRule[] = [
  { id: 'hc_monthly', category: 'Hair Cut', timeline: 'Monthly', purpose: 'Remind for haircut service', message: "Hi {name}! It's been about a month since your last haircut service at NOVA Hair Atelier. We'd love to help you refresh and maintain your perfect shape. Reply here to secure your preferred slot! 💇‍♀️" },
  { id: 'tr_nextday', category: 'Treatment', timeline: 'Next Day', purpose: 'Follow Up', message: "Hi {name}! We hope your hair and scalp are feeling absolutely amazing after your treatment yesterday at NOVA Hair Atelier! How is your hair feeling? Reply here if you have any questions! ✨" },
  { id: 'tr_monthly', category: 'Treatment', timeline: 'Monthly', purpose: 'Remind to come back', message: 'Hi {name}! Your hair is due for its monthly nourishing treatment to keep it resilient and glowing. Your session at NOVA Hair Atelier is ready for booking! Reply to secure your spot. 🌿' },
  { id: 'cl_nextday', category: 'Coloring', timeline: 'Next Day', purpose: 'Follow Up', message: 'Hi {name}! We hope you love your new color from yesterday! Remember to wash with cool water to keep it vibrant. Let us know how you\'re loving it! 🎨' },
  { id: 'cl_monthly', category: 'Coloring', timeline: 'Monthly', purpose: 'Touch Up and return', message: "Hi {name}! It's been about a month since your color session at NOVA Hair Atelier. We recommend a root touch-up or toner glaze to keep it absolutely stunning! Reply here to book. 💖" },
];

export const DEFAULT_EMPLOYEES: Employee[] = [];

export const DEFAULT_APP_STATE: NovaAppState = {
  catalog: INITIAL_CATALOG,
  appointments: INITIAL_APPOINTMENTS,
  transactions: INITIAL_TRANSACTIONS,
  clients: [],
  employees: DEFAULT_EMPLOYEES,
  paymentConfig: DEFAULT_PAYMENT_CONFIG,
  companyInfo: DEFAULT_COMPANY_INFO,
  pos: DEFAULT_POS_STATE,
  notifications: DEFAULT_NOTIFICATIONS,
  sentReminders: {},
  reminderRules: DEFAULT_REMINDER_RULES,
};
