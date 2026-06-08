-- Update RLS policies to allow anon access for demo
DROP POLICY IF EXISTS "select_printers" ON printers;
DROP POLICY IF EXISTS "select_print_jobs" ON print_jobs;
DROP POLICY IF EXISTS "select_materials" ON materials;
DROP POLICY IF EXISTS "select_maintenance_alerts" ON maintenance_alerts;
DROP POLICY IF EXISTS "select_printer_profiles" ON printer_profiles;

-- Allow anyone to read printers
CREATE POLICY "select_printers" ON printers FOR SELECT TO public USING (true);

-- Allow anyone to read print_jobs
CREATE POLICY "select_print_jobs" ON print_jobs FOR SELECT TO public USING (true);

-- Allow anyone to read materials
CREATE POLICY "select_materials" ON materials FOR SELECT TO public USING (true);

-- Allow anyone to read maintenance_alerts
CREATE POLICY "select_maintenance_alerts" ON maintenance_alerts FOR SELECT TO public USING (true);

-- Allow anyone to read printer_profiles
CREATE POLICY "select_printer_profiles" ON printer_profiles FOR SELECT TO public USING (true);

-- Keep insert/update/delete restricted to authenticated users for now
DROP POLICY IF EXISTS "insert_printers" ON printers;
DROP POLICY IF EXISTS "update_printers" ON printers;
DROP POLICY IF EXISTS "delete_printers" ON printers;
DROP POLICY IF EXISTS "insert_print_jobs" ON print_jobs;
DROP POLICY IF EXISTS "update_print_jobs" ON print_jobs;
DROP POLICY IF EXISTS "delete_print_jobs" ON print_jobs;
DROP POLICY IF EXISTS "insert_materials" ON materials;
DROP POLICY IF EXISTS "update_materials" ON materials;
DROP POLICY IF EXISTS "delete_materials" ON materials;
DROP POLICY IF EXISTS "insert_maintenance_alerts" ON maintenance_alerts;
DROP POLICY IF EXISTS "update_maintenance_alerts" ON maintenance_alerts;
DROP POLICY IF EXISTS "delete_maintenance_alerts" ON maintenance_alerts;
DROP POLICY IF EXISTS "insert_printer_profiles" ON printer_profiles;
DROP POLICY IF EXISTS "update_printer_profiles" ON printer_profiles;
DROP POLICY IF EXISTS "delete_printer_profiles" ON printer_profiles;

CREATE POLICY "insert_printers" ON printers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_printers" ON printers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_printers" ON printers FOR DELETE TO authenticated USING (true);

CREATE POLICY "insert_print_jobs" ON print_jobs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_print_jobs" ON print_jobs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_print_jobs" ON print_jobs FOR DELETE TO authenticated USING (true);

CREATE POLICY "insert_materials" ON materials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_materials" ON materials FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_materials" ON materials FOR DELETE TO authenticated USING (true);

CREATE POLICY "insert_maintenance_alerts" ON maintenance_alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_maintenance_alerts" ON maintenance_alerts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_maintenance_alerts" ON maintenance_alerts FOR DELETE TO authenticated USING (true);

CREATE POLICY "insert_printer_profiles" ON printer_profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_printer_profiles" ON printer_profiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_printer_profiles" ON printer_profiles FOR DELETE TO authenticated USING (true);