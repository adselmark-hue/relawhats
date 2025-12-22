import { useState } from "react";
import { Bell, Search, X, AlertCircle, CheckCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "error" | "warning" | "success" | "info";
  title: string;
  description: string;
  code?: string;
  timestamp: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "error",
    title: "Falha ao enviar relatório",
    description: "O relatório 'Meta Ads - Cliente ABC' não foi enviado devido a erro de conexão.",
    code: "ERR_CONNECTION_TIMEOUT",
    timestamp: "Há 5 minutos",
    read: false,
  },
  {
    id: "2",
    type: "warning",
    title: "Token expirando",
    description: "O token de acesso do Meta Ads expira em 3 dias.",
    timestamp: "Há 1 hora",
    read: false,
  },
  {
    id: "3",
    type: "success",
    title: "Relatório enviado",
    description: "O relatório 'Google Ads - Cliente XYZ' foi enviado com sucesso.",
    timestamp: "Há 2 horas",
    read: true,
  },
  {
    id: "4",
    type: "info",
    title: "Nova funcionalidade",
    description: "Agora você pode agendar alertas personalizados.",
    timestamp: "Há 1 dia",
    read: true,
  },
];

export function Header() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "error":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "info":
        return <Info className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center justify-between h-full px-6">
        {/* Search */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="pl-10 bg-muted/50 border-border focus:bg-background"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[420px] bg-card border-border p-0">
              <SheetHeader className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-foreground">Notificações</SheetTitle>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="bg-primary/20 text-primary">
                      {unreadCount} não lidas
                    </Badge>
                  )}
                </div>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-100px)]">
                <div className="p-4 space-y-3">
                  {notifications.length === 0 ? (
                    <div className="empty-state py-12">
                      <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Nenhuma notificação</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={cn(
                          "notification-item cursor-pointer",
                          !notification.read && "unread",
                          notification.type === "error" && "error"
                        )}
                      >
                        <div className="flex gap-3">
                          <div className="shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.description}
                            </p>
                            {notification.code && (
                              <code className="block mt-2 text-[10px] bg-background px-2 py-1 rounded font-mono text-destructive">
                                {notification.code}
                              </code>
                            )}
                            <p className="text-[10px] text-muted-foreground mt-2">
                              {notification.timestamp}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
