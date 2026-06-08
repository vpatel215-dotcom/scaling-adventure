-- Printers table
CREATE TABLE printers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'printing', 'paused', 'error', 'maintenance', 'offline')),
  ip_address TEXT,
  firmware_version TEXT,
  build_volume_x INTEGER NOT NULL DEFAULT 220,
  build_volume_y INTEGER NOT NULL DEFAULT 220,
  build_volume_z INTEGER NOT NULL DEFAULT 250,
  nozzle_diameter DECIMAL(3,2) DEFAULT 0.4,
  heated_bed BOOLEAN DEFAULT true,
  heated_chamber BOOLEAN DEFAULT false,
  multi_material BOOLEAN DEFAULT false,
  material_count INTEGER DEFAULT 1,
  last_maintenance_date DATE,
  total_print_hours DECIMAL(10,2) DEFAULT 0,
  total_prints INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Print Jobs table
CREATE TABLE print_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  printer_id UUID REFERENCES printers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'preparing', 'printing', 'paused', 'completed', 'failed', 'cancelled')),
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  material_type TEXT,
  material_color TEXT,
  estimated_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  filament_used_grams DECIMAL(10,2),
  layer_height DECIMAL(4,3) DEFAULT 0.2,
  infill_percentage INTEGER DEFAULT 20 CHECK (infill_percentage >= 0 AND infill_percentage <= 100),
  supports_enabled BOOLEAN DEFAULT true,
  bed_temp INTEGER,
  nozzle_temp INTEGER,
  print_speed INTEGER DEFAULT 60,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materials table
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('PLA', 'PETG', 'ABS', 'TPU', 'ASA', 'PC', 'NYLON', 'CARBON_FIBER', 'WOOD', 'METICULOUS', 'OTHER')),
  color TEXT NOT NULL,
  color_hex TEXT DEFAULT '#FFFFFF',
  brand TEXT,
  weight_grams INTEGER NOT NULL DEFAULT 1000,
  remaining_grams INTEGER NOT NULL DEFAULT 1000,
  diameter DECIMAL(3,2) DEFAULT 1.75,
  print_temp_min INTEGER,
  print_temp_max INTEGER,
  bed_temp_min INTEGER,
  bed_temp_max INTEGER,
  location TEXT,
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  spool_weight INTEGER DEFAULT 250,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance Alerts table
CREATE TABLE maintenance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  printer_id UUID REFERENCES printers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('nozzle_wear', 'bed_leveling', 'belt_tension', 'fan_maintenance', 'lubrication', 'firmware_update', 'filter_replacement', 'other')),
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Printer Settings/Profiles table
CREATE TABLE printer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  printer_id UUID REFERENCES printers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  nozzle_temp INTEGER DEFAULT 200,
  bed_temp INTEGER DEFAULT 60,
  chamber_temp INTEGER,
  print_speed INTEGER DEFAULT 60,
  travel_speed INTEGER DEFAULT 150,
  retraction_distance DECIMAL(4,2) DEFAULT 6.0,
  retraction_speed INTEGER DEFAULT 25,
  cooling_fan_speed INTEGER DEFAULT 100,
  z_offset DECIMAL(4,3) DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE printers ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE printer_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for printers
CREATE POLICY "select_printers" ON printers FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_printers" ON printers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_printers" ON printers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_printers" ON printers FOR DELETE TO authenticated USING (true);

-- RLS Policies for print_jobs
CREATE POLICY "select_print_jobs" ON print_jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_print_jobs" ON print_jobs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_print_jobs" ON print_jobs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_print_jobs" ON print_jobs FOR DELETE TO authenticated USING (true);

-- RLS Policies for materials
CREATE POLICY "select_materials" ON materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_materials" ON materials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_materials" ON materials FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_materials" ON materials FOR DELETE TO authenticated USING (true);

-- RLS Policies for maintenance_alerts
CREATE POLICY "select_maintenance_alerts" ON maintenance_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_maintenance_alerts" ON maintenance_alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_maintenance_alerts" ON maintenance_alerts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_maintenance_alerts" ON maintenance_alerts FOR DELETE TO authenticated USING (true);

-- RLS Policies for printer_profiles
CREATE POLICY "select_printer_profiles" ON printer_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_printer_profiles" ON printer_profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_printer_profiles" ON printer_profiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_printer_profiles" ON printer_profiles FOR DELETE TO authenticated USING (true);

-- Create indexes for better query performance
CREATE INDEX idx_print_jobs_printer_id ON print_jobs(printer_id);
CREATE INDEX idx_print_jobs_status ON print_jobs(status);
CREATE INDEX idx_maintenance_alerts_printer_id ON maintenance_alerts(printer_id);
CREATE INDEX idx_maintenance_alerts_resolved ON maintenance_alerts(is_resolved);
CREATE INDEX idx_materials_type ON materials(type);
CREATE INDEX idx_materials_active ON materials(is_active);