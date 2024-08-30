import { ALLOWED_USERS } from "./config.js";

export const db = Object.keys(ALLOWED_USERS).reduce((acc, key) => {
  acc[key] = {
    prevMessageId: undefined,
  };
  return acc;
}, {});

export const updateLastMessageId = (userId, newMessageId) => {
  db[userId].prevMessageId = newMessageId;
};
