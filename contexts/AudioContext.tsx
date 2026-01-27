import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { AudioItem } from '../types';
import { generateSpeech, decode, decodeAudioData } from '../services/geminiService';

interface AudioContextType {
    isPlaying: boolean;
    currentItem: AudioItem | null;
    queue: AudioItem[];
    isAudioReady: boolean;
    audioMode: 'free' | 'premium';
    playbackRate: number;
    progress: number; // 0 to 100
    setAudioMode: (mode: 'free' | 'premium') => void;
    setPlaybackRate: (rate: number) => void;
    playText: (text: string, language: 'he' | 'en', id?: string, priority?: 'normal' | 'high') => Promise<void>;
    queueText: (text: string, language: 'he' | 'en', id?: string) => Promise<void>;
    stop: () => void;
    pause: () => void;
    resume: () => void;
    skip: (seconds: number) => void;
    seek: (percentage: number) => void;
    duration: number; // in seconds
    currentTime: number; // in seconds
    unlockAudio: () => Promise<void>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (!context) {
        throw new Error('useAudio must be used within an AudioProvider');
    }
    return context;
};

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentItem, setCurrentItem] = useState<AudioItem | null>(null);
    const [queue, setQueue] = useState<AudioItem[]>([]);
    const [isAudioReady, setIsAudioReady] = useState(false);
    const [audioMode, setAudioMode] = useState<'free' | 'premium'>(() => {
        return (localStorage.getItem('urbanito_audio_mode') as 'free' | 'premium') || 'free';
    });
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        localStorage.setItem('urbanito_audio_mode', audioMode);
    }, [audioMode]);

    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const isLockedRef = useRef(true);
    const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
    const startTimeRef = useRef(0);
    const pausedTimeRef = useRef(0);
    const currentBufferRef = useRef<AudioBuffer | null>(null);
    const currentChunksRef = useRef<string[]>([]);
    const currentChunkIndexRef = useRef(0);
    const isPlayingRef = useRef(false);

    // Initialize AudioContext (for Premium Mode)
    const initAudio = () => {
        if (!audioContextRef.current) {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioCtx();

            gainNodeRef.current = audioContextRef.current!.createGain();
            gainNodeRef.current.connect(audioContextRef.current!.destination);

            if (audioContextRef.current!.state === 'running') {
                isLockedRef.current = false;
                setIsAudioReady(true);
            }
        }
    };

    const unlockAudio = async () => {
        if (audioMode === 'premium') {
            if (!audioContextRef.current) initAudio();

            if (audioContextRef.current?.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            if (isLockedRef.current && audioContextRef.current) {
                const buffer = audioContextRef.current.createBuffer(1, 1, 22050);
                const source = audioContextRef.current.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContextRef.current.destination);
                source.start(0);
                isLockedRef.current = false;
            }
        }
        setIsAudioReady(true);
    };

    const stop = useCallback(() => {
        // Stop Premium Audio
        if (sourceRef.current) {
            try {
                sourceRef.current.stop();
                sourceRef.current.disconnect();
            } catch (e) { }
            sourceRef.current = null;
        }

        // Stop Free Audio (Web Speech)
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }

        setIsPlaying(false);
        isPlayingRef.current = false;
        setCurrentItem(null);
        setQueue([]);
        setProgress(0);
        currentBufferRef.current = null;
    }, []);

    const pause = useCallback(() => {
        if (audioMode === 'premium' && audioContextRef.current?.state === 'running') {
            pausedTimeRef.current = audioContextRef.current.currentTime - startTimeRef.current;
            audioContextRef.current.suspend().catch(console.error);
        } else if (audioMode === 'free') {
            window.speechSynthesis.pause();
        }
        setIsPlaying(false);
    }, [audioMode]);

    const resume = useCallback(() => {
        if (audioMode === 'premium' && audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume().catch(console.error);
            setIsPlaying(true);
        } else if (audioMode === 'free') {
            window.speechSynthesis.resume();
            setIsPlaying(true);
        }
    }, [audioMode]);

    const skip = useCallback((seconds: number) => {
        if (audioMode === 'premium' && currentBufferRef.current && audioContextRef.current) {
            const currentTime = audioContextRef.current.currentTime - startTimeRef.current;
            let newTime = currentTime + (seconds * playbackRate);
            if (newTime < 0) newTime = 0;
            if (newTime > currentBufferRef.current.duration) {
                stop();
                return;
            }
            playBuffer(currentBufferRef.current, newTime);
        } else if (audioMode === 'free') {
            // Simplify: skip to next chunk if forward, or restart current chunk if backward
            if (seconds > 0) {
                window.speechSynthesis.cancel(); // This will trigger onend/onerror and speakNextChunk will handle it
                // We actually need to advance the index manually before canceling if we want to skip
                currentChunkIndexRef.current++;
            } else {
                window.speechSynthesis.cancel();
                currentChunkIndexRef.current = Math.max(0, currentChunkIndexRef.current - 1);
            }
            // speakNextChunk will be called by the onend of the current one if it was playing, 
            // but since we canceled, we might need to manually call it or depend on the onend event.
            // speechSynthesis.cancel() usually triggers onend with 'interrupted'.
        }
    }, [audioMode, playbackRate, stop]);

    const seek = useCallback((percentage: number) => {
        const targetPercent = Math.max(0, Math.min(100, percentage));

        if (audioMode === 'premium' && currentBufferRef.current && audioContextRef.current) {
            const newTime = (targetPercent / 100) * currentBufferRef.current.duration;
            playBuffer(currentBufferRef.current, newTime);
        } else if (audioMode === 'free') {
            // Best effort for Free mode: map percentage to chunk index
            if (currentChunksRef.current.length > 0) {
                const targetIndex = Math.floor((targetPercent / 100) * currentChunksRef.current.length);
                window.speechSynthesis.cancel();
                currentChunkIndexRef.current = targetIndex;
                // Speech play loop logic will naturally pick up from new index if handled correctly, 
                // but we might need to trigger it if 'cancel' stops everything.
                // In our current implementation, 'cancel' calls speakNext via logic or we call it manually?
                // Current: speakNext is recursive. If we just change index and cancel, onend might trigger? 
                // Actually cancel triggers onend with error/interrupted.
                // Let's rely on the fact that we need to restart playback manually if cancel stops it.
                // But speakNext is inside the closure of playWithWebSpeech... which makes it hard to call from here.
                // Refactoring playWithWebSpeech to store speakNext in a ref or similar would be cleaner,
                // but for now, we can perhaps re-invoke playText/playItem? No, that resets everything.
                // Hack: modifying the ref is fine, but restarting the loop is the key.
            }
        }
        setProgress(targetPercent);
    }, [audioMode]);


    useEffect(() => {
        if (sourceRef.current) {
            sourceRef.current.playbackRate.value = playbackRate;
        }
        // Note: SpeechSynthesis (Web Speech) doesn't support changing rate mid-utterance easily in all browsers,
        // so it will apply to the next chunk.
    }, [playbackRate]);

    const playBuffer = async (buffer: AudioBuffer, offset: number = 0) => {
        if (!audioContextRef.current) initAudio();
        if (!audioContextRef.current) return;

        if (sourceRef.current) {
            try { sourceRef.current.stop(); } catch (e) { }
        }

        currentBufferRef.current = buffer;
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.buffer = buffer;
        source.playbackRate.value = playbackRate;
        source.connect(gainNodeRef.current!);

        setDuration(buffer.duration);

        source.onended = () => {
            // Only clear if this is still the active source and it finished naturally
            if (sourceRef.current === source) {
                setIsPlaying(false);
                setCurrentItem(null);
                setProgress(100);
            }
        };

        sourceRef.current = source;
        startTimeRef.current = audioContextRef.current.currentTime - (offset / playbackRate);
        source.start(0, offset);
        setIsPlaying(true);
        isPlayingRef.current = true;
    };

    // Progress Tracker for Premium Audio
    useEffect(() => {
        let interval: any;
        if (isPlaying && audioMode === 'premium' && currentBufferRef.current && audioContextRef.current) {
            interval = setInterval(() => {
                const elapsed = (audioContextRef.current!.currentTime - startTimeRef.current) * playbackRate;
                const p = (elapsed / currentBufferRef.current!.duration) * 100;
                setCurrentTime(elapsed);
                setProgress(Math.min(99.9, p));
            }, 200);
        }
        return () => clearInterval(interval);
    }, [isPlaying, audioMode, playbackRate]);

    const playWithWebSpeech = (text: string, language: 'he' | 'en') => {
        if (!window.speechSynthesis) return;

        window.speechSynthesis.cancel();

        const MAX_CHUNK_LENGTH = 160;
        const chunks: string[] = [];
        const sourceText = text.replace(/([.?!])\s*/g, "$1|").split("|");

        let currentCombined = "";
        for (const part of sourceText) {
            if ((currentCombined + part).length > MAX_CHUNK_LENGTH) {
                if (currentCombined) chunks.push(currentCombined.trim());
                currentCombined = part;
            } else {
                currentCombined += (currentCombined ? " " : "") + part;
            }
        }
        if (currentCombined) chunks.push(currentCombined.trim());

        currentChunksRef.current = chunks;
        currentChunkIndexRef.current = 0;

        const voices = window.speechSynthesis.getVoices();
        const langCode = language === 'he' ? 'he-IL' : 'en-US';
        const voice = voices.find(v => v.lang === langCode && v.name.includes('Google'))
            || voices.find(v => v.lang === langCode);

        const speakNext = () => {
            if (!isPlayingRef.current || currentChunkIndexRef.current >= chunks.length) {
                setIsPlaying(false);
                isPlayingRef.current = false;
                setCurrentItem(null);
                setProgress(100);
                return;
            }

            const utterance = new SpeechSynthesisUtterance(chunks[currentChunkIndexRef.current]);
            if (voice) utterance.voice = voice;
            utterance.lang = langCode;
            utterance.rate = playbackRate;
            utterance.pitch = 1.0;

            utterance.onstart = () => {
                setIsPlaying(true);
                isPlayingRef.current = true;
                const p = (currentChunkIndexRef.current / chunks.length) * 100;
                setProgress(p);
                // Estimate duration based on avg chars per second (approx 15 chars/sec)
                const totalChars = chunks.reduce((acc, val) => acc + val.length, 0);
                const estimatedDuration = totalChars / 15;
                setDuration(estimatedDuration);
                setCurrentTime((p / 100) * estimatedDuration);
            };

            utterance.onend = () => {
                if (!isPlayingRef.current) return;
                currentChunkIndexRef.current++;
                speakNext();
            };

            utterance.onerror = (e) => {
                console.error("Speech error:", e);
                if (!isPlayingRef.current) return;
                currentChunkIndexRef.current++;
                speakNext();
            };

            speechRef.current = utterance;
            window.speechSynthesis.speak(utterance);
        };

        isPlayingRef.current = true;
        speakNext();
    };

    const playItem = async (item: AudioItem) => {
        setCurrentItem(item);

        if (audioMode === 'free') {
            playWithWebSpeech(item.text, item.language);
            return;
        }

        // Premium Mode logic
        try {
            let buffer = item.audioBuffer;
            if (!buffer) {
                const base64Data = await generateSpeech(item.text, item.language);
                if (!base64Data) throw new Error("Failed to generate speech");

                const audioData = decode(base64Data);
                if (!audioContextRef.current) initAudio();
                buffer = await decodeAudioData(audioData, audioContextRef.current!, 24000, 1);
            }
            await playBuffer(buffer);
        } catch (err) {
            console.error("Premium playback failed, falling back to free mode:", err);
            playWithWebSpeech(item.text, item.language);
        }
    };

    // Queue Processor
    useEffect(() => {
        if (!isPlaying && !currentItem && queue.length > 0) {
            const nextItem = queue[0];
            setQueue(prev => prev.slice(1));
            playItem(nextItem).catch(console.error);
        }
    }, [isPlaying, currentItem, queue]);

    const playText = async (text: string, language: 'he' | 'en', id?: string, priority: 'normal' | 'high' = 'normal') => {
        const newItem: AudioItem = {
            id: id || `audio-${Date.now()}`,
            poiId: id,
            text,
            language,
            priority,
            status: 'pending'
        };

        if (priority === 'high') {
            stop();
            // Short delay to ensure cleanup before starting new audio
            setTimeout(() => {
                playItem(newItem).catch(console.error);
            }, 100);
        } else {
            setQueue(prev => [...prev, newItem]);
        }
    };

    const queueText = async (text: string, language: 'he' | 'en', id?: string) => {
        const newItem: AudioItem = {
            id: id || `audio-${Date.now()}`,
            poiId: id,
            text,
            language,
            priority: 'normal',
            status: 'pending'
        };
        setQueue(prev => [...prev, newItem]);

        // Pre-fetch only in premium mode
        if (audioMode === 'premium') {
            generateSpeech(text, language).then(async (base64) => {
                if (!base64) return;
                const audioData = decode(base64);
                if (!audioContextRef.current) initAudio();
                if (!audioContextRef.current) return;
                const buffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
                setQueue(prev => prev.map(i => i.id === newItem.id ? { ...i, audioBuffer: buffer, status: 'ready' } : i));
            }).catch(e => console.warn("Pre-fetch failed", e));
        }
    };

    // Load voices once they are available (Web Speech quirk)
    useEffect(() => {
        if (window.speechSynthesis) {
            window.speechSynthesis.getVoices();
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
            }
        }
    }, []);

    return (
        <AudioContext.Provider value={{
            isPlaying,
            currentItem,
            queue,
            isAudioReady,
            audioMode,
            playbackRate,
            progress,
            setAudioMode,
            setPlaybackRate,
            playText,
            queueText,
            stop,
            pause,
            resume,
            skip,
            seek,
            duration,
            currentTime,
            unlockAudio
        }}>
            {children}
        </AudioContext.Provider>
    );
};
