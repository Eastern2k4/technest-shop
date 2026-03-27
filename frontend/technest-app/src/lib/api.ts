import { parseJsonSafe } from './http'
import type { components } from './api-contract'

type ApiErrorResponse = components['schemas']['ApiErrorResponse']
type AuthResponse = components['schemas']['AuthResponse']
type AuthStatusResponse = components['schemas']['AuthStatusResponse']
type UserProfileResponse = components['schemas']['UserProfileResponse']
type UpdateProfileRequest = components['schemas']['UpdateProfileRequest']
type CategoryRecord = components['schemas']['Category']
type CategoryInput = components['schemas']['CategoryInput']
type ProductRecord = components['schemas']['Product']
type ProductUpsertRequest = components['schemas']['ProductUpsertRequest']
type OrderStatus = components['schemas']['OrderStatus']
type PaymentStatus = components['schemas']['PaymentStatus']
type PaymentMethod = components['schemas']['PaymentMethod']
type OrderRequest = components['schemas']['OrderRequest']
type OrderSummary = components['schemas']['OrderSummaryResponse']
type OrderDetail = components['schemas']['OrderDetailResponse']
type OrderStatusUpdateRequest = {
  status?: OrderStatus
  paymentStatus?: PaymentStatus
}
type ReviewRecord = components['schemas']['ReviewResponse']
type PendingReviewCount = components['schemas']['PendingReviewCountResponse']
type PendingReviewByProduct = components['schemas']['PendingReviewByProductResponse']
type CreateReviewRequest = components['schemas']['CreateReviewRequest']
type ReplyReviewRequest = components['schemas']['ReplyReviewRequest']
type ModerateReviewRequest = components['schemas']['ModerateReviewRequest']
type ReviewMutationResponse = components['schemas']['ReviewMutationResponse']
type UserRecord = components['schemas']['UserResponse']
type CreateUserRequest = components['schemas']['CreateUserRequest']
type UpdateUserRequest = components['schemas']['UpdateUserRequest']
type StatisticsSummary = components['schemas']['StatisticsSummaryResponse']
type RevenueDetails = components['schemas']['RevenueDetailsResponse']

type ValidationErrors = Record<string, string>
type QueryParamValue = string | number | boolean | null | undefined

type StoredAuthUser = {
  accessToken?: string | null
  token?: string | null
}

export type AuthMeResponse = AuthStatusResponse | UserProfileResponse

export type AuthUser = {
  id: number | null | undefined
  email: string
  fullName: string
  username: string
  phone: string
  addressText: string
  avatarUrl: string
  role: string
  accessToken: string | null
}

export type ApiError = Error & {
  status?: number
  error?: string | null
  validationErrors?: ValidationErrors | null
  response?: ApiErrorResponse | Record<string, unknown> | null
}

export type ApiOptions = {
  method?: string
  body?: FormData | unknown
  headers?: HeadersInit
}

export type ProductListParams = {
  categoryId?: number
  cat?: string
  q?: string
  minPrice?: string | number
  maxPrice?: string | number
  brand?: string
}

export type AdminOrderListParams = {
  status?: OrderStatus | ''
  from?: string
  to?: string
  q?: string
}

export type RevenueExportParams = {
  from?: string
  to?: string
}

const RAW_BASE = import.meta.env.VITE_API_URL || ''
const BASE = RAW_BASE.replace(/\/+$/, '')

export function buildApiUrl(path: string): string {
  return path.startsWith('http') ? path : `${BASE}${path.startsWith('/') ? '' : '/'}${path}`
}

export function toAuthUser(profile: UserProfileResponse | null | undefined, token?: string | null): AuthUser {
  return {
    id: profile?.id,
    email: profile?.email || '',
    fullName: profile?.fullName || '',
    username: profile?.username || profile?.email || '',
    phone: profile?.phone || '',
    addressText: profile?.addressText || '',
    avatarUrl: profile?.avatarUrl || '',
    role: String(profile?.role || '').toUpperCase().replace(/^ROLE_/, ''),
    accessToken: token || null,
  }
}

