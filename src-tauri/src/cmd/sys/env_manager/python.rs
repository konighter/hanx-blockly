use tauri::{Runtime, AppHandle, Manager};
use std::process::{Command, Stdio};
use std::path::PathBuf;
use super::EnvironmentImplementation;

pub struct PythonEnvironment;

impl<R: Runtime> EnvironmentImplementation<R> for PythonEnvironment {
    fn platform_name(&self) -> &str {
        "python"
    }

    fn ensure_environment(&self, app_handle: &AppHandle<R>) -> Result<(), String> {
        let env_dir = get_env_dir(app_handle);
        if env_dir.exists() {
            return Ok(());
        }

        // Determine system python
        let system_python = if Command::new("python3").arg("--version").output().is_ok() {
            "python3"
        } else {
            "python"
        };

        // Create venv
        let status = Command::new(system_python)
            .args(&["-m", "venv"])
            .arg(&env_dir)
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .map_err(|e| format!("Failed to create python venv: {}", e))?;

        if !status.success() {
            return Err("Failed to create python virtual environment".to_string());
        }

        Ok(())
    }

    fn get_binary_path(&self, app_handle: &AppHandle<R>) -> PathBuf {
        let env_dir = get_env_dir(app_handle);
        if cfg!(windows) {
            env_dir.join("Scripts").join("python.exe")
        } else {
            env_dir.join("bin").join("python3")
        }
    }

    fn install_dependencies(&self, app_handle: &AppHandle<R>, deps: &[String]) -> Result<(), String> {
        if deps.is_empty() {
            return Ok(());
        }

        self.ensure_environment(app_handle)?;
        let python_bin = self.get_binary_path(app_handle);

        let mut args = vec![
            "-m".to_string(), 
            "pip".to_string(), 
            "install".to_string(),
            "--trusted-host".to_string(), "pypi.org".to_string(),
            "--trusted-host".to_string(), "files.pythonhosted.org".to_string(),
            "--trusted-host".to_string(), "pypi.python.org".to_string(),
            "-i https://pypi.tuna.tsinghua.edu.cn/simple".to_string()
        ];
        args.extend(deps.iter().cloned());

        let output = Command::new(python_bin)
            .args(&args)
            .output()
            .map_err(|e| format!("Pip install failed: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Pip install failed: {}", stderr));
        }

        Ok(())
    }
}

// Private helper
fn get_env_dir<R: Runtime>(app_handle: &AppHandle<R>) -> PathBuf {
    #[cfg(target_os = "windows")]
    {
        // On Windows, try to use "workspace" folder next to the executable for portability
        if let Ok(mut exe_path) = std::env::current_exe() {
            exe_path.pop(); // Get directory
            let workspace = exe_path.join("workspace");
            return workspace.join("envs").join("python");
        }
    }

    // On macOS/Linux, stick to standard AppData to avoid permission issues
    // Path: ~/Library/Application Support/<app-id>/workspace/envs/python
    let mut path = app_handle.path().app_data_dir().unwrap_or(PathBuf::from("."));
    path.push("workspace");
    path.push("envs");
    path.push("python");
    path
}

// Keep public static functions for direct access if needed, or rely on trait
pub fn ensure_env<R: Runtime>(app_handle: &AppHandle<R>) -> Result<(), String> {
    PythonEnvironment.ensure_environment(app_handle)
}

pub fn get_python_bin<R: Runtime>(app_handle: &AppHandle<R>) -> PathBuf {
    PythonEnvironment.get_binary_path(app_handle)
}
