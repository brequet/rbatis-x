import * as vscode from 'vscode';
import { RBATIS_LANGUAGE_ID } from './config';
import { DTD_IDENTIFIER } from './constants';

const MAX_LINES_TO_CHECK = 10;

/**
 * Checks if a document contains the rbatis DTD and sets its language ID accordingly.
 * This enables dedicated highlighting and formatting.
 */
export async function setLanguageMode(document: vscode.TextDocument): Promise<void> {
    if (document.languageId === RBATIS_LANGUAGE_ID) {
        return;
    }

    // Efficiently check the start of the file for the DTD identifier
    const content = document.getText(new vscode.Range(0, 0, MAX_LINES_TO_CHECK, 0));
    if (content.includes(DTD_IDENTIFIER)) {
        await vscode.languages.setTextDocumentLanguage(document, RBATIS_LANGUAGE_ID);
    }
}
