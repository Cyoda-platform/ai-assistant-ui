/**
 * Sample data from app_config_example.json
 * This matches the actual app_schema.json structure
 */

import type { AppRoot } from './types/appSchema';

export const sampleAppData: AppRoot = {
  app: {
    name: "Example App",
    description: "An example application",
    version: "1.0.0",
    author: "John Doe",
    license: "MIT",
    repository: "https://github.com/johndoe/example-app",
    requirement: "Example app configuration",
    entities: [],
    environments: []
  }
};

/**
 * Empty app template for new apps
 * Shows only app name, environments group, and entities group
 *
 * Note: This template includes only required fields.
 * Optional fields (description, version, author, license, repository, requirement)
 * can be added later but are not required for validation.
 */
export const emptyAppTemplate: AppRoot = {
  app: {
    name: "New App",
    description: "",
    version: "",
    author: "",
    license: "",
    repository: "",
    requirement: "",
    entities: []
  }
};

/**
 * Export for use in AppsCanvas
 */
export default sampleAppData;

