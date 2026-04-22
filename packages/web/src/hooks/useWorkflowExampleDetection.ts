/**
 * Hook to detect workflow example requests and automatically open canvas with example
 */

import { useEffect, useRef } from 'react';
import { useWorkflowTabsStore } from '@/stores/workflowTabs';
import {
  isWorkflowExampleRequest,
  getRandomExampleWorkflow,
  exampleWorkflowToStorageFormat,
  generateWorkflowExplanation,
  type ExampleWorkflowData
} from '@/utils/workflowExamples';
import HelperStorage from '@/helpers/HelperStorage';

interface UseWorkflowExampleDetectionProps {
  messages: any[];
  canvasVisible: boolean;
  activeCanvasTab: 'apps' | 'data' | 'workflow' | 'requirement' | 'code' | 'environments';
  onOpenCanvas: () => void;
  onSwitchToWorkflowTab: () => void;
  onSendMessage?: (message: string) => void;
  technicalId: string;
}

/**
 * Hook that monitors chat messages and automatically opens canvas with workflow example
 * when user requests it
 */
export function useWorkflowExampleDetection({
  messages,
  canvasVisible,
  activeCanvasTab,
  onOpenCanvas,
  onSwitchToWorkflowTab,
  onSendMessage,
  technicalId
}: UseWorkflowExampleDetectionProps) {
  const { openTab, tabs, setActiveTab } = useWorkflowTabsStore();
  const processedMessagesRef = useRef<Set<string>>(new Set());
  const hasSentExplanationRef = useRef<boolean>(false); // Track if we've already sent the explanation
  const helperStorage = new HelperStorage();

  useEffect(() => {
    // Skip if no messages
    if (!messages || messages.length === 0) {
      return;
    }

    // Get the last message
    const lastMessage = messages[messages.length - 1];

    // Only process user messages (answers)
    if (lastMessage.type !== 'answer') {
      return;
    }

    // Skip if we've already processed this message
    if (processedMessagesRef.current.has(lastMessage.id)) {
      return;
    }

    // Check if the message is requesting a workflow example
    if (!isWorkflowExampleRequest(lastMessage.text)) {
      return;
    }

    // Mark this message as processed
    processedMessagesRef.current.add(lastMessage.id);

    console.log('🎯 Workflow example request detected:', lastMessage.text);

    // Step 1: Open canvas if not already open
    if (!canvasVisible) {
      console.log('📂 Opening canvas...');
      onOpenCanvas();
    }

    // Step 2: Switch to workflow tab if not already on it
    // Wait a tick to ensure canvas is open
    setTimeout(() => {
      if (activeCanvasTab !== 'workflow') {
        console.log('🔄 Switching to workflow tab...');
        onSwitchToWorkflowTab();
      }

      // Step 3: Check if example workflow already exists, otherwise create it
      // Wait another tick to ensure tab is switched
      setTimeout(() => {
        // Check if we already have an example workflow tab open
        const existingExampleTab = tabs.find(tab =>
          tab.metadata?.isExample === true ||
          tab.modelName === 'simple-task-workflow'
        );

        if (existingExampleTab) {
          // If example tab already exists, just switch to it
          console.log('📋 Example workflow tab already exists, switching to it:', existingExampleTab.id);
          setActiveTab(existingExampleTab.id);

          // Send explanation only if we haven't sent it before
          if (onSendMessage && !hasSentExplanationRef.current) {
            setTimeout(() => {
              const explanation = generateWorkflowExplanation();
              onSendMessage(explanation);
              hasSentExplanationRef.current = true;
              console.log('📨 Explanation message sent to chat (for existing tab)');
            }, 300);
          }
        } else {
          // Only create a new tab if we haven't created one yet
          console.log('✨ Generating example workflow...');
          const exampleWorkflow = getRandomExampleWorkflow();

          // Create workflow tab (use fixed name to prevent duplicates)
          const modelName = 'simple-task-workflow';
          const modelVersion = 1;
          const workflowTechnicalId = `${modelName}_v${modelVersion}_example`;

          // Store the workflow data in localStorage
          const storageKey = `workflow_${workflowTechnicalId}`;
          const workflowData = exampleWorkflowToStorageFormat(exampleWorkflow);
          helperStorage.set(storageKey, workflowData);

          // Open the workflow tab
          console.log('📋 Opening workflow tab:', {
            modelName,
            modelVersion,
            workflowTechnicalId
          });

          openTab({
            modelName,
            modelVersion,
            displayName: `${exampleWorkflow.name}`,
            isDirty: false,
            technicalId: workflowTechnicalId,
            metadata: {
              isExample: true,
              description: exampleWorkflow.description
            }
          });

          console.log('✅ Workflow example opened successfully!');

          // Step 4: Send explanation message to chat (only once when creating the tab)
          if (onSendMessage && !hasSentExplanationRef.current) {
            setTimeout(() => {
              const explanation = generateWorkflowExplanation();
              onSendMessage(explanation);
              hasSentExplanationRef.current = true;
              console.log('📨 Explanation message sent to chat (for new tab)');
            }, 300);
          }
        }
      }, 100);
    }, 100);
  }, [messages, canvasVisible, activeCanvasTab, onOpenCanvas, onSwitchToWorkflowTab, onSendMessage, openTab, tabs, setActiveTab, technicalId, helperStorage]);

  return {
    processedMessagesCount: processedMessagesRef.current.size
  };
}
