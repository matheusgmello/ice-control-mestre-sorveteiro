import { 
  useRelatorioVendas, 
  useRelatorioProdutosMaisVendidos, 
  useRelatorioSaboresMaisVendidos,
  useRelatorioFormasPagamento
} from "@workspace/api-client-react";

export function useAppRelatorioVendas(params: { dataInicio: string; dataFim: string }) {
  return useRelatorioVendas(params, { query: { enabled: !!params.dataInicio && !!params.dataFim }});
}

export function useAppRelatorioProdutos(params: { dataInicio: string; dataFim: string; limit?: number }) {
  return useRelatorioProdutosMaisVendidos(params, { query: { enabled: !!params.dataInicio && !!params.dataFim }});
}

export function useAppRelatorioSabores(params: { dataInicio: string; dataFim: string }) {
  return useRelatorioSaboresMaisVendidos(params, { query: { enabled: !!params.dataInicio && !!params.dataFim }});
}

export function useAppRelatorioPagamentos(params: { dataInicio: string; dataFim: string }) {
  return useRelatorioFormasPagamento(params, { query: { enabled: !!params.dataInicio && !!params.dataFim }});
}
