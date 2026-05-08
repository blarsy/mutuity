import { hash } from "bcryptjs";
import { Client } from "pg";

const DATABASE_URL = process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/mutuity";
const claimerIdentifier = process.env.E2E_CLAIMER_IDENTIFIER ?? "e2e-claimer@example.com";
const creatorIdentifier = process.env.E2E_CREATOR_IDENTIFIER ?? "e2e-creator@example.com";
const password = process.env.E2E_PASSWORD ?? "password123";

const NEED_ID = "11111111-1111-4111-8111-111111111111";
const CLAIM_ID = "22222222-2222-4222-8222-222222222222";
const NEED_TITLE = "E2E Smoke Need - Core Flow";

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

    await upsertCredential(client, creatorId, creatorIdentifier, passwordHash);
    await upsertCredential(client, claimerId, claimerIdentifier, passwordHash);

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

    await client.query("commit");
    process.stdout.write("E2E smoke users and claim seed completed.\n");
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
