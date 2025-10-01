// ABOUTME: This file provides application configuration management with localStorage persistence
// and default configuration values for the State Machine Workflow Editor.

import type { AppConfiguration } from '../types/workflow';

const CONFIG_STORAGE_KEY = 'statemachine-ui-config';

// Default configuration values
const DEFAULT_CONFIG: AppConfiguration = {
  history: {
    maxDepth: 50
  },
  ui: {
    darkMode: false
  }
};

export class ConfigService {
  private static instance: ConfigService;
  private config: AppConfiguration;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * Load configuration from localStorage or return defaults
   */
  private loadConfig(): AppConfiguration {
    try {
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all properties exist
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          history: {
            ...DEFAULT_CONFIG.history,
            ...parsed.history
          },
          ui: {
            ...DEFAULT_CONFIG.ui,
            ...parsed.ui
          }
        };
      }
    } catch (error) {
      console.warn('Failed to load configuration from localStorage:', error);
    }
    return { ...DEFAULT_CONFIG };
  }

  /**
   * Save configuration to localStorage
   */
  private saveConfig(): void {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save configuration to localStorage:', error);
    }
  }

  /**
   * Get the current configuration
   */
  public getConfig(): AppConfiguration {
    return { ...this.config };
  }

  /**
   * Update configuration and persist to localStorage
   */
  public updateConfig(updates: Partial<AppConfiguration>): void {
    this.config = {
      ...this.config,
      ...updates,
      history: {
        ...this.config.history,
        ...updates.history
      },
      ui: {
        ...this.config.ui,
        ...updates.ui
      }
    };
    this.saveConfig();
  }

  /**
   * Get history configuration
   */
  public getHistoryConfig() {
    return this.config.history;
  }

  /**
   * Get UI configuration
   */
  public getUIConfig() {
    return this.config.ui;
  }

  /**
   * Reset configuration to defaults
   */
  public resetToDefaults(): void {
    this.config = { ...DEFAULT_CONFIG };
    this.saveConfig();
  }
}

// Export singleton instance
export const configService = ConfigService.getInstance();
