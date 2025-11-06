import * as vscode from 'vscode';
import { ClaudeBuddyViewProvider } from './providers/ClaudeBuddyViewProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Claude Buddy extension is now active!');

    // Create the webview provider
    const provider = new ClaudeBuddyViewProvider(context.extensionUri);

    // Register the webview view provider
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('claudeBuddyPanel', provider),
        provider // Add provider to subscriptions so dispose is called
    );

    // Register command to open panel
    const disposable = vscode.commands.registerCommand('claude-buddy.openPanel', () => {
        vscode.window.showInformationMessage('Claude Buddy Panel Opening!');
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}