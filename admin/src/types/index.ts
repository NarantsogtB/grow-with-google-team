// ─── Enums ────────────────────────────────────────────────────────────────────

export type GenderEnum = "MALE" | "FEMALE";
export type DoctorRoleEnum = "GENERAL" | "PEDIATRICIAN" | "NURSE";
export type DayOfWeekEnum =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday";
export type HealthcareLevelEnum = "PRIMARY" | "SECONDARY" | "TERTIARY";

// ─── Common ───────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

// ─── Doctor ───────────────────────────────────────────────────────────────────

export interface DoctorResponse {
  id: string;
  first_name: string;
  last_name: string;
  gender: GenderEnum;
  phone: string;
  email: string;
  role: DoctorRoleEnum;
  assigned_sector: string;
  telegram_id: string | null;
  hospital_id: string | null;
  is_active: boolean;
  is_available: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface DoctorCreate {
  first_name: string;
  last_name: string;
  gender: GenderEnum;
  phone: string;
  email: string;
  role: DoctorRoleEnum;
  assigned_sector: string;
  password: string;
  telegram_id?: string | null;
  hospital_id?: string | null;
}

export interface DoctorUpdate {
  first_name?: string;
  last_name?: string;
  gender?: GenderEnum;
  phone?: string;
  email?: string;
  role?: DoctorRoleEnum;
  assigned_sector?: string;
  is_active?: boolean;
  is_available?: boolean;
  telegram_id?: string | null;
  hospital_id?: string | null;
}

export interface DoctorUpdateResponse {
  message: string;
  data: DoctorResponse;
}

// ─── Hospital ─────────────────────────────────────────────────────────────────

export interface HospitalResponse {
  id: string;
  hospital_name: string;
  hospital_phone: string;
  address: string;
  level: HealthcareLevelEnum;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface HospitalCreate {
  hospital_name: string;
  hospital_phone: string;
  address: string;
  level: HealthcareLevelEnum;
}

export interface HospitalUpdate {
  hospital_name?: string;
  hospital_phone?: string;
  address?: string;
  level?: HealthcareLevelEnum;
}

export interface HospitalUpdateResponse {
  message: string;
  data: HospitalResponse;
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

export interface ScheduleResponse {
  id: string;
  doctor_id: string;
  day_of_week: DayOfWeekEnum;
  start_time: string;
  end_time: string;
  max_patients: number;
  is_active: boolean;
}

export interface ScheduleCreate {
  doctor_id: string;
  day_of_week: DayOfWeekEnum;
  start_time: string;
  end_time: string;
  max_patients: number;
  is_active: boolean;
}

export interface ScheduleUpdate {
  day_of_week?: DayOfWeekEnum;
  start_time?: string;
  end_time?: string;
  max_patients?: number;
  is_active?: boolean;
}

// ─── Patient ──────────────────────────────────────────────────────────────────

export interface PatientResponse {
  id: string;
  full_name: string;
  phone_number: string;
  address_text: string;
  latitude: number | null;
  longitude: number | null;
  telegram_chat_id: string | null;
  sector: string | null;
  created_at: string;
}

// ─── Visit Plans ─────────────────────────────────────────────────────────────

export interface VisitPlanResponse {
  id: string;
  date: string;
  doctor_id: string;
  patient_id: string;
  visit_order: number;
  estimated_time: string | null;
  status: "pending" | "confirmed" | "declined";
  patient_name: string | null;
  patient_phone: string | null;
  patient_address: string | null;
  patient_latitude: number | null;
  patient_longitude: number | null;
  has_telegram: boolean;
}

export interface VisitPlanCreate {
  date: string;
  doctor_id: string;
  patient_id: string;
  visit_order: number;
  estimated_time?: string | null;
}

// ─── Consultation / SOAP ──────────────────────────────────────────────────────

export interface SOAPNote {
  S: string | null;
  O: string | null;
  A: string | null;
  P: string | null;
  raw?: string | null;
  error?: string | null;
}

// ─── Consultation History ─────────────────────────────────────────────────────

export interface ConsultationCreate {
  doctor_id?: string;
  patient_id?: string;
  patient_name?: string;
  transcription?: string;
  soap_s?: string | null;
  soap_o?: string | null;
  soap_a?: string | null;
  soap_p?: string | null;
}

export interface ConsultationResponse {
  id: string;
  doctor_id: string | null;
  patient_id: string | null;
  patient_name: string | null;
  transcription: string | null;
  soap_s: string | null;
  soap_o: string | null;
  soap_a: string | null;
  soap_p: string | null;
  created_at: string;
}
