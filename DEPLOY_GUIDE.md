# 🚀 快速部署指南

## 📋 重构总结

本次重构完成了以下主要改进：

### ✅ 已实现功能

1. **✅ 替换 API**: 从 `chatgpt` 包迁移到 OpenAI 官方 `openai` 包
2. **✅ 配置文件**: 通过 `config.json` 支持详细的 API 和行为配置
3. **✅ 上下文记忆**: 支持连续对话，自动管理会话历史
4. **✅ 命令系统**: 新增 `/clear`、`/help` 等命令
5. **✅ 增强错误处理**: 智能重试、详细错误分类、用户友好提示
6. **✅ 权限控制**: 支持用户和群组的白名单/黑名单
7. **✅ 优雅关闭**: 支持 SIGINT/SIGTERM 信号处理

### 🆕 新增工具

- **设置向导**: `npm run setup` - 交互式配置
- **配置测试**: `npm test` - 验证项目配置
- **开发模式**: `npm run dev` - 自动重启

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 运行设置向导
```bash
npm run setup
```

### 3. 验证配置
```bash
npm test
```

### 4. 启动机器人
```bash
npm start
```

## 📁 项目结构

```
chatgpt-tele/
├── index.js           # 主程序 (已重构)
├── config.json        # 配置文件 (新增)
├── setup.js           # 设置向导 (新增)
├── test-config.js     # 配置测试 (新增)
├── package.json       # 依赖配置 (已更新)
├── README.md          # 完整文档 (已更新)
├── DEPLOY_GUIDE.md    # 本文件 (新增)
└── .env               # 环境变量 (运行setup后生成)
```

## ⚙️ 核心配置

### 环境变量 (.env)
```bash
token=your_telegram_bot_token
apiKey=your_openai_api_key
baseURL=https://api.openai.com/v1  # 可选，支持代理
```

### 配置文件 (config.json)
```json
{
  "openai": {
    "model": "gpt-3.5-turbo",       # 模型选择
    "maxTokens": 2048,              # 最大回复长度
    "temperature": 0.7,             # 创造性 (0-1)
    "maxRetries": 3                 # 重试次数
  },
  "telegram": {
    "groupPrefix": "/gpt",          # 群组触发前缀
    "maxContextLength": 10,         # 上下文记忆条数
    "maxMessageLength": 4096        # 最大消息长度
  },
  "access": {
    "whitelist": {
      "enabled": false,             # 启用白名单
      "users": [],                  # 允许的用户ID
      "groups": []                  # 允许的群组ID
    },
    "blacklist": {
      "enabled": false,             # 启用黑名单
      "users": [],                  # 禁止的用户ID
      "groups": []                  # 禁止的群组ID
    }
  }
}
```

## 🎯 新功能使用

### 1. 上下文记忆
- 自动记住对话历史
- 支持连续对话
- 使用 `/clear` 清除历史

### 2. 权限控制
```json
{
  "access": {
    "whitelist": {
      "enabled": true,
      "users": [123456789],          # 你的用户ID
      "groups": [-1001234567890]     # 允许的群组ID
    }
  }
}
```

### 3. 错误处理
- 自动重试失败请求
- 详细错误分类和提示
- 网络问题、API限额等智能处理

## 🔧 高级配置

### 使用 GPT-4
```json
{
  "openai": {
    "model": "gpt-4",
    "maxTokens": 4096,
    "temperature": 0.8
  }
}
```

### 配置代理
```bash
# .env 文件
baseURL=https://your-proxy-domain.com/v1
```

### 生产部署
```bash
# PM2 部署 (推荐)
npm install -g pm2
pm2 start index.js --name chatgpt-bot
pm2 save
pm2 startup
```

## 🔍 故障排除

### 常见问题

1. **模块导入错误**
   ```bash
   npm install  # 重新安装依赖
   ```

2. **API 错误**
   ```bash
   npm test     # 检查配置
   ```

3. **权限问题**
   - 检查 `config.json` 权限设置
   - 查看日志获取用户/群组ID

### 获取 ID 方法
1. 启动机器人
2. 发送 `/start` 命令
3. 查看控制台日志中的 chat ID
4. 将 ID 添加到配置文件

## 📊 监控和日志

### 查看日志
```bash
# PM2 模式
pm2 logs chatgpt-bot

# 直接运行模式
# 查看控制台输出
```

### 性能监控
```bash
pm2 monit
```

## 🚀 升级建议

### 未来可考虑的功能
1. **数据库存储**: 使用 Redis/MongoDB 存储会话
2. **用量统计**: 记录 API 调用次数和成本
3. **多语言支持**: 支持国际化
4. **插件系统**: 支持扩展功能
5. **管理面板**: Web 界面管理配置

### 性能优化
1. **会话清理**: 定期清理过期会话
2. **缓存机制**: 缓存常用回复
3. **负载均衡**: 多实例部署

## 📞 支持

如有问题，请：
1. 查看 `README.md` 详细文档
2. 运行 `npm test` 检查配置
3. 查看控制台日志输出
4. 提交 GitHub Issue

---

🎉 **恭喜！你的 ChatGPT Telegram Bot 已经成功重构并可以使用了！** 