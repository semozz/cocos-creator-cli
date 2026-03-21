#!/usr/bin/env node
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

function getInstancesFile() {
    return path.join(os.homedir(), '.cocos-creator-cli', 'instances.json');
}

function getInstances(): Record<string, any> {
    const file = getInstancesFile();
    if (fs.existsSync(file)) {
        try {
            return JSON.parse(fs.readFileSync(file, 'utf-8'));
        } catch (e) {
            return {};
        }
    }
    return {};
}

function getTargetInstance(portOpt?: string, projectOpt?: string) {
    const instances = getInstances();
    const ports = Object.keys(instances);
    
    if (ports.length === 0) {
        return null;
    }

    if (portOpt) {
        return instances[portOpt] || null;
    }

    if (projectOpt) {
        const found = Object.values(instances).find(v => (v as any).projectPath.includes(projectOpt));
        return found || null;
    }

    // Default to the most recently registered instance
    const sorted = Object.values(instances).sort((a: any, b: any) => b.registeredAt - a.registeredAt);
    return sorted[0];
}

async function fetchTools(apiUrl: string) {
    try {
        const response = await fetch(`${apiUrl}/tools`, {
            signal: AbortSignal.timeout(2000)
        });
        if (!response.ok) return [];
        const data = await response.json();
        return data.tools || [];
    } catch (e) {
        return [];
    }
}

async function main() {
    const program = new Command();
    program
        .name('cocos-creator-cli')
        .description('Control Cocos Creator from the command line')
        .version('1.0.0')
        .option('--port <port>', 'Connect to a specific Cocos Creator port')
        .option('--project <path>', 'Connect to a specific project path');

    program.on('preAction', () => {
        // Just parse global options here if needed
    });

    const parsedOptions = program.parseOptions(process.argv);
    const globalOpts = program.opts();
    
    // We check the args manually to find the instance, before building commands
    // because commander parses after defining commands.
    let userPort, userProject;
    const args = process.argv;
    const portIdx = args.indexOf('--port');
    if (portIdx !== -1 && args[portIdx + 1]) userPort = args[portIdx + 1];
    
    const projIdx = args.indexOf('--project');
    if (projIdx !== -1 && args[projIdx + 1]) userProject = args[projIdx + 1];

    const target = getTargetInstance(userPort, userProject);

    program
        .command('status')
        .description('Check Cocos Creator connection status')
        .action(async () => {
            if (!target) {
                console.log('No active Cocos Creator instances found.');
                console.log('Ensure Cocos Creator is open and the cocos-creator-connector extension is loaded.');
                return;
            }
            try {
                const res = await fetch(`http://127.0.0.1:${target.port}/health`, {
                    signal: AbortSignal.timeout(2000)
                });
                if (res.ok) {
                    console.log(`Cocos Creator connection is active (port ${target.port})`);
                    console.log(`  Project: ${target.projectPath}`);
                    console.log(`  Version: ${target.version}`);
                    console.log(`  PID:     ${target.pid}`);
                } else {
                    console.log(`Cocos Creator is running on port ${target.port} but returned error`);
                }
            } catch (e) {
                console.log(`Cannot connect to Cocos Creator on port ${target.port}. Is the editor open?`);
            }
        });

    if (!target) {
        // Provide graceful fallback commands if no editor is found
        program
            .command('list')
            .description('List all available tools and their arguments')
            .action(() => {
                console.log('No active Cocos Creator instances found.');
            });
            
        await program.parseAsync(process.argv);
        return;
    }

    const apiUrl = `http://127.0.0.1:${target.port}/api`;

    program
        .command('list')
        .description('List all available tools and their arguments')
        .action(async () => {
            const tools = await fetchTools(apiUrl);
            if (tools.length === 0) {
                console.log('No tools found or Cocos Creator is not responding properly.');
                return;
            }
            console.log(`Connected to Cocos Creator (port ${target.port})`);
            console.log(`Project: ${target.projectPath}\n`);
            tools.forEach((t: any) => {
                console.log(`- [${t.category}] ${t.toolName}: ${t.description}`);
            });
        });

    program
        .command('exec <script>')
        .description('Execute JavaScript in Cocos Creator editor context (alias of debug execute_script)')
        .action(async (script: string) => {
            try {
                const res = await fetch(`${apiUrl}/debug/execute_script`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ script })
                });

                const result = await res.json();
                console.log(JSON.stringify(result, null, 2));

                if (!res.ok) {
                    process.exit(1);
                }
            } catch (e: any) {
                console.error(`Execution failed: ${e.message}`);
                process.exit(1);
            }
        });

    const tools = await fetchTools(apiUrl);
    
    // Group tools by category
    const categories = new Map<string, any[]>();
    for (const tool of tools) {
        if (!categories.has(tool.category)) {
            categories.set(tool.category, []);
            
            // Allow calling tool directly without category if we want, or define categories
        }
        categories.get(tool.category)!.push(tool);
    }

    // Build the dynamic CLI tree
    // We register top-level tools instead of requiring category prefix, 
    // to match unity-cli which does `unity-cli <tool_name>`.
    // Wait, the original code had: `cocos-creator-cli <category> <tool>`.
    // Let's keep the original hierarchy to not break backwards compatibility
    // but the user said "make it exactly like unity-cli".
    // "Call a custom tool directly by name: unity-cli my_custom_tool"
    // So let's register the tool name directly at the root, AND alias under category if needed.
    // For simplicity, we just add the categories as subcommands like before but also add direct hooks.
    // Let's just stick to the original `<category> <tool>` for now as it's cleaner to migrate incrementally.

    for (const [category, categoryTools] of categories.entries()) {
        const categoryCmd = new Command(category).description(`${category} tools`);
        
        for (const tool of categoryTools) {
            categoryCmd
                .command(tool.toolName)
                .description(tool.description)
                .option('-p, --params <json>', 'JSON string of parameters', '{}')
                .action(async (options) => {
                    try {
                        let parsedParams = {};
                        if (options.params) {
                            try {
                                parsedParams = JSON.parse(options.params);
                            } catch (e: any) {
                                console.error(`Error parsing JSON parameters: ${e.message}`);
                                process.exit(1);
                            }
                        }
                        
                        const res = await fetch(`${apiUrl}/${category}/${tool.toolName}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(parsedParams)
                        });
                        
                        const result = await res.json();
                        console.log(JSON.stringify(result, null, 2));
                        
                        if (!res.ok) {
                            process.exit(1);
                        }
                    } catch (e: any) {
                        console.error(`Execution failed: ${e.message}`);
                        process.exit(1);
                    }
                });
        }
        
        program.addCommand(categoryCmd);
    }

    await program.parseAsync(process.argv);
}

main().catch(console.error);
