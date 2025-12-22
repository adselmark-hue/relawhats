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
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useAlerts } from "@/hooks/useAlerts";
import { useAuth } from "@/contexts/AuthContext";

const typeLabels: Record<string, string> = {
  balance: "Saldo",
  error: "Erro",
  performance: "Performance",
};

export default function Alerts() {
  const { organizationId } = useAuth();
  const { alerts, isLoading, createAlert, toggleStatus, deleteAlert } = useAlerts();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newAlert, setNewAlert] = useState({
    name: "",
    type: "balance" as "balance" | "error" | "performance",
    threshold: 100,
    account: "",
    messageTemplate: `⚠️ *Alerta de Saldo*\n\n🏷 Conta: <CA>\n💰 Saldo atual: <SALDO>\n🎯 Limite: <TARGET>\n\n_Verifique sua conta imediatamente_`,
  });

  const filteredAlerts = alerts.filter((a) =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    if (!organizationId || !newAlert.name) return;

    createAlert.mutate({
      organization_id: organizationId,
      name: newAlert.name,
      type: newAlert.type,
      threshold_value: newAlert.threshold,
    });
    setIsDialogOpen(false);
    setNewAlert({
      name: "",
      type: "balance",
      threshold: 100,
      account: "",
      messageTemplate: `⚠️ *Alerta de Saldo*\n\n🏷 Conta: <CA>\n💰 Saldo atual: <SALDO>\n🎯 Limite: <TARGET>\n\n_Verifique sua conta imediatamente_`,
    });
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteAlert.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const renderPreview = () => {
    let preview = newAlert.messageTemplate;
    const replacements: Record<string, string> = {
      "<CA>": "Cliente ABC - Principal",
      "<SALDO>": "R$ 45,00",
      "<TARGET>": `R$ ${newAlert.threshold},00`,
    };

    Object.entries(replacements).forEach(([tag, value]) => {
      preview = preview.replace(new RegExp(tag, "g"), value);
    });

    return preview;
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
                  setNewAlert({ ...newAlert, type: v as "balance" | "error" | "performance" })
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
                      <Label>Nome do Alerta *</Label>
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
                  <div className="space-y-2">
                    <Label>Nome do Alerta *</Label>
                    <Input
                      placeholder="Ex: Erro API - Cliente ABC"
                      value={newAlert.name}
                      onChange={(e) =>
                        setNewAlert({ ...newAlert, name: e.target.value })
                      }
                      className="bg-muted/50 border-border"
                    />
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
                  onClick={handleCreate}
                  disabled={!newAlert.name || createAlert.isPending}
                >
                  {createAlert.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
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
              <TableHead className="text-muted-foreground">Limite</TableHead>
              <TableHead className="text-muted-foreground w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAlerts.map((alert) => (
              <TableRow key={alert.id} className="border-border">
                <TableCell>
                  <Switch
                    checked={alert.is_active}
                    onCheckedChange={(checked) =>
                      toggleStatus.mutate({ id: alert.id, is_active: checked })
                    }
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
                    {typeLabels[alert.type] || alert.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {alert.threshold_value ? `R$ ${alert.threshold_value},00` : "-"}
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
                      <DropdownMenuItem
                        className="gap-2 cursor-pointer text-destructive"
                        onClick={() => setDeleteId(alert.id)}
                      >
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

      {filteredAlerts.length === 0 && !isLoading && (
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir alerta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O alerta será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
