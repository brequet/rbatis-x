import { SqlLanguage } from 'sql-formatter';
import * as vscode from 'vscode';

export interface RbatisContext {
    functionName: string;
    relativePath: string;
    triggerRange: vscode.Range;
}

export interface RbatisFunction {
    functionName: string;
    htmlRelativePath: string;
    functionPosition: vscode.Position;
    attributePosition: vscode.Position;
}

export interface FormatOptions {
    language: SqlLanguage;
    tabSize: number;
    insertSpaces: boolean;
}