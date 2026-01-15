import {
  generateSVG,
  getRegistry,
  saveRegistry,
  generateId,
  HEX_size,
} from "../utils.js";
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class HexFlowerManager extends HandlebarsApplicationMixin(
  ApplicationV2
) {
  static DEFAULT_OPTIONS = {
    id: "hex-flower-manager",
    title: "Hex Flower Manager",
    tag: "div",
    classes: ["hex-flower-app"],
    window: {
      resizable: true,
      width: 450,
      icon: "fas fa-seedling",
    },
    actions: {
      create: HexFlowerManager._onCreate,
      edit: HexFlowerManager._onEdit,
      delete: HexFlowerManager._onDelete,
    },
  };

  static PARTS = {
    main: { template: "modules/hexflower/templates/manager.hbs" },
  };

  async _prepareContext(options) {
    const registry = getRegistry();
    const flowers = Object.entries(registry).map(([id, entry]) => ({
      id,
      name: entry.name || "Unnamed Flower",
      cellCount: entry.data?.cells?.length || 0,
    }));

    return { flowers };
  }

  static async _onCreate(event, target) {
    new HexFlowerEditor().render(true);
  }

  static async _onEdit(event, target) {
    const id = target.dataset.id;
    new HexFlowerEditor({ flowerId: id }).render(true);
  }

  static async _onDelete(event, target) {
    const id = target.dataset.id;
    const registry = getRegistry();
    const entry = registry[id];

    const confirm = await Dialog.confirm({
      title: "Delete Hex Flower?",
      content: `<p>Are you sure you want to delete <strong>${entry?.name}</strong>?</p>`,
    });

    if (confirm) {
      delete registry[id];
      await saveRegistry(registry);
      this.render(); // Re-render manager
    }
  }
}

export class HexFlowerEditor extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options = {}) {
    super(options);
    this.flowerId = options.flowerId || null;
    this.document = null; // We are not bound to a document

