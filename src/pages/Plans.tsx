import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  limits: {
    reports: number;
    alerts: number;
    clients: number;
    whatsapp: number;
  };
  popular?: boolean;
  current?: boolean;
}

const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 97,
    description: "Perfeito para começar",
    features: [
      "Até 5 relatórios ativos",
      "Até 3 alertas",
      "Até 10 clientes",
      "1 conta WhatsApp",
      "Suporte por email",
    ],
    limits: { reports: 5, alerts: 3, clients: 10, whatsapp: 1 },
  },
  {
    id: "pro",
    name: "Professional",
    price: 197,
    description: "Para agências em crescimento",
    features: [
      "Até 25 relatórios ativos",
      "Até 15 alertas",
      "Até 50 clientes",
      "3 contas WhatsApp",
      "Suporte prioritário",
      "Relatórios personalizados",
    ],
    limits: { reports: 25, alerts: 15, clients: 50, whatsapp: 3 },
    popular: true,
    current: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 497,
    description: "Para grandes operações",
    features: [
      "Relatórios ilimitados",
      "Alertas ilimitados",
      "Clientes ilimitados",
      "10 contas WhatsApp",
      "Suporte dedicado",
      "API completa",
      "White-label",
    ],
    limits: { reports: -1, alerts: -1, clients: -1, whatsapp: 10 },
  },
];

export default function Plans() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground">Planos & Preços</h1>
        <p className="text-muted-foreground mt-2">
          Escolha o plano ideal para o seu negócio. Todos os planos incluem suporte e atualizações.
        </p>
      </div>

      {/* Current Plan Info */}
      <Card className="border-primary/30 bg-primary/5 max-w-2xl mx-auto">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Plano atual</p>
            <p className="font-semibold text-foreground">Professional</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Próxima cobrança</p>
            <p className="font-semibold text-foreground">15/02/2024</p>
          </div>
          <Badge className="bg-success/20 text-success border-success/30">
            Ativo
          </Badge>
        </CardContent>
      </Card>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              "border-border bg-card relative overflow-hidden transition-all duration-300",
              plan.popular && "border-primary shadow-glow-primary",
              plan.current && "ring-2 ring-primary"
            )}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-bl-lg">
                Mais Popular
              </div>
            )}
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-foreground">{plan.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-4">
                <span className="text-4xl font-bold text-foreground">
                  R$ {plan.price}
                </span>
                <span className="text-muted-foreground">/mês</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-success shrink-0" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              {plan.current ? (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled
                >
                  Plano Atual
                </Button>
              ) : (
                <Button
                  className={cn(
                    "w-full",
                    plan.popular
                      ? "bg-primary hover:bg-primary/90"
                      : "bg-muted hover:bg-accent"
                  )}
                >
                  {plan.id === "starter" ? "Fazer Downgrade" : "Fazer Upgrade"}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Usage */}
      <Card className="border-border bg-card max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-lg">Uso Atual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-foreground">8/25</p>
              <p className="text-sm text-muted-foreground">Relatórios</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-foreground">3/15</p>
              <p className="text-sm text-muted-foreground">Alertas</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-foreground">12/50</p>
              <p className="text-sm text-muted-foreground">Clientes</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-foreground">1/3</p>
              <p className="text-sm text-muted-foreground">WhatsApp</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
