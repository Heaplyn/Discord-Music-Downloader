import { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from 'discord.js';

export interface Command {
    // Defines the Slash Command metadata (name, description, options)
    data: SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup"> | SlashCommandSubcommandsOnlyBuilder ;
    
    // The actual function that runs when a user triggers this command
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
