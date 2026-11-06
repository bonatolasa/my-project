import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("live")
  live() {
    return { status: "ok", service: "virtual-phone-api" };
  }

  @Get("ready")
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: "ok",
        service: "virtual-phone-api",
        dependencies: { postgres: "ok" },
      };
    } catch {
      throw new ServiceUnavailableException({
        status: "unavailable",
        service: "virtual-phone-api",
        dependencies: { postgres: "unavailable" },
      });
    }
  }
}
