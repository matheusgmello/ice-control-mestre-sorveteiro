import { Router, type IRouter } from "express";
import healthRouter from "./health";
import produtosRouter from "./produtos";
import tiposSorveteRouter from "./tipos-sorvete";
import estoqueRouter from "./estoque";
import clientesRouter from "./clientes";
import vendasRouter from "./vendas";
import fiadosRouter from "./fiados";
import dashboardRouter from "./dashboard";
import relatoriosRouter from "./relatorios";
import metasRouter from "./metas";

const router: IRouter = Router();

router.use(healthRouter);
router.use(produtosRouter);
router.use(tiposSorveteRouter);
router.use(estoqueRouter);
router.use(clientesRouter);
router.use(vendasRouter);
router.use(fiadosRouter);
router.use(dashboardRouter);
router.use(relatoriosRouter);
router.use(metasRouter);

export default router;
