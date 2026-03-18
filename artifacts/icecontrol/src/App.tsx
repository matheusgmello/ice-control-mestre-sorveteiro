import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Caixa from "@/pages/Caixa";
import Produtos from "@/pages/Produtos";
import Estoque from "@/pages/Estoque";
import Fiados from "@/pages/Fiados";
import Relatorios from "@/pages/Relatorios";
import Configuracoes from "@/pages/Configuracoes";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f2e6d8] flex items-center justify-center">
        <div className="text-[#8a5a2b] text-sm animate-pulse">Carregando...</div>
      </div>
    );
  }
  if (!isAuthenticated) return <Redirect to="/login" />;
  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f2e6d8] flex items-center justify-center">
        <div className="text-[#8a5a2b] text-sm animate-pulse">Carregando...</div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? <Redirect to="/" /> : <Login />}
      </Route>
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/caixa">
        <ProtectedRoute component={Caixa} />
      </Route>
      <Route path="/produtos">
        <ProtectedRoute component={Produtos} />
      </Route>
      <Route path="/estoque">
        <ProtectedRoute component={Estoque} />
      </Route>
      <Route path="/fiados">
        <ProtectedRoute component={Fiados} />
      </Route>
      <Route path="/relatorios">
        <ProtectedRoute component={Relatorios} />
      </Route>
      <Route path="/configuracoes">
        <ProtectedRoute component={Configuracoes} />
      </Route>
      <Route>
        {isAuthenticated ? (
          <Layout><NotFound /></Layout>
        ) : (
          <Redirect to="/login" />
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
