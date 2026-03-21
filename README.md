# Cocos Creator CLI

> Control Cocos Creator from the command line.

**No MCP server. No complex configuration. Just run commands.**

## Overview
This standalone CLI provides commands to inspect, manipulate, and debug your Cocos Creator Editor directly via node commands in the shell, mimicking the design logic of `unity-cli`.

This project contains two parts:
1. `cli/`: the Node.js TypeScript wrapper binary that runs in terminal.
2. `extension/`: the Cocos Creator extension `cocos-creator-connector` that opens an automatic local HTTP server on port 8585 inside your editor.

## Installation

### 1. Install CLI
Navigate into the `cli` directory and install it globally:
```bash
cd cli
npm install
npm run build
npm link
```

### 2. Install the Extension
Navigate to your target Cocos Creator project directory and copy the `extension/` folder into your `<CocosProject>/extensions/cocos-creator-connector`.

Alternatively, install it globally for all projects:
```bash
mkdir -p ~/.CocosCreator/extensions/
cp -R extension ~/.CocosCreator/extensions/cocos-creator-connector
```
*Note: Make sure to navigate inside Cocos Creator > Extensions > Extension Manager to enable `cocos-creator-connector`.*

## Available Commands

Because `cocos-creator-cli` fetches available commands dynamically, you don't need to manually configure anything. Simply boot Cocos Creator and run:

```bash
# Verify connection
cocos-creator-cli status

# List all available commands dynamically retrieved from Cocos Creator
cocos-creator-cli list

# Unity-style one-liner script execution
cocos-creator-cli exec "Editor.Project.name"
```

### Example Commands:

```bash
# Get the current active scene
cocos-creator-cli scene get_current_scene

# Create a new Node in the scene
cocos-creator-cli node create_node --params '{"name": "My CLI Node"}'

# Execute arbitrary script logic
cocos-creator-cli debug execute_script --params '{"script": "console.log(\"Hello from CLI!\"); return true;"}'

# Build the project
cocos-creator-cli project build_project
```
