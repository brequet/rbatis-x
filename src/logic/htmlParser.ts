import * as vscode from 'vscode';
import { Logger } from '../utils/logger';

export async function findSqlTagPosition(fileUri: vscode.Uri, functionName: string): Promise<vscode.Position | null> {
    try {
        const fileContent = await vscode.workspace.fs.readFile(fileUri);
        const lines = fileContent.toString().split(/\r?\n/);

        const escapedFunctionName = functionName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const tagRegex = new RegExp(`<(?:select|insert|update|delete)\\s+id\\s*=\\s*"${escapedFunctionName}"`);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const match = tagRegex.exec(line);
            if (match) {
                const character = line.indexOf(match[0]);
                return new vscode.Position(i, character);
            }
        }

        Logger.log(`SQL tag for function "${functionName}" not found in ${fileUri.fsPath}`);
        return null;

    } catch (error) {
        Logger.error(`Error reading or parsing file ${fileUri.fsPath}`, error);
        return null;
    }
}
