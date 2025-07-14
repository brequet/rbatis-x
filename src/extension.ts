import * as vscode from 'vscode';
import { CacheService } from './core/cacheService';
import { HtmlDefinitionProvider } from './features/htmlDefinitionProvider';
import { RbatisDefinitionProvider } from './features/rbatisDefinitionProvider';
import { Logger } from './utils/logger';

const RUST_FILE_SELECTOR: vscode.DocumentFilter = {
	scheme: 'file',
	language: 'rust',
};

const HTML_FILE_SELECTOR: vscode.DocumentFilter = {
	scheme: 'file',
	language: 'html',
};

export async function activate(context: vscode.ExtensionContext) {
	Logger.log('Activating "rbatis-x" extension.');

	const cacheService = new CacheService(context);
	await cacheService.initialize();

	const rustDefinitionProvider = new RbatisDefinitionProvider();
	const htmlDefinitionProvider = new HtmlDefinitionProvider(cacheService);

	context.subscriptions.push(
		vscode.languages.registerDefinitionProvider(RUST_FILE_SELECTOR, rustDefinitionProvider),
		vscode.languages.registerDefinitionProvider(HTML_FILE_SELECTOR, htmlDefinitionProvider)
	);

	Logger.log('All definition providers registered.');
}

export function deactivate() {
	Logger.log('Deactivating "rbatis-x" extension.');
}
