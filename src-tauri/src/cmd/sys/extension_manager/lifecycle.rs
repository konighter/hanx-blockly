use tauri::{Runtime, AppHandle};
use std::path::PathBuf;

pub trait ExtensionLifecycle<R: Runtime> {
    /// Called when an extension is being "loaded" (e.g. when app starts or mode switches)
    /// This is where dependency installation should happen.
    fn on_load(&self, app_handle: &AppHandle<R>, extension_id: &str, path: &PathBuf) -> Result<(), String>;
    
    /// Called when an extension is uninstalled.
    /// Clean up dependencies if possible.
    fn on_uninstall(&self, app_handle: &AppHandle<R>, extension_id: &str) -> Result<(), String>;
}
