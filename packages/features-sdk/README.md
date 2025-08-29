# Discord Features SDK

A professional TypeScript framework for building modular, scalable Discord bots with decorators.

## 🚀 Features

- **Decorator-based API** - Clean and intuitive decorators for commands, events, and more
- **Modular architecture** - Organize your bot into reusable features
- **TypeScript first** - Full type safety and IntelliSense support
- **Built-in guards** - Rate limiting, permissions, and custom guards
- **Scheduler support** - Cron jobs and interval tasks
- **Interaction handling** - Buttons, select menus, and modals
- **Auto-command sync** - Automatically sync slash commands with Discord
- **Hot reloading** - Development mode with automatic reloading

## 📦 Installation

```bash
npm install @soldecoder-monitor/features-sdk
```

## 🛠️ Core Concepts

### Features

Features are self-contained modules that encapsulate related functionality:

```typescript
import { Feature, FeatureDecorator, SlashCommand } from '@soldecoder-monitor/features-sdk';

@FeatureDecorator({
  name: 'example',
  version: '1.0.0',
  description: 'Example feature',
  category: 'General',
})
export class ExampleFeature extends Feature {
  get metadata() {
    return {
      name: 'example',
      version: '1.0.0',
      description: 'Example feature',
      category: 'General',
    };
  }

  @SlashCommand({
    name: 'hello',
    description: 'Say hello!',
  })
  async handleHello(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply('Hello world!');
  }
}
```

### Decorators

#### Commands

```typescript
// Slash commands
@SlashCommand({
  name: 'ping',
  description: 'Check bot latency',
})

// User context menu
@UserCommand({
  name: 'User Info',
})

// Message context menu
@MessageCommand({
  name: 'Quote Message',
})
```

#### Events

```typescript
// Listen to events
@On('messageCreate')
async onMessage(message: Message): Promise<void> {
  // Handle message
}

// One-time listeners
@Once('ready')
async onReady(): Promise<void> {
  // Bot is ready
}
```

#### Schedulers

```typescript
// Cron jobs
@Cron({
  name: 'daily-task',
  pattern: '0 0 * * *', // Every day at midnight
})

// Intervals
@Interval({
  name: 'health-check',
  milliseconds: 60000, // Every minute
})
```

#### Interactions

```typescript
// Button handlers
@ButtonHandler('confirm-action')
async handleConfirm(interaction: ButtonInteraction): Promise<void> {
  // Handle button click
}

// Select menu handlers
@SelectHandler('role-select')
async handleRoleSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  // Handle selection
}

// Modal handlers
@ModalHandler('feedback-modal')
async handleFeedback(interaction: ModalSubmitInteraction): Promise<void> {
  // Handle modal submission
}
```

### Guards

Guards provide pre-execution checks for commands and interactions:

```typescript
// Built-in guards
@GuildOnly()
@RequirePermissions(['ManageGuild', 'ManageChannels'])
@RateLimit({ max: 5, window: 60000 })
async adminCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  // Only executable in guilds, by users with permissions, with rate limiting
}

// Custom guards
@UseGuards(new CustomGuard())
async protectedCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  // Protected by custom logic
}
```

## 📁 Project Structure

```
your-bot/
├── bot/
│   └── src/
│       └── index.ts          # Bot entry point
├── packages/
│   ├── features-sdk/         # This SDK
│   └── features/             # Your features
│       └── src/
│           ├── ping/
│           │   └── ping.feature.ts
│           ├── admin/
│           │   └── admin.feature.ts
│           └── index.ts      # Export all features
```

## 🔧 Bot Setup

```typescript
// bot/src/index.ts
import 'reflect-metadata';
import { Client, GatewayIntentBits } from 'discord.js';
import { FeatureManager } from '@soldecoder-monitor/features-sdk';
import { logger } from '@your-bot/logger';

// Import your features
import { PingFeature, AdminFeature } from '@your-bot/features';

async function main() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  const featureManager = new FeatureManager({
    client,
    logger,
    globalConfig: {
      environment: process.env.NODE_ENV,
    },
  });

  // Register features
  await featureManager.registerFeature(PingFeature);
  await featureManager.registerFeature(AdminFeature);

  // Initialize and start
  await featureManager.initialize();
  await client.login(process.env.DISCORD_TOKEN);

  // Sync commands
  await featureManager.syncCommands();
}

main().catch(console.error);
```

## 🎯 Advanced Usage

### Feature Lifecycle

```typescript
export class MyFeature extends Feature {
  async onLoad(context: FeatureContext): Promise<void> {
    // Called when feature is loaded
  }

  async onEnable(context: FeatureContext): Promise<void> {
    // Called when feature is enabled
  }

  async onDisable(): Promise<void> {
    // Called when feature is disabled
  }

  async onUnload(): Promise<void> {
    // Called when feature is unloaded
  }
}
```

### Custom Guards

```typescript
import { Guard, GuardContext } from '@soldecoder-monitor/features-sdk';

export class CustomGuard implements Guard {
  async canActivate(context: GuardContext): Promise<boolean> {
    // Your validation logic
    return true;
  }

  async onFail(context: GuardContext): Promise<void> {
    await context.interaction.reply({
      content: 'You cannot use this command!',
      ephemeral: true,
    });
  }
}
```

### Command Builders

```typescript
@SlashCommand({
  name: 'configure',
  description: 'Configure the bot',
  builder: (builder) => {
    builder
      .addStringOption(option =>
        option
          .setName('setting')
          .setDescription('The setting to configure')
          .setRequired(true)
          .addChoices(
            { name: 'Prefix', value: 'prefix' },
            { name: 'Language', value: 'language' }
          )
      )
      .addStringOption(option =>
        option
          .setName('value')
          .setDescription('The new value')
          .setRequired(true)
      );
    return builder;
  }
})
```

## 📊 Feature Manager API

```typescript
// Get all features
const features = featureManager.getFeatures();

// Get specific feature
const pingFeature = featureManager.getFeature('ping');

// Enable/disable features at runtime
await featureManager.enableFeature('admin');
await featureManager.disableFeature('debug');

// Graceful shutdown
await featureManager.shutdown();
```

## 🔍 Debugging

Enable debug logging:

```typescript
import { setLogLevel } from '@your-bot/logger';
setLogLevel('debug');
```

## 📝 Best Practices

1. **One feature per file** - Keep features focused and manageable
2. **Use TypeScript** - Leverage full type safety
3. **Handle errors** - Always handle potential errors in handlers
4. **Use guards** - Protect sensitive commands with appropriate guards
5. **Clean shutdown** - Implement cleanup in `onDisable` and `onUnload`

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

MIT

---

Built with ❤️ for the Discord community