import { useEffect, useState } from 'react';

export default function UpdateChecker() {
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            // Check for updates on mount (app open)
            setChecking(true);

            navigator.serviceWorker.ready.then(registration => {
                registration.update().then(() => {
                    setTimeout(() => setChecking(false), 1000);
                });
            });

            // Also check when app becomes visible again
            const handleVisibilityChange = () => {
                if (!document.hidden && navigator.serviceWorker.controller) {
                    setChecking(true);
                    navigator.serviceWorker.ready.then(registration => {
                        registration.update().then(() => {
                            setTimeout(() => setChecking(false), 1000);
                        });
                    });
                }
            };

            document.addEventListener('visibilitychange', handleVisibilityChange);
            return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
    }, []);

    if (!checking) return null;

    return (
        <div className="fixed top-20 right-4 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2 animate-slideDown">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Checking for updates...
        </div>
    );
}
