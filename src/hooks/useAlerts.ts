import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Alert } from '@/lib/supabase-types';
import { toast } from 'sonner';

export function useAlerts() {
  const { organizationId } = useAuth();
  const queryClient = useQueryClient();

  const { data: alerts, isLoading, error } = useQuery({
    queryKey: ['alerts', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as Alert[];
    },
    enabled: !!organizationId,
  });

  const createAlert = useMutation({
    mutationFn: async (alert: Partial<Alert> & { organization_id: string; name: string; type: string }) => {
      const { data, error } = await supabase
        .from('alerts')
        .insert(alert)
        .select()
        .single();

      if (error) throw error;
      return data as Alert;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', organizationId] });
      toast.success('Alerta criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar alerta: ${error.message}`);
    },
  });

  const updateAlert = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Alert> & { id: string }) => {
      const { data, error } = await supabase
        .from('alerts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Alert;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', organizationId] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar alerta: ${error.message}`);
    },
  });

  const deleteAlert = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', organizationId] });
      toast.success('Alerta excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir alerta: ${error.message}`);
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('alerts')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Alert;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['alerts', organizationId] });
      toast.success(data?.is_active ? 'Alerta ativado' : 'Alerta desativado');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao alterar status: ${error.message}`);
    },
  });

  return {
    alerts: alerts ?? [],
    isLoading,
    error,
    createAlert,
    updateAlert,
    deleteAlert,
    toggleStatus,
  };
}
