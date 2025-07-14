import * as path from 'path';
import * as vscode from 'vscode';
import { Logger } from './logger';

export function resolveWorkspacePath(documentUri: vscode.Uri, relativePath: string): vscode.Uri | null {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(documentUri);
    if (!workspaceFolder) {
        Logger.error("Could not find a workspace folder for the current file.");
        return null;
    }

    const absolutePath = path.join(workspaceFolder.uri.fsPath, relativePath);
    return vscode.Uri.file(absolutePath);
}
