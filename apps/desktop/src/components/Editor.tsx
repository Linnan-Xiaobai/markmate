import { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { EditorState, Transaction, EditorSelection, Compartment } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, indentOnInput } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { search, searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { useTabsStore } from '@/store/use-tabs-store';
import { useConfigStore } from '@/store/use-config-store';
import { useScrollSync, GOTO_HEADING_EVENT } from '@/hooks/use-scroll-sync';
import type { GotoHeadingDetail } from '@/hooks/use-scroll-sync';

// Editor memory limits
const LARGE_FILE_THRESHOLD = 500 * 1024; // 500KB - disable heavy features above this

const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 32;
const DEFAULT_FONT_SIZE = 14;

function buildTheme(fontSize: number, lineHeight: number, resolvedTheme: 'light' | 'dark') {
  const isDark = resolvedTheme === 'dark';
  return EditorView.theme({
    '&': {
      backgroundColor: 'var(--color-base)',
      color: 'var(--color-text)',
      fontSize: `${fontSize}px`,
    },
    '.cm-content': {
      caretColor: 'var(--color-rosewater)',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      lineHeight: String(lineHeight),
    },
    '.cm-gutters': {
      backgroundColor: isDark ? 'var(--color-mantle)' : 'var(--color-mantle)',
      color: 'var(--color-overlay0)',
      borderRight: '1px solid var(--color-surface0)',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      fontSize: `${fontSize}px`,
    },
    '.cm-activeLine': {
      backgroundColor: isDark
        ? 'rgba(49, 50, 68, 0.3)'
        : 'rgba(204, 208, 218, 0.5)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'var(--color-surface0)',
    },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
      backgroundColor: 'var(--color-surface1)',
    },
    '.cm-cursor': {
      borderLeftColor: 'var(--color-rosewater)',
      borderLeftWidth: '2px',
    },
    '.cm-matchingBracket': {
      backgroundColor: isDark
        ? 'rgba(137, 180, 250, 0.2)'
        : 'rgba(30, 102, 245, 0.15)',
      outline: '1px solid var(--color-blue)',
    },
    '.cm-scroller': {
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      overflow: 'auto',
      scrollBehavior: 'auto',
    },
  }, { dark: isDark });
}

// Ensure the caret is always kept visible after every transaction that
// changes selection or document, mirroring native editor behavior.
const caretScrollFollower = EditorView.updateListener.of((update) => {
  if (update.selectionSet || update.docChanged) {
    const { state } = update.view;
    const pos = state.selection.main.head;
    // Use 'nearest' so we only scroll when the caret leaves the viewport,
    // which matches the behavior of most native editors and avoids fight
    // with split-view scroll sync.
    update.view.dispatch({
      effects: EditorView.scrollIntoView(pos, { y: 'nearest', yMargin: 40 }),
      annotations: Transaction.userEvent.of('caret-scroll'),
    });
  }
});

