import type { Editor } from '@tiptap/react';

export interface CommandContext {
  editor: Editor | null;
}

export type CommandHandler = (ctx: CommandContext) => void;

export interface Command {
  id: string;
  name: string;
  description: string;
  keybinding?: string;
  category: 'format' | 'heading' | 'list' | 'block' | 'file' | 'edit' | 'view' | 'insert';
  execute: CommandHandler;
  isActive?: (ctx: CommandContext) => boolean;
  isEnabled?: (ctx: CommandContext) => boolean;
}

export const createCommands = (): Record<string, Command> => ({
  'format.bold': {
    id: 'format.bold',
    name: 'Bold',
    description: 'Bold text',
    keybinding: 'Mod-b',
    category: 'format',
    execute: ({ editor }) => editor?.chain().focus().toggleBold().run(),
    isActive: ({ editor }) => editor?.isActive('bold') ?? false,
  },
  'format.italic': {
    id: 'format.italic',
    name: 'Italic',
    description: 'Italic text',
    keybinding: 'Mod-i',
    category: 'format',
    execute: ({ editor }) => editor?.chain().focus().toggleItalic().run(),
    isActive: ({ editor }) => editor?.isActive('italic') ?? false,
  },
  'format.strikethrough': {
    id: 'format.strikethrough',
    name: 'Strikethrough',
    description: 'Strikethrough text',
    keybinding: 'Mod-Shift-s',
    category: 'format',
    execute: ({ editor }) => editor?.chain().focus().toggleStrike().run(),
    isActive: ({ editor }) => editor?.isActive('strike') ?? false,
  },
  'format.code': {
    id: 'format.code',
    name: 'Inline Code',
    description: 'Inline code',
    keybinding: 'Mod-e',
    category: 'format',
    execute: ({ editor }) => editor?.chain().focus().toggleCode().run(),
    isActive: ({ editor }) => editor?.isActive('code') ?? false,
  },

  'heading.h1': {
    id: 'heading.h1',
    name: 'Heading 1',
    description: 'Heading level 1',
    keybinding: 'Mod-1',
    category: 'heading',
    execute: ({ editor }) => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
    isActive: ({ editor }) => editor?.isActive('heading', { level: 1 }) ?? false,
  },
  'heading.h2': {
    id: 'heading.h2',
    name: 'Heading 2',
    description: 'Heading level 2',
    keybinding: 'Mod-2',
    category: 'heading',
    execute: ({ editor }) => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: ({ editor }) => editor?.isActive('heading', { level: 2 }) ?? false,
  },
  'heading.h3': {
    id: 'heading.h3',
    name: 'Heading 3',
    description: 'Heading level 3',
    keybinding: 'Mod-3',
    category: 'heading',
    execute: ({ editor }) => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
    isActive: ({ editor }) => editor?.isActive('heading', { level: 3 }) ?? false,
  },
  'heading.h4': {
    id: 'heading.h4',
    name: 'Heading 4',
    description: 'Heading level 4',
    keybinding: 'Mod-4',
    category: 'heading',
    execute: ({ editor }) => editor?.chain().focus().toggleHeading({ level: 4 }).run(),
    isActive: ({ editor }) => editor?.isActive('heading', { level: 4 }) ?? false,
  },
  'heading.h5': {
    id: 'heading.h5',
    name: 'Heading 5',
    description: 'Heading level 5',
    keybinding: 'Mod-5',
    category: 'heading',
    execute: ({ editor }) => editor?.chain().focus().toggleHeading({ level: 5 }).run(),
    isActive: ({ editor }) => editor?.isActive('heading', { level: 5 }) ?? false,
  },
  'heading.h6': {
    id: 'heading.h6',
    name: 'Heading 6',
    description: 'Heading level 6',
    keybinding: 'Mod-6',
    category: 'heading',
    execute: ({ editor }) => editor?.chain().focus().toggleHeading({ level: 6 }).run(),
    isActive: ({ editor }) => editor?.isActive('heading', { level: 6 }) ?? false,
  },
  'heading.paragraph': {
    id: 'heading.paragraph',
    name: 'Paragraph',
    description: 'Paragraph text',
    keybinding: 'Mod-0',
    category: 'heading',
    execute: ({ editor }) => editor?.chain().focus().setParagraph().run(),
    isActive: ({ editor }) => editor?.isActive('paragraph') ?? false,
  },

  'list.bullet': {
    id: 'list.bullet',
    name: 'Bullet List',
    description: 'Bullet list',
    keybinding: 'Mod-Shift-8',
    category: 'list',
    execute: ({ editor }) => editor?.chain().focus().toggleBulletList().run(),
    isActive: ({ editor }) => editor?.isActive('bulletList') ?? false,
  },
  'list.ordered': {
    id: 'list.ordered',
    name: 'Ordered List',
    description: 'Ordered list',
    keybinding: 'Mod-Shift-7',
    category: 'list',
    execute: ({ editor }) => editor?.chain().focus().toggleOrderedList().run(),
    isActive: ({ editor }) => editor?.isActive('orderedList') ?? false,
  },
  'list.task': {
    id: 'list.task',
    name: 'Task List',
    description: 'Task list',
    keybinding: 'Mod-Shift-t',
    category: 'list',
    execute: ({ editor }) => editor?.chain().focus().toggleTaskList().run(),
    isActive: ({ editor }) => editor?.isActive('taskList') ?? false,
  },
  'list.indent': {
    id: 'list.indent',
    name: 'Indent',
    description: 'Indent list item',
    keybinding: 'Tab',
    category: 'list',
    execute: ({ editor }) => editor?.chain().focus().sinkListItem('listItem').run(),
  },
  'list.outdent': {
    id: 'list.outdent',
    name: 'Outdent',
    description: 'Outdent list item',
    keybinding: 'Shift-Tab',
    category: 'list',
    execute: ({ editor }) => editor?.chain().focus().liftListItem('listItem').run(),
  },

  'block.code': {
    id: 'block.code',
    name: 'Code Block',
    description: 'Code block',
    keybinding: 'Mod-Alt-c',
    category: 'block',
    execute: ({ editor }) => editor?.chain().focus().toggleCodeBlock().run(),
    isActive: ({ editor }) => editor?.isActive('codeBlock') ?? false,
  },
  'block.quote': {
    id: 'block.quote',
    name: 'Blockquote',
    description: 'Blockquote',
    keybinding: 'Mod-Shift-.',
    category: 'block',
    execute: ({ editor }) => editor?.chain().focus().toggleBlockquote().run(),
    isActive: ({ editor }) => editor?.isActive('blockquote') ?? false,
  },
  'block.hr': {
    id: 'block.hr',
    name: 'Horizontal Rule',
    description: 'Horizontal rule',
    category: 'block',
    execute: ({ editor }) => editor?.chain().focus().setHorizontalRule().run(),
  },
  'block.table': {
    id: 'block.table',
    name: 'Table',
    description: 'Insert table',
    category: 'block',
    execute: ({ editor }) =>
      editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },

  'insert.link': {
    id: 'insert.link',
    name: 'Link',
    description: 'Insert link',
    keybinding: 'Mod-k',
    category: 'insert',
    execute: ({ editor }) => {
      const url = window.prompt('Enter URL:');
      if (url) {
        editor?.chain().focus().setLink({ href: url }).run();
      }
    },
    isActive: ({ editor }) => editor?.isActive('link') ?? false,
  },
  'insert.image': {
    id: 'insert.image',
    name: 'Image',
    description: 'Insert image',
    category: 'insert',
    execute: ({ editor }) => {
      const url = window.prompt('Enter image URL:');
      if (url) {
        editor?.chain().focus().setImage({ src: url }).run();
      }
    },
  },

  'edit.undo': {
    id: 'edit.undo',
    name: 'Undo',
    description: 'Undo last action',
    keybinding: 'Mod-z',
    category: 'edit',
    execute: ({ editor }) => editor?.chain().focus().undo().run(),
    isEnabled: ({ editor }) => editor?.can().undo() ?? false,
  },
  'edit.redo': {
    id: 'edit.redo',
    name: 'Redo',
    description: 'Redo last action',
    keybinding: 'Mod-Shift-z',
    category: 'edit',
    execute: ({ editor }) => editor?.chain().focus().redo().run(),
    isEnabled: ({ editor }) => editor?.can().redo() ?? false,
  },

  'file.save': {
    id: 'file.save',
    name: 'Save',
    description: 'Save document',
    keybinding: 'Mod-s',
    category: 'file',
    execute: () => {
      window.dispatchEvent(new CustomEvent('markmate:save'));
    },
  },
});

export class CommandManager {
  private commands = new Map<string, Command>();
  private context: CommandContext = { editor: null };

  constructor() {
    this.register(createCommands());
  }

  setEditor(editor: Editor | null) {
    this.context.editor = editor;
  }

  register(commands: Record<string, Command> | Command) {
    if ('id' in commands) {
      this.commands.set(commands.id, commands);
    } else {
      for (const cmd of Object.values(commands)) {
        this.commands.set(cmd.id, cmd);
      }
    }
  }

  execute(id: string) {
    const cmd = this.commands.get(id);
    if (cmd) {
      cmd.execute(this.context);
    }
  }

  get(id: string): Command | undefined {
    return this.commands.get(id);
  }

  getAll(): Command[] {
    return Array.from(this.commands.values());
  }

  getByCategory(category: Command['category']): Command[] {
    return this.getAll().filter((cmd) => cmd.category === category);
  }

  isActive(id: string): boolean {
    const cmd = this.commands.get(id);
    return cmd?.isActive?.(this.context) ?? false;
  }

  isEnabled(id: string): boolean {
    const cmd = this.commands.get(id);
    return cmd?.isEnabled?.(this.context) ?? true;
  }
}

export const commandManager = new CommandManager();
