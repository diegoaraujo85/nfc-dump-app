import NfcManager from "react-native-nfc-manager";

const Native = NfcManager as any;

export const MIFARE_KEY_TYPE_A = 0x60;
export const MIFARE_KEY_TYPE_B = 0x61;

export async function authenticateBlock(
  block: number,
  keyType: number,
  key: number[]
) {
  return Native.mifareClassicAuthenticateBlock(block, keyType, key);
}

export async function readBlock(block: number): Promise<number[]> {
  return Native.mifareClassicReadBlock(block);
}

export async function writeBlock(block: number, data: number[]) {
  return Native.mifareClassicWriteBlock(block, data);
}
