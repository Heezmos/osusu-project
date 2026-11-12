"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Bell, ChevronRight, CreditCard, Copy, Users,
  Eye, EyeOff, Home, Landmark, LockKeyhole, LogOut, PiggyBank, Search, ShieldCheck,
  Sparkles, TrendingUp, Wallet, X, LoaderCircle, Plus, CalendarDays, Clock3, CircleDollarSign
} from "lucide-react";

type WalletRow = { id:string; currency:"SLE"|"USD"; status:string; balance:number|string };
type Goal = { id:string; name:string; currency:"SLE"|"USD"; target_amount:number|string|null; status:string; savings_type:string; contribution_frequency:string|null };
type Tx = { id:string; transaction_type:string; direction:string; amount:number|string; currency:"SLE"|"USD"; status:string; description:string|null; created_at:string };
type Overview = { profile:{display_name:string|null;country_code:string;kyc_status:string;account_status:string}|null; wallets:WalletRow[]; savings_goals:Goal[]; transactions:Tx[] };
type SavingsProduct = { id:string; plan_code:string; display_name:string; savings_type:"goal"|"scheduled"|"fixed_term"|"circle"; description:string; currency_support:string[]; term_days:number|null; annual_rate:number|string|null; rate_status:string; is_available:boolean };
type SavingsCircleMember = {user_id:string;display_name:string;member_role:string;joined_at:string|null};
type SavingsCircle = {id:string;name:string;owner_user_id:string;currency:"SLE"|"USD";contribution_amount:number|string;frequency:string;status:string;max_members:number;invite_code:string|null;invitation_expires_at:string|null;is_owner:boolean;member_count:number;members:SavingsCircleMember[];created_at:string};
type OsusuNotification = { id:string; notification_type:string; title:string; message:string; read_at:string|null; created_at:string };
type TransactionHistoryResult = { transactions:Tx[]; total_count:number; limit:number; offset:number };
type SavingsHistoryItem = { id:string; savings_account_id:string; plan_name:string; movement_type:"contribution"|"withdrawal"; amount:number|string; currency:"SLE"|"USD"; status:string; description:string|null; journal_entry_id:string; created_at:string };
type SavingsHistoryResult = { transactions:SavingsHistoryItem[]; total_count:number; limit:number; offset:number };
type SavingsActivity = { id:string; movement_type:"contribution"|"withdrawal"; amount:number|string; currency:"SLE"|"USD"; status:string; description:string|null; created_at:string };
type SavingsPlan = { id:string; name:string; savings_type:string; currency:"SLE"|"USD"; target_amount:number|string|null; contribution_frequency:string|null; scheduled_amount:number|string|null; auto_contribute:boolean; status:string; starts_at:string; matures_at:string|null; plan_code:string|null; plan_name:string|null; funding_enabled:boolean; next_contribution_at:string|null; reminder_enabled:boolean; current_balance:number|string; total_contributed:number|string; contribution_count:number; withdrawal_count:number; recent_activity:SavingsActivity[] };

const formatMoney = (amount:number|string,currency:"SLE"|"USD") => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2}).format(Number(amount)).replace("$",currency==="SLE"?"Le ":"$");
const dateLabel = (value:string) => new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(value));
const goalProgress = (balance:number|string,target:number|string|null) => {
  const targetValue=Number(target);
  if(target===null||!Number.isFinite(targetValue)||targetValue<=0) return 0;
  return Math.min(100,Math.max(0,(Number(balance)/targetValue)*100));
};


