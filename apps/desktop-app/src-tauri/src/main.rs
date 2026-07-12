// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// ── Windows-specific kiosk enforcement ────────────────────────────────────────
#[cfg(windows)]
mod kiosk {
    use std::sync::atomic::{AtomicBool, AtomicPtr, Ordering};
    use std::ptr;
    use std::thread;
    use std::time::Duration;
    use windows::Win32::Foundation::{LPARAM, LRESULT, WPARAM, HWND, BOOL, CloseHandle};
    use windows::Win32::UI::WindowsAndMessaging::{
        CallNextHookEx, SetWindowsHookExW, GetMessageW, TranslateMessage, DispatchMessageW,
        HHOOK, KBDLLHOOKSTRUCT, WH_KEYBOARD_LL, MSG,
        WM_KEYDOWN, WM_SYSKEYDOWN,
    };
    use windows::Win32::System::Threading::{
        OpenProcess, TerminateProcess, PROCESS_TERMINATE, PROCESS_QUERY_LIMITED_INFORMATION,
    };
    use windows::Win32::System::ProcessStatus::{EnumProcesses, GetModuleBaseNameW};

    /// Set to true once enable_kiosk_mode is called. The hook callback checks this.
    pub static KIOSK_ACTIVE: AtomicBool = AtomicBool::new(false);

    /// Stores the hook handle so CallNextHookEx can reference it.
    pub static HOOK_HANDLE: AtomicPtr<std::ffi::c_void> = AtomicPtr::new(ptr::null_mut());

    /// List of process names (lowercase, with .exe) that are blacklisted during an exam.
    const BLACKLISTED_PROCESSES: &[&str] = &[
        "obs64.exe",
        "obs32.exe",
        "obs.exe",
        "anydesk.exe",
        "teamviewer.exe",
        "teamviewer_service.exe",
        "zoom.exe",
        "zoomit.exe",
        "discord.exe",
        "chrome.exe",
        "msedge.exe",
        "firefox.exe",
        "opera.exe",
        "brave.exe",
        "vivaldi.exe",
        "screenrec.exe",
        "sharex.exe",
        "lightshot.exe",
        "snagit32.exe",
        "snagit64.exe",
        "vncviewer.exe",
        "rustdesk.exe",
        "parsec.exe",
        "ammyy.exe",
    ];

    /// Low-level keyboard hook callback.
    /// Called by Windows for EVERY key event system-wide.
    /// When kiosk is active, blocks ALL keys by returning LRESULT(1).
    unsafe extern "system" fn keyboard_hook_callback(
        n_code: i32,
        w_param: WPARAM,
        l_param: LPARAM,
    ) -> LRESULT {
        if n_code >= 0 && KIOSK_ACTIVE.load(Ordering::SeqCst) {
            let msg = w_param.0 as u32;
            if msg == WM_KEYDOWN || msg == WM_SYSKEYDOWN {
                // Block ALL keys when kiosk is active
                return LRESULT(1);
            }
        }

        let hook = HOOK_HANDLE.load(Ordering::SeqCst);
        CallNextHookEx(HHOOK(hook as isize), n_code, w_param, l_param)
    }

    /// Installs the low-level keyboard hook in a dedicated thread with a message pump.
    pub fn install_keyboard_hook() {
        thread::spawn(|| unsafe {
            let hook = SetWindowsHookExW(
                WH_KEYBOARD_LL,
                Some(keyboard_hook_callback),
                None,
                0,
            ).expect("Failed to install WH_KEYBOARD_LL hook");

            HOOK_HANDLE.store(hook.0 as *mut std::ffi::c_void, Ordering::SeqCst);
            println!("[Kiosk] WH_KEYBOARD_LL hook installed (inactive until kiosk mode enabled).");

            // Message pump — required to keep the low-level hook alive on this thread
            let mut msg = MSG::default();
            loop {
                let result = GetMessageW(&mut msg, HWND(0), 0, 0);
                if result == BOOL(0) || result == BOOL(-1) {
                    break;
                }
                TranslateMessage(&msg);
                DispatchMessageW(&msg);
            }
        });
    }

    /// Anti-cheat monitor: runs in a background thread, checks every 3 seconds
    /// for blacklisted processes and terminates them when kiosk is active.
    pub fn start_anti_cheat_monitor() {
        thread::spawn(|| {
            println!("[Kiosk] Anti-cheat monitor thread started.");
            loop {
                if KIOSK_ACTIVE.load(Ordering::SeqCst) {
                    kill_blacklisted_processes();
                }
                thread::sleep(Duration::from_secs(3));
            }
        });
    }

    fn kill_blacklisted_processes() {
        unsafe {
            let mut pids = vec![0u32; 1024];
            let mut bytes_returned = 0u32;

            if EnumProcesses(
                pids.as_mut_ptr(),
                (pids.len() * std::mem::size_of::<u32>()) as u32,
                &mut bytes_returned,
            ).is_ok() {
                let count = bytes_returned as usize / std::mem::size_of::<u32>();
                for &pid in &pids[..count] {
                    if pid == 0 { continue; }

                    let Ok(handle) = OpenProcess(
                        PROCESS_QUERY_LIMITED_INFORMATION | PROCESS_TERMINATE,
                        false,
                        pid,
                    ) else { continue; };

                    let mut name_buf = [0u16; 260];
                    let len = GetModuleBaseNameW(handle, None, &mut name_buf);
                    if len == 0 {
                        let _ = CloseHandle(handle);
                        continue;
                    }

                    let name = String::from_utf16_lossy(&name_buf[..len as usize])
                        .to_lowercase();

                    if BLACKLISTED_PROCESSES.contains(&name.as_str()) {
                        println!("[Kiosk] Terminating blacklisted process: {} (PID {})", name, pid);
                        let _ = TerminateProcess(handle, 1);
                    }

                    let _ = CloseHandle(handle);
                }
            }
        }
    }
}

// ── Tauri Commands ─────────────────────────────────────────────────────────────

/// Called by the frontend when the student passes the login screen.
/// Activates the keyboard block (all keys are now suppressed at OS level).
#[tauri::command]
fn enable_kiosk_mode() {
    #[cfg(windows)]
    {
        kiosk::KIOSK_ACTIVE.store(true, std::sync::atomic::Ordering::SeqCst);
        println!("[Kiosk] Kiosk mode ENABLED — all keyboard input blocked at OS level.");
    }
    #[cfg(not(windows))]
    println!("[Kiosk] Kiosk mode ENABLED (non-Windows stub).");
}

/// Disables kiosk mode (for debugging / emergency admin use).
#[tauri::command]
fn disable_kiosk_mode() {
    #[cfg(windows)]
    {
        kiosk::KIOSK_ACTIVE.store(false, std::sync::atomic::Ordering::SeqCst);
        println!("[Kiosk] Kiosk mode DISABLED.");
    }
}

fn main() {
    // Install the hook at startup; it sits idle until enable_kiosk_mode() is called.
    #[cfg(windows)]
    {
        kiosk::install_keyboard_hook();
        kiosk::start_anti_cheat_monitor();
    }

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![enable_kiosk_mode, disable_kiosk_mode])
        .setup(|_app| {
            println!("[App] ParikshaOS started.");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
