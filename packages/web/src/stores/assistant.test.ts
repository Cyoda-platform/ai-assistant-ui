import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAssistantStore } from './assistant';

// Mock dependencies
vi.mock('@/clients/private', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('@/services/streamingService', () => ({
  default: {
    streamMessage: vi.fn(),
  },
}));

vi.mock('@/helpers/HelperStorage', () => ({
  default: class {
    private storage = new Map();
    get(key: string, defaultValue: any) {
      return this.storage.get(key) ?? defaultValue;
    }
    set(key: string, value: any) {
      this.storage.set(key, value);
    }
  },
}));

vi.mock('./auth', () => ({
  useAuthStore: {
    getState: () => ({
      token: '',
      tokenType: '',
    }),
  },
}));

describe('assistantStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAssistantStore.setState({
      chatList: null,
      chatListReady: false,
      guestChatsExist: false,
      isLoadingChats: false,
      isTransferringChats: false,
      pointInTime: null,
      nextPointInTime: null,
      hasMoreChats: false,
      isLoadingMoreChats: false,
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with null chatList', () => {
      const { chatList } = useAssistantStore.getState();
      expect(chatList).toBeNull();
    });

    it('should initialize with chatListReady as false', () => {
      const { chatListReady } = useAssistantStore.getState();
      expect(chatListReady).toBe(false);
    });

    it('should initialize with no guest chats', () => {
      const { guestChatsExist } = useAssistantStore.getState();
      expect(guestChatsExist).toBe(false);
    });

    it('should initialize with no loading state', () => {
      const { isLoadingChats, isLoadingMoreChats } = useAssistantStore.getState();
      expect(isLoadingChats).toBe(false);
      expect(isLoadingMoreChats).toBe(false);
    });

    it('should initialize with no pagination', () => {
      const { pointInTime, nextPointInTime, hasMoreChats } = useAssistantStore.getState();
      expect(pointInTime).toBeNull();
      expect(nextPointInTime).toBeNull();
      expect(hasMoreChats).toBe(false);
    });
  });

  describe('computed values', () => {
    it('should have empty or null chatList initially', () => {
      const { chatList } = useAssistantStore.getState();
      expect(chatList === null || chatList?.length === 0).toBe(true);
    });

    it('should track guestChatsExist state', () => {
      useAssistantStore.setState({ guestChatsExist: true });
      expect(useAssistantStore.getState().guestChatsExist).toBe(true);

      useAssistantStore.setState({ guestChatsExist: false });
      expect(useAssistantStore.getState().guestChatsExist).toBe(false);
    });
  });

  describe('setGuestChatsExist', () => {
    it('should set guestChatsExist to true', () => {
      const { setGuestChatsExist } = useAssistantStore.getState();

      const result = setGuestChatsExist(true);

      expect(result).toBe(true);
      expect(useAssistantStore.getState().guestChatsExist).toBe(true);
    });

    it('should set guestChatsExist to false', () => {
      const { setGuestChatsExist } = useAssistantStore.getState();

      setGuestChatsExist(true);
      const result = setGuestChatsExist(false);

      expect(result).toBe(false);
      expect(useAssistantStore.getState().guestChatsExist).toBe(false);
    });
  });

  describe('setIsTransferringChats', () => {
    it('should set isTransferringChats to true', () => {
      const { setIsTransferringChats } = useAssistantStore.getState();

      setIsTransferringChats(true);

      expect(useAssistantStore.getState().isTransferringChats).toBe(true);
    });

    it('should set isTransferringChats to false', () => {
      const { setIsTransferringChats } = useAssistantStore.getState();

      setIsTransferringChats(true);
      setIsTransferringChats(false);

      expect(useAssistantStore.getState().isTransferringChats).toBe(false);
    });
  });

  describe('chat list state', () => {
    it('should update chatList', () => {
      const mockChats = [
        { technical_id: '1', name: 'Chat 1' },
        { technical_id: '2', name: 'Chat 2' },
      ] as any;

      useAssistantStore.setState({ chatList: mockChats });

      expect(useAssistantStore.getState().chatList).toEqual(mockChats);
    });

    it('should update chatListReady', () => {
      useAssistantStore.setState({ chatListReady: true });
      expect(useAssistantStore.getState().chatListReady).toBe(true);
    });

    it('should update loading states', () => {
      useAssistantStore.setState({
        isLoadingChats: true,
        isLoadingMoreChats: true,
      });

      expect(useAssistantStore.getState().isLoadingChats).toBe(true);
      expect(useAssistantStore.getState().isLoadingMoreChats).toBe(true);
    });

    it('should update pagination state', () => {
      useAssistantStore.setState({
        pointInTime: '2024-01-01',
        nextPointInTime: '2024-01-02',
        hasMoreChats: true,
      });

      const state = useAssistantStore.getState();
      expect(state.pointInTime).toBe('2024-01-01');
      expect(state.nextPointInTime).toBe('2024-01-02');
      expect(state.hasMoreChats).toBe(true);
    });
  });

  describe('postChats', () => {
    it('should create a new chat', async () => {
      const privateClient = (await import('@/clients/private')).default;
      const mockResponse = { data: { technical_id: 'new-chat-123', name: 'New Chat' } };
      vi.mocked(privateClient.post).mockResolvedValue(mockResponse);

      const { postChats } = useAssistantStore.getState();
      const result = await postChats({ name: 'New Chat' } as any);

      expect(privateClient.post).toHaveBeenCalledWith('/v1/chats', { name: 'New Chat' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('postTextAnswers', () => {
    it('should post text answer for a chat', async () => {
      const privateClient = (await import('@/clients/private')).default;
      const mockResponse = { data: { success: true } };
      vi.mocked(privateClient.post).mockResolvedValue(mockResponse);

      const { postTextAnswers } = useAssistantStore.getState();
      const result = await postTextAnswers('chat-123', { text: 'Answer' });

      expect(privateClient.post).toHaveBeenCalledWith('/v1/chats/chat-123/text-answers', { text: 'Answer' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('postAnswers', () => {
    it('should post answer for a chat', async () => {
      const privateClient = (await import('@/clients/private')).default;
      const mockResponse = { data: { success: true } };
      vi.mocked(privateClient.post).mockResolvedValue(mockResponse);

      const { postAnswers } = useAssistantStore.getState();
      const result = await postAnswers('chat-123', { answer: 'data' });

      expect(privateClient.post).toHaveBeenCalledWith('/v1/chats/chat-123/answers', { answer: 'data' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('postTextQuestions', () => {
    it('should post text question', async () => {
      const privateClient = (await import('@/clients/private')).default;
      const mockResponse = { data: { success: true } };
      vi.mocked(privateClient.post).mockResolvedValue(mockResponse);

      const { postTextQuestions } = useAssistantStore.getState();
      const result = await postTextQuestions('chat-123', { text: 'Question' });

      expect(privateClient.post).toHaveBeenCalledWith('/v1/chats/text-questions', { text: 'Question' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('postQuestions', () => {
    it('should post question', async () => {
      const privateClient = (await import('@/clients/private')).default;
      const mockResponse = { data: { success: true } };
      vi.mocked(privateClient.post).mockResolvedValue(mockResponse);

      const { postQuestions } = useAssistantStore.getState();
      const result = await postQuestions('chat-123', { question: 'data' });

      expect(privateClient.post).toHaveBeenCalledWith('/v1/chats/questions', { question: 'data' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('postWorkflowQuestions', () => {
    it('should post workflow question', async () => {
      const privateClient = (await import('@/clients/private')).default;
      const mockResponse = { data: { success: true } };
      vi.mocked(privateClient.post).mockResolvedValue(mockResponse);

      const { postWorkflowQuestions } = useAssistantStore.getState();
      const result = await postWorkflowQuestions({ workflow: 'data' });

      expect(privateClient.post).toHaveBeenCalledWith('/v1/chats/workflow-questions', { workflow: 'data' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('postCanvasQuestion', () => {
    it('should post canvas question', async () => {
      const privateClient = (await import('@/clients/private')).default;
      const mockResponse = { data: { success: true } };
      vi.mocked(privateClient.post).mockResolvedValue(mockResponse);

      const { postCanvasQuestion } = useAssistantStore.getState();
      const result = await postCanvasQuestion({ canvas: 'data' });

      expect(privateClient.post).toHaveBeenCalledWith('/v1/chats/canvas-questions', { canvas: 'data' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getChats', () => {
    it('should load chats successfully', async () => {
      const privateClient = (await import('@/clients/private')).default;
      const mockChats = [
        { technical_id: '1', name: 'Chat 1' },
        { technical_id: '2', name: 'Chat 2' }
      ];
      const mockResponse = {
        data: {
          chats: mockChats,
          point_in_time: 'pt-1',
          next_point_in_time: 'pt-2',
          has_more: true
        }
      };
      vi.mocked(privateClient.get).mockResolvedValue(mockResponse);

      const { getChats } = useAssistantStore.getState();
      await getChats();

      const state = useAssistantStore.getState();
      expect(state.chatList).toEqual(mockChats);
      expect(state.chatListReady).toBe(true);
      expect(state.pointInTime).toBe('pt-1');
      expect(state.nextPointInTime).toBe('pt-2');
      expect(state.hasMoreChats).toBe(true);
      expect(state.isLoadingChats).toBe(false);
    });

    it('should prevent concurrent calls', async () => {
      const privateClient = (await import('@/clients/private')).default;
      useAssistantStore.setState({ isLoadingChats: true });

      const { getChats } = useAssistantStore.getState();
      await getChats();

      expect(privateClient.get).not.toHaveBeenCalled();
    });

    it('should skip loading when transferring chats', async () => {
      const privateClient = (await import('@/clients/private')).default;
      useAssistantStore.setState({ isTransferringChats: true });

      const { getChats } = useAssistantStore.getState();
      await getChats();

      expect(privateClient.get).not.toHaveBeenCalled();
    });

    it('should reset pagination when reset is true', async () => {
      const privateClient = (await import('@/clients/private')).default;
      const mockResponse = {
        data: {
          chats: [],
          point_in_time: null,
          next_point_in_time: null,
          has_more: false
        }
      };
      vi.mocked(privateClient.get).mockResolvedValue(mockResponse);

      useAssistantStore.setState({
        chatList: [{ technical_id: 'old' }] as any,
        pointInTime: 'old-pt',
        nextPointInTime: 'old-next',
        hasMoreChats: true
      });

      const { getChats } = useAssistantStore.getState();
      await getChats(true);

      expect(privateClient.get).toHaveBeenCalledWith('/v1/chats', { params: {} });
    });

    it('should handle errors', async () => {
      const privateClient = (await import('@/clients/private')).default;
      const error = new Error('API Error');
      vi.mocked(privateClient.get).mockRejectedValue(error);

      const { getChats } = useAssistantStore.getState();

      await expect(getChats()).rejects.toThrow('API Error');

      const state = useAssistantStore.getState();
      expect(state.isLoadingChats).toBe(false);
      expect(state.chatListReady).toBe(false);
    });
  });

  describe('deleteChatById', () => {
    it('should delete a chat', async () => {
      const privateClient = (await import('@/clients/private')).default;
      const mockResponse = { data: { success: true } };
      vi.mocked(privateClient.delete).mockResolvedValue(mockResponse);

      const { deleteChatById } = useAssistantStore.getState();
      const result = await deleteChatById('chat-123');

      expect(privateClient.delete).toHaveBeenCalledWith('/v1/chats/chat-123');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('renameChatById', () => {
    it('should rename a chat', async () => {
      const privateClient = (await import('@/clients/private')).default;
      const mockResponse = { data: { success: true } };
      vi.mocked(privateClient.put).mockResolvedValue(mockResponse);

      const { renameChatById } = useAssistantStore.getState();
      const result = await renameChatById('chat-123', { name: 'New Name' });

      expect(privateClient.put).toHaveBeenCalledWith('/v1/chats/chat-123', { name: 'New Name' });
      expect(result).toEqual(mockResponse);
    });
  });
});
