import * as assert from 'assert';
import * as vscode from 'vscode';
import { findRbatisContext } from '../../src/logic/rustParser';

suite('Rust Parser Test Suite', () => {
    async function createTestDocument(content: string): Promise<vscode.TextDocument> {
        return await vscode.workspace.openTextDocument({ content, language: 'rust' });
    }

    test('should find context when cursor is on the function name', async () => {
        const content = `
#[html_sql("mapper/user.html")]
pub async fn get_user() -> User {}
        `;
        const doc = await createTestDocument(content.trim());
        const position = new vscode.Position(1, 20); // Cursor on "get_user"

        const context = findRbatisContext(doc, position);

        assert.ok(context, 'Context should not be null');
        assert.strictEqual(context.functionName, 'get_user');
        assert.strictEqual(context.relativePath, 'mapper/user.html');
    });

    test('should find context when cursor is on the attribute path', async () => {
        const content = `
#[html_sql("mapper/user.html")]
pub async fn get_user() -> User {}
        `;
        const doc = await createTestDocument(content.trim());
        const position = new vscode.Position(0, 15); // Cursor on "mapper/user.html"

        const context = findRbatisContext(doc, position);

        assert.ok(context, 'Context should not be null');
        assert.strictEqual(context.functionName, 'get_user');
        assert.strictEqual(context.relativePath, 'mapper/user.html');
    });

    test('should return null for a function without the attribute', async () => {
        const content = `
pub async fn some_other_function() {}
        `;
        const doc = await createTestDocument(content.trim());
        const position = new vscode.Position(0, 20); // Cursor on "some_other_function"

        const context = findRbatisContext(doc, position);
        assert.strictEqual(context, null);
    });
});
