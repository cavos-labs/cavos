/**
 * Type declarations for poseidon-lite
 */

declare module 'poseidon-lite' {
  /**
   * Poseidon hash function
   * @param inputs - Array of bigint inputs (1-16 elements)
   * @returns The hash as a bigint
   */
  export function poseidon(inputs: bigint[]): bigint;

  /**
   * Poseidon hash for 1 input
   */
  export function poseidon1(inputs: [bigint]): bigint;

  /**
   * Poseidon hash for 2 inputs
   */
  export function poseidon2(inputs: [bigint, bigint]): bigint;

  /**
   * Poseidon hash for 3 inputs
   */
  export function poseidon3(inputs: [bigint, bigint, bigint]): bigint;

  /**
   * Poseidon hash for 4 inputs
   */
  export function poseidon4(inputs: [bigint, bigint, bigint, bigint]): bigint;

  /**
   * Poseidon hash for 5 inputs
   */
  export function poseidon5(
    inputs: [bigint, bigint, bigint, bigint, bigint]
  ): bigint;

  /**
   * Poseidon hash for 6 inputs
   */
  export function poseidon6(
    inputs: [bigint, bigint, bigint, bigint, bigint, bigint]
  ): bigint;

  /**
   * Poseidon hash for 8 inputs
   */
  export function poseidon8(
    inputs: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint]
  ): bigint;
}
