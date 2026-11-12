create or replace function public.osusu_get_my_savings_activity(
  p_savings_account_id uuid default null,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_movement_type text default null,
  p_limit integer default 25,
  p_offset integer default 0,
  p_search text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_limit integer := coalesce(p_limit, 25);
  v_offset integer := coalesce(p_offset, 0);
  v_search text := nullif(pg_catalog.btrim(coalesce(p_search, '')), '');
  v_result jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if v_limit < 1 or v_limit > 100 then
    raise exception 'Limit must be between 1 and 100' using errcode = '22023';
  end if;
  if v_offset < 0 or v_offset > 100000 then
    raise exception 'Offset is outside the supported range' using errcode = '22023';
  end if;
  if p_from is not null and p_to is not null and p_from >= p_to then
    raise exception 'Start date must be earlier than end date' using errcode = '22023';
  end if;
  if p_movement_type is not null and p_movement_type not in ('contribution','withdrawal') then
    raise exception 'Unsupported savings activity type' using errcode = '22023';
  end if;
  if v_search is not null and pg_catalog.length(v_search) > 100 then
    raise exception 'Search text must be 100 characters or fewer' using errcode = '22023';
  end if;

  with filtered as materialized (
    select
      st.id,
      st.savings_account_id,
      sa.name as plan_name,
      st.movement_type,
      st.amount,
      st.currency,
      st.status,
      st.description,
      st.journal_entry_id,
      st.created_at
    from osusu.savings_transactions st
    join osusu.savings_accounts sa
      on sa.id = st.savings_account_id
     and sa.user_id = v_user_id
    where st.user_id = v_user_id
      and (p_savings_account_id is null or st.savings_account_id = p_savings_account_id)
      and (p_from is null or st.created_at >= p_from)
      and (p_to is null or st.created_at < p_to)
      and (p_movement_type is null or st.movement_type = p_movement_type)
      and (
        v_search is null
        or pg_catalog.strpos(pg_catalog.lower(coalesce(st.description, '')), pg_catalog.lower(v_search)) > 0
        or pg_catalog.strpos(pg_catalog.lower(st.movement_type), pg_catalog.lower(v_search)) > 0
        or pg_catalog.strpos(pg_catalog.lower(st.status), pg_catalog.lower(v_search)) > 0
        or pg_catalog.strpos(pg_catalog.lower(st.currency::text), pg_catalog.lower(v_search)) > 0
        or pg_catalog.strpos(st.amount::text, v_search) > 0
        or pg_catalog.strpos(pg_catalog.lower(sa.name), pg_catalog.lower(v_search)) > 0
      )
  ),
  page as (
    select *
    from filtered
    order by created_at desc, id desc
    limit v_limit offset v_offset
  )
  select pg_catalog.jsonb_build_object(
    'transactions',
    coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'id', p.id,
          'savings_account_id', p.savings_account_id,
          'plan_name', p.plan_name,
          'movement_type', p.movement_type,
          'amount', p.amount,
          'currency', p.currency,
          'status', p.status,
          'description', p.description,
          'journal_entry_id', p.journal_entry_id,
          'created_at', p.created_at
        ) order by p.created_at desc, p.id desc
      )
      from page p
    ), '[]'::jsonb),
    'total_count', (select count(*) from filtered),
    'limit', v_limit,
    'offset', v_offset
  ) into v_result;

  return v_result;
end;
$function$;

revoke all on function public.osusu_get_my_savings_activity(uuid,timestamptz,timestamptz,text,integer,integer,text) from public;
revoke all on function public.osusu_get_my_savings_activity(uuid,timestamptz,timestamptz,text,integer,integer,text) from anon;
grant execute on function public.osusu_get_my_savings_activity(uuid,timestamptz,timestamptz,text,integer,integer,text) to authenticated;
grant execute on function public.osusu_get_my_savings_activity(uuid,timestamptz,timestamptz,text,integer,integer,text) to service_role;
