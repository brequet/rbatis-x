import * as vscode from 'vscode';
import { parseRbatisFunctions } from '../logic/rustParser';
import { debounce } from '../utils/debounce';
import { Logger } from '../utils/logger';
import { resolveWorkspacePath } from '../utils/workspace';

interface RustDefinitionInfo {
    rustFileUri: vscode.Uri;
    functionName: string;
    functionPosition: vscode.Position;
}

// Maps an HTML file path to a map of function IDs to their definitions in Rust.
type RbatisIndex = Map<string, Map<string, RustDefinitionInfo>>;
// Maps a Rust file path to the set of HTML files that reference it.
type RustReverseIndex = Map<string, Set<string>>;

/**
 * Manages an in-memory index of rbatis function definitions for fast lookups.
 * It watches for file changes to keep the index up-to-date.
 */
export class CacheService {
    private index: RbatisIndex = new Map();
    private rustFileToHtmlPaths: RustReverseIndex = new Map();
    private isIndexing = false;

    constructor(private context: vscode.ExtensionContext) { }

    /**
     * Initializes the service by building the initial index and setting up file watchers.
     */
    public async initialize(): Promise<void> {
        await this.buildIndex();
        this.setupFileWatcher();
    }

    /**
     * Finds a Rust function definition from the cache.
     * @param htmlPath The absolute path of the HTML file.
     * @param functionId The function ID (e.g., "select_by_id").
     * @returns The definition info or undefined if not found.
     */
    public findDefinition(htmlPath: string, functionId: string): RustDefinitionInfo | undefined {
        return this.index.get(htmlPath)?.get(functionId);
    }

    private async buildIndex(): Promise<void> {
        if (this.isIndexing) {
            return;
        }

        Logger.log('Building rbatis index...');
        this.isIndexing = true;
        this.index.clear();
        this.rustFileToHtmlPaths.clear();

        try {
            const rustFiles = await vscode.workspace.findFiles('**/*.rs');
            await Promise.all(rustFiles.map(file => this.updateIndexForFile(file)));
            Logger.log(`Indexing complete. Processed ${rustFiles.length} Rust files.`);
        } catch (e) {
            Logger.error('Failed during initial index build.', e);
        } finally {
            this.isIndexing = false;
        }
    }

    private async updateIndexForFile(uri: vscode.Uri): Promise<void> {
        try {
            const content = (await vscode.workspace.fs.readFile(uri)).toString();
            const functions = parseRbatisFunctions(content);

            for (const func of functions) {
                const htmlUri = resolveWorkspacePath(uri, func.htmlRelativePath);
                if (!htmlUri) continue;

                const defInfo: RustDefinitionInfo = {
                    rustFileUri: uri,
                    functionName: func.functionName,
                    functionPosition: func.functionPosition,
                };
                this.addToIndex(htmlUri.fsPath, func.functionName, defInfo);
            }
        } catch (e) {
            Logger.error(`Failed to index file: ${uri.fsPath}`, e);
        }
    }

    private addToIndex(htmlPath: string, functionName: string, defInfo: RustDefinitionInfo): void {
        if (!this.index.has(htmlPath)) {
            this.index.set(htmlPath, new Map());
        }
        this.index.get(htmlPath)!.set(functionName, defInfo);

        // Update the reverse index
        const rustPath = defInfo.rustFileUri.fsPath;
        if (!this.rustFileToHtmlPaths.has(rustPath)) {
            this.rustFileToHtmlPaths.set(rustPath, new Set());
        }
        this.rustFileToHtmlPaths.get(rustPath)!.add(htmlPath);
    }

    private setupFileWatcher(): void {
        const watcher = vscode.workspace.createFileSystemWatcher('**/*.rs');

        const debouncedHandler = debounce(async (uri: vscode.Uri) => {
            Logger.log(`File changed, updating index for: ${uri.fsPath}`);
            // Clear and re-index the specific file.
            this.clearEntriesForRustFile(uri);
            await this.updateIndexForFile(uri);
        }, 300);

        watcher.onDidChange(debouncedHandler);
        watcher.onDidCreate(uri => {
            Logger.log(`File created, adding to index: ${uri.fsPath}`);
            this.updateIndexForFile(uri);
        });
        watcher.onDidDelete(uri => {
            Logger.log(`File deleted, removing from index: ${uri.fsPath}`);
            this.clearEntriesForRustFile(uri);
        });

        this.context.subscriptions.push(watcher);
    }

    private clearEntriesForRustFile(rustFileUri: vscode.Uri): void {
        const rustPath = rustFileUri.fsPath;
        const affectedHtmlPaths = this.rustFileToHtmlPaths.get(rustPath);

        if (!affectedHtmlPaths) {
            return;
        }

        for (const htmlPath of affectedHtmlPaths) {
            const functions = this.index.get(htmlPath);
            if (!functions) continue;

            for (const [funcId, defInfo] of functions.entries()) {
                if (defInfo.rustFileUri.fsPath === rustPath) {
                    functions.delete(funcId);
                }
            }

            if (functions.size === 0) {
                this.index.delete(htmlPath);
            }
        }

        this.rustFileToHtmlPaths.delete(rustPath);
    }
}
