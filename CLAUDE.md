# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a VS Code extension called "Claude Buddy" that creates an AI coding companion as a sidebar panel. The extension was created by the Patacones Unicorns team (Adol Coneo, Kevin Tellez, and Haley Grassi) for a hackathon project.

## Architecture

This is a modular VS Code extension with progressive loading capabilities:

### Core Extension Architecture (`src/`)
- **Main Extension**: `src/extension.ts` - Minimal entry point (867 bytes, 99% reduction from original)
- **Webview Provider**: `src/providers/ClaudeBuddyViewProvider.ts` - Handles webview lifecycle and communication
- **Services Layer**: Modular services for different functionality
- **UI Assets**: Separate HTML, CSS, and JavaScript files for maintainability

### Service Layer (`src/services/`)
- **ChatService.ts**: Intelligent message handling and conversation management
- **WebviewService.ts**: HTML template processing, asset URI generation, and CSP management
- **ReplyWatcherService.ts**: Progressive reply loading with exponential backoff and conversation chain parsing

### Prompt History Integration (`src/promptHistoryService.ts`)
- **Claude Code Integration**: Reads from `~/.claude/hook-logs/user-prompts-log.txt`
- **Transcript Parsing**: JSONL format parsing with UUID-based conversation tracking
- **Progressive Loading**: Watches for assistant replies that aren't available immediately
- **Content Matching**: UUID extraction via content and timestamp matching

### Webview Assets (`src/webview/`, `src/templates/`)
- **Template System**: HTML templates with placeholder substitution
- **Modular Styles**: 5 separate CSS files (main, buddy, chat, navigation, animations)
- **Bundled JavaScript**: Single `claude-buddy.js` file (converted from ES6 modules for webview compatibility)
- **SVG Avatar**: Separate 357-line SVG asset file

### Key Components
- **Activity Bar Integration**: Appears as a 🤖 icon in VS Code's activity bar
- **Webview Panel**: Custom sidebar panel with chat interface, buddy avatar, and friendship tracking
- **Progressive Reply System**: Handles timing issues where user prompts appear immediately but assistant replies load later
- **File System Watching**: Monitors Claude Code log files and transcripts for real-time updates

## Development Commands

### VS Code Extension Development
```bash
# Compile TypeScript to JavaScript
npm run compile

# Watch mode for development (auto-compile on changes)
npm run watch

# Compile and package extension as .vsix file (recommended)
npm run package

# Alternative: Compile and package (same as above)
npm run build-and-package

# Prepare for publishing (compile only)
npm run vscode:prepublish
```

### Progressive Reply System Development
Key debugging and monitoring commands:
```bash
# Monitor Claude Code logs for testing
tail -f ~/.claude/hook-logs/user-prompts-log.txt

# Check transcript files (paths from log entries)
ls -la ~/.claude/transcripts/

# Test progressive loading
# 1. Send prompt in Claude Code
# 2. Check VS Code Developer Console for debug messages:
#    [PromptHistory] Found matching user UUID: <uuid> for prompt: <prompt>
#    [ReplyWatcher] Started watching for reply to prompt <promptId>
#    [ReplyWatcher] Found reply for prompt <promptId>
```

### Testing and Debugging
- **Extension Development**: Use F5 in VS Code or the "Run Extension" launch configuration to open a new Extension Development Host window
- **Extension Installation**: Use VS Code's Command Palette: "Extensions: Install from VSIX..." to install the packaged extension
- **Extension Activation**: The extension activates on the command `claude-buddy.openPanel`
- **Progressive Loading Debug**: Monitor VS Code Developer Console for `[PromptHistory]` and `[ReplyWatcher]` log messages

## Technical Details

### Progressive Reply Loading System
The extension integrates with Claude Code's hook system to show user prompts immediately and load assistant replies progressively:

```typescript
// Key conversation chain parsing logic in ReplyWatcherService.ts
private findAssistantInChain(entries: any[], userUuid: string): any | null {
    let currentUuid = userUuid;
    let maxDepth = 20; // Prevent infinite loops

    while (currentUuid && depth < maxDepth) {
        const nextEntry = entries.find(entry =>
            entry.parentUuid === currentUuid &&
            entry.message?.role === 'assistant' &&
            entry.message?.content
        );

        if (nextEntry) {
            // Check for actual text content vs tool use
            const content = nextEntry.message.content;
            if (Array.isArray(content)) {
                const hasText = content.some(item => item.type === 'text' && item.text?.trim());
                if (hasText) return nextEntry;
                currentUuid = nextEntry.uuid; // Continue following chain
            }
        } else break;
    }
    return null;
}
```

