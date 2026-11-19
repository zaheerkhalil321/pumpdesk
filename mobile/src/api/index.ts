import { mockApi } from './mock-api';
import { supabaseApi } from './supabase-api';
import { OperatorApi } from './operator-api';

export * from './types';
export * from './operator-api';
export * from './outbox';
export * from './mock-seed';

const mode = process.env.EXPO_PUBLIC_API_MODE || 'mock';

export const api: OperatorApi = mode === 'supabase' ? supabaseApi : mockApi;
