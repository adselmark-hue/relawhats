import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { AdConnection, AdAccount } from '@/lib/supabase-types';
import { toast } from 'sonner';

export function useConnections() {
  const { organizationId } = useAuth();
  const queryClient = useQueryClient();

  const { data: connections, isLoading, error } = useQuery({
    queryKey: ['connections', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('ad_connections')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as AdConnection[];
    },
    enabled: !!organizationId,
  });

  const { data: adAccounts } = useQuery({
    queryKey: ['ad_accounts', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('ad_accounts')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name', { ascending: true });

      if (error) throw error;
      return (data ?? []) as AdAccount[];
    },
    enabled: !!organizationId,
  });

  const updateConnection = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AdConnection> & { id: string }) => {
      const { data, error } = await supabase
        .from('ad_connections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as AdConnection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections', organizationId] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar conexão: ${error.message}`);
    },
  });

  const deleteConnection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ad_connections')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections', organizationId] });
      toast.success('Conexão removida com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover conexão: ${error.message}`);
    },
  });

  const getConnectionByPlatform = (platform: 'meta' | 'google') => {
    // Aceita variações do nome da plataforma (meta, meta_ads, google, google_ads)
    const platformVariants = platform === 'meta' 
      ? ['meta', 'meta_ads'] 
      : ['google', 'google_ads'];
    
    return connections?.find((c) => 
      platformVariants.includes(c.platform) && 
      (c.status === 'connected' || c.status === 'active')
    );
  };

  const getAccountsByConnection = (connectionId: string) =>
    adAccounts?.filter((a) => a.connection_id === connectionId) ?? [];

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['connections', organizationId] });
    queryClient.invalidateQueries({ queryKey: ['ad_accounts', organizationId] });
  };

  return {
    connections: connections ?? [],
    adAccounts: adAccounts ?? [],
    isLoading,
    error,
    updateConnection,
    deleteConnection,
    getConnectionByPlatform,
    getAccountsByConnection,
    refetch,
  };
}
