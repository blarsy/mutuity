import { hash } from "bcryptjs";
import { Client } from "pg";

const DATABASE_URL = process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/mutuity";
const claimerIdentifier = process.env.E2E_CLAIMER_IDENTIFIER ?? "e2e-claimer@example.com";
const creatorIdentifier = process.env.E2E_CREATOR_IDENTIFIER ?? "e2e-creator@example.com";
const secondClaimerIdentifier = process.env.E2E_SECOND_CLAIMER_IDENTIFIER ?? "e2e-claimer-2@example.com";
const password = process.env.E2E_PASSWORD ?? "password123";

const NEED_ID = "11111111-1111-4111-8111-111111111111";
const CLAIM_ID = "22222222-2222-4222-8222-222222222222";
const NEED_TITLE = "E2E Smoke Need - Core Flow";
const ACTION_NEED_ID = "33333333-3333-4333-8333-333333333333";
const ACTION_CLAIM_ID = "44444444-4444-4444-8444-444444444444";
const ACTION_NEED_TITLE = "E2E Smoke Need - Cancel Claim Flow";
const RESOURCE_ID = "55555555-5555-4555-8555-555555555555";
const RESOURCE_TITLE = "E2E Smoke Resource - Bid Lifecycle";
const DECLINE_RESOURCE_ID = "66666666-6666-4666-8666-666666666666";
const DECLINE_RESOURCE_TITLE = "E2E Smoke Resource - Bid Decline";
const SETTLEMENT_NEED_ID = "77777777-7777-4777-8777-777777777777";
const SETTLEMENT_NEED_TITLE = "E2E Smoke Need - Settlement Side Effects";
const SETTLEMENT_PRIMARY_CLAIM_ID = "88888888-8888-4888-8888-888888888888";
const SETTLEMENT_SIBLING_CLAIM_ID = "99999999-9999-4999-8999-999999999999";

async function upsertAccount(client, identifier, displayName) {
  const result = await client.query(
    `
      insert into app_public.account (external_subject, display_name, latitude, longitude)
      values ($1, $2, 50.6072, 3.3889)
      on conflict (external_subject) do update
      set display_name = excluded.display_name,
          latitude = excluded.latitude,
          longitude = excluded.longitude,
          updated_at = now()
      returning id
    `,
    [identifier, displayName]
  );

  return result.rows[0].id;
}

async function upsertCredential(client, accountId, identifier, passwordHash) {
  await client.query(
    `
      insert into app_private.account_credential (
        account_id,
        login_identifier,
        password_hash,
        role_name,
        is_active,
        email_verified_at
      )
      values ($1, $2, $3, 'identified_account', true, now())
      on conflict (account_id) do update
      set login_identifier = excluded.login_identifier,
          password_hash = excluded.password_hash,
          role_name = excluded.role_name,
          is_active = excluded.is_active,
          email_verified_at = excluded.email_verified_at,
          updated_at = now()
    `,
    [accountId, identifier, passwordHash]
  );
}

