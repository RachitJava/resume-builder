import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import VirtualInterviewerConfig from '../components/VirtualInterviewerConfig';


export default function MockInterview() {
    const navigate = useNavigate();
    const [step, setStep] = useState('setup'); // setup, interview, feedback
    const [profile, setProfile] = useState({
        name: '',
        role: '',
        experience: '',
        skills: '',
        interviewType: 'technical',
        customQuestions: '',
        // Virtual Interviewer Settings
        interviewerGender: 'female',
        interviewerVoice: 'en-US-female-1',
        interviewerAccent: 'us',
        interviewerVoice: 'en-US-female-1',
        interviewerAccent: 'us',
        enableVoice: true,
        questionBankId: '',
        fixedQuestions: []
    });
    const [userBanks, setUserBanks] = useState([]);
    const [savedSessions, setSavedSessions] = useState([]);
    const [currentFeedback, setCurrentFeedback] = useState('');
    const [messages, setMessages] = useState([]);
    const [currentInput, setCurrentInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [interviewData, setInterviewData] = useState({
        startTime: null,
        questionCount: 0,
        responses: []
    });

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
        fetchBanks();
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/interview-sessions', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSavedSessions(data);
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
        }
    };
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const recognitionRef = useRef(null);

    // Speech Recognition Setup
    const startListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => {
            setIsListening(false);
        };
        recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript + ' ';
                }
            }
            if (finalTranscript) {
                setCurrentInput(prev => prev + finalTranscript);
            }
        };
        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };

    const stopSpeaking = () => {
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    };

    // Cleanup audio on unmount
    useEffect(() => {
        return () => stopSpeaking();
    }, []);

    const interviewTypes = [
        { id: 'hr', name: 'HR Round', icon: '👔', desc: 'Behavioral & cultural fit' },
        { id: 'technical', name: 'Technical Round', icon: '💻', desc: 'Concepts & architecture' },
        { id: 'coding', name: 'Coding Round', icon: '⌨️', desc: 'Live problem solving' },
        { id: 'technical_coding', name: 'Technical+Coding', icon: '🚀', desc: 'Concepts + Coding' },
        { id: 'mixed', name: 'Mixed Round', icon: '🎯', desc: 'HR + Technical + Coding' }
    ];

    // Text-to-Speech function
    const speakMessage = (text) => {
        if (!profile.enableVoice || !('speechSynthesis' in window)) return;

        // Cancel any ongoing speech
        stopSpeaking();

        const utterance = new SpeechSynthesisUtterance(text);

        // Get available voices
        const voices = speechSynthesis.getVoices();

        // Map accent to language code
        const langMap = {
            'us': 'en-US',
            'uk': 'en-GB',
            'au': 'en-AU',
            'in': 'en-IN',
            'ca': 'en-CA'
        };

        const targetLang = langMap[profile.interviewerAccent] || 'en-US';

        // Find matching voice
        const selectedVoice = voices.find(v =>
            v.lang.startsWith(targetLang) &&
            (profile.interviewerGender === 'female' ? v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman') : v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('man'))
        ) || voices.find(v => v.lang.startsWith(targetLang)) || voices[0];

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        // Set voice characteristics
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = profile.interviewerGender === 'male' ? 0.8 : 1.1;
        utterance.volume = 1.0;

        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        setIsSpeaking(true);
        speechSynthesis.speak(utterance);
    };

    const startInterview = async () => {
        if (!profile.name || !profile.role || !profile.experience || !profile.skills) {
            alert('Please fill in all required fields');
            return;
        }

        // Prepare fixed questions if bank is selected
        let updatedProfile = { ...profile };
        if (profile.questionBankId) {
            const bank = userBanks.find(b => b.id === profile.questionBankId);
            if (bank) {
                try {
                    const questions = typeof bank.questions === 'string' ? JSON.parse(bank.questions) : bank.questions;
                    updatedProfile.fixedQuestions = questions.map(q => q.question);
                } catch (e) {
                    console.error("Error parsing bank questions", e);
                }
            }
        }
        setProfile(updatedProfile);

        setStep('interview');
        setInterviewData({ ...interviewData, startTime: new Date() });
        setIsLoading(true);

        // Initial interviewer message
        const initialMessage = {
            role: 'interviewer',
            content: `Hello ${profile.name}! I'm your AI interviewer today. Thank you for joining us for the ${profile.role} position.\n\nI see you have ${profile.experience} of experience with skills in ${profile.skills}. This will be a ${interviewTypes.find(t => t.id === profile.interviewType)?.name}.\n\nLet's begin. Could you start by telling me a bit about yourself and your recent work experience?`,
            timestamp: new Date()
        };

        setMessages([initialMessage]);
        setIsLoading(false);

        // Speak the initial message
        speakMessage(initialMessage.content);
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
        setIsLoading(true);

        // Store response
        setInterviewData(prev => ({
            ...prev,
            responses: [...prev.responses, { question: messages[messages.length - 1]?.content, answer: currentInput }]
        }));

        try {
            const response = await fetch('/api/ai/interview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profile,
                    conversationHistory: messages,
                    currentResponse: currentInput
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

            // Speak the interviewer's message
            speakMessage(data.response);

            // Check if interview should end
            if (data.shouldEnd || interviewData.questionCount >= 8) {
                setTimeout(() => endInterview(), 2000);
            }
        } catch (error) {
            console.error('Error:', error);
            const errorMessage = {
                role: 'interviewer',
                content: 'I apologize, there seems to be a technical issue. Let me ask you another question: Can you describe a challenging project you worked on recently?',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        }

        setIsLoading(false);
    };

    const endInterview = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/ai/interview/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profile,
                    conversationHistory: messages,
                    interviewData
                })
            });

            const feedback = await response.json();

            const feedbackMessage = {
                role: 'interviewer',
                content: `Thank you for your time, ${profile.name}. The interview is now complete.\n\n**INTERVIEW FEEDBACK**\n\n${feedback.summary}`,
                timestamp: new Date(),
                isFeedback: true
            };

            setMessages(prev => [...prev, feedbackMessage]);
            setCurrentFeedback(feedback.summary);
            setStep('feedback');
        } catch (error) {
            console.error('Error:', error);
        }
        setIsLoading(false);
    };

    const saveInterview = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/interview-sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    role: profile.role,
                    messages: messages,
                    feedback: currentFeedback
                })
            });

            if (response.ok) {
                alert('Interview saved successfully!');
                fetchSessions();
            }
        } catch (error) {
            console.error('Error saving session:', error);
            alert('Failed to save session');
        }
        setIsLoading(false);
    };

    const deleteSession = async (id) => {
        if (!confirm('Are you sure you want to delete this session?')) return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/interview-sessions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchSessions();
        } catch (error) {
            console.error('Error deleting session:', error);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black py-8">
            <div className="max-w-5xl mx-auto px-4">
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <button
                            onClick={() => navigate('/')}
                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4"
                        >
                            ← Back to Dashboard
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">
                            AI Mock Interview
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Practice with our AI interviewer and get instant feedback
                        </p>
                    </div>
                    {step === 'setup' && (
                        <button
                            onClick={() => setStep('history')}
                            className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium flex items-center gap-2"
                        >
                            <span>📜</span> History
                        </button>
                    )}
                </div>

                {step === 'history' && (
                    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">Interview History</h2>
                            <button onClick={() => setStep('setup')} className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
                                Start New Interview
                            </button>
                        </div>
                        <div className="space-y-4">
                            {savedSessions.length === 0 ? (
                                <p className="text-gray-500">No saved interviews yet.</p>
                            ) : (
                                savedSessions.map(session => (
                                    <div key={session.id} className="border border-gray-200 dark:border-gray-800 p-4 rounded-lg flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-gray-50">{session.role}</h3>
                                            <p className="text-xs text-gray-500">
                                                {new Date(session.createdAt).toLocaleDateString()} at {new Date(session.createdAt).toLocaleTimeString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => deleteSession(session.id)}
                                                className="text-red-500 hover:text-red-700 text-sm"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
                {isSpeaking && (
                    <button
                        onClick={stopSpeaking}
                        className="mt-4 flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-sm font-medium animate-pulse"
                    >
                        <span>🔊 Speaking...</span>
                        <span className="underline">Click to Stop</span>
                    </button>
                )}

                {/* Setup Form */}
                {step === 'setup' && (
                    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-6">Interview Setup</h2>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Your Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={profile.name}
                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                        placeholder="John Doe"
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Target Role <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={profile.role}
                                        onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                                        placeholder="Full Stack Developer"
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Experience <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={profile.experience}
                                        onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                                        placeholder="3 years"
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Key Skills <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={profile.skills}
                                        onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                                        placeholder="Java, React, Spring Boot, PostgreSQL"
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Interview Type <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {interviewTypes.map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => setProfile({ ...profile, interviewType: type.id })}
                                            className={`p-4 border-2 rounded-lg text-left transition-all ${profile.interviewType === type.id
                                                ? 'border-gray-900 dark:border-gray-50 bg-gray-50 dark:bg-gray-900'
                                                : 'border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600'
                                                }`}
                                        >
                                            <div className="text-2xl mb-2">{type.icon}</div>
                                            <div className="font-medium text-gray-900 dark:text-gray-50 text-sm mb-1">
                                                {type.name}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {type.desc}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Use Question Bank (Optional)
                                </label>
                                <select
                                    value={profile.questionBankId}
                                    onChange={(e) => setProfile({ ...profile, questionBankId: e.target.value })}
                                    className="w-full text-gray-900 dark:text-gray-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3"
                                >
                                    <option value="">-- None (AI Generated) --</option>
                                    {userBanks.map(bank => (
                                        <option key={bank.id} value={bank.id}>
                                            📚 {bank.name} ({JSON.parse(bank.questions || '[]').length} Qs)
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Select a question bank to force the AI to ask specific questions from your collection.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Custom Topics (Optional)
                                </label>
                                <textarea
                                    value={profile.customQuestions}
                                    onChange={(e) => setProfile({ ...profile, customQuestions: e.target.value })}
                                    placeholder="E.g., Focus on microservices, system design, or specific technologies..."
                                    rows={3}
                                    className="w-full"
                                />
                            </div>

                            {/* Virtual Interviewer Configuration */}
                            <VirtualInterviewerConfig profile={profile} setProfile={setProfile} />

                            <button
                                onClick={startInterview}
                                className="w-full btn btn-primary py-3 text-base font-semibold"
                            >
                                Start Interview →
                            </button>
                        </div>
                    </div>
                )}

                {/* Interview Chat */}
                {(step === 'interview' || step === 'feedback') && (
                    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden flex flex-col" style={{ height: '70vh' }}>
                        {/* Chat Header */}
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-50">
                                        {interviewTypes.find(t => t.id === profile.interviewType)?.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {profile.role} • {interviewData.questionCount} questions asked
                                    </p>
                                </div>
                                {step === 'interview' && (
                                    <button
                                        onClick={endInterview}
                                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                                    >
                                        End Interview
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.role === 'candidate' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-lg px-4 py-3 ${msg.role === 'candidate'
                                            ? 'bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900'
                                            : msg.isFeedback
                                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-gray-900 dark:text-gray-50'
                                                : 'bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-50'
                                            }`}
                                    >
                                        <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                                        <div className={`text-xs mt-2 ${msg.role === 'candidate' ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {msg.timestamp.toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 dark:bg-gray-900 rounded-lg px-4 py-3">
                                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        {step === 'interview' && (
                            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black">
                                <div className="flex gap-3">
                                    <textarea
                                        value={currentInput}
                                        onChange={(e) => setCurrentInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                sendMessage();
                                            }
                                        }}
                                        placeholder="Type your answer... (Shift+Enter for new line)"
                                        rows={2}
                                        className="flex-1 resize-none"
                                        disabled={isLoading}
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={isLoading || !currentInput.trim()}
                                        className="btn btn-primary px-6 self-end"
                                    >
                                        Send
                                    </button>
                                    <button
                                        onClick={isListening ? stopListening : startListening}
                                        className={`px-4 rounded-lg transition-all self-end h-[42px] ${isListening
                                            ? 'bg-red-100 text-red-600 animate-pulse ring-2 ring-red-400'
                                            : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700'}`}
                                        title={isListening ? "Stop Microphone" : "Start Microphone"}
                                    >
                                        {isListening ? '🛑 Stop' : '🎤'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 'feedback' && (
                            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black flex gap-3">
                                <button
                                    onClick={() => {
                                        setStep('setup');
                                        setMessages([]);
                                        setInterviewData({ startTime: null, questionCount: 0, responses: [] });
                                        setCurrentFeedback('');
                                    }}
                                    className="btn btn-secondary flex-1"
                                >
                                    Start New Interview
                                </button>
                                <button
                                    onClick={saveInterview}
                                    className="btn btn-primary flex-1"
                                    disabled={isLoading}
                                >
                                    Save Results
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
