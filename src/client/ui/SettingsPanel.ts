/**
 * Developer Settings Panel
 *
 * Runtime configuration editor for tuning game variables without reload
 * Toggle with CTRL+SHIFT+S
 */

export interface SettingDefinition {
  key: string;
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  category?: string;
}

export class SettingsPanel {
  private panel: HTMLDivElement;
  private isVisible: boolean = false;
  private settings: Map<string, SettingDefinition> = new Map();
  private onChangeCallback?: (key: string, value: number) => void;

  constructor() {
    this.panel = this.createPanel();
    this.setupKeyboardShortcut();
  }

  /**
   * Create the settings panel UI
   */
  private createPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.id = 'dev-settings-panel';
    panel.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 500px;
      max-height: 80vh;
      background: rgba(20, 20, 20, 0.95);
      border: 2px solid #00ff00;
      border-radius: 8px;
      padding: 20px;
      font-family: 'Courier New', monospace;
      color: #00ff00;
      z-index: 10000;
      display: none;
      overflow-y: auto;
      box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 1px solid #00ff00;
      padding-bottom: 10px;
    `;

    const title = document.createElement('h2');
    title.textContent = 'Developer Settings';
    title.style.cssText = `
      margin: 0;
      font-size: 18px;
      color: #00ff00;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      background: none;
      border: 1px solid #00ff00;
      color: #00ff00;
      font-size: 24px;
      cursor: pointer;
      padding: 0 8px;
      border-radius: 4px;
    `;
    closeBtn.onclick = () => this.hide();

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Shortcut hint
    const hint = document.createElement('div');
    hint.textContent = 'Press CTRL+SHIFT+S to toggle';
    hint.style.cssText = `
      font-size: 11px;
      color: #00aa00;
      margin-bottom: 15px;
    `;

    // Settings container
    const container = document.createElement('div');
    container.id = 'settings-container';

    panel.appendChild(header);
    panel.appendChild(hint);
    panel.appendChild(container);

    document.body.appendChild(panel);
    return panel;
  }

  /**
   * Setup keyboard shortcut (CTRL+SHIFT+S)
   */
  private setupKeyboardShortcut(): void {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  /**
   * Register a setting
   */
  registerSetting(definition: SettingDefinition): void {
    this.settings.set(definition.key, definition);
    this.rebuildUI();
  }

  /**
   * Register multiple settings
   */
  registerSettings(definitions: SettingDefinition[]): void {
    definitions.forEach(def => this.settings.set(def.key, def));
    this.rebuildUI();
  }

  /**
   * Update a setting value
   */
  updateSetting(key: string, value: number): void {
    const setting = this.settings.get(key);
    if (setting) {
      setting.value = value;
      this.rebuildUI();
    }
  }

  /**
   * Set callback for when settings change
   */
  onChange(callback: (key: string, value: number) => void): void {
    this.onChangeCallback = callback;
  }

  /**
   * Rebuild the UI with current settings
   */
  private rebuildUI(): void {
    const container = this.panel.querySelector('#settings-container') as HTMLDivElement;
    if (!container) return;

    container.innerHTML = '';

    // Group settings by category
    const categories = new Map<string, SettingDefinition[]>();
    this.settings.forEach(setting => {
      const category = setting.category || 'General';
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(setting);
    });

    // Render each category
    categories.forEach((settings, categoryName) => {
      const categoryDiv = document.createElement('div');
      categoryDiv.style.cssText = `
        margin-bottom: 20px;
      `;

      const categoryTitle = document.createElement('h3');
      categoryTitle.textContent = categoryName;
      categoryTitle.style.cssText = `
        font-size: 14px;
        color: #00dd00;
        margin: 0 0 10px 0;
        text-transform: uppercase;
        border-bottom: 1px solid #005500;
        padding-bottom: 5px;
      `;
      categoryDiv.appendChild(categoryTitle);

      settings.forEach(setting => {
        const row = this.createSettingRow(setting);
        categoryDiv.appendChild(row);
      });

      container.appendChild(categoryDiv);
    });
  }

  /**
   * Create a row for a single setting
   */
  private createSettingRow(setting: SettingDefinition): HTMLDivElement {
    const row = document.createElement('div');
    row.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding: 8px;
      background: rgba(0, 50, 0, 0.3);
      border-radius: 4px;
    `;

    const label = document.createElement('label');
    label.textContent = setting.label;
    label.style.cssText = `
      flex: 1;
      font-size: 13px;
      color: #00ff00;
    `;

    const inputContainer = document.createElement('div');
    inputContainer.style.cssText = `
      display: flex;
      gap: 8px;
      align-items: center;
    `;

    const input = document.createElement('input');
    input.type = 'number';
    input.value = setting.value.toString();
    if (setting.min !== undefined) input.min = setting.min.toString();
    if (setting.max !== undefined) input.max = setting.max.toString();
    if (setting.step !== undefined) input.step = setting.step.toString();
    input.style.cssText = `
      width: 100px;
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid #00ff00;
      color: #00ff00;
      padding: 4px 8px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      border-radius: 3px;
    `;

    input.addEventListener('input', () => {
      const value = parseFloat(input.value);
      if (!isNaN(value)) {
        setting.value = value;
        if (this.onChangeCallback) {
          this.onChangeCallback(setting.key, value);
        }
      }
    });

    const resetBtn = document.createElement('button');
    resetBtn.textContent = '↺';
    resetBtn.title = 'Reset to default';
    resetBtn.style.cssText = `
      background: rgba(0, 100, 0, 0.5);
      border: 1px solid #00ff00;
      color: #00ff00;
      padding: 4px 8px;
      cursor: pointer;
      font-size: 14px;
      border-radius: 3px;
    `;
    resetBtn.onclick = () => {
      // Could implement default value storage here
      console.log(`Reset ${setting.key}`);
    };

    inputContainer.appendChild(input);
    inputContainer.appendChild(resetBtn);

    row.appendChild(label);
    row.appendChild(inputContainer);

    return row;
  }

  /**
   * Show the panel
   */
  show(): void {
    this.panel.style.display = 'block';
    this.isVisible = true;
  }

  /**
   * Hide the panel
   */
  hide(): void {
    this.panel.style.display = 'none';
    this.isVisible = false;
  }

  /**
   * Toggle panel visibility
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Get current setting values as object
   */
  getValues(): Record<string, number> {
    const values: Record<string, number> = {};
    this.settings.forEach((setting, key) => {
      values[key] = setting.value;
    });
    return values;
  }

  /**
   * Destroy the panel
   */
  destroy(): void {
    this.panel.remove();
  }
}
