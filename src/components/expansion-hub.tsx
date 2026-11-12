"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight, BadgeCheck, Building2, Bus, CheckCircle2, ChevronRight, CircleDollarSign,
  Globe2, Heart, LayoutDashboard, LockKeyhole, Search, ShieldCheck, ShoppingBag,
  Smartphone, Wifi, Zap
} from "lucide-react";

type HubSection = "Services" | "Osusu Global" | "Osusu Business";
type Service = { id:string; name:string; category:string; description:string; icon:"phone"|"wifi"|"zap"|"bus"|"shop"; status:string };

const services:Service[] = [
  {id:"airtime",name:"Airtime top-up",category:"Mobile",description:"Top up supported mobile networks for yourself or someone else.",icon:"phone",status:"Provider integration pending"},
  {id:"data",name:"Data bundles",category:"Mobile",description:"Browse available data bundles and choose a plan that suits your usage.",icon:"wifi",status:"Provider integration pending"},
  {id:"electricity",name:"Electricity bills",category:"Bills",description:"Pay eligible electricity bills and keep a record of each receipt.",icon:"zap",status:"Provider integration pending"},
  {id:"water",name:"Water bills",category:"Bills",description:"Manage water-service payments through supported billing partners.",icon:"zap",status:"Provider integration pending"},
  {id:"transport",name:"Transport tickets",category:"Travel",description:"Discover and pay for supported bus and travel services in one place.",icon:"bus",status:"Partner onboarding pending"},
  {id:"shopping",name:"Merchant payments",category:"Shopping",description:"Pay participating merchants and keep digital receipts in Osusu.",icon:"shop",status:"Merchant network onboarding pending"}
];

const serviceIcon = (kind:Service["icon"]) => {
  if(kind==="phone") return <Smartphone size={20}/>;
  if(kind==="wifi") return <Wifi size={20}/>;
  if(kind==="zap") return <Zap size={20}/>;
  if(kind==="bus") return <Bus size={20}/>;
  return <ShoppingBag size={20}/>;
};

