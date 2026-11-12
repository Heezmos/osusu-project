-- Bound payment-request volume to prevent authenticated users from flooding another member's inbox.
-- Per requester: max 20 requests in any rolling 24-hour window.
-- Per requester/recipient pair: max 5 requests in 24 hours and max 3 simultaneously pending.
-- A transaction-scoped advisory lock serializes a requester's count-and-insert path.

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
  v_recent_user_count integer;
  v_recent_pair_count integer;
  v_pending_pair_count integer;
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

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('osusu-payment-request:' || v_user_id::text, 0)
  );

  select count(*)::integer into v_recent_user_count
    from osusu.payment_requests
   where requester_user_id = v_user_id
     and created_at >= now() - interval '24 hours';
  if v_recent_user_count >= 20 then
    raise exception 'You have reached the daily payment-request limit. Please try again later.';
  end if;

  select count(*)::integer into v_recent_pair_count
    from osusu.payment_requests
   where requester_user_id = v_user_id
     and recipient_user_id = v_recipient_id
     and created_at >= now() - interval '24 hours';
  if v_recent_pair_count >= 5 then
    raise exception 'You have reached the 24-hour request limit for this recipient.';
  end if;

  select count(*)::integer into v_pending_pair_count
    from osusu.payment_requests
   where requester_user_id = v_user_id
     and recipient_user_id = v_recipient_id
     and status = 'pending';
  if v_pending_pair_count >= 3 then
    raise exception 'You already have the maximum number of pending requests for this recipient.';
  end if;

  select display_name into v_requester_name
    from osusu.customer_profiles where user_id = v_user_id;

  insert into osusu.payment_requests(requester_user_id,recipient_user_id,amount,currency,note)
  values(v_user_id,v_recipient_id,p_amount,p_currency,nullif(trim(p_note),'' ))
  returning id into v_request_id;

  insert into osusu.notifications(user_id,notification_type,title,message)
  values(v_recipient_id,'payment_request','New payment request',
    coalesce(v_requester_name,'An Osusu member') || ' requested ' ||
    case when p_currency='SLE' then 'Le ' else '$' end ||
    to_char(p_amount,'FM999,999,999,990.00') || '. Open Payments in Osusu to review.');

  return jsonb_build_object('id',v_request_id,'status','pending','message','Payment request sent. No money has moved.');
end;
$function$;

revoke all on function public.osusu_create_payment_request(text,numeric,text,text) from public,anon;
grant execute on function public.osusu_create_payment_request(text,numeric,text,text) to authenticated,service_role;
