import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  IceCream, 
  PackageSearch, 
  Users, 
  BarChart3, 
  Settings,
  LogOut,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { usuario, logout } = useAuth();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/caixa", label: "Caixa (PDV)", icon: ShoppingCart },
    { href: "/produtos", label: "Produtos & Sabores", icon: IceCream },
    { href: "/estoque", label: "Estoque", icon: PackageSearch },
    { href: "/fiados", label: "Fiados", icon: Users },
    { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
    { href: "/configuracoes", label: "Configurações", icon: Settings },
  ];

  const iniciais = usuario?.nome
    ? usuario.nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "??";

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-sidebar flex flex-col border-r border-sidebar-border shadow-xl z-10 hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <img 
            src={`${import.meta.env.BASE_URL}images/logo.png`} 
            alt="IceControl Logo" 
            className="h-8 w-8 mr-3 rounded-full"
          />
          <h1 className="text-sidebar-foreground font-display font-bold text-xl tracking-tight">IceControl <span className="text-secondary opacity-80 text-sm">v2.0</span></h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-md shadow-black/10" 
                  : "text-sidebar-foreground/80 hover:bg-white/5 hover:text-white"
              )}>
                <item.icon className={cn("w-5 h-5 mr-3", isActive ? "text-white" : "opacity-70")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center space-x-3 px-3 py-2 bg-black/10 rounded-xl mb-2">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-xs">
              {iniciais}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{usuario?.nome ?? "—"}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate capitalize">{usuario?.role ?? "admin"}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/70 hover:bg-white/5 hover:text-white"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-20 md:hidden">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="font-display font-bold text-xl text-primary">IceControl</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} title="Sair">
            <LogOut className="h-5 w-5" />
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
          <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]">
            <img 
              src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
              alt="bg" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative z-10 h-full max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
