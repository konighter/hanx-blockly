use tauri::{Runtime, AppHandle};
use std::path::PathBuf;
use std::process::{Command};
use super::lifecycle::ExtensionLifecycle;
use crate::cmd::sys::env_manager::python::PythonEnvironment;
use crate::cmd::sys::env_manager::EnvironmentImplementation;

pub struct PythonExtensionLifecycle;

impl<R: Runtime> ExtensionLifecycle<R> for PythonExtensionLifecycle {
    fn on_load(&self, app_handle: &AppHandle<R>, _extension_id: &str, path: &PathBuf) -> Result<(), String> {
        let requirements_path = path.join("lib").join("requirements.txt");
        if requirements_path.exists() {
            println!("Installing python dependencies from {:?}", requirements_path);
            
            // Ensure python environment is ready
            PythonEnvironment.ensure_environment(app_handle)?;
            let python_bin = PythonEnvironment.get_binary_path(app_handle);
            
            let status = Command::new(python_bin)
                .arg("-m")
                .arg("pip")
                .arg("install")
                .arg("-r")
                .arg(requirements_path)
                .status()
                .map_err(|e| format!("Failed to run pip install: {}", e))?;
            
            if !status.success() {
                return Err("Failed to install python requirements".to_string());
            }
        }
        Ok(())
    }

    fn on_uninstall(&self, _app_handle: &AppHandle<R>, _extension_id: &str) -> Result<(), String> {
        // Cleaning up pip packages is hard without a sandbox, so we skip for now
        Ok(())
    }
}
