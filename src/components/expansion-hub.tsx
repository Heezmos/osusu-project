"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight, BadgeCheck, Building2, Bus, CheckCircle2, ChevronRight, CircleDollarSign,
  Globe2, Heart, LayoutDashboard, LockKeyhole, Search, ShieldCheck, ShoppingBag,
  Smartphone, Store, Wifi, Zap
} from "lucide-react";
import "./expansion-hub.css";

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
  const [businessType,setBusinessType]=useState("Retail");
  const [businessEmail,setBusinessEmail]=useState("");
  const [storefront,setStorefront]=useState<{name:string;type:string;email:string}|null>(null);

  const categories=["All","Mobile","Bills","Travel","Shopping"];
  const visibleServices=useMemo(()=>services.filter(item=>(category==="All"||item.category===category)&&`${item.name} ${item.description} ${item.category}`.toLowerCase().includes(search.toLowerCase().trim())),[category,search]);

  if(section==="Services") return <div className="expansion-page">
    <div className="expansion-heading"><div><span className="overline">OSUSU SERVICES</span><h2>Everyday services, in one place</h2><p>Discover useful services without leaving Osusu. Payments will activate as approved providers come online.</p></div><span className="expansion-heading-icon"><LayoutDashboard size={23}/></span></div>
    <div className="service-search"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search airtime, bills, transport…" aria-label="Search services"/></div>
    <div className="service-categories" aria-label="Filter services">{categories.map(item=><button key={item} type="button" className={category===item?"active":""} onClick={()=>setCategory(item)}>{item}</button>)}</div>
    <div className="service-grid">{visibleServices.map(item=><article className="service-card" key={item.id}><div className="service-card-top"><span className="service-icon">{serviceIcon(item.icon)}</span><button type="button" aria-label={favourites.includes(item.id)?"Remove favourite":"Add favourite"} className={favourites.includes(item.id)?"favourite active":"favourite"} onClick={()=>setFavourites(current=>current.includes(item.id)?current.filter(id=>id!==item.id):[...current,item.id])}><Heart size={17} fill={favourites.includes(item.id)?"currentColor":"none"}/></button></div><span className="service-category">{item.category}</span><h3>{item.name}</h3><p>{item.description}</p><button type="button" className="service-open" onClick={()=>setSelected(item)}>Explore service <ChevronRight size={15}/></button></article>)}</div>
    {visibleServices.length===0&&<div className="expansion-empty">No services match that search. Try another keyword or category.</div>}
    {selected&&<div className="service-detail-backdrop" role="presentation" onClick={()=>setSelected(null)}><section className="service-detail" role="dialog" aria-modal="true" aria-labelledby="service-detail-title" onClick={e=>e.stopPropagation()}><button type="button" className="detail-close" onClick={()=>setSelected(null)} aria-label="Close">×</button><span className="service-icon">{serviceIcon(selected.icon)}</span><span className="overline">{selected.category}</span><h3 id="service-detail-title">{selected.name}</h3><p>{selected.description}</p><div className="integration-state"><LockKeyhole size={16}/><span><b>{selected.status}</b><small>This service is listed for discovery only. Osusu will not collect a payment or claim a completed transaction until an authorised provider is connected and tested.</small></span></div><button type="button" className="service-disabled" disabled>Payments not yet available</button></section></div>}
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
    <div className="expansion-heading"><div><span className="overline">OSUSU BUSINESS</span><h2>Your business, connected to Osusu</h2><p>A merchant command centre for collecting payments, managing products and understanding sales.</p></div><span className="expansion-heading-icon"><Building2 size={24}/></span></div>
    <div className="business-feature-strip"><span><Store size={22}/></span><div><b>One workspace for your business</b><small>Merchant tools are being prepared for an authorised payment and settlement network.</small></div><span className="business-pending">Partner onboarding pending</span></div>
    <div className="business-feature-grid"><article><CircleDollarSign size={21}/><b>Payment collection</b><p>Payment links, QR acceptance and transaction status checks.</p></article><article><WalletIcon/><b>Business wallet</b><p>Separate business balances, settlement history and reconciliation.</p></article><article><ShoppingBag size={21}/><b>Product catalogue</b><p>Manage products, pricing, stock and customer orders.</p></article><article><Store size={21}/><b>Digital storefront</b><p>Share a branded store page with customers and accept supported orders.</p></article></div>
    <section className="business-setup"><div><span className="overline">STOREFRONT BUILDER</span><h3>Prepare your business profile</h3><p>Create a local preview of your storefront. This is a draft on this screen only; it is not yet saved to your account or published to customers.</p></div>
      <form onSubmit={e=>{e.preventDefault();setStorefront({name:businessName.trim(),type:businessType,email:businessEmail.trim()});}}>
        <label>Business name<input value={businessName} onChange={e=>setBusinessName(e.target.value)} minLength={2} maxLength={80} placeholder="e.g. Freetown Fresh Market" required/></label>
        <label>Business category<select value={businessType} onChange={e=>setBusinessType(e.target.value)}><option>Retail</option><option>Food &amp; groceries</option><option>Transport</option><option>Professional services</option><option>Education</option><option>Other</option></select></label>
        <label>Business contact email<input type="email" value={businessEmail} onChange={e=>setBusinessEmail(e.target.value)} placeholder="business@example.com" required/></label>
        <button type="submit">Preview storefront <ChevronRight size={15}/></button>
      </form>
      {storefront&&<div className="storefront-preview"><div className="storefront-preview-top"><Store size={18}/><span>DRAFT STOREFRONT · PREVIEW ONLY</span></div><h3>{storefront.name}</h3><p>{storefront.type} · {storefront.email}</p><small>Products, checkout and settlements will appear here after merchant onboarding and provider activation.</small></div>}
    </section>
    <div className="expansion-note"><ShieldCheck size={17}/><p><b>Merchant safeguards</b><br/>Merchant verification, beneficial-owner checks, transparent fees, settlement reconciliation and dispute handling are required before live collections can be enabled.</p></div>
  </div>;
}

function WalletIcon(){return <WalletFallback/>}
function WalletFallback(){return <CircleDollarSign size={20}/>}
