import fs from "fs";
import path from "path";

interface DailyActivity {
  date: string; // Formato DD/MM
  count: number;
}

// Caminho absoluto para evitar erros
const FILE_PATH = path.join(process.cwd(), "database", "activity_log.json");

export class ActivityManager {
  private logs: DailyActivity[] = [];

  constructor() {
    // Garante que a pasta existe
    const dir = path.dirname(FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Tenta carregar dados existentes
    if (fs.existsSync(FILE_PATH)) {
      try {
        this.logs = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
      } catch (e) {
        this.logs = [];
      }
    }
  }

  private save() {
    fs.writeFileSync(FILE_PATH, JSON.stringify(this.logs, null, 4));
  }

  // Registra uma nova mensagem no dia de hoje
  public addMessage() {
    const today = new Date().toLocaleDateString("pt-BR").slice(0, 5); // Pega apenas "DD/MM"
    let entry = this.logs.find((l) => l.date === today);

    if (!entry) {
      entry = { date: today, count: 0 };
      this.logs.push(entry);

      // Mantém apenas os últimos 7 dias no histórico para o gráfico não ficar gigante
      if (this.logs.length > 7) {
        this.logs.shift(); // Remove o dia mais antigo
      }
    }

    entry.count++;
    this.save();
  }

  // Retorna os dados formatados para o Chart.js
  public getWeekData() {
    // Se não tiver dados, retorna arrays vazios para não quebrar o frontend
    if (this.logs.length === 0) {
      return { labels: [], data: [] };
    }

    return {
      labels: this.logs.map((l) => l.date), // Eixo X: Datas
      data: this.logs.map((l) => l.count), // Eixo Y: Quantidade
    };
  }
}
