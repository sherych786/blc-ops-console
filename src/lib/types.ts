// Shared row shapes (DB column names) used across modules.

export const STEPS = [
  { key: "EnRoute", label: "En route", ic: "🚗" },
  { key: "At Pick Up", label: "At pick-up", ic: "📍" },
  { key: "POB", label: "POB", ic: "🧳" },
  { key: "Dropped off", label: "Dropped off", ic: "🏁" },
  { key: "Completed", label: "Completed", ic: "✓" },
] as const;

export const STATUSES = ["Pending", "EnRoute", "At Pick Up", "POB", "Dropped off", "Completed", "Cancelled"] as const;
export type Status = (typeof STATUSES)[number];

export const PILL: Record<string, string> = {
  Pending: "p-pending",
  EnRoute: "p-enroute",
  "At Pick Up": "p-pickup",
  POB: "p-pob",
  "Dropped off": "p-dropped",
  Completed: "p-done",
  Cancelled: "p-cancelled",
};

export const JOB_TYPES = ["Airport Transfer", "One-Way Transfer", "Hourly / As Directed"] as const;
export const DIRECTIONS = ["Arrival (airport to address)", "Departure (address to airport)"] as const;

export type Company = {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
};

export type FleetRow = {
  id: string;
  class: string;
  notes: string | null;
  pax: string | null;
  luggage: string | null;
  description: string | null;
  profile_pic_url: string | null;
  gallery_urls: string[] | null;
  video_url: string | null;
};

export type Driver = {
  id: string;
  name: string;
  phone: string | null;
  vehicle_id: string | null;
  registration: string | null;
  license_no: string | null;
  area: string | null;
  rating: string | null;
  on_duty: boolean;
  fleet?: { class: string } | null;
};

/** A job as the console uses it: DB row + resolved relations + stamp map. */
export type Job = {
  id: string;
  ref: string;
  status: string;
  service_type: string;
  direction: string | null;
  flight: string | null;
  pickup_location: string | null;
  dropoff_location: string | null;
  pickup_date: string;
  pickup_time: string | null;
  pax_name: string | null;
  pax_phone: string | null;
  pax_email: string | null;
  pax_count: string | null;
  vehicle: string | null;
  company_id: string | null;
  driver_id: string | null;
  company_price: number;
  chauffeur_price: number;
  car_park: number;
  congestion: number;
  vat: boolean;
  per_hour: number | null;
  min_hours: number | null;
  end_time: string | null;
  notes: string | null;
  driver_key: string;
  track_key: string;
  company: { name: string; contact_name: string | null } | null;
  driver: { name: string; phone: string | null; registration: string | null; vehicle: string | null } | null;
  /** status → ISO timestamp */
  stamps: Record<string, string>;
};

export type Employee = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  bank_name: string | null;
  bank_account: string | null;
  bank_sort_code: string | null;
  vehicle_id: string | null;
  registration: string | null;
  shift_hours: number;
  daily_wage: number;
  extra_hour_rate: number;
  manager: string | null;
  invoice_basis: string | null;
  fleet?: { class: string } | null;
};

export type Issuer = {
  id: string;
  name: string;
  address: string | null;
  vat_no: string | null;
  company_no: string | null;
  email: string | null;
  bank_name: string | null;
  account_holder: string | null;
  account_no: string | null;
  sort_code: string | null;
  bic: string | null;
  iban: string | null;
  phone: string | null;
  tel: string | null;
  web: string | null;
  is_default: boolean;
};
