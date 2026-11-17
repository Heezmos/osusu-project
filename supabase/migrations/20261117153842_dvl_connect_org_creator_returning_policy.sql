DROP POLICY organisations_select_member ON dvl_connect.organisations;
CREATE POLICY organisations_select_member ON dvl_connect.organisations
FOR SELECT TO authenticated
USING (created_by = (SELECT auth.uid()) OR dvl_connect_private.is_org_member(id));
