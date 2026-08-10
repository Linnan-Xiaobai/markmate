import { useState, memo, useCallback, useMemo } from 'react';
import { useTabsStore } from '@/store/use-tabs-store';
import { useConfigStore } from '@/store/use-config-store';
import { OutlinePanel } from '@/components/OutlinePanel';

const MarkdownFileIcon = memo(function MarkdownFileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue shrink-0">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 13l2 2 4-4" stroke="#a6e3a1" />
    </svg>
  );
});

const TextFileIcon = memo(function TextFileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-subtext0 shrink-0">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
});

const FolderOpenIcon = memo(function FolderOpenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow shrink-0">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
});

const FolderClosedIcon = memo(function FolderClosedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow shrink-0">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
});

const ChevronIcon = memo(function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
});

const LoadingIcon = memo(function LoadingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 animate-spin text-subtext0">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
});

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['md', 'markdown'].includes(ext || '')) return <MarkdownFileIcon />;
  return <TextFileIcon />;
}

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
}

interface TreeItemProps {
  name: string;
  itemPath: string;
  isDirectory: boolean;
  depth: number;
  isActive: boolean;
  isExpanded: boolean;
  isLoading: boolean;
  onFileClick: (path: string) => void;
  onToggleFolder: (path: string) => void;
}

