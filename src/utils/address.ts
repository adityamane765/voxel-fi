export function normalizeAptosAddress(address: string): string {
  // Ensure address is not null or undefined
  if (!address) {
    return '';
  }
  // Remove '0x' prefix if it exists
  const cleanAddress = address.startsWith('0x') ? address.substring(2) : address;
  // Pad with leading zeros to make it 64 characters long
  const paddedAddress = cleanAddress.padStart(64, '0');
  // Add '0x' prefix back
  return `0x${paddedAddress}`;
}
