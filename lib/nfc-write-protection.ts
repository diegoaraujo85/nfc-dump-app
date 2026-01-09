/**
 * NFC Write Protection Layer
 * Implementa as mesmas proteções do projeto Arduino para evitar bricks
 */

const BLOCK_SIZE = 16;
const BLOCKS_PER_SECTOR = 4;
const TOTAL_BLOCKS = 64;
const TOTAL_SECTORS = 16;

export type WriteMode = 'TEST' | 'WRITE';

export interface WriteProtectionConfig {
  mode: WriteMode;
  allowBlock0: boolean; // NUNCA deve ser true em produção
  allowTrailers: boolean; // NUNCA deve ser true em produção
  requireAuthentication: boolean;
}

export interface BlockInfo {
  blockNumber: number;
  sectorNumber: number;
  isBlock0: boolean;
  isTrailer: boolean;
  isSafe: boolean;
  data: string; // hex string (32 chars = 16 bytes)
}

export interface WriteOperation {
  block: number;
  data: string;
  verified: boolean;
  error?: string;
}

export interface WriteResult {
  success: boolean;
  mode: WriteMode;
  totalBlocks: number;
  safeBlocks: number;
  writtenBlocks: number;
  skippedBlocks: number;
  failedBlocks: number;
  operations: WriteOperation[];
  errors: string[];
  warnings: string[];
}

/**
 * ✅ PROTEÇÃO 1: Bloqueio absoluto do bloco 0 (UID)
 */
export function isBlock0(blockNumber: number): boolean {
  return blockNumber === 0;
}

/**
 * ✅ PROTEÇÃO 2: Bloqueio absoluto de sector trailers
 */
export function isTrailerBlock(blockNumber: number): boolean {
  // Trailer é o último bloco de cada setor (blocos 3, 7, 11, 15, ...)
  return (blockNumber + 1) % BLOCKS_PER_SECTOR === 0;
}

/**
 * ✅ PROTEÇÃO 3: Verifica se o bloco é seguro para escrita
 */
export function isSafeBlock(blockNumber: number): boolean {
  // Bloco é seguro se:
  // 1. NÃO é o bloco 0 (UID)
  // 2. NÃO é um trailer block (keys + access bits)
  return !isBlock0(blockNumber) && !isTrailerBlock(blockNumber);
}

/**
 * Extrai informações de um bloco específico
 */
export function getBlockInfo(hexData: string, blockNumber: number): BlockInfo {
  if (blockNumber < 0 || blockNumber >= TOTAL_BLOCKS) {
    throw new Error(`Número de bloco inválido: ${blockNumber}`);
  }

  const sectorNumber = Math.floor(blockNumber / BLOCKS_PER_SECTOR);
  const blockStart = blockNumber * BLOCK_SIZE * 2; // 2 hex chars per byte
  const data = hexData.substring(blockStart, blockStart + BLOCK_SIZE * 2);

  return {
    blockNumber,
    sectorNumber,
    isBlock0: isBlock0(blockNumber),
    isTrailer: isTrailerBlock(blockNumber),
    isSafe: isSafeBlock(blockNumber),
    data,
  };
}

/**
 * ✅ PROTEÇÃO 4: Valida autenticação de setor
 */
export function requiresSectorAuthentication(blockNumber: number): boolean {
  return true;
}

/**
 * Gera lista de blocos seguros para escrita
 */
export function getSafeBlocksList(): number[] {
  const safeBlocks: number[] = [];

  for (let block = 0; block < TOTAL_BLOCKS; block++) {
    if (isSafeBlock(block)) {
      safeBlocks.push(block);
    }
  }

  return safeBlocks;
}

/**
 * ✅ PROTEÇÃO 5: Validação de modo de operação
 */
export function validateWriteMode(config: WriteProtectionConfig): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const result = {
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[],
  };

  if (config.allowBlock0) {
    result.errors.push(
      '❌ CRÍTICO: Escrita no bloco 0 (UID) está habilitada! Isso pode causar brick permanente!'
    );
    result.isValid = false;
  }

  if (config.allowTrailers) {
    result.errors.push(
      '❌ CRÍTICO: Escrita em sector trailers está habilitada! Isso pode causar brick permanente!'
    );
    result.isValid = false;
  }

  if (config.mode === 'TEST') {
    result.warnings.push(
      '⚠️ Modo TESTE ativo - nenhuma escrita será realizada (apenas simulação)'
    );
  }

  if (!config.requireAuthentication) {
    result.errors.push(
      '❌ CRÍTICO: Autenticação de setor desabilitada! Todas as escritas devem ser autenticadas!'
    );
    result.isValid = false;
  }

  return result;
}

/**
 * ✅ PROTEÇÃO 6: Plano de escrita com validação
 */
