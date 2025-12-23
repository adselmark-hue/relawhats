import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  FileText,
  Bell,
  Users,
  FileCode,
  Variable,
  Link2,
  Puzzle,
  MessageSquare,
  CreditCard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const mainNavItems = [
  { icon: LayoutDashboard, label: "Início", path: "/" },
  { icon: FileText, label: "Relatórios", path: "/reports" },
  { icon: Bell, label: "Alertas", path: "/alerts" },
  { icon: Users, label: "Clientes", path: "/clients" },
  { icon: FileCode, label: "Templates", path: "/templates" },
  { icon: Variable, label: "Variáveis", path: "/variables" },
  { icon: Link2, label: "Conexões", path: "/connections" },
  { icon: Puzzle, label: "Integrações", path: "/integrations" },
  { icon: MessageSquare, label: "Serviços", path: "/services" },
  { icon: CreditCard, label: "Planos & Preços", path: "/plans" },
];

const bottomNavItems = [
  { icon: Settings, label: "Configurações", path: "/settings" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();

  const handleLogout = async () => {
    console.log('[Sidebar] Logout iniciado');
    try {
      await signOut();
      localStorage.clear();
      console.log('[Sidebar] Logout concluído, redirecionando...');
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('[Sidebar] Erro no logout:', error);
    }
  };

  const NavItem = ({
    icon: Icon,
    label,
    path,
  }: {
    icon: typeof LayoutDashboard;
    label: string;
    path: string;
  }) => {
    const isActive = location.pathname === path;

    const content = (
      <Link
        to={path}
        className={cn(
          "nav-item group",
          isActive && "active"
        )}
      >
        <Icon className={cn(
          "h-5 w-5 shrink-0 transition-colors",
          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        )} />
        {!collapsed && (
          <span className="truncate">{label}</span>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="bg-popover border-border">
            {label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-[70px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-foreground tracking-tight">
              Metrifiquei
            </span>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="absolute top-[18px] -right-3 h-6 w-6 rounded-full border border-border bg-background z-50 hover:bg-accent"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {mainNavItems.map((item) => (
          <NavItem key={item.path} {...item} />
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        {bottomNavItems.map((item) => (
          <NavItem key={item.path} {...item} />
        ))}

        {/* User Profile */}
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer",
          collapsed && "justify-center"
        )}>
          <Avatar className="h-8 w-8">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/20 text-primary text-sm">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {profile?.full_name || 'Usuário'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {profile?.email || ''}
              </p>
            </div>
          )}
        </div>

        {/* Logout */}
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button className="nav-item w-full" onClick={handleLogout}>
                <LogOut className="h-5 w-5 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-popover border-border">
              Sair
            </TooltipContent>
          </Tooltip>
        ) : (
          <button className="nav-item w-full" onClick={handleLogout}>
            <LogOut className="h-5 w-5 text-muted-foreground" />
            <span>Sair</span>
          </button>
        )}
      </div>
    </aside>
  );
}
