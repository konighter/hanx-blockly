// execution.rs - Manages execution state and stop functionality
use std::sync::Mutex;
use std::collections::HashMap;

// Global state to track running processes
lazy_static::lazy_static! {
    static ref RUNNING_PROCESSES: Mutex<HashMap<String, u32>> = Mutex::new(HashMap::new());
}

pub fn register_process(name: &str, pid: u32) {
    if let Ok(mut processes) = RUNNING_PROCESSES.lock() {
        processes.insert(name.to_string(), pid);
    }
}

pub fn unregister_process(name: &str) {
    if let Ok(mut processes) = RUNNING_PROCESSES.lock() {
        processes.remove(name);
    }
}

#[tauri::command]
pub fn stop_execution() -> Result<(), String> {
    let pids: Vec<u32>;
    {
        let processes = RUNNING_PROCESSES.lock().map_err(|e| e.to_string())?;
        pids = processes.values().cloned().collect();
    }
    
    for pid in pids {
        #[cfg(unix)]
        {
            use std::process::Command;
            let _ = Command::new("kill")
                .arg("-9")
                .arg(pid.to_string())
                .spawn();
        }
        #[cfg(windows)]
        {
            use std::process::Command;
            let _ = Command::new("taskkill")
                .args(["/PID", &pid.to_string(), "/F"])
                .spawn();
        }
    }
    
    // Clear all registered processes
    if let Ok(mut processes) = RUNNING_PROCESSES.lock() {
        processes.clear();
    }
    
    Ok(())
}
