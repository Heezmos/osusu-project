"use client";

import { useState } from "react";
import {
  ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Bell, ChevronLeft, ChevronRight,
  CreditCard, Eye, EyeOff, Home, Landmark, LockKeyhole, Menu, Plus, Search,
  Settings, ShieldCheck, Sparkles, TrendingUp, Wallet, X, PiggyBank, Target,
  CircleHelp, ChartNoAxesCombined, UserRound, Gift, MoreHorizontal
} from "lucide-react";

type Screen = "Savings Account" | "Total Cards" | "Performance" | "Home";
const nav = [
  { name: "Home" as Screen, icon: Home },
  { name: "Savings Account" as Screen, icon: PiggyBank },
  { name: "Total Cards" as Screen, icon: CreditCard },
  { name: "Performance" as Screen, icon: ChartNoAxesCombined },
];
const activity = [
  { name: "Wise Transfer", detail: "04 Nov 2026 · 7:20 PM", amount: "SLE 1,250.00", type: "Deposit", icon: ArrowDownLeft },
  { name: "Stephen", detail: "06 Nov 2026 · 8:20 AM", amount: "SLE 460.00", type: "Received", icon: ArrowDownLeft },
  { name: "Savings contribution", detail: "08 Nov 2026 · 3:20 PM", amount: "SLE 730.20", type: "Saved", icon: PiggyBank },
];

