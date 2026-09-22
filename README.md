# Ecclesix Core
*The central control plane, billing engine, and tenant orchestrator for the Ecclesix platform.*

## Overview
Ecclesix Core is the master administration gateway for the Ecclesix SaaS ecosystem. While the main Ecclesix application (built on Django) handles a church's daily operational logic, **Ecclesix Core** acts as the overarching infrastructure manager. It automates the provisioning of isolated Django tenants, orchestrates client billing lifecycles, and strictly enforces storage and resource quotas for each tenant.

## Tech Stack
*   **Backend API:** FastAPI (Python)
*   **Frontend Interface:** React 
*   **Architecture Pattern:** Control Plane / Tenant Orchestrator
*   **Integration Target:** Django (Tenant application)

## Key Capabilities
*   **Automated Tenant Provisioning:** Programmatically orchestrates the creation of isolated database schemas and dedicated environments for new Ecclesix clients (Django tenants) upon registration.
*   **Client & Organization Management:** Centralized administration interface for managing global client identities, organization metadata, and top-level administrative access.
*   **SaaS Billing Engine:** Tracks subscription tiers, manages recurring billing cycles, and enforces feature gating based on client payment status.
*   **Storage & Resource Orchestration:** Monitors, allocates, and partitions storage quotas for each individual client, ensuring strict data isolation and preventing noisy-neighbor resource exhaustion.

## System Architecture


1. **The Core Dashboard (React):** The portal where platform administrators and new clients interact with their global billing and organization settings.
2. **The Control Plane (FastAPI):** Handles the high-performance async business logic for subscriptions and infrastructure commands.
3. **The Target (Django):** When a new client is approved via the Core API, it triggers the Django application to spin up a fully isolated tenant architecture for that specific organization.
