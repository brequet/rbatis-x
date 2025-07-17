import * as vscode from 'vscode';
import { DTD_IDENTIFIER } from './constants';
import { RBATIS_LANGUAGE_ID } from './config';

const MAX_LINES_TO_CHECK = 10;

/**
 * Checks if a document is an rbatis mapper file and sets its language ID.
 * This enables the dedicated 'rbatis-mapper' formatter and other features.
 * @param document The document to analyze.
 */
export async function setLanguageMode(document: vscode.TextDocument): Promise<void> {
    const isRelevantFile = ['html', 'xml'].includes(document.languageId);
    const isAlreadySet = document.languageId === RBATIS_LANGUAGE_ID;

    if (isAlreadySet || !isRelevantFile) {
        return;
    }

    // Read the first few lines to find the DTD identifier efficiently.
    const content = document.getText(new vscode.Range(0, 0, MAX_LINES_TO_CHECK, 0));
    if (content.includes(DTD_IDENTIFIER)) {
        // This is the key step: switch the language mode.
        // VS Code will now use the formatter associated with 'rbatis-mapper'.
        await vscode.languages.setTextDocumentLanguage(document, RBATIS_LANGUAGE_ID);
    }
}
