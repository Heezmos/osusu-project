"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowRight, Blocks, BookOpen, Check, ChevronRight, Code2,
  Layers3, Link2, LockKeyhole, LogOut, Plus, RefreshCw, ShieldCheck,
  Terminal, Webhook, Workflow, Zap
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

type Organisation = { id: string; name: string; slug: string };
type ApiProject = {
  id: string;
  organisation_id: string;
  name: string;
  description: string | null;
  environment: "development" | "sandbox" | "production";
  status: "active" | "paused" | "archived";
  created_at: string;
};
type Section = "Overview" | "API Projects" | "Integrations" | "Workflows" | "Events & Webhooks" | "Activity & Logs" | "Developer Portal" | "Team & Access" | "Settings";
type AuthUserLookup = { data: { user: { id: string; email?: string | null } | null }; error: { message: string } | null };

const navigation: { label: Section; icon: typeof Activity; group: string }[] = [
  { label: "Overview", icon: Layers3, group: "Workspace" },
  { label: "API Projects", icon: Code2, group: "Build" },
  { label: "Integrations", icon: Blocks, group: "Build" },
  { label: "Workflows", icon: Workflow, group: "Build" },
  { label: "Events & Webhooks", icon: Webhook, group: "Operate" },
  { label: "Activity & Logs", icon: Activity, group: "Operate" },
  { label: "Developer Portal", icon: BookOpen, group: "Resources" },
  { label: "Team & Access", icon: ShieldCheck, group: "Admin" },
  { label: "Settings", icon: LockKeyhole, group: "Admin" },
];

