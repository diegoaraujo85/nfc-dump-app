/**
 * NFC Dump Validation Utilities
 * Implementa as mesmas verificações de segurança do projeto Arduino
 */

// Constantes do Mifare Classic 1K
const MIFARE_1K_SIZE = 1024; // 1KB = 16 setores × 4 blocos × 16 bytes
const BLOCK_SIZE = 16;
const SECTOR_SIZE = 64; // 4 blocos por setor
const TOTAL_BLOCKS = 64;
const TOTAL_SECTORS = 16;

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  info: {
    size: number;
    expectedSize: number;
    manufacturer?: string;
    uid?: string;
    hasValidHeader?: boolean;
    hasValidChecksum?: boolean;
  };
}

/**
 * Valida um dump NFC completo
 */
export function validateNFCDump(hexData: string): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    info: {
      size: hexData.length / 2,
      expectedSize: MIFARE_1K_SIZE,
    },
  };

  // 1. Validação de tamanho
  const sizeValidation = validateSize(hexData);
  if (!sizeValidation.isValid) {
    result.isValid = false;
    result.errors.push(...sizeValidation.errors);
  }

  // Se o tamanho estiver errado, não vale a pena continuar
  if (!result.isValid) {
    return result;
  }

  // 2. Validação do cabeçalho (Bloco 0 - Manufacturer Block)
  const headerValidation = validateHeader(hexData);
  result.info.hasValidHeader = headerValidation.isValid;
  result.info.manufacturer = headerValidation.manufacturer;
  result.info.uid = headerValidation.uid;

  if (!headerValidation.isValid) {
    result.errors.push(...headerValidation.errors);
    result.isValid = false;
  }
  result.warnings.push(...headerValidation.warnings);

  // 3. Validação de BCC (Block Check Character)
  const bccValidation = validateBCC(hexData);
  if (!bccValidation.isValid) {
    result.errors.push(...bccValidation.errors);
    result.isValid = false;
  }

  // 4. Validação dos Access Bits dos setores
  const accessBitsValidation = validateAccessBits(hexData);
  result.info.hasValidChecksum = accessBitsValidation.isValid;
  if (!accessBitsValidation.isValid) {
    result.warnings.push(...accessBitsValidation.warnings);
    // Access bits inválidos são warning, não erro crítico
  }

  // 5. Validação de padrões suspeitos
  const patternValidation = validatePatterns(hexData);
  if (!patternValidation.isValid) {
    result.warnings.push(...patternValidation.warnings);
  }

  return result;
}

/**
 * Valida o tamanho do dump
 */
function validateSize(hexData: string): Pick<ValidationResult, 'isValid' | 'errors'> {
  const result = { isValid: true, errors: [] as string[] };
  const sizeInBytes = hexData.length / 2;

  if (hexData.length % 2 !== 0) {
    result.isValid = false;
    result.errors.push('Dump inválido: número ímpar de caracteres hexadecimais');
    return result;
  }

  if (sizeInBytes !== MIFARE_1K_SIZE) {
    result.isValid = false;
    result.errors.push(
      `Tamanho incorreto: esperado ${MIFARE_1K_SIZE} bytes (Mifare Classic 1K), ` +
      `encontrado ${sizeInBytes} bytes`
    );
  }

  return result;
}

/**
 * Valida o cabeçalho do dump (Bloco 0)
 */
