import * as dotenv from 'dotenv'
import TelegramBot from 'node-telegram-bot-api'
import { ChatGPTAPI } from './chatgpt-api/index.js'

dotenv.config()

const { token, apiKey } = process.env
const bot = new TelegramBot(token, { polling: true });
console.log(new Date().toLocaleString(), '--Bot has been started...');

const api = new ChatGPTAPI({ apiKey })
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
function chatGpt(msg, bot) {
  try {
    bot.sendMessage(msg.chat.id, '🤔正在组织语言...').then(async (res) => {
      bot.sendChatAction(msg.chat.id, 'typing')
      let tempId = res.message_id
      const response = await api.sendMessage(msg.text)
      bot.deleteMessage(msg.chat.id, tempId)
      tempId = null
      console.log(new Date().toLocaleString(), '--AI回复:<', msg.text, '>:', response.text);
      bot.sendMessage(msg.chat.id, response.text, { parse_mode: 'Markdown' });
    })

  } catch (err) {
    console.log('错误信息', err)
    bot.sendMessage(msg.chat.id, '😭出错了，请稍后再试；如果您是管理员，请检查日志。');
    throw err
  }
}