export default function DvlConnectPage() {
  const supabase = useMemo(() => {
    try { return createClient(); } catch { return null; }
  }, []);
  const [userEmail, setUserEmail] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState("");
  const [active, setActive] = useState<Section>("Overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [environment, setEnvironment] = useState<"development" | "sandbox" | "production">("sandbox");
  const [savingProject, setSavingProject] = useState(false);
  const [notice, setNotice] = useState("");

  const loadWorkspace = useCallback(async (userId: string) => {
    if (!supabase) return;
    setLoadingData(true);
    setDataError("");
    try {
      const db = supabase.schema("dvl_connect");
      const { data: initialOrg, error: orgError } = await db
        .from("organisations")
        .select("id,name,slug")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (orgError) throw orgError;
      let org = initialOrg;

      if (!org) {
        const slug = `dvl-workspace-${userId.slice(0, 8)}`;
        const created = await db.from("organisations").insert({
          name: "Delight Ventures",
          slug,
          organisation_type: "dvl_venture",
          created_by: userId,
        }).select("id,name,slug").single();
        if (created.error) throw created.error;
        org = created.data;
      }

      setOrganisation(org as Organisation);
      const result = await db.from("api_projects")
        .select("id,organisation_id,name,description,environment,status,created_at")
        .eq("organisation_id", org.id)
        .order("created_at", { ascending: false });
      if (result.error) throw result.error;
      setProjects((result.data ?? []) as ApiProject[]);
    } catch (cause) {
      setDataError(cause instanceof Error ? cause.message : "Unable to load your DVL Connect workspace.");
    } finally {
      setLoadingData(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (!supabase) {
      setAuthError("Add the Supabase project URL and publishable key to the deployment environment.");
      setAuthReady(true);
      return;
    }
    let active = true;
    void supabase.auth.getUser().then((result: AuthUserLookup) => {
      const { data, error } = result;
      if (!active) return;
      // An unauthenticated visitor is expected to have no session yet.
      // Supabase reports that normal state as AuthSessionMissingError; do not
      // display it as a failure on the sign-in screen.
      if (error && error.message !== "Auth session missing!") {
        setAuthError(error.message);
      } else {
        setAuthError("");
      }
      setUserEmail(data.user?.email ?? "");
      setAuthReady(true);
      if (data.user) void loadWorkspace(data.user.id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (!active) return;
      const user = session?.user;
      setUserEmail(user?.email ?? "");
      if (user) setAuthError("");
      setAuthReady(true);
      if (user && _event !== "INITIAL_SESSION") void Promise.resolve().then(() => loadWorkspace(user.id));
      else { setOrganisation(null); setProjects([]); }
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [supabase, loadWorkspace]);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setAuthBusy(true); setAuthError(""); setAuthMessage("");
    try {
      const email = authEmail.trim();
      if (authMode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) setAuthMessage("Check your email to confirm your account, then return here to sign in.");
        else setAuthMessage("Your account is ready. Setting up your workspace…");
      }
    } catch (cause) {
      setAuthError(cause instanceof Error ? cause.message : "Authentication failed. Please try again.");
    } finally { setAuthBusy(false); }
  }

  async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) setDataError(error.message);
  }

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !organisation || !projectName.trim()) return;
    setSavingProject(true); setDataError(""); setNotice("");
    try {
      const { data: userResult, error: userError } = await supabase.auth.getUser();
      if (userError || !userResult.user) throw userError ?? new Error("Please sign in again.");
      const { data, error } = await supabase.schema("dvl_connect").from("api_projects").insert({
        organisation_id: organisation.id,
        name: projectName.trim(),
        description: projectDescription.trim() || null,
        environment,
        created_by: userResult.user.id,
      }).select("id,organisation_id,name,description,environment,status,created_at").single();
      if (error) throw error;
      setProjects(current => [data as ApiProject, ...current]);
      setProjectName(""); setProjectDescription(""); setEnvironment("sandbox");
      setShowCreate(false); setNotice("API project saved to your DVL Connect workspace.");
    } catch (cause) {
      setDataError(cause instanceof Error ? cause.message : "The API project could not be created.");
    } finally { setSavingProject(false); }
  }

  const pageSubtitle: Record<Section, string> = {
    "Overview": "Your integration infrastructure, at a glance.",
    "API Projects": "Create and manage the projects that power your integrations.",
    "Integrations": "Connect business systems and keep information moving.",
    "Workflows": "Orchestrate reliable processes across connected systems.",
    "Events & Webhooks": "Manage event delivery and outgoing webhook endpoints.",
    "Activity & Logs": "Trace requests and investigate integration activity.",
    "Developer Portal": "Documentation, credentials and tools for developers.",
    "Team & Access": "Manage workspace membership and permissions.",
    "Settings": "Configure your DVL Connect workspace."
  };

  if (!authReady) return <main className="account-auth-shell"><section className="account-auth-card"><span className="overline">DVL CONNECT</span><h1>Loading your workspace</h1><p>Checking your secure sign-in session…</p></section></main>;

  if (!userEmail) return (
    <main className="account-auth-shell">
      <section className="account-auth-card">
        <span className="overline">DELIGHT VENTURES · DIGITAL INFRASTRUCTURE</span>
        <h1>{authMode === "signin" ? "Welcome to DVL Connect" : "Create your DVL Connect account"}</h1>
        <p>Sign in to manage your organisation&apos;s API projects, integrations and workflows.</p>
        <form onSubmit={submitAuth}>
          <label htmlFor="auth-email">Email address</label>
          <input id="auth-email" type="email" autoComplete="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="you@company.com" required />
          <label htmlFor="auth-password">Password</label>
          <input id="auth-password" type="password" autoComplete={authMode === "signin" ? "current-password" : "new-password"} minLength={8} value={password} onChange={e => setPassword(e.target.value)} required />
          {authError && <div className="auth-error" role="alert">{authError}</div>}
          {authMessage && <div className="auth-message" role="status">{authMessage}</div>}
          <button className="auth-submit" type="submit" disabled={authBusy}>{authBusy ? "Please wait…" : authMode === "signin" ? "Sign in" : "Create account"}</button>
        </form>
        <button className="account-auth-back" type="button" onClick={() => { setAuthMode(authMode === "signin" ? "signup" : "signin"); setAuthError(""); setAuthMessage(""); }}>
          {authMode === "signin" ? "New to DVL Connect? Create an account" : "Already registered? Sign in"}
        </button>
        {authMode === "signin" && <a className="account-auth-back" href="/forgot-password">Forgot your password?</a>}
      </section>
    </main>
  );

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand-lockup"><div className="brand-mark"><span>D</span><i /></div><div><div className="brand-name">DVL <b>Connect</b></div><div className="brand-caption">BY DELIGHT VENTURES</div></div></div>
        <div className="workspace-switch"><div className="workspace-avatar">DV</div><span><b>{organisation?.name ?? "DVL Connect"}</b><small>Workspace</small></span></div>
        <div className="environment"><span className="environment-dot"/> SANDBOX / DEVELOPMENT</div>
        {["Workspace", "Build", "Operate", "Resources", "Admin"].map(group => <div className="nav-group" key={group}>
          <div className="nav-label">{group}</div>
          {navigation.filter(item => item.group === group).map(item => { const Icon = item.icon; return <button key={item.label} className={`nav-link ${active === item.label ? "active" : ""}`} onClick={() => { setActive(item.label); setMobileNav(false); }}><Icon size={17}/><span>{item.label}</span></button>; })}
        </div>)}
        <div className="sidebar-bottom"><div className="help-card"><BookOpen size={16}/><b>Developer resources</b><p>Guides and API concepts for your integrations.</p><button onClick={() => setActive("Developer Portal")}>Open developer portal <ArrowRight size={13}/></button></div><div className="user-profile"><div className="user-avatar">{userEmail.slice(0,1).toUpperCase()}</div><span><b>{userEmail}</b><small>Signed in</small></span><button className="icon-button" aria-label="Sign out" onClick={signOut}><LogOut size={16}/></button></div></div>
      </aside>
      <section className="main-area">
        <header className="topbar"><div className="breadcrumbs">DVL Connect <ChevronRight size={14}/> <span>{active}</span></div><div className="top-actions"><div className="system-status"><i/> Workspace connected</div><button className="icon-button" aria-label="Refresh workspace" onClick={() => organisation && loadWorkspace(organisation.id)}><RefreshCw size={17}/></button></div></header>
        <div className="content-wrap">
          <div className="page-heading"><div><div className="eyebrow">DVL CONNECT / WORKSPACE</div><h1>{active}</h1><p>{pageSubtitle[active]}</p></div><div className="heading-actions">{active === "API Projects" && <button className="button button-primary" onClick={() => setShowCreate(true)}><Plus size={15}/> New API project</button>}</div></div>
          {dataError && <div className="notice" role="alert"><LockKeyhole size={16}/><span>{dataError.includes("schema") || dataError.includes("404") ? "DVL Connect's API schema is not available to the Data API yet. In Supabase Project Settings → API → Exposed schemas, add dvl_connect only, then refresh this page. Do not expose dvl_connect_private." : dataError}</span></div>}
          {notice && <div className="notice"><Check size={16}/>{notice}<button onClick={() => setNotice("")}>×</button></div>}
          {loadingData && <div className="panel"><p>Loading your organisation and API projects…</p></div>}
          {!loadingData && active === "Overview" && <>
            <div className="welcome-strip"><div className="welcome-icon"><Zap size={19}/></div><div><b>Your systems. Connected.</b><span>One infrastructure layer for data, events and workflows across DVL and external businesses.</span></div><button onClick={() => setActive("Developer Portal")}>Explore developer portal <ArrowRight size={14}/></button></div>
            <div className="metric-grid"><Metric label="API projects" value={String(projects.length).padStart(2,"0")} note="Saved in this workspace" icon={Code2}/><Metric label="Active integrations" value="—" note="Connector module not enabled" icon={Link2}/><Metric label="Events processed" value="—" note="Event engine not connected" icon={Webhook}/><Metric label="API success rate" value="—" note="Live request telemetry pending" icon={ShieldCheck}/></div>
            <div className="dashboard-grid"><div className="panel"><div className="panel-heading"><div><h2>API projects</h2><p>Projects registered to this organisation.</p></div><button className="text-action" onClick={() => setActive("API Projects")}>View all <ArrowRight size={13}/></button></div><ProjectList projects={projects.slice(0,4)}/></div><div className="panel"><div className="panel-heading"><div><h2>Build your integration layer</h2><p>Next platform modules</p></div></div><QuickAction icon={Code2} title="Create an API project" desc="Organise API credentials and environments" onClick={() => { setActive("API Projects"); setShowCreate(true); }}/><QuickAction icon={Blocks} title="Configure an integration" desc="Connector framework is next in development" onClick={() => setActive("Integrations")}/><QuickAction icon={Workflow} title="Orchestrate a workflow" desc="Workflow engine is planned" onClick={() => setActive("Workflows")}/><QuickAction icon={BookOpen} title="Read developer concepts" desc="Understand the platform foundation" onClick={() => setActive("Developer Portal")}/></div></div>
          </>}
          {!loadingData && active === "API Projects" && <div className="panel section-panel"><div className="panel-heading"><div><h2>Your API projects</h2><p>These records are stored in your DVL Connect database.</p></div><button className="button button-primary" onClick={() => setShowCreate(true)}><Plus size={15}/> Create project</button></div><ProjectList projects={projects}/></div>}
          {!loadingData && active === "Integrations" && <ModulePlaceholder icon={Blocks} title="Integration framework" description="This module will manage system connections, connector credentials, data mappings and sync health. It is not active yet; no sample connections are presented as live."/>}
          {!loadingData && active === "Workflows" && <ModulePlaceholder icon={Workflow} title="Workflow orchestration" description="The workflow designer, execution engine, retries and dead-letter handling will be implemented after API project management."/>}
          {!loadingData && active === "Events & Webhooks" && <ModulePlaceholder icon={Webhook} title="Events and webhooks" description="Event ingestion, signed webhook delivery, replay protection and delivery history are planned for the next build milestone."/>}
          {!loadingData && active === "Activity & Logs" && <ModulePlaceholder icon={Activity} title="Observability" description="Request logs, event traces, audit trails and operational metrics will appear here when the API gateway is implemented."/>}
          {!loadingData && active === "Developer Portal" && <div className="developer-grid"><div className="panel docs-hero"><div className="docs-icon"><Terminal size={22}/></div><div className="eyebrow">DEVELOPER QUICKSTART</div><h2>Build your first connection.</h2><p>DVL Connect is designed to connect business systems through versioned APIs, secure credentials, events and workflows.</p><span className="status-pill status-sandbox">Sandbox foundation</span></div><div className="panel docs-card"><h2>Platform boundaries</h2><p>Initial release supports non-payment data and system connectivity. Payment processing, custody and settlement are explicitly out of scope.</p></div><div className="panel docs-card"><h2>Security model</h2><p>Tenant-aware access, RLS, least-privilege grants, hashed credentials and audit evidence.</p></div><div className="panel docs-card"><h2>API conventions</h2><p>Versioned REST/JSON endpoints, request IDs, scoped idempotency keys and standard error responses.</p></div></div>}
          {!loadingData && active === "Team & Access" && <ModulePlaceholder icon={ShieldCheck} title="Organisation access" description="Your account is the organisation creator and owner. Invitations, role changes and membership administration will be added with the audited team-management workflow."/>}
          {!loadingData && active === "Settings" && <div className="panel settings-card"><h2>Workspace settings</h2><p>Organisation details currently connected to the DVL Connect database.</p><label>Workspace name<input value={organisation?.name ?? ""} readOnly/></label><label>Workspace slug<input value={organisation?.slug ?? ""} readOnly/></label><label>Supabase project<input value="DVL Projects · dadjxxjqqprzlroltpra" readOnly/></label></div>}
        </div>
        <footer className="app-footer"><span>© 2026 Delight Ventures · DVL Connect</span><span><i/> DATABASE-CONNECTED WORKSPACE</span><a href="https://github.com/Heezmos/osusu-project/tree/feat/dvl-connect-repurpose" target="_blank" rel="noreferrer">Source repository <ArrowRight size={12}/></a></footer>
      </section>
      {showCreate && <div className="modal-backdrop" onClick={() => setShowCreate(false)}><form className="modal" onSubmit={createProject} onClick={e => e.stopPropagation()}><button type="button" className="modal-close" onClick={() => setShowCreate(false)}>×</button><div className="modal-icon"><Code2 size={20}/></div><h2>Create API project</h2><p>Create a project record in your organisation. No live API credential is generated yet.</p><label>Project name<input autoFocus value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. Education Data API" required maxLength={120}/></label><label>Description<input value={projectDescription} onChange={e => setProjectDescription(e.target.value)} placeholder="What will this project connect?"/></label><label>Environment<select value={environment} onChange={e => setEnvironment(e.target.value as typeof environment)}><option value="development">Development</option><option value="sandbox">Sandbox</option><option value="production">Production</option></select></label><div className="modal-hint"><ShieldCheck size={15}/> Stored with organisation-level access controls</div><div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button className="button button-primary" type="submit" disabled={savingProject}><Plus size={15}/>{savingProject ? "Saving…" : "Create project"}</button></div></form></div>}
    </main>
  );
}

function Metric({ label, value, note, icon: Icon }: { label: string; value: string; note: string; icon: typeof Activity }) {
  return <div className="metric-card"><div className="metric-top"><span>{label}</span><div><Icon size={17}/></div></div><div className="metric-value">{value}</div><div className="metric-foot"><span>{note}</span></div></div>;
}
function QuickAction({ icon: Icon, title, desc, onClick }: { icon: typeof Activity; title: string; desc: string; onClick: () => void }) {
  return <button className="quick-action" onClick={onClick}><span className="quick-icon"><Icon size={17}/></span><span><b>{title}</b><small>{desc}</small></span><ChevronRight size={16}/></button>;
}
function ProjectList({ projects }: { projects: ApiProject[] }) {
  if (!projects.length) return <div className="empty-state">No API projects yet. Create your first project to begin.</div>;
  return <div className="project-list">{projects.map(project => <div className="project-row" key={project.id}><div className="project-icon"><Code2 size={18}/></div><div className="project-info"><b>{project.name}</b><small>{project.description || "No description"} · {new Date(project.created_at).toLocaleDateString()}</small></div><span className="status-pill status-sandbox">{project.environment}</span><span className="table-muted">{project.status}</span></div>)}</div>;
}
function ModulePlaceholder({ icon: Icon, title, description }: { icon: typeof Activity; title: string; description: string }) {
  return <div className="panel section-panel"><div className="docs-icon"><Icon size={22}/></div><h2>{title}</h2><p>{description}</p><div className="security-callout"><ShieldCheck size={17}/><span>This module is not represented as operational until its backend and security controls are implemented.</span></div></div>;
}
