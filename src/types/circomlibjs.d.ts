declare module 'circomlibjs' {
  export interface PoseidonFunction {
    (inputs: bigint[]): Uint8Array;
    F: {
      toString(value: Uint8Array, radix?: number): string;
      e(value: string | number | bigint): bigint;
    };
  }

  export function buildPoseidon(): Promise<PoseidonFunction>;
}
