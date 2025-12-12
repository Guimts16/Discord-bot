import fs from "fs";
import path from "path";
import { logger } from "./LogManager";

export interface AccountData {
  id: string;
  nick: string;
  price: string;
  description: string;
  vips: string;
  cosmetics: string;
  wins: string;
  images: string[];
  sellerId: string;
  messageUrl: string;
  status: "DISPONIVEL" | "VENDIDO";
  createdAt: string;
}

const STORAGE_PATH = path.join(process.cwd(), "database", "accounts");

export class AccountManager {
  constructor() {
    if (!fs.existsSync(STORAGE_PATH)) {
      fs.mkdirSync(STORAGE_PATH, { recursive: true });
    }
  }

  public saveAccount(data: AccountData): void {
    const filePath = path.join(STORAGE_PATH, `${data.nick.toLowerCase()}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
    logger.info(`[DB] Conta salva: ${data.nick}`);
  }

  public getAllHistory(): AccountData[] {
    if (!fs.existsSync(STORAGE_PATH)) return [];
    const files = fs
      .readdirSync(STORAGE_PATH)
      .filter((f) => f.endsWith(".json"));
    const accounts: AccountData[] = [];
    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(STORAGE_PATH, file), "utf-8");
        accounts.push(JSON.parse(raw));
      } catch (e) {}
    }
    return accounts;
  }

  public getAllAvailable(): AccountData[] {
    return this.getAllHistory().filter((acc) => acc.status === "DISPONIVEL");
  }

  public getBySeller(sellerId: string): AccountData[] {
    return this.getAllHistory().filter((acc) => acc.sellerId === sellerId);
  }

  public getAccount(nick: string): AccountData | null {
    const filePath = path.join(STORAGE_PATH, `${nick.toLowerCase()}.json`);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
    return null;
  }

  public deleteAccount(nick: string): boolean {
    const filePath = path.join(STORAGE_PATH, `${nick.toLowerCase()}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.warn(`[DB] Conta deletada: ${nick}`);
      return true;
    }
    return false;
  }
}
