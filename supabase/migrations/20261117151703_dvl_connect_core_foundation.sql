CREATE SCHEMA dvl_connect;
CREATE SCHEMA dvl_connect_private;

CREATE TABLE dvl_connect.organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 160),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  organisation_type text NOT NULL DEFAULT 'business'
    CHECK (organisation_type IN ('dvl_venture','business','institution','developer')),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','suspended','closed')),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE dvl_connect.organisation_members (
  organisation_id uuid NOT NULL REFERENCES dvl_connect.organisations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','admin','developer','viewer')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','invited','suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organisation_id,user_id)
);

CREATE TABLE dvl_connect.api_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES dvl_connect.organisations(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 120),
  description text,
  environment text NOT NULL DEFAULT 'development'
    CHECK (environment IN ('development','sandbox','production')),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','paused','archived')),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE dvl_connect.audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organisation_id uuid REFERENCES dvl_connect.organisations(id) ON DELETE SET NULL,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE dvl_connect_private.api_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_project_id uuid NOT NULL REFERENCES dvl_connect.api_projects(id) ON DELETE CASCADE,
  environment text NOT NULL CHECK (environment IN ('development','sandbox','production')),
  label text NOT NULL CHECK (char_length(trim(label)) BETWEEN 2 AND 100),
  secret_hash text NOT NULL,
  last_four text NOT NULL CHECK (char_length(last_four) = 4),
  scopes text[] NOT NULL DEFAULT ARRAY[]::text[],
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX organisation_members_user_idx ON dvl_connect.organisation_members(user_id,status);
CREATE INDEX api_projects_org_idx ON dvl_connect.api_projects(organisation_id,created_at DESC);
CREATE INDEX audit_logs_org_created_idx ON dvl_connect.audit_logs(organisation_id,created_at DESC);
CREATE INDEX api_credentials_project_idx ON dvl_connect_private.api_credentials(api_project_id,created_at DESC);

CREATE FUNCTION dvl_connect_private.is_org_member(p_org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM dvl_connect.organisation_members m
    WHERE m.organisation_id = p_org_id
      AND m.user_id = (SELECT auth.uid())
      AND m.status = 'active'
  );
$$;

CREATE FUNCTION dvl_connect_private.has_org_role(p_org_id uuid, p_roles text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM dvl_connect.organisation_members m
    WHERE m.organisation_id = p_org_id
      AND m.user_id = (SELECT auth.uid())
      AND m.status = 'active'
      AND m.role = ANY(p_roles)
  );
$$;

CREATE FUNCTION dvl_connect_private.add_org_creator_as_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO dvl_connect.organisation_members(organisation_id,user_id,role,status)
  VALUES (NEW.id, NEW.created_by, 'owner', 'active');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_dvl_connect_org_creator_owner
AFTER INSERT ON dvl_connect.organisations
FOR EACH ROW EXECUTE FUNCTION dvl_connect_private.add_org_creator_as_owner();

ALTER TABLE dvl_connect.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dvl_connect.organisation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE dvl_connect.api_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE dvl_connect.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dvl_connect_private.api_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY organisations_select_member ON dvl_connect.organisations
FOR SELECT TO authenticated
USING (dvl_connect_private.is_org_member(id));

CREATE POLICY organisations_insert_creator ON dvl_connect.organisations
FOR INSERT TO authenticated
WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY organisations_update_admin ON dvl_connect.organisations
FOR UPDATE TO authenticated
USING (dvl_connect_private.has_org_role(id, ARRAY['owner','admin']))
WITH CHECK (dvl_connect_private.has_org_role(id, ARRAY['owner','admin']));

CREATE POLICY members_select_org ON dvl_connect.organisation_members
FOR SELECT TO authenticated
USING (dvl_connect_private.is_org_member(organisation_id));

CREATE POLICY api_projects_select_member ON dvl_connect.api_projects
FOR SELECT TO authenticated
USING (dvl_connect_private.is_org_member(organisation_id));

CREATE POLICY api_projects_insert_builder ON dvl_connect.api_projects
FOR INSERT TO authenticated
WITH CHECK (
  created_by = (SELECT auth.uid())
  AND dvl_connect_private.has_org_role(organisation_id, ARRAY['owner','admin','developer'])
);

CREATE POLICY api_projects_update_builder ON dvl_connect.api_projects
FOR UPDATE TO authenticated
USING (dvl_connect_private.has_org_role(organisation_id, ARRAY['owner','admin','developer']))
WITH CHECK (dvl_connect_private.has_org_role(organisation_id, ARRAY['owner','admin','developer']));

CREATE POLICY api_projects_delete_admin ON dvl_connect.api_projects
FOR DELETE TO authenticated
USING (dvl_connect_private.has_org_role(organisation_id, ARRAY['owner','admin']));

CREATE POLICY audit_logs_select_admin ON dvl_connect.audit_logs
FOR SELECT TO authenticated
USING (
  organisation_id IS NOT NULL
  AND dvl_connect_private.has_org_role(organisation_id, ARRAY['owner','admin'])
);

REVOKE ALL ON SCHEMA dvl_connect_private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA dvl_connect TO authenticated;
GRANT USAGE ON SCHEMA dvl_connect_private TO authenticated;
GRANT EXECUTE ON FUNCTION dvl_connect_private.is_org_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION dvl_connect_private.has_org_role(uuid,text[]) TO authenticated;
GRANT SELECT, INSERT, UPDATE ON dvl_connect.organisations TO authenticated;
GRANT SELECT ON dvl_connect.organisation_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON dvl_connect.api_projects TO authenticated;
GRANT SELECT ON dvl_connect.audit_logs TO authenticated;
REVOKE ALL ON dvl_connect_private.api_credentials FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA dvl_connect_private FROM PUBLIC, anon, authenticated;
