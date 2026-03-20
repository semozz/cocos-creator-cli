Implementation Plan: cocos-creator-cli (Standalone)
Background Context
The goal is to build a full cocos-creator-cli tool exactly like unity-cli from scratch. We will not use cocos-mcp-server; we will only use it as a reference for what features to implement and how to call the internal Editor.Message APIs of Cocos Creator.

Architecture
Like unity-cli, a CLI tool needs a way to talk to the open editor instance. Since Cocos Creator doesn't natively expose all Editor APIs to the external shell, we need two components:

The Extension (cocos-creator-connector):

A standard Cocos Creator 3.x extension running inside the editor.
It will start an automatic local HTTP server (e.g., on port 8686).
It will contain all the core logic ported from cocos-mcp-server (Scene tools, Node tools, etc.) using Editor.Message.request.
The CLI binary (cocos-creator-cli):

A standalone command-line application.
It provides user-friendly shell commands (e.g., cocos-creator-cli scene get_current_scene).
It formats the user's terminal arguments, sends an HTTP request to the extension's local server (port 8686), and prints the result back to the terminal.
Features to Implement (Referenced from cocos-mcp-server)
We will port the following features directly into our new Cocos extension and CLI commands:

scene: get_current_scene, get_scene_list, open_scene, save_scene, create_scene, save_scene_as, close_scene, get_scene_hierarchy
scene view: query_camera_info, set_camera_position, set_camera_rotation, focus_on_node
node: create_node, delete_node, get_node_info, set_node_properties, move_node, duplicate_node, get_selected_nodes, select_nodes
component: add_component, remove_component, get_component_properties, set_component_property
prefab: create_prefab, instantiate_prefab, apply_prefab, revert_prefab, unpack_prefab, get_prefab_info
project / asset: run_project, build_project, import_asset, get_assets, create_asset, copy_asset, move_asset, delete_asset, find_asset_by_name
debug: get_console_logs, clear_console, execute_script, get_performance_stats
Proposed Changes
We will create two main directories in /Users/semozz/Projects/cocos-creator-cli/cocos-creator-cli/:

extension/ (Cocos Creator Extension)

package.json (Extension manifest)
main.ts (Entry point that starts the HTTP server on load)
src/handlers/scene.ts, src/handlers/node.ts, etc. (Where we port the Editor.Message logic)
cli/ (Command Line Interface)

We can write this in Go (for a fast, single binary, exactly like unity-cli) OR Node.js/TypeScript (since the extension is also TS).
User Review Required
Architecture: Does creating this two-part structure (CLI + Cocos Extension) precisely align with what you intended by mimicking unity-cli?
CLI Language: Would you prefer the cli/ folder to be written in Go (like unity-cli) or TypeScript? If you have no preference, I will default to TypeScript for consistency with the extension.