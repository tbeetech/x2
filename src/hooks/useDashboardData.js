import { useAccountData } from "../context/AccountDataContext";

export function useDashboardData() {
  return useAccountData();
}
