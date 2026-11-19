import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { outbox, api } from '@/api';

export function useOnline() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Initialize outbox queue
    outbox.init().catch(() => {});

    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected ?? true;
      setIsOnline(online);
      if (online) {
        // Automatically flush pending mutations when online
        outbox.processQueue(api).catch(() => {});
      }
    });

    return () => unsubscribe();
  }, []);

  return isOnline;
}
