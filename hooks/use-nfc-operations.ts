import { useCallback, useState } from "react";
import NfcManager, { NfcTech } from "react-native-nfc-manager";

export interface NFCTag {
  id: string;
  tech: string[];
  ndefMessage?: any[];
  type?: string;
}

export interface NFCOperationResult {
  success: boolean;
  message: string;
  tag?: NFCTag;
  error?: Error;
}

export function useNFCOperations() {
  const [isSupported, setIsSupported] = useState(true);
  const [isReading, setIsReading] = useState(false);
  const [isWriting, setIsWriting] = useState(false);

  // Initialize NFC Manager
  const initNFC = useCallback(async () => {
    try {
      const supported = await NfcManager.isSupported();
      setIsSupported(supported);
      if (supported) {
        await NfcManager.start();
      }
      return supported;
    } catch (error) {
      console.error("Error initializing NFC:", error);
      return false;
    }
  }, []);

  // Read NFC tag and return raw data
  const readTag = useCallback(
    async (): Promise<NFCOperationResult> => {
      if (!isSupported) {
        return {
          success: false,
          message: "NFC is not supported on this device",
        };
      }

      try {
        setIsReading(true);
        await initNFC();

        // Try to read from ISO14443-A tag
        try {
          await NfcManager.requestTechnology(NfcTech.IsoDep);
          const tag = await NfcManager.getTag();

          if (!tag) {
            return {
              success: false,
              message: "No NFC tag detected",
            };
          }

          return {
            success: true,
            message: "Tag read successfully",
            tag: {
              id: tag.id || "unknown",
              tech: tag.type ? [tag.type] : [],
              type: tag.type || "Unknown",
            },
          };
        } finally {
          await NfcManager.cancelTechnologyRequest();
        }
      } catch (error) {
        console.error("Error reading NFC tag:", error);
        return {
          success: false,
          message: `Error reading tag: ${error instanceof Error ? error.message : "Unknown error"}`,
          error: error instanceof Error ? error : new Error("Unknown error"),
        };
      } finally {
        setIsReading(false);
      }
    },
    [isSupported, initNFC]
  );

  // Write hex data to NFC tag
  const writeTag = useCallback(
    async (hexData: string): Promise<NFCOperationResult> => {
      if (!isSupported) {
        return {
          success: false,
          message: "NFC is not supported on this device",
        };
      }

      try {
        setIsWriting(true);
        await initNFC();

        // Convert hex string to array of numbers
        const bytes: number[] = [];
        for (let i = 0; i < hexData.length; i += 2) {
          bytes.push(parseInt(hexData.substr(i, 2), 16));
        }

        // Try to write to ISO14443-A tag
        try {
          await NfcManager.requestTechnology(NfcTech.IsoDep);
          await NfcManager.transceive(bytes);

          return {
            success: true,
            message: "Data written to tag successfully",
          };
        } finally {
          await NfcManager.cancelTechnologyRequest();
        }
      } catch (error) {
        console.error("Error writing to NFC tag:", error);
        return {
          success: false,
          message: `Error writing to tag: ${error instanceof Error ? error.message : "Unknown error"}`,
          error: error instanceof Error ? error : new Error("Unknown error"),
        };
      } finally {
        setIsWriting(false);
      }
    },
    [isSupported, initNFC]
  );

  // Cancel ongoing NFC operation
  const cancelOperation = useCallback(async () => {
    try {
      await NfcManager.cancelTechnologyRequest();
    } catch (error) {
      console.error("Error canceling NFC operation:", error);
    }
  }, []);

  // Cleanup on unmount
  const cleanup = useCallback(async () => {
    try {
      await NfcManager.cancelTechnologyRequest();
    } catch (error) {
      console.error("Error cleaning up NFC:", error);
    }
  }, []);

  return {
    isSupported,
    isReading,
    isWriting,
    initNFC,
    readTag,
    writeTag,
    cancelOperation,
    cleanup,
  };
}
