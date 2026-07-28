/**
 * Pipeline state management for the file-processing tools.
 *
 * Provides a reducer and hook that manages the full lifecycle:
 * idle → uploading → validating → ready → processing → complete
 *
 * Every tool uses this same state machine.
 */

import { useCallback, useReducer } from "react";
import type {
  FileEntry,
  FileStatus,
  OutputFile,
  PipelineState,
  PipelineAction,
  ValidationRule,
} from "./types";
import { validateFiles } from "./validation";

// ─── Utilities ──────────────────────────────────────────────────────

let fileCounter = 0;

function createFileEntry(file: File): FileEntry {
  fileCounter += 1;
  return {
    id: `file-${fileCounter}-${Date.now()}`,
    file,
    status: "ready",
    name: file.name,
    size: file.size,
    type: file.type,
    uploadProgress: 100,
    processProgress: 0,
  };
}

// ─── Reducer ────────────────────────────────────────────────────────

const initialState: PipelineState = {
  files: [],
  status: "idle",
  output: [],
};

function pipelineReducer(state: PipelineState, action: PipelineAction): PipelineState {
  switch (action.type) {
    case "ADD_FILES": {
      const newEntries = action.files.map(createFileEntry);
      return {
        ...state,
        files: [...state.files, ...newEntries],
        status: "ready",
        error: undefined,
      };
    }

    case "REMOVE_FILE":
      return {
        ...state,
        files: state.files.filter((f) => f.id !== action.id),
        status: state.files.length <= 1 ? "idle" : state.status,
      };

    case "REORDER_FILES": {
      const files = [...state.files];
      const [moved] = files.splice(action.fromIndex, 1);
      files.splice(action.toIndex, 0, moved);
      return { ...state, files };
    }

    case "SET_FILE_STATUS":
      return {
        ...state,
        files: state.files.map((f) =>
          f.id === action.id
            ? { ...f, status: action.status, error: action.error }
            : f,
        ),
      };

    case "SET_FILE_PROGRESS":
      return {
        ...state,
        files: state.files.map((f) =>
          f.id === action.id ? { ...f, processProgress: action.progress } : f,
        ),
      };

    case "SET_FILE_PAGE_COUNT":
      return {
        ...state,
        files: state.files.map((f) =>
          f.id === action.id ? { ...f, pageCount: action.pageCount } : f,
        ),
      };

    case "SET_STATUS":
      return { ...state, status: action.status, error: action.error };

    case "SET_OUTPUT":
      return { ...state, output: action.output, status: "complete" };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

// ─── Hook ───────────────────────────────────────────────────────────

export interface UsePipelineOptions {
  /** Validation rules for file acceptance. */
  validation: ValidationRule;
  /** Called when files are added and validated. */
  onFilesReady?: (files: FileEntry[]) => void;
}

export interface UsePipelineReturn {
  /** Current pipeline state. */
  state: PipelineState;
  /** Add files to the pipeline (validates first). */
  addFiles: (files: File[]) => void;
  /** Remove a file by ID. */
  removeFile: (id: string) => void;
  /** Reorder files (drag-and-drop). */
  reorderFiles: (fromIndex: number, toIndex: number) => void;
  /** Set processing status. */
  setProcessing: () => void;
  /** Set processing complete with output files. */
  setComplete: (output: OutputFile[]) => void;
  /** Set error state. */
  setError: (error: string) => void;
  /** Reset to initial state. */
  reset: () => void;
  /** Whether files are ready for processing. */
  canProcess: boolean;
  /** Validation errors from the last addFiles call. */
  validationErrors: string[];
}

export function usePipeline(options: UsePipelineOptions): UsePipelineReturn {
  const [state, dispatch] = useReducer(pipelineReducer, initialState);
  const [validationErrors, setValidationErrors] = useReducer(
    (_: string[], next: string[]) => next,
    [],
  );

  const addFiles = useCallback(
    (files: File[]) => {
      // Validate against rules
      const allFiles = [...state.files.map((f) => f.file), ...files];
      const result = validateFiles(allFiles, options.validation);

      if (!result.valid) {
        setValidationErrors(result.errors.map((e) => e.message));
        return;
      }

      setValidationErrors([]);
      dispatch({ type: "ADD_FILES", files });
    },
    [state.files, options.validation],
  );

  const removeFile = useCallback((id: string) => {
    dispatch({ type: "REMOVE_FILE", id });
    setValidationErrors([]);
  }, []);

  const reorderFiles = useCallback((fromIndex: number, toIndex: number) => {
    dispatch({ type: "REORDER_FILES", fromIndex, toIndex });
  }, []);

  const setProcessing = useCallback(() => {
    dispatch({ type: "SET_STATUS", status: "processing" });
  }, []);

  const setComplete = useCallback((output: OutputFile[]) => {
    dispatch({ type: "SET_OUTPUT", output });
  }, []);

  const setError = useCallback((error: string) => {
    dispatch({ type: "SET_STATUS", status: "error", error });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
    setValidationErrors([]);
  }, []);

  const canProcess =
    state.files.length > 0 &&
    state.status === "ready" &&
    state.files.every((f) => f.status === "ready");

  return {
    state,
    addFiles,
    removeFile,
    reorderFiles,
    setProcessing,
    setComplete,
    setError,
    reset,
    canProcess,
    validationErrors,
  };
}
