# @soldecoder-monitor/data

**Clean Architecture Data Layer with Intelligent Caching**

This package provides a DDD-compliant data layer with proven caching patterns for Discord bot persistence.

## 🏗️ Architecture Overview

```
data/
├── domain/                    # Pure business logic
│   ├── entities/              # Domain entities with business rules
│   ├── interfaces/            # Repository contracts (pure interfaces)
│   ├── value-objects/         # CacheKey, TableKey (type safety)
│   └── errors/                # Domain-specific errors
└── infrastructure/            # Technical implementations
    ├── cache/                 # In-memory cache with TTL
    ├── persistence/           # DynamoDB operations + mappers
    └── repositories/          # Repository implementations
```

## 🚀 Quick Start

### Basic Usage in Features

```typescript
import {
  DynamoGuildSettingsRepository,
  GuildSettingsEntity
} from '@soldecoder-monitor/data';

// In your feature
const guildRepo = DynamoGuildSettingsRepository.create();
const settings = await guildRepo.getByGuildId('guild-123');

if (!settings) {
  const defaultSettings = GuildSettingsEntity.createDefault('guild-123');
  await guildRepo.save(defaultSettings);
}
```

### Complete Feature Example

```typescript
import {
  // Repositories (with intelligent caching)
  DynamoGuildSettingsRepository,
  DynamoChannelConfigRepository,

  // Domain entities
  GuildSettingsEntity,
  ChannelConfigEntity,

  // Repository interfaces (for use cases)
  type GuildSettingsRepository,
} from '@soldecoder-monitor/data';

import {
  Feature,
  FeatureDecorator,
  SlashCommand,
  type FeatureContext
} from '@soldecoder-monitor/features-sdk';
import type { ChatInputCommandInteraction } from 'discord.js';

// ============= USE CASE =============
export class GetGuildPositionSettingsUseCase {
  constructor(private readonly guildRepo: GuildSettingsRepository) {}

  async execute(guildId: string): Promise<GuildSettingsEntity> {
    // ⚡ Cache-first automatique !
    let settings = await this.guildRepo.getByGuildId(guildId);

    if (!settings) {
      // Crée des settings par défaut
      settings = GuildSettingsEntity.createDefault(guildId);
      await this.guildRepo.save(settings); // ← Sauve + cache automatiquement
    }

    return settings;
  }
}

// ============= FEATURE COMPLÈTE =============
@FeatureDecorator({
  name: 'positions',
  version: '1.0.0',
  description: 'Position tracking with intelligent caching',
  category: 'Trading',
})
export class PositionsFeature extends Feature {
  private getSettingsUseCase!: GetGuildPositionSettingsUseCase;
  private channelRepo!: DynamoChannelConfigRepository;

  async onLoad(context: FeatureContext): Promise<void> {
    this.setContext(context);

    // 🏭 Setup repositories (tous partagent le MÊME cache singleton)
    const guildRepo = DynamoGuildSettingsRepository.create();
    this.channelRepo = DynamoChannelConfigRepository.create();

    // 💉 Injection de dépendance clean
    this.getSettingsUseCase = new GetGuildPositionSettingsUseCase(guildRepo);

    context.logger.info('Positions feature loaded with caching enabled');
  }

  @SlashCommand({
    name: 'positions-config',
    description: 'Configure position tracking for this channel',
  })
  async handlePositionsConfig(interaction: ChatInputCommandInteraction): Promise<void> {
    // 🚀 Use case call (cache-first automatique)
    const guildSettings = await this.getSettingsUseCase.execute(interaction.guildId!);

    // 📊 Vérifie si les positions sont activées
    if (!guildSettings.positionDisplayEnabled) {
      await interaction.reply('❌ Position tracking is disabled for this server.');
      return;
    }

    // 🔧 Crée une config pour ce channel
    const channelConfig = ChannelConfigEntity.createDefault(
      interaction.channelId,
      interaction.guildId!
    );

    // ⚡ Sauve + cache automatiquement
    await this.channelRepo.save(channelConfig);

    await interaction.reply('✅ Position tracking configured for this channel!');
  }

  @SlashCommand({
    name: 'cache-stats',
    description: 'Show cache performance statistics',
  })
  async handleCacheStats(interaction: ChatInputCommandInteraction): Promise<void> {
    // 📊 Stats du cache partagé
    const stats = this.channelRepo.getCacheStats();

    const embed = {
      title: '🎯 Cache Performance',
      fields: [
        { name: '📈 Hit Rate', value: `${stats.hitRate || 0}%`, inline: true },
        { name: '🔑 Total Keys', value: stats.totalKeys.toString(), inline: true },
        { name: '⏰ Expired', value: stats.expiredKeys.toString(), inline: true },
      ],
      color: stats.hitRate && stats.hitRate > 80 ? 0x00ff00 : 0xff9900,
    };

    await interaction.reply({ embeds: [embed] });
  }
}
```

### ⚡ Cache Singleton - Une Seule Instance

