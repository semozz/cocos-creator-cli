import { APIServer } from './api-server';
import { readSettings } from './settings';
import { ToolManager } from './tools/tool-manager';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

let apiServer: APIServer | null = null;
let toolManager: ToolManager;
let heartbeatInterval: NodeJS.Timeout | null = null;
let currentPort = 8585;

function getCliDir() {
    return path.join(os.homedir(), '.cocos-creator-cli');
}

function getInstancesFile() {
    return path.join(getCliDir(), 'instances.json');
}

function getStatusFile(port: number) {
    return path.join(getCliDir(), 'status', `${port}.json`);
}

async function registerInstance(port: number) {
    try {
        const cliDir = getCliDir();
        await fs.ensureDir(cliDir);
        await fs.ensureDir(path.join(cliDir, 'status'));

        const instancesFile = getInstancesFile();
        let instances: Record<string, any> = {};

        if (await fs.pathExists(instancesFile)) {
            try {
                instances = await fs.readJson(instancesFile);
            } catch (e) {
                instances = {};
            }
        }

        const projectPath = Editor.Project.path || process.cwd();

        // Add or update this instance
        instances[port.toString()] = {
            port,
            projectPath,
            pid: process.pid,
            version: Editor.App.version,
            registeredAt: Date.now()
        };

        await fs.writeJson(instancesFile, instances, { spaces: 2 });
        console.log(`[Cocos CLI] Registered instance on port ${port} for project: ${projectPath}`);
    } catch (err) {
        console.error('[Cocos CLI] Failed to register instance:', err);
    }
}

async function unregisterInstance(port: number) {
    try {
        const instancesFile = getInstancesFile();
        if (await fs.pathExists(instancesFile)) {
            const instances = await fs.readJson(instancesFile);
            if (instances[port.toString()]) {
                delete instances[port.toString()];
                await fs.writeJson(instancesFile, instances, { spaces: 2 });
            }
        }

        const statusFile = getStatusFile(port);
        if (await fs.pathExists(statusFile)) {
            await fs.remove(statusFile);
        }
    } catch (err) {
        console.error('[Cocos CLI] Failed to unregister instance:', err);
    }
}

async function writeHeartbeat() {
    try {
        const statusFile = getStatusFile(currentPort);
        await fs.writeJson(statusFile, {
            status: 'ready',
            lastUpdated: Date.now()
        });
    } catch (err) {
        // Ignore heartbeat write errors to prevent console spam
    }
}

/**
 * @en Method Triggered on Extension Startup
 * @kr 확장 시작 시 호출되는 메서드
 */
export async function load() {
    console.log('[Cocos CLI] Headless extension loaded');

    try {
        toolManager = new ToolManager();

        const settings = readSettings();
        currentPort = settings.port || 8585;

        apiServer = new APIServer(settings);

        const enabledTools = toolManager.getEnabledTools();
        apiServer.updateEnabledTools(enabledTools);

        // Auto-start server immediately (headless mode)
        await apiServer.start();
        console.log(`[Cocos CLI] API Server started dynamically on port ${currentPort}`);

        await registerInstance(currentPort);

        // Write initial heartbeat and start interval
        await writeHeartbeat();
        heartbeatInterval = setInterval(writeHeartbeat, 500);

    } catch (err) {
        console.error('[Cocos CLI] Failed to startup headless server:', err);
    }
}

/**
 * @en Method triggered when uninstalling the extension
 * @kr 확장 제거 시 호출되는 메서드
 */
export async function unload() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }

    if (apiServer) {
        apiServer.stop();
        apiServer = null;
    }

    await unregisterInstance(currentPort);
    console.log('[Cocos CLI] Headless extension unloaded');
}