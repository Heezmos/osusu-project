"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Bell, ChevronRight, CircleHelp, CreditCard, Eye, EyeOff, FileText, Gift, Home, Landmark, LockKeyhole, Menu, Plus, Search, Settings, ShieldCheck, Sparkles, TrendingUp, Wallet, X, PiggyBank } from "lucide-react";

type Service = "Overview" | "Wallet" | "Payments & Banks" | "Osusu Savings" | "Dash Card" | "Financial Management";
const services: { name: Service; icon: typeof Home }[] = [
  { name: "Overview", icon: Home }, { name: "Wallet", icon: Wallet },
  { name: "Payments & Banks", icon: Landmark }, { name: "Osusu Savings", icon: PiggyBank },
  { name: "Dash Card", icon: CreditCard }, { name: "Financial Management", icon: TrendingUp },
];
const activities = [
  { title: "Savings contribution", detail: "Osusu Goals · Today, 10:42 AM", amount: "− SLE 500.00", state: "Completed", icon: ArrowUpRight, positive: false },
  { title: "Wallet top-up", detail: "Mobile money · Yesterday, 4:18 PM", amount: "+ SLE 2,000.00", state: "Completed", icon: ArrowDownLeft, positive: true },
  { title: "Currency conversion", detail: "SLE to USD · 08 Nov, 11:02 AM", amount: "+ $120.00", state: "Completed", icon: ArrowLeftRight, positive: true },
];

