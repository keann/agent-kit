#!/usr/bin/env node
/**
 * Checks code comments against the code-annotations skill: column cap, paragraph and block
 * lengths, sentence-aware fill, trailing comments, docblocks inside bodies. Prints nothing when
 * every comment is clean; the exit code is 1 when any `error` line was printed.
 *
 * Usage: `node check-comments.mjs [--cap N] [--all] <file...>`. `--cap N` overrides the
 * `max_line_length` of the nearest .editorconfig (fallback 100); `--all` also reports code lines
 * over the cap, as notes.
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const FALLBACK_CAP = 100
const PARAGRAPH_LINES = 3
const FIELD_PARAGRAPHS = 2
const TOP_LEVEL_PARAGRAPHS = 3
const NOTE_LINES = 2
const NOTE_LINES_GRANTED = 3
const FILL_RATIO = 0.85
const ORPHAN_WORDS = 3
const BREAK_ENDINGS = /[.!?:;,)—]$|[.!?:;,)]`$/u
const BREAK_STARTS = /^[—(]/u
const LIST_MARKER = /^\s*(?:[-*+]|\d{1,9}[.)])\s/u
const BODY_KEYWORDS = /^\s*(?:const|let|var|if|for|while|return|await|switch|try|throw)\b/u
const BODY_CALL = /^\s*[A-Za-z_$][\w$.]*\(/u
const DIRECTIVE = /^(?:eslint-|@ts-|biome-|prettier-|oxlint-)/u
const UNESCAPED_BACKTICK = /(?<!\\)`/gu

const args = process.argv.slice(2)
let capOverride
let includeCode = false
const files = []
for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--cap') {
        capOverride = Number(args[index + 1])
        index += 1
    } else if (arg === '--all') {
        includeCode = true
    } else {
        files.push(arg)
    }
}
if (files.length === 0) {
    console.error('usage: check-comments.mjs [--cap N] [--all] <file...>')
    process.exit(2)
}

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')

const globToRegExp = (glob) => {
    let pattern = ''
    for (let index = 0; index < glob.length; index += 1) {
        const char = glob[index]
        if (char === '*') {
            if (glob[index + 1] === '*') {
                pattern += '.*'
                index += 1
            } else {
                pattern += '[^/]*'
            }
        } else if (char === '?') {
            pattern += '[^/]'
        } else if (char === '{') {
            const end = glob.indexOf('}', index)
            const alternatives = glob.slice(index + 1, end).split(',').map(escapeRegExp)
            pattern += `(?:${alternatives.join('|')})`
            index = end
        } else {
            pattern += escapeRegExp(char)
        }
    }
    return new RegExp(`(?:^|/)${pattern}$`, 'u')
}

// Walks up to the root .editorconfig, then applies `max_line_length` from every matching section,
// nearest file last, the way editors resolve it.
const resolveCap = (filePath) => {
    if (capOverride !== undefined) return capOverride
    const configs = []
    let directory = dirname(filePath)
    while (true) {
        const candidate = resolve(directory, '.editorconfig')
        if (existsSync(candidate)) {
            const content = readFileSync(candidate, 'utf8')
            configs.unshift(content)
            if (/^\s*root\s*=\s*true\s*$/imu.test(content)) break
        }
        const parent = dirname(directory)
        if (parent === directory) break
        directory = parent
    }
    let cap = FALLBACK_CAP
    for (const content of configs) {
        let sectionMatches = false
        for (const rawLine of content.split('\n')) {
            const line = rawLine.trim()
            const section = line.match(/^\[(.+)\]$/u)
            if (section) {
                const glob = section[1]
                sectionMatches =
                    glob === '*' || glob === '**' || globToRegExp(glob).test(filePath)
                continue
            }
            const setting = line.match(/^max_line_length\s*=\s*(\S+)/iu)
            if (setting && sectionMatches) {
                const value = Number(setting[1])
                cap = Number.isNaN(value) ? FALLBACK_CAP : value
            }
        }
    }
    return cap
}

const quotesBalanced = (text) => {
    for (const quote of ["'", '"', '`']) {
        if ((text.split(quote).length - 1) % 2 === 1) return false
    }
    return true
}

const wordCount = (text) => text.trim().split(/\s+/u).filter(Boolean).length

const firstWordLength = (text) => (text.trim().split(/\s+/u)[0] ?? '').length

const findings = []
const report = (file, line, severity, rule, message) => {
    findings.push({ file, line, severity, rule, message })
}

const checkWidth = (file, cap, raw, number) => {
    const width = raw.trimEnd().length
    if (width > cap) {
        report(file, number, 'error', 'overflow', `${width} columns; the cap is ${cap}`)
    }
}

// One paragraph = consecutive text lines, or one Markdown list item with its continuation lines;
// `raw` keeps the full source line for width checks.
const checkParagraph = (file, cap, paragraph) => {
    if (paragraph.length > PARAGRAPH_LINES) {
        const message =
            `${paragraph.length} text lines; the cap is ${PARAGRAPH_LINES} — split or cut`
        report(file, paragraph[0].number, 'error', 'paragraph', message)
    }
    for (let index = 0; index < paragraph.length - 1; index += 1) {
        const current = paragraph[index]
        const next = paragraph[index + 1]
        const width = current.raw.trimEnd().length
        const endsOnBreak =
            BREAK_ENDINGS.test(current.text.trimEnd()) || BREAK_STARTS.test(next.text.trim())
        const nextFits = width + 1 + firstWordLength(next.text) <= cap
        if (width < cap * FILL_RATIO && !endsOnBreak && nextFits) {
            const message =
                `breaks mid-phrase at ${width} columns while the next word fits under ${cap}`
            report(file, current.number, 'error', 'under-filled', message)
        }
    }
    if (paragraph.length >= 2) {
        const last = paragraph[paragraph.length - 1]
        const words = wordCount(last.text)
        if (words <= ORPHAN_WORDS) {
            const message = `paragraph ends on a ${words}-word line — rebreak the line before it`
            report(file, last.number, 'note', 'orphan', message)
        }
    }
}

// Strips the comment syntax from one line of a `/* */` block.
const blockText = (raw, isOpener, isCloser) => {
    let text = raw.trim().replace(/^\{?\/\*\*?/u, '').replace(/\*\/\}?$/u, '')
    if (!isOpener) text = text.replace(/^\*\s?/u, '')
    text = text.trimEnd()
    return isOpener && isCloser ? text.trim() : text
}

const checkBlockComment = (file, cap, lines, startIndex, endIndex, nextCodeLine) => {
    const first = lines[startIndex]
    const indent = first.length - first.trimStart().length
    const isDoc = first.trimStart().startsWith('/**')
    const paragraphs = []
    let current = []
    let blockParagraphs = 0
    let isInList = false
    let inCode = false
    let sawDefault = false
    let lastKind = 'delimiter'
    let sawText = false
    const flush = () => {
        if (current.length > 0) paragraphs.push(current)
        current = []
    }
    const defaultLast = (number) => {
        report(file, number, 'error', 'default-last', '@default must be the last line before */')
    }
    for (let index = startIndex; index <= endIndex; index += 1) {
        const raw = lines[index]
        checkWidth(file, cap, raw, index + 1)
        const isOpener = index === startIndex
        const isCloser = index === endIndex
        const text = blockText(raw, isOpener, isCloser)
        if (text.trim().startsWith('```')) {
            inCode = !inCode
            flush()
            lastKind = 'code'
            continue
        }
        if (text.trim() === '') {
            flush()
            if (!isOpener && !isCloser) lastKind = 'spacer'
            continue
        }
        if (inCode) {
            lastKind = 'code'
            continue
        }
        const tag = text.trim().match(/^@(\w+)/u)
        if (tag) {
            flush()
            isInList = false
            if (tag[1] === 'example') inCode = true
            if (tag[1] === 'default') sawDefault = true
            else if (sawDefault) defaultLast(index + 1)
            lastKind = 'tag'
            continue
        }
        if (sawDefault) defaultLast(index + 1)
        // A list counts once toward the block cap, however many items it holds, and not at all when
        // it hangs off a lead-in line with no blank line between; an indented paragraph after a
        // blank line still belongs to the item above it.
        if (LIST_MARKER.test(text)) {
            if (!isInList && current.length === 0) blockParagraphs += 1
            flush()
            isInList = true
        } else if (current.length === 0 && !(isInList && /^\s/u.test(text))) {
            isInList = false
            blockParagraphs += 1
        }
        current.push({ number: index + 1, raw, text })
        lastKind = 'text'
        sawText = true
    }
    flush()
    if (lastKind === 'spacer' && isDoc && sawText) {
        report(file, endIndex + 1, 'error', 'spacer', 'blank spacer line right before */')
    }
    for (const paragraph of paragraphs) checkParagraph(file, cap, paragraph)
    if (!isDoc) return
    const limit = indent > 0 ? FIELD_PARAGRAPHS : TOP_LEVEL_PARAGRAPHS
    if (blockParagraphs > limit) {
        const target = indent > 0 ? 'a field' : 'a helper or type'
        const message = `${blockParagraphs} paragraphs on ${target}; the cap is ${limit}`
        report(file, startIndex + 1, 'error', 'block', message)
    }
    const followsStatement =
        nextCodeLine !== null && (BODY_KEYWORDS.test(nextCodeLine) || BODY_CALL.test(nextCodeLine))
    if (indent > 0 && followsStatement) {
        const message = 'a statement takes a // note, not a /** */ block'
        report(file, startIndex + 1, 'error', 'docblock-in-body', message)
    }
}

