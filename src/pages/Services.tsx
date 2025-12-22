import { useState } from "react";
import {
  MessageSquare,
  Plus,
  Check,
  X,
  Settings,
  AlertTriangle,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface WhatsAppAccount {
  id: string;
  name: string;
  phone: string;
  status: "connected" | "disconnected" | "error";
  isDefault: boolean;
  lastActivity?: string;
  messagesSent?: number;
}

const mockAccounts: WhatsAppAccount[] = [
  {
    id: "1",
    name: "WhatsApp Principal",
    phone: "+55 11 99999-9999",
    status: "connected",
    isDefault: true,
    lastActivity: "Há 5 minutos",
    messagesSent: 1250,
  },
  {
    id: "2",
    name: "WhatsApp Secundário",
    phone: "+55 21 88888-8888",
    status: "disconnected",
    isDefault: false,
  },
];

export default function Services() {
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>(mockAccounts);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: "",
    phone: "",
  });

  const setDefaultAccount = (id: string) => {
    setAccounts((prev) =>
      prev.map((a) => ({
        ...a,
        isDefault: a.id === id,
      }))
    );
    toast.success("Conta padrão atualizada");
  };

  const handleConnect = (id: string) => {
    toast.info("Gerando QR Code para conexão...");
    setTimeout(() => {
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, status: "connected" as const, lastActivity: "Agora" }
            : a
        )
      );
      toast.success("WhatsApp conectado com sucesso!");
    }, 2000);
  };

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
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Conta</Label>
                <Input
                  placeholder="Ex: WhatsApp Comercial"
                  value={newAccount.name}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, name: e.target.value })
                  }
                  className="bg-muted/50 border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Número do WhatsApp</Label>
                <Input
                  placeholder="+55 11 99999-9999"
                  value={newAccount.phone}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, phone: e.target.value })
                  }
                  className="bg-muted/50 border-border"
                />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-success hover:bg-success/90"
                  onClick={() => {
                    setIsDialogOpen(false);
                    toast.info("Gerando QR Code...");
                  }}
                >
                  Gerar QR Code
                </Button>
              </div>
            </div>
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
        {accounts.map((account) => (
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
                      <h3 className="font-semibold text-foreground">
                        {account.name}
                      </h3>
                      {account.isDefault && (
                        <Badge className="bg-primary/20 text-primary border-primary/30">
                          Padrão
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Phone className="h-4 w-4" />
                      {account.phone}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
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

                  {account.status === "connected" ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Conta padrão
                      </span>
                      <Switch
                        checked={account.isDefault}
                        onCheckedChange={() => setDefaultAccount(account.id)}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="bg-success hover:bg-success/90"
                      onClick={() => handleConnect(account.id)}
                    >
                      Conectar
                    </Button>
                  )}
                </div>
              </div>

              {account.status === "connected" && (
                <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Última atividade</p>
                    <p className="font-medium text-foreground">
                      {account.lastActivity}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Mensagens enviadas</p>
                    <p className="font-medium text-foreground">
                      {account.messagesSent?.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {accounts.length === 0 && (
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
    </div>
  );
}
