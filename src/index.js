/* globals console */

import { ChatGPTAPI } from 'chatgpt'
import { db, updateLastMessageId } from './db.js'
import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import {
  TELEGRAM_GROUP_NAME,
  TELEGRAM_TOKEN,
  ALLOWED_USERS,
  OPEN_AI_API_KEY,
  OPEN_AI_MODEL_VERSION,
  OPEN_AI_MODEL_TEMPERATURE,
  TELEGRAM_MESSAGE_MAX_LENGTH,
} from './config.js'
import { escapeMarkdownCharacters } from './utils/markdown/index.js'
import { splitMarkdown } from './utils/markdown/index.js'

const prefix = TELEGRAM_GROUP_NAME ? '/' + TELEGRAM_GROUP_NAME : '/gpt'
const telegraf = new Telegraf(TELEGRAM_TOKEN)
const bot = telegraf.telegram
console.log(new Date().toLocaleString(), '--Bot has been started...')

const api = new ChatGPTAPI({
  apiKey: OPEN_AI_API_KEY,
  completionParams: {
    model: OPEN_AI_MODEL_VERSION,
    temperature: Number(OPEN_AI_MODEL_TEMPERATURE),
  },
})

telegraf.on(message('text'), async ({ msg }) => {
  console.log(
    new Date().toLocaleString(),
    '--Received message from id:',
    msg.chat.id,
    ':',
    msg.text
  )

  await msgHandler(msg)
})

async function msgHandler(msg) {
  try {
    if (
      typeof msg.text !== 'string' ||
      ((msg.chat.type === 'group' || msg.chat.type === 'supergroup') &&
        !msg.text.startsWith(prefix))
    ) {
      return
    }

    switch (true) {
      case !ALLOWED_USERS[msg.chat.id]:
        await bot.sendMessage(msg.chat.id, 'You have no access. Sorry...')
      case msg.text.startsWith('/start'):
        await bot.sendMessage(msg.chat.id, 'hi!')
        break
      case msg.text.length >= 2:
        await chatGpt(msg)
        break
      default:
        await bot.sendMessage(msg.chat.id, 'what?')
        break
    }
  } catch (err) {
    console.log('Error:', err)
    await bot.sendMessage(msg.chat.id, '😭 Exception')
  }
}

async function chatGpt(msg) {
  const tempId = (
    await bot.sendMessage(msg.chat.id, '🤔Please wait...', {
      reply_parameters: { message_id: msg.message_id },
    })
  ).message_id
  bot.sendChatAction(msg.chat.id, 'typing')

  const prevMessageId = db[msg.chat.id].prevMessageId

  const response = await api.sendMessage(msg.text.replace(prefix, ''), {
    parentMessageId: prevMessageId,
  })

  console.log(response)

  updateLastMessageId(msg.chat.id, response.id)

  console.log(new Date().toLocaleString(), '--AI response to <', msg.text, '>:', response.text)

  if (response.text.length > TELEGRAM_MESSAGE_MAX_LENGTH) {
    const chunks = splitMarkdown(response.text)

    await bot.deleteMessage(msg.chat.id, tempId)

    chunks.forEach(async (chunk) => {
      await bot.sendMessage(msg.chat.id, escapeMarkdownCharacters(`${chunk}`), {
        parse_mode: 'MarkdownV2',
      })
    })
  } else {
    await bot.editMessageText(
      msg.chat.id,
      tempId,
      undefined,
      escapeMarkdownCharacters(`${response.text}`),
      {
        parse_mode: 'MarkdownV2',
      }
    )
  }
}

telegraf.launch()
