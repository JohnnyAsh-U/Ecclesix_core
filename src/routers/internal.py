"""
Main internal router aggregator.
Combines all sub-routers for Django API endpoints:
- Stats (infrastructure monitoring)
- Migrations (tenant database migrations)
- Tenants (tenant management)
- Billing (billing records)
- Plans (billing plans)
- Storage (storage management)
- Health (health checks)
"""

from fastapi import APIRouter
# from src.routers.internal_stats import stats_router
# from src.routers.internal_migrations import migrations_router
from src.routers.internal_tenants import tenants_router
# from src.routers.internal_billing import billing_router
from src.routers.internal_plans import plans_router
# from src.routers.internal_storage import storage_router
# from src.routers.internal_health import health_router

# Main internal router that aggregates all sub-routers
internal_router = APIRouter()

# Include all sub-routers
# internal_router.include_router(stats_router)
# internal_router.include_router(migrations_router)
internal_router.include_router(tenants_router)
# internal_router.include_router(billing_router)
internal_router.include_router(plans_router)
# internal_router.include_router(storage_router)
# internal_router.include_router(health_router)
