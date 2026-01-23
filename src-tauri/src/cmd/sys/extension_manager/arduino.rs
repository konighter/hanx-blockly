use tauri::{Runtime, AppHandle};
use std::path::PathBuf;
use std::process::{Command};
use std::fs;
use super::lifecycle::ExtensionLifecycle;

pub struct ArduinoExtensionLifecycle;

impl<R: Runtime> ExtensionLifecycle<R> for ArduinoExtensionLifecycle {
    fn on_load(&self, _app_handle: &AppHandle<R>, _extension_id: &str, path: &PathBuf) -> Result<(), String> {
        let lib_dir = path.join("lib");
        if !lib_dir.exists() {
            return Ok(());
        }

        // 1. Check for libraries.txt
        let libraries_txt = lib_dir.join("libraries.txt");
        if libraries_txt.exists() {
            let content = fs::read_to_string(&libraries_txt).map_err(|e| e.to_string())?;
            for line in content.lines() {
                let lib_name = line.trim();
                if !lib_name.is_empty() {
                    println!("Installing arduino library: {}", lib_name);
                    let _ = Command::new("arduino-cli")
                        .args(&["lib", "install", lib_name])
                        .status();
                }
            }
        }

        // 2. Check for zip files in lib/ for local installation
        if let Ok(entries) = fs::read_dir(&lib_dir) {
            for entry in entries {
                if let Ok(entry) = entry {
                    let p = entry.path();
                    if p.extension().map_or(false, |ext| ext == "zip") {
                        println!("Installing arduino library from zip: {:?}", p);
                        let _ = Command::new("arduino-cli")
                            .args(&["lib", "install", "--zip-path"])
                            .arg(&p)
                            .status();
                    }
                }
            }
        }

        Ok(())
    }

    fn on_uninstall(&self, _app_handle: &AppHandle<R>, _extension_id: &str) -> Result<(), String> {
        Ok(())
    }
}
