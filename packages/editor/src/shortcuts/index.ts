import hotkeys from 'hotkeys-js';
import { commandManager } from '../commands';
import type { Disposable } from '@markmate/core';

export interface ShortcutBinding {
  key: string;
  commandId: string;
  scope?: 'editor' | 'global';
}

const DEFAULT_BINDINGS: ShortcutBinding[] = [
  { key: 'mod+b', commandId: 'format.bold', scope: 'editor' },
  { key: 'mod+i', commandId: 'format.italic', scope: 'editor' },
  { key: 'mod+shift+s', commandId: 'format.strikethrough', scope: 'editor' },
  { key: 'mod+e', commandId: 'format.code', scope: 'editor' },
  { key: 'mod+k', commandId: 'insert.link', scope: 'editor' },
  { key: 'mod+1', commandId: 'heading.h1', scope: 'editor' },
  { key: 'mod+2', commandId: 'heading.h2', scope: 'editor' },
  { key: 'mod+3', commandId: 'heading.h3', scope: 'editor' },
  { key: 'mod+4', commandId: 'heading.h4', scope: 'editor' },
  { key: 'mod+5', commandId: 'heading.h5', scope: 'editor' },
  { key: 'mod+6', commandId: 'heading.h6', scope: 'editor' },
  { key: 'mod+0', commandId: 'heading.paragraph', scope: 'editor' },
  { key: 'mod+shift+7', commandId: 'list.ordered', scope: 'editor' },
  { key: 'mod+shift+8', commandId: 'list.bullet', scope: 'editor' },
  { key: 'mod+shift+t', commandId: 'list.task', scope: 'editor' },
  { key: 'tab', commandId: 'list.indent', scope: 'editor' },
  { key: 'shift+tab', commandId: 'list.outdent', scope: 'editor' },
  { key: 'mod+alt+c', commandId: 'block.code', scope: 'editor' },
  { key: 'mod+shift+.', commandId: 'block.quote', scope: 'editor' },
  { key: 'mod+z', commandId: 'edit.undo', scope: 'editor' },
  { key: 'mod+shift+z', commandId: 'edit.redo', scope: 'editor' },
  { key: 'mod+s', commandId: 'file.save', scope: 'global' },
];

export class ShortcutManager {
  private bindings: ShortcutBinding[] = [];
  private disposables: Disposable[] = [];
  private initialized = false;

  constructor() {
    this.bindings = [...DEFAULT_BINDINGS];
  }

  init(): void {
    if (this.initialized) return;

    hotkeys.filter = () => true;

    for (const binding of this.bindings) {
      this.registerBinding(binding);
    }

    this.initialized = true;
  }

  private registerBinding(binding: ShortcutBinding): void {
    const handler = (event: KeyboardEvent) => {
      event.preventDefault();
      commandManager.execute(binding.commandId);
    };

    if (binding.scope === 'global') {
      hotkeys(binding.key, handler);
    } else {
      hotkeys(binding.key, { scope: 'editor' }, handler);
    }

    this.disposables.push({
      dispose: () => hotkeys.unbind(binding.key),
    });
  }

  setEditorScope(active: boolean): void {
    if (active) {
      hotkeys.setScope('editor');
    } else {
      hotkeys.setScope('all');
    }
  }

  bind(key: string, commandId: string, scope: 'editor' | 'global' = 'editor'): Disposable {
    const binding: ShortcutBinding = { key, commandId, scope };
    this.bindings.push(binding);
    this.registerBinding(binding);

    return {
      dispose: () => this.unbind(key, commandId),
    };
  }

  unbind(key: string, commandId?: string): void {
    hotkeys.unbind(key);
    this.bindings = this.bindings.filter(
      (b) => !(b.key === key && (!commandId || b.commandId === commandId))
    );
  }

  getBindings(): ShortcutBinding[] {
    return [...this.bindings];
  }

  getBindingForCommand(commandId: string): ShortcutBinding | undefined {
    return this.bindings.find((b) => b.commandId === commandId);
  }

  formatKeybinding(key: string): string {
    const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

    return key
      .split('+')
      .map((part) => {
        switch (part.toLowerCase()) {
          case 'mod':
            return isMac ? '⌘' : 'Ctrl';
          case 'ctrl':
            return isMac ? '⌃' : 'Ctrl';
          case 'alt':
          case 'option':
            return isMac ? '⌥' : 'Alt';
          case 'shift':
            return isMac ? '⇧' : 'Shift';
          case 'cmd':
          case 'command':
            return '⌘';
          case 'enter':
            return '↵';
          case 'backspace':
            return '⌫';
          case 'delete':
            return 'Del';
          case 'escape':
          case 'esc':
            return 'Esc';
          case 'tab':
            return 'Tab';
          case 'up':
            return '↑';
          case 'down':
            return '↓';
          case 'left':
            return '←';
          case 'right':
            return '→';
          default:
            return part.length === 1 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1);
        }
      })
      .join(isMac ? '' : '+');
  }

  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
    this.bindings = [];
    this.initialized = false;
  }
}

export const shortcutManager = new ShortcutManager();
