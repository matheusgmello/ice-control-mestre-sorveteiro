import { useQueryClient } from "@tanstack/react-query";
import { 
  useListarMovimentacoes, 
  useRegistrarMovimentacao, 
  useMovimentarEstoqueSabor 
} from "@workspace/api-client-react";

export function useAppMovimentacoes(params?: any) {
  return useListarMovimentacoes(params);
}

export function useAppRegistrarMovimentacao() {
  const queryClient = useQueryClient();
  return useRegistrarMovimentacao({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/estoque/movimentacoes'] });
        queryClient.invalidateQueries({ queryKey: ['/api/produtos'] });
      }
    }
  });
}

export function useAppMovimentarSabor() {
  const queryClient = useQueryClient();
  return useMovimentarEstoqueSabor({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/sabores'] });
      }
    }
  });
}
