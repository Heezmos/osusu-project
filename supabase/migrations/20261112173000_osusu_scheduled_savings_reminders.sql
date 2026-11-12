alter table osusu.savings_accounts
  add column if not exists last_reminder_sent_for timestamptz;

create or replace function public.osusu_enqueue_due_savings_reminders()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_count integer := 0;
begin
  with due as materialized (
    select sa.id
    from osusu.savings_accounts sa
    join osusu.savings_products sp on sp.id=sa.product_id and sp.funding_enabled=true
    join osusu.customer_profiles cp on cp.user_id=sa.user_id
      and cp.account_status='active' and cp.kyc_status='verified'
    where sa.status='active'
      and sa.reminder_enabled=true
      and sa.auto_contribute=false
      and sa.next_contribution_at is not null
      and sa.next_contribution_at <= now() + interval '24 hours'
      and sa.last_reminder_sent_for is distinct from sa.next_contribution_at
    order by sa.next_contribution_at,sa.id
    for update of sa skip locked
    limit 200
  ),
  updated as (
    update osusu.savings_accounts sa
    set last_reminder_sent_for=sa.next_contribution_at
    from due
    where sa.id=due.id
    returning sa.user_id,sa.name,sa.currency,sa.scheduled_amount,sa.next_contribution_at
  ),
  inserted as (
    insert into osusu.notifications(user_id,notification_type,title,message)
    select
      u.user_id,
      'savings_contribution_reminder',
      'Savings contribution reminder',
      case
        when u.next_contribution_at <= now() then
          'Your planned contribution of ' ||
          case when u.currency='SLE' then 'Le ' else '$' end ||
          coalesce(u.scheduled_amount::text,'your planned amount') ||
          ' to ' || u.name || ' was scheduled for ' ||
          to_char(u.next_contribution_at at time zone 'UTC','DD Mon YYYY') ||
          '. No automatic debit has been made.'
        else
          'Your planned contribution of ' ||
          case when u.currency='SLE' then 'Le ' else '$' end ||
          coalesce(u.scheduled_amount::text,'your planned amount') ||
          ' to ' || u.name || ' is coming up on ' ||
          to_char(u.next_contribution_at at time zone 'UTC','DD Mon YYYY') ||
          '. No automatic debit will be made.'
      end
    from updated u
    returning id
  )
  select count(*)::integer into v_count from inserted;

  return jsonb_build_object('queued',v_count,'channel','in_app');
end;
$function$;

revoke all on function public.osusu_enqueue_due_savings_reminders() from public;
revoke all on function public.osusu_enqueue_due_savings_reminders() from anon;
revoke all on function public.osusu_enqueue_due_savings_reminders() from authenticated;
grant execute on function public.osusu_enqueue_due_savings_reminders() to service_role;