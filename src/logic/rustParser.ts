import * as vscode from 'vscode';
import { RbatisContext, RbatisFunction } from '../types';

const ATTR_REGEX = /#\[html_sql\("([^"]+)"\)\]/;
const FN_REGEX = /pub\s+async\s+fn\s+(\w+)/;
const MAX_LINES_TO_SEARCH = 3;

/**
 * Parses a Rust document content and finds all functions annotated with `#[html_sql]`.
 * @param content The string content of the Rust file.
 * @returns An array of found Rbatis function definitions.
 */
export function parseRbatisFunctions(content: string): RbatisFunction[] {
    const functions: RbatisFunction[] = [];
    const lines = content.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
        const attrMatch = ATTR_REGEX.exec(lines[i]);
        if (!attrMatch) {
            continue;
        }

        // Look for the function definition on the next line(s)
        for (let j = i + 1; j < lines.length && j < i + MAX_LINES_TO_SEARCH; j++) {
            const fnMatch = FN_REGEX.exec(lines[j]);
            if (fnMatch) {
                const functionName = fnMatch[1];
                functions.push({
                    functionName,
                    htmlRelativePath: attrMatch[1],
                    functionPosition: new vscode.Position(j, lines[j].indexOf(functionName)),
                    attributePosition: new vscode.Position(i, lines[i].indexOf(attrMatch[1])),
                });
                // Move the outer loop cursor past this matched function
                i = j;
                break;
            }
        }
    }
    return functions;
}

/**
 * Finds the specific Rbatis context (function and attribute) at a given cursor position.
 * @param document The VS Code text document.
 * @param position The cursor position.
 * @returns The context if found, otherwise null.
 */
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
