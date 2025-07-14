import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { resolveWorkspacePath } from '../utils/workspace';

interface RustDefinitionInfo {
    rustFileUri: vscode.Uri;
    functionName: string;
    functionPosition: vscode.Position;
}

// Maps an HTML file path to a map of function IDs to their definitions in Rust
type RbatisIndex = Map<string, Map<string, RustDefinitionInfo>>;

const ATTR_REGEX = /#\[html_sql\("([^"]+)"\)\]/;
const FN_REGEX = /pub\s+async\s+fn\s+(\w+)/;

export class CacheService {
    private index: RbatisIndex = new Map();
    private isIndexing = false;

    constructor(private context: vscode.ExtensionContext) { }

    public async initialize(): Promise<void> {
        await this.buildIndex();
        this.setupFileWatcher();
    }

    public findDefinition(htmlPath: string, functionId: string): RustDefinitionInfo | undefined {
        return this.index.get(htmlPath)?.get(functionId);
    }

    private async buildIndex(): Promise<void> {
        if (this.isIndexing) return;

        Logger.log("Building rbatis index...");
        this.isIndexing = true;
        this.index.clear();

        const rustFiles = await vscode.workspace.findFiles('**/*.rs');
        for (const file of rustFiles) {
            await this.updateIndexForFile(file);
        }

        this.isIndexing = false;
        Logger.log(`Indexing complete. Found ${rustFiles.length} Rust files.`);
    }

    private async updateIndexForFile(uri: vscode.Uri): Promise<void> {
        try {
            const content = (await vscode.workspace.fs.readFile(uri)).toString();
            const lines = content.split(/\r?\n/);

            for (let i = 0; i < lines.length; i++) {
                const attrMatch = ATTR_REGEX.exec(lines[i]);
                if (attrMatch && i + 1 < lines.length) {
                    const fnMatch = FN_REGEX.exec(lines[i + 1]);
                    if (fnMatch) {
                        const htmlRelativePath = attrMatch[1];
                        const functionName = fnMatch[1];

                        const htmlUri = resolveWorkspacePath(uri, htmlRelativePath);
                        if (!htmlUri) continue;

                        if (!this.index.has(htmlUri.fsPath)) {
                            this.index.set(htmlUri.fsPath, new Map());
                        }

                        const functionPosition = new vscode.Position(i + 1, lines[i + 1].indexOf(functionName));
                        this.index.get(htmlUri.fsPath)!.set(functionName, {
                            rustFileUri: uri,
                            functionName,
                            functionPosition,
                        });
                    }
                }
            }
        } catch (e) {
            Logger.error(`Failed to index file: ${uri.fsPath}`, e);
        }
    }

    private setupFileWatcher(): void {
        const watcher = vscode.workspace.createFileSystemWatcher('**/*.rs');

        watcher.onDidChange(uri => {
            Logger.log(`File changed, updating index for: ${uri.fsPath}`);
            // To be robust, clear old entries before updating
            this.clearEntriesForRustFile(uri);
            this.updateIndexForFile(uri);
        });
        watcher.onDidCreate(uri => {
            Logger.log(`File created, updating index for: ${uri.fsPath}`);
            this.updateIndexForFile(uri);
        });
        watcher.onDidDelete(uri => {
            Logger.log(`File deleted, removing from index: ${uri.fsPath}`);
            this.clearEntriesForRustFile(uri);
        });

        this.context.subscriptions.push(watcher);
    }

    private clearEntriesForRustFile(rustFileUri: vscode.Uri): void {
        for (const [htmlPath, functions] of this.index.entries()) {
            for (const [funcId, defInfo] of functions.entries()) {
                if (defInfo.rustFileUri.fsPath === rustFileUri.fsPath) {
                    functions.delete(funcId);
                }
            }
            if (functions.size === 0) {
                this.index.delete(htmlPath);
            }
        }
    }
}
