/**
 * Parse FR consolidation validation report from AI message text
 *
 * The backend sends FR validation reports in markdown format.
 * This parser extracts the structured data for the UI.
 */

export interface FRValidationResult {
  passed: boolean;
  sourceDocumentCount: number;
  keyRequirementsIdentified: number;
  requirementsMatched: number;
  requirementsMissing: number;
  matchPercentage: number;
  matchedRequirements: string[];
  missingRequirements: string[];
  sourceDocuments: Array<{ name: string; requirementCount: number }>;
  recommendations: string[];
}

/**
 * Parse a FR consolidation validation report from AI message text
 *
 * Expected format:
 * ```
 * ✅ FR Consolidation Validation: PASSED
 * or
 * ⚠️ FR Consolidation Validation: REVIEW NEEDED
 *
 * ### Summary
 * - **Source Documents**: 4 files
 * - **Key Requirements Identified**: 25
 * - **Requirements Matched**: 23 (92.0%)
 * - **Potentially Missing**: 2
 *
 * ### Source Documents
 * - **doc1.md**: 8 requirements extracted
 * - **doc2.md**: 10 requirements extracted
 *
 * ### ✅ Matched Requirements (23)
 *    ✅ User authentication and login (from doc1.md)
 *    ✅ Password reset functionality (from doc1.md)
 *
 * ### ⚠️ Potentially Missing Requirements (2)
 *    - Multi-factor authentication (from doc1.md)
 *    - Session timeout configuration (from doc2.md)
 *
 * ### 💡 Recommendations
 * ✅ Consolidated FR appears to cover most source requirements
 * ```
 *
 * @param text - The AI message text containing FR validation report
 * @returns FRValidationResult or null if no report found
 */
export function parseFRValidationReport(text: string): FRValidationResult | null {
  // Check if this message contains a FR validation report
  const hasFRValidation =
    text.includes('FR Consolidation Validation:') ||
    text.includes('Functional Requirements Validation');

  if (!hasFRValidation) {
    return null;
  }

  try {
    // Determine if validation passed
    const passed =
      text.includes('✅ **FR Consolidation Validation: PASSED**') ||
      text.includes('✅ FR Consolidation Validation: PASSED');

    // Extract summary counts
    const sourceDocsMatch = text.match(
      /\*\*Source Documents\*\*:\s*(\d+)\s*files?/i
    );
    const keyReqsMatch = text.match(
      /\*\*Key Requirements Identified\*\*:\s*(\d+)/i
    );
    const matchedMatch = text.match(
      /\*\*Requirements Matched\*\*:\s*(\d+)\s*\((\d+\.?\d*)%\)/i
    );
    const missingMatch = text.match(/\*\*Potentially Missing\*\*:\s*(\d+)/i);

    const sourceDocumentCount = sourceDocsMatch
      ? parseInt(sourceDocsMatch[1], 10)
      : 0;
    const keyRequirementsIdentified = keyReqsMatch
      ? parseInt(keyReqsMatch[1], 10)
      : 0;
    const requirementsMatched = matchedMatch
      ? parseInt(matchedMatch[1], 10)
      : 0;
    const matchPercentage = matchedMatch ? parseFloat(matchedMatch[2]) : 0;
    const requirementsMissing = missingMatch ? parseInt(missingMatch[1], 10) : 0;

    // Extract source documents
    const sourceDocuments: Array<{ name: string; requirementCount: number }> = [];
    const sourceDocsSection = text.match(
      /### Source Documents\s*\n((?:.*\n)*?)(?=###|$)/
    );

    if (sourceDocsSection) {
      const lines = sourceDocsSection[1].split('\n');
      for (const line of lines) {
        const match = line.match(/\*\*(.+?)\*\*:\s*(\d+)\s*requirements?/i);
        if (match) {
          sourceDocuments.push({
            name: match[1].trim(),
            requirementCount: parseInt(match[2], 10),
          });
        }
      }
    }

    // Extract matched requirements
    const matchedRequirements: string[] = [];
    const matchedSection = text.match(
      /### ✅ Matched Requirements.*?\n((?:.*\n)*?)(?=###|$)/
    );

    if (matchedSection) {
      const lines = matchedSection[1].split('\n');
      for (const line of lines) {
        const match = line.match(/[✅⚡]\s+(.+?)\s+\(from/);
        if (match) {
          matchedRequirements.push(match[1].trim());
        }
      }
    }

    // Extract missing requirements
    const missingRequirements: string[] = [];
    const missingSection = text.match(
      /### ⚠️ Potentially Missing Requirements.*?\n((?:.*\n)*?)(?=###|$)/
    );

    if (missingSection) {
      const lines = missingSection[1].split('\n');
      for (const line of lines) {
        const match = line.match(/[-•]\s+(.+?)\s+\(from/);
        if (match) {
          missingRequirements.push(match[1].trim());
        }
      }
    }

    // Extract recommendations
    const recommendations: string[] = [];
    const recsSection = text.match(/### 💡 Recommendations\s*\n((?:.*\n)*?)$/);

    if (recsSection) {
      const lines = recsSection[1].split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (
          trimmed &&
          (trimmed.startsWith('✅') ||
            trimmed.startsWith('⚠️') ||
            trimmed.startsWith('📝') ||
            trimmed.startsWith('🔍') ||
            trimmed.startsWith('ℹ️'))
        ) {
          recommendations.push(trimmed);
        }
      }
    }

    const result: FRValidationResult = {
      passed,
      sourceDocumentCount,
      keyRequirementsIdentified,
      requirementsMatched,
      requirementsMissing,
      matchPercentage,
      matchedRequirements,
      missingRequirements,
      sourceDocuments,
      recommendations,
    };

    console.log('📊 Parsed FR validation report:', result);
    return result;
  } catch (error) {
    console.error('Failed to parse FR validation report:', error);
    return null;
  }
}

/**
 * Check if a message contains a FR validation report
 *
 * @param text - The message text
 * @returns true if the message contains a FR validation report
 */
export function isFRValidationReport(text: string): boolean {
  return (
    text.includes('FR Consolidation Validation:') ||
    text.includes('Functional Requirements Validation')
  );
}
