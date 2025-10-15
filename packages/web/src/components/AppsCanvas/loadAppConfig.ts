/**
 * Utility to load app configuration from JSON file
 */

import type { AppRoot } from './types/appSchema';

/**
 * Load app config from the example JSON file
 * This can be used to load the actual app_config_example.json
 */
export async function loadAppConfigFromFile(filePath: string): Promise<AppRoot> {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to load app config: ${response.statusText}`);
    }
    const data = await response.json();
    return data as AppRoot;
  } catch (error) {
    console.error('Error loading app config:', error);
    throw error;
  }
}

/**
 * Load the example app config
 */
export async function loadExampleAppConfig(): Promise<AppRoot> {
  return loadAppConfigFromFile('/app_config_example.json');
}

/**
 * Validate app config against schema
 *
 * Required fields:
 * - app.name (string)
 * - app.entities (array)
 * - entity.name (string) for each entity
 * - workflow.name (string) for each workflow
 *
 * Optional fields:
 * - app.environments (array) - if present, only environment.name is required
 * - All other fields (description, urls, model, etc.) are optional
 */
export function validateAppConfig(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required top-level fields
  if (!config.app) {
    errors.push('Missing required field: app');
    return { valid: false, errors };
  }

  const app = config.app;

  // Only app name is required
  if (!app.name || typeof app.name !== 'string' || !app.name.trim()) {
    errors.push('Missing required field: app.name');
  }

  // Entities array is required (but can be empty)
  if (!Array.isArray(app.entities)) {
    errors.push('app.entities must be an array');
  } else {
    // Validate entities - only name is required
    app.entities.forEach((entity: any, index: number) => {
      if (!entity.name || typeof entity.name !== 'string' || !entity.name.trim()) {
        errors.push(`Missing required field: name in entity ${index}`);
      }

      // Validate workflows if they exist
      if (entity.workflows !== undefined) {
        if (!Array.isArray(entity.workflows)) {
          errors.push(`workflows must be an array in entity ${index}`);
        } else {
          entity.workflows.forEach((workflow: any, wIndex: number) => {
            // Only workflow name is required
            if (!workflow.name || typeof workflow.name !== 'string' || !workflow.name.trim()) {
              errors.push(`Missing required field: name in entity ${index}, workflow ${wIndex}`);
            }
          });
        }
      }
    });
  }

  // Validate environments if they exist (optional)
  if (app.environments !== undefined) {
    if (!Array.isArray(app.environments)) {
      errors.push('app.environments must be an array');
    } else {
      app.environments.forEach((env: any, index: number) => {
        // Only environment name is required
        if (!env.name || typeof env.name !== 'string' || !env.name.trim()) {
          errors.push(`Missing required field: name in environment ${index}`);
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Save app config to JSON string
 */
export function saveAppConfigToJson(config: AppRoot, pretty: boolean = true): string {
  return JSON.stringify(config, null, pretty ? 2 : 0);
}

/**
 * Download app config as JSON file
 */
export function downloadAppConfig(config: AppRoot, filename: string = 'app_config.json'): void {
  const json = saveAppConfigToJson(config);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

