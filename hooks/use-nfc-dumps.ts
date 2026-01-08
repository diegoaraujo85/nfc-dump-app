import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

export interface NFCDump {
  id: string;
  name: string;
  data: string; // hex string
  size: number;
  createdAt: number;
  lastWriteStatus?: "success" | "error" | "pending";
  lastWriteTime?: number;
}

const STORAGE_KEY = "@nfc_dumps";

export function useNFCDumps() {
  const [dumps, setDumps] = useState<NFCDump[]>([]);
  const [loading, setLoading] = useState(true);

  // Load dumps from AsyncStorage on mount
  useEffect(() => {
    loadDumps();
  }, []);

  const loadDumps = useCallback(async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setDumps(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading dumps:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveDump = useCallback(
    async (name: string, data: string): Promise<NFCDump | null> => {
      try {
        const newDump: NFCDump = {
          id: Date.now().toString(),
          name,
          data,
          size: Buffer.byteLength(data, "hex"),
          createdAt: Date.now(),
        };

        const updated = [...dumps, newDump];
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setDumps(updated);
        return newDump;
      } catch (error) {
        console.error("Error saving dump:", error);
        return null;
      }
    },
    [dumps]
  );

  const deleteDump = useCallback(
    async (id: string) => {
      try {
        const updated = dumps.filter((d) => d.id !== id);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setDumps(updated);
      } catch (error) {
        console.error("Error deleting dump:", error);
      }
    },
    [dumps]
  );

  const updateDumpStatus = useCallback(
    async (
      id: string,
      status: "success" | "error" | "pending"
    ) => {
      try {
        const updated = dumps.map((d) =>
          d.id === id
            ? {
                ...d,
                lastWriteStatus: status,
                lastWriteTime: Date.now(),
              }
            : d
        );
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setDumps(updated);
      } catch (error) {
        console.error("Error updating dump status:", error);
      }
    },
    [dumps]
  );

  const getDumpById = useCallback(
    (id: string) => {
      return dumps.find((d) => d.id === id) || null;
    },
    [dumps]
  );

  const getLastDump = useCallback(() => {
    return dumps.length > 0 ? dumps[dumps.length - 1] : null;
  }, [dumps]);

  const clearAllDumps = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setDumps([]);
    } catch (error) {
      console.error("Error clearing dumps:", error);
    }
  }, []);

  return {
    dumps,
    loading,
    saveDump,
    deleteDump,
    updateDumpStatus,
    getDumpById,
    getLastDump,
    clearAllDumps,
    loadDumps,
  };
}
