'use client';

/**
 * Decodes a byte array into a UTF-8 string, removing trailing null bytes
 * @param bytes The byte array to decode
 * @returns The decoded string
 */
export function decodeByteArray(bytes: number[] | Uint8Array): string {
  if (!bytes || bytes.length === 0) {
    return '';
  }

  // Find the index of the first null byte (0)
  let nullIndex = bytes.length;
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 0) {
      nullIndex = i;
      break;
    }
  }

  // Convert only the non-null bytes to a string
  const validBytes = bytes.slice(0, nullIndex);
  try {
    return new TextDecoder().decode(new Uint8Array(validBytes));
  } catch (error) {
    console.error('Error decoding byte array:', error);
    return '';
  }
}

/**
 * Decodes an array of byte arrays into an array of strings
 * @param byteArrays Array of byte arrays
 * @returns Array of decoded strings with empty strings filtered out
 */
export function decodeByteArrays(byteArrays: (number[] | Uint8Array)[]): string[] {
  if (!byteArrays || !Array.isArray(byteArrays)) {
    return [];
  }
  
  return byteArrays
    .map(bytes => decodeByteArray(bytes))
    .filter(str => str.trim() !== '');
}
