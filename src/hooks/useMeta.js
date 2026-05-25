import { useEffect, useState, useCallback } from "react";
import { meta } from "../api.js";

export function useMeta() {
  const [data, setData] = useState({ categories: [], contractOwners: [], paymentMethods: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await meta.get();
      setData({
        categories: Array.isArray(res?.categories) ? res.categories : [],
        contractOwners: Array.isArray(res?.contractOwners) ? res.contractOwners : [],
        paymentMethods: Array.isArray(res?.paymentMethods) ? res.paymentMethods : [],
      });
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...data, loading, error, refresh };
}
