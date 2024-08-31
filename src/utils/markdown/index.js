import telegramifyMarkdown from 'telegramify-markdown'
// libraries mentioned below are dependenices of telegramify-markdown 
import unified from 'unified'
import markdown from 'remark-parse'
import stringify from 'remark-stringify'
import { TELEGRAM_MESSAGE_MAX_LENGTH } from '../../config.js'

/**
 * @param {string} input
 * @returns {string}
 **/

export function escapeMarkdownCharacters(input) {
  return telegramifyMarkdown(input, 'escape')
}

function getMarkdownChunks(tree, chunksCount) {
    const nodes = tree.children;
    const result = [];
    const chunksValue = Math.ceil(nodes.length / chunksCount)

    for (let i = 0; i < chunksCount; i++) {
        result.push(nodes.slice(i * chunksValue, (i + 1) * chunksValue))
    }

    return result
}

export function splitMarkdown(markdownText) {
    const processor = unified().use(markdown).use(stringify);
    const tree = processor.parse(markdownText);
    const chunks = getMarkdownChunks(tree, Math.ceil(markdownText.length / TELEGRAM_MESSAGE_MAX_LENGTH))

    return chunks.map(( nodes) => ({...tree, children: nodes})).map( treeChunk => processor.stringify(treeChunk))
}
