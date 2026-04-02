export type UserRole = "admin" | "manager" | "member";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Mess {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface MessMember {
  id: string;
  mess_id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  role: UserRole;
  is_active: boolean;
  joined_at: string;
}

export interface MealSettings {
  id: string;
  mess_id: string;
  morning_value: number;
  lunch_value: number;
  dinner_value: number;
  updated_at: string;
}

export interface DailyMeal {
  id: string;
  mess_id: string;
  member_id: string;
  date: string;
  took_morning: boolean;
  took_lunch: boolean;
  took_dinner: boolean;
  created_by: string | null;
  created_at: string;
}

export interface DailyCost {
  id: string;
  mess_id: string;
  date: string;
  amount: number;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Deposit {
  id: string;
  mess_id: string;
  member_id: string;
  amount: number;
  date: string;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface MemberSummary {
  member: MessMember;
  totalMeals: number;
  totalDeposit: number;
  mealRate: number;
  totalCost: number;
  balance: number;
}

export interface MonthlyStats {
  totalCost: number;
  totalMeals: number;
  mealRate: number;
  totalDeposit: number;
  totalDue: number;
  totalExtra: number;
  memberSummaries: MemberSummary[];
}
