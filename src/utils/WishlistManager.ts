import fs from 'fs';
import path from 'path';

interface Wish {
    userId: string;
    keyword: string; // Ex: "mvp+", "lunar", "bannable"
}

const FILE_PATH = path.join(process.cwd(), 'database', 'wishlist.json');

export class WishlistManager {
    private wishes: Wish[] = [];

    constructor() {
        if (fs.existsSync(FILE_PATH)) {
            this.wishes = JSON.parse(fs.readFileSync(FILE_PATH, 'utf-8'));
        }
    }

    public add(userId: string, keyword: string) {
        // Evita duplicatas
        if (!this.wishes.some(w => w.userId === userId && w.keyword === keyword)) {
            this.wishes.push({ userId, keyword: keyword.toLowerCase() });
            fs.writeFileSync(FILE_PATH, JSON.stringify(this.wishes, null, 4));
        }
    }

    // Verifica se uma nova conta bate com algum desejo
    public checkMatches(description: string, vips: string): string[] {
        const text = (description + " " + vips).toLowerCase();
        const userIdsToNotify: string[] = [];

        for (const wish of this.wishes) {
            if (text.includes(wish.keyword)) {
                if (!userIdsToNotify.includes(wish.userId)) {
                    userIdsToNotify.push(wish.userId);
                }
            }
        }
        return userIdsToNotify;
    }
}