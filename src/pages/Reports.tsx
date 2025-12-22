import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  MoreVertical,
  Play,
  Pause,
  Edit,
  Trash2,
  Eye,
  Clock,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";

interface Report {
  id: string;
  name: string;
  channel: "meta" | "google";
  status: boolean;
  frequency: string;
  period: string;
  recipient: string;
  nextSend: string;
  createdAt: string;
}

const mockReports: Report[] = [
  {
    id: "1",
    name: "Relatório Diário - Cliente ABC",
    channel: "meta",
    status: true,
    frequency: "Diário",
    period: "Últimos 7 dias",
    recipient: "+55 11 99999-9999",
    nextSend: "Amanhã, 08:00",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Performance Semanal - Loja XYZ",
    channel: "google",
    status: true,
    frequency: "Semanal",
    period: "Última semana",
    recipient: "Grupo Marketing",
    nextSend: "Segunda, 09:00",
    createdAt: "2024-01-10",
  },
  {
    id: "3",
    name: "Resumo Mensal - E-commerce",
    channel: "meta",
    status: false,
    frequency: "Mensal",
    period: "Último mês",
    recipient: "+55 21 88888-8888",
    nextSend: "01/02, 10:00",
    createdAt: "2024-01-05",
  },
];

const ChannelBadge = ({ channel }: { channel: "meta" | "google" }) => (
  <Badge
    variant="outline"
    className={cn(
      "font-medium",
      channel === "meta"
        ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
        : "border-green-500/30 bg-green-500/10 text-green-400"
    )}
  >
    {channel === "meta" ? "Meta Ads" : "Google Ads"}
  </Badge>
);

export default function Reports() {
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [reports, setReports] = useState<Report[]>(mockReports);
  const [searchTerm, setSearchTerm] = useState("");

  const toggleReportStatus = (id: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: !r.status } : r))
    );
  };

  const filteredReports = reports.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px] bg-muted/50 border-border">
            <SelectValue placeholder="Canal" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all">Todos os canais</SelectItem>
            <SelectItem value="meta">Meta Ads</SelectItem>
            <SelectItem value="google">Google Ads</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
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
                <TableHead className="text-muted-foreground">Canal</TableHead>
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
                      checked={report.status}
                      onCheckedChange={() => toggleReportStatus(report.id)}
                      className="data-[state=checked]:bg-success"
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {report.createdAt}
                  </TableCell>
                  <TableCell className="font-medium">{report.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {report.recipient}
                  </TableCell>
                  <TableCell>
                    <ChannelBadge channel={report.channel} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {report.frequency}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {report.period}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {report.nextSend}
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
                        {report.recipient}
                      </p>
                    </div>
                    <Switch
                      checked={report.status}
                      onCheckedChange={() => toggleReportStatus(report.id)}
                      className="data-[state=checked]:bg-success"
                    />
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <ChannelBadge channel={report.channel} />
                    <span className="text-sm text-muted-foreground">
                      {report.frequency}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{report.period}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Próximo: {report.nextSend}</span>
                  </div>
                </div>
                <div className="p-4 border-t border-border flex justify-end gap-2">
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Edit className="h-4 w-4" /> Editar
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" /> Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredReports.length === 0 && (
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
    </div>
  );
}
