"use client";

import { useMemo, useState } from "react";
import {
  Activity, ArrowDownToLine, ArrowUpRight, Bell, Blocks, BookOpen, Check, ChevronDown,
  ChevronRight, CircleHelp, Code2, Copy, Database, Ellipsis, ExternalLink, FileCode2,
  Filter, GitBranch, Globe2, KeyRound, Layers3, Link2, ListFilter, LockKeyhole, Menu,
  MoreHorizontal, Plus, RefreshCw, Search, Settings2, ShieldCheck, Terminal, Webhook,
  Workflow, Zap
} from "lucide-react";

type Section = "Overview" | "API Projects" | "Integrations" | "Workflows" | "Events & Webhooks" | "Activity & Logs" | "Developer Portal" | "Team & Access" | "Settings";

const nav: { label: Section; icon: typeof Activity; group: string }[] = [
  { label: "Overview", icon: Layers3, group: "Workspace" },
  { label: "API Projects", icon: Code2, group: "Build" },
  { label: "Integrations", icon: Blocks, group: "Build" },
  { label: "Workflows", icon: Workflow, group: "Build" },
  { label: "Events & Webhooks", icon: Webhook, group: "Operate" },
  { label: "Activity & Logs", icon: Activity, group: "Operate" },
  { label: "Developer Portal", icon: BookOpen, group: "Resources" },
  { label: "Team & Access", icon: ShieldCheck, group: "Admin" },
  { label: "Settings", icon: Settings2, group: "Admin" },
];

const integrations = [
  { name: "EduBridge Africa", type: "Education platform", detail: "Student records · Academic data", status: "Connected", initials: "EA", tone: "violet", sync: "2 min ago" },
  { name: "E-School", type: "School management", detail: "Enrolment · Administration", status: "Connected", initials: "ES", tone: "blue", sync: "8 min ago" },
  { name: "Ecofarms", type: "Agribusiness", detail: "Farm records · Inventory", status: "Attention", initials: "EF", tone: "green", sync: "34 min ago" },
  { name: "EzeGo", type: "Mobility platform", detail: "Bookings · Dispatch events", status: "Sandbox", initials: "EZ", tone: "orange", sync: "Not synced" },
];

const activity = [
  { id: "evt_8F2A91", title: "student.record.updated", source: "EduBridge Africa", status: "Delivered", time: "10:42:18", latency: "124 ms" },
  { id: "evt_8F2A90", title: "inventory.stock.changed", source: "Ecofarms", status: "Retrying", time: "10:41:52", latency: "—" },
  { id: "evt_8F2A8F", title: "order.created", source: "Commerce Sandbox", status: "Delivered", time: "10:39:06", latency: "86 ms" },
  { id: "evt_8F2A8E", title: "dispatch.task.created", source: "EzeGo", status: "Delivered", time: "10:36:44", latency: "142 ms" },
];

