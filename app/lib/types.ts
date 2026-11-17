// Contrato de `wispi_attendance/controllers/api.py` (ver README del módulo).

export type GeofenceState =
  | "inside"
  | "outside"
  | "no_gps"
  | "recorded"
  | "no_center"
  | "not_applicable";

export type Employee = {
  id: number;
  name: string;
  job_title: string;
  department: string;
  manager: string;
  work_location: string;
  work_email: string;
  login: string;
  user_type: "internal" | "portal";
  company_id: number;
  company_name: string;
  image: string | null;
  tz: string;
};

export type Status = {
  employee: Employee;
  attendance_state: "checked_in" | "checked_out";
  next_action: "check_in" | "check_out";
  check_in: string | null;
  last_check_out: string | null;
  today: {
    first_check_in: string | null;
    last_check_out: string | null;
    records: number;
  };
  worked_hours_today: number;
  require_selfie: boolean;
  gps_required: boolean;
  geofence_mode: "home" | "field" | "none";
  server_time: string;
};

export type Feedback = {
  type: "success" | "warning" | "danger";
  title: string;
  message: string;
} | null;

export type PunchResponse = Status & {
  success: true;
  action_done: "check_in" | "check_out";
  attendance_id: number;
  time: string;
  geofence_state: GeofenceState | false;
  distance_m: number;
  feedback: Feedback;
};

export type HistoryRecord = {
  id: number;
  check_in: string;
  check_out: string | null;
  worked_hours: number;
  in_geofence_state: GeofenceState | null;
  out_geofence_state: GeofenceState | null;
  in_selfie: boolean;
  out_selfie: boolean;
  mode: string;
};

export type HistoryResponse = {
  success: true;
  days: number;
  records: HistoryRecord[];
};