```typescript
// ✅ MÊME CACHE PARTAGÉ pour tous les repositories
const guildRepo = DynamoGuildSettingsRepository.create();     // → GenericCacheService.getInstance()
const channelRepo = DynamoChannelConfigRepository.create();   // → GenericCacheService.getInstance()
const messageRepo = DynamoGlobalMessageRepository.create();   // → GenericCacheService.getInstance()

// Tous utilisent la MÊME instance de Map<string, CacheEntry> !
// Donc:
// - channelRepo.save('channel-123') → met en cache avec clé "channel_config:channel-123"
// - guildRepo.getByGuildId('guild-456') → peut profiter du cache partagé
// - messageRepo.delete() → partage les mêmes statistiques (hit rate, etc.)

// 📊 Stats partagées entre tous les repositories
const stats = channelRepo.getCacheStats(); // Même stats pour tous !
console.log(`Global hit rate: ${stats.hitRate}%`); // Hit rate global de tout le système
```

## 📦 Available Repositories

- `DynamoChannelConfigRepository` - Discord channel configurations
- `DynamoGuildSettingsRepository` - Guild settings and preferences
- `DynamoGlobalMessageRepository` - Global position messages

## ⚡ Caching System

### Automatic Caching
All repositories use intelligent caching:

1. **Cache First**: Always check cache before database
2. **Database Fallback**: Load from DynamoDB if not cached
3. **Auto Cache**: Automatically cache successful database reads
4. **Cache Invalidation**: Smart cache updates on write operations

### Cache Management (Singleton)

```typescript
// 🎯 N'importe quel repository peut gérer le cache global
const repo = DynamoGuildSettingsRepository.create();

// 📊 Statistiques globales (tous repositories confondus)
const stats = repo.getCacheStats();
console.log(`Global hit rate: ${stats.hitRate}%`);
console.log(`Total cached items: ${stats.totalKeys}`);

// 🧹 Nettoyage global (affecte tous les repositories)
repo.clearCache();     // Vide TOUT le cache
repo.cleanupCache();   // Supprime les entrées expirées

// ⚠️ Ces opérations affectent TOUS les repositories car c'est un singleton !
```

## 🎯 Domain Entities

### Channel Configuration
```typescript
const config = ChannelConfigEntity.create({
  channelId: '123',
  guildId: '456',
  image: true,
  notifyOnClose: true,
  pin: false,
  tagType: 'user',
  tagId: 'user-123',
  threshold: 50,
  createdAt: Date.now()
});

// Business logic
if (config.hasNotifications()) {
  // Handle notifications
}
```

### Guild Settings
```typescript
const settings = GuildSettingsEntity.createDefault('guild-123');

// Immutable updates
const updated = settings.update({
  positionDisplayEnabled: false,
  timezone: 'Europe/Paris'
});

await guildRepo.save(updated);
```

## 🛡️ Error Handling

```typescript
import { ChannelConfigNotFoundError } from '@soldecoder-monitor/data';

try {
  const config = await channelRepo.getByChannelId('invalid');
  if (!config) {
    throw new ChannelConfigNotFoundError('invalid');
  }
} catch (error) {
  if (error instanceof ChannelConfigNotFoundError) {
    // Handle domain error
    console.log(error.code); // 'CHANNEL_CONFIG_NOT_FOUND'
  }
}
```

## 🔧 Technical Details

### Cache Keys
Type-safe cache key generation via `CacheKey` value object:
- Channel configs: `channel_config:${channelId}`
- Guild channels list: `guild_channels:${guildId}`
- Guild settings: `guild_settings:${guildId}`
- Global messages: `global_message:${guildId}`

### Database Keys
Type-safe DynamoDB key generation via `TableKey` value object:
- Consistent PK/SK patterns
- GSI key generation
- Query expression builders

### Cache Singleton Architecture
- **Single Instance**: All repositories share the SAME cache via `GenericCacheService.getInstance()`
- **Shared Memory**: One `Map<string, CacheEntry>` for the entire application
- **Global Stats**: Hit rate, total keys, and expired keys are shared across all repositories
- **Consistent Keys**: `CacheKey` value objects ensure no key conflicts

### Performance Features
- **30-minute TTL** by default
- **Batch caching** for `getAll()` operations
- **List caching** for guild → channels relationships
- **Hit rate tracking** and cache statistics (global)
- **Automatic cleanup** of expired entries

## 🧪 Testing

All components support easy testing via dependency injection:

```typescript
const mockCache = new MockCacheService();
const mockDatabase = new MockDatabaseService();
const repo = new DynamoChannelConfigRepository(mockDatabase);

// Test with controlled dependencies
```

## ⚠️ Critical Notes

1. **Cache Singleton**: ALL repositories share the SAME cache instance via `GenericCacheService.getInstance()`
   - One `Map<string, CacheEntry>` for the entire application
   - Global hit rate tracking across all data operations
   - Cache operations from any repository affect the global cache

2. **Cache System**: The caching patterns are proven to work - DO NOT modify core cache logic

3. **Domain Purity**: Entities contain only business logic, no persistence concerns

4. **Type Safety**: All operations are strongly typed with Zod validation

5. **Error Handling**: Use domain-specific errors for better UX

### Cache Key Safety
```typescript
// ✅ SAFE: CacheKey value objects prevent conflicts
CacheKey.guildSettings('guild-123')    // → "guild_settings:guild-123"
CacheKey.channelConfig('channel-456')  // → "channel_config:channel-456"
CacheKey.globalMessage('guild-789')    // → "global_message:guild-789"

// Different prefixes = no conflicts in the shared cache Map !
```
