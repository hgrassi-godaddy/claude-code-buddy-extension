# Claude Buddy VS Code Extension 🤖

Hackathon project created by the Patacones Unicorns (Patacorns for short): 
Adol Coneo, Kevin Tellez, and Haley Grassi

<img width="420" height="420" alt="image" src="https://github.com/user-attachments/assets/a5002305-adfc-4c94-8baf-94ff15c05824" />

Bring Claude Buddy directly into your VS Code editor! This extension adds a friendly AI coding companion as a sidebar panel.

## Features ✨

- **Sidebar Panel**: Claude Buddy lives in your VS Code sidebar
- **Chat Interface**: Clean, responsive chat UI with message bubbles
- **Buddy Character**: Large, prominent robot avatar
- **Friendship System**: Track your coding relationship progress
- **VS Code Integration**: Native look and feel with VS Code theming
- **Quick Access**: Always available while coding

## Building from Source 🔨

### **Prerequisites**
- **Node.js** (v22.19.0 recommended, see `.nvmrc`)
- **npm** (comes with Node.js)
- **Optional**: [nvm](https://github.com/nvm-sh/nvm) for Node version management

### **Step-by-Step Build Instructions**

1. **Clone the repository**
   ```bash
   git clone git@github.com:hgrassi-godaddy/claude-code-buddy-extension.git
   cd claude-code-buddy-extension
   ```

2. **Use correct Node version** (if using nvm)
   ```bash
   nvm use
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Build and package extension**
   ```bash
   npm run package
   ```

   This compiles TypeScript and creates: `claude-buddy-extension-0.0.1.vsix`

### **Alternative Build Commands**
```bash
# Compile TypeScript only
npm run compile

# Watch mode for development
npm run watch

# Build and package (same as npm run package)
npm run build-and-package
```

## Developing Locally 🔧

For active development and testing of the extension:

### **Quick Development Workflow**

1. **Build the extension**
   ```bash
   npm run compile
   ```

2. **Open the main extension file**
   ```bash
   # Open in VS Code (or manually open src/extension.ts)
   code src/extension.ts
   ```

3. **Start debugging**
   - Use Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
   - Run: **"Debug: Start Debugging"**
   - Or simply press **F5**

4. **Test in Extension Development Host**
   - A new VS Code window opens with your extension loaded
   - Look for the 🤖 icon in the Activity Bar
   - Click it to open Claude Buddy panel

5. **Reload after changes**
   - In the Extension Development Host window:
   - Use Command Palette: **"Developer: Reload Window"**
   - Or press **`Cmd+R`** (Mac) / **`Ctrl+R`** (Windows/Linux)

6. **Iterate quickly**
   - Make changes to `src/extension.ts`
   - Run: `npm run compile` (step 1)
   - Reload the Extension Development Host (step 5)
   - Test your changes immediately

### **Pro Tips for Development**
- **Watch Mode**: Use `npm run watch` to auto-compile on file changes
- **Debug Console**: Check VS Code Developer Tools (`Help` → `Toggle Developer Tools`) for errors
- **Extension Logs**: Look for "Claude Buddy extension is now active!" in the Debug Console

## Installation 🚀

### **Option 1: Install from .vsix file**
1. **Open VS Code**
2. **Install Extension**:
   - Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
   - Run "Extensions: Install from VSIX..."
   - Select the `claude-buddy-extension-0.0.1.vsix` file
3. **Open Claude Buddy**:
   - Look for the 🤖 icon in the Activity Bar
   - Or use Command Palette: "Claude Buddy: Open Panel"

### **Option 2: Development Mode**
1. **Open project in VS Code**
   ```bash
   code claude-code-buddy-extension/
   ```
2. **Press F5** to launch Extension Development Host
3. **Test in the new VS Code window**

## Claude Code Hooks Setup 🔗

To enable full friendship tracking integration with Claude Code CLI, you need to set up two hooks that will log your interactions:

### **Prerequisites**
- **Claude Code CLI** installed and configured
- **jq** command-line JSON processor (`brew install jq` on macOS)

### **Required Hooks Installation**

Follow these step-by-step instructions to set up the hooks through Claude Code:

#### **1. User Prompt Hook**
1. **Open Claude Code**
2. **Run `/hooks`**
3. **Select `UserPromptSubmit`**
4. **Select `Add new hook`**
5. **In the command field, enter:**
   ```
   jq -r '"[\(now | strftime("%Y-%m-%d %H:%M:%S"))] \(.)"' >> ~/.claude/hook-logs/user-prompts-log.txt
   ```
6. **Select User settings**

#### **2. Notification Hook**
1. **Run `/hooks`** again
2. **Select `Notification`**
3. **Select `Add new hook`**
4. **In the command field, enter:**
   ```
   jq -r '"[\(now | strftime("%Y-%m-%d %H:%M:%S"))] \(.)"' >> ~/.claude/hook-logs/notifications.txt
   ```
5. **Select User settings**

### **Verify Hooks Installation**
```bash
# Check that hooks are installed correctly
/hooks list
```

You should see both `UserPromptSubmit` and `Notification` hooks listed.

### **Automatic Setup**
The Claude Buddy extension will automatically create the required directory structure:

```
~/.claude/
├── hook-logs/
│   ├── user-prompts-log.txt    # Your Claude Code prompts (auto-created)
│   └── notifications.txt       # Claude Code notifications (auto-created)
```

**✅ What happens automatically:**
- Directory `~/.claude/hook-logs/` is created if it doesn't exist
- Empty log files are initialized (won't overwrite existing data)
- Console messages confirm successful setup

### **What This Enables**
- **🎯 Prompt Tracking**: Every Claude Code prompt increases friendship by 1%
- **🔔 Notification Tracking**: Claude Code notifications add friendship points
- **📊 Real-time Updates**: Friendship bar updates immediately without refreshing
- **📈 Progress History**: View detailed friendship progression and recent activity in the modal
- **🚀 Zero Manual Setup**: Extension handles all file/directory creation automatically

## Usage 💬

- **Start Chatting**: Type messages in the input field
- **Get Help**: Ask Claude Buddy about coding problems
- **Build Friendship**: Keep chatting to increase your friendship level
- **Always Available**: Panel stays open while you code

## Development 🛠️

### **Tech Stack**
- **TypeScript** - Main extension logic
- **VS Code Extension API** - Integration with VS Code
- **SVG Graphics** - Scalable anime cyborg character
- **CSS Variables** - Dynamic theming support
- **Webview API** - Embedded UI panel

### **Project Structure**
```
claude-code-buddy-extension/
├── src/
│   └── extension.ts          # Main extension code
├── media/                    # CSS and static files
├── package.json             # Extension manifest
├── tsconfig.json           # TypeScript config
└── README.md               # This file
```

### **Development Workflow**
1. **Make changes** to `src/extension.ts`
2. **Test**: Press F5 in VS Code (opens Extension Development Host)
3. **Package**: `npm run package` (compiles and creates .vsix file)

## Troubleshooting 🔧

### **Common Issues**

**"vsce: command not found"**
```bash
# This should not happen as vsce is now included as a dev dependency
# If it occurs, reinstall dependencies:
npm install
```

**"Cannot find module 'typescript'"**
```bash
npm install
```

**Extension not loading**
- Check VS Code Developer Console: `Help` → `Toggle Developer Tools`
- Look for error messages in Console tab

**Old version still showing**
- Uninstall previous version first: `Extensions` → `Claude Buddy` → `Uninstall`
- Restart VS Code
- Install new .vsix file

## Coming Soon 🚧

- Integration with Claude Code CLI
- Code analysis features
- File upload support
- Enhanced Buddy customization
- Smart coding suggestions

---

🤖 **Generated with Claude Code**
Co-Authored-By: Claude <noreply@anthropic.com>
