import { ToolDefinition, ToolResponse, ToolExecutor, ComponentInfo } from '../types';

export class ComponentTools implements ToolExecutor {
    getTools(): ToolDefinition[] {
        return [
            {
                name: 'add_component',
                description: 'Add a component to a specific node. IMPORTANT: You must provide the nodeUuid parameter to specify which node to add the component to.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        nodeUuid: {
                            type: 'string',
                            description: 'Target node UUID. REQUIRED: You must specify the exact node to add the component to. Use get_all_nodes or find_node_by_name to get the UUID of the desired node.'
                        },
                        componentType: {
                            type: 'string',
                            description: 'Component type (e.g., cc.Sprite, cc.Label, cc.Button)'
                        }
                    },
                    required: ['nodeUuid', 'componentType']
                }
            },
            {
                name: 'remove_component',
                description: 'Remove a component from a node. componentType must be the component\'s classId (cid, i.e. the type field from getComponents), not the script name or class name. Use getComponents to get the correct cid.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        nodeUuid: {
                            type: 'string',
                            description: 'Node UUID'
                        },
                        componentType: {
                            type: 'string',
                            description: 'Component cid (type field from getComponents). Do NOT use script name or class name. Example: "cc.Sprite" or "9b4a7ueT9xD6aRE+AlOusy1"'
                        }
                    },
                    required: ['nodeUuid', 'componentType']
                }
            },
            {
                name: 'get_components',
                description: 'Get all components of a node',
                inputSchema: {
                    type: 'object',
                    properties: {
                        nodeUuid: {
                            type: 'string',
                            description: 'Node UUID'
                        }
                    },
                    required: ['nodeUuid']
                }
            },
            {
                name: 'get_component_info',
                description: 'Get specific component information',
                inputSchema: {
                    type: 'object',
                    properties: {
                        nodeUuid: {
                            type: 'string',
                            description: 'Node UUID'
                        },
                        componentType: {
                            type: 'string',
                            description: 'Component type to get info for'
                        }
                    },
                    required: ['nodeUuid', 'componentType']
                }
            },
            {
                name: 'set_component_property',
                description: 'Set component property values for UI components or custom script components. Supports setting properties of built-in UI components (e.g., cc.Label, cc.Sprite) and custom script components. Note: For node basic properties (name, active, layer, etc.), use set_node_property. For node transform properties (position, rotation, scale, etc.), use set_node_transform.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        nodeUuid: {
                            type: 'string',
                            description: 'Target node UUID - Must specify the node to operate on'
                        },
                        componentType: {
                            type: 'string',
                            description: 'Component type - Can be built-in components (e.g., cc.Label) or custom script components (e.g., MyScript). If unsure about component type, use get_components first to retrieve all components on the node.',
                            // enum 제한을 제거해 사용자 스크립트를 포함한 임의 컴포넌트 타입 허용
                        },
                        property: {
                            type: 'string',
                            description: 'Property name - The property to set. Common properties include:\n' +
                                '• cc.Label: string (text content), fontSize (font size), color (text color)\n' +
                                '• cc.Sprite: spriteFrame (sprite frame), color (tint color), sizeMode (size mode)\n' +
                                '• cc.Button: normalColor (normal color), pressedColor (pressed color), target (target node)\n' +
                                '• cc.UITransform: contentSize (content size), anchorPoint (anchor point)\n' +
                                '• Custom Scripts: Based on properties defined in the script'
                        },
                        propertyType: {
                            type: 'string',
                            description: 'Property type - Must explicitly specify the property data type for correct value conversion and validation',
                            enum: [
                                'string', 'number', 'boolean', 'integer', 'float',
                                'color', 'vec2', 'vec3', 'size',
                                'node', 'component', 'spriteFrame', 'prefab', 'asset',
                                'nodeArray', 'colorArray', 'numberArray', 'stringArray'
                            ]
                                                },

                        value: {
                            description: 'Property value - Use the corresponding data format based on propertyType:\n\n' +
                                '📝 Basic Data Types:\n' +
                                '• string: "Hello World" (text string)\n' +
                                '• number/integer/float: 42 or 3.14 (numeric value)\n' +
                                '• boolean: true or false (boolean value)\n\n' +
                                '🎨 Color Type:\n' +
                                '• color: {"r":255,"g":0,"b":0,"a":255} (RGBA values, range 0-255)\n' +
                                '  - Alternative: "#FF0000" (hexadecimal format)\n' +
                                '  - Transparency: a value controls opacity, 255 = fully opaque, 0 = fully transparent\n\n' +
                                '📐 Vector and Size Types:\n' +
                                '• vec2: {"x":100,"y":50} (2D vector)\n' +
                                '• vec3: {"x":1,"y":2,"z":3} (3D vector)\n' +
                                '• size: {"width":100,"height":50} (size dimensions)\n\n' +
                                '🔗 Reference Types (using UUID strings):\n' +
                                '• node: "target-node-uuid" (node reference)\n' +
                                '  How to get: Use get_all_nodes or find_node_by_name to get node UUIDs\n' +
                                '• component: "target-node-uuid" (component reference)\n' +
                                '  How it works: \n' +
                                '    1. Provide the UUID of the NODE that contains the target component\n' +
                                '    2. System auto-detects required component type from property metadata\n' +
                                '    3. Finds the component on target node and gets its scene __id__\n' +
                                '    4. Sets reference using the scene __id__ (not node UUID)\n' +
                                '  Example: value="label-node-uuid" will find cc.Label and use its scene ID\n' +
                                '• spriteFrame: "spriteframe-uuid" (sprite frame asset)\n' +
                                '  How to get: Check asset database or use asset browser\n' +
                                '• prefab: "prefab-uuid" (prefab asset)\n' +
                                '  How to get: Check asset database or use asset browser\n' +
                                '• asset: "asset-uuid" (generic asset reference)\n' +
                                '  How to get: Check asset database or use asset browser\n\n' +
                                '📋 Array Types:\n' +
                                '• nodeArray: ["uuid1","uuid2"] (array of node UUIDs)\n' +
                                '• colorArray: [{"r":255,"g":0,"b":0,"a":255}] (array of colors)\n' +
                                '• numberArray: [1,2,3,4,5] (array of numbers)\n' +
                                '• stringArray: ["item1","item2"] (array of strings)'
                        }
                    },
                    required: ['nodeUuid', 'componentType', 'property', 'propertyType', 'value']
                }
            },
            {
                name: 'attach_script',
                description: 'Attach a script component to a node',
                inputSchema: {
                    type: 'object',
                    properties: {
                        nodeUuid: {
                            type: 'string',
                            description: 'Node UUID'
                        },
                        scriptPath: {
                            type: 'string',
                            description: 'Script asset path (e.g., db://assets/scripts/MyScript.ts)'
                        }
                    },
                    required: ['nodeUuid', 'scriptPath']
                }
            },
            {
                name: 'get_available_components',
                description: 'Get list of available component types',
                inputSchema: {
                    type: 'object',
                    properties: {
                        category: {
                            type: 'string',
                            description: 'Component category filter',
                            enum: ['all', 'renderer', 'ui', 'physics', 'animation', 'audio'],
                            default: 'all'
                        }
                    }
                }
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'add_component':
                return await this.addComponent(args.nodeUuid, args.componentType);
            case 'remove_component':
                return await this.removeComponent(args.nodeUuid, args.componentType);
            case 'get_components':
                return await this.getComponents(args.nodeUuid);
            case 'get_component_info':
                return await this.getComponentInfo(args.nodeUuid, args.componentType);
            case 'set_component_property':
                return await this.setComponentProperty(args);
            case 'attach_script':
                return await this.attachScript(args.nodeUuid, args.scriptPath);
            case 'get_available_components':
                return await this.getAvailableComponents(args.category);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    private async addComponent(nodeUuid: string, componentType: string): Promise<ToolResponse> {
        return new Promise(async (resolve) => {
            // 먼저 노드에 해당 컴포넌트가 이미 있는지 확인
            const allComponentsInfo = await this.getComponents(nodeUuid);
            if (allComponentsInfo.success && allComponentsInfo.data?.components) {
                const existingComponent = allComponentsInfo.data.components.find((comp: any) => comp.type === componentType);
                if (existingComponent) {
                    resolve({
                        success: true,
                        message: `Component '${componentType}' already exists on node`,
                        data: {
                            nodeUuid: nodeUuid,
                            componentType: componentType,
                            componentVerified: true,
                            existing: true
                        }
                    });
                    return;
                }
            }
            // Editor API로 컴포넌트 직접 추가 시도
            Editor.Message.request('scene', 'create-component', {
                uuid: nodeUuid,
                component: componentType
            }).then(async (result: any) => {
                // Editor가 컴포넌트 추가를 완료할 때까지 잠시 대기
                await new Promise(resolve => setTimeout(resolve, 100));
                // 노드 정보를 다시 조회해 컴포넌트가 실제로 추가됐는지 검증
                try {
                    const allComponentsInfo2 = await this.getComponents(nodeUuid);
                    if (allComponentsInfo2.success && allComponentsInfo2.data?.components) {
                        const addedComponent = allComponentsInfo2.data.components.find((comp: any) => comp.type === componentType);
                        if (addedComponent) {
                            resolve({
                                success: true,
                                message: `Component '${componentType}' added successfully`,
                                data: {
                                    nodeUuid: nodeUuid,
                                    componentType: componentType,
                                    componentVerified: true,
                                    existing: false
                                }
                            });
                        } else {
                            resolve({
                                success: false,
                                error: `Component '${componentType}' was not found on node after addition. Available components: ${allComponentsInfo2.data.components.map((c: any) => c.type).join(', ')}`
                            });
                        }
                    } else {
                        resolve({
                            success: false,
                            error: `Failed to verify component addition: ${allComponentsInfo2.error || 'Unable to get node components'}`
                        });
                    }
                } catch (verifyError: any) {
                    resolve({
                        success: false,
                        error: `Failed to verify component addition: ${verifyError.message}`
                    });
                }
            }).catch((err: Error) => {
                // 대안: 씬 스크립트 사용
                const options = {
                    name: 'cocos-mcp-server',
                    method: 'addComponentToNode',
                    args: [nodeUuid, componentType]
                };
                Editor.Message.request('scene', 'execute-scene-script', options).then((result: any) => {
                    resolve(result);
                }).catch((err2: Error) => {
                    resolve({ success: false, error: `Direct API failed: ${err.message}, Scene script failed: ${err2.message}` });
                });
            });
        });
    }

    private async removeComponent(nodeUuid: string, componentType: string): Promise<ToolResponse> {
        return new Promise(async (resolve) => {
            // 1. 노드의 모든 컴포넌트 조회
            const allComponentsInfo = await this.getComponents(nodeUuid);
            if (!allComponentsInfo.success || !allComponentsInfo.data?.components) {
                resolve({ success: false, error: `Failed to get components for node '${nodeUuid}': ${allComponentsInfo.error}` });
                return;
            }
            // 2. type 필드가 componentType인 컴포넌트만 조회(cid)
            const exists = allComponentsInfo.data.components.some((comp: any) => comp.type === componentType);
            if (!exists) {
                resolve({ success: false, error: `Component cid '${componentType}' not found on node '${nodeUuid}'. 请用getComponents获取type字段（cid）作为componentType。` });
                return;
            }
            // 3. 공식 API로 직접 제거
            try {
                await Editor.Message.request('scene', 'remove-component', {
                    uuid: nodeUuid,
                    component: componentType
                });
                // 4. 다시 조회해 제거 여부 확인
                const afterRemoveInfo = await this.getComponents(nodeUuid);
                const stillExists = afterRemoveInfo.success && afterRemoveInfo.data?.components?.some((comp: any) => comp.type === componentType);
                if (stillExists) {
                    resolve({ success: false, error: `Component cid '${componentType}' was not removed from node '${nodeUuid}'.` });
                } else {
                    resolve({
                        success: true,
                        message: `Component cid '${componentType}' removed successfully from node '${nodeUuid}'`,
                        data: { nodeUuid, componentType }
                    });
                }
            } catch (err: any) {
                resolve({ success: false, error: `Failed to remove component: ${err.message}` });
            }
        });
    }

    private async getComponents(nodeUuid: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            // 우선 Editor API로 노드 정보 직접 조회 시도
            Editor.Message.request('scene', 'query-node', nodeUuid).then((nodeData: any) => {
                if (nodeData && nodeData.__comps__) {
                    const components = nodeData.__comps__.map((comp: any) => ({
                        type: comp.__type__ || comp.cid || comp.type || 'Unknown',
                        uuid: comp.uuid?.value || comp.uuid || null,
                        enabled: comp.enabled !== undefined ? comp.enabled : true,
                        properties: this.extractComponentProperties(comp)
                    }));
                    
                    resolve({
                        success: true,
                        data: {
                            nodeUuid: nodeUuid,
                            components: components
                        }
                    });
                } else {
                    resolve({ success: false, error: 'Node not found or no components data' });
                }
            }).catch((err: Error) => {
                // 대안: 씬 스크립트 사용
                const options = {
                    name: 'cocos-mcp-server',
                    method: 'getNodeInfo',
                    args: [nodeUuid]
                };
                
                Editor.Message.request('scene', 'execute-scene-script', options).then((result: any) => {
                    if (result.success) {
                        resolve({
                            success: true,
                            data: result.data.components
                        });
                    } else {
                        resolve(result);
                    }
                }).catch((err2: Error) => {
                    resolve({ success: false, error: `Direct API failed: ${err.message}, Scene script failed: ${err2.message}` });
                });
            });
        });
    }

    private async getComponentInfo(nodeUuid: string, componentType: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            // 우선 Editor API로 노드 정보 직접 조회 시도
            Editor.Message.request('scene', 'query-node', nodeUuid).then((nodeData: any) => {
                if (nodeData && nodeData.__comps__) {
                    const component = nodeData.__comps__.find((comp: any) => {
                        const compType = comp.__type__ || comp.cid || comp.type;
                        return compType === componentType;
                    });
                    
                    if (component) {
                        resolve({
                            success: true,
                            data: {
                                nodeUuid: nodeUuid,
                                componentType: componentType,
                                enabled: component.enabled !== undefined ? component.enabled : true,
                                properties: this.extractComponentProperties(component)
                            }
                        });
                    } else {
                        resolve({ success: false, error: `Component '${componentType}' not found on node` });
                    }
                } else {
                    resolve({ success: false, error: 'Node not found or no components data' });
                }
            }).catch((err: Error) => {
                // 대안: 씬 스크립트 사용
                const options = {
                    name: 'cocos-mcp-server',
                    method: 'getNodeInfo',
                    args: [nodeUuid]
                };
                
                Editor.Message.request('scene', 'execute-scene-script', options).then((result: any) => {
                    if (result.success && result.data.components) {
                        const component = result.data.components.find((comp: any) => comp.type === componentType);
                        if (component) {
                            resolve({
                                success: true,
                                data: {
                                    nodeUuid: nodeUuid,
                                    componentType: componentType,
                                    ...component
                                }
                            });
                        } else {
                            resolve({ success: false, error: `Component '${componentType}' not found on node` });
                        }
                    } else {
                        resolve({ success: false, error: result.error || 'Failed to get component info' });
                    }
                }).catch((err2: Error) => {
                    resolve({ success: false, error: `Direct API failed: ${err.message}, Scene script failed: ${err2.message}` });
                });
            });
        });
    }

    private extractComponentProperties(component: any): Record<string, any> {
        console.log(`[extractComponentProperties] Processing component:`, Object.keys(component));
        
        // 컴포넌트에 value 속성이 있는지 확인(보통 실제 컴포넌트 속성 포함)
        if (component.value && typeof component.value === 'object') {
            console.log(`[extractComponentProperties] Found component.value with properties:`, Object.keys(component.value));
            return component.value; // 직접 value , 컴포넌트속성
        }
        
        // 대안: 컴포넌트 객체에서 속성을 직접 추출
        const properties: Record<string, any> = {};
        const excludeKeys = ['__type__', 'enabled', 'node', '_id', '__scriptAsset', 'uuid', 'name', '_name', '_objFlags', '_enabled', 'type', 'readonly', 'visible', 'cid', 'editor', 'extends'];
        
        for (const key in component) {
            if (!excludeKeys.includes(key) && !key.startsWith('_')) {
                console.log(`[extractComponentProperties] Found direct property '${key}':`, typeof component[key]);
                properties[key] = component[key];
            }
        }
        
        console.log(`[extractComponentProperties] Final extracted properties:`, Object.keys(properties));
        return properties;
    }

    private async findComponentTypeByUuid(componentUuid: string): Promise<string | null> {
        console.log(`[findComponentTypeByUuid] Searching for component type with UUID: ${componentUuid}`);
        if (!componentUuid) {
            return null;
        }
        try {
            const nodeTree = await Editor.Message.request('scene', 'query-node-tree');
            if (!nodeTree) {
                console.warn('[findComponentTypeByUuid] Failed to query node tree.');
                return null;
            }

            const queue: any[] = [nodeTree];
            
            while (queue.length > 0) {
                const currentNodeInfo = queue.shift();
                if (!currentNodeInfo || !currentNodeInfo.uuid) {
                    continue;
                }

                try {
                    const fullNodeData = await Editor.Message.request('scene', 'query-node', currentNodeInfo.uuid);
                    if (fullNodeData && fullNodeData.__comps__) {
                        for (const comp of fullNodeData.__comps__) {
                            const compAny = comp as any; // Cast to any to access dynamic properties
                            // The component UUID is nested in the 'value' property
                            if (compAny.uuid && compAny.uuid.value === componentUuid) {
                                const componentType = compAny.__type__;
                                console.log(`[findComponentTypeByUuid] Found component type '${componentType}' for UUID ${componentUuid} on node ${fullNodeData.name?.value}`);
                                return componentType;
                            }
                        }
                    }
                } catch (e) {
                    console.warn(`[findComponentTypeByUuid] Could not query node ${currentNodeInfo.uuid}:`, e);
                }

                if (currentNodeInfo.children) {
                    for (const child of currentNodeInfo.children) {
                        queue.push(child);
                    }
                }
            }

            console.warn(`[findComponentTypeByUuid] Component with UUID ${componentUuid} not found in scene tree.`);
            return null;
        } catch (error) {
            console.error(`[findComponentTypeByUuid] Error while searching for component type:`, error);
            return null;
        }
    }

    private async setComponentProperty(args: any): Promise<ToolResponse> {
                        const { nodeUuid, componentType, property, propertyType, value } = args;
        
        return new Promise(async (resolve) => {
            try {
                console.log(`[ComponentTools] Setting ${componentType}.${property} (type: ${propertyType}) = ${JSON.stringify(value)} on node ${nodeUuid}`);
                
                // Step 0: 노드 속성인지 감지하고, 맞으면 해당 노드 메서드로 리디렉션
                const nodeRedirectResult = await this.checkAndRedirectNodeProperties(args);
                if (nodeRedirectResult) {
                    resolve(nodeRedirectResult);
                    return;
                }
                
                // Step 1: 가져오기컴포넌트 , getComponents
                const componentsResponse = await this.getComponents(nodeUuid);
                if (!componentsResponse.success || !componentsResponse.data) {
                    resolve({
                        success: false,
                        error: `Failed to get components for node '${nodeUuid}': ${componentsResponse.error}`,
                        instruction: `Please verify that node UUID '${nodeUuid}' is correct. Use get_all_nodes or find_node_by_name to get the correct node UUID.`
                    });
                    return;
                }
                
                const allComponents = componentsResponse.data.components;
                
                // Step 2: 컴포넌트
                let targetComponent = null;
                const availableTypes: string[] = [];
                
                for (let i = 0; i < allComponents.length; i++) {
                    const comp = allComponents[i];
                    availableTypes.push(comp.type);
                    
                    if (comp.type === componentType) {
                        targetComponent = comp;
                        break;
                    }
                }
                
                if (!targetComponent) {
                    // 오류
                    const instruction = this.generateComponentSuggestion(componentType, availableTypes, property);
                    resolve({
                        success: false,
                        error: `Component '${componentType}' not found on node. Available components: ${availableTypes.join(', ')}`,
                        instruction: instruction
                    });
                    return;
                }
                
                // Step 3: 변환속성
                let propertyInfo;
                try {
                    console.log(`[ComponentTools] Analyzing property: ${property}`);
                    propertyInfo = this.analyzeProperty(targetComponent, property);
                } catch (analyzeError: any) {
                    console.error(`[ComponentTools] Error in analyzeProperty:`, analyzeError);
                    resolve({
                        success: false,
                        error: `Failed to analyze property '${property}': ${analyzeError.message}`
                    });
                    return;
                }
                
                if (!propertyInfo.exists) {
                    resolve({
                        success: false,
                        error: `Property '${property}' not found on component '${componentType}'. Available properties: ${propertyInfo.availableProperties.join(', ')}`
                    });
                    return;
                }
                
                // Step 4: 처리속성 설정
                const originalValue = propertyInfo.originalValue;
                let processedValue: any;
                
                // propertyType처리속성
                switch (propertyType) {
                    case 'string':
                        processedValue = String(value);
                        break;
                    case 'number':
                    case 'integer':
                    case 'float':
                        processedValue = Number(value);
                        break;
                    case 'boolean':
                        processedValue = Boolean(value);
                        break;
                    case 'color':
                        if (typeof value === 'string') {
                            // 문자열 형식 지원: 16진수, 색상 이름, rgb()/rgba()
                            processedValue = this.parseColorString(value);
                        } else if (typeof value === 'object' && value !== null) {
                            // 객체 형식: RGBA 값을 검증하고 변환
                            processedValue = {
                                r: Math.min(255, Math.max(0, Number(value.r) || 0)),
                                g: Math.min(255, Math.max(0, Number(value.g) || 0)),
                                b: Math.min(255, Math.max(0, Number(value.b) || 0)),
                                a: value.a !== undefined ? Math.min(255, Math.max(0, Number(value.a))) : 255
                            };
                        } else {
                            throw new Error('Color value must be an object with r, g, b properties or a hexadecimal string (e.g., "#FF0000")');
                        }
                        break;
                    case 'vec2':
                        if (typeof value === 'object' && value !== null) {
                            processedValue = {
                                x: Number(value.x) || 0,
                                y: Number(value.y) || 0
                            };
                        } else {
                            throw new Error('Vec2 value must be an object with x, y properties');
                        }
                        break;
                    case 'vec3':
                        if (typeof value === 'object' && value !== null) {
                            processedValue = {
                                x: Number(value.x) || 0,
                                y: Number(value.y) || 0,
                                z: Number(value.z) || 0
                            };
                        } else {
                            throw new Error('Vec3 value must be an object with x, y, z properties');
                        }
                        break;
                    case 'size':
                        if (typeof value === 'object' && value !== null) {
                            processedValue = {
                                width: Number(value.width) || 0,
                                height: Number(value.height) || 0
                            };
                        } else {
                            throw new Error('Size value must be an object with width, height properties');
                        }
                        break;
                    case 'node':
                        if (typeof value === 'string') {
                            processedValue = { uuid: value };
                        } else {
                            throw new Error('Node reference value must be a string UUID');
                        }
                        break;
                    case 'component':
                        if (typeof value === 'string') {
                            // 컴포넌트참조 처리: 노드UUID 컴포넌트 __id__
                            processedValue = value; // 저장노드UUID, 변환 __id__
                        } else {
                            throw new Error('Component reference value must be a string (node UUID containing the target component)');
                        }
                        break;
                    case 'spriteFrame':
                    case 'prefab':
                    case 'asset':
                        if (typeof value === 'string') {
                            processedValue = { uuid: value };
                        } else {
                            throw new Error(`${propertyType} value must be a string UUID`);
                        }
                        break;
                    case 'nodeArray':
                        if (Array.isArray(value)) {
                            processedValue = value.map((item: any) => {
                                if (typeof item === 'string') {
                                    return { uuid: item };
                                } else {
                                    throw new Error('NodeArray items must be string UUIDs');
                                }
                            });
                        } else {
                            throw new Error('NodeArray value must be an array');
                        }
                        break;
                    case 'colorArray':
                        if (Array.isArray(value)) {
                            processedValue = value.map((item: any) => {
                                if (typeof item === 'object' && item !== null && 'r' in item) {
                                    return {
                                        r: Math.min(255, Math.max(0, Number(item.r) || 0)),
                                        g: Math.min(255, Math.max(0, Number(item.g) || 0)),
                                        b: Math.min(255, Math.max(0, Number(item.b) || 0)),
                                        a: item.a !== undefined ? Math.min(255, Math.max(0, Number(item.a))) : 255
                                    };
                                } else {
                                    return { r: 255, g: 255, b: 255, a: 255 };
                                }
                            });
                        } else {
                            throw new Error('ColorArray value must be an array');
                        }
                        break;
                    case 'numberArray':
                        if (Array.isArray(value)) {
                            processedValue = value.map((item: any) => Number(item));
                        } else {
                            throw new Error('NumberArray value must be an array');
                        }
                        break;
                    case 'stringArray':
                        if (Array.isArray(value)) {
                            processedValue = value.map((item: any) => String(item));
                        } else {
                            throw new Error('StringArray value must be an array');
                        }
                        break;
                    default:
                        throw new Error(`Unsupported property type: ${propertyType}`);
                }
                
                console.log(`[ComponentTools] Converting value: ${JSON.stringify(value)} -> ${JSON.stringify(processedValue)} (type: ${propertyType})`);
                console.log(`[ComponentTools] Property analysis result: propertyInfo.type="${propertyInfo.type}", propertyType="${propertyType}"`);
                console.log(`[ComponentTools] Will use color special handling: ${propertyType === 'color' && processedValue && typeof processedValue === 'object'}`);
                
                // 검증용 실제 기대값(컴포넌트 참조는 특별 처리 필요)
                let actualExpectedValue = processedValue;
                
                // Step 5: 가져오기 노드데이터 빌드 경로
                const rawNodeData = await Editor.Message.request('scene', 'query-node', nodeUuid);
                if (!rawNodeData || !rawNodeData.__comps__) {
                    resolve({
                        success: false,
                        error: `Failed to get raw node data for property setting`
                    });
                    return;
                }
                
                // 원본 컴포넌트 인덱스 찾기
                let rawComponentIndex = -1;
                for (let i = 0; i < rawNodeData.__comps__.length; i++) {
                    const comp = rawNodeData.__comps__[i] as any;
                    const compType = comp.__type__ || comp.cid || comp.type || 'Unknown';
                    if (compType === componentType) {
                        rawComponentIndex = i;
                        break;
                    }
                }
                
                if (rawComponentIndex === -1) {
                    resolve({
                        success: false,
                        error: `Could not find component index for setting property`
                    });
                    return;
                }
                
                // 올바른 속성 경로 구성
                let propertyPath = `__comps__.${rawComponentIndex}.${property}`;
                
                // 리소스 계열 속성 특별 처리
                if (propertyType === 'asset' || propertyType === 'spriteFrame' || propertyType === 'prefab' || 
                    (propertyInfo.type === 'asset' && propertyType === 'string')) {
                    
                    console.log(`[ComponentTools] Setting asset reference:`, {
                        value: processedValue,
                        property: property,
                        propertyType: propertyType,
                        path: propertyPath
                    });
                    
                    // Determine asset type based on property name
                    let assetType = 'cc.SpriteFrame'; // default
                    if (property.toLowerCase().includes('texture')) {
                        assetType = 'cc.Texture2D';
                    } else if (property.toLowerCase().includes('material')) {
                        assetType = 'cc.Material';
                    } else if (property.toLowerCase().includes('font')) {
                        assetType = 'cc.Font';
                    } else if (property.toLowerCase().includes('clip')) {
                        assetType = 'cc.AudioClip';
                    } else if (propertyType === 'prefab') {
                        assetType = 'cc.Prefab';
                    }
                    
                    await Editor.Message.request('scene', 'set-property', {
                        uuid: nodeUuid,
                        path: propertyPath,
                        dump: { 
                            value: processedValue,
                            type: assetType
                        }
                    });
                } else if (componentType === 'cc.UITransform' && (property === '_contentSize' || property === 'contentSize')) {
                    // Special handling for UITransform contentSize - set width and height separately
                    const width = Number(value.width) || 100;
                    const height = Number(value.height) || 100;
                    
                    // Set width first
                    await Editor.Message.request('scene', 'set-property', {
                        uuid: nodeUuid,
                        path: `__comps__.${rawComponentIndex}.width`,
                        dump: { value: width }
                    });
                    
                    // Then set height
                    await Editor.Message.request('scene', 'set-property', {
                        uuid: nodeUuid,
                        path: `__comps__.${rawComponentIndex}.height`,
                        dump: { value: height }
                    });
                } else if (componentType === 'cc.UITransform' && (property === '_anchorPoint' || property === 'anchorPoint')) {
                    // Special handling for UITransform anchorPoint - set anchorX and anchorY separately
                    const anchorX = Number(value.x) || 0.5;
                    const anchorY = Number(value.y) || 0.5;
                    
                    // Set anchorX first
                    await Editor.Message.request('scene', 'set-property', {
                        uuid: nodeUuid,
                        path: `__comps__.${rawComponentIndex}.anchorX`,
                        dump: { value: anchorX }
                    });
                    
                    // Then set anchorY  
                    await Editor.Message.request('scene', 'set-property', {
                        uuid: nodeUuid,
                        path: `__comps__.${rawComponentIndex}.anchorY`,
                        dump: { value: anchorY }
                    });
                } else if (propertyType === 'color' && processedValue && typeof processedValue === 'object') {
                    // 색상 속성 특별 처리, RGBA 값 정확성 보장
                    // Cocos Creator 색상 값 범위는 0-255
                    const colorValue = {
                        r: Math.min(255, Math.max(0, Number(processedValue.r) || 0)),
                        g: Math.min(255, Math.max(0, Number(processedValue.g) || 0)),
                        b: Math.min(255, Math.max(0, Number(processedValue.b) || 0)),
                        a: processedValue.a !== undefined ? Math.min(255, Math.max(0, Number(processedValue.a))) : 255
                    };
                    
                    console.log(`[ComponentTools] Setting color value:`, colorValue);
                    
                    await Editor.Message.request('scene', 'set-property', {
                        uuid: nodeUuid,
                        path: propertyPath,
                        dump: { 
                            value: colorValue,
                            type: 'cc.Color'
                        }
                    });
                } else if (propertyType === 'vec3' && processedValue && typeof processedValue === 'object') {
                    // Vec3 속성 특별 처리
                    const vec3Value = {
                        x: Number(processedValue.x) || 0,
                        y: Number(processedValue.y) || 0,
                        z: Number(processedValue.z) || 0
                    };
                    
                    await Editor.Message.request('scene', 'set-property', {
                        uuid: nodeUuid,
                        path: propertyPath,
                        dump: { 
                            value: vec3Value,
                            type: 'cc.Vec3'
                        }
                    });
                } else if (propertyType === 'vec2' && processedValue && typeof processedValue === 'object') {
                    // Vec2 속성 특별 처리
                    const vec2Value = {
                        x: Number(processedValue.x) || 0,
                        y: Number(processedValue.y) || 0
                    };
                    
                    await Editor.Message.request('scene', 'set-property', {
                        uuid: nodeUuid,
                        path: propertyPath,
                        dump: { 
                            value: vec2Value,
                            type: 'cc.Vec2'
                        }
                    });
                } else if (propertyType === 'size' && processedValue && typeof processedValue === 'object') {
                    // Size 속성 특별 처리
                    const sizeValue = {
                        width: Number(processedValue.width) || 0,
                        height: Number(processedValue.height) || 0
                    };
                    
                    await Editor.Message.request('scene', 'set-property', {
                        uuid: nodeUuid,
                        path: propertyPath,
                        dump: { 
                            value: sizeValue,
                            type: 'cc.Size'
                        }
                    });
                } else if (propertyType === 'node' && processedValue && typeof processedValue === 'object' && 'uuid' in processedValue) {
                    // 노드 참조 특별 처리
                    console.log(`[ComponentTools] Setting node reference with UUID: ${processedValue.uuid}`);
                    await Editor.Message.request('scene', 'set-property', {
                        uuid: nodeUuid,
                        path: propertyPath,
                        dump: { 
                            value: processedValue,
                            type: 'cc.Node'
                        }
                    });
                } else if (propertyType === 'component' && typeof processedValue === 'string') {
                    // 컴포넌트 참조 특별 처리: 노드 UUID로 컴포넌트 __id__ 찾기
                    const targetNodeUuid = processedValue;
                    console.log(`[ComponentTools] Setting component reference - finding component on node: ${targetNodeUuid}`);
                    
                    // 현재 컴포넌트의 속성 메타데이터에서 기대 컴포넌트 타입 획득
                    let expectedComponentType = '';
                    
                    // 현재 컴포넌트 상세 정보 획득(속성 메타데이터 포함)
                    const currentComponentInfo = await this.getComponentInfo(nodeUuid, componentType);
                    if (currentComponentInfo.success && currentComponentInfo.data?.properties?.[property]) {
                        const propertyMeta = currentComponentInfo.data.properties[property];
                        
                        // 속성 메타데이터에서 컴포넌트 타입 정보 추출
                        if (propertyMeta && typeof propertyMeta === 'object') {
                            // type 필드가 컴포넌트 타입을 가리키는지 확인
                            if (propertyMeta.type) {
                                expectedComponentType = propertyMeta.type;
                            } else if (propertyMeta.ctor) {
                                // 일부 속성은 ctor 필드를 사용할 수 있음
                                expectedComponentType = propertyMeta.ctor;
                            } else if (propertyMeta.extends && Array.isArray(propertyMeta.extends)) {
                                // extends 배열 확인(보통 첫 번째가 가장 구체적 타입)
                                for (const extendType of propertyMeta.extends) {
                                    if (extendType.startsWith('cc.') && extendType !== 'cc.Component' && extendType !== 'cc.Object') {
                                        expectedComponentType = extendType;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    
                    if (!expectedComponentType) {
                        throw new Error(`Unable to determine required component type for property '${property}' on component '${componentType}'. Property metadata may not contain type information.`);
                    }
                    
                    console.log(`[ComponentTools] Detected required component type: ${expectedComponentType} for property: ${property}`);
                    
                    try {
                        // 대상 노드의 컴포넌트 정보 획득
                        const targetNodeData = await Editor.Message.request('scene', 'query-node', targetNodeUuid);
                        if (!targetNodeData || !targetNodeData.__comps__) {
                            throw new Error(`Target node ${targetNodeUuid} not found or has no components`);
                        }
                        
                        // 대상 노드 컴포넌트 개요 출력
                        console.log(`[ComponentTools] Target node ${targetNodeUuid} has ${targetNodeData.__comps__.length} components:`);
                        targetNodeData.__comps__.forEach((comp: any, index: number) => {
                            const sceneId = comp.value && comp.value.uuid && comp.value.uuid.value ? comp.value.uuid.value : 'unknown';
                            console.log(`[ComponentTools] Component ${index}: ${comp.type} (scene_id: ${sceneId})`);
                        });
                        
                        // 해당 컴포넌트 찾기
                        let targetComponent = null;
                        let componentId: string | null = null;
                        
                        // 대상 노드의 _components 배열에서 지정 타입 컴포넌트 검색
                        // 주의: __comps__와 _components 인덱스는 대응됨
                        console.log(`[ComponentTools] Searching for component type: ${expectedComponentType}`);
                        
                        for (let i = 0; i < targetNodeData.__comps__.length; i++) {
                            const comp = targetNodeData.__comps__[i] as any;
                            console.log(`[ComponentTools] Checking component ${i}: type=${comp.type}, target=${expectedComponentType}`);
                            
                            if (comp.type === expectedComponentType) {
                                targetComponent = comp;
                                console.log(`[ComponentTools] Found matching component at index ${i}: ${comp.type}`);
                                
                                // 컴포넌트의 value.uuid.value에서 씬 내 ID 획득
                                if (comp.value && comp.value.uuid && comp.value.uuid.value) {
                                    componentId = comp.value.uuid.value;
                                    console.log(`[ComponentTools] Got componentId from comp.value.uuid.value: ${componentId}`);
                                } else {
                                    console.log(`[ComponentTools] Component structure:`, {
                                        hasValue: !!comp.value,
                                        hasUuid: !!(comp.value && comp.value.uuid),
                                        hasUuidValue: !!(comp.value && comp.value.uuid && comp.value.uuid.value),
                                        uuidStructure: comp.value ? comp.value.uuid : 'No value'
                                    });
                                    throw new Error(`Unable to extract component ID from component structure`);
                                }
                                
                                break;
                            }
                        }
                        
                        if (!targetComponent) {
                            // 못 찾으면 사용 가능한 컴포넌트 목록과 씬의 실제 ID를 표시
                            const availableComponents = targetNodeData.__comps__.map((comp: any, index: number) => {
                                let sceneId = 'unknown';
                                // 컴포넌트의 value.uuid.value에서 씬 ID 획득
                                if (comp.value && comp.value.uuid && comp.value.uuid.value) {
                                    sceneId = comp.value.uuid.value;
                                }
                                return `${comp.type}(scene_id:${sceneId})`;
                            });
                            throw new Error(`Component type '${expectedComponentType}' not found on node ${targetNodeUuid}. Available components: ${availableComponents.join(', ')}`);
                        }
                        
                        console.log(`[ComponentTools] Found component ${expectedComponentType} with scene ID: ${componentId} on node ${targetNodeUuid}`);
                        
                        // 후속 검증을 위해 기대값을 실제 컴포넌트 ID 객체 형식으로 갱신
                        if (componentId) {
                            actualExpectedValue = { uuid: componentId };
                        }
                        
                        // 노드/리소스 참조와 동일한 형식 시도: {uuid: componentId}
                        // 컴포넌트 참조가 올바르게 설정되는지 테스트
                        await Editor.Message.request('scene', 'set-property', {
                            uuid: nodeUuid,
                            path: propertyPath,
                            dump: { 
                                value: { uuid: componentId },  // 형식, 노드/리소스참조
                                type: expectedComponentType
                            }
                        });
                        
                    } catch (error) {
                        console.error(`[ComponentTools] Error setting component reference:`, error);
                        throw error;
                    }
                } else if (propertyType === 'nodeArray' && Array.isArray(processedValue)) {
                    // 노드 배열 특별 처리 - 전처리 형식 유지
                    console.log(`[ComponentTools] Setting node array:`, processedValue);
                    
                    await Editor.Message.request('scene', 'set-property', {
                        uuid: nodeUuid,
                        path: propertyPath,
                        dump: { 
                            value: processedValue  // [{uuid: "..."}, {uuid: "..."}] 형식
                        }
                    });
                } else if (propertyType === 'colorArray' && Array.isArray(processedValue)) {
                    // 색상 배열 특별 처리
                    const colorArrayValue = processedValue.map((item: any) => {
                        if (item && typeof item === 'object' && 'r' in item) {
                            return {
                                r: Math.min(255, Math.max(0, Number(item.r) || 0)),
                                g: Math.min(255, Math.max(0, Number(item.g) || 0)),
                                b: Math.min(255, Math.max(0, Number(item.b) || 0)),
                                a: item.a !== undefined ? Math.min(255, Math.max(0, Number(item.a))) : 255
                            };
                        } else {
                            return { r: 255, g: 255, b: 255, a: 255 };
                        }
                    });
                    
                    await Editor.Message.request('scene', 'set-property', {
                        uuid: nodeUuid,
                        path: propertyPath,
                        dump: { 
                            value: colorArrayValue,
                            type: 'cc.Color'
                        }
                    });
                } else {
                    // Normal property setting for non-asset properties
                    await Editor.Message.request('scene', 'set-property', {
                        uuid: nodeUuid,
                        path: propertyPath,
                        dump: { value: processedValue }
                    });
                }
                
                // Step 5: Editor 업데이트 완료 대기 후 설정 결과 검증
                await new Promise(resolve => setTimeout(resolve, 200)); // 대기200ms Editor완료
                
                const verification = await this.verifyPropertyChange(nodeUuid, componentType, property, originalValue, actualExpectedValue);
                
                resolve({
                    success: true,
                    message: `Successfully set ${componentType}.${property}`,
                    data: {
                        nodeUuid,
                        componentType,
                        property,
                        actualValue: verification.actualValue,
                        changeVerified: verification.verified
                    }
                });
                
            } catch (error: any) {
                console.error(`[ComponentTools] Error setting property:`, error);
                resolve({
                    success: false,
                    error: `Failed to set property: ${error.message}`
                });
            }
        });
    }


    private async attachScript(nodeUuid: string, scriptPath: string): Promise<ToolResponse> {
        return new Promise(async (resolve) => {
            // 스크립트 경로에서 컴포넌트 클래스명 추출
            const scriptName = scriptPath.split('/').pop()?.replace('.ts', '').replace('.js', '');
            if (!scriptName) {
                resolve({ success: false, error: 'Invalid script path' });
                return;
            }
            // 먼저 노드에 해당 스크립트 컴포넌트가 있는지 확인
            const allComponentsInfo = await this.getComponents(nodeUuid);
            if (allComponentsInfo.success && allComponentsInfo.data?.components) {
                const existingScript = allComponentsInfo.data.components.find((comp: any) => comp.type === scriptName);
                if (existingScript) {
                    resolve({
                        success: true,
                        message: `Script '${scriptName}' already exists on node`,
                        data: {
                            nodeUuid: nodeUuid,
                            componentName: scriptName,
                            existing: true
                        }
                    });
                    return;
                }
            }
            // 먼저 스크립트 이름을 컴포넌트 타입으로 직접 사용 시도
            Editor.Message.request('scene', 'create-component', {
                uuid: nodeUuid,
                component: scriptName  // 스크립트 UUID
            }).then(async (result: any) => {
                // Editor가 컴포넌트 추가를 완료할 때까지 잠시 대기
                await new Promise(resolve => setTimeout(resolve, 100));
                // 노드 정보 재조회로 스크립트 추가 성공 여부 검증
                const allComponentsInfo2 = await this.getComponents(nodeUuid);
                if (allComponentsInfo2.success && allComponentsInfo2.data?.components) {
                    const addedScript = allComponentsInfo2.data.components.find((comp: any) => comp.type === scriptName);
                    if (addedScript) {
                        resolve({
                            success: true,
                            message: `Script '${scriptName}' attached successfully`,
                            data: {
                                nodeUuid: nodeUuid,
                                componentName: scriptName,
                                existing: false
                            }
                        });
                    } else {
                        resolve({
                            success: false,
                            error: `Script '${scriptName}' was not found on node after addition. Available components: ${allComponentsInfo2.data.components.map((c: any) => c.type).join(', ')}`
                        });
                    }
                } else {
                    resolve({
                        success: false,
                        error: `Failed to verify script addition: ${allComponentsInfo2.error || 'Unable to get node components'}`
                    });
                }
            }).catch((err: Error) => {
                // 대안: 씬 스크립트 사용
                const options = {
                    name: 'cocos-mcp-server',
                    method: 'attachScript',
                    args: [nodeUuid, scriptPath]
                };
                Editor.Message.request('scene', 'execute-scene-script', options).then((result: any) => {
                    resolve(result);
                }).catch(() => {
                    resolve({ 
                        success: false, 
                        error: `Failed to attach script '${scriptName}': ${err.message}`,
                        instruction: 'Please ensure the script is properly compiled and exported as a Component class. You can also manually attach the script through the Properties panel in the editor.'
                    });
                });
            });
        });
    }

    private async getAvailableComponents(category: string = 'all'): Promise<ToolResponse> {
        const componentCategories: Record<string, string[]> = {
            renderer: ['cc.Sprite', 'cc.Label', 'cc.RichText', 'cc.Mask', 'cc.Graphics'],
            ui: ['cc.Button', 'cc.Toggle', 'cc.Slider', 'cc.ScrollView', 'cc.EditBox', 'cc.ProgressBar'],
            physics: ['cc.RigidBody2D', 'cc.BoxCollider2D', 'cc.CircleCollider2D', 'cc.PolygonCollider2D'],
            animation: ['cc.Animation', 'cc.AnimationClip', 'cc.SkeletalAnimation'],
            audio: ['cc.AudioSource'],
            layout: ['cc.Layout', 'cc.Widget', 'cc.PageView', 'cc.PageViewIndicator'],
            effects: ['cc.MotionStreak', 'cc.ParticleSystem2D'],
            camera: ['cc.Camera'],
            light: ['cc.Light', 'cc.DirectionalLight', 'cc.PointLight', 'cc.SpotLight']
        };

        let components: string[] = [];
        
        if (category === 'all') {
            for (const cat in componentCategories) {
                components = components.concat(componentCategories[cat]);
            }
        } else if (componentCategories[category]) {
            components = componentCategories[category];
        }

        return {
            success: true,
            data: {
                category: category,
                components: components
            }
        };
    }

    private isValidPropertyDescriptor(propData: any): boolean {
        // 유효한 속성 설명 객체인지 확인
        if (typeof propData !== 'object' || propData === null) {
            return false;
        }
        
        try {
            const keys = Object.keys(propData);
            
            // 단순 수치 객체(예: {width: 200, height: 150}) 순회 방지
            const isSimpleValueObject = keys.every(key => {
                const value = propData[key];
                return typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean';
            });
            
            if (isSimpleValueObject) {
                return false;
            }
            
            // 속성 기술자 특징 필드 포함 여부 확인('in' 연산자 미사용)
            const hasName = keys.includes('name');
            const hasValue = keys.includes('value');
            const hasType = keys.includes('type');
            const hasDisplayName = keys.includes('displayName');
            const hasReadonly = keys.includes('readonly');
            
            // name 또는 value 필드를 반드시 포함하고 보통 type 필드도 포함
            const hasValidStructure = (hasName || hasValue) && (hasType || hasDisplayName || hasReadonly);
            
            // 추가 확인: default 필드가 있고 구조가 복잡하면 깊은 순회 방지
            if (keys.includes('default') && propData.default && typeof propData.default === 'object') {
                const defaultKeys = Object.keys(propData.default);
                if (defaultKeys.includes('value') && typeof propData.default.value === 'object') {
                    // 이 경우 최상위 속성만 반환하고 default.value는 깊게 순회하지 않음
                    return hasValidStructure;
                }
            }
            
            return hasValidStructure;
        } catch (error) {
            console.warn(`[isValidPropertyDescriptor] Error checking property descriptor:`, error);
            return false;
        }
    }

    private analyzeProperty(component: any, propertyName: string): { exists: boolean; type: string; availableProperties: string[]; originalValue: any } {
        // 복잡한 컴포넌트 구조에서 사용 가능한 속성 추출
        const availableProperties: string[] = [];
        let propertyValue: any = undefined;
        let propertyExists = false;
        
        // 여러 방식으로 속성 검색 시도:
        // 1. 직접 속성 접근
        if (Object.prototype.hasOwnProperty.call(component, propertyName)) {
            propertyValue = component[propertyName];
            propertyExists = true;
        }
        
        // 2. 중첩 구조에서 검색(테스트 데이터의 복잡 구조 등)
        if (!propertyExists && component.properties && typeof component.properties === 'object') {
            // 먼저 properties.value 존재 여부 확인(getComponents에서 확인된 구조)
            if (component.properties.value && typeof component.properties.value === 'object') {
                const valueObj = component.properties.value;
                for (const [key, propData] of Object.entries(valueObj)) {
                    // propData가 유효한 속성 설명 객체인지 확인
                    // propData가 객체이며 기대한 속성 구조를 포함하는지 보장
                    if (this.isValidPropertyDescriptor(propData)) {
                        const propInfo = propData as any;
                        availableProperties.push(key);
                        if (key === propertyName) {
                            // value 속성을 우선 사용, 없으면 propData 자체 사용
                            try {
                                const propKeys = Object.keys(propInfo);
                                propertyValue = propKeys.includes('value') ? propInfo.value : propInfo;
                            } catch (error) {
                                // 확인 실패 시 propInfo를 직접 사용
                                propertyValue = propInfo;
                            }
                            propertyExists = true;
                        }
                    }
                }
            } else {
                // 대안: properties에서 직접 검색
                for (const [key, propData] of Object.entries(component.properties)) {
                    if (this.isValidPropertyDescriptor(propData)) {
                        const propInfo = propData as any;
                        availableProperties.push(key);
                        if (key === propertyName) {
                            // value 속성을 우선 사용, 없으면 propData 자체 사용
                            try {
                                const propKeys = Object.keys(propInfo);
                                propertyValue = propKeys.includes('value') ? propInfo.value : propInfo;
                            } catch (error) {
                                // 확인 실패 시 propInfo를 직접 사용
                                propertyValue = propInfo;
                            }
                            propertyExists = true;
                        }
                    }
                }
            }
        }
        
        // 3. 직접 속성에서 단순 속성명 추출
        if (availableProperties.length === 0) {
            for (const key of Object.keys(component)) {
                if (!key.startsWith('_') && !['__type__', 'cid', 'node', 'uuid', 'name', 'enabled', 'type', 'readonly', 'visible'].includes(key)) {
                    availableProperties.push(key);
                }
            }
        }
        
        if (!propertyExists) {
            return {
                exists: false,
                type: 'unknown',
                availableProperties,
                originalValue: undefined
            };
        }
        
        let type = 'unknown';
        
        // 스마트 타입 감지
        if (Array.isArray(propertyValue)) {
            // 배열타입
            if (propertyName.toLowerCase().includes('node')) {
                type = 'nodeArray';
            } else if (propertyName.toLowerCase().includes('color')) {
                type = 'colorArray';
            } else {
                type = 'array';
            }
        } else if (typeof propertyValue === 'string') {
            // Check if property name suggests it's an asset
            if (['spriteFrame', 'texture', 'material', 'font', 'clip', 'prefab'].includes(propertyName.toLowerCase())) {
                type = 'asset';
            } else {
                type = 'string';
            }
        } else if (typeof propertyValue === 'number') {
            type = 'number';
        } else if (typeof propertyValue === 'boolean') {
            type = 'boolean';
        } else if (propertyValue && typeof propertyValue === 'object') {
            try {
                const keys = Object.keys(propertyValue);
                if (keys.includes('r') && keys.includes('g') && keys.includes('b')) {
                    type = 'color';
                } else if (keys.includes('x') && keys.includes('y')) {
                    type = propertyValue.z !== undefined ? 'vec3' : 'vec2';
                } else if (keys.includes('width') && keys.includes('height')) {
                    type = 'size';
                } else if (keys.includes('uuid') || keys.includes('__uuid__')) {
                    // 확인 노드참조（ 속성 __id__속성 ）
                    if (propertyName.toLowerCase().includes('node') || 
                        propertyName.toLowerCase().includes('target') ||
                        keys.includes('__id__')) {
                        type = 'node';
                    } else {
                        type = 'asset';
                    }
                } else if (keys.includes('__id__')) {
                    // 노드참조
                    type = 'node';
                } else {
                    type = 'object';
                }
            } catch (error) {
                console.warn(`[analyzeProperty] Error checking property type for: ${JSON.stringify(propertyValue)}`);
                type = 'object';
            }
        } else if (propertyValue === null || propertyValue === undefined) {
            // For null/undefined values, check property name to determine type
            if (['spriteFrame', 'texture', 'material', 'font', 'clip', 'prefab'].includes(propertyName.toLowerCase())) {
                type = 'asset';
            } else if (propertyName.toLowerCase().includes('node') || 
                      propertyName.toLowerCase().includes('target')) {
                type = 'node';
            } else if (propertyName.toLowerCase().includes('component')) {
                type = 'component';
            } else {
                type = 'unknown';
            }
        }
        
        return {
            exists: true,
            type,
            availableProperties,
            originalValue: propertyValue
        };
    }

    private smartConvertValue(inputValue: any, propertyInfo: any): any {
        const { type, originalValue } = propertyInfo;
        
        console.log(`[smartConvertValue] Converting ${JSON.stringify(inputValue)} to type: ${type}`);
        
        switch (type) {
            case 'string':
                return String(inputValue);
                
            case 'number':
                return Number(inputValue);
                
            case 'boolean':
                if (typeof inputValue === 'boolean') return inputValue;
                if (typeof inputValue === 'string') {
                    return inputValue.toLowerCase() === 'true' || inputValue === '1';
                }
                return Boolean(inputValue);
                
            case 'color':
                // 색상 처리: 지원되는 형식으로 변환
                if (typeof inputValue === 'string') {
                    // 문자열 형식: 16진수, 색상 이름, rgb()/rgba()
                    return this.parseColorString(inputValue);
                } else if (typeof inputValue === 'object' && inputValue !== null) {
                    try {
                        const inputKeys = Object.keys(inputValue);
                        // 색상 키가 있으면 값 검증 후 변환
                        if (inputKeys.includes('r') || inputKeys.includes('g') || inputKeys.includes('b')) {
                            return {
                                r: Math.min(255, Math.max(0, Number(inputValue.r) || 0)),
                                g: Math.min(255, Math.max(0, Number(inputValue.g) || 0)),
                                b: Math.min(255, Math.max(0, Number(inputValue.b) || 0)),
                                a: inputValue.a !== undefined ? Math.min(255, Math.max(0, Number(inputValue.a))) : 255
                            };
                        }
                    } catch (error) {
                        console.warn(`[smartConvertValue] Invalid color object: ${JSON.stringify(inputValue)}`);
                    }
                }
                // 만약 , 구조
                if (originalValue && typeof originalValue === 'object') {
                    try {
                        const inputKeys = typeof inputValue === 'object' && inputValue ? Object.keys(inputValue) : [];
                        return {
                            r: inputKeys.includes('r') ? Math.min(255, Math.max(0, Number(inputValue.r))) : (originalValue.r || 255),
                            g: inputKeys.includes('g') ? Math.min(255, Math.max(0, Number(inputValue.g))) : (originalValue.g || 255),
                            b: inputKeys.includes('b') ? Math.min(255, Math.max(0, Number(inputValue.b))) : (originalValue.b || 255),
                            a: inputKeys.includes('a') ? Math.min(255, Math.max(0, Number(inputValue.a))) : (originalValue.a || 255)
                        };
                    } catch (error) {
                        console.warn(`[smartConvertValue] Error processing color with original value: ${error}`);
                    }
                }
                // 기본
                console.warn(`[smartConvertValue] Using default white color for invalid input: ${JSON.stringify(inputValue)}`);
                return { r: 255, g: 255, b: 255, a: 255 };
                
            case 'vec2':
                if (typeof inputValue === 'object' && inputValue !== null) {
                    return {
                        x: Number(inputValue.x) || originalValue.x || 0,
                        y: Number(inputValue.y) || originalValue.y || 0
                    };
                }
                return originalValue;
                
            case 'vec3':
                if (typeof inputValue === 'object' && inputValue !== null) {
                    return {
                        x: Number(inputValue.x) || originalValue.x || 0,
                        y: Number(inputValue.y) || originalValue.y || 0,
                        z: Number(inputValue.z) || originalValue.z || 0
                    };
                }
                return originalValue;
                
            case 'size':
                if (typeof inputValue === 'object' && inputValue !== null) {
                    return {
                        width: Number(inputValue.width) || originalValue.width || 100,
                        height: Number(inputValue.height) || originalValue.height || 100
                    };
                }
                return originalValue;
                
            case 'node':
                if (typeof inputValue === 'string') {
                    // 노드참조 처리
                    return inputValue;
                } else if (typeof inputValue === 'object' && inputValue !== null) {
                    // 만약 , UUID
                    return inputValue.uuid || inputValue;
                }
                return originalValue;
                
            case 'asset':
                if (typeof inputValue === 'string') {
                    // 만약 경로, 변환 asset
                    return { uuid: inputValue };
                } else if (typeof inputValue === 'object' && inputValue !== null) {
                    return inputValue;
                }
                return originalValue;
                
            default:
                // 타입, 구조
                if (typeof inputValue === typeof originalValue) {
                    return inputValue;
                }
                return originalValue;
        }
    }

        private parseColorString(colorStr: string): { r: number; g: number; b: number; a: number } {
        const str = colorStr.trim();
        
        // 16진수 형식 #RRGGBB 또는 #RRGGBBAA만 지원
        if (str.startsWith('#')) {
            if (str.length === 7) { // #RRGGBB
                const r = parseInt(str.substring(1, 3), 16);
                const g = parseInt(str.substring(3, 5), 16);
                const b = parseInt(str.substring(5, 7), 16);
                return { r, g, b, a: 255 };
            } else if (str.length === 9) { // #RRGGBBAA
                const r = parseInt(str.substring(1, 3), 16);
                const g = parseInt(str.substring(3, 5), 16);
                const b = parseInt(str.substring(5, 7), 16);
                const a = parseInt(str.substring(7, 9), 16);
                return { r, g, b, a };
            }
        }
        
        // 유효한 16진수 형식이 아니면 오류 메시지 반환
        throw new Error(`Invalid color format: "${colorStr}". Only hexadecimal format is supported (e.g., "#FF0000" or "#FF0000FF")`);
    }

    private async verifyPropertyChange(nodeUuid: string, componentType: string, property: string, originalValue: any, expectedValue: any): Promise<{ verified: boolean; actualValue: any; fullData: any }> {
        console.log(`[verifyPropertyChange] Starting verification for ${componentType}.${property}`);
        console.log(`[verifyPropertyChange] Expected value:`, JSON.stringify(expectedValue));
        console.log(`[verifyPropertyChange] Original value:`, JSON.stringify(originalValue));
        
        try {
            // 컴포넌트 정보를 다시 가져와 검증
            console.log(`[verifyPropertyChange] Calling getComponentInfo...`);
            const componentInfo = await this.getComponentInfo(nodeUuid, componentType);
            console.log(`[verifyPropertyChange] getComponentInfo success:`, componentInfo.success);
            
            const allComponents = await this.getComponents(nodeUuid);
            console.log(`[verifyPropertyChange] getComponents success:`, allComponents.success);
            
            if (componentInfo.success && componentInfo.data) {
                console.log(`[verifyPropertyChange] Component data available, extracting property '${property}'`);
                const allPropertyNames = Object.keys(componentInfo.data.properties || {});
                console.log(`[verifyPropertyChange] Available properties:`, allPropertyNames);
                const propertyData = componentInfo.data.properties?.[property];
                console.log(`[verifyPropertyChange] Raw property data for '${property}':`, JSON.stringify(propertyData));
                
                // 속성데이터 추출
                let actualValue = propertyData;
                console.log(`[verifyPropertyChange] Initial actualValue:`, JSON.stringify(actualValue));
                
                if (propertyData && typeof propertyData === 'object' && 'value' in propertyData) {
                    actualValue = propertyData.value;
                    console.log(`[verifyPropertyChange] Extracted actualValue from .value:`, JSON.stringify(actualValue));
                } else {
                    console.log(`[verifyPropertyChange] No .value property found, using raw data`);
                }
                
                // 검증 : 확인
                let verified = false;
                
                if (typeof expectedValue === 'object' && expectedValue !== null && 'uuid' in expectedValue) {
                    // 참조타입（노드/컴포넌트/리소스）, UUID
                    const actualUuid = actualValue && typeof actualValue === 'object' && 'uuid' in actualValue ? actualValue.uuid : '';
                    const expectedUuid = expectedValue.uuid || '';
                    verified = actualUuid === expectedUuid && expectedUuid !== '';
                    
                    console.log(`[verifyPropertyChange] Reference comparison:`);
                    console.log(`  - Expected UUID: "${expectedUuid}"`);
                    console.log(`  - Actual UUID: "${actualUuid}"`);
                    console.log(`  - UUID match: ${actualUuid === expectedUuid}`);
                    console.log(`  - UUID not empty: ${expectedUuid !== ''}`);
                    console.log(`  - Final verified: ${verified}`);
                } else {
                    // 타입, 직접
                    console.log(`[verifyPropertyChange] Value comparison:`);
                    console.log(`  - Expected type: ${typeof expectedValue}`);
                    console.log(`  - Actual type: ${typeof actualValue}`);
                    
                    if (typeof actualValue === typeof expectedValue) {
                        if (typeof actualValue === 'object' && actualValue !== null && expectedValue !== null) {
                            // 타입
                            verified = JSON.stringify(actualValue) === JSON.stringify(expectedValue);
                            console.log(`  - Object comparison (JSON): ${verified}`);
                        } else {
                            // 타입 직접
                            verified = actualValue === expectedValue;
                            console.log(`  - Direct comparison: ${verified}`);
                        }
                    } else {
                        // 타입 처리（ ）
                        const stringMatch = String(actualValue) === String(expectedValue);
                        const numberMatch = Number(actualValue) === Number(expectedValue);
                        verified = stringMatch || numberMatch;
                        console.log(`  - String match: ${stringMatch}`);
                        console.log(`  - Number match: ${numberMatch}`);
                        console.log(`  - Type mismatch verified: ${verified}`);
                    }
                }
                
                console.log(`[verifyPropertyChange] Final verification result: ${verified}`);
                console.log(`[verifyPropertyChange] Final actualValue:`, JSON.stringify(actualValue));
                
                const result = {
                    verified,
                    actualValue,
                    fullData: {
                        // 속성 , 컴포넌트데이터
                        modifiedProperty: {
                            name: property,
                            before: originalValue,
                            expected: expectedValue,
                            actual: actualValue,
                            verified,
                            propertyMetadata: propertyData // 속성 데이터
                        },
                        // 컴포넌트
                        componentSummary: {
                            nodeUuid,
                            componentType,
                            totalProperties: Object.keys(componentInfo.data?.properties || {}).length
                        }
                    }
                };
                
                console.log(`[verifyPropertyChange] Returning result:`, JSON.stringify(result, null, 2));
                return result;
            } else {
                console.log(`[verifyPropertyChange] ComponentInfo failed or no data:`, componentInfo);
            }
        } catch (error) {
            console.error('[verifyPropertyChange] Verification failed with error:', error);
            console.error('[verifyPropertyChange] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        }
        
        console.log(`[verifyPropertyChange] Returning fallback result`);
        return {
            verified: false,
            actualValue: undefined,
            fullData: null
        };
    }

    /**
     * 노드 속성인지 감지하고, 맞으면 해당 노드 메서드로 리디렉션
     */
    private async checkAndRedirectNodeProperties(args: any): Promise<ToolResponse | null> {
        const { nodeUuid, componentType, property, propertyType, value } = args;
        
        // 노드 기본 속성인지 감지( set_node_property 사용 대상 )
        const nodeBasicProperties = [
            'name', 'active', 'layer', 'mobility', 'parent', 'children', 'hideFlags'
        ];
        
        // 노드 변환 속성인지 감지( set_node_transform 사용 대상 )
        const nodeTransformProperties = [
            'position', 'rotation', 'scale', 'eulerAngles', 'angle'
        ];
        
        // Detect attempts to set cc.Node properties (common mistake)
        if (componentType === 'cc.Node' || componentType === 'Node') {
            if (nodeBasicProperties.includes(property)) {
                return {
                    success: false,
                                          error: `Property '${property}' is a node basic property, not a component property`,
                      instruction: `Please use set_node_property method to set node properties: set_node_property(uuid="${nodeUuid}", property="${property}", value=${JSON.stringify(value)})`
                  };
              } else if (nodeTransformProperties.includes(property)) {
                  return {
                      success: false,
                      error: `Property '${property}' is a node transform property, not a component property`,
                      instruction: `Please use set_node_transform method to set transform properties: set_node_transform(uuid="${nodeUuid}", ${property}=${JSON.stringify(value)})`
                  };
              }
          }
          
          // Detect common incorrect usage
          if (nodeBasicProperties.includes(property) || nodeTransformProperties.includes(property)) {
              const methodName = nodeTransformProperties.includes(property) ? 'set_node_transform' : 'set_node_property';
              return {
                  success: false,
                  error: `Property '${property}' is a node property, not a component property`,
                  instruction: `Property '${property}' should be set using ${methodName} method, not set_component_property. Please use: ${methodName}(uuid="${nodeUuid}", ${nodeTransformProperties.includes(property) ? property : `property="${property}"`}=${JSON.stringify(value)})`
              };
          }
          
          return null; // 노드속성, 처리
      }

      /**
       * 컴포넌트
       */
      private generateComponentSuggestion(requestedType: string, availableTypes: string[], property: string): string {
          // 확인 컴포넌트타입
          const similarTypes = availableTypes.filter(type => 
              type.toLowerCase().includes(requestedType.toLowerCase()) || 
              requestedType.toLowerCase().includes(type.toLowerCase())
          );
          
          let instruction = '';
          
          if (similarTypes.length > 0) {
              instruction += `\n\n🔍 Found similar components: ${similarTypes.join(', ')}`;
              instruction += `\n💡 Suggestion: Perhaps you meant to set the '${similarTypes[0]}' component?`;
          }
          
          // Recommend possible components based on property name
          const propertyToComponentMap: Record<string, string[]> = {
              'string': ['cc.Label', 'cc.RichText', 'cc.EditBox'],
              'text': ['cc.Label', 'cc.RichText'],
              'fontSize': ['cc.Label', 'cc.RichText'],
              'spriteFrame': ['cc.Sprite'],
              'color': ['cc.Label', 'cc.Sprite', 'cc.Graphics'],
              'normalColor': ['cc.Button'],
              'pressedColor': ['cc.Button'],
              'target': ['cc.Button'],
              'contentSize': ['cc.UITransform'],
              'anchorPoint': ['cc.UITransform']
          };
          
          const recommendedComponents = propertyToComponentMap[property] || [];
          const availableRecommended = recommendedComponents.filter(comp => availableTypes.includes(comp));
          
          if (availableRecommended.length > 0) {
              instruction += `\n\n🎯 Based on property '${property}', recommended components: ${availableRecommended.join(', ')}`;
          }
          
          // Provide operation suggestions
          instruction += `\n\n📋 Suggested Actions:`;
          instruction += `\n1. Use get_components(nodeUuid="${requestedType.includes('uuid') ? 'YOUR_NODE_UUID' : 'nodeUuid'}") to view all components on the node`;
          instruction += `\n2. If you need to add a component, use add_component(nodeUuid="...", componentType="${requestedType}")`;
          instruction += `\n3. Verify that the component type name is correct (case-sensitive)`;
          
                  return instruction;
    }

    /**
     * 리소스 설정 결과를 빠르게 검증
     */
    private async quickVerifyAsset(nodeUuid: string, componentType: string, property: string): Promise<any> {
        try {
            const rawNodeData = await Editor.Message.request('scene', 'query-node', nodeUuid);
            if (!rawNodeData || !rawNodeData.__comps__) {
                return null;
            }
            
            // 컴포넌트
            const component = rawNodeData.__comps__.find((comp: any) => {
                const compType = comp.__type__ || comp.cid || comp.type;
                return compType === componentType;
            });
            
            if (!component) {
                return null;
            }
            
            // 속성값 추출
            const properties = this.extractComponentProperties(component);
            const propertyData = properties[property];
            
            if (propertyData && typeof propertyData === 'object' && 'value' in propertyData) {
                return propertyData.value;
            } else {
                return propertyData;
            }
        } catch (error) {
            console.error(`[quickVerifyAsset] Error:`, error);
            return null;
        }
    }
}
