import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfViewer() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const fileName = searchParams.get('file');
    const [pdfData, setPdfData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [numPages, setNumPages] = useState(null);
    const containerRef = useRef(null);
    const [pageWidth, setPageWidth] = useState(null);

    useEffect(() => {
        if (fileName) {
            loadPdf();
        }
    }, [fileName]);

    useEffect(() => {
        // Hide body overflow to prevent double scrolling
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    useEffect(() => {
        // Responsive PDF width
        const updateWidth = () => {
            if (containerRef.current) {
                setPageWidth(containerRef.current.clientWidth - 32); // Subtract padding
            }
        };

        window.addEventListener('resize', updateWidth);
        updateWidth();

        setTimeout(updateWidth, 100);

        return () => window.removeEventListener('resize', updateWidth);
    }, []);

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
            setPdfData(blob);
            setLoading(false);
        } catch (e) {
            console.error('Failed to load PDF:', e);
            setError('Could not load PDF: ' + e.message);
            setLoading(false);
        }
    };

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    const handleShare = async () => {
        try {
            // Get the file URI
            const uriResult = await Filesystem.getUri({
                path: fileName,
                directory: Directory.Documents
            });

            // Share using Capacitor Share plugin
            await Share.share({
                title: fileName,
                text: 'Sharing my resume',
                url: uriResult.uri,
                dialogTitle: 'Share Resume'
            });
        } catch (e) {
            console.error('Share failed:', e);
            // Fallback only if user cancelled isn't the error
            if (e.message !== 'Share canceled') {
                alert('Could not share file: ' + e.message);
            }
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50 dark:bg-black">
                <div className="w-8 h-8 border-2 border-gray-900 dark:border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50 dark:bg-black p-4">
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
        <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-black flex flex-col">
            {/* Header with Share Button */}
            <div className="bg-white dark:bg-[#18181B] border-b border-gray-200 dark:border-gray-800 p-4 pt-12 md:pt-4 flex items-center justify-between shadow-sm flex-shrink-0">
                <button
                    onClick={() => navigate('/downloads')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                    <svg className="w-6 h-6 text-gray-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <h1 className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1 mx-4 text-center">
                    {fileName}
                </h1>

                <button
                    onClick={handleShare}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                </button>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-zinc-900 p-4" ref={containerRef}>
                <div className="flex justify-center min-h-full pb-0">
                    <Document
                        file={pdfData}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={
                            <div className="flex items-center justify-center p-10">
                                <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        }
                        error={
                            <div className="text-red-500 text-center p-10">
                                Failed to load PDF.
                            </div>
                        }
                        className="shadow-lg"
                    >
                        {Array.from(new Array(numPages), (el, index) => (
                            <Page
                                key={`page_${index + 1}`}
                                pageNumber={index + 1}
                                width={pageWidth ? Math.min(pageWidth, 800) : 350}
                                className="mb-4 bg-white last:mb-0"
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                            />
                        ))}
                    </Document>
                </div>
            </div>
        </div>
    );
}
