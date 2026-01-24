use tauri::{Runtime, AppHandle};
use std::path::PathBuf;
use std::process::{Command};
use super::lifecycle::ExtensionLifecycle;
use crate::cmd::sys::env_manager::python::PythonEnvironment;
use crate::cmd::sys::env_manager::EnvironmentImplementation;

pub struct PythonExtensionLifecycle;

use sha2::{Sha256, Digest};
use std::io::Write;

impl<R: Runtime> ExtensionLifecycle<R> for PythonExtensionLifecycle {
    fn on_load(&self, app_handle: &AppHandle<R>, extension_id: &str, path: &PathBuf) -> Result<(), String> {
        println!("[Python] 📂 Loading extension: {} (Path: {:?})", extension_id, path);
        
        let requirements_path = path.join("lib").join("requirements.txt");
        if requirements_path.exists() {
            println!("[Python] 📋 Found requirements: {:?}", requirements_path);
            
            // Read requirement content
            let content = match std::fs::read_to_string(&requirements_path) {
                Ok(c) => c,
                Err(e) => return Err(format!("Failed to read requirements.txt: {}", e)),
            };

            // Calculate current hash
            let mut hasher = Sha256::new();
            hasher.update(content.as_bytes());
            let current_hash = format!("{:x}", hasher.finalize());
            let hash_path = path.join("lib").join(".requirements.sha256");

            // Check if hash matches
            if hash_path.exists() {
                if let Ok(stored_hash) = std::fs::read_to_string(&hash_path) {
                    if stored_hash.trim() == current_hash {
                        println!("[Python] ✅ Dependencies up to date (Hash match), skipping install.");
                        return Ok(());
                    }
                }
            }

             // Ensure python environment is ready
            println!("[Python] 🔧 Ensuring Python environment...");
            PythonEnvironment.ensure_environment(app_handle)?;
            let python_bin = PythonEnvironment.get_binary_path(app_handle);
            println!("[Python] 🐍 Using Python: {:?}", python_bin);
            
            println!("[Python] ⏳ Installing dependencies...");
            let output = Command::new(&python_bin)
                .arg("-m")
                .arg("pip")
                .arg("install")
                .arg("-r")
                .arg(&requirements_path)
                .output()
                .map_err(|e| format!("Failed to run pip install: {}", e))?;
            
            if output.status.success() {
                println!("[Python] ✅ Dependencies installed successfully");
                // Save success hash
                if let Err(e) = std::fs::write(&hash_path, current_hash) {
                     println!("[Python] ⚠️ Failed to save dependency hash: {}", e);
                }
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                println!("[Python] ❌ Dependency install failed: {}", stderr);
                return Err(format!("Failed to install python requirements: {}", stderr));
            }
        } else {
            println!("[Python] ℹ️ No requirements.txt found, skipping");
        }
        Ok(())
    }

    fn on_uninstall(&self, _app_handle: &AppHandle<R>, extension_id: &str) -> Result<(), String> {
        println!("[Python扩展] 🗑️ 卸载扩展: {}", extension_id);
        // Cleaning up pip packages is hard without a sandbox, so we skip for now
        Ok(())
    }
}