    // Initial State
    this.editorState = {
      draft: null,
      selectedHexIndex: -1,
      activeTab: "visual",
      svg: "",
    };
  }

  static DEFAULT_OPTIONS = {
    id: "hex-flower-editor",
    title: "Hex Flower Editor",
    tag: "form",
    classes: ["hex-flower-editor", "standard-form"],
    window: {
      resizable: true,
      width: 950,
      height: 750,
      icon: "fas fa-edit",
    },
    actions: {
      addHex: HexFlowerEditor._onAddHex,
      deleteHex: HexFlowerEditor._onDeleteHex,
      addRule: HexFlowerEditor._onAddRule,
      deleteRule: HexFlowerEditor._onDeleteRule,
      parseJson: HexFlowerEditor._onParseJson,
      copyJson: HexFlowerEditor._onCopyJson,
    },
    form: {
      handler: HexFlowerEditor._onSubmit,
      submitOnChange: false,
      closeOnSubmit: false,
    },
  };

  static PARTS = {
    main: { template: "modules/hexflower/templates/editor.hbs" },
  };

  async _prepareContext(options) {
    // Load data if not loaded or if hard reset needed
    if (!this.editorState.draft) {
      const registry = getRegistry();
      if (this.flowerId && registry[this.flowerId]) {
        const original = registry[this.flowerId];
        // Deep copy
        this.editorState.draft = {
          name: original.name || "Unnamed",
          data: original.data
            ? JSON.parse(JSON.stringify(original.data))
            : { cells: [] },
          edgeBehavior: original.edgeBehavior || "stop",
          navigationRules: original.navigationRules
            ? JSON.parse(JSON.stringify(original.navigationRules))
            : [],
          partyActorId: original.partyActorId || "",
        };
      } else {
        this.editorState.draft = {
          name: "New Hex Flower",
          data: { cells: [] },
          edgeBehavior: "stop",
          navigationRules: [],
          partyActorId: "",
        };
        // Add defaults
        if (this.editorState.draft.navigationRules.length === 0) {
          this.editorState.draft.navigationRules = [
            { min: 12, max: 12, dir: "N" },
            { min: 10, max: 11, dir: "NE" },
            { min: 8, max: 9, dir: "SE" },
            { min: 7, max: 7, dir: "SAME" },
            { min: 5, max: 6, dir: "S" },
            { min: 3, max: 4, dir: "SW" },
            { min: 2, max: 2, dir: "NW" },
          ];
        }
        // Save original state for dirty checking
        this.originalState = JSON.parse(JSON.stringify(this.editorState.draft));
      }
    }

    const draft = this.editorState.draft;
    const selectedCell =
      this.editorState.selectedHexIndex >= 0
        ? draft.data.cells[this.editorState.selectedHexIndex]
        : null;

    // Generate SVG
    const svg = generateSVG(draft.data.cells, {
      selectedCoord: selectedCell ? selectedCell.coord : null,
      size: 25, // Preview size
    });

    // Options
    const actorOptions = {};
    game.actors.forEach((a) => (actorOptions[a.id] = a.name));

    const directionOptions = {
      N: "N",
      NE: "NE",
      SE: "SE",
      S: "S",
      SW: "SW",
      NW: "NW",
      SAME: "Stay",
    };
    const edgeBehaviorOptions = {
      stop: "Stop",
      wrap: "Wrap (Antipodal)",
      reflect: "Reflect",
      rotateCW: "Rotate Clockwise (60°)",
      rotateCCW: "Rotate Anti-Clockwise (60°)"
    };

    // Prepare Props Strings
    let tagsString = "";
    let propertiesString = "";
    if (selectedCell) {
        if (Array.isArray(selectedCell.tags)) {
            tagsString = selectedCell.tags.join(", ");
        }
        if (selectedCell.properties) {
            propertiesString = JSON.stringify(selectedCell.properties, null, 2);
        } else {
            // Default empty object
            propertiesString = "{\n}";
        }
    }

    return {
      name: draft.name,
      selectedCell,
      tagsString,
      propertiesString,
      svg,
      navigationRules: draft.navigationRules,
      edgeBehavior: draft.edgeBehavior,
      partyActorId: draft.partyActorId,
      jsonString: JSON.stringify(
        {
          data: draft.data,
          navigationRules: draft.navigationRules,
          edgeBehavior: draft.edgeBehavior,
        },
        null,
        2
      ),
      actorOptions,
      directionOptions,
      edgeBehaviorOptions,
      activeTab: this.editorState.activeTab,
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);

    // Tab Handling - DOM based to avoid full re-render
    const activeTab = this.editorState.activeTab;

    // function to update visibility
    const updateTabs = (tabId) => {
      this.editorState.activeTab = tabId;
      const tabNavs = this.element.querySelectorAll(".sheet-tabs .item");
      const tabContents = this.element.querySelectorAll(".tab");

      tabNavs.forEach((el) => {
        el.classList.toggle("active", el.dataset.tab === tabId);
      });
      tabContents.forEach((el) => {
        const isActive = el.dataset.tab === tabId;
        el.classList.toggle("active", isActive);
        // Specific display types: Visual needs flex, others block
        if (isActive) {
          el.style.display = tabId === "visual" ? "flex" : "block";
        } else {
          el.style.display = "none";
        }
      });
    };

    // Initialize state
    updateTabs(activeTab);

    // Listeners
    const navItems = this.element.querySelectorAll(".sheet-tabs .item");

    navItems.forEach((el) => {
      el.addEventListener("click", (ev) => {
        ev.preventDefault();
        updateTabs(el.dataset.tab);
      });
    });

    // Bind Hex Clicks
    this.element.querySelectorAll(".hex-cell").forEach((el) => {
      el.addEventListener("click", (ev) => {
        const q = parseInt(ev.currentTarget.dataset.q);
        const r = parseInt(ev.currentTarget.dataset.r);
        const idx = this.editorState.draft.data.cells.findIndex(
          (c) => c.coord.q === q && c.coord.r === r
        );
        this.editorState.selectedHexIndex = idx;
        this.render(); // Selection change requires re-render for props panel
      });
    });

    // Bind Prop Inputs Changes manually
    const inputs = this.element.querySelectorAll(
      ".hex-input, .hex-input-small, input[type='color'], textarea.hex-input"
    );
    inputs.forEach((input) => {
      input.addEventListener("change", (ev) => {
        this._updateDraftFromInput(ev.target);
      });
    });
  }

  _updateDraftFromInput(target) {
    const field = target.name || target.dataset.prop; // prop for cell props
    const val = target.value;

    if (target.closest(".props-form")) {
      // Updating Cell Prop
      if (this.editorState.selectedHexIndex >= 0) {
        const cell =
          this.editorState.draft.data.cells[this.editorState.selectedHexIndex];
        if (cell) {
            if (field === "tags") {
                // Parse CSV to Array
                cell.tags = val.split(",").map(s => s.trim()).filter(s => s.length > 0);
            } else if (field === "properties") {
                // Parse JSON
                try {
                    cell.properties = JSON.parse(val);
                } catch (e) {
                    ui.notifications.warn("Invalid Properties JSON");
                    // Don't update cell prop if invalid, just let it sit in UI or revert? 
                    // Current simplified flow: we just warn. Re-rendering might clear it if we called render()
                }
            } else {
                cell[field] = val;
            }
          
          // If visual prop, trigger re-render
          if (["color", "emoji", "title", "name"].includes(field))
            this.render();
        }
      }
    } else if (target.closest(".tab[data-tab='rules']")) {
      // Rules or Globals
      if (
        target.classList.contains("rule-min") ||
        target.classList.contains("rule-max") ||
        target.classList.contains("rule-dir")
      ) {
        const idx = parseInt(target.dataset.idx);
        const key = target.dataset.key;
        this.editorState.draft.navigationRules[idx][key] =
          key === "dir" ? val : parseInt(val);
      } else {
        if (field === "edgeBehavior" || field === "partyActorId") {
          this.editorState.draft[field] = val;
        }
      }
    } else {
      // Main fields
      if (field === "name") this.editorState.draft.name = val;
    }
  }

  /* Actions */

  static async _onAddHex(event, target) {
    // Find free spot
    // Simple logic: neighbor of selected or first
    const cells = this.editorState.draft.data.cells;
    let base = { q: 0, r: 0 };
    if (cells.length > 0) {
      const idx =
        this.editorState.selectedHexIndex >= 0
          ? this.editorState.selectedHexIndex
          : cells.length - 1;
      base = cells[idx].coord;
    }

    // Neighbors
    const neighbors = [
      { q: 0, r: -1 },
      { q: 1, r: -1 },
      { q: 1, r: 0 },
      { q: 0, r: 1 },
      { q: -1, r: 1 },
      { q: -1, r: 0 },
    ];

    let newCoord = null;
    // Search immediate neighbors
    for (let n of neighbors) {
      const tq = base.q + n.q;
      const tr = base.r + n.r;
      if (!cells.some((c) => c.coord.q === tq && c.coord.r === tr)) {
        newCoord = { q: tq, r: tr, s: -tq - tr };
        break;
      }
    }

    if (!newCoord) {
      // Fallback: random neighbor of random cell?
      // Just add to far
      newCoord = { q: base.q + 1, r: base.r + 1, s: -base.q - base.r - 2 };
    }

    cells.push({ coord: newCoord, title: "New Hex" });
    this.editorState.selectedHexIndex = cells.length - 1;
    this.render();
  }

  static async _onDeleteHex(event, target) {
    if (this.editorState.selectedHexIndex >= 0) {
      this.editorState.draft.data.cells.splice(
        this.editorState.selectedHexIndex,
        1
      );
      this.editorState.selectedHexIndex = -1;
      this.render();
    }
  }

  static async _onAddRule(event, target) {
    this.editorState.draft.navigationRules.push({
      min: 0,
      max: 0,
      dir: "SAME",
    });
    this.render();
  }

  static async _onDeleteRule(event, target) {
    const idx = parseInt(target.dataset.idx);
    this.editorState.draft.navigationRules.splice(idx, 1);
    this.render();
  }

  static async _onParseJson(event, target) {
    const textarea = this.element.querySelector("textarea[name='jsonInput']");
    try {
      const parsed = JSON.parse(textarea.value);
      // Basic merge
      if (parsed.data || parsed.cells) {
        if (parsed.data) this.editorState.draft.data = parsed.data;
        if (parsed.cells) this.editorState.draft.data.cells = parsed.cells;
        if (parsed.navigationRules)
          this.editorState.draft.navigationRules = parsed.navigationRules;
        if (parsed.edgeBehavior)
          this.editorState.draft.edgeBehavior = parsed.edgeBehavior;
        this.editorState.selectedHexIndex = -1;
        this.render();
        ui.notifications.info("JSON Applied");
      }
    } catch (e) {
      ui.notifications.error("JSON Parse Error");
    }
  }

  static async _onCopyJson(event, target) {
    const json = this.element.querySelector("textarea[name='jsonInput']").value;
    navigator.clipboard
      .writeText(json)
      .then(() => ui.notifications.info("Copied!"));
  }

  static async _onSubmit(event, form, formData) {
    await this._save(formData.object);
  }

  async _save(data = null) {
    const draft = this.editorState.draft;
    // Update name from formData if present, as it is a main field
    if (data && data.name) {
        draft.name = data.name;
    }

    const registry = getRegistry();
    const id = this.flowerId || generateId();

    registry[id] = {
      name: draft.name,
      data: draft.data,
      edgeBehavior: draft.edgeBehavior,
      navigationRules: draft.navigationRules,
      partyActorId: draft.partyActorId,
    };

    await saveRegistry(registry);
    this.originalState = JSON.parse(JSON.stringify(draft));
    ui.notifications.info(`Saved ${draft.name}`);

    // Refresh Manager if open
    const manager = Object.values(ui.windows).find(
      (w) => w.id === "hex-flower-manager"
    );
    if (manager) manager.render();
  }

  async close(options = {}) {
    if (!options.force && this.editorState.draft && this.originalState) {
      const current = JSON.stringify(this.editorState.draft);
      const original = JSON.stringify(this.originalState);

      if (current !== original) {
        return new Promise((resolve) => {
          new Dialog({
            title: "Unsaved Changes",
            content: `<p>Do you want to save changes to <strong>${this.editorState.draft.name}</strong> before closing?</p>`,
            buttons: {
              save: {
                label: "Save",
                icon: '<i class="fas fa-save"></i>',
                callback: async () => {
                  await this._save();
                  await super.close({ ...options, force: true });
                  resolve();
                },
              },
              discard: {
                label: "Don't Save",
                icon: '<i class="fas fa-trash"></i>',
                callback: async () => {
                  await super.close({ ...options, force: true });
                  resolve();
                },
              },
            },
            default: "save",
            close: () => resolve(), // Cancel keeps window open
          }).render(true);
        });
      }
    }
    return super.close(options);
  }
}