function validateHeader(hexData: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  manufacturer?: string;
  uid?: string;
} {
  const result = {
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[],
    manufacturer: undefined as string | undefined,
    uid: undefined as string | undefined,
  };

  // Extrair o primeiro bloco (32 caracteres hex = 16 bytes)
  const block0 = hexData.substring(0, 32).toUpperCase();

  // UID está nos primeiros 4 bytes
  const uid = block0.substring(0, 8);
  result.uid = uid;

  // BCC (Block Check Character) no byte 4
  const bcc = block0.substring(8, 10);

  // SAK (Select Acknowledge) no byte 5
  const sak = block0.substring(10, 12);

  // ATQA (Answer To Request Type A) nos bytes 6-7
  const atqa = block0.substring(12, 16);

  // Manufacturer ID está no primeiro byte do UID
  const manufacturerId = uid.substring(0, 2);

  // Tabela de fabricantes conhecidos
  const manufacturers: Record<string, string> = {
    '04': 'NXP',
    '02': 'STMicroelectronics',
    '05': 'Infineon',
    '06': 'Fujitsu',
    '07': 'Texas Instruments',
    '08': 'Sony',
  };

  result.manufacturer = manufacturers[manufacturerId] || `Desconhecido (0x${manufacturerId})`;

  // Validar que o bloco não está zerado (dump vazio/corrompido)
  if (block0 === '00'.repeat(16)) {
    result.isValid = false;
    result.errors.push('Bloco 0 está completamente zerado - dump inválido ou vazio');
    return result;
  }

  // Validar que o bloco não está com todos FFs (dump corrompido)
  if (block0 === 'FF'.repeat(16)) {
    result.isValid = false;
    result.errors.push('Bloco 0 está completamente em 0xFF - dump corrompido');
    return result;
  }

  // Verificar se o SAK é válido para Mifare Classic
  const validSAKs = ['08', '09', '18', '19', '28', '88'];
  if (!validSAKs.includes(sak)) {
    result.warnings.push(
      `SAK incomum: 0x${sak} (esperado um dos seguintes: ${validSAKs.join(', ')})`
    );
  }

  return result;
}

/**
 * Valida o BCC (Block Check Character)
 * BCC deve ser UID[0] XOR UID[1] XOR UID[2] XOR UID[3]
 */
function validateBCC(hexData: string): Pick<ValidationResult, 'isValid' | 'errors'> {
  const result = { isValid: true, errors: [] as string[] };
  const block0 = hexData.substring(0, 32);

  // Extrair UID (4 bytes) e BCC (1 byte)
  const uid0 = parseInt(block0.substring(0, 2), 16);
  const uid1 = parseInt(block0.substring(2, 4), 16);
  const uid2 = parseInt(block0.substring(4, 6), 16);
  const uid3 = parseInt(block0.substring(6, 8), 16);
  const bcc = parseInt(block0.substring(8, 10), 16);

  // Calcular BCC esperado
  const expectedBCC = uid0 ^ uid1 ^ uid2 ^ uid3;

  if (bcc !== expectedBCC) {
    result.isValid = false;
    result.errors.push(
      `BCC inválido: esperado 0x${expectedBCC.toString(16).toUpperCase().padStart(2, '0')}, ` +
      `encontrado 0x${bcc.toString(16).toUpperCase().padStart(2, '0')}`
    );
  }

  return result;
}

/**
 * Valida os Access Bits de cada setor
 * Access Bits estão nos bytes 6-9 do trailer block de cada setor
 */
function validateAccessBits(hexData: string): {
  isValid: boolean;
  warnings: string[];
} {
  const result = { isValid: true, warnings: [] as string[] };

  for (let sector = 0; sector < TOTAL_SECTORS; sector++) {
    // Trailer block é o último bloco de cada setor
    const trailerBlockIndex = (sector * 4 + 3) * BLOCK_SIZE * 2; // em caracteres hex
    const trailerBlock = hexData.substring(trailerBlockIndex, trailerBlockIndex + 32);

    // Access bits estão nos bytes 6-9 do trailer block
    const accessBits = trailerBlock.substring(12, 20);

    // Bytes 6-7 e 8 devem ser complementares
    const byte6 = parseInt(accessBits.substring(0, 2), 16);
    const byte7 = parseInt(accessBits.substring(2, 4), 16);
    const byte8 = parseInt(accessBits.substring(4, 6), 16);

    // Validar complementaridade básica
    const expectedByte8 = byte6 ^ 0xFF;
    if (byte8 !== expectedByte8) {
      result.warnings.push(
        `Setor ${sector}: Access bits podem estar corrompidos ` +
        `(byte8: 0x${byte8.toString(16).toUpperCase()}, ` +
        `esperado: 0x${expectedByte8.toString(16).toUpperCase()})`
      );
    }
  }

  return result;
}

/**
 * Valida padrões suspeitos no dump
 */
