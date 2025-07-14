import * as vscode from 'vscode';

export class Logger {
    private static readonly outputChannel = vscode.window.createOutputChannel("Rbatis-X");

    public static log(message: string): void {
        const timestamp = new Date().toLocaleTimeString();
        this.outputChannel.appendLine(`[${timestamp}] [INFO] ${message}`);
    }

    public static error(message: string, error?: unknown): void {
        const timestamp = new Date().toLocaleTimeString();
        this.outputChannel.appendLine(`[${timestamp}] [ERROR] ${message}`);

        if (error instanceof Error) {
            this.outputChannel.appendLine(error.stack || error.message);
        } else if (error) {
            this.outputChannel.appendLine(String(error));
        }

        vscode.window.showErrorMessage(`[rbatis-x] ${message}. See output for details.`);
    }
}
