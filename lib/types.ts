// Types are hand-authored from the backend's Mongoose models, services, and
// controllers (no OpenAPI spec exists). Keep these in sync with backend source
// when routes change.

export type Role = "super_admin" | "main_admin" | "finance_director";

export type TenantType = "COLLEGE" | "DEPARTMENT";
export type TenantStatus = "ACTIVE" | "FROZEN" | "ARCHIVED";

export const STUDENT_LEVELS = [
  "100L",
  "200L",
  "200L(D.E)",
  "300L",
  "400L",
] as const;
export type StudentLevel = (typeof STUDENT_LEVELS)[number];

export type StudentStatus = "new" | "returning";
export type TransactionStatus = "pending" | "success" | "failed";
export type PaymentType = "online" | "manual";

export const EXPENSE_CATEGORIES = [
  "Events",
  "Welfare",
  "Logistics",
  "Administration",
  "Miscellaneous",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type OnboardingStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "APPROVAL_FAILED"
  | "CANCELLED";

// API response envelope
export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}
export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[] | undefined>;
  code?: string;
  requestId?: string;
}

// Auth
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  tenantId?: string | null;
  mustChangePassword: boolean;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

// Tenant
export interface Tenant {
  _id: string;
  name: string;
  code: string;
  type: TenantType;
  status: TenantStatus;
  convenienceFeeStudent: number;
  convenienceFeeAssociation: number;
  financeDirectorId?: string | null;
  mainAdminId: string;
  bankName?: string | null;
  bankCode?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  logoUrl?: string | null;
  templateId: string;
  paystackSubaccountCode?: string | null;
  paystackSubaccountId?: number | null;
  normalizedName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedTenants {
  tenants: Tenant[];
  total: number;
  page: number;
  limit: number;
}

// Tenant minus convenienceFeeAssociation, plus active session fee status.
// Used on the student-facing payment page.
export type PublicTenant = Omit<Tenant, "convenienceFeeAssociation"> & {
  feesLocked: boolean;
  newStudentFee: number;
  returningStudentFee: number;
};

// Slim projection used for the "pick your association" list.
export interface PublicTenantSummary {
  _id: string;
  name: string;
  code: string;
  type: TenantType;
  status: TenantStatus;
  logoUrl?: string | null;
  convenienceFeeStudent: number;
  feesLocked: boolean;
  newStudentFee: number;
  returningStudentFee: number;
}

// Sessions
export interface AcademicSession {
  _id: string;
  label: string;
  isActive: boolean;
  startDate: string;
  endDate?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Normalized shape from the controller's formatFees() — not the raw TenantSession
// document. isLocked is renamed feesLocked here.
export interface TenantSessionFees {
  newStudentFee: number;
  returningStudentFee: number;
  feesLocked: boolean;
  lockedAt?: string | null;
  overriddenBy?: string | null;
  overriddenAt?: string | null;
}

// Transactions
export interface Transaction {
  _id: string;
  reference: string;
  paystackReference?: string | null;
  studentName: string;
  matricNumber: string;
  email: string;
  phone: string;
  level: StudentLevel;
  studentStatus: StudentStatus;
  tenantId: string;
  tenantName?: string;
  tenantType?: TenantType;
  sessionId: string;
  sessionLabel?: string;
  amount: number;
  expectedAmount: number;
  baseAmount?: number;
  convenienceFeeStudent?: number;
  convenienceFeeAssociation?: number;
  associationPayout: number;
  status: TransactionStatus;
  paymentType: PaymentType;
  gender?: string | null;
  roomNumber?: string | null;
  department?: string | null;
  receiptUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedTransactions {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}

// Finance
export interface FinanceSummary {
  openingBalance: number;
  totalIncome: number;
  incomeCount: number;
  totalExpenses: number;
  expenseCount: number;
  netBalance: number;
  isClosed: boolean;
  closedAt: string | null;
}

export interface ExpenseBreakdownEntry {
  category: ExpenseCategory;
  total: number;
  count: number;
}

export interface FinanceTrendPoint {
  date: string;
  income: number;
  expenses: number;
  netBalance: number;
}

export interface PlatformFinanceSummaryEntry {
  tenantId: string;
  tenantName: string;
  tenantType?: TenantType;
  openingBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  isClosed: boolean;
}

// Expenses
export interface Expense {
  _id: string;
  tenantId: string;
  sessionId: string;
  title: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  note?: string | null;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Users
export interface AdminUser {
  _id: string;
  fullName: string;
  email: string;
  role: Role;
  tenantId?: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  lockedUntil?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Analytics
export interface PlatformAnalytics {
  totals: {
    totalCollected: number;
    totalTransactions: number;
    onlineTransactions: number;
    manualTransactions: number;
    successfulPayments: number;
    pendingPayments: number;
    failedPayments: number;
    /** Combined (student + association) convenience fee revenue. Super Admin only. */
    totalConvenienceFee: number;
  };
  byTenant: Array<{
    _id: string;
    tenantName: string;
    tenantType: TenantType;
    totalCollected: number;
    count: number;
    /** Combined (student + association) convenience fee revenue for this tenant. Super Admin only. */
    convenienceFeeCollected: number;
  }>;
  bySession: Array<{ _id: string; sessionLabel: string; totalCollected: number; count: number }>;
  dailyTrend: Array<{ _id: { year: number; month: number; day: number }; totalCollected: number; count: number }>;
  netBalanceByTenant: PlatformFinanceSummaryEntry[];
}

export interface TenantAnalytics {
  totals: {
    totalCollected: number;
    totalTransactions: number;
    onlineTransactions: number;
    manualTransactions: number;
    successfulPayments?: number;
    pendingPayments?: number;
    failedPayments?: number;
    /** Combined (student + association) convenience fee revenue. Only present when the caller is Super Admin. */
    totalConvenienceFee?: number;
  };
  byLevel: Array<{ _id: StudentLevel; count: number; totalCollected: number }>;
  byPaymentType: Array<{ _id: PaymentType; count: number; totalCollected: number }>;
  recentPayments: Transaction[];
}

// Onboarding
export interface OnboardingRequest {
  _id: string;
  associationName: string;
  associationType: TenantType;
  contactFullName: string;
  contactPhone: string;
  associationEmail: string;
  financeDirectorFullName: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  resolvedAccountName: string;
  status: OnboardingStatus;
  submittedAt: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  resultingTenantId?: string | null;
  resultingFinanceDirectorId?: string | null;
  approvalAttempts: number;
  failureReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

// GET /onboarding/:id returns the request wrapped with its audit trail and
// any linked requests — not a flat OnboardingRequest. The detail page's
// approve/reject buttons depend on request.status being present, which only
// exists inside this wrapper shape.
export interface OnboardingAuditEntry {
  _id: string;
  action: string;
  userId?: string | null;
  userEmail: string;
  userRole: string;
  ipAddress: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface OnboardingLinkedRequestSummary {
  _id: string;
  associationName: string;
  status: OnboardingStatus;
  submittedAt?: string;
  cancelledAt?: string | null;
}

export interface OnboardingRequestDetail {
  request: OnboardingRequest;
  auditTrail: OnboardingAuditEntry[];
  supersedes: OnboardingLinkedRequestSummary | null;
  supersededBy: OnboardingLinkedRequestSummary | null;
}

export interface Bank {
  name: string;
  code: string;
  slug: string;
}

export interface PaginatedOnboardingRequests {
  requests: OnboardingRequest[];
  total: number;
  page: number;
  limit: number;
}

// Payments
export interface InitializePaymentResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
  internalReference: string;
  amount: number;
  baseAmount: number;
  convenienceFeeStudent: number;
  totalPayable: number;
}

export interface VerifyCallbackResult {
  status: TransactionStatus;
  internalReference: string;
}

export interface PaymentMaintenanceStatus {
  maintenanceMode: boolean;
  message: string | null;
}

// Audit
export interface AuditLogEntry {
  _id: string;
  userId?: string | null;
  userEmail: string;
  userRole: string;
  action: string;
  details?: Record<string, unknown> | null;
  ipAddress: string;
  timestamp: string;
  createdAt: string;
}

export interface PaginatedAuditLogs {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}

// Settings
export interface PlatformSettings {
  maintenanceMode: boolean;
  emailDailyLimit: number;
  emailWarningThreshold: number;
  emailSentToday: number;
  emailLastReset: string;
  updatedBy?: string | null;
  updatedAt: string;
}

export interface PaystackSettingsView {
  secretConfigured: boolean;
  secretPreview: string | null;
  timeoutMs: number;
  maxRetries: number;
  feeTolerancePct: number;
  feeToleranceFlatKobo: number;
}

// Templates
export interface ReceiptTemplate {
  templateId: string;
}

// Receipt — populated Transaction with email/phone stripped.
// tenantId and sessionId are populated objects, not ID strings.
export interface ReceiptTransaction {
  _id: string;
  reference: string;
  paystackReference?: string | null;
  studentName: string;
  matricNumber: string;
  level: StudentLevel;
  studentStatus: StudentStatus;
  tenantId: { _id: string; name: string; type: TenantType; logoUrl?: string | null };
  sessionId: { _id: string; label: string };
  amount: number;
  expectedAmount: number;
  status: TransactionStatus;
  paymentType: PaymentType;
  receiptUrl?: string | null;
  createdAt: string;
}

export interface ReceiptVerification {
  verified: boolean;
  reference: string;
  status: string;
  studentName?: string;
  matricNumber?: string;
  amount?: number;
  paymentDate?: string;
  session?: string;
  paidFor?: string;
  level?: StudentLevel;
  paymentType?: PaymentType;
}

// Recovery
export interface PendingReceiptTransaction {
  _id: string;
  reference: string;
  paystackReference?: string | null;
  studentName: string;
  matricNumber: string;
  amount: number;
  tenantId: { _id: string; name: string } | string;
  sessionId: { _id: string; label: string } | string;
  createdAt: string;
}