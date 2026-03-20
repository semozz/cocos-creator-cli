#!/usr/bin/env node
import { Command } from 'commander';

const API_URL = 'http://127.0.0.1:8585/api';

async function fetchTools() {
    try {
        const response = await fetch(`${API_URL}/tools`);
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
        .version('1.0.0');

    // Default commands
    program
        .command('status')
        .description('Check Cocos Creator connection status')
        .action(async () => {
            try {
                const res = await fetch('http://127.0.0.1:8585/health');
                if (res.ok) {
                    console.log('Cocos Creator connection is active (port 8585)');
                } else {
                    console.log('Cocos Creator is running but returned error');
                }
            } catch (e) {
                console.log('Cannot connect to Cocos Creator. Is the editor open?');
            }
        });

    program
        .command('list')
        .description('List all available tools and their arguments')
        .action(async () => {
            const tools = await fetchTools();
            if (tools.length === 0) {
                console.log('No tools found or Cocos Creator is not running.');
                return;
            }
            tools.forEach((t: any) => {
                console.log(`- [${t.category}] ${t.toolName}: ${t.description}`);
            });
        });

    const tools = await fetchTools();
    
    // Group tools by category
    const categories = new Map<string, any[]>();
    for (const tool of tools) {
        if (!categories.has(tool.category)) {
            categories.set(tool.category, []);
        }
        categories.get(tool.category)!.push(tool);
    }

    // Create subcommands for each category
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
                        
                        const res = await fetch(`${API_URL}/${category}/${tool.toolName}`, {
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

    // Dynamic fallback if tool is not found in cache (e.g. editor opened AFTER cli is invoked, but wait, if it's CLI, it invokes per command)
    // Actually commander doesn't handle fallback easily with addCommand.
    // If it's a known subcommand, commander executes it. If it's unknown, it shows error.
    // But since `fetchTools()` happens at launch, it will dynamically know all commands the editor exposes!

    await program.parseAsync(process.argv);
}

main().catch(console.error);
