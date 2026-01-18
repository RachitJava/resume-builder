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
            // Check/Request Permissions
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
                console.warn('Permission check failed:', err);
            }

            // Read Documents Directory
            const result = await Filesystem.readdir({
                path: '',
                directory: Directory.Documents
            });

            // Filter PDF files
            const pdfs = result.files
                .map(f => (typeof f === 'string' ? { name: f } : f))
                .filter(f => f.name && f.name.toLowerCase().endsWith('.pdf'))
                .sort((a, b) => (b.mtime || 0) - (a.mtime || 0));

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
            // Get the file URI
            const fileUri = await Filesystem.getUri({
                path: file.name,
                directory: Directory.Documents
            });

            // For mobile, use the native file URI
            if (Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios') {
                // Create a temporary link and click it
                const link = document.createElement('a');
                link.href = fileUri.uri;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';

                // For Android, we need to use the content:// URI
                if (Capacitor.getPlatform() === 'android') {
                    // Read file and create blob URL as fallback
                    const data = await Filesystem.readFile({
                        path: file.name,
                        directory: Directory.Documents
                    });

                    const blob = base64ToBlob(data.data, 'application/pdf');
                    const blobUrl = URL.createObjectURL(blob);

                    // Try to open in new window
                    const newWindow = window.open(blobUrl, '_blank');
                    if (!newWindow) {
                        // Fallback: download the file
                        link.href = blobUrl;
                        link.download = file.name;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);

                        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
                    }
                } else {
                    // iOS can use the file URI directly
                    window.open(fileUri.uri, '_blank');
                }
            } else {
                // Web fallback
                const data = await Filesystem.readFile({
                    path: file.name,
                    directory: Directory.Documents
                });
                const blob = base64ToBlob(data.data, 'application/pdf');
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
                setTimeout(() => URL.revokeObjectURL(url), 30000);
            }
        } catch (e) {
            console.error('Open failed:', e);
            alert('Could not open file. ' + e.message);
        }
    };

    const handleShareFile = async (file) => {
        try {
            // Read file data
            const data = await Filesystem.readFile({
                path: file.name,
                directory: Directory.Documents
            });

            // Prepare File object for sharing
            const blob = base64ToBlob(data.data, 'application/pdf');
            const pdfFile = new File([blob], file.name, { type: 'application/pdf' });

            // Use Web Share API
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
                await navigator.share({
                    files: [pdfFile],
                    title: file.name,
                    text: 'Sharing my resume'
                });
            } else {
                alert('Share not supported on this device');
            }
        } catch (e) {
            console.error('Share failed:', e);
            alert('Could not share file. ' + e.message);
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
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                    title="Refresh"
                >
                    🔄
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-2 border-gray-900 dark:border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : error ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-200 dark:border-red-800">
                    {error}
                </div>
            ) : files.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                    <p className="text-gray-500">No PDF files found in Documents.</p>
                    <p className="text-xs text-gray-400 mt-2">Download a resume to see it here</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {files.map((file, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 p-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
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
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleOpenFile(file)}
                                    className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center gap-1"
                                    title="Open PDF"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    Open
                                </button>
                                <button
                                    onClick={() => handleShareFile(file)}
                                    className="px-3 py-1.5 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors flex items-center gap-1"
                                    title="Share PDF"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                    Share
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
