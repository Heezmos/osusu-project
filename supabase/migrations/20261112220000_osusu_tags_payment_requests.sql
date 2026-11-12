-- OsusuTag identity and customer-to-customer payment requests.
-- Requests are coordination records only: no wallet debit, credit, transfer or settlement occurs.

alter table osusu.customer_profiles
  add column if not exists osusu_tag text;

alter table osusu.customer_profiles
  add constraint customer_profiles_osusu_tag_format
  check (osusu_tag is null or osusu_tag ~ '^[a-z0-9][a-z0-9_]{2,19}$');

create unique index if not exists customer_profiles_osusu_tag_unique
  on osusu.customer_profiles (lower(osusu_tag))
  where osusu_tag is not null;

create table if not exists osusu.payment_requests (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid not null references auth.users(id) on delete cascade,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(20,2) not null check (amount > 0),
  currency text not null check (currency in ('SLE','USD')),
  note text,
  status text not null default 'pending'
    check (status in ('pending','accepted','declined','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint payment_requests_not_self check (requester_user_id <> recipient_user_id),
  constraint payment_requests_note_length check (note is null or char_length(note) <= 240)
);

create index if not exists payment_requests_requester_created_idx
  on osusu.payment_requests (requester_user_id, created_at desc);
create index if not exists payment_requests_recipient_created_idx
  on osusu.payment_requests (recipient_user_id, created_at desc);

revoke all on osusu.payment_requests from public, anon, authenticated;
grant all on osusu.payment_requests to service_role;

create or replace function public.osusu_set_my_tag(p_tag text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_tag text := lower(trim(coalesce(p_tag,'')));
  v_name text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if v_tag !~ '^[a-z0-9][a-z0-9_]{2,19}$' then
    raise exception 'OsusuTag must be 3–20 characters using letters, numbers or underscores';
  end if;
  if v_tag = any(array['admin','support','osusu','help','payments','wallet','security','official','team','staff','null','undefined']) then
    raise exception 'This OsusuTag is reserved';
  end if;

  update osusu.customer_profiles
     set osusu_tag = v_tag, updated_at = now()
   where user_id = v_user_id
   returning display_name into v_name;

  if not found then raise exception 'Osusu account profile not found'; end if;
  return jsonb_build_object('osusu_tag',v_tag,'display_name',v_name);
exception
  when unique_violation then
    raise exception 'This OsusuTag is already taken';
end;
$function$;

create or replace function public.osusu_get_my_tag()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_result jsonb;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select jsonb_build_object('osusu_tag',p.osusu_tag,'display_name',p.display_name)
    into v_result
    from osusu.customer_profiles p
   where p.user_id = v_user_id;
  return coalesce(v_result,'{}'::jsonb);
end;
$function$;

create or replace function public.osusu_lookup_recipient(p_tag text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_result jsonb;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select jsonb_build_object('found',true,'osusu_tag',p.osusu_tag,'display_name',coalesce(p.display_name,'Osusu member'))
    into v_result
    from osusu.customer_profiles p
   where lower(p.osusu_tag) = lower(trim(coalesce(p_tag,'')))
     and p.user_id <> v_user_id;
  return coalesce(v_result,jsonb_build_object('found',false));
end;
$function$;

create or replace function public.osusu_create_payment_request(
  p_recipient_tag text,
  p_amount numeric,
  p_currency text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_recipient_id uuid;
  v_requester_name text;
  v_request_id uuid;
  v_tag text := lower(trim(coalesce(p_recipient_tag,'')));
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_amount is null or p_amount <= 0 or p_amount > 100000000 then raise exception 'Enter a valid request amount'; end if;
  if p_currency not in ('SLE','USD') then raise exception 'Unsupported currency'; end if;
  if p_note is not null and char_length(trim(p_note)) > 240 then raise exception 'Request note must be 240 characters or fewer'; end if;

  select p.user_id into v_recipient_id
    from osusu.customer_profiles p
   where lower(p.osusu_tag) = v_tag
     and p.user_id <> v_user_id;
  if v_recipient_id is null then raise exception 'No other Osusu account was found for that OsusuTag'; end if;

  select display_name into v_requester_name
    from osusu.customer_profiles where user_id = v_user_id;

  insert into osusu.payment_requests(requester_user_id,recipient_user_id,amount,currency,note)
  values(v_user_id,v_recipient_id,p_amount,p_currency,nullif(trim(p_note),''))
  returning id into v_request_id;

  insert into osusu.notifications(user_id,notification_type,title,message)
  values(v_recipient_id,'payment_request','New payment request',
    coalesce(v_requester_name,'An Osusu member') || ' requested ' ||
    case when p_currency='SLE' then 'Le ' else '$' end ||
    to_char(p_amount,'FM999,999,999,990.00') || '. Open Payments in Osusu to review.');

  return jsonb_build_object('id',v_request_id,'status','pending','message','Payment request sent. No money has moved.');
end;
$function$;

create or replace function public.osusu_get_my_payment_requests()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_requests jsonb;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id',r.id,
      'direction',case when r.requester_user_id=v_user_id then 'outgoing' else 'incoming' end,
      'other_party_name',coalesce(other_profile.display_name,'Osusu member'),
      'other_party_tag',other_profile.osusu_tag,
      'amount',r.amount,
      'currency',r.currency,
      'note',r.note,
      'status',r.status,
      'created_at',r.created_at,
      'responded_at',r.responded_at
    ) order by r.created_at desc
  ),'[]'::jsonb)
  into v_requests
  from osusu.payment_requests r
  join osusu.customer_profiles other_profile
    on other_profile.user_id = case when r.requester_user_id=v_user_id then r.recipient_user_id else r.requester_user_id end
  where r.requester_user_id=v_user_id or r.recipient_user_id=v_user_id;
  return v_requests;
end;
$function$;

create or replace function public.osusu_respond_to_payment_request(p_request_id uuid,p_response text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_request osusu.payment_requests%rowtype;
  v_name text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_response not in ('accepted','declined') then raise exception 'Unsupported response'; end if;

  select * into v_request
    from osusu.payment_requests
   where id=p_request_id and recipient_user_id=v_user_id
   for update;
  if not found then raise exception 'Payment request not found'; end if;
  if v_request.status <> 'pending' then raise exception 'This payment request is no longer pending'; end if;

  update osusu.payment_requests
     set status=p_response,responded_at=now(),updated_at=now()
   where id=p_request_id;

  select display_name into v_name from osusu.customer_profiles where user_id=v_user_id;
  insert into osusu.notifications(user_id,notification_type,title,message)
  values(v_request.requester_user_id,'payment_request_update','Payment request '||p_response,
    coalesce(v_name,'An Osusu member') || ' ' || p_response || ' your payment request. This is not a payment or settlement.');

  return jsonb_build_object('id',p_request_id,'status',p_response,'message','Request updated. No money has moved.');
end;
$function$;

create or replace function public.osusu_cancel_payment_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  update osusu.payment_requests
     set status='cancelled',updated_at=now(),responded_at=now()
   where id=p_request_id and requester_user_id=v_user_id and status='pending';
  if not found then raise exception 'Pending payment request not found'; end if;
  return jsonb_build_object('id',p_request_id,'status','cancelled');
end;
$function$;

revoke all on function public.osusu_set_my_tag(text) from public,anon;
revoke all on function public.osusu_get_my_tag() from public,anon;
revoke all on function public.osusu_lookup_recipient(text) from public,anon;
revoke all on function public.osusu_create_payment_request(text,numeric,text,text) from public,anon;
revoke all on function public.osusu_get_my_payment_requests() from public,anon;
revoke all on function public.osusu_respond_to_payment_request(uuid,text) from public,anon;
revoke all on function public.osusu_cancel_payment_request(uuid) from public,anon;

grant execute on function public.osusu_set_my_tag(text) to authenticated,service_role;
grant execute on function public.osusu_get_my_tag() to authenticated,service_role;
grant execute on function public.osusu_lookup_recipient(text) to authenticated,service_role;
grant execute on function public.osusu_create_payment_request(text,numeric,text,text) to authenticated,service_role;
grant execute on function public.osusu_get_my_payment_requests() to authenticated,service_role;
grant execute on function public.osusu_respond_to_payment_request(uuid,text) to authenticated,service_role;
grant execute on function public.osusu_cancel_payment_request(uuid) to authenticated,service_role;
