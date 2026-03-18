import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Target } from "lucide-react";

export default function Configuracoes() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-3xl font-display font-bold text-primary">Configurações</h2>
        <p className="text-muted-foreground mt-1">Ajustes do sistema e metas.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Target className="w-5 h-5 mr-2 text-secondary" /> Meta Mensal</CardTitle>
          <CardDescription>Defina o objetivo de faturamento para o mês atual.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="space-y-2 flex-1">
              <label className="text-sm font-semibold text-foreground">Valor da Meta (R$)</label>
              <Input type="number" defaultValue={25000} className="font-bold text-lg text-primary" />
            </div>
            <Button className="w-32 h-11"><Save className="w-4 h-4 mr-2" /> Salvar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