export function getAccessToken(): string | null {
  try {
    const parsed = JSON.parse(localStorage.getItem('tn_user') || 'null') as unknown
    if (!isRecord(parsed)) {
      return null
    }
    const storedUser = parsed as StoredAuthUser
    return storedUser.accessToken || storedUser.token || null
  } catch {
    return null
  }
}

export function getValidationErrors(error: unknown): ValidationErrors {
  if (!isRecord(error)) {
    return {}
  }

  const validationErrors = error.validationErrors
  if (!isRecord(validationErrors)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(validationErrors).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
  )
}

export function getErrorMessage(error: unknown, fallback = 'Request failed'): string {
  if (!isRecord(error) || typeof error.message !== 'string' || !error.message) {
    return fallback
  }
  return error.message
}

export function isAuthenticatedProfile(data: AuthMeResponse | null | undefined): data is UserProfileResponse {
  if (!isRecord(data)) {
    return false
  }

  const record = data as Record<string, unknown>
  return typeof record.id === 'number' && typeof record.email === 'string'
}

export async function api<T = unknown>(path: string, { method = 'GET', body, headers }: ApiOptions = {}): Promise<T> {
  const res = await fetchRequest(path, { method, body, headers })
  const data = await parseJsonSafe(res)

  if (!res.ok) {
    throw buildApiError(res, data)
  }

  return data as T
}

