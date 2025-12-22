import { useState } from "react";
import {
  Plus,
  Search,
  Bell,
  DollarSign,
  AlertCircle,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  name: string;
  type: "balance" | "error";
  channel: "meta" | "google";
  status: boolean;
  threshold?: number;
  lastTriggered?: string;
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    name: "Saldo Baixo - Cliente ABC",
    type: "balance",
    channel: "meta",
    status: true,
    threshold: 100,
    lastTriggered: "2024-01-18 14:30",
  },
  {
    id: "2",
    name: "Erro API - E-commerce XYZ",
    type: "error",
    channel: "google",
    status: true,
    lastTriggered: "2024-01-15 09:00",
  },
  {
    id: "3",
    name: "Saldo Crítico - Loja Virtual",
    type: "balance",
    channel: "meta",
    status: false,
    threshold: 50,
  },
];

const variables = [
  { tag: "<CA>", description: "Conta de anúncio" },
  { tag: "<SALDO>", description: "Saldo atual" },
  { tag: "<TARGET>", description: "Valor alvo" },
];

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({
    name: "",
    type: "balance" as "balance" | "error",
    channel: "meta" as "meta" | "google",
    threshold: 100,
    account: "",
    messageTemplate: `⚠️ *Alerta de Saldo*\n\n🏷 Conta: <CA>\n💰 Saldo atual: <SALDO>\n🎯 Limite: <TARGET>\n\n_Verifique sua conta imediatamente_`,
  });

  const toggleAlertStatus = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: !a.status } : a))
    );
  };

  const filteredAlerts = alerts.filter((a) =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderPreview = () => {
    let preview = newAlert.messageTemplate;
    const replacements: Record<string, string> = {
      "<CA>": "Cliente ABC - Principal",
      "<SALDO>": "R$ 45,00",
      "<TARGET>": "R$ 100,00",
    };

    Object.entries(replacements).forEach(([tag, value]) => {
      preview = preview.replace(new RegExp(tag, "g"), value);
    });

    return preview;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alertas</h1>
          <p className="text-muted-foreground mt-1">
            Configure alertas inteligentes para suas contas
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-primary">
              <Plus className="h-4 w-4" />
              Criar Alerta
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">Novo Alerta</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <Tabs
                value={newAlert.type}
                onValueChange={(v) =>
                  setNewAlert({ ...newAlert, type: v as "balance" | "error" })
                }
              >
                <TabsList className="grid grid-cols-2 bg-muted">
                  <TabsTrigger
                    value="balance"
                    className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <DollarSign className="h-4 w-4" />
                    Saldo Mínimo
                  </TabsTrigger>
                  <TabsTrigger
                    value="error"
                    className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <AlertCircle className="h-4 w-4" />
                    Erro na Conta
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="balance" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome do Alerta</Label>
                      <Input
                        placeholder="Ex: Saldo Baixo - Cliente ABC"
                        value={newAlert.name}
                        onChange={(e) =>
                          setNewAlert({ ...newAlert, name: e.target.value })
                        }
                        className="bg-muted/50 border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Canal</Label>
                      <Select
                        value={newAlert.channel}
                        onValueChange={(v) =>
                          setNewAlert({ ...newAlert, channel: v as "meta" | "google" })
                        }
                      >
                        <SelectTrigger className="bg-muted/50 border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="meta">Meta Ads</SelectItem>
                          <SelectItem value="google">Google Ads</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Conta de Anúncio</Label>
                      <Select
                        value={newAlert.account}
                        onValueChange={(v) =>
                          setNewAlert({ ...newAlert, account: v })
                        }
                      >
                        <SelectTrigger className="bg-muted/50 border-border">
                          <SelectValue placeholder="Selecione uma conta" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="acc1">Cliente ABC - Principal</SelectItem>
                          <SelectItem value="acc2">E-commerce XYZ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Saldo Mínimo (R$)</Label>
                      <Input
                        type="number"
                        value={newAlert.threshold}
                        onChange={(e) =>
                          setNewAlert({
                            ...newAlert,
                            threshold: Number(e.target.value),
                          })
                        }
                        className="bg-muted/50 border-border"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="error" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome do Alerta</Label>
                      <Input
                        placeholder="Ex: Erro API - Cliente ABC"
                        value={newAlert.name}
                        onChange={(e) =>
                          setNewAlert({ ...newAlert, name: e.target.value })
                        }
                        className="bg-muted/50 border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Canal</Label>
                      <Select
                        value={newAlert.channel}
                        onValueChange={(v) =>
                          setNewAlert({ ...newAlert, channel: v as "meta" | "google" })
                        }
                      >
                        <SelectTrigger className="bg-muted/50 border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="meta">Meta Ads</SelectItem>
                          <SelectItem value="google">Google Ads</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Conta de Anúncio</Label>
                      <Select
                        value={newAlert.account}
                        onValueChange={(v) =>
                          setNewAlert({ ...newAlert, account: v })
                        }
                      >
                        <SelectTrigger className="bg-muted/50 border-border">
                          <SelectValue placeholder="Selecione uma conta" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="acc1">Cliente ABC - Principal</SelectItem>
                          <SelectItem value="acc2">E-commerce XYZ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Preview WhatsApp */}
              <div className="space-y-2">
                <Label>Preview WhatsApp</Label>
                <div className="whatsapp-preview">
                  <div className="flex justify-end">
                    <div className="whatsapp-bubble">
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {renderPreview()}
                      </p>
                      <p className="text-[10px] text-muted-foreground text-right mt-2">
                        Agora
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Criar Alerta
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar alertas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-muted/50 border-border"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Nome</TableHead>
              <TableHead className="text-muted-foreground">Tipo</TableHead>
              <TableHead className="text-muted-foreground">Canal</TableHead>
              <TableHead className="text-muted-foreground">Limite</TableHead>
              <TableHead className="text-muted-foreground">Último Disparo</TableHead>
              <TableHead className="text-muted-foreground w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAlerts.map((alert) => (
              <TableRow key={alert.id} className="border-border">
                <TableCell>
                  <Switch
                    checked={alert.status}
                    onCheckedChange={() => toggleAlertStatus(alert.id)}
                    className="data-[state=checked]:bg-success"
                  />
                </TableCell>
                <TableCell className="font-medium">{alert.name}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      alert.type === "balance"
                        ? "border-warning/30 bg-warning/10 text-warning"
                        : "border-destructive/30 bg-destructive/10 text-destructive"
                    )}
                  >
                    {alert.type === "balance" ? "Saldo" : "Erro"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      alert.channel === "meta"
                        ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                        : "border-green-500/30 bg-green-500/10 text-green-400"
                    )}
                  >
                    {alert.channel === "meta" ? "Meta Ads" : "Google Ads"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {alert.threshold ? `R$ ${alert.threshold},00` : "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {alert.lastTriggered || "-"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border">
                      <DropdownMenuItem className="gap-2 cursor-pointer">
                        <Eye className="h-4 w-4" /> Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 cursor-pointer">
                        <Edit className="h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 cursor-pointer text-destructive">
                        <Trash2 className="h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {filteredAlerts.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Bell className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            Nenhum alerta encontrado
          </h3>
          <p className="text-muted-foreground mt-1 max-w-sm">
            Configure alertas para ser notificado sobre saldo baixo ou erros em suas contas.
          </p>
        </div>
      )}
    </div>
  );
}
