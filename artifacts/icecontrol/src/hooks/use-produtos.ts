import { useQueryClient } from "@tanstack/react-query";
import { 
  useListarProdutos, 
  useCriarProduto, 
  useAtualizarProduto, 
  useInativarProduto,
  useListarSabores,
  useCriarSabor,
  useAtualizarSabor,
  useListarTiposSorvete,
  useListarAdicionais
} from "@workspace/api-client-react";

export function useAppProdutos(params?: any) {
  return useListarProdutos(params);
}

export function useAppSabores(params?: any) {
  return useListarSabores(params);
}

export function useAppTiposSorvete() {
  return useListarTiposSorvete();
}

export function useAppAdicionais(params?: { tipo?: string }) {
  return useListarAdicionais(params);
}

export function useAppCriarProduto() {
  const queryClient = useQueryClient();
  return useCriarProduto({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/produtos'] });
      }
    }
  });
}

export function useAppAtualizarProduto() {
  const queryClient = useQueryClient();
  return useAtualizarProduto({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/produtos'] });
      }
    }
  });
}

export function useAppInativarProduto() {
  const queryClient = useQueryClient();
  return useInativarProduto({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/produtos'] });
      }
    }
  });
}

export function useAppCriarSabor() {
  const queryClient = useQueryClient();
  return useCriarSabor({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/sabores'] });
      }
    }
  });
}

export function useAppAtualizarSabor() {
  const queryClient = useQueryClient();
  return useAtualizarSabor({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/sabores'] });
      }
    }
  });
}