export const AuthAPI = {
  login: (email: string, password: string) =>
    api<AuthResponse>('/api/auth/login', { method: 'POST', body: { email, password } }),
  register: (fullName: string, email: string, password: string) =>
    api<AuthResponse>('/api/auth/register', { method: 'POST', body: { fullName, email, password } }),
  me: (token?: string | null) =>
    api<AuthMeResponse>('/api/auth/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),
  updateProfile: (body: UpdateProfileRequest) =>
    api<UserProfileResponse>('/api/auth/me', { method: 'PUT', body }),
} as const

export const CategoriesAPI = {
  list: () => api<CategoryRecord[]>('/api/categories'),
  get: (id: number) => api<CategoryRecord>(`/api/categories/${id}`),
  create: (body: CategoryInput) => api<CategoryRecord>('/api/categories', { method: 'POST', body }),
  update: (id: number, body: CategoryInput) => api<CategoryRecord>(`/api/categories/${id}`, { method: 'PUT', body }),
  remove: (id: number) => api<void>(`/api/categories/${id}`, { method: 'DELETE' }),
} as const

export const ProductsAPI = {
  list: (params: ProductListParams = {}) => api<ProductRecord[]>(withQuery('/api/products', params)),
  get: (id: number | string) => api<ProductRecord>(`/api/products/${id}`),
  create: (body: ProductUpsertRequest) => api<ProductRecord>('/api/products', { method: 'POST', body }),
  update: (id: number, body: ProductUpsertRequest) => api<ProductRecord>(`/api/products/${id}`, { method: 'PUT', body }),
  remove: (id: number) => api<void>(`/api/products/${id}`, { method: 'DELETE' }),
} as const

export const OrdersAPI = {
  list: (params: AdminOrderListParams = {}) => api<OrderSummary[]>(withQuery('/api/orders', params)),
  mine: () => api<OrderSummary[]>('/api/orders/me'),
  get: (id: number | string) => api<OrderDetail>(`/api/orders/${id}`),
  create: (body: OrderRequest) => api<OrderDetail>('/api/orders', { method: 'POST', body }),
  updateStatus: (id: number, body: OrderStatusUpdateRequest) =>
    api<OrderDetail>(`/api/orders/${id}/status`, { method: 'PUT', body }),
} as const

export const ReviewsAPI = {
  listProduct: (productId: number | string) => api<ReviewRecord[]>(`/api/reviews/product/${productId}`),
  create: (productId: number, body: CreateReviewRequest) =>
    api<ReviewMutationResponse>(`/api/reviews/product/${productId}`, { method: 'POST', body }),
  pendingCount: () => api<PendingReviewCount>('/api/reviews/pending-count'),
  pendingByProduct: () => api<PendingReviewByProduct[]>('/api/reviews/pending-by-product'),
  listManagement: (productId: number) => api<ReviewRecord[]>(`/api/reviews/manage/product/${productId}`),
  reply: (reviewId: number, body: ReplyReviewRequest) =>
    api<ReviewMutationResponse>(`/api/reviews/${reviewId}/reply`, { method: 'POST', body }),
  moderate: (reviewId: number, body: ModerateReviewRequest) =>
    api<ReviewMutationResponse>(`/api/reviews/${reviewId}/moderation`, { method: 'PUT', body }),
  remove: (reviewId: number) => api<ReviewMutationResponse>(`/api/reviews/${reviewId}`, { method: 'DELETE' }),
} as const

export const UsersAPI = {
  list: () => api<UserRecord[]>('/api/admin/users'),
  get: (id: number) => api<UserRecord>(`/api/admin/users/${id}`),
  create: (body: CreateUserRequest) => api<UserRecord>('/api/admin/users', { method: 'POST', body }),
  update: (id: number, body: UpdateUserRequest) => api<UserRecord>(`/api/admin/users/${id}`, { method: 'PUT', body }),
  remove: (id: number) => api<void>(`/api/admin/users/${id}`, { method: 'DELETE' }),
} as const

export const StatisticsAPI = {
  summary: () => api<StatisticsSummary>('/api/admin/statistics'),
  revenueDetails: () => api<RevenueDetails>('/api/admin/revenue'),
  exportCsv: async (params: RevenueExportParams = {}) => {
    const res = await fetchRequest(withQuery('/api/admin/revenue/export', params))
    if (!res.ok) {
      const data = await parseJsonSafe(res)
      throw buildApiError(res, data)
    }
    return res.text()
  },
} as const

export function withQuery(path: string, params: Record<string, QueryParamValue>): string {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return
    }
    if (typeof value === 'string' && value.trim() === '') {
      return
    }
    searchParams.set(key, String(value))
  })

  const query = searchParams.toString()
  return query ? `${path}?${query}` : path
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getStringValue(value: Record<string, unknown> | null, key: string): string | null {
  const candidate = value?.[key]
  return typeof candidate === 'string' ? candidate : null
}

async function fetchRequest(path: string, { method = 'GET', body, headers }: ApiOptions = {}): Promise<Response> {
  const url = buildApiUrl(path)
  const token = getAccessToken()
  const resolvedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...toHeaderRecord(headers),
  }

  const init: RequestInit = {
    method,
    headers: resolvedHeaders,
  }

  if (body instanceof FormData) {
    delete resolvedHeaders['Content-Type']
    init.body = body
  } else if (body !== undefined) {
    init.body = JSON.stringify(body)
  }

  return fetch(url, init)
}

function buildApiError(res: Response, data: unknown): ApiError {
  const responseObject = isRecord(data) ? data : null
  const message =
    getStringValue(responseObject, 'message') ||
    getStringValue(responseObject, 'error') ||
    getStringValue(responseObject, '_raw') ||
    res.statusText ||
    `HTTP ${res.status}`

  const error = new Error(
    res.status === 401
      ? message || 'Authentication required. Please log in again.'
      : res.status === 403
        ? message || 'You do not have permission to perform this action.'
        : message
  ) as ApiError

  error.status = res.status
  error.error = getStringValue(responseObject, 'error') || null
  error.validationErrors = responseObject ? getValidationErrors(responseObject) : null
  error.response = responseObject
  return error
}

function toHeaderRecord(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) {
    return {}
  }
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries())
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers)
  }
  return { ...headers }
}
