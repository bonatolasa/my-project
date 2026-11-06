import { Body, Controller, Delete, Get, Headers, Param, Post, Req, UnauthorizedException, UnsupportedMediaTypeException } from "@nestjs/common";
import { IsArray, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";
import type { Request } from "express";
import { AuthService } from "../auth/auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { SmsService } from "./sms.service";

class SendDto { @IsString() @Matches(/^\+[1-9]\d{7,14}$/) to!: string; @IsString() @MinLength(1) @MaxLength(1600) text!: string; }
class BulkDto { @IsArray() @IsString({ each: true }) recipients!: string[]; @IsString() @MinLength(1) @MaxLength(1600) text!: string; }
class OtpDto { @IsString() @Matches(/^\+[1-9]\d{7,14}$/) phone!: string; @IsOptional() @IsString() purpose?: string; }
class VerifyDto extends OtpDto { @IsString() @Matches(/^\d{6}$/) code!: string; }

@Controller()
export class SmsController {
  constructor(private readonly sms: SmsService, private readonly auth: AuthService, private readonly prisma: PrismaService) {}
  private async userId(request: Request) {
    const token = (request.headers.cookie ?? "").split(";").map((part) => part.trim()).find((part) => part.startsWith("vp_session="))?.slice("vp_session=".length);
    return (await this.auth.current(token)).id;
  }
  @Post("sms/send") async send(@Req() req: Request, @Body() body: SendDto) { return this.sms.send(await this.userId(req), body.to, body.text); }
  @Post("sms/bulk") async bulk(@Req() req: Request, @Body() body: BulkDto) { return this.sms.bulk(await this.userId(req), body.recipients, body.text); }
  @Get("sms/history") async history(@Req() req: Request) { return this.sms.history(await this.userId(req)); }
  @Get("sms/:id/status") async status(@Req() req: Request, @Param("id") id: string) { return this.sms.status(await this.userId(req), id); }
  @Post("otp/send") async otp(@Req() req: Request, @Body() body: OtpDto) { return this.sms.sendOtp(await this.userId(req), body.phone, body.purpose); }
  @Post("otp/resend") async resend(@Req() req: Request, @Body() body: OtpDto) { return this.sms.sendOtp(await this.userId(req), body.phone, body.purpose); }
  @Post("otp/verify") async verify(@Req() req: Request, @Body() body: VerifyDto) { return this.sms.verifyOtp(await this.userId(req), body.phone, body.code, body.purpose); }
  @Get("providers") async providers(@Req() req: Request) { await this.userId(req); return { mode: this.sms.mode(), providers: this.sms.providers() }; }
  @Get("phone-numbers/available") async available(@Req() req: Request) { await this.userId(req); return { items: await this.prisma.phoneNumber.findMany({ where: { status: "AVAILABLE", provider: { not: "mock" } }, include: { country: true }, take: 100 }), simulated: false }; }
  @Post("phone-numbers/purchase") async purchase(@Req() req: Request) { await this.userId(req); throw new UnsupportedMediaTypeException("Number purchase requires a configured live provider and billing integration"); }
  @Get("phone-numbers") async numbers(@Req() req: Request) { const userId = await this.userId(req); return this.prisma.numberRental.findMany({ where: { userId }, include: { phoneNumber: true } }); }
  @Delete("phone-numbers/:id") async release(@Req() req: Request, @Param("id") id: string) { const userId = await this.userId(req); const rental = await this.prisma.numberRental.findFirst({ where: { id, userId } }); if (!rental) throw new UnauthorizedException("Number rental not found"); throw new UnsupportedMediaTypeException("Number release requires a configured live provider"); }
  @Post("webhooks/sms") async webhook(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: Record<string, unknown>) {
    const secret = process.env.TELECOM_WEBHOOK_SECRET;
    if (secret && headers["x-webhook-secret"] !== secret) throw new UnauthorizedException("Invalid webhook signature");
    return this.sms.receiveWebhook(body);
  }
}
