CREATE INDEX IF NOT EXISTS api_projects_created_by_idx ON dvl_connect.api_projects(created_by);
CREATE INDEX IF NOT EXISTS audit_logs_actor_user_idx ON dvl_connect.audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS organisations_created_by_idx ON dvl_connect.organisations(created_by);
CREATE INDEX IF NOT EXISTS api_credentials_created_by_idx ON dvl_connect_private.api_credentials(created_by);