const checkLineRun = (file, cap, lines, startIndex, endIndex) => {
    const paragraph = []
    for (let index = startIndex; index <= endIndex; index += 1) {
        const raw = lines[index]
        checkWidth(file, cap, raw, index + 1)
        const text = raw.trim().replace(/^\/\/\s?/u, '')
        if (DIRECTIVE.test(text)) continue
        paragraph.push({ number: index + 1, raw, text })
    }
    const count = paragraph.length
    if (count > NOTE_LINES_GRANTED) {
        const message =
            `${count}-line // note; the ceiling is ${NOTE_LINES_GRANTED} — cut it or move it`
        report(file, startIndex + 1, 'error', 'note-length', message)
    } else if (count > NOTE_LINES) {
        const message =
            `${count}-line // note; the cap is ${NOTE_LINES} — ask the author before keeping it`
        report(file, startIndex + 1, 'note', 'note-length', message)
        checkParagraph(file, cap, paragraph)
    } else if (count > 0) {
        checkParagraph(file, cap, paragraph)
    }
}

const checkTrailing = (file, raw, number) => {
    const message = 'comment trails the code — move it to its own line above'
    const slashes = raw.indexOf('//')
    const before = raw.slice(0, slashes)
    if (slashes > 0 && !before.endsWith(':') && quotesBalanced(before)) {
        report(file, number, 'error', 'trailing', message)
        return
    }
    const blockStart = raw.indexOf('/*')
    const isJsx = raw.trimStart().startsWith('{/*')
    if (blockStart > 0 && !isJsx && quotesBalanced(raw.slice(0, blockStart))) {
        report(file, number, 'error', 'trailing', message)
    }
}

