# Quickstart: Tope-là Migration Foundation Audit

## Objective

Use this quickstart to reverse-engineer Tope-là into a SpecKit-friendly migration backlog and prepare the Mutuity merge without starting with a risky code/schema splice.

## Repositories in scope

- Mutuity: `/Users/bertrandlarsy/code/mutuity`
- Tope-là: `/Users/bertrandlarsy/code/symmetrical-broccoli`

## Audit checklist

### 1. Start both products locally

#### Mutuity
```bash
cd /Users/bertrandlarsy/code/mutuity
docker compose up -d
```

#### Tope-là backend + web + mobile
```bash
cd /Users/bertrandlarsy/code/symmetrical-broccoli/docker/environments/local
docker compose up

cd /Users/bertrandlarsy/code/symmetrical-broccoli/webapi
yarn && yarn dev

cd /Users/bertrandlarsy/code/symmetrical-broccoli/backoffice
yarn && yarn dev

cd /Users/bertrandlarsy/code/symmetrical-broccoli/app
yarn && npx expo start
```

### 2. Capture the current product behavior

For each important flow, collect:
- screenshots or screen recordings
- navigation entry points
- form fields and validation behavior
- success, loading, and error states
- role-specific differences between visitor, signed-in user, organization, and admin

### 3. Build the feature inventory

Document at least:
- auth and account management
- organization / association profiles
- resources / offers
- needs / claims
- conversations / unread state
- notifications / push
- campaigns / admin workflows
- search / maps / location behavior
- media uploads and attachments

### 4. Record merge decisions

For each domain area, decide one of:
- **Keep as MVP reference**
- **Merge with Mutuity behavior**
- **Defer after MVP**
- **Drop from the unified platform**

### 5. Produce the first roadmap

The first roadmap should identify the next implementation-ready specs, likely including:
1. unified auth/accounts foundation
2. resource discovery and publishing
3. needs and claims integration
4. conversations and notifications
5. mobile parity and admin/campaign follow-up

## Suggested evidence sources

- `README.md` in both repositories
- package manifests and folder structure
- SQL init/migration files
- representative UI screens and GraphQL queries/mutations
- screenshots from current web and mobile behavior

## Definition of done for this planning feature

- The new Feature 003 spec fully reflects the migration direction.
- The glossary and architecture decisions are documented.
- The roadmap names the first implementation waves.
- The team can start the next feature spec without revisiting this decision from scratch.