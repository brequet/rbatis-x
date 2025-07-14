import * as vscode from 'vscode';
import { RbatisContext } from '../types';

const FN_REGEX = /pub\s+async\s+fn\s+(\w+)/;
const ATTR_REGEX = /#\[html_sql\("([^"]+)"\)\]/;
const MAX_LINES_TO_SEARCH = 3;

export function findRbatisContext(document: vscode.TextDocument, position: vscode.Position): RbatisContext | null {
    const currentLine = document.lineAt(position.line);

    // Case 1: Cursor is on an html_sql attribute line
    let attrMatch = ATTR_REGEX.exec(currentLine.text);
    if (attrMatch) {
        const relativePath = attrMatch[1];
        const pathIndex = currentLine.text.indexOf(relativePath);
        const pathRange = new vscode.Range(position.line, pathIndex, position.line, pathIndex + relativePath.length);

        if (pathRange.contains(position)) {
            for (let i = position.line + 1; i < document.lineCount && i < position.line + MAX_LINES_TO_SEARCH; i++) {
                const fnMatch = FN_REGEX.exec(document.lineAt(i).text);
                if (fnMatch) {
                    return { functionName: fnMatch[1], relativePath, triggerRange: pathRange };
                }
            }
        }
    }

    // Case 2: Cursor is on a function definition line
    let fnMatch = FN_REGEX.exec(currentLine.text);
    if (fnMatch) {
        const functionName = fnMatch[1];
        const nameIndex = currentLine.text.indexOf(functionName);
        const nameRange = new vscode.Range(position.line, nameIndex, position.line, nameIndex + functionName.length);

        if (nameRange.contains(position)) {
            for (let i = position.line - 1; i >= 0 && i > position.line - MAX_LINES_TO_SEARCH; i--) {
                attrMatch = ATTR_REGEX.exec(document.lineAt(i).text);
                if (attrMatch) {
                    return { functionName, relativePath: attrMatch[1], triggerRange: nameRange };
                }
            }
        }
    }

    return null;
}