async function seed() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    await client.query("begin");

    const passwordHash = await hash(password, 12);

    const creatorId = await upsertAccount(client, creatorIdentifier, "E2E Creator");
    const claimerId = await upsertAccount(client, claimerIdentifier, "E2E Claimer");
    const secondClaimerId = await upsertAccount(client, secondClaimerIdentifier, "E2E Claimer Two");

    await upsertCredential(client, creatorId, creatorIdentifier, passwordHash);
    await upsertCredential(client, claimerId, claimerIdentifier, passwordHash);
    await upsertCredential(client, secondClaimerId, secondClaimerIdentifier, passwordHash);

    await client.query(
      `
        insert into app_public.token_movement (
          account_id,
          event_type,
          amount_delta,
          reference_type,
          payload,
          idempotency_key
        )
        values (
          $1,
          'e2e_seed_creator_credit',
          1200,
          'e2e_seed',
          jsonb_build_object('source', 'e2e_smoke_seed'),
          'e2e-smoke-seed:creator-credit'
        )
        on conflict (idempotency_key) do nothing
      `,
      [creatorId]
    );

    await client.query(
      `
        delete from app_public.need_claim
        where claimer_account_id = $1
          and need_id = any($2::uuid[])
          and id <> all($3::uuid[])
      `,
      [claimerId, [NEED_ID, ACTION_NEED_ID], [CLAIM_ID, ACTION_CLAIM_ID]]
    );

    await client.query(
      `
        delete from app_public.need_claim
        where claimer_account_id = $1
          and need_id = any($2::uuid[])
          and id <> all($3::uuid[])
      `,
      [
        secondClaimerId,
        [SETTLEMENT_NEED_ID],
        [SETTLEMENT_SIBLING_CLAIM_ID]
      ]
    );

    await client.query(
      `
        insert into app_public.need (
          id,
          creator_account_id,
          title,
          description,
          location,
          intensity,
          proposed_topes_amount,
          object_required,
          competence_required,
          tooling_required,
          multiple_people_required,
          required_people_count,
          is_active,
          expires_at,
          latitude,
          longitude
        )
        values (
          $1,
          $2,
          $3,
          'Seeded by E2E smoke scenario',
          'Tournai',
          'sharing',
          120,
          false,
          false,
          false,
          false,
          null,
          true,
          now() + interval '14 days',
          50.6072,
          3.3889
        )
        on conflict (id) do update
        set creator_account_id = excluded.creator_account_id,
            title = excluded.title,
            description = excluded.description,
            location = excluded.location,
            intensity = excluded.intensity,
            proposed_topes_amount = excluded.proposed_topes_amount,
            object_required = excluded.object_required,
            competence_required = excluded.competence_required,
            tooling_required = excluded.tooling_required,
            multiple_people_required = excluded.multiple_people_required,
            required_people_count = excluded.required_people_count,
            is_active = excluded.is_active,
            expires_at = excluded.expires_at,
            latitude = excluded.latitude,
            longitude = excluded.longitude,
            updated_at = now()
      `,
      [NEED_ID, creatorId, NEED_TITLE]
    );

    await client.query(
      `
        insert into app_public.need (
          id,
          creator_account_id,
          title,
          description,
          location,
          intensity,
          proposed_topes_amount,
          object_required,
          competence_required,
          tooling_required,
          multiple_people_required,
          required_people_count,
          is_active,
          expires_at,
          latitude,
          longitude
        )
        values (
          $1,
          $2,
          $3,
          'Seeded by E2E claim action scenario',
          'Tournai',
          'sharing',
          140,
          false,
          false,
          false,
          false,
          null,
          true,
          now() + interval '14 days',
          50.6072,
          3.3889
        )
        on conflict (id) do update
        set creator_account_id = excluded.creator_account_id,
            title = excluded.title,
            description = excluded.description,
            location = excluded.location,
            intensity = excluded.intensity,
            proposed_topes_amount = excluded.proposed_topes_amount,
            object_required = excluded.object_required,
            competence_required = excluded.competence_required,
            tooling_required = excluded.tooling_required,
            multiple_people_required = excluded.multiple_people_required,
            required_people_count = excluded.required_people_count,
            is_active = excluded.is_active,
            expires_at = excluded.expires_at,
            latitude = excluded.latitude,
            longitude = excluded.longitude,
            updated_at = now()
      `,
      [ACTION_NEED_ID, creatorId, ACTION_NEED_TITLE]
    );

    await client.query(
      `
        insert into app_public.need (
          id,
          creator_account_id,
          title,
          description,
          location,
          intensity,
          proposed_topes_amount,
          object_required,
          competence_required,
          tooling_required,
          multiple_people_required,
          required_people_count,
          is_active,
          expires_at,
          latitude,
          longitude
        )
        values (
          $1,
          $2,
          $3,
          'Seeded by E2E settlement side-effects scenario',
          'Tournai',
          'sharing',
          60,
          false,
          false,
          false,
          false,
          null,
          true,
          now() + interval '14 days',
          50.6072,
          3.3889
        )
        on conflict (id) do update
        set creator_account_id = excluded.creator_account_id,
            title = excluded.title,
            description = excluded.description,
            location = excluded.location,
            intensity = excluded.intensity,
            proposed_topes_amount = excluded.proposed_topes_amount,
            object_required = excluded.object_required,
            competence_required = excluded.competence_required,
            tooling_required = excluded.tooling_required,
            multiple_people_required = excluded.multiple_people_required,
            required_people_count = excluded.required_people_count,
            is_active = excluded.is_active,
            expires_at = excluded.expires_at,
            latitude = excluded.latitude,
            longitude = excluded.longitude,
            updated_at = now()
      `,
      [SETTLEMENT_NEED_ID, creatorId, SETTLEMENT_NEED_TITLE]
    );

    await client.query(
      `
        insert into app_public.need_claim (
          id,
          need_id,
          claimer_account_id,
          message,
          status,
          settled_at,
          settled_by_account_id,
          created_at,
          updated_at
        )
        values (
          $1,
          $2,
          $3,
          'E2E smoke claim message',
          'open',
          null,
          null,
          now(),
          now()
        )
        on conflict (id) do update
        set need_id = excluded.need_id,
            claimer_account_id = excluded.claimer_account_id,
            message = excluded.message,
            status = excluded.status,
            settled_at = excluded.settled_at,
            settled_by_account_id = excluded.settled_by_account_id,
            updated_at = now()
      `,
      [CLAIM_ID, NEED_ID, claimerId]
    );

    await client.query(
      `
        insert into app_public.need_claim (
          id,
          need_id,
          claimer_account_id,
          message,
          status,
          settled_at,
          settled_by_account_id,
          created_at,
          updated_at
        )
        values (
          $1,
          $2,
          $3,
          'E2E claim action smoke message',
          'open',
          null,
          null,
          now(),
          now()
        )
        on conflict (id) do update
        set need_id = excluded.need_id,
            claimer_account_id = excluded.claimer_account_id,
            message = excluded.message,
            status = excluded.status,
            settled_at = excluded.settled_at,
            settled_by_account_id = excluded.settled_by_account_id,
            updated_at = now()
      `,
      [ACTION_CLAIM_ID, ACTION_NEED_ID, claimerId]
    );

    await client.query(
      `
        insert into app_public.need_claim (
          id,
          need_id,
          claimer_account_id,
          message,
          status,
          settled_at,
          settled_by_account_id,
          created_at,
          updated_at
        )
        values (
          $1,
          $2,
          $3,
          'E2E settlement primary smoke claim message',
          'open',
          null,
          null,
          now(),
          now()
        )
        on conflict (id) do update
        set need_id = excluded.need_id,
            claimer_account_id = excluded.claimer_account_id,
            message = excluded.message,
            status = excluded.status,
            settled_at = excluded.settled_at,
            settled_by_account_id = excluded.settled_by_account_id,
            updated_at = now()
      `,
      [SETTLEMENT_PRIMARY_CLAIM_ID, SETTLEMENT_NEED_ID, claimerId]
    );

    await client.query(
      `
        insert into app_public.need_claim (
          id,
          need_id,
          claimer_account_id,
          message,
          status,
          settled_at,
          settled_by_account_id,
          created_at,
          updated_at
        )
        values (
          $1,
          $2,
          $3,
          'E2E settlement sibling smoke claim message',
          'open',
          null,
          null,
          now(),
          now()
        )
        on conflict (id) do update
        set need_id = excluded.need_id,
            claimer_account_id = excluded.claimer_account_id,
            message = excluded.message,
            status = excluded.status,
            settled_at = excluded.settled_at,
            settled_by_account_id = excluded.settled_by_account_id,
            updated_at = now()
      `,
      [SETTLEMENT_SIBLING_CLAIM_ID, SETTLEMENT_NEED_ID, secondClaimerId]
    );

    await client.query(
      `
        insert into app_public.resource (
          id,
          creator_account_id,
          title,
          description,
          location,
          latitude,
          longitude,
          intensity,
          default_token_amount,
          is_product,
          is_service,
          can_be_given,
          can_be_exchanged,
          can_be_taken_away,
          can_be_delivered,
          is_active,
          expires_at
        )
        values (
          $1,
          $2,
          $3,
          'Seeded by E2E bid lifecycle smoke scenario',
          'Tournai',
          50.6072,
          3.3889,
          'sharing',
          180,
          true,
          false,
          true,
          true,
          true,
          false,
          true,
          now() + interval '14 days'
        )
        on conflict (id) do update
        set creator_account_id = excluded.creator_account_id,
            title = excluded.title,
            description = excluded.description,
            location = excluded.location,
            latitude = excluded.latitude,
            longitude = excluded.longitude,
            intensity = excluded.intensity,
            default_token_amount = excluded.default_token_amount,
            is_product = excluded.is_product,
            is_service = excluded.is_service,
            can_be_given = excluded.can_be_given,
            can_be_exchanged = excluded.can_be_exchanged,
            can_be_taken_away = excluded.can_be_taken_away,
            can_be_delivered = excluded.can_be_delivered,
            is_active = excluded.is_active,
            expires_at = excluded.expires_at,
            updated_at = now()
      `,
      [RESOURCE_ID, creatorId, RESOURCE_TITLE]
    );

    await client.query(
      `
        insert into app_public.resource (
          id,
          creator_account_id,
          title,
          description,
          location,
          latitude,
          longitude,
          intensity,
          default_token_amount,
          is_product,
          is_service,
          can_be_given,
          can_be_exchanged,
          can_be_taken_away,
          can_be_delivered,
          is_active,
          expires_at
        )
        values (
          $1,
          $2,
          $3,
          'Seeded by E2E bid decline smoke scenario',
          'Tournai',
          50.6072,
          3.3889,
          'sharing',
          110,
          true,
          false,
          true,
          true,
          true,
          false,
          true,
          now() + interval '14 days'
        )
        on conflict (id) do update
        set creator_account_id = excluded.creator_account_id,
            title = excluded.title,
            description = excluded.description,
            location = excluded.location,
            latitude = excluded.latitude,
            longitude = excluded.longitude,
            intensity = excluded.intensity,
            default_token_amount = excluded.default_token_amount,
            is_product = excluded.is_product,
            is_service = excluded.is_service,
            can_be_given = excluded.can_be_given,
            can_be_exchanged = excluded.can_be_exchanged,
            can_be_taken_away = excluded.can_be_taken_away,
            can_be_delivered = excluded.can_be_delivered,
            is_active = excluded.is_active,
            expires_at = excluded.expires_at,
            updated_at = now()
      `,
      [DECLINE_RESOURCE_ID, creatorId, DECLINE_RESOURCE_TITLE]
    );

    await client.query(
      `
        delete from app_public.resource_bid
        where resource_id = $1
          and bidder_account_id = $2
      `,
      [RESOURCE_ID, claimerId]
    );

    await client.query(
      `
        delete from app_public.resource_bid
        where resource_id = $1
          and bidder_account_id = $2
      `,
      [DECLINE_RESOURCE_ID, claimerId]
    );

    await client.query("commit");
    process.stdout.write("E2E smoke users, claims, and resource seed completed.\n");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

seed().catch(error => {
  process.stderr.write(`E2E seed failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
