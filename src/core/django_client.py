"""
Async HTTP client for communicating with Django /internal/ endpoints.
Provides retry logic, error mapping, and authentication header injection.
"""

import logging
import httpx
import asyncio
from typing import Optional, Any, Dict
from fastapi import HTTPException
from src.core.config import Settings
from src.schemas.roles import ADMIN, MOD

logger = logging.getLogger(__name__)


class DjangoClientError(Exception):
    """Base exception for Django client errors."""
    pass


class DjangoClient:
    """
    Singleton async HTTP client for Django internal API communication.
    
    Features:
    - Automatic X-Internal-Key header injection
    - Retry logic with exponential backoff
    - Request timeout enforcement
    - Django error response mapping to HTTPException
    """
    
    _instance: Optional["DjangoClient"] = None
    _client: Optional[httpx.AsyncClient] = None
    _settings: Optional[Settings] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    @classmethod
    def initialize(cls, settings: Settings) -> "DjangoClient":
        """Initialize the singleton with settings. Call during app startup."""
        instance = cls()
        instance._settings = settings
        return instance
    
    async def connect(self) -> None:
        """Create the async HTTP client. Call during app startup."""
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self._settings.DJANGO_BASE_URL,
                timeout=self._settings.DJANGO_REQUEST_TIMEOUT,
            )
            logger.info(f"Django HTTP client connected to {self._settings.DJANGO_BASE_URL}")
    
    async def disconnect(self) -> None:
        """Close the async HTTP client. Call during app shutdown."""
        if self._client is not None:
            await self._client.aclose()
            self._client = None
            logger.info("Django HTTP client disconnected")
    
    def _get_auth_header(self, role: str = MOD) -> Dict[str, str]:
        """Get the X-Internal-Token header for the given role."""
        if role == ADMIN:
            secret = self._settings.INTERNAL_API_SECRET_ADMIN
        elif role == MOD:
            secret = self._settings.INTERNAL_API_SECRET_MOD
        else:
            raise ValueError(f"Invalid role: {role}. Must be 'admin' or 'mod'.")
        
        return {"X-Internal-Token": secret}
    
    async def _make_request(
        self,
        method: str,
        path: str,
        role: str = ADMIN,
        **kwargs
    ) -> httpx.Response:
        """
        Make an HTTP request with retry logic.
        
        Args:
            method: HTTP method (GET, POST, etc.)
            path: API path (e.g., "/internal/stats/requests/hourly")
            role: Role for authentication ("admin" or "mod")
            **kwargs: Additional arguments to pass to httpx
        
        Returns:
            httpx.Response object
        
        Raises:
            DjangoClientError: If all retries fail
        """
        if self._client is None:
            raise DjangoClientError("Django client not initialized. Call connect() first.")
        
        headers = kwargs.pop("headers", {})
        headers.update(self._get_auth_header(role))
        
        for attempt in range(self._settings.DJANGO_RETRY_MAX_ATTEMPTS):
            try:
                response = await self._client.request(
                    method=method,
                    url=path,
                    headers=headers,
                    **kwargs
                )
                
                # Log the response
                logger.debug(
                    f"Django API {method} {path}: {response.status_code}",
                    extra={"attempt": attempt + 1}
                )
                
                return response
                
            except (httpx.TimeoutException, httpx.ConnectError, httpx.RequestError) as e:
                is_last_attempt = attempt == self._settings.DJANGO_RETRY_MAX_ATTEMPTS - 1
                
                logger.warning(
                    f"Django API request failed (attempt {attempt + 1}/{self._settings.DJANGO_RETRY_MAX_ATTEMPTS}): {str(e)}",
                    extra={"path": path, "error": str(e)}
                )
                
                if is_last_attempt:
                    raise DjangoClientError(
                        f"Django API unreachable after {self._settings.DJANGO_RETRY_MAX_ATTEMPTS} attempts"
                    )
                
                # Wait before retrying
                await asyncio.sleep(self._settings.DJANGO_RETRY_DELAY)
    
    def _map_django_error(self, status_code: int, detail: str) -> HTTPException:
        """
        Map Django error responses to FastAPI HTTPExceptions.
        
        Args:
            status_code: HTTP status code from Django
            detail: Error detail from Django response
        
        Returns:
            HTTPException with appropriate status code and message
        """
        status_map = {
            400: 400,  # Bad Request
            401: 401,  # Unauthorized
            403: 403,  # Forbidden
            404: 404,  # Not Found
            409: 409,  # Conflict
            500: 502,  # Map 500 to 502 Bad Gateway
            502: 502,  # Bad Gateway
            503: 503,  # Service Unavailable
        }
        
        mapped_status = status_map.get(status_code, 502)
        
        return HTTPException(
            status_code=mapped_status,
            detail=f"Django API error: {detail}"
        )
    
    async def request(
        self,
        method: str,
        path: str,
        role: str,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Make an authenticated request to Django API.
        
        Args:
            method: HTTP method
            path: API path
            role: Role for authentication
            **kwargs: Additional request arguments (json, params, data, etc.)
        
        Returns:
            Parsed JSON response
        
        Raises:
            HTTPException: If request fails or Django returns an error
        """
        try:
            response = await self._make_request(method, path, role, **kwargs)
            
            # Handle error responses
            if response.status_code >= 400:
                try:
                    error_data = response.json()
                    detail = error_data.get("detail", "Unknown error")
                except Exception:
                    detail = response.text or f"HTTP {response.status_code}"
                
                raise self._map_django_error(response.status_code, detail)
            
            # Return parsed JSON
            return response.json()
            
        except HTTPException:
            raise
        except DjangoClientError as e:
            raise HTTPException(status_code=503, detail=str(e))
        except Exception as e:
            logger.exception(f"Unexpected error in Django request: {str(e)}")
            raise HTTPException(status_code=502, detail="Django API communication failed")
    
    async def get(self, path: str, role: str = "admin", **kwargs) -> Dict[str, Any]:
        """GET request to Django API."""
        return await self.request("GET", path, role, **kwargs)
    
    async def post(self, path: str, role: str = "admin", **kwargs) -> Dict[str, Any]:
        """POST request to Django API."""
        return await self.request("POST", path, role, **kwargs)
    
    async def put(self, path: str, role: str = "admin", **kwargs) -> Dict[str, Any]:
        """PUT request to Django API."""
        return await self.request("PUT", path, role, **kwargs)
    
    async def patch(self, path: str, role: str = "admin", **kwargs) -> Dict[str, Any]:
        """PATCH request to Django API."""
        return await self.request("PATCH", path, role, **kwargs)
    
    async def delete(self, path: str, role: str = "admin", **kwargs) -> Dict[str, Any]:
        """DELETE request to Django API."""
        return await self.request("DELETE", path, role, **kwargs)
    
    async def health_check(self) -> bool:
        """
        Check if Django API is accessible.
        
        Returns:
            True if Django is accessible, False otherwise
        """
        try:
            response = await self._make_request("GET", "/health", role="admin")
            return 200 <= response.status_code < 300
        except Exception as e:
            logger.warning(f"Django health check failed: {str(e)}")
            return False


