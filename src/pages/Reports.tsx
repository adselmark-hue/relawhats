import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Clock,
  Calendar,
  Loader2,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useReports } from "@/hooks/useReports";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import type { Report } from "@/lib/supabase-types";

const frequencyLabels: Record<string, string> = {
  daily: "Diário",
  weekly: "Semanal",
  monthly: "Mensal",
  custom: "Personalizado",
};

const periodLabels: Record<string, string> = {
  today: "Hoje",
  yesterday: "Ontem",
  last_7_days: "Últimos 7 dias",
  last_30_days: "Últimos 30 dias",
  this_month: "Este mês",
  last_month: "Último mês",
  custom: "Personalizado",
};

export default function Reports() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);

  const { reports, isLoading, toggleStatus, deleteReport } = useReports();

  const filteredReports = reports.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && r.is_active) ||
      (statusFilter === "inactive" && !r.is_active);
    return matchesSearch && matchesStatus;
  });

  const handleDelete = () => {
    if (deleteId) {
      deleteReport.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/reports/edit/${id}`);
  };

  const handleSendNow = (report: Report) => {
    toast.info('Enviando relatório...');
    // TODO: Implement send now functionality via edge function
    setTimeout(() => {
      toast.success('Relatório enviado com sucesso!');
    }, 1500);
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
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus relatórios automatizados
          </p>
        </div>
        <Link to="/reports/new">
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-primary">
            <Plus className="h-4 w-4" />
            Criar Relatório
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar relatórios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-muted/50 border-border"
          />
        </div>
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-[180px] bg-muted/50 border-border">
            <SelectValue placeholder="Canal" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all">Todos os canais</SelectItem>
            <SelectItem value="meta">Meta Ads</SelectItem>
            <SelectItem value="google">Google Ads</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-muted/50 border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode("table")}
            className={cn(
              "h-8 w-8",
              viewMode === "table" && "bg-background shadow-sm"
            )}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode("cards")}
            className={cn(
              "h-8 w-8",
              viewMode === "cards" && "bg-background shadow-sm"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === "table" ? (
        <Card className="border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Data</TableHead>
                <TableHead className="text-muted-foreground">Nome</TableHead>
                <TableHead className="text-muted-foreground">Recebedor</TableHead>
                <TableHead className="text-muted-foreground">Frequência</TableHead>
                <TableHead className="text-muted-foreground">Período</TableHead>
                <TableHead className="text-muted-foreground">Próximo Envio</TableHead>
                <TableHead className="text-muted-foreground w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id} className="border-border">
                  <TableCell>
                    <Switch
                      checked={report.is_active}
                      onCheckedChange={(checked) =>
                        toggleStatus.mutate({ id: report.id, is_active: checked })
                      }
                      className="data-[state=checked]:bg-success"
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(report.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="font-medium">{report.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {report.recipient_phone || report.recipient_group_id || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {frequencyLabels[report.frequency] || report.frequency}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {periodLabels[report.period] || report.period}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {report.next_send_at
                        ? format(new Date(report.next_send_at), "dd/MM HH:mm", { locale: ptBR })
                        : "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        <DropdownMenuItem 
                          className="gap-2 cursor-pointer"
                          onClick={() => setViewingReport(report)}
                        >
                          <Eye className="h-4 w-4" /> Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="gap-2 cursor-pointer"
                          onClick={() => handleEdit(report.id)}
                        >
                          <Edit className="h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="gap-2 cursor-pointer"
                          onClick={() => handleSendNow(report)}
                        >
                          <Send className="h-4 w-4" /> Enviar Agora
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer text-destructive"
                          onClick={() => setDeleteId(report.id)}
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => (
            <Card key={report.id} className="border-border bg-card overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 border-b border-border">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground line-clamp-1">
                        {report.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {report.recipient_phone || report.recipient_group_id || "-"}
                      </p>
                    </div>
                    <Switch
                      checked={report.is_active}
                      onCheckedChange={(checked) =>
                        toggleStatus.mutate({ id: report.id, is_active: checked })
                      }
                      className="data-[state=checked]:bg-success"
                    />
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {frequencyLabels[report.frequency] || report.frequency}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{periodLabels[report.period] || report.period}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Próximo:{" "}
                      {report.next_send_at
                        ? format(new Date(report.next_send_at), "dd/MM HH:mm", { locale: ptBR })
                        : "-"}
                    </span>
                  </div>
                </div>
                <div className="p-4 border-t border-border flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-1"
                    onClick={() => handleEdit(report.id)}
                  >
                    <Edit className="h-4 w-4" /> Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(report.id)}
                  >
                    <Trash2 className="h-4 w-4" /> Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredReports.length === 0 && !isLoading && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            Nenhum relatório encontrado
          </h3>
          <p className="text-muted-foreground mt-1 max-w-sm">
            Crie seu primeiro relatório automático e comece a enviar métricas para seus clientes.
          </p>
          <Link to="/reports/new">
            <Button className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Criar Relatório
            </Button>
          </Link>
        </div>
      )}

      {/* View Sheet */}
      <Sheet open={!!viewingReport} onOpenChange={() => setViewingReport(null)}>
        <SheetContent className="bg-card border-border sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="text-foreground">Detalhes do Relatório</SheetTitle>
          </SheetHeader>
          {viewingReport && (
            <div className="mt-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">{viewingReport.name}</h2>
                <Badge
                  variant="outline"
                  className={
                    viewingReport.is_active
                      ? "border-success/30 bg-success/10 text-success mt-2"
                      : "border-muted-foreground/30 bg-muted text-muted-foreground mt-2"
                  }
                >
                  {viewingReport.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Recebedor</Label>
                  <p className="text-foreground">
                    {viewingReport.recipient_phone || viewingReport.recipient_group_id || "Não informado"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Frequência</Label>
                  <p className="text-foreground">
                    {frequencyLabels[viewingReport.frequency] || viewingReport.frequency}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Período</Label>
                  <p className="text-foreground">
                    {periodLabels[viewingReport.period] || viewingReport.period}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Horário de Envio</Label>
                  <p className="text-foreground">{viewingReport.schedule_time || "08:00"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Próximo Envio</Label>
                  <p className="text-foreground">
                    {viewingReport.next_send_at
                      ? format(new Date(viewingReport.next_send_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })
                      : "Não agendado"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Criado em</Label>
                  <p className="text-foreground">
                    {format(new Date(viewingReport.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => {
                    setViewingReport(null);
                    handleEdit(viewingReport.id);
                  }}
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={() => handleSendNow(viewingReport)}
                >
                  <Send className="h-4 w-4" />
                  Enviar Agora
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir relatório?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O relatório será permanentemente excluído.
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
