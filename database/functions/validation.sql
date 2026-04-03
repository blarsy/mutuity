create schema if not exists app_private;

create or replace function app_private.validate_campaign_dates(
  p_start_at timestamptz,
  p_airdrop_at timestamptz,
  p_end_at timestamptz
)
returns void
language plpgsql
as $$
begin
  if p_start_at >= p_end_at then
    raise exception using message = 'Campaign start_at must be before end_at';
  end if;

  if p_airdrop_at < p_start_at or p_airdrop_at > p_end_at then
    raise exception using message = 'Campaign airdrop_at must be between start_at and end_at';
  end if;
end;
$$;

create or replace function app_private.validate_topes_amount(
  p_intensity text,
  p_topes integer
)
returns void
language plpgsql
as $$
begin
  if p_topes is null then
    return;
  end if;

  if p_topes <= 0 then
    raise exception using message = 'Topes amount must be greater than zero';
  end if;

  if p_intensity = 'leg_up' and not (p_topes between 10 and 99) then
    raise exception using message = 'Topes for leg_up must be between 10 and 99';
  end if;

  if p_intensity = 'sharing' and not (p_topes between 100 and 999) then
    raise exception using message = 'Topes for sharing must be between 100 and 999';
  end if;

  if p_intensity = 'commitment' and not (p_topes between 1000 and 4999) then
    raise exception using message = 'Topes for commitment must be between 1000 and 4999';
  end if;

  if p_intensity = 'rare_contribution' and p_topes < 5000 then
    raise exception using message = 'Topes for rare_contribution must be at least 5000';
  end if;
end;
$$;

create or replace function app_private.validate_people_count(
  p_multiple_people_required boolean,
  p_required_people_count integer
)
returns void
language plpgsql
as $$
begin
  if p_multiple_people_required and coalesce(p_required_people_count, 0) < 2 then
    raise exception using message = 'required_people_count must be at least 2 when multiple_people_required is true';
  end if;

  if not p_multiple_people_required and p_required_people_count is not null and p_required_people_count < 1 then
    raise exception using message = 'required_people_count must be positive';
  end if;
end;
$$;
