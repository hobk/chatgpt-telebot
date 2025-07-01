import * as dotenv from 'dotenv'
import TelegramBot from 'node-telegram-bot-api'
import OpenAI from 'openai'
import fs from 'fs-extra'
import { v4 as uuidv4 } from 'uuid'

dotenv.config()

// 加载配置文件
const config = await fs.readJSON('./config.json')

// 环境变量
const { token, apiKey, baseURL } = process.env
if (!token || !apiKey) {
  console.error('❌ 缺少必要的环境变量: token 和 apiKey')
  process.exit(1)
}

// 初始化 OpenAI 客户端
const openai = new OpenAI({
  apiKey,
  baseURL: baseURL || 'https://api.openai.com/v1',
  timeout: config.openai.timeout,
  maxRetries: config.openai.maxRetries
})

// 初始化 Telegram Bot
const bot = new TelegramBot(token, { polling: true })
console.log(new Date().toLocaleString(), '🚀 Bot has been started...')

// 会话存储 - 在生产环境中应该使用数据库
const sessions = new Map()

// 错误重试配置
const RETRY_DELAYS = [1000, 2000, 5000] // 重试延迟时间（毫秒）

/**
 * 会话管理类
 */
class SessionManager {
  static getSession(chatId) {
    if (!sessions.has(chatId)) {
      sessions.set(chatId, {
        id: uuidv4(),
        messages: [],
        createdAt: new Date(),
        lastActiveAt: new Date()
      })
    }
    return sessions.get(chatId)
  }

  static addMessage(chatId, role, content) {
    const session = this.getSession(chatId)
    session.messages.push({ role, content, timestamp: new Date() })
    session.lastActiveAt = new Date()

    // 限制上下文长度
    if (session.messages.length > config.telegram.maxContextLength * 2) {
      session.messages = session.messages.slice(-config.telegram.maxContextLength * 2)
    }
  }

  static clearSession(chatId) {
    sessions.delete(chatId)
  }

  static getMessages(chatId) {
    const session = this.getSession(chatId)
    return session.messages
  }
}

/**
 * 权限检查
 */
function checkPermissions(msg) {
  const userId = msg.from.id
  const chatId = msg.chat.id
  const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

  // 检查黑名单
  if (config.access.blacklist.enabled) {
    if (config.access.blacklist.users.includes(userId) ||
      (isGroup && config.access.blacklist.groups.includes(chatId))) {
      return false
    }
  }

  // 检查白名单
  if (config.access.whitelist.enabled) {
    if (!config.access.whitelist.users.includes(userId) &&
      !(isGroup && config.access.whitelist.groups.includes(chatId))) {
      return false
    }
  }

  return true
}

/**
 * 错误处理装饰器
 */
function withErrorHandling(fn) {
  return async function (...args) {
    const [msg] = args
    let attempts = 0

    while (attempts < config.openai.maxRetries) {
      try {
        return await fn.apply(this, args)
      } catch (error) {
        attempts++
        console.error(`❌ 尝试 ${attempts}/${config.openai.maxRetries} 失败:`, error.message)

        if (attempts >= config.openai.maxRetries) {
          let errorMessage = config.messages.error

          // 根据错误类型提供更具体的错误信息
          if (error.status === 429) {
            errorMessage = '🚫 请求过于频繁，请稍后再试'
          } else if (error.status === 401) {
            errorMessage = '🔑 API密钥无效，请联系管理员'
          } else if (error.status === 403) {
            errorMessage = '⛔ API访问被拒绝，请联系管理员'
          } else if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND') {
            errorMessage = '🌐 网络连接失败，请稍后再试'
          }

          await bot.sendMessage(msg.chat.id, errorMessage)
          throw error
        }

        // 等待后重试
        if (attempts < config.openai.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempts - 1] || 5000))
        }
      }
    }
  }
}

/**
 * 主消息处理器
 */
bot.on('text', async (msg) => {
  console.log(new Date().toLocaleString(), '📨 Received message from', msg.chat.id, ':', msg.text)

  // 权限检查
  if (!checkPermissions(msg)) {
    await bot.sendMessage(msg.chat.id, config.messages.unauthorized)
    return
  }

  await msgHandler(msg)
})

