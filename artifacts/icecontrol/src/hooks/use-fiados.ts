import { useQueryClient } from "@tanstack/react-query";
import { 
  useListarFiados, 
  useBuscarFiado, 
  useRegistrarPagamentoFiado,
  useListarClientes,
  useCriarCliente,
  useAtualizarCliente
} from "@workspace/api-client-react";

export function useAppFiados(params?: any) {
  return useListarFiados(params);
}

export function useAppFiado(id: number) {
  return useBuscarFiado(id, { query: { enabled: !!id } });
}

export function useAppPagamentoFiado() {
  const queryClient = useQueryClient();
  return useRegistrarPagamentoFiado({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/fiados'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      }
    }
  });
}

export function useAppClientes(params?: any) {
  return useListarClientes(params);
}

export function useAppCriarCliente() {
  const queryClient = useQueryClient();
  return useCriarCliente({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/clientes'] });
      }
    }
  });
}

export function useAppAtualizarCliente() {
  const queryClient = useQueryClient();
  return useAtualizarCliente({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/clientes'] });
      }
    }
  });
}
