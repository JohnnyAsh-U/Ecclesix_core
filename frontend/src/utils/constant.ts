export const LoginUrl = '/auth/login'
export const LogoutUrl = '/auth/logout'
export const MeUrl = '/auth/me'
export const Verify2FAUrl = '/auth/verify-2fa'
export const Setup2FAUrl = '/auth/2fa/setup'



// Tenant Endpoints Url
export const TenantUrl = "/tenants"
export const ActivateTenantUrl = (id: number) => `${TenantUrl}/${id}/activate`
export const DeactivateTenantUrl = (id: number) => `${TenantUrl}/${id}/deactivate`
export const UpdateDomainUrl = (id:number) => `${TenantUrl}/${id}/domains`
export const UpdateStorageUrl = (id: number) => `${TenantUrl}/${id}/storage`


// Billing Endpint Url
export const BillingPlanUrl = "/plans"
export const DetailBillingPlanUrl = (id: number) =>`${BillingPlanUrl}/${id}`

// Internal Billing Endpoints
export const BillingUrl = "/billings"
export const BillingRecentUrl = `${BillingUrl}/recent`
export const BillingStatsUrl = `${BillingUrl}/stats`
export const BillingFilterUrl = `${BillingUrl}/filter`
export const BillingCreateUrl = `${BillingUrl}/create`
export const BillingChangePlanUrl = `${BillingUrl}/change-plan`