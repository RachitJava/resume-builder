import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export default function PdfViewer() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const fileName = searchParams.get('file');
    const [pdfUrl, setPdfUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (fileName) {
            loadPdf();
        }
    }, [fileName]);

    const base64ToBlob = (base64, type) => {
        const binStr = atob(base64);
        const len = binStr.length;
        const arr = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            arr[i] = binStr.charCodeAt(i);
        }
        return new Blob([arr], { type });
    };

    const loadPdf = async () => {
        try {
            const data = await Filesystem.readFile({
                path: fileName,
                directory: Directory.Documents
            });

            const blob = base64ToBlob(data.data, 'application/pdf');
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
            setLoading(false);
        } catch (e) {
            console.error('Failed to load PDF:', e);
            setError('Could not load PDF: ' + e.message);
            setLoading(false);
        }
    };

    const handleShare = async () => {
        try {
            const data = await Filesystem.readFile({
                path: fileName,
                directory: Directory.Documents
            });

            const blob = base64ToBlob(data.data, 'application/pdf');
            const pdfFile = new File([blob], fileName, { type: 'application/pdf' });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
                await navigator.share({
                    files: [pdfFile],
                    title: fileName,
                    text: 'Sharing my resume'
                });
            } else {
                // Fallback: Download
                const link = document.createElement('a');
                link.href = pdfUrl;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (e) {
            console.error('Share failed:', e);
            alert('Could not share file: ' + e.message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
                <div className="w-8 h-8 border-2 border-gray-900 dark:border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-4">
                <div className="text-center">
                    <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/downloads')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                        Back to Downloads
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col">
            {/* Header with Share Button */}
            <div className="bg-white dark:bg-[#18181B] border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between sticky top-0 z-10">
                <button
                    onClick={() => navigate('/downloads')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                    <svg className="w-6 h-6 text-gray-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <h1 className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1 mx-4">
                    {fileName}
                </h1>

                <button
                    onClick={handleShare}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                </button>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 overflow-auto">
                <iframe
                    src={pdfUrl}
                    className="w-full h-full min-h-screen"
                    title={fileName}
                />
            </div>
        </div>
    );
}
