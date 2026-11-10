import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";

type TwilioNumber = { sid: string; phone_number: string; friendly_name?: string; capabilities?: { SMS?: boolean; MMS?: boolean; Voice?: boolean } };

@Injectable()
export class SmsService {
  private readonly modeValue: string;
  private readonly accountSid?: string;
  private readonly authToken?: string;
  private readonly messagingServiceSid?: string;
  private readonly voiceUrl?: string;

  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {
    this.modeValue = this.config.get<string>("SMS_MODE", "test");
    this.accountSid = this.config.get<string>("TWILIO_ACCOUNT_SID");
    this.authToken = this.config.get<string>("TWILIO_AUTH_TOKEN");
    this.messagingServiceSid = this.config.get<string>("TWILIO_MESSAGING_SERVICE_SID");
    this.voiceUrl = this.config.get<string>("TWILIO_VOICE_URL");
    if (this.modeValue === "live" && (!this.accountSid || !this.authToken)) {
      throw new Error("SMS_MODE=live requires TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN");
    }
  }

  mode() { return this.modeValue.toUpperCase(); }
  providers() { return [{ key: this.modeValue === "live" ? "twilio" : "mock", mode: this.modeValue, configured: this.modeValue !== "live" || Boolean(this.accountSid && this.authToken), capabilities: this.modeValue === "live" ? ["inventory", "purchase", "sms", "voice", "webhooks", "release"] : ["test-only"] }]; }

