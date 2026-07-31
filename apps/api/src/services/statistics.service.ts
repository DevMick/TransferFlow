import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { transfer } from '../db/schema.js';

export interface DashboardStats {
  totalTransfers: number;
  totalAmount: string;
  initiatedCount: number;
  rejectedCount: number;
  recentTransfers: Record<string, unknown>[];
}

export interface StatisticsData {
  monthlyData: { month: string; count: number; amount: string }[];
  statusDistribution: { status: string; count: number; percentage: number }[];
  bankDistribution: { bank: string; count: number; percentage: number }[];
  currencyDistribution: { currency: string; count: number; percentage: number }[];
  topBeneficiaries: { name: string; email: string; count: number; totalAmount: string }[];
}

/**
 * Statistics service for dashboard and analytics
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Service pattern for organization
export class StatisticsService {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(userId: string): Promise<DashboardStats> {
    // Total transfers and amount
    const [totalResult] = await db
      .select({
        count: sql<number>`count(*)`,
        totalAmount: sql<string>`coalesce(sum(amount), 0)`,
      })
      .from(transfer)
      .where(eq(transfer.userId, userId));

    // Status counts
    const [statusResult] = await db
      .select({
        initiated: sql<number>`count(*) filter (where status = 'initiated')`,
        rejected: sql<number>`count(*) filter (where status = 'rejected')`,
      })
      .from(transfer)
      .where(eq(transfer.userId, userId));

    // Recent transfers
    const recentTransfers = await db
      .select()
      .from(transfer)
      .where(eq(transfer.userId, userId))
      .orderBy(desc(transfer.createdAt))
      .limit(5);

    return {
      totalTransfers: totalResult?.count ?? 0,
      totalAmount: totalResult?.totalAmount ?? '0',
      initiatedCount: statusResult?.initiated ?? 0,
      rejectedCount: statusResult?.rejected ?? 0,
      recentTransfers,
    };
  }

  /**
   * Get detailed statistics
   */
  static async getStatistics(userId: string): Promise<StatisticsData> {
    // Monthly data (last 12 months)
    const monthlyData = await db
      .select({
        month: sql<string>`to_char(created_at, 'YYYY-MM')`,
        count: sql<number>`count(*)`,
        amount: sql<string>`coalesce(sum(amount), 0)`,
      })
      .from(transfer)
      .where(
        and(
          eq(transfer.userId, userId),
          gte(transfer.createdAt, new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)),
        ),
      )
      .groupBy(sql`to_char(created_at, 'YYYY-MM')`)
      .orderBy(sql`to_char(created_at, 'YYYY-MM')`);

    // Status distribution
    const statusDistribution = await db
      .select({
        status: transfer.status,
        count: sql<number>`count(*)`,
      })
      .from(transfer)
      .where(eq(transfer.userId, userId))
      .groupBy(transfer.status);

    const totalTransfers = statusDistribution.reduce((sum, s) => sum + s.count, 0);

    const statusWithPercentage = statusDistribution.map((s) => ({
      status: s.status,
      count: s.count,
      percentage: totalTransfers > 0 ? (s.count / totalTransfers) * 100 : 0,
    }));

    // Bank distribution
    const bankDistribution = await db
      .select({
        bank: transfer.senderBank,
        count: sql<number>`count(*)`,
      })
      .from(transfer)
      .where(eq(transfer.userId, userId))
      .groupBy(transfer.senderBank)
      .orderBy(sql`count(*) desc`)
      .limit(10);

    const bankTotal = bankDistribution.reduce((sum, b) => sum + b.count, 0);

    const bankWithPercentage = bankDistribution
      .filter((b) => b.bank !== null)
      .map((b) => ({
        bank: b.bank || 'Unknown',
        count: b.count,
        percentage: bankTotal > 0 ? (b.count / bankTotal) * 100 : 0,
      }));

    // Currency distribution
    const currencyDistribution = await db
      .select({
        currency: transfer.currency,
        count: sql<number>`count(*)`,
      })
      .from(transfer)
      .where(eq(transfer.userId, userId))
      .groupBy(transfer.currency);

    const currencyTotal = currencyDistribution.reduce((sum, c) => sum + c.count, 0);

    const currencyWithPercentage = currencyDistribution
      .filter((c) => c.currency !== null)
      .map((c) => ({
        currency: c.currency || 'EUR',
        count: c.count,
        percentage: currencyTotal > 0 ? (c.count / currencyTotal) * 100 : 0,
      }));

    // Top beneficiaries
    const topBeneficiariesRaw = await db
      .select({
        name: transfer.beneficiaryName,
        email: transfer.beneficiaryEmail,
        count: sql<number>`count(*)`,
        totalAmount: sql<string>`sum(amount)`,
      })
      .from(transfer)
      .where(eq(transfer.userId, userId))
      .groupBy(transfer.beneficiaryName, transfer.beneficiaryEmail)
      .orderBy(sql`count(*) desc`)
      .limit(10);

    const topBeneficiaries = topBeneficiariesRaw
      .filter((b) => b.name !== null && b.email !== null)
      .map((b) => ({
        name: b.name || 'Unknown',
        email: b.email || 'unknown@example.com',
        count: b.count,
        totalAmount: b.totalAmount || '0',
      }));

    return {
      monthlyData,
      statusDistribution: statusWithPercentage,
      bankDistribution: bankWithPercentage,
      currencyDistribution: currencyWithPercentage,
      topBeneficiaries,
    };
  }
}
