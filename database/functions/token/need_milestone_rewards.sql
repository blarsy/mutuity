create or replace function app_private.issue_need_milestone_rewards()
returns trigger
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_previous_image_count integer;
  v_current_image_count integer := coalesce(array_length(coalesce(new.image_urls, array[]::text[]), 1), 0);
  v_previous_proposed_topes_amount integer;
  v_current_proposed_topes_amount integer := new.proposed_topes_amount;
begin
  if tg_op = 'INSERT' then
    v_previous_image_count := 0;
    v_previous_proposed_topes_amount := null;
  else
    v_previous_image_count := coalesce(array_length(coalesce(old.image_urls, array[]::text[]), 1), 0);
    v_previous_proposed_topes_amount := old.proposed_topes_amount;
  end if;

  if v_previous_image_count = 0 and v_current_image_count > 0 then
    perform app_private.create_token_movement(
      new.creator_account_id,
      10,
      'need_first_image_reward',
      'need',
      new.id,
      null,
      jsonb_build_object(
        'needId', new.id,
        'needTitle', new.title,
        'rewardAmount', 10,
        'rewardType', 'need_image_milestone'
      ),
      format('need:%s:first-image', new.id)
    );
  end if;

  if v_previous_proposed_topes_amount is null and v_current_proposed_topes_amount is not null then
    perform app_private.create_token_movement(
      new.creator_account_id,
      10,
      'need_first_default_token_amount_reward',
      'need',
      new.id,
      null,
      jsonb_build_object(
        'needId', new.id,
        'needTitle', new.title,
        'proposedTopesAmount', new.proposed_topes_amount,
        'rewardAmount', 10,
        'rewardType', 'need_default_token_amount_milestone'
      ),
      format('need:%s:first-default-token-amount', new.id)
    );
  end if;

  return new;
end;
$$;