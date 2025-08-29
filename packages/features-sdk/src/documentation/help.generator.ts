import { EmbedBuilder } from 'discord.js';
import type { CommandRegistration } from '../types';

export class HelpGenerator {
  private commands = new Map<string, CommandRegistration>();
  private categories = new Map<string, CommandRegistration[]>();

  /**
   * Add a command to the help system
   */
  addCommand(registration: CommandRegistration): void {
    this.commands.set(registration.metadata.name, registration);

    // Organize by category
    const category = registration.metadata.docs?.category || 'General';
    const categoryCommands = this.categories.get(category) || [];
    categoryCommands.push(registration);
    this.categories.set(category, categoryCommands);
  }

  /**
   * Remove a command from the help system
   */
  removeCommand(name: string): void {
    const registration = this.commands.get(name);
    if (!registration) return;

    this.commands.delete(name);

    // Remove from category
    const category = registration.metadata.docs?.category || 'General';
    const categoryCommands = this.categories.get(category) || [];
    const filtered = categoryCommands.filter((cmd) => cmd.metadata.name !== name);

    if (filtered.length === 0) {
      this.categories.delete(category);
    } else {
      this.categories.set(category, filtered);
    }
  }

  /**
   * Generate full help embed
   */
  generateFullHelp(): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setTitle('📚 Command Help')
      .setDescription('Here are all available commands organized by category:')
      .setColor(0x0099ff)
      .setTimestamp();

    // Add categories
    for (const [category, commands] of this.categories) {
      const commandList = commands
        .map((cmd) => {
          const description = 'description' in cmd.metadata ? cmd.metadata.description : 'Context menu command';
          return `\`/${cmd.metadata.name}\` - ${description}`;
        })
        .join('\n');

      embed.addFields({ name: category, value: commandList || 'No commands', inline: false });
    }

    embed.setFooter({
      text: `Use /help <command> for detailed information about a specific command`,
    });

    return embed;
  }

  /**
   * Generate command-specific help embed
   */
  generateCommandHelp(commandName: string): EmbedBuilder {
    const registration = this.commands.get(commandName);

    if (!registration) {
      return new EmbedBuilder()
        .setTitle('❌ Command Not Found')
        .setDescription(`The command \`${commandName}\` does not exist.`)
        .setColor(0xff0000);
    }

    const { metadata } = registration;
    const docs = metadata.docs || {};

    const embed = new EmbedBuilder().setTitle(`📖 Command: /${metadata.name}`).setColor(0x0099ff).setTimestamp();

    // Add description
    const description = 'description' in metadata ? metadata.description : 'Context menu command';
    embed.setDescription(docs.detailedDescription || description);

    // Add usage
    if (docs.usage) {
      embed.addFields({ name: 'Usage', value: `\`${docs.usage}\``, inline: false });
    }

    // Add examples
    if (docs.examples && docs.examples.length > 0) {
      embed.addFields({
        name: 'Examples',
        value: docs.examples.map((ex) => `\`${ex}\``).join('\n'),
        inline: false,
      });
    }

    // Add permissions
    if (docs.permissions && docs.permissions.length > 0) {
      embed.addFields({
        name: 'Required Permissions',
        value: docs.permissions.join(', '),
        inline: true,
      });
    }

    // Add cooldown
    if (docs.cooldown) {
      embed.addFields({
        name: 'Cooldown',
        value: `${docs.cooldown}s`,
        inline: true,
      });
    }

    // Add guild only status
    if (docs.guildOnly) {
      embed.addFields({
        name: 'Guild Only',
        value: 'Yes',
        inline: true,
      });
    }

    return embed;
  }

  /**
   * Get all commands
   */
  getAllCommands(): Array<{ name: string; category: string }> {
    const commands: Array<{ name: string; category: string }> = [];

    for (const [category, categoryCommands] of this.categories) {
      for (const cmd of categoryCommands) {
        commands.push({ name: cmd.metadata.name, category });
      }
    }

    return commands;
  }
}
