import { memo, useState, useEffect } from 'react';
import { useConfigStore } from '@/store/use-config-store';

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const EditorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const PreviewIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const PaletteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </svg>
);

const SaveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const UIIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

type TabId = 'theme' | 'editor' | 'preview' | 'autosave' | 'ui';

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'theme', label: '主题', icon: <PaletteIcon /> },
  { id: 'editor', label: '编辑器', icon: <EditorIcon /> },
  { id: 'preview', label: '预览', icon: <PreviewIcon /> },
  { id: 'autosave', label: '自动保存', icon: <SaveIcon /> },
  { id: 'ui', label: '界面', icon: <UIIcon /> },
];

const Toggle = memo(function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors ${
        checked ? 'bg-blue' : 'bg-surface1'
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-base shadow-md transition-transform ${
          checked ? 'translate-x-4.5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
});

const NumberInput = memo(function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const num = parseInt(e.target.value, 10);
        if (!isNaN(num)) {
          let clamped = num;
          if (min !== undefined) clamped = Math.max(min, clamped);
          if (max !== undefined) clamped = Math.min(max, clamped);
          onChange(clamped);
        }
      }}
      className="w-20 px-2 py-1 bg-surface0 border border-surface1 rounded text-text text-sm focus:outline-none focus:border-blue"
    />
  );
});

const Slider = memo(function Slider({
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1.5 bg-surface1 rounded-full appearance-none cursor-pointer accent-blue"
      />
      <span className="w-10 text-right text-sm text-subtext0">{value}</span>
    </div>
  );
});

const Select = memo(function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-2 py-1 bg-surface0 border border-surface1 rounded text-text text-sm focus:outline-none focus:border-blue cursor-pointer"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
});

