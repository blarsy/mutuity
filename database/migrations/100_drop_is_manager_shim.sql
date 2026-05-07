-- Remove deprecated manager compatibility shim.
--
-- Preconditions:
-- - Historical migrations may still contain references; they are not executed
--   after this point.
--
-- This migration rewrites currently-installed policy predicates from
-- app_private.is_manager() to app_private.is_admin(), then drops the shim.

do $$
declare
	v_policy record;
	v_for_clause text;
	v_to_clause text;
	v_roles text;
	v_create_sql text;
	v_rewritten integer := 0;
begin
	for v_policy in
		select
			n.nspname as schema_name,
			c.relname as table_name,
			p.polname as policy_name,
			p.polcmd,
			p.polpermissive,
			p.polroles,
			pg_get_expr(p.polqual, p.polrelid) as using_expr,
			pg_get_expr(p.polwithcheck, p.polrelid) as with_check_expr
		from pg_policy p
		join pg_class c on c.oid = p.polrelid
		join pg_namespace n on n.oid = c.relnamespace
		where n.nspname in ('app_public', 'audit')
			and (
				coalesce(pg_get_expr(p.polqual, p.polrelid), '') like '%app_private.is_manager()%'
				or coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '') like '%app_private.is_manager()%'
			)
	loop
		v_for_clause := case v_policy.polcmd
			when 'r' then 'select'
			when 'a' then 'insert'
			when 'w' then 'update'
			when 'd' then 'delete'
			when '*' then 'all'
			else 'all'
		end;

		if cardinality(v_policy.polroles) = 1 and v_policy.polroles[1] = 0 then
			v_to_clause := ' to public';
		else
			select string_agg(quote_ident(r.rolname), ', ' order by r.rolname)
			into v_roles
			from pg_roles r
			where r.oid = any (v_policy.polroles);

			if v_roles is null then
				v_to_clause := '';
			else
				v_to_clause := ' to ' || v_roles;
			end if;
		end if;

		execute format(
			'drop policy %I on %I.%I',
			v_policy.policy_name,
			v_policy.schema_name,
			v_policy.table_name
		);

		v_create_sql := format(
			'create policy %I on %I.%I as %s for %s%s',
			v_policy.policy_name,
			v_policy.schema_name,
			v_policy.table_name,
			case when v_policy.polpermissive then 'permissive' else 'restrictive' end,
			v_for_clause,
			v_to_clause
		);

		if v_policy.using_expr is not null then
			v_create_sql := v_create_sql || ' using (' || replace(v_policy.using_expr, 'app_private.is_manager()', 'app_private.is_admin()') || ')';
		end if;

		if v_policy.with_check_expr is not null then
			v_create_sql := v_create_sql || ' with check (' || replace(v_policy.with_check_expr, 'app_private.is_manager()', 'app_private.is_admin()') || ')';
		end if;

		execute v_create_sql;
		v_rewritten := v_rewritten + 1;
	end loop;

	raise notice 'Rewrote % policy definitions from is_manager() to is_admin()', v_rewritten;
end;
$$;

drop function if exists app_private.is_manager();
