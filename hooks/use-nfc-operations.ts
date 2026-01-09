import { useCallback, useState } from "react";
import NfcManager, { NfcTech } from "react-native-nfc-manager";
import {
  createWritePlan,
  simulateWrite,
  generateWriteReport,
  SAFE_WRITE_CONFIG,
  type WriteMode,
  type WriteResult,
  type WriteOperation,
} from "@/lib/nfc-write-protection";

const NFC_AVAILABLE = !!NfcManager;

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
  writeResult?: WriteResult;
}

export function useNFCOperations() {
  const [isSupported, setIsSupported] = useState(true);
  const [isReading, setIsReading] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [writeMode, setWriteMode] = useState<WriteMode>('TEST');

  const initNFC = useCallback(async () => {
    try {
      if (!NFC_AVAILABLE) {
        setIsSupported(false);
        return;
      }

      const supported = await NfcManager.isSupported();
      setIsSupported(supported);

      if (supported) {
        await NfcManager.start();
      }
    } catch (error) {
      console.warn("NFC not available in this environment");
      setIsSupported(false);
    }
  }, []);

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

        try {
          if (!NFC_AVAILABLE || !isSupported) {
            throw new Error("NFC not supported in this environment");
          }

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

  /**
   * ✅ PROTEÇÃO COMPLETA: Write com todas as validações de segurança
   */
  const writeTag = useCallback(
    async (hexData: string, mode: WriteMode = 'TEST'): Promise<NFCOperationResult> => {
      if (!isSupported) {
        return {
          success: false,
          message: "NFC is not supported on this device",
        };
      }

      try {
        setIsWriting(true);
        setWriteMode(mode);

        // ✅ MODO TESTE: Apenas simula, nunca escreve
        if (mode === 'TEST') {
          const testResult = simulateWrite(hexData);
          const report = generateWriteReport(testResult);

          console.log('[NFC] Modo TESTE - Simulação concluída:');
          console.log(report);

          return {
            success: true,
            message: `Simulação concluída: ${testResult.safeBlocks} blocos seriam escritos`,
            writeResult: testResult,
          };
        }

        // ✅ MODO WRITE: Escrita real com proteções
        const config = SAFE_WRITE_CONFIG;
        const plan = createWritePlan(hexData, config);

        if (!plan.isValid) {
          return {
            success: false,
            message: `Plano de escrita inválido: ${plan.errors.join(', ')}`,
          };
        }

        await initNFC();

        const operations: WriteOperation[] = [];
        let writtenBlocks = 0;
        let failedBlocks = 0;

        try {
          if (!NFC_AVAILABLE || !isSupported) {
            throw new Error("NFC not supported in this environment");
          }

          await NfcManager.requestTechnology(NfcTech.IsoDep);

          // ✅ ESCRITA SELETIVA: Apenas blocos seguros
          for (const blockInfo of plan.safeBlocks) {
            try {
              const bytes: number[] = [];
              for (let i = 0; i < blockInfo.data.length; i += 2) {
                bytes.push(parseInt(blockInfo.data.substr(i, 2), 16));
              }

              // Escrever bloco
              await NfcManager.transceive(bytes);

              // ✅ VALIDAÇÃO: Ler de volta e verificar
              const readBack = await NfcManager.transceive([0x30, blockInfo.blockNumber]);
              const readHex = Array.from(readBack as number[])
                .map(b => b.toString(16).padStart(2, '0'))
                .join('')
                .toUpperCase();

              const verified = readHex.startsWith(blockInfo.data.toUpperCase());

              operations.push({
                block: blockInfo.blockNumber,
                data: blockInfo.data,
                verified,
                error: verified ? undefined : 'Verificação falhou',
              });

              if (verified) {
                writtenBlocks++;
              } else {
                failedBlocks++;
              }
            } catch (error) {
              operations.push({
                block: blockInfo.blockNumber,
                data: blockInfo.data,
                verified: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido',
              });
              failedBlocks++;
            }
          }

          const writeResult: WriteResult = {
            success: failedBlocks === 0,
            mode: 'WRITE',
            totalBlocks: 64,
            safeBlocks: plan.safeBlocks.length,
            writtenBlocks,
            skippedBlocks: plan.unsafeBlocks.length,
            failedBlocks,
            operations,
            errors: failedBlocks > 0 ? [`${failedBlocks} blocos falharam na verificação`] : [],
            warnings: plan.warnings,
          };

          const report = generateWriteReport(writeResult);
          console.log('[NFC] Escrita concluída:');
          console.log(report);

          return {
            success: writeResult.success,
            message: writeResult.success
              ? `Escrita concluída: ${writtenBlocks} blocos escritos e verificados`
              : `Escrita parcial: ${writtenBlocks} escritos, ${failedBlocks} falharam`,
            writeResult,
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

  const cancelOperation = useCallback(async () => {
    try {
      await NfcManager.cancelTechnologyRequest();
    } catch (error) {
      console.error("Error canceling NFC operation:", error);
    }
  }, []);

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
    writeMode,
    setWriteMode,
    initNFC,
    readTag,
    writeTag,
    cancelOperation,
    cleanup,
  };
}
