import * as path from 'path';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('Extension "rbatis-x" is activating.');

	const definitionProvider = vscode.languages.registerDefinitionProvider(
		{ scheme: 'file', language: 'rust' },
		{
			provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
				const line = document.lineAt(position.line);
				console.log(`Checking line: ${line.text}`);

				const match = /#\[html_sql\("([^"]+)"\)\]/.exec(line.text);

				if (!match) {
					console.log("No #[html_sql] attribute found on this line.");
					return null;
				}

				// The full match is match[0], the path is the first capture group in match[1].
				const relativePath = match[1];
				const matchStartIndex = line.text.indexOf(relativePath, match.index);
				const matchEndIndex = matchStartIndex + relativePath.length;

				// Check if the cursor position is within the file path string
				if (position.character < matchStartIndex || position.character > matchEndIndex) {
					console.log("Cursor is not on the path string.");
					return null;
				}

				const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
				if (!workspaceFolder) {
					console.error("Could not find a workspace folder.");
					return null;
				}

				const absolutePath = path.join(workspaceFolder.uri.fsPath, relativePath);
				const fileUri = vscode.Uri.file(absolutePath);

				console.log(`Successfully resolved path: ${fileUri.fsPath}`);
				return new vscode.Location(fileUri, new vscode.Position(0, 0));
			}
		}
	);

	context.subscriptions.push(definitionProvider);

	console.log('Congratulations, your extension "rbatis-x" is now active!');
}

export function deactivate() {
	console.log('Extension "rbatis-x" is deactivating.');
}
