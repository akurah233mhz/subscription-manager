import { useEffect, useState, useCallback } from "react";
import { subscriptions } from "../api.js";

export function useSubscriptions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await subscriptions.list();
      setItems(data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(async (input) => {
    const created = await subscriptions.create(input);
    setItems((prev) => [...prev, created]);
    return created;
  }, []);

  const update = useCallback(async (id, input) => {
    const updated = await subscriptions.update(id, input);
    setItems((prev) => prev.map((s) => (s.id === id ? updated : s)));
    return updated;
  }, []);

  const remove = useCallback(async (id) => {
    await subscriptions.remove(id);
    setItems((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { items, loading, error, refresh, create, update, remove };
}
