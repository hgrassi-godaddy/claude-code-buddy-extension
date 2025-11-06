# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a VS Code extension called "Claude Buddy" that creates an AI coding companion as a sidebar panel. The extension was created by the Patacones Unicorns team (Adol Coneo, Kevin Tellez, and Haley Grassi) for a hackathon project.

## Architecture

This project contains two separate applications sharing the "Claude Buddy" concept:

### 1. VS Code Extension (`src/`)
- **Main Extension**: `src/extension.ts` - Entry point that registers the webview provider and commands
- **Webview Provider**: `ClaudeBuddyViewProvider` class handles the webview lifecycle and communication
- **UI**: Embedded HTML/CSS/JavaScript within the extension file for the chat interface
- **Simple Implementation**: Hardcoded responses, basic chat interface

### 2. React Web Application (`webview-src/`)
- **Modern React App**: Component-based architecture using React 19+ with hooks
- **Styling**: Tailwind CSS with dark/light mode support
- **Build System**: Vite for development and production builds
- **Advanced Features**: File upload, buddy animations, mood system, customizable UI
- **Components**:
  - `App.jsx` - Main application with sidebar layout (ChatGPT-style)
  - `ChatInterface.jsx` - Main chat area with message handling
  - `BuddyAnimation.jsx` - Animated buddy character
  - `BuddyStatus.jsx` - Status display component
  - `FileUpload.jsx` - File upload functionality

### Key Components
- **Activity Bar Integration**: Appears as a 🤖 icon in VS Code's activity bar
- **Webview Panel**: Custom sidebar panel with chat interface, buddy avatar, and friendship tracking
- **Message Handling**: Bidirectional communication between extension and webview using `postMessage`

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

### React Web Application Development
Navigate to `webview-src/` directory and use:
```bash
# Install dependencies (from webview-package.json)
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

### Testing and Debugging
- **Extension Development**: Use F5 in VS Code or the "Run Extension" launch configuration to open a new Extension Development Host window
- **Extension Installation**: Use VS Code's Command Palette: "Extensions: Install from VSIX..." to install the packaged extension
- **Extension Activation**: The extension activates on the command `claude-buddy.openPanel`

## Technical Details

### Build Systems

#### VS Code Extension Build
- **TypeScript**: Compiled with strict mode to `out/` directory
- **Target**: ES2020, CommonJS modules
- **Source Maps**: Enabled for debugging

#### React Web Application Build
- **Vite**: Modern build tool for React development
- **React**: Version 19+ with modern hooks
- **Tailwind CSS**: Utility-first CSS framework with PostCSS
- **ESLint**: Code linting with React-specific rules

### Extension Configuration
- **Activation**: Triggered by `onCommand:claude-buddy.openPanel`
- **Entry Point**: `./out/extension.js` (compiled from `src/extension.ts`)
- **VS Code API**: Minimum version 1.74.0

### Webview Implementation
- **Security**: CSP with nonce-based script execution
- **Theming**: Uses VS Code CSS variables for native look and feel
- **Communication**: Message-based API between extension host and webview
- **Features**: Chat interface, avatar display, friendship progress tracking

### Dual Package Structure
The project contains two separate package.json files for different build systems:
- **Root `package.json`**: VS Code extension configuration and dependencies
- **`webview-package.json`**: React/Vite configuration for the web application

## File Structure
```
src/
  extension.ts              # VS Code extension entry point
webview-src/               # React web application
  App.jsx                  # Main React app component
  components/              # React components
    ChatInterface.jsx      # Main chat interface
    BuddyAnimation.jsx     # Animated buddy character
    BuddyStatus.jsx        # Status display
    FileUpload.jsx         # File upload component
  assets/                  # Static assets
.vscode/
  launch.json             # VS Code debug configuration
package.json             # Extension manifest and scripts
webview-package.json     # React app dependencies
webview-template.html    # HTML template for React app
tsconfig.json           # TypeScript configuration
out/                    # Compiled JavaScript output (git-ignored)
```

## Future Integration Plans
According to the README, planned features include:
- Integration with Claude Code CLI
- Code analysis features
- File upload support
- Enhanced buddy customization
- Smart coding suggestions