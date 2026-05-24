import { useEffect, useState, useCallback } from "react";
import { settings as settingsApi } from "../api.js";
import { hashPin } from "../utils.js";

export function useSettings() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await settingsApi.list();
      setData(res || {});
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setValue = useCallback(async (key, value) => {
    const updated = await settingsApi.update(key, value);
    setData((prev) => ({ ...prev, [key]: { id: updated.id, value: updated.value } }));
    return updated;
  }, []);

  const verifyPin = useCallback(
    async (pin) => {
      const stored = data.pin_hash?.value;
      if (!stored) return false;
      const h = await hashPin(pin);
      return h === stored;
    },
    [data],
  );

  const setPin = useCallback(
    async (newPin) => {
      const h = await hashPin(newPin);
      return setValue("pin_hash", h);
    },
    [setValue],
  );

  return { data, loading, error, refresh, setValue, verifyPin, setPin };
}
