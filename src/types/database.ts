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
  pending_balance: number;
  commission: number;
  status: "active" | "inactive" | "frozen";
  trend: number;
  ref_code: string | null;
  display_id: number;
  created_at: string;
  parent_affiliate_id?: string | null;
}

export interface AffiliateCommission {
  id: string;
  affiliate_id: string;
  deposit_id: string | null;
  lead_id: string;
  amount_cents: number;
  commission_cents: number;
  level: number;
  commission_rate: number;
  created_at: string;
}

export interface AffiliateNetworkNode {
  affiliate_id: string;
  name: string;
  email: string;
  level: number;
  parent_affiliate_id: string | null;
  commission_rate: number;
  total_earnings: number;
  leads_count: number;
}
