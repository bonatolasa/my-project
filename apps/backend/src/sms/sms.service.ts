import { Injectable, NotFoundException, ServiceUnavailableException, HttpException, HttpStatus, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";

type SendResult = { providerId?: string; status: "SENT" | "FAILED"; simulated: boolean; error?: string };
interface SmsProvider {
  readonly key: string;
  sendSMS(to: string, text: string): Promise<SendResult>;
  sendBulkSMS(to: string[], text: string): Promise<SendResult[]>;
  verifyWebhook(headers: Record<string, string | string[] | undefined>, body: unknown): boolean;
  getDeliveryStatus(id: string): Promise<string>;
  receiveIncomingSMS(payload: Record<string, unknown>): Promise<{ from: string; to: string; text: string; id: string }>;
  getAvailableNumbers(): Promise<never>;
  purchaseNumber(): Promise<never>;
}

class SandboxProvider implements SmsProvider {
  readonly key = "mock";
  async sendSMS(to: string, text: string): Promise<SendResult> {
    return { providerId: `test_${createHash("sha256").update(`${to}:${text}:${Date.now()}`).digest("hex").slice(0, 20)}`, status: text.includes("[FAIL]") ? "FAILED" : "SENT", simulated: true, ...(text.includes("[FAIL]") ? { error: "Configured sandbox failure scenario" } : {}) };
  }
  async sendBulkSMS(to: string[], text: string) { return Promise.all(to.map((number) => this.sendSMS(number, text))); }
  verifyWebhook() { return true; }
  async getDeliveryStatus(id: string) { return id.startsWith("test_") ? "SENT (simulated; not delivered to a carrier)" : "UNKNOWN"; }
  async receiveIncomingSMS(payload: Record<string, unknown>) { return { from: String(payload.from ?? ""), to: String(payload.to ?? ""), text: String(payload.text ?? ""), id: String(payload.id ?? `test_in_${Date.now()}`) }; }
  async getAvailableNumbers(): Promise<never> { throw new ServiceUnavailableException("Sandbox numbers are test fixtures only; live number inventory is not configured"); }
  async purchaseNumber(): Promise<never> { throw new ServiceUnavailableException("Number purchase is unsupported by the sandbox provider"); }
}

@Injectable()
export class SmsService {
  private readonly provider: SmsProvider;
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {
    const mode = this.config.get<string>("SMS_MODE", "test");
    if (mode === "test") this.provider = new SandboxProvider();
    else throw new Error("SMS_MODE=live requires an implemented provider adapter and credentials. No live adapter is configured.");
  }

  mode() { return this.config.get<string>("SMS_MODE", "test").toUpperCase(); }
  providers() { return [{ key: "mock", mode: "test", capabilities: ["sendSMS", "sendBulkSMS", "verifyWebhook", "getDeliveryStatus", "receiveIncomingSMS"] }, { key: "esms_africa", mode: "live", configured: false, capabilities: [] }, { key: "africas_talking", mode: "live", configured: false, capabilities: [] }, { key: "twilio", mode: "live", configured: false, capabilities: [] }, { key: "vonage", mode: "live", configured: false, capabilities: [] }]; }

  private validatePhone(phone: string) {
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new BadRequestException("Phone numbers must use E.164 format, for example +12025550123");
  }

  async send(userId: string, to: string, text: string) {
    this.validatePhone(to);
    if (!text.trim() || text.length > 1600) throw new BadRequestException("Message must contain 1–1600 characters");
    const result = await this.provider.sendSMS(to, text);
    return this.prisma.outboundSMS.create({ data: { userId, provider: this.provider.key, providerMessageId: result.providerId, recipient: to, content: text, status: result.status, simulated: result.simulated, error: result.error, attempts: 1 } });
  }

  async bulk(userId: string, recipients: string[], text: string) {
    if (!recipients.length || recipients.length > 100) throw new BadRequestException("Provide between 1 and 100 recipients");
    recipients.forEach((number) => this.validatePhone(number));
    return Promise.all(recipients.map((number) => this.send(userId, number, text)));
  }

  async history(userId: string) { return this.prisma.outboundSMS.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100 }); }
  async status(userId: string, id: string) {
    const message = await this.prisma.outboundSMS.findFirst({ where: { id, userId } });
    if (!message) throw new NotFoundException("Message not found");
    return { ...message, providerStatus: await this.provider.getDeliveryStatus(message.providerMessageId ?? "") };
  }

  private hash(code: string) { return createHash("sha256").update(`${this.config.get<string>("OTP_PEPPER", "local-test-pepper")}:${code}`).digest("hex"); }
  async sendOtp(userId: string, phone: string, purpose = "verification") {
    this.validatePhone(phone);
    if (!/^[a-z_]{3,40}$/.test(purpose)) throw new BadRequestException("Invalid OTP purpose");
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await this.prisma.otpVerification.count({ where: { userId, phone, createdAt: { gte: since } } });
    if (recent >= 5) throw new HttpException("OTP limit reached for this phone; try again later", HttpStatus.TOO_MANY_REQUESTS);
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const expiresAt = new Date(Date.now() + Number(this.config.get("OTP_TTL_SECONDS", "300")) * 1000);
    await this.prisma.otpVerification.create({ data: { userId, phone, purpose, codeHash: this.hash(code), expiresAt } });
    const message = await this.send(userId, phone, `Your verification code is ${code}. It expires soon.`);
    return { id: message.id, expiresAt, ...(message.simulated ? { testCode: code } : {}) };
  }

  async verifyOtp(userId: string, phone: string, code: string, purpose = "verification") {
    const record = await this.prisma.otpVerification.findFirst({ where: { userId, phone, purpose, consumedAt: null }, orderBy: { createdAt: "desc" } });
    if (!record || record.expiresAt < new Date() || record.attempts >= 5) throw new UnauthorizedException("Code is invalid or expired");
    const expected = Buffer.from(record.codeHash, "hex"); const actual = Buffer.from(this.hash(code), "hex");
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      await this.prisma.otpVerification.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
      throw new UnauthorizedException("Code is invalid or expired");
    }
    await this.prisma.otpVerification.update({ where: { id: record.id }, data: { consumedAt: new Date() } });
    return { verified: true };
  }

  async receiveWebhook(payload: Record<string, unknown>) {
    const message = await this.provider.receiveIncomingSMS(payload);
    this.validatePhone(message.from); this.validatePhone(message.to);
    const phoneNumber = await this.prisma.phoneNumber.findFirst({ where: { e164: message.to } });
    if (!phoneNumber) throw new NotFoundException("Incoming destination is not a managed number");
    return this.prisma.sMSMessage.upsert({ where: { provider_providerMessageId: { provider: this.provider.key, providerMessageId: message.id } }, create: { provider: this.provider.key, providerMessageId: message.id, phoneNumberId: phoneNumber.id, userId: (await this.prisma.numberRental.findFirst({ where: { phoneNumberId: phoneNumber.id, status: "ACTIVE" }, select: { userId: true } }))?.userId, direction: "INBOUND", sender: message.from, content: message.text, receivedAt: new Date() }, update: {} });
  }
}
