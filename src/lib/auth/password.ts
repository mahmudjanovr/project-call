import { hash, verify, type Algorithm } from "@node-rs/argon2";

/**
 * Argon2id configuration aligned with OWASP Password Hashing recommendations.
 * - Algorithm: Argon2id (value 2 in @node-rs/argon2)
 * - Memory cost: 64 MB (65536 KiB)
 * - Time cost / iterations: 3
 * - Parallelism: 4 threads
 */
const ARGON2ID_ALGORITHM = 2 as unknown as Algorithm;

const ARGON2ID_OPTIONS = {
  algorithm: ARGON2ID_ALGORITHM,
  memoryCost: 65536,
  timeCost: 3,
  outputLen: 32,
  parallelism: 4,
};

/**
 * Hashes a plaintext password using Argon2id.
 * Never stores or returns plaintext passwords.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }
  return await hash(password, ARGON2ID_OPTIONS);
}

/**
 * Verifies a plaintext password against an Argon2id hash.
 * Constant-time comparison handled internally by @node-rs/argon2.
 */
export async function verifyPassword(
  hashedPassword: string,
  plainPassword: string
): Promise<boolean> {
  if (!hashedPassword || !plainPassword) {
    return false;
  }
  try {
    return await verify(hashedPassword, plainPassword);
  } catch {
    return false;
  }
}
