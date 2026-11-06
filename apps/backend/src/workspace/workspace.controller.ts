import { Controller, Get, Query, Req, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "../auth/auth.service";
import { PrismaService } from "../prisma/prisma.service";

@Controller("workspace")
export class WorkspaceController {
  constructor(private readonly prisma: PrismaService, private readonly auth: AuthService) {}

  private async userId(request: Request) {
    const token = (request.headers.cookie ?? "").split(";").map((part) => part.trim()).find((part) => part.startsWith("vp_session="))?.slice("vp_session=".length);
    const user = await this.auth.current(token);
    if (!user) throw new UnauthorizedException();
    return user.id;
  }

  @Get("overview")
  async overview(@Req() request: Request) {
    const userId = await this.userId(request);
    const [rentals, unreadMessages, wallets, countries, availableNumbers] = await Promise.all([
      this.prisma.numberRental.count({ where: { userId, status: "ACTIVE" } }),
      this.prisma.sMSMessage.count({ where: { userId, readAt: null } }),
      this.prisma.wallet.findMany({ where: { userId }, select: { currency: true, balanceMinor: true } }),
      this.prisma.country.count({ where: { enabled: true } }),
      this.prisma.phoneNumber.count({ where: { status: "AVAILABLE", country: { enabled: true } } }),
    ]);
    return { activeRentals: rentals, unreadMessages, wallets: wallets.map((wallet) => ({ currency: wallet.currency, balanceMinor: wallet.balanceMinor.toString() })), supportedCountries: countries, availableNumbers };
  }

  @Get("countries")
  async countries(@Req() request: Request) {
    await this.userId(request);
    return this.prisma.country.findMany({ where: { enabled: true }, orderBy: { name: "asc" }, select: { isoCode: true, name: true, callingCode: true, _count: { select: { numbers: { where: { status: "AVAILABLE" } } } } } });
  }

  @Get("numbers")
  async numbers(@Req() request: Request, @Query("country") country?: string, @Query("capability") capability?: string) {
    await this.userId(request);
    return this.prisma.phoneNumber.findMany({ where: { status: "AVAILABLE", country: { enabled: true, ...(country ? { isoCode: country.toUpperCase() } : {}) }, ...(capability === "sms" ? { supportsSms: true } : capability === "voice" ? { supportsVoice: true } : {}) }, orderBy: { e164: "asc" }, take: 100, select: { id: true, e164: true, supportsSms: true, supportsVoice: true, provider: true, country: { select: { isoCode: true, name: true, callingCode: true } } } });
  }

  @Get("rentals")
  async rentals(@Req() request: Request) {
    const userId = await this.userId(request);
    return this.prisma.numberRental.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100, include: { phoneNumber: { select: { e164: true, country: { select: { name: true, isoCode: true } } } }, order: { select: { amountMinor: true, currency: true, status: true } } } });
  }

  @Get("inbox")
  async inbox(@Req() request: Request) {
    const userId = await this.userId(request);
    const messages = await this.prisma.sMSMessage.findMany({ where: { userId }, orderBy: { receivedAt: "desc" }, take: 100, select: { id: true, sender: true, content: true, direction: true, receivedAt: true, readAt: true, phoneNumber: { select: { e164: true } } } });
    return messages.map((message) => ({ ...message, receivedAt: message.receivedAt.toISOString() }));
  }

  @Get("wallet")
  async wallet(@Req() request: Request) {
    const userId = await this.userId(request);
    const wallets = await this.prisma.wallet.findMany({ where: { userId }, include: { transactions: { orderBy: { createdAt: "desc" }, take: 30, select: { id: true, kind: true, amountMinor: true, currency: true, description: true, createdAt: true } } } });
    return wallets.map((wallet) => ({ currency: wallet.currency, balanceMinor: wallet.balanceMinor.toString(), transactions: wallet.transactions.map((transaction) => ({ ...transaction, amountMinor: transaction.amountMinor.toString(), createdAt: transaction.createdAt.toISOString() })) }));
  }
}
