export const BLOCK_SIZE = 16;
export const TOTAL_BLOCKS_1K = 64;

export function isTrailerBlock(block: number): boolean {
  return (block + 1) % 4 === 0;
}

export function isSafeBlock(block: number): boolean {
  return block !== 0 && !isTrailerBlock(block);
}
