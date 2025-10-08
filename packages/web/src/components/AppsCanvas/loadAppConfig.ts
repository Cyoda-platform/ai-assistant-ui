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
 */
export function validateAppConfig(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required top-level fields
  if (!config.app) {
    errors.push('Missing required field: app');
    return { valid: false, errors };
  }

  const app = config.app;

  // Check required app fields
  const requiredFields = ['name', 'description', 'version', 'author', 'license', 'repository', 'requirement', 'environments', 'entities'];
  requiredFields.forEach(field => {
    if (!app[field]) {
      errors.push(`Missing required field: app.${field}`);
    }
  });

  // Validate environments
  if (app.environments && Array.isArray(app.environments)) {
    app.environments.forEach((env: any, index: number) => {
      if (!env.name) errors.push(`Missing name in environment ${index}`);
      if (!env.url) errors.push(`Missing url in environment ${index}`);
      if (!env.status) errors.push(`Missing status in environment ${index}`);
    });
  } else {
    errors.push('environments must be an array');
  }

  // Validate entities
  if (app.entities && Array.isArray(app.entities)) {
    app.entities.forEach((entity: any, index: number) => {
      if (!entity.name) errors.push(`Missing name in entity ${index}`);
      if (!entity.version) errors.push(`Missing version in entity ${index}`);
      if (!entity.description) errors.push(`Missing description in entity ${index}`);
      if (!entity.cyoda_url) errors.push(`Missing cyoda_url in entity ${index}`);
      if (!entity.github_url) errors.push(`Missing github_url in entity ${index}`);
      if (!entity.model) errors.push(`Missing model in entity ${index}`);
      if (!entity.workflows) errors.push(`Missing workflows in entity ${index}`);

      // Validate model
      if (entity.model) {
        if (!entity.model.name) errors.push(`Missing model.name in entity ${index}`);
        if (typeof entity.model.age !== 'number') errors.push(`Missing or invalid model.age in entity ${index}`);
        if (!entity.model.breed) errors.push(`Missing model.breed in entity ${index}`);
      }

      // Validate workflows
      if (entity.workflows && Array.isArray(entity.workflows)) {
        entity.workflows.forEach((workflow: any, wIndex: number) => {
          if (!workflow.name) errors.push(`Missing name in entity ${index}, workflow ${wIndex}`);
          if (!workflow.cyoda_url) errors.push(`Missing cyoda_url in entity ${index}, workflow ${wIndex}`);
          if (!workflow.github_url) errors.push(`Missing github_url in entity ${index}, workflow ${wIndex}`);
          if (!workflow.config) errors.push(`Missing config in entity ${index}, workflow ${wIndex}`);

          // Validate workflow config
          if (workflow.config) {
            if (!workflow.config.states) {
              errors.push(`Missing config.states in entity ${index}, workflow ${wIndex}`);
            } else {
              // Validate states
              Object.entries(workflow.config.states).forEach(([stateName, state]: [string, any]) => {
                if (!state.transitions || !Array.isArray(state.transitions)) {
                  errors.push(`Missing or invalid transitions in entity ${index}, workflow ${wIndex}, state ${stateName}`);
                } else {
                  state.transitions.forEach((transition: any, tIndex: number) => {
                    if (!transition.name) errors.push(`Missing name in entity ${index}, workflow ${wIndex}, state ${stateName}, transition ${tIndex}`);
                    if (!transition.next) errors.push(`Missing next in entity ${index}, workflow ${wIndex}, state ${stateName}, transition ${tIndex}`);
                  });
                }
              });
            }
          }
        });
      } else {
        errors.push(`workflows must be an array in entity ${index}`);
      }
    });
  } else {
    errors.push('entities must be an array');
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

