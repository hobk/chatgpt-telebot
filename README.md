# # 🔮ChatGPT Telegrame Bot (nodejs)

> 💍️Telegram_bot powered by [chatGPT](https://chat.openai.com)，
demo:[@sisChatBot](https://t.me/sisChatBot)
![image](https://www.helloimg.com/images/2022/12/07/Zy9IPb.md.jpg)

## 事前准备🛡️
- 申请Telegram bot api token : https://t.me/BotFather
- 获取[OpenAi apiKey](https://platform.openai.com/account/api-keys)
- Node.js版本 18+

## 部署⚔️

1. 复制项目到本地，安装依赖

   ```bash
   git clone https://github.com/hobk/chatgpt-telebot.git
   cd chatgpt-telebot
   npm install
   ```

2.  复制 `.env.example` 并命名为 `.env`
   
   ```bash
    cp .env.example .env
   ```

3. 把之前准备的 Telegram bot token 和 openAi apiKey 对应写入 .env 文件

   ```bash
   # inside .env
      token='your TelegramBot token'
      apiKey='your openAi apiKey'
   ```

4. 启动

   ```bash
    node index.js
    # 或者使用 pm2 （安装：npm i pm2）
    pm2 start index.js
   ``` 
