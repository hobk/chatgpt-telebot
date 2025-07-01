#!/usr/bin/env node

import fs from 'fs-extra'
import * as dotenv from 'dotenv'

async function testConfig() {
  console.log('🔍 正在检查项目配置...\n')

  let hasErrors = false

  // 检查配置文件
  try {
    const config = await fs.readJSON('./config.json')
    console.log('✅ config.json 文件存在且格式正确')

    // 验证必要的配置项
    const requiredFields = ['openai', 'telegram', 'access', 'messages']
    for (const field of requiredFields) {
      if (!config[field]) {
        console.log(`❌ config.json 缺少必要字段: ${field}`)
        hasErrors = true
      }
    }

    if (!hasErrors) {
      console.log('✅ config.json 配置项完整')
    }

  } catch (error) {
    console.log('❌ config.json 文件不存在或格式错误:', error.message)
    hasErrors = true
  }

  // 检查环境变量文件
  if (await fs.pathExists('./.env')) {
    dotenv.config()
    console.log('✅ .env 文件存在')

    const { token, apiKey } = process.env
    if (!token) {
      console.log('❌ .env 文件缺少 token')
      hasErrors = true
    } else {
      console.log('✅ Telegram token 已配置')
    }

    if (!apiKey) {
      console.log('❌ .env 文件缺少 apiKey')
      hasErrors = true
    } else {
      console.log('✅ OpenAI API key 已配置')
    }

  } else {
    console.log('❌ .env 文件不存在，请运行 npm run setup 进行配置')
    hasErrors = true
  }

  // 检查依赖
  try {
    await import('openai')
    console.log('✅ OpenAI 包已安装')
  } catch (error) {
    console.log('❌ OpenAI 包未安装:', error.message)
    hasErrors = true
  }

  try {
    await import('node-telegram-bot-api')
    console.log('✅ Telegram Bot API 包已安装')
  } catch (error) {
    console.log('❌ Telegram Bot API 包未安装:', error.message)
    hasErrors = true
  }

  console.log('\n' + '='.repeat(50))

  if (hasErrors) {
    console.log('❌ 配置检查完成，发现问题，请解决后重试')
    console.log('\n建议操作:')
    console.log('1. 运行 npm run setup 进行初始配置')
    console.log('2. 检查 .env 文件是否正确填写')
    console.log('3. 运行 npm install 确保依赖安装完整')
    process.exit(1)
  } else {
    console.log('✅ 所有配置检查通过！机器人已准备就绪')
    console.log('\n可以使用以下命令启动:')
    console.log('   npm start      # 生产模式')
    console.log('   npm run dev    # 开发模式')
  }
}

testConfig().catch(console.error) 