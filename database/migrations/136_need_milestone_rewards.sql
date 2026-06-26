begin;

\ir ../functions/token/need_milestone_rewards.sql

drop trigger if exists trg_need_milestone_rewards on app_public.need;
create trigger trg_need_milestone_rewards
  after insert or update on app_public.need
  for each row
  execute function app_private.issue_need_milestone_rewards();

commit;