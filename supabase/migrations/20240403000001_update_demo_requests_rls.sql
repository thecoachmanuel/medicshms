-- Update RLS policies for demo_requests to include super_admin
DROP POLICY IF EXISTS "Enable all for platform admin" ON demo_requests;

CREATE POLICY "Enable all for platform admins" ON demo_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (role = 'platform_admin' OR role = 'super_admin' OR role = 'Platform Admin')
    )
  );
