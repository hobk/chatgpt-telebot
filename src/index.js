import * as dotenv from 'dotenv'
import TelegramBot from 'node-telegram-bot-api'
import { ChatGPTAPI } from 'chatgpt'
import {db, updateLastMessageId} from './db';

dotenv.config()

const { token, apiKey, group_name, allowed_users } = process.env

const ALLOWED_USERS = JSON.parse(allowed_users)

const prefix = group_name ? '/' + group_name : '/gpt'
const bot = new TelegramBot(token, { polling: true });
console.log(new Date().toLocaleString(), '--Bot has been started...');

const api = new ChatGPTAPI({ apiKey, completionParams: {
  model: 'gpt-4o',
  temperature: 0.5,
  top_p: 0.8
}})

bot.on('text', async (msg) => {
  console.log(new Date().toLocaleString(), '--Received message from id:', msg.chat.id, ':', msg.text);
  await msgHandler(msg);
});

async function msgHandler(msg) {
  try {
    if (typeof msg.text !== 'string' || ((msg.chat.type === 'group' || msg.chat.type === 'supergroup') && !msg.text.startsWith(prefix))) {
      return;
    }
    
    switch (true) {
      case !ALLOWED_USERS[msg.chat.id]:
        await bot.sendMessage(msg.chat.id, 'You have no access. Sorry...');
      case msg.text.startsWith('/start'):
        await bot.sendMessage(msg.chat.id, 'hi!');
        break;
      case msg.text.length >= 2:
        await chatGpt(msg);
        break;
      default:
        await bot.sendMessage(msg.chat.id, 'what?');
        break;
    }
  } catch (err) {
    console.log('Error:', err)
    await bot.sendMessage(msg.chat.id, '😭 Exception');
  }
}

async function chatGpt(msg) {
    const tempId = (await bot.sendMessage(msg.chat.id, '🤔Please wait...', {
      reply_to_message_id: msg.message_id
    })).message_id;
    bot.sendChatAction(msg.chat.id, 'typing');
    const prevMessageId = db[msg.chat.id].prevMessageId;
    const response = await api.sendMessage(msg.text.replace(prefix, ''), {parentMessageId: prevMessageId})
    updateLastMessageId(msg.chat.id, response.id);
    console.log(new Date().toLocaleString(), '--AI response to <', msg.text, '>:', response.text);
    await bot.editMessageText(response.text, { parse_mode: 'Markdown', chat_id: msg.chat.id, message_id: tempId });
}