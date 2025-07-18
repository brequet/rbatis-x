import * as vscode from 'vscode';
import { CacheService } from './core/cacheService';
import { RBATIS_LANGUAGE_ID } from './core/config';
import { setLanguageMode } from './core/language';
import { HtmlDefinitionProvider } from './features/htmlDefinitionProvider';
import { RbatisDefinitionProvider } from './features/rbatisDefinitionProvider';
import { RbatisFormattingProvider } from './features/rbatisFormattingProvider'; // Import the new provider
import { Logger } from './utils/logger';

export const RUST_FILE_SELECTOR = { scheme: 'file', language: 'rust' };
export const HTML_FILE_SELECTOR = { scheme: 'file', language: 'html' };
export const XML_FILE_SELECTOR = { scheme: 'file', language: 'xml' };
export const RBATIS_MAPPER_SELECTOR = { scheme: 'file', language: RBATIS_LANGUAGE_ID };

export async function activate(context: vscode.ExtensionContext) {
	Logger.log('Activating "rbatis-x" extension.');

	const cacheService = new CacheService(context);
	await cacheService.initialize();

	const rustDefinitionProvider = new RbatisDefinitionProvider();
	const htmlDefinitionProvider = new HtmlDefinitionProvider(cacheService);
	const formattingProvider = new RbatisFormattingProvider();

	context.subscriptions.push(
		vscode.languages.registerDefinitionProvider(RUST_FILE_SELECTOR, rustDefinitionProvider),
		vscode.languages.registerDefinitionProvider([HTML_FILE_SELECTOR, XML_FILE_SELECTOR], htmlDefinitionProvider),
		vscode.languages.registerDocumentFormattingEditProvider(RBATIS_MAPPER_SELECTOR, formattingProvider)
	);

	Logger.log('All definition and formatting providers registered.');

	// --- Automatic Language Detection ---

	for (const document of vscode.workspace.textDocuments) {
		await setLanguageMode(document);
	}

	context.subscriptions.push(
		vscode.workspace.onDidOpenTextDocument(document => {
			setLanguageMode(document);
		})
	);

	Logger.log('Rbatis mapper language detector initialized.');
}

export function deactivate() {
	Logger.log('Deactivating "rbatis-x" extension.');
}
