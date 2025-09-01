import type { EnvironmentVariables } from './schemas';

/**
 * Application configuration object
 */
export class Config {
  private constructor(private env: EnvironmentVariables) {}

  /**
   * Create config from validated environment variables
   */
  static fromEnvironment(env: EnvironmentVariables): Config {
    return new Config(env);
  }

  /**
   * Discord configuration
   */
  get discord() {
    return {
      token: this.env.DISCORD_TOKEN,
      // adminUserId: this.env.DISCORD_ADMIN_USER_ID,
    } as const;
  }

  /**
   * AWS configuration
   */
  get aws() {
    return {
      region: this.env.AWS_REGION,
      credentials: {
        accessKeyId: this.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: this.env.AWS_SECRET_ACCESS_KEY,
      },
      tables: {
        config: this.env.DYNAMODB_CONFIG_TABLE_NAME,
      },
    } as const;
  }

  /**
   * Solana configuration
   */
  // get solana() {
  //   return {
  //     rpcEndpoint: this.env.SOLANA_RPC_ENDPOINT,
  //     programId: this.env.METEORA_PROGRAM_ID,
  //     trackerApiKeys: {
  //       primary: this.env.SOLANA_TRACKER_API_KEY_PRIMARY,
  //       secondary: this.env.SOLANA_TRACKER_API_KEY_SECONDARY,
  //     },
  //   } as const;
  // }

  /**
   * LpAgent configuration
   */
  // get lpagent() {
  //   return {
  //     xAuth: this.env.LPAGENT_X_AUTH,
  //   } as const;
  // }

  /**
   * Donation configuration
   */
  get donate() {
    return {
      solanaAddress: this.env.DONATE_SOLANA_ADDRESS,
    } as const;
  }

  /**
   * Logging configuration
   */
  get logging() {
    return {
      level: this.env.LOG_LEVEL,
    } as const;
  }

  /**
   * Get all configuration as a single object (for backward compatibility)
   */
  get all() {
    return {
      discord: this.discord,
      // aws: this.aws,
      // solana: this.solana,
      // lpagent: this.lpagent,
      donate: this.donate,
      logging: this.logging,
    } as const;
  }
}

export type ConfigType = Config;
