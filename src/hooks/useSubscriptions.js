import { useEffect, useState, useCallback } from "react";
import { subscriptions } from "../api.js";

export function useSubscriptions() {
  const [items, setItems] = useState([]);
  const [archivedItems, setArchivedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [active, archived] = await Promise.all([subscriptions.list("active"), subscriptions.list("archived")]);
      setItems(active);
      setArchivedItems(archived);
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
    if (updated.active) {
      setItems((prev) => (prev.some((s) => s.id === id) ? prev.map((s) => (s.id === id ? updated : s)) : [...prev, updated]));
      setArchivedItems((prev) => prev.filter((s) => s.id !== id));
    } else {
      setArchivedItems((prev) => (prev.some((s) => s.id === id) ? prev.map((s) => (s.id === id ? updated : s)) : [...prev, updated]));
      setItems((prev) => prev.filter((s) => s.id !== id));
    }
    return updated;
  }, []);

  const remove = useCallback(async (id) => {
    const archived = await subscriptions.remove(id);
    setItems((prev) => prev.filter((s) => s.id !== id));
    setArchivedItems((prev) => (prev.some((s) => s.id === id) ? prev.map((s) => (s.id === id ? archived : s)) : [...prev, archived]));
  }, []);

  const restore = useCallback(
    async (id) => update(id, { active: true, cancelled: false }),
    [update],
  );

  return { items, archivedItems, loading, error, refresh, create, update, remove, restore };
}
