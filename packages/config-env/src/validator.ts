import path from 'node:path';
import dotenv from 'dotenv';
import { EnvironmentSchema, type EnvironmentVariables } from './schemas';

/**
 * Validates and loads environment variables
 */
export class EnvironmentValidator {
  private static instance: EnvironmentValidator | null = null;
  private _variables: EnvironmentVariables | null = null;
  private _isValidated = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator();
    }
    return EnvironmentValidator.instance;
  }

  /**
   * Validate environment variables
   */
  validate(envPath?: string): EnvironmentVariables {
    if (this._isValidated && this._variables) {
      return this._variables;
    }

    // Load .env file
    const resolvedPath = envPath || this.findEnvFile();
    if (resolvedPath) {
      dotenv.config({ path: resolvedPath });
    }

    // Validate environment
    const result = EnvironmentSchema.safeParse(process.env);

    if (!result.success) {
      // Build detailed error message
      const errors = result.error.format();
      const errorMessages: string[] = [];

      for (const [key, error] of Object.entries(errors)) {
        if (key !== '_errors' && error && typeof error === 'object' && '_errors' in error) {
          errorMessages.push(`${key}: ${error._errors.join(', ')}`);
        }
      }

      const errorMessage = `Invalid or missing environment variables:\n${errorMessages.map((msg) => `  - ${msg}`).join('\n')}`;
      throw new Error(errorMessage);
    }

    this._variables = result.data;
    this._isValidated = true;

    return this._variables;
  }

  /**
   * Get validated environment variables
   */
  get variables(): EnvironmentVariables {
    if (!this._isValidated || !this._variables) {
      throw new Error('Environment variables not validated. Call validate() first.');
    }
    return this._variables;
  }

  /**
   * Check if environment is validated
   */
  get isValidated(): boolean {
    return this._isValidated;
  }

  /**
   * Find .env file in project root
   */
  private findEnvFile(): string | null {
    // Try different possible locations
    const possiblePaths = [
      path.resolve(process.cwd(), '.env'),
      path.resolve(process.cwd(), '../.env'),
      path.resolve(process.cwd(), '../../.env'),
      path.resolve(__dirname, '../../../.env'),
    ];

    for (const envPath of possiblePaths) {
      try {
        require('node:fs').accessSync(envPath);
        return envPath;
      } catch {
        // Continue to next path
      }
    }

    // No .env file found, will use system environment variables only
    return null;
  }
}
