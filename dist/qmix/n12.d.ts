/** Full biaxial Fresnel equation solver (matching MATLAB N12.m).
 * Computes the two eigen-polarization refractive indices for a given
 * propagation direction (theta, phi) in a biaxial crystal with principal
 * indices nx, ny, nz.
 *
 * @param n - [nx, ny, nz] principal refractive indices.
 * @param thetaRad - polar angle from the rotation axis in radians.
 * @param phiRad - azimuthal angle in radians.
 * @param axis - rotation axis: "X", "Y", or "Z".
 * @returns [n_hi, n_lo] — the two eigen-polarization indices.
 */
export declare function n12(n: readonly [number, number, number], thetaRad: number, phiRad: number, axis: string): [number, number];
//# sourceMappingURL=n12.d.ts.map