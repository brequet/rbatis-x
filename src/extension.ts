import * as vscode from 'vscode';
import { CacheService } from './core/cacheService';
import { HtmlDefinitionProvider } from './features/htmlDefinitionProvider';
import { RbatisDefinitionProvider } from './features/rbatisDefinitionProvider';
import { RbatisFormattingProvider } from './features/rbatisFormattingProvider'; // Import the new provider
import { Logger } from './utils/logger';

const RUST_FILE_SELECTOR: vscode.DocumentFilter = {
	scheme: 'file',
	language: 'rust',
};

const HTML_FILE_SELECTOR: vscode.DocumentFilter = {
	scheme: 'file',
	language: 'html',
};

const XML_FILE_SELECTOR: vscode.DocumentFilter = {
	scheme: 'file',
	language: 'xml',
};

export async function activate(context: vscode.ExtensionContext) {
	Logger.log('Activating "rbatis-x" extension.');

	const cacheService = new CacheService(context);
	await cacheService.initialize();

	const rustDefinitionProvider = new RbatisDefinitionProvider();
	const htmlDefinitionProvider = new HtmlDefinitionProvider(cacheService);
	const formattingProvider = new RbatisFormattingProvider(); // Instantiate the provider

	context.subscriptions.push(
		vscode.languages.registerDefinitionProvider(RUST_FILE_SELECTOR, rustDefinitionProvider),
		vscode.languages.registerDefinitionProvider([HTML_FILE_SELECTOR, XML_FILE_SELECTOR], htmlDefinitionProvider),
		vscode.languages.registerDocumentFormattingEditProvider([HTML_FILE_SELECTOR, XML_FILE_SELECTOR], formattingProvider)
	);

	Logger.log('All definition and formatting providers registered.');
}

export function deactivate() {
	Logger.log('Deactivating "rbatis-x" extension.');
}
