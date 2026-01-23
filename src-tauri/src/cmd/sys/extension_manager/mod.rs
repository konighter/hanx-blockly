use tauri::{Runtime, AppHandle};
use std::path::PathBuf;

pub mod lifecycle;
pub mod python;
pub mod arduino;

use self::lifecycle::ExtensionLifecycle;
use self::python::PythonExtensionLifecycle;
use self::arduino::ArduinoExtensionLifecycle;

pub fn get_lifecycle<R: Runtime>(platform: &str) -> Option<Box<dyn ExtensionLifecycle<R>>> {
    match platform {
        "python" => Some(Box::new(PythonExtensionLifecycle)),
        "arduino" => Some(Box::new(ArduinoExtensionLifecycle)),
        _ => None,
    }
}

/// Generic function to trigger on_load for an extension based on its platform
pub fn trigger_on_load<R: Runtime>(app_handle: &AppHandle<R>, platform: &str, extension_id: &str, path: &PathBuf) -> Result<(), String> {
    if let Some(lifecycle) = get_lifecycle(platform) {
        lifecycle.on_load(app_handle, extension_id, path)
    } else {
        Ok(())
    }
}

/// Generic function to trigger on_uninstall for an extension based on its platform
pub fn trigger_on_uninstall<R: Runtime>(app_handle: &AppHandle<R>, platform: &str, extension_id: &str) -> Result<(), String> {
    if let Some(lifecycle) = get_lifecycle(platform) {
        lifecycle.on_uninstall(app_handle, extension_id)
    } else {
        Ok(())
    }
}
