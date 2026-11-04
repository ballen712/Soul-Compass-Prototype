import { Router, type IRouter } from "express";
import healthRouter from "./health";
import astrologyRouter from "./astrology";

const router: IRouter = Router();

router.use(healthRouter);
router.use(astrologyRouter);

export default router;
