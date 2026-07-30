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
    message: string
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
      body.message ?? `Request failed with status ${res.status}`
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
};

// ── Domain types mirroring the Spring Boot DTOs ─────────────────────────

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
  connectionCount: number;
  createdAt: string;
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
