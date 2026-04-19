begin;

comment on table app_public.need is
  E'@omit create\nNeed published by authenticated accounts with optional campaign link and moderation-aware constraints.';

commit;
