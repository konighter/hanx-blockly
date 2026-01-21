use tauri::{Window, Emitter, Manager};
use std::process::{Command, Stdio};
use std::io::{BufRead, BufReader, Write};
use std::thread;
use std::fs::File;

#[tauri::command]
pub async fn run_python_code(window: Window, code: String, libs: Vec<String>) -> Result<(), String> {
    // 1. Write code to temp file
    let mut temp_dir = std::env::temp_dir();
    temp_dir.push("hanx_script.py");
    let file_path = temp_dir.to_str().ok_or("Invalid path")?.to_string();

    let mut file = File::create(&file_path).map_err(|e| e.to_string())?;
    file.write_all(code.as_bytes()).map_err(|e| e.to_string())?;

    // 2. Determine python binary (use isolated environment)
    let app_handle = window.app_handle();
    // Ensure environment is ready
    crate::cmd::sys::env_manager::python::ensure_env(app_handle).map_err(|e| e.to_string())?;
    // Get binary path
    let python_bin = crate::cmd::sys::env_manager::python::get_python_bin(app_handle);

    // 3. Prepare environment (PYTHONPATH)
    let mut python_path = std::env::var("PYTHONPATH").unwrap_or_default();
    for lib in libs {
        if !python_path.is_empty() {
            #[cfg(windows)]
            python_path.push(';');
            #[cfg(not(windows))]
            python_path.push(':');
        }
        python_path.push_str(&lib);
    }

    // 4. Spawn process
    let mut child = Command::new(python_bin)
        .arg("-u") // Unbuffered output
        .arg(&file_path)
        .env("PYTHONPATH", python_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start python: {}", e))?;

    let stdout = child.stdout.take().ok_or("Failed to open stdout")?;
    let stderr = child.stderr.take().ok_or("Failed to open stderr")?;
    
    // Register process for stop functionality
    let pid = child.id();
    crate::cmd::sys::execution::register_process("python", pid);

    let window_clone_out = window.clone();
    let window_clone_err = window.clone();
    let window_clone_exit = window.clone();

    // Stream stdout
    thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines() {
            if let Ok(l) = line {
                window_clone_out.emit("python-output", l).unwrap_or(());
            }
        }
    });

    // Stream stderr
    thread::spawn(move || {
        let reader = BufReader::new(stderr);
        for line in reader.lines() {
            if let Ok(l) = line {
                window_clone_err.emit("python-stderr", l).unwrap_or(());
            }
        }
    });

    // Wait for exit
    thread::spawn(move || {
        let status = child.wait();
        // Unregister process after it exits
        crate::cmd::sys::execution::unregister_process("python");
        let msg = match status {
            Ok(s) => format!("Process exited with {}", s),
            Err(e) => format!("Process error: {}", e),
        };
        window_clone_exit.emit("python-finished", msg).unwrap_or(());
    });

    Ok(())
}

