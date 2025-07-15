import * as vscode from 'vscode';
import { Logger } from '../utils/logger';

const SQL_TAG_ID_REGEX_TEMPLATE = `<(?:select|insert|update|delete)\\s+id\\s*=\\s*"`;

/**
 * Finds the position of a <select>, <insert>, etc. tag with a specific 'id' attribute.
 * @param fileUri The URI of the HTML/XML file.
 * @param functionName The id to search for.
 * @returns The position of the tag, or null if not found.
 */
export async function findSqlTagPosition(fileUri: vscode.Uri, functionName: string): Promise<vscode.Position | null> {
    try {
        const fileContent = await vscode.workspace.fs.readFile(fileUri);
        const lines = fileContent.toString().split(/\r?\n/);

        const escapedFunctionName = functionName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const tagRegex = new RegExp(`${SQL_TAG_ID_REGEX_TEMPLATE}${escapedFunctionName}"`);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const match = tagRegex.exec(line);
            if (match) {
                return new vscode.Position(i, match.index);
            }
        }

        Logger.log(`SQL tag for function "${functionName}" not found in ${fileUri.fsPath}`);
        return null;

    } catch (error) {
        Logger.error(`Error reading or parsing file ${fileUri.fsPath}`, error);
        return null;
    }
}
