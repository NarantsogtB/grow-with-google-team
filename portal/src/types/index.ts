export type HealthcareLevelEnum = "PRIMARY" | "SECONDARY" | "TERTIARY";

export interface HospitalResponse {
  id: string;
  hospital_name: string;
  hospital_phone: string;
  address: string;
  level: HealthcareLevelEnum;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface PatientResponse {
  id: string;
  full_name: string;
  phone_number: string;
  telegram_chat_id: string | null;
  address_text: string;
  latitude: number | null;
  longitude: number | null;
  sector: string | null;
  created_at: string;
}

export interface PatientLoginResponse {
  message: string;
  patient_id: string;
  full_name: string;
  address_text: string;
  access_token: string;
  token_type: string;
}

export interface DoctorResponse {
  id: string;
  first_name: string;
  last_name: string;
  assigned_sector: string;
  hospital_id: string | null;
  role: string;
  is_active: boolean;
}

export interface PatientSession {
  patient_id: string;
  full_name: string;
  address_text: string;
  hospital_name?: string;
}
