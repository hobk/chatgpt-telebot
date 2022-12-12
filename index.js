import * as dotenv from 'dotenv'
import { ChatGPTAPI } from 'chatgpt'
import TelegramBot from 'node-telegram-bot-api'
dotenv.config()
const { token, sessionToken, clearanceToken, userAgent } = process.env

const bot = new TelegramBot(token, { polling: true });
console.log(new Date().toLocaleString(), '--Bot has been started...');

bot.on('message', (msg) => {
  console.log(new Date().toLocaleString(), '--收到来自id:', msg.chat.id, '的消息:', msg.text);
  msgHandler(msg);
});

function msgHandler(msg) {
  switch (true) {
    case msg.text.indexOf('/start') === 0:
      bot.sendMessage(msg.chat.id, '👋你好！很高兴能与您交谈。有什么我可以帮您的吗？');
      break;
    case msg.text.length >= 2:
      chatGpt(msg, bot);
      break;
    default:
      bot.sendMessage(msg.chat.id, '😭我不太明白您的意思。');
      break;
  }
}

async function chatGpt(msg, bot) {
  try {
    const api = new ChatGPTAPI({ sessionToken, clearanceToken, userAgent })
    await api.ensureAuth()
    bot.sendChatAction(msg.chat.id, 'typing')
    let tempId;
    bot.sendMessage(msg.chat.id, '🤔正在组织语言...').then((res) => {
      tempId = res.message_id
    })
    const response = await api.sendMessage(msg.text)
    bot.deleteMessage(msg.chat.id, tempId)
    console.log(new Date().toLocaleString(), '--AI回复:<', msg.text, '>:', response);
    bot.sendMessage(msg.chat.id, response, { parse_mode: 'Markdown' });
  } catch (err) {
    console.log(err)
    bot.deleteMessage(msg.chat.id, tempId)
    bot.sendMessage(msg.chat.id, '😭出错了，请稍后再试；如果您是管理员，请检查日志。');
    throw err
  }
}