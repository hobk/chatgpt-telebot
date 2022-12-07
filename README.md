# # 🔮ChatGPT Telegrame Bot (nodejs)

> 💍️Telegram_bot powered by [chatGPT](https://chat.openai.com)，
demo:[@sisChatBot](https://t.me/sisChatBot)
![image](https://www.helloimg.com/images/2022/12/07/Zy9IPb.md.jpg)

## 事前准备🛡️
- 申请Telegram bot api token : https://t.me/BotFather
- 获取ChatGPT session token 
- - 注册登录[OpenAI ChatGPT](https://chat.openai.com/chat)账号，然后打开控台-->应用程序-->Cookie-->复制名称为xxxxxx.session.token对应的value值，如下图
- - ![image](https://www.helloimg.com/images/2022/12/07/Zy9MqR.png)
- Node.js环境

## 部署⚔️

1. 复制项目到本地，安装依赖

   ```bash
   git clone https://github.com/hobk/chatgpt-telebot.git
   cd chagpt-telebot
   npm install
   ```

2.  复制 `.env.example` 并命名为 `.env`
   
   ```bash
    cp .env.example .env
   ```

3. 把之前准备的 ChatGPT session token  和Telegram bot  token 对应写入 .env 文件

   ```bash
   # inside .env
   TOKEN='your_telegrame_bot_token'
   SESSION_TOKEN='your_chatGPT_session_token'
   ```

4. 启动

   ```bash
    node index.js
    # 或者使用 pm2 （安装：npm i pm2）
    pm2 start index.js
   ``` 