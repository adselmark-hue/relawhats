import { useState } from "react";
import {
  MessageSquare,
  Plus,
  Check,
  X,
  AlertTriangle,
  Phone,
  RefreshCw,
  Loader2,
  QrCode,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useWhatsAppAccounts } from "@/hooks/useWhatsAppAccounts";
import { useN8nWebhooks } from "@/hooks/useN8nWebhooks";
import { useAuth } from "@/contexts/AuthContext";

export default function Services() {
  const { organizationId } = useAuth();
  const { whatsappAccounts, isLoading, createWhatsAppAccount, updateWhatsAppAccount, deleteWhatsAppAccount } = useWhatsAppAccounts();
  const { whatsappManagement, sendTestMessage } = useN8nWebhooks();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: "",
    phone: "",
  });

  const setDefaultAccount = async (id: string) => {
    // First, unset all defaults
    for (const acc of whatsappAccounts) {
      if (acc.is_default && acc.id !== id) {
        await updateWhatsAppAccount.mutateAsync({ id: acc.id, is_default: false });
      }
    }
    // Then set the new default
    await updateWhatsAppAccount.mutateAsync({ id, is_default: true });
  };

  const handleCreateAccount = async () => {
    if (!organizationId || !newAccount.name) {
      toast.error("Preencha o nome da conta");
      return;
    }

    setIsCreating(true);
    try {
      // Create instance in Evolution API via n8n
      const instanceName = newAccount.name.toLowerCase().replace(/\s+/g, '-');
      
      const result = await whatsappManagement.create(instanceName);
      
      if (result.qrcode?.base64) {
        setQrCodeData(result.qrcode.base64);
      }
      
      // Save to database
      await createWhatsAppAccount.mutateAsync({
        organization_id: organizationId,
        name: newAccount.name,
        phone_number: newAccount.phone || "Aguardando conexão",
        status: "disconnected",
        is_default: whatsappAccounts.length === 0,
        metadata: { instance_name: instanceName },
      });
      
      toast.success("Conta criada! Escaneie o QR Code para conectar.");
    } catch (error) {
      console.error("Error creating WhatsApp account:", error);
      toast.error("Erro ao criar conta WhatsApp");
    } finally {
      setIsCreating(false);
    }
  };

  const handleConnect = async (account: typeof whatsappAccounts[0]) => {
    try {
      const instanceName = (account.metadata as { instance_name?: string })?.instance_name || account.name.toLowerCase().replace(/\s+/g, '-');
      
      toast.loading("Gerando QR Code...", { id: "qr-loading" });
      
      const result = await whatsappManagement.getQrCode(instanceName);
      
      toast.dismiss("qr-loading");
      
      if (result.base64 || result.qrcode?.base64) {
        setQrCodeData(result.base64 || result.qrcode.base64);
        toast.success("QR Code gerado! Escaneie para conectar.");
      } else {
        toast.error("Não foi possível gerar o QR Code");
      }
    } catch (error) {
      toast.dismiss("qr-loading");
      console.error("Error getting QR code:", error);
      toast.error("Erro ao gerar QR Code");
    }
  };

  const handleCheckStatus = async (account: typeof whatsappAccounts[0]) => {
    try {
      const instanceName = (account.metadata as { instance_name?: string })?.instance_name || account.name.toLowerCase().replace(/\s+/g, '-');
      
      const result = await whatsappManagement.getStatus(instanceName);
      
      const isConnected = result.state === "open" || result.instance?.state === "open";
      
      await updateWhatsAppAccount.mutateAsync({
        id: account.id,
        status: isConnected ? "connected" : "disconnected",
      });
      
      toast.success(isConnected ? "WhatsApp conectado!" : "WhatsApp desconectado");
    } catch (error) {
      console.error("Error checking status:", error);
      toast.error("Erro ao verificar status");
    }
  };

  const handleSendTest = async (account: typeof whatsappAccounts[0]) => {
    if (!testPhone) {
      toast.error("Digite um número de telefone");
      return;
    }
    
    setIsSendingTest(true);
    try {
      const instanceName = (account.metadata as { instance_name?: string })?.instance_name || "gzappw";
      
      await sendTestMessage({
        phoneNumber: testPhone,
        message: "🎉 Teste de envio do RelaWhats! Se você recebeu esta mensagem, a conexão está funcionando corretamente.",
        instanceName,
      });
      
      toast.success("Mensagem de teste enviada!");
      setTestDialogOpen(false);
      setTestPhone("");
    } catch (error) {
      console.error("Error sending test message:", error);
      toast.error("Erro ao enviar mensagem de teste");
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta conta?")) {
      deleteWhatsAppAccount.mutate(id);
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Serviços</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas contas WhatsApp para envio de mensagens
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-primary">
              <Plus className="h-4 w-4" />
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                Conectar WhatsApp
              </DialogTitle>
            </DialogHeader>
            
            {qrCodeData ? (
              <div className="space-y-4 text-center">
                <p className="text-muted-foreground">
                  Escaneie o QR Code com seu WhatsApp
                </p>
                <div className="flex justify-center">
                  <img 
                    src={qrCodeData.startsWith('data:') ? qrCodeData : `data:image/png;base64,${qrCodeData}`} 
                    alt="QR Code" 
                    className="w-64 h-64 rounded-lg"
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setQrCodeData(null);
                    setIsDialogOpen(false);
                    setNewAccount({ name: "", phone: "" });
                  }}
                >
                  Fechar
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome da Conta</Label>
                  <Input
                    placeholder="Ex: WhatsApp Comercial"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                    className="bg-muted/50 border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número do WhatsApp (opcional)</Label>
                  <Input
                    placeholder="+55 11 99999-9999"
                    value={newAccount.phone}
                    onChange={(e) => setNewAccount({ ...newAccount, phone: e.target.value })}
                    className="bg-muted/50 border-border"
                  />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    className="bg-success hover:bg-success/90 gap-2"
                    onClick={handleCreateAccount}
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <QrCode className="h-4 w-4" />
                    )}
                    {isCreating ? "Criando..." : "Gerar QR Code"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Warning */}
      <Card className="border-warning/30 bg-warning/5">
        <CardContent className="p-4 flex items-start gap-4">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Importante</p>
            <p className="text-sm text-muted-foreground mt-1">
              Mantenha seu WhatsApp conectado para garantir o envio automático de relatórios.
              Caso a conexão seja perdida, você receberá uma notificação.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Accounts List */}
      <div className="space-y-4">
        {whatsappAccounts.map((account) => (
          <Card key={account.id} className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center",
                      account.status === "connected"
                        ? "bg-success/20"
                        : account.status === "error"
                        ? "bg-destructive/20"
                        : "bg-muted"
                    )}
                  >
                    <MessageSquare
                      className={cn(
                        "h-7 w-7",
                        account.status === "connected"
                          ? "text-success"
                          : account.status === "error"
                          ? "text-destructive"
                          : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{account.name}</h3>
                      {account.is_default && (
                        <Badge className="bg-primary/20 text-primary border-primary/30">
                          Padrão
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Phone className="h-4 w-4" />
                      {account.phone_number}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={cn(
                      account.status === "connected"
                        ? "border-success/30 bg-success/10 text-success"
                        : account.status === "error"
                        ? "border-destructive/30 bg-destructive/10 text-destructive"
                        : "border-muted-foreground/30 bg-muted text-muted-foreground"
                    )}
                  >
                    {account.status === "connected" ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Conectado
                      </>
                    ) : account.status === "error" ? (
                      <>
                        <X className="h-3 w-3 mr-1" />
                        Erro
                      </>
                    ) : (
                      "Desconectado"
                    )}
                  </Badge>

                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => handleCheckStatus(account)}
                  >
                    <RefreshCw className="h-3 w-3" />
                    Status
                  </Button>

                  {account.status === "connected" ? (
                    <>
                      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-1">
                            <Send className="h-3 w-3" />
                            Testar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border">
                          <DialogHeader>
                            <DialogTitle>Enviar Mensagem de Teste</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Número do WhatsApp</Label>
                              <Input
                                placeholder="5511999999999"
                                value={testPhone}
                                onChange={(e) => setTestPhone(e.target.value)}
                                className="bg-muted/50"
                              />
                              <p className="text-xs text-muted-foreground">
                                Formato: código do país + DDD + número (sem espaços)
                              </p>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
                                Cancelar
                              </Button>
                              <Button
                                onClick={() => handleSendTest(account)}
                                disabled={isSendingTest}
                                className="gap-2"
                              >
                                {isSendingTest ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                                Enviar Teste
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Padrão</span>
                        <Switch
                          checked={account.is_default}
                          onCheckedChange={() => setDefaultAccount(account.id)}
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      className="bg-success hover:bg-success/90 gap-1"
                      onClick={() => handleConnect(account)}
                    >
                      <QrCode className="h-3 w-3" />
                      Conectar
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(account.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {whatsappAccounts.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            Nenhuma conta conectada
          </h3>
          <p className="text-muted-foreground mt-1 max-w-sm">
            Conecte uma conta WhatsApp para começar a enviar relatórios automaticamente.
          </p>
          <Button
            className="mt-4 gap-2"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Conectar WhatsApp
          </Button>
        </div>
      )}

      {/* QR Code Dialog */}
      <Dialog open={!!qrCodeData && !isDialogOpen} onOpenChange={() => setQrCodeData(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Escaneie o QR Code</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Abra o WhatsApp no seu celular e escaneie o código
            </p>
            {qrCodeData && (
              <div className="flex justify-center">
                <img 
                  src={qrCodeData.startsWith('data:') ? qrCodeData : `data:image/png;base64,${qrCodeData}`} 
                  alt="QR Code" 
                  className="w-64 h-64 rounded-lg"
                />
              </div>
            )}
            <Button variant="outline" onClick={() => setQrCodeData(null)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
