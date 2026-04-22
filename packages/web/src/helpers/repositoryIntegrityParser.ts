/**
 * Parse repository integrity check report from AI message text
 *
 * The backend sends integrity check reports in markdown format after git pull.
 * This parser extracts the structured data needed for the PullStatusDialog component.
 */

export interface RepositoryIntegrityResult {
  appType: string;
  entitiesFound: number;
  workflowsFound: number;
  requirementsFound: number;
  entityNames: string[];
  workflowNames: string[];
  hasValidation: boolean;
  validationPassed?: boolean;
  validationMessage?: string;
  recommendations: string[];
}

/**
 * Parse a repository integrity check report from AI message text
 *
 * Expected format:
 * ```
 * ✅ Repository Integrity Check Complete
 *
 * ### Summary
 * - **App Type**: python
 * - **Entities Found**: 3
 * - **Workflows Found**: 5
 * - **Requirements Found**: 1
 *
 * ### Entities
 *   ✅ User (v1)
 *   ✅ Product (v1)
 *   ✅ Order (v1)
 *
 * ### Workflows
 *   ✅ User v1 - CreateUser.json
 *   ✅ Product v1 - CreateProduct.json
 * ...
 * ```
 *
 * @param text - The AI message text containing integrity report
 * @returns RepositoryIntegrityResult or null if no report found
 */
export function parseRepositoryIntegrityReport(
  text: string
): RepositoryIntegrityResult | null {
  // Check if this message contains an integrity check report
  const hasIntegrityCheck =
    text.includes('Repository Integrity Check') ||
    text.includes('Verifying repository integrity');

  if (!hasIntegrityCheck) {
    return null;
  }

  try {
    // Extract app type
    const appTypeMatch = text.match(/\*\*App Type\*\*:\s*(\w+)/i);
    const appType = appTypeMatch ? appTypeMatch[1] : 'unknown';

    // Extract counts
    const entitiesMatch = text.match(/\*\*Entities Found\*\*:\s*(\d+)/i);
    const workflowsMatch = text.match(/\*\*Workflows Found\*\*:\s*(\d+)/i);
    const requirementsMatch = text.match(/\*\*Requirements Found\*\*:\s*(\d+)/i);

    const entitiesFound = entitiesMatch ? parseInt(entitiesMatch[1], 10) : 0;
    const workflowsFound = workflowsMatch ? parseInt(workflowsMatch[1], 10) : 0;
    const requirementsFound = requirementsMatch
      ? parseInt(requirementsMatch[1], 10)
      : 0;

    // Extract entity names
    const entityNames: string[] = [];
    const entitiesSection = text.match(
      /### Entities\s*\n((?:\s*✅\s+.+\n?)+)/
    );
    if (entitiesSection) {
      const lines = entitiesSection[1].split('\n');
      for (const line of lines) {
        const match = line.trim().match(/^✅\s+(.+?)\s+\(v\d+\)/);
        if (match) {
          entityNames.push(match[1].trim());
        }
      }
    }

    // Extract workflow names
    const workflowNames: string[] = [];
    const workflowsSection = text.match(
      /### Workflows\s*\n((?:\s*✅\s+.+\n?)+)/
    );
    if (workflowsSection) {
      const lines = workflowsSection[1].split('\n');
      for (const line of lines) {
        const match = line.trim().match(/^✅\s+(.+?)\s+v\d+\s+-\s+(.+)$/);
        if (match) {
          const entityName = match[1].trim();
          const workflowFile = match[2].trim().replace('.json', '');
          workflowNames.push(`${entityName}.${workflowFile}`);
        }
      }
    }

    // Check for validation section
    let hasValidation = false;
    let validationPassed: boolean | undefined;
    let validationMessage: string | undefined;

    if (text.includes('### Validation Against Requirements')) {
      hasValidation = true;
      validationPassed = text.includes('✅ Generation Validation: PASSED');

      // Extract validation message (everything between validation header and next ### or end)
      const validationMatch = text.match(
        /### Validation Against Requirements\s*\n([\s\S]*?)(?=###|$)/
      );
      if (validationMatch) {
        validationMessage = validationMatch[1].trim();
      }
    }

    // Extract recommendations
    const recommendations: string[] = [];
    const recommendationsSection = text.match(
      /### Recommendations\s*\n([\s\S]*?)$/
    );
    if (recommendationsSection) {
      const lines = recommendationsSection[1].split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (
          trimmed &&
          (trimmed.startsWith('⚠️') ||
            trimmed.startsWith('ℹ️') ||
            trimmed.startsWith('✅') ||
            trimmed.startsWith('-'))
        ) {
          recommendations.push(trimmed);
        }
      }
    }

    const result: RepositoryIntegrityResult = {
      appType,
      entitiesFound,
      workflowsFound,
      requirementsFound,
      entityNames,
      workflowNames,
      hasValidation,
      validationPassed,
      validationMessage,
      recommendations,
    };

    console.log('📊 Parsed repository integrity report:', result);
    return result;
  } catch (error) {
    console.error('Failed to parse repository integrity report:', error);
    return null;
  }
}

/**
 * Check if a message contains a repository integrity report
 *
 * @param text - The message text
 * @returns true if the message contains an integrity report
 */
export function isRepositoryIntegrityReport(text: string): boolean {
  return (
    text.includes('Repository Integrity Check') ||
    text.includes('Verifying repository integrity')
  );
}
