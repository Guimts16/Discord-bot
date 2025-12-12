import { Collection, CommandInteraction, SlashCommandBuilder } from "discord.js";

declare module "discord.js" {
  export interface Client {
    commands: Collection<string, any>;
  }
}

export interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: CommandInteraction) => Promise<void>;
}