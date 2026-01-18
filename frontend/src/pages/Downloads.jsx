import { useState, useEffect } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export default function Downloads() {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadFiles();
    }, []);

    const loadFiles = async () => {
        if (!Capacitor.isNativePlatform()) {
            setLoading(false);
            return;
        }

        try {
            // Check/Request Permissions first (Android 11+ might be weird, but let's try)
            try {
                const perm = await Filesystem.checkPermissions();
                if (perm.publicStorage !== 'granted') {
                    const req = await Filesystem.requestPermissions();
                    if (req.publicStorage !== 'granted') {
                        setError('Storage permission needed to show downloads.');
                        setLoading(false);
                        return;
                    }
                }
            } catch (err) {
                console.warn('Permission check failed (might be iOS or old Android):', err);
            }

            // Read Documents Directory
            const result = await Filesystem.readdir({
                path: '',
                directory: Directory.Documents
            });

            // Filter JSON result.files array
            // Note: On Android, files might be objects { name, type, ... } or strings depending on version/plugin
            const pdfs = result.files
                .map(f => (typeof f === 'string' ? { name: f } : f)) // Normalize
                .filter(f => f.name && f.name.toLowerCase().endsWith('.pdf'))
                .sort((a, b) => b.mtime - a.mtime); // Sort by modified time if available, or name

            setFiles(pdfs);
        } catch (e) {
            console.error('Failed to load downloads:', e);
            setError('Could not access Documents folder. ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    // Helper to convert Base64 to Blob
    const base64ToBlob = (base64, type) => {
        const binStr = atob(base64);
        const len = binStr.length;
        const arr = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            arr[i] = binStr.charCodeAt(i);
        }
        return new Blob([arr], { type });
    };

    const handleOpenFile = async (file) => {
        try {
            // 1. Read file data
            const data = await Filesystem.readFile({
                path: file.name,
                directory: Directory.Documents
            });

            // 2. Prepare File object for sharing
            const blob = base64ToBlob(data.data, 'application/pdf');
            const pdfFile = new File([blob], file.name, { type: 'application/pdf' });

            // 3. Use Web Share API (Supported in modern Android WebView)
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
                await navigator.share({
                    files: [pdfFile],
                    title: file.name,
                    text: 'Here is my resume'
                });
            } else {
                // Fallback: Create Object URL (opens in browser PDF viewer if allowed)
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
                // Revoke later?
                setTimeout(() => URL.revokeObjectURL(url), 10000);
            }
        } catch (e) {
            console.error('Share failed:', e);
            alert('Could not share/view file. ' + e.message);
        }
    };

    if (!Capacitor.isNativePlatform()) {
        return (
            <div className="p-8 text-center text-gray-500">
                This feature is only available on the mobile app.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Downloads</h1>
                <button
                    onClick={loadFiles}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                >
                    🔄
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : error ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm">
                    {error}
                </div>
            ) : files.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                    <p className="text-gray-500">No PDF files found in Documents.</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {files.map((file, i) => (
                        <div
                            key={i}
                            onClick={() => handleOpenFile(file)}
                            className="flex items-center gap-4 p-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl active:scale-98 transition-transform"
                        >
                            <div className="w-10 h-10 flex-shrink-0 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                    {file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    PDF Document
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
