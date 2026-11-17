DROP POLICY IF EXISTS members_manage_admin ON dvl_connect.organisation_members;
REVOKE INSERT, UPDATE, DELETE ON dvl_connect.organisation_members FROM authenticated;
