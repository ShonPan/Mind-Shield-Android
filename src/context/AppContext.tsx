import React, {createContext, useContext, useReducer, ReactNode} from 'react';
import type {CallRecord} from '../types/CallRecord';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
export interface AppState {
  callRecords: CallRecord[];
  isMonitoring: boolean;
  isLoading: boolean;
  onboardingComplete: boolean;
}

const initialState: AppState = {
  callRecords: [],
  isMonitoring: false,
  isLoading: false,
  onboardingComplete: false,
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
type AppAction =
  | {type: 'SET_RECORDS'; payload: CallRecord[]}
  | {type: 'ADD_RECORD'; payload: CallRecord}
  | {type: 'UPDATE_RECORD'; payload: CallRecord}
  | {type: 'CLEAR_RECORDS'}
  | {type: 'SET_MONITORING'; payload: boolean}
  | {type: 'SET_LOADING'; payload: boolean}
  | {type: 'SET_ONBOARDING'; payload: boolean};

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_RECORDS':
      return {...state, callRecords: action.payload};

    case 'ADD_RECORD':
      return {...state, callRecords: [action.payload, ...state.callRecords]};

    case 'UPDATE_RECORD':
      return {
        ...state,
        callRecords: state.callRecords.map(r =>
          r.id === action.payload.id ? action.payload : r,
        ),
      };

    case 'CLEAR_RECORDS':
      return {...state, callRecords: []};

    case 'SET_MONITORING':
      return {...state, isMonitoring: action.payload};

    case 'SET_LOADING':
      return {...state, isLoading: action.payload};

    case 'SET_ONBOARDING':
      return {...state, onboardingComplete: action.payload};

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({children}: AppProviderProps): React.JSX.Element {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{state, dispatch}}>
      {children}
    </AppContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
