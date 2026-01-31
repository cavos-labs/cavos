/**
 * Type declarations for snarkjs
 */

declare module 'snarkjs' {
  export namespace groth16 {
    function fullProve(
      input: Record<string, unknown>,
      wasmFile: string,
      zkeyFile: string
    ): Promise<{
      proof: {
        pi_a: string[];
        pi_b: string[][];
        pi_c: string[];
        protocol: string;
        curve: string;
      };
      publicSignals: string[];
    }>;

    function prove(
      zkeyBuffer: Buffer,
      witnessBuffer: Buffer
    ): Promise<{
      proof: {
        pi_a: string[];
        pi_b: string[][];
        pi_c: string[];
        protocol: string;
        curve: string;
      };
      publicSignals: string[];
    }>;

    function verify(
      vkey: Record<string, unknown>,
      publicSignals: string[],
      proof: {
        pi_a: string[];
        pi_b: string[][];
        pi_c: string[];
        protocol?: string;
        curve?: string;
      }
    ): Promise<boolean>;
  }

  export namespace wtns {
    function calculate(
      input: Record<string, unknown>,
      wasmFile: string,
      witnessFile: string
    ): Promise<void>;
  }
}
