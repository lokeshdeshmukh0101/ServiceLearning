import dotenv from 'dotenv';
import path from 'path';

export const backendEnvPath = path.resolve(__dirname, '../../.env');

export function loadBackendEnv(envPath = backendEnvPath): void {
  dotenv.config({ path: envPath });
}
