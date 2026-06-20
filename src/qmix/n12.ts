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
export function n12(
  n: readonly [number, number, number],
  thetaRad: number,
  phiRad: number,
  axis: string,
): [number, number] {
  const x = 1 / (n[0] * n[0]);
  const y = 1 / (n[1] * n[1]);
  const z = 1 / (n[2] * n[2]);
  const st = Math.sin(thetaRad);
  const ct = Math.cos(thetaRad);
  const sp = Math.sin(phiRad);
  const cp = Math.cos(phiRad);
  const a = st * st;
  const b = cp * cp;
  const c = sp * sp;
  const d = ct * ct;
  const ao = d + a * (b + c); // = sin²θ + cos²θ = 1

  let bo: number, co: number;
  switch (axis) {
    case "X":
      bo = -(d * (y + z) + a * b * (x + z) + a * c * (x + y));
      co = d * y * z + a * b * x * z + a * c * x * y;
      break;
    case "Y":
      bo = -(a * c * (y + z) + d * (x + z) + a * b * (x + y));
      co = a * c * y * z + d * x * z + a * b * x * y;
      break;
    case "Z":
    default:
      bo = -(a * b * (y + z) + a * c * (x + z) + d * (x + y));
      co = a * b * y * z + a * c * x * z + d * x * y;
      break;
  }

  const disc = bo * bo - 4 * ao * co;
  if (disc < 0) return [0, 0];

  const nSqHi = (-bo + Math.sqrt(disc)) / (2 * ao);
  const nSqLo = -(nSqHi + bo / ao);
  const nHi = 1 / Math.sqrt(nSqHi);
  const nLo = 1 / Math.sqrt(nSqLo);
  return [Math.max(nLo, nHi), Math.min(nLo, nHi)];
}
