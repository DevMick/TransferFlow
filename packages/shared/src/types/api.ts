/**
 * Shared TypeScript types for API requests and responses
 * Used across backend (Hono) and frontend (React)
 */

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transfer {
  id: string;
  userId: string;
  beneficiaryName: string;
  beneficiaryEmail: string;
  iban: string;
  bankName: string;
  amount: string;
  currency: string;
  reference?: string;
  status: 'initiated' | 'rejected';
  createdAt: string;
  updatedAt: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

export interface Bank {
  id: string;
  name: string;
  country: string;
  createdAt: string;
}

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  isActive: boolean;
}

export interface TransferFilters {
  search?: string;
  status?: 'initiated' | 'rejected';
  period?: 'all' | '7d' | '30d' | '90d' | '1y';
  dateFrom?: string;
  dateTo?: string;
  bank?: string;
  currency?: string[];
  amountMin?: number;
  amountMax?: number;
  limit?: number;
  offset?: number;
}

export interface CreateTransferInput {
  beneficiaryName: string;
  beneficiaryEmail: string;
  iban: string;
  bankName: string;
  amount: number;
  currency: string;
  reference?: string;
}

export interface RejectTransferInput {
  reason?: string;
}
