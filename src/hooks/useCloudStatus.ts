import { useState, useEffect } from 'react';
import { checkConnection } from '../lib/cloudSync';
import { isSupabaseConfigured } from '../lib/supabase';

export type CloudStatus = 'disabled' | 'checking' | 'connected' | 'disconnected';

export function useCloudStatus() {
  const [status, setStatus] = useState<CloudStatus>(
    isSupabaseConfigured ? 'checking' : 'disabled'
  );

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus('disabled');
      return;
    }

    const check = async () => {
      const ok = await checkConnection();
      setStatus(ok ? 'connected' : 'disconnected');
    };

    check();
    // Re-check every 30 seconds
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return status;
}
