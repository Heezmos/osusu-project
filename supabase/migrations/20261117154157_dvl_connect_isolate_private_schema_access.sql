CREATE OR REPLACE FUNCTION dvl_connect.is_org_member(p_org_id uuid)
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

CREATE OR REPLACE FUNCTION dvl_connect.has_org_role(p_org_id uuid, p_roles text[])
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

REVOKE ALL ON FUNCTION dvl_connect.is_org_member(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION dvl_connect.has_org_role(uuid,text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION dvl_connect.is_org_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION dvl_connect.has_org_role(uuid,text[]) TO authenticated;

DROP POLICY organisations_select_member ON dvl_connect.organisations;
CREATE POLICY organisations_select_member ON dvl_connect.organisations
FOR SELECT TO authenticated
USING (created_by = (SELECT auth.uid()) OR dvl_connect.is_org_member(id));

DROP POLICY organisations_update_admin ON dvl_connect.organisations;
CREATE POLICY organisations_update_admin ON dvl_connect.organisations
FOR UPDATE TO authenticated
USING (dvl_connect.has_org_role(id, ARRAY['owner','admin']))
WITH CHECK (dvl_connect.has_org_role(id, ARRAY['owner','admin']));

DROP POLICY members_select_org ON dvl_connect.organisation_members;
CREATE POLICY members_select_org ON dvl_connect.organisation_members
FOR SELECT TO authenticated
USING (dvl_connect.is_org_member(organisation_id));

DROP POLICY api_projects_select_member ON dvl_connect.api_projects;
CREATE POLICY api_projects_select_member ON dvl_connect.api_projects
FOR SELECT TO authenticated
USING (dvl_connect.is_org_member(organisation_id));

DROP POLICY api_projects_insert_builder ON dvl_connect.api_projects;
CREATE POLICY api_projects_insert_builder ON dvl_connect.api_projects
FOR INSERT TO authenticated
WITH CHECK (
  created_by = (SELECT auth.uid())
  AND dvl_connect.has_org_role(organisation_id, ARRAY['owner','admin','developer'])
);

DROP POLICY api_projects_update_builder ON dvl_connect.api_projects;
CREATE POLICY api_projects_update_builder ON dvl_connect.api_projects
FOR UPDATE TO authenticated
USING (dvl_connect.has_org_role(organisation_id, ARRAY['owner','admin','developer']))
WITH CHECK (dvl_connect.has_org_role(organisation_id, ARRAY['owner','admin','developer']));

DROP POLICY api_projects_delete_admin ON dvl_connect.api_projects;
CREATE POLICY api_projects_delete_admin ON dvl_connect.api_projects
FOR DELETE TO authenticated
USING (dvl_connect.has_org_role(organisation_id, ARRAY['owner','admin']));

DROP POLICY audit_logs_select_admin ON dvl_connect.audit_logs;
CREATE POLICY audit_logs_select_admin ON dvl_connect.audit_logs
FOR SELECT TO authenticated
USING (
  organisation_id IS NOT NULL
  AND dvl_connect.has_org_role(organisation_id, ARRAY['owner','admin'])
);

REVOKE USAGE ON SCHEMA dvl_connect_private FROM anon, authenticated;
