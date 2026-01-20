import { useState, useEffect } from 'react';

/**
 * Custom Hook to handle WebRTC Media Streams
 * capturing Microphone, Camera, and Screen Share.
 */
export const useWebRTC = (shouldInitialize = false) => {
    const [stream, setStream] = useState(null);
    const [cameraStream, setCameraStream] = useState(null); // Keep camera separate
    const [screenStream, setScreenStream] = useState(null); // Keep screen separate
    const [error, setError] = useState(null);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    useEffect(() => {
        if (!shouldInitialize) return;

        const initWebRTC = async () => {
            try {
                console.log('🎥 Requesting camera and microphone access...');

                // Initial: Camera + Microphone - High Quality settings
                const localStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1920, max: 1920 },
                        height: { ideal: 1080, max: 1080 },
                        frameRate: { ideal: 30, max: 60 }
                    },
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        sampleRate: 48000,
                        sampleSize: 16
                    }
                });

                // Set content hints for optimization
                if (localStream.getVideoTracks()[0]) {
                    localStream.getVideoTracks()[0].contentHint = 'motion';
                }
                if (localStream.getAudioTracks()[0]) {
                    localStream.getAudioTracks()[0].contentHint = 'speech';
                }

                console.log('✅ Camera and microphone access granted!');
                console.log('Tracks:', localStream.getTracks().map(t => `${t.kind}: ${t.label}`));
                setCameraStream(localStream); // Store camera stream separately
                setStream(localStream);
                setError(null);
            } catch (err) {
                console.error("❌ WebRTC Error:", err);
                console.error("Error name:", err.name);
                console.error("Error message:", err.message);

                if (err.name === 'NotAllowedError') {
                    setError(new Error('Camera/Microphone permission denied. Please allow access in browser settings.'));
                } else if (err.name === 'NotFoundError') {
                    setError(new Error('No camera or microphone found on this device.'));
                } else {
                    setError(err);
                }
            }
        };

        if (!cameraStream && !isScreenSharing) {
            initWebRTC();
        }
    }, [shouldInitialize, isScreenSharing, cameraStream]);

    const startScreenShare = async () => {
        try {
            const newScreenStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: "always",
                    frameRate: { ideal: 30, max: 60 },
                    width: { ideal: 1920, max: 1920 },
                    height: { ideal: 1080, max: 1080 },
                    displaySurface: "monitor"
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            if (newScreenStream.getVideoTracks()[0]) {
                newScreenStream.getVideoTracks()[0].contentHint = 'detail';
            }

            console.log('Screen share started');
            console.log('Screen tracks:', newScreenStream.getTracks().map(t => `${t.kind}: ${t.label}`));

            // DON'T stop camera stream - keep it running!
            // Just switch the main stream to screen share
            setScreenStream(newScreenStream);
            setStream(newScreenStream);
            setIsScreenSharing(true);

            // Handle "Stop Sharing" from browser native UI
            newScreenStream.getVideoTracks()[0].onended = () => {
                console.log('Screen share ended');
                setIsScreenSharing(false);
                setScreenStream(null);
                setStream(cameraStream); // Switch back to camera
            };

        } catch (err) {
            console.error("Screen Share Error:", err);
        }
    };

    const stopScreenShare = () => {
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
        }
        setScreenStream(null);
        setIsScreenSharing(false);
        setStream(cameraStream); // Switch back to camera
    };

    const toggleAudio = () => {
        if (cameraStream) {
            cameraStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
        }
    };

    const toggleVideo = () => {
        if (cameraStream) {
            cameraStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
        }
    };

    return {
        stream,
        cameraStream,
        screenStream,
        error,
        toggleAudio,
        toggleVideo,
        startScreenShare,
        stopScreenShare,
        isScreenSharing
    };
};
