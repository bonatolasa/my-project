import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validateEnvironment } from "./config/environment";
import { HealthController } from "./health.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { RateLimitMiddleware } from "./common/rate-limit.middleware";
import { AuthModule } from "./auth/auth.module";
import { WorkspaceModule } from "./workspace/workspace.module";
import { SmsModule } from "./sms/sms.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ["../../.env", ".env"], validate: validateEnvironment }),
    PrismaModule,
    AuthModule,
    WorkspaceModule,
    SmsModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
