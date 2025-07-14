import * as vscode from 'vscode';

export interface RbatisContext {
    functionName: string;
    relativePath: string;
    triggerRange: vscode.Range;
}
