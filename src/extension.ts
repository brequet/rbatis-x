import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';

/**
 * A data structure to hold the parsed context from the Rust source file.
 */
interface RbatisContext {
	functionName: string;
	relativePath: string;
}

class RbatisDefinitionProvider implements vscode.DefinitionProvider {

	/**
	 * Provides the definition for a rbatis html_sql-annotated function.
	 */
	public async provideDefinition(
		document: vscode.TextDocument,
		position: vscode.Position
	): Promise<vscode.Location | null> {
		const context = this.findRbatisContext(document, position);
		if (!context) {
			return null;
		}

		const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
		if (!workspaceFolder) {
			console.error("[rbatis-x] Could not find a workspace folder.");
			return null;
		}

		const absolutePath = path.join(workspaceFolder.uri.fsPath, context.relativePath);
		const fileUri = vscode.Uri.file(absolutePath);

		const targetPosition = await this.findSqlTagPosition(fileUri, context.functionName);

		return new vscode.Location(fileUri, targetPosition);
	}

	/**
	 * Finds the context for a rbatis function by looking at the lines around the cursor.
	 * It's triggered if the cursor is on the function name or its html_sql path.
	 */
	private findRbatisContext(document: vscode.TextDocument, position: vscode.Position): RbatisContext | null {
		const lineText = document.lineAt(position.line).text;

		const fnRegex = /pub async fn (\w+)/;
		const attrRegex = /#\[html_sql\("([^"]+)"\)\]/;

		// Case 1: Cursor is on a line with a function definition
		const fnMatch = fnRegex.exec(lineText);
		if (fnMatch) {
			const functionName = fnMatch[1];
			const nameIndex = lineText.indexOf(functionName);
			const nameRange = new vscode.Range(position.line, nameIndex, position.line, nameIndex + functionName.length);

			if (nameRange.contains(position)) {
				// Search upwards for the html_sql attribute
				for (let i = position.line - 1; i >= 0 && i > position.line - 3; i--) {
					const prevLineText = document.lineAt(i).text;
					const attrMatch = attrRegex.exec(prevLineText);
					if (attrMatch) {
						return { functionName, relativePath: attrMatch[1] };
					}
				}
			}
		}

		// Case 2: Cursor is on a line with an html_sql attribute
		const attrMatch = attrRegex.exec(lineText);
		if (attrMatch) {
			const relativePath = attrMatch[1];
			const pathIndex = lineText.indexOf(relativePath);
			const pathRange = new vscode.Range(position.line, pathIndex, position.line, pathIndex + relativePath.length);

			if (pathRange.contains(position)) {
				// Search downwards for the function definition
				for (let i = position.line + 1; i < document.lineCount && i < position.line + 3; i++) {
					const nextLineText = document.lineAt(i).text;
					const fnMatch = fnRegex.exec(nextLineText);
					if (fnMatch) {
						return { functionName: fnMatch[1], relativePath };
					}
				}
			}
		}

		return null;
	}

	/**
	 * Reads the target HTML file and finds the line and column of the SQL tag.
	 */
	private async findSqlTagPosition(fileUri: vscode.Uri, functionName: string): Promise<vscode.Position> {
		try {
			const fileContent = await fs.readFile(fileUri.fsPath, 'utf-8');
			const lines = fileContent.split(/\r?\n/);

			const tagRegex = new RegExp(`<(?:select|insert|update|delete)\\s+id\\s*=\\s*"${functionName}"`);

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				if (tagRegex.test(line)) {
					// Position the cursor at the start of the tag for better visibility
					const character = line.search(/\S|$/); // First non-whitespace character
					return new vscode.Position(i, character);
				}
			}
		} catch (error) {
			console.error(`[rbatis-x] Error reading or parsing file ${fileUri.fsPath}:`, error);
			vscode.window.showErrorMessage(`[rbatis-x] Could not open or find tag in ${fileUri.fsPath}`);
		}

		// Fallback to the beginning of the file if the tag is not found
		return new vscode.Position(0, 0);
	}
}

export function activate(context: vscode.ExtensionContext) {
	console.log('[rbatis-x] Activating extension.');

	const provider = new RbatisDefinitionProvider();

	context.subscriptions.push(
		vscode.languages.registerDefinitionProvider(
			{ scheme: 'file', language: 'rust' },
			provider
		)
	);

	console.log('[rbatis-x] Definition provider registered for Rust files.');
}

export function deactivate() {
	console.log('[rbatis-x] Deactivating extension.');
}

