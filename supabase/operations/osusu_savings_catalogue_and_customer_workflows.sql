-- Osusu savings catalogue and customer plan setup.
-- Applied to the live DVL Projects Supabase database through the
-- osusu_savings_catalogue_and_customer_workflows migration.
-- Private savings tables remain inaccessible to browser roles. Customers
-- interact only through authenticated RPCs that derive ownership from auth.uid().
-- This source copy is retained for review; reconcile migration history before
-- attempting to replay it in another environment.

create table if not exists osusu.savings_products (
  id uuid primary key default gen_random_uuid(),
  plan_code text not null unique,
  display_name text not null,
  savings_type text not null check (savings_type in ('goal','scheduled','fixed_term','circle')),
  description text not null,
  currency_support text[] not null default array['SLE','USD']::text[],
  term_days integer check (term_days is null or term_days > 0),
  annual_rate numeric(9,6) check (annual_rate is null or annual_rate >= 0),
  rate_status text not null default 'not_applicable'
    check (rate_status in ('not_applicable','pending_approval','approved','suspended')),
  is_listed boolean not null default true,
  is_available boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table osusu.savings_products enable row level security;

insert into osusu.savings_products
  (plan_code, display_name, savings_type, description, rate_status, is_listed, is_available, sort_order)
values
  ('flexi-save','Flexi Save','goal','Save towards a personal goal with flexible contributions. No interest or return is currently attached.','not_applicable',true,true,10),
  ('goal-builder','Goal Builder','goal','Set a savings target and track progress towards a goal. Contributions are recorded only after an approved funding workflow exists.','not_applicable',true,true,20),
  ('scheduled-saver','Scheduled Saver','scheduled','Set a regular contribution amount and frequency. Automatic collection remains unavailable until an authorised payment rail is connected.','not_applicable',true,true,30),
  ('fixed-term-growth','Fixed-Term Growth','fixed_term','A fixed-term savings product. Rate, maturity terms and availability are pending legal and partner approval.','pending_approval',true,false,40),
  ('osusu-circle','Osusu Circle','circle','Save together with a group using agreed contribution schedules. Circle creation and collection controls are being prepared.','not_applicable',true,false,50)
on conflict (plan_code) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  rate_status = excluded.rate_status,
  is_listed = excluded.is_listed,
  is_available = excluded.is_available,
  sort_order = excluded.sort_order,
  updated_at = now();

alter table osusu.savings_accounts
  add column if not exists product_id uuid references osusu.savings_products(id),
  add column if not exists scheduled_amount numeric(20,2),
  add column if not exists auto_contribute boolean not null default false,
  add column if not exists next_contribution_at timestamptz;

alter table osusu.savings_accounts
  drop constraint if exists savings_accounts_scheduled_amount_check;
alter table osusu.savings_accounts
  add constraint savings_accounts_scheduled_amount_check
  check (scheduled_amount is null or scheduled_amount > 0);

create or replace function public.osusu_get_savings_products()
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
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', sp.id,
    'plan_code', sp.plan_code,
    'display_name', sp.display_name,
    'savings_type', sp.savings_type,
    'description', sp.description,
    'currency_support', sp.currency_support,
    'term_days', sp.term_days,
    'annual_rate', case when sp.rate_status = 'approved' then sp.annual_rate else null end,
    'rate_status', sp.rate_status,
    'is_available', sp.is_available
  ) order by sp.sort_order), '[]'::jsonb)
  into v_result
  from osusu.savings_products sp
  where sp.is_listed = true;
  return v_result;
end;
$function$;

