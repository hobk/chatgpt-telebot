#!/usr/bin/env node

import fs from 'fs-extra'
import readline from 'readline'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function setup() {
  console.log('🚀 ChatGPT Telegram Bot 设置向导\n')

  try {
    // 检查配置文件是否存在
    if (!await fs.pathExists('./config.json')) {
      console.log('❌ 配置文件 config.json 不存在，请先确保项目文件完整')
      process.exit(1)
    }

    // 询问用户配置
    console.log('请提供以下必要信息：\n')

    const token = await question('1. Telegram Bot Token (从 @BotFather 获取): ')
    if (!token.trim()) {
      console.log('❌ Telegram Bot Token 是必需的')
      process.exit(1)
    }

    const apiKey = await question('2. OpenAI API Key (从 https://platform.openai.com/account/api-keys 获取): ')
    if (!apiKey.trim()) {
      console.log('❌ OpenAI API Key 是必需的')
      process.exit(1)
    }

    const baseURL = await question('3. OpenAI API Base URL (可选，直接回车使用默认): ')

    // 生成 .env 文件内容
    const envContent = `# Telegram Bot Token
token=${token.trim()}

# OpenAI API Key
apiKey=${apiKey.trim()}

# OpenAI API Base URL (可选)
${baseURL.trim() ? `baseURL=${baseURL.trim()}` : '# baseURL=https://api.openai.com/v1'}

# 其他可选环境变量
# NODE_ENV=production
`

    // 写入 .env 文件
    await fs.writeFile('./.env', envContent)
    console.log('\n✅ .env 文件已创建成功!')

    // 询问是否要配置权限控制
    const configPermissions = await question('\n是否要配置权限控制 (白名单/黑名单)? (y/N): ')

    if (configPermissions.toLowerCase().startsWith('y')) {
      console.log('\n📋 权限控制配置:')
      console.log('你可以通过以下方式获取用户/群组ID:')
      console.log('1. 启动机器人后，用户发送 /start 命令')
      console.log('2. 查看控制台日志，会显示 chat ID')
      console.log('3. 将 ID 添加到 config.json 的相应位置')

      const enableWhitelist = await question('\n启用白名单模式? (y/N): ')
      const enableBlacklist = await question('启用黑名单模式? (y/N): ')

      // 读取现有配置
      const config = await fs.readJSON('./config.json')

      // 更新权限配置
      config.access.whitelist.enabled = enableWhitelist.toLowerCase().startsWith('y')
      config.access.blacklist.enabled = enableBlacklist.toLowerCase().startsWith('y')

      // 写回配置文件
      await fs.writeJSON('./config.json', config, { spaces: 2 })
      console.log('✅ 权限配置已更新!')
    }

    console.log('\n🎉 设置完成! 你现在可以启动机器人了:')
    console.log('   npm start          # 生产模式')
    console.log('   npm run dev        # 开发模式')
    console.log('   pm2 start index.js # PM2 模式')

    console.log('\n📖 更多配置选项请查看 config.json 文件')
    console.log('📚 详细文档请查看 README.md')

  } catch (error) {
    console.error('❌ 设置过程中出现错误:', error.message)
    process.exit(1)
  } finally {
    rl.close()
  }
}

setup() 