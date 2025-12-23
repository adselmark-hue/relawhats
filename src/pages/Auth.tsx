import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { BarChart3, Loader2, Mail, Lock, User, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'Senha deve ter no mínimo 6 caracteres');

// Valor bruto do env (pode ser undefined se não injetado no build)
const rawEnvUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;

export default function Auth() {
  const navigate = useNavigate();
  const { user, isLoading, signIn, signUp, signInWithFacebook } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  // Estado do teste de conexão
  const [connectionTest, setConnectionTest] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error';
    message?: string;
  }>({ status: 'idle' });

  const supabaseTargetUrl = useMemo(() => {
    const u = (supabase as unknown as { supabaseUrl?: string }).supabaseUrl;
    return u ?? 'desconhecido';
  }, []);

  useEffect(() => {
    console.info('[Auth Debug] isSupabaseConfigured=', isSupabaseConfigured, 'supabaseUrl=', supabaseTargetUrl, 'rawEnv=', rawEnvUrl);
  }, [supabaseTargetUrl]);

  const testConnection = useCallback(async () => {
    setConnectionTest({ status: 'testing' });
    try {
      // Tenta buscar a health do Supabase (endpoint público)
      const res = await fetch(`${supabaseTargetUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: { 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '' },
      });
      if (res.ok || res.status === 200 || res.status === 404) {
        // 404 é esperado para / sem tabela, mas significa que o servidor respondeu
        setConnectionTest({ status: 'success', message: `Conexão OK (status ${res.status})` });
      } else {
        setConnectionTest({ status: 'error', message: `Erro HTTP ${res.status}` });
      }
    } catch (err) {
      setConnectionTest({ status: 'error', message: err instanceof Error ? err.message : 'Erro desconhecido' });
    }
  }, [supabaseTargetUrl]);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');

  useEffect(() => {
    if (user && !isLoading) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSupabaseConfigured) {
      toast.error('Backend não configurado: o app ainda está apontando para o placeholder. Faça Publish → Update e recarregue.');
      return;
    }

    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setIsSubmitting(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Email ou senha incorretos');
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Por favor, confirme seu email antes de fazer login');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Login realizado com sucesso!');
      navigate('/');
    }
  };

  const handleFacebookLogin = async () => {
    if (!isSupabaseConfigured) {
      toast.error('Backend não configurado.');
      return;
    }

    setIsFacebookLoading(true);
    const { error } = await signInWithFacebook();
    
    if (error) {
      toast.error(error.message || 'Erro ao conectar com Facebook');
      setIsFacebookLoading(false);
    }
    // Não precisa setar false no sucesso pois haverá redirect
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSupabaseConfigured) {
      toast.error('Backend não configurado: o app ainda está apontando para o placeholder. Faça Publish → Update e recarregue.');
      return;
    }

    try {
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setIsSubmitting(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName);
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes('User already registered')) {
        toast.error('Este email já está cadastrado. Tente fazer login.');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Cadastro realizado! Verifique seu email para confirmar a conta.');
      setActiveTab('login');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Alert className="mb-4" variant={isSupabaseConfigured ? 'default' : 'destructive'}>
          <AlertTitle>Diagnóstico de conexão</AlertTitle>
          <AlertDescription>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
                <span className="font-medium">Configurado:</span>
                <span>{isSupabaseConfigured ? '✅ sim' : '❌ não'}</span>

                <span className="font-medium">Env bruto:</span>
                <span className="break-all font-mono text-xs">
                  {rawEnvUrl ?? <span className="text-destructive">undefined</span>}
                </span>

                <span className="font-medium">URL usada:</span>
                <span className="break-all font-mono text-xs">{supabaseTargetUrl}</span>
              </div>

              {!isSupabaseConfigured && (
                <p className="text-muted-foreground">
                  O env <code>VITE_SUPABASE_URL</code> não foi injetado no build. Vá em{' '}
                  <strong>Lovable Settings → Secrets</strong>, confirme os valores e clique em{' '}
                  <strong>Publish → Update</strong>.
                </p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={testConnection}
                  disabled={connectionTest.status === 'testing'}
                >
                  {connectionTest.status === 'testing' ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-1" />
                  )}
                  Testar Conexão
                </Button>

                {connectionTest.status === 'success' && (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-4 w-4" /> {connectionTest.message}
                  </span>
                )}
                {connectionTest.status === 'error' && (
                  <span className="flex items-center gap-1 text-destructive">
                    <XCircle className="h-4 w-4" /> {connectionTest.message}
                  </span>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">Metrifiquei</span>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-foreground">Bem-vindo de volta</CardTitle>
            <CardDescription className="text-muted-foreground">
              Entre na sua conta para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar conta</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      'Entrar'
                    )}
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">ou continue com</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleFacebookLogin}
                    disabled={isFacebookLoading}
                  >
                    {isFacebookLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <svg className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.92 3.78-3.92 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02Z" />
                      </svg>
                    )}
                    Entrar com Facebook
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Seu nome"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      'Criar conta'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <p className="text-xs text-center text-muted-foreground mt-6">
              Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade.
            </p>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground mt-4">
          Dica: Desabilite "Confirm email" nas configurações do Supabase Auth para testes rápidos.
        </p>
      </div>
    </div>
  );
}
