import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { AdAccount } from '@/lib/supabase-types';

export function useAdAccounts() {
  const { organizationId } = useAuth();

  const { data: adAccounts, isLoading, error, refetch } = useQuery({
    queryKey: ['ad_accounts', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('ad_accounts')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return (data ?? []) as AdAccount[];
    },
    enabled: !!organizationId,
  });

  return {
    adAccounts: adAccounts ?? [],
    isLoading,
    error,
    refetch,
  };
}
