"""
Prometheus metrics service for querying infrastructure and API statistics.
Handles all Prometheus queries and metric aggregation.
"""

import logging
import requests
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status

from src.core.config import get_settings

logger = logging.getLogger(__name__)


class PrometheusService:
    """Service to query and aggregate Prometheus metrics."""

    def __init__(self):
        self.prometheus_url = get_settings().PROMETHEUS_URL

    def query(self, query: str) -> List[Dict[str, Any]]:
        """Execute an instant query against Prometheus."""
        try:
            url = f"{self.prometheus_url}/api/v1/query"
            response = requests.get(url, params={"query": query}, timeout=10)

            if response.status_code != 200:
                logger.error(f"Prometheus query failed: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Prometheus service unavailable",
                )

            data = response.json()
            if data["status"] != "success":
                logger.error(f"Prometheus query error: {data.get('error', 'Unknown')}")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Prometheus query failed",
                )

            return data["data"]["result"]
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to connect to Prometheus: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Prometheus connection failed",
            )

    def query_range(
        self, query: str, start: datetime, end: datetime, step: str
    ) -> List[Dict[str, Any]]:
        """Execute a range query against Prometheus."""
        try:
            url = f"{self.prometheus_url}/api/v1/query_range"
            response = requests.get(
                url,
                params={
                    "query": query,
                    "start": int(start.timestamp()),
                    "end": int(end.timestamp()),
                    "step": step,
                },
                timeout=10,
            )

            if response.status_code != 200:
                logger.error(f"Prometheus range query failed: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Prometheus service unavailable",
                )

            data = response.json()
            if data["status"] != "success":
                logger.error(f"Prometheus range query error: {data.get('error', 'Unknown')}")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Prometheus range query failed",
                )

            return data["data"]["result"]
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to connect to Prometheus: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Prometheus connection failed",
            )

    def get_requests_per_hour(self) -> Dict[str, Any]:
        """Get request count per hour for the last 12 hours."""
        now = datetime.utcnow()
        start = now - timedelta(hours=12)

        query = "sum(rate(ecclesix_http_requests_total[1h])) by ()"
        results = self.query_range(query, start, now, "3600")

        hourly_data = []
        for result in results:
            timestamp = int(result["values"][-1][0])
            value = float(result["values"][-1][1])
            hourly_data.append(
                {
                    "timestamp": datetime.fromtimestamp(timestamp).isoformat(),
                    "request_count": int(value),
                }
            )

        return {
            "period": "last_12_hours",
            "data": hourly_data,
            "total_records": len(hourly_data),
        }

    def get_requests_per_day(self) -> Dict[str, Any]:
        """Get request count per day for the last 7 days."""
        now = datetime.utcnow()
        start = now - timedelta(days=7)

        query = "sum(rate(ecclesix_http_requests_total[1d])) by ()"
        results = self.query_range(query, start, now, "86400")

        daily_data = []
        for result in results:
            timestamp = int(result["values"][-1][0])
            value = float(result["values"][-1][1])
            daily_data.append(
                {
                    "timestamp": datetime.fromtimestamp(timestamp).isoformat(),
                    "request_count": int(value),
                }
            )

        return {
            "period": "last_7_days",
            "data": daily_data,
            "total_records": len(daily_data),
        }

    def get_requests_per_tenant_hour(self) -> Dict[str, Any]:
        """Get request count per tenant per hour for the last 12 hours."""
        now = datetime.utcnow()
        start = now - timedelta(hours=12)

        query = "sum(rate(ecclesix_http_requests_total[1h])) by (tenant)"
        results = self.query_range(query, start, now, "3600")

        tenant_data = {}
        for result in results:
            tenant = result["metric"].get("tenant", "unknown")
            if tenant not in tenant_data:
                tenant_data[tenant] = []
            timestamp = int(result["values"][-1][0])
            value = float(result["values"][-1][1])
            tenant_data[tenant].append(
                {
                    "timestamp": datetime.fromtimestamp(timestamp).isoformat(),
                    "request_count": int(value),
                }
            )

        formatted_data = [
            {"tenant": tenant, "data": data}
            for tenant, data in sorted(tenant_data.items())
        ]

        return {
            "period": "last_12_hours",
            "breakdown": "per_tenant",
            "tenants_count": len(tenant_data),
            "data": formatted_data,
        }

    def get_requests_per_tenant_day(self) -> Dict[str, Any]:
        """Get request count per tenant per day for the last 7 days."""
        now = datetime.utcnow()
        start = now - timedelta(days=7)

        query = "sum(rate(ecclesix_http_requests_total[1d])) by (tenant)"
        results = self.query_range(query, start, now, "86400")

        tenant_data = {}
        for result in results:
            tenant = result["metric"].get("tenant", "unknown")
            if tenant not in tenant_data:
                tenant_data[tenant] = []
            timestamp = int(result["values"][-1][0])
            value = float(result["values"][-1][1])
            tenant_data[tenant].append(
                {
                    "timestamp": datetime.fromtimestamp(timestamp).isoformat(),
                    "request_count": int(value),
                }
            )

        formatted_data = [
            {"tenant": tenant, "data": data}
            for tenant, data in sorted(tenant_data.items())
        ]

        return {
            "period": "last_7_days",
            "breakdown": "per_tenant",
            "tenants_count": len(tenant_data),
            "data": formatted_data,
        }

    def get_requests_summary(self) -> Dict[str, Any]:
        """Get summary statistics for requests (last 7 days)."""
        query_total = "sum(increase(ecclesix_http_requests_total[7d]))"
        total_results = self.query(query_total)
        total_requests = float(total_results[0]["value"][1]) if total_results else 0

        query_by_tenant = "sum(increase(ecclesix_http_requests_total[7d])) by (tenant)"
        tenant_results = self.query(query_by_tenant)

        tenant_stats = []
        for result in tenant_results:
            tenant = result["metric"].get("tenant", "unknown")
            request_count = float(result["value"][1])
            tenant_stats.append({"tenant": tenant, "request_count": int(request_count)})

        tenant_stats = sorted(
            tenant_stats, key=lambda x: x["request_count"], reverse=True
        )

        query_errors = "sum(increase(ecclesix_http_errors_total[7d]))"
        error_results = self.query(query_errors)
        error_count = float(error_results[0]["value"][1]) if error_results else 0

        error_rate = (error_count / total_requests * 100) if total_requests > 0 else 0

        return {
            "period": "last_7_days",
            "summary": {
                "total_requests": int(total_requests),
                "total_errors": int(error_count),
                "error_rate_percent": round(error_rate, 2),
            },
            "top_tenants": tenant_stats[:10],
            "unique_tenants": len(tenant_stats),
        }

    def get_cpu_usage(self) -> Dict[str, Any]:
        """Get current and average CPU usage."""
        now = datetime.utcnow()
        start = now - timedelta(hours=1)

        query_current = "rate(process_cpu_seconds_total[5m])"
        current_results = self.query(query_current)
        current_cpu = (float(current_results[0]["value"][1]) * 100) if current_results else 0

        query_avg = "avg(rate(process_cpu_seconds_total[5m]))"
        avg_results = self.query_range(query_avg, start, now, "300")

        cpu_history = []
        for result in avg_results:
            timestamp = int(result["values"][-1][0])
            value = float(result["values"][-1][1]) * 100
            cpu_history.append(
                {
                    "timestamp": datetime.fromtimestamp(timestamp).isoformat(),
                    "cpu_percent": round(value, 2),
                }
            )

        avg_cpu = (
            sum(h["cpu_percent"] for h in cpu_history) / len(cpu_history)
            if cpu_history
            else 0
        )

        return {
            "unit": "percent",
            "current": round(current_cpu, 2),
            "average_last_hour": round(avg_cpu, 2),
            "history": cpu_history,
        }

    def get_memory_usage(self) -> Dict[str, Any]:
        """Get current and average memory usage."""
        now = datetime.utcnow()
        start = now - timedelta(hours=1)

        query_current = "process_resident_memory_bytes"
        current_results = self.query(query_current)
        current_memory = float(current_results[0]["value"][1]) if current_results else 0

        query_limit = "container_memory_limit_bytes"
        limit_results = self.query(query_limit)
        memory_limit = float(limit_results[0]["value"][1]) if limit_results else None

        query_history = "avg(process_resident_memory_bytes)"
        history_results = self.query_range(query_history, start, now, "300")

        memory_history = []
        for result in history_results:
            timestamp = int(result["values"][-1][0])
            value = float(result["values"][-1][1])
            memory_history.append(
                {
                    "timestamp": datetime.fromtimestamp(timestamp).isoformat(),
                    "memory_mb": round(value / (1024 * 1024), 2),
                }
            )

        avg_memory = (
            sum(h["memory_mb"] for h in memory_history) / len(memory_history)
            if memory_history
            else 0
        )

        response_data = {
            "unit": "bytes",
            "display_unit": "MB",
            "current_mb": round(current_memory / (1024 * 1024), 2),
            "current_bytes": int(current_memory),
            "average_last_hour_mb": round(avg_memory, 2),
            "history": memory_history,
        }

        if memory_limit:
            response_data["limit_mb"] = round(memory_limit / (1024 * 1024), 2)
            response_data["limit_bytes"] = int(memory_limit)
            response_data["used_percent"] = round(
                (current_memory / memory_limit) * 100, 2
            )

        return response_data

    def get_disk_usage(self) -> Dict[str, Any]:
        """Get current disk usage."""
        query = 'node_filesystem_avail_bytes{fstype!=""}'
        disk_results = self.query(query)

        disk_data = []
        total_size = 0
        total_available = 0

        for result in disk_results:
            device = result["metric"].get("device", "unknown")
            mountpoint = result["metric"].get("mountpoint", "/")
            available_bytes = float(result["value"][1])

            disk_data.append(
                {
                    "device": device,
                    "mountpoint": mountpoint,
                    "available_gb": round(available_bytes / (1024**3), 2),
                    "available_bytes": int(available_bytes),
                }
            )
            total_available += available_bytes

        # Note: Without size metrics, we estimate total_size from available
        # In production, query node_filesystem_size_bytes as well
        total_size = total_available * 1.2  # Rough estimate

        total_used = total_size - total_available
        total_used_percent = (total_used / total_size) * 100 if total_size > 0 else 0

        return {
            "unit": "bytes",
            "display_unit": "GB",
            "total": {
                "size_gb": round(total_size / (1024**3), 2),
                "used_gb": round(total_used / (1024**3), 2),
                "available_gb": round(total_available / (1024**3), 2),
                "used_percent": round(total_used_percent, 2),
            },
            "by_mountpoint": disk_data,
        }

    def get_api_latency(self) -> Dict[str, Any]:
        """Get API latency statistics (percentiles)."""
        query_p50 = "histogram_quantile(0.50, sum(rate(ecclesix_http_request_duration_seconds_bucket[5m])) by (le))"
        p50_results = self.query(query_p50)
        p50_latency = (float(p50_results[0]["value"][1]) * 1000) if p50_results else 0

        query_p95 = "histogram_quantile(0.95, sum(rate(ecclesix_http_request_duration_seconds_bucket[5m])) by (le))"
        p95_results = self.query(query_p95)
        p95_latency = (float(p95_results[0]["value"][1]) * 1000) if p95_results else 0

        query_p99 = "histogram_quantile(0.99, sum(rate(ecclesix_http_request_duration_seconds_bucket[5m])) by (le))"
        p99_results = self.query(query_p99)
        p99_latency = (float(p99_results[0]["value"][1]) * 1000) if p99_results else 0

        return {
            "unit": "milliseconds",
            "percentiles": {
                "p50": round(p50_latency, 2),
                "p95": round(p95_latency, 2),
                "p99": round(p99_latency, 2),
            },
        }
