import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerConfig } from "../../config/swagger";

export const docsRouter: Router = Router();

docsRouter.use("/", swaggerUi.serve, swaggerUi.setup(swaggerConfig));