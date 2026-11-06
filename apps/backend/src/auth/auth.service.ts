import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { PrismaService } from "../prisma/prisma.service";

const scrypt = promisify(scryptCallback);

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  private secret() {
    const secret = this.config.get<string>("JWT_ACCESS_SECRET");
    if (secret && !secret.includes("replace_with")) return secret;
    if (this.config.get<string>("NODE_ENV") === "production") throw new Error("JWT_ACCESS_SECRET must be configured in production");
    return "local-development-only-secret-change-before-deploy";
  }

  async register(email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    const salt = randomBytes(16).toString("hex");
    const hash = (await scrypt(password, salt, 64)) as Buffer;
    try {
      const user = await this.prisma.user.create({
        data: { email: normalized, passwordHash: `${salt}:${hash.toString("hex")}`, status: "ACTIVE" },
        select: { id: true, email: true, status: true, createdAt: true },
      });
      return { user, token: this.issue(user.id) };
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") throw new ConflictException("An account with this email already exists");
      throw error;
    }
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || user.status !== "ACTIVE") throw new UnauthorizedException("Email or password is incorrect");
    const [salt, stored] = user.passwordHash.split(":");
    if (!salt || !stored) throw new UnauthorizedException("Email or password is incorrect");
    const candidate = (await scrypt(password, salt, 64)) as Buffer;
    const expected = Buffer.from(stored, "hex");
    if (candidate.length !== expected.length || !timingSafeEqual(candidate, expected)) throw new UnauthorizedException("Email or password is incorrect");
    return { user: { id: user.id, email: user.email, status: user.status, createdAt: user.createdAt }, token: this.issue(user.id) };
  }

  async current(token?: string) {
    if (!token) throw new UnauthorizedException("Please sign in");
    const [payload, signature] = token.split(".");
    if (!payload || !signature) throw new UnauthorizedException("Please sign in");
    const expected = createHmac("sha256", this.secret()).update(payload).digest();
    let actual: Buffer;
    try { actual = Buffer.from(signature, "base64url"); } catch { throw new UnauthorizedException("Please sign in"); }
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new UnauthorizedException("Please sign in");
    try {
      const claims = JSON.parse(Buffer.from(payload, "base64url").toString()) as { sub: string; exp: number };
      if (claims.exp < Date.now() / 1000) throw new UnauthorizedException("Session expired");
      const user = await this.prisma.user.findUnique({ where: { id: claims.sub }, select: { id: true, email: true, status: true, createdAt: true } });
      if (!user || user.status !== "ACTIVE") throw new UnauthorizedException("Please sign in");
      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException("Please sign in");
    }
  }

  async googleUser(email: string, name?: string) {
    const normalized = email.trim().toLowerCase();
    const user = await this.prisma.user.upsert({
      where: { email: normalized },
      create: { email: normalized, passwordHash: `google:${randomBytes(32).toString("hex")}`, status: "ACTIVE", emailVerifiedAt: new Date() },
      update: { emailVerifiedAt: new Date(), status: "ACTIVE" },
      select: { id: true, email: true, status: true, createdAt: true },
    });
    return { user, token: this.issue(user.id), name };
  }

  getGoogleConfig() {
    const clientId = this.config.get<string>("GOOGLE_CLIENT_ID");
    const clientSecret = this.config.get<string>("GOOGLE_CLIENT_SECRET");
    if (!clientId || !clientSecret) return null;
    const webUrl = this.config.get<string>("WEB_URL") ?? "http://localhost:3000";
    const callbackUrl = this.config.get<string>("GOOGLE_REDIRECT_URI") ?? `${webUrl.replace(/\/$/, "")}/api/auth/google/callback`;
    return { clientId, clientSecret, callbackUrl, webUrl };
  }

  async googleProfile(code: string) {
    const config = this.getGoogleConfig();
    if (!config) throw new Error("Google sign-in is not configured");
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: config.clientId, client_secret: config.clientSecret, redirect_uri: config.callbackUrl, grant_type: "authorization_code" }),
    });
    if (!tokenResponse.ok) {
      const details = await tokenResponse.json().catch(() => ({})) as { error?: string; error_description?: string };
      throw new Error(`Google token exchange failed: ${details.error ?? tokenResponse.status}`);
    }
    const tokens = await tokenResponse.json() as { access_token?: string };
    if (!tokens.access_token) throw new Error("Google did not return an access token");
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    if (!profileResponse.ok) throw new Error(`Google profile request failed: ${profileResponse.status}`);
    const profile = await profileResponse.json() as { email?: string; verified_email?: boolean; name?: string };
    if (!profile.email || profile.verified_email !== true) throw new Error("A verified Google email is required");
    return this.googleUser(profile.email, profile.name);
  }

  private issue(userId: string) {
    const payload = Buffer.from(JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 })).toString("base64url");
    const signature = createHmac("sha256", this.secret()).update(payload).digest("base64url");
    return `${payload}.${signature}`;
  }
}
