/**
 * Sample data from app_config_example.json
 * This matches the actual app_schema.json structure
 */

import type { AppRoot } from './types/appSchema';

export const sampleAppData: AppRoot = {
  app: {
    name: "pet store",
    description: "A pet store API",
    version: "1.0.0",
    author: "John Doe",
    license: "MIT",
    repository: "https://github.com/johndoe/pet-store",
    requirement: "please build an app for pet store",

    environments: [
      {
        name: "production",
        url: "https://api.example.com",
        status: "active"
      }
    ],

    entities: [
      {
        name: "pet",
        version: "1",
        description: "A pet",
        cyoda_url: "https://example.com/workflows/pet-adoption",
        github_url: "https://github.com/johndoe/pet-adoption",
        model: {
          name: "Tom",
          age: 3,
          breed: "Persian"
        },
        workflows: [
          {
            name: "pet adoption",
            cyoda_url: "https://example.com/workflows/pet-adoption",
            github_url: "https://github.com/johndoe/pet-adoption",
            config: {
              states: {
                initial: {
                  transitions: [
                    {
                      name: "adopt",
                      next: "adopted"
                    }
                  ]
                },
                adopted: {
                  transitions: []
                }
              }
            }
          }
        ]
      }
    ]
  }
};

/**
 * Export for use in AppsCanvas
 */
export default sampleAppData;

