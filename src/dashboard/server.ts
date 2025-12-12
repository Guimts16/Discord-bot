import express from "express";
import cors from "cors";
import path from "path";
import { Client, TextChannel } from "discord.js";
import { AccountManager } from "../utils/AccountManager";
import { StatsManager } from "../utils/StatsManager";
import { ActivityManager } from "../utils/ActivityManager";
import { logger } from "../utils/LogManager";

const app = express();
const accountManager = new AccountManager();
const statsManager = new StatsManager();
const activityManager = new ActivityManager();

// --- AQUI ESTÁ A CHAVE: 'export' PRECISA ESTAR AQUI ---
export function startDashboard(client: Client) {
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(process.cwd(), "public")));

  // --- API: ESTATÍSTICAS GERAIS ---
  app.get("/api/stats", (req, res) => {
    const guild = client.guilds.cache.first();

    // Dados de Vendas
    const history = accountManager.getAllHistory();
    const soldItems = history.filter((c) => c.status === "VENDIDO");
    const availableItems = history.filter((c) => c.status === "DISPONIVEL");
    const revenue = soldItems.reduce(
      (acc, curr) =>
        acc + parseFloat(curr.price.replace(/[^0-9.]/g, "") || "0"),
      0
    );

    // Dados de Membros (Joins/Leaves)
    const memberStats = statsManager.getHistory();
    const todayStats = statsManager.getTodayStats();

    // Dados de Mensagens (Activity)
    const msgData = activityManager.getWeekData();

    // Dados para o Gráfico de Barras
    const chartDates = memberStats.map((s) => s.date.slice(0, 5));
    const chartJoins = memberStats.map((s) => s.joins);
    const chartLeaves = memberStats.map((s) => s.leaves);

    // Ranking Vendedores
    const sellersMap: Record<string, number> = {};
    soldItems.forEach(
      (i) => (sellersMap[i.sellerId] = (sellersMap[i.sellerId] || 0) + 1)
    );
    const topSellers = Object.entries(sellersMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => {
        const u = client.users.cache.get(id);
        return {
          name: u?.username || "Unknown",
          count,
          avatar: u?.displayAvatarURL(),
        };
      });

    // Estoque Simples
    const inventory = availableItems.map((i) => ({
      nick: i.nick,
      price: i.price,
      seller: client.users.cache.get(i.sellerId)?.username || "...",
      date: new Date(i.createdAt).toLocaleDateString("pt-BR"),
    }));

    res.json({
      cards: {
        messagesToday: msgData.data[msgData.data.length - 1] || 0,
        joinsToday: todayStats.joins,
        leavesToday: todayStats.leaves,
        totalMembers: guild?.memberCount || 0,
        revenue: revenue.toFixed(2),
        stock: inventory.length,
      },
      charts: {
        messages: msgData,
        members: {
          labels: chartDates,
          joins: chartJoins,
          leaves: chartLeaves,
        },
      },
      serverName: guild?.name,
      avatar: guild?.iconURL(),
      topSellers,
      inventory,
    });
  });

  // --- API: BUSCAR USUÁRIO ---
  app.get("/api/user/:id", async (req, res) => {
    try {
      let user = client.users.cache.get(req.params.id);
      if (!user) user = await client.users.fetch(req.params.id);
      const vendas = accountManager.getBySeller(user.id);

      // Simulação de reputação se não tiver o manager
      let rep = { average: "5.0" };
      try {
        const { ReputationManager } = require("../utils/ReputationManager");
        const rm = new ReputationManager();
        rep = rm.getReputation(user.id);
      } catch (e) {}

      res.json({
        username: user.username,
        avatar: user.displayAvatarURL(),
        salesCount: vendas.length,
        reputation: rep,
        history: vendas.map((v) => ({
          nick: v.nick,
          price: v.price,
          status: v.status,
          date: v.createdAt,
        })),
      });
    } catch (e) {
      res.status(404).json({ error: "User not found" });
    }
  });

  // --- API: DELETAR ITEM ---
  app.delete("/api/item/:nick", async (req, res) => {
    const nick = req.params.nick;
    const conta = accountManager.getAccount(nick);
    if (!conta) return res.status(404).json({ error: "Not found" });
    try {
      if (conta.messageUrl) {
        const parts = conta.messageUrl.split("/");
        const channel = client.channels.cache.get(
          parts[parts.length - 2]
        ) as TextChannel;
        if (channel) await channel.messages.delete(parts[parts.length - 1]);
      }
    } catch (e) {}
    accountManager.deleteAccount(nick);
    logger.warn(`[WEB] Item ${nick} deletado.`);
    res.json({ success: true });
  });

  // --- API: LOGS ---
  app.get("/api/logs", (req, res) => res.json(logger.getLogs()));

  app.listen(PORT, () =>
    logger.info(`🌐 Dashboard PRO: http://localhost:${PORT}`)
  );
}
