"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Bell, ChevronRight, CreditCard,
  Eye, EyeOff, Home, Landmark, LockKeyhole, LogOut, PiggyBank, Search, ShieldCheck,
  Sparkles, Target, TrendingUp, Wallet, X, LoaderCircle
} from "lucide-react";

type WalletRow = { id:string; currency:"SLE"|"USD"; status:string; balance:number|string };
type Goal = { id:string; name:string; currency:"SLE"|"USD"; target_amount:number|string|null; status:string; savings_type:string; contribution_frequency:string|null };
type Tx = { id:string; transaction_type:string; direction:string; amount:number|string; currency:"SLE"|"USD"; status:string; description:string|null; created_at:string };
type Overview = { profile:{display_name:string|null;country_code:string;kyc_status:string;account_status:string}|null; wallets:WalletRow[]; savings_goals:Goal[]; transactions:Tx[] };

const formatMoney = (amount:number|string,currency:"SLE"|"USD") => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2}).format(Number(amount)).replace("$",currency==="SLE"?"Le ":"$");
const dateLabel = (value:string) => new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(value));

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

  const loadOverview = useCallback(async (client: ReturnType<typeof createClient>): Promise<Overview> => {
    const {error:initializeError} = await client.rpc("osusu_initialize_my_account");
    if (initializeError) throw initializeError;
    const {data,error:rpcError} = await client.rpc("osusu_get_my_overview");
    if (rpcError) throw rpcError;
    return data as Overview;
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

  async function signOut() {
    if(!supabase)return;setBusy(true);const {error}=await supabase.auth.signOut();setBusy(false);
    if(error)setError(error.message);
  }

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
        {error&&<div className="auth-error">{error}</div>}{message&&<div className="auth-message">{message}</div>}
        <button className="auth-submit" disabled={busy}>{busy?<LoaderCircle className="spin" size={17}/>:null}{mode==="login"?"Sign in":"Create account"}</button>
      </form>
      <div className="auth-switch">{mode==="login"?"New to Osusu?":"Already have an account?"}<button onClick={()=>{setMode(mode==="login"?"signup":"login");setError("");setMessage("");}}>{mode==="login"?"Create an account":"Sign in"}</button></div>
      <div className="auth-legal"><LockKeyhole size={13}/> Secure authentication · Your financial data stays private</div>
    </div></section>
  </main>;

  const goals=overview?.savings_goals??[];
  const transactions=overview?.transactions??[];
  const name=overview?.profile?.display_name||session.user.email?.split("@")[0]||"there";
  return <main className="osusu-app">
    <aside className="side-panel"><div className="brand"><span className="brand-symbol">o</span><span>osusu<small>BY DELIGHT VENTURES</small></span></div><p className="nav-caption">YOUR SPACE</p>
      {["Overview","Savings Account","Total Cards","Performance"].map((item,i)=><button key={item} className={`side-link ${active===item?"selected":""}`} onClick={()=>setActive(item)}>{[Home,PiggyBank,CreditCard,TrendingUp].map((Icon,j)=>i===j?<Icon key={item} size={18}/>:null)}{item}{active===item&&<i/>}</button>)}
      <div className="side-spacer"/><div className="side-help"><ShieldCheck size={19}/><div><b>Your money matters</b><span>Security is part of every step.</span></div></div><button className="side-link" onClick={signOut}><LogOut size={18}/>Sign out</button><div className="profile"><span className="avatar">{String(name).slice(0,2).toUpperCase()}</span><span><b>{name}</b><small>{session.user.email}</small></span></div>
    </aside>
    <section className="workspace"><header className="topbar"><div className="breadcrumb">My Osusu <ChevronRight size={14}/><b>{active}</b></div><div className="top-tools"><div className="search"><Search size={16}/><span>Search transactions</span></div><button className="bell" aria-label="Notifications"><Bell size={19}/></button><span className="avatar top-avatar">{String(name).slice(0,2).toUpperCase()}</span></div></header>
      <div className="page-content"><div className="welcome"><div><span className="overline">YOUR MONEY. YOUR FUTURE.</span><h1>Welcome back, {name.split(" ")[0]}</h1><p>Your Osusu account overview, securely connected.</p></div><span className="date-pill"><span/> {overview?.profile?.account_status??"Status unavailable"}</span></div>
      {error&&<div className="notice"><ShieldCheck size={17}/><span>{error}</span><button onClick={()=>setError("")}><X size={16}/></button></div>}
      {active==="Overview"&&<>
        <div className="account-grid"><section className="savings-hero"><div className="hero-top"><span><Wallet size={17}/> WALLET BALANCES</span><button onClick={()=>setHidden(!hidden)} aria-label={hidden?"Show balances":"Hide balances"}>{hidden?<Eye size={17}/>:<EyeOff size={17}/>}</button></div><div className="balance-pair"><div><small>SLE WALLET</small><div className="hero-balance">{hidden?"••••••":overview?formatMoney(totals.SLE,"SLE"):"Unavailable"}</div></div><div><small>USD WALLET</small><div className="hero-balance">{hidden?"••••••":overview?formatMoney(totals.USD,"USD"):"Unavailable"}</div></div></div><div className="hero-growth"><Sparkles size={14}/> Calculated from posted ledger entries</div><div className="hero-actions"><button className="lime-action" disabled title="Available after authorised payment integration"><ArrowDownLeft size={16}/> Add Money</button><button className="blue-action" disabled title="Available after authorised payment integration"><ArrowLeftRight size={16}/> Transfer</button></div></section><section className="spend-card"><div className="spend-title"><span>ACCOUNT STATUS</span><span className="spend-mark"><ShieldCheck size={16}/></span></div><h2>{overview?(overview.profile?.kyc_status==="verified"?"Verified":"Verification pending"):"Status unavailable"}</h2><p>Identity and account checks</p><button disabled>Manage verification <ChevronRight size={15}/></button></section></div>
        <div className="section-title"><div><h2>My savings goals</h2><p>Your personal and scheduled savings plans.</p></div><button onClick={()=>setActive("Savings Account")}><PiggyBank size={15}/> View savings</button></div>
        <div className="goals-grid">{goals.length?goals.slice(0,3).map(goal=><article className="goal-card" key={goal.id}><div className="goal-head"><span className="goal-icon"><Landmark size={18}/></span><span>{goal.status}</span></div><b>{goal.name}</b><p>{goal.target_amount?formatMoney(goal.target_amount,goal.currency):"No target set"}</p></article>):<div className="empty-state goal-empty">No savings goals yet. Your goals will appear here when created.</div>}</div>
        <div className="section-title"><div><h2>Recent transactions</h2><p>Latest activity from your wallet ledger.</p></div><button onClick={()=>setActive("Performance")}>View activity <ChevronRight size={15}/></button></div>
        <section className="transactions">{transactions.length?transactions.slice(0,5).map(tx=><div className="transaction" key={tx.id}><span className="transaction-icon">{tx.direction==="credit"?<ArrowDownLeft size={17}/>:<ArrowUpRight size={17}/>}</span><span className="transaction-name"><b>{tx.description||tx.transaction_type.replaceAll("_"," ")}</b><small>{dateLabel(tx.created_at)} · {tx.status}</small></span><span className="transaction-amount"><b>{hidden?"••••":formatMoney(tx.amount,tx.currency)}</b><small>{tx.direction}</small></span></div>):<p className="empty-state">No transactions yet. Verified wallet activity will appear here.</p>}</section>
      </>}
      {active==="Savings Account"&&<>
        <div className="section-title page-section-heading"><div><h2>Your savings accounts</h2><p>Review the savings plans linked to your Osusu profile.</p></div></div>
        <div className="savings-summary-grid"><article className="section-stat"><span>ACTIVE SAVINGS PLANS</span><strong>{goals.filter(g=>g.status==="active").length}</strong><small>Plans marked active</small></article><article className="section-stat"><span>TOTAL SAVINGS PLANS</span><strong>{goals.length}</strong><small>Personal savings records</small></article><article className="section-stat"><span>WALLET CURRENCIES</span><strong>{overview?.wallets.length??0}</strong><small>SLE and USD wallet accounts</small></article></div>
        <div className="section-title"><div><h2>My savings plans</h2><p>Targets and plan details currently recorded for your account.</p></div></div>
        <div className="savings-plan-list">{goals.length?goals.map(goal=><article className="savings-plan-card" key={goal.id}><span className="goal-icon"><PiggyBank size={19}/></span><div className="savings-plan-main"><b>{goal.name}</b><small>{goal.savings_type.replaceAll("_"," ")} · {goal.contribution_frequency?.replaceAll("_"," ")||"Frequency not set"}</small><small>Status: {goal.status}</small></div><div className="savings-plan-target"><small>Target amount</small><b>{goal.target_amount?formatMoney(goal.target_amount,goal.currency):"Not set"}</b></div></article>):<div className="empty-state goal-empty">You do not have any savings plans yet. Once a savings plan is created and linked to your account, it will appear here.</div>}</div>
        <div className="support-banner"><span><ShieldCheck size={18}/></span><div><b>Savings information is read-only at this stage</b><small>Plan creation, contributions, withdrawals and returns will be enabled only after the required backend workflows and approvals are complete.</small></div></div>
      </>}
      {active==="Total Cards"&&<>
        <div className="section-title page-section-heading"><div><h2>Osusu Dash Cards</h2><p>Manage the cards connected to your Osusu account.</p></div></div>
        <section className="card-readiness-panel"><div className="card-illustration"><CreditCard size={34}/><span>OSUSU</span><small>DASH CARD</small><i>•••• &nbsp; •••• &nbsp; •••• &nbsp; ••••</i></div><div className="card-readiness-copy"><span className="overline">CARD SERVICES</span><h2>Your Dash Card space</h2><p>No card has been issued or linked to this account yet. Card issuance and card controls will appear here after an authorised card-issuer integration is completed.</p><span className="status-chip">Issuance not available yet</span></div></section>
        <div className="section-title"><div><h2>Card features</h2><p>These controls will become available when card services are activated.</p></div></div>
        <div className="card-feature-grid"><article><LockKeyhole size={19}/><b>Freeze and unfreeze</b><small>Temporarily secure an issued card.</small></article><article><Wallet size={19}/><b>Card spending</b><small>Review card transactions and spending.</small></article><article><ShieldCheck size={19}/><b>Card security</b><small>Manage limits and security settings.</small></article></div>
      </>}
      {active==="Performance"&&<>
        <div className="section-title page-section-heading"><div><h2>Financial performance</h2><p>A snapshot of the latest wallet activity returned by your account ledger.</p></div></div>
        <div className="savings-summary-grid"><article className="section-stat"><span>RECENT TRANSACTIONS</span><strong>{transactions.length}</strong><small>Latest records available (up to 20)</small></article><article className="section-stat"><span>SLE WALLET BALANCE</span><strong>{hidden?"••••••":formatMoney(totals.SLE,"SLE")}</strong><small>From posted ledger entries</small></article><article className="section-stat"><span>USD WALLET BALANCE</span><strong>{hidden?"••••••":formatMoney(totals.USD,"USD")}</strong><small>From posted ledger entries</small></article></div>
        <div className="section-title"><div><h2>Activity history</h2><p>Transaction records supplied by your Osusu account.</p></div></div>
        <section className="transactions">{transactions.length?transactions.map(tx=><div className="transaction" key={tx.id}><span className="transaction-icon">{tx.direction==="credit"?<ArrowDownLeft size={17}/>:<ArrowUpRight size={17}/>}</span><span className="transaction-name"><b>{tx.description||tx.transaction_type.replaceAll("_"," ")}</b><small>{dateLabel(tx.created_at)} · {tx.status}</small></span><span className="transaction-amount"><b>{hidden?"••••":formatMoney(tx.amount,tx.currency)}</b><small>{tx.direction}</small></span></div>):<p className="empty-state">There is no transaction history to analyse yet. Performance summaries will populate as verified transactions are recorded.</p>}</section>
        <p className="data-note">This view reflects the latest transaction records returned by the account service. It does not represent a full historical statement or forecast.</p>
      </>}
      <div className="support-banner"><span><ShieldCheck size={18}/></span><div><b>Secure account connection</b><small>Balances are read from posted ledger entries. Money movement is not enabled in this preview.</small></div></div>
      <footer><span>© 2026 Osusu · A Delight Ventures product</span><span><ShieldCheck size={13}/> Secure connection <i/> Sierra Leone</span></footer><p className="disclaimer">OSUSU EARLY ACCESS · Deposits, withdrawals, transfers, card issuance and interest-bearing products remain disabled pending authorised integrations and approvals.</p>
      </div>
    </section>
  </main>;
}
