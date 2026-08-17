import { DEFAULT_APP_STATE } from '../defaultState';
import { NovaAppState, NovaAppStateKey } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';

export const APP_STATE_TABLE = 'nova_app_state';

export const APP_STATE_KEYS: NovaAppStateKey[] = [
  'catalog',
  'appointments',
  'transactions',
  'clients',
  'employees',
  'paymentConfig',
  'companyInfo',
  'pos',
  'notifications',
  'sentReminders',
  'reminderRules',
];

const legacyLocalStorageKeys: Partial<Record<NovaAppStateKey, string>> = {
  clients: 'nova_clients',
  employees: 'nova_employees',
  paymentConfig: 'nova_payment_config',
  companyInfo: 'nova_company_info',
  reminderRules: 'nova_reminder_rules',
};

const localStorageKeyFor = (key: NovaAppStateKey) => `nova_app_state_${key}`;
const MOCK_CLIENT_PURGE_FLAG = 'nova_mock_clients_purged_v3';
const MOCK_CLIENT_NAMES = new Set([
  'Vanessa Tan',
  'Marcus Lim',
  'Elara Vance',
  'Chloe Song',
  'Ryan Goh',
]);

function readJsonFromLocalStorage<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.warn(`Unable to read ${key} from localStorage`, error);
    return null;
  }
}

export function readLocalState<K extends NovaAppStateKey>(key: K): NovaAppState[K] {
  const currentValue = readJsonFromLocalStorage<NovaAppState[K]>(localStorageKeyFor(key));
  if (currentValue !== null) {
    if (key === 'clients') {
      return purgeMockClients(currentValue as NovaAppState['clients']) as NovaAppState[K];
    }
    return currentValue;
  }

  const legacyKey = legacyLocalStorageKeys[key];
  const legacyValue = legacyKey ? readJsonFromLocalStorage<NovaAppState[K]>(legacyKey) : null;
  if (legacyValue !== null) {
    if (key === 'clients') {
      return purgeMockClients(legacyValue as NovaAppState['clients']) as NovaAppState[K];
    }
    return legacyValue;
  }

  return DEFAULT_APP_STATE[key];
}

function purgeMockClients(clients: NovaAppState['clients']): NovaAppState['clients'] {
  if (!Array.isArray(clients) || localStorage.getItem(MOCK_CLIENT_PURGE_FLAG)) {
    return clients;
  }

  const cleanedClients = clients.filter((client) => !MOCK_CLIENT_NAMES.has(client.name));
  localStorage.setItem(MOCK_CLIENT_PURGE_FLAG, 'true');

  if (cleanedClients.length !== clients.length) {
    writeLocalState('clients', cleanedClients);
  }

  return cleanedClients;
}

export function writeLocalState<K extends NovaAppStateKey>(key: K, value: NovaAppState[K]) {
  try {
    localStorage.setItem(localStorageKeyFor(key), JSON.stringify(value));

    const legacyKey = legacyLocalStorageKeys[key];
    if (legacyKey) {
      localStorage.setItem(legacyKey, JSON.stringify(value));
    }
  } catch (error) {
    console.warn(`Unable to write ${key} to localStorage`, error);
  }
}

export async function loadSupabaseState(): Promise<Partial<NovaAppState> | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from(APP_STATE_TABLE)
    .select('state_key,value')
    .in('state_key', APP_STATE_KEYS);

  if (error) {
    console.warn('Unable to load app state from Supabase:', error.message);
    return null;
  }

  return (data || []).reduce<Partial<NovaAppState>>((acc, row) => {
    const key = row.state_key as NovaAppStateKey;
    if (APP_STATE_KEYS.includes(key)) {
      acc[key] = row.value as never;
    }
    return acc;
  }, {});
}

export async function saveSupabaseState<K extends NovaAppStateKey>(
  key: K,
  value: NovaAppState[K]
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const client = getSupabaseClient();
  if (!client) {
    return false;
  }

  const { error } = await client
    .from(APP_STATE_TABLE)
    .upsert(
      {
        state_key: key,
        value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'state_key' }
    );

  if (error) {
    console.warn(`Unable to save ${key} to Supabase:`, error.message);
    return false;
  }

  return true;
}