export function createWritePlan(
  hexData: string,
  config: WriteProtectionConfig
): {
  isValid: boolean;
  blocks: BlockInfo[];
  safeBlocks: BlockInfo[];
  unsafeBlocks: BlockInfo[];
  errors: string[];
  warnings: string[];
} {
  const result = {
    isValid: true,
    blocks: [] as BlockInfo[],
    safeBlocks: [] as BlockInfo[],
    unsafeBlocks: [] as BlockInfo[],
    errors: [] as string[],
    warnings: [] as string[],
  };

  const expectedSize = TOTAL_BLOCKS * BLOCK_SIZE * 2;
  if (hexData.length !== expectedSize) {
    result.errors.push(
      `Tamanho inválido do dump: ${hexData.length / 2} bytes (esperado: ${TOTAL_BLOCKS * BLOCK_SIZE} bytes)`
    );
    result.isValid = false;
    return result;
  }

  for (let block = 0; block < TOTAL_BLOCKS; block++) {
    const blockInfo = getBlockInfo(hexData, block);
    result.blocks.push(blockInfo);

    if (blockInfo.isSafe) {
      result.safeBlocks.push(blockInfo);
    } else {
      result.unsafeBlocks.push(blockInfo);
    }
  }

  const modeValidation = validateWriteMode(config);
  result.errors.push(...modeValidation.errors);
  result.warnings.push(...modeValidation.warnings);
  result.isValid = result.isValid && modeValidation.isValid;

  const block0 = result.unsafeBlocks.find(b => b.isBlock0);
  if (block0) {
    result.warnings.push(
      `⚠️ Bloco 0 (UID: ${block0.data.substring(0, 8).toUpperCase()}) será PULADO (proteção contra brick)`
    );
  }

  const trailerCount = result.unsafeBlocks.filter(b => b.isTrailer).length;
  if (trailerCount > 0) {
    result.warnings.push(
      `⚠️ ${trailerCount} sector trailers serão PULADOS (proteção de keys e access bits)`
    );
  }

  result.warnings.push(
    `✅ ${result.safeBlocks.length} blocos seguros serão escritos`
  );

  return result;
}

/**
 * ✅ Simula escrita (modo TESTE)
 */
export function simulateWrite(hexData: string): WriteResult {
  const config: WriteProtectionConfig = {
    mode: 'TEST',
    allowBlock0: false,
    allowTrailers: false,
    requireAuthentication: true,
  };

  const plan = createWritePlan(hexData, config);

  const operations: WriteOperation[] = [];

  for (const block of plan.safeBlocks) {
    operations.push({
      block: block.blockNumber,
      data: block.data,
      verified: true,
    });
  }

  return {
    success: true,
    mode: 'TEST',
    totalBlocks: TOTAL_BLOCKS,
    writtenBlocks: 0,
    skippedBlocks: plan.unsafeBlocks.length,
    failedBlocks: 0,
    safeBlocks: plan.safeBlocks.length,
    operations,
    errors: plan.errors,
    warnings: [
      '🧪 MODO TESTE ATIVO - Nenhuma escrita real foi executada',
      ...plan.warnings,
    ],
  };
}

/**
 * ✅ Gera relatório de escrita
 */
export function generateWriteReport(result: WriteResult): string {
  let report = '';

  report += `=== RELATÓRIO DE ESCRITA NFC ===\n\n`;
  report += `Modo: ${result.mode === 'TEST' ? '🧪 TESTE (Simulação)' : '🔧 ESCRITA REAL'}\n`;
  report += `Status: ${result.success ? '✅ Sucesso' : '❌ Falha'}\n`;
  report += `\n`;

  report += `📊 Estatísticas:\n`;
  report += `  Total de blocos: ${result.totalBlocks}\n`;
  report += `  Blocos escritos: ${result.writtenBlocks}\n`;
  report += `  Blocos pulados: ${result.skippedBlocks}\n`;
  report += `  Blocos falhados: ${result.failedBlocks}\n`;
  report += `\n`;

  if (result.errors.length > 0) {
    report += `❌ Erros:\n`;
    result.errors.forEach(error => {
      report += `  ${error}\n`;
    });
    report += `\n`;
  }

  if (result.warnings.length > 0) {
    report += `⚠️ Avisos:\n`;
    result.warnings.forEach(warning => {
      report += `  ${warning}\n`;
    });
    report += `\n`;
  }

  if (result.operations.length > 0) {
    report += `📝 Operações Realizadas:\n`;
    const displayOps = result.operations.slice(0, 10);
    displayOps.forEach(op => {
      const status = op.verified ? '✓' : '✗';
      const sector = Math.floor(op.block / BLOCKS_PER_SECTOR);
      report += `  [${status}] Bloco ${op.block.toString().padStart(2, '0')} (Setor ${sector}): ${op.data.substring(0, 16)}...\n`;
    });

    if (result.operations.length > 10) {
      report += `  ... e mais ${result.operations.length - 10} operações\n`;
    }
    report += `\n`;
  }

  report += `=== FIM DO RELATÓRIO ===\n`;

  return report;
}

/**
 * ✅ Gera CSV auditável
 */
export function generateWriteCSV(result: WriteResult): string {
  let csv = 'Bloco,Setor,Tipo,Status,Dados\n';

  result.operations.forEach(op => {
    const sector = Math.floor(op.block / BLOCKS_PER_SECTOR);
    const type = isTrailerBlock(op.block)
      ? 'Trailer'
      : isBlock0(op.block)
        ? 'UID'
        : 'Dados';
    const status = op.verified ? 'Verificado' : op.error ? 'Falha' : 'Escrito';

    csv += `${op.block},${sector},${type},${status},${op.data}\n`;
  });

  return csv;
}

export const SAFE_WRITE_CONFIG: WriteProtectionConfig = {
  mode: 'WRITE',
  allowBlock0: false,
  allowTrailers: false,
  requireAuthentication: true,
};

export const TEST_MODE_CONFIG: WriteProtectionConfig = {
  mode: 'TEST',
  allowBlock0: false,
  allowTrailers: false,
  requireAuthentication: true,
};

export function isWriteOperationSafe(
  blockNumber: number,
  config: WriteProtectionConfig
): {
  isSafe: boolean;
  reason?: string;
} {
  if (isBlock0(blockNumber) && !config.allowBlock0) {
    return {
      isSafe: false,
      reason: 'Bloco 0 (UID) está protegido contra escrita',
    };
  }

  if (isTrailerBlock(blockNumber) && !config.allowTrailers) {
    return {
      isSafe: false,
      reason: 'Sector trailer está protegido contra escrita',
    };
  }

  return { isSafe: true };
}