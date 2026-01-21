// arduino.rs - Handle Arduino compilation and uploading via arduino-cli

use tauri::{Window, Emitter};
use std::process::{Command, Stdio};
use std::io::{BufRead, BufReader, Write};
use std::fs::File;
use std::thread;
use crate::cmd::serial::OPEN_PORT;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct DetectedBoard {
    pub port: String,
    pub label: String,
    pub board_name: Option<String>,
    pub fqbn: Option<String>,
}

#[derive(Debug, Deserialize)]
struct CliBoard {
    matching_boards: Option<Vec<CliMatchingBoard>>,
    port: CliPort,
}

#[derive(Debug, Deserialize)]
struct CliMatchingBoard {
    name: String,
    fqbn: String,
}

#[derive(Debug, Deserialize)]
struct CliPort {
    address: String,
    label: String,
}

#[derive(Debug, Deserialize)]
struct CliBoardList {
    detected_ports: Option<Vec<CliBoard>>,
}

#[tauri::command]
pub async fn compile_arduino(window: Window, code: String, fqbn: String, libs: Vec<String>) -> Result<(), String> {
    let sketch_dir = prepare_sketch(&code)?;
    
    window.emit("arduino-output", format!("Compiling for {}...", fqbn)).unwrap_or(());
    
    let mut compile_cmd = Command::new("arduino-cli");
    compile_cmd.arg("compile")
        .arg("--fqbn")
        .arg(&fqbn);
    
    for lib in libs {
        compile_cmd.arg("--libraries").arg(lib);
    }

    let compile_output = compile_cmd.arg(sketch_dir.to_str().ok_or("Invalid path")?)
        .output()
        .map_err(|e| format!("Failed to execute arduino-cli: {}. Is it installed?", e))?;

    if !compile_output.status.success() {
        let stderr = String::from_utf8_lossy(&compile_output.stderr);
        window.emit("arduino-stderr", stderr.to_string()).unwrap_or(());
        return Err("Compilation failed".to_string());
    }
    
    window.emit("arduino-output", "Compilation success!").unwrap_or(());
    window.emit("arduino-finished", "Done.").unwrap_or(());
    Ok(())
}

fn prepare_sketch(code: &str) -> Result<std::path::PathBuf, String> {
    let mut temp_dir = std::env::temp_dir();
    temp_dir.push("hanx_sketch");
    if !temp_dir.exists() {
        std::fs::create_dir(&temp_dir).map_err(|e| e.to_string())?;
    }
    let sketch_dir = temp_dir.clone();
    temp_dir.push("hanx_sketch.ino");

    let mut file = File::create(&temp_dir).map_err(|e| e.to_string())?;
    file.write_all(code.as_bytes()).map_err(|e| e.to_string())?;
    
    Ok(sketch_dir)
}

#[tauri::command]
pub async fn upload_arduino(window: Window, code: String, port: String, fqbn: String, libs: Vec<String>) -> Result<(), String> {
    // 0. Close serial if open (avoids conflict with upload)
    {
        let mut open_port = OPEN_PORT.lock().unwrap();
        *open_port = None;
    }
    window.emit("serial-data", "\n[System] Auto-closed serial for upload.\n").unwrap_or(());

    // 1. Prepare and Compile
    let sketch_dir = prepare_sketch(&code)?;
    let sketch_file = sketch_dir.join("hanx_sketch.ino");

    window.emit("arduino-output", format!("Compiling for {}...", fqbn)).unwrap_or(());
    
    let mut compile_cmd = Command::new("arduino-cli");
    compile_cmd.arg("compile")
        .arg("--fqbn")
        .arg(&fqbn);
    
    for lib in libs {
        compile_cmd.arg("--libraries").arg(lib);
    }

    let compile_output = compile_cmd.arg(sketch_dir.to_str().ok_or("Invalid path")?)
        .output()
        .map_err(|e| format!("Failed to execute arduino-cli: {}. Is it installed?", e))?;

    if !compile_output.status.success() {
        let stderr = String::from_utf8_lossy(&compile_output.stderr);
        window.emit("arduino-stderr", stderr.to_string()).unwrap_or(());
        return Err("Compilation failed".to_string());
    }
    
    window.emit("arduino-output", "Compilation success! Uploading...").unwrap_or(());

    // 2. Upload
    let mut child = Command::new("arduino-cli")
        .arg("upload")
        .arg("-p")
        .arg(&port)
        .arg("--fqbn")
        .arg(&fqbn)
        .arg(sketch_file.to_str().ok_or("Invalid path")?)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start upload: {}. Is it installed?", e))?;

    let stdout = child.stdout.take().ok_or("Failed to open stdout")?;
    let stderr = child.stderr.take().ok_or("Failed to open stderr")?;

    let window_clone_out = window.clone();
    let window_clone_err = window.clone();
    let window_clone_exit = window.clone();

    // Stream stdout
    thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines() {
            if let Ok(l) = line {
                window_clone_out.emit("arduino-output", l).unwrap_or(());
            }
        }
    });

    // Stream stderr
    thread::spawn(move || {
        let reader = BufReader::new(stderr);
        for line in reader.lines() {
            if let Ok(l) = line {
                window_clone_err.emit("arduino-stderr", l).unwrap_or(());
            }
        }
    });

    // Wait for exit
    thread::spawn(move || {
        let status = child.wait();
        let msg = match status {
            Ok(s) => if s.success() { "Upload successful!".to_string() } else { format!("Upload failed with {}", s) },
            Err(e) => format!("Process error: {}", e),
        };
        window_clone_exit.emit("arduino-finished", msg).unwrap_or(());
    });

    Ok(())
}

#[tauri::command]
pub async fn discover_arduino_boards() -> Result<Vec<DetectedBoard>, String> {
    let output = Command::new("arduino-cli")
        .args(&["board", "list", "--format", "json"])
        .output()
        .map_err(|e| format!("Failed to execute arduino-cli: {}", e))?;

    if !output.status.success() {
        return Err("Failed to list boards via arduino-cli".to_string());
    }

    let board_list: CliBoardList = serde_json::from_slice(&output.stdout)
        .map_err(|e| format!("Failed to parse arduino-cli output: {}", e))?;

    let mut detected = Vec::new();
    if let Some(ports) = board_list.detected_ports {
        for p in ports {
            let mut board_name = None;
            let mut fqbn = None;

            if let Some(matches) = p.matching_boards {
                if !matches.is_empty() {
                    board_name = Some(matches[0].name.clone());
                    fqbn = Some(matches[0].fqbn.clone());
                }
            }

            detected.push(DetectedBoard {
                port: p.port.address,
                label: p.port.label,
                board_name,
                fqbn,
            });
        }
    }

    Ok(detected)
}
