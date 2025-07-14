import * as vscode from 'vscode';
import { CacheService } from '../core/cacheService';
import { Logger } from '../utils/logger';

const SQL_TAG_REGEX = /<(?:select|insert|update|delete)\s+id\s*=\s*"([^"]+)"/;
const DTD_IDENTIFIER = 'mybatis-3-mapper.dtd';

export class HtmlDefinitionProvider implements vscode.DefinitionProvider {
    constructor(private cache: CacheService) { }

    public async provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position
    ): Promise<vscode.Location | null> {

        if (!document.getText().includes(DTD_IDENTIFIER)) {
            return null; // Not a rbatis mapper file
        }

        const lineText = document.lineAt(position.line).text;
        const tagMatch = SQL_TAG_REGEX.exec(lineText);

        if (!tagMatch) {
            return null;
        }

        const functionId = tagMatch[1];
        const htmlPath = document.uri.fsPath;

        const definitionInfo = this.cache.findDefinition(htmlPath, functionId);

        if (definitionInfo) {
            Logger.log(`Found Rust definition for ${functionId} in ${definitionInfo.rustFileUri.fsPath}`);
            return new vscode.Location(definitionInfo.rustFileUri, definitionInfo.functionPosition);
        }

        Logger.log(`No definition found in cache for ${functionId}`);
        return null;
    }
}
