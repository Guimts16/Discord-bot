import fs from 'fs';
import path from 'path';

interface Coupon {
    code: string;
    discountPercent: number;
    uses: number;
}

const FILE_PATH = path.join(__dirname, '../../coupons.json');

export class CouponManager {
    private coupons: Record<string, Coupon> = {};

    constructor() {
        if (fs.existsSync(FILE_PATH)) {
            this.coupons = JSON.parse(fs.readFileSync(FILE_PATH, 'utf-8'));
        }
    }

    private save() {
        fs.writeFileSync(FILE_PATH, JSON.stringify(this.coupons, null, 4));
    }

    public create(code: string, percent: number) {
        this.coupons[code.toUpperCase()] = { code: code.toUpperCase(), discountPercent: percent, uses: 0 };
        this.save();
    }

    public use(code: string): number | null { // Retorna a % de desconto ou null se inválido
        const c = this.coupons[code.toUpperCase()];
        if (c) {
            c.uses++;
            this.save();
            return c.discountPercent;
        }
        return null;
    }
    
    public list() { return Object.values(this.coupons); }
}