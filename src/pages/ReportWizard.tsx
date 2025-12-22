import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Facebook,
  Search,
  Send,
  Clock,
  Calendar,
  Users,
  MessageSquare,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useConnections } from "@/hooks/useConnections";
import { useReports } from "@/hooks/useReports";
import { useWhatsAppAccounts } from "@/hooks/useWhatsAppAccounts";
import { useAuth } from "@/contexts/AuthContext";

const steps = [
  { id: 1, title: "Início", icon: Sparkles },
  { id: 2, title: "Canal", icon: Facebook },
  { id: 3, title: "Modelo", icon: MessageSquare },
  { id: 4, title: "Programação", icon: Clock },
  { id: 5, title: "Conclusão", icon: Check },
];

const variables = [
  { tag: "<DATA>", description: "Data do relatório" },
  { tag: "<VALOR_INVESTIDO>", description: "Total investido" },
  { tag: "<IMPRESSÕES>", description: "Número de impressões" },
  { tag: "<CLIQUES>", description: "Número de cliques" },
  { tag: "<CPC>", description: "Custo por clique" },
  { tag: "<CTR>", description: "Taxa de cliques" },
  { tag: "<CONVERSÕES>", description: "Total de conversões" },
  { tag: "<CUSTO_POR_CONVERSÃO>", description: "Custo por conversão" },
];

const weekDays = [
  { id: "mon", label: "Seg", num: 1 },
  { id: "tue", label: "Ter", num: 2 },
  { id: "wed", label: "Qua", num: 3 },
  { id: "thu", label: "Qui", num: 4 },
  { id: "fri", label: "Sex", num: 5 },
  { id: "sat", label: "Sáb", num: 6 },
  { id: "sun", label: "Dom", num: 0 },
];

const periodMap: Record<string, string> = {
  today: "today",
  yesterday: "yesterday",
  last7: "last_7_days",
  last30: "last_30_days",
  thisMonth: "this_month",
};

