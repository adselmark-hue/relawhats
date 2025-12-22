import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Report } from '@/lib/supabase-types';
import { toast } from 'sonner';

export function useReports() {
  const { organizationId } = useAuth();
  const queryClient = useQueryClient();

  const { data: reports, isLoading, error } = useQuery({
    queryKey: ['reports', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as Report[];
    },
    enabled: !!organizationId,
  });

  const createReport = useMutation({
    mutationFn: async (report: Partial<Report> & { organization_id: string; name: string }) => {
      const { data, error } = await supabase
        .from('reports')
        .insert(report)
        .select()
        .single();

      if (error) throw error;
      return data as Report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', organizationId] });
      toast.success('Relatório criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar relatório: ${error.message}`);
    },
  });

  const updateReport = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Report> & { id: string }) => {
      const { data, error } = await supabase
        .from('reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', organizationId] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar relatório: ${error.message}`);
    },
  });

  const deleteReport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', organizationId] });
      toast.success('Relatório excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir relatório: ${error.message}`);
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('reports')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Report;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reports', organizationId] });
      toast.success(data?.is_active ? 'Relatório ativado' : 'Relatório desativado');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao alterar status: ${error.message}`);
    },
  });

  return {
    reports: reports ?? [],
    isLoading,
    error,
    createReport,
    updateReport,
    deleteReport,
    toggleStatus,
  };
}
