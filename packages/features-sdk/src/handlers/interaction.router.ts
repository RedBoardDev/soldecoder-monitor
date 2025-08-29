import type { AnySelectMenuInteraction, ButtonInteraction, Client, ModalSubmitInteraction } from 'discord.js';
import { GuardExecutor } from '../guards/guard.executor';
import type { GuardContext, InteractionRegistration, Logger } from '../types';
import { ErrorHandler } from '../utils/error-handler';

type InteractionType = 'button' | 'select' | 'modal';

interface ExtendedInteractionRegistration extends InteractionRegistration {
  type: InteractionType;
}

/**
 * Interaction router
 * Routes Discord interactions to their handlers
 */
export class InteractionRouter {
  private readonly handlers = new Map<InteractionType, Map<string | RegExp, ExtendedInteractionRegistration>>();
  private readonly guardExecutor: GuardExecutor;
  private readonly errorHandler: ErrorHandler;

  constructor(
    private readonly client: Client,
    private readonly logger: Logger,
  ) {
    this.guardExecutor = new GuardExecutor(logger);
    this.errorHandler = new ErrorHandler(logger);

    // Initialize handler maps
    this.handlers.set('button', new Map());
    this.handlers.set('select', new Map());
    this.handlers.set('modal', new Map());
  }

  /**
   * Register an interaction handler
   * Note: The type should be passed from the decorator
   */
  registerHandler(registration: InteractionRegistration, type?: InteractionType): void {
    // Determine type based on context if not provided
    const handlerType = type || this.inferType(registration);
    const typeHandlers = this.handlers.get(handlerType);

    if (!typeHandlers) {
      this.logger.warn(`Unknown interaction type: ${handlerType}`);
      return;
    }

    const extendedRegistration: ExtendedInteractionRegistration = {
      ...registration,
      type: handlerType,
    };

    typeHandlers.set(registration.pattern, extendedRegistration);
  }

  /**
   * Unregister an interaction handler
   */
  unregisterHandler(pattern: string | RegExp): void {
    for (const typeHandlers of this.handlers.values()) {
      typeHandlers.delete(pattern);
    }
  }

  /**
   * Handle button/select menu interaction
   */
  async handleInteraction(interaction: ButtonInteraction | AnySelectMenuInteraction): Promise<void> {
    const handlerType = interaction.isButton() ? 'button' : 'select';
    const handlers = this.handlers.get(handlerType);

    if (!handlers) {
      return;
    }

    const registration = this.findHandler(interaction.customId, handlers);

    if (!registration) {
      return; // No handler found
    }

    await this.executeHandler(registration, interaction);
  }

  /**
   * Handle modal submit
   */
  async handleModal(interaction: ModalSubmitInteraction): Promise<void> {
    const handlers = this.handlers.get('modal');

    if (!handlers) {
      return;
    }

    const registration = this.findHandler(interaction.customId, handlers);

    if (!registration) {
      return; // No handler found
    }

    await this.executeHandler(registration, interaction);
  }

  /**
   * Execute a handler with guards
   */
  private async executeHandler(
    registration: ExtendedInteractionRegistration,
    interaction: ButtonInteraction | AnySelectMenuInteraction | ModalSubmitInteraction,
  ): Promise<void> {
    try {
      // Create guard context
      const guardContext: GuardContext = {
        interaction,
        client: this.client,
        featureName: registration.feature,
        methodName: registration.method,
      };

      // Execute guards
      const canExecute = await this.guardExecutor.execute(registration.guards, guardContext);

      if (!canExecute) {
        return; // Guard failed and handled the response
      }

      // Execute handler
      await registration.handler(interaction);
    } catch (error) {
      await this.errorHandler.handle(error, interaction);
    }
  }

  /**
   * Find a handler that matches the custom ID
   */
  private findHandler(
    customId: string,
    handlers: Map<string | RegExp, ExtendedInteractionRegistration>,
  ): ExtendedInteractionRegistration | undefined {
    // First try exact match
    const exactMatch = handlers.get(customId);
    if (exactMatch) return exactMatch;

    // Then try regex patterns
    for (const [pattern, registration] of handlers) {
      if (pattern instanceof RegExp && pattern.test(customId)) {
        return registration;
      }
    }

    return undefined;
  }

  /**
   * Infer interaction type from registration
   * This is a fallback - ideally type should be passed explicitly
   */
  private inferType(_registration: InteractionRegistration): InteractionType {
    // Default to button if we can't determine
    return 'button';
  }
}
