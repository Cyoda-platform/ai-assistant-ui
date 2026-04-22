import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUndoRedo } from './useUndoRedo';

describe('useUndoRedo', () => {
  describe('initial state', () => {
    it('should initialize with empty history', () => {
      const { result } = renderHook(() => useUndoRedo());

      expect(result.current.history).toEqual([]);
      expect(result.current.currentIndex).toBe(-1);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });

    it('should accept custom max history size', () => {
      const { result } = renderHook(() => useUndoRedo(100));

      expect(result.current.history).toEqual([]);
    });
  });

  describe('initialize', () => {
    it('should initialize with initial data', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.initialize('initial state');
      });

      expect(result.current.history).toEqual(['initial state']);
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('saveState', () => {
    it('should save new state', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.saveState('state 1');
      });

      expect(result.current.history).toEqual(['state 1']);
      expect(result.current.currentIndex).toBe(0);
    });

    it('should save multiple states', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.saveState('state 1');
      });
      act(() => {
        result.current.saveState('state 2');
      });
      act(() => {
        result.current.saveState('state 3');
      });

      expect(result.current.history).toEqual(['state 1', 'state 2', 'state 3']);
      expect(result.current.currentIndex).toBe(2);
    });

    it('should not save duplicate state', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.saveState('state 1');
        result.current.saveState('state 1');
      });

      expect(result.current.history).toEqual(['state 1']);
      expect(result.current.currentIndex).toBe(0);
    });

    it('should respect max history size', () => {
      const { result } = renderHook(() => useUndoRedo(3));

      act(() => result.current.saveState('state 1'));
      act(() => result.current.saveState('state 2'));
      act(() => result.current.saveState('state 3'));
      act(() => result.current.saveState('state 4'));

      expect(result.current.history).toEqual(['state 2', 'state 3', 'state 4']);
      expect(result.current.currentIndex).toBe(2);
    });

    it('should discard redo history when saving new state after undo', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => result.current.saveState('state 1'));
      act(() => result.current.saveState('state 2'));
      act(() => result.current.saveState('state 3'));
      act(() => result.current.undo());
      act(() => result.current.undo());
      act(() => result.current.saveState('state 2b'));

      expect(result.current.history).toEqual(['state 1', 'state 2b']);
      expect(result.current.currentIndex).toBe(1);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('undo', () => {
    it('should return previous state', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => result.current.saveState('state 1'));
      act(() => result.current.saveState('state 2'));

      let previousState;
      act(() => {
        previousState = result.current.undo();
      });

      expect(previousState).toBe('state 1');
      expect(result.current.currentIndex).toBe(0);
    });

    it('should enable redo after undo', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => result.current.saveState('state 1'));
      act(() => result.current.saveState('state 2'));
      act(() => result.current.undo());

      expect(result.current.canRedo).toBe(true);
    });

    it('should return null when cannot undo', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.saveState('state 1');
      });

      let previousState;
      act(() => {
        previousState = result.current.undo();
      });

      expect(previousState).toBeNull();
    });

    it('should handle multiple undos', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => result.current.saveState('state 1'));
      act(() => result.current.saveState('state 2'));
      act(() => result.current.saveState('state 3'));

      let state;
      act(() => result.current.undo());
      act(() => {
        state = result.current.undo();
      });

      expect(state).toBe('state 1');
      expect(result.current.currentIndex).toBe(0);
    });
  });

  describe('redo', () => {
    it('should return next state', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => result.current.saveState('state 1'));
      act(() => result.current.saveState('state 2'));
      act(() => result.current.undo());

      let nextState;
      act(() => {
        nextState = result.current.redo();
      });

      expect(nextState).toBe('state 2');
      expect(result.current.currentIndex).toBe(1);
    });

    it('should return null when cannot redo', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.saveState('state 1');
      });

      let nextState;
      act(() => {
        nextState = result.current.redo();
      });

      expect(nextState).toBeNull();
    });

    it('should handle multiple redos', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => result.current.saveState('state 1'));
      act(() => result.current.saveState('state 2'));
      act(() => result.current.saveState('state 3'));
      act(() => result.current.undo());
      act(() => result.current.undo());

      let state;
      act(() => result.current.redo());
      act(() => {
        state = result.current.redo();
      });

      expect(state).toBe('state 3');
      expect(result.current.currentIndex).toBe(2);
    });
  });

  describe('canUndo', () => {
    it('should be false initially', () => {
      const { result } = renderHook(() => useUndoRedo());

      expect(result.current.canUndo).toBe(false);
    });

    it('should be false with one state', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.saveState('state 1');
      });

      expect(result.current.canUndo).toBe(false);
    });

    it('should be true with two or more states', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => result.current.saveState('state 1'));
      act(() => result.current.saveState('state 2'));

      expect(result.current.canUndo).toBe(true);
    });

    it('should be false after undoing to first state', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => result.current.saveState('state 1'));
      act(() => result.current.saveState('state 2'));
      act(() => result.current.undo());

      expect(result.current.canUndo).toBe(false);
    });
  });

  describe('canRedo', () => {
    it('should be false initially', () => {
      const { result } = renderHook(() => useUndoRedo());

      expect(result.current.canRedo).toBe(false);
    });

    it('should be false without undo', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => result.current.saveState('state 1'));
      act(() => result.current.saveState('state 2'));

      expect(result.current.canRedo).toBe(false);
    });

    it('should be true after undo', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => result.current.saveState('state 1'));
      act(() => result.current.saveState('state 2'));
      act(() => result.current.undo());

      expect(result.current.canRedo).toBe(true);
    });

    it('should be false after redoing to latest state', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => result.current.saveState('state 1'));
      act(() => result.current.saveState('state 2'));
      act(() => result.current.undo());
      act(() => result.current.redo());

      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('complex scenarios', () => {
    it('should handle undo-redo-undo sequence', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => result.current.saveState('state 1'));
      act(() => result.current.saveState('state 2'));
      act(() => result.current.saveState('state 3'));

      act(() => result.current.undo()); // back to state 2
      act(() => result.current.redo()); // forward to state 3
      act(() => result.current.undo()); // back to state 2

      expect(result.current.currentIndex).toBe(1);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(true);
    });

    it('should handle large history correctly', () => {
      const { result } = renderHook(() => useUndoRedo(5));

      for (let i = 1; i <= 10; i++) {
        act(() => result.current.saveState(`state ${i}`));
      }

      expect(result.current.history).toEqual([
        'state 6',
        'state 7',
        'state 8',
        'state 9',
        'state 10'
      ]);
      expect(result.current.currentIndex).toBe(4);
    });

    it('should maintain consistency after multiple operations', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => result.current.saveState('A'));
      act(() => result.current.saveState('B'));
      act(() => result.current.saveState('C'));
      act(() => result.current.undo()); // back to B, history: [A, B, C], index: 1
      act(() => result.current.saveState('D')); // discard C, add D, history: [A, B, D], index: 2
      act(() => result.current.saveState('E')); // history: [A, B, D, E], index: 3
      act(() => result.current.undo()); // back to D, index: 2
      act(() => result.current.undo()); // back to B, index: 1

      expect(result.current.history).toEqual(['A', 'B', 'D', 'E']);
      expect(result.current.currentIndex).toBe(1);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(true);
    });
  });
});
