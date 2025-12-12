import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { Client, TextChannel } from 'discord.js';

export class BackupService {
    public static async runBackup(client: Client) {
        const channelId = process.env.CANAL_BACKUP_ID;
        if (!channelId) return;

        const channel = client.channels.cache.get(channelId) as TextChannel;
        if (!channel) return;

        const outputZip = path.join(__dirname, '../../backup.zip');
        const output = fs.createWriteStream(outputZip);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', async () => {
            console.log('📦 Backup criado. Enviando...');
            await channel.send({ 
                content: `📦 **Backup Diário** - ${new Date().toLocaleString()}`,
                files: [outputZip] 
            });
            fs.unlinkSync(outputZip); // Limpa o arquivo local depois de enviar
        });

        archive.pipe(output);

        // Pastas para salvar
        archive.directory(path.join(__dirname, '../../accounts'), 'accounts');
        archive.directory(path.join(__dirname, '../../reputations'), 'reputations');
        if (fs.existsSync(path.join(__dirname, '../../coupons.json'))) {
            archive.file(path.join(__dirname, '../../coupons.json'), { name: 'coupons.json' });
        }

        archive.finalize();
    }
}