// serial.rs - Tauri command to handle Serial communication

use tauri::{Window, Emitter};
use std::thread;
use serialport; // Added this use statement as it's used in list_ports

use std::sync::Mutex;
use lazy_static::lazy_static;

lazy_static! {
    pub static ref OPEN_PORT: Mutex<Option<Box<dyn serialport::SerialPort>>> = Mutex::new(None);
}

#[derive(serde::Serialize)]
pub struct SerialPortInfo {
    port_name: String,
}

#[tauri::command]
pub fn list_ports() -> Result<Vec<SerialPortInfo>, String> {
    let ports = serialport::available_ports().map_err(|e| e.to_string())?;
    let mut port_list = Vec::new();
    for p in ports {
        port_list.push(SerialPortInfo {
            port_name: p.port_name,
        });
    }
    Ok(port_list)
}

#[tauri::command]
pub async fn open_serial(window: Window, port: String, baud_rate: u32) -> Result<(), String> {
    let p = serialport::new(&port, baud_rate)
        .timeout(std::time::Duration::from_millis(10))
        .open()
        .map_err(|e| e.to_string())?;

    let mut open_port = OPEN_PORT.lock().map_err(|e| e.to_string())?;
    *open_port = Some(p.try_clone().map_err(|e| e.to_string())?);

    // Spawn reader thread
    thread::spawn(move || {
        let mut reader = p;
        let mut serial_buf: Vec<u8> = vec![0; 1000];
        loop {
            // Check if this is still the active port
            {
                let lock = OPEN_PORT.lock().unwrap();
                if lock.is_none() { break; }
            }

            match reader.read(serial_buf.as_mut_slice()) {
                Ok(t) => {
                    let data = String::from_utf8_lossy(&serial_buf[..t]);
                    window.emit("serial-data", data.to_string()).unwrap_or(());
                }
                Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => (),
                Err(e) => {
                    eprintln!("Serial read error: {:?}", e);
                    break;
                }
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub fn close_serial() -> Result<(), String> {
    let mut open_port = OPEN_PORT.lock().map_err(|e| e.to_string())?;
    *open_port = None;
    Ok(())
}

#[tauri::command]
pub fn write_serial(data: String) -> Result<(), String> {
    let mut open_port = OPEN_PORT.lock().map_err(|e| e.to_string())?;
    if let Some(ref mut p) = *open_port {
        p.write_all(data.as_bytes()).map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Port not open".to_string())
    }
}


