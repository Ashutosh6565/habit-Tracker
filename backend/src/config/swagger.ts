import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./env";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Habbiters API",
      version: "1.0.0",
      description:
        "REST API for authentication, habit tracking, analytics, payments, notifications, and settings.",
    },
    servers: [
      {
        url: `http://localhost:${env.port}/api/v1`,
        description: "Local API",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
});
