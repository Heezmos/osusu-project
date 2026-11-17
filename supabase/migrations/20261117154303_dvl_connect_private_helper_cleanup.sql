DROP FUNCTION IF EXISTS dvl_connect_private.is_org_member(uuid);
DROP FUNCTION IF EXISTS dvl_connect_private.has_org_role(uuid,text[]);
REVOKE ALL ON FUNCTION dvl_connect_private.add_org_creator_as_owner() FROM PUBLIC, anon, authenticated;
