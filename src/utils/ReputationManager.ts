import fs from 'fs';
import path from 'path';

interface Review {
    authorId: string;
    stars: number; // 1 a 5
    comment: string;
    timestamp: string;
}

interface UserReputation {
    userId: string;
    reviews: Review[];
}

const STORAGE_PATH = path.join(__dirname, '../../reputations');

export class ReputationManager {
    constructor() {
        if (!fs.existsSync(STORAGE_PATH)) fs.mkdirSync(STORAGE_PATH, { recursive: true });
    }

    public addReview(targetId: string, review: Review) {
        const filePath = path.join(STORAGE_PATH, `${targetId}.json`);
        let data: UserReputation = { userId: targetId, reviews: [] };

        if (fs.existsSync(filePath)) {
            data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }

        data.reviews.push(review);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
    }

    public getReputation(targetId: string): { total: number, average: string, count: number, lastReview: Review | null } {
        const filePath = path.join(STORAGE_PATH, `${targetId}.json`);
        if (!fs.existsSync(filePath)) return { total: 0, average: "0.0", count: 0, lastReview: null };

        const data: UserReputation = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const totalStars = data.reviews.reduce((acc, r) => acc + r.stars, 0);
        
        return {
            total: totalStars,
            average: (totalStars / data.reviews.length).toFixed(1),
            count: data.reviews.length,
            lastReview: data.reviews[data.reviews.length - 1]
        };
    }
}