export default function DvlConnectPage() {
  const [active, setActive] = useState<Section>("Overview");
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [notice, setNotice] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projects, setProjects] = useState(["DVL Internal Systems", "Education Integrations", "Commerce Sandbox"]);
  const [workflowRunning, setWorkflowRunning] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const filteredIntegrations = useMemo(() => integrations.filter(item => (item.name + item.type + item.detail).toLowerCase().includes(query.toLowerCase())), [query]);

  function createProject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!projectName.trim()) return;
    setProjects(current => [...current, projectName.trim()]);
    setProjectName("");
    setShowCreate(false);
    setNotice("API project created in this local preview.");
  }

  const title = active === "Overview" ? "Overview" : active;
  const subtitle: Record<Section, string> = {
    "Overview": "Your integration infrastructure, at a glance.",
    "API Projects": "Create and manage the projects that power your integrations.",
    "Integrations": "Connect business systems and keep information moving.",
    "Workflows": "Orchestrate reliable processes across your connected systems.",
    "Events & Webhooks": "Inspect events and manage outgoing webhook endpoints.",
    "Activity & Logs": "Trace requests, investigate failures and monitor activity.",
    "Developer Portal": "Everything your team needs to build with DVL Connect.",
    "Team & Access": "Manage workspace members and their permissions.",
    "Settings": "Configure your DVL Connect workspace."
  };

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><span>D</span><i /></div>
          <div><div className="brand-name">DVL <b>Connect</b></div><div className="brand-caption">BY DELIGHT VENTURES</div></div>
          <button className="icon-button mobile-close" onClick={() => setMobileNav(false)} aria-label="Close menu">×</button>
        </div>
        <button className="workspace-switch"><div className="workspace-avatar">DV</div><span><b>DVL Ventures Ltd.</b><small>Workspace</small></span><ChevronDown size={15}/></button>
        <div className="environment"><span className="environment-dot"/> SANDBOX ENVIRONMENT</div>
        {["Workspace", "Build", "Operate", "Resources", "Admin"].map(group => (
          <div className="nav-group" key={group}>
            <div className="nav-label">{group}</div>
            {nav.filter(item => item.group === group).map(item => {
              const Icon = item.icon;
              return <button key={item.label} className={`nav-link ${active === item.label ? "active" : ""}`} onClick={() => { setActive(item.label); setMobileNav(false); }}>
                <Icon size={17}/><span>{item.label}</span>{item.label === "Activity & Logs" && <i className="nav-count">4</i>}
              </button>;
            })}
          </div>
        ))}
        <div className="sidebar-bottom">
          <div className="help-card"><div className="help-icon"><CircleHelp size={16}/></div><b>Need a hand?</b><p>Explore our docs or talk to the team.</p><button onClick={() => setActive("Developer Portal")}>Visit developer portal <ArrowUpRight size={13}/></button></div>
          <div className="user-profile"><div className="user-avatar">HM</div><span><b>Workspace Owner</b><small>Administrator</small></span><MoreHorizontal size={18}/></div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={20}/></button>
          <div className="breadcrumbs">DVL Connect <ChevronRight size={14}/> <span>{active}</span></div>
          <div className="top-actions"><div className="system-status"><i/> All systems operational</div><button className="icon-button notification-button" aria-label="Notifications" onClick={() => setNotice("You are all caught up.")}><Bell size={18}/><i/></button><div className="top-avatar">HM</div></div>
        </header>

        <div className="content-wrap">
          <div className="page-heading"><div><div className="eyebrow">DVL CONNECT / WORKSPACE</div><h1>{title}</h1><p>{subtitle[active]}</p></div><div className="heading-actions"><button className="button button-secondary" onClick={() => setNotice("Workspace refreshed. This preview uses sample data.")}><RefreshCw size={15}/> Refresh</button>{active === "API Projects" && <button className="button button-primary" onClick={() => setShowCreate(true)}><Plus size={16}/> New API project</button>}</div></div>

          {notice && <div className="notice"><Check size={16}/>{notice}<button onClick={() => setNotice("")}>×</button></div>}

          {active === "Overview" && <>
            <div className="welcome-strip"><div className="welcome-icon"><Zap size={19}/></div><div><b>Your systems. Connected.</b><span>One infrastructure layer for data, events and workflows across your business.</span></div><button onClick={() => setActive("Developer Portal")}>Explore quickstart <ArrowUpRight size={14}/></button></div>
            <div className="metric-grid">
              <Metric label="API requests" value="24,891" change="+12.8%" note="vs. previous 7 days" icon={Activity} />
              <Metric label="Active integrations" value="08" change="+2" note="this month" icon={Link2} />
              <Metric label="Events processed" value="18,204" change="+8.4%" note="vs. previous 7 days" icon={Webhook} />
              <Metric label="Success rate" value="99.6%" change="+0.3%" note="vs. previous 7 days" icon={ShieldCheck} />
            </div>
            <div className="dashboard-grid">
              <div className="panel activity-panel"><div className="panel-heading"><div><h2>API activity</h2><p>Request volume over the last 7 days</p></div><button className="select-button">Last 7 days <ChevronDown size={14}/></button></div><div className="chart-legend"><span><i className="legend-blue"/> Successful requests</span><span><i className="legend-light"/> Failed requests</span></div><div className="chart"><div className="chart-y"><span>5k</span><span>4k</span><span>3k</span><span>2k</span><span>1k</span><span>0</span></div><div className="chart-main"><div className="chart-gridlines"><i/><i/><i/><i/><i/><i/></div><div className="bars">{[["Mon",62,5],["Tue",78,4],["Wed",56,3],["Thu",88,6],["Fri",72,4],["Sat",44,2],["Sun",68,3]].map(([day,h,f])=><div className="bar-column" key={String(day)}><div className="bar-stack" style={{height:`${h}%`}}><i style={{height:`${f}%`}}/><b/></div><span>{day}</span></div>)}</div></div></div></div>
              <div className="panel quick-panel"><div className="panel-heading"><div><h2>Quick actions</h2><p>Get things moving</p></div><Ellipsis size={18}/></div><QuickAction icon={Code2} title="Create an API project" desc="Start a new integration project" onClick={() => {setActive("API Projects");setShowCreate(true);}}/><QuickAction icon={Link2} title="Connect a system" desc="Add a new integration" onClick={() => setActive("Integrations")}/><QuickAction icon={Workflow} title="Build a workflow" desc="Automate a business process" onClick={() => setActive("Workflows")}/><QuickAction icon={BookOpen} title="Read the documentation" desc="Explore APIs and examples" onClick={() => setActive("Developer Portal")}/></div>
            </div>
            <div className="panel integrations-panel"><div className="panel-heading"><div><h2>Connected systems</h2><p>Your latest integration connections</p></div><button className="text-action" onClick={() => setActive("Integrations")}>View all <ArrowUpRight size={14}/></button></div><IntegrationTable rows={integrations.slice(0,4)}/></div>
            <div className="panel recent-panel"><div className="panel-heading"><div><h2>Recent activity</h2><p>Latest events across your workspace</p></div><button className="text-action" onClick={() => setActive("Activity & Logs")}>View activity <ArrowUpRight size={14}/></button></div><ActivityTable/></div>
          </>}

          {active === "API Projects" && <div className="panel section-panel"><div className="panel-heading"><div><h2>Your API projects</h2><p>Organise credentials, environments and integration workloads.</p></div><button className="button button-primary" onClick={() => setShowCreate(true)}><Plus size={15}/> Create project</button></div><div className="search-row"><div className="search-field"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search projects..."/></div><button className="button button-secondary"><Filter size={15}/> Filters</button></div><div className="project-list">{projects.map((project,i)=><div className="project-row" key={project}><div className="project-icon"><Code2 size={18}/></div><div className="project-info"><b>{project}</b><small>Project ID: dvl_{String(i+1).padStart(3,"0")}_sandbox · Created in Sandbox</small></div><span className="status-pill status-sandbox">Sandbox</span><button className="icon-button" onClick={() => setNotice(`Opened settings for ${project} (preview only).`)}><MoreHorizontal size={18}/></button></div>)}</div></div>}

          {active === "Integrations" && <div className="panel section-panel"><div className="panel-heading"><div><h2>System connections</h2><p>Connect the tools your organisation already uses.</p></div><button className="button button-primary" onClick={() => setNotice("Connection catalogue opened in preview mode.")}><Plus size={15}/> Add integration</button></div><div className="search-row"><div className="search-field"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search integrations..."/></div><button className="button button-secondary"><ListFilter size={15}/> All types</button></div><IntegrationTable rows={filteredIntegrations}/><div className="catalogue-grid"><CatalogCard icon={Globe2} title="REST API" desc="Connect any system with an HTTP API."/><CatalogCard icon={Webhook} title="Webhooks" desc="Send and receive real-time business events."/><CatalogCard icon={Database} title="Data exchange" desc="Synchronise structured records securely."/><CatalogCard icon={GitBranch} title="Custom connector" desc="Build a reusable integration adapter."/></div></div>}

          {active === "Workflows" && <div className="workflow-layout"><div className="panel workflow-builder"><div className="panel-heading"><div><h2>Workflow canvas</h2><p>Student record synchronisation · Draft</p></div><span className="status-pill status-sandbox">Sandbox</span></div><div className="flow-step"><span className="step-icon trigger"><Zap size={17}/></span><div><small>TRIGGER</small><b>Student record updated</b><span>EduBridge Africa · student.updated</span></div><Check size={16} className="step-check"/></div><div className="flow-connector"/><div className="flow-step"><span className="step-icon action"><ArrowUpRight size={17}/></span><div><small>ACTION</small><b>Synchronise accounting record</b><span>E-School · update_student_record</span></div><Check size={16} className="step-check"/></div><div className="flow-connector"/><div className="flow-step"><span className="step-icon condition"><Bell size={17}/></span><div><small>CONDITION & ACTION</small><b>Notify relevant administrator</b><span>Send notification when sync succeeds</span></div><Check size={16} className="step-check"/></div><button className="add-step" onClick={() => setNotice("A new workflow step can be configured in the full builder.")}><Plus size={15}/> Add step</button><div className="workflow-footer"><span>Last edited just now</span><div><button className="button button-secondary" onClick={() => setNotice("Workflow saved as a local draft.")}>Save draft</button><button className="button button-primary" onClick={() => {setWorkflowRunning(true);setNotice("Test simulation completed. 3 steps passed; no external systems were contacted.");}}><Zap size={14}/> {workflowRunning ? "Run again" : "Test workflow"}</button></div></div></div><div className="panel side-info"><h2>Workflow details</h2><p>Automate repeatable processes across connected systems without moving data manually.</p><div className="info-line"><span>Status</span><b>Draft</b></div><div className="info-line"><span>Steps</span><b>3</b></div><div className="info-line"><span>Environment</span><b>Sandbox</b></div><div className="info-line"><span>Last run</span><b>Not yet run</b></div></div></div>}

          {active === "Events & Webhooks" && <div className="panel section-panel"><div className="panel-heading"><div><h2>Event stream</h2><p>Business events captured across your integrations.</p></div><button className="button button-primary" onClick={() => setNotice("Webhook endpoint created as a local preview placeholder.")}><Plus size={15}/> Add endpoint</button></div><ActivityTable/><div className="webhook-note"><LockKeyhole size={17}/><div><b>Webhook security</b><p>Production endpoints should use signed payloads, replay protection and secret rotation. This preview does not send real webhooks.</p></div></div></div>}

          {active === "Activity & Logs" && <div className="panel section-panel"><div className="panel-heading"><div><h2>Request logs</h2><p>Trace API requests and inspect integration activity.</p></div><button className="button button-secondary" onClick={() => setNotice("Sample logs exported in preview mode.")}><ArrowDownToLine size={15}/> Export logs</button></div><div className="search-row"><div className="search-field"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search event, source or request ID..."/></div><button className="button button-secondary"><Filter size={15}/> Filters</button></div><ActivityTable/></div>}

          {active === "Developer Portal" && <div className="developer-grid"><div className="panel docs-hero"><div className="docs-icon"><Terminal size={22}/></div><div className="eyebrow">DEVELOPER QUICKSTART</div><h2>Build your first connection.</h2><p>Use the DVL Connect API to exchange business data and trigger workflows across your connected systems.</p><button className="button button-primary" onClick={() => setNotice("Quickstart guide selected. Documentation is sample content in this preview.")}>Open quickstart <ArrowUpRight size={15}/></button></div><div className="panel docs-card"><h2>API reference</h2><p>Explore endpoints, request formats and response examples.</p><div className="code-sample"><span>GET</span> /v1/projects<br/><span>GET</span> /v1/integrations<br/><span>POST</span> /v1/workflows/run</div><button className="text-action" onClick={() => setNotice("API reference opened in preview mode.")}>Browse endpoints <ChevronRight size={14}/></button></div><div className="panel docs-card"><h2>Sandbox credentials</h2><p>Test your integration without connecting live business systems.</p><div className="credential"><KeyRound size={15}/><code>dvl_test_••••••••••••••••</code><button onClick={() => setNotice("Demo credential copied (placeholder only).")}><Copy size={14}/></button></div><span className="muted-caption">Placeholder credential · Not valid for API access</span></div><div className="panel docs-card"><h2>Core concepts</h2><p>Understand the building blocks of the platform.</p><div className="concept-list"><span><Code2 size={15}/> API projects</span><span><Webhook size={15}/> Events & webhooks</span><span><Workflow size={15}/> Workflow orchestration</span><span><ShieldCheck size={15}/> Authentication & access</span></div></div></div>}

          {active === "Team & Access" && <div className="panel section-panel"><div className="panel-heading"><div><h2>Workspace members</h2><p>Control who can access your integrations and projects.</p></div><button className="button button-primary" onClick={() => setNotice("Invite flow opened in preview mode.")}><Plus size={15}/> Invite member</button></div><div className="member-row"><div className="user-avatar">HM</div><div className="project-info"><b>Workspace Owner</b><small>owner@dvlventures.com · You</small></div><span className="role-pill">Owner</span><span className="member-active">Active</span></div><div className="member-row"><div className="user-avatar avatar-blue">AD</div><div className="project-info"><b>API Developer</b><small>developer@example.com</small></div><span className="role-pill">Developer</span><span className="member-active">Active</span></div><div className="member-row"><div className="user-avatar avatar-green">VA</div><div className="project-info"><b>View-only Analyst</b><small>analyst@example.com</small></div><span className="role-pill">Viewer</span><span className="member-active">Active</span></div></div>}

          {active === "Settings" && <div className="settings-grid"><div className="panel settings-card"><h2>Workspace profile</h2><p>Basic information about your organisation.</p><label>Workspace name<input value="DVL Ventures Ltd." readOnly/></label><label>Platform name<input value="DVL Connect" readOnly/></label><label>Default region<input value="Sierra Leone · Africa" readOnly/></label><button className="button button-secondary" onClick={() => setNotice("Workspace settings are read-only in this preview.")}>Save changes</button></div><div className="panel settings-card"><h2>Environment settings</h2><p>Keep test and production resources separate.</p><div className="environment-row"><span><i className="environment-dot"/> Sandbox</span><span className="status-pill status-connected">Active</span></div><div className="environment-row"><span><i className="environment-dot muted-dot"/> Production</span><span className="status-pill status-pending">Not configured</span></div><div className="security-callout"><ShieldCheck size={17}/><span>Production access will require security review and environment configuration.</span></div></div></div>}
        </div>
        <footer className="app-footer"><span>© 2026 Delight Ventures · DVL Connect</span><span><i/> DEMO ENVIRONMENT — simulated data only</span><a href="https://github.com/Heezmos/osusu-project" target="_blank" rel="noreferrer">Source repository <ExternalLink size={12}/></a></footer>
      </section>

      {showCreate && <div className="modal-backdrop" onClick={() => setShowCreate(false)}><form className="modal" onSubmit={createProject} onClick={e => e.stopPropagation()}><button type="button" className="modal-close" onClick={() => setShowCreate(false)}>×</button><div className="modal-icon"><Code2 size={20}/></div><h2>Create API project</h2><p>Give your project a name. A sandbox environment will be created for this preview.</p><label>Project name<input autoFocus value={projectName} onChange={e=>setProjectName(e.target.value)} placeholder="e.g. Customer Data API" required/></label><div className="modal-hint"><ShieldCheck size={15}/> Sandbox only · No live credentials generated</div><div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button className="button button-primary" type="submit"><Plus size={15}/> Create project</button></div></form></div>}
    </main>
  );
}

function Metric({label,value,change,note,icon:Icon}:{label:string;value:string;change:string;note:string;icon:typeof Activity}) {
  return <div className="metric-card"><div className="metric-top"><span>{label}</span><div><Icon size={17}/></div></div><div className="metric-value">{value}</div><div className="metric-foot"><b>{change}</b><span>{note}</span></div></div>;
}
function QuickAction({icon:Icon,title,desc,onClick}:{icon:typeof Activity;title:string;desc:string;onClick:()=>void}) {
  return <button className="quick-action" onClick={onClick}><span className="quick-icon"><Icon size={17}/></span><span><b>{title}</b><small>{desc}</small></span><ChevronRight size={16}/></button>;
}
function IntegrationTable({rows}:{rows:typeof integrations}) {
  return <div className="table-wrap"><table><thead><tr><th>INTEGRATION</th><th>TYPE</th><th>STATUS</th><th>LAST SYNC</th><th/></tr></thead><tbody>{rows.map(row=><tr key={row.name}><td><div className="integration-name"><span className={`integration-logo ${row.tone}`}>{row.initials}</span><b>{row.name}</b></div></td><td><span className="table-muted">{row.type}</span></td><td><span className={`status-pill ${row.status==="Connected"?"status-connected":row.status==="Attention"?"status-pending":"status-sandbox"}`}>{row.status}</span></td><td><span className="table-muted">{row.sync}</span></td><td><button className="icon-button"><MoreHorizontal size={17}/></button></td></tr>)}</tbody></table>{rows.length===0&&<div className="empty-state">No integrations match your search.</div>}</div>;
}
function ActivityTable() {
  return <div className="table-wrap"><table><thead><tr><th>EVENT</th><th>SOURCE</th><th>STATUS</th><th>TIME</th><th>LATENCY</th></tr></thead><tbody>{activity.map(item=><tr key={item.id}><td><div className="event-name"><b>{item.title}</b><small>{item.id}</small></div></td><td><span className="table-muted">{item.source}</span></td><td><span className={`status-pill ${item.status==="Delivered"?"status-connected":"status-pending"}`}>{item.status}</span></td><td><span className="table-muted">{item.time}</span></td><td><span className="table-muted">{item.latency}</span></td></tr>)}</tbody></table></div>;
}
function CatalogCard({icon:Icon,title,desc}:{icon:typeof Activity;title:string;desc:string}) {
  return <button className="catalog-card"><span><Icon size={18}/></span><b>{title}</b><small>{desc}</small><ChevronRight size={15}/></button>;
}
