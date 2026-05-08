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
export const TenantStorageUrl = (id: number) => `${TenantUrl}/${id}/storage`


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

// Migrations Endpoints (internal)
export const MigrationsUrl = "/migrations"
export const MigrationsSummaryUrl = `${MigrationsUrl}`
export const MigrationsRunUrl = (tenantId: number) => `${MigrationsUrl}/${tenantId}/migrate`
export const MigrationsStateUrl = (tenantId: number) => `${MigrationsUrl}/${tenantId}/migration-state`

// Storage Endpoints (internal)
export const TenantsStorageListUrl = '/storage'
export const TenantsStorageStatUrl = `${TenantsStorageListUrl}/stats`


// Backup Endpoints (internal)
export const BackupUrl = "/backups"
export const TenantBackupsUrl = (tenantSchema: string) => `${BackupUrl}/${tenantSchema}`
export const BackupTenantUrl = (tenantSchema: string) => `${BackupUrl}/tenant/${tenantSchema}`
export const BackupFullUrl = `${BackupUrl}/full`
export const BackupDeleteUrl = (backupId: string) => `${BackupUrl}/${backupId}`
export const BackupRestoreUrl = (backupId: string) => `${BackupUrl}/${backupId}/restore`
export const BackupDownloadUrl = (backupId: string) => `${BackupUrl}/${backupId}/download-url`
export const BackupPurgeUrl = `${BackupUrl}/purge`