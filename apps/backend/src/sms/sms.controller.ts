import { Body, Controller, Delete, Get, Headers, Param, Post, Query, Req, UnauthorizedException } from "@nestjs/common";
import { IsArray, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";
import type { Request } from "express";
import { AuthService } from "../auth/auth.service";
import { SmsService } from "./sms.service";

class SendDto { @IsString() @Matches(/^\+[1-9]\d{7,14}$/) to!: string; @IsString() @MinLength(1) @MaxLength(1600) text!: string; @IsOptional() @IsString() phoneNumberId?: string; }
class BulkDto { @IsArray() @IsString({ each: true }) recipients!: string[]; @IsString() @MinLength(1) @MaxLength(1600) text!: string; }
class OtpDto { @IsString() @Matches(/^\+[1-9]\d{7,14}$/) phone!: string; @IsOptional() @IsString() purpose?: string; }
class VerifyDto extends OtpDto { @IsString() @Matches(/^\d{6}$/) code!: string; }
class PurchaseDto { @IsString() @Matches(/^\+[1-9]\d{7,14}$/) phoneNumber!: string; }

@Controller()
export class SmsController {
  constructor(private readonly sms: SmsService, private readonly auth: AuthService) {}
  private async userId(request: Request) { const token = (request.headers.cookie ?? "").split(";").map((part) => part.trim()).find((part) => part.startsWith("vp_session="))?.slice("vp_session=".length); return (await this.auth.current(token)).id; }
  @Post("sms/send") async send(@Req() req: Request, @Body() body: SendDto) { const userId = await this.userId(req); return body.phoneNumberId ? this.sms.sendFromNumber(userId, body.phoneNumberId, body.to, body.text) : this.sms.send(userId, body.to, body.text); }
  @Post("sms/bulk") async bulk(@Req() req: Request, @Body() body: BulkDto) { return this.sms.bulk(await this.userId(req), body.recipients, body.text); }
  @Get("sms/history") async history(@Req() req: Request) { return this.sms.history(await this.userId(req)); }
  @Get("sms/conversation") async conversation(@Req() req: Request, @Query("numberId") numberId?: string) { return this.sms.conversation(await this.userId(req), numberId); }
  @Get("sms/:id/status") async status(@Req() req: Request, @Param("id") id: string) { return this.sms.status(await this.userId(req), id); }
  @Post("otp/send") async otp(@Req() req: Request, @Body() body: OtpDto) { return this.sms.sendOtp(await this.userId(req), body.phone, body.purpose); }
  @Post("otp/resend") async resend(@Req() req: Request, @Body() body: OtpDto) { return this.sms.sendOtp(await this.userId(req), body.phone, body.purpose); }
  @Post("otp/verify") async verify(@Req() req: Request, @Body() body: VerifyDto) { return this.sms.verifyOtp(await this.userId(req), body.phone, body.code, body.purpose); }
  @Get("providers") async providers(@Req() req: Request) { await this.userId(req); return { mode: this.sms.mode(), providers: this.sms.providers() }; }
  @Post("providers/twilio/verify") async verifyProvider(@Req() req: Request) { await this.userId(req); return this.sms.verifyCredentials(); }
  @Get("phone-numbers/available") async available(@Req() req: Request, @Query("country") country: string, @Query("areaCode") areaCode?: string) { await this.userId(req); return this.sms.available(country || "US", areaCode); }
  @Post("phone-numbers/purchase") async purchase(@Req() req: Request, @Body() body: PurchaseDto, @Headers("idempotency-key") key?: string) { return this.sms.purchase(await this.userId(req), body.phoneNumber, key ?? ""); }
  @Get("phone-numbers") async numbers(@Req() req: Request) { return this.sms.rentals(await this.userId(req)); }
  @Delete("phone-numbers/:id") async release(@Req() req: Request, @Param("id") id: string) { const userId = await this.userId(req); if (!id) throw new UnauthorizedException(); return this.sms.release(userId, id); }
  @Post("webhooks/sms") async webhook(@Headers() headers: Record<string, string | string[] | undefined>, @Req() req: Request, @Body() body: Record<string, unknown>) {
    const params = Object.fromEntries(Object.entries(body).map(([key, value]) => [key, String(value)]));
    const signature = headers["x-twilio-signature"]; const signatureValue = Array.isArray(signature) ? signature[0] : signature;
    const configuredUrl = process.env.TELECOM_WEBHOOK_BASE_URL ? `${process.env.TELECOM_WEBHOOK_BASE_URL.replace(/\/$/, "")}/webhooks/sms` : `${process.env.API_URL ?? "http://localhost:4000"}/api/v1/webhooks/sms`;
    const query = new URLSearchParams(req.query as Record<string, string>).toString();
    const exactUrl = `${configuredUrl}${query ? `?${query}` : ""}`;
    if (!this.sms.verifyWebhook(signatureValue, exactUrl, params)) throw new UnauthorizedException("Invalid Twilio webhook signature");
    return this.sms.receiveWebhook(body);
  }
  @Post("webhooks/sms/status") async smsStatus(@Headers() headers: Record<string, string | string[] | undefined>, @Req() req: Request, @Body() body: Record<string, unknown>) {
    const params = Object.fromEntries(Object.entries(body).map(([key, value]) => [key, String(value)]));
    const signature = headers["x-twilio-signature"]; const signatureValue = Array.isArray(signature) ? signature[0] : signature;
    const base = process.env.TELECOM_WEBHOOK_BASE_URL ?? `${process.env.API_URL ?? "http://localhost:4000"}/api/v1`;
    if (!this.sms.verifyWebhook(signatureValue, `${base.replace(/\/$/, "")}/webhooks/sms/status`, params)) throw new UnauthorizedException("Invalid Twilio webhook signature");
    return this.sms.receiveStatus(body);
  }
}
