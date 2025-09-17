import {defineStore} from "pinia";
import HelperStorage from "@/helpers/HelperStorage.ts";
import HelperStorageElectron from "../helpers/HelperStorageElectron";
import {MENU_WORKFLOW_CHAT_LIST} from "../helpers/HelperConstantsElectron";
import {ElMessage} from "element-plus";
import {v4 as uuidv4} from "uuid";

const helperStorage = new HelperStorage();

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
        },
        async updateWorkflow(data) {
            const allWorkflows = await HelperStorageElectron.get(MENU_WORKFLOW_CHAT_LIST, []);
            const existWorkflow = allWorkflows.find((el) => el.technical_id === data.technical_id);
            if(data.name) existWorkflow.name = data.name.trim();
            if(data.description) existWorkflow.description = data.description.trim();
            if(data.workflowMetaData) existWorkflow.workflowMetaData = data.workflowMetaData;
            if(data.canvasData) existWorkflow.canvasData = data.canvasData;

            await HelperStorageElectron.set(MENU_WORKFLOW_CHAT_LIST, allWorkflows);
            this.getAll();
        },
        async getAll() {
            this.workflowList = await HelperStorageElectron.get(MENU_WORKFLOW_CHAT_LIST, []);
        },
        async deleteAll() {
            await HelperStorageElectron.set(MENU_WORKFLOW_CHAT_LIST, []);
            this.getAll();
        },
        setSelectedWorkflow(worlflow) {
            this.selectedWorkflow = worlflow;
        }
    },
});

export default useWorkflowStore;
