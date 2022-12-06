# # dungeon ai 🔮

> 💍♂️ Telegram_bot powered by [chatGPT](https://chat.openai.com)


this app uses the [chatgpt-api](https://github.com/transitive-bullshit/chatgpt-api) package to interface with ChatGPT. 

## requirements🛡️

you will need:

- Node.js installed on your machine
- a ChatGPT session token for the `.env` file (follow [these instructions](https://github.com/transitive-bullshit/chatgpt-api#how-it-works) to get one)

## run⚔️

1. install dependencies

   ```bash
   npm install
   ```

1. create copy of `.env.example` named `.env`

   ```bash
   cp .env.example .env
   ```

1. add your ChatGPT session token and Telegram_bot_token to the .env file

   ```bash
   # inside .env
   TOKEN=your_telegrame_bot_token
   SESSION_TOKEN=your_session_token_here
   ```

1. start the app

   ```bash
    node index.js
   ``` 🔮

