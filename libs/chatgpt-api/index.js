// src/chatgpt-api.ts
import { encode as gptEncode } from "gpt-3-encoder";
import Keyv from "keyv";
import pTimeout from "p-timeout";
import QuickLRU from "quick-lru";
import { v4 as uuidv4 } from "uuid";

// src/types.ts
var ChatGPTError = class extends Error {
};

// src/fetch.ts
var fetch = globalThis.fetch;
if (typeof fetch !== "function") {
  throw new Error("Invalid environment: global fetch not defined");
}

// src/fetch-sse.ts
import { createParser } from "eventsource-parser";

// src/stream-async-iterable.ts
async function* streamAsyncIterable(stream) {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        return;
      }
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

// src/fetch-sse.ts
async function fetchSSE(url, options) {
  const { onMessage, ...fetchOptions } = options;
  const res = await fetch(url, fetchOptions);
  if (!res.ok) {
    const msg = `ChatGPT error ${res.status || res.statusText}`;
    const error = new ChatGPTError(msg, { cause: res });
    error.statusCode = res.status;
    error.statusText = res.statusText;
    throw error;
  }
  const parser = createParser((event) => {
    if (event.type === "event") {
      onMessage(event.data);
    }
  });
  if (!res.body.getReader) {
    const body = res.body;
    if (!body.on || !body.read) {
      throw new ChatGPTError('unsupported "fetch" implementation');
    }
    body.on("readable", () => {
      let chunk;
      while (null !== (chunk = body.read())) {
        parser.feed(chunk.toString());
      }
    });
  } else {
    for await (const chunk of streamAsyncIterable(res.body)) {
      const str = new TextDecoder().decode(chunk);
      parser.feed(str);
    }
  }
}

