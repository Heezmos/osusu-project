-- Customer-safe Osusu account bootstrap and read boundary.
-- Applied to the live DVL Projects Supabase database.
-- This file records the live SQL for source control; it is not a Supabase CLI migration.
-- The browser may execute these two RPCs as an authenticated user only.
-- Neither function accepts a user ID: ownership always comes from auth.uid().

create or replace function public.osusu_initialize_my_account()
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_display_name text;
  v_email text;
  v_wallet_id uuid;
  v_currency text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select u.email,
         coalesce(nullif(trim(u.raw_user_meta_data->>'display_name'), ''), split_part(u.email, '@', 1))
    into v_email, v_display_name
  from auth.users u
  where u.id = v_user_id;

  insert into osusu.customer_profiles(user_id, display_name, country_code, kyc_status, account_status)
  values (v_user_id, v_display_name, 'SL', 'not_started', 'pending')
  on conflict (user_id) do update
    set display_name = coalesce(osusu.customer_profiles.display_name, excluded.display_name),
        updated_at = now();

  foreach v_currency in array array['SLE','USD'] loop
    insert into osusu.wallets(user_id, currency, status)
    values (v_user_id, v_currency, 'pending')
    on conflict (user_id, currency) do update set currency = excluded.currency
    returning id into v_wallet_id;

    insert into osusu.ledger_accounts(wallet_id, account_code, account_type, currency)
    values (v_wallet_id, 'WALLET-' || v_wallet_id::text, 'customer_wallet', v_currency)
    on conflict (account_code) do nothing;
  end loop;

  return jsonb_build_object('initialized', true);
end;
$function$;

create or replace function public.osusu_get_my_overview()
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_result jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select jsonb_build_object(
    'profile', (
      select jsonb_build_object(
        'display_name', cp.display_name,
        'country_code', cp.country_code,
        'kyc_status', cp.kyc_status,
        'account_status', cp.account_status
      )
      from osusu.customer_profiles cp
      where cp.user_id = v_user_id
    ),
    'wallets', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', w.id,
        'currency', w.currency,
        'status', w.status,
        'balance', coalesce((
          select sum(case when jl.direction = 'credit' then jl.amount else -jl.amount end)
          from osusu.ledger_accounts la
          join osusu.journal_lines jl on jl.ledger_account_id = la.id
          join osusu.journal_entries je on je.id = jl.journal_entry_id
          where la.wallet_id = w.id
            and je.status = 'posted'
        ), 0)
      ) order by w.currency)
      from osusu.wallets w
      where w.user_id = v_user_id
    ), '[]'::jsonb),
    'savings_goals', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', sa.id,
        'name', sa.name,
        'currency', sa.currency,
        'target_amount', sa.target_amount,
        'status', sa.status,
        'savings_type', sa.savings_type,
        'contribution_frequency', sa.contribution_frequency
      ) order by sa.created_at desc)
      from osusu.savings_accounts sa
      where sa.user_id = v_user_id
    ), '[]'::jsonb),
    'transactions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', wt.id,
        'transaction_type', wt.transaction_type,
        'direction', wt.direction,
        'amount', wt.amount,
        'currency', wt.currency,
        'status', wt.status,
        'description', wt.description,
        'created_at', wt.created_at
      ) order by wt.created_at desc)
      from (
        select wt.*
        from osusu.wallet_transactions wt
        join osusu.wallets w on w.id = wt.wallet_id
        where w.user_id = v_user_id
        order by wt.created_at desc
        limit 20
      ) wt
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$function$;

revoke all on function public.osusu_initialize_my_account() from public, anon;
revoke all on function public.osusu_get_my_overview() from public, anon;
grant execute on function public.osusu_initialize_my_account() to authenticated, service_role;
grant execute on function public.osusu_get_my_overview() to authenticated, service_role;
