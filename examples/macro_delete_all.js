/**
 * Macro to delete all Hex Flowers
 *
 * Instructions:
 * 1. Create a new Macro in Foundry VTT.
 * 2. Set the type to "Script".
 * 3. Paste the content of this file into the macro body.
 * 4. Run the macro.
 */
(async () => {
  try {
    // Confirm with user
    const confirmed = await Dialog.confirm({
      title: "Delete All Hex Flowers?",
      content:
        "<p>Are you sure you want to delete <strong>ALL</strong> Hex Flowers? This cannot be undone.</p>",
    });

    if (confirmed) {
      // Unset the flag to remove all data
      await game.user.unsetFlag("world", "hex_flower_registry");

      // Notify user
      ui.notifications.info("All Hex Flowers have been deleted.");
      console.log("Hex Flower Registry cleared.");

      // Refresh the Manager window if it is open
      const manager = Object.values(ui.windows).find(
        (w) => w.id === "hex-flower-manager",
      );
      if (manager) {
        manager.render();
      }
    }
  } catch (error) {
    console.error("Error deleting Hex Flowers:", error);
    ui.notifications.error(
      "An error occurred. Check code console for details.",
    );
  }
})();
