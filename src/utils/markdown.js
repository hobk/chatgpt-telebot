import telegramifyMarkdown from 'telegramify-markdown'

/**
 * @param {string} input
 * @returns {string}
 **/

export const escapeMarkdownCharacters = (input) => {
  return telegramifyMarkdown(input, 'escape')
}
