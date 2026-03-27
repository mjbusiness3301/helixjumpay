export interface Admin {
  id: string;
  user_id: string;
  name: string;
  email: string;
  status: "active" | "frozen";
  created_at: string;
}

export interface Affiliate {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  total_registrations: number;
  total_deposits: number;
  deposit_value: number;
  balance: number;
  commission: number;
  status: "active" | "inactive" | "frozen";
  trend: number;
  ref_code: string | null;
  display_id: number;
  created_at: string;
}
