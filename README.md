# NMP Technical Assistance Request System

Three-portal system for the National Museum of the Philippines technical assistance workflow.

## Portals

| Portal | URL | Role | Purpose |
|--------|-----|------|---------|
| **Admin** | http://localhost:8080/admin | admin | Build and publish request forms |
| **Client** | http://localhost:8080/client | user | Submit requests with uploaded documents |
| **Records** | http://localhost:8080/records | record_management | Review submissions, set recommendation |

## Flow

1. **Admin** builds a form and clicks **Save & publish** → form goes live.
2. **Client** signs in, fills the live form, uploads a PDF → submission goes to Records as **For Review**.
3. **Record Admin** sees pending count in the notification bell, reviews the uploaded file, selects a **Recommendation**, and clicks **Submit**.

## Quick start

```powershell
npm run setup
npm run start
```

Requires MongoDB running locally.

## Seed accounts

| Email | Password | Portal |
|-------|----------|--------|
| admin@nmp.gov.ph | admin123 | Admin |
| user@nmp.gov.ph | user123 | Client |
| records@nmp.gov.ph | records123 | Records |

## Build

```powershell
cd backend && npm run build
cd frontend && npm run build
```
