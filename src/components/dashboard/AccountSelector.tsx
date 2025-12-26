import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Building2, RefreshCw } from "lucide-react";
import type { AdAccount } from "@/lib/supabase-types";

interface AccountSelectorProps {
  accounts: AdAccount[];
  selectedAccountId: string | null;
  onSelect: (accountId: string) => void;
  isLoading?: boolean;
  hasConnection?: boolean;
  onSync?: () => void;
  isSyncing?: boolean;
}

export function AccountSelector({ 
  accounts, 
  selectedAccountId, 
  onSelect, 
  isLoading,
  hasConnection,
  onSync,
  isSyncing 
}: AccountSelectorProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg animate-pulse">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Carregando contas...</span>
      </div>
    );
  }

  if (accounts.length === 0) {
    // Se tem conexão mas sem contas, mostra botão de sincronizar
    if (hasConnection && onSync) {
      return (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Nenhuma conta sincronizada</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onSync}
            disabled={isSyncing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar Contas'}
          </Button>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Nenhuma conta conectada</span>
      </div>
    );
  }

  return (
    <Select value={selectedAccountId ?? undefined} onValueChange={onSelect}>
      <SelectTrigger className="w-[280px] bg-card border-border">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder="Selecione uma conta" />
        </div>
      </SelectTrigger>
      <SelectContent className="bg-popover border-border">
        {accounts.map((account) => (
          <SelectItem 
            key={account.id} 
            value={account.id}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span>{account.name}</span>
              <span className="text-xs text-muted-foreground">
                ({account.currency})
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
