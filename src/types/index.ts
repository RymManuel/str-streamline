// Core TypeScript interfaces for STR-Streamline

export type UserRole = 'admin' | 'user';

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  lastLogin?: string;
  status: 'active' | 'inactive';
}

/** @deprecated Use UserPublic — passwords live only in MySQL */
export type User = UserPublic;

export interface Property {
  id: string;
  userId: string;
  name: string;
  location?: string;
  defaultSource: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface ReportSummary {
  summary: {
    totalBookings: number;
    totalRevenue: number;
    totalExpenses: number;
    totalNights: number;
    avgOccupancy: number;
    netProfit: number;
  };
  bySource: { source: string; bookings: number; revenue: number }[];
  byProperty: { property: string; bookings: number; revenue: number }[];
  target: { monthYear: string; revenueTarget: number; occupancyTarget: number } | null;
}

export interface AuthSession {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
  token: string;
  expiresAt: number;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details?: string;
  ipAddress: string;
  timestamp: string;
}

export interface UploadedFile {
  id: string;
  userId: string;
  fileName: string;
  rowCount: number;
  uploadedAt: string;
  source: string; // Airbnb, VRBO, etc.
}

export interface RentalRecord {
  id: string;
  fileId: string;
  userId: string;
  date: string; // ISO
  property: string;
  guest?: string;
  nights: number;
  revenue: number;
  expenses: number;
  occupancy: number; // 0-100
  source: string;
  status: 'completed' | 'cancelled' | 'pending';
}
