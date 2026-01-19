import { useState } from 'react';

export default function VirtualInterviewerConfig({ profile, setProfile }) {
    const [playingVoiceId, setPlayingVoiceId] = useState(null);

    const voiceOptions = {
        us: {
            name: 'United States',
            flag: '🇺🇸',
            male: [
                { id: 'en-US-male-1', name: 'James (Professional)', description: 'Deep, authoritative voice' },
                { id: 'en-US-male-2', name: 'Michael (Friendly)', description: 'Warm, conversational tone' },
                { id: 'en-US-male-3', name: 'David (Technical)', description: 'Clear, analytical voice' }
            ],
            female: [
                { id: 'en-US-female-1', name: 'Sarah (Professional)', description: 'Clear, confident voice' },
                { id: 'en-US-female-2', name: 'Emily (Friendly)', description: 'Warm, encouraging tone' },
                { id: 'en-US-female-3', name: 'Jessica (Executive)', description: 'Sophisticated, polished voice' }
            ]
        },
        uk: {
            name: 'United Kingdom',
            flag: '🇬🇧',
            male: [
                { id: 'en-GB-male-1', name: 'Oliver (British)', description: 'Refined British accent' },
                { id: 'en-GB-male-2', name: 'Harry (London)', description: 'Modern London accent' },
                { id: 'en-GB-male-3', name: 'George (Oxford)', description: 'Classic Oxford accent' }
            ],
            female: [
                { id: 'en-GB-female-1', name: 'Emma (British)', description: 'Elegant British accent' },
                { id: 'en-GB-female-2', name: 'Sophie (London)', description: 'Contemporary London accent' },
                { id: 'en-GB-female-3', name: 'Charlotte (RP)', description: 'Received Pronunciation' }
            ]
        },
        au: {
            name: 'Australia',
            flag: '🇦🇺',
            male: [
                { id: 'en-AU-male-1', name: 'Jack (Australian)', description: 'Friendly Aussie accent' },
                { id: 'en-AU-male-2', name: 'Liam (Sydney)', description: 'Sydney accent' }
            ],
            female: [
                { id: 'en-AU-female-1', name: 'Olivia (Australian)', description: 'Warm Aussie accent' },
                { id: 'en-AU-female-2', name: 'Chloe (Melbourne)', description: 'Melbourne accent' }
            ]
        },
        in: {
            name: 'India',
            flag: '🇮🇳',
            male: [
                { id: 'en-IN-male-1', name: 'Raj (Indian)', description: 'Clear Indian English' },
                { id: 'en-IN-male-2', name: 'Arjun (Mumbai)', description: 'Mumbai accent' }
            ],
            female: [
                { id: 'en-IN-female-1', name: 'Priya (Indian)', description: 'Professional Indian English' },
                { id: 'en-IN-female-2', name: 'Ananya (Delhi)', description: 'Delhi accent' }
            ]
        },
        ca: {
            name: 'Canada',
            flag: '🇨🇦',
            male: [
                { id: 'en-CA-male-1', name: 'Ryan (Canadian)', description: 'Friendly Canadian accent' }
            ],
            female: [
                { id: 'en-CA-female-1', name: 'Sophia (Canadian)', description: 'Clear Canadian accent' }
            ]
        }
    };

    const currentVoices = voiceOptions[profile.interviewerAccent]?.[profile.interviewerGender] || [];
    const currentAccent = voiceOptions[profile.interviewerAccent];

    const playVoicePreview = (voiceId) => {
        if ('speechSynthesis' in window) {
            // Stop any currently playing audio
            speechSynthesis.cancel();

            if (playingVoiceId === voiceId) {
                setPlayingVoiceId(null);
                return;
            }

            const utterance = new SpeechSynthesisUtterance(
                "Hello! I'm your AI interviewer. I'll be conducting your interview today. Let's begin with a brief introduction about yourself."
            );

            // Map our voice IDs to browser voices
            const voices = speechSynthesis.getVoices();
            const selectedVoice = voices.find(v =>
                v.lang.startsWith(profile.interviewerAccent === 'us' ? 'en-US' :
                    profile.interviewerAccent === 'uk' ? 'en-GB' :
                        profile.interviewerAccent === 'au' ? 'en-AU' :
                            profile.interviewerAccent === 'in' ? 'en-IN' :
                                'en-CA')
            );

            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }

            utterance.rate = 0.9;
            utterance.pitch = profile.interviewerGender === 'male' ? 0.8 : 1.1;
            utterance.onend = () => setPlayingVoiceId(null);
            utterance.onerror = () => setPlayingVoiceId(null);

            setPlayingVoiceId(voiceId);
            speechSynthesis.speak(utterance);
        }
    };

    return (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-2xl">
                    🎙️
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50">
                        Virtual AI Interviewer
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Customize your interviewer's voice and accent
                    </p>
                </div>
            </div>

            {/* Enable Voice Toggle */}
            <div className="mb-6 p-4 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800">
                <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🔊</span>
                        <div>
                            <div className="font-semibold text-gray-900 dark:text-gray-50">
                                Enable Voice Interview
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Hear questions spoken by AI interviewer
                            </div>
                        </div>
                    </div>
                    <input
                        type="checkbox"
                        checked={profile.enableVoice}
                        onChange={(e) => setProfile({ ...profile, enableVoice: e.target.checked })}
                        className="w-12 h-6 rounded-full appearance-none cursor-pointer transition-all duration-300 relative
                                 checked:bg-gradient-to-r checked:from-purple-600 checked:to-pink-600
                                 bg-gray-300 dark:bg-gray-700
                                 before:content-[''] before:absolute before:w-5 before:h-5 before:rounded-full before:bg-white
                                 before:top-0.5 before:left-0.5 before:transition-all before:duration-300
                                 checked:before:translate-x-6"
                    />
                </label>
            </div>

            {profile.enableVoice && (
                <>
                    {/* Gender Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Interviewer Gender
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setProfile({
                                    ...profile,
                                    interviewerGender: 'female',
                                    interviewerVoice: voiceOptions[profile.interviewerAccent].female[0].id
                                })}
                                className={`p-4 rounded-xl border-2 transition-all ${profile.interviewerGender === 'female'
                                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30'
                                    : 'border-gray-200 dark:border-gray-800 hover:border-purple-300'
                                    }`}
                            >
                                <div className="text-4xl mb-2">👩‍💼</div>
                                <div className="font-semibold text-gray-900 dark:text-gray-50">Female</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setProfile({
                                    ...profile,
                                    interviewerGender: 'male',
                                    interviewerVoice: voiceOptions[profile.interviewerAccent].male[0].id
                                })}
                                className={`p-4 rounded-xl border-2 transition-all ${profile.interviewerGender === 'male'
                                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30'
                                    : 'border-gray-200 dark:border-gray-800 hover:border-purple-300'
                                    }`}
                            >
                                <div className="text-4xl mb-2">👨‍💼</div>
                                <div className="font-semibold text-gray-900 dark:text-gray-50">Male</div>
                            </button>
                        </div>
                    </div>

                    {/* Accent/Country Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Accent / Region
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {Object.entries(voiceOptions).map(([code, accent]) => (
                                <button
                                    key={code}
                                    type="button"
                                    onClick={() => setProfile({
                                        ...profile,
                                        interviewerAccent: code,
                                        interviewerVoice: accent[profile.interviewerGender][0].id
                                    })}
                                    className={`p-3 rounded-xl border-2 transition-all text-left ${profile.interviewerAccent === code
                                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30'
                                        : 'border-gray-200 dark:border-gray-800 hover:border-purple-300'
                                        }`}
                                >
                                    <div className="text-2xl mb-1">{accent.flag}</div>
                                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                                        {accent.name}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Voice Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Voice Style ({currentAccent?.flag} {currentAccent?.name})
                        </label>
                        <div className="space-y-3">
                            {currentVoices.map((voice) => (
                                <button
                                    key={voice.id}
                                    type="button"
                                    onClick={() => setProfile({ ...profile, interviewerVoice: voice.id })}
                                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${profile.interviewerVoice === voice.id
                                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30'
                                        : 'border-gray-200 dark:border-gray-800 hover:border-purple-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="font-semibold text-gray-900 dark:text-gray-50 mb-1">
                                                {voice.name}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {voice.description}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                playVoicePreview(voice.id);
                                            }}
                                            className="ml-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all"
                                        >
                                            {playingVoiceId === voice.id ? '⏹️ Stop' : '▶️ Preview'}
                                        </button>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                        <div className="flex gap-3">
                            <span className="text-xl">💡</span>
                            <div className="text-sm text-blue-900 dark:text-blue-200">
                                <strong>Pro Tip:</strong> The AI interviewer will speak questions aloud and adapt their speaking style based on your selected accent. You can respond via text or voice.
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
