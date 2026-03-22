declare const Editor: any;

/**
 * MCP 도구 테스터 - WebSocket으로 MCP 도구를 직접 테스트
 */
export class MCPToolTester {
    private ws: WebSocket | null = null;
    private messageId = 0;
    private responseHandlers = new Map<number, (response: any) => void>();

    async connect(port: number): Promise<boolean> {
        return new Promise((resolve) => {
            try {
                this.ws = new WebSocket(`ws://localhost:${port}`);
                
                this.ws.onopen = () => {
                    console.log('WebSocket 연결 성공');
                    resolve(true);
                };
                
                this.ws.onerror = (error) => {
                    console.error('WebSocket 연결 오류:', error);
                    resolve(false);
                };
                
                this.ws.onmessage = (event) => {
                    try {
                        const response = JSON.parse(event.data);
                        if (response.id && this.responseHandlers.has(response.id)) {
                            const handler = this.responseHandlers.get(response.id);
                            this.responseHandlers.delete(response.id);
                            handler?.(response);
                        }
                    } catch (error) {
                        console.error('응답 처리 중 오류:', error);
                    }
                };
            } catch (error) {
                console.error('WebSocket 생성 중 오류:', error);
                resolve(false);
            }
        });
    }

    async callTool(tool: string, args: any = {}): Promise<any> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket이 연결되지 않았습니다');
        }

        return new Promise((resolve, reject) => {
            const id = ++this.messageId;
            const request = {
                jsonrpc: '2.0',
                id,
                method: 'tools/call',
                params: {
                    name: tool,
                    arguments: args
                }
            };

            const timeout = setTimeout(() => {
                this.responseHandlers.delete(id);
                reject(new Error('요청 시간이 초과되었습니다'));
            }, 10000);

            this.responseHandlers.set(id, (response) => {
                clearTimeout(timeout);
                if (response.error) {
                    reject(new Error(response.error.message));
                } else {
                    resolve(response.result);
                }
            });

            this.ws!.send(JSON.stringify(request));
        });
    }

    async listTools(): Promise<any> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket이 연결되지 않았습니다');
        }

        return new Promise((resolve, reject) => {
            const id = ++this.messageId;
            const request = {
                jsonrpc: '2.0',
                id,
                method: 'tools/list'
            };

            const timeout = setTimeout(() => {
                this.responseHandlers.delete(id);
                reject(new Error('요청 시간이 초과되었습니다'));
            }, 10000);

            this.responseHandlers.set(id, (response) => {
                clearTimeout(timeout);
                if (response.error) {
                    reject(new Error(response.error.message));
                } else {
                    resolve(response.result);
                }
            });

            this.ws!.send(JSON.stringify(request));
        });
    }

    async testMCPTools() {
        console.log('\n=== MCP 도구 테스트 (WebSocket 경유) ===');
        
        try {
            // 0. 도구 목록 가져오기
            console.log('\n0. 도구 목록 조회...');
            const toolsList = await this.listTools();
            console.log(`도구 ${toolsList.tools?.length || 0}개 찾음:`);
            if (toolsList.tools) {
                for (const tool of toolsList.tools.slice(0, 10)) { // 10
                    console.log(`  - ${tool.name}: ${tool.description}`);
                }
                if (toolsList.tools.length > 10) {
                    console.log(`  ... 추가로 ${toolsList.tools.length - 10}개 도구가 더 있습니다`);
                }
            }
            
            // 1. 씬 도구 테스트
            console.log('\n1. 현재 씬 정보 테스트...');
            const sceneInfo = await this.callTool('scene_get_current_scene');
            console.log('씬 정보:', JSON.stringify(sceneInfo).substring(0, 100) + '...');
            
            // 2. 씬 목록 테스트
            console.log('\n2. 씬 목록 테스트...');
            const sceneList = await this.callTool('scene_get_scene_list');
            console.log('씬 목록:', JSON.stringify(sceneList).substring(0, 100) + '...');
            
            // 3. 노드 생성 테스트
            console.log('\n3. 노드 생성 테스트...');
            const createResult = await this.callTool('node_create_node', {
                name: 'MCPTestNode_' + Date.now(),
                nodeType: 'cc.Node',
                position: { x: 0, y: 0, z: 0 }
            });
            console.log('노드 생성 결과:', createResult);
            
            // 노드 생성 결과 파싱
            let nodeUuid: string | null = null;
            if (createResult.content && createResult.content[0] && createResult.content[0].text) {
                try {
                    const resultData = JSON.parse(createResult.content[0].text);
                    if (resultData.success && resultData.data && resultData.data.uuid) {
                        nodeUuid = resultData.data.uuid;
                        console.log('노드 UUID 조회 성공:', nodeUuid);
                    }
                } catch (e) {
                }
            }
            
            if (nodeUuid) {
                // 4. 노드 조회 테스트
                console.log('\n4. 노드 조회 테스트...');
                const queryResult = await this.callTool('node_get_node_info', {
                    uuid: nodeUuid
                });
                console.log('노드 정보:', JSON.stringify(queryResult).substring(0, 100) + '...');
                
                // 5. 노드 삭제 테스트
                console.log('\n5. 노드 삭제 테스트...');
                const removeResult = await this.callTool('node_delete_node', {
                    uuid: nodeUuid
                });
                console.log('삭제 결과:', removeResult);
            } else {
                console.log('생성 결과에서 노드 UUID를 가져올 수 없어, 이름으로 검색을 시도합니다...');
                
                // 대안: 이름으로 방금 생성한 노드 검색
                const findResult = await this.callTool('node_find_node_by_name', {
                    name: 'MCPTestNode_' + Date.now()
                });
                
                if (findResult.content && findResult.content[0] && findResult.content[0].text) {
                    try {
                        const findData = JSON.parse(findResult.content[0].text);
                        if (findData.success && findData.data && findData.data.uuid) {
                            nodeUuid = findData.data.uuid;
                            console.log('이름 검색으로 UUID 조회 성공:', nodeUuid);
                        }
                    } catch (e) {
                    }
                }
                
                if (!nodeUuid) {
                    console.log('모든 방법으로 노드 UUID를 가져오지 못해 이후 노드 작업 테스트를 건너뜁니다');
                }
            }
            
            // 6. 프로젝트 도구 테스트
            console.log('\n6. 프로젝트 정보 테스트...');
            const projectInfo = await this.callTool('project_get_project_info');
            console.log('프로젝트 정보:', JSON.stringify(projectInfo).substring(0, 100) + '...');
            
            // 7. 프리팹 도구 테스트
            console.log('\n7. 프리팹 목록 테스트...');
            const prefabResult = await this.callTool('prefab_get_prefab_list', {
                folder: 'db://assets'
            });
            console.log('찾은 프리팹 수:', prefabResult.data?.length || 0);
            
            // 8. 컴포넌트 도구 테스트
            console.log('\n8. 사용 가능한 컴포넌트 테스트...');
            const componentsResult = await this.callTool('component_get_available_components');
            console.log('사용 가능한 컴포넌트:', JSON.stringify(componentsResult).substring(0, 100) + '...');
            
            // 9. 디버그 도구 테스트
            console.log('\n9. 에디터 정보 테스트...');
            const editorInfo = await this.callTool('debug_get_editor_info');
            console.log('에디터 정보:', JSON.stringify(editorInfo).substring(0, 100) + '...');
            
        } catch (error) {
            console.error('MCP 도구 테스트 실패:', error);
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.responseHandlers.clear();
    }
}

// 테스트 편의를 위해 전역으로 내보내기
(global as any).MCPToolTester = MCPToolTester;
