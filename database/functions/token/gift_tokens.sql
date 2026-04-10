create or replace function app_public.gift_tokens(
  recipient_account_id uuid,
  amount integer,
  message text default null
)
returns app_public.token_movement
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_sender_account_id uuid;
  v_sender app_public.account;
  v_recipient app_public.account;
  v_transfer_id uuid := gen_random_uuid();
  v_sender_movement app_public.token_movement;
  v_sender_name text;
begin
  v_sender_account_id := app_private.current_account_id();

  if v_sender_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  if gift_tokens.recipient_account_id is null then
    raise exception using message = 'Recipient account not found';
  end if;

  if gift_tokens.amount is null or gift_tokens.amount <= 0 then
    raise exception using message = 'Gift amount must be greater than zero';
  end if;

  if gift_tokens.recipient_account_id = v_sender_account_id then
    raise exception using message = 'You cannot gift tokens to your own account';
  end if;

  select * into v_sender
  from app_public.account
  where id = v_sender_account_id;

  select * into v_recipient
  from app_public.account
  where id = gift_tokens.recipient_account_id;

  if not found then
    raise exception using message = 'Recipient account not found';
  end if;

  v_sender_name := coalesce(v_sender.display_name, v_sender.external_subject, v_sender.id::text);

  select * into v_sender_movement
  from app_private.create_token_movement(
    v_sender_account_id,
    -gift_tokens.amount,
    'gift_tokens_sent',
    'gift_transfer',
    v_transfer_id,
    v_recipient.id,
    jsonb_build_object(
      'recipientAccountId', v_recipient.id,
      'recipientName', coalesce(v_recipient.display_name, v_recipient.external_subject, v_recipient.id::text),
      'amountSent', gift_tokens.amount,
      'message', nullif(btrim(gift_tokens.message), '')
    ),
    null
  );

  perform app_private.create_token_movement(
    v_recipient.id,
    gift_tokens.amount,
    'gift_tokens_received',
    'gift_transfer',
    v_transfer_id,
    v_sender_account_id,
    jsonb_build_object(
      'senderAccountId', v_sender_account_id,
      'senderName', v_sender_name,
      'amountReceived', gift_tokens.amount,
      'message', nullif(btrim(gift_tokens.message), '')
    ),
    null
  );

  perform app_private.create_account_notification(
    v_recipient.id,
    'gift_tokens_received',
    jsonb_build_object(
      'senderAccountId', v_sender_account_id,
      'senderName', v_sender_name,
      'amountReceived', gift_tokens.amount,
      'message', nullif(btrim(gift_tokens.message), ''),
      'url', '/contribution'
    )
  );

  return v_sender_movement;
end;
$$;

comment on function app_public.gift_tokens(uuid, integer, text) is '@name giftTokens';
