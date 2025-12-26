import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Check,
  X,
  Settings,
  RefreshCw,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useConnections } from "@/hooks/useConnections";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase";

// Debug helper
const logDebug = (msg: string, data?: object) => {
  console.log(`[Connections] ${msg}`, data || '');
};

export default function Connections() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { connections, isLoading, deleteConnection, getConnectionByPlatform, getAccountsByConnection, refetch } = useConnections();

  // Handle OAuth callback messages from URL params (after redirect from n8n)
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    // Aceita success=true OU success=meta
    if (success === 'true' || success === 'meta') {
      logDebug('OAuth callback success detected, forcing refetch...');
      
      // Limpa a URL imediatamente para evitar re-triggers
      setSearchParams({}, { replace: true });
      
      // Força refetch múltiplas vezes para garantir que os dados sejam carregados
      const doRefetch = async () => {
        await refetch();
        // Segundo refetch após 1s para garantir que o n8n terminou de salvar
        setTimeout(() => {
          logDebug('Secondary refetch...');
          refetch();
        }, 1000);
      };
      
      doRefetch();
      toast.success('Conexão realizada com sucesso!');
    } else if (error) {
      toast.error(`Erro na conexão: ${decodeURIComponent(error)}`);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, refetch]);

  const handleConnect = async (platform: "meta" | "google") => {
    // Única verificação: usuário logado
    let userId = user?.id;

    if (!userId) {
      // Fallback: buscar direto do Supabase
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id;
    }

    if (!userId) {
      toast.error('Faça login primeiro');
      return;
    }

    if (platform === "meta") {
      const META_APP_ID = "862504603144230";
      const REDIRECT_URI = "https://n8n-n8n.5lgyrt.easypanel.host/webhook/meta-oauth-callback";
      // O n8n vai se encarregar de achar a organização pelo ID do usuário
      const STATE = userId;
      const SCOPE = "ads_read,business_management";
      
      const oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${STATE}&scope=${SCOPE}&response_type=code`;
      
      logDebug('Redirecionando para OAuth Meta:', { userId, oauthUrl });
      window.location.href = oauthUrl;
    } else {
      toast.info('Google Ads em breve!');
    }
  };

  const handleDisconnect = (id: string) => {
    deleteConnection.mutate(id);
  };

  const handleSync = async (id: string) => {
    toast.loading('Sincronizando contas...', { id: 'sync-loading' });
    
    try {
      const { data, error } = await supabase.functions.invoke('meta-ad-accounts', {
        body: { connectionId: id },
      });

      toast.dismiss('sync-loading');

      if (error) {
        toast.error('Erro ao sincronizar contas');
        return;
      }

      toast.success(`${data.accounts?.length || 0} contas sincronizadas!`);
      refetch();
    } catch (err) {
      toast.dismiss('sync-loading');
      toast.error('Erro ao sincronizar');
    }
  };

  const metaConnection = getConnectionByPlatform("meta");
  const googleConnection = getConnectionByPlatform("google");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Conexões</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie suas conexões com plataformas de anúncios
        </p>
      </div>

      {/* Connections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meta Ads */}
        <Card className="border-border bg-card overflow-hidden">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.92 3.78-3.92 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02Z" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-foreground">Meta Ads</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Facebook & Instagram Ads
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  metaConnection
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-muted-foreground/30 bg-muted text-muted-foreground"
                )}
              >
                {metaConnection ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Conectado
                  </>
                ) : (
                  "Desconectado"
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {metaConnection ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nome</p>
                    <p className="font-medium text-foreground">{metaConnection.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Contas</p>
                    <p className="font-medium text-foreground">
                      {getAccountsByConnection(metaConnection.id).length} conectadas
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleSync(metaConnection.id)}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Sincronizar
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Configurar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-destructive hover:text-destructive"
                    onClick={() => handleDisconnect(metaConnection.id)}
                    disabled={deleteConnection.isPending}
                  >
                    <X className="h-4 w-4" />
                    Desconectar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  Conecte sua conta Meta Business para acessar suas contas de anúncio.
                </p>
                <Button
                  className="gap-2 bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={() => handleConnect("meta")}
                >
                  <ExternalLink className="h-4 w-4" />
                  Conectar com Meta
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Google Ads */}
        <Card className="border-border bg-card overflow-hidden">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-foreground">Google Ads</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Search, Display & YouTube
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  googleConnection
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-muted-foreground/30 bg-muted text-muted-foreground"
                )}
              >
                {googleConnection ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Conectado
                  </>
                ) : (
                  "Desconectado"
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {googleConnection ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nome</p>
                    <p className="font-medium text-foreground">{googleConnection.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Contas</p>
                    <p className="font-medium text-foreground">
                      {getAccountsByConnection(googleConnection.id).length} conectadas
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleSync(googleConnection.id)}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Sincronizar
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Configurar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-destructive hover:text-destructive"
                    onClick={() => handleDisconnect(googleConnection.id)}
                    disabled={deleteConnection.isPending}
                  >
                    <X className="h-4 w-4" />
                    Desconectar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  Conecte sua conta Google Ads para acessar suas campanhas.
                </p>
                <Button
                  className="gap-2 bg-gradient-to-r from-blue-500 via-green-500 to-yellow-500 hover:opacity-90 text-white"
                  onClick={() => handleConnect("google")}
                >
                  <ExternalLink className="h-4 w-4" />
                  Conectar com Google
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
