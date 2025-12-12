import fs from "fs";
import path from "path";

interface DailyStats {
  date: string; // Formato DD/MM/AAAA
  joins: number;
  leaves: number;
}

const FILE_PATH = path.join(process.cwd(), "database", "server_stats.json");

export class StatsManager {
  private stats: DailyStats[] = [];

  constructor() {
    const dir = path.dirname(FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (fs.existsSync(FILE_PATH)) {
      try {
        this.stats = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
      } catch (e) {
        this.stats = [];
      }
    }
  }

  private save() {
    fs.writeFileSync(FILE_PATH, JSON.stringify(this.stats, null, 4));
  }

  private getTodayStr(): string {
    return new Date().toLocaleDateString("pt-BR");
  }

  public registerJoin() {
    const today = this.getTodayStr();
    let entry = this.stats.find((s) => s.date === today);

    if (!entry) {
      entry = { date: today, joins: 0, leaves: 0 };
      this.stats.push(entry);
    }

    entry.joins++;
    this.save();
  }

  public registerLeave() {
    const today = this.getTodayStr();
    let entry = this.stats.find((s) => s.date === today);

    if (!entry) {
      entry = { date: today, joins: 0, leaves: 0 };
      this.stats.push(entry);
    }

    entry.leaves++;
    this.save();
  }

  public getTodayStats() {
    const today = this.getTodayStr();
    return (
      this.stats.find((s) => s.date === today) || {
        date: today,
        joins: 0,
        leaves: 0,
      }
    );
  }

  public getHistory() {
    return this.stats;
  }
}