function validatePatterns(hexData: string): {
  isValid: boolean;
  warnings: string[];
} {
  const result = { isValid: true, warnings: [] as string[] };

  // Verificar se há muitos blocos zerados (suspeito)
  let zeroBlocks = 0;
  let ffBlocks = 0;

  for (let i = 0; i < TOTAL_BLOCKS; i++) {
    const blockStart = i * BLOCK_SIZE * 2;
    const block = hexData.substring(blockStart, blockStart + 32);

    if (block === '00'.repeat(16)) {
      zeroBlocks++;
    }
    if (block === 'FF'.repeat(16)) {
      ffBlocks++;
    }
  }

  // Se mais de 50% dos blocos estiverem zerados (exceto blocos de dados vazios normais)
  if (zeroBlocks > TOTAL_BLOCKS * 0.5) {
    result.warnings.push(
      `Muitos blocos zerados (${zeroBlocks}/${TOTAL_BLOCKS}) - dump pode estar vazio ou corrompido`
    );
  }

  // Se mais de 30% dos blocos estiverem em FF (padrão de chip virgem/corrompido)
  if (ffBlocks > TOTAL_BLOCKS * 0.3) {
    result.warnings.push(
      `Muitos blocos em 0xFF (${ffBlocks}/${TOTAL_BLOCKS}) - dump pode estar corrompido`
    );
  }

  return result;
}

/**
 * Formata o resultado da validação para exibição ao usuário
 */
export function formatValidationResult(result: ValidationResult): string {
  let output = '';

  if (result.isValid) {
    output += '✓ Dump válido!\n\n';
  } else {
    output += '✗ Dump inválido!\n\n';
  }

  // Informações
  output += '📊 Informações:\n';
  output += `  • Tamanho: ${result.info.size} bytes\n`;
  if (result.info.manufacturer) {
    output += `  • Fabricante: ${result.info.manufacturer}\n`;
  }
  if (result.info.uid) {
    output += `  • UID: ${result.info.uid}\n`;
  }
  output += '\n';

  // Erros
  if (result.errors.length > 0) {
    output += '❌ Erros:\n';
    result.errors.forEach(error => {
      output += `  • ${error}\n`;
    });
    output += '\n';
  }

  // Avisos
  if (result.warnings.length > 0) {
    output += '⚠️ Avisos:\n';
    result.warnings.forEach(warning => {
      output += `  • ${warning}\n`;
    });
    output += '\n';
  }

  return output.trim();
}

/**
 * Valida antes de importar
 */
export function canImportDump(validationResult: ValidationResult): {
  canImport: boolean;
  reason?: string;
} {
  // Pode importar se não houver erros críticos
  if (validationResult.isValid) {
    return { canImport: true };
  }

  // Se há erros, verificar se são críticos
  const criticalErrors = validationResult.errors.filter(error =>
    error.includes('Tamanho incorreto') ||
    error.includes('BCC inválido') ||
    error.includes('completamente zerado') ||
    error.includes('completamente em 0xFF')
  );

  if (criticalErrors.length > 0) {
    return {
      canImport: false,
      reason: criticalErrors[0],
    };
  }

  // Tem erros mas não críticos - pode importar com warning
  return {
    canImport: true,
    reason: 'Dump tem problemas mas pode ser importado (use com cautela)',
  };
}

/**
 * Extrai informações resumidas do dump para exibição
 */
export function getDumpSummary(validationResult: ValidationResult): {
  manufacturer: string;
  uid: string;
  size: string;
  status: 'valid' | 'warning' | 'error';
  statusText: string;
} {
  let status: 'valid' | 'warning' | 'error' = 'valid';
  let statusText = 'Válido';

  if (!validationResult.isValid) {
    status = 'error';
    statusText = 'Inválido';
  } else if (validationResult.warnings.length > 0) {
    status = 'warning';
    statusText = 'Avisos';
  }

  return {
    manufacturer: validationResult.info.manufacturer || 'Desconhecido',
    uid: validationResult.info.uid || 'N/A',
    size: `${validationResult.info.size} bytes`,
    status,
    statusText,
  };
}