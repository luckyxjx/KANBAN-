import { useState, useCallback } from 'react';

export interface OptimisticAction<T = any> {
  id: string;
  type: string;
  data: T;
  timestamp: number;
}

export interface OptimisticState<T> {
  originalState: T;
  optimisticState: T;
  pendingActions: OptimisticAction[];
}

export function useOptimisticUpdates<T>(initialState: T) {
  const [state, setState] = useState<OptimisticState<T>>({
    originalState: initialState,
    optimisticState: initialState,
    pendingActions: [],
  });

  const applyOptimisticUpdate = useCallback((
    action: OptimisticAction,
    updateFn: (state: T, action: OptimisticAction) => T
  ) => {
    setState(prevState => {
      const newOptimisticState = updateFn(prevState.optimisticState, action);
      return {
        ...prevState,
        optimisticState: newOptimisticState,
        pendingActions: [...prevState.pendingActions, action],
      };
    });
  }, []);

  const confirmOptimisticUpdate = useCallback((actionId: string, serverState?: T) => {
    setState(prevState => {
      const remainingActions = prevState.pendingActions.filter(
        action => action.id !== actionId
      );
      
      // If server state is provided, use it as the new base state
      const newOriginalState = serverState || prevState.optimisticState;
      
      return {
        originalState: newOriginalState,
        optimisticState: newOriginalState,
        pendingActions: remainingActions,
      };
    });
  }, []);

  const rollbackOptimisticUpdate = useCallback((actionId: string) => {
    setState(prevState => {
      const actionIndex = prevState.pendingActions.findIndex(
        action => action.id === actionId
      );
      
      if (actionIndex === -1) {
        return prevState; // Action not found
      }

      // Remove the failed action
      const remainingActions = prevState.pendingActions.filter(
        action => action.id !== actionId
      );

      // Reapply remaining actions to the original state
      let newOptimisticState = prevState.originalState;
      
      // This would need to be implemented based on your specific update logic
      // For now, we'll just reset to original state
      
      return {
        ...prevState,
        optimisticState: newOptimisticState,
        pendingActions: remainingActions,
      };
    });
  }, []);

  const rollbackAllOptimisticUpdates = useCallback(() => {
    setState(prevState => ({
      originalState: prevState.originalState,
      optimisticState: prevState.originalState,
      pendingActions: [],
    }));
  }, []);

  const updateOriginalState = useCallback((newState: T) => {
    setState(prevState => ({
      ...prevState,
      originalState: newState,
      optimisticState: prevState.pendingActions.length > 0 ? prevState.optimisticState : newState,
    }));
  }, []);

  return {
    currentState: state.optimisticState,
    originalState: state.originalState,
    pendingActions: state.pendingActions,
    hasPendingActions: state.pendingActions.length > 0,
    applyOptimisticUpdate,
    confirmOptimisticUpdate,
    rollbackOptimisticUpdate,
    rollbackAllOptimisticUpdates,
    updateOriginalState,
  };
}