export default function OsusuPage() {
  const [supabase,setSupabase] = useState<ReturnType<typeof createClient>|null>(null);
  const [session,setSession] = useState<Session|null>(null);
  const [overview,setOverview] = useState<Overview|null>(null);
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [message,setMessage] = useState("");
  const [mode,setMode] = useState<"login"|"signup">("login");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [displayName,setDisplayName] = useState("");
  const [hidden,setHidden] = useState(false);
  const [active,setActive] = useState("Overview");
  const [transactionSearch,setTransactionSearch] = useState("");
  const [historySearch,setHistorySearch] = useState("");
  const [historyStart,setHistoryStart] = useState("");
  const [historyEnd,setHistoryEnd] = useState("");
  const [historyPage,setHistoryPage] = useState(1);
  const [historyRows,setHistoryRows] = useState<Tx[]>([]);
  const [historyCount,setHistoryCount] = useState(0);
  const [historyLoading,setHistoryLoading] = useState(false);
  const [historyError,setHistoryError] = useState("");
  const [savingsHistorySearch,setSavingsHistorySearch] = useState("");
  const [savingsHistoryStart,setSavingsHistoryStart] = useState("");
  const [savingsHistoryEnd,setSavingsHistoryEnd] = useState("");
  const [savingsHistoryType,setSavingsHistoryType] = useState("");
  const [savingsHistoryPlan,setSavingsHistoryPlan] = useState("");
  const [savingsHistoryPage,setSavingsHistoryPage] = useState(1);
  const [savingsHistoryRows,setSavingsHistoryRows] = useState<SavingsHistoryItem[]>([]);
  const [savingsHistoryCount,setSavingsHistoryCount] = useState(0);
  const [savingsHistoryLoading,setSavingsHistoryLoading] = useState(false);
  const [savingsHistoryError,setSavingsHistoryError] = useState("");
  const [savingsProducts,setSavingsProducts] = useState<SavingsProduct[]>([]);
  const [mySavings,setMySavings] = useState<SavingsPlan[]>([]);
  const [notifications,setNotifications] = useState<OsusuNotification[]>([]);
  const [savingsCircles,setSavingsCircles] = useState<SavingsCircle[]>([]);
  const [circleName,setCircleName] = useState("");
  const [circleCurrency,setCircleCurrency] = useState<"SLE"|"USD">("SLE");
  const [circleAmount,setCircleAmount] = useState("");
  const [circleFrequency,setCircleFrequency] = useState("weekly");
  const [circleMaxMembers,setCircleMaxMembers] = useState("10");
  const [circleInviteCode,setCircleInviteCode] = useState("");
  const [circleBusy,setCircleBusy] = useState(false);
  const [showNotifications,setShowNotifications] = useState(false);
  const [showCreatePlan,setShowCreatePlan] = useState(false);
  const [savingBusy,setSavingBusy] = useState(false);
  const [selectedPlanCode,setSelectedPlanCode] = useState("flexi-save");
  const [planName,setPlanName] = useState("");
  const [targetAmount,setTargetAmount] = useState("");
  const [planCurrency,setPlanCurrency] = useState<"SLE"|"USD">("SLE");
  const [contributionFrequency,setContributionFrequency] = useState("flexible");
  const [scheduledAmount,setScheduledAmount] = useState("");
  const [movementAmounts,setMovementAmounts] = useState<Record<string,string>>({});
  const [movementBusy,setMovementBusy] = useState<string|null>(null);
  const [scheduleFrequency,setScheduleFrequency] = useState<Record<string,string>>({});
  const [scheduleAmounts,setScheduleAmounts] = useState<Record<string,string>>({});
  const [scheduleDates,setScheduleDates] = useState<Record<string,string>>({});
  const [scheduleReminders,setScheduleReminders] = useState<Record<string,boolean>>({});
  const [scheduleBusy,setScheduleBusy] = useState<string|null>(null);
  const [osusuTag,setOsusuTag] = useState("");
  const [tagInput,setTagInput] = useState("");
  const [tagBusy,setTagBusy] = useState(false);
  const [recipientTag,setRecipientTag] = useState("");
  const [recipient,setRecipient] = useState<{found:boolean;osusu_tag?:string;display_name?:string}|null>(null);
  const [requestAmount,setRequestAmount] = useState("");
  const [requestCurrency,setRequestCurrency] = useState<"SLE"|"USD">("SLE");
  const [requestNote,setRequestNote] = useState("");
  const [paymentRequests,setPaymentRequests] = useState<Array<{id:string;direction:"incoming"|"outgoing";other_party_name:string;other_party_tag:string|null;amount:number|string;currency:"SLE"|"USD";note:string|null;status:string;created_at:string}>>([]);
  const [paymentsBusy,setPaymentsBusy] = useState(false);

  const loadOverview = useCallback(async (client: ReturnType<typeof createClient>): Promise<Overview> => {
    const {error:initializeError} = await client.rpc("osusu_initialize_my_account");
    if (initializeError) throw initializeError;
    const [overviewResult,productsResult,savingsResult,notificationsResult,circlesResult] = await Promise.all([
      client.rpc("osusu_get_my_overview"),
      client.rpc("osusu_get_savings_products"),
      client.rpc("osusu_get_my_savings"),
      client.rpc("osusu_get_my_notifications"),
      client.rpc("osusu_get_my_savings_circles")
    ]);
    if (overviewResult.error) throw overviewResult.error;
    if (productsResult.error) throw productsResult.error;
    if (savingsResult.error) throw savingsResult.error;
    if (notificationsResult.error) throw notificationsResult.error;
    if (circlesResult.error) throw circlesResult.error;
    setSavingsProducts((productsResult.data??[]) as SavingsProduct[]);
    setMySavings((savingsResult.data??[]) as SavingsPlan[]);
    setNotifications((notificationsResult.data??[]) as OsusuNotification[]);
    setSavingsCircles((circlesResult.data??[]) as SavingsCircle[]);
    return overviewResult.data as Overview;
  },[]);

  useEffect(() => {
    try { setSupabase(createClient()); } catch(e) { setError(e instanceof Error?e.message:"Supabase is not configured."); setLoading(false); }
  },[]);

  useEffect(() => {
    if(!supabase)return;
    let alive=true;
    let sessionRevision=0;
    const fetchOverviewForRevision = async (revision:number) => {
      try {
        const result=await loadOverview(supabase);
        if(alive && revision===sessionRevision)setOverview(result);
      } catch(e) {
        if(alive && revision===sessionRevision)setError(e instanceof Error?e.message:"Unable to load your Osusu account.");
      } finally {
        if(alive && revision===sessionRevision)setLoading(false);
      }
    };
    supabase.auth.getSession().then((result: { data: { session: Session | null } }) => {
      if(!alive)return;
      const revision=++sessionRevision;
      const currentSession=result.data.session;
      setSession(currentSession);
      setOverview(null);
      if(currentSession)void fetchOverviewForRevision(revision);
      else setLoading(false);
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event: AuthChangeEvent, nextSession: Session | null)=>{
      const revision=++sessionRevision;
      setSession(nextSession);
      setOverview(null);
      setError("");
      if(!nextSession){setLoading(false);return;}
      setLoading(true);
      setTimeout(()=>{void fetchOverviewForRevision(revision);},0);
    });
    return ()=>{alive=false;sessionRevision++;subscription.unsubscribe();};
  },[loadOverview,supabase]);

  async function handleAuth(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();if(!supabase){setError("Supabase is not configured for this deployment.");return;}setBusy(true);setError("");setMessage("");
    try {
      if(mode==="signup") {
        const {data,error}=await supabase.auth.signUp({email,password,options:{data:{display_name:displayName.trim()}}});
        if(error)throw error;
        if(!data.session)setMessage("Account created. Check your email to confirm your address, then sign in.");
        else setMessage("Your Osusu account has been created.");
      } else {
        const {error}=await supabase.auth.signInWithPassword({email,password});
        if(error)throw error;
      }
    } catch(e) {setError(e instanceof Error?e.message:"Authentication failed.");}
    finally{setBusy(false);}
  }

  async function createSavingsPlan(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(!supabase)return;
    setSavingBusy(true);setError("");setMessage("");
    try {
      const {error:planError}=await supabase.rpc("osusu_create_savings_plan",{
        p_plan_code:selectedPlanCode,
        p_name:planName.trim(),
        p_target_amount:Number(targetAmount),
        p_currency:planCurrency,
        p_contribution_frequency:contributionFrequency,
        p_scheduled_amount:selectedPlanCode==="scheduled-saver"?Number(scheduledAmount):null
      });
      if(planError)throw planError;
      setOverview(await loadOverview(supabase));
      setPlanName("");setTargetAmount("");setScheduledAmount("");
      setShowCreatePlan(false);
      setMessage("Your savings plan has been created.");
    } catch(e) {
      setError(e instanceof Error?e.message:"Unable to create your savings plan.");
    } finally {setSavingBusy(false);}
  }

  async function moveSavingsFunds(plan:SavingsPlan,direction:"contribution"|"withdrawal") {
    if(!supabase)return;
    const amount=Number(movementAmounts[plan.id]??"");
    if(!Number.isFinite(amount)||amount<=0){setError("Enter an amount greater than zero.");return;}
    setMovementBusy(plan.id);setError("");setMessage("");
    try {
      const {error:movementError}=await supabase.rpc("osusu_move_savings_funds",{
        p_savings_account_id:plan.id,p_amount:amount,p_direction:direction,
        p_idempotency_key:crypto.randomUUID(),
        p_description:direction==="contribution"?"Customer savings contribution":"Customer savings withdrawal"
      });
      if(movementError)throw movementError;
      await loadOverview(supabase);
      setMovementAmounts(current=>({...current,[plan.id]:""}));
      setMessage(direction==="contribution"?"Savings contribution recorded.":"Savings withdrawal recorded.");
    } catch(e) {setError(e instanceof Error?e.message:"Unable to process this savings movement.");}
    finally {setMovementBusy(null);}
  }

  async function saveSavingsSchedule(plan:SavingsPlan) {
    if(!supabase)return;
    const frequency=scheduleFrequency[plan.id]??plan.contribution_frequency??"flexible";
    const amountText=scheduleAmounts[plan.id]??String(plan.scheduled_amount??"");
    const dateText=scheduleDates[plan.id]??(plan.next_contribution_at?new Date(plan.next_contribution_at).toISOString().slice(0,10):"");
    const reminder=scheduleReminders[plan.id]??plan.reminder_enabled;
    const nextDate=frequency==="flexible"?null:dateText?new Date(dateText+"T12:00:00").toISOString():null;
    setScheduleBusy(plan.id);setError("");setMessage("");
    try {
      const {error:scheduleError}=await supabase.rpc("osusu_update_savings_schedule",{
        p_savings_account_id:plan.id,
        p_frequency:frequency,
        p_scheduled_amount:frequency==="flexible"?null:Number(amountText),
        p_next_contribution_at:nextDate,
        p_reminder_enabled:reminder
      });
      if(scheduleError)throw scheduleError;
      await loadOverview(supabase);
      setMessage("Your savings schedule has been updated. Reminders are preferences only; no automatic debit is enabled.");
    } catch(e) {setError(e instanceof Error?e.message:"Unable to update this savings schedule.");}
    finally {setScheduleBusy(null);}
  }

  async function createSavingsCircle(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();if(!supabase)return;
    setCircleBusy(true);setError("");setMessage("");
    try {
      const {data,error:circleError}=await supabase.rpc("osusu_create_savings_circle",{
        p_name:circleName.trim(),p_currency:circleCurrency,p_contribution_amount:Number(circleAmount),
        p_frequency:circleFrequency,p_max_members:Number(circleMaxMembers)
      });
      if(circleError)throw circleError;
      await loadOverview(supabase);
      setCircleName("");setCircleAmount("");
      setMessage("Your Osusu Circle has been created as a draft. Share its invitation code with people you trust. Contributions are not enabled.");
    } catch(e) {setError(e instanceof Error?e.message:"Unable to create your Osusu Circle.");}
    finally {setCircleBusy(false);}
  }

  async function joinSavingsCircle(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();if(!supabase)return;
    setCircleBusy(true);setError("");setMessage("");
    try {
      const {error:joinError}=await supabase.rpc("osusu_join_savings_circle",{p_invite_code:circleInviteCode.trim()});
      if(joinError)throw joinError;
      await loadOverview(supabase);setCircleInviteCode("");
      setMessage("You have joined the Osusu Circle. Group contributions are not enabled yet.");
    } catch(e) {setError(e instanceof Error?e.message:"Unable to join this Osusu Circle.");}
    finally {setCircleBusy(false);}
  }

  async function leaveSavingsCircle(circle:SavingsCircle) {
    if(!supabase)return;
    setCircleBusy(true);setError("");setMessage("");
    try {
      const {error:leaveError}=await supabase.rpc("osusu_leave_savings_circle",{p_circle_id:circle.id});
      if(leaveError)throw leaveError;
      await loadOverview(supabase);setMessage("You have left the Osusu Circle.");
    } catch(e) {setError(e instanceof Error?e.message:"Unable to leave this Osusu Circle.");}
    finally {setCircleBusy(false);}
  }

  async function refreshPayments() {
    if(!supabase)return;
    setPaymentsBusy(true);
    try{
      const [tagResult,requestsResult]=await Promise.all([
        supabase.rpc("osusu_get_my_tag"),
        supabase.rpc("osusu_get_my_payment_requests")
      ]);
      if(tagResult.error)throw tagResult.error;
      if(requestsResult.error)throw requestsResult.error;
      const tagData=tagResult.data as {osusu_tag?:string|null};
      setOsusuTag(tagData.osusu_tag??"");
      setTagInput(tagData.osusu_tag??"");
      setPaymentRequests((requestsResult.data??[]) as typeof paymentRequests);
    }finally{setPaymentsBusy(false);}
  }

  useEffect(()=>{
    if(!supabase||!session||active!=="Payments")return;
    let cancelled=false;
    (async()=>{
      try{
        const [tagResult,requestsResult]=await Promise.all([
          supabase.rpc("osusu_get_my_tag"),
          supabase.rpc("osusu_get_my_payment_requests")
        ]);
        if(tagResult.error)throw tagResult.error;
        if(requestsResult.error)throw requestsResult.error;
        if(cancelled)return;
        const tagData=tagResult.data as {osusu_tag?:string|null};
        setOsusuTag(tagData.osusu_tag??"");
        setTagInput(tagData.osusu_tag??"");
        setPaymentRequests((requestsResult.data??[]) as typeof paymentRequests);
      }catch(e){if(!cancelled)setError(e instanceof Error?e.message:"Unable to load Osusu Payments.");}
      finally{if(!cancelled)setPaymentsBusy(false);}
    })();
    return ()=>{cancelled=true;};
  },[supabase,session?.user.id,active]);

  async function handleRefreshPayments(){
    setError("");
    try{await refreshPayments();}
    catch(e){setError(e instanceof Error?e.message:"Unable to refresh payment requests.");}
  }

  async function saveOsusuTag(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!supabase)return;
    setTagBusy(true);setError("");setMessage("");
    try{
      const {data,error:tagError}=await supabase.rpc("osusu_set_my_tag",{p_tag:tagInput.trim()});
      if(tagError)throw tagError;
      const result=data as {osusu_tag:string};
      setOsusuTag(result.osusu_tag);setTagInput(result.osusu_tag);
      setMessage("Your OsusuTag is ready to share.");
    }catch(e){setError(e instanceof Error?e.message:"Unable to save your OsusuTag.");}
    finally{setTagBusy(false);}
  }

  async function lookupOsusuRecipient(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!supabase)return;
    setRecipient(null);setError("");setMessage("");
    const {data,error:lookupError}=await supabase.rpc("osusu_lookup_recipient",{p_tag:recipientTag.trim().replace(/^@/,"")});
    if(lookupError){setError(lookupError.message);return;}
    setRecipient(data as {found:boolean;osusu_tag?:string;display_name?:string});
  }

  async function sendPaymentRequest(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!supabase||!recipient?.found)return;
    setPaymentsBusy(true);setError("");setMessage("");
    try{
      const {error:requestError}=await supabase.rpc("osusu_create_payment_request",{
        p_recipient_tag:recipient.osusu_tag,p_amount:Number(requestAmount),p_currency:requestCurrency,p_note:requestNote.trim()||null
      });
      if(requestError)throw requestError;
      setRequestAmount("");setRequestNote("");setRecipientTag("");setRecipient(null);
      await refreshPayments();
      setMessage("Payment request sent. No money has moved.");
    }catch(e){setError(e instanceof Error?e.message:"Unable to send payment request.");}
    finally{setPaymentsBusy(false);}
  }

  async function respondPaymentRequest(id:string,response:"accepted"|"declined"){
    if(!supabase)return;
    setPaymentsBusy(true);setError("");setMessage("");
    try{
      const {error:responseError}=await supabase.rpc("osusu_respond_to_payment_request",{p_request_id:id,p_response:response});
      if(responseError)throw responseError;
      await refreshPayments();
      setMessage(response==="accepted"?"Request accepted. This is not a payment; no money has moved.":"Payment request declined.");
    }catch(e){setError(e instanceof Error?e.message:"Unable to update payment request.");}
    finally{setPaymentsBusy(false);}
  }

  async function cancelPaymentRequest(id:string){
    if(!supabase)return;
    setPaymentsBusy(true);setError("");setMessage("");
    try{
      const {error:cancelError}=await supabase.rpc("osusu_cancel_payment_request",{p_request_id:id});
      if(cancelError)throw cancelError;
      await refreshPayments();setMessage("Payment request cancelled.");
    }catch(e){setError(e instanceof Error?e.message:"Unable to cancel payment request.");}
    finally{setPaymentsBusy(false);}
  }

  async function markNotificationRead(notificationId:string) {
    if(!supabase)return;
    const {error:readError}=await supabase.rpc("osusu_mark_notification_read",{p_notification_id:notificationId});
    if(readError){setError(readError.message);return;}
    setNotifications(current=>current.map(item=>item.id===notificationId?{...item,read_at:new Date().toISOString()}:item));
  }

  function exportTransactions() {
    if(!historyRows.length) return;
    const columns=["Transaction ID","Date","Description","Type","Direction","Status","Currency","Amount"];
    const safeText=(value:unknown)=>{
      const text=String(value??"");
      return /^\s*[=+\-@]/.test(text) ? "'" + text : text;
    };
    const escapeCsv=(value:unknown)=>`"${String(value??"").replaceAll('"','""')}"`;
    const rows=historyRows.map(tx=>[
      tx.id,tx.created_at,safeText(tx.description||tx.transaction_type.replaceAll("_"," ")),
      safeText(tx.transaction_type),safeText(tx.direction),safeText(tx.status),safeText(tx.currency),tx.amount
    ]);
    const csv=[columns,...rows].map(row=>row.map(escapeCsv).join(",")).join("\r\n");
    const blob=new Blob(["\uFEFF",csv],{type:"text/csv;charset=utf-8;"});
    const url=URL.createObjectURL(blob);
    const link=document.createElement("a");
    link.href=url;
    link.download=`osusu-transactions-page-${historyPage}-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  function exportSavingsActivity() {
    if(!savingsHistoryRows.length) return;
    const columns=["Activity ID","Date","Savings plan","Movement","Status","Currency","Amount","Journal reference"];
    const safeText=(value:unknown)=>{
      const text=String(value??"");
      return /^\s*[=+\-@]/.test(text) ? "'" + text : text;
    };
    const escapeCsv=(value:unknown)=>`"${String(value??"").replaceAll('"','""')}"`;
    const rows=savingsHistoryRows.map(item=>[
      item.id,item.created_at,safeText(item.plan_name),safeText(item.movement_type),
      safeText(item.status),safeText(item.currency),item.amount,item.journal_entry_id
    ]);
    const csv=[columns,...rows].map(row=>row.map(escapeCsv).join(",")).join("\r\n");
    const blob=new Blob(["\uFEFF",csv],{type:"text/csv;charset=utf-8;"});
    const url=URL.createObjectURL(blob);
    const link=document.createElement("a");
    link.href=url;
    link.download=`osusu-savings-activity-page-${savingsHistoryPage}-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  async function signOut() {
    if(!supabase)return;setBusy(true);const {error}=await supabase.auth.signOut();setBusy(false);
    if(error)setError(error.message);
  }

  useEffect(()=>{
    if(!supabase || !session || active!=="Performance") return;
    let cancelled=false;
    const loadHistory=async()=>{
      setHistoryLoading(true);
      setHistoryError("");
      const toExclusive=historyEnd
        ? new Date(new Date(`${historyEnd}T00:00:00.000Z`).getTime()+86400000).toISOString()
        : null;
      const {data,error}=await supabase.rpc("osusu_get_my_transactions",{
        p_from:historyStart?`${historyStart}T00:00:00+00:00`:null,
        p_to:toExclusive,
        p_limit:25,
        p_offset:(historyPage-1)*25,
        p_search:historySearch.trim()||null
      });
      if(cancelled)return;
      if(error){
        setHistoryError(error.message);
        setHistoryRows([]);
        setHistoryCount(0);
      }else{
        const result=data as TransactionHistoryResult;
        setHistoryRows(result.transactions??[]);
        setHistoryCount(Number(result.total_count)||0);
      }
      setHistoryLoading(false);
    };
    void loadHistory();
    return ()=>{cancelled=true;};
  },[supabase,session?.user.id,active,historyStart,historyEnd,historyPage,historySearch]);

  useEffect(()=>{
    if(!supabase || !session || active!=="Savings Account") return;
    let cancelled=false;
    const loadSavingsHistory=async()=>{
      setSavingsHistoryLoading(true);
      setSavingsHistoryError("");
      const toExclusive=savingsHistoryEnd
        ? new Date(new Date(`${savingsHistoryEnd}T00:00:00.000Z`).getTime()+86400000).toISOString()
        : null;
      const {data,error}=await supabase.rpc("osusu_get_my_savings_activity",{
        p_savings_account_id:savingsHistoryPlan||null,
        p_from:savingsHistoryStart?`${savingsHistoryStart}T00:00:00+00:00`:null,
        p_to:toExclusive,
        p_movement_type:savingsHistoryType||null,
        p_limit:25,
        p_offset:(savingsHistoryPage-1)*25,
        p_search:savingsHistorySearch.trim()||null
      });
      if(cancelled)return;
      if(error){
        setSavingsHistoryError(error.message);
        setSavingsHistoryRows([]);
        setSavingsHistoryCount(0);
      }else{
        const result=data as SavingsHistoryResult;
        setSavingsHistoryRows(result.transactions??[]);
        setSavingsHistoryCount(Number(result.total_count)||0);
      }
      setSavingsHistoryLoading(false);
    };
    void loadSavingsHistory();
    return ()=>{cancelled=true;};
  },[supabase,session?.user.id,active,savingsHistoryPlan,savingsHistoryStart,savingsHistoryEnd,savingsHistoryType,savingsHistoryPage,savingsHistorySearch]);

  const totals=useMemo(()=>{
    const byCurrency:{SLE:number;USD:number}={SLE:0,USD:0};
    overview?.wallets.forEach(w=>{byCurrency[w.currency]+=Number(w.balance)||0;});
    return byCurrency;
  },[overview]);

  if(loading) return <main className="auth-loading"><div className="brand"><span className="brand-symbol">o</span><span>osusu<small>BY DELIGHT VENTURES</small></span></div><LoaderCircle className="spin" size={25}/><p>Securely loading your Osusu space…</p></main>;

  if(!session) return <main className="auth-shell">
    <section className="auth-art"><div className="brand"><span className="brand-symbol">o</span><span>osusu<small>BY DELIGHT VENTURES</small></span></div><div className="auth-art-copy"><span className="overline">SAVE SMART. GROW TOGETHER.</span><h1>Small steps.<br/>Brighter futures.</h1><p>A clearer, calmer way to organise your money and work towards what matters.</p><div className="auth-art-note"><ShieldCheck size={18}/> Your account is protected by secure sign-in.</div></div><span className="auth-art-footer">OSUSU · SIERRA LEONE</span></section>
    <section className="auth-form-wrap"><div className="auth-form">
      <span className="overline">WELCOME TO OSUSU</span><h2>{mode==="login"?"Sign in to your account":"Create your account"}</h2><p>{mode==="login"?"Your savings space is waiting for you.":"Start with your personal Osusu account."}</p>
      <form onSubmit={handleAuth}>
        {mode==="signup"&&<label>Full name<input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your full name" required autoComplete="name"/></label>}
        <label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email"/></label>
        <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8} autoComplete={mode==="login"?"current-password":"new-password"}/></label>
        {mode==="login"&&<div className="auth-forgot"><a href="/forgot-password">Forgot password?</a></div>}
        {error&&<div className="auth-error">{error}</div>}{message&&<div className="auth-message">{message}</div>}
        <button className="auth-submit" disabled={busy}>{busy?<LoaderCircle className="spin" size={17}/>:null}{mode==="login"?"Sign in":"Create account"}</button>
      </form>
      <div className="auth-switch">{mode==="login"?"New to Osusu?":"Already have an account?"}<button onClick={()=>{setMode(mode==="login"?"signup":"login");setError("");setMessage("");}}>{mode==="login"?"Create an account":"Sign in"}</button></div>
      <div className="auth-legal"><LockKeyhole size={13}/> Secure authentication · Your financial data stays private</div>
    </div></section>
  </main>;

  const goals=overview?.savings_goals??[];
  const transactions=overview?.transactions??[];
  const filteredTransactions=transactions.filter(tx=>`${tx.description??""} ${tx.transaction_type} ${tx.status} ${tx.currency} ${tx.amount} ${tx.created_at}`.toLowerCase().includes(transactionSearch.trim().toLowerCase()));
  const selectedSavingsProduct=savingsProducts.find(product=>product.plan_code===selectedPlanCode);
  const formatPlanDate=(value:string)=>new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(value));
  const name=overview?.profile?.display_name||session.user.email?.split("@")[0]||"there";
  return <main className="osusu-app">
    <aside className="side-panel"><div className="brand"><span className="brand-symbol">o</span><span>osusu<small>BY DELIGHT VENTURES</small></span></div><p className="nav-caption">YOUR SPACE</p>
      <nav className="primary-navigation" aria-label="Main dashboard navigation">{[{label:"Overview",Icon:Home},{label:"Payments",Icon:ArrowLeftRight},{label:"Savings Account",Icon:PiggyBank},{label:"Total Cards",Icon:CreditCard},{label:"Performance",Icon:TrendingUp},{label:"Account & Security",Icon:ShieldCheck}].map(({label,Icon})=><button type="button" key={label} className={`side-link ${active===label?"selected":""}`} aria-current={active===label?"page":undefined} onClick={()=>setActive(label)}><Icon size={18}/>{label}{active===label&&<i aria-hidden="true"/>}</button>)}</nav>
      <div className="side-spacer"/><div className="side-help"><ShieldCheck size={19}/><div><b>Your money matters</b><span>Security is part of every step.</span></div></div><button className="side-link" onClick={signOut}><LogOut size={18}/>Sign out</button><div className="profile"><span className="avatar">{String(name).slice(0,2).toUpperCase()}</span><span><b>{name}</b><small>{session.user.email}</small></span></div>
    </aside>
    <section className="workspace"><header className="topbar"><div className="breadcrumb">My Osusu <ChevronRight size={14}/><b>{active}</b></div><div className="top-tools"><label className="search" aria-label="Search recent transactions"><Search size={16}/><input type="search" value={transactionSearch} onChange={event=>setTransactionSearch(event.target.value)} placeholder="Search transactions" aria-label="Search transactions"/></label><div className="notification-wrap"><button className="bell" type="button" aria-label="Open notifications" aria-expanded={showNotifications} onClick={()=>setShowNotifications(value=>!value)}><Bell size={19}/>{notifications.some(item=>!item.read_at)&&<i/>}</button>{showNotifications&&<section className="notification-panel"><div className="notification-heading"><b>Notifications</b><span>{notifications.filter(item=>!item.read_at).length} unread</span></div>{notifications.length?notifications.map(item=><article key={item.id} className={item.read_at?"notification-item":"notification-item unread"}><div><b>{item.title}</b><small>{dateLabel(item.created_at)}</small></div><p>{item.message}</p>{!item.read_at&&<button type="button" onClick={()=>void markNotificationRead(item.id)}>Mark as read</button>}</article>):<p className="notification-empty">You&apos;re all caught up. Important account and savings updates will appear here.</p>}</section>}</div><span className="avatar top-avatar">{String(name).slice(0,2).toUpperCase()}</span></div></header>
      <div className="page-content"><div className="welcome"><div><span className="overline">YOUR MONEY. YOUR FUTURE.</span><h1>Welcome back, {name.split(" ")[0]}</h1><p>{active==="Overview"?"Your Osusu account overview, securely connected.":active==="Payments"?"Find people and manage payment requests.":active==="Savings Account"?"Your savings plans and account details.":active==="Total Cards"?"Your Osusu Dash Card services and status.":"A view of your recorded wallet activity and balances."}</p></div><span className="date-pill"><span/> {overview?.profile?.account_status??"Status unavailable"}</span></div>
      {error&&<div className="notice"><ShieldCheck size={17}/><span>{error}</span><button onClick={()=>setError("")}><X size={16}/></button></div>}
      {active==="Payments"&&<>
        <div className="section-title page-section-heading"><div><h2>Osusu Payments</h2><p>Find people by their OsusuTag and send or manage payment requests.</p></div></div>
        <section className="payments-identity-card">
          <div><span className="overline">YOUR PAYMENT ID</span><h2>{osusuTag?"@"+osusuTag:"Claim your OsusuTag"}</h2><p>{osusuTag?"Share this identity so other Osusu members can find you.":"Choose a unique, memorable identity between 3 and 20 characters."}</p></div>
          <form onSubmit={saveOsusuTag}>
            <label>OsusuTag<input value={tagInput} onChange={e=>setTagInput(e.target.value.toLowerCase().replace(/^@/,""))} minLength={3} maxLength={20} pattern="[a-z0-9][a-z0-9_]{2,19}" placeholder="e.g. henrymos" required/></label>
            <button type="submit" disabled={tagBusy||!tagInput.trim()}>{tagBusy?"Saving…":osusuTag?"Update tag":"Claim tag"}</button>
          </form>
          {osusuTag&&<button type="button" className="tag-copy" onClick={()=>void navigator.clipboard.writeText("@"+osusuTag)}><Copy size={14}/> Copy @ {osusuTag}</button>}
        </section>
        <div className="payments-action-grid">
          <section className="payments-panel">
            <span className="overline">SEND A REQUEST</span><h3>Find an Osusu member</h3>
            <form onSubmit={lookupOsusuRecipient}>
              <label>Recipient OsusuTag<input value={recipientTag} onChange={e=>{setRecipientTag(e.target.value);setRecipient(null);}} placeholder="@theirtag" required/></label>
              <button type="submit" disabled={!recipientTag.trim()}>Find recipient</button>
            </form>
            {recipient&&<div className={recipient.found?"recipient-confirmed":"recipient-missing"}>{recipient.found?<><b><ShieldCheck size={16}/> Recipient found</b><strong>{recipient.display_name}</strong><small>@{recipient.osusu_tag}</small>
              <form onSubmit={sendPaymentRequest}>
                <label>Amount<input type="number" min="0.01" max="100000000" step="0.01" value={requestAmount} onChange={e=>setRequestAmount(e.target.value)} required/></label>
                <label>Currency<select value={requestCurrency} onChange={e=>setRequestCurrency(e.target.value as "SLE"|"USD")}><option value="SLE">SLE · Leone</option><option value="USD">USD · US Dollar</option></select></label>
                <label>Note (optional)<input value={requestNote} maxLength={240} onChange={e=>setRequestNote(e.target.value)} placeholder="What is this request for?"/></label>
                <button type="submit" disabled={paymentsBusy||Number(requestAmount)<=0}>Send payment request</button>
              </form>
            </>:<p>No other Osusu member was found with that tag. Check the spelling and try again.</p>}</div>}
          </section>
          <section className="payments-panel payments-safety"><ShieldCheck size={23}/><h3>Payment safety</h3><p>Always check the recipient's displayed name and OsusuTag before sending a request. Never share your password, PIN or verification code.</p><p><b>Important:</b> accepting a request is not a transfer. Osusu does not move money through this feature.</p></section>
        </div>
        <div className="section-title"><div><h2>Payment requests</h2><p>Incoming and outgoing requests linked to your Osusu account.</p></div><button type="button" onClick={()=>void handleRefreshPayments()} disabled={paymentsBusy}>Refresh</button></div>
        <section className="payment-request-list" aria-live="polite">
          {paymentsBusy?<p className="empty-state">Loading payment requests…</p>:paymentRequests.length?paymentRequests.map(request=><article className="payment-request-card" key={request.id}>
            <div className="payment-request-main"><span className="overline">{request.direction==="incoming"?"REQUEST RECEIVED":"REQUEST SENT"}</span><b>{request.direction==="incoming"?"From ":"To "}{request.other_party_name}</b><small>{request.other_party_tag?"@"+request.other_party_tag:"Osusu member"} · {dateLabel(request.created_at)}</small>{request.note&&<p>{request.note}</p>}</div>
            <div className="payment-request-amount"><b>{formatMoney(request.amount,request.currency)}</b><small>{request.status}</small></div>
            <div className="payment-request-actions">
              {request.direction==="incoming"&&request.status==="pending"&&<><button type="button" onClick={()=>void respondPaymentRequest(request.id,"accepted")} disabled={paymentsBusy}>Accept</button><button type="button" className="secondary" onClick={()=>void respondPaymentRequest(request.id,"declined")} disabled={paymentsBusy}>Decline</button></>}
              {request.direction==="outgoing"&&request.status==="pending"&&<button type="button" className="secondary" onClick={()=>void cancelPaymentRequest(request.id)} disabled={paymentsBusy}>Cancel request</button>}
              {request.status!=="pending"&&<span>{request.status==="accepted"?"Acknowledged · not paid":request.status}</span>}
            </div>
          </article>):<p className="empty-state">No payment requests yet. Find an Osusu member to send your first request.</p>}
        </section>
        <p className="data-note">Payment requests are coordination records only. Accepting a request does not debit a wallet or confirm that funds have been received.</p>
      </>}
      {active==="Account & Security"&&<>
        <div className="section-title page-section-heading"><div><h2>Account &amp; Security</h2><p>Review your sign-in identity and keep your Osusu account secure.</p></div></div>
        <section className="security-overview-card">
          <div className="security-overview-icon"><ShieldCheck size={23}/></div>
          <div><span className="overline">ACCOUNT PROTECTION</span><h2>Your account security</h2><p>Osusu uses secure authentication for account access. Keep your email address current and never share your password or verification links.</p></div>
        </section>
        <div className="section-title"><div><h2>Account details</h2><p>Information currently associated with your signed-in account.</p></div></div>
        <div className="security-details-grid">
          <article className="security-detail"><small>REGISTERED EMAIL</small><b>{session.user.email||"Not available"}</b><span>{session.user.email_confirmed_at?"Email confirmed":"Email confirmation pending"}</span></article>
          <article className="security-detail"><small>ACCOUNT CREATED</small><b>{session.user.created_at?dateLabel(session.user.created_at):"Not available"}</b><span>Osusu sign-up date</span></article>
          <article className="security-detail"><small>LAST SIGN-IN</small><b>{session.user.last_sign_in_at?dateLabel(session.user.last_sign_in_at):"Not available"}</b><span>Most recent authentication recorded by Supabase</span></article>
          <article className="security-detail"><small>ACCOUNT STATUS</small><b>{overview?.profile?.account_status??"Not available"}</b><span>Current account profile status</span></article>
        </div>
        <div className="section-title"><div><h2>Password &amp; sign-in</h2><p>Use the secure email recovery process if you need to change a forgotten password.</p></div></div>
        <section className="security-action-card"><div><b>Reset your password</b><p>We will send a password recovery link to your registered email address. Make sure Supabase has the production reset URL allowlisted before relying on this flow.</p></div><a className="security-reset-link" href="/forgot-password">Request password reset <ChevronRight size={15}/></a></section>
        <section className="security-note"><ShieldCheck size={17}/><p>For your protection, never share one-time codes, password reset links or account credentials. If you do not recognise a sign-in, reset your password and sign out of this session.</p></section>
      </>}
      {active==="Overview"&&<>
        <div className="account-grid"><section className="savings-hero"><div className="hero-top"><span><Wallet size={17}/> WALLET BALANCES</span><button onClick={()=>setHidden(!hidden)} aria-label={hidden?"Show balances":"Hide balances"}>{hidden?<Eye size={17}/>:<EyeOff size={17}/>}</button></div><div className="balance-pair"><div><small>SLE WALLET</small><div className="hero-balance">{hidden?"••••••":overview?formatMoney(totals.SLE,"SLE"):"Unavailable"}</div></div><div><small>USD WALLET</small><div className="hero-balance">{hidden?"••••••":overview?formatMoney(totals.USD,"USD"):"Unavailable"}</div></div></div><div className="hero-growth"><Sparkles size={14}/> Calculated from posted ledger entries</div><div className="hero-actions"><button className="lime-action" disabled title="Available after authorised payment integration"><ArrowDownLeft size={16}/> Add Money</button><button className="blue-action" disabled title="Available after authorised payment integration"><ArrowLeftRight size={16}/> Transfer</button></div></section><section className="spend-card"><div className="spend-title"><span>ACCOUNT STATUS</span><span className="spend-mark"><ShieldCheck size={16}/></span></div><h2>{overview?(overview.profile?.kyc_status==="verified"?"Verified":"Verification pending"):"Status unavailable"}</h2><p>Identity and account checks</p><button disabled>Manage verification <ChevronRight size={15}/></button></section></div>
        <div className="section-title"><div><h2>My savings goals</h2><p>Your personal and scheduled savings plans.</p></div><button onClick={()=>setActive("Savings Account")}><PiggyBank size={15}/> View savings</button></div>
        <div className="goals-grid">{goals.length?goals.slice(0,3).map(goal=><article className="goal-card" key={goal.id}><div className="goal-head"><span className="goal-icon"><Landmark size={18}/></span><span>{goal.status}</span></div><b>{goal.name}</b><p>{goal.target_amount?formatMoney(goal.target_amount,goal.currency):"No target set"}</p></article>):<div className="empty-state goal-empty">No savings goals yet. Your goals will appear here when created.</div>}</div>
        <div className="section-title"><div><h2>Recent transactions</h2><p>Latest activity from your wallet ledger.</p></div><button onClick={()=>setActive("Performance")}>View activity <ChevronRight size={15}/></button></div>
        <section className="transactions">{filteredTransactions.length?filteredTransactions.slice(0,5).map(tx=><div className="transaction" key={tx.id}><span className="transaction-icon">{tx.direction==="credit"?<ArrowDownLeft size={17}/>:<ArrowUpRight size={17}/>}</span><span className="transaction-name"><b>{tx.description||tx.transaction_type.replaceAll("_"," ")}</b><small>{dateLabel(tx.created_at)} · {tx.status}</small></span><span className="transaction-amount"><b>{hidden?"••••":formatMoney(tx.amount,tx.currency)}</b><small>{tx.direction}</small></span></div>):<p className="empty-state">{transactionSearch.trim()?"No recent transactions match your search.": "No transactions yet. Verified wallet activity will appear here."}</p>}</section>
      </>}
      {active==="Savings Account"&&<>
        <div className="section-title page-section-heading"><div><h2>Osusu Savings</h2><p>Choose a savings style, create a plan and track your progress.</p></div><button type="button" onClick={()=>setShowCreatePlan(!showCreatePlan)}><Plus size={15}/>{showCreatePlan?"Close setup":"Create savings plan"}</button></div>
        {message&&<div className="auth-message savings-message">{message}</div>}
        <div className="savings-summary-grid">
          <article className="section-stat"><span>MY SAVINGS PLANS</span><strong>{mySavings.length}</strong><small>Plans opened in your account</small></article>
          <article className="section-stat"><span>PLANS WITH CONTRIBUTIONS</span><strong>{mySavings.filter(plan=>Number(plan.total_contributed)>0).length}</strong><small>Plans with confirmed ledger-linked contributions</small></article>
          <article className="section-stat"><span>AVAILABLE PLAN TYPES</span><strong>{savingsProducts.filter(product=>product.is_available).length}</strong><small>Currently open for setup</small></article>
        </div>
        {showCreatePlan&&<section className="create-savings-panel">
          <div className="create-savings-heading"><span className="goal-icon"><PiggyBank size={19}/></span><div><h2>Set up a savings plan</h2><p>Choose an available plan and set your target and contribution schedule.</p></div></div>
          <div className="savings-product-picker">{savingsProducts.map(product=><button type="button" key={product.id} className={selectedPlanCode===product.plan_code?"savings-product-option selected":"savings-product-option"} onClick={()=>setSelectedPlanCode(product.plan_code)} disabled={!product.is_available}>
            <span className="product-option-top"><b>{product.display_name}</b><span className={product.is_available?"product-state available":"product-state"}>{product.is_available?"Available":"Coming soon"}</span></span>
            <small>{product.description}</small>
            {product.rate_status==="approved"&&product.annual_rate!==null?<strong>{Number(product.annual_rate).toFixed(2)}% p.a.</strong>:product.rate_status==="pending_approval"?<strong className="rate-pending">Returns pending approval</strong>:<strong>No interest advertised</strong>}
          </button>)}</div>
          {selectedSavingsProduct&&<form className="savings-form" onSubmit={createSavingsPlan}>
            <label>Plan name<input value={planName} onChange={e=>setPlanName(e.target.value)} placeholder="e.g. New laptop fund" minLength={2} maxLength={80} required/></label>
            <div className="savings-form-row">
              <label>Target amount<input type="number" min="0.01" step="0.01" value={targetAmount} onChange={e=>setTargetAmount(e.target.value)} placeholder="Enter target" required/></label>
              <label>Currency<select value={planCurrency} onChange={e=>setPlanCurrency(e.target.value as "SLE"|"USD")}><option value="SLE">SLE · Leone</option><option value="USD">USD · US Dollar</option></select></label>
            </div>
            <div className="savings-form-row">
              <label>Contribution frequency<select value={contributionFrequency} onChange={e=>setContributionFrequency(e.target.value)}><option value="flexible">Flexible</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label>
              {selectedPlanCode==="scheduled-saver"&&<label>Scheduled contribution amount<input type="number" min="0.01" step="0.01" value={scheduledAmount} onChange={e=>setScheduledAmount(e.target.value)} placeholder="Contribution amount" required/></label>}
            </div>
            {selectedSavingsProduct.rate_status==="pending_approval"&&<div className="savings-caution"><ShieldCheck size={16}/> This product rate, term and maturity conditions have not yet received approval. It cannot be opened yet.</div>}
            <div className="savings-form-actions"><button type="button" className="secondary-action" onClick={()=>setShowCreatePlan(false)}>Cancel</button><button className="primary-action" type="submit" disabled={savingBusy||!selectedSavingsProduct.is_available}>{savingBusy?<LoaderCircle className="spin" size={16}/>:<Plus size={16}/>} Create plan</button></div>
          </form>}
        </section>}
        <div className="section-title"><div><h2>Savings options</h2><p>Plan availability and returns status.</p></div></div>
        <div className="savings-catalogue">{savingsProducts.map(product=><article className="savings-catalogue-card" key={product.id}>
          <div className="catalogue-card-top"><span className="goal-icon">{product.savings_type==="fixed_term"?<Clock3 size={18}/>:product.savings_type==="scheduled"?<CalendarDays size={18}/>:product.savings_type==="circle"?<CircleDollarSign size={18}/>:<PiggyBank size={18}/>}</span><span className={product.is_available?"product-state available":"product-state"}>{product.is_available?"Open":"Coming soon"}</span></div>
          <h3>{product.display_name}</h3><p>{product.description}</p>
          <div className="catalogue-rate">{product.rate_status==="approved"&&product.annual_rate!==null?<><b>{Number(product.annual_rate).toFixed(2)}%</b><small>Indicative annual rate</small></>:product.rate_status==="pending_approval"?<><b>Rate pending</b><small>Subject to approval and published terms</small></>:<><b>Flexible saving</b><small>No interest or return currently attached</small></>}</div>
          <button type="button" disabled={!product.is_available} onClick={()=>{setSelectedPlanCode(product.plan_code);setShowCreatePlan(true);}}>{product.is_available?"Set up this plan":"Not available yet"}</button>
        </article>)}</div>
        <div className="section-title"><div><h2>My savings plans</h2><p>Your saved goals, schedules and contribution records.</p></div></div>
        <div className="savings-plan-list">{mySavings.length?mySavings.map(plan=><article className="savings-plan-card" key={plan.id}>
          <span className="goal-icon"><PiggyBank size={19}/></span>
          <div className="savings-plan-main"><b>{plan.name}</b><small>{plan.plan_name||plan.savings_type.replaceAll("_"," ")} · {plan.contribution_frequency||"Flexible"} · {plan.currency}</small><small>Status: {plan.status} · Opened {formatPlanDate(plan.starts_at)}</small><small>{plan.contribution_count} confirmed contribution{plan.contribution_count===1?"":"s"}</small><small>Scheduled amount: {plan.scheduled_amount?formatMoney(plan.scheduled_amount,plan.currency):"Not set"}</small></div>
          <div className="savings-plan-target"><small>Target</small><b>{plan.target_amount?formatMoney(plan.target_amount,plan.currency):"Not set"}</b><small>Current balance</small><b>{formatMoney(plan.current_balance,plan.currency)}</b><small>Total contributed</small><b>{formatMoney(plan.total_contributed,plan.currency)}</b><small>Withdrawals</small><b>{plan.withdrawal_count}</b></div>
          <div className="savings-goal-progress">
            <div className="savings-goal-progress-heading"><span>GOAL PROGRESS</span><b>{plan.target_amount&&Number(plan.target_amount)>0?`${goalProgress(plan.current_balance,plan.target_amount).toFixed(1)}%`:"No target set"}</b></div>
            {plan.target_amount!==null&&Number.isFinite(Number(plan.target_amount))&&Number(plan.target_amount)>0&&<div className="savings-goal-progress-track" role="progressbar" aria-label={`${plan.name} savings goal progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={goalProgress(plan.current_balance,plan.target_amount)}><span style={{width:`${goalProgress(plan.current_balance,plan.target_amount)}%`}}/></div>}
            <small>{plan.target_amount&&Number(plan.target_amount)>0&&goalProgress(plan.current_balance,plan.target_amount)>=100?"Target reached":plan.target_amount&&Number(plan.target_amount)>0?`${formatMoney(plan.current_balance,plan.currency)} saved towards ${formatMoney(plan.target_amount,plan.currency)}`:"Set a target to track progress"}</small>
          </div>
          <div className="savings-plan-operations">
            {plan.funding_enabled?<><label>Amount<input type="number" min="0.01" step="0.01" value={movementAmounts[plan.id]??""} onChange={e=>setMovementAmounts(current=>({...current,[plan.id]:e.target.value}))} placeholder="Enter amount"/></label><div><button type="button" disabled={movementBusy===plan.id} onClick={()=>void moveSavingsFunds(plan,"contribution")}>Add savings</button><button type="button" className="withdraw-action" disabled={movementBusy===plan.id} onClick={()=>void moveSavingsFunds(plan,"withdrawal")}>Withdraw</button></div></>:<p><ShieldCheck size={14}/> Contributions and withdrawals are locked until this savings product is approved for funding and your account and wallet meet verification requirements.</p>}
            <div className="schedule-editor">
              <b><CalendarDays size={14}/> Contribution schedule</b>
              <div className="schedule-fields">
                <label>Frequency<select value={scheduleFrequency[plan.id]??plan.contribution_frequency??"flexible"} onChange={e=>setScheduleFrequency(s=>({...s,[plan.id]:e.target.value}))}><option value="flexible">Flexible</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label>
                <label>Planned amount<input type="number" min="0.01" step="0.01" disabled={(scheduleFrequency[plan.id]??plan.contribution_frequency)==="flexible"} value={scheduleAmounts[plan.id]??String(plan.scheduled_amount??"")} onChange={e=>setScheduleAmounts(s=>({...s,[plan.id]:e.target.value}))} placeholder="Amount"/></label>
                <label>Next due date<input type="date" min={new Date().toISOString().slice(0,10)} disabled={(scheduleFrequency[plan.id]??plan.contribution_frequency)==="flexible"} value={scheduleDates[plan.id]??(plan.next_contribution_at?new Date(plan.next_contribution_at).toISOString().slice(0,10):"")} onChange={e=>setScheduleDates(s=>({...s,[plan.id]:e.target.value}))}/></label>
              </div>
              <label className="schedule-reminder"><input type="checkbox" checked={scheduleReminders[plan.id]??plan.reminder_enabled} onChange={e=>setScheduleReminders(s=>({...s,[plan.id]:e.target.checked}))}/> Remind me about upcoming contributions</label>
              <div className="schedule-save"><small>Reminders do not move money. Automatic collection is disabled.</small><button type="button" disabled={scheduleBusy===plan.id} onClick={()=>void saveSavingsSchedule(plan)}>{scheduleBusy===plan.id?<LoaderCircle className="spin" size={14}/>:"Save schedule"}</button></div>
            </div>
            {plan.next_contribution_at&&<small className="next-due-label">Next planned contribution: {dateLabel(plan.next_contribution_at)}</small>}
            {plan.recent_activity?.length>0&&<div className="savings-activity"><b>Recent activity</b>{plan.recent_activity.map(item=><div key={item.id}><span>{item.movement_type==="contribution"?"Contribution":"Withdrawal"} · {dateLabel(item.created_at)}</span><strong>{item.movement_type==="contribution"?"+":"−"}{formatMoney(item.amount,item.currency)}</strong></div>)}</div>}
          </div>
        </article>):<div className="empty-state goal-empty">You have not created a savings plan yet. Choose an available option above to get started.</div>}</div>
        <div className="section-title"><div><h2>Savings activity history</h2><p>Search and review confirmed contributions and withdrawals across your savings plans.</p></div><button type="button" onClick={exportSavingsActivity} disabled={!savingsHistoryRows.length||savingsHistoryLoading}><ArrowDownLeft size={15}/> Export this page</button></div>
        <section className="history-filters savings-activity-filters" aria-label="Savings activity filters">
          <label><span>SEARCH</span><input type="search" value={savingsHistorySearch} maxLength={100} onChange={event=>{setSavingsHistorySearch(event.target.value);setSavingsHistoryPage(1);}} placeholder="Plan, description, status or amount"/></label>
          <label><span>FROM</span><input type="date" value={savingsHistoryStart} max={savingsHistoryEnd||undefined} onChange={event=>{setSavingsHistoryStart(event.target.value);setSavingsHistoryPage(1);}}/></label>
          <label><span>TO</span><input type="date" value={savingsHistoryEnd} min={savingsHistoryStart||undefined} onChange={event=>{setSavingsHistoryEnd(event.target.value);setSavingsHistoryPage(1);}}/></label>
          <label><span>ACTIVITY</span><select value={savingsHistoryType} onChange={event=>{setSavingsHistoryType(event.target.value);setSavingsHistoryPage(1);}}><option value="">All activity</option><option value="contribution">Contributions</option><option value="withdrawal">Withdrawals</option></select></label>
          <label><span>SAVINGS PLAN</span><select value={savingsHistoryPlan} onChange={event=>{setSavingsHistoryPlan(event.target.value);setSavingsHistoryPage(1);}}><option value="">All plans</option>{mySavings.map(plan=><option key={plan.id} value={plan.id}>{plan.name}</option>)}</select></label>
          <button type="button" className="history-clear" onClick={()=>{setSavingsHistorySearch("");setSavingsHistoryStart("");setSavingsHistoryEnd("");setSavingsHistoryType("");setSavingsHistoryPlan("");setSavingsHistoryPage(1);}}>Clear filters</button>
        </section>
        {savingsHistoryError&&<div className="notice" role="alert"><ShieldCheck size={16}/><span>{savingsHistoryError}</span></div>}
        <section className="transactions" aria-live="polite">
          {savingsHistoryLoading?<p className="empty-state">Loading your savings activity…</p>:savingsHistoryRows.length?savingsHistoryRows.map(item=><div className="transaction" key={item.id}><span className="transaction-icon">{item.movement_type==="contribution"?<ArrowDownLeft size={17}/>:<ArrowUpRight size={17}/>}</span><span className="transaction-name"><b>{item.plan_name} · {item.movement_type==="contribution"?"Contribution":"Withdrawal"}</b><small>{dateLabel(item.created_at)} · {item.status}{item.description? ` · ${item.description}`:""}</small></span><span className="transaction-amount"><b>{formatMoney(item.amount,item.currency)}</b><small>{item.currency}</small></span></div>):<p className="empty-state">No savings activity matches these filters.</p>}
        </section>
        <div className="history-pagination"><span>Showing {savingsHistoryCount===0?0:(savingsHistoryPage-1)*25+1}–{Math.min(savingsHistoryPage*25,savingsHistoryCount)} of {savingsHistoryCount}</span><div><button type="button" onClick={()=>setSavingsHistoryPage(page=>Math.max(1,page-1))} disabled={savingsHistoryPage===1||savingsHistoryLoading}>Previous</button><span>Page {savingsHistoryPage} of {Math.max(1,Math.ceil(savingsHistoryCount/25))}</span><button type="button" onClick={()=>setSavingsHistoryPage(page=>page+1)} disabled={savingsHistoryPage*25>=savingsHistoryCount||savingsHistoryLoading}>Next</button></div></div>
        <p className="data-note">This history includes only confirmed ledger-linked savings movements. Export downloads the current page of up to 25 records.</p>
        <section className="circle-hub">
          <div className="circle-hub-heading"><div><span className="overline">SAVE TOGETHER</span><h2>Osusu Circle</h2><p>Create a group savings circle or join one with an invitation code.</p></div><span className="circle-icon"><Users size={21}/></span></div>
          <div className="circle-setup-grid">
            <form className="circle-setup-card" onSubmit={createSavingsCircle}>
              <h3><Plus size={15}/> Create a circle</h3>
              <label>Circle name<input value={circleName} onChange={e=>setCircleName(e.target.value)} minLength={3} maxLength={60} placeholder="e.g. Family savings group" required/></label>
              <div className="circle-form-row"><label>Currency<select value={circleCurrency} onChange={e=>setCircleCurrency(e.target.value as "SLE"|"USD")}><option value="SLE">SLE</option><option value="USD">USD</option></select></label><label>Frequency<select value={circleFrequency} onChange={e=>setCircleFrequency(e.target.value)}><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label></div>
              <div className="circle-form-row"><label>Planned contribution<input type="number" min="0.01" step="0.01" value={circleAmount} onChange={e=>setCircleAmount(e.target.value)} placeholder="Amount" required/></label><label>Member limit<select value={circleMaxMembers} onChange={e=>setCircleMaxMembers(e.target.value)}>{[2,5,10,15,20,30,50,100].map(n=><option key={n} value={n}>{n} members</option>)}</select></label></div>
              <p>Creates a draft group and invitation code. No money is collected.</p>
              <button type="submit" disabled={circleBusy}>{circleBusy?<LoaderCircle className="spin" size={14}/>:<Plus size={14}/>} Create draft circle</button>
            </form>
            <form className="circle-setup-card" onSubmit={joinSavingsCircle}>
              <h3><Users size={15}/> Join a circle</h3>
              <label>Invitation code<input value={circleInviteCode} onChange={e=>setCircleInviteCode(e.target.value)} placeholder="Paste invitation UUID" required/></label>
              <p>Only join a group when you recognise and trust its organiser. Invitations expire after 30 days.</p>
              <button type="submit" disabled={circleBusy||!circleInviteCode.trim()}>{circleBusy?<LoaderCircle className="spin" size={14}/>:"Join circle"}</button>
            </form>
          </div>
          <div className="circle-list-heading"><h3>My circles</h3><span>{savingsCircles.length} group{savingsCircles.length===1?"":"s"}</span></div>
          <div className="circle-list">{savingsCircles.length?savingsCircles.map(circle=><article className="circle-card" key={circle.id}>
            <div className="circle-card-top"><div><b>{circle.name}</b><small>{circle.frequency} · {circle.currency} {formatMoney(circle.contribution_amount,circle.currency)} planned per member</small></div><span className="product-state">{circle.status==="draft"?"Draft · not collecting":circle.status}</span></div>
            <div className="circle-metrics"><span><b>{circle.member_count}/{circle.max_members}</b><small>Members</small></span><span><b>{circle.is_owner?"Organiser":"Member"}</b><small>Your role</small></span><span><b>{formatPlanDate(circle.created_at)}</b><small>Created</small></span></div>
            {circle.is_owner&&circle.invite_code&&<div className="circle-invite"><span><small>Invitation code · expires {circle.invitation_expires_at?formatPlanDate(circle.invitation_expires_at):"in 30 days"}</small><b>{circle.invite_code}</b></span><button type="button" onClick={()=>void navigator.clipboard.writeText(circle.invite_code!)}><Copy size={13}/> Copy</button></div>}
            <div className="circle-members">{circle.members.map(member=><span key={member.user_id}><i>{member.display_name.slice(0,1).toUpperCase()}</i>{member.display_name}{member.member_role==="owner"?" · Organiser":""}</span>)}</div>
            {!circle.is_owner&&<button className="circle-leave" type="button" disabled={circleBusy} onClick={()=>void leaveSavingsCircle(circle)}>Leave circle</button>}
            <p className="circle-safety"><ShieldCheck size={13}/> Draft coordination only. Contributions, pooled balances and payout rotation are not enabled.</p>
          </article>):<p className="empty-state">You have not created or joined an Osusu Circle yet.</p>}</div>
        </section>
        <div className="support-banner"><span><ShieldCheck size={18}/></span><div><b>Your savings are tracked securely</b><small>Plan creation and ledger-backed savings records are implemented. Money movements remain gated until product approval, verified KYC/account status and active wallet funding controls are in place. Schedule preferences and due dates are saved. Reminder delivery requires a scheduled notification worker; automatic collection and interest payouts remain disabled.</small></div></div>
      </>}
      {active==="Total Cards"&&<>
        <div className="section-title page-section-heading"><div><h2>Osusu Dash Cards</h2><p>Manage the cards connected to your Osusu account.</p></div></div>
        <section className="card-readiness-panel"><div className="card-illustration"><CreditCard size={34}/><span>OSUSU</span><small>DASH CARD</small><i>•••• &nbsp; •••• &nbsp; •••• &nbsp; ••••</i></div><div className="card-readiness-copy"><span className="overline">CARD SERVICES</span><h2>Your Dash Card space</h2><p>No card has been issued or linked to this account yet. Card issuance and card controls will appear here after an authorised card-issuer integration is completed.</p><span className="status-chip">Issuance not available yet</span></div></section>
        <div className="section-title"><div><h2>Card features</h2><p>These controls will become available when card services are activated.</p></div></div>
        <div className="card-feature-grid"><article><LockKeyhole size={19}/><b>Freeze and unfreeze</b><small>Temporarily secure an issued card.</small></article><article><Wallet size={19}/><b>Card spending</b><small>Review card transactions and spending.</small></article><article><ShieldCheck size={19}/><b>Card security</b><small>Manage limits and security settings.</small></article></div>
      </>}
      {active==="Performance"&&<>
        <div className="section-title page-section-heading"><div><h2>Financial performance</h2><p>Your wallet activity and transaction history, retrieved securely for your account.</p></div></div>
        <div className="savings-summary-grid"><article className="section-stat"><span>FILTERED TRANSACTIONS</span><strong>{historyCount}</strong><small>Matching records across your account</small></article><article className="section-stat"><span>SLE WALLET BALANCE</span><strong>{hidden?"••••••":formatMoney(totals.SLE,"SLE")}</strong><small>From posted ledger entries</small></article><article className="section-stat"><span>USD WALLET BALANCE</span><strong>{hidden?"••••••":formatMoney(totals.USD,"USD")}</strong><small>From posted ledger entries</small></article></div>
        <div className="section-title"><div><h2>Transaction history</h2><p>Search and filter your account records by date, description, type, status or amount.</p></div><button type="button" onClick={exportTransactions} disabled={!historyRows.length||historyLoading}><ArrowDownLeft size={15}/> Export this page</button></div>
        <section className="history-filters" aria-label="Transaction history filters">
          <label><span>SEARCH</span><input type="search" value={historySearch} maxLength={100} onChange={event=>{setHistorySearch(event.target.value);setHistoryPage(1);}} placeholder="Description, type, status, amount"/></label>
          <label><span>FROM</span><input type="date" value={historyStart} max={historyEnd||undefined} onChange={event=>{setHistoryStart(event.target.value);setHistoryPage(1);}}/></label>
          <label><span>TO</span><input type="date" value={historyEnd} min={historyStart||undefined} onChange={event=>{setHistoryEnd(event.target.value);setHistoryPage(1);}}/></label>
          <button type="button" className="history-clear" onClick={()=>{setHistorySearch("");setHistoryStart("");setHistoryEnd("");setHistoryPage(1);}}>Clear filters</button>
        </section>
        {historyError&&<div className="notice" role="alert"><ShieldCheck size={16}/><span>{historyError}</span></div>}
        <section className="transactions" aria-live="polite">
          {historyLoading?<p className="empty-state">Loading your transaction history…</p>:historyRows.length?historyRows.map(tx=><div className="transaction" key={tx.id}><span className="transaction-icon">{tx.direction==="credit"?<ArrowDownLeft size={17}/>:<ArrowUpRight size={17}/>}</span><span className="transaction-name"><b>{tx.description||tx.transaction_type.replaceAll("_"," ")}</b><small>{dateLabel(tx.created_at)} · {tx.status} · {tx.transaction_type.replaceAll("_"," ")}</small></span><span className="transaction-amount"><b>{hidden?"••••":formatMoney(tx.amount,tx.currency)}</b><small>{tx.direction}</small></span></div>):<p className="empty-state">No transactions match these filters.</p>}
        </section>
        <div className="history-pagination"><span>Showing {historyCount===0?0:(historyPage-1)*25+1}–{Math.min(historyPage*25,historyCount)} of {historyCount}</span><div><button type="button" onClick={()=>setHistoryPage(page=>Math.max(1,page-1))} disabled={historyPage===1||historyLoading}>Previous</button><span>Page {historyPage} of {Math.max(1,Math.ceil(historyCount/25))}</span><button type="button" onClick={()=>setHistoryPage(page=>page+1)} disabled={historyPage*25>=historyCount||historyLoading}>Next</button></div></div>
        <p className="data-note">History is limited to records associated with your own Osusu wallets. Export downloads the currently displayed page (up to 25 matching records), not all pages at once.</p>
      </>}
      <div className="support-banner"><span><ShieldCheck size={18}/></span><div><b>Secure account connection</b><small>Balances are read from posted ledger entries. Money movement is not enabled in this preview.</small></div></div>
      <footer><span>© 2026 Osusu · A Delight Ventures product</span><span><ShieldCheck size={13}/> Secure connection <i/> Sierra Leone</span></footer><p className="disclaimer">OSUSU EARLY ACCESS · Deposits, withdrawals, transfers, card issuance and interest-bearing products remain disabled pending authorised integrations and approvals.</p>
      </div>
    </section>
  </main>;
}