const TreeItem = memo(function TreeItem({
  name,
  itemPath,
  isDirectory,
  depth,
  isActive,
  isExpanded,
  isLoading,
  onFileClick,
  onToggleFolder,
}: TreeItemProps) {
  const handleClick = useCallback(() => {
    if (isDirectory) {
      onToggleFolder(itemPath);
    } else {
      onFileClick(itemPath);
    }
  }, [isDirectory, itemPath, onFileClick, onToggleFolder]);

  const indent = depth * 12 + 8;

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center gap-1.5 px-2 py-1 text-sm rounded transition-colors text-left ${
        isActive
          ? 'bg-surface1 text-text'
          : 'text-subtext0 hover:bg-surface0 hover:text-text'
      }`}
      style={{ paddingLeft: `${indent}px` }}
    >
      {isDirectory ? (
        isLoading ? <LoadingIcon /> : <ChevronIcon expanded={isExpanded} />
      ) : (
        <span className="w-3 shrink-0" />
      )}
      {isDirectory
        ? isExpanded
          ? <FolderOpenIcon />
          : <FolderClosedIcon />
        : getFileIcon(name)}
      <span className="truncate">{name}</span>
    </button>
  );
});

export function Sidebar() {
  const sidebarOpen = useTabsStore((s) => s.sidebarOpen);
  const configSidebarWidth = useConfigStore((s) => s.config.ui.sidebarWidth);
  const rootItems = useTabsStore((s) => s.fileTree);
  const currentFolder = useTabsStore((s) => s.currentFolder);
  const activeTab = useTabsStore((s) => {
    const id = s.activeTabId;
    return id ? s.tabs.find((t) => t.id === id) : s.tabs[0];
  });
  const filePath = activeTab?.filePath ?? null;
  const openFile = useTabsStore((s) => s.openFile);
  const setCurrentFolder = useTabsStore((s) => s.setCurrentFolder);
  const errorCallback = useTabsStore((s) => s.errorCallback);

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [folderChildren, setFolderChildren] = useState<Map<string, FileNode[]>>(new Map());
  const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());
  const [sidebarTab, setSidebarTab] = useState<'files' | 'outline'>('files');

  const handleFileClick = useCallback((path: string) => {
    openFile(path);
  }, [openFile]);

  const loadFolderChildren = useCallback(async (folderPath: string) => {
    if (folderChildren.has(folderPath) || loadingFolders.has(folderPath)) {
      return;
    }

    setLoadingFolders((prev) => new Set(prev).add(folderPath));
    try {
      const result = await window.markmate.fs.readDirectoryFlat(folderPath);
      if (result.success && result.items) {
        setFolderChildren((prev) => {
          const next = new Map(prev);
          next.set(folderPath, result.items!);
          return next;
        });
      } else if (result.error) {
        errorCallback?.(result.error);
      }
    } catch {
      errorCallback?.('读取目录失败');
    } finally {
      setLoadingFolders((prev) => {
        const next = new Set(prev);
        next.delete(folderPath);
        return next;
      });
    }
  }, [folderChildren, loadingFolders, errorCallback]);

  const handleToggleFolder = useCallback(async (folderPath: string) => {
    const isExpanded = expandedFolders.has(folderPath);

    if (isExpanded) {
      setExpandedFolders((prev) => {
        const next = new Set(prev);
        next.delete(folderPath);
        return next;
      });
    } else {
      setExpandedFolders((prev) => new Set(prev).add(folderPath));
      loadFolderChildren(folderPath);
    }
  }, [expandedFolders, loadFolderChildren]);

  const handleOpenFolder = useCallback(async () => {
    const folderPath = await window.markmate.dialog.openFolder();
    if (folderPath) {
      setCurrentFolder(folderPath);
      setExpandedFolders(new Set());
      setFolderChildren(new Map());
      setLoadingFolders(new Set());
      // Auto-expand root folder
      setExpandedFolders(new Set([folderPath]));
      loadFolderChildren(folderPath);
    }
  }, [setCurrentFolder, loadFolderChildren]);

  const handleOpenFile = useCallback(async () => {
    const filePath = await window.markmate.dialog.openFile();
    if (filePath) {
      openFile(filePath);
    }
  }, [openFile]);

  // Recursive render function
  const renderNodes = useCallback((nodes: FileNode[], depth: number, activePath: string | null): React.ReactNode => {
    return nodes.map((node) => {
      const isExpanded = expandedFolders.has(node.path);
      const isLoading = loadingFolders.has(node.path);
      const children = folderChildren.get(node.path) || [];
      const isActive = !node.isDirectory && activePath === node.path;

      return (
        <div key={node.path}>
          <TreeItem
            name={node.name}
            itemPath={node.path}
            isDirectory={node.isDirectory}
            depth={depth}
            isActive={isActive}
            isExpanded={isExpanded}
            isLoading={isLoading}
            onFileClick={handleFileClick}
            onToggleFolder={handleToggleFolder}
          />
          {node.isDirectory && isExpanded && children.length > 0 && (
            <div>
              {renderNodes(children, depth + 1, activePath)}
            </div>
          )}
        </div>
      );
    });
  }, [expandedFolders, loadingFolders, folderChildren, handleFileClick, handleToggleFolder]);

  if (!sidebarOpen) return null;

  return (
    <div
      className="bg-mantle border-r border-surface0 flex flex-col shrink-0"
      style={{ width: configSidebarWidth }}
    >
      <div className="h-9 flex items-center justify-between px-2 border-b border-surface0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSidebarTab('files')}
            className={`px-2 py-1 text-xs font-semibold uppercase tracking-wider rounded transition-colors ${
              sidebarTab === 'files'
                ? 'text-text bg-surface0'
                : 'text-overlay0 hover:text-text'
            }`}
          >
            文件
          </button>
          <button
            onClick={() => setSidebarTab('outline')}
            className={`px-2 py-1 text-xs font-semibold uppercase tracking-wider rounded transition-colors ${
              sidebarTab === 'outline'
                ? 'text-text bg-surface0'
                : 'text-overlay0 hover:text-text'
            }`}
          >
            大纲
          </button>
        </div>
        {sidebarTab === 'files' && (
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleOpenFile}
              className="w-6 h-6 flex items-center justify-center text-subtext0 hover:text-text hover:bg-surface0 rounded transition-colors"
              title="打开文件"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M9 15l2 2 4-4" />
              </svg>
            </button>
            <button
              onClick={handleOpenFolder}
              className="w-6 h-6 flex items-center justify-center text-subtext0 hover:text-text hover:bg-surface0 rounded transition-colors"
              title="打开文件夹"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                <line x1="12" y1="11" x2="12" y2="17" />
                <line x1="9" y1="14" x2="15" y2="14" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {sidebarTab === 'outline' ? (
          <OutlinePanel />
        ) : currentFolder ? (
          <div>
            {/* Root folder entry */}
            <TreeItem
              name={currentFolder.split(/[/\\]/).pop() || currentFolder}
              itemPath={currentFolder}
              isDirectory={true}
              depth={0}
              isActive={false}
              isExpanded={expandedFolders.has(currentFolder)}
              isLoading={loadingFolders.has(currentFolder)}
              onFileClick={openFile}
              onToggleFolder={handleToggleFolder}
            />

            {/* Root level items */}
            {expandedFolders.has(currentFolder) && (
              <div>
                {renderNodes(rootItems, 1, filePath)}
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 py-8 text-center">
            <div className="text-subtext0 text-sm mb-3">还没有打开文件或文件夹</div>
            <div className="flex flex-col gap-2 items-center">
              <button
                onClick={handleOpenFile}
                className="px-3 py-1.5 bg-surface0 text-text text-sm rounded hover:bg-surface1 transition-colors w-32"
              >
                打开文件
              </button>
              <button
                onClick={handleOpenFolder}
                className="px-3 py-1.5 bg-surface0 text-text text-sm rounded hover:bg-surface1 transition-colors w-32"
              >
                打开文件夹
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
