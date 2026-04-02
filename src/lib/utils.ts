import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, startOfMonth, endOfMonth } from "date-fns";
import type { DailyMeal, MealSettings, MemberSummary, MessMember, Deposit, DailyCost } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), "dd MMM yyyy");
}

export function getMonthRange(year: number, month: number) {
  const date = new Date(year, month - 1, 1);
  return {
    start: format(startOfMonth(date), "yyyy-MM-dd"),
    end: format(endOfMonth(date), "yyyy-MM-dd"),
  };
}

export function calculateMealValue(
  meal: DailyMeal,
  settings: MealSettings
): number {
  let total = 0;
  if (meal.took_morning) total += settings.morning_value;
  if (meal.took_lunch) total += settings.lunch_value;
  if (meal.took_dinner) total += settings.dinner_value;
  return total;
}

export function calculateMemberMeals(
  meals: DailyMeal[],
  memberId: string,
  settings: MealSettings
): number {
  return meals
    .filter((m) => m.member_id === memberId)
    .reduce((sum, meal) => sum + calculateMealValue(meal, settings), 0);
}

export function calculateMonthlyStats(
  members: MessMember[],
  meals: DailyMeal[],
  costs: DailyCost[],
  deposits: Deposit[],
  settings: MealSettings
) {
  const activeMembers = members.filter((m) => m.is_active);

  const totalCost = costs.reduce((sum, c) => sum + Number(c.amount), 0);

  const totalMeals = meals.reduce(
    (sum, meal) => sum + calculateMealValue(meal, settings),
    0
  );

  const mealRate = totalMeals > 0 ? totalCost / totalMeals : 0;

  const memberSummaries: MemberSummary[] = activeMembers.map((member) => {
    const memberMeals = calculateMemberMeals(meals, member.id, settings);
    const memberDeposit = deposits
      .filter((d) => d.member_id === member.id)
      .reduce((sum, d) => sum + Number(d.amount), 0);
    const memberCost = memberMeals * mealRate;
    const balance = memberDeposit - memberCost;

    return {
      member,
      totalMeals: memberMeals,
      totalDeposit: memberDeposit,
      mealRate,
      totalCost: memberCost,
      balance,
    };
  });

  const totalDeposit = memberSummaries.reduce(
    (sum, s) => sum + s.totalDeposit,
    0
  );
  const totalDue = memberSummaries
    .filter((s) => s.balance < 0)
    .reduce((sum, s) => sum + Math.abs(s.balance), 0);
  const totalExtra = memberSummaries
    .filter((s) => s.balance > 0)
    .reduce((sum, s) => sum + s.balance, 0);

  return {
    totalCost,
    totalMeals,
    mealRate,
    totalDeposit,
    totalDue,
    totalExtra,
    memberSummaries,
  };
}

export function getCurrentMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function getMonthLabel(year: number, month: number): string {
  return format(new Date(year, month - 1, 1), "MMMM yyyy");
}
