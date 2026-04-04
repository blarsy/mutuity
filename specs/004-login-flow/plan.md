# Implementation Plan: Authentication And Login Flow

**Branch**: `004-login-flow` | **Date**: 2026-04-02 | **Spec**: `/specs/004-login-flow/spec.md`
**Input**: Feature specification from `/specs/004-login-flow/spec.md`

## Summary

Implement the first end-user authentication flow for Mutuity: secure sign-in, protected-route redirects, persistent server-managed sessions, and logout. The implementation must replace browser-supplied development headers for normal user flows while preserving the existing PostgreSQL role model and sanitized GraphQL authentication errors.

## Technical Context

**Language/Version**: TypeScript (strict mode) for frontend and backend; SQL/PL-pgSQL for database logic  
**Primary Dependencies**: React, Next.js, MUI v5, Apollo Client, PostgreSQL, PostGraphile, Express, cookie/session middleware or equivalent secure session tooling, password hashing library  
**Storage**: PostgreSQL  
**Testing**: Jest; integration tests for auth/session flows; contract tests for GraphQL/HTTP auth behavior  
**Target Platform**: Web application for desktop/mobile browsers; Node.js backend for PostGraphile and session endpoints  
**Project Type**: Web application with separate frontend and backend  
**Performance Goals**: Login and current-session retrieval should complete within 1 second in normal local conditions; protected-route redirects should feel immediate; session checks on page load should not noticeably delay navigation  
**Constraints**: API-first backend via PostGraphile plus minimal auth/session HTTP endpoints; all user-facing strings through i18n; secure `HttpOnly` cookie sessions; sanitized client errors; existing PostgreSQL role model (`identified_account`, `manager`, `admin`) remains the source of authorization truth; and **no business SQL in TypeScript** — application code may invoke PostgreSQL functions, but permission-sensitive or multi-step query logic must live in database functions (prefer `LANGUAGE SQL`; use `plpgsql` only when procedural control is needed)  
**Scale/Scope**: MVP browser login flow for local and early hosted environments; no social login or password reset in this phase

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Pass: PostgreSQL remains the source of truth for accounts, roles, and authorization-sensitive data.
- Pass: Frontend stays thin; backend and DB own session security and role mapping.
- Pass: Login, logout, redirect, loading, and error states must all be present as user-visible flows from the start.
- Pass: Implementation preserves strict TypeScript and testability.
- Pass: Existing sanitized GraphQL fallback remains in place for unauthenticated requests.
- Pass: TypeScript may call PostgreSQL functions, but business rules, permission-sensitive access, and hotfix-prone SQL bodies must live in database functions rather than in application code.

## Project Structure

### Documentation (this feature)

```text
specs/004-login-flow/
├── spec.md
├── plan.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── postgraphile/
│   ├── auth/
│   └── db/
└── tests/
  ├── contract/
  └── integration/

frontend/
├── src/
│   ├── pages/
│   ├── features/auth/
│   ├── components/
│   └── services/
```

**Structure Decision**: Keep authentication minimal and explicit. Use backend-managed session endpoints for login/logout/current-session checks, while PostGraphile continues to enforce database authorization using role/account context derived from the server-managed session.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
