import { create } from 'zustand';
import type { EditorMode, MarkdownDocument } from '@markmate/core';

interface EditorState {
  currentDocument: MarkdownDocument | null;
  openDocuments: MarkdownDocument[];
  mode: EditorMode;
  isLoading: boolean;
  isSaving: boolean;
  canUndo: boolean;
  canRedo: boolean;
  showSidebar: boolean;
  showOutline: boolean;
  sidebarTab: 'files' | 'search' | 'outline';
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  wordWrap: boolean;
  showLineNumbers: boolean;
  content: string;

  setContent: (content: string) => void;
  setMode: (mode: EditorMode) => void;
  setCurrentDocument: (doc: MarkdownDocument | null) => void;
  addOpenDocument: (doc: MarkdownDocument) => void;
  removeOpenDocument: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setCanUndo: (can: boolean) => void;
  setCanRedo: (can: boolean) => void;
  toggleSidebar: () => void;
  toggleOutline: () => void;
  setSidebarTab: (tab: 'files' | 'search' | 'outline') => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setFontSize: (size: number) => void;
  toggleWordWrap: () => void;
  toggleLineNumbers: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  currentDocument: null,
  openDocuments: [],
  mode: 'wysiwyg',
  isLoading: false,
  isSaving: false,
  canUndo: false,
  canRedo: false,
  showSidebar: true,
  showOutline: false,
  sidebarTab: 'files',
  theme: 'system',
  fontSize: 16,
  wordWrap: true,
  showLineNumbers: true,
  content: '',

  setContent: (content) => set({ content }),
  setMode: (mode) => set({ mode }),
  setCurrentDocument: (currentDocument) => set({ currentDocument, content: currentDocument?.content || '' }),
  addOpenDocument: (doc) =>
    set((state) => ({
      openDocuments: state.openDocuments.some((d) => d.id === doc.id)
        ? state.openDocuments
        : [...state.openDocuments, doc],
    })),
  removeOpenDocument: (id) =>
    set((state) => ({
      openDocuments: state.openDocuments.filter((d) => d.id !== id),
      currentDocument:
        state.currentDocument?.id === id ? null : state.currentDocument,
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setSaving: (isSaving) => set({ isSaving }),
  setCanUndo: (canUndo) => set({ canUndo }),
  setCanRedo: (canRedo) => set({ canRedo }),
  toggleSidebar: () => set((state) => ({ showSidebar: !state.showSidebar })),
  toggleOutline: () => set((state) => ({ showOutline: !state.showOutline })),
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),
  setTheme: (theme) => set({ theme }),
  setFontSize: (fontSize) => set({ fontSize }),
  toggleWordWrap: () => set((state) => ({ wordWrap: !state.wordWrap })),
  toggleLineNumbers: () => set((state) => ({ showLineNumbers: !state.showLineNumbers })),
}));
