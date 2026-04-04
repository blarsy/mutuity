insert into app_public.need_claim (need_id, claimer_account_id, message, status)
values ($1, $2, $3, $4::app_public.need_claim_status)
returning id, need_id, claimer_account_id, message, status;