const SettingRow = memo(function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-surface0 last:border-b-0">
      <div className="flex-1 pr-4">
        <div className="text-sm text-text font-medium">{label}</div>
        {description && (
          <div className="text-xs text-subtext0 mt-0.5">{description}</div>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
});

export function SettingsModal() {
  const isOpen = useConfigStore((s) => s.settingsOpen);
  const closeSettings = useConfigStore((s) => s.closeSettings);
  const activeTab = useConfigStore((s) => s.activeTab);
  const setActiveTab = useConfigStore((s) => s.setActiveTab);
  const config = useConfigStore((s) => s.config);
  const updateConfig = useConfigStore((s) => s.updateConfig);
  const resetConfig = useConfigStore((s) => s.resetConfig);

  const [localConfig, setLocalConfig] = useState<AppConfig>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    updateConfig(localConfig);
    closeSettings();
  };

  const handleCancel = () => {
    setLocalConfig(config);
    closeSettings();
  };

  const handleReset = async () => {
    if (window.confirm('确定要重置所有设置为默认值吗？')) {
      await resetConfig();
      closeSettings();
    }
  };

  const updateEditor = (partial: Partial<AppConfig['editor']>) => {
    setLocalConfig((prev) => ({
      ...prev,
      editor: { ...prev.editor, ...partial },
    }));
  };

  const updatePreview = (partial: Partial<AppConfig['preview']>) => {
    setLocalConfig((prev) => ({
      ...prev,
      preview: { ...prev.preview, ...partial },
    }));
  };

  const updateAutoSave = (partial: Partial<AppConfig['autoSave']>) => {
    setLocalConfig((prev) => ({
      ...prev,
      autoSave: { ...prev.autoSave, ...partial },
    }));
  };

  const updateUI = (partial: Partial<AppConfig['ui']>) => {
    setLocalConfig((prev) => ({
      ...prev,
      ui: { ...prev.ui, ...partial },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-crust/80 backdrop-blur-sm"
        onClick={handleCancel}
      />

      <div className="relative w-[720px] max-h-[80vh] bg-base border border-surface0 rounded-lg shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-surface0">
          <h2 className="text-lg font-semibold text-text">设置</h2>
          <button
            onClick={handleCancel}
            className="w-8 h-8 flex items-center justify-center rounded text-subtext0 hover:bg-surface0 hover:text-text transition-colors"
          >
            <XIcon />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-44 border-r border-surface0 py-2 flex-shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-surface0 text-text border-r-2 border-blue'
                    : 'text-subtext0 hover:text-text hover:bg-mantle'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-3">
            {activeTab === 'theme' && (
              <div>
                <SettingRow
                  label="主题模式"
                  description="选择应用的外观主题"
                >
                  <Select
                    value={localConfig.theme}
                    onChange={(theme) => setLocalConfig((prev) => ({ ...prev, theme: theme as AppConfig['theme'] }))}
                    options={[
                      { value: 'dark', label: '深色' },
                      { value: 'light', label: '浅色' },
                      { value: 'system', label: '跟随系统' },
                    ]}
                  />
                </SettingRow>
              </div>
            )}

            {activeTab === 'editor' && (
              <div>
                <SettingRow
                  label="字体大小"
                  description="编辑器字体大小（像素）"
                >
                  <Slider
                    value={localConfig.editor.fontSize}
                    onChange={(fontSize) => updateEditor({ fontSize })}
                    min={10}
                    max={28}
                  />
                </SettingRow>

                <SettingRow
                  label="行高"
                  description="编辑器行高倍数"
                >
                  <Slider
                    value={localConfig.editor.lineHeight}
                    onChange={(lineHeight) => updateEditor({ lineHeight: Math.round(lineHeight * 10) / 10 })}
                    min={1.2}
                    max={2.4}
                    step={0.1}
                  />
                </SettingRow>

                <SettingRow
                  label="Tab 大小"
                  description="Tab 键对应的空格数"
                >
                  <NumberInput
                    value={localConfig.editor.tabSize}
                    onChange={(tabSize) => updateEditor({ tabSize })}
                    min={1}
                    max={8}
                  />
                </SettingRow>

                <SettingRow
                  label="自动换行"
                  description="长行自动折行显示"
                >
                  <Toggle
                    checked={localConfig.editor.wordWrap}
                    onChange={(wordWrap) => updateEditor({ wordWrap })}
                  />
                </SettingRow>

                <SettingRow
                  label="显示行号"
                  description="在编辑器左侧显示行号"
                >
                  <Toggle
                    checked={localConfig.editor.showLineNumbers}
                    onChange={(showLineNumbers) => updateEditor({ showLineNumbers })}
                  />
                </SettingRow>

                <SettingRow
                  label="高亮当前行"
                  description="高亮显示光标所在行"
                >
                  <Toggle
                    checked={localConfig.editor.highlightActiveLine}
                    onChange={(highlightActiveLine) => updateEditor({ highlightActiveLine })}
                  />
                </SettingRow>
              </div>
            )}

            {activeTab === 'preview' && (
              <div>
                <SettingRow
                  label="字体大小"
                  description="预览区域字体大小（像素）"
                >
                  <Slider
                    value={localConfig.preview.fontSize}
                    onChange={(fontSize) => updatePreview({ fontSize })}
                    min={12}
                    max={24}
                  />
                </SettingRow>

                <SettingRow
                  label="行高"
                  description="预览区域行高倍数"
                >
                  <Slider
                    value={localConfig.preview.lineHeight}
                    onChange={(lineHeight) => updatePreview({ lineHeight: Math.round(lineHeight * 10) / 10 })}
                    min={1.4}
                    max={2.4}
                    step={0.1}
                  />
                </SettingRow>

                <SettingRow
                  label="内容最大宽度"
                  description="预览内容区最大宽度（像素）"
                >
                  <NumberInput
                    value={localConfig.preview.maxWidth}
                    onChange={(maxWidth) => updatePreview({ maxWidth })}
                    min={600}
                    max={1200}
                    step={50}
                  />
                </SettingRow>
              </div>
            )}

            {activeTab === 'autosave' && (
              <div>
                <SettingRow
                  label="启用自动保存"
                  description="自动保存文件修改"
                >
                  <Toggle
                    checked={localConfig.autoSave.enabled}
                    onChange={(enabled) => updateAutoSave({ enabled })}
                  />
                </SettingRow>

                {localConfig.autoSave.enabled && (
                  <SettingRow
                    label="自动保存间隔"
                    description="自动保存的时间间隔（秒）"
                  >
                    <NumberInput
                      value={Math.round(localConfig.autoSave.interval / 1000)}
                      onChange={(seconds) => updateAutoSave({ interval: seconds * 1000 })}
                      min={5}
                      max={300}
                    />
                  </SettingRow>
                )}
              </div>
            )}

            {activeTab === 'ui' && (
              <div>
                <SettingRow
                  label="侧边栏宽度"
                  description="文件侧边栏的默认宽度（像素）"
                >
                  <NumberInput
                    value={localConfig.ui.sidebarWidth}
                    onChange={(sidebarWidth) => updateUI({ sidebarWidth })}
                    min={180}
                    max={500}
                    step={10}
                  />
                </SettingRow>

                <SettingRow
                  label="显示状态栏"
                  description="在窗口底部显示状态栏"
                >
                  <Toggle
                    checked={localConfig.ui.showStatusBar}
                    onChange={(showStatusBar) => updateUI({ showStatusBar })}
                  />
                </SettingRow>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-surface0 bg-mantle">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red hover:bg-red/10 rounded transition-colors"
          >
            <RefreshIcon />
            恢复默认
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-1.5 text-sm text-subtext0 hover:text-text rounded transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 text-sm bg-blue text-base rounded hover:bg-blue/90 transition-colors font-medium"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
