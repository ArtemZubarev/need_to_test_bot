require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const tgBotToken = process.env.TG_BOT_TOKEN;
const youtrackToken = process.env.YOUTRACK_TOKEN;
const youtrackDomain = process.env.YOUTRACK_DOMAIN;

const bot = new TelegramBot(tgBotToken, { polling: true });

// Функция для получения задач из YouTrack
async function getTasks() {
  try {
    const res = await axios.get(
      `https://${youtrackDomain}/api/issues?fields=summary&query=State: {Test}`,
      {
        headers: {
          Authorization: `Bearer ${youtrackToken}`,
        },
      }
    );

    const tasks = res.data;
    if (tasks.length === 0) return "Нет задач в состоянии Test";

    return tasks.map((t, i) => `${i + 1}. ${t.summary}`).join("\n");
  } catch (err) {
    console.error(err);
    return "Ошибка при получении задач из YouTrack";
  }
}

// Команда /start показывает кнопку
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, "Нажми кнопку, чтобы получить задачи в Test:", {
    reply_markup: {
      inline_keyboard: [[{ text: "Список задач", callback_data: "get_tasks" }]],
    },
  });
});

// Обработка нажатия кнопки
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;

  if (query.data === "get_tasks") {
    const message = await getTasks();
    bot.sendMessage(chatId, `Список задач в Test:\n\n${message}`);
  }

  // Чтобы убрать “часики” у кнопки после нажатия
  bot.answerCallbackQuery(query.id);
});

console.log("Telegram bot with button is running...");