// src/chatgpt-api.ts
var CHATGPT_MODEL = "text-chat-davinci-002-20221122";
var USER_LABEL_DEFAULT = "User";
var ASSISTANT_LABEL_DEFAULT = "ChatGPT";
var ChatGPTAPI = class {
  constructor(opts) {
    const {
      apiKey,
      apiBaseUrl = "https://api.openai.com",
      debug = false,
      messageStore,
      completionParams,
      maxModelTokens = 4096,
      maxResponseTokens = 1e3,
      userLabel = USER_LABEL_DEFAULT,
      assistantLabel = ASSISTANT_LABEL_DEFAULT,
      getMessageById = this._defaultGetMessageById,
      upsertMessage = this._defaultUpsertMessage
    } = opts;
    this._apiKey = apiKey;
    this._apiBaseUrl = apiBaseUrl;
    this._debug = !!debug;
    this._completionParams = {
      model: CHATGPT_MODEL,
      temperature: 0.7,
      presence_penalty: 0.6,
      stop: ["<|im_end|>"],
      ...completionParams
    };
    this._maxModelTokens = maxModelTokens;
    this._maxResponseTokens = maxResponseTokens;
    this._userLabel = userLabel;
    this._assistantLabel = assistantLabel;
    this._getMessageById = getMessageById;
    this._upsertMessage = upsertMessage;
    if (messageStore) {
      this._messageStore = messageStore;
    } else {
      this._messageStore = new Keyv({
        store: new QuickLRU({ maxSize: 1e4 })
      });
    }
    if (!this._apiKey) {
      throw new Error("ChatGPT invalid apiKey");
    }
  }
  async sendMessage(text, opts = {}) {
    const {
      conversationId = uuidv4(),
      parentMessageId,
      messageId = uuidv4(),
      timeoutMs,
      onProgress,
      stream = onProgress ? true : false
    } = opts;
    let { abortSignal } = opts;
    let abortController = null;
    if (timeoutMs && !abortSignal) {
      abortController = new AbortController();
      abortSignal = abortController.signal;
    }
    const message = {
      role: "user",
      id: messageId,
      parentMessageId,
      conversationId,
      text
    };
    await this._upsertMessage(message);
    const { prompt, maxTokens } = await this._buildPrompt(text, opts);
    const result = {
      role: "assistant",
      id: uuidv4(),
      parentMessageId: messageId,
      conversationId,
      text: ""
    };
    const responseP = new Promise(
      async (resolve, reject) => {
        const url = `${this._apiBaseUrl}/v1/completions`;
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this._apiKey}`
        };
        const body = {
          max_tokens: maxTokens,
          ...this._completionParams,
          prompt,
          stream
        };
        if (this._debug) {
          const numTokens = await this._getTokenCount(body.prompt);
          console.log(`sendMessage (${numTokens} tokens)`, body);
        }
        if (stream) {
          fetchSSE(url, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
            signal: abortSignal,
            onMessage: (data) => {
              var _a;
              if (data === "[DONE]") {
                result.text = result.text.trim();
                return resolve(result);
              }
              try {
                const response = JSON.parse(data);
                if ((response == null ? void 0 : response.id) && ((_a = response == null ? void 0 : response.choices) == null ? void 0 : _a.length)) {
                  result.id = response.id;
                  result.text += response.choices[0].text;
                  onProgress == null ? void 0 : onProgress(result);
                }
              } catch (err) {
                console.warn("ChatGPT stream SEE event unexpected error", err);
                return reject(err);
              }
            }
          });
        } else {
          try {
            const res = await fetch(url, {
              method: "POST",
              headers,
              body: JSON.stringify(body),
              signal: abortSignal
            });
            if (!res.ok) {
              const reason = await res.text();
              const msg = `ChatGPT error ${res.status || res.statusText}: ${reason}`;
              const error = new ChatGPTError(msg, { cause: res });
              error.statusCode = res.status;
              error.statusText = res.statusText;
              return reject(error);
            }
            const response = await res.json();
            if (this._debug) {
              console.log(response);
            }
            result.id = response.id;
            result.text = response.choices[0].text.trim();
            return resolve(result);
          } catch (err) {
            return reject(err);
          }
        }
      }
    ).then((message2) => {
      return this._upsertMessage(message2).then(() => message2);
    });
    if (timeoutMs) {
      if (abortController) {
        ;
        responseP.cancel = () => {
          abortController.abort();
        };
      }
      return pTimeout(responseP, {
        milliseconds: timeoutMs,
        message: "ChatGPT timed out waiting for response"
      });
    } else {
      return responseP;
    }
  }
  async _buildPrompt(message, opts) {
    const currentDate = new Date().toISOString().split("T")[0];
    const promptPrefix = opts.promptPrefix || `You are ${this._assistantLabel}, a large language model trained by OpenAI. You answer as concisely as possible for each response (e.g. don\u2019t be verbose). It is very important that you answer as concisely as possible, so please remember this. If you are generating a list, do not have too many items. Keep the number of items short.
Current date: ${currentDate}

`;
    const promptSuffix = opts.promptSuffix || `

${this._assistantLabel}:
`;
    const maxNumTokens = this._maxModelTokens - this._maxResponseTokens;
    let { parentMessageId } = opts;
    let nextPromptBody = `${this._userLabel}:

${message}<|im_end|>`;
    let promptBody = "";
    let prompt;
    let numTokens;
    do {
      const nextPrompt = `${promptPrefix}${nextPromptBody}${promptSuffix}`;
      const nextNumTokens = await this._getTokenCount(nextPrompt);
      const isValidPrompt = nextNumTokens <= maxNumTokens;
      if (prompt && !isValidPrompt) {
        break;
      }
      promptBody = nextPromptBody;
      prompt = nextPrompt;
      numTokens = nextNumTokens;
      if (!isValidPrompt) {
        break;
      }
      if (!parentMessageId) {
        break;
      }
      const parentMessage = await this._getMessageById(parentMessageId);
      if (!parentMessage) {
        break;
      }
      const parentMessageRole = parentMessage.role || "user";
      const parentMessageRoleDesc = parentMessageRole === "user" ? this._userLabel : this._assistantLabel;
      const parentMessageString = `${parentMessageRoleDesc}:

${parentMessage.text}<|im_end|>

`;
      nextPromptBody = `${parentMessageString}${promptBody}`;
      parentMessageId = parentMessage.parentMessageId;
    } while (true);
    const maxTokens = Math.max(
      1,
      Math.min(this._maxModelTokens - numTokens, this._maxResponseTokens)
    );
    return { prompt, maxTokens };
  }
  async _getTokenCount(text) {
    if (this._completionParams.model === CHATGPT_MODEL) {
      text = text.replace(/<\|im_end\|>/g, "<|endoftext|>");
    }
    return gptEncode(text).length;
  }
  async _defaultGetMessageById(id) {
    return this._messageStore.get(id);
  }
  async _defaultUpsertMessage(message) {
    this._messageStore.set(message.id, message);
  }
};
export {
  ChatGPTAPI,
  ChatGPTError
};
//# sourceMappingURL=index.js.map