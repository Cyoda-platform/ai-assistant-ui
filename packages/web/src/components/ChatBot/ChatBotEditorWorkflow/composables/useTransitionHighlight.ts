import { useState, useCallback } from 'react'

interface TransitionHighlightState {
  highlightedTransition: string | null;
  highlightedSourceNode: string | null;
  highlightedTargetNode: string | null;
}

export function useTransitionHighlight() {
  const [state, setState] = useState<TransitionHighlightState>({
    highlightedTransition: null,
    highlightedSourceNode: null,
    highlightedTargetNode: null
  });

  const setHighlight = useCallback((transitionId: string, sourceNodeId: string, targetNodeId: string) => {
    setState({
      highlightedTransition: transitionId,
      highlightedSourceNode: sourceNodeId,
      highlightedTargetNode: targetNodeId
    });
  }, []);

  const clearHighlight = useCallback(() => {
    setState({
      highlightedTransition: null,
      highlightedSourceNode: null,
      highlightedTargetNode: null
    });
  }, []);

  const isTransitionHighlighted = useCallback((transitionId: string) => {
    return state.highlightedTransition === transitionId;
  }, [state.highlightedTransition]);

  const isNodeHighlighted = useCallback((nodeId: string) => {
    return state.highlightedSourceNode === nodeId || state.highlightedTargetNode === nodeId;
  }, [state.highlightedSourceNode, state.highlightedTargetNode]);

  const shouldDimNode = useCallback((nodeId: string) => {
    return state.highlightedTransition !== null && !isNodeHighlighted(nodeId);
  }, [state.highlightedTransition, isNodeHighlighted]);

  return {
    highlightedTransition: state.highlightedTransition,
    highlightedSourceNode: state.highlightedSourceNode,
    highlightedTargetNode: state.highlightedTargetNode,
    setHighlight,
    clearHighlight,
    isTransitionHighlighted,
    isNodeHighlighted,
    shouldDimNode
  };
}
