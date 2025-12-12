// src/utils/LogManager.ts
export interface LogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "CMD" | "SALES";
  message: string;
}

class LogManager {
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 50; // Guarda as últimas 50 linhas

  public add(level: LogEntry["level"], message: string) {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString("pt-BR"),
      level,
      message,
    };

    // Adiciona no INÍCIO da lista (mais recente primeiro)
    this.logs.unshift(entry);

    // Remove antigos se passar do limite
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.pop();
    }

    // Mostra no terminal do VS Code também (colorido)
    const colors = {
      INFO: "\x1b[36m", // Ciano
      WARN: "\x1b[33m", // Amarelo
      ERROR: "\x1b[31m", // Vermelho
      CMD: "\x1b[35m", // Roxo
      SALES: "\x1b[32m", // Verde
    };
    console.log(`${colors[level] || "\x1b[37m"}[${level}] \x1b[0m${message}`);
  }

  public getLogs() {
    return this.logs;
  }

  // Atalhos rápidos
  public info(msg: string) {
    this.add("INFO", msg);
  }
  public warn(msg: string) {
    this.add("WARN", msg);
  }
  public error(msg: string) {
    this.add("ERROR", msg);
  }
  public cmd(msg: string) {
    this.add("CMD", msg);
  }
  public sales(msg: string) {
    this.add("SALES", msg);
  }
}

// Exporta uma instância única para todo o projeto usar a mesma memória
export const logger = new LogManager();
