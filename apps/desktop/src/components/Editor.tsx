import { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { EditorState, Transaction, EditorSelection } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, indentOnInput } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { search, searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { useTabsStore } from '@/store/use-tabs-store';
import { useConfigStore } from '@/store/use-config-store';
import { useScrollSync, GOTO_HEADING_EVENT } from '@/hooks/use-scroll-sync';
import type { GotoHeadingDetail } from '@/hooks/use-scroll-sync';

// Editor memory limits
const LARGE_FILE_THRESHOLD = 500 * 1024; // 500KB - disable heavy features above this

// Light theme for CodeMirror
const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--color-base)',
    color: 'var(--color-text)',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--color-mantle)',
    color: 'var(--color-overlay0)',
    borderRight: '1px solid var(--color-surface0)',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(204, 208, 218, 0.5)',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'var(--color-surface1)',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--color-rosewater)',
  },
  '.cm-matchingBracket': {
    backgroundColor: 'rgba(30, 102, 245, 0.15)',
    outline: '1px solid var(--color-blue)',
  },
}, { dark: false });

export function Editor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const lastEditorContentRef = useRef('');
  const activeTabIdRef = useRef<string | null>(null);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  const setContent = useTabsStore((s) => s.setContent);
  const setCursorPosition = useTabsStore((s) => s.setCursorPosition);
  const saveFile = useTabsStore((s) => s.saveFile);
  const setViewMode = useTabsStore((s) => s.setViewMode);
  const viewMode = useTabsStore((s) => s.viewMode);
  const activeTabId = useTabsStore((s) => s.activeTabId);
  const activeTab = useTabsStore((s) => {
    const id = s.activeTabId;
    return id ? s.tabs.find((t) => t.id === id) : s.tabs[0];
  });
  const configTheme = useConfigStore((s) => s.config.theme);

  // Resolve theme (handle system preference)
  useEffect(() => {
    const resolve = async () => {
      if (configTheme === 'system') {
        try {
          const theme = await window.markmate.app.getTheme();
          setResolvedTheme(theme);
        } catch {
          setResolvedTheme('dark');
        }
      } else {
        setResolvedTheme(configTheme);
      }
    };
    resolve();
  }, [configTheme]);

  const saveFileRef = useRef(saveFile);
  const setViewModeRef = useRef(setViewMode);
  const viewModeRef = useRef(viewMode);
  const setContentRef = useRef(setContent);
  const setCursorPositionRef = useRef(setCursorPosition);

  useEffect(() => { saveFileRef.current = saveFile; }, [saveFile]);
  useEffect(() => { setViewModeRef.current = setViewMode; }, [setViewMode]);
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);
  useEffect(() => { setContentRef.current = setContent; }, [setContent]);
  useEffect(() => { setCursorPositionRef.current = setCursorPosition; }, [setCursorPosition]);

  // Get CodeMirror scroll container for scroll sync
  const getScrollElement = useCallback(() => {
    return viewRef.current?.scrollDOM ?? null;
  }, []);

  // Enable scroll sync in split mode
  useScrollSync(getScrollElement, 'editor');

  const updateListener = useMemo(() => EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      const newContent = update.state.doc.toString();
      lastEditorContentRef.current = newContent;
      setContentRef.current(newContent);
    }
    if (update.selectionSet) {
      const pos = update.state.selection.main.head;
      const line = update.state.doc.lineAt(pos);
      const column = pos - line.from + 1;
      setCursorPositionRef.current(line.number, column);
    }
  }), []);

  useEffect(() => {
    if (!containerRef.current) return;

    const content = activeTab?.content ?? '';
    lastEditorContentRef.current = content;
    activeTabIdRef.current = activeTabId;

    const isLargeFile = content.length > LARGE_FILE_THRESHOLD;

    const customKeymap = keymap.of([
      {
        key: 'Mod-s',
        run: () => { saveFileRef.current(); return true; },
      },
      {
        key: 'Mod-/',
        run: () => {
          const modes: ('edit' | 'split' | 'preview')[] = ['edit', 'split', 'preview'];
          const idx = modes.indexOf(viewModeRef.current);
          setViewModeRef.current(modes[(idx + 1) % modes.length]);
          return true;
        },
      },
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...historyKeymap,
      ...searchKeymap,
    ]);

    const editorTheme = resolvedTheme === 'dark' ? oneDark : lightTheme;

    // Build extensions based on file size
    const extensions: any[] = [
      lineNumbers(),
      highlightActiveLineGutter(),
      history({ newGroupDelay: 250 }),
      bracketMatching(),
      indentOnInput(),
      closeBrackets(),
      search({ top: true }),
      highlightSelectionMatches(),
      customKeymap,
      updateListener,
      EditorView.lineWrapping,
      editorTheme,
    ];

    if (!isLargeFile) {
      extensions.push(
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        markdown({ base: markdownLanguage }),
        highlightActiveLine(),
      );
    } else {
      // Light mode for large files: minimal parsing overhead
      extensions.push(
        markdown({ base: markdownLanguage, codeLanguages: [] }),
      );
    }

    const state = EditorState.create({ doc: content, extensions });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [updateListener, activeTabId, resolvedTheme]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const content = activeTab?.content ?? '';
    if (content === lastEditorContentRef.current) return;
    lastEditorContentRef.current = content;

    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: content },
      annotations: Transaction.remote.of(true),
    });
  }, [activeTab?.content]);

  // Outline navigation: jump cursor to source line and center it
  useEffect(() => {
    const handler = (e: Event) => {
      const view = viewRef.current;
      if (!view) return;
      const { line } = (e as CustomEvent<GotoHeadingDetail>).detail;
      const clamped = Math.max(1, Math.min(line, view.state.doc.lines));
      const pos = view.state.doc.line(clamped).from;
      view.dispatch({
        selection: EditorSelection.cursor(pos),
        effects: EditorView.scrollIntoView(pos, { y: 'center' }),
      });
      view.focus();
    };
    window.addEventListener(GOTO_HEADING_EVENT, handler);
    return () => window.removeEventListener(GOTO_HEADING_EVENT, handler);
  }, []);

  return <div ref={containerRef} className="h-full w-full bg-base overflow-hidden" />;
}
