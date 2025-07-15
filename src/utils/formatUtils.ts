import * as vscode from 'vscode';

export function getIndentation(document: vscode.TextDocument, line: number): string {
    const lineText = document.lineAt(line).text;
    return lineText.match(/^\s*/)?.[0] || '';
}
