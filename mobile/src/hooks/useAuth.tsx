import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { api, Operator } from '@/api';
import { toE164 } from '@/lib/phone';

interface AuthContextValue {
  operator: Operator | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  pendingPhone: string;
  hasPromptedLocation: boolean;
  setPendingPhone: (phone: string) => void;
  sendCode: (phone: string) => Promise<void>;
  verifyCode: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
  markLocationPrompted: () => Promise<void>;
  requestLocationPermission: () => Promise<boolean>;
}

const LOCATION_PROMPTED_KEY = '@pumpdesk/location_prompted';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [operator, setOperator] = useState<Operator | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPhone, setPendingPhone] = useState('+12075550168');
  const [hasPromptedLocation, setHasPromptedLocation] = useState(false);

  useEffect(() => {
    async function loadInitial() {
      try {
        const [me, prompted] = await Promise.all([
          api.getMe().catch(() => null),
          AsyncStorage.getItem(LOCATION_PROMPTED_KEY),
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

  const sendCode = async (phone: string) => {
    const e164 = toE164(phone);
    setPendingPhone(e164);
    await api.sendCode(e164);
  };

  const verifyCode = async (code: string) => {
    await api.verifyCode(pendingPhone, code);
    const me = await api.getMe();
    setOperator(me);
  };

  const signOut = async () => {
    await api.signOut();
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
