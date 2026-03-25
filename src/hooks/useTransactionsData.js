import { useAccountData } from "../context/AccountDataContext";

export function useTransactionsData() {
  const { transactions, loading, error, actions } = useAccountData();
  return { transactions, loading, error, actions };
}
