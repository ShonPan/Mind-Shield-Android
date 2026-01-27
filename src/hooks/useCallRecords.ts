import {useCallback} from 'react';
import {useAppContext} from '../context/AppContext';
import {
  getAllCallRecords,
  getCallRecordById,
  insertCallRecord,
} from '../database/callRecordRepository';
import type {CallRecord} from '../types/CallRecord';

export function useCallRecords() {
  const {state, dispatch} = useAppContext();

  const loadRecords = useCallback(async () => {
    try {
      dispatch({type: 'SET_LOADING', payload: true});
      const records = await getAllCallRecords();
      dispatch({type: 'SET_RECORDS', payload: records});
    } catch (error) {
      console.error('Failed to load call records:', error);
    } finally {
      dispatch({type: 'SET_LOADING', payload: false});
    }
  }, [dispatch]);

  const addRecord = useCallback(
    async (record: Omit<CallRecord, 'created_at' | 'updated_at'>) => {
      try {
        await insertCallRecord(record);
        dispatch({type: 'ADD_RECORD', payload: record as CallRecord});
      } catch (error) {
        console.error('Failed to add call record:', error);
      }
    },
    [dispatch],
  );

  const refreshRecord = useCallback(
    async (id: string) => {
      try {
        const record = await getCallRecordById(id);
        if (record) {
          dispatch({type: 'UPDATE_RECORD', payload: record});
        }
      } catch (error) {
        console.error('Failed to refresh call record:', error);
      }
    },
    [dispatch],
  );

  return {
    records: state.callRecords,
    isLoading: state.isLoading,
    loadRecords,
    addRecord,
    refreshRecord,
  };
}
