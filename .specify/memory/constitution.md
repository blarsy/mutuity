# Mutuity Constitution

**Created**: 2026-03-23  
**Scope**: All development on the Mutuity platform
**Purpose**: Governing principles that guide every specification, plan, and implementation decision.
**Document version**: 1.0.0

## 1. Mission & Product Principles

**Mutuity** explores how to capture the needs of individuals and collectives so unused human and material resources can be matched to those needs.

The project output is a web tool designed to integrate into Tope-là, a web and mobile app where individuals and associations can access what they need through barter, conventional money, and an internal token that encourages participation in a complementary economy.

A complementary economy operates alongside the mainstream market economy by connecting underused resources with unmet needs.

Tope-là already helps users offer underused resources. Mutuity provides the missing capability: structuring and inventorying needs so they can be discovered, prioritized, and fulfilled.

- **Organizations are the primary target**, while UX and data design must support both organizations and individuals.
- **Trust is the product.** Every feature must increase transparency between users. When in doubt, choose explicit behavior over clever behavior.
- **French-speaking community first**, with multilingual support (fr/en) required from day one. All user-facing strings must go through i18n.
- **Nonprofit constraints are product constraints.** Organizations and individuals using this platform have limited time and no technical support staff, so UX must be self-explanatory.

---

## 2. Architecture Principles

### Simplicity over cleverness
- Choose the boring, well-understood solution. Exotic patterns require justification.
- The database is the source of truth. Business logic that can live in the DB (as PL/pgSQL) is more portable than application-layer logic.

### Separation of concerns
- The data layer (PostgreSQL), API layer (GraphQL/REST), and presentation layers (web, mobile) must remain independently replaceable.
- No business logic in the frontend. Frontends are thin clients consuming the API.
- Background jobs are isolated from the main request cycle.

### Multi-platform by design
- Any feature shipped must be accessible on **both** a web app and a mobile app, unless explicitly scoped otherwise
- A mobile app must **not** be implemented now, but should be easy to add in the future
- API-first: the backend must not assume any specific frontend.

### Security defaults
- Authentication and authorisation are enforced at the database layer via PostgreSQL roles (`anonymous`, `identified_account`, `admin`). Application-level auth is a secondary safeguard, not the primary one.
- All user data is private by default. Public data exposure must be explicit and intentional.

---

## 3. Code Quality Standards

### General
- **No dead code in PRs.** Remove unused code rather than commenting it out.
- **Every public function/mutation must have a description** (JSDoc, docstring, or SQL comment).
- Prefer explicit over implicit. Magic constants must be named.

### TypeScript / JavaScript
- Strict TypeScript (`strict: true`) everywhere. No `any` without a comment explaining why.
- Async/await over raw Promises. No unhandled promise rejections.
- Use established patterns already in the codebase (Apollo Client, Formik+Yup, MUI) before introducing new libraries.

### PostgreSQL / PL/pgSQL
- All schema changes via versioned migration files. Never modify the DB schema by hand in production.
- Functions and views must be commented with their purpose and expected caller.
- Row-level security policies must be reviewed for every new table.

### React
- Components must be either pure presentational or connected-to-data — avoid mixing concerns in the same component.
- Storybook stories required for all reusable UI components.
- Internationalise all user-facing strings at creation time; never retrofit i18n later.

## 4. UX Consistency

- Follow the existing design language (MUI v5). Deviations require design review.
- Loading states, empty states, and error states are mandatory — not optional. Every async operation must handle all three.

## 5. Definition of Done

A feature is done when the repository owner has verified the following:

- [ ] All acceptance scenarios from `spec.md` pass
- [ ] i18n keys added for all new user-facing strings (fr + en)
- [ ] Storybook stories added for new reusable components
- [ ] DB migration file created and tested for any schema changes
- [ ] `quickstart.md` updated if setup steps changed
- [ ] No TypeScript errors, no failing tests

---

## 6. Governance & Amendments

- This constitution is the default decision framework for product, architecture, and implementation choices in Mutuity.
- If another document conflicts with this constitution, this constitution takes precedence unless the exception is explicitly documented and approved.
- Any change to this constitution must be made in the same pull request as the work that requires it, or in a dedicated pull request that explains the reason for the change.
- Every amendment must include:
	- the problem being solved,
	- the rule being added, removed, or changed,
	- the practical impact on current and future work.
- Amendments require explicit approval from the repository owner before they become binding.
- Reviewers are expected to enforce this constitution during specification review, implementation review, and release preparation.
- When a rule becomes too vague to guide decisions consistently, it must be clarified rather than ignored.

## 7. Versioning & Change Policy

- The constitution version follows semantic intent:
	- major for breaking governance or architecture changes,
	- minor for new principles or materially expanded requirements,
	- patch for wording clarifications that do not change meaning.
- The document version must be updated whenever this constitution is amended.
- Each amendment must also update the `Created` or amendment metadata as appropriate so the current governing version is visible at a glance.
- If an implementation cannot comply with this constitution, the pull request must explicitly document the exception, the reason, and the follow-up plan.
- Temporary exceptions are allowed only when they are time-boxed and tracked as follow-up work.
- Silent drift is not acceptable: if practice changes, the constitution must be updated to match, or the implementation must be corrected.
