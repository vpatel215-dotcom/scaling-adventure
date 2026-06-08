export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      printers: {
        Row: Printer;
        Insert: PrinterInsert;
        Update: PrinterUpdate;
      };
      print_jobs: {
        Row: PrintJob;
        Insert: PrintJobInsert;
        Update: PrintJobUpdate;
      };
      materials: {
        Row: Material;
        Insert: MaterialInsert;
        Update: MaterialUpdate;
      };
      maintenance_alerts: {
        Row: MaintenanceAlert;
        Insert: MaintenanceAlertInsert;
        Update: MaintenanceAlertUpdate;
      };
      printer_profiles: {
        Row: PrinterProfile;
        Insert: PrinterProfileInsert;
        Update: PrinterProfileUpdate;
      };
    };
  };
}

export type Printer = {
  id: string;
  name: string;
  model: string;
  status: PrinterStatus;
  ip_address: string | null;
  firmware_version: string | null;
  build_volume_x: number;
  build_volume_y: number;
  build_volume_z: number;
  nozzle_diameter: number;
  heated_bed: boolean;
  heated_chamber: boolean;
  multi_material: boolean;
  material_count: number;
  last_maintenance_date: string | null;
  total_print_hours: number;
  total_prints: number;
  created_at: string;
  updated_at: string;
};

export type PrinterInsert = Omit<Printer, 'id' | 'created_at' | 'updated_at'>;
export type PrinterUpdate = Partial<PrinterInsert>;

export type PrinterStatus = 'idle' | 'printing' | 'paused' | 'error' | 'maintenance' | 'offline';

export type PrintJob = {
  id: string;
  printer_id: string | null;
  name: string;
  file_name: string;
  file_path: string | null;
  status: PrintJobStatus;
  priority: number;
  material_type: string | null;
  material_color: string | null;
  estimated_duration_minutes: number | null;
  actual_duration_minutes: number | null;
  filament_used_grams: number | null;
  layer_height: number;
  infill_percentage: number;
  supports_enabled: boolean;
  bed_temp: number | null;
  nozzle_temp: number | null;
  print_speed: number;
  progress_percentage: number;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type PrintJobInsert = Omit<PrintJob, 'id' | 'created_at' | 'updated_at'>;
export type PrintJobUpdate = Partial<PrintJobInsert>;

export type PrintJobStatus = 'queued' | 'preparing' | 'printing' | 'paused' | 'completed' | 'failed' | 'cancelled';

export type Material = {
  id: string;
  name: string;
  type: MaterialType;
  color: string;
  color_hex: string;
  brand: string | null;
  weight_grams: number;
  remaining_grams: number;
  diameter: number;
  print_temp_min: number | null;
  print_temp_max: number | null;
  bed_temp_min: number | null;
  bed_temp_max: number | null;
  location: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  spool_weight: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MaterialInsert = Omit<Material, 'id' | 'created_at' | 'updated_at'>;
export type MaterialUpdate = Partial<MaterialInsert>;

export type MaterialType = 'PLA' | 'PETG' | 'ABS' | 'TPU' | 'ASA' | 'PC' | 'NYLON' | 'CARBON_FIBER' | 'WOOD' | 'METICULOUS' | 'OTHER';

export type MaintenanceAlert = {
  id: string;
  printer_id: string;
  type: MaintenanceAlertType;
  severity: MaintenanceAlertSeverity;
  title: string;
  description: string | null;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  triggered_at: string;
  created_at: string;
};

export type MaintenanceAlertInsert = Omit<MaintenanceAlert, 'id' | 'created_at'>;
export type MaintenanceAlertUpdate = Partial<Omit<MaintenanceAlertInsert, 'printer_id'>>;

export type MaintenanceAlertType = 'nozzle_wear' | 'bed_leveling' | 'belt_tension' | 'fan_maintenance' | 'lubrication' | 'firmware_update' | 'filter_replacement' | 'other';
export type MaintenanceAlertSeverity = 'info' | 'warning' | 'critical';

export type PrinterProfile = {
  id: string;
  printer_id: string;
  name: string;
  nozzle_temp: number;
  bed_temp: number;
  chamber_temp: number | null;
  print_speed: number;
  travel_speed: number;
  retraction_distance: number;
  retraction_speed: number;
  cooling_fan_speed: number;
  z_offset: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type PrinterProfileInsert = Omit<PrinterProfile, 'id' | 'created_at' | 'updated_at'>;
export type PrinterProfileUpdate = Partial<PrinterProfileInsert>;
