import { createClient } from '@/lib/supabase/client';

/**
 * Client-side fetch wrapper for the Spring Boot services.
 *
 * Every request carries the Supabase JWT in the Authorization header.
 * SupabaseJwtAuthFilter on the Java side validates it against the
 * JWKS endpoint and builds the AuthenticatedUser principal.
 *
 * Requests go through the Next.js rewrites in next.config.js so the
 * browser never needs CORS headers from the Java services in development.
 */

export type Service = 'auth' | 'profile' | 'company' | 'jobs';

const BASE: Record<Service, string> = {
  auth: '/api/auth-svc',
  profile: '/api/profile-svc',
  company: '/api/company-svc',
  jobs: '/api/jobs-svc',
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    /** Full parsed JSON error body, for endpoints that attach extra fields beyond error/message. */
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch<T>(
  service: Service,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(await authHeader()),
    ...((init.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(`${BASE[service]}${path}`, { ...init, headers });

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      res.status,
      body.error ?? 'UNKNOWN',
      body.message ?? `Request failed with status ${res.status}`,
      body
    );
  }

  return body as T;
}

/**
 * For multipart/form-data uploads. Deliberately does not go through
 * apiFetch — that wrapper force-sets Content-Type: application/json, which
 * would strip the multipart boundary the browser generates for FormData.
 */
export async function apiUpload<T>(
  service: Service,
  path: string,
  formData: FormData
): Promise<T> {
  const headers = await authHeader();
  const res = await fetch(`${BASE[service]}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      res.status,
      body.error ?? 'UNKNOWN',
      body.message ?? `Request failed with status ${res.status}`,
      body
    );
  }

  return body as T;
}

export const api = {
  get: <T>(s: Service, p: string) => apiFetch<T>(s, p),
  post: <T>(s: Service, p: string, body?: unknown) =>
    apiFetch<T>(s, p, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(s: Service, p: string, body?: unknown) =>
    apiFetch<T>(s, p, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(s: Service, p: string) => apiFetch<T>(s, p, { method: 'DELETE' }),
  upload: apiUpload,
};

// ── Domain types mirroring the Spring Boot DTOs ─────────────────────────

export type RelationshipType =
  | 'FIRST_LINE_MANAGER'
  | 'SECOND_LINE_MANAGER'
  | 'TEAM_LEAD'
  | 'COLLEAGUE'
  | 'INDIVIDUAL_CONTRIBUTOR'
  | 'VP'
  | 'AVP'
  | 'DIRECTOR'
  | 'ASST_DIRECTOR';

export interface EmploymentHistoryResponse {
  id: string;
  companyId: string;
  companyName: string | null;
  managerId: string | null;
  managerRelationship: RelationshipType | null;
  managerRelationshipNote: string | null;
  groupId: string | null;
  roleTitle: string;
  roleLevel: string | null;
  employmentType: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  location: string | null;
  isRemote: boolean;
  description: string | null;
  verifiedByDomain: boolean;
  hasManagerRating: boolean;
  hasCompanyRating: boolean;
  hasGroupRating: boolean;
  createdAt: string;
}

export interface SkillResponse {
  skillId: string;
  skillName: string;
  category: string | null;
  yearsExperience: number | null;
  proficiency: string | null;
  isHighlighted: boolean;
}

export interface ProfileResponse {
  userId: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  currentRole: string | null;
  industry: string | null;
  location: string | null;
  yearsExperience: number | null;
  profileComplete: boolean;
  privacySetting: 'PUBLIC' | 'CONNECTIONS' | 'PRIVATE';
  subscriptionTier: 'FREE' | 'CANDIDATE_PREMIUM' | 'EMPLOYER_PRO' | 'ENTERPRISE';
  tokens: number;
  employmentHistory: EmploymentHistoryResponse[];
  skills: SkillResponse[];
  connectionCount: number;
  createdAt: string;
  gender: 'MALE' | 'FEMALE' | 'DECLINE_TO_IDENTIFY' | null;
  prefix: string | null;
  hasPassword: boolean;
}

export interface SuggestedConnection {
  userId: string;
  displayName: string;
  currentRole: string | null;
  industry: string | null;
  avatarUrl: string | null;
  location: string | null;
  similarityScore: number;
  suggestionReason: string;
  mutualConnections: number;
}

export interface ResumeImportResult {
  success: boolean;
  message: string;
  positionsImported: number;
  skillsImported: number;
  importedAt: string;
  profile: ProfileResponse;
}

/** Returned as the ApiError.details body on a 409 from POST /profiles/me/resume. */
export interface ResumeIdentityMismatchWarning {
  requiresConfirmation: boolean;
  message: string;
  profileName: string | null;
  resumeName: string | null;
  profileLinkedinUrl: string | null;
  resumeLinkedinUrl: string | null;
}

export interface RecommendedJob {
  jobId: string;
  title: string;
  companyId: string;
  roleCategory: string | null;
  roleLevel: string | null;
  location: string | null;
  isRemote: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  isFeatured: boolean;
  matchScore: number;
  matchReason: string;
}

// ── Companies & ratings ──────────────────────────────────────────────────

export interface CompanySearchResult {
  id: string;
  name: string;
  slug: string;
  industry: string;
  headquarters: string | null;
  logoUrl: string | null;
  verified: boolean;
  avgOverallScore: number | null;
  avgWouldRecommendScore: number | null;
  reviewCount: number;
}

export interface ManagerSummary {
  id: string;
  displayAlias: string;
  roleTitle: string | null;
  department: string | null;
  avgOverallScore: number | null;
  reviewCount: number;
}

export interface GroupSummary {
  id: string;
  name: string;
  function: string;
  avgCollaborationScore: number | null;
  reviewCount: number;
}

export interface CompanyProfileResponse {
  id: string;
  name: string;
  slug: string;
  industry: string;
  sizeBand: string | null;
  headquarters: string | null;
  website: string | null;
  logoUrl: string | null;
  description: string | null;
  foundedYear: number | null;
  verified: boolean;
  avgWorkLifeBalanceScore: number | null;
  avgManagementEmpathyScore: number | null;
  avgAdvancementOpportunityScore: number | null;
  avgBenefitsScore: number | null;
  avgUpperManagementEthosScore: number | null;
  avgOverallScore: number | null;
  avgWouldRecommendScore: number | null;
  reviewCount: number;
  topManagers: ManagerSummary[];
  groups: GroupSummary[];
  createdAt: string;
}

/** Mirrors company-service's RatingDto.MetricValue. */
export interface RatingMetricValue {
  score: number;
  comment: string | null;
}

export interface SubmitCompanyRatingRequest {
  companyId: string;
  employmentHistoryId: string;
  workLifeBalance: RatingMetricValue;
  managementEmpathy: RatingMetricValue;
  advancementOpportunity: RatingMetricValue;
  benefits: RatingMetricValue;
  upperManagementEthos: RatingMetricValue;
  wouldRecommendScore: number;
  roleTitle?: string;
  employmentType?: string;
  stillEmployed?: boolean;
  yearsAtCompany?: number;
  overallReviewText?: string;
}

export interface SubmitManagerRatingRequest {
  companyId: string;
  managerId: string;
  employmentHistoryId: string;
  workLifeBalance: RatingMetricValue;
  managementEmpathy: RatingMetricValue;
  advancementOpportunity: RatingMetricValue;
  wouldWorkAgainScore: number;
  roleTitle?: string;
  employmentType?: string;
  stillEmployed?: boolean;
  yearsAtCompany?: number;
  overallReviewText?: string;
}

export interface RatingResponse {
  id: string;
  moderationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';
  createdAt: string;
}

export interface ManagerDirectoryItem {
  id: string;
  letter: string;
  displayLabel: string;
  roleTitle: string | null;
  avgOverallScore: number | null;
  reviewCount: number;
}

export interface CreateManagerRequest {
  realName: string;
  linkedinUrl?: string;
}

export interface ManagerRef {
  id: string;
  displayLabel: string;
}

/** One row in the cross-company "People" directory/search (GET /people). */
export interface PersonSearchResult {
  id: string;
  letter: string;
  displayLabel: string;
  roleTitle: string | null;
  companyId: string;
  companyName: string;
  companySlug: string;
  avgOverallScore: number | null;
  reviewCount: number;
}

export interface CreatePositionRequest {
  companyId: string;
  roleTitle: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
}

export interface LinkManagerRequest {
  managerId: string;
  relationshipType: RelationshipType;
  relationshipNote?: string;
}

export interface SubmitSalaryRequest {
  companyId: string;
  employmentHistoryId: string;
  baseSalaryAmount: number;
  baseSalaryPeriod: 'HOURLY' | 'DAILY' | 'MONTHLY' | 'YEARLY';
  rsuAmount?: number;
  rsuVestingSchedule?: 'YEARLY' | 'FOUR_YEAR' | 'FIVE_YEAR' | 'TEN_YEAR';
  annualBonusAmount?: number;
}

// ── Admin / moderation ───────────────────────────────────────────────────

export interface MeResponse {
  userId: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  platformRole: 'CANDIDATE' | 'ENTERPRISE' | 'ADMIN' | 'SUPERADMIN';
  subscriptionTier: 'FREE' | 'CANDIDATE_PREMIUM' | 'EMPLOYER_PRO' | 'ENTERPRISE';
  isPremium: boolean;
}

export interface ModerationQueueSummary {
  pendingCompanyRatings: number;
  pendingManagerRatings: number;
  pendingGroupRatings: number;
  pendingManagerIdentities: number;
}

export interface PendingReviewItem {
  id: string;
  entityType: string;
  title: string;
  preview: string | null;
  overallScore: number | null;
  submittedAt: string;
}

export interface ModerationDecisionRequest {
  action: 'APPROVED' | 'REJECTED' | 'FLAGGED';
  reason?: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  adminUserId: string;
  reason: string | null;
  previousStatus: string;
  newStatus: string;
  createdAt: string;
}

export interface AuditHistory {
  entityType: string;
  entityId: string;
  entries: AuditEntry[];
}

export interface AdminUserLookupResponse {
  userId: string;
  email: string;
  displayName: string | null;
  platformRole: 'CANDIDATE' | 'ENTERPRISE' | 'ADMIN' | 'SUPERADMIN';
}
