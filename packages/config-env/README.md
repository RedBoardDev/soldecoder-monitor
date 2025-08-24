# @soldecoder-monitor/config-env

Package de gestion et validation des variables d'environnement pour SolDecoder Monitor.

## Fonctionnalités

- ✅ **Validation stricte** avec Zod des variables d'environnement au démarrage
- ✅ **Configuration globale** accessible partout dans l'application
- ✅ **Types sûrs** générés automatiquement depuis les schémas
- ✅ **Logging intégré** pour debug et erreurs
- ✅ **Auto-discovery** du fichier .env
- ✅ **Singleton pattern** pour éviter les validations multiples

## Usage

### 1. Validation au démarrage (obligatoire)

```typescript
import { validateEnvironment } from '@soldecoder-monitor/config-env';
import { logger } from '@soldecoder-monitor/logger';

// Dans votre point d'entrée (index.ts)
async function main() {
  try {
    validateEnvironment();
    logger.info('✅ Configuration chargée');
  } catch (error) {
    logger.error('❌ Erreur de configuration:', error);
    process.exit(1);
  }

  // Reste de votre application...
}
```

### 2. Utilisation dans l'application

```typescript
import { config, getConfig } from '@soldecoder-monitor/config-env';

// Méthode 1: Via le proxy magique (backward compatible)
const discordToken = config.discord.token;
const awsRegion = config.aws.region;

// Méthode 2: Via getConfig() (recommandée)
const cfg = getConfig();
const solanaRpc = cfg.solana.rpcEndpoint;
const trackerKeys = cfg.solana.trackerApiKeys;

// Méthode 3: Récupérer toute la config
const fullConfig = getConfig().all;
```

### 3. Variables d'environnement requises

Créez un fichier `.env` à la racine du projet :

```env
# Discord
DISCORD_TOKEN=your_discord_bot_token
DISCORD_ADMIN_USER_ID=your_admin_user_id

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
DYNAMODB_CONFIG_TABLE_NAME=your_table_name

# Solana
SOLANA_RPC_ENDPOINT=https://api.mainnet-beta.solana.com
METEORA_PROGRAM_ID=your_program_id
SOLANA_TRACKER_API_KEY_PRIMARY=your_primary_key
SOLANA_TRACKER_API_KEY_SECONDARY=your_secondary_key

# LpAgent
LPAGENT_X_AUTH=your_lpagent_auth

# Donation
DONATE_SOLANA_ADDRESS=your_donation_address
```

## Structure de configuration

```typescript
{
  discord: {
    token: string,
    adminUserId: string
  },
  aws: {
    region: string,
    credentials: {
      accessKeyId: string,
      secretAccessKey: string
    },
    tables: {
      config: string
    }
  },
  solana: {
    rpcEndpoint: string,
    programId: string,
    trackerApiKeys: {
      primary: string,
      secondary: string
    }
  },
  lpagent: {
    xAuth: string
  },
  donate: {
    solanaAddress: string
  }
}
```

## Avantages

- 🚀 **Aucune dépendance** sur le logger - package autonome
- ⚡ **Gestion d'erreur propre** - Lance des Error que vous gérez avec votre logger
- 🔒 **Validation stricte** - Empêche les variables manquantes ou mal formées
- 🎯 **Types sûrs** - Auto-completion et vérification TypeScript partout
- 📁 **Auto-discovery** - Trouve automatiquement le fichier .env

## Sécurité

- ❌ Ne commitez jamais le fichier `.env`
- ✅ Validation stricte avec messages d'erreur détaillés
- ✅ Singleton pattern - une seule validation par application
