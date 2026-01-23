use tauri::{Runtime, AppHandle};
use std::process::{Command};
use std::path::PathBuf;
use super::EnvironmentImplementation;

pub struct ArduinoEnvironment;

impl<R: Runtime> EnvironmentImplementation<R> for ArduinoEnvironment {
    fn platform_name(&self) -> &str {
        "arduino"
    }

    fn ensure_environment(&self, _app_handle: &AppHandle<R>) -> Result<(), String> {
        // Check if arduino-cli is available
        let status = Command::new("arduino-cli")
            .arg("version")
            .status()
            .map_err(|e| format!("Arduino CLI not found: {}", e))?;

        if !status.success() {
            return Err("Arduino CLI returned error status".to_string());
        }

        Ok(())
    }

    fn get_binary_path(&self, _app_handle: &AppHandle<R>) -> PathBuf {
        PathBuf::from("arduino-cli")
    }

    fn install_dependencies(&self, _app_handle: &AppHandle<R>, deps: &[String]) -> Result<(), String> {
        for dep in deps {
            println!("Installing arduino library: {}", dep);
            let _ = Command::new("arduino-cli")
                .args(&["lib", "install", dep])
                .status();
        }
        Ok(())
    }
}
