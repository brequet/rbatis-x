import * as vscode from 'vscode';
import { findSqlTagPosition } from '../logic/htmlParser';
import { findRbatisContext } from '../logic/rustParser';
import { Logger } from '../utils/logger';
import { resolveWorkspacePath } from '../utils/workspace';

export class RbatisDefinitionProvider implements vscode.DefinitionProvider {
    public async provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position
    ): Promise<vscode.Location | null> {

        const context = findRbatisContext(document, position);
        if (!context) {
            return null;
        }

        const targetFileUri = resolveWorkspacePath(document.uri, context.relativePath);
        if (!targetFileUri) {
            return null;
        }

        const targetPosition = await findSqlTagPosition(targetFileUri, context.functionName);
        if (!targetPosition) {
            return null;
        }

        Logger.log(`Found definition for ${context.functionName} at ${targetFileUri.fsPath}:${targetPosition.line}`);
        return new vscode.Location(targetFileUri, targetPosition);
    }
}
