import {defineStore} from "pinia";
import HelperStorageElectron from "../helpers/HelperStorageElectron";
import {MENU_WORKFLOW_CHAT_LIST} from "../helpers/HelperConstantsElectron";
import {ElMessage} from "element-plus";
import {v4 as uuidv4} from "uuid";

const useWorkflowStore = defineStore('workflows', {
    state: () => {
        return {
            workflowList: [],
            selectedWorkflow: null,
        }
    },
    actions: {
        async deleteWorkflowById(technical_id) {
            let allWorkflows = await HelperStorageElectron.get(MENU_WORKFLOW_CHAT_LIST, []);
            allWorkflows = allWorkflows.filter((el) => el.technical_id !== technical_id);
            await HelperStorageElectron.set(MENU_WORKFLOW_CHAT_LIST, allWorkflows);
            this.getAll();
        },
        async createWorkflow(data) {
            const allWorkflows = await HelperStorageElectron.get(MENU_WORKFLOW_CHAT_LIST, []);
            const newWorkflow = {
                name: data.name.trim(),
                description: data.description.trim(),
                technical_id: uuidv4(),
                date: new Date().toString(),
                workflowMetaData: '',
                canvasData: '',
            };
            allWorkflows.unshift(newWorkflow);
            await HelperStorageElectron.set(MENU_WORKFLOW_CHAT_LIST, allWorkflows);
            this.getAll();
            return newWorkflow;
        },
        async updateWorkflow(data) {
            const allWorkflows = await HelperStorageElectron.get(MENU_WORKFLOW_CHAT_LIST, []);
            const existWorkflow = allWorkflows.find((el) => el.technical_id === data.technical_id);

            if (!existWorkflow) {
                console.error('Workflow not found:', data.technical_id);
                return;
            }

            if ('name' in data) existWorkflow.name = data.name.trim();
            if ('description' in data) existWorkflow.description = data.description.trim();

            // Сериализуем объекты в JSON строки, чтобы избежать проблем с клонированием
            if ('workflowMetaData' in data) {
                try {
                    existWorkflow.workflowMetaData = typeof data.workflowMetaData === 'string'
                        ? data.workflowMetaData
                        : JSON.stringify(data.workflowMetaData);
                } catch (e) {
                    console.error('Error serializing workflowMetaData:', e);
                    existWorkflow.workflowMetaData = '{}';
                }
            }

            if ('canvasData' in data) {
                try {
                    existWorkflow.canvasData = typeof data.canvasData === 'string'
                        ? data.canvasData
                        : JSON.stringify(data.canvasData);
                } catch (e) {
                    console.error('Error serializing canvasData:', e);
                    existWorkflow.canvasData = '';
                }
            }

            await HelperStorageElectron.set(MENU_WORKFLOW_CHAT_LIST, allWorkflows);
            this.getAll();
        },
        async getAll() {
            this.workflowList = await HelperStorageElectron.get(MENU_WORKFLOW_CHAT_LIST, []);
        },
        async deleteAll() {
            await HelperStorageElectron.set(MENU_WORKFLOW_CHAT_LIST, []);
            this.selectedWorkflow = null;
            this.getAll();
        },
        setSelectedWorkflow(workflow: any) {
            this.selectedWorkflow = workflow;
        }
    },
});

export default useWorkflowStore;