export default function HomePage() {
  const [screen, setScreen] = useState<Screen>("Home");
  const [hidden, setHidden] = useState(false);
  const [notice, setNotice] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const money = (value: string) => hidden ? "••••••••" : value;
  const action = (name: string) => setNotice(name + " is a design preview. It will be enabled after secure provider integrations, compliance checks and testing.");
  const changeScreen = (next: Screen) => { setScreen(next); setMenuOpen(false); };
  return (
    <main className="osusu-app">
      <aside className={`side-panel ${menuOpen ? "side-open" : ""}`}>
        <div className="brand"><span className="brand-symbol">o</span><span>osusu<small>BY DELIGHT VENTURES</small></span><button className="close-menu" onClick={() => setMenuOpen(false)}><X size={19}/></button></div>
        <p className="nav-caption">YOUR SPACE</p>
        {nav.map(({name,icon:Icon}) => <button key={name} className={`side-link ${screen===name?"selected":""}`} onClick={() => changeScreen(name)}><Icon size={18}/>{name}{screen===name && <i/>}</button>)}
        <div className="side-spacer"/>
        <div className="side-help"><ShieldCheck size={19}/><div><b>Your money matters</b><span>Security is part of every step.</span></div></div>
        <button className="side-link" onClick={() => action("Help & support")}><CircleHelp size={18}/>Help & support</button>
        <button className="side-link" onClick={() => action("Settings")}><Settings size={18}/>Settings</button>
        <div className="profile"><span className="avatar">HM</span><span><b>Henrison Moseray</b><small>Personal account</small></span><MoreHorizontal size={19}/></div>
      </aside>
      {menuOpen && <button className="scrim" onClick={() => setMenuOpen(false)} aria-label="Close menu"/>}
      <section className="workspace">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={21}/></button>
          <div className="breadcrumb">My Osusu <ChevronRight size={14}/><b>{screen}</b></div>
          <div className="top-tools"><div className="search"><Search size={16}/><span>Search transactions</span></div><button className="bell" onClick={() => action("Notifications")} aria-label="Notifications"><Bell size={19}/><i/></button><span className="avatar top-avatar">HM</span></div>
        </header>
        <div className="page-content">
          <div className="welcome"><div><span className="overline">YOUR MONEY. YOUR FUTURE.</span><h1>{screen === "Home" ? "Welcome back, Henrison" : screen}</h1><p>{screen === "Home" ? "A better view of your savings starts here." : "Keep your money moving towards what matters."}</p></div><button className="date-pill"> <span/> Personal account</button></div>
          {notice && <div className="notice"><ShieldCheck size={17}/><span>{notice}</span><button onClick={() => setNotice("")}><X size={16}/></button></div>}
          {screen === "Total Cards" ? (
            <>
              <section className="total-card"><div className="total-card-head"><span>YOUR TOTAL BALANCE</span><button onClick={() => setHidden(!hidden)}>{hidden?<Eye size={17}/>:<EyeOff size={17}/>}</button></div><h2>{money("SLE 998,216.58")}</h2><p><TrendingUp size={14}/> Your money, organised in one place</p><div className="account-splits"><div><span className="yellow-dot"/>Savings Account <b>{money("SLE 825,912.40")}</b></div><div><span className="blue-dot"/>Spend Account <b>{money("SLE 172,304.18")}</b></div></div></section>
              <div className="section-title"><div><h2>Manage cards</h2><p>Stay in control of your Osusu cards.</p></div><button onClick={() => action("Card options")}>More options <ChevronRight size={15}/></button></div>
              <div className="manage-list"><button onClick={() => action("Lock card")}><span className="manage-icon"><LockKeyhole/></span><span><b>Lock card</b><small>Temporarily pause card activity</small></span><ChevronRight/></button><button onClick={() => action("Card usage controls")}><span className="manage-icon"><CreditCard/></span><span><b>Control card usage</b><small>Manage limits and transaction settings</small></span><ChevronRight/></button><button onClick={() => action("Replace card")}><span className="manage-icon"><ArrowLeftRight/></span><span><b>Replace card</b><small>For a lost, stolen or damaged card</small></span><ChevronRight/></button></div>
            </>
          ) : screen === "Performance" ? (
            <>
              <section className="performance-card"><div className="performance-top"><div><span className="muted-label">SAVINGS PERFORMANCE</span><h2>{money("SLE 8,250.00")}</h2><p><TrendingUp size={14}/> Growth overview · Illustrative data</p></div><span className="period">This year⌄</span></div><div className="chart"><div className="chart-y"><span>10k</span><span>7.5k</span><span>5k</span><span>2.5k</span><span>0</span></div><svg viewBox="0 0 650 190" preserveAspectRatio="none" role="img" aria-label="Illustrative savings growth chart"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#c7ed39" stopOpacity=".28"/><stop offset="100%" stopColor="#c7ed39" stopOpacity="0"/></linearGradient></defs><path d="M0 160 C55 160 60 150 105 148 S155 120 205 125 S260 130 310 105 S370 115 420 85 S480 80 520 45 S600 35 650 20 L650 190 L0 190Z" fill="url(#area)"/><path d="M0 160 C55 160 60 150 105 148 S155 120 205 125 S260 130 310 105 S370 115 420 85 S480 80 520 45 S600 35 650 20" fill="none" stroke="#c8ee3b" strokeWidth="3" vectorEffect="non-scaling-stroke"/><circle cx="520" cy="45" r="5" fill="#c8ee3b" stroke="#123e31" strokeWidth="3"/></svg></div><div className="chart-months"><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span></div></section>
              <div className="section-title"><div><h2>Your rate breakdown</h2><p>Understand how your savings plan works.</p></div></div><div className="rate-card"><div><span className="yellow-dot"/>Illustrative tier A <b>Rate to be confirmed</b></div><div><span className="blue-dot"/>Illustrative tier B <b>Rate to be confirmed</b></div><p>Any returns will depend on the specific approved savings product, its terms and applicable regulation. No rate is being offered in this preview.</p></div>
            </>
          ) : (
            <>
              <div className="account-grid">
                <section className="savings-hero"><div className="hero-top"><span><PiggyBank size={17}/> SAVINGS ACCOUNT</span><button onClick={() => setHidden(!hidden)}>{hidden?<Eye size={17}/>:<EyeOff size={17}/>}</button></div><div className="hero-balance">{money("SLE 8,250.00")}</div><div className="hero-growth"><Sparkles size={14}/> Your savings journey, in progress</div><div className="hero-actions"><button className="lime-action" onClick={() => action("Transfer") }><ArrowLeftRight size={16}/> Transfer</button><button className="blue-action" onClick={() => action("Set savings target")}><Target size={16}/> Set Target</button><button className="round-action" onClick={() => action("Savings settings")}><Settings size={17}/></button></div><div className="hero-glow"/></section>
                <section className="spend-card"><div className="spend-title"><span>SPEND ACCOUNT</span><span className="spend-mark">$</span></div><h2>{money("$1,240.50")}</h2><p>Available USD balance</p><button onClick={() => changeScreen("Total Cards")}>View accounts <ChevronRight size={15}/></button></section>
              </div>
              <div className="section-title"><div><h2>My savings goals</h2><p>Little by little, you’re getting there.</p></div><button onClick={() => action("Create a savings goal")}><Plus size={15}/> New goal</button></div>
              <div className="goals-grid"><article className="goal-card"><div className="goal-head"><span className="goal-icon"><Landmark size={18}/></span><span>75%</span></div><b>School fees</b><p>{money("SLE 6,000")} <small>of SLE 8,000</small></p><div className="goal-track"><i style={{width:"75%"}}/></div></article><article className="goal-card"><div className="goal-head"><span className="goal-icon lime"><Home size={18}/></span><span>40%</span></div><b>House project</b><p>{money("SLE 4,000")} <small>of SLE 10,000</small></p><div className="goal-track"><i style={{width:"40%"}}/></div></article><button className="add-goal" onClick={() => action("Create a savings goal")}><Plus size={20}/><span>Create a new goal</span></button></div>
              <div className="section-title"><div><h2>Transaction history</h2><p>Your recent account activity.</p></div><button onClick={() => action("Full transaction history")}>See details <ChevronRight size={15}/></button></div>
              <section className="transactions">{activity.map(({name,detail,amount,type,icon:Icon})=><div className="transaction" key={name}><span className="transaction-icon"><Icon size={17}/></span><span className="transaction-name"><b>{name}</b><small>{detail}</small></span><span className="transaction-amount"><b>{money(amount)}</b><small>{type}</small></span></div>)}</section>
            </>
          )}
          <div className="support-banner"><span><Gift size={18}/></span><div><b>Good habits build brighter futures.</b><small>Keep saving, keep growing. Your next milestone is within reach.</small></div><button onClick={() => action("Osusu rewards")}>Explore <ChevronRight size={15}/></button></div>
          <footer><span>© 2026 Osusu · A Delight Ventures product</span><span><ShieldCheck size={13}/> Secure design preview <i/> Sierra Leone</span></footer>
          <p className="disclaimer">CONCEPT PREVIEW · All balances, names, chart values and transactions shown are illustrative only. No real funds, cards, transfers or interest rates are active.</p>
        </div>
        <nav className="mobile-tabs">{nav.map(({name,icon:Icon})=><button key={name} className={screen===name?"tab-active":""} onClick={() => changeScreen(name)}><Icon size={19}/><small>{name==="Savings Account"?"Osusu":name==="Performance"?"Growth":name==="Total Cards"?"Cards":name}</small></button>)}</nav>
      </section>
    </main>
  );
}
