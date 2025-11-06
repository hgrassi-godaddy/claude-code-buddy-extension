import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface WebviewResourceConfig {
    cspSource: string;
    nonce: string;
    extensionUri: vscode.Uri;
}

export interface WebviewAssetUris {
    mainCss: vscode.Uri;
    buddyCss: vscode.Uri;
    chatCss: vscode.Uri;
    navigationCss: vscode.Uri;
    animationsCss: vscode.Uri;
    mainJs: vscode.Uri;
}

export class WebviewService {
    private extensionUri: vscode.Uri;

    constructor(extensionUri: vscode.Uri) {
        this.extensionUri = extensionUri;
    }

    /**
     * Generate a secure nonce for CSP
     */
    public generateNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    /**
     * Generate webview URIs for all CSS and JS assets
     */
    public generateAssetUris(webview: vscode.Webview): WebviewAssetUris {
        const stylesPath = ['src', 'webview', 'styles'];
        const scriptsPath = ['src', 'webview', 'scripts'];

        return {
            mainCss: webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, ...stylesPath, 'main.css')),
            buddyCss: webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, ...stylesPath, 'buddy.css')),
            chatCss: webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, ...stylesPath, 'chat.css')),
            navigationCss: webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, ...stylesPath, 'navigation.css')),
            animationsCss: webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, ...stylesPath, 'animations.css')),
            mainJs: webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, ...scriptsPath, 'claude-buddy.js'))
        };
    }

    /**
     * Read and process the HTML template with placeholders
     */
    public generateHtmlFromTemplate(webview: vscode.Webview): string {
        const config: WebviewResourceConfig = {
            cspSource: webview.cspSource,
            nonce: this.generateNonce(),
            extensionUri: this.extensionUri
        };

        const assetUris = this.generateAssetUris(webview);

        // Read the HTML template
        const htmlTemplatePath = path.join(this.extensionUri.fsPath, 'src', 'templates', 'webview.html');

        if (!fs.existsSync(htmlTemplatePath)) {
            console.error('HTML template not found at:', htmlTemplatePath);
            return this.generateFallbackHtml(config);
        }

        let htmlTemplate = fs.readFileSync(htmlTemplatePath, 'utf8');

        // Read the SVG avatar
        const svgPath = path.join(this.extensionUri.fsPath, 'src', 'webview', 'assets', 'buddy-avatar.svg');

        let avatarSvg = '';
        if (fs.existsSync(svgPath)) {
            avatarSvg = fs.readFileSync(svgPath, 'utf8');
        } else {
            console.error('SVG avatar not found at:', svgPath);
            avatarSvg = '<div>Avatar not found</div>';
        }

        // Replace placeholders with actual values
        return this.replacePlaceholders(htmlTemplate, {
            cspSource: config.cspSource,
            nonce: config.nonce,
            mainCss: assetUris.mainCss.toString(),
            buddyCss: assetUris.buddyCss.toString(),
            chatCss: assetUris.chatCss.toString(),
            navigationCss: assetUris.navigationCss.toString(),
            animationsCss: assetUris.animationsCss.toString(),
            mainJs: assetUris.mainJs.toString(),
            avatarSvg: avatarSvg
        });
    }

    /**
     * Replace all placeholders in template with actual values
     */
    private replacePlaceholders(template: string, values: Record<string, string>): string {
        let result = template;

        for (const [key, value] of Object.entries(values)) {
            const placeholder = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(placeholder, value);
        }

        return result;
    }

    /**
     * Generate a basic fallback HTML if template files are missing
     */
    private generateFallbackHtml(config: WebviewResourceConfig): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${config.cspSource} 'unsafe-inline'; script-src 'nonce-${config.nonce}';">
    <title>Claude Buddy</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 16px;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .error {
            background: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            color: var(--vscode-inputValidation-errorForeground);
            padding: 12px;
            border-radius: 4px;
            margin-bottom: 16px;
        }
    </style>
</head>
<body>
    <div class="error">
        <h3>⚠️ Claude Buddy Setup Issue</h3>
        <p>Some template files are missing. The extension needs to be properly configured.</p>
        <p>Please check that all files are present in the extension directory.</p>
    </div>
    <p>Claude Buddy is your VS Code companion, but it needs its template files to display properly.</p>
</body>
</html>`;
    }

    /**
     * Validate that all required template files exist
     */
    public validateTemplateFiles(): { valid: boolean; missingFiles: string[] } {
        const requiredFiles = [
            'src/templates/webview.html',
            'src/webview/assets/buddy-avatar.svg',
            'src/webview/styles/main.css',
            'src/webview/styles/buddy.css',
            'src/webview/styles/chat.css',
            'src/webview/styles/navigation.css',
            'src/webview/styles/animations.css',
            'src/webview/scripts/claude-buddy.js'
        ];

        const missingFiles: string[] = [];

        for (const file of requiredFiles) {
            const fullPath = path.join(this.extensionUri.fsPath, file);
            if (!fs.existsSync(fullPath)) {
                missingFiles.push(file);
            }
        }

        return {
            valid: missingFiles.length === 0,
            missingFiles
        };
    }
}