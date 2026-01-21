use tauri::{Runtime, AppHandle};
use std::path::PathBuf;

/// Top Level: Generic Environment Manager Interface
/// Middle Level: Platform Implementations (Python, Arduino, etc.) implements this trait
/// Bottom Level: Component Dependencies managed by implementations
pub trait EnvironmentImplementation<R: Runtime> {
    fn platform_name(&self) -> &str;
    fn ensure_environment(&self, app_handle: &AppHandle<R>) -> Result<(), String>;
    fn get_binary_path(&self, app_handle: &AppHandle<R>) -> PathBuf;
    fn install_dependencies(&self, app_handle: &AppHandle<R>, deps: &[String]) -> Result<(), String>;
}

// Implementations
pub mod python;
// pub mod arduino;

// Factory / Dispatcher
pub fn get_implementation<R: Runtime>(platform: &str) -> Option<Box<dyn EnvironmentImplementation<R>>> {
    match platform {
        "python" => Some(Box::new(python::PythonEnvironment)),
        // "arduino" => Some(Box::new(arduino::ArduinoEnvironment)),
        _ => None,
    }
}

#[tauri::command]
pub fn ensure_environment(app_handle: tauri::AppHandle, platform: String) -> Result<String, String> {
    if let Some(env) = get_implementation(&platform) {
        env.ensure_environment(&app_handle)
            .map_err(|e| format!("Failed to initialize {} environment: {}", platform, e))?;
        Ok(format!("{} environment ready", platform))
    } else {
        Ok(format!("No isolation needed for {}", platform))
    }
}
