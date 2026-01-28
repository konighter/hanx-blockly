use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tauri::Manager;
use std::time::UNIX_EPOCH;
use crate::cmd::sys::extension_manager;
use crate::cmd::sys::constants::SUPPORTED_PLATFORMS;

#[derive(Debug, Serialize, Deserialize)]
pub struct ExtensionMetadata {
    pub id: String,
    pub name: String,
    pub platform: String,
    pub author: Option<String>,
    pub version: Option<String>,
    pub dependencies: Option<ExtensionDependencies>,
    pub toolbox: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExtensionDependencies {
    pub pip: Option<Vec<String>>,
    pub arduino: Option<Vec<String>>,
}

#[derive(Debug, Serialize)]
pub struct ExtensionData {
    pub metadata: ExtensionMetadata,
    pub blocks: Option<serde_json::Value>,
    pub generator: Option<String>,
    pub python_lib_path: Option<String>,
    pub arduino_lib_path: Option<String>,
    pub updated_at: Option<u64>,
}

pub fn get_extensions_dir(app_handle: &tauri::AppHandle) -> PathBuf {
    // 1. Try project root (working dir)
    let paths = vec![
        PathBuf::from("extensions"),
        PathBuf::from("../extensions"),
        PathBuf::from("src-tauri/extensions"),
    ];

    for p in paths {
        if p.exists() && p.is_dir() {
            return p;
        }
    }

    // 2. Try app data dir (production)
    let mut path = app_handle.path().app_data_dir().unwrap_or_else(|_| PathBuf::from("data"));
    path.push("extensions");
    if !path.exists() {
        let _ = fs::create_dir_all(&path);
    }
    path
}

pub fn get_platform_extensions_dir(app_handle: &tauri::AppHandle, platform: &str) -> PathBuf {
    let mut path = get_extensions_dir(app_handle);
    path.push(platform);
    if !path.exists() {
        let _ = fs::create_dir_all(&path);
    }
    path
}

#[tauri::command]
pub async fn list_extensions(app_handle: tauri::AppHandle) -> Result<Vec<ExtensionData>, String> {
    let extensions_dir = get_extensions_dir(&app_handle);
    if !extensions_dir.exists() {
        return Ok(vec![]);
    }

    // -- Migration Logic --
    // Move extensions from root dir to platform subdirs
    if let Ok(entries) = fs::read_dir(&extensions_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let name = path.file_name().and_then(|s| s.to_str()).unwrap_or_default();
                if !SUPPORTED_PLATFORMS.contains(&name) {
                    let manifest_path = path.join("manifest.json");
                    if manifest_path.exists() {
                        if let Ok(manifest_str) = fs::read_to_string(&manifest_path) {
                            if let Ok(metadata) = serde_json::from_str::<ExtensionMetadata>(&manifest_str) {
                                let target_dir = get_platform_extensions_dir(&app_handle, &metadata.platform).join(&metadata.id);
                                if !target_dir.exists() {
                                    println!("Migrating extension {} to {}/{}", metadata.id, metadata.platform, metadata.id);
                                    let _ = fs::rename(&path, &target_dir);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    let mut extensions = Vec::new();
    // ... (rest of the scanning logic stays same but we wrap in async)
    
    for platform in SUPPORTED_PLATFORMS {
        let platform_dir = extensions_dir.join(platform);
        if !platform_dir.exists() {
            continue;
        }

        let entries = fs::read_dir(platform_dir).map_err(|e| e.to_string())?;
        for entry in entries {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();
            if path.is_dir() {
                let manifest_path = path.join("manifest.json");
                if manifest_path.exists() {
                    let manifest_str = fs::read_to_string(&manifest_path).map_err(|e| e.to_string())?;
                    let metadata: ExtensionMetadata = serde_json::from_str(&manifest_str).map_err(|e| e.to_string())?;

                    let blocks_path = path.join("blocks.json");
                    let blocks = if blocks_path.exists() {
                        let blocks_str = fs::read_to_string(blocks_path).map_err(|e| e.to_string())?;
                        Some(serde_json::from_str(&blocks_str).map_err(|e| e.to_string())?)
                    } else {
                        None
                    };

                    let generator_path = path.join("generator.js");
                    let generator = if generator_path.exists() {
                        Some(fs::read_to_string(generator_path).map_err(|e| e.to_string())?)
                    } else {
                        None
                    };

                    let mut python_lib_path = None;
                    let python_dir = path.join("python");
                    if python_dir.exists() {
                        python_lib_path = Some(python_dir.to_string_lossy().to_string());
                    }

                    let mut arduino_lib_path = None;
                    let arduino_dir = path.join("arduino");
                    if arduino_dir.exists() {
                        arduino_lib_path = Some(arduino_dir.to_string_lossy().to_string());
                    }

                    let updated_at = fs::metadata(&path)
                        .ok()
                        .and_then(|m| m.modified().ok())
                        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                        .map(|d| d.as_millis() as u64);

                    extensions.push(ExtensionData {
                        metadata,
                        blocks,
                        generator,
                        python_lib_path,
                        arduino_lib_path,
                        updated_at,
                    });
                }
            }
        }
    }

    Ok(extensions)
}

#[tauri::command]
pub async fn import_extension(app_handle: tauri::AppHandle, zip_path: String) -> Result<String, String> {
    use std::io::{Read, Write};
    
    // 1. Read manifest from ZIP first to determine platform
    let file = fs::File::open(&zip_path).map_err(|e| format!("无法打开文件: {}", e))?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| format!("无效的ZIP文件: {}", e))?;
    
    let mut manifest_content = String::new();
    let mut manifest_found = false;
    
    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
        if file.name() == "manifest.json" || file.name().ends_with("/manifest.json") {
            file.read_to_string(&mut manifest_content).map_err(|e| e.to_string())?;
            manifest_found = true;
            break;
        }
    }
    
    if !manifest_found {
        return Err("扩展包中缺少 manifest.json 文件".to_string());
    }
    
    let metadata: ExtensionMetadata = serde_json::from_str(&manifest_content)
        .map_err(|e| format!("manifest.json 格式错误: {}", e))?;
    
    let platform = metadata.platform.clone();
    let extension_id = metadata.id.clone();
    
    // 2. Determine target directory: extensions/<platform>/<id>
    let target_dir = target_dir_for_platform_and_id(&app_handle, &platform, &extension_id);
    
    // Create target directory
    if target_dir.exists() {
        fs::remove_dir_all(&target_dir).map_err(|e| format!("无法删除旧扩展: {}", e))?;
    }
    fs::create_dir_all(&target_dir).map_err(|e| format!("无法创建目录: {}", e))?;
    
    // Determine the root folder in ZIP to strip
    let mut zip_root = String::new();
    for i in 0..archive.len() {
        let file = archive.by_index(i).map_err(|e| e.to_string())?;
        if file.name().ends_with("/manifest.json") {
            zip_root = file.name().replace("manifest.json", "");
            break;
        }
    }

    // 3. Extract files
    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
        let file_path = file.name().to_string();
        
        if file_path.ends_with('/') {
            continue;
        }
        
        // Strip zip root
        let relative_path = if !zip_root.is_empty() && file_path.starts_with(&zip_root) {
            &file_path[zip_root.len()..]
        } else {
            &file_path
        };
        
        let out_path = target_dir.join(relative_path);
        
        if let Some(parent) = out_path.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("无法创建目录: {}", e))?;
        }
        
        let mut outfile = fs::File::create(&out_path).map_err(|e| format!("无法创建文件: {}", e))?;
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer).map_err(|e| format!("无法读取文件: {}", e))?;
        outfile.write_all(&buffer).map_err(|e| format!("无法写入文件: {}", e))?;
    }
    
    // Trigger platform-specific on_load (includes dependency installation)
    extension_manager::trigger_on_load(&app_handle, &platform, &extension_id, &target_dir)
        .map_err(|e| format!("扩展加载/依赖安装失败: {}", e))?;
    
    Ok(format!("扩展 \"{}\" 导入成功！(平台: {}, 包含依赖安装)", metadata.name, platform))
}

pub fn target_dir_for_platform_and_id(app_handle: &tauri::AppHandle, platform: &str, id: &str) -> PathBuf {
    get_platform_extensions_dir(app_handle, platform).join(id)
}

#[tauri::command]
pub async fn install_extension_dependencies(app_handle: tauri::AppHandle, platform: String) -> Result<String, String> {
    let extensions = list_extensions(app_handle.clone()).await?;
    let filtered: Vec<_> = extensions.into_iter()
        .filter(|ext| ext.metadata.platform == platform)
        .collect();
    
    let count = filtered.len();
    for ext in filtered {
        let target_dir = target_dir_for_platform_and_id(&app_handle, &platform, &ext.metadata.id);
        extension_manager::trigger_on_load(&app_handle, &ext.metadata.platform, &ext.metadata.id, &target_dir)?;
    }
    
    Ok(format!("已成功为 {} 个 {} 扩展安装依赖", count, platform))
}

#[tauri::command]
pub async fn delete_extension(app_handle: tauri::AppHandle, extension_id: String) -> Result<String, String> {
    // We need to find which platform this extension belongs to
    let extensions = list_extensions(app_handle.clone()).await?;
    let target_ext = extensions.into_iter().find(|e| e.metadata.id == extension_id);
    
    if let Some(ext) = target_ext {
        let platform = ext.metadata.platform;
        let extension_path = target_dir_for_platform_and_id(&app_handle, &platform, &extension_id);
        
        let _ = extension_manager::trigger_on_uninstall(&app_handle, &platform, &extension_id);
        
        if extension_path.exists() {
            fs::remove_dir_all(&extension_path).map_err(|e| format!("删除扩展失败: {}", e))?;
        }
        
        Ok(format!("扩展 \"{}\" 已删除", ext.metadata.name))
    } else {
        Err(format!("扩展 \"{}\" 不存在", extension_id))
    }
}
