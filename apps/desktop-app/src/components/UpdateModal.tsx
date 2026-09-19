import { useState } from 'react';
import { APP_VERSION } from '../version';

export interface AppVersionRecord {
  id: string;
  platform: string;
  latest_version: string;
  min_supported_version: string;
  download_url: string;
  release_notes: string | null;
  is_mandatory: boolean;
  is_active: boolean;
}

interface UpdateModalProps {
  updateInfo: AppVersionRecord;
  isMandatory: boolean;
  onDismiss?: () => void;
}

export default function UpdateModal({
  updateInfo,
  isMandatory,
  onDismiss,
}: UpdateModalProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // 1. Invoke custom Rust command to open browser and unpin/minimize kiosk window
      try {
        const { invoke } = await import('@tauri-apps/api/tauri');
        await invoke('open_browser_url', { url: updateInfo.download_url });
        return;
      } catch (invokeErr) {
        console.warn('[UpdateModal] open_browser_url invoke fallback:', invokeErr);
      }

      // 2. Fallback to standard Tauri shell open API
      try {
        const { open } = await import('@tauri-apps/api/shell');
        await open(updateInfo.download_url);
        return;
      } catch (shellErr) {
        console.warn('[UpdateModal] Tauri shell.open fallback:', shellErr);
      }

      // 3. Browser fallback (dev mode)
      window.open(updateInfo.download_url, '_blank');
    } catch (e) {
      console.error('[UpdateModal] Failed to open download link:', e);
    } finally {
      setTimeout(() => setDownloading(false), 2500);
    }
  };

  const handleCloseApp = async () => {
    try {
      const { appWindow } = await import('@tauri-apps/api/window');
      await appWindow.close();
    } catch (e) {
      console.error('[UpdateModal] Failed to close window:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-white border-2 border-[#008080] shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#008080] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white animate-bounce"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide uppercase">
                {isMandatory ? 'Required Update' : 'New Update Available'}
              </h2>
              <p className="text-xs text-teal-100">ParikshaOS Desktop Application</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 px-2.5 py-1 rounded">
              v{APP_VERSION} &rarr; v{updateInfo.latest_version}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Status Alert */}
          {isMandatory ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-none flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <h3 className="text-xs font-bold text-red-900 uppercase">
                  Mandatory Update Required
                </h3>
                <p className="text-xs text-red-700 mt-0.5">
                  Your installed version (v{APP_VERSION}) is outdated. You must update to
                  v{updateInfo.latest_version} before you can log in or take examinations.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-teal-50 border-l-4 border-[#008080] p-3 rounded-none flex items-start gap-3">
              <svg
                className="w-5 h-5 text-[#008080] flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-xs font-bold text-teal-900 uppercase">
                  Recommended Update
                </h3>
                <p className="text-xs text-teal-800 mt-0.5">
                  A newer version of ParikshaOS is available. Update now for improved
                  performance, bug fixes, and the latest exam features.
                </p>
              </div>
            </div>
          )}

          {/* Release Notes */}
          {updateInfo.release_notes && (
            <div className="border border-gray-200 bg-gray-50 p-3 max-h-40 overflow-y-auto">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Release Highlights:
              </p>
              <div className="text-xs text-gray-700 whitespace-pre-line leading-relaxed font-sans">
                {updateInfo.release_notes}
              </div>
            </div>
          )}

          {/* Steps Helper */}
          <div className="bg-gray-100/70 p-3 text-[11px] text-gray-600 space-y-1">
            <p className="font-semibold text-gray-800">How to update:</p>
            <p>1. Click <b>"Download & Install Update"</b> below.</p>
            <p>2. Your browser will download the setup installer.</p>
            <p>3. Run the installer to replace this version, then re-open ParikshaOS.</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          {isMandatory ? (
            <button
              onClick={handleCloseApp}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Exit Application
            </button>
          ) : (
            onDismiss && (
              <button
                onClick={onDismiss}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Later
              </button>
            )
          )}

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#008080] hover:bg-[#006666] text-white text-xs font-black uppercase tracking-wider shadow transition-all active:scale-95 disabled:opacity-50"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {downloading ? 'Opening Download...' : 'Download & Install Update'}
          </button>
        </div>
      </div>
    </div>
  );
}