export default function HomePage() {
  const [active, setActive] = useState<Service>("Overview");
  const [hidden, setHidden] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [notice, setNotice] = useState("");
  const money = (value: string) => hidden ? "••••••••" : value;
  const action = (label: string) => setNotice(label + " will be available when the secure backend and approved providers are connected.");
  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand"><span className="brand-mark">o</span><span>osusu<small>BY DELIGHT VENTURES</small></span><button className="mobile-close" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={19}/></button></div>
        <div className="nav-label">WORKSPACE</div>
        <nav>{services.map(({name, icon: Icon}) => <button key={name} onClick={() => {setActive(name);setMobileNav(false);}} className={`nav-item ${active === name ? "active" : ""}`}><Icon size={18}/><span>{name}</span>{name === active && <span className="active-dot"/>}</button>)}</nav>
        <div className="sidebar-bottom"><div className="nav-label">YOUR ACCOUNT</div><button className="nav-item" onClick={() => action("Support centre")}><CircleHelp size={18}/><span>Help & support</span></button><button className="nav-item" onClick={() => action("Settings")}><Settings size={18}/><span>Settings</span></button><div className="security-note"><ShieldCheck size={18}/><div><b>Your account matters</b><span>Security is built into every step.</span></div></div><div className="profile"><div className="avatar">HM</div><div><b>Henrison Moseray</b><span>Personal account</span></div><ChevronRight size={16}/></div></div>
      </aside>
      {mobileNav && <button className="nav-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation"/>}
      <section className="main-area">
        <header className="topbar"><button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={21}/></button><div className="crumb">My workspace <ChevronRight size={14}/><b>{active}</b></div><div className="top-actions"><div className="searchbox"><Search size={16}/><span>Search anything</span><kbd>⌘ K</kbd></div><button className="icon-button" onClick={() => action("Notifications")} aria-label="Notifications"><Bell size={18}/><i/></button><div className="top-avatar">HM</div></div></header>
        <div className="content">
          <div className="welcome-row"><div><div className="eyebrow">MONDAY, 10 NOVEMBER 2026</div><h1>{active === "Overview" ? "Good afternoon, Henrison" : active}</h1><p>{active === "Overview" ? "A clearer view of your money starts here." : "Your Osusu " + active.toLowerCase() + " space."}</p></div><button className="outline-button" onClick={() => action("Download statement")}><FileText size={16}/> Statements</button></div>
          {notice && <div className="notice"><ShieldCheck size={17}/><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss"><X size={16}/></button></div>}
          <div className="balance-grid"><article className="balance-card primary"><div className="card-top"><span className="card-label"><span className="balance-icon"><Wallet size={16}/></span> TOTAL AVAILABLE BALANCE</span><button onClick={() => setHidden(!hidden)} aria-label="Toggle balance visibility">{hidden ? <Eye size={17}/> : <EyeOff size={17}/>}</button></div><div className="balance-value">{money("SLE 28,450.00")}</div><div className="balance-bottom"><span>Across your Osusu wallets</span><span className="change"><TrendingUp size={14}/> Your money, in good company</span></div><div className="balance-actions"><button className="lime-button" onClick={() => action("Add money")}><Plus size={16}/> Add money</button><button className="dark-button" onClick={() => action("Transfer")}><ArrowUpRight size={16}/> Transfer</button><button className="dark-button" onClick={() => action("Convert currency")}><ArrowLeftRight size={16}/> Convert</button></div></article><article className="usd-card"><div className="usd-head"><span className="usd-icon">$</span><span>USD WALLET</span><span className="currency-tag">USD</span></div><div className="usd-value">{money("$1,240.50")}</div><p>Available USD balance</p><div className="usd-footer"><span>Separate currency balance</span><button onClick={() => setActive("Wallet")}>View wallet <ChevronRight size={15}/></button></div></article></div>
          <section className="quick-section"><div className="section-heading"><div><h2>Quick actions</h2><p>Common tasks, one tap away.</p></div></div><div className="quick-grid">{[{label:"Deposit",sub:"Add money",icon:ArrowDownLeft},{label:"Send",sub:"Move funds",icon:ArrowUpRight},{label:"Save",sub:"Build a goal",icon:PiggyBank},{label:"Pay",sub:"Pay a bill",icon:CreditCard},{label:"Invite",sub:"Grow your circle",icon:Gift}].map(({label,sub,icon:Icon})=><button className="quick-card" key={label} onClick={() => action(label)}><span className="quick-icon"><Icon size={18}/></span><span><b>{label}</b><small>{sub}</small></span><ChevronRight size={15} className="quick-arrow"/></button>)}</div></section>
          <div className="lower-grid"><article className="panel savings-panel"><div className="panel-heading"><div><h2>Osusu Savings</h2><p>Your goals are moving forward.</p></div><button onClick={() => setActive("Osusu Savings")}>All goals <ChevronRight size={15}/></button></div><div className="savings-total"><div><span>TOTAL SAVED</span><b>{money("SLE 12,800.00")}</b></div><span className="growth-pill"><TrendingUp size={13}/> On your way</span></div><div className="goal"><div className="goal-line"><b>School fees</b><span>SLE 8,400 <small>of 12,000</small></span></div><div className="progress"><i style={{width:"70%"}}/></div><small className="goal-caption">70% of your goal</small></div><div className="goal"><div className="goal-line"><b>Emergency fund</b><span>SLE 2,250 <small>of 5,000</small></span></div><div className="progress"><i className="lime-progress" style={{width:"45%"}}/></div><small className="goal-caption">45% of your goal</small></div><button className="create-goal" onClick={() => action("Create savings goal")}><Plus size={15}/> Create a savings goal</button></article>
          <article className="panel activity-panel"><div className="panel-heading"><div><h2>Recent activity</h2><p>Your latest wallet movements.</p></div><button onClick={() => setActive("Wallet")}>See all <ChevronRight size={15}/></button></div><div className="activity-list">{activities.map(({title,detail,amount,state,icon:Icon,positive})=><div className="activity-row" key={title}><span className="activity-icon"><Icon size={17}/></span><div className="activity-copy"><b>{title}</b><small>{detail}</small></div><div className="activity-amount"><b className={positive?"positive":""}>{money(amount)}</b><small><i/> {state}</small></div></div>)}</div><div className="activity-foot"><LockKeyhole size={14}/> Transaction details are securely recorded.</div></article></div>
          <div className="assistant-strip"><span className="assistant-icon"><Sparkles size={18}/></span><div><b>Small steps make a difference.</b><p>Set a goal, build a habit and keep your progress in view.</p></div><button onClick={() => setActive("Financial Management")}>Explore insights <ChevronRight size={15}/></button></div>
          <footer><span>© 2026 Osusu · A Delight Ventures product</span><span><ShieldCheck size={13}/> Secure by design <i/> Sierra Leone first</span></footer>
          <div className="prototype-note">DESIGN PREVIEW · Sample balances and transactions only. No real money movement is enabled.</div>
        </div>
      </section>
    </main>
  );
}