export function Editor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const themeCompartmentRef = useRef<Compartment>(new Compartment());
  const lastEditorContentRef = useRef('');
  const activeTabIdRef = useRef<string | null>(null);
  const fontSizeRef = useRef(DEFAULT_FONT_SIZE);
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
  const configEditor = useConfigStore((s) => s.config.editor);
  const configLineHeight = useConfigStore((s) => s.config.editor.lineHeight);
  const updateConfig = useConfigStore((s) => s.updateConfig);

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
  const updateConfigRef = useRef(updateConfig);

  useEffect(() => { saveFileRef.current = saveFile; }, [saveFile]);
  useEffect(() => { setViewModeRef.current = setViewMode; }, [setViewMode]);
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);
  useEffect(() => { setContentRef.current = setContent; }, [setContent]);
  useEffect(() => { setCursorPositionRef.current = setCursorPosition; }, [setCursorPosition]);
  useEffect(() => { updateConfigRef.current = updateConfig; }, [updateConfig]);

  // Sync fontSize ref when config changes
  useEffect(() => {
    fontSizeRef.current = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, configEditor.fontSize));
  }, [configEditor.fontSize]);

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

  const configEditorRef = useRef(configEditor);
  useEffect(() => { configEditorRef.current = configEditor; }, [configEditor]);

  // Adjust font size by a delta, persist to config
  const adjustFontSize = useCallback((delta: number) => {
    const current = fontSizeRef.current;
    const next = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, current + delta));
    if (next === current) return;
    fontSizeRef.current = next;
    const prev = configEditorRef.current;
    updateConfigRef.current({
      editor: { ...prev, fontSize: next },
    });
  }, []);

  // Reconfigure theme compartment when font size / line height / theme changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const size = fontSizeRef.current;
    const lh = configLineHeight;
    view.dispatch({
      effects: themeCompartmentRef.current.reconfigure(buildTheme(size, lh, resolvedTheme)),
    });
  }, [configEditor.fontSize, configLineHeight, resolvedTheme]);

  useEffect(() => {
    if (!containerRef.current) return;

    const content = activeTab?.content ?? '';
    lastEditorContentRef.current = content;
    activeTabIdRef.current = activeTabId;

    const isLargeFile = content.length > LARGE_FILE_THRESHOLD;
    const initialFontSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, configEditor.fontSize));
    fontSizeRef.current = initialFontSize;

    const editorTheme = buildTheme(initialFontSize, configLineHeight, resolvedTheme);

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
      // Ctrl+wheel is handled on the DOM; these keyboard shortcuts
      // provide equivalent font zoom on all platforms.
      {
        key: 'Mod-=',
        run: () => { adjustFontSize(1); return true; },
      },
      {
        key: 'Mod-Shift-=',
        run: () => { adjustFontSize(1); return true; },
      },
      {
        key: 'Mod--',
        run: () => { adjustFontSize(-1); return true; },
      },
      {
        key: 'Mod-0',
        run: () => {
          const prev = configEditorRef.current;
          fontSizeRef.current = DEFAULT_FONT_SIZE;
          updateConfigRef.current({
            editor: { ...prev, fontSize: DEFAULT_FONT_SIZE },
          });
          return true;
        },
      },
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...historyKeymap,
      ...searchKeymap,
      indentWithTab,
    ]);

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
      caretScrollFollower,
      EditorView.lineWrapping,
      themeCompartmentRef.current.of(editorTheme),
      // Allow wheel scrolling to propagate / work when editor is focused
      EditorView.domEventHandlers({
        wheel(event: WheelEvent) {
          // Ctrl+wheel (or Cmd+wheel on macOS) → zoom font size
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            const delta = event.deltaY < 0 ? 1 : -1;
            adjustFontSize(delta);
            return true;
          }
          return false;
        },
        mousedown(event: MouseEvent) {
          // Clicking anywhere in the editor (even on gutters) should
          // give focus to the CodeMirror view so keyboard shortcuts and
          // cursor navigation work immediately.
          const view = viewRef.current;
          if (view && !view.hasFocus) {
            window.requestAnimationFrame(() => view.focus());
          }
          return false;
        },
      }),
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
    // We intentionally rebuild the view only when tab or theme changes.
    // Font size / line height changes are handled via compartment reconfigure
    // above so that scroll position and cursor are preserved.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Auto-focus the editor when it becomes visible (switching tabs/view modes)
  useEffect(() => {
    const view = viewRef.current;
    if (view && (viewMode === 'edit' || viewMode === 'split')) {
      // Defer to next frame so DOM layout is settled
      requestAnimationFrame(() => view.focus());
    }
  }, [viewMode, activeTabId]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full bg-base overflow-hidden"
      // Ensure the container is focusable and forwards focus to CodeMirror.
      // tabIndex=-1 allows programmatic focus without adding an extra tab stop.
      tabIndex={-1}
      onMouseDown={() => {
        const view = viewRef.current;
        if (view && !view.hasFocus) {
          requestAnimationFrame(() => view.focus());
        }
      }}
    />
  );
}
