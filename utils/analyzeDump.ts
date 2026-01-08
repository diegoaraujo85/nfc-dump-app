import { BLOCK_SIZE, TOTAL_BLOCKS_1K, isSafeBlock } from "./mifareSafety";

export type DumpAnalysis = {
  totalBlocks: number;
  safeBlocks: number;
  unsafeBlocks: number;
  blockMap: {
    block: number;
    safe: boolean;
    reason: string;
  }[];
};

export function analyzeDump(hex: string): DumpAnalysis {
  const bytes = hex.match(/.{1,2}/g) ?? [];
  const totalBlocks = Math.min(
    Math.floor(bytes.length / BLOCK_SIZE),
    TOTAL_BLOCKS_1K
  );

  let safeBlocks = 0;
  let unsafeBlocks = 0;

  const blockMap = [];

  for (let block = 0; block < totalBlocks; block++) {
    const safe = isSafeBlock(block);
    if (safe) safeBlocks++;
    else unsafeBlocks++;

    blockMap.push({
      block,
      safe,
      reason:
        block === 0
          ? "UID / Manufacturer (NÃO GRAVAR)"
          : !safe
          ? "Sector Trailer (NÃO GRAVAR)"
          : "Dados (OK)",
    });
  }

  return {
    totalBlocks,
    safeBlocks,
    unsafeBlocks,
    blockMap,
  };
}
