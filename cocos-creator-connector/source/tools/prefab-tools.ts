import { ToolDefinition, ToolResponse, ToolExecutor, PrefabInfo } from '../types';

export class PrefabTools implements ToolExecutor {
    getTools(): ToolDefinition[] {
        return [
            {
                name: 'get_prefab_list',
                description: 'Get all prefabs in the project',
                inputSchema: {
                    type: 'object',
                    properties: {
                        folder: {
                            type: 'string',
                            description: 'Folder path to search (optional)',
                            default: 'db://assets'
                        }
                    }
                }
            },
            {
                name: 'load_prefab',
                description: 'Load a prefab by path',
                inputSchema: {
                    type: 'object',
                    properties: {
                        prefabPath: {
                            type: 'string',
                            description: 'Prefab asset path'
                        }
                    },
                    required: ['prefabPath']
                }
            },
            {
                name: 'instantiate_prefab',
                description: 'Instantiate a prefab in the scene',
                inputSchema: {
                    type: 'object',
                    properties: {
                        prefabPath: {
                            type: 'string',
                            description: 'Prefab asset path'
                        },
                        parentUuid: {
                            type: 'string',
                            description: 'Parent node UUID (optional)'
                        },
                        position: {
                            type: 'object',
                            description: 'Initial position',
                            properties: {
                                x: { type: 'number' },
                                y: { type: 'number' },
                                z: { type: 'number' }
                            }
                        }
                    },
                    required: ['prefabPath']
                }
            },
            {
                name: 'create_prefab',
                description: 'Create a prefab from a node with all children and components',
                inputSchema: {
                    type: 'object',
                    properties: {
                        nodeUuid: {
                            type: 'string',
                            description: 'Source node UUID'
                        },
                        savePath: {
                            type: 'string',
                            description: 'Path to save the prefab (e.g., db://assets/prefabs/MyPrefab.prefab)'
                        },
                        prefabName: {
                            type: 'string',
                            description: 'Prefab name'
                        }
                    },
                    required: ['nodeUuid', 'savePath', 'prefabName']
                }
            },
            {
                name: 'update_prefab',
                description: 'Update an existing prefab',
                inputSchema: {
                    type: 'object',
                    properties: {
                        prefabPath: {
                            type: 'string',
                            description: 'Prefab asset path'
                        },
                        nodeUuid: {
                            type: 'string',
                            description: 'Node UUID with changes'
                        }
                    },
                    required: ['prefabPath', 'nodeUuid']
                }
            },
            {
                name: 'revert_prefab',
                description: 'Revert prefab instance to original',
                inputSchema: {
                    type: 'object',
                    properties: {
                        nodeUuid: {
                            type: 'string',
                            description: 'Prefab instance node UUID'
                        }
                    },
                    required: ['nodeUuid']
                }
            },
            {
                name: 'get_prefab_info',
                description: 'Get detailed prefab information',
                inputSchema: {
                    type: 'object',
                    properties: {
                        prefabPath: {
                            type: 'string',
                            description: 'Prefab asset path'
                        }
                    },
                    required: ['prefabPath']
                }
            },
            {
                name: 'validate_prefab',
                description: 'Validate a prefab file format',
                inputSchema: {
                    type: 'object',
                    properties: {
                        prefabPath: {
                            type: 'string',
                            description: 'Prefab asset path'
                        }
                    },
                    required: ['prefabPath']
                }
            },
            {
                name: 'duplicate_prefab',
                description: 'Duplicate an existing prefab',
                inputSchema: {
                    type: 'object',
                    properties: {
                        sourcePrefabPath: {
                            type: 'string',
                            description: 'Source prefab path'
                        },
                        targetPrefabPath: {
                            type: 'string',
                            description: 'Target prefab path'
                        },
                        newPrefabName: {
                            type: 'string',
                            description: 'New prefab name'
                        }
                    },
                    required: ['sourcePrefabPath', 'targetPrefabPath']
                }
            },
            {
                name: 'restore_prefab_node',
                description: 'Restore prefab node using prefab asset (built-in undo record)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        nodeUuid: {
                            type: 'string',
                            description: 'Prefab instance node UUID'
                        },
                        assetUuid: {
                            type: 'string',
                            description: 'Prefab asset UUID'
                        }
                    },
                    required: ['nodeUuid', 'assetUuid']
                }
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'get_prefab_list':
                return await this.getPrefabList(args.folder);
            case 'load_prefab':
                return await this.loadPrefab(args.prefabPath);
            case 'instantiate_prefab':
                return await this.instantiatePrefab(args);
            case 'create_prefab':
                return await this.createPrefab(args);
            case 'update_prefab':
                return await this.updatePrefab(args.prefabPath, args.nodeUuid);
            case 'revert_prefab':
                return await this.revertPrefab(args.nodeUuid);
            case 'get_prefab_info':
                return await this.getPrefabInfo(args.prefabPath);
            case 'validate_prefab':
                return await this.validatePrefab(args.prefabPath);
            case 'duplicate_prefab':
                return await this.duplicatePrefab(args);
            case 'restore_prefab_node':
                return await this.restorePrefabNode(args.nodeUuid, args.assetUuid);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    private async getPrefabList(folder: string = 'db://assets'): Promise<ToolResponse> {
        return new Promise((resolve) => {
            const pattern = folder.endsWith('/') ? 
                `${folder}**/*.prefab` : `${folder}/**/*.prefab`;
            
            Editor.Message.request('asset-db', 'query-assets', {
                pattern: pattern
            }).then((results: any[]) => {
                const prefabs: PrefabInfo[] = results.map(asset => ({
                    name: asset.name,
                    path: asset.url,
                    uuid: asset.uuid,
                    folder: asset.url.substring(0, asset.url.lastIndexOf('/'))
                }));
                resolve({ success: true, data: prefabs });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async loadPrefab(prefabPath: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'query-asset-info', prefabPath).then((assetInfo: any) => {
                if (!assetInfo) {
                    throw new Error('Prefab not found');
                }
                
                return Editor.Message.request('scene', 'load-asset', {
                    uuid: assetInfo.uuid
                });
            }).then((prefabData: any) => {
                resolve({
                    success: true,
                    data: {
                        uuid: prefabData.uuid,
                        name: prefabData.name,
                        message: 'Prefab loaded successfully'
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async instantiatePrefab(args: any): Promise<ToolResponse> {
        return new Promise(async (resolve) => {
            try {
                // 가져오기프리팹리소스
                const assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', args.prefabPath);
                if (!assetInfo) {
                    throw new Error('预制体未找到');
                }

                // create-node API 프리팹리소스
                const createNodeOptions: any = {
                    assetUuid: assetInfo.uuid
                };

                // 부모 노드 설정
                if (args.parentUuid) {
                    createNodeOptions.parent = args.parentUuid;
                }

                // 설정노드
                if (args.name) {
                    createNodeOptions.name = args.name;
                } else if (assetInfo.name) {
                    createNodeOptions.name = assetInfo.name;
                }

                // 설정 속성（ ）
                if (args.position) {
                    createNodeOptions.dump = {
                        position: {
                            value: args.position
                        }
                    };
                }

                // 노드 생성
                const nodeUuid = await Editor.Message.request('scene', 'create-node', createNodeOptions);
                const uuid = Array.isArray(nodeUuid) ? nodeUuid[0] : nodeUuid;

                // : create-node API 프리팹리소스생성 프리팹
                console.log('预制体节点创建成功:', {
                    nodeUuid: uuid,
                    prefabUuid: assetInfo.uuid,
                    prefabPath: args.prefabPath
                });
                
                resolve({
                    success: true,
                    data: {
                        nodeUuid: uuid,
                        prefabPath: args.prefabPath,
                        parentUuid: args.parentUuid,
                        position: args.position,
                        message: '预制体实例化成功，已建立预制体关联'
                    }
                });
            } catch (err: any) {
                resolve({ 
                    success: false, 
                    error: `预制体实例化失败: ${err.message}`,
                    instruction: '请检查预制体路径是否正确，确保预制体文件格式正确'
                });
            }
        });
    }

    /**
     * 노드와 프리팹의 연관 관계 설정
     * 이 메서드는 필요한 PrefabInfo 및 PrefabInstance 구조를 생성합니다
     */
    private async establishPrefabConnection(nodeUuid: string, prefabUuid: string, prefabPath: string): Promise<void> {
        try {
            // 프리팹 파일을 읽어 루트 노드 fileId 획득
            const prefabContent = await this.readPrefabFile(prefabPath);
            if (!prefabContent || !prefabContent.data || !prefabContent.data.length) {
                throw new Error('无法读取预制体文件内容');
            }

            // 프리팹 노드 fileId ( , 1)
            const rootNode = prefabContent.data.find((item: any) => item.__type === 'cc.Node' && item._parent === null);
            if (!rootNode || !rootNode._prefab) {
                throw new Error('无法找到预制体根节点或其预制体信息');
            }

            // 루트 노드의 PrefabInfo 획득
            const rootPrefabInfo = prefabContent.data[rootNode._prefab.__id__];
            if (!rootPrefabInfo || rootPrefabInfo.__type !== 'cc.PrefabInfo') {
                throw new Error('无法找到预制体根节点的PrefabInfo');
            }

            const rootFileId = rootPrefabInfo.fileId;

            // scene API 프리팹
            const prefabConnectionData = {
                node: nodeUuid,
                prefab: prefabUuid,
                fileId: rootFileId
            };

            // 시도 API 프리팹
            const connectionMethods = [
                () => Editor.Message.request('scene', 'connect-prefab-instance', prefabConnectionData),
                () => Editor.Message.request('scene', 'set-prefab-connection', prefabConnectionData),
                () => Editor.Message.request('scene', 'apply-prefab-link', prefabConnectionData)
            ];

            let connected = false;
            for (const method of connectionMethods) {
                try {
                    await method();
                    connected = true;
                    break;
                } catch (error) {
                    console.warn('预制体连接方法失败，尝试下一个方法:', error);
                }
            }

            if (!connected) {
                // 만약 API 실패, 시도수동 씬데이터
                console.warn('所有预制体连接API都失败，尝试手动建立连接');
                await this.manuallyEstablishPrefabConnection(nodeUuid, prefabUuid, rootFileId);
            }

        } catch (error) {
            console.error('建立预制体连接失败:', error);
            throw error;
        }
    }

    /**
     * 프리팹 연결을 수동으로 구성(API 방식 실패 시 대안)
     */
    private async manuallyEstablishPrefabConnection(nodeUuid: string, prefabUuid: string, rootFileId: string): Promise<void> {
        try {
            // 시도 dump API 노드 _prefab속성
            const prefabConnectionData = {
                [nodeUuid]: {
                    '_prefab': {
                        '__uuid__': prefabUuid,
                        '__expectedType__': 'cc.Prefab',
                        'fileId': rootFileId
                    }
                }
            };

            await Editor.Message.request('scene', 'set-property', {
                uuid: nodeUuid,
                path: '_prefab',
                dump: {
                    value: {
                        '__uuid__': prefabUuid,
                        '__expectedType__': 'cc.Prefab'
                    }
                }
            });

        } catch (error) {
            console.error('手动建立预制体连接也失败:', error);
            // 오류, 노드생성 성공
        }
    }

    /**
     * 프리팹 파일 내용을 읽기
     */
    private async readPrefabFile(prefabPath: string): Promise<any> {
        try {
            // 시도 asset-db API
            let assetContent: any;
            try {
                assetContent = await Editor.Message.request('asset-db', 'query-asset-info', prefabPath);
                if (assetContent && assetContent.source) {
                    // 만약 source경로, 직접
                    const fs = require('fs');
                    const path = require('path');
                    const fullPath = path.resolve(assetContent.source);
                    const fileContent = fs.readFileSync(fullPath, 'utf8');
                    return JSON.parse(fileContent);
                }
            } catch (error) {
                console.warn('使用asset-db读取失败，尝试其他方法:', error);
            }

            // : 변환db://경로 경로
            const fsPath = prefabPath.replace('db://assets/', 'assets/').replace('db://assets', 'assets');
            const fs = require('fs');
            const path = require('path');
            
            // 시도 경로
            const possiblePaths = [
                path.resolve(process.cwd(), '../../NewProject_3', fsPath),
                path.resolve('/Users/lizhiyong/NewProject_3', fsPath),
                path.resolve(fsPath),
                // 만약 , 시도직접경로
                path.resolve('/Users/lizhiyong/NewProject_3/assets', path.basename(fsPath))
            ];

            console.log('尝试读取预制体文件，路径转换:', {
                originalPath: prefabPath,
                fsPath: fsPath,
                possiblePaths: possiblePaths
            });

            for (const fullPath of possiblePaths) {
                try {
                    console.log(`检查路径: ${fullPath}`);
                    if (fs.existsSync(fullPath)) {
                        console.log(`找到文件: ${fullPath}`);
                        const fileContent = fs.readFileSync(fullPath, 'utf8');
                        const parsed = JSON.parse(fileContent);
                        console.log('文件解析成功，数据结构:', {
                            hasData: !!parsed.data,
                            dataLength: parsed.data ? parsed.data.length : 0
                        });
                        return parsed;
                    } else {
                        console.log(`文件不存在: ${fullPath}`);
                    }
                } catch (readError) {
                    console.warn(`读取文件失败 ${fullPath}:`, readError);
                }
            }

            throw new Error('无法找到或读取预制体文件');
        } catch (error) {
            console.error('读取预制体文件失败:', error);
            throw error;
        }
    }

    private async tryCreateNodeWithPrefab(args: any): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'query-asset-info', args.prefabPath).then((assetInfo: any) => {
                if (!assetInfo) {
                    throw new Error('预制体未找到');
                }

                // 2: create-node 프리팹리소스
                const createNodeOptions: any = {
                    assetUuid: assetInfo.uuid
                };

                // 부모 노드 설정
                if (args.parentUuid) {
                    createNodeOptions.parent = args.parentUuid;
                }

                return Editor.Message.request('scene', 'create-node', createNodeOptions);
            }).then((nodeUuid: string | string[]) => {
                const uuid = Array.isArray(nodeUuid) ? nodeUuid[0] : nodeUuid;
                
                // 만약 , 설정노드
                if (args.position && uuid) {
                    Editor.Message.request('scene', 'set-property', {
                        uuid: uuid,
                        path: 'position',
                        dump: { value: args.position }
                    }).then(() => {
                        resolve({
                            success: true,
                            data: {
                                nodeUuid: uuid,
                                prefabPath: args.prefabPath,
                                position: args.position,
                                message: '预制体实例化成功（备用方法）并设置了位置'
                            }
                        });
                    }).catch(() => {
                        resolve({
                            success: true,
                            data: {
                                nodeUuid: uuid,
                                prefabPath: args.prefabPath,
                                message: '预制体实例化成功（备用方法）但位置设置失败'
                            }
                        });
                    });
                } else {
                    resolve({
                        success: true,
                        data: {
                            nodeUuid: uuid,
                            prefabPath: args.prefabPath,
                            message: '预制体实例化成功（备用方法）'
                        }
                    });
                }
            }).catch((err: Error) => {
                resolve({
                    success: false,
                    error: `备用预制体实例化方法也失败: ${err.message}`
                });
            });
        });
    }

    private async tryAlternativeInstantiateMethods(args: any): Promise<ToolResponse> {
        return new Promise(async (resolve) => {
            try {
                // 1: 시도 create-node 설정프리팹
                const assetInfo = await this.getAssetInfo(args.prefabPath);
                if (!assetInfo) {
                    resolve({ success: false, error: '无法获取预制体信息' });
                    return;
                }

                // 생성 노드
                const createResult = await this.createNode(args.parentUuid, args.position);
                if (!createResult.success) {
                    resolve(createResult);
                    return;
                }

                // 시도 프리팹 노드
                const applyResult = await this.applyPrefabToNode(createResult.data.nodeUuid, assetInfo.uuid);
                if (applyResult.success) {
                    resolve({
                        success: true,
                        data: {
                            nodeUuid: createResult.data.nodeUuid,
                            name: createResult.data.name,
                            message: '预制体实例化成功（使用备选方法）'
                        }
                    });
                } else {
                    resolve({
                        success: false,
                        error: '无法将预制体应用到节点',
                        data: {
                            nodeUuid: createResult.data.nodeUuid,
                            message: '已创建节点，但无法应用预制体数据'
                        }
                    });
                }

            } catch (error) {
                resolve({ success: false, error: `备选实例化方法失败: ${error}` });
            }
        });
    }

    private async getAssetInfo(prefabPath: string): Promise<any> {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'query-asset-info', prefabPath).then((assetInfo: any) => {
                resolve(assetInfo);
            }).catch(() => {
                resolve(null);
            });
        });
    }

    private async createNode(parentUuid?: string, position?: any): Promise<ToolResponse> {
        return new Promise((resolve) => {
            const createNodeOptions: any = {
                name: 'PrefabInstance'
            };

            // 부모 노드 설정
            if (parentUuid) {
                createNodeOptions.parent = parentUuid;
            }

            // 위치 설정
            if (position) {
                createNodeOptions.dump = {
                    position: position
                };
            }

            Editor.Message.request('scene', 'create-node', createNodeOptions).then((nodeUuid: string | string[]) => {
                const uuid = Array.isArray(nodeUuid) ? nodeUuid[0] : nodeUuid;
                resolve({
                    success: true,
                    data: {
                        nodeUuid: uuid,
                        name: 'PrefabInstance'
                    }
                });
            }).catch((error: any) => {
                resolve({ success: false, error: error.message || '创建节点失败' });
            });
        });
    }

    private async applyPrefabToNode(nodeUuid: string, prefabUuid: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            // 시도 프리팹데이터
            const methods = [
                () => Editor.Message.request('scene', 'apply-prefab', { node: nodeUuid, prefab: prefabUuid }),
                () => Editor.Message.request('scene', 'set-prefab', { node: nodeUuid, prefab: prefabUuid }),
                () => Editor.Message.request('scene', 'load-prefab-to-node', { node: nodeUuid, prefab: prefabUuid })
            ];

            const tryMethod = (index: number) => {
                if (index >= methods.length) {
                    resolve({ success: false, error: '无法应用预制体数据' });
                    return;
                }

                methods[index]().then(() => {
                    resolve({ success: true });
                }).catch(() => {
                    tryMethod(index + 1);
                });
            };

            tryMethod(0);
        });
    }

    /**
     * asset-db API로 프리팹을 생성하는 새 방식
     * 엔진의 리소스 관리 시스템을 깊게 통합해 완전한 프리팹 생성 흐름을 구현
     */
    private async createPrefabWithAssetDB(nodeUuid: string, savePath: string, prefabName: string, includeChildren: boolean, includeComponents: boolean): Promise<ToolResponse> {
        return new Promise(async (resolve) => {
            try {
                console.log('=== 使用 Asset-DB API 创建预制体 ===');
                console.log(`节点UUID: ${nodeUuid}`);
                console.log(`保存路径: ${savePath}`);
                console.log(`预制体名称: ${prefabName}`);

                // : 가져오기노드데이터（ 속성）
                const nodeData = await this.getNodeData(nodeUuid);
                if (!nodeData) {
                    resolve({
                        success: false,
                        error: '无法获取节点数据'
                    });
                    return;
                }

                console.log('获取到节点数据，子节点数量:', nodeData.children ? nodeData.children.length : 0);

                // : 생성리소스 가져오기 UUID
                console.log('创建预制体资源文件...');
                const tempPrefabContent = JSON.stringify([{"__type__": "cc.Prefab", "_name": prefabName}], null, 2);
                const createResult = await this.createAssetWithAssetDB(savePath, tempPrefabContent);
                if (!createResult.success) {
                    resolve(createResult);
                    return;
                }

                // 가져오기 UUID
                const actualPrefabUuid = createResult.data?.uuid;
                if (!actualPrefabUuid) {
                    resolve({
                        success: false,
                        error: '无法获取引擎分配的预制体UUID'
                    });
                    return;
                }
                console.log('引擎分配的UUID:', actualPrefabUuid);

                // : UUID 프리팹
                const prefabContent = await this.createStandardPrefabContent(nodeData, prefabName, actualPrefabUuid, includeChildren, includeComponents);
                const prefabContentString = JSON.stringify(prefabContent, null, 2);

                // : 프리팹
                console.log('更新预制体文件内容...');
                const updateResult = await this.updateAssetWithAssetDB(savePath, prefabContentString);
                
                // : 생성 meta （ UUID）
                console.log('创建预制体meta文件...');
                const metaContent = this.createStandardMetaContent(prefabName, actualPrefabUuid);
                const metaResult = await this.createMetaWithAssetDB(savePath, metaContent);
                
                // : 리소스 참조
                console.log('重新导入预制体资源...');
                const reimportResult = await this.reimportAssetWithAssetDB(savePath);

                // : 원본 노드를 프리팹 인스턴스로 변환 시도
                console.log('尝试将原始节点转换为预制体实例...');
                const convertResult = await this.convertNodeToPrefabInstance(nodeUuid, actualPrefabUuid, savePath);
                
                resolve({
                    success: true,
                    data: {
                        prefabUuid: actualPrefabUuid,
                        prefabPath: savePath,
                        nodeUuid: nodeUuid,
                        prefabName: prefabName,
                        convertedToPrefabInstance: convertResult.success,
                        createAssetResult: createResult,
                        updateResult: updateResult,
                        metaResult: metaResult,
                        reimportResult: reimportResult,
                        convertResult: convertResult,
                        message: convertResult.success ? '预制体创建并成功转换原始节点' : '预制体创建成功，但节点转换失败'
                    }
                });

            } catch (error) {
                console.error('创建预制体时发生错误:', error);
                resolve({
                    success: false,
                    error: `创建预制体失败: ${error}`
                });
            }
        });
    }

    private async createPrefab(args: any): Promise<ToolResponse> {
        return new Promise(async (resolve) => {
            try {
                // 지원 prefabPath savePath
                const pathParam = args.prefabPath || args.savePath;
                if (!pathParam) {
                    resolve({
                        success: false,
                        error: '缺少预制体路径参数。请提供 prefabPath 或 savePath。'
                    });
                    return;
                }

                const prefabName = args.prefabName || 'NewPrefab';
                const fullPath = pathParam.endsWith('.prefab') ? 
                    pathParam : `${pathParam}/${prefabName}.prefab`;

                const includeChildren = args.includeChildren !== false; // 기본 true
                const includeComponents = args.includeComponents !== false; // 기본 true

                // 우선 asset-db 생성프리팹
                console.log('使用新的 asset-db 方法创建预制体...');
                const assetDbResult = await this.createPrefabWithAssetDB(
                    args.nodeUuid,
                    fullPath,
                    prefabName,
                    includeChildren,
                    includeComponents
                );

                if (assetDbResult.success) {
                    resolve(assetDbResult);
                    return;
                }

                // 만약 asset-db 실패, 시도 Cocos Creator 프리팹생성API
                console.log('asset-db 方法失败，尝试原生API...');
                const nativeResult = await this.createPrefabNative(args.nodeUuid, fullPath);
                if (nativeResult.success) {
                    resolve(nativeResult);
                    return;
                }

                // 만약 API실패
                console.log('原生API失败，使用自定义实现...');
                const customResult = await this.createPrefabCustom(args.nodeUuid, fullPath, prefabName);
                resolve(customResult);

            } catch (error) {
                resolve({
                    success: false,
                    error: `创建预制体时发生错误: ${error}`
                });
            }
        });
    }

    private async createPrefabNative(nodeUuid: string, prefabPath: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            // API , 직접 프리팹생성API
            // 프리팹 생성은 에디터에서 수동으로 완료해야 함
            resolve({
                success: false,
                error: '原生预制体创建API不存在',
                instruction: '根据Cocos Creator官方API文档，预制体创建需要手动操作：\n1. 在场景中选择节点\n2. 将节点拖拽到资源管理器中\n3. 或右键节点选择"生成预制体"'
            });
        });
    }

    private async createPrefabCustom(nodeUuid: string, prefabPath: string, prefabName: string): Promise<ToolResponse> {
        return new Promise(async (resolve) => {
            try {
                // 1. 가져오기 노드 데이터
                const nodeData = await this.getNodeData(nodeUuid);
                if (!nodeData) {
                    resolve({
                        success: false,
                        error: `无法找到节点: ${nodeUuid}`
                    });
                    return;
                }

                // 2. 프리팹UUID
                const prefabUuid = this.generateUUID();

                // 3. 생성프리팹데이터구조
                const prefabData = this.createPrefabData(nodeData, prefabName, prefabUuid);

                // 4. 형식생성프리팹데이터구조
                console.log('=== 开始创建预制体 ===');
                console.log('节点名称:', nodeData.name?.value || '未知');
                console.log('节点UUID:', nodeData.uuid?.value || '未知');
                console.log('预制体保存路径:', prefabPath);
                console.log(`开始创建预制体，节点数据:`, nodeData);
                const prefabJsonData = await this.createStandardPrefabContent(nodeData, prefabName, prefabUuid, true, true);

                // 5. 생성표준meta 데이터
                const standardMetaData = this.createStandardMetaData(prefabName, prefabUuid);

                // 6. 저장프리팹 meta
                const saveResult = await this.savePrefabWithMeta(prefabPath, prefabJsonData, standardMetaData);

                if (saveResult.success) {
                    // 저장성공 , 노드변환 프리팹
                    const convertResult = await this.convertNodeToPrefabInstance(nodeUuid, prefabPath, prefabUuid);
                    
                    resolve({
                        success: true,
                        data: {
                            prefabUuid: prefabUuid,
                            prefabPath: prefabPath,
                            nodeUuid: nodeUuid,
                            prefabName: prefabName,
                            convertedToPrefabInstance: convertResult.success,
                            message: convertResult.success ? 
                                '自定义预制体创建成功，原始节点已转换为预制体实例' : 
                                '预制体创建成功，但节点转换失败'
                        }
                    });
                } else {
                    resolve({
                        success: false,
                        error: saveResult.error || '保存预制体文件失败'
                    });
                }

            } catch (error) {
                resolve({
                    success: false,
                    error: `创建预制体时发生错误: ${error}`
                });
            }
        });
    }

    private async getNodeData(nodeUuid: string): Promise<any> {
        return new Promise(async (resolve) => {
            try {
                // 먼저가져오기 노드
                const nodeInfo = await Editor.Message.request('scene', 'query-node', nodeUuid);
                if (!nodeInfo) {
                    resolve(null);
                    return;
                }

                console.log(`获取节点 ${nodeUuid} 的基本信息成功`);
                
                // query-node-tree가져오기 노드 구조
                const nodeTree = await this.getNodeWithChildren(nodeUuid);
                if (nodeTree) {
                    console.log(`获取节点 ${nodeUuid} 的完整树结构成功`);
                    resolve(nodeTree);
                } else {
                    console.log(`使用基本节点信息`);
                    resolve(nodeInfo);
                }
            } catch (error) {
                console.warn(`获取节点数据失败 ${nodeUuid}:`, error);
                resolve(null);
            }
        });
    }

    // query-node-tree로 자식 포함 완전 노드 구조 획득
    private async getNodeWithChildren(nodeUuid: string): Promise<any> {
        try {
            // 전체 씬 트리 획득
            const tree = await Editor.Message.request('scene', 'query-node-tree');
            if (!tree) {
                return null;
            }

            // 노드
            const targetNode = this.findNodeInTree(tree, nodeUuid);
            if (targetNode) {
                console.log(`在场景树中找到节点 ${nodeUuid}，子节点数量: ${targetNode.children ? targetNode.children.length : 0}`);
                
                // 노드 , 가져오기 노드 컴포넌트
                const enhancedTree = await this.enhanceTreeWithMCPComponents(targetNode);
                return enhancedTree;
            }

            return null;
        } catch (error) {
            console.warn(`获取节点树结构失败 ${nodeUuid}:`, error);
            return null;
        }
    }

    // 노드 재귀 UUID 노드
    private findNodeInTree(node: any, targetUuid: string): any {
        if (!node) return null;
        
        // 현재 노드 확인
        if (node.uuid === targetUuid || node.value?.uuid === targetUuid) {
            return node;
        }

        // 자식 노드 재귀 확인
        if (node.children && Array.isArray(node.children)) {
            for (const child of node.children) {
                const found = this.findNodeInTree(child, targetUuid);
                if (found) {
                    return found;
                }
            }
        }

        return null;
    }

    /**
     * MCP 인터페이스로 노드 트리를 강화해 정확한 컴포넌트 정보 획득
     */
    private async enhanceTreeWithMCPComponents(node: any): Promise<any> {
        if (!node || !node.uuid) {
            return node;
        }

        try {
            // MCP인터페이스가져오기노드 컴포넌트
            const response = await fetch('http://localhost:8585/mcp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "jsonrpc": "2.0",
                    "method": "tools/call",
                    "params": {
                        "name": "component_get_components",
                        "arguments": {
                            "nodeUuid": node.uuid
                        }
                    },
                    "id": Date.now()
                })
            });
            
            const mcpResult = await response.json();
            if (mcpResult.result?.content?.[0]?.text) {
                const componentData = JSON.parse(mcpResult.result.content[0].text);
                if (componentData.success && componentData.data.components) {
                    // 노드 컴포넌트 MCP 데이터
                    node.components = componentData.data.components;
                    console.log(`节点 ${node.uuid} 获取到 ${componentData.data.components.length} 个组件，包含脚本组件的正确类型`);
                }
            }
        } catch (error) {
            console.warn(`获取节点 ${node.uuid} 的MCP组件信息失败:`, error);
        }

        // 자식 노드 재귀 처리
        if (node.children && Array.isArray(node.children)) {
            for (let i = 0; i < node.children.length; i++) {
                node.children[i] = await this.enhanceTreeWithMCPComponents(node.children[i]);
            }
        }

        return node;
    }

    private async buildBasicNodeInfo(nodeUuid: string): Promise<any> {
        return new Promise((resolve) => {
            // 빌드 노드
            Editor.Message.request('scene', 'query-node', nodeUuid).then((nodeInfo: any) => {
                if (!nodeInfo) {
                    resolve(null);
                    return;
                }

                // : 노드 , 가져오기 노드 컴포넌트
                // 프리팹처리
                const basicInfo = {
                    ...nodeInfo,
                    children: [],
                    components: []
                };
                resolve(basicInfo);
            }).catch(() => {
                resolve(null);
            });
        });
    }

    // 노드 데이터 유효성 검증
    private isValidNodeData(nodeData: any): boolean {
        if (!nodeData) return false;
        if (typeof nodeData !== 'object') return false;
        
        // 기본 속성 확인 - query-node-tree 데이터 형식에 맞춤
        return nodeData.hasOwnProperty('uuid') || 
               nodeData.hasOwnProperty('name') || 
               nodeData.hasOwnProperty('__type__') ||
               (nodeData.value && (
                   nodeData.value.hasOwnProperty('uuid') ||
                   nodeData.value.hasOwnProperty('name') ||
                   nodeData.value.hasOwnProperty('__type__')
               ));
    }

    // 자식 노드 UUID 추출의 통합 방식
    private extractChildUuid(childRef: any): string | null {
        if (!childRef) return null;
        
        // 방법1: 직접 문자열
        if (typeof childRef === 'string') {
            return childRef;
        }
        
        // 방법2: value 속성에 문자열 포함
        if (childRef.value && typeof childRef.value === 'string') {
            return childRef.value;
        }
        
        // 방법3: value.uuid 속성
        if (childRef.value && childRef.value.uuid) {
            return childRef.value.uuid;
        }
        
        // 방법4: 직접 uuid 속성
        if (childRef.uuid) {
            return childRef.uuid;
        }
        
        // 방법5: __id__ 참조 - 이 경우 특별 처리 필요
        if (childRef.__id__ !== undefined) {
            console.log(`发现__id__引用: ${childRef.__id__}，可能需要从数据结构中查找`);
            return null; // null, 참조
        }
        
        console.warn('无法提取子节点UUID:', JSON.stringify(childRef));
        return null;
    }

    // 처리 대상 자식 노드 데이터 획득
    private getChildrenToProcess(nodeData: any): any[] {
        const children: any[] = [];
        
        // 방법1: children 배열에서 직접 획득(query-node-tree 반환 데이터)
        if (nodeData.children && Array.isArray(nodeData.children)) {
            console.log(`从children数组获取子节点，数量: ${nodeData.children.length}`);
            for (const child of nodeData.children) {
                // query-node-tree 노드 데이터구조
                if (this.isValidNodeData(child)) {
                    children.push(child);
                    console.log(`添加子节点: ${child.name || child.value?.name || '未知'}`);
                } else {
                    console.log('子节点数据无效:', JSON.stringify(child, null, 2));
                }
            }
        } else {
            console.log('节点没有子节点或children数组为空');
        }
        
        return children;
    }

    private generateUUID(): string {
        // Cocos Creator 형식에 맞는 UUID 생성
        const chars = '0123456789abcdef';
        let uuid = '';
        for (let i = 0; i < 32; i++) {
            if (i === 8 || i === 12 || i === 16 || i === 20) {
                uuid += '-';
            }
            uuid += chars[Math.floor(Math.random() * chars.length)];
        }
        return uuid;
    }

    private createPrefabData(nodeData: any, prefabName: string, prefabUuid: string): any[] {
        // 표준 프리팹 데이터 구조 생성
        const prefabAsset = {
            "__type__": "cc.Prefab",
            "_name": prefabName,
            "_objFlags": 0,
            "__editorExtras__": {},
            "_native": "",
            "data": {
                "__id__": 1
            },
            "optimizationPolicy": 0,
            "persistent": false
        };

        // 노드 데이터를 처리해 프리팹 형식 준수 보장
        const processedNodeData = this.processNodeForPrefab(nodeData, prefabUuid);

        return [prefabAsset, ...processedNodeData];
    }

    private processNodeForPrefab(nodeData: any, prefabUuid: string): any[] {
        // 프리팹 형식에 맞게 노드 데이터 처리
        const processedData: any[] = [];
        let idCounter = 1;

        // 노드와 컴포넌트를 재귀 처리
        const processNode = (node: any, parentId: number = 0): number => {
            const nodeId = idCounter++;
            
            // 노드 객체 생성
            const processedNode = {
                "__type__": "cc.Node",
                "_name": node.name || "Node",
                "_objFlags": 0,
                "__editorExtras__": {},
                "_parent": parentId > 0 ? { "__id__": parentId } : null,
                "_children": node.children ? node.children.map(() => ({ "__id__": idCounter++ })) : [],
                "_active": node.active !== false,
                "_components": node.components ? node.components.map(() => ({ "__id__": idCounter++ })) : [],
                "_prefab": {
                    "__id__": idCounter++
                },
                "_lpos": {
                    "__type__": "cc.Vec3",
                    "x": 0,
                    "y": 0,
                    "z": 0
                },
                "_lrot": {
                    "__type__": "cc.Quat",
                    "x": 0,
                    "y": 0,
                    "z": 0,
                    "w": 1
                },
                "_lscale": {
                    "__type__": "cc.Vec3",
                    "x": 1,
                    "y": 1,
                    "z": 1
                },
                "_mobility": 0,
                "_layer": 1073741824,
                "_euler": {
                    "__type__": "cc.Vec3",
                    "x": 0,
                    "y": 0,
                    "z": 0
                },
                "_id": ""
            };

            processedData.push(processedNode);

            // 처리컴포넌트
            if (node.components) {
                node.components.forEach((component: any) => {
                    const componentId = idCounter++;
                    const processedComponents = this.processComponentForPrefab(component, componentId);
                    processedData.push(...processedComponents);
                });
            }

            // 처리 노드
            if (node.children) {
                node.children.forEach((child: any) => {
                    processNode(child, nodeId);
                });
            }

            return nodeId;
        };

        processNode(nodeData);
        return processedData;
    }

    private processComponentForPrefab(component: any, componentId: number): any[] {
        // 프리팹 형식에 맞게 컴포넌트 데이터 처리
        const processedComponent = {
            "__type__": component.type || "cc.Component",
            "_name": "",
            "_objFlags": 0,
            "__editorExtras__": {},
            "node": {
                "__id__": componentId - 1
            },
            "_enabled": component.enabled !== false,
            "__prefab": {
                "__id__": componentId + 1
            },
            ...component.properties
        };

        // 컴포넌트 전용 프리팹 정보 추가
        const compPrefabInfo = {
            "__type__": "cc.CompPrefabInfo",
            "fileId": this.generateFileId()
        };

        return [processedComponent, compPrefabInfo];
    }

    private generateFileId(): string {
        // 파일 ID 생성(단순 버전)
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/';
        let fileId = '';
        for (let i = 0; i < 22; i++) {
            fileId += chars[Math.floor(Math.random() * chars.length)];
        }
        return fileId;
    }

    private createMetaData(prefabName: string, prefabUuid: string): any {
        return {
            "ver": "1.1.50",
            "importer": "prefab",
            "imported": true,
            "uuid": prefabUuid,
            "files": [
                ".json"
            ],
            "subMetas": {},
            "userData": {
                "syncNodeName": prefabName
            }
        };
    }

    private async savePrefabFiles(prefabPath: string, prefabData: any[], metaData: any): Promise<{ success: boolean; error?: string }> {
        return new Promise((resolve) => {
            try {
                // Editor API로 프리팹 파일 저장
                const prefabContent = JSON.stringify(prefabData, null, 2);
                const metaContent = JSON.stringify(metaData, null, 2);
                
                // 더 안정적인 저장 방식 시도
                this.saveAssetFile(prefabPath, prefabContent).then(() => {
                    // meta 파일 추가 생성
                    const metaPath = `${prefabPath}.meta`;
                    return this.saveAssetFile(metaPath, metaContent);
                }).then(() => {
                    resolve({ success: true });
                }).catch((error: any) => {
                    resolve({ success: false, error: error.message || '保存预制体文件失败' });
                });
            } catch (error) {
                resolve({ success: false, error: `保存文件时发生错误: ${error}` });
            }
        });
    }

    private async saveAssetFile(filePath: string, content: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // 여러 저장 방식 시도
            const saveMethods = [
                () => Editor.Message.request('asset-db', 'create-asset', filePath, content),
                () => Editor.Message.request('asset-db', 'save-asset', filePath, content),
                () => Editor.Message.request('asset-db', 'write-asset', filePath, content)
            ];

            const trySave = (index: number) => {
                if (index >= saveMethods.length) {
                    reject(new Error('所有保存方法都失败了'));
                    return;
                }

                saveMethods[index]().then(() => {
                    resolve();
                }).catch(() => {
                    trySave(index + 1);
                });
            };

            trySave(0);
        });
    }

    private async updatePrefab(prefabPath: string, nodeUuid: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'query-asset-info', prefabPath).then((assetInfo: any) => {
                if (!assetInfo) {
                    throw new Error('Prefab not found');
                }

                return Editor.Message.request('scene', 'apply-prefab', {
                    node: nodeUuid,
                    prefab: assetInfo.uuid
                });
            }).then(() => {
                resolve({
                    success: true,
                    message: 'Prefab updated successfully'
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async revertPrefab(nodeUuid: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'revert-prefab', {
                node: nodeUuid
            }).then(() => {
                resolve({
                    success: true,
                    message: 'Prefab instance reverted successfully'
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async getPrefabInfo(prefabPath: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'query-asset-info', prefabPath).then((assetInfo: any) => {
                if (!assetInfo) {
                    throw new Error('Prefab not found');
                }

                return Editor.Message.request('asset-db', 'query-asset-meta', assetInfo.uuid);
            }).then((metaInfo: any) => {
                const info: PrefabInfo = {
                    name: metaInfo.name,
                    uuid: metaInfo.uuid,
                    path: prefabPath,
                    folder: prefabPath.substring(0, prefabPath.lastIndexOf('/')),
                    createTime: metaInfo.createTime,
                    modifyTime: metaInfo.modifyTime,
                    dependencies: metaInfo.depends || []
                };
                resolve({ success: true, data: info });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async createPrefabFromNode(args: any): Promise<ToolResponse> {
        // prefabPath에서 이름 추출
        const prefabPath = args.prefabPath;
        const prefabName = prefabPath.split('/').pop()?.replace('.prefab', '') || 'NewPrefab';
        
        // 기존 createPrefab 메서드 호출
        return await this.createPrefab({
            nodeUuid: args.nodeUuid,
            savePath: prefabPath,
            prefabName: prefabName
        });
    }

    private async validatePrefab(prefabPath: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            try {
                // 프리팹 파일 내용을 읽기
                Editor.Message.request('asset-db', 'query-asset-info', prefabPath).then((assetInfo: any) => {
                    if (!assetInfo) {
                        resolve({
                            success: false,
                            error: '预制体文件不存在'
                        });
                        return;
                    }

                    // 프리팹 형식 검증
                    Editor.Message.request('asset-db', 'read-asset', prefabPath).then((content: string) => {
                        try {
                            const prefabData = JSON.parse(content);
                            const validationResult = this.validatePrefabFormat(prefabData);
                            
                            resolve({
                                success: true,
                                data: {
                                    isValid: validationResult.isValid,
                                    issues: validationResult.issues,
                                    nodeCount: validationResult.nodeCount,
                                    componentCount: validationResult.componentCount,
                                    message: validationResult.isValid ? '预制体格式有效' : '预制体格式存在问题'
                                }
                            });
                        } catch (parseError) {
                            resolve({
                                success: false,
                                error: '预制体文件格式错误，无法解析JSON'
                            });
                        }
                    }).catch((error: any) => {
                        resolve({
                            success: false,
                            error: `读取预制体文件失败: ${error.message}`
                        });
                    });
                }).catch((error: any) => {
                    resolve({
                        success: false,
                        error: `查询预制体信息失败: ${error.message}`
                    });
                });
            } catch (error) {
                resolve({
                    success: false,
                    error: `验证预制体时发生错误: ${error}`
                });
            }
        });
    }

    private validatePrefabFormat(prefabData: any): { isValid: boolean; issues: string[]; nodeCount: number; componentCount: number } {
        const issues: string[] = [];
        let nodeCount = 0;
        let componentCount = 0;

        // 기본 구조 확인
        if (!Array.isArray(prefabData)) {
            issues.push('预制体数据必须是数组格式');
            return { isValid: false, issues, nodeCount, componentCount };
        }

        if (prefabData.length === 0) {
            issues.push('预制体数据为空');
            return { isValid: false, issues, nodeCount, componentCount };
        }

        // 첫 번째 요소가 프리팹 에셋인지 확인
        const firstElement = prefabData[0];
        if (!firstElement || firstElement.__type__ !== 'cc.Prefab') {
            issues.push('第一个元素必须是cc.Prefab类型');
        }

        // 노드 및 컴포넌트 개수 집계
        prefabData.forEach((item: any, index: number) => {
            if (item.__type__ === 'cc.Node') {
                nodeCount++;
            } else if (item.__type__ && item.__type__.includes('cc.')) {
                componentCount++;
            }
        });

        // 필수 필드 확인
        if (nodeCount === 0) {
            issues.push('预制体必须包含至少一个节点');
        }

        return {
            isValid: issues.length === 0,
            issues,
            nodeCount,
            componentCount
        };
    }

    private async duplicatePrefab(args: any): Promise<ToolResponse> {
        return new Promise(async (resolve) => {
            try {
                const { sourcePrefabPath, targetPrefabPath, newPrefabName } = args;
                
                // 원본 프리팹 읽기
                const sourceInfo = await this.getPrefabInfo(sourcePrefabPath);
                if (!sourceInfo.success) {
                    resolve({
                        success: false,
                        error: `无法读取源预制体: ${sourceInfo.error}`
                    });
                    return;
                }

                // 원본 프리팹 내용 읽기
                const sourceContent = await this.readPrefabContent(sourcePrefabPath);
                if (!sourceContent.success) {
                    resolve({
                        success: false,
                        error: `无法读取源预制体内容: ${sourceContent.error}`
                    });
                    return;
                }

                // 새 UUID 생성
                const newUuid = this.generateUUID();
                
                // 프리팹 데이터 수정
                const modifiedData = this.modifyPrefabForDuplication(sourceContent.data, newPrefabName, newUuid);
                
                // 새 meta 데이터 생성
                const newMetaData = this.createMetaData(newPrefabName || 'DuplicatedPrefab', newUuid);
                
                // 복잡한 직렬화 형식이 관련되어 프리팹 복제 기능은 임시 비활성화
                resolve({
                    success: false,
                    error: '预制体复制功能暂时不可用',
                    instruction: '请在 Cocos Creator 编辑器中手动复制预制体：\n1. 在资源管理器中选择要复制的预制体\n2. 右键选择复制\n3. 在目标位置粘贴'
                });

            } catch (error) {
                resolve({
                    success: false,
                    error: `复制预制体时发生错误: ${error}`
                });
            }
        });
    }

    private async readPrefabContent(prefabPath: string): Promise<{ success: boolean; data?: any; error?: string }> {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'read-asset', prefabPath).then((content: string) => {
                try {
                    const prefabData = JSON.parse(content);
                    resolve({ success: true, data: prefabData });
                } catch (parseError) {
                    resolve({ success: false, error: '预制体文件格式错误' });
                }
            }).catch((error: any) => {
                resolve({ success: false, error: error.message || '读取预制体文件失败' });
            });
        });
    }

    private modifyPrefabForDuplication(prefabData: any[], newName: string, newUuid: string): any[] {
        // 복사본 생성을 위해 프리팹 데이터 수정
        const modifiedData = [...prefabData];
        
        // 첫 번째 요소(프리팹 에셋) 수정
        if (modifiedData[0] && modifiedData[0].__type__ === 'cc.Prefab') {
            modifiedData[0]._name = newName || 'DuplicatedPrefab';
        }

        // 모든 UUID 참조 갱신(단순 버전)
        // 실제 적용에서는 더 복잡한 UUID 매핑 처리가 필요할 수 있음
        
        return modifiedData;
    }

    /**
     * asset-db API로 리소스 파일 생성
     */
    private async createAssetWithAssetDB(assetPath: string, content: string): Promise<{ success: boolean; data?: any; error?: string }> {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'create-asset', assetPath, content, {
                overwrite: true,
                rename: false
            }).then((assetInfo: any) => {
                console.log('创建资源文件成功:', assetInfo);
                resolve({ success: true, data: assetInfo });
            }).catch((error: any) => {
                console.error('创建资源文件失败:', error);
                resolve({ success: false, error: error.message || '创建资源文件失败' });
            });
        });
    }

    /**
     * asset-db API로 meta 파일 생성
     */
    private async createMetaWithAssetDB(assetPath: string, metaContent: any): Promise<{ success: boolean; data?: any; error?: string }> {
        return new Promise((resolve) => {
            const metaContentString = JSON.stringify(metaContent, null, 2);
            Editor.Message.request('asset-db', 'save-asset-meta', assetPath, metaContentString).then((assetInfo: any) => {
                console.log('创建meta文件成功:', assetInfo);
                resolve({ success: true, data: assetInfo });
            }).catch((error: any) => {
                console.error('创建meta文件失败:', error);
                resolve({ success: false, error: error.message || '创建meta文件失败' });
            });
        });
    }

    /**
     * asset-db API로 리소스 재임포트
     */
    private async reimportAssetWithAssetDB(assetPath: string): Promise<{ success: boolean; data?: any; error?: string }> {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'reimport-asset', assetPath).then((result: any) => {
                console.log('重新导入资源成功:', result);
                resolve({ success: true, data: result });
            }).catch((error: any) => {
                console.error('重新导入资源失败:', error);
                resolve({ success: false, error: error.message || '重新导入资源失败' });
            });
        });
    }

    /**
     * asset-db API로 리소스 파일 내용 갱신
     */
    private async updateAssetWithAssetDB(assetPath: string, content: string): Promise<{ success: boolean; data?: any; error?: string }> {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'save-asset', assetPath, content).then((result: any) => {
                console.log('更新资源文件成功:', result);
                resolve({ success: true, data: result });
            }).catch((error: any) => {
                console.error('更新资源文件失败:', error);
                resolve({ success: false, error: error.message || '更新资源文件失败' });
            });
        });
    }

    /**
     * Cocos Creator 표준에 맞는 프리팹 내용 생성
     * 재귀 노드 트리 처리를 완전 구현하여 엔진 표준 형식과 일치
     */
    private async createStandardPrefabContent(nodeData: any, prefabName: string, prefabUuid: string, includeChildren: boolean, includeComponents: boolean): Promise<any[]> {
        console.log('开始创建引擎标准预制体内容...');
        
        const prefabData: any[] = [];
        let currentId = 0;

        // 1. 프리팹 에셋 객체 생성(index 0)
        const prefabAsset = {
            "__type__": "cc.Prefab",
            "_name": prefabName || "", // 보장프리팹
            "_objFlags": 0,
            "__editorExtras__": {},
            "_native": "",
            "data": {
                "__id__": 1
            },
            "optimizationPolicy": 0,
            "persistent": false
        };
        prefabData.push(prefabAsset);
        currentId++;

        // 2. 완전한 노드 트리 구조를 재귀 생성
        const context = {
            prefabData,
            currentId: currentId + 1, // 노드 1, 노드 2
            prefabAssetIndex: 0,
            nodeFileIds: new Map<string, string>(), // 노드ID fileId
            nodeUuidToIndex: new Map<string, number>(), // 노드UUID
            componentUuidToIndex: new Map<string, number>() // 컴포넌트UUID
        };

        // 루트 노드와 전체 노드 트리 생성 - 주의: 루트 노드의 부모는 프리팹 객체가 아닌 null이어야 함
        await this.createCompleteNodeTree(nodeData, null, 1, context, includeChildren, includeComponents, prefabName);

        console.log(`预制体内容创建完成，总共 ${prefabData.length} 个对象`);
        console.log('节点fileId映射:', Array.from(context.nodeFileIds.entries()));
        
        return prefabData;
    }

    /**
     * 모든 자식 노드와 해당 PrefabInfo를 포함해 완전한 노드 트리를 재귀 생성
     */
    private async createCompleteNodeTree(
        nodeData: any, 
        parentNodeIndex: number | null, 
        nodeIndex: number,
        context: { 
            prefabData: any[], 
            currentId: number, 
            prefabAssetIndex: number, 
            nodeFileIds: Map<string, string>,
            nodeUuidToIndex: Map<string, number>,
            componentUuidToIndex: Map<string, number>
        },
        includeChildren: boolean,
        includeComponents: boolean,
        nodeName?: string
    ): Promise<void> {
        const { prefabData } = context;
        
        // 노드 객체 생성
        const node = this.createEngineStandardNode(nodeData, parentNodeIndex, nodeName);
        
        // 노드가 지정된 인덱스 위치에 있도록 보장
        while (prefabData.length <= nodeIndex) {
            prefabData.push(null);
        }
        console.log(`设置节点到索引 ${nodeIndex}: ${node._name}, _parent:`, node._parent, `_children count: ${node._children.length}`);
        prefabData[nodeIndex] = node;
        
        // 현재 노드의 fileId를 생성하고 UUID-인덱스 매핑 기록
        const nodeUuid = this.extractNodeUuid(nodeData);
        const fileId = nodeUuid || this.generateFileId();
        context.nodeFileIds.set(nodeIndex.toString(), fileId);
        
        // 노드 UUID-인덱스 매핑 기록
        if (nodeUuid) {
            context.nodeUuidToIndex.set(nodeUuid, nodeIndex);
            console.log(`记录节点UUID映射: ${nodeUuid} -> ${nodeIndex}`);
        }

        // 먼저 자식 노드를 처리(수동 생성 인덱스 순서와 일치 유지)
        const childrenToProcess = this.getChildrenToProcess(nodeData);
        if (includeChildren && childrenToProcess.length > 0) {
            console.log(`处理节点 ${node._name} 的 ${childrenToProcess.length} 个子节点`);
            
            // 각 자식 노드에 인덱스 할당
            const childIndices: number[] = [];
            console.log(`准备为 ${childrenToProcess.length} 个子节点分配索引，当前ID: ${context.currentId}`);
            for (let i = 0; i < childrenToProcess.length; i++) {
                console.log(`处理第 ${i+1} 个子节点，当前currentId: ${context.currentId}`);
                const childIndex = context.currentId++;
                childIndices.push(childIndex);
                node._children.push({ "__id__": childIndex });
                console.log(`✅ 添加子节点引用到 ${node._name}: {__id__: ${childIndex}}`);
            }
            console.log(`✅ 节点 ${node._name} 最终的子节点数组:`, node._children);

            // 자식 노드 재귀 생성
            for (let i = 0; i < childrenToProcess.length; i++) {
                const childData = childrenToProcess[i];
                const childIndex = childIndices[i];
                await this.createCompleteNodeTree(
                    childData, 
                    nodeIndex, 
                    childIndex, 
                    context,
                    includeChildren,
                    includeComponents,
                    childData.name || `Child${i+1}`
                );
            }
        }

        // 그다음 컴포넌트 처리
        if (includeComponents && nodeData.components && Array.isArray(nodeData.components)) {
            console.log(`处理节点 ${node._name} 的 ${nodeData.components.length} 个组件`);
            
            const componentIndices: number[] = [];
            for (const component of nodeData.components) {
                const componentIndex = context.currentId++;
                componentIndices.push(componentIndex);
                node._components.push({ "__id__": componentIndex });
                
                // 컴포넌트 UUID-인덱스 매핑 기록
                const componentUuid = component.uuid || (component.value && component.value.uuid);
                if (componentUuid) {
                    context.componentUuidToIndex.set(componentUuid, componentIndex);
                    console.log(`记录组件UUID映射: ${componentUuid} -> ${componentIndex}`);
                }
                
                // 컴포넌트 객체 생성 시 참조 처리를 위해 context 전달
                const componentObj = this.createComponentObject(component, nodeIndex, context);
                prefabData[componentIndex] = componentObj;
                
                // 컴포넌트용 CompPrefabInfo 생성
                const compPrefabInfoIndex = context.currentId++;
                prefabData[compPrefabInfoIndex] = {
                    "__type__": "cc.CompPrefabInfo",
                    "fileId": this.generateFileId()
                };
                
                // 컴포넌트 객체에 __prefab 속성이 있으면 참조 설정
                if (componentObj && typeof componentObj === 'object') {
                    componentObj.__prefab = { "__id__": compPrefabInfoIndex };
                }
            }
            
            console.log(`✅ 节点 ${node._name} 添加了 ${componentIndices.length} 个组件`);
        }


        // 현재 노드용 PrefabInfo 생성
        const prefabInfoIndex = context.currentId++;
        node._prefab = { "__id__": prefabInfoIndex };
        
        const prefabInfo: any = {
            "__type__": "cc.PrefabInfo",
            "root": { "__id__": 1 },
            "asset": { "__id__": context.prefabAssetIndex },
            "fileId": fileId,
            "targetOverrides": null,
            "nestedPrefabInstanceRoots": null
        };
        
        // 루트 노드 특별 처리
        if (nodeIndex === 1) {
            // 루트 노드는 instance가 없지만 targetOverrides가 있을 수 있음
            prefabInfo.instance = null;
        } else {
            // 자식 노드는 보통 instance가 null
            prefabInfo.instance = null;
        }
        
        prefabData[prefabInfoIndex] = prefabInfo;
        context.currentId = prefabInfoIndex + 1;
    }

    /**
     * UUID를 Cocos Creator 압축 형식으로 변환
     * 실제 Cocos Creator 에디터 기반 압축 알고리즘 구현
     * 앞 5개 hex 문자는 유지하고, 나머지 27자를 18자로 압축
     */
    private uuidToCompressedId(uuid: string): string {
        const BASE64_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        
        // 하이픈 제거 후 소문자로 변환
        const cleanUuid = uuid.replace(/-/g, '').toLowerCase();
        
        // UUID 유효성 보장
        if (cleanUuid.length !== 32) {
            return uuid; // 만약 UUID
        }
        
        // Cocos Creator 압축 : 5 , 27 압축 18
        let result = cleanUuid.substring(0, 5);
        
        // 27 압축 18
        const remainder = cleanUuid.substring(5);
        
        // hex 3자를 2자로 압축
        for (let i = 0; i < remainder.length; i += 3) {
            const hex1 = remainder[i] || '0';
            const hex2 = remainder[i + 1] || '0';
            const hex3 = remainder[i + 2] || '0';
            
            // hex 3자(12비트)를 base64 2자로 변환
            const value = parseInt(hex1 + hex2 + hex3, 16);
            
            // 12비트를 6비트 두 개로 분할
            const high6 = (value >> 6) & 63;
            const low6 = value & 63;
            
            result += BASE64_KEYS[high6] + BASE64_KEYS[low6];
        }
        
        return result;
    }

    /**
     * 컴포넌트 객체 생성
     */
    private createComponentObject(componentData: any, nodeIndex: number, context?: { 
        nodeUuidToIndex?: Map<string, number>,
        componentUuidToIndex?: Map<string, number>
    }): any {
        let componentType = componentData.type || componentData.__type__ || 'cc.Component';
        const enabled = componentData.enabled !== undefined ? componentData.enabled : true;
        
        // console.log(`컴포넌트 객체 생성 - 타입: ${componentType}`);
        // console.log('컴포넌트 데이터:', JSON.stringify(componentData, null, 2));
        
        // 처리스크립트컴포넌트 - MCP인터페이스 압축UUID형식
        if (componentType && !componentType.startsWith('cc.')) {
            console.log(`使用脚本组件压缩UUID类型: ${componentType}`);
        }
        
        // 기본 컴포넌트 구조
        const component: any = {
            "__type__": componentType,
            "_name": "",
            "_objFlags": 0,
            "__editorExtras__": {},
            "node": { "__id__": nodeIndex },
            "_enabled": enabled
        };
        
        // __prefab 속성 플레이스홀더를 미리 설정(이후 올바르게 설정됨)
        component.__prefab = null;
        
        // 컴포넌트 타입에 따라 특정 속성 추가
        if (componentType === 'cc.UITransform') {
            const contentSize = componentData.properties?.contentSize?.value || { width: 100, height: 100 };
            const anchorPoint = componentData.properties?.anchorPoint?.value || { x: 0.5, y: 0.5 };
            
            component._contentSize = {
                "__type__": "cc.Size",
                "width": contentSize.width,
                "height": contentSize.height
            };
            component._anchorPoint = {
                "__type__": "cc.Vec2",
                "x": anchorPoint.x,
                "y": anchorPoint.y
            };
        } else if (componentType === 'cc.Sprite') {
            // Sprite 컴포넌트의 spriteFrame 참조 처리
            const spriteFrameProp = componentData.properties?._spriteFrame || componentData.properties?.spriteFrame;
            if (spriteFrameProp) {
                component._spriteFrame = this.processComponentProperty(spriteFrameProp, context);
            } else {
                component._spriteFrame = null;
            }
            
            component._type = componentData.properties?._type?.value ?? 0;
            component._fillType = componentData.properties?._fillType?.value ?? 0;
            component._sizeMode = componentData.properties?._sizeMode?.value ?? 1;
            component._fillCenter = { "__type__": "cc.Vec2", "x": 0, "y": 0 };
            component._fillStart = componentData.properties?._fillStart?.value ?? 0;
            component._fillRange = componentData.properties?._fillRange?.value ?? 0;
            component._isTrimmedMode = componentData.properties?._isTrimmedMode?.value ?? true;
            component._useGrayscale = componentData.properties?._useGrayscale?.value ?? false;
            
            // : Sprite컴포넌트 속성（ ）
            // console.log('Sprite 컴포넌트 속성:', JSON.stringify(componentData.properties, null, 2));
            component._atlas = null;
            component._id = "";
        } else if (componentType === 'cc.Button') {
            component._interactable = true;
            component._transition = 3;
            component._normalColor = { "__type__": "cc.Color", "r": 255, "g": 255, "b": 255, "a": 255 };
            component._hoverColor = { "__type__": "cc.Color", "r": 211, "g": 211, "b": 211, "a": 255 };
            component._pressedColor = { "__type__": "cc.Color", "r": 255, "g": 255, "b": 255, "a": 255 };
            component._disabledColor = { "__type__": "cc.Color", "r": 124, "g": 124, "b": 124, "a": 255 };
            component._normalSprite = null;
            component._hoverSprite = null;
            component._pressedSprite = null;
            component._disabledSprite = null;
            component._duration = 0.1;
            component._zoomScale = 1.2;
            // Button의 target 참조 처리
            const targetProp = componentData.properties?._target || componentData.properties?.target;
            if (targetProp) {
                component._target = this.processComponentProperty(targetProp, context);
            } else {
                component._target = { "__id__": nodeIndex }; // 기본 노드
            }
            component._clickEvents = [];
            component._id = "";
        } else if (componentType === 'cc.Label') {
            component._string = componentData.properties?._string?.value || "Label";
            component._horizontalAlign = 1;
            component._verticalAlign = 1;
            component._actualFontSize = 20;
            component._fontSize = 20;
            component._fontFamily = "Arial";
            component._lineHeight = 25;
            component._overflow = 0;
            component._enableWrapText = true;
            component._font = null;
            component._isSystemFontUsed = true;
            component._spacingX = 0;
            component._isItalic = false;
            component._isBold = false;
            component._isUnderline = false;
            component._underlineHeight = 2;
            component._cacheMode = 0;
            component._id = "";
        } else if (componentData.properties) {
            // 모든 컴포넌트 속성 처리(내장/사용자 스크립트 포함)
            for (const [key, value] of Object.entries(componentData.properties)) {
                if (key === 'node' || key === 'enabled' || key === '__type__' || 
                    key === 'uuid' || key === 'name' || key === '__scriptAsset' || key === '_objFlags') {
                    continue; // 건너뜀 속성, _objFlags
                }
                
                // 밑줄로 시작하는 속성은 특별 처리 필요
                if (key.startsWith('_')) {
                    // 속성명 원형 유지(밑줄 포함)
                    const propValue = this.processComponentProperty(value, context);
                    if (propValue !== undefined) {
                        component[key] = propValue;
                    }
                } else {
                    // 밑줄로 시작하지 않는 속성은 일반 처리
                    const propValue = this.processComponentProperty(value, context);
                    if (propValue !== undefined) {
                        component[key] = propValue;
                    }
                }
            }
        }
        
        // _id가 마지막 위치가 되도록 보장
        const _id = component._id || "";
        delete component._id;
        component._id = _id;
        
        return component;
    }

    /**
     * 컴포넌트 속성값을 처리해 수동 생성 프리팹 형식과 일치 보장
     */
    private processComponentProperty(propData: any, context?: { 
        nodeUuidToIndex?: Map<string, number>,
        componentUuidToIndex?: Map<string, number>
    }): any {
        if (!propData || typeof propData !== 'object') {
            return propData;
        }

        const value = propData.value;
        const type = propData.type;

        // null 값 처리
        if (value === null || value === undefined) {
            return null;
        }

        // 빈 UUID 객체를 null로 변환
        if (value && typeof value === 'object' && value.uuid === '') {
            return null;
        }

        // 노드 참조 처리
        if (type === 'cc.Node' && value?.uuid) {
            // 프리팹에서 노드 참조는 __id__ 형식으로 변환 필요
            if (context?.nodeUuidToIndex && context.nodeUuidToIndex.has(value.uuid)) {
                // 내부 참조: __id__ 형식으로 변환
                return {
                    "__id__": context.nodeUuidToIndex.get(value.uuid)
                };
            }
            // 외부 참조: 외부 노드는 프리팹 구조에 속하지 않아 null로 설정
            console.warn(`Node reference UUID ${value.uuid} not found in prefab context, setting to null (external reference)`);
            return null;
        }

        // 리소스 참조 처리(프리팹/텍스처/스프라이트 프레임 등)
        if (value?.uuid && (
            type === 'cc.Prefab' || 
            type === 'cc.Texture2D' || 
            type === 'cc.SpriteFrame' ||
            type === 'cc.Material' ||
            type === 'cc.AnimationClip' ||
            type === 'cc.AudioClip' ||
            type === 'cc.Font' ||
            type === 'cc.Asset'
        )) {
            // 프리팹 참조는 원본 UUID 형식 유지
            const uuidToUse = type === 'cc.Prefab' ? value.uuid : this.uuidToCompressedId(value.uuid);
            return {
                "__uuid__": uuidToUse,
                "__expectedType__": type
            };
        }

        // 컴포넌트 참조 처리(cc.Label, cc.Button 등 포함)
        if (value?.uuid && (type === 'cc.Component' || 
            type === 'cc.Label' || type === 'cc.Button' || type === 'cc.Sprite' || 
            type === 'cc.UITransform' || type === 'cc.RigidBody2D' || 
            type === 'cc.BoxCollider2D' || type === 'cc.Animation' || 
            type === 'cc.AudioSource' || (type?.startsWith('cc.') && !type.includes('@')))) {
            // 프리팹에서 컴포넌트 참조도 __id__ 형식으로 변환 필요
            if (context?.componentUuidToIndex && context.componentUuidToIndex.has(value.uuid)) {
                // 내부 참조: __id__ 형식으로 변환
                console.log(`Component reference ${type} UUID ${value.uuid} found in prefab context, converting to __id__`);
                return {
                    "__id__": context.componentUuidToIndex.get(value.uuid)
                };
            }
            // 외부 참조: 외부 컴포넌트는 프리팹 구조에 속하지 않아 null로 설정
            console.warn(`Component reference ${type} UUID ${value.uuid} not found in prefab context, setting to null (external reference)`);
            return null;
        }

        // 복합 타입 처리 및 __type__ 마커 추가
        if (value && typeof value === 'object') {
            if (type === 'cc.Color') {
                return {
                    "__type__": "cc.Color",
                    "r": Math.min(255, Math.max(0, Number(value.r) || 0)),
                    "g": Math.min(255, Math.max(0, Number(value.g) || 0)),
                    "b": Math.min(255, Math.max(0, Number(value.b) || 0)),
                    "a": value.a !== undefined ? Math.min(255, Math.max(0, Number(value.a))) : 255
                };
            } else if (type === 'cc.Vec3') {
                return {
                    "__type__": "cc.Vec3",
                    "x": Number(value.x) || 0,
                    "y": Number(value.y) || 0,
                    "z": Number(value.z) || 0
                };
            } else if (type === 'cc.Vec2') {
                return {
                    "__type__": "cc.Vec2", 
                    "x": Number(value.x) || 0,
                    "y": Number(value.y) || 0
                };
            } else if (type === 'cc.Size') {
                return {
                    "__type__": "cc.Size",
                    "width": Number(value.width) || 0,
                    "height": Number(value.height) || 0
                };
            } else if (type === 'cc.Quat') {
                return {
                    "__type__": "cc.Quat",
                    "x": Number(value.x) || 0,
                    "y": Number(value.y) || 0,
                    "z": Number(value.z) || 0,
                    "w": value.w !== undefined ? Number(value.w) : 1
                };
            }
        }

        // 배열 타입 처리
        if (Array.isArray(value)) {
            // 노드 배열
            if (propData.elementTypeData?.type === 'cc.Node') {
                return value.map(item => {
                    if (item?.uuid && context?.nodeUuidToIndex?.has(item.uuid)) {
                        return { "__id__": context.nodeUuidToIndex.get(item.uuid) };
                    }
                    return null;
                }).filter(item => item !== null);
            }
            
            // 리소스 배열
            if (propData.elementTypeData?.type && propData.elementTypeData.type.startsWith('cc.')) {
                return value.map(item => {
                    if (item?.uuid) {
                        return {
                            "__uuid__": this.uuidToCompressedId(item.uuid),
                            "__expectedType__": propData.elementTypeData.type
                        };
                    }
                    return null;
                }).filter(item => item !== null);
            }

            // 기본 타입 배열
            return value.map(item => item?.value !== undefined ? item.value : item);
        }

        // 기타 복합 객체 타입은 원형 유지하되 __type__ 마커 보장
        if (value && typeof value === 'object' && type && type.startsWith('cc.')) {
            return {
                "__type__": type,
                ...value
            };
        }

        return value;
    }

    /**
     * 엔진 표준에 맞는 노드 객체 생성
     */
    private createEngineStandardNode(nodeData: any, parentNodeIndex: number | null, nodeName?: string): any {
        // 디버그: 원본 노드 데이터 출력(주석 처리됨)
        // console.log(' 노드데이터:', JSON.stringify(nodeData, null, 2));
        
        // 노드 기본 속성 추출
        const getValue = (prop: any) => {
            if (prop?.value !== undefined) return prop.value;
            if (prop !== undefined) return prop;
            return null;
        };
        
        const position = getValue(nodeData.position) || getValue(nodeData.value?.position) || { x: 0, y: 0, z: 0 };
        const rotation = getValue(nodeData.rotation) || getValue(nodeData.value?.rotation) || { x: 0, y: 0, z: 0, w: 1 };
        const scale = getValue(nodeData.scale) || getValue(nodeData.value?.scale) || { x: 1, y: 1, z: 1 };
        const active = getValue(nodeData.active) ?? getValue(nodeData.value?.active) ?? true;
        const name = nodeName || getValue(nodeData.name) || getValue(nodeData.value?.name) || 'Node';
        const layer = getValue(nodeData.layer) || getValue(nodeData.value?.layer) || 1073741824;

        // 출력
        console.log(`创建节点: ${name}, parentNodeIndex: ${parentNodeIndex}`);

        const parentRef = parentNodeIndex !== null ? { "__id__": parentNodeIndex } : null;
        console.log(`节点 ${name} 的父节点引用:`, parentRef);

        return {
            "__type__": "cc.Node",
            "_name": name,
            "_objFlags": 0,
            "__editorExtras__": {},
            "_parent": parentRef,
            "_children": [], // 노드참조 재귀
            "_active": active,
            "_components": [], // 컴포넌트참조 처리컴포넌트
            "_prefab": { "__id__": 0 }, // 설정
            "_lpos": {
                "__type__": "cc.Vec3",
                "x": position.x,
                "y": position.y,
                "z": position.z
            },
            "_lrot": {
                "__type__": "cc.Quat",
                "x": rotation.x,
                "y": rotation.y,
                "z": rotation.z,
                "w": rotation.w
            },
            "_lscale": {
                "__type__": "cc.Vec3",
                "x": scale.x,
                "y": scale.y,
                "z": scale.z
            },
            "_mobility": 0,
            "_layer": layer,
            "_euler": {
                "__type__": "cc.Vec3",
                "x": 0,
                "y": 0,
                "z": 0
            },
            "_id": ""
        };
    }

    /**
     * 노드 데이터에서 UUID 추출
     */
    private extractNodeUuid(nodeData: any): string | null {
        if (!nodeData) return null;
        
        // UUID를 여러 방식으로 획득 시도
        const sources = [
            nodeData.uuid,
            nodeData.value?.uuid,
            nodeData.__uuid__,
            nodeData.value?.__uuid__,
            nodeData.id,
            nodeData.value?.id
        ];
        
        for (const source of sources) {
            if (typeof source === 'string' && source.length > 0) {
                return source;
            }
        }
        
        return null;
    }

    /**
     * 의존성 문제를 피하기 위해 컴포넌트 없는 최소 노드 객체 생성
     */
    private createMinimalNode(nodeData: any, nodeName?: string): any {
        // 노드 기본 속성 추출
        const getValue = (prop: any) => {
            if (prop?.value !== undefined) return prop.value;
            if (prop !== undefined) return prop;
            return null;
        };
        
        const position = getValue(nodeData.position) || getValue(nodeData.value?.position) || { x: 0, y: 0, z: 0 };
        const rotation = getValue(nodeData.rotation) || getValue(nodeData.value?.rotation) || { x: 0, y: 0, z: 0, w: 1 };
        const scale = getValue(nodeData.scale) || getValue(nodeData.value?.scale) || { x: 1, y: 1, z: 1 };
        const active = getValue(nodeData.active) ?? getValue(nodeData.value?.active) ?? true;
        const name = nodeName || getValue(nodeData.name) || getValue(nodeData.value?.name) || 'Node';
        const layer = getValue(nodeData.layer) || getValue(nodeData.value?.layer) || 33554432;

        return {
            "__type__": "cc.Node",
            "_name": name,
            "_objFlags": 0,
            "_parent": null,
            "_children": [],
            "_active": active,
            "_components": [], // 컴포넌트배열, 컴포넌트
            "_prefab": {
                "__id__": 2
            },
            "_lpos": {
                "__type__": "cc.Vec3",
                "x": position.x,
                "y": position.y,
                "z": position.z
            },
            "_lrot": {
                "__type__": "cc.Quat",
                "x": rotation.x,
                "y": rotation.y,
                "z": rotation.z,
                "w": rotation.w
            },
            "_lscale": {
                "__type__": "cc.Vec3",
                "x": scale.x,
                "y": scale.y,
                "z": scale.z
            },
            "_layer": layer,
            "_euler": {
                "__type__": "cc.Vec3",
                "x": 0,
                "y": 0,
                "z": 0
            },
            "_id": ""
        };
    }

    /**
     * 표준 meta 파일 내용 생성
     */
    private createStandardMetaContent(prefabName: string, prefabUuid: string): any {
        return {
            "ver": "2.0.3",
            "importer": "prefab",
            "imported": true,
            "uuid": prefabUuid,
            "files": [
                ".json"
            ],
            "subMetas": {},
            "userData": {
                "syncNodeName": prefabName,
                "hasIcon": false
            }
        };
    }

    /**
     * 원본 노드를 프리팹 인스턴스로 변환 시도
     */
    private async convertNodeToPrefabInstance(nodeUuid: string, prefabUuid: string, prefabPath: string): Promise<{ success: boolean; error?: string }> {
        return new Promise((resolve) => {
            // 이 기능은 씬 에디터와의 심층 통합이 필요하여 현재 실패 반환
            // 실제 엔진에서는 복잡한 프리팹 인스턴스화/노드 교체 로직이 필요
            console.log('节点转换为预制体实例的功能需要更深入的引擎集成');
            resolve({
                success: false,
                error: '节点转换为预制体实例需要更深入的引擎集成支持'
            });
        });
    }

    private async restorePrefabNode(nodeUuid: string, assetUuid: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            // 공식 API restore-prefab으로 프리팹 노드 복원
            (Editor.Message.request as any)('scene', 'restore-prefab', nodeUuid, assetUuid).then(() => {
                resolve({
                    success: true,
                    data: {
                        nodeUuid: nodeUuid,
                        assetUuid: assetUuid,
                        message: '预制体节点还原成功'
                    }
                });
            }).catch((error: any) => {
                resolve({
                    success: false,
                    error: `预制体节点还原失败: ${error.message}`
                });
            });
        });
    }

    // 공식 프리팹 형식 기반의 신규 구현 방식
    private async getNodeDataForPrefab(nodeUuid: string): Promise<{ success: boolean; data?: any; error?: string }> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-node', nodeUuid).then((nodeData: any) => {
                if (!nodeData) {
                    resolve({ success: false, error: '节点不存在' });
                    return;
                }
                resolve({ success: true, data: nodeData });
            }).catch((error: any) => {
                resolve({ success: false, error: error.message });
            });
        });
    }

    private async createStandardPrefabData(nodeData: any, prefabName: string, prefabUuid: string): Promise<any[]> {
        // 공식 Canvas.prefab 형식 기반 프리팹 데이터 구조 생성
        const prefabData: any[] = [];
        let currentId = 0;

        // 첫 번째 요소: cc.Prefab 리소스 객체
        const prefabAsset = {
            "__type__": "cc.Prefab",
            "_name": prefabName,
            "_objFlags": 0,
            "__editorExtras__": {},
            "_native": "",
            "data": {
                "__id__": 1
            },
            "optimizationPolicy": 0,
            "persistent": false
        };
        prefabData.push(prefabAsset);
        currentId++;

        // 두 번째 요소: 루트 노드
        const rootNode = await this.createNodeObject(nodeData, null, prefabData, currentId);
        prefabData.push(rootNode.node);
        currentId = rootNode.nextId;

        // 루트 노드 PrefabInfo 추가 - asset 참조를 UUID 사용으로 수정
        const rootPrefabInfo = {
            "__type__": "cc.PrefabInfo",
            "root": {
                "__id__": 1
            },
            "asset": {
                "__uuid__": prefabUuid
            },
            "fileId": this.generateFileId(),
            "instance": null,
            "targetOverrides": [],
            "nestedPrefabInstanceRoots": []
        };
        prefabData.push(rootPrefabInfo);

        return prefabData;
    }


    private async createNodeObject(nodeData: any, parentId: number | null, prefabData: any[], currentId: number): Promise<{ node: any; nextId: number }> {
        const nodeId = currentId++;
        
        // 노드 기본 속성 추출 - query-node-tree 데이터 형식에 맞춤
        const getValue = (prop: any) => {
            if (prop?.value !== undefined) return prop.value;
            if (prop !== undefined) return prop;
            return null;
        };
        
        const position = getValue(nodeData.position) || getValue(nodeData.value?.position) || { x: 0, y: 0, z: 0 };
        const rotation = getValue(nodeData.rotation) || getValue(nodeData.value?.rotation) || { x: 0, y: 0, z: 0, w: 1 };
        const scale = getValue(nodeData.scale) || getValue(nodeData.value?.scale) || { x: 1, y: 1, z: 1 };
        const active = getValue(nodeData.active) ?? getValue(nodeData.value?.active) ?? true;
        const name = getValue(nodeData.name) || getValue(nodeData.value?.name) || 'Node';
        const layer = getValue(nodeData.layer) || getValue(nodeData.value?.layer) || 33554432;

        const node: any = {
            "__type__": "cc.Node",
            "_name": name,
            "_objFlags": 0,
            "__editorExtras__": {},
            "_parent": parentId !== null ? { "__id__": parentId } : null,
            "_children": [],
            "_active": active,
            "_components": [],
            "_prefab": parentId === null ? {
                "__id__": currentId++
            } : null,
            "_lpos": {
                "__type__": "cc.Vec3",
                "x": position.x,
                "y": position.y,
                "z": position.z
            },
            "_lrot": {
                "__type__": "cc.Quat",
                "x": rotation.x,
                "y": rotation.y,
                "z": rotation.z,
                "w": rotation.w
            },
            "_lscale": {
                "__type__": "cc.Vec3",
                "x": scale.x,
                "y": scale.y,
                "z": scale.z
            },
            "_mobility": 0,
            "_layer": layer,
            "_euler": {
                "__type__": "cc.Vec3",
                "x": 0,
                "y": 0,
                "z": 0
            },
            "_id": ""
        };

        // _getDependComponent 오류 방지를 위해 UITransform 컴포넌트 임시 건너뜀
        // 이후 Engine API로 동적 추가
        console.log(`节点 ${name} 暂时跳过UITransform组件，避免引擎依赖错误`);
        
        // 다른 컴포넌트 처리(임시 건너뜀, UITransform 문제 해결에 집중)
        const components = this.extractComponentsFromNode(nodeData);
        if (components.length > 0) {
            console.log(`节点 ${name} 包含 ${components.length} 个其他组件，暂时跳过以专注于UITransform修复`);
        }

        // 자식 노드 처리 - query-node-tree로 얻은 전체 구조 사용
        const childrenToProcess = this.getChildrenToProcess(nodeData);
        if (childrenToProcess.length > 0) {
            console.log(`=== 处理子节点 ===`);
            console.log(`节点 ${name} 包含 ${childrenToProcess.length} 个子节点`);
            
            for (let i = 0; i < childrenToProcess.length; i++) {
                const childData = childrenToProcess[i];
                const childName = childData.name || childData.value?.name || '未知';
                console.log(`处理第${i + 1}个子节点: ${childName}`);
                
                try {
                    const childId = currentId;
                    node._children.push({ "__id__": childId });
                    
                    // 자식 노드 재귀 생성
                    const childResult = await this.createNodeObject(childData, nodeId, prefabData, currentId);
                    prefabData.push(childResult.node);
                    currentId = childResult.nextId;
                    
                    // 자식 노드는 PrefabInfo가 필요 없고 루트 노드만 필요
                    // 자식 노드의 _prefab은 null로 설정해야 함
                    childResult.node._prefab = null;
                    
                    console.log(`✅ 成功添加子节点: ${childName}`);
                } catch (error) {
                    console.error(`处理子节点 ${childName} 时出错:`, error);
                }
            }
        }

        return { node, nextId: currentId };
    }

    // 노드 데이터에서 컴포넌트 정보 추출
    private extractComponentsFromNode(nodeData: any): any[] {
        const components: any[] = [];
        
        // 여러 위치에서 컴포넌트 데이터 획득 시도
        const componentSources = [
            nodeData.__comps__,
            nodeData.components,
            nodeData.value?.__comps__,
            nodeData.value?.components
        ];
        
        for (const source of componentSources) {
            if (Array.isArray(source)) {
                components.push(...source.filter(comp => comp && (comp.__type__ || comp.type)));
                break; // 컴포넌트배열
            }
        }
        
        return components;
    }
    
    // 표준 컴포넌트 객체 생성
    private createStandardComponentObject(componentData: any, nodeId: number, prefabInfoId: number): any {
        const componentType = componentData.__type__ || componentData.type;
        
        if (!componentType) {
            console.warn('组件缺少类型信息:', componentData);
            return null;
        }
        
        // 기본 컴포넌트 구조 - 공식 프리팹 형식 기반
        const component: any = {
            "__type__": componentType,
            "_name": "",
            "_objFlags": 0,
            "node": {
                "__id__": nodeId
            },
            "_enabled": this.getComponentPropertyValue(componentData, 'enabled', true),
            "__prefab": {
                "__id__": prefabInfoId
            }
        };
        
        // 컴포넌트 타입에 따라 특정 속성 추가
        this.addComponentSpecificProperties(component, componentData, componentType);
        
        // _id 속성 추가
        component._id = "";
        
        return component;
    }
    
    // 컴포넌트 전용 속성 추가
    private addComponentSpecificProperties(component: any, componentData: any, componentType: string): void {
        switch (componentType) {
            case 'cc.UITransform':
                this.addUITransformProperties(component, componentData);
                break;
            case 'cc.Sprite':
                this.addSpriteProperties(component, componentData);
                break;
            case 'cc.Label':
                this.addLabelProperties(component, componentData);
                break;
            case 'cc.Button':
                this.addButtonProperties(component, componentData);
                break;
            default:
                // 알 수 없는 타입 컴포넌트는 안전한 속성만 복사
                this.addGenericProperties(component, componentData);
                break;
        }
    }
    
    // UITransform 컴포넌트 속성
    private addUITransformProperties(component: any, componentData: any): void {
        component._contentSize = this.createSizeObject(
            this.getComponentPropertyValue(componentData, 'contentSize', { width: 100, height: 100 })
        );
        component._anchorPoint = this.createVec2Object(
            this.getComponentPropertyValue(componentData, 'anchorPoint', { x: 0.5, y: 0.5 })
        );
    }
    
    // Sprite 컴포넌트 속성
    private addSpriteProperties(component: any, componentData: any): void {
        component._visFlags = 0;
        component._customMaterial = null;
        component._srcBlendFactor = 2;
        component._dstBlendFactor = 4;
        component._color = this.createColorObject(
            this.getComponentPropertyValue(componentData, 'color', { r: 255, g: 255, b: 255, a: 255 })
        );
        component._spriteFrame = this.getComponentPropertyValue(componentData, 'spriteFrame', null);
        component._type = this.getComponentPropertyValue(componentData, 'type', 0);
        component._fillType = 0;
        component._sizeMode = this.getComponentPropertyValue(componentData, 'sizeMode', 1);
        component._fillCenter = this.createVec2Object({ x: 0, y: 0 });
        component._fillStart = 0;
        component._fillRange = 0;
        component._isTrimmedMode = true;
        component._useGrayscale = false;
        component._atlas = null;
    }
    
    // Label 컴포넌트 속성
    private addLabelProperties(component: any, componentData: any): void {
        component._visFlags = 0;
        component._customMaterial = null;
        component._srcBlendFactor = 2;
        component._dstBlendFactor = 4;
        component._color = this.createColorObject(
            this.getComponentPropertyValue(componentData, 'color', { r: 0, g: 0, b: 0, a: 255 })
        );
        component._string = this.getComponentPropertyValue(componentData, 'string', 'Label');
        component._horizontalAlign = 1;
        component._verticalAlign = 1;
        component._actualFontSize = 20;
        component._fontSize = this.getComponentPropertyValue(componentData, 'fontSize', 20);
        component._fontFamily = 'Arial';
        component._lineHeight = 40;
        component._overflow = 1;
        component._enableWrapText = false;
        component._font = null;
        component._isSystemFontUsed = true;
        component._isItalic = false;
        component._isBold = false;
        component._isUnderline = false;
        component._underlineHeight = 2;
        component._cacheMode = 0;
    }
    
    // Button 컴포넌트 속성
    private addButtonProperties(component: any, componentData: any): void {
        component.clickEvents = [];
        component._interactable = true;
        component._transition = 2;
        component._normalColor = this.createColorObject({ r: 214, g: 214, b: 214, a: 255 });
        component._hoverColor = this.createColorObject({ r: 211, g: 211, b: 211, a: 255 });
        component._pressedColor = this.createColorObject({ r: 255, g: 255, b: 255, a: 255 });
        component._disabledColor = this.createColorObject({ r: 124, g: 124, b: 124, a: 255 });
        component._duration = 0.1;
        component._zoomScale = 1.2;
    }
    
    // 공통 속성 추가
    private addGenericProperties(component: any, componentData: any): void {
        // 안전하고 알려진 속성만 복사
        const safeProperties = ['enabled', 'color', 'string', 'fontSize', 'spriteFrame', 'type', 'sizeMode'];
        
        for (const prop of safeProperties) {
            if (componentData.hasOwnProperty(prop)) {
                const value = this.getComponentPropertyValue(componentData, prop);
                if (value !== undefined) {
                    component[`_${prop}`] = value;
                }
            }
        }
    }
    
    // Vec2 객체 생성
    private createVec2Object(data: any): any {
        return {
            "__type__": "cc.Vec2",
            "x": data?.x || 0,
            "y": data?.y || 0
        };
    }
    
    // Vec3 객체 생성
    private createVec3Object(data: any): any {
        return {
            "__type__": "cc.Vec3",
            "x": data?.x || 0,
            "y": data?.y || 0,
            "z": data?.z || 0
        };
    }
    
    // Size 객체 생성
    private createSizeObject(data: any): any {
        return {
            "__type__": "cc.Size",
            "width": data?.width || 100,
            "height": data?.height || 100
        };
    }
    
    // Color 객체 생성
    private createColorObject(data: any): any {
        return {
            "__type__": "cc.Color",
            "r": data?.r ?? 255,
            "g": data?.g ?? 255,
            "b": data?.b ?? 255,
            "a": data?.a ?? 255
        };
    }

    // 컴포넌트 속성 복사 여부 판단
    private shouldCopyComponentProperty(key: string, value: any): boolean {
        // 내부 속성 및 이미 처리된 속성 건너뜀
        if (key.startsWith('__') || key === '_enabled' || key === 'node' || key === 'enabled') {
            return false;
        }
        
        // 함수와 undefined 값 건너뜀
        if (typeof value === 'function' || value === undefined) {
            return false;
        }
        
        return true;
    }


    // 컴포넌트 속성값 획득 - 충돌 방지를 위해 이름 변경
    private getComponentPropertyValue(componentData: any, propertyName: string, defaultValue?: any): any {
        // 속성을 직접 획득 시도
        if (componentData[propertyName] !== undefined) {
            return this.extractValue(componentData[propertyName]);
        }
        
        // value 속성에서 획득 시도
        if (componentData.value && componentData.value[propertyName] !== undefined) {
            return this.extractValue(componentData.value[propertyName]);
        }
        
        // 밑줄 접두사 속성명으로 시도
        const prefixedName = `_${propertyName}`;
        if (componentData[prefixedName] !== undefined) {
            return this.extractValue(componentData[prefixedName]);
        }
        
        return defaultValue;
    }
    
    // 속성값 추출
    private extractValue(data: any): any {
        if (data === null || data === undefined) {
            return data;
        }
        
        // value 속성이 있으면 value를 우선 사용
        if (typeof data === 'object' && data.hasOwnProperty('value')) {
            return data.value;
        }
        
        // 참조 객체라면 원형 유지
        if (typeof data === 'object' && (data.__id__ !== undefined || data.__uuid__ !== undefined)) {
            return data;
        }
        
        return data;
    }

    private createStandardMetaData(prefabName: string, prefabUuid: string): any {
        return {
            "ver": "1.1.50",
            "importer": "prefab",
            "imported": true,
            "uuid": prefabUuid,
            "files": [
                ".json"
            ],
            "subMetas": {},
            "userData": {
                "syncNodeName": prefabName
            }
        };
    }

    private async savePrefabWithMeta(prefabPath: string, prefabData: any[], metaData: any): Promise<{ success: boolean; error?: string }> {
        try {
            const prefabContent = JSON.stringify(prefabData, null, 2);
            const metaContent = JSON.stringify(metaData, null, 2);

            // 경로가 .prefab으로 끝나도록 보장
            const finalPrefabPath = prefabPath.endsWith('.prefab') ? prefabPath : `${prefabPath}.prefab`;
            const metaPath = `${finalPrefabPath}.meta`;

            // asset-db API로 프리팹 파일 생성
            await new Promise((resolve, reject) => {
                Editor.Message.request('asset-db', 'create-asset', finalPrefabPath, prefabContent).then(() => {
                    resolve(true);
                }).catch((error: any) => {
                    reject(error);
                });
            });

            // meta 파일 생성
            await new Promise((resolve, reject) => {
                Editor.Message.request('asset-db', 'create-asset', metaPath, metaContent).then(() => {
                    resolve(true);
                }).catch((error: any) => {
                    reject(error);
                });
            });

            console.log(`=== 预制体保存完成 ===`);
            console.log(`预制体文件已保存: ${finalPrefabPath}`);
            console.log(`Meta文件已保存: ${metaPath}`);
            console.log(`预制体数组总长度: ${prefabData.length}`);
            console.log(`预制体根节点索引: ${prefabData.length - 1}`);

            return { success: true };
        } catch (error: any) {
            console.error('保存预制体文件时出错:', error);
            return { success: false, error: error.message };
        }
    }

}