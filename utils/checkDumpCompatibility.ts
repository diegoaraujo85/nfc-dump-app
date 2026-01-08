import { TOTAL_BLOCKS_1K } from "./mifareSafety";

export type DumpCompatibility = {
  ok: boolean;
  reason?: string;
  totalBlocks: number;
};

export function checkDumpCompatibility(hex: string): DumpCompatibility {
  const totalBytes = hex.length / 2;
  const totalBlocks = Math.floor(totalBytes / 16);

  if (totalBlocks > TOTAL_BLOCKS_1K) {
    return {
      ok: false,
      reason: "Dump maior que MIFARE Classic 1K",
      totalBlocks,
    };
  }

  if (totalBlocks < 4) {
    return {
      ok: false,
      reason: "Dump muito pequeno / inválido",
      totalBlocks,
    };
  }

  return {
    ok: true,
    totalBlocks,
  };
}
