/**
 * Parse validation report from AI message text
 *
 * The backend sends validation reports in markdown format. This parser extracts
 * the structured data needed for the ValidationWarningBanner component.
 */

import type { ValidationResult } from '@/components/AppsCanvas/ValidationWarningBanner';

/**
 * Parse a validation report from AI message text
 *
 * Expected format:
 * ```
 * ✅ Generation Validation: PASSED
 * or
 * ⚠️ Generation Validation: REVIEW NEEDED
 *
 * ### Summary
 * - **Expected**: 5 entities, 7 workflows
 * - **Generated**: 3 entities, 5 workflows
 *
 * ### Entities
 * ✅ **Generated** (3):
 *    - User
 *    - Product
 *
 * ⚠️ **Possibly Missing** (2):
 *    - Payment
 *    - Shipment
 *
 * ### Workflows
 * ...
 * ```
 *
 * @param text - The AI message text containing validation report
 * @returns ValidationResult or null if no validation report found
 */
export function parseValidationReport(text: string): ValidationResult | null {
  // Check if this message contains a validation report
  const hasValidation = text.includes('Generation Validation:') ||
                       text.includes('📊 Generation Validation Report');

  if (!hasValidation) {
    return null;
  }

  try {
    // Determine if validation passed
    const passed = text.includes('✅ Generation Validation: PASSED') ||
                   text.includes('✅ **Generation Validation: PASSED**');

    // Extract expected counts
    const expectedMatch = text.match(/Expected[:\s]+(\d+)\s+entit(?:y|ies),\s+(\d+)\s+workflows?/i);
    const expectedEntities = expectedMatch ? parseInt(expectedMatch[1], 10) : 0;
    const expectedWorkflows = expectedMatch ? parseInt(expectedMatch[2], 10) : 0;

    // Extract actual/generated counts
    const generatedMatch = text.match(/Generated[:\s]+(\d+)\s+entit(?:y|ies),\s+(\d+)\s+workflows?/i);
    const actualEntities = generatedMatch ? parseInt(generatedMatch[1], 10) : 0;
    const actualWorkflows = generatedMatch ? parseInt(generatedMatch[2], 10) : 0;

    // Extract missing entities
    const missingEntities: string[] = [];
    const missingEntitiesSection = text.match(/⚠️\s+\*\*Possibly Missing\*\*[^:]*:\s*\n((?:\s*-\s+.+\n?)+)/);
    if (missingEntitiesSection) {
      const lines = missingEntitiesSection[1].split('\n');
      for (const line of lines) {
        const match = line.trim().match(/^-\s+(.+)$/);
        if (match && !match[1].includes('...and')) {
          missingEntities.push(match[1].trim());
        }
      }
    }

    // Extract missing workflows
    const missingWorkflows: string[] = [];
    // Find workflows section
    const workflowsStart = text.indexOf('### Workflows');
    if (workflowsStart !== -1) {
      const workflowsSection = text.substring(workflowsStart);
      const missingWorkflowsMatch = workflowsSection.match(/⚠️\s+\*\*Possibly Missing\*\*[^:]*:\s*\n((?:\s*-\s+.+\n?)+)/);
      if (missingWorkflowsMatch) {
        const lines = missingWorkflowsMatch[1].split('\n');
        for (const line of lines) {
          const match = line.trim().match(/^-\s+(.+)$/);
          if (match && !match[1].includes('...and')) {
            missingWorkflows.push(match[1].trim());
          }
        }
      }
    }

    // Extract generated entities
    const generatedEntities: string[] = [];
    const generatedEntitiesSection = text.match(/### Entities[\s\S]*?✅\s+\*\*Generated\*\*[^:]*:\s*\n((?:\s*-\s+.+\n?)+)/);
    if (generatedEntitiesSection) {
      const lines = generatedEntitiesSection[1].split('\n');
      for (const line of lines) {
        const match = line.trim().match(/^-\s+(.+)$/);
        if (match && !match[1].includes('...and')) {
          generatedEntities.push(match[1].trim());
        }
      }
    }

    // Extract generated workflows
    const generatedWorkflows: string[] = [];
    if (workflowsStart !== -1) {
      const workflowsSection = text.substring(workflowsStart);
      const generatedWorkflowsMatch = workflowsSection.match(/✅\s+\*\*Generated\*\*[^:]*:\s*\n((?:\s*-\s+.+\n?)+)/);
      if (generatedWorkflowsMatch) {
        const lines = generatedWorkflowsMatch[1].split('\n');
        for (const line of lines) {
          const match = line.trim().match(/^-\s+(.+)$/);
          if (match && !match[1].includes('...and')) {
            generatedWorkflows.push(match[1].trim());
          }
        }
      }
    }

    const result: ValidationResult = {
      passed,
      expectedEntities,
      actualEntities,
      expectedWorkflows,
      actualWorkflows,
      missingEntities,
      missingWorkflows,
      generatedEntities,
      generatedWorkflows,
    };

    console.log('📊 Parsed validation report:', result);
    return result;

  } catch (error) {
    console.error('Failed to parse validation report:', error);
    return null;
  }
}

/**
 * Check if a message contains a validation report
 *
 * @param text - The message text
 * @returns true if the message contains a validation report
 */
export function isValidationReport(text: string): boolean {
  return text.includes('Generation Validation:') ||
         text.includes('📊 Generation Validation Report');
}