  private validatePhone(phone: string) {
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new BadRequestException("Phone numbers must use E.164 format");
  }
  private live() { if (this.modeValue !== "live") throw new ServiceUnavailableException("Live telecom operations are disabled; set SMS_MODE=live and configure Twilio credentials"); }
  private async twilio(path: string, init: RequestInit = {}) {
    this.live();
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}${path}`;
    let response: Response;
    try { response = await fetch(url, { ...init, headers: { Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`, ...(init.body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}), ...init.headers }, signal: AbortSignal.timeout(15000) }); }
    catch { throw new ServiceUnavailableException("Twilio could not be reached; no operation was confirmed"); }
    const result = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) {
      const message = typeof result.message === "string" ? result.message : "Twilio request failed";
      throw new HttpException({ statusCode: response.status >= 500 ? 503 : 400, message, code: result.code }, response.status >= 500 ? 503 : 400);
    }
    return result;
  }
  async verifyCredentials() {
    const account = await this.twilio(".json") as { sid?: string; status?: string; friendly_name?: string };
    return { authenticated: true, accountSid: account.sid, status: account.status };
  }

  async available(country: string, areaCode?: string) {
    this.live();
    const iso = country.toUpperCase();
    if (!/^[A-Z]{2}$/.test(iso)) throw new BadRequestException("Country must be a two-letter ISO country code");
    if (areaCode && !/^\d{1,8}$/.test(areaCode)) throw new BadRequestException("Area code must contain 1–8 digits");
    const params = new URLSearchParams({ SmsEnabled: "true", VoiceEnabled: "true", PageSize: "100" });
    if (areaCode) params.set("AreaCode", areaCode);
    const result = await this.twilio(`/AvailablePhoneNumbers/${iso}/Local.json?${params}`);
    const rows = (result.available_phone_numbers ?? []) as TwilioNumber[];
    return { items: rows.map((item) => ({ e164: item.phone_number, friendlyName: item.friendly_name, provider: "twilio", supportsSms: Boolean(item.capabilities?.SMS), supportsVoice: Boolean(item.capabilities?.Voice) })), country: iso };
  }

  async purchase(userId: string, e164: string, idempotencyKey: string) {
    this.validatePhone(e164);
    if (!idempotencyKey || idempotencyKey.length > 160) throw new BadRequestException("A valid Idempotency-Key header is required");
    const existingRental = await this.prisma.numberRental.findFirst({ where: { userId, status: "ACTIVE", phoneNumber: { e164 } }, include: { phoneNumber: true, order: true } });
    if (existingRental) return { order: existingRental.order, rental: existingRental };
    const existing = await this.prisma.numberOrder.findUnique({ where: { userId_idempotencyKey: { userId, idempotencyKey } }, include: { rental: { include: { phoneNumber: true } } } });
    if (existing?.rental) return { order: existing, rental: existing.rental };
    const country = await this.countryForNumber(e164);
    const inferred = country ?? await this.ensureCountry(e164);
    const order = existing ?? await this.prisma.numberOrder.create({ data: { userId, idempotencyKey, amountMinor: 0n, currency: "USD", status: "PROCESSING" } });
    try {
      const form = new URLSearchParams({ PhoneNumber: e164 });
      form.set("SmsUrl", this.webhookUrl()); form.set("SmsMethod", "POST");
      if (this.voiceUrl) { form.set("VoiceUrl", this.voiceUrl); form.set("VoiceMethod", "POST"); }
      if (this.messagingServiceSid) form.set("SmsApplicationSid", this.messagingServiceSid);
      const bought = await this.twilio("/IncomingPhoneNumbers.json", { method: "POST", body: form }) as unknown as TwilioNumber;
      const number = await this.prisma.phoneNumber.upsert({ where: { provider_providerNumberId: { provider: "twilio", providerNumberId: bought.sid } }, create: { countryId: inferred.id, provider: "twilio", providerNumberId: bought.sid, e164: bought.phone_number, supportsSms: Boolean(bought.capabilities?.SMS), supportsVoice: Boolean(bought.capabilities?.Voice), status: "ACTIVE", inventoryCheckedAt: new Date() }, update: { countryId: inferred.id, e164: bought.phone_number, status: "ACTIVE", supportsSms: Boolean(bought.capabilities?.SMS), supportsVoice: Boolean(bought.capabilities?.Voice), inventoryCheckedAt: new Date() } });
      const completed = await this.prisma.$transaction(async (tx) => {
        const savedOrder = await tx.numberOrder.update({ where: { id: order.id }, data: { phoneNumberId: number.id, providerRef: bought.sid, status: "COMPLETED" } });
        const rental = await tx.numberRental.upsert({ where: { orderId: order.id }, create: { userId, phoneNumberId: number.id, orderId: order.id, status: "ACTIVE", startsAt: new Date() }, update: { status: "ACTIVE", startsAt: new Date(), releasedAt: null } });
        return { order: savedOrder, rental };
      });
      return completed;
    } catch (error) {
      await this.prisma.numberOrder.update({ where: { id: order.id }, data: { status: "FAILED" } }).catch(() => undefined);
      throw error;
    }
  }

  private async countryForNumber(e164: string) {
    const countryCodes: Record<string, string> = { "+1": "US", "+44": "GB", "+61": "AU", "+64": "NZ", "+33": "FR", "+49": "DE", "+34": "ES", "+39": "IT", "+81": "JP", "+65": "SG", "+27": "ZA", "+254": "KE" };
    const prefix = Object.keys(countryCodes).sort((a, b) => b.length - a.length).find((code) => e164.startsWith(code));
    const iso = prefix ? countryCodes[prefix] : this.config.get<string>("TWILIO_DEFAULT_COUNTRY", "US").toUpperCase();
    return this.prisma.country.findUnique({ where: { isoCode: iso } });
  }
  private async ensureCountry(e164: string) {
    const iso = (await this.countryForNumber(e164))?.isoCode ?? this.config.get<string>("TWILIO_DEFAULT_COUNTRY", "US").toUpperCase();
    const countryPrefix = Object.keys({ "+1": 1, "+44": 1, "+61": 1, "+64": 1, "+33": 1, "+49": 1, "+34": 1, "+39": 1, "+81": 1, "+65": 1, "+27": 1, "+254": 1 }).sort((a, b) => b.length - a.length).find((code) => e164.startsWith(code));
    const callingCode = countryPrefix ?? "+1";
    return this.prisma.country.upsert({ where: { isoCode: iso }, create: { isoCode: iso, name: iso, callingCode, enabled: true }, update: { enabled: true } });
  }

  async rentals(userId: string) { return this.prisma.numberRental.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, include: { phoneNumber: { include: { country: true } }, order: true } }); }
  async release(userId: string, rentalId: string) {
    const rental = await this.prisma.numberRental.findFirst({ where: { id: rentalId, userId, status: "ACTIVE" }, include: { phoneNumber: true } });
    if (!rental) throw new NotFoundException("Active number rental not found");
    await this.twilio(`/IncomingPhoneNumbers/${encodeURIComponent(rental.phoneNumber.providerNumberId)}.json`, { method: "DELETE" });
    return this.prisma.$transaction(async (tx) => {
      await tx.phoneNumber.update({ where: { id: rental.phoneNumberId }, data: { status: "RELEASED" } });
      return tx.numberRental.update({ where: { id: rentalId }, data: { status: "RELEASED", releasedAt: new Date() } });
    });
  }

  async sendFromNumber(userId: string, phoneNumberId: string, to: string, text: string) {
    this.validatePhone(to);
    if (!text.trim() || text.length > 1600) throw new BadRequestException("Message must contain 1–1600 characters");
    const rental = await this.prisma.numberRental.findFirst({ where: { userId, phoneNumberId, status: "ACTIVE" }, include: { phoneNumber: true } });
    if (!rental || !rental.phoneNumber.supportsSms) throw new NotFoundException("An active SMS-enabled number was not found");
    const result = await this.twilio("/Messages.json", { method: "POST", body: new URLSearchParams({ From: rental.phoneNumber.e164, To: to, Body: text }) }) as { sid?: string; status?: string };
    return this.prisma.sMSMessage.create({ data: { userId, phoneNumberId, provider: "twilio", providerMessageId: result.sid ?? `unknown-${Date.now()}`, direction: "OUTBOUND", sender: rental.phoneNumber.e164, content: text, receivedAt: new Date() } });
  }
  async conversation(userId: string, numberId?: string) {
    const owned = await this.prisma.numberRental.findMany({ where: { userId, status: "ACTIVE", ...(numberId ? { phoneNumberId: numberId } : {}) }, select: { phoneNumberId: true } });
    if (numberId && !owned.length) throw new NotFoundException("Active number not found");
    return this.prisma.sMSMessage.findMany({ where: { userId, phoneNumberId: { in: owned.map((item) => item.phoneNumberId) } }, orderBy: { receivedAt: "asc" }, take: 500, include: { phoneNumber: { select: { e164: true } } } });
  }

  private webhookUrl() { const base = this.config.get<string>("TELECOM_WEBHOOK_BASE_URL") ?? `${this.config.get<string>("API_URL", "http://localhost:4000")}/api/v1`; return `${base.replace(/\/$/, "")}/webhooks/sms`; }
  verifyWebhook(signature: string | undefined, url: string, params: Record<string, string>) {
    this.live();
    if (!signature || !this.authToken) return false;
    const value = Object.keys(params).sort().reduce((acc, key) => acc + key + params[key], url);
    const hmac = createHmac("sha1", this.authToken).update(value).digest();
    const supplied = Buffer.from(signature, "base64");
    return supplied.length === hmac.length && timingSafeEqual(supplied, hmac);
  }

  async receiveWebhook(payload: Record<string, unknown>) {
    const from = String(payload.From ?? ""); const to = String(payload.To ?? ""); const text = String(payload.Body ?? ""); const id = String(payload.MessageSid ?? payload.SmsSid ?? "");
    this.validatePhone(from); this.validatePhone(to);
    if (!id || text.length > 1600) throw new BadRequestException("Invalid Twilio SMS callback");
    const phoneNumber = await this.prisma.phoneNumber.findFirst({ where: { e164: to, provider: "twilio", status: "ACTIVE" } });
    if (!phoneNumber) throw new NotFoundException("Incoming destination is not a managed number");
    const rental = await this.prisma.numberRental.findFirst({ where: { phoneNumberId: phoneNumber.id, status: "ACTIVE" }, select: { userId: true } });
    if (!rental) throw new NotFoundException("Number has no active owner");
    return this.prisma.sMSMessage.upsert({ where: { provider_providerMessageId: { provider: "twilio", providerMessageId: id } }, create: { provider: "twilio", providerMessageId: id, phoneNumberId: phoneNumber.id, userId: rental.userId, direction: "INBOUND", sender: from, content: text, receivedAt: new Date() }, update: {} });
  }

  async receiveStatus(payload: Record<string, unknown>) {
    const id = String(payload.MessageSid ?? ""); const status = String(payload.MessageStatus ?? "");
    if (!id || !status) throw new BadRequestException("Invalid Twilio status callback");
    const message = await this.prisma.sMSMessage.findFirst({ where: { provider: "twilio", providerMessageId: id } });
    if (!message) return { received: true };
    return { received: true };
  }

  async send(userId: string, to: string, text: string) {
    this.validatePhone(to); if (!text.trim() || text.length > 1600) throw new BadRequestException("Message must contain 1–1600 characters");
    this.live();
    const result = await this.twilio("/Messages.json", { method: "POST", body: new URLSearchParams({ To: to, Body: text, ...(this.messagingServiceSid ? { MessagingServiceSid: this.messagingServiceSid } : {}) }) }) as { sid?: string; status?: string };
    return this.prisma.outboundSMS.create({ data: { userId, provider: "twilio", providerMessageId: result.sid, recipient: to, content: text, status: "SENT", simulated: false, attempts: 1 } });
  }
  async bulk(userId: string, recipients: string[], text: string) { if (!recipients.length || recipients.length > 100) throw new BadRequestException("Provide between 1 and 100 recipients"); return Promise.all(recipients.map((recipient) => this.send(userId, recipient, text))); }
  async history(userId: string) { return this.prisma.outboundSMS.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100 }); }
  async status(userId: string, id: string) { const message = await this.prisma.outboundSMS.findFirst({ where: { id, userId } }); if (!message) throw new NotFoundException("Message not found"); return message; }
  private hash(code: string) { return createHash("sha256").update(`${this.config.get<string>("OTP_PEPPER", "local-test-pepper")}:${code}`).digest("hex"); }
  async sendOtp(userId: string, phone: string, purpose = "verification") {
    this.validatePhone(phone); if (!/^[a-z_]{3,40}$/.test(purpose)) throw new BadRequestException("Invalid OTP purpose");
    const since = new Date(Date.now() - 60 * 60 * 1000); if (await this.prisma.otpVerification.count({ where: { userId, phone, createdAt: { gte: since } } }) >= 5) throw new HttpException("OTP limit reached for this phone; try again later", HttpStatus.TOO_MANY_REQUESTS);
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0"); const expiresAt = new Date(Date.now() + Number(this.config.get("OTP_TTL_SECONDS", "300")) * 1000);
    await this.prisma.otpVerification.create({ data: { userId, phone, purpose, codeHash: this.hash(code), expiresAt } });
    const message = await this.send(userId, phone, `Your verification code is ${code}. It expires soon.`);
    return { id: message.id, expiresAt };
  }
  async verifyOtp(userId: string, phone: string, code: string, purpose = "verification") {
    const record = await this.prisma.otpVerification.findFirst({ where: { userId, phone, purpose, consumedAt: null }, orderBy: { createdAt: "desc" } });
    if (!record || record.expiresAt < new Date() || record.attempts >= 5) throw new UnauthorizedException("Code is invalid or expired");
    const expected = Buffer.from(record.codeHash, "hex"); const actual = Buffer.from(this.hash(code), "hex");
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) { await this.prisma.otpVerification.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } }); throw new UnauthorizedException("Code is invalid or expired"); }
    await this.prisma.otpVerification.update({ where: { id: record.id }, data: { consumedAt: new Date() } }); return { verified: true };
  }
}
