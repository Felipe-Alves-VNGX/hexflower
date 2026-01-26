/**
 * Macro to delete a specific Hex Flower with a UI selection
 * 
 * Instructions:
 * 1. Create a new Macro in Foundry VTT.
 * 2. Set the type to "Script".
 * 3. Paste the content of this file into the macro body.
 * 4. Run the macro.
 */
(async () => {
    const registry = game.user.getFlag("world", "hex_flower_registry") || {};
    const flowers = Object.entries(registry).map(([id, entry]) => ({
        id,
        name: entry.name || "Unnamed Flower"
    }));

    if (flowers.length === 0) {
        ui.notifications.warn("No Hex Flowers found to delete.");
        return;
    }

    // Sort flowers by name for easier finding
    flowers.sort((a, b) => a.name.localeCompare(b.name));

    // Build the selection HTML
    let options = flowers.map(f => `<option value="${f.id}">${f.name}</option>`).join("");
    
    const content = `
    <form>
      <div class="form-group">
        <label>Select Hex Flower to Delete:</label>
        <select id="hex-flower-delete-select" style="width: 100%;">
          ${options}
        </select>
      </div>
      <p style="color: red; margin-top: 10px;">Warning: This action cannot be undone.</p>
    </form>
    `;

    new Dialog({
        title: "Delete Specific Hex Flower",
        content: content,
        buttons: {
            delete: {
                label: "Delete",
                icon: '<i class="fas fa-trash"></i>',
                callback: async (html) => {
                    const selectedId = html.find("#hex-flower-delete-select").val();
                    if (!selectedId) return;

                    const flowerName = registry[selectedId]?.name || "Unknown";

                    // Double confirmation
                    const confirm = await Dialog.confirm({
                        title: "Confirm Deletion",
                        content: `<p>Are you sure you want to delete <strong>${flowerName}</strong>?</p>`
                    });

                    if (confirm) {
                        try {
                            // Use Foundry's -= syntax to delete the key from the flag object
                            await game.user.setFlag("world", "hex_flower_registry", {
                                [`-=${selectedId}`]: null
                            });

                            ui.notifications.info(`Deleted Hex Flower: ${flowerName}`);

                            // Refresh Manager if open
                            const manager = Object.values(ui.windows).find(w => w.id === "hex-flower-manager");
                            if (manager) manager.render();

                        } catch (err) {
                            console.error(err);
                            ui.notifications.error("Failed to delete Hex Flower.");
                        }
                    }
                }
            },
            cancel: {
                label: "Cancel",
                icon: '<i class="fas fa-times"></i>'
            }
        },
        default: "cancel"
    }).render(true);

})();
