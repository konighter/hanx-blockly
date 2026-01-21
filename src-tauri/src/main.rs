#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

mod cmd;

use tauri::menu::{Menu, Submenu, MenuItem, PredefinedMenuItem};
use tauri::{Emitter, Manager};

fn main() {
  tauri::Builder::default()
    .setup(|app| {
      // Build File menu
      let open_item = MenuItem::with_id(app, "open", "打开...", true, Some("CmdOrCtrl+O"))?;
      let save_item = MenuItem::with_id(app, "save", "保存", true, Some("CmdOrCtrl+S"))?;
      let save_as_item = MenuItem::with_id(app, "save_as", "另存为...", true, Some("CmdOrCtrl+Shift+S"))?;
      
      let file_menu = Submenu::with_items(
        app,
        "文件",
        true,
        &[
          &open_item,
          &save_item,
          &save_as_item,
          &PredefinedMenuItem::separator(app)?,
          &PredefinedMenuItem::quit(app, Some("退出"))?,
        ],
      )?;

      // Build Edit menu
      let undo_item = MenuItem::with_id(app, "undo", "撤销", true, Some("CmdOrCtrl+Z"))?;
      let redo_item = MenuItem::with_id(app, "redo", "重做", true, Some("CmdOrCtrl+Shift+Z"))?;
      
      let edit_menu = Submenu::with_items(
        app,
        "编辑",
        true,
        &[
          &undo_item,
          &redo_item,
        ],
      )?;

      let menu = Menu::with_items(
        app,
        &[
          &Submenu::with_items(app, "HanX", true, &[
            &PredefinedMenuItem::about(app, Some("关于 HanX"), None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::hide(app, Some("隐藏"))?,
            &PredefinedMenuItem::quit(app, Some("退出"))?,
          ])?,
          &file_menu,
          &edit_menu,
        ],
      )?;

      app.set_menu(menu)?;
      
      Ok(())
    })
    .on_menu_event(|app, event| {
      let window = app.get_webview_window("main").unwrap();
      match event.id().as_ref() {
        "open" => { window.emit("menu-open", ()).unwrap_or(()); }
        "save" => { window.emit("menu-save", ()).unwrap_or(()); }
        "save_as" => { window.emit("menu-save-as", ()).unwrap_or(()); }
        "undo" => { window.emit("menu-undo", ()).unwrap_or(()); }
        "redo" => { window.emit("menu-redo", ()).unwrap_or(()); }
        _ => {}
      }
    })
    .invoke_handler(tauri::generate_handler![
      cmd::serial::list_ports,
      cmd::serial::open_serial,
      cmd::serial::close_serial,
      cmd::serial::write_serial,
      cmd::arduino::upload_arduino,
      cmd::arduino::compile_arduino,
      cmd::arduino::discover_arduino_boards,
      cmd::python::run_python_code,
      cmd::sys::execution::stop_execution,
      cmd::sys::extensions::list_extensions,
      cmd::sys::extensions::import_extension,
      cmd::sys::extensions::delete_extension,
      cmd::sys::env_manager::ensure_environment
    ])
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
