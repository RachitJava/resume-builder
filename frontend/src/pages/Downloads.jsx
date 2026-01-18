import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export default function Downloads() {
    const navigate = useNavigate();
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

    const handleOpenFile = (file) => {
        // Navigate to PDF viewer
        navigate(`/pdf-viewer?file=${encodeURIComponent(file.name)}`);
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
                            onClick={() => handleOpenFile(file)}
                            className="flex items-center gap-3 p-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl hover:border-gray-300 dark:hover:border-gray-700 transition-colors active:scale-98 cursor-pointer"
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
                                    Tap to open
                                </p>
                            </div>
                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
