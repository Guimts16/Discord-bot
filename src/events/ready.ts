import { Events, Client, ActivityType } from 'discord.js';
import { AccountManager } from '../utils/AccountManager';
import { BackupService } from '../utils/BackupService';

const accountManager = new AccountManager();

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client: Client) {
        console.log(`✅ Bot online como ${client.user?.tag}!`);
        setInterval(() => {
            BackupService.runBackup(client);
        }, 86400000);
        // Função de rotação
        const updateStatus = () => {
            const accounts = accountManager.getAllAvailable();
            
            if (accounts.length === 0) {
                client.user?.setActivity('Loja Vazia 😔', { type: ActivityType.Watching });
                return;
            }

            // Pega uma conta aleatória
            const randomAccount = accounts[Math.floor(Math.random() * accounts.length)];
            
            // Ex: "Vendendo DJBLAKES por R$ 90"
            client.user?.setActivity(`Vendendo ${randomAccount.nick} por R$ ${randomAccount.price}`, { type: ActivityType.Playing });
        };

        // Roda a cada 60 segundos
        setInterval(updateStatus, 60000);
        updateStatus(); // Roda a primeira vez na hora
    },
};