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
    println!("[ExtensionManager] 🔄 触发扩展加载: {} (平台: {}, 路径: {:?})", extension_id, platform, path);
    if let Some(lifecycle) = get_lifecycle(platform) {
        let result = lifecycle.on_load(app_handle, extension_id, path);
        match &result {
            Ok(_) => println!("[ExtensionManager] ✅ 扩展加载成功: {}", extension_id),
            Err(e) => println!("[ExtensionManager] ❌ 扩展加载失败: {} - {}", extension_id, e),
        }
        result
    } else {
        println!("[ExtensionManager] ⚠️ 未找到平台 {} 的生命周期处理器", platform);
        Ok(())
    }
}

/// Generic function to trigger on_uninstall for an extension based on its platform
pub fn trigger_on_uninstall<R: Runtime>(app_handle: &AppHandle<R>, platform: &str, extension_id: &str) -> Result<(), String> {
    println!("[ExtensionManager] 🗑️ 触发扩展卸载: {} (平台: {})", extension_id, platform);
    if let Some(lifecycle) = get_lifecycle(platform) {
        let result = lifecycle.on_uninstall(app_handle, extension_id);
        match &result {
            Ok(_) => println!("[ExtensionManager] ✅ 扩展卸载成功: {}", extension_id),
            Err(e) => println!("[ExtensionManager] ❌ 扩展卸载失败: {} - {}", extension_id, e),
        }
        result
    } else {
        println!("[ExtensionManager] ⚠️ 未找到平台 {} 的生命周期处理器", platform);
        Ok(())
    }
}
