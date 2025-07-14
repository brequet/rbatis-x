import { format, SqlLanguage } from 'sql-formatter';
import * as vscode from 'vscode';

export class RbatisFormattingProvider implements vscode.DocumentFormattingEditProvider {
    provideDocumentFormattingEdits(
        document: vscode.TextDocument,
        options: vscode.FormattingOptions
    ): vscode.ProviderResult<vscode.TextEdit[]> {
        const edits: vscode.TextEdit[] = [];
        const documentText = document.getText();

        const tagRegex = /<(select|insert|update|delete|sql)\b[^>]*>([\s\S]*?)<\/\1>/g;

        let match: RegExpExecArray | null;
        while ((match = tagRegex.exec(documentText)) !== null) {
            const [fullBlock, tagName, content] = match;
            if (!content.trim()) continue;

            const startPosition = document.positionAt(match.index);
            const endPosition = document.positionAt(match.index + fullBlock.length);
            const range = new vscode.Range(startPosition, endPosition);

            const initialIndent = this.getIndentation(document, range.start.line);

            const formattedBlock = this.formatBlock(fullBlock, tagName, content, options, initialIndent);

            edits.push(vscode.TextEdit.replace(range, formattedBlock));
        }

        return edits;
    }

    private formatBlock(
        fullBlock: string,
        tagName: string,
        content: string,
        options: vscode.FormattingOptions,
        initialIndent: string
    ): string {
        const openingTag = fullBlock.substring(0, fullBlock.indexOf('>') + 1);

        const { sql, otherTags } = this.extractSqlAndTags(content);

        if (!sql.trim()) return fullBlock;

        const hasBackticks = sql.trim().startsWith('`');
        const pureSql = this.unwrapSql(sql);

        const formattedSql = format(pureSql, {
            language: this.getFormatterLanguage(),
            tabWidth: options.tabSize,
            useTabs: !options.insertSpaces,
            keywordCase: 'upper',
            paramTypes: {
                custom: [
                    // Teach the formatter to recognize #{...} as a placeholder
                    { regex: String.raw`#\{[^}]+\}` }
                ]
            }
        });


        const rewrappedSql = hasBackticks ? `\`\n${formattedSql}\n\`` : formattedSql;

        const newContent = this.reconstructContent(rewrappedSql, otherTags, initialIndent, options);

        // Correct interpolation here:
        return `${openingTag}\n${newContent}\n${initialIndent}</${tagName}>`;
    }

    private getIndentation(document: vscode.TextDocument, line: number): string {
        const lineText = document.lineAt(line).text;
        return lineText.match(/^\s*/)?.[0] || '';
    }

    private extractSqlAndTags(content: string): { sql: string; otherTags: string[] } {
        const otherTags: string[] = [];
        const sql = content.replace(/<[^>]+>/g, (tag) => {
            otherTags.push(tag.trim());
            return '';
        });
        return { sql, otherTags };
    }

    private unwrapSql(sql: string): string {
        const trimmed = sql.trim();
        if (trimmed.startsWith('`') && trimmed.endsWith('`')) {
            return trimmed.substring(1, trimmed.length - 1);
        }
        return sql;
    }

    private getFormatterLanguage(): SqlLanguage {
        const config = vscode.workspace.getConfiguration('rbatis-x.formatting');
        return (config.get('dialect') as SqlLanguage) || 'sql';
    }

    private reconstructContent(
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
}
