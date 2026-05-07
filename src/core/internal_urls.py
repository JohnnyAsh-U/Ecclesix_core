"""
Django internal API URL constants.
Centralized URL definitions for all Django proxy endpoints.
"""


# ============================================================================
# Migrations Endpoints
# ============================================================================
MIGRATIONS_SUMMARY = "/api/v1/internal/tenants/migrations"
MIGRATIONS_RUN = "/api/v1/internal/tenants/{tenant_id}/migrate"
MIGRATIONS_STATE = "/api/v1/internal/tenants/{tenant_id}/migration-state"

# ============================================================================
# Tenants Endpoints
# ============================================================================
TENANTS_LIST = "/api/v1/internal/tenants"
TENANTS_CREATE = "/api/v1/internal/tenants"
TENANTS_DETAIL = "/api/v1/internal/tenants/{tenant_id}"
TENANTS_ACTIVATE = "/api/v1/internal/tenants/{tenant_id}/activate"
TENANTS_DEACTIVATE = "/api/v1/internal/tenants/{tenant_id}/deactivate"
TENANTS_DOMAINS = "/api/v1/internal/tenants/{tenant_id}/domains"
TENANTS_STORAGE = "/api/v1/internal/tenants/{tenant_id}/storage"

# ============================================================================
# Billing Endpoints
# ============================================================================
BILLINGS_RECENT = "/api/v1/internal/billings/recent"
BILLINGS_FILTER = "/api/v1/internal/billings/filter"
BILLINGS_STATS = "/api/v1/internal/billings/stats"
BILLINGS_CREATE = "/api/v1/internal/billings/create"
BILLINGS_CHANGE_PLAN = "/api/v1/internal/billings/change-plan"

# ============================================================================
# Plans Endpoints
# ============================================================================
PLANS_LIST = "/api/v1/internal/plans"
PLANS_CREATE = "/api/v1/internal/plans"
PLANS_DETAIL = "/api/v1/internal/plans/{plan_id}"

# ============================================================================
# Storage Endpoints
# ============================================================================

TENANTS_STORAGE_LIST = "/api/v1/internal/storage"
TENANTS_STORAGE_STAT = "/api/v1/internal/storage/stats"

# ============================================================================
# Health Endpoints
# ============================================================================
HEALTH_DJANGO = "/api/v1/internal/health/django"
