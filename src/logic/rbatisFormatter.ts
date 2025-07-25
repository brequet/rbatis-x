import { format, FormatOptionsWithLanguage, SqlLanguage } from 'sql-formatter';
import * as vscode from 'vscode';
import { FormatOptions } from '../types';

interface RbatisFormatOptions {
    language: SqlLanguage;
}

/**
 * Extracts the core SQL content from a block, separating it from other XML tags.
 * @param content The inner content of the main SQL tag.
 * @returns An object containing the SQL and an array of other tags.
 */
function extractSqlAndTags(content: string): { sql: string; otherTags: string[] } {
    const otherTags: string[] = [];
    // Replace XML-like tags with a placeholder, storing the tag for later.
    const sql = content.replace(/<[^>]+>/g, (tag) => {
        otherTags.push(tag.trim());
        // Return an empty string to remove it from the SQL content.
        return '';
    });
    return { sql, otherTags };
}

/**
 * Removes leading/trailing backticks from a SQL string if they exist.
 * @param sql The SQL string.
 * @returns The "pure" SQL without backticks.
 */
function unwrapSql(sql: string): string {
    const trimmed = sql.trim();
    if (trimmed.startsWith('`') && trimmed.endsWith('`')) {
        return trimmed.substring(1, trimmed.length - 1);
    }
    return sql;
}

/**
 * Reconstructs the content of an SQL block, combining formatted SQL and other tags with proper indentation.
 */
function reconstructContent(
    formattedSql: string,
    otherTags: string[],
    baseIndent: string,
    options: vscode.FormattingOptions
): string {
    const indentStep = options.insertSpaces ? ' '.repeat(options.tabSize) : '\t';
    const innerIndent = baseIndent + indentStep;

    const indentedSql = formattedSql
        .split('\n')
        .map((line) => (line.trim() ? innerIndent + line : ''))
        .join('\n');

    const tagsPart = otherTags.map((tag) => innerIndent + tag).join('\n');

    return [tagsPart, indentedSql].filter(Boolean).join('\n');
}

function formatSql(pureSql: string, options: FormatOptions & vscode.FormattingOptions): string {
    return format(pureSql, {
        language: options.language,
        tabWidth: options.tabSize,
        useTabs: !options.insertSpaces,
        keywordCase: 'upper',
        paramTypes: {
            custom: [{ regex: String.raw`#\{[^}]+\}` }],
        },
    });
}

/**
 * Formats a single rbatis SQL block (e.g., <select>...</select>).
 * @param fullBlock The entire string of the block.
 * @param content The inner content of the block.
 * @param tagName The name of the tag (e.g., "select").
 * @param initialIndent The indentation of the opening tag line.
 * @param options Formatting options.
 * @returns The formatted block as a string.
 */
export function formatRbatisBlock(
    fullBlock: string,
    content: string,
    tagName: string,
    initialIndent: string,
    vscodeOptions: vscode.FormattingOptions,
    rbatisOptions: RbatisFormatOptions
): string {
    const { sql, otherTags } = extractSqlAndTags(content);
    if (!sql.trim()) {
        return fullBlock; // Return original if there's no SQL to format
    }

    const openingTag = fullBlock.substring(0, fullBlock.indexOf('>') + 1);
    const hasBackticks = sql.trim().startsWith('`');
    const pureSql = unwrapSql(sql);

    // Build the final, type-safe options object specifically for sql-formatter
    const formatterOptions: FormatOptionsWithLanguage = {
        language: rbatisOptions.language,
        tabWidth: vscodeOptions.tabSize,
        useTabs: !vscodeOptions.insertSpaces,
        keywordCase: 'upper',
        paramTypes: {
            custom: [{ regex: String.raw`#\{[^}]+\}` }], // Recognize #{...} as parameters
        },
    };

    const formattedSql = format(pureSql, formatterOptions);

    const rewrappedSql = hasBackticks ? `\`\n${formattedSql}\n\`` : formattedSql;
    const newContent = reconstructContent(rewrappedSql, otherTags, initialIndent, vscodeOptions);

    return `${openingTag}\n${newContent}\n${initialIndent}</${tagName}>`;
}
