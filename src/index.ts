import { GatewayIntentBits, Events } from "discord.js";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { ExtendedClient } from "./ExtendedClient";
import { logger } from "./utils/LogManager";

// Importação do Dashboard (Note as chaves { })
import { startDashboard } from "./dashboard/server";

dotenv.config();

const client = new ExtendedClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Carregador de Comandos
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".ts"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      logger.warn(`[AVISO] Comando inválido em ${filePath}`);
    }
  }
}

// Carregador de Eventos
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".ts"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// Inicialização
client.once(Events.ClientReady, (c) => {
  logger.info(`✅ Sistema iniciado! Bot logado como: ${c.user.tag}`);
  logger.info(`📊 Iniciando servidor do Dashboard...`);

  // Inicia o servidor Web
  try {
    startDashboard(client);
  } catch (error) {
    logger.error(`Falha ao iniciar dashboard: ${error}`);
  }
});

client.login(process.env.DISCORD_TOKEN);
