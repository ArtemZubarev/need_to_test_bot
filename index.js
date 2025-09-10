require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const tgBotToken = process.env.TG_BOT_TOKEN;
const youtrackToken = process.env.YOUTRACK_TOKEN;
const youtrackDomain = process.env.YOUTRACK_DOMAIN;
const port = process.env.PORT || 3000;

const app = express();
app.use(bodyParser.json());

// Создаем бота без polling
const bot = new TelegramBot(tgBotToken);
const webhookUrl = `${process.env.APP_URL}/${tgBotToken}`; // APP_URL = адрес сервиса Render

bot.setWebHook(webhookUrl);

// Функция для получения задач из YouTrack
async function getTasks() {
  try {
    const query = encodeURIComponent("State: {Test}");
    const res = await axios.get(
      `${youtrackDomain}/api/issues?fields=summary&query=${query}`,
      {
        headers: {
          Authorization: `Bearer ${youtrackToken}`,
          Accept: "application/json",
        },
      }
    );

    const tasks = res.data;
    if (tasks.length === 0) return "Нет задач в состоянии Test";

    return tasks.map((t, i) => `${i + 1}. ${t.summary}`).join("\n");
  } catch (err) {
    console.error(
      "YouTrack API error:",
      err.response?.status,
      err.response?.data || err.message
    );
    return "Ошибка при получении задач из YouTrack";
  }
}

// Обработка вебхука
app.post(`/${tgBotToken}`, async (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

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
    bot.sendMessage(
      chatId,
      `@ivanmarkov13 проверь плс, выкатил апдейт:\n\n${message}`
    );
  }

  bot.answerCallbackQuery(query.id);
});

app.listen(port, () => {
  console.log(`Bot server running on port ${port}`);
});
