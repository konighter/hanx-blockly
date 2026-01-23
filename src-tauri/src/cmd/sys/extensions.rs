use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tauri::Manager;
use std::time::UNIX_EPOCH;
use crate::cmd::sys::env_manager::EnvironmentImplementation;
use crate::cmd::sys::extension_manager;

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

#[tauri::command]
pub fn list_extensions(app_handle: tauri::AppHandle) -> Result<Vec<ExtensionData>, String> {
    let extensions_dir = get_extensions_dir(&app_handle);
    if !extensions_dir.exists() {
        return Ok(vec![]);
    }

    let mut extensions = Vec::new();
    let entries = fs::read_dir(extensions_dir).map_err(|e| e.to_string())?;

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

    Ok(extensions)
}

#[tauri::command]
pub fn import_extension(app_handle: tauri::AppHandle, zip_path: String) -> Result<String, String> {
    use std::io::{Read, Write};
    
    let extensions_dir = get_extensions_dir(&app_handle);
    
    // Open the ZIP file
    let file = fs::File::open(&zip_path).map_err(|e| format!("无法打开文件: {}", e))?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| format!("无效的ZIP文件: {}", e))?;
    
    // Check if manifest.json exists in the archive
    let has_manifest = (0..archive.len()).any(|i| {
        if let Ok(file) = archive.by_index(i) {
            let name = file.name();
            name == "manifest.json" || name.ends_with("/manifest.json")
        } else {
            false
        }
    });
    
    if !has_manifest {
        return Err("扩展包中缺少 manifest.json 文件".to_string());
    }
    
    // Find the root directory name or use zip file name
    let zip_file_name = std::path::Path::new(&zip_path)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("imported_extension")
        .to_string();
    
    // Determine the extension directory name
    let first_file = archive.by_index(0).map_err(|e| e.to_string())?;
    let first_name = first_file.name().to_string();
    drop(first_file);
    
    let extension_name = if first_name.contains('/') {
        first_name.split('/').next().unwrap_or(&zip_file_name).to_string()
    } else {
        zip_file_name.clone()
    };
    
    let target_dir = target_dir_for_id(&app_handle, &extension_name);
    
    // Create target directory
    if target_dir.exists() {
        fs::remove_dir_all(&target_dir).map_err(|e| format!("无法删除旧扩展: {}", e))?;
    }
    fs::create_dir_all(&target_dir).map_err(|e| format!("无法创建目录: {}", e))?;
    
    // Extract files
    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
        let file_path = file.name().to_string();
        
        // Skip directories
        if file_path.ends_with('/') {
            continue;
        }
        
        // Calculate the relative path (strip the root folder if present)
        let relative_path = if file_path.contains('/') {
            let parts: Vec<&str> = file_path.splitn(2, '/').collect();
            if parts.len() > 1 { parts[1] } else { &file_path }
        } else {
            &file_path
        };
        
        let out_path = target_dir.join(relative_path);
        
        // Create parent directories
        if let Some(parent) = out_path.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("无法创建目录: {}", e))?;
        }
        
        // Write file
        let mut outfile = fs::File::create(&out_path).map_err(|e| format!("无法创建文件: {}", e))?;
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer).map_err(|e| format!("无法读取文件: {}", e))?;
        outfile.write_all(&buffer).map_err(|e| format!("无法写入文件: {}", e))?;
    }
    
    // Verify manifest.json exists in target
    let manifest_path = target_dir.join("manifest.json");
    if !manifest_path.exists() {
        fs::remove_dir_all(&target_dir).ok();
        return Err("扩展安装失败：manifest.json 未正确解压".to_string());
    }
    
    // Parse manifest to get extension details
    let manifest_str = fs::read_to_string(&manifest_path).map_err(|e| e.to_string())?;
    let metadata: ExtensionMetadata = serde_json::from_str(&manifest_str)
        .map_err(|e| format!("manifest.json 格式错误: {}", e))?;
    
    // Trigger platform-specific on_load (includes dependency installation)
    extension_manager::trigger_on_load(&app_handle, &metadata.platform, &metadata.id, &target_dir)
        .map_err(|e| format!("扩展加载/依赖安装失败: {}", e))?;
    
    Ok(format!("扩展 \"{}\" 导入成功！(包含依赖安装)", metadata.name))
}

pub fn target_dir_for_id(app_handle: &tauri::AppHandle, id: &str) -> PathBuf {
    get_extensions_dir(app_handle).join(id)
}

#[tauri::command]
pub async fn install_extension_dependencies(app_handle: tauri::AppHandle, platform: String) -> Result<String, String> {
    let extensions = list_extensions(app_handle.clone())?;
    let filtered: Vec<_> = extensions.into_iter()
        .filter(|ext| ext.metadata.platform == platform)
        .collect();
    
    let count = filtered.len();
    for ext in filtered {
        let target_dir = target_dir_for_id(&app_handle, &ext.metadata.id);
        extension_manager::trigger_on_load(&app_handle, &ext.metadata.platform, &ext.metadata.id, &target_dir)?;
    }
    
    Ok(format!("已成功为 {} 个 {} 扩展安装依赖", count, platform))
}

#[tauri::command]
pub fn delete_extension(app_handle: tauri::AppHandle, extension_id: String) -> Result<String, String> {
    let extensions_dir = get_extensions_dir(&app_handle);
    let extension_path = extensions_dir.join(&extension_id);
    
    if !extension_path.exists() {
        return Err(format!("扩展 \"{}\" 不存在", extension_id));
    }
    
    // Read manifest to get platform for lifecycle hook
    let manifest_path = extension_path.join("manifest.json");
    let (name, platform) = if manifest_path.exists() {
        let manifest_str = fs::read_to_string(&manifest_path).unwrap_or_default();
        serde_json::from_str::<ExtensionMetadata>(&manifest_str)
            .map(|m| (m.name, Some(m.platform)))
            .unwrap_or_else(|_| (extension_id.clone(), None))
    } else {
        (extension_id.clone(), None)
    };
    
    // Trigger platform-specific on_uninstall
    if let Some(p) = platform {
        let _ = extension_manager::trigger_on_uninstall(&app_handle, &p, &extension_id);
    }

    // Delete the extension directory
    fs::remove_dir_all(&extension_path)
        .map_err(|e| format!("删除扩展失败: {}", e))?;
    
    Ok(format!("扩展 \"{}\" 已删除", name))
}
