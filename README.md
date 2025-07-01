# 🔮 ChatGPT Telegram Bot (重构版)

<img src="https://www.helloimg.com/images/2023/02/02/oZLhl9.jpg" width = "400"/>

一个功能丰富的 ChatGPT Telegram 机器人，使用 OpenAI 官方 API，支持上下文记忆、权限控制、增强错误处理等高级功能。

## ✨ 主要功能

- 🧠 **上下文记忆**: 支持连续对话，记住上下文内容
- 🎛️ **灵活配置**: 通过配置文件自定义 API 参数和机器人行为
- 🔐 **权限控制**: 支持用户和群组的白名单/黑名单
- 🔄 **智能重试**: 自动重试失败的请求，增强稳定性
- 📱 **命令支持**: 丰富的命令系统 (`/clear`, `/help` 等)
- 🛡️ **错误处理**: 详细的错误分类和用户友好的错误提示
- 👥 **群组支持**: 完整的群组和私聊支持
- 🚀 **优雅关闭**: 支持优雅的进程关闭

## 📋 可用命令

- `/start` - 开始对话并清除历史
- `/clear` - 清除当前对话历史
- `/help` - 查看帮助信息
- 直接发送消息 - 与 ChatGPT 对话

## 🛡️ 事前准备

- **Node.js 18+**
- **Telegram Bot Token**: 从 [@BotFather](https://t.me/BotFather) 获取
- **OpenAI API Key**: 从 [OpenAI](https://platform.openai.com/account/api-keys)或者其他支持OpenAI格式API的平台获取

## 🚀 快速部署

### 1. 克隆项目并安装依赖

```bash
git clone https://github.com/hobk/chatgpt-telebot.git
cd chatgpt-telebot
npm install
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

在 `.env` 文件中填入你的配置：

```bash
token=your_telegram_bot_token_here
apiKey=your_openai_api_key_here
baseURL=https://api.openai.com/v1  # 可选，使用代理时修改
```

### 3. 自定义配置（可选）

编辑 `config.json` 文件来自定义机器人行为：

```json
{
  "openai": {
    "model": "gpt-3.5-turbo",      // 使用的模型
    "maxTokens": 2048,             // 最大回复长度
    "temperature": 0.7,            // 创造性（0-1）
    "maxRetries": 3                // 重试次数
  },
  "telegram": {
    "groupPrefix": "/gpt",         // 群组触发前缀
    "maxContextLength": 10,        // 上下文记忆条数
    "maxMessageLength": 4096       // 最大消息长度
  },
  "access": {
    "whitelist": {
      "enabled": false,            // 启用白名单
      "users": [],                 // 允许的用户ID
      "groups": []                 // 允许的群组ID
    },
    "blacklist": {
      "enabled": false,            // 启用黑名单
      "users": [],                 // 禁止的用户ID
      "groups": []                 // 禁止的群组ID
    }
  }
}
```

### 4. 启动机器人

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start

# 使用 PM2（推荐生产环境）
npm install -g pm2
pm2 start index.js --name chatgpt-bot
```

## 🔧 高级配置

### 权限控制

要启用权限控制，请修改 `config.json`：

```json
{
  "access": {
    "whitelist": {
      "enabled": true,
      "users": [123456789, 987654321],     // 允许的用户ID
      "groups": [-1001234567890]           // 允许的群组ID
    }
  }
}
```

### API 代理配置

如果需要使用代理访问 OpenAI API，修改 `.env` 文件：

```bash
baseURL=https://your-proxy-domain.com/v1
```

### 模型选择

支持所有 OpenAI Chat 模型，在 `config.json` 中修改：

```json
{
  "openai": {
    "model": "gpt-4",              // 或 gpt-3.5-turbo, gpt-4-turbo-preview 等
    "maxTokens": 4096,             // GPT-4 支持更长回复
    "temperature": 0.8             // 调整创造性
  }
}
```

## 📖 使用说明

### 私聊使用
直接发送消息给机器人即可开始对话。

### 群组使用
1. 将机器人添加到群组
2. 发送以 `/gpt` 开头的消息（可在配置中修改前缀）
3. 例如：`/gpt 你好，请介绍一下自己`

### 获取用户/群组ID
发送 `/start` 命令，机器人会在日志中显示 chat ID，用于配置白名单/黑名单。

## 🔍 故障排除

### 常见错误

1. **API 密钥无效**
   - 检查 `.env` 文件中的 `apiKey` 是否正确
   - 确认 API 密钥有足够的额度

2. **网络连接问题**
   - 检查服务器网络连接
   - 如在中国大陆，可能需要配置代理

3. **权限问题**
   - 检查机器人是否有发送消息权限
   - 确认用户/群组不在黑名单中

### 查看日志

```bash
# 如果使用 PM2
pm2 logs chatgpt-bot

# 直接运行时查看控制台输出
```

## 🚀 部署建议

### 服务器部署
推荐使用 PM2 进行进程管理：

```bash
pm2 start index.js --name chatgpt-bot
pm2 save
pm2 startup
```

### Docker 部署
创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["npm", "start"]
```

## 📝 更新日志

### v2.0.0
- ✅ 重构为使用 OpenAI 官方 API
- ✅ 增加上下文记忆功能
- ✅ 支持配置文件自定义
- ✅ 增加权限控制（白名单/黑名单）
- ✅ 增强错误处理和重试机制
- ✅ 添加更多命令支持
- ✅ 优化用户体验

## 📄 许可证

ISC License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