export default function ExpansionHub({section}:{section:HubSection}) {
  const [search,setSearch]=useState("");
  const [category,setCategory]=useState("All");
  const [selected,setSelected]=useState<Service|null>(null);
  const [favourites,setFavourites]=useState<string[]>([]);
  const [businessName,setBusinessName]=useState("");
  const [businessType,setBusinessType]=useState("Sole proprietor");
  const [businessEmail,setBusinessEmail]=useState("");
  const [businessPhone,setBusinessPhone]=useState("");
  const [businessDraft,setBusinessDraft]=useState<{name:string;type:string;email:string;phone:string}|null>(null);
  const dialogRef=useRef<HTMLElement|null>(null);
  const closeButtonRef=useRef<HTMLButtonElement|null>(null);
  const triggerRef=useRef<HTMLButtonElement|null>(null);
  useEffect(()=>{if(selected){closeButtonRef.current?.focus();}else{triggerRef.current?.focus();}},[selected]);
  const closeServiceDialog=()=>setSelected(null);
  const trapDialogFocus=(event:React.KeyboardEvent<HTMLElement>)=>{
    if(event.key==="Escape"){event.preventDefault();closeServiceDialog();return;}
    if(event.key!=="Tab"||!dialogRef.current)return;
    const items=Array.from(dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex=\"-1\"])"));
    if(!items.length)return;
    const first=items[0],last=items[items.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  };

  const categories=["All","Mobile","Bills","Travel","Shopping"];
  const visibleServices=useMemo(()=>services.filter(item=>(category==="All"||item.category===category)&&`${item.name} ${item.description} ${item.category}`.toLowerCase().includes(search.toLowerCase().trim())),[category,search]);

  if(section==="Services") return <div className="expansion-page">
    <div className="expansion-heading"><div><span className="overline">OSUSU SERVICES</span><h2>Everyday services, in one place</h2><p>Discover useful services without leaving Osusu. Payments will activate as approved providers come online.</p></div><span className="expansion-heading-icon"><LayoutDashboard size={23}/></span></div>
    <div className="service-search"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search airtime, bills, transport…" aria-label="Search services"/></div>
    <div className="service-categories" aria-label="Filter services">{categories.map(item=><button key={item} type="button" aria-pressed={category===item} className={category===item?"active":""} onClick={()=>setCategory(item)}>{item}</button>)}</div>
    <div className="service-grid">{visibleServices.map(item=><article className="service-card" key={item.id}><div className="service-card-top"><span className="service-icon">{serviceIcon(item.icon)}</span><button type="button" aria-label={favourites.includes(item.id)?"Remove favourite":"Add favourite"} className={favourites.includes(item.id)?"favourite active":"favourite"} onClick={()=>setFavourites(current=>current.includes(item.id)?current.filter(id=>id!==item.id):[...current,item.id])}><Heart size={17} fill={favourites.includes(item.id)?"currentColor":"none"}/></button></div><span className="service-category">{item.category}</span><h3>{item.name}</h3><p>{item.description}</p><button type="button" className="service-open" onClick={event=>{triggerRef.current=event.currentTarget;setSelected(item);}}>Explore service <ChevronRight size={15}/></button></article>)}</div>
    {visibleServices.length===0&&<div className="expansion-empty">No services match that search. Try another keyword or category.</div>}
    {selected&&<div className="service-detail-backdrop"><section ref={dialogRef} className="service-detail" role="dialog" aria-modal="true" aria-labelledby="service-detail-title" onKeyDown={trapDialogFocus}><button ref={closeButtonRef} type="button" className="detail-close" onClick={closeServiceDialog} aria-label="Close">×</button><span className="service-icon">{serviceIcon(selected.icon)}</span><span className="overline">{selected.category}</span><h3 id="service-detail-title">{selected.name}</h3><p>{selected.description}</p><div className="integration-state"><LockKeyhole size={16}/><span><b>{selected.status}</b><small>This service is listed for discovery only. Osusu will not collect a payment or claim a completed transaction until an authorised provider is connected and tested.</small></span></div><button type="button" className="service-disabled" disabled>Payments not yet available</button></section></div>}
    <div className="expansion-note"><ShieldCheck size={17}/><p><b>Safe service payments</b><br/>Each service will show the provider, amount, fees and destination before you authorise payment. A digital receipt and transaction status will be available after a confirmed provider response.</p></div>
  </div>;

  if(section==="Osusu Global") return <div className="expansion-page">
    <div className="expansion-heading"><div><span className="overline">OSUSU GLOBAL</span><h2>Your bridge to global money</h2><p>A future-ready international account experience, designed around authorised financial partners.</p></div><span className="expansion-heading-icon"><Globe2 size={24}/></span></div>
    <section className="global-hero"><div><span className="global-label"><Globe2 size={15}/> GLOBAL USD ACCOUNT</span><h3>Receive. Hold. Convert. Spend.</h3><p>Access international USD account services through eligible, regulated partners when available in your country and for your account type.</p><span className="global-status"><span/> Partner integration required</span></div><div className="global-currency-card"><small>OSUSU GLOBAL</small><strong>USD</strong><span>International account services</span><i>•••• &nbsp; •••• &nbsp; ••••</i></div></section>
    <div className="global-feature-grid"><article><ArrowUpRight size={20}/><b>Receive internationally</b><p>Explore supported ways to receive eligible cross-border payments.</p></article><article><WalletIcon/><b>Hold USD</b><p>View balances and account details provided by a regulated partner.</p></article><article><CircleDollarSign size={20}/><b>Convert transparently</b><p>See exchange rates, fees and the final amount before confirming a conversion.</p></article><article><ShoppingBag size={20}/><b>Spend globally</b><p>Use supported cards or payment rails only after issuer approval.</p></article></div>
    <section className="global-readiness"><div><span className="overline">ACCOUNT READINESS</span><h3>What needs to be in place?</h3><p>Osusu Global will only open when the following safeguards and integrations are verified.</p></div><ul><li><CheckCircle2 size={16}/> Identity and account verification</li><li><LockKeyhole size={16}/> Licensed cross-border account partner</li><li><ShieldCheck size={16}/> AML, sanctions and transaction monitoring</li><li><BadgeCheck size={16}/> Country eligibility, fees and customer disclosures</li></ul></section>
    <p className="data-note">No international account has been opened, no USD funds are held by Osusu Global, and no cross-border transfers or currency conversions are currently available through this screen.</p>
  </div>;

  return <div className="expansion-page">
    <div className="expansion-heading"><div><span className="overline">OSUSU BUSINESS</span><h2>Business banking, built around your work</h2><p>A dedicated financial workspace for small businesses, growing companies, traders and service providers.</p></div><span className="expansion-heading-icon"><Building2 size={24}/></span></div>
    <section className="business-account-hero"><div className="business-account-copy"><span className="global-label"><Building2 size={15}/> OSUSU BUSINESS ACCOUNT</span><h3>One account for your business finances.</h3><p>Keep business money activity organised separately from your personal Osusu wallet, with tools for receiving payments, managing cash flow and tracking expenses.</p><span className="business-pending">Business account onboarding not yet active</span></div><div className="business-account-visual"><span>BUSINESS ACCOUNT</span><strong>OSUSU</strong><div><span>SLE</span><span>USD</span></div><small>Account details issued by an authorised partner</small></div></section>
    <section className="business-setup"><div><span className="overline">BUSINESS ACCOUNT PROFILE</span><h3>Prepare your business details</h3><p>Enter basic details to preview the information needed for business onboarding. This draft is not submitted, saved to your account or a verified business account.</p></div>
      <form onSubmit={e=>{e.preventDefault();setBusinessDraft({name:businessName.trim(),type:businessType,email:businessEmail.trim(),phone:businessPhone.trim()});}}>
        <label>Business or trading name<input value={businessName} onChange={e=>setBusinessName(e.target.value)} minLength={2} maxLength={100} placeholder="Your registered or trading name" required/></label>
        <label>Business structure<select value={businessType} onChange={e=>setBusinessType(e.target.value)}><option>Sole proprietor</option><option>Partnership</option><option>Limited liability company</option><option>Corporation</option><option>Non-profit organisation</option><option>Other</option></select></label>
        <label>Business contact email<input type="email" value={businessEmail} onChange={e=>setBusinessEmail(e.target.value)} placeholder="business@example.com" required/></label>
        <label>Business phone number<input type="tel" value={businessPhone} onChange={e=>setBusinessPhone(e.target.value)} placeholder="Include country code" required/></label>
        <button type="submit">Preview business profile <ChevronRight size={15}/></button>
      </form>
      {businessDraft&&<div className="storefront-preview"><div className="storefront-preview-top"><Building2 size={18}/><span>BUSINESS PROFILE · LOCAL PREVIEW ONLY</span></div><h3>{businessDraft.name}</h3><p>{businessDraft.type} · {businessDraft.email} · {businessDraft.phone}</p><small>Identity, registration, beneficial ownership and business verification will be required before account activation.</small></div>}
    </section>
    <div className="business-section-label"><span className="overline">BUSINESS FINANCIAL TOOLS</span><p>Manage the financial side of running your business.</p></div>
    <div className="business-feature-grid">
      <article><WalletIcon/><b>Business wallet &amp; balances</b><p>Separate business SLE and USD balances, account activity and available-funds views.</p><span className="business-tool-status">Partner account required</span></article>
      <article><ArrowUpRight size={21}/><b>Receive &amp; collect payments</b><p>Business payment requests, payment links, QR acceptance and verified payment notifications.</p><span className="business-tool-status">Payment rail required</span></article>
      <article><CircleDollarSign size={21}/><b>Invoices &amp; payment records</b><p>Create invoices, track due and overdue amounts, and match incoming payments to records.</p><span className="business-tool-status">Planned business tool</span></article>
      <article><TrendingUp size={21}/><b>Cash-flow management</b><p>See money in and out, upcoming obligations and a simple cash-flow overview.</p><span className="business-tool-status">Planned business tool</span></article>
      <article><LockKeyhole size={21}/><b>Expense management</b><p>Record expenses, organise spending categories and attach notes or supporting references.</p><span className="business-tool-status">Planned business tool</span></article>
      <article><Users size={21}/><b>Team access &amp; approvals</b><p>Invite authorised staff, assign roles and set approval steps for business transactions.</p><span className="business-tool-status">Planned security feature</span></article>
      <article><CircleDollarSign size={21}/><b>Supplier &amp; staff payments</b><p>Prepare supplier payments, payroll batches and team payouts with review and approval controls.</p><span className="business-tool-status">Partner and compliance checks</span></article>
      <article><LayoutDashboard size={21}/><b>Statements &amp; business reports</b><p>Download account statements, transaction histories and summaries for bookkeeping.</p><span className="business-tool-status">Planned business tool</span></article>
    </div>
    <div className="expansion-note"><ShieldCheck size={17}/><p><b>Business account protection</b><br/>Business verification, beneficial-owner checks, role-based permissions, transaction approvals, transparent fees, safeguarding and reconciliation are required before live business accounts and payments can be activated.</p></div>
    <p className="data-note">No business bank account is opened by this screen. Wallet balances, payment collection, invoices, payouts and business reports are not connected to live financial rails yet.</p>
  </div>;
}

function WalletIcon(){return <WalletFallback/>}
function WalletFallback(){return <CircleDollarSign size={20}/>}
