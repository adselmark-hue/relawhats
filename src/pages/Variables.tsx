import { useState } from "react";
import { Search, Copy, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Variable {
  id: string;
  tag: string;
  name: string;
  description: string;
  platform: "all" | "meta" | "google";
  category: "date" | "metric" | "account" | "campaign";
}

const mockVariables: Variable[] = [
  {
    id: "1",
    tag: "<DATA>",
    name: "Data do Relatório",
    description: "Data formatada do período do relatório",
    platform: "all",
    category: "date",
  },
  {
    id: "2",
    tag: "<VALOR_INVESTIDO>",
    name: "Valor Investido",
    description: "Total investido no período selecionado",
    platform: "all",
    category: "metric",
  },
  {
    id: "3",
    tag: "<IMPRESSÕES>",
    name: "Impressões",
    description: "Número total de impressões",
    platform: "all",
    category: "metric",
  },
  {
    id: "4",
    tag: "<CLIQUES>",
    name: "Cliques",
    description: "Número total de cliques",
    platform: "all",
    category: "metric",
  },
  {
    id: "5",
    tag: "<CTR>",
    name: "CTR",
    description: "Taxa de cliques (Click-Through Rate)",
    platform: "all",
    category: "metric",
  },
  {
    id: "6",
    tag: "<CPC>",
    name: "CPC",
    description: "Custo por clique médio",
    platform: "all",
    category: "metric",
  },
  {
    id: "7",
    tag: "<CONVERSÕES>",
    name: "Conversões",
    description: "Número total de conversões",
    platform: "all",
    category: "metric",
  },
  {
    id: "8",
    tag: "<CUSTO_POR_CONVERSÃO>",
    name: "Custo por Conversão",
    description: "Custo médio por conversão",
    platform: "all",
    category: "metric",
  },
  {
    id: "9",
    tag: "<ALCANCE>",
    name: "Alcance",
    description: "Número de pessoas alcançadas",
    platform: "meta",
    category: "metric",
  },
  {
    id: "10",
    tag: "<FREQUÊNCIA>",
    name: "Frequência",
    description: "Média de vezes que um usuário viu o anúncio",
    platform: "meta",
    category: "metric",
  },
  {
    id: "11",
    tag: "<NOME_CONTA>",
    name: "Nome da Conta",
    description: "Nome da conta de anúncio",
    platform: "all",
    category: "account",
  },
  {
    id: "12",
    tag: "<NOME_CAMPANHA>",
    name: "Nome da Campanha",
    description: "Nome da campanha",
    platform: "all",
    category: "campaign",
  },
];

export default function Variables() {
  const [searchTerm, setSearchTerm] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (tag: string, id: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedId(id);
    toast.success("Variável copiada!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredVariables = mockVariables.filter((v) => {
    const matchesSearch =
      v.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform =
      platformFilter === "all" || v.platform === platformFilter || v.platform === "all";
    const matchesCategory =
      categoryFilter === "all" || v.category === categoryFilter;
    return matchesSearch && matchesPlatform && matchesCategory;
  });

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      date: "Data",
      metric: "Métrica",
      account: "Conta",
      campaign: "Campanha",
    };
    return labels[category] || category;
  };

  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case "meta":
        return (
          <Badge
            variant="outline"
            className="border-blue-500/30 bg-blue-500/10 text-blue-400"
          >
            Meta
          </Badge>
        );
      case "google":
        return (
          <Badge
            variant="outline"
            className="border-green-500/30 bg-green-500/10 text-green-400"
          >
            Google
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="border-muted-foreground/30 bg-muted text-muted-foreground"
          >
            Todos
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Variáveis</h1>
        <p className="text-muted-foreground mt-1">
          Use essas variáveis para personalizar seus templates de mensagem
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar variáveis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-muted/50 border-border"
          />
        </div>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-[180px] bg-muted/50 border-border">
            <SelectValue placeholder="Plataforma" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all">Todas plataformas</SelectItem>
            <SelectItem value="meta">Meta Ads</SelectItem>
            <SelectItem value="google">Google Ads</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px] bg-muted/50 border-border">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all">Todas categorias</SelectItem>
            <SelectItem value="date">Data</SelectItem>
            <SelectItem value="metric">Métricas</SelectItem>
            <SelectItem value="account">Conta</SelectItem>
            <SelectItem value="campaign">Campanha</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Variável</TableHead>
              <TableHead className="text-muted-foreground">Nome</TableHead>
              <TableHead className="text-muted-foreground">Descrição</TableHead>
              <TableHead className="text-muted-foreground">Plataforma</TableHead>
              <TableHead className="text-muted-foreground">Categoria</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVariables.map((variable) => (
              <TableRow key={variable.id} className="border-border">
                <TableCell>
                  <button
                    onClick={() => copyToClipboard(variable.tag, variable.id)}
                    className={cn(
                      "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm transition-all",
                      "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20",
                      copiedId === variable.id && "bg-success/20 text-success border-success/30"
                    )}
                  >
                    {copiedId === variable.id ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    {variable.tag}
                  </button>
                </TableCell>
                <TableCell className="font-medium">{variable.name}</TableCell>
                <TableCell className="text-muted-foreground max-w-xs">
                  {variable.description}
                </TableCell>
                <TableCell>{getPlatformBadge(variable.platform)}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-muted text-muted-foreground">
                    {getCategoryLabel(variable.category)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {filteredVariables.length === 0 && (
        <div className="empty-state">
          <p className="text-muted-foreground">
            Nenhuma variável encontrada com os filtros selecionados.
          </p>
        </div>
      )}
    </div>
  );
}
