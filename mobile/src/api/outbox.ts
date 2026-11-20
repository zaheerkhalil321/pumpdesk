import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiError, JobStep, WorkTicketDraft } from './types';
import { PERMANENT_ERROR_CODES } from './supabase-errors';
import { OperatorApi } from './operator-api';

export type OutboxActionType =
  | 'acknowledge'
  | 'record_step'
  | 'undo_step'
  | 'edit_step_time'
  | 'save_ticket'
  | 'submit_ticket'
  | 'clock_in'
  | 'clock_out';

export interface OutboxItem {
  id: string; // client UUID
  action: OutboxActionType;
  jobId: string;
  payload: any;
  createdAt: string;
}

const STORAGE_KEY = '@pumpdesk/outbox';

let memoryQueue: OutboxItem[] = [];
let isProcessing = false;
const listeners = new Set<(queue: OutboxItem[]) => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn([...memoryQueue]));
}

/** Called when the server refuses a queued action for good (it is dropped from the queue). */
type RejectedListener = (item: OutboxItem, error: ApiError) => void;
const rejectedListeners = new Set<RejectedListener>();

export const outbox = {
  async init(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        memoryQueue = JSON.parse(raw);
        notifyListeners();
      }
    } catch {
      memoryQueue = [];
    }
  },

  getQueue(): OutboxItem[] {
    return [...memoryQueue];
  },

  /** Hear about actions the server refused for good, so the operator can be told. */
  onRejected(listener: RejectedListener): () => void {
    rejectedListeners.add(listener);
    return () => rejectedListeners.delete(listener);
  },

  subscribe(listener: (queue: OutboxItem[]) => void): () => void {
    listeners.add(listener);
    listener([...memoryQueue]);
    return () => listeners.delete(listener);
  },

  isPendingStep(jobId: string, step: JobStep): boolean {
    return memoryQueue.some(
      (item) =>
        item.jobId === jobId &&
        item.action === 'record_step' &&
        item.payload?.step === step
    );
  },

  async enqueue(
    action: OutboxActionType,
    jobId: string,
    payload: any = {}
  ): Promise<OutboxItem> {
    const item: OutboxItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      action,
      jobId,
      payload,
      createdAt: new Date().toISOString(),
    };

    memoryQueue.push(item);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memoryQueue));
    notifyListeners();
    return item;
  },

  async processQueue(api: OperatorApi): Promise<void> {
    if (isProcessing || memoryQueue.length === 0) return;
    isProcessing = true;

    try {
      while (memoryQueue.length > 0) {
        const item = memoryQueue[0];
        try {
          switch (item.action) {
            case 'acknowledge':
              await api.acknowledge(item.jobId, item.payload.at);
              break;
            case 'record_step':
              await api.recordStep(item.jobId, item.payload.step, item.payload.at);
              break;
            case 'undo_step':
              await api.undoStep(item.jobId, item.payload.step);
              break;
            case 'edit_step_time':
              await api.editStepTime(item.jobId, item.payload.step, item.payload.at);
              break;
            case 'save_ticket':
              await api.saveTicket(item.payload.draft as WorkTicketDraft);
              break;
            case 'submit_ticket':
              await api.submitTicket(item.jobId);
              break;
            case 'clock_in':
              await api.clockIn(item.payload.at);
              break;
            case 'clock_out':
              await api.clockOut(item.payload.at);
              break;
          }
          // Completed successfully, remove from FIFO
          memoryQueue.shift();
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memoryQueue));
          notifyListeners();
        } catch (error) {
          if (error instanceof ApiError && PERMANENT_ERROR_CODES.has(error.code)) {
            // Retrying can never work (cancelled job, locked ticket, ...). Drop it so it cannot block the
            // queue, and say so: the screen showed the tap as done, the operator must know it was not.
            const rejected = memoryQueue.shift();
            if (rejected) rejectedListeners.forEach((fn) => fn(rejected, error));
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memoryQueue));
            notifyListeners();
            continue;
          }
          // If offline or network error, stop processing queue and retry later
          break;
        }
      }
    } finally {
      isProcessing = false;
    }
  },

  async clear(): Promise<void> {
    memoryQueue = [];
    await AsyncStorage.removeItem(STORAGE_KEY);
    notifyListeners();
  },
};
