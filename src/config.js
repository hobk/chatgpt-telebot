import * as dotenv from "dotenv";

dotenv.config();

/* global process */
const {
  token,
  apiKey,
  group_name,
  allowed_users,
  model_version,
  model_temperature,
} = process.env;

export const TELEGRAM_TOKEN = token;
export const TELEGRAM_GROUP_NAME = group_name;
export const TELEGRAM_MESSAGE_MAX_LENGTH = 4096;
export const ALLOWED_USERS = JSON.parse(allowed_users);
export const OPEN_AI_MODEL_VERSION = model_version;
export const OPEN_AI_MODEL_TEMPERATURE = model_temperature;
export const OPEN_AI_API_KEY = apiKey;
