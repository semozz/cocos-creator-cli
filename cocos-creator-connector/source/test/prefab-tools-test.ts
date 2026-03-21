import { PrefabTools } from '../tools/prefab-tools';

// 프리팹 도구 테스트
export class PrefabToolsTest {
    private prefabTools: PrefabTools;

    constructor() {
        this.prefabTools = new PrefabTools();
    }

    async runAllTests() {
        console.log('开始预制体工具测试...');
        
        try {
            // 테스트1: 도구 목록 가져오기
            await this.testGetTools();
            
            // 테스트2: 프리팹 목록 가져오기
            await this.testGetPrefabList();
            
            // 테스트3: 프리팹 생성 테스트(모의)
            await this.testCreatePrefab();
            
            // 테스트3.5: 프리팹 인스턴스화 테스트(모의)
            await this.testInstantiatePrefab();
            
            // 테스트4: 프리팹 검증 테스트
            await this.testValidatePrefab();
            
            console.log('所有测试完成！');
        } catch (error) {
            console.error('测试过程中发生错误:', error);
        }
    }

    private async testGetTools() {
        console.log('测试1: 获取工具列表');
        const tools = this.prefabTools.getTools();
        console.log(`找到 ${tools.length} 个工具:`);
        tools.forEach(tool => {
            console.log(`  - ${tool.name}: ${tool.description}`);
        });
        console.log('测试1完成\n');
    }

    private async testGetPrefabList() {
        console.log('测试2: 获取预制体列表');
        try {
            const result = await this.prefabTools.execute('get_prefab_list', { folder: 'db://assets' });
            if (result.success) {
                console.log(`找到 ${result.data?.length || 0} 个预制体`);
                if (result.data && result.data.length > 0) {
                    result.data.slice(0, 3).forEach((prefab: any) => {
                        console.log(`  - ${prefab.name}: ${prefab.path}`);
                    });
                }
            } else {
                console.log('获取预制体列表失败:', result.error);
            }
        } catch (error) {
            console.log('获取预制体列表时发生错误:', error);
        }
        console.log('测试2完成\n');
    }

    private async testCreatePrefab() {
        console.log('测试3: 测试预制体创建（模拟）');
        try {
            // 프리팹 모의 생성
            const mockArgs = {
                nodeUuid: 'mock-node-uuid',
                savePath: 'db://assets/test',
                prefabName: 'TestPrefab'
            };
            
            const result = await this.prefabTools.execute('create_prefab', mockArgs);
            console.log('创建预制体结果:', result);
        } catch (error) {
            console.log('创建预制体时发生错误:', error);
        }
        console.log('测试3完成\n');
    }

    private async testInstantiatePrefab() {
        console.log('测试3.5: 测试预制体实例化（模拟）');
        try {
            // 프리팹 모의 인스턴스화
            const mockArgs = {
                prefabPath: 'db://assets/prefabs/TestPrefab.prefab',
                parentUuid: 'canvas-uuid',
                position: { x: 100, y: 200, z: 0 }
            };
            
            const result = await this.prefabTools.execute('instantiate_prefab', mockArgs);
            console.log('实例化预制体结果:', result);
            
            // API 파라미터 구성 테스트
            this.testCreateNodeAPIParams();
        } catch (error) {
            console.log('实例化预制体时发生错误:', error);
        }
        console.log('测试3.5完成\n');
    }

    private testCreateNodeAPIParams() {
        console.log('测试 create-node API 参数构建...');
        
        // assetUuid 모의 설정
        const assetUuid = 'mock-prefab-uuid';
        
        // 기본 파라미터 테스트
        const basicOptions = {
            assetUuid: assetUuid,
            name: 'TestPrefabInstance'
        };
        console.log('基本参数:', basicOptions);
        
        // 부모 노드 포함 파라미터 테스트
        const withParentOptions = {
            ...basicOptions,
            parent: 'parent-node-uuid'
        };
        console.log('带父节点参数:', withParentOptions);
        
        // 위치 포함 파라미터 테스트
        const withPositionOptions = {
            ...basicOptions,
            dump: {
                position: { x: 100, y: 200, z: 0 }
            }
        };
        console.log('带位置参数:', withPositionOptions);
        
        // 전체 파라미터 테스트
        const fullOptions = {
            assetUuid: assetUuid,
            name: 'TestPrefabInstance',
            parent: 'parent-node-uuid',
            dump: {
                position: { x: 100, y: 200, z: 0 }
            },
            keepWorldTransform: false,
            unlinkPrefab: false
        };
        console.log('完整参数:', fullOptions);
    }

    private async testValidatePrefab() {
        console.log('测试4: 测试预制体验证');
        try {
            // 존재하지 않는 프리팹 검증 테스트
            const result = await this.prefabTools.execute('validate_prefab', { 
                prefabPath: 'db://assets/nonexistent.prefab' 
            });
            console.log('验证预制体结果:', result);
        } catch (error) {
            console.log('验证预制体时发生错误:', error);
        }
        console.log('测试4完成\n');
    }

    // 프리팹 데이터 구조 생성 테스트
    testPrefabDataGeneration() {
        console.log('测试预制体数据结构生成...');
        
        const mockNodeData = {
            name: 'TestNode',
            position: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            active: true,
            children: [],
            components: [
                {
                    type: 'cc.UITransform',
                    enabled: true,
                    properties: {
                        _contentSize: { width: 100, height: 100 },
                        _anchorPoint: { x: 0.5, y: 0.5 }
                    }
                }
            ]
        };

        const prefabUuid = this.prefabTools['generateUUID']();
        const prefabData = this.prefabTools['createPrefabData'](mockNodeData, 'TestPrefab', prefabUuid);
        
        console.log('生成的预制体数据结构:');
        console.log(JSON.stringify(prefabData, null, 2));
        
        // 데이터 구조 검증
        const validationResult = this.prefabTools['validatePrefabFormat'](prefabData);
        console.log('验证结果:', validationResult);
        
        console.log('预制体数据结构生成测试完成\n');
    }

    // UUID 생성 테스트
    testUUIDGeneration() {
        console.log('测试UUID生成...');
        
        const uuids = [];
        for (let i = 0; i < 5; i++) {
            const uuid = this.prefabTools['generateUUID']();
            uuids.push(uuid);
            console.log(`UUID ${i + 1}: ${uuid}`);
        }
        
        // UUID 형식 확인
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const validUuids = uuids.filter(uuid => uuidPattern.test(uuid));
        
        console.log(`UUID格式验证: ${validUuids.length}/${uuids.length} 个有效`);
        console.log('UUID生成测试完成\n');
    }
}

// 이 파일을 직접 실행하는 경우
if (typeof module !== 'undefined' && module.exports) {
    const test = new PrefabToolsTest();
    test.runAllTests();
    test.testPrefabDataGeneration();
    test.testUUIDGeneration();
} 