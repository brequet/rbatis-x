import * as vscode from 'vscode';
import { CacheService } from '../core/cacheService';
import { Logger } from '../utils/logger';

const SQL_TAG_REGEX = /<(?:select|insert|update|delete)\s+id\s*=\s*"([^"]+)"/;
const INCLUDE_TAG_REGEX = /<include\s+refid\s*=\s*"([^"]+)"/;
const DTD_IDENTIFIER = 'mybatis-3-mapper.dtd';

export class HtmlDefinitionProvider implements vscode.DefinitionProvider {
    constructor(private cache: CacheService) { }

    public async provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position
    ): Promise<vscode.Location | null> {
        // Priority 1: Handle intra-file <include> tag redirection.
        const includeLocation = this.getIncludeTagDefinition(document, position);
        if (includeLocation) {
            return includeLocation;
        }

        // Priority 2: Handle redirection from HTML to Rust.
        if (!document.getText().includes(DTD_IDENTIFIER)) {
            return null;
        }

        const lineText = document.lineAt(position.line).text;
        const tagMatch = SQL_TAG_REGEX.exec(lineText);
        if (!tagMatch) {
            return null;
        }

        const functionId = tagMatch[1];
        const definitionInfo = this.cache.findDefinition(document.uri.fsPath, functionId);
        if (!definitionInfo) {
            Logger.log(`No definition found in cache for ${functionId}`);
            return null;
        }

        Logger.log(`Found Rust definition for ${functionId} in ${definitionInfo.rustFileUri.fsPath}`);
        return new vscode.Location(definitionInfo.rustFileUri, definitionInfo.functionPosition);
    }

    private getIncludeTagDefinition(document: vscode.TextDocument, position: vscode.Position): vscode.Location | null {
        const lineText = document.lineAt(position.line).text;
        const includeMatch = INCLUDE_TAG_REGEX.exec(lineText);

        if (!includeMatch) {
            return null;
        }

        const refId = includeMatch[1];
        const refIdIndex = lineText.indexOf(`"${refId}"`, includeMatch.index) + 1;
        const refIdRange = new vscode.Range(position.line, refIdIndex, position.line, refIdIndex + refId.length);

        if (!refIdRange.contains(position)) {
            return null;
        }

        const definitionPosition = this.findSqlIdPositionInDocument(document, refId);
        if (definitionPosition) {
            Logger.log(`Found <sql> tag for refid "${refId}" in the current file.`);
            return new vscode.Location(document.uri, definitionPosition);
        }

        return null;
    }

    private findSqlIdPositionInDocument(document: vscode.TextDocument, id: string): vscode.Position | null {
        const escapedId = id.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const sqlIdRegex = new RegExp(`<sql\\s+id\\s*=\\s*"${escapedId}"`);

        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            const match = sqlIdRegex.exec(line.text);
            if (match) {
                return new vscode.Position(i, match.index);
            }
        }
        return null;
    }
}
