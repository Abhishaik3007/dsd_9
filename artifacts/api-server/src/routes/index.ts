import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import tablewaveRouter from "./tablewave";
import mockTablewaveRouter from "./mock-tablewave";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);

if (process.env.DATABASE_URL) {
  router.use(tablewaveRouter);
} else {
  console.log("[Tablewave API] No DATABASE_URL found. Running with in-memory multi-tenant mock store & demo auth.");
  router.use(mockTablewaveRouter);
}

export default router;
