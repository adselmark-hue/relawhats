import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { WhatsappAccount } from '@/lib/supabase-types';
import { toast } from 'sonner';

export function useWhatsAppAccounts() {
  const { organizationId } = useAuth();
  const queryClient = useQueryClient();

  const { data: whatsappAccounts, isLoading, error } = useQuery({
    queryKey: ['whatsapp_accounts', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('whatsapp_accounts')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as WhatsappAccount[];
    },
    enabled: !!organizationId,
  });

  const createWhatsAppAccount = useMutation({
    mutationFn: async (account: Partial<WhatsappAccount> & { organization_id: string; name: string; phone_number: string }) => {
      const { data, error } = await supabase
        .from('whatsapp_accounts')
        .insert(account)
        .select()
        .single();

      if (error) throw error;
      return data as WhatsappAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_accounts', organizationId] });
      toast.success('Conta WhatsApp criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar conta WhatsApp: ${error.message}`);
    },
  });

  const updateWhatsAppAccount = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WhatsappAccount> & { id: string }) => {
      const { data, error } = await supabase
        .from('whatsapp_accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as WhatsappAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_accounts', organizationId] });
      toast.success('Conta WhatsApp atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar conta WhatsApp: ${error.message}`);
    },
  });

  const deleteWhatsAppAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('whatsapp_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_accounts', organizationId] });
      toast.success('Conta WhatsApp excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir conta WhatsApp: ${error.message}`);
    },
  });

  const getDefaultAccount = () => whatsappAccounts?.find(a => a.is_default);

  return {
    whatsappAccounts: whatsappAccounts ?? [],
    isLoading,
    error,
    createWhatsAppAccount,
    updateWhatsAppAccount,
    deleteWhatsAppAccount,
    getDefaultAccount,
  };
}
