begin;

-- Keep the shared validator aligned with the resource constraint fixed in 021.
-- Preserve the existing function signature and execution privileges.
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

  if p_intensity = 'leg_up' and not (p_topes between 1 and 99) then
    raise exception using message = 'Topes for leg_up must be between 1 and 99';
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

commit;