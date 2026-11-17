CREATE POLICY api_credentials_deny_client_access
ON dvl_connect_private.api_credentials
FOR ALL TO PUBLIC
USING (false)
WITH CHECK (false);
