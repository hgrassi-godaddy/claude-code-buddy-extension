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
- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)
- **VS Code Extension Manager (vsce)**

### **Step-by-Step Build Instructions**

1. **Clone the repository**
   ```bash
   git clone git@github.com:hgrassi-godaddy/claude-code-buddy-extension.git
   cd claude-code-buddy-extension
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install vsce (VS Code Extension Manager)**
   ```bash
   npm install -g @vscode/vsce
   ```

4. **Compile TypeScript**
   ```bash
   npm run compile
   ```

5. **Package into .vsix file**
   ```bash
   vsce package
   ```

   This creates: `claude-buddy-extension-0.0.1.vsix`

### **Quick Build Script**
```bash
# One command to build everything
npm run compile && vsce package
```

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
2. **Compile**: `npm run compile`
3. **Test**: Press F5 in VS Code (opens Extension Development Host)
4. **Package**: `vsce package` (creates .vsix file)

## Troubleshooting 🔧

### **Common Issues**

**"vsce: command not found"**
```bash
npm install -g @vscode/vsce
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
