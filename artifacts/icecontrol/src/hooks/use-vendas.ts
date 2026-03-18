import { useQueryClient } from "@tanstack/react-query";
import { 
  useListarVendas, 
  useCriarVenda, 
  useBuscarVenda,
  useCancelarVenda 
} from "@workspace/api-client-react";

export function useAppVendas(params?: any) {
  return useListarVendas(params);
}

export function useAppVenda(id: number) {
  return useBuscarVenda(id, { query: { enabled: !!id } });
}

export function useAppCriarVenda() {
  const queryClient = useQueryClient();
  return useCriarVenda({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/vendas'] });
        queryClient.invalidateQueries({ queryKey: ['/api/produtos'] });
        queryClient.invalidateQueries({ queryKey: ['/api/sabores'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      }
    }
  });
}

export function useAppCancelarVenda() {
  const queryClient = useQueryClient();
  return useCancelarVenda({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/vendas'] });
        queryClient.invalidateQueries({ queryKey: ['/api/produtos'] });
        queryClient.invalidateQueries({ queryKey: ['/api/sabores'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      }
    }
  });
}
