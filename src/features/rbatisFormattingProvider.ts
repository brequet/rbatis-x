import { SqlLanguage } from 'sql-formatter';
import * as vscode from 'vscode';
import { CONFIG_SECTION_FORMATTING } from '../core/config';
import { FORMATTING_TAG_REGEX } from '../core/constants';
import { formatRbatisBlock } from '../logic/rbatisFormatter';
import { getIndentation } from '../utils/formatUtils';

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
        while ((match = FORMATTING_TAG_REGEX.exec(documentText)) !== null) {
            const [fullBlock, tagName, content] = match;

            if (!content.trim()) {
                continue;
            }

            const range = new vscode.Range(
                document.positionAt(match.index),
                document.positionAt(match.index + fullBlock.length)
            );

            const initialIndent = getIndentation(document, range.start.line);

            const formattedBlock = formatRbatisBlock(fullBlock, content, tagName, initialIndent, formatOptions);

            edits.push(vscode.TextEdit.replace(range, formattedBlock));
        }

        return edits;
    }

    private getFormatterLanguage(): SqlLanguage {
        const config = vscode.workspace.getConfiguration(CONFIG_SECTION_FORMATTING);
        return (config.get('dialect') as SqlLanguage) || 'sql';
    }
}
