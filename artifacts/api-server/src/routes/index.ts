import { Router, type IRouter } from "express";
import healthRouter from "./health";
import astrologyRouter from "./astrology";
import { createGeocodingRouter } from "./geocoding";
import { createProfileRouter } from "../profiles/router";

const router: IRouter = Router();

router.use(healthRouter);
router.use(astrologyRouter);
router.use("/geocoding", createGeocodingRouter());
router.use("/me", createProfileRouter());

export default router;