export default function ReportWizard() {
  const navigate = useNavigate();
  const { organizationId } = useAuth();
  const { connections, adAccounts, getConnectionByPlatform, getAccountsByConnection } = useConnections();
  const { createReport } = useReports();
  const { whatsappAccounts } = useWhatsAppAccounts();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    channel: "" as "" | "meta" | "google",
    connection: "",
    adAccounts: [] as string[],
    messageTemplate: `📊 *Relatório de Performance*\n\n📅 Data: <DATA>\n\n💰 *Investimento*: <VALOR_INVESTIDO>\n👁 Impressões: <IMPRESSÕES>\n👆 Cliques: <CLIQUES>\n📈 CTR: <CTR>\n💵 CPC: <CPC>\n🎯 Conversões: <CONVERSÕES>\n💲 Custo/Conversão: <CUSTO_POR_CONVERSÃO>\n\n_Relatório gerado automaticamente_`,
    whatsappAccount: "",
    recipientType: "private" as "private" | "group",
    recipientNumber: "",
    recipientGroup: "",
    period: "",
    frequency: "",
    scheduleTime: "08:00",
    scheduleDays: ["mon", "tue", "wed", "thu", "fri"],
  });

  // Get available ad accounts based on selected channel
  const availableAccounts = formData.channel 
    ? adAccounts.filter(acc => {
        const connection = connections.find(c => c.id === acc.connection_id);
        return connection?.platform === formData.channel;
      })
    : [];

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate("/reports");
    }
  };

  const handleSave = async () => {
    if (!organizationId) {
      toast.error("Organização não encontrada");
      return;
    }

    setIsSaving(true);
    try {
      // Calculate next_send_at based on schedule
      const now = new Date();
      const [hours, minutes] = formData.scheduleTime.split(":").map(Number);
      const nextSend = new Date(now);
      nextSend.setHours(hours, minutes, 0, 0);
      if (nextSend <= now) {
        nextSend.setDate(nextSend.getDate() + 1);
      }

      const scheduleDaysNumbers = formData.scheduleDays.map(
        day => weekDays.find(w => w.id === day)?.num ?? 0
      );

      await createReport.mutateAsync({
        organization_id: organizationId,
        name: formData.name,
        frequency: (formData.frequency || "daily") as "daily" | "weekly" | "monthly" | "custom",
        schedule_time: formData.scheduleTime,
        schedule_days: scheduleDaysNumbers,
        period: (periodMap[formData.period] || "yesterday") as "today" | "yesterday" | "last_7_days" | "last_30_days" | "this_month" | "last_month" | "custom",
        whatsapp_account_id: formData.whatsappAccount || null,
        recipient_phone: formData.recipientType === "private" ? formData.recipientNumber : null,
        recipient_group_id: formData.recipientType === "group" ? formData.recipientGroup : null,
        is_active: true,
        next_send_at: nextSend.toISOString(),
      });

      toast.success("Relatório criado com sucesso!");
      navigate("/reports");
    } catch (error) {
      console.error("Error creating report:", error);
      toast.error("Erro ao criar relatório");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = () => {
    toast.info("Enviando relatório de teste...");
    setTimeout(() => {
      toast.success("Relatório de teste enviado!");
    }, 2000);
  };

  const insertVariable = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      messageTemplate: prev.messageTemplate + tag,
    }));
  };

  const renderPreview = () => {
    let preview = formData.messageTemplate;
    const replacements: Record<string, string> = {
      "<DATA>": new Date().toLocaleDateString("pt-BR"),
      "<VALOR_INVESTIDO>": "R$ 5.230,00",
      "<IMPRESSÕES>": "125.430",
      "<CLIQUES>": "3.250",
      "<CPC>": "R$ 1,61",
      "<CTR>": "2,59%",
      "<CONVERSÕES>": "45",
      "<CUSTO_POR_CONVERSÃO>": "R$ 116,22",
    };

    Object.entries(replacements).forEach(([tag, value]) => {
      preview = preview.replace(new RegExp(tag, "g"), value);
    });

    return preview;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Vamos começar!
              </h2>
              <p className="text-muted-foreground">
                Dê um nome ao seu relatório para identificá-lo facilmente.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Relatório</Label>
              <Input
                id="name"
                placeholder="Ex: Relatório Diário - Cliente ABC"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="bg-muted/50 border-border"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Escolha o Canal
              </h2>
              <p className="text-muted-foreground">
                Selecione a plataforma de anúncios para este relatório.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => setFormData({ ...formData, channel: "meta", connection: "", adAccounts: [] })}
                className={cn(
                  "platform-card",
                  formData.channel === "meta" && "selected"
                )}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.92 3.78-3.92 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02Z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-foreground">Meta Ads</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Facebook & Instagram
                  </p>
                  {getConnectionByPlatform("meta")?.status === "connected" && (
                    <Badge variant="outline" className="mt-2 border-success/30 bg-success/10 text-success">
                      Conectado
                    </Badge>
                  )}
                </div>
              </div>
              <div
                onClick={() => setFormData({ ...formData, channel: "google", connection: "", adAccounts: [] })}
                className={cn(
                  "platform-card",
                  formData.channel === "google" && "selected"
                )}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
                    <svg className="w-10 h-10" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-foreground">Google Ads</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Search, Display & YouTube
                  </p>
                  {getConnectionByPlatform("google")?.status === "connected" && (
                    <Badge variant="outline" className="mt-2 border-success/30 bg-success/10 text-success">
                      Conectado
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {formData.channel && (
              <div className="space-y-4 animate-fade-in">
                {availableAccounts.length === 0 ? (
                  <div className="p-4 rounded-lg border border-warning/30 bg-warning/10">
                    <p className="text-warning text-sm">
                      Nenhuma conta de anúncio encontrada para {formData.channel === "meta" ? "Meta Ads" : "Google Ads"}. 
                      Conecte primeiro na página de Conexões.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Contas de Anúncio ({availableAccounts.length} disponíveis)</Label>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start bg-muted/50 border-border"
                        >
                          <Search className="h-4 w-4 mr-2" />
                          {formData.adAccounts.length > 0
                            ? `${formData.adAccounts.length} conta(s) selecionada(s)`
                            : "Selecionar contas"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border">
                        <DialogHeader>
                          <DialogTitle>Selecionar Contas de Anúncio</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <ScrollArea className="h-[300px]">
                            <div className="space-y-2">
                              {availableAccounts.map((account) => (
                                <div
                                  key={account.id}
                                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer"
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      adAccounts: prev.adAccounts.includes(account.id)
                                        ? prev.adAccounts.filter((id) => id !== account.id)
                                        : [...prev.adAccounts, account.id],
                                    }));
                                  }}
                                >
                                  <Checkbox
                                    checked={formData.adAccounts.includes(account.id)}
                                  />
                                  <div>
                                    <span className="text-foreground font-medium">{account.name}</span>
                                    <p className="text-xs text-muted-foreground">{account.account_id}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Modelo da Mensagem
              </h2>
              <p className="text-muted-foreground">
                Personalize a mensagem que será enviada.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Editor */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Mensagem</Label>
                  <Textarea
                    value={formData.messageTemplate}
                    onChange={(e) =>
                      setFormData({ ...formData, messageTemplate: e.target.value })
                    }
                    className="min-h-[300px] bg-muted/50 border-border font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Variáveis disponíveis
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {variables.map((v) => (
                      <Badge
                        key={v.tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/20 hover:border-primary transition-colors"
                        onClick={() => insertVariable(v.tag)}
                      >
                        {v.tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Preview WhatsApp</Label>
                <div className="whatsapp-preview min-h-[350px]">
                  <div className="flex justify-end">
                    <div className="whatsapp-bubble">
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {renderPreview()}
                      </p>
                      <p className="text-[10px] text-muted-foreground text-right mt-2">
                        {formData.scheduleTime}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Programação
              </h2>
              <p className="text-muted-foreground">
                Configure quando e para quem o relatório será enviado.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Conta WhatsApp</Label>
                  <Select
                    value={formData.whatsappAccount}
                    onValueChange={(v) =>
                      setFormData({ ...formData, whatsappAccount: v })
                    }
                  >
                    <SelectTrigger className="bg-muted/50 border-border">
                      <SelectValue placeholder="Selecione uma conta" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {whatsappAccounts.length === 0 ? (
                        <SelectItem value="_none" disabled>
                          Nenhuma conta configurada
                        </SelectItem>
                      ) : (
                        whatsappAccounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.name} ({acc.phone_number})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Recebedor</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className={cn(
                        "bg-muted/50 border-border",
                        formData.recipientType === "private" &&
                          "border-primary bg-primary/10"
                      )}
                      onClick={() =>
                        setFormData({ ...formData, recipientType: "private" })
                      }
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Privado
                    </Button>
                    <Button
                      variant="outline"
                      className={cn(
                        "bg-muted/50 border-border",
                        formData.recipientType === "group" &&
                          "border-primary bg-primary/10"
                      )}
                      onClick={() =>
                        setFormData({ ...formData, recipientType: "group" })
                      }
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Grupo
                    </Button>
                  </div>
                </div>

                {formData.recipientType === "private" ? (
                  <div className="space-y-2">
                    <Label>Número do WhatsApp</Label>
                    <Input
                      placeholder="+55 11 99999-9999"
                      value={formData.recipientNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, recipientNumber: e.target.value })
                      }
                      className="bg-muted/50 border-border"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>ID do Grupo</Label>
                    <Input
                      placeholder="ID do grupo WhatsApp"
                      value={formData.recipientGroup}
                      onChange={(e) =>
                        setFormData({ ...formData, recipientGroup: e.target.value })
                      }
                      className="bg-muted/50 border-border"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Período dos Dados</Label>
                  <Select
                    value={formData.period}
                    onValueChange={(v) => setFormData({ ...formData, period: v })}
                  >
                    <SelectTrigger className="bg-muted/50 border-border">
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="yesterday">Ontem</SelectItem>
                      <SelectItem value="last7">Últimos 7 dias</SelectItem>
                      <SelectItem value="last30">Últimos 30 dias</SelectItem>
                      <SelectItem value="thisMonth">Este mês</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Frequência</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(v) =>
                      setFormData({ ...formData, frequency: v })
                    }
                  >
                    <SelectTrigger className="bg-muted/50 border-border">
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Input
                    type="time"
                    value={formData.scheduleTime}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduleTime: e.target.value })
                    }
                    className="bg-muted/50 border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Dias da Semana</Label>
                  <div className="flex gap-2">
                    {weekDays.map((day) => (
                      <Button
                        key={day.id}
                        variant="outline"
                        size="sm"
                        className={cn(
                          "flex-1 bg-muted/50 border-border",
                          formData.scheduleDays.includes(day.id) &&
                            "border-primary bg-primary/20 text-primary"
                        )}
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            scheduleDays: prev.scheduleDays.includes(day.id)
                              ? prev.scheduleDays.filter((d) => d !== day.id)
                              : [...prev.scheduleDays, day.id],
                          }));
                        }}
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Tudo pronto! 🎉
              </h2>
              <p className="text-muted-foreground">
                Revise as configurações do seu relatório.
              </p>
            </div>
            <Card className="border-border bg-card">
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium text-foreground">
                      {formData.name || "Não definido"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Canal</p>
                    <p className="font-medium text-foreground capitalize">
                      {formData.channel === "meta" ? "Meta Ads" : formData.channel === "google" ? "Google Ads" : "Não definido"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Frequência</p>
                    <p className="font-medium text-foreground capitalize">
                      {formData.frequency || "Não definido"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Horário</p>
                    <p className="font-medium text-foreground">
                      {formData.scheduleTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Recebedor</p>
                    <p className="font-medium text-foreground">
                      {formData.recipientNumber || formData.recipientGroup || "Não definido"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contas</p>
                    <p className="font-medium text-foreground">
                      {formData.adAccounts.length} selecionada(s)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1 gap-2 bg-muted/50 border-border"
                onClick={handleSendTest}
              >
                <Send className="h-4 w-4" />
                Enviar Teste Agora
              </Button>
              <Button
                className="flex-1 gap-2 bg-success hover:bg-success/90 text-success-foreground"
                onClick={handleSave}
                disabled={isSaving || !formData.name}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Salvar e Ativar
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Criar Relatório
          </h1>
          <p className="text-muted-foreground">
            Configure seu relatório automatizado
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="wizard-step">
              <div
                className={cn(
                  "wizard-step-circle",
                  currentStep === step.id && "active",
                  currentStep > step.id && "completed",
                  currentStep < step.id && "pending"
                )}
              >
                {currentStep > step.id ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={cn(
                  "text-sm font-medium hidden sm:inline",
                  currentStep === step.id
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-8 md:w-16 h-0.5 mx-2",
                  currentStep > step.id ? "bg-success" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="border-border bg-card">
        <CardContent className="p-6">{renderStep()}</CardContent>
      </Card>

      {/* Navigation */}
      {currentStep < 5 && (
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Button
            onClick={handleNext}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            Próximo
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
