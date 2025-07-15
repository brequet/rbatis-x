// src/features/rbatisFormattingProvider.ts

import { SqlLanguage } from 'sql-formatter';
import * as vscode from 'vscode';
import { formatRbatisBlock } from '../logic/rbatisFormatter';

const RBATIS_X_CONFIG_SECTION = 'rbatis-x.formatting';
const TAG_REGEX = /<(select|insert|update|delete|sql)\b[^>]*>([\s\S]*?)<\/\1>/g;

export class RbatisFormattingProvider implements vscode.DocumentFormattingEditProvider {
    public provideDocumentFormattingEdits(
        document: vscode.TextDocument,
        options: vscode.FormattingOptions
    ): vscode.ProviderResult<vscode.TextEdit[]> {
        const edits: vscode.TextEdit[] = [];
        const documentText = document.getText();
        const formatOptions = {
            ...options,
            language: this.getFormatterLanguage(),
        };

        let match: RegExpExecArray | null;
        while ((match = TAG_REGEX.exec(documentText)) !== null) {
            const [fullBlock, tagName, content] = match;

            if (!content.trim()) {
                continue;
            }

            const range = new vscode.Range(
                document.positionAt(match.index),
                document.positionAt(match.index + fullBlock.length)
            );

            const initialIndent = this.getIndentation(document, range.start.line);

            const formattedBlock = formatRbatisBlock(fullBlock, content, tagName, initialIndent, formatOptions);

            edits.push(vscode.TextEdit.replace(range, formattedBlock));
        }

        return edits;
    }

    private getIndentation(document: vscode.TextDocument, line: number): string {
        const lineText = document.lineAt(line).text;
        return lineText.match(/^\s*/)?.[0] || '';
    }

    private getFormatterLanguage(): SqlLanguage {
        const config = vscode.workspace.getConfiguration(RBATIS_X_CONFIG_SECTION);
        return (config.get('dialect') as SqlLanguage) || 'sql';
    }
}