create or replace function public.osusu_create_savings_plan(
  p_plan_code text,
  p_name text,
  p_target_amount numeric,
  p_currency text,
  p_contribution_frequency text,
  p_scheduled_amount numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_product osusu.savings_products%rowtype;
  v_wallet_id uuid;
  v_savings_id uuid;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_name is null or length(trim(p_name)) < 2 or length(trim(p_name)) > 80 then
    raise exception 'Enter a plan name between 2 and 80 characters';
  end if;
  if p_target_amount is null or p_target_amount <= 0 then
    raise exception 'Enter a savings target greater than zero';
  end if;
  if p_currency is null or p_currency not in ('SLE','USD') then raise exception 'Currency must be SLE or USD'; end if;
  if p_contribution_frequency is null or p_contribution_frequency not in ('daily','weekly','monthly','flexible') then
    raise exception 'Choose a valid contribution frequency';
  end if;
  if p_plan_code is null then raise exception 'Choose a savings plan'; end if;

  select * into v_product from osusu.savings_products
  where plan_code = p_plan_code and is_listed = true;
  if not found then raise exception 'Savings plan not found'; end if;
  if not v_product.is_available then raise exception 'This savings plan is not available yet'; end if;
  if v_product.savings_type not in ('goal','scheduled') then
    raise exception 'This savings plan cannot be opened through this workflow';
  end if;
  if not (p_currency = any(v_product.currency_support)) then
    raise exception 'This plan does not support the selected currency';
  end if;
  if v_product.savings_type = 'scheduled' and
     (p_scheduled_amount is null or p_scheduled_amount <= 0) then
    raise exception 'Enter a scheduled contribution amount greater than zero';
  end if;

  select id into v_wallet_id from osusu.wallets
  where user_id = v_user_id and currency = p_currency limit 1;
  if v_wallet_id is null then raise exception 'Your matching wallet is not available'; end if;

  insert into osusu.savings_accounts
    (user_id, wallet_id, product_id, savings_type, name, target_amount,
     currency, contribution_frequency, scheduled_amount, auto_contribute, status)
  values
    (v_user_id, v_wallet_id, v_product.id, v_product.savings_type, trim(p_name),
     p_target_amount, p_currency, p_contribution_frequency, p_scheduled_amount,
     false, 'active')
  returning id into v_savings_id;

  insert into osusu.audit_events(actor_user_id, action, entity_type, entity_id, metadata)
  values (v_user_id, 'savings_plan_created', 'savings_account', v_savings_id::text,
          jsonb_build_object('plan_code', p_plan_code, 'currency', p_currency));
  return jsonb_build_object('id', v_savings_id, 'created', true);
end;
$function$;

create or replace function public.osusu_get_my_savings()
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_result jsonb;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', sa.id,
    'name', sa.name,
    'savings_type', sa.savings_type,
    'currency', sa.currency,
    'target_amount', sa.target_amount,
    'contribution_frequency', sa.contribution_frequency,
    'scheduled_amount', sa.scheduled_amount,
    'auto_contribute', sa.auto_contribute,
    'status', sa.status,
    'starts_at', sa.starts_at,
    'matures_at', sa.matures_at,
    'plan_code', sp.plan_code,
    'plan_name', sp.display_name,
    'total_contributed', coalesce((
      select sum(sc.amount) from osusu.savings_contributions sc
      where sc.savings_account_id = sa.id and sc.status = 'confirmed'
    ), 0),
    'contribution_count', (
      select count(*) from osusu.savings_contributions sc
      where sc.savings_account_id = sa.id and sc.status = 'confirmed'
    )
  ) order by sa.created_at desc), '[]'::jsonb)
  into v_result
  from osusu.savings_accounts sa
  left join osusu.savings_products sp on sp.id = sa.product_id
  where sa.user_id = v_user_id;
  return v_result;
end;
$function$;

revoke all on function public.osusu_get_savings_products() from public, anon;
revoke all on function public.osusu_create_savings_plan(text,text,numeric,text,text,numeric) from public, anon;
revoke all on function public.osusu_get_my_savings() from public, anon;
grant execute on function public.osusu_get_savings_products() to authenticated, service_role;
grant execute on function public.osusu_create_savings_plan(text,text,numeric,text,text,numeric) to authenticated, service_role;
grant execute on function public.osusu_get_my_savings() to authenticated, service_role;
