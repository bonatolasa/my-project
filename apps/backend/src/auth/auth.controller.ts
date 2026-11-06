import { Body, Controller, Get, Post, Query, Req, Res, UnauthorizedException, ServiceUnavailableException } from "@nestjs/common";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";
import { randomBytes, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";

class CredentialsDto {
  @IsEmail() @MaxLength(320) email!: string;
  @IsString() @MinLength(8) @MaxLength(128) password!: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private cookie(response: Response, token: string) {
    response.setHeader("Set-Cookie", `vp_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${process.env.COOKIE_SECURE === "true" ? "; Secure" : ""}`);
  }

  @Post("register")
  async register(@Body() body: CredentialsDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.register(body.email, body.password);
    this.cookie(response, result.token);
    return { user: result.user };
  }

  @Post("login")
  async login(@Body() body: CredentialsDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.login(body.email, body.password);
    this.cookie(response, result.token);
    return { user: result.user };
  }

  @Get("me")
  async me(@Req() request: Request) {
    const cookieHeader = request.headers.cookie ?? "";
    const token = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith("vp_session="))?.slice("vp_session=".length);
    if (!token) throw new UnauthorizedException("Please sign in");
    return { user: await this.auth.current(token) };
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) response: Response) {
    response.setHeader("Set-Cookie", `vp_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.COOKIE_SECURE === "true" ? "; Secure" : ""}`);
    return { success: true };
  }

  @Get("google")
  googleStart(@Res() response: Response) {
    const config = this.auth.getGoogleConfig();
    if (!config) throw new ServiceUnavailableException("Google sign-in is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
    const state = randomBytes(24).toString("base64url");
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.search = new URLSearchParams({ client_id: config.clientId, redirect_uri: config.callbackUrl, response_type: "code", scope: "openid email profile", state, prompt: "select_account" }).toString();
    response.setHeader("Set-Cookie", `vp_oauth_state=${state}; Path=/api/auth/google; HttpOnly; SameSite=Lax; Max-Age=600${process.env.COOKIE_SECURE === "true" ? "; Secure" : ""}`);
    return response.redirect(url.toString());
  }

  @Get("google/callback")
  async googleCallback(@Query("code") code: string, @Query("error") error: string, @Query("state") state: string, @Req() request: Request, @Res() response: Response) {
    const webUrl = process.env.WEB_URL ?? "http://localhost:3000";
    const cookieHeader = request.headers.cookie ?? "";
    const expectedState = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith("vp_oauth_state="))?.slice("vp_oauth_state=".length);
    const clearState = `vp_oauth_state=; Path=/api/auth/google; HttpOnly; SameSite=Lax; Max-Age=0${process.env.COOKIE_SECURE === "true" ? "; Secure" : ""}`;
    if (!state || !expectedState || state.length !== expectedState.length || !timingSafeEqual(Buffer.from(state), Buffer.from(expectedState))) return response.setHeader("Set-Cookie", clearState).redirect(`${webUrl}/login?error=google&reason=state`);
    if (error || !code) return response.setHeader("Set-Cookie", clearState).redirect(`${webUrl}/login?error=google&reason=cancelled`);
    try {
      const result = await this.auth.googleProfile(code);
      response.setHeader("Set-Cookie", [`vp_session=${result.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${process.env.COOKIE_SECURE === "true" ? "; Secure" : ""}`, clearState]);
      return response.redirect(`${webUrl}/dashboard`);
    } catch (cause) {
      const reason = cause instanceof Error && cause.message.includes("token exchange") ? "exchange" : cause instanceof Error && cause.message.includes("profile") ? "profile" : "account";
      // Keep provider details out of the URL, but retain them in server logs for diagnosis.
      console.error("Google OAuth callback failed", { reason, error: cause instanceof Error ? cause.message : "unknown error" });
      response.setHeader("Set-Cookie", clearState);
      return response.redirect(`${webUrl}/login?error=google&reason=${reason}`);
    }
  }
}