const checkFile = (file) => {
    const absolute = resolve(file)
    const cap = resolveCap(absolute)
    const lines = readFileSync(absolute, 'utf8').split('\n')
    let index = 0
    let isInTemplate = false
    while (index < lines.length) {
        const raw = lines[index]
        const trimmed = raw.trim()
        if (!isInTemplate && /^\{?\/\*/u.test(trimmed)) {
            let end = index
            while (end < lines.length && !lines[end].includes('*/')) end += 1
            if (end >= lines.length) end = lines.length - 1
            let nextCode = end + 1
            while (nextCode < lines.length && lines[nextCode].trim() === '') nextCode += 1
            const nextCodeLine = nextCode < lines.length ? lines[nextCode] : null
            checkBlockComment(file, cap, lines, index, end, nextCodeLine)
            index = end + 1
            continue
        }
        if (!isInTemplate && trimmed.startsWith('//')) {
            let end = index
            while (end + 1 < lines.length && lines[end + 1].trim().startsWith('//')) end += 1
            checkLineRun(file, cap, lines, index, end)
            index = end + 1
            continue
        }
        if (!isInTemplate) checkTrailing(file, raw, index + 1)
        // An odd count of unescaped backticks opens or closes a template string, and its lines are
        // not comments. A backtick inside a quoted string, as in '`', throws the count off.
        if ((raw.match(UNESCAPED_BACKTICK) ?? []).length % 2 === 1) isInTemplate = !isInTemplate
        if (includeCode && raw.trimEnd().length > cap) {
            const message = `${raw.trimEnd().length} columns; the cap is ${cap}`
            report(file, index + 1, 'note', 'code-overflow', message)
        }
        index += 1
    }
}

for (const file of files) checkFile(file)

for (const { file, line, severity, rule, message } of findings) {
    console.log(`${file}:${line}: ${severity} ${rule}: ${message}`)
}
const errors = findings.filter((finding) => finding.severity === 'error').length
if (findings.length > 0) {
    const notes = findings.length - errors
    console.log(`${errors} error${errors === 1 ? '' : 's'}, ${notes} note${notes === 1 ? '' : 's'}`)
}
process.exit(errors > 0 ? 1 : 0)