/**
 * 消息路由处理
 */
async function msgHandler(msg) {
  const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'
  const prefix = config.telegram.groupPrefix

  // 群组消息必须以前缀开头
  if (isGroup && !msg.text.startsWith(prefix)) {
    return
  }

  // 移除前缀
  const text = isGroup ? msg.text.replace(prefix, '').trim() : msg.text.trim()

  // 检查消息长度
  if (text.length > config.telegram.maxMessageLength) {
    await bot.sendMessage(msg.chat.id, config.messages.tooLong)
    return
  }

  try {
  // 命令处理
    switch (true) {
      case text.startsWith('/start'):
        await handleStartCommand(msg)
        break
      case text.startsWith('/clear'):
        await handleClearCommand(msg)
        break
      case text.startsWith('/help'):
        await handleHelpCommand(msg)
        break
      case text.length >= 1:
        await handleChatMessage(msg, text)
        break
      default:
        await bot.sendMessage(msg.chat.id, '😅 请发送有效的消息或命令')
        break
    }
  } catch (error) {
    console.error('💥 Message handler error:', error)
    await bot.sendMessage(msg.chat.id, config.messages.error)
  }
}

/**
 * 命令处理器
 */
async function handleStartCommand(msg) {
  SessionManager.clearSession(msg.chat.id)
  await bot.sendMessage(msg.chat.id, config.messages.welcome, { parse_mode: 'Markdown' })
}

async function handleClearCommand(msg) {
  SessionManager.clearSession(msg.chat.id)
  await bot.sendMessage(msg.chat.id, config.messages.cleared)
}

async function handleHelpCommand(msg) {
  await bot.sendMessage(msg.chat.id, config.messages.help, { parse_mode: 'Markdown' })
}

/**
 * ChatGPT 消息处理
 */
const handleChatMessage = withErrorHandling(async function (msg, text) {
  // 发送思考中消息
  const thinkingMsg = await bot.sendMessage(msg.chat.id, config.messages.thinking, {
    reply_to_message_id: msg.message_id
  })

  // 显示输入状态
  bot.sendChatAction(msg.chat.id, 'typing')

  try {
    // 添加用户消息到会话历史
    SessionManager.addMessage(msg.chat.id, 'user', text)

    // 获取会话历史
    const messages = SessionManager.getMessages(msg.chat.id)

    // 调用 OpenAI API
    const completion = await openai.chat.completions.create({
      model: config.openai.model,
      messages: messages,
      max_tokens: config.openai.maxTokens,
      temperature: config.openai.temperature,
      top_p: config.openai.topP,
      frequency_penalty: config.openai.frequencyPenalty,
      presence_penalty: config.openai.presencePenalty,
    })

    const response = completion.choices[0].message.content
    console.log(new Date().toLocaleString(), '🤖 AI response to <', text, '>:', response)

    // 添加AI回复到会话历史
    SessionManager.addMessage(msg.chat.id, 'assistant', response)

    // 编辑消息显示回复
    await bot.editMessageText(response, {
      chat_id: msg.chat.id,
      message_id: thinkingMsg.message_id,
      parse_mode: 'Markdown'
    })

  } catch (error) {
    // 删除思考中消息
    await bot.deleteMessage(msg.chat.id, thinkingMsg.message_id).catch(() => { })
    throw error
  }
})

/**
 * 错误处理
 */
bot.on('error', (error) => {
  console.error('🚨 Bot error:', error)
})

bot.on('polling_error', (error) => {
  console.error('🚨 Polling error:', error)
})

process.on('uncaughtException', (error) => {
  console.error('💀 Uncaught exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('💀 Unhandled rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

/**
 * 优雅关闭
 */
process.on('SIGINT', async () => {
  console.log('\n🛑 收到 SIGINT 信号，正在关闭 bot...')
  await bot.stopPolling()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 收到 SIGTERM 信号，正在关闭 bot...')
  await bot.stopPolling()
  process.exit(0)
})