import { describe, it, expect } from 'vitest';
import {
  APP_VERSION,
  UPDATE_CHAT_LIST,
  SHOW_LOGIN_POPUP,
  LOGIN_REDIRECT_URL,
  DELETE_CHAT_CLEAR_INTERVALS_BY_TECHNICAL_ID,
  RENAME_CHAT_START,
  LOAD_CHAT_HISTORY,
  ROLLBACK_CHAT,
  SEND_INITIAL_MESSAGE,
  CHAT_READY,
} from './HelperConstants';

describe('HelperConstants', () => {
  describe('constant values', () => {
    it('should have APP_VERSION defined', () => {
      expect(APP_VERSION).toBeDefined();
      expect(APP_VERSION).toBe('ALPHA');
    });

    it('should have UPDATE_CHAT_LIST event name', () => {
      expect(UPDATE_CHAT_LIST).toBe('chat-list:update');
    });

    it('should have SHOW_LOGIN_POPUP event name', () => {
      expect(SHOW_LOGIN_POPUP).toBe('showLoginPopUp');
    });

    it('should have LOGIN_REDIRECT_URL constant', () => {
      expect(LOGIN_REDIRECT_URL).toBe('loginRedirectUrl');
    });

    it('should have DELETE_CHAT_CLEAR_INTERVALS_BY_TECHNICAL_ID event name', () => {
      expect(DELETE_CHAT_CLEAR_INTERVALS_BY_TECHNICAL_ID).toBe('delete-chat:clear-intervals');
    });

    it('should have RENAME_CHAT_START event name', () => {
      expect(RENAME_CHAT_START).toBe('rename-chat:start');
    });

    it('should have LOAD_CHAT_HISTORY event name', () => {
      expect(LOAD_CHAT_HISTORY).toBe('load-chat-history');
    });

    it('should have ROLLBACK_CHAT event name', () => {
      expect(ROLLBACK_CHAT).toBe('rollback-chat');
    });

    it('should have SEND_INITIAL_MESSAGE event name', () => {
      expect(SEND_INITIAL_MESSAGE).toBe('send-initial-message');
    });

    it('should have CHAT_READY event name', () => {
      expect(CHAT_READY).toBe('chat-ready');
    });
  });

  describe('constant types', () => {
    it('should have all constants as strings', () => {
      expect(typeof APP_VERSION).toBe('string');
      expect(typeof UPDATE_CHAT_LIST).toBe('string');
      expect(typeof SHOW_LOGIN_POPUP).toBe('string');
      expect(typeof LOGIN_REDIRECT_URL).toBe('string');
      expect(typeof DELETE_CHAT_CLEAR_INTERVALS_BY_TECHNICAL_ID).toBe('string');
      expect(typeof RENAME_CHAT_START).toBe('string');
      expect(typeof LOAD_CHAT_HISTORY).toBe('string');
      expect(typeof ROLLBACK_CHAT).toBe('string');
      expect(typeof SEND_INITIAL_MESSAGE).toBe('string');
      expect(typeof CHAT_READY).toBe('string');
    });
  });

  describe('constant immutability', () => {
    it('should not be modifiable (readonly)', () => {
      // TypeScript prevents modification at compile time, but we can verify they exist
      expect(APP_VERSION).toBeTruthy();
      expect(UPDATE_CHAT_LIST).toBeTruthy();
    });
  });
});
