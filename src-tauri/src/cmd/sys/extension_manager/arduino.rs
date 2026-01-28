use tauri::{Runtime, AppHandle, Manager};
use std::path::PathBuf;
use std::process::{Command};
use std::fs;
use super::lifecycle::ExtensionLifecycle;

pub struct ArduinoExtensionLifecycle;

use serde::Deserialize;

#[derive(Deserialize, Debug)]
struct ArduinoLib {
    name: String,
}

#[derive(Deserialize, Debug)]
struct ArduinoLibWrapper {
    library: ArduinoLib,
}

#[derive(Deserialize, Debug)]
struct ArduinoLibList {
    #[serde(rename = "installed_libraries")]
    libraries: Option<Vec<ArduinoLibWrapper>>,
}

impl<R: Runtime> ExtensionLifecycle<R> for ArduinoExtensionLifecycle {
    fn on_load(&self, _app_handle: &AppHandle<R>, extension_id: &str, path: &PathBuf) -> Result<(), String> {
        println!("[Arduino] 📂 Loading extension: {} (Path: {:?})", extension_id, path);
        
        let lib_dir = path.join("lib");
        if !lib_dir.exists() {
            println!("[Arduino] ℹ️ No lib directory found, skipping");
            return Ok(());
        }

        // 1. Check for libraries.txt
        let libraries_txt = lib_dir.join("libraries.txt");
        if libraries_txt.exists() {
            println!("[Arduino] 📋 Found libraries list: {:?}", libraries_txt);
            
            let session = _app_handle.state::<crate::SessionState>();
            let mut cache = session.arduino_libraries_cache.lock().unwrap();
            
            let installed_names: Vec<String> = if let Some(libs) = &*cache {
                println!("[Arduino] ⏩ Using cached library list ({} libs)", libs.len() as usize);
                libs.clone()
            } else {
                // Get installed libraries (including built-ins)
                // Runs: arduino-cli lib list --all --format json
                println!("[Arduino] 🔍 Fetching installed libraries list...");
                let installed_libs_output = Command::new("arduino-cli")
                    .args(&["lib", "list", "--all", "--format", "json"])
                    .output()
                    .map_err(|e| format!("Failed to list installed libs: {}", e))?;
                
                let names: Vec<String> = if installed_libs_output.status.success() {
                     let json_output = String::from_utf8_lossy(&installed_libs_output.stdout);
                     match serde_json::from_str::<ArduinoLibList>(&json_output) {
                         Ok(list) => {
                             let n: Vec<String> = list.libraries
                                 .unwrap_or_default()
                                 .into_iter()
                                 .map(|l| l.library.name)
                                 .collect();
                             println!("[Arduino] 📚 Parsed {} libraries from index", n.len());
                             n
                         }
                         Err(e) => {
                             println!("[Arduino] ❌ Failed to parse library list JSON: {}", e);
                             vec![]
                         }
                     }
                } else {
                     let stderr = String::from_utf8_lossy(&installed_libs_output.stderr);
                     println!("[Arduino] ❌ arduino-cli lib list --all failed: {}", stderr.trim());
                     vec![] // Failed to list
                };
                
                *cache = Some(names.clone());
                names
            };

            let content = fs::read_to_string(&libraries_txt).map_err(|e| e.to_string())?;
            
            for line in content.lines() {
                let lib_name = line.trim();
                if !lib_name.is_empty() && !lib_name.starts_with('#') {
                    if installed_names.contains(&lib_name.to_string()) {
                         println!("[Arduino] ✅ Library '{}' already installed, skipping.", lib_name);
                         continue;
                    }

                    println!("[Arduino] 📦 Installing library: {}", lib_name);
                    let output = Command::new("arduino-cli")
                        .args(&["lib", "install", lib_name])
                        .output();
                    
                    match output {
                        Ok(out) => {
                            if out.status.success() {
                                println!("[Arduino] ✅ Library installed: {}", lib_name);
                            } else {
                                let stderr = String::from_utf8_lossy(&out.stderr);
                                println!("[Arduino] ⚠️ Library install potential fail: {} - {}", lib_name, stderr.trim());
                            }
                        }
                        Err(e) => {
                            println!("[Arduino] ❌ Failed to run arduino-cli: {}", e);
                        }
                    }
                }
            }
        }

        // 2. Check for zip files in lib/ for local installation
        if let Ok(entries) = fs::read_dir(&lib_dir) {
            for entry in entries {
                if let Ok(entry) = entry {
                    let p = entry.path();
                    if p.extension().map_or(false, |ext| ext == "zip") {
                        println!("[Arduino扩展] 📦 从 ZIP 安装库: {:?}", p);
                        let output = Command::new("arduino-cli")
                            .args(&["lib", "install", "--zip-path"])
                            .arg(&p)
                            .output();
                        
                        match output {
                            Ok(out) => {
                                if out.status.success() {
                                    println!("[Arduino扩展] ✅ ZIP 库安装成功");
                                } else {
                                    let stderr = String::from_utf8_lossy(&out.stderr);
                                    println!("[Arduino扩展] ⚠️ ZIP 库安装失败: {}", stderr.trim());
                                }
                            }
                            Err(e) => {
                                println!("[Arduino扩展] ❌ 执行 arduino-cli 失败: {}", e);
                            }
                        }
                    }
                }
            }
        }

        println!("[Arduino扩展] ✅ 扩展处理完成: {}", extension_id);
        Ok(())
    }

    fn on_uninstall(&self, _app_handle: &AppHandle<R>, extension_id: &str) -> Result<(), String> {
        println!("[Arduino扩展] 🗑️ 卸载扩展: {}", extension_id);
        Ok(())
    }
}
