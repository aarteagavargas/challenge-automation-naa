import { test as base } from '@playwright/test';
import { createHash } from 'node:crypto';
import dotenv from 'dotenv';
import path from 'node:path';

// Load the local environment file only; .env must never be committed.
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export type TestEnvironment = 'QA' | 'CERT';

export type EnvironmentFixture = {
  environment: {
    name: TestEnvironment;
    secretKeySha256: string;
  };
};

export const test = base.extend<EnvironmentFixture>({
  environment: async ({}, use, testInfo) => {
    const configuredEnvironment = (process.env.TEST_ENV ?? 'QA').toUpperCase();

    if (configuredEnvironment !== 'QA' && configuredEnvironment !== 'CERT') {
      throw new Error('TEST_ENV must be either QA or CERT');
    }

    const environment = configuredEnvironment as TestEnvironment;
    const secretVariable = `SECRET_KEY_${environment}`;
    const secretKey = process.env[secretVariable];

    if (!secretKey) {
      throw new Error(`Missing environment variable ${secretVariable}`);
    }

    const secretKeySha256 = createHash('sha256')
      .update(secretKey)
      .digest('hex');

    console.log(
      `[${environment}] ${secretVariable} SHA-256: ${secretKeySha256}`,
      `(${testInfo.title})`,
    );

    await use({
      name: environment,
      secretKeySha256,
    });
  },
});

export { expect } from '@playwright/test';