### Build System
- **TypeScript**: Compiled with strict mode to `out/` directory
- **Target**: ES2020, CommonJS modules
- **Source Maps**: Enabled for debugging
- **Package Size**: Optimized from 131.51 KB to 81.67 KB through modularization

### Extension Configuration
- **Activation**: Triggered by `onCommand:claude-buddy.openPanel`
- **Entry Point**: `./out/extension.js` (compiled from `src/extension.ts`)
- **VS Code API**: Minimum version 1.74.0
- **Node Version**: 22.19.0 (see `.nvmrc`)

### Webview Implementation
- **Security**: CSP with nonce-based script execution
- **Theming**: Uses VS Code CSS variables for native look and feel
- **Communication**: Message-based API between extension host and webview
- **Template System**: Placeholder-based HTML generation with asset URI management
- **JavaScript Bundling**: ES6 modules converted to IIFE for webview compatibility

### Claude Code Integration
- **Log File**: `~/.claude/hook-logs/user-prompts-log.txt` (JSON format with timestamp)
- **Transcript Files**: JSONL format in `~/.claude/transcripts/` with conversation UUIDs
- **Retry Logic**: Exponential backoff (1s, 2s, 4s, 8s, 16s, 32s, 64s, 128s) for up to 8 attempts
- **UUID Matching**: Content-based matching with 1-minute timestamp window for user message identification

## File Structure
```
src/
  extension.ts                          # Minimal entry point (867 bytes)
  extension-original-backup.ts          # Backup of original monolithic file (89,471 bytes)
  promptHistoryService.ts               # Claude Code log integration with progressive loading
  providers/
    ClaudeBuddyViewProvider.ts          # Webview lifecycle management
  services/
    ChatService.ts                      # Message handling and conversation management
    WebviewService.ts                   # HTML template processing and asset management
    ReplyWatcherService.ts              # Progressive reply loading with conversation chain parsing
  types/
    index.ts                            # TypeScript type definitions
  utils/
    constants.ts                        # Application constants
    helpers.ts                          # Utility functions
    logger.ts                           # Logging utilities
  webview/
    assets/
      buddy-avatar.svg                  # 357-line SVG avatar (extracted from original)
    scripts/
      claude-buddy.js                   # Bundled JavaScript (IIFE format for webview compatibility)
      *.js                              # Modular script files
    styles/
      main.css                          # Core styles
      buddy.css                         # Buddy character styles
      chat.css                          # Chat interface styles
      navigation.css                    # Navigation styles
      animations.css                    # Animation definitions
  templates/
    webview.html                        # HTML template with placeholders
.vscode/
  launch.json                           # VS Code debug configuration
package.json                            # Extension manifest and dependencies
tsconfig.json                           # TypeScript configuration
.nvmrc                                 # Node version specification (22.19.0)
out/                                   # Compiled JavaScript output (git-ignored)
```

## Modularization Benefits
- **Size Reduction**: Main extension file reduced from 89,471 bytes to 867 bytes (99% reduction)
- **Package Optimization**: Extension package reduced from 131.51 KB to 81.67 KB
- **Maintainability**: Clean separation of concerns with service layer architecture
- **Debugging**: Isolated components make issue identification and resolution easier
- **Template System**: HTML/CSS/JS assets are separate files with placeholder-based generation

## Progressive Loading Implementation
The extension handles the timing challenge where user prompts appear immediately but assistant replies aren't available yet:

1. **Immediate Display**: User prompts from `user-prompts-log.txt` appear instantly
2. **UUID Extraction**: Content-based matching identifies the actual message UUID from transcript files
3. **Conversation Chain Following**: Assistant replies are found by following `parentUuid` chains in JSONL transcripts
4. **Exponential Backoff**: Progressive retry system with increasing intervals for up to 8 attempts
5. **Real-time Updates**: File system watchers monitor transcript changes and update the UI dynamically

## Integration with Claude Code CLI
- **Hook Integration**: Reads from Claude Code's user prompt logging system
- **Transcript Parsing**: Processes JSONL transcript files with UUID-based conversation tracking
- **Real-time Monitoring**: File system watchers for immediate updates when new prompts or replies are available
- **Debugging Support**: Comprehensive console logging for troubleshooting progressive loading issues