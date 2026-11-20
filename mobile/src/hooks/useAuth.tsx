import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { api, ApiError, Operator } from '@/api';
import { sentAtFromRetryAfter } from '@/features/otp';
import { toE164 } from '@/lib/phone';

interface AuthContextValue {
  operator: Operator | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  pendingPhone: string;
  /** When the last code was sent (ms), for the resend timer; null before the first one. */
  codeSentAt: number | null;
  hasPromptedLocation: boolean;
  setPendingPhone: (phone: string) => void;
  sendCode: (phone: string) => Promise<void>;
  verifyCode: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
  markLocationPrompted: () => Promise<void>;
  requestLocationPermission: () => Promise<boolean>;
}

const LOCATION_PROMPTED_KEY = '@pumpdesk/location_prompted';
/** The signed-in operator, kept so the app opens signed in when there is no signal at launch. */
const OPERATOR_KEY = '@pumpdesk/operator';

async function readCachedOperator(): Promise<Operator | null> {
  try {
    const raw = await AsyncStorage.getItem(OPERATOR_KEY);
    return raw ? (JSON.parse(raw) as Operator) : null;
  } catch {
    return null;
  }
}

function cacheOperator(op: Operator | null): void {
  const done = op
    ? AsyncStorage.setItem(OPERATOR_KEY, JSON.stringify(op))
    : AsyncStorage.removeItem(OPERATOR_KEY);
  done.catch(() => undefined);
}

/**
 * Who is signed in at launch. The saved Supabase login stays valid (it refreshes itself), so the
 * operator goes straight to their jobs. Only a login the server no longer accepts sends them to
 * sign-in; no signal keeps them signed in with the operator saved last time.
 */
async function loadOperator(): Promise<Operator | null> {
  try {
    const me = await api.getMe();
    cacheOperator(me);
    return me;
  } catch (err) {
    if (err instanceof ApiError && err.code === 'offline') return readCachedOperator();
    cacheOperator(null);
    return null;
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [operator, setOperator] = useState<Operator | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPhone, setPendingPhone] = useState('+12075550168');
  const [codeSentAt, setCodeSentAt] = useState<number | null>(null);
  const [hasPromptedLocation, setHasPromptedLocation] = useState(false);

  useEffect(() => {
    async function loadInitial() {
      try {
        const [me, prompted] = await Promise.all([
          loadOperator(),
          AsyncStorage.getItem(LOCATION_PROMPTED_KEY).catch(() => null),
        ]);
        if (me) {
          setOperator(me);
        }
        if (prompted === 'true') {
          setHasPromptedLocation(true);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadInitial();
  }, []);

  // The login ended on its own (refresh token expired or revoked): back to sign-in.
  useEffect(
    () =>
      api.onSignedOut(() => {
        cacheOperator(null);
        setOperator(null);
      }),
    []
  );

  const sendCode = async (phone: string) => {
    const e164 = toE164(phone);
    setPendingPhone(e164);
    try {
      await api.sendCode(e164);
      setCodeSentAt(Date.now());
    } catch (err) {
      // The server refused because a code went out a moment ago: keep the timer honest.
      if (err instanceof ApiError && err.code === 'rate_limited' && err.retryAfterSeconds !== null) {
        setCodeSentAt(sentAtFromRetryAfter(err.retryAfterSeconds, Date.now()));
      }
      throw err;
    }
  };

  const verifyCode = async (code: string) => {
    await api.verifyCode(pendingPhone, code);
    const me = await api.getMe();
    cacheOperator(me);
    setOperator(me);
  };

  const signOut = async () => {
    await api.signOut();
    cacheOperator(null);
    setOperator(null);
  };

  const markLocationPrompted = async () => {
    setHasPromptedLocation(true);
    await AsyncStorage.setItem(LOCATION_PROMPTED_KEY, 'true');
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    await markLocationPrompted();
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        operator,
        isAuthenticated: !!operator,
        isLoading,
        pendingPhone,
        codeSentAt,
        hasPromptedLocation,
        setPendingPhone,
        sendCode,
        verifyCode,
        signOut,
        markLocationPrompted,
        requestLocationPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
