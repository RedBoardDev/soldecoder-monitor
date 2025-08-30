import type { Attachment, Channel, ChatInputCommandInteraction, GuildMember, Role, User } from 'discord.js';
import { type ZodObject, type ZodRawShape, type ZodTypeAny, z } from 'zod';

/**
 * Discord.js option extraction helper with Zod schema validation
 * Automatically maps Zod schemas to Discord.js option methods and validates the result
 */

// Type mapping for Discord option types
type DiscordOptionValue = string | number | boolean | User | GuildMember | Channel | Role | Attachment;

// Discord option type interface for dynamic method calls
interface DiscordOptions {
  getString(name: string, required?: boolean): string | null;
  getNumber(name: string, required?: boolean): number | null;
  getBoolean(name: string, required?: boolean): boolean | null;
  getUser(name: string, required?: boolean): User | null;
  getMember(name: string, required?: boolean): GuildMember | null;
  getChannel(name: string, required?: boolean): Channel | null;
  getRole(name: string, required?: boolean): Role | null;
  getAttachment(name: string, required?: boolean): Attachment | null;
}

// Helper to extract the base Zod type (removing optional, nullable, default wrappers)
function getBaseZodType(schema: ZodTypeAny): ZodTypeAny {
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable || schema instanceof z.ZodDefault) {
    return getBaseZodType(schema._def.innerType);
  }
  return schema;
}

// Helper to check if a schema is optional (including .optional(), .nullable(), .default())
function isOptionalSchema(schema: ZodTypeAny): boolean {
  return schema instanceof z.ZodOptional || schema instanceof z.ZodNullable || schema instanceof z.ZodDefault;
}

// Get the appropriate Discord.js method based on Zod schema type
function getDiscordMethod(schema: ZodTypeAny): string {
  const baseType = getBaseZodType(schema);

  if (baseType instanceof z.ZodString) return 'getString';
  if (baseType instanceof z.ZodNumber) return 'getNumber';
  if (baseType instanceof z.ZodBoolean) return 'getBoolean';

  // For custom types, we need to infer from the schema shape or use z.custom
  const typeName = baseType._def.typeName;

  switch (typeName) {
    case 'ZodCustom':
      // Try to infer from the custom validator or fallback to string
      return 'getString';
    default:
      throw new Error(
        `Unsupported Zod schema type: ${typeName}. Use z.string(), z.number(), z.boolean(), or z.custom() for Discord types.`,
      );
  }
}

/**
 * Extract and validate Discord interaction options using a Zod schema
 *
 * @example
 * ```typescript
 * const schema = z.object({
 *   message: z.string(),
 *   count: z.number().optional(),
 *   public: z.boolean().default(false),
 *   user: z.custom<User>(),
 *   channel: z.custom<Channel>().optional(),
 * });
 *
 * const options = getOptions(interaction, schema);
 * // options is fully typed: { message: string, count?: number, public: boolean, user: User, channel?: Channel }
 * ```
 */
export function getOptions<T extends ZodRawShape>(
  interaction: ChatInputCommandInteraction,
  schema: ZodObject<T>,
): z.infer<ZodObject<T>> {
  const rawOptions: Record<string, DiscordOptionValue | null> = {};
  const schemaShape = schema.shape;

  // Extract options from Discord interaction
  for (const [key, zodSchema] of Object.entries(schemaShape)) {
    const method = getDiscordMethod(zodSchema as ZodTypeAny);
    const isOptional = isOptionalSchema(zodSchema as ZodTypeAny);

    try {
      // Use typed interface for dynamic method calls
      const options = interaction.options as DiscordOptions;
      const value = (options as any)[method](key, !isOptional);
      rawOptions[key] = value;
    } catch (error) {
      if (!isOptional) {
        throw new Error(
          `Failed to extract required option '${key}': ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      rawOptions[key] = null;
    }
  }

  // Validate with Zod schema and return typed result
  try {
    return schema.parse(rawOptions);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new Error(`Option validation failed:\n${errorMessages.join('\n')}`);
    }
    throw error;
  }
}

/**
 * Helper functions for common Discord types
 */
export const DiscordZodTypes = {
  /** String option */
  string: () => z.string(),

  /** Number option */
  number: () => z.number(),

  /** Boolean option */
  boolean: () => z.boolean(),

  /** User option */
  user: () =>
    z.custom<User>((val): val is User => val !== null && typeof val === 'object' && 'id' in val && 'username' in val),

  /** Member option (User in guild context) */
  member: () =>
    z.custom<GuildMember>(
      (val): val is GuildMember => val !== null && typeof val === 'object' && 'user' in val && 'guild' in val,
    ),

  /** Channel option */
  channel: () =>
    z.custom<Channel>((val): val is Channel => val !== null && typeof val === 'object' && 'id' in val && 'type' in val),

  /** Role option */
  role: () =>
    z.custom<Role>(
      (val): val is Role => val !== null && typeof val === 'object' && 'id' in val && 'name' in val && 'guild' in val,
    ),

  /** Attachment option */
  attachment: () =>
    z.custom<Attachment>(
      (val): val is Attachment => val !== null && typeof val === 'object' && 'id' in val && 'url' in val,
    ),
} as const;
