import { Client, ClientOptions, Collection } from 'discord.js';

export class ExtendedClient extends Client {
    // Aqui definimos que nossa classe TEM a propriedade commands
    public commands: Collection<string, any>;

    constructor(options: ClientOptions) {
        super(options);
        this.commands = new Collection();
    }
}