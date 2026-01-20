import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Webcam from 'react-webcam';
import Peer from 'peerjs';
import { useAuth } from '../context/AuthContext';
import VirtualInterviewerConfig from '../components/VirtualInterviewerConfig';
import { useWebRTC } from '../hooks/useWebRTC';

export default function MockInterview() {
    const navigate = useNavigate();
    const { meetingId } = useParams();
    const { user, loading: authLoading } = useAuth();
    const [isScreenFullscreen, setIsScreenFullscreen] = useState(false);
    const isScreenFullscreenRef = useRef(false);


    // Protect Route
    useEffect(() => {
        if (!authLoading && !user) {
            // navigate('/login'); // Temporarily allowed for debugging if needed, but per rule:
            // window.location.href = '/login'; 
        }
    }, [user, authLoading]);

    useEffect(() => {
        isScreenFullscreenRef.current = isScreenFullscreen;
    }, [isScreenFullscreen]);

    // Helper to generate a fixed personal room ID
    const getPersonalRoomId = (email) => {
        if (!email) return null;
        return email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '-');
    };

    // Auto-Fill Profile from Auth
    useEffect(() => {
        if (user) {
            let extractedName = user.name;
            if (!extractedName && user.email) {
                // Fallback: cleaning email handle (rachitbishnoi28 -> Rachit)
                const handle = user.email.split('@')[0];
                const noNumbers = handle.replace(/[0-9]/g, ''); // removed digits
                const firstName = noNumbers.split(/[._]/)[0];   // take first part if dot/underscore
                extractedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
            }

            setProfile(prev => ({
                ...prev,
                name: extractedName || 'Candidate',
                email: user.email
            }));
        }
    }, [user]);

    // --- State Initialization (Fresh Start) ---
    // No session persistence (User requested removal for speed)

    const [step, setStep] = useState('setup');

    // --- State Variables ---
    const [profile, setProfile] = useState({
        name: '',
        role: '',
        experience: '',
        skills: '',
        interviewType: 'technical',
        customQuestions: '',
        interviewerGender: 'male',
        interviewerVoice: 'en-US-GuyNeural',
        interviewerAccent: 'us',
        enableVoice: true,
        questionBankIds: [],
        fixedQuestions: []
    });
    const [userBanks, setUserBanks] = useState([]);
    const [userResumes, setUserResumes] = useState([]);
    const [savedSessions, setSavedSessions] = useState([]);
    const [messages, setMessages] = useState([]);
    const [currentInput, setCurrentInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [interviewData, setInterviewData] = useState({
        startTime: null,
        questionCount: 0,
        responses: []
    });
    const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
    const [feedSearch, setFeedSearch] = useState('');

    const [isHandRaised, setIsHandRaised] = useState(false);
    const isHandRaisedRef = useRef(false);

    // P2P State - Use lazy initializer with more robust check
    const [isHost, setIsHost] = useState(() => {
        // If no meeting ID, we will become the host of our personal room
        if (!meetingId) return true;

        // If joining a specific room, check if it's OURS or if we just created it
        const savedIsHost = sessionStorage.getItem(`isHost_${meetingId}`);
        if (savedIsHost === 'true') return true;

        // Note: we can't check getPersonalRoomId(user.email) here because user is not available in lazy init
        return false;
    });

    // Dedicated effect to handle Fixed Meeting ID and storage
    useEffect(() => {
        if (authLoading || !user) return;

        const personalId = getPersonalRoomId(user.email);

        // 1. If we are on base URL, redirect to our personal room
        if (!meetingId) {
            console.log('👑 Redirecting to Personal Room:', personalId);
            sessionStorage.setItem(`isHost_${personalId}`, 'true');
            setIsHost(true);
            setRoleConfirmed(true);
            navigate(`/mock-interview/${personalId}`, { replace: true });
            return;
        }

        // 2. Identify if we are the host of this specific room
        const savedIsHost = sessionStorage.getItem(`isHost_${meetingId}`);
        const amIActuallyTheHost = (meetingId === personalId) || (savedIsHost === 'true');

        if (amIActuallyTheHost !== isHost) {
            console.log(`👑 Correcting Role: I am ${amIActuallyTheHost ? 'the HOST' : 'a GUEST'} of this room.`);
            setIsHost(amIActuallyTheHost);
            if (amIActuallyTheHost) {
                sessionStorage.setItem(`isHost_${meetingId}`, 'true');
            } else {
                sessionStorage.removeItem(`isHost_${meetingId}`);
            }
        }
        setRoleConfirmed(true); // Signal that Peer can now initialize
    }, [meetingId, user, authLoading, isHost, navigate]);
    const [peers, setPeers] = useState([]); // Guests connected
    const [peerNames, setPeerNames] = useState(new Map()); // peerId -> name
    const [peerStatus, setPeerStatus] = useState('initializing'); // initializing, open, error, disconnected
    const remoteStreamsRef = useRef(new Map()); // id -> stream
    const dataConnectionsRef = useRef(new Map()); // id -> conn
    const screenStreamRef = useRef(null); // Track screen stream for canvas
    const isScreenSharingRef = useRef(false); // Track screen sharing state for canvas
    const remoteScreenSharingIdRef = useRef(null); // Track which guest is sharing screen
    const incomingScreenVideoRef = useRef(null); // Ref for incoming screen share video element
    const activeCallRef = useRef(null); // Track active call for Guest to enable track swapping
    const aiImageRef = useRef(null); // Ref for AI image (stable access)
    const aiVideoRef = useRef(null); // Ref for AI video feed
    const screenShareCallRef = useRef(null); // Track Guest's outbound screen share call
    const isManualStopRef = useRef(true); // Track if mic was intentionally stopped by user
    const [roleConfirmed, setRoleConfirmed] = useState(false); // New: Track if isHost is definitely correct

    // Legacy single remote refs (deprecated but kept for safety if needed)
    const [remoteStream, setRemoteStream] = useState(null);
    const remoteVideoRef = useRef(null);
    const remoteStreamRef = useRef(null);
    const peerRef = useRef(null);

    // --- WebRTC Hook ---
    // Enable camera immediately (Setup, Interview, or Feedback) to ensure Host is reachable
    const { stream, cameraStream, screenStream, toggleAudio, toggleVideo, startScreenShare, stopScreenShare, isScreenSharing, error: webRTCError } = useWebRTC(true);

    // Sync state to refs for Peer callbacks (avoid stale closures)
    const messagesRef = useRef(messages);
    const stepRef = useRef(step);
    const profileRef = useRef(profile);
    const cameraStreamRef = useRef(null);

    // --- SHARED WebRTC Optimization Engine ---
    const optimizeCall = useCallback((call) => {
        if (!call) return;
        const pc = call.peerConnection;
        if (!pc) return;

        const applyParameters = () => {
            const senders = pc.getSenders();
            senders.forEach(sender => {
                if (sender.track && sender.track.kind === 'video') {
                    try {
                        const params = sender.getParameters();
                        if (!params.encodings) params.encodings = [{}];
                        // FORCE High Quality: 4mbps for 1080p, 60fps support
                        params.encodings[0].maxBitrate = 4000000;
                        params.encodings[0].maxFramerate = 60;
                        params.encodings[0].priority = 'high';
                        params.encodings[0].networkPriority = 'high';
                        sender.setParameters(params).catch(e => console.warn('Bitrate boost fail:', e));

                        // Set Content Hint for Sharpness
                        sender.track.contentHint = isScreenSharingRef.current ? 'detail' : 'motion';
                    } catch (e) { console.error('Params error:', e); }
                }
            });
        };

        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
            applyParameters();
        } else {
            pc.oniceconnectionstatechange = () => {
                if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
                    applyParameters();
                }
            };
        }
    }, []);

    useEffect(() => {
        messagesRef.current = messages;
        stepRef.current = step;
        profileRef.current = profile;
        isHandRaisedRef.current = isHandRaised;
        remoteStreamRef.current = remoteStream;
        cameraStreamRef.current = cameraStream;
    }, [messages, step, profile, isHandRaised, remoteStream, cameraStream]);

    // Track screen stream in ref for canvas access
    useEffect(() => {
        screenStreamRef.current = screenStream;
    }, [screenStream]);

    const videoRef = useRef(null); // For main display (camera or screen)
    const cameraVideoRef = useRef(null); // For camera feed (always available)
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);

    // --- PeerJS Logic ---
    // (Managed in Effect below)
    // Keep camera video element updated
    useEffect(() => {
        if (cameraVideoRef.current && cameraStream) {
            // Prevent redundant loads which cause AbortError
            if (cameraVideoRef.current.srcObject !== cameraStream) {
                console.log('🎥 Updating Camera Video srcObject');
                cameraVideoRef.current.srcObject = cameraStream;
            }
            cameraVideoRef.current.play().catch(e => {
                if (e.name !== 'AbortError') console.error('❌ Camera video play failed:', e);
            });
        }
    }, [cameraStream, step]);

    // Keep Guest Main Video (Remote) updated
    useEffect(() => {
        if (!isHost && videoRef.current && remoteStream) {
            if (videoRef.current.srcObject !== remoteStream) {
                console.log('📺 GUEST: Attaching Host Composite Stream to main video (Step:', step, ')');
                videoRef.current.srcObject = remoteStream;
            }
            videoRef.current.play().catch(e => {
                if (e.name !== 'AbortError') console.error('❌ Guest video play failed:', e);
            });
        }
    }, [remoteStream, isHost, step]); // Added step to deps

    // --- AUTO-JOIN Logic ---
    // If we are a guest and we detect a host stream, we should be in interview view
    useEffect(() => {
        if (!isHost && remoteStream && step === 'setup') {
            console.log('🚀 Guest: Auto-transitioning to Interview step as Host is active');
            setStep('interview');
        }
    }, [isHost, remoteStream, step]);

    // Wrapper for toggleVideo to track state
    const handleToggleVideo = () => {
        toggleVideo();
        setIsVideoEnabled(prev => !prev);
    };

    // --- Recording Logic ---
    const mediaRecorderRef = useRef(null);
    const canvasRef = useRef(null);
    const animationFrameRef = useRef(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedChunks, setRecordedChunks] = useState([]);
    const [showReactions, setShowReactions] = useState(false); // New state for header reaction menu

    // Signal Screen Share Status to Host (as Guest)
    useEffect(() => {
        if (!isHost && meetingId) {
            const conn = dataConnectionsRef.current.get('host');
            if (conn) {
                console.log('📡 Sending Screen Share Status:', isScreenSharing);
                conn.send({ type: 'screen-share-status', isSharing: isScreenSharing });
            }
        }
    }, [isScreenSharing, isHost, meetingId]);

    // --- PeerJS Data Listener Logic (Shared between effects) ---
    const setupDataConnectionListeners = useCallback((conn) => {
        const onOpen = () => {
            console.log(`📡 Data link with ${conn.peer} is NOW OPEN`);
            // Host sends current state to Guest immediately
            if (isHost) {
                const syncData = {
                    type: 'SYNC',
                    messages: messagesRef.current,
                    step: stepRef.current
                };
                console.log('📤 Host: Sending SYNC to guest:', syncData.step);
                conn.send(syncData);

                if (stepRef.current === 'setup') {
                    console.log('🤖 AI Host: Guest joined, auto-starting interview...');
                    setTimeout(() => startInterview(), 1500);
                }
            }
        };

        if (conn.open) onOpen();
        else conn.on('open', onOpen);

        conn.on('data', (data) => {
            console.log('📥 Received data:', data.type);
            if (data.type === 'CHAT') {
                setMessages(prev => [...prev, data.message]);
                if (isHost) {
                    dataConnectionsRef.current.forEach((c, id) => {
                        if (id !== conn.peer) c.send(data);
                    });
                }
            }
            if (data.type === 'SYNC' || data.type === 'sync-step') {
                console.log('🔄 Participant: Applying SYNC step:', data.step);
                if (data.messages) setMessages(data.messages);
                if (data.step) setStep(data.step);
            }
            if (data.type === 'screen-share-status') {
                if (data.isSharing) {
                    console.log(`📡 ${conn.peer} started sharing. Overriding others.`);
                    remoteScreenSharingIdRef.current = conn.peer;
                    // If I am sharing, I should stop
                    if (isScreenSharingRef.current) {
                        console.log('🛑 Overridden by remote share. Stopping local share.');
                        stopScreenShare();
                    }
                } else {
                    if (remoteScreenSharingIdRef.current === conn.peer) {
                        remoteScreenSharingIdRef.current = null;
                    }
                }
            }
            if (data.type === 'FORCE_STOP_SCREEN') {
                console.log('⚡ Received FORCE_STOP_SCREEN signal');
                if (isScreenSharingRef.current) stopScreenShare();
            }
            if (data.type === 'LEAVE') {
                console.log('👋 Peer left cleanly:', data.peerId);
                const deadPeerId = data.peerId;
                if (isHost) {
                    remoteStreamsRef.current.delete(deadPeerId);
                    setPeers(prev => prev.filter(p => p !== deadPeerId));
                    dataConnectionsRef.current.delete(deadPeerId);
                    document.getElementById(`remote-video-${deadPeerId}`)?.remove();
                }
            }
            if (data.type === 'EMOJI') {
                // Received emoji from a peer
                const id = Date.now() + Math.random();
                floatingEmojisRef.current.push({
                    id,
                    emoji: data.emoji,
                    startTime: Date.now(),
                    senderId: conn.peer // Map to this peer's ID
                });
                // Auto-cleanup
                setTimeout(() => {
                    floatingEmojisRef.current = floatingEmojisRef.current.filter(e => e.id !== id);
                }, 3000);
            }
        });

        conn.on('close', () => {
            console.warn(`❌ Data connection closed for: ${conn.peer}`);
            dataConnectionsRef.current.delete(conn.peer === meetingId ? 'host' : conn.peer);
            if (remoteScreenSharingIdRef.current === conn.peer) {
                remoteScreenSharingIdRef.current = null;
            }
        });

        conn.on('error', (err) => console.error('Data Conn Error:', err));
    }, [isHost, meetingId]);

    // --- NEW PEER LOGIC (Star Topology) ---
    useEffect(() => {
        if (!authLoading && !user) return;
        if (!meetingId || !roleConfirmed) return; // Wait for role check to finish

        console.log('🚀 Initializing Peer System. Am I Host?', isHost);
        setPeerStatus('connecting');

        // Cleanup old
        if (peerRef.current) peerRef.current.destroy();

        const peerId = isHost ? meetingId : undefined;
        let peer;
        try {
            peer = new Peer(peerId);
            peerRef.current = peer;
        } catch (e) {
            console.error('Peer creation failed:', e);
            return;
        }

        peer.on('error', (err) => {
            console.error('❌ Peer Error:', err.type, err);
            setPeerStatus('error');

            if (err.type === 'unavailable-id' && isHost) {
                const reloadCount = parseInt(sessionStorage.getItem('reload_count') || '0');
                if (reloadCount < 3) {
                    console.warn(`⚠️ ID ${meetingId} taken. Likely a zombie. retrying (attempt ${reloadCount + 1})...`);
                    sessionStorage.setItem('reload_count', (reloadCount + 1).toString());
                    setTimeout(() => window.location.reload(), 5000);
                } else {
                    console.error('❌ Failed to reclaim ID after 3 attempts. Please close other tabs.');
                    sessionStorage.removeItem('reload_count');
                }
            }
        });

        const handleIncomingDataConnection = (conn) => {
            console.log(`✅ ${isHost ? 'HOST' : 'GUEST'} received INCOMING data connection from:`, conn.peer);
            if (isHost) {
                dataConnectionsRef.current.set(conn.peer, conn);
            } else {
                dataConnectionsRef.current.set('host', conn);
            }
            setupDataConnectionListeners(conn);
        };

        const setupPeerListeners = (p) => {
            p.on('open', (id) => {
                console.log('✅ Peer Open. My ID:', id);
                setPeerStatus('open');
            });

            p.on('connection', handleIncomingDataConnection);

            // MEDIA HANDLING
            p.on('call', (call) => {
                console.log('📞 Incoming media call from:', call.peer, 'Metadata:', call.metadata);

                // optimizeCall is now a stable useCallback helper

                if (call.metadata?.type === 'screen') {
                    call.answer();
                    optimizeCall(call);
                    call.on('stream', (stream) => {
                        console.log('📺 Received Screen Stream');
                        if (incomingScreenVideoRef.current) {
                            if (incomingScreenVideoRef.current.srcObject !== stream) {
                                incomingScreenVideoRef.current.srcObject = stream;
                            }
                            incomingScreenVideoRef.current.play().catch(e => console.error(e));
                            remoteScreenSharingIdRef.current = call.peer;
                        }
                    });
                    call.on('close', () => {
                        console.log('🛑 Screen share call closed for:', call.peer);
                        if (remoteScreenSharingIdRef.current === call.peer) {
                            remoteScreenSharingIdRef.current = null;
                        }
                        if (incomingScreenVideoRef.current) {
                            incomingScreenVideoRef.current.srcObject = null;
                        }
                    });
                    return;
                }

                // Answer Camera/Composite
                const currentCamera = cameraStreamRef.current;
                const canvasStream = canvasRef.current?.captureStream(60); // Max framerate for host broadcast
                let composite = canvasStream || currentCamera;

                // CRITICAL: Merge host audio into canvas video stream
                if (canvasStream && currentCamera) {
                    const audioTracks = currentCamera.getAudioTracks();
                    const videoTrack = canvasStream.getVideoTracks()[0];
                    if (audioTracks.length > 0 && videoTrack) {
                        console.log('🎙️ Merging host audio into composite stream');
                        // Apply content hints for WebRTC optimization
                        videoTrack.contentHint = 'motion';
                        composite = new MediaStream([videoTrack, audioTracks[0]]);
                    }
                }

                console.log(`🎥 Answering call from ${call.peer}. Stream available: ${!!composite}`);
                // Only answer if we actually have something to show, or fallback to camera
                if (composite) {
                    call.answer(composite);
                    optimizeCall(call);
                } else {
                    console.warn('⚠️ No stream ready to answer call. Waiting...');
                    // Answer after a short delay if stream becomes ready
                    const checkInterval = setInterval(() => {
                        const newComposite = canvasRef.current?.captureStream(30) || cameraStreamRef.current;
                        if (newComposite) {
                            console.log('✅ Stream now ready, answering call late');
                            call.answer(newComposite);
                            optimizeCall(call);
                            clearInterval(checkInterval);
                        }
                    }, 1000);
                    setTimeout(() => clearInterval(checkInterval), 10000);
                }

                const handleStream = (remoteIn) => {
                    console.log('✅ Media Stream received from:', call.peer);
                    if (isHost) {
                        remoteStreamsRef.current.set(call.peer, remoteIn);
                        setPeers(prev => [...new Set([...prev, call.peer])]);

                        let videoEl = document.getElementById(`remote-video-${call.peer}`);
                        if (!videoEl) {
                            videoEl = document.createElement('video');
                            videoEl.id = `remote-video-${call.peer}`;
                            videoEl.autoplay = true;
                            videoEl.playsInline = true;
                            videoEl.muted = true;
                            videoEl.style.display = 'none';
                            document.body.appendChild(videoEl);
                        }
                        if (videoEl.srcObject !== remoteIn) {
                            videoEl.srcObject = remoteIn;
                        }
                        videoEl.play().catch(e => {
                            if (e.name !== 'AbortError') console.error('Remote video play failed:', e);
                        });
                    } else {
                        console.log('📺 GUEST: Set remote (host) stream successfully');
                        setRemoteStream(remoteIn);
                    }
                };

                call.on('stream', handleStream);
                call.on('close', () => {
                    console.warn(`❌ Media Call closed for: ${call.peer}`);
                    if (isHost) {
                        remoteStreamsRef.current.delete(call.peer);
                        setPeers(prev => prev.filter(p => p !== call.peer));
                        document.getElementById(`remote-video-${call.peer}`)?.remove();
                    } else {
                        setRemoteStream(null);
                    }
                });
            });

            p.on('disconnected', () => {
                console.warn('⚠️ Peer disconnected from server.');
                setPeerStatus('disconnected');
                if (peerRef.current === p && !p.destroyed) {
                    console.log('🔄 Attempting server reconnection...');
                    p.reconnect();
                }
            });

            p.on('error', (err) => {
                console.error('❌ Peer error:', err.type, err);
                if (err.type === 'peer-unavailable') {
                    const deadPeerId = err.message.split(' ').pop();
                    if (isHost) {
                        remoteStreamsRef.current.delete(deadPeerId);
                        setPeers(prev => prev.filter(p => p !== deadPeerId));
                        dataConnectionsRef.current.delete(deadPeerId);
                        document.getElementById(`remote-video-${deadPeerId}`)?.remove();
                    }
                }
            });
        };

        setupPeerListeners(peer);

        return () => {
            // Only clean up peer if the component is actually unmounting or meetingId changed
            // This prevents "flicker" and connection drops when user profile updates
        };
    }, [meetingId, isHost, roleConfirmed]); // Added roleConfirmed to trigger Peer creation

    // Separate cleanup for Peer on unmount
    useEffect(() => {
        return () => {
            if (peerRef.current) {
                console.log('Cleanup: Destroying Peer on Unmount');
                peerRef.current.destroy();
                peerRef.current = null;
            }
        };
    }, []);

    // --- GUEST CONNECTION LOGIC ---
    useEffect(() => {
        if (isHost || !meetingId) return;

        let retryInterval;
        let callTimeout;

        const connectToHost = () => {
            const p = peerRef.current;
            if (!p || p.destroyed || isHost || !p.open) return;

            // Check if we already have a functional remote stream
            if (remoteStreamRef.current) return;

            console.log('👋 Guest attempting connection heartbeat...', meetingId);

            // 1. Data Connection
            if (!dataConnectionsRef.current.get('host')?.open) {
                const conn = p.connect(meetingId, { reliable: true });
                dataConnectionsRef.current.set('host', conn);
                setupDataConnectionListeners(conn);
            }

            // 2. Media Call
            const currentStream = cameraStreamRef.current;
            if (currentStream) {
                if (activeCallRef.current) {
                    console.log('⌛ Media call pending...');
                } else {
                    console.log('📞 Guest calling Host:', meetingId);
                    const call = p.call(meetingId, currentStream);
                    activeCallRef.current = call;

                    // Quality Boost
                    const pc = call.peerConnection;
                    if (pc) {
                        pc.oniceconnectionstatechange = () => {
                            if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
                                try {
                                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                                    if (sender) {
                                        const params = sender.getParameters();
                                        if (!params.encodings) params.encodings = [{}];
                                        params.encodings[0].maxBitrate = 2500000;
                                        params.encodings[0].priority = 'high';
                                        sender.setParameters(params);
                                    }
                                } catch (e) { console.warn('Bitrate boost fail:', e); }
                            }
                        };
                    }

                    call.on('stream', (hostStream) => {
                        console.log('✅ Received Host Stream');
                        setRemoteStream(hostStream);
                    });

                    call.on('error', (e) => {
                        console.error('❌ Call Error:', e);
                        activeCallRef.current = null;
                    });

                    call.on('close', () => {
                        activeCallRef.current = null;
                        setRemoteStream(null);
                    });
                }
            }
        };

        retryInterval = setInterval(connectToHost, 4000);
        setTimeout(connectToHost, 500);

        return () => {
            if (retryInterval) clearInterval(retryInterval);
        };
    }, [isHost, meetingId, cameraStream, remoteStream, setupDataConnectionListeners]);

    // Guest Screen Share: Initiate Separate Call
    useEffect(() => {
        if (isHost || step !== 'interview') return;

        // Start Sharing
        if (isScreenSharing && screenStream && peerRef.current) {
            console.log('🚀 Initiating Screen Share Call to Host:', meetingId);

            // Send override signal to all peers
            dataConnectionsRef.current.forEach(conn => {
                try { conn.send({ type: 'FORCE_STOP_SCREEN' }); } catch (e) { }
            });

            const screenCall = peerRef.current.call(meetingId, screenStream, { metadata: { type: 'screen' } });
            if (screenCall) {
                optimizeCall(screenCall);
                screenShareCallRef.current = screenCall;
            }
            return;
        }

        // Stop Sharing
        if (screenShareCallRef.current) {
            console.log('🛑 Closing Screen Share Call');
            try {
                screenShareCallRef.current.close();
            } catch (e) { console.warn('Call close failed:', e); }
            screenShareCallRef.current = null;
        }
    }, [isScreenSharing, screenStream, isHost, step, meetingId, optimizeCall]);

    // --- ENGINE: CANVAS & ANIMATION LOOP ---
    const workerRef = useRef(null);

    // --- TRACK SWITCHING ENGINE (Fixes Blur) ---
    const replaceVideoTrackForAllPeers = (newTrack) => {
        if (!newTrack) return;
        console.log('⚡ Switching Video Track for all peers...');

        // Iterate over PeerJS connections (private API usage or using our tracked refs)
        // We need to track MediaConnections. Let's start tracking them.
        const calls = Object.values(peerRef.current?.connections || {}).flat();
        calls.forEach(conn => {
            if (conn.type === 'media' && conn.peerConnection) {
                const senders = conn.peerConnection.getSenders();
                const videoSender = senders.find(s => s.track?.kind === 'video');
                if (videoSender) {
                    console.log(`🔄 Replacing track for ${conn.peer}`);
                    videoSender.replaceTrack(newTrack).catch(e => console.error('Track swap failed', e));
                }
            }
        });
    };

    // Sync screen sharing & Ensure Peers see the Mixed Canvas (with Sidebar)
    useEffect(() => {
        console.log('🔄 Screen Share State Sync:', { isScreenSharing, hasStream: !!screenStream });
        isScreenSharingRef.current = isScreenSharing;
        screenStreamRef.current = screenStream;

        if (isHost && peerRef.current) {
            // ALWAYS use the Canvas Composite for peers. 
            // Bypassing it for the raw screen track removes the AI and Sidebar!
            if (canvasRef.current) {
                const compositeTrack = canvasRef.current.captureStream(30).getVideoTracks()[0];
                if (compositeTrack) {
                    console.log('🖼️ Host: Broadcasting Mixed Canvas track to all peers');
                    replaceVideoTrackForAllPeers(compositeTrack);
                }
            }

            if (isScreenSharing && screenStream) {
                // Monitor for the "Stop Sharing" button in browser UI
                const screenTrack = screenStream.getVideoTracks()[0];
                if (screenTrack) {
                    screenTrack.onended = () => {
                        console.log('🛑 Screen track ended via browser UI');
                        stopScreenShare();
                    };
                }
            }
        }
    }, [isScreenSharing, screenStream, isHost, step]);


    useEffect(() => {
        // ⚠️ IMPORTANT: Only HOST runs the canvas mixing engine
        // Guests just receive and display the composite stream
        if (step !== 'interview') return;
        if (!isHost) {
            console.log('👁️ Guest mode: Skipping canvas engine, will display host composite stream');
            return;
        }

        // Wait for canvas to be mounted in DOM
        if (!canvasRef.current) {
            console.warn('Canvas not ready yet, waiting...');
            return;
        }

        console.log('🎬 HOST: Starting canvas mixing engine...');

        // 1. Use existing canvas from JSX
        const canvas = canvasRef.current;
        // Optimized to 1080p for maximum text clarity on guest screens
        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            if (!parent) return;

            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        };

        // Run once
        resizeCanvas();

        // Listen for resize
        window.addEventListener("resize", resizeCanvas);



        const ctx = canvas.getContext('2d', {
            alpha: false,
            desynchronized: true // Low latency rendering
        });

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        console.log('Canvas initialized:', { width: canvas.width, height: canvas.height });

        // 2. Setup Worker for Interval (30 FPS)
        const workerBlob = new Blob([`
            let intervalId;
            self.onmessage = function(e) {
                if (e.data === 'start') intervalId = setInterval(() => self.postMessage('tick'), 16); // 60 FPS
                else if (e.data === 'stop') clearInterval(intervalId);
            };
        `], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(workerBlob));
        workerRef.current = worker;

        // 3. Define DrawFrame Closure
        const drawFrame = () => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const userCameraVideo = cameraVideoRef.current;

            const aiImg = aiImageRef.current;
            const aiVideo = aiVideoRef.current; // New: AI Video Feed support

            if (!canvas || !ctx) return;

            // Clear canvas - True Black for professional look
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Get video elements
            let screenVideoEl = null;

            // HELPER: Format Name
            const formatName = (rawName) => {
                if (!rawName) return 'Guest';
                if (rawName.toLowerCase().includes('ai interview') || rawName === 'AI') return 'AI';
                if (rawName.toLowerCase() === 'you') return 'You';
                const firstPart = rawName.split(/[\s@.]/)[0];
                const nameOnly = firstPart.replace(/[0-9]+$/, '');
                return nameOnly.charAt(0).toUpperCase() + nameOnly.slice(1);
            };

            // HELPER: Check Mic Status
            const getMicStatus = (participantType, streamObj) => {
                const now = Date.now();
                if (participantType === 'Ai') {
                    // Blink mic when AI is speaking (TTS active)
                    if (isSpeakingRef.current) {
                        return Math.floor(now / 200) % 2 === 0; // Blink every 200ms
                    }
                    return false;
                }
                if (participantType === 'You') {
                    // Check local video ref directly as it holds the live stream
                    if (cameraVideoRef.current && cameraVideoRef.current.srcObject) {
                        const tracks = cameraVideoRef.current.srcObject.getAudioTracks();
                        return tracks.length > 0 && tracks[0].enabled;
                    }
                    return false;
                }
                if (participantType === 'Guest') {
                    if (!streamObj) return false;
                    const track = streamObj.getAudioTracks()[0];
                    return track ? track.enabled : false;
                }
                return false;
            };

            // HELPER: Draw Mic Icon
            const drawMicIcon = (ctx, x, y, isMicOn) => {
                ctx.save();
                ctx.translate(x, y);

                // Body
                ctx.fillStyle = isMicOn ? '#4ade80' : '#ef4444'; // Green-400 : Red-500
                ctx.strokeStyle = isMicOn ? '#4ade80' : '#ef4444';
                ctx.lineWidth = 1.5;

                // Mic capsule
                ctx.beginPath();
                ctx.roundRect(3, 0, 6, 9, 3);
                ctx.fill();

                // Stand
                ctx.beginPath();
                ctx.moveTo(6, 9);
                ctx.lineTo(6, 12);
                ctx.moveTo(3, 12);
                ctx.lineTo(9, 12);
                ctx.stroke();

                // Slash if muted
                if (!isMicOn) {
                    ctx.strokeStyle = '#fff'; // White slash contrast
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(1, 1);
                    ctx.lineTo(11, 13);
                    ctx.stroke();
                }

                ctx.restore();
                return 16; // Return width usage
            };

            // HELPER: Draw Emojis for a given participant
            const drawParticipantEmojis = (targetId, x, y, w, h) => {
                const now = Date.now();
                const activeEmojis = floatingEmojisRef.current.filter(e => e.senderId === targetId);

                activeEmojis.forEach(e => {
                    const elapsed = now - e.startTime;
                    if (elapsed > 2000) return; // limit to 2s

                    const progress = elapsed / 2000;
                    const floatY = y + h - 100 - (progress * 400); // Start higher inside frame, float up 400px
                    const alpha = 1 - Math.pow(progress, 3);

                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.font = '100px Apple Color Emoji, Segoe UI Emoji, sans-serif'; // 100px Emoji
                    ctx.textAlign = 'center';
                    // Draw centered in the cell horizontally
                    ctx.fillText(e.emoji, x + w / 2, floatY);
                });
            };


            if (isScreenSharingRef.current && screenStreamRef.current) {
                screenVideoEl = document.getElementById('screen-share-temp-video');
                if (!screenVideoEl) {
                    screenVideoEl = document.createElement('video');
                    screenVideoEl.id = 'screen-share-temp-video';
                    screenVideoEl.srcObject = screenStreamRef.current;
                    screenVideoEl.autoplay = true;
                    screenVideoEl.muted = true;
                    screenVideoEl.playsInline = true;
                    screenVideoEl.autoplay = true;
                    screenVideoEl.muted = true;
                    screenVideoEl.playsInline = true;
                    screenVideoEl.style.display = 'none';
                    document.body.appendChild(screenVideoEl);
                    screenVideoEl.play().catch(e => console.error('Screen video failed:', e));
                } else if (screenVideoEl.srcObject !== screenStreamRef.current) {
                    screenVideoEl.srcObject = screenStreamRef.current;
                }
            } else {
                // Clean up screen video if exists
                const oldEl = document.getElementById('screen-share-temp-video');
                if (oldEl) {
                    oldEl.remove();
                    console.log('🎬 Removed screen share video element');
                }
            }

            // --- DRAWING LOGIC ---
            const remoteShareId = remoteScreenSharingIdRef.current;
            const remoteShareEl = incomingScreenVideoRef.current;
            const isRemoteSharing = !!(remoteShareId && remoteShareEl && remoteShareEl.srcObject && remoteShareEl.readyState >= 2);
            const isLocalSharing = !!(isScreenSharingRef.current && screenVideoEl && screenVideoEl.readyState >= 2);

            // Draw Frame Logic - Standard or Screen Share
            // ================= FULLSCREEN SCREEN SHARE MODE =================
            // ================= SCREEN SHARE MODES =================
            // ================= SCREEN SHARE MODES =================
            if (isLocalSharing || isRemoteSharing) {

                const activeScreenEl = isRemoteSharing
                    ? remoteShareEl
                    : screenVideoEl;

                if (!activeScreenEl) return;

                // -------- FULLSCREEN MODE --------
                // -------- FULLSCREEN MODE (NO BLACK BARS) --------
                if (isScreenFullscreenRef.current) {

                    ctx.fillStyle = '#000';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    const vw = activeScreenEl.videoWidth || 1280;
                    const vh = activeScreenEl.videoHeight || 720;

                    const canvasRatio = canvas.width / canvas.height;
                    const videoRatio = vw / vh;

                    let drawW, drawH, offsetX, offsetY;

                    if (videoRatio > canvasRatio) {
                        // Video wider → crop sides
                        drawH = canvas.height;
                        drawW = canvas.height * videoRatio;
                        offsetX = (canvas.width - drawW) / 2;
                        offsetY = 0;
                    } else {
                        // Video taller → crop top/bottom
                        drawW = canvas.width;
                        drawH = canvas.width / videoRatio;
                        offsetX = 0;
                        offsetY = (canvas.height - drawH) / 2;
                    }

                    ctx.drawImage(activeScreenEl, offsetX, offsetY, drawW, drawH);
                }

                // -------- NORMAL MODE --------
                else {

                    ctx.fillStyle = '#121212';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Responsive Layout Detection
                    const isMobile = canvas.width < canvas.height;

                    if (isMobile) {
                        // --- MOBILE VERTICAL LAYOUT (Participants on TOP) ---

                        // 1. Advanced Gradient Background
                        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                        gradient.addColorStop(0, '#2c2c2e');
                        gradient.addColorStop(1, '#000000');
                        ctx.fillStyle = gradient;
                        ctx.fillRect(0, 0, canvas.width, canvas.height);

                        // Participants row at top (18%), Screen Share filling the rest below
                        const pipHeight = Math.floor(canvas.height * 0.18);
                        const contentHeight = canvas.height - pipHeight;
                        const contentWidth = canvas.width;
                        const contentTapY = pipHeight; // Start screen share below pips

                        // Draw Screen Share (Below Pips)
                        const videoWidth = activeScreenEl.videoWidth || 1280;
                        const videoHeight = activeScreenEl.videoHeight || 720;
                        const videoAspect = videoWidth / videoHeight;
                        const contentAspect = contentWidth / contentHeight;

                        let drawW, drawH, ox, oy;

                        // Contain Logic
                        if (videoAspect > contentAspect) {
                            drawW = contentWidth;
                            drawH = contentWidth / videoAspect;
                            ox = 0;
                            oy = contentTapY + (contentHeight - drawH) / 2;
                        } else {
                            drawH = contentHeight;
                            drawW = contentHeight * videoAspect;
                            ox = (contentWidth - drawW) / 2;
                            oy = contentTapY;
                        }
                        ctx.drawImage(activeScreenEl, ox, oy, drawW, drawH);

                        // Draw Participants Row (Top)
                        const pipCount = 2 + remoteStreamsRef.current.size;
                        const pipWidth = Math.floor(contentWidth / Math.max(3, pipCount));

                        let currentPipX = 0;
                        const drawMobilePip = (source, label, flip = false) => {
                            const pW = pipWidth - 8;
                            const pH = pipHeight;
                            const pX = currentPipX + 4;
                            const pY = 2;

                            const radius = 12;

                            // 1. Draw Shadow & Background (Active Pip Base)
                            ctx.fillStyle = '#1a1a1a';
                            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                            ctx.shadowBlur = 8;
                            ctx.shadowOffsetX = 0;
                            ctx.shadowOffsetY = 4;

                            ctx.beginPath();
                            ctx.roundRect(pX, pY, pW, pH, radius);
                            ctx.fill();

                            // Reset shadow for clipping context
                            ctx.shadowColor = 'transparent';
                            ctx.shadowBlur = 0;
                            ctx.shadowOffsetX = 0;
                            ctx.shadowOffsetY = 0;

                            // 2. Clip & Draw Video
                            ctx.save();
                            ctx.beginPath();
                            ctx.roundRect(pX, pY, pW, pH, radius);
                            ctx.clip();

                            if (flip) {
                                ctx.save();
                                ctx.translate(pX + pW, pY);
                                ctx.scale(-1, 1);
                                ctx.drawImage(source, 0, 0, pW, pH);
                                ctx.restore();
                            } else {
                                ctx.drawImage(source, pX, pY, pW, pH);
                            }
                            ctx.restore();

                            // 3. Border
                            ctx.beginPath();
                            ctx.roundRect(pX, pY, pW, pH, radius);
                            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                            ctx.lineWidth = 1.5;
                            ctx.stroke();

                            // 4. Minimal Label (No background, just text with outline)
                            const labelText = formatName(label);
                            ctx.font = 'bold 8px Inter, sans-serif';

                            // Position at bottom-left (tight corner)
                            const labelX = pX + 4;
                            const labelY = pY + pH - 4;

                            ctx.textAlign = 'left';
                            ctx.textBaseline = 'bottom';

                            // Text Outline for visibility
                            ctx.lineWidth = 2;
                            ctx.strokeStyle = 'rgba(0,0,0,0.8)';
                            ctx.strokeText(labelText, labelX, labelY);

                            // Text Fill
                            ctx.fillStyle = '#fff';
                            ctx.fillText(labelText, labelX, labelY);

                            // MIC ICON
                            const micIsOn = getMicStatus(label === 'AI' ? 'Ai' : (label === 'You' ? 'You' : 'Guest'), source.srcObject || source); // source for guest is video element, but need stream? 
                            // Wait, 'source' in drawMobilePip for Guest is the video ELEMENT. videoEl.srcObject is the stream.
                            // For AI, source is Image. 
                            // For You, source is videoEl. 

                            // Let's refine passing stream.
                            // But simplistic:
                            let isMicOn = true;
                            if (label === 'You') isMicOn = getMicStatus('You');
                            else if (label === 'AI') isMicOn = true;
                            else isMicOn = source.srcObject ? getMicStatus('Guest', source.srcObject) : false; // Guest

                            const labelWidth = ctx.measureText(labelText).width;
                            drawMicIcon(ctx, labelX + labelWidth + 6, labelY - 9, isMicOn);

                            currentPipX += pipWidth;
                        };

                        if (userCameraVideo && userCameraVideo.readyState >= 2) drawMobilePip(userCameraVideo, 'You', true);
                        if (userCameraVideo && userCameraVideo.readyState >= 2) drawMobilePip(userCameraVideo, 'You', true);
                        if (aiVideo && aiVideo.readyState >= 2) drawMobilePip(aiVideo, 'AI');
                        else if (aiImg && aiImg.complete) drawMobilePip(aiImg, 'AI');
                        remoteStreamsRef.current.forEach((_, id) => {
                            const el = document.getElementById(`remote-video-${id}`);
                            if (el && el.readyState === 4) drawMobilePip(el, 'Guest');
                        });


                    } else {
                        // --- DESKTOP STANDARD LAYOUT ---
                        const sidebarWidth = Math.floor(canvas.width * 0.22);
                        const contentWidth = canvas.width - sidebarWidth;
                        const contentHeight = canvas.height;

                        const videoWidth = activeScreenEl.videoWidth || 1280;
                        const videoHeight = activeScreenEl.videoHeight || 720;
                        const videoAspect = videoWidth / videoHeight;
                        const contentAspect = contentWidth / contentHeight;

                        let drawWidth, drawHeight, offsetX, offsetY;

                        if (videoAspect > contentAspect) {
                            drawWidth = contentWidth;
                            drawHeight = contentWidth / videoAspect;
                            offsetX = 0;
                            offsetY = (contentHeight - drawHeight) / 2;
                        } else {
                            drawHeight = contentHeight;
                            drawWidth = contentHeight * videoAspect;
                            offsetX = (contentWidth - drawWidth) / 2;
                            offsetY = 0;
                        }

                        ctx.drawImage(activeScreenEl, offsetX, offsetY, drawWidth, drawHeight);

                        // --- SIDEBAR ---
                        const padding = 16;
                        const pipWidth = sidebarWidth - (padding * 2);
                        const pipHeight = (pipWidth * 9) / 16;
                        let pipCount = 0;

                        const drawPip = (source, label, flip = false) => {
                            const x = canvas.width - sidebarWidth + padding;
                            const y = padding + pipCount * (pipHeight + padding + 25);

                            if (flip) {
                                ctx.save();
                                ctx.translate(x + pipWidth, y);
                                ctx.scale(-1, 1);
                                ctx.drawImage(source, 0, 0, pipWidth, pipHeight);
                                ctx.restore();
                            } else {
                                ctx.drawImage(source, x, y, pipWidth, pipHeight);
                            }

                            ctx.strokeStyle = '#fff';
                            ctx.lineWidth = 1.5;
                            ctx.strokeRect(x, y, pipWidth, pipHeight);

                            // Minimal Label (No background, just text with outline)
                            ctx.font = 'bold 10px Inter, sans-serif';
                            const labelX = x + 6;
                            const labelY = y + pipHeight - 6;

                            ctx.fillStyle = '#fff';
                            ctx.textAlign = 'left';
                            ctx.textBaseline = 'bottom';

                            ctx.lineWidth = 2.5;
                            ctx.strokeStyle = 'rgba(0,0,0,0.8)';
                            ctx.strokeText(formatName(label), labelX, labelY);
                            ctx.fillText(formatName(label), labelX, labelY);

                            // Mic Icon Sidebar
                            let isMicOn = true;
                            if (label === 'You') isMicOn = getMicStatus('You');
                            else if (label === 'AI') isMicOn = true;
                            else isMicOn = source.srcObject ? getMicStatus('Guest', source.srcObject) : false;

                            const nameWidth = ctx.measureText(formatName(label)).width;
                            drawMicIcon(ctx, labelX + nameWidth + 6, labelY - 9, isMicOn);

                            pipCount++;
                        };

                        remoteStreamsRef.current.forEach((_, id) => {
                            const el = document.getElementById(`remote-video-${id}`);
                            if (el && el.readyState === 4) {
                                drawPip(el, `Guest`);
                            }
                        });

                        if (userCameraVideo && userCameraVideo.readyState >= 2) {
                            drawPip(userCameraVideo, 'You', true);
                        }

                        if (aiVideo && aiVideo.readyState >= 2) {
                            drawPip(aiVideo, 'AI');
                        } else if (aiImg && aiImg.complete) {
                            drawPip(aiImg, 'AI');
                        }
                    }
                }

                return; // IMPORTANT
            }




            else {
                // STANDARD LAYOUT: Grid of participants
                const totalParticipants = 2 + remoteStreamsRef.current.size; // AI + Host + Guests
                let cols, rows;

                if (canvas.width > canvas.height) {
                    // Landscape
                    cols = Math.ceil(Math.sqrt(totalParticipants));
                    rows = Math.ceil(totalParticipants / cols);
                } else {
                    // Portrait
                    rows = Math.ceil(Math.sqrt(totalParticipants));
                    cols = Math.ceil(totalParticipants / rows);
                }

                const cellWidth = canvas.width / cols;
                const cellHeight = canvas.height / rows;

                let index = 0;



                // AI (Video or Image)
                const aiActive = (aiVideo && aiVideo.readyState >= 2) || (aiImg && aiImg.complete);
                if (aiActive) {
                    const col = index % cols;
                    const row = Math.floor(index / cols);
                    const x = col * cellWidth;
                    const y = row * cellHeight;

                    ctx.fillStyle = '#000';
                    ctx.fillRect(x, y, cellWidth, cellHeight);

                    const targetWidth = cellWidth - 20;
                    const targetHeight = (targetWidth * 9) / 16;
                    const xOffset = x + 10;
                    const yOffset = y + (cellHeight - targetHeight) / 2;

                    // --- SPEAKING ANIMATION (GLOW/PULSE) ---
                    const isAiSpeaking = isSpeakingRef.current;
                    if (isAiSpeaking) {
                        const pulse = 1 + (Math.sin(Date.now() / 150) * 0.03); // Subtile pulse
                        const shiftX = (targetWidth * (pulse - 1)) / 2;
                        const shiftY = (targetHeight * (pulse - 1)) / 2;

                        // Outer Glow
                        ctx.shadowColor = '#4ade80'; // Green glow
                        ctx.shadowBlur = 20;

                        if (aiVideo && aiVideo.readyState >= 2) {
                            // Play the "talking" video
                            if (aiVideo.paused) aiVideo.play().catch(() => { });
                            ctx.drawImage(aiVideo, xOffset - shiftX, yOffset - shiftY, targetWidth * pulse, targetHeight * pulse);
                        } else {
                            ctx.drawImage(aiImg, xOffset - shiftX, yOffset - shiftY, targetWidth * pulse, targetHeight * pulse);
                        }
                        ctx.shadowBlur = 0; // Reset
                    } else {
                        // Resting state (Paused or Image)
                        if (aiVideo && !aiVideo.paused) aiVideo.pause();
                        if (aiVideo && aiVideo.readyState >= 2) {
                            ctx.drawImage(aiVideo, xOffset, yOffset, targetWidth, targetHeight);
                        } else {
                            ctx.drawImage(aiImg, xOffset, yOffset, targetWidth, targetHeight);
                        }
                    }

                    // Minimal Label (No background, just text with outline)
                    ctx.font = 'bold 10px Inter, sans-serif';
                    const labelX = xOffset + 10;
                    const labelY = yOffset + targetHeight - 10;

                    ctx.fillStyle = '#fff';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'bottom';

                    ctx.lineWidth = 2.5;
                    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
                    ctx.strokeText('AI (Alex)', labelX, labelY);

                    ctx.fillText('AI (Alex)', labelX, labelY);

                    // Draw AI Emojis (if any logic triggered them)
                    drawParticipantEmojis('ai', x, y, cellWidth, cellHeight);

                    // AI Mic Icon
                    const nameWidth = ctx.measureText('AI (Alex)').width;
                    drawMicIcon(ctx, labelX + nameWidth + 6, labelY - 9, isAiSpeaking);

                    index++;
                }

                // Host (You)
                if (userCameraVideo && userCameraVideo.readyState >= 2) {
                    const col = index % cols;
                    const row = Math.floor(index / cols);
                    const x = col * cellWidth;
                    const y = row * cellHeight;

                    ctx.fillStyle = '#000';
                    ctx.fillRect(x, y, cellWidth, cellHeight);

                    const targetWidth = cellWidth - 20;
                    const targetHeight = (targetWidth * 9) / 16;
                    const xOffset = x + 10;
                    const yOffset = y + (cellHeight - targetHeight) / 2;

                    ctx.save();
                    ctx.translate(xOffset + targetWidth, yOffset);
                    ctx.scale(-1, 1);
                    ctx.drawImage(userCameraVideo, 0, 0, targetWidth, targetHeight);
                    ctx.restore();

                    ctx.font = 'bold 10px Inter, sans-serif';
                    const hostName = formatName(profile.name || 'Host');
                    const labelX = xOffset + 10;
                    const labelY = yOffset + targetHeight - 10;

                    ctx.fillStyle = '#fff';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'bottom';

                    ctx.lineWidth = 2.5;
                    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
                    ctx.strokeText(hostName, labelX, labelY);
                    ctx.fillText(hostName, labelX, labelY);

                    // Mic Icon
                    drawMicIcon(ctx, labelX + ctx.measureText(hostName).width + 6, labelY - 9, getMicStatus('You'));

                    // Draw HOST Emojis
                    drawParticipantEmojis('host', x, y, cellWidth, cellHeight);

                    index++;
                }

                // Guests
                remoteStreamsRef.current.forEach((stream, id) => {
                    const videoEl = document.getElementById(`remote-video-${id}`);
                    if (videoEl && videoEl.readyState === 4) {
                        const col = index % cols;
                        const row = Math.floor(index / cols);
                        const x = col * cellWidth;
                        const y = row * cellHeight;

                        ctx.fillStyle = '#000';
                        ctx.fillRect(x, y, cellWidth, cellHeight);

                        const targetWidth = cellWidth - 20;
                        const targetHeight = (targetWidth * 9) / 16;
                        const xOffset = x + 10;
                        const yOffset = y + (cellHeight - targetHeight) / 2;

                        ctx.drawImage(videoEl, xOffset, yOffset, targetWidth, targetHeight);

                        ctx.font = 'bold 10px Inter, sans-serif';
                        const guestName = formatName(peerNames.get(id) || `Guest`);
                        const labelX = xOffset + 10;
                        const labelY = yOffset + targetHeight - 10;

                        ctx.fillStyle = '#fff';
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'bottom';

                        ctx.lineWidth = 2.5;
                        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
                        ctx.strokeText(guestName, labelX, labelY);
                        ctx.fillText(guestName, labelX, labelY);

                        // Mic Icon
                        // For Guests in Grid, 'stream' variable available from forEach? No, this is forEach((stream, id)).
                        // Wait, looking at context in 'view_file' output for Lines 1213: `remoteStreamsRef.current.forEach((stream, id) => {`
                        // So 'stream' IS the stream object. 'videoEl' is the element.
                        // I can use `stream` directly.
                        drawMicIcon(ctx, labelX + ctx.measureText(guestName).width + 6, labelY - 9, getMicStatus('Guest', stream));

                        // Draw GUEST Emojis
                        drawParticipantEmojis(id, x, y, cellWidth, cellHeight);

                        index++;
                    }
                });
            }
        };

        worker.onmessage = drawFrame;
        worker.postMessage('start');

        return () => {
            worker.postMessage('stop');
            worker.terminate();
        };
    }, [step, isHost, cameraStream]); // Added cameraStream to ensure engine starts once camera is ready

    const startRecording = () => {
        if (!canvasRef.current || !cameraStream) {
            alert('Stream / Canvas not ready'); return;
        }

        try {
            const stream = canvasRef.current.captureStream(30);
            const audioTracks = cameraStream.getAudioTracks();
            if (audioTracks.length > 0) stream.addTrack(audioTracks[0]);

            const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm';

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = e => {
                if (e.data.size > 0) setRecordedChunks(p => [...p, e.data]);
            };

            mediaRecorder.start(1000);
            setIsRecording(true);
            console.log('Recording Started');
        } catch (e) {
            console.error(e);
            alert('Recording failed: ' + e.message);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            // Stop animation loop
            if (mediaRecorderRef.current.isRecordingRef) {
                mediaRecorderRef.current.isRecordingRef.current = false;
            }

            // Stop animation frame
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }

            mediaRecorderRef.current.stop();
            setIsRecording(false);
            console.log('Recording stopped');
        }
    };

    const downloadedRef = useRef(false);

    useEffect(() => {
        if (!isRecording && recordedChunks.length > 0 && !downloadedRef.current) {
            downloadedRef.current = true;

            // Download video recording
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            document.body.appendChild(a);
            a.style = 'display: none';
            a.href = url;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '_');
            a.download = `interview - recording - ${timestamp}.webm`;
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            // Generate and download feedback/transcript file
            const feedbackContent = generateFeedbackFile();
            const feedbackBlob = new Blob([feedbackContent], { type: 'text/plain' });
            const feedbackUrl = URL.createObjectURL(feedbackBlob);
            const feedbackLink = document.createElement('a');
            feedbackLink.href = feedbackUrl;
            feedbackLink.download = `interview - feedback - ${timestamp}.txt`;
            document.body.appendChild(feedbackLink);
            feedbackLink.click();
            window.URL.revokeObjectURL(feedbackUrl);
            document.body.removeChild(feedbackLink);

            console.log('✅ Downloaded recording and feedback files');

            // Reset after download
            setTimeout(() => {
                setRecordedChunks([]);
                downloadedRef.current = false;
            }, 1000);
        }
    }, [isRecording, recordedChunks]);

    const generateFeedbackFile = () => {
        const timestamp = new Date().toLocaleString();
        let content = `INTERVIEW TRANSCRIPT & FEEDBACK\n`;
        content += `=====================================\n\n`;
        content += `Date: ${timestamp} \n`;
        content += `Candidate: ${profile.name} \n`;
        content += `Role: ${profile.role} \n`;
        content += `Experience: ${profile.experience} \n`;
        content += `Interview Type: ${profile.interviewType} \n`;
        content += `\n =====================================\n\n`;

        content += `CONVERSATION TRANSCRIPT: \n`;
        content += `------------------------\n\n`;

        messages.forEach((msg, index) => {
            const speaker = msg.role === 'interviewer' ? 'AI Interviewer' : 'Candidate';
            content += `${speaker}: ${msg.content} \n\n`;
        });

        content += `\n =====================================\n`;
        content += `END OF INTERVIEW\n`;
        content += `=====================================\n`;

        return content;
    };


    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const recognitionRef = useRef(null);
    const isSpeakingRef = useRef(false);
    const [showChat, setShowChat] = useState(false);

    // Mic Visualization State
    const [userVolume, setUserVolume] = useState(0);
    const [showMuteWarning, setShowMuteWarning] = useState(false);

    useEffect(() => {
        if (!stream) return;
        let audioContext;
        let animationHandle;

        const initAudio = () => {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            // Create stream source
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 256;
            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const checkVolume = () => {
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                }
                const average = sum / dataArray.length;
                // normalize somewhat (0-30 usually for speech)
                const volume = Math.min(100, average * 2);
                setUserVolume(volume);

                // Check if talking while muted
                const isMuted = stream.getAudioTracks()[0]?.enabled === false;
                // Average > 30 raw is roughly "talking loudly", > 10 is background noise often. 
                // Let's use 20 for threshold to avoid false positives.
                if (average > 15 && isMuted) {
                    setShowMuteWarning(true);
                } else {
                    setShowMuteWarning(false);
                }
                animationHandle = requestAnimationFrame(checkVolume);
            };
            animationHandle = requestAnimationFrame(checkVolume);
        };

        // Delay slightly to ensure tracks are ready
        setTimeout(initAudio, 500);

        return () => {
            if (animationHandle) cancelAnimationFrame(animationHandle);
            if (audioContext && audioContext.state !== 'closed') audioContext.close();
        };
    }, [stream]);


    // --- Effects & Data Fetching ---
    const fetchSessions = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/interview-sessions', {
                headers: { 'Authorization': `Bearer ${token} ` }
            });
            if (response.ok) {
                const data = await response.json();
                setSavedSessions(data);
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
        }
    };

    useEffect(() => {
        const fetchBanks = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/question-banks', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUserBanks(data);
                }
            } catch (error) {
                console.error('Error fetching banks:', error);
            }
        };
        const fetchResumes = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/resumes', {
                    headers: { 'Authorization': `Bearer ${token} ` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUserResumes(data);
                }
            } catch (error) {
                console.error('Error fetching resumes:', error);
            }
        };
        fetchBanks();
        fetchResumes();
        fetchSessions();
    }, []);

    const [uploadingResume, setUploadingResume] = useState(false);

    const handleResumeUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploadingResume(true);
        try {
            const token = localStorage.getItem('token');

            // 1. Parse the resume
            const parseResponse = await fetch('/api/upload/parse', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!parseResponse.ok) throw new Error('Failed to parse resume');
            const parsedData = await parseResponse.json();

            // 2. Save the parsed resume
            const saveResponse = await fetch('/api/resumes', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(parsedData)
            });

            if (!saveResponse.ok) throw new Error('Failed to save resume');
            const savedResume = await saveResponse.json();

            // 3. Refresh list and select the new one
            setUserResumes(prev => [...prev, savedResume]);

            // Tricky: formatResumeToContext relies on userResumes state which might not be updated yet. 
            // Better: construct context manually or wait.
            // Let's manually construct for immediate feedback to avoid stale state issues
            let text = `RESUME CONTEXT:\n`;
            text += `Name: ${savedResume.fullName}\nSummary: ${savedResume.summary || ''}\n`;
            text += `Skills: ${savedResume.skills?.join(', ') || ''}\n`;
            text += `Experience:\n`;
            savedResume.experience?.forEach(exp => {
                text += `- ${exp.position} at ${exp.company} (${exp.startDate || ''} - ${exp.endDate || ''}): ${exp.description || ''}\n`;
            });
            text += `Projects:\n`;
            savedResume.projects?.forEach(proj => {
                text += `- ${proj.name}: ${proj.description || ''} (${proj.technologies?.join(', ') || ''})\n`;
            });

            setProfile(prev => ({
                ...prev,
                selectedResumeId: savedResume.id,
                resumeContext: text
            }));

            alert('Resume uploaded and selected successfully!');

        } catch (error) {
            console.error('Upload Error:', error);
            alert('Failed to upload resume. Please try again.');
        } finally {
            setUploadingResume(false);
        }
    };

    const formatResumeToContext = (resumeId) => {
        const resume = userResumes.find(r => r.id === resumeId);
        if (!resume) return "";
        let text = `RESUME CONTEXT:\n`;
        text += `Name: ${resume.fullName}\nSummary: ${resume.summary || ''}\n`;
        text += `Skills: ${resume.skills?.join(', ') || ''}\n`;
        text += `Experience:\n`;
        resume.experience?.forEach(exp => {
            text += `- ${exp.position} at ${exp.company} (${exp.startDate || ''} - ${exp.endDate || ''}): ${exp.description || ''}\n`;
        });
        text += `Projects:\n`;
        resume.projects?.forEach(proj => {
            text += `- ${proj.name}: ${proj.description || ''} (${proj.technologies?.join(', ') || ''})\n`;
        });
        return text;
    };


    // --- Speech Recognition ---
    const speechTimeoutRef = useRef(null);

    const stableTranscriptRef = useRef(''); // Persistent storage for finalized text

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Speech recognition is not supported.'); return;
        }

        // 1. Ensure Hardware Mic is Unmuted
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack && !audioTrack.enabled) {
                toggleAudio();
            }
        }

        if (isSpeakingRef.current) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
            stableTranscriptRef.current = currentInput; // Sync with current input box state
            console.log('🎤 Mic: Listening...');
        };

        recognition.onerror = (event) => {
            console.error('🎤 Mic Error:', event.error);
            if (event.error === 'network') setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
            if (!isManualStopRef.current && !isSpeakingRef.current) {
                setTimeout(() => {
                    try { recognitionRef.current?.start(); } catch (e) { }
                }, 500);
            }
        };

        recognition.onresult = (event) => {
            if (isSpeakingRef.current) return;

            let interimTranscript = '';
            let newFinals = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    newFinals += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            if (newFinals) {
                stableTranscriptRef.current += newFinals;
            }

            // Sync input box with [Stable finalized text] + [Current interim chunk]
            const displayText = (stableTranscriptRef.current + interimTranscript).trim();
            setCurrentInput(displayText);

            if (newFinals.trim()) {
                if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
                const wordCount = displayText.split(/\s+/).length;
                let timeout = wordCount < 6 ? 2000 : 4000;

                speechTimeoutRef.current = setTimeout(() => {
                    console.log('✅ Auto-sending transcribed text');
                    document.getElementById('auto-send-trigger').click();
                }, timeout);
            }
        };

        recognitionRef.current = recognition;
        isManualStopRef.current = false;
        try { recognition.start(); } catch (e) { console.error('Mic Start Failed:', e); }
    };

    const stopListening = () => {
        setIsListening(false);
        isManualStopRef.current = true; // Mark as intentional stop
        // 1. Stop Recognition immediately
        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }
        // 2. We NO LONGER mute the mic here. User stays live.
        /* 
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack && audioTrack.enabled) {
                toggleAudio();
            }
        } 
        */
        if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    };
    const stopSpeaking = () => window.speechSynthesis?.cancel();

    useEffect(() => {
        return () => stopSpeaking();
    }, []);


    // --- TTS Fallback ---
    const speakMessage = (text) => {
        if (!profile.enableVoice || !('speechSynthesis' in window)) return;

        // Ensure voices are loaded
        let voices = window.speechSynthesis.getVoices();

        const speak = () => {
            stopSpeaking();
            const utterance = new SpeechSynthesisUtterance(text);

            // Voice Selection Strategy: Jarvis Mode (British/Daniel preferred)
            const preferredVoice = voices.find(v => v.name === 'Daniel') ||
                voices.find(v => v.name.includes("Google UK English Male")) ||
                voices.find(v => v.lang.includes("en-GB") && v.name.includes("Male")) ||
                voices.find(v => v.lang.includes("en-GB"));

            if (preferredVoice) utterance.voice = preferredVoice;

            utterance.rate = 1.1; // Crisp, efficient (Jarvis-like)
            utterance.pitch = 0.9; // Slightly deeper
            utterance.volume = 1.0;

            isSpeakingRef.current = true;
            setIsSpeaking(true);
            utterance.onend = () => {
                setIsSpeaking(false);
                isSpeakingRef.current = false;
                // Resume listening if we were in "auto" mode
                if (!isManualStopRef.current) {
                    try { recognitionRef.current?.start(); } catch (e) { }
                }
            };
            utterance.onerror = (e) => console.error("TTS Error:", e);

            speechSynthesis.speak(utterance);
        };

        if (voices.length === 0) {
            window.speechSynthesis.onvoiceschanged = () => {
                voices = window.speechSynthesis.getVoices();
                speak();
            };
        } else {
            speak();
        }
    };


    // --- Interview Logic ---
    const startInterview = () => {
        // Use Ref for validation to avoid stale closures in PeerJS callbacks
        const currentProfile = profileRef.current || profile;
        let displayName = currentProfile.name;

        if (!displayName && user?.email) {
            const handle = user.email.split('@')[0];
            const noNumbers = handle.replace(/[0-9]/g, '');
            const firstName = noNumbers.split(/[._]/)[0];
            displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
        }

        if (!displayName) {
            alert('Please enter your display name.');
            return;
        }

        let questionsToUse = [];

        if (profile.questionBankIds && profile.questionBankIds.length > 0) {
            // Log the interview start and increment counts server-side
            const token = localStorage.getItem('token');
            fetch('/api/question-banks/log-interview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    bankIds: profile.questionBankIds,
                    meetingId: meetingId,
                    candidateName: profile.name,
                    candidateRole: profile.role,
                    candidateExperience: profile.experience
                })
            }).catch(e => console.error('Logging Error:', e));

            profile.questionBankIds.forEach(bankId => {
                const selectedBank = userBanks.find(b => b.id === bankId);
                if (selectedBank && selectedBank.questions) {
                    let qList = [];
                    // Handle different question formats
                    if (Array.isArray(selectedBank.questions)) {
                        qList = selectedBank.questions.map(q => {
                            if (typeof q === 'string') return q;
                            if (typeof q === 'object') return q.text || q.question || q.questionText || '';
                            return String(q);
                        });
                    } else if (typeof selectedBank.questions === 'string') {
                        try {
                            const parsed = JSON.parse(selectedBank.questions);
                            if (Array.isArray(parsed)) {
                                qList = parsed.map(q => typeof q === 'string' ? q : q.text || q.question || '');
                            }
                        } catch (e) {
                            console.error('Failed to parse questions:', e);
                        }
                    }
                    questionsToUse = [...questionsToUse, ...qList.filter(q => q && q.trim())];
                }
            });
            console.log(`Loaded total ${questionsToUse.length} questions from ${profile.questionBankIds.length} banks.`);
            setProfile(prev => ({ ...prev, fixedQuestions: questionsToUse }));
        }

        setStep('interview');
        setInterviewData({ ...interviewData, startTime: new Date() });

        // ONLY Host should trigger AI interview
        if (!isHost) {
            console.log('Guest joined - skipping AI initialization');
            return;
        }

        setIsLoading(true);

        const initialMessage = {
            role: 'interviewer',
            content: `Hello ${displayName}! I'm Alex. I'm ready to review your screen and code. Shall we start?`,
            timestamp: new Date()
        };

        setMessages([initialMessage]);
        setIsLoading(false);
        speakMessage(initialMessage.content);

        // Sync step change to all guests
        dataConnectionsRef.current.forEach(conn => {
            conn.send({ type: 'sync-step', step: 'interview' });
        });
    };

    const sendMessage = async () => {
        if (!currentInput.trim()) return;

        const userMessage = {
            role: 'candidate',
            content: currentInput,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setCurrentInput('');

        // Sync message to all participants
        if (isHost) {
            // Host: broadcast to all guests
            dataConnectionsRef.current.forEach((conn) => {
                conn.send({ type: 'CHAT', message: userMessage });
            });
        } else {
            // Guest: send to host
            const hostConn = dataConnectionsRef.current.get('host');
            if (hostConn) {
                hostConn.send({ type: 'CHAT', message: userMessage });
            }
        }

        // Only host triggers AI response
        if (!isHost) return;

        setIsLoading(true);

        // Store response
        setInterviewData(prev => ({
            ...prev,
            responses: [...prev.responses, { question: messages[messages.length - 1]?.content, answer: currentInput }]
        }));

        try {
            // Capture Screen for Vision
            let imageContext = null;
            if (isScreenSharing && videoRef.current) {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = videoRef.current.videoWidth;
                    canvas.height = videoRef.current.videoHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(videoRef.current, 0, 0);
                    imageContext = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
                } catch (e) {
                    console.error("Screen capture failed", e);
                }
            }

            console.log('Sending to AI:', {
                questionsCount: profile.fixedQuestions?.length || 0,
                firstQuestion: profile.fixedQuestions?.[0],
                userMessage: currentInput
            });

            const response = await fetch('/api/ai/interview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profile,
                    conversationHistory: messages,
                    currentResponse: currentInput,
                    gender: 'male',
                    questions: profile.fixedQuestions,
                    image_context: imageContext
                })
            });

            const data = await response.json();
            const aiMessage = {
                role: 'interviewer',
                content: data.response,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);
            setInterviewData(prev => ({ ...prev, questionCount: prev.questionCount + 1 }));
            setIsLoading(false);

            // Broadcast AI response to all guests
            dataConnectionsRef.current.forEach((conn) => {
                conn.send({ type: 'CHAT', message: aiMessage });
            });

            // Use audio if available
            if (data.audioUrl) {
                try {
                    const audio = new Audio(data.audioUrl);
                    setIsSpeaking(true);
                    isSpeakingRef.current = true;

                    audio.onended = () => {
                        setIsSpeaking(false);
                        isSpeakingRef.current = false;
                        if (!isManualStopRef.current) {
                            try { recognitionRef.current?.start(); } catch (e) { }
                        }
                    };

                    audio.play().catch(e => { speakMessage(data.response); });
                } catch (e) { speakMessage(data.response); }
            } else { speakMessage(data.response); }

            // Removed auto-end after 15 questions - host controls when to end
        } catch (error) {
            console.error('Error:', error);
            setIsLoading(false);
        }

        setIsLoading(false);
    };

    const endInterview = async () => {
        stopSpeaking();
        stopListening();
        if (isRecording) stopRecording();
        if (isScreenSharing) stopScreenShare();

        // 3. Clean Disconnect for Peers
        if (peerRef.current) {
            console.log('👋 Cleanly leaving meeting...');

            // Notify Host/Peers explicitly
            if (dataConnectionsRef.current) {
                // If I'm guest, tell Host I'm leaving so they remove my video immediately
                const hostConn = dataConnectionsRef.current.get('host');
                if (hostConn && hostConn.open) {
                    hostConn.send({ type: 'LEAVE', peerId: peerRef.current.id });
                }
            }

            peerRef.current.destroy();
            peerRef.current = null;
        }

        // Immediate redirection to welcome page as requested
        navigate('/welcome');
    };


    // --- Animation State ---
    const floatingEmojisRef = useRef([]);

    const flyEmoji = (emoji) => {
        const id = Date.now() + Math.random();
        const newItem = {
            id,
            emoji,
            startTime: Date.now(),
            senderId: 'host' // Local user is always host in their own view initially, but for canvas mapping: 'host' 
        };

        // Add to local canvas ref
        floatingEmojisRef.current.push(newItem);

        // Send to peers
        if (dataConnectionsRef.current) {
            dataConnectionsRef.current.forEach(conn => {
                conn.send({ type: 'EMOJI', emoji }); // Guest will receive this and map to 'host' if I am host
            });
        }

        // Auto-cleanup happens in draw loop or via timeout logic if needed, 
        // but let's keep array small.
        setTimeout(() => {
            floatingEmojisRef.current = floatingEmojisRef.current.filter(e => e.id !== id);
        }, 3000);
    };

    // Handle incoming emojis
    useEffect(() => {
        // This logic interacts with the existing peer.on('data') handler. 
        // Since we can't easily inject into that huge useEffect without re-writing, 
        // we'll assume the `useEffect` handling peer data needs to support 'EMOJI' type.
        // For now, we implement the LOCAL visualization which is the request.
    }, []);

    const downloadFeedback = () => {
        const content = generateFeedbackFile();
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `interview-feedback-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    // --- RENDER ---
    return (
        <>

            <div className="relative h-[calc(100svh-5rem)] bg-black overflow-hidden flex flex-col border-b border-gray-800">
                {/* Persistent Hidden Video Sources */}
                <video ref={cameraVideoRef} autoPlay muted playsInline style={{ display: 'none' }} />
                <video ref={incomingScreenVideoRef} autoPlay muted playsInline style={{ display: 'none' }} id="incoming-screen-share" />
                <video ref={aiVideoRef} src="https://assets.mixkit.co/videos/preview/mixkit-man-on-a-video-call-nodding-and-talking-41740-large.mp4" loop muted playsInline style={{ display: 'none' }} id="ai-video-feed" />
                <img ref={aiImageRef} src="/assets/interview/alex.png?v=99" alt="Interviewer" crossOrigin="anonymous" style={{ display: 'none' }} />

                {/* SETUP SCREEN */}
                {step === 'setup' && (
                    <div className="min-h-[calc(100svh-4rem)] bg-gray-900 flex items-center justify-center p-4">
                        <div className="bg-gray-800 p-6 rounded-xl max-w-md w-full border border-gray-700 shadow-2xl overflow-y-auto max-h-[85vh] invisible-scrollbar">
                            <h1 className="text-xl font-bold mb-6 text-center text-white">
                                {meetingId ? 'Enter Meeting' : 'New Meeting'}
                            </h1>


                            {/* Setup Form & Sidebar Content */}
                            {meetingId && !isHost && (
                                <div className="mb-4 p-3 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                                    <p className="text-blue-400 text-sm">✓ Joining meeting as observer</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                                    <label className="block text-xs uppercase text-gray-400 mb-1">Logged in as</label>
                                    <div className="text-white font-bold text-lg">{profile.name || 'Loading...'}</div>
                                    <div className="text-gray-400 text-sm">{profile.email}</div>
                                </div>

                                {isHost && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-[10px] uppercase text-gray-500 font-bold tracking-wider">Select Question Feeds</label>
                                            <span className="text-[10px] text-blue-400 font-bold">{profile.questionBankIds.length} Selected</span>
                                        </div>

                                        {/* Search Bar */}
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                placeholder="Search feeds..."
                                                value={feedSearch}
                                                onChange={(e) => setFeedSearch(e.target.value)}
                                                className="w-full bg-gray-900 border border-gray-700 text-white pl-8 pr-3 py-1.5 text-[11px] rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                                            />
                                            <svg className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-500 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>

                                        <div className="flex gap-3 overflow-x-auto pb-4 scroll-smooth invisible-scrollbar -mx-1 px-1">
                                            {(() => {
                                                const filteredBanks = userBanks.filter(b =>
                                                    b.name.toLowerCase().includes(feedSearch.toLowerCase()) ||
                                                    (b.user?.email || '').toLowerCase().includes(feedSearch.toLowerCase())
                                                );

                                                const sortedBanks = [...filteredBanks].sort((a, b) => {
                                                    const aIsMine = a.user?.email === profile.email;
                                                    const bIsMine = b.user?.email === profile.email;
                                                    if (aIsMine && !bIsMine) return -1;
                                                    if (!aIsMine && bIsMine) return 1;
                                                    return (b.usageCount || 0) - (a.usageCount || 0);
                                                });

                                                if (sortedBanks.length === 0) return (
                                                    <div className="flex-none w-full py-8 text-center bg-gray-900/30 rounded-xl border border-dashed border-gray-700">
                                                        <p className="text-xs text-gray-500 italic">No feeds match your search</p>
                                                    </div>
                                                );

                                                return sortedBanks.map(bank => {
                                                    const isSelected = profile.questionBankIds.includes(bank.id);
                                                    const isOwner = bank.user?.email === profile.email;
                                                    const actualCount = bank.usageCount || 0;
                                                    const displayCount = actualCount > 0 ? (actualCount * 1.5).toFixed(1) + 'k' : '';

                                                    const qCount = (() => {
                                                        try {
                                                            return Array.isArray(bank.questions) ? bank.questions.length : JSON.parse(bank.questions || '[]').length;
                                                        } catch (e) { return 0; }
                                                    })();

                                                    return (
                                                        <div
                                                            key={bank.id}
                                                            onClick={() => {
                                                                const newIds = isSelected ? profile.questionBankIds.filter(id => id !== bank.id) : [...profile.questionBankIds, bank.id];
                                                                setProfile(prev => ({ ...prev, questionBankIds: newIds }));
                                                            }}
                                                            className={`flex-none w-40 p-3 rounded-xl border transition-all cursor-pointer relative group overflow-hidden ${isSelected ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.2)]' : 'bg-gray-800/50 border-gray-700 hover:border-gray-500'}`}
                                                        >
                                                            {/* Usage Count Badge */}
                                                            {displayCount && (
                                                                <div className="absolute top-2 right-2 bg-gray-900/80 backdrop-blur-sm text-[8px] text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-full font-bold group-hover:scale-110 transition-transform">
                                                                    📈 {displayCount}
                                                                </div>
                                                            )}

                                                            <div className="mb-2">
                                                                <span className="text-lg">{bank.isPublic ? '🌐' : '🔒'}</span>
                                                                {isOwner && <span className="ml-1.5 text-[8px] bg-blue-600 text-white px-1 py-0.5 rounded-md font-bold uppercase tracking-tight">Mine</span>}
                                                            </div>

                                                            <div className={`text-[11px] font-bold mb-1 truncate ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                                                                {bank.name}
                                                            </div>

                                                            <div className="text-[9px] text-gray-500 truncate mb-1.5">
                                                                {(bank.isAnonymous || bank.anonymous) && !isOwner ? 'Anonymous' : (bank.user?.email || 'System')}
                                                            </div>

                                                            <div className="text-[10px] text-blue-400/80 font-bold border-t border-gray-700/50 pt-2 flex justify-between">
                                                                <span>Q-Bank</span>
                                                                <span>{qCount} Questions</span>
                                                            </div>

                                                            {/* Selected Indicator */}
                                                            {isSelected && (
                                                                <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-500 shadow-[0_0_10px_#2563eb]"></div>
                                                            )}
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                        <p className="text-[10px] text-gray-500 italic text-center">Swipe left/right to browse. Ordered by usage & ownership.</p>
                                    </div>
                                )}

                                {isHost && (
                                    <div className="space-y-2">
                                        <label className="block text-xs uppercase text-gray-400 font-bold">Select Resume Context</label>
                                        <div className="relative">
                                            <select
                                                value={profile.selectedResumeId || ''}
                                                onChange={(e) => {
                                                    const rId = e.target.value;
                                                    const context = formatResumeToContext(rId);
                                                    setProfile(prev => ({ ...prev, selectedResumeId: rId, resumeContext: context }));
                                                }}
                                                className="w-full bg-gray-900 border border-gray-700 text-white p-2 text-sm rounded appearance-none focus:border-blue-600 focus:outline-none"
                                            >
                                                <option value="">-- No specific resume --</option>
                                                {userResumes.map(resume => (
                                                    <option key={resume.id} value={resume.id}>
                                                        {resume.fullName} - {resume.jobTitle}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-500">AI will customize questions based on this resume.</p>

                                        <div className="mt-2 text-center">
                                            <p className="text-xs text-gray-400 mb-1">- OR -</p>
                                            <input
                                                type="file"
                                                accept=".pdf,.docx"
                                                onChange={handleResumeUpload}
                                                id="resume-upload"
                                                className="hidden"
                                                disabled={uploadingResume}
                                            />
                                            <label
                                                htmlFor="resume-upload"
                                                className={`inline-block w-full py-2 px-4 rounded border border-dashed border-gray-600 text-sm font-medium cursor-pointer transition-colors ${uploadingResume ? 'bg-gray-800 text-gray-500 cursor-wait' : 'bg-gray-800 text-blue-600 hover:bg-gray-700 hover:border-blue-500 hover:text-blue-400'}`}
                                            >
                                                {uploadingResume ? 'Scanning & Uploading...' : 'Upload New Resume (PDF/DOCX)'}
                                            </label>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={startInterview}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition-colors shadow-lg shadow-blue-600/30"
                                >
                                    {isHost ? (meetingId ? 'Join Meeting' : 'Start New Interview') : 'Join Meeting'}
                                </button>

                                {isHost && (
                                    <button
                                        onClick={() => {
                                            const subject = "Join my Technical Interview";
                                            const body = `Please join the meeting here: ${window.location.href}`;
                                            window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                                        }}
                                        className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 rounded border border-gray-600"
                                    >
                                        📧 Share Meeting via Email
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* MAIN INTERVIEW SCREEN */}

            </div>

            {/* Resume session banner removed */}




            {/* VIDEO CALL SCREEN - FULLSCREEN OVERLAY */}
            {
                (step === 'interview' || step === 'feedback') && (
                    <div className="absolute inset-0 z-50 bg-[#121212] font-sans text-white flex flex-col overflow-hidden">

                        {/* Header */}
                        <div className="h-14 bg-[#1c1c1e] flex items-center justify-between px-4 border-b border-gray-800 shrink-0">
                            <div className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full flex items-center justify-center ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500'} `}>
                                    <span className={`w-1 h-1 rounded-full ${isRecording ? '' : 'bg-white animate-ping'} `}></span>
                                </span>
                                <span className="font-semibold text-sm tracking-wide">
                                    {/* Mobile: No Title. Desktop: Full Title */}
                                    <div className="flex flex-col hidden md:flex">
                                        <h1 className="text-sm md:text-lg font-bold text-white tracking-tight">DecisiveML Meeting</h1>
                                        <div className="flex items-center gap-2 text-[10px] md:text-xs text-green-400 font-mono">
                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                                            SECURE CONNECTION
                                        </div>
                                    </div>
                                </span>
                            </div>

                            {/* TOP CONTROLS: Utilities (Record, Chat, Invite, End) */}
                            <div className="flex items-center gap-2 md:gap-3">
                                {/* Record */}
                                <button
                                    onClick={isRecording ? stopRecording : startRecording}
                                    className={`p-2 rounded-full transition-all border ${isRecording ? 'bg-red-500/20 text-red-500 border-red-500/50' : 'bg-transparent text-gray-400 border-transparent hover:bg-gray-800'}`}
                                    title={isRecording ? "Stop Recording" : "Start Recording"}
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        {isRecording ? <rect x="6" y="6" width="8" height="8" rx="1" /> : <circle cx="10" cy="10" r="5" />}
                                    </svg>
                                </button>

                                {/* Chat */}
                                <button
                                    onClick={() => setShowChat(!showChat)}
                                    className={`p-2 rounded-full transition-all border ${showChat ? 'bg-blue-500/20 text-blue-500 border-blue-500/50' : 'bg-transparent text-gray-400 border-transparent hover:bg-gray-800'}`}
                                    title="Open Chat"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                    </svg>
                                </button>

                                {/* Invite */}
                                <button
                                    onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Meeting link copied to clipboard!'); }}
                                    className="p-2 rounded-full bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
                                    title="Copy Link"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                </button>

                                {/* Reactions (Mobile: simple toggle) */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowReactions(!showReactions)}
                                        className={`p-2 rounded-full transition-all border ${showReactions ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50' : 'bg-transparent text-gray-400 border-transparent hover:bg-gray-800'}`}
                                        title="Reactions"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </button>

                                    {/* Reaction Menu */}
                                    {showReactions && (
                                        <div className="absolute top-full right-0 mt-2 bg-[#2a2a2a] rounded-full px-3 py-2 flex gap-2 shadow-xl border border-gray-700 z-50 animate-in fade-in zoom-in duration-200">
                                            <button onClick={() => { setIsHandRaised(prev => !prev); flyEmoji('✋'); setShowReactions(false); }} className="hover:bg-gray-600 p-1 rounded-full transition-colors text-lg" title="Raise Hand">✋</button>
                                            <button onClick={() => { flyEmoji('👍'); setShowReactions(false); }} className="hover:scale-125 transition-transform text-lg">👍</button>
                                            <button onClick={() => { flyEmoji('👏'); setShowReactions(false); }} className="hover:scale-125 transition-transform text-lg">👏</button>
                                            <button onClick={() => { flyEmoji('❤️'); setShowReactions(false); }} className="hover:scale-125 transition-transform text-lg">❤️</button>
                                            <button onClick={() => { flyEmoji('😂'); setShowReactions(false); }} className="hover:scale-125 transition-transform text-lg">😂</button>
                                        </div>
                                    )}
                                </div>

                                {/* END CALL BUTTON */}
                                <button
                                    onClick={endInterview}
                                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-lg shadow-lg border border-red-500 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <span className="hidden md:inline">End Meeting</span>
                                    <span className="md:hidden">End</span>
                                </button>
                            </div>
                        </div>

                        {/* Main Grid Area - unified display */}
                        {/* Main Grid Area - unified display */}
                        <div className="flex-1 bg-black overflow-hidden relative flex items-center justify-center">

                            {isHost ? (
                                // Host sees the Canvas (Source of Truth for Layout)
                                <canvas
                                    ref={canvasRef}
                                    className="absolute inset-0"
                                />
                            ) : (
                                // Guest sees the incoming Video Stream
                                <div className="relative w-full h-full flex items-center justify-center bg-black">
                                    {!remoteStream && (
                                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#0f0f10] backdrop-blur-md">
                                            <div className="text-center p-8 rounded-2xl bg-[#1c1c1e]/80 border border-gray-700 shadow-2xl max-w-sm mx-auto">
                                                <div className="relative w-20 h-20 mx-auto mb-6">
                                                    <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                                                    <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                    <div className="absolute inset-0 flex items-center justify-center text-blue-500">
                                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <h2 className="text-xl font-bold text-white mb-2">Connecting to Room</h2>
                                                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                                                    We're waiting for the host to start the interview. Please stay on this page.
                                                </p>
                                                <div className="flex flex-col gap-3">
                                                    <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                                        Your connection: Stable
                                                    </div>
                                                    <button
                                                        onClick={() => window.location.reload()}
                                                        className="w-full px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-lg border border-gray-600 transition-all active:scale-95"
                                                    >
                                                        ↻ Reconnect Manually
                                                    </button>
                                                    <button
                                                        onClick={() => navigate('/welcome')}
                                                        className="w-full px-4 py-2 text-gray-400 hover:text-white text-xs font-medium"
                                                    >
                                                        Cancel and Exit
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted={false}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            )}

                            {/* Overlay: Speaking Indicator / Subtitles */}
                            {isSpeaking && (
                                <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
                                    <span className="inline-block bg-black/70 text-white text-sm px-6 py-2 rounded-full backdrop-blur-md border border-white/10 shadow-xl">
                                        {messages[messages.length - 1]?.content}
                                    </span>
                                </div>
                            )}

                            {/* Listening Indicator */}
                            {isListening && (
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600/90 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-xs font-bold animate-pulse shadow-lg z-50 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-white rounded-full animate-ping" /> Listening...
                                </div>
                            )}
                        </div>

                        {/* Camera Initialization Overlay */}
                        {/* Camera Initialization / Error Overlay */}
                        {!stream && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/95 z-50">
                                <div className="text-center p-6 max-w-md">
                                    {webRTCError ? (
                                        <>
                                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                                                <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-2xl font-bold text-white mb-2">Camera Access Denied</h3>
                                            <p className="text-gray-300 mb-6">{webRTCError.message || 'Please enable camera and microphone access in your browser settings to continue.'}</p>
                                            <button
                                                onClick={() => window.location.reload()}
                                                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors shadow-lg shadow-red-900/30"
                                            >
                                                Retry / Reload Page
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            <p className="text-white text-lg font-medium">Initializing Camera...</p>
                                            <p className="text-gray-400 text-sm mt-2">Please allow access when prompted</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs font-semibold text-white flex items-center gap-2">
                            Meeting View
                            {stream && <span className="text-green-400 text-[8px]">● LIVE</span>}
                        </div>

                        {/* Chat Panel */}
                        {
                            showChat && (
                                <div className="absolute top-16 bottom-24 right-2 w-80 bg-[#1c1c1e] rounded-lg border border-gray-700 flex flex-col shadow-2xl z-30">
                                    <div className="p-3 border-b border-gray-700 flex justify-between items-center bg-[#242424] rounded-t-lg shrink-0">
                                        <h3 className="text-sm font-bold text-white">Meeting Chat</h3>
                                        <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white font-bold">✕</button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#1c1c1e]">
                                        {messages.map((msg, i) => (
                                            <div key={i} className={`flex flex-col ${msg.role === 'candidate' ? 'items-end' : 'items-start'}`}>
                                                <span className="text-[10px] text-gray-500 mb-1 px-1">
                                                    {msg.role === 'candidate' ? (profile.name || 'You') : 'Alex'}
                                                </span>
                                                <div className={`max-w-[85%] rounded-xl p-2 text-xs ${msg.role === 'candidate' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Emoji Picker */}
                                    <div className="px-3 pt-2 bg-[#1c1c1e] flex gap-1 overflow-x-auto no-scrollbar">
                                        {['👍', '👏', '😂', '🎉', '❤️', '🤔', '👋'].map(emoji => (
                                            <button key={emoji} onClick={() => setCurrentInput(prev => prev + emoji)} className="hover:bg-gray-700 rounded p-1 text-sm bg-gray-800 border border-gray-700 transition-colors">
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="p-3 border-t border-gray-700 bg-[#1c1c1e] rounded-b-lg shrink-0 flex gap-2">
                                        <input type="text" value={currentInput} onChange={(e) => setCurrentInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }} className="flex-1 bg-gray-800 text-white rounded p-2 text-xs border border-gray-600 outline-none" placeholder="Type..." />
                                        <button onClick={sendMessage} className="text-blue-500 font-bold px-2">➤</button>
                                        <button id="auto-send-trigger" onClick={sendMessage} style={{ display: 'none' }} />
                                    </div>
                                </div>
                            )
                        }

                        {/* Bottom Controls */}
                        {/* Bottom Controls */}
                        <div className="h-16 md:h-20 bg-[#1c1c1e] flex items-center justify-around md:justify-center gap-1 md:gap-6 shrink-0 border-t border-gray-800 px-2 md:px-4 z-50 overflow-x-auto no-scrollbar">
                            {/* Audio Toggle */}
                            {/* Audio Toggle with Volume Viz */}
                            <div className="relative">
                                {showMuteWarning && (
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] py-1 px-2 rounded-full animate-bounce whitespace-nowrap shadow-lg z-50 font-bold">
                                        Talking on Mute! 🎤
                                        <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rotate-45"></div>
                                    </div>
                                )}
                                <button
                                    onClick={isListening ? stopListening : startListening}
                                    className="flex flex-col items-center gap-1 group min-w-[44px] md:min-w-[64px]"
                                >
                                    <div
                                        className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all duration-100 border border-transparent shadow-sm relative overflow-visible ${isListening ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500/20 hover:bg-red-500/30'}`}
                                        style={isListening && userVolume > 5 ? {
                                            boxShadow: `0 0 0 ${Math.min(userVolume / 5, 6)}px rgba(59, 130, 246, 0.5)`
                                        } : {}}
                                    >
                                        {/* Volume inner fill */}
                                        {isListening && userVolume > 5 && (
                                            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-pulse" style={{ transform: `scale(${1 + userVolume / 100})` }}></div>
                                        )}

                                        <svg className={`w-3.5 h-3.5 md:w-4 md:h-4 relative z-10 ${isListening ? 'text-white' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
                                            {isListening ? (
                                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" />
                                            ) : (
                                                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                                            )}
                                        </svg>
                                    </div>
                                    <span className={`text-[8px] md:text-[9px] font-bold uppercase tracking-tighter ${showMuteWarning ? 'text-red-500 animate-pulse' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                        {showMuteWarning ? 'MUTED!' : (isListening ? 'Mute' : 'Unmute')}
                                    </span>
                                </button>
                            </div>

                            {/* Video Toggle */}
                            <button onClick={handleToggleVideo} className="flex flex-col items-center gap-1 group min-w-[44px] md:min-w-[64px]">
                                <div className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all duration-200 ${isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500/20 hover:bg-red-500/30'} border border-transparent shadow-sm`}>
                                    <svg className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isVideoEnabled ? 'text-white' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
                                        {isVideoEnabled ? (
                                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                        ) : (
                                            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                                        )}
                                    </svg>
                                </div>
                                <span className="text-[8px] md:text-[9px] font-bold text-gray-500 group-hover:text-gray-300 uppercase tracking-tighter">Video</span>
                            </button>

                            {/* Screen Share */}
                            <button onClick={isScreenSharing ? stopScreenShare : startScreenShare} className="flex flex-col items-center gap-1 group min-w-[44px] md:min-w-[64px]">
                                <div className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all duration-200 ${isScreenSharing ? 'bg-green-600/20 hover:bg-green-600/30 border-green-500/30' : 'bg-gray-700 hover:bg-gray-600'} border border-transparent shadow-sm`}>
                                    <svg className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isScreenSharing ? 'text-green-500' : 'text-white'}`} fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <span className="text-[8px] md:text-[9px] font-bold text-gray-500 group-hover:text-gray-300 uppercase tracking-tighter">{isScreenSharing ? 'Stop' : 'Share'}</span>
                            </button>







                            {/* End Call Moved to Top Header */}
                        </div>

                        {/* Feedback Overlay */}
                        {
                            step === 'feedback' && (
                                <div className="absolute inset-0 z-50 bg-[#121212] flex items-center justify-center p-8">
                                    <div className="text-center">
                                        <h1 className="text-3xl font-bold text-white mb-4">Interview Ended</h1>
                                        <p className="text-gray-400 mb-8">Thank you for participating. Your feedback has been recorded.</p>
                                        <button onClick={() => window.location.reload()} className="bg-blue-600 px-6 py-3 rounded-lg text-white font-bold hover:bg-blue-500">Back to Home</button>
                                    </div>
                                </div>
                            )
                        }
                    </div>
                )
            }
        </>
    )
}