import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { AudioItem } from '../types';
import { generateSpeech, decode, decodeAudioData } from '../services/geminiService';

interface AudioContextType {
    isPlaying: boolean;
    currentItem: AudioItem | null;
    queue: AudioItem[];
    isAudioReady: boolean; // True if AudioContext is running and unlocked
    playText: (text: string, language: 'he' | 'en', id?: string, priority?: 'normal' | 'high') => Promise<void>;
    queueText: (text: string, language: 'he' | 'en', id?: string) => Promise<void>;
    stop: () => void;
    pause: () => void;
    resume: () => void;
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

    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const isLockedRef = useRef(true); // Browsers lock audio context by default

    // Initialize AudioContext
    const initAudio = () => {
        if (!audioContextRef.current) {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioCtx();

            // Create main gain node
            gainNodeRef.current = audioContextRef.current!.createGain();
            gainNodeRef.current.connect(audioContextRef.current!.destination);

            // Check state
            if (audioContextRef.current!.state === 'running') {
                isLockedRef.current = false;
                setIsAudioReady(true);
            }
        }
    };

    const unlockAudio = async () => {
        if (!audioContextRef.current) initAudio();

        if (audioContextRef.current?.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        // Play silent buffer to fully unlock iOS/mobile
        if (isLockedRef.current) {
            const buffer = audioContextRef.current!.createBuffer(1, 1, 22050);
            const source = audioContextRef.current!.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContextRef.current!.destination);
            source.start(0);
            isLockedRef.current = false;
        }

        setIsAudioReady(true);
    };

    const stop = useCallback(() => {
        if (sourceRef.current) {
            try {
                sourceRef.current.stop();
                sourceRef.current.disconnect();
            } catch (e) { /* ignore if already stopped */ }
            sourceRef.current = null;
        }
        setIsPlaying(false);
        setCurrentItem(null);
        setQueue([]); // Clear queue? Or keep it? Usually stop means stop everything.
    }, []);

    const pause = useCallback(() => {
        if (audioContextRef.current?.state === 'running') {
            audioContextRef.current.suspend();
            setIsPlaying(false);
        }
    }, []);

    const resume = useCallback(() => {
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
            setIsPlaying(true);
        }
    }, []);

    const playBuffer = async (buffer: AudioBuffer) => {
        if (!audioContextRef.current) return;

        // Stop current if any
        if (sourceRef.current) {
            try { sourceRef.current.stop(); } catch (e) { }
        }

        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(gainNodeRef.current!);

        source.onended = () => {
            setIsPlaying(false);
            setCurrentItem(null);
            processQueue(); // Try next
        };

        sourceRef.current = source;
        source.start(0);
        setIsPlaying(true);
    };

    const processQueue = useCallback(async () => {
        // This needs to be careful about state closures, but we use refs for audio context
        setQueue(prev => {
            if (prev.length === 0) return prev;

            const nextItem = prev[0];
            const remaining = prev.slice(1);

            // If we are already playing and this is normal priority, waitForEnd handled by onEnded
            // But here we are called usually when nothing is playing or we want to force start

            // We'll handle the actual play outside the state setter to avoid side effects in setter
            return remaining;
        });
    }, []);

    // Watch queue and playing state to auto-play next
    useEffect(() => {
        if (!isPlaying && !currentItem && queue.length > 0 && isAudioReady) {
            const next = queue[0];
            setQueue(q => q.slice(1));
            playItem(next);
        }
    }, [isPlaying, currentItem, queue, isAudioReady]);

    const playItem = async (item: AudioItem) => {
        setCurrentItem(item);

        try {
            let buffer = item.audioBuffer;

            if (!buffer) {
                // Generate on the fly
                const base64Data = await generateSpeech(item.text, item.language);
                if (!base64Data) throw new Error("Failed to generate speech");

                const audioData = decode(base64Data);
                if (!audioContextRef.current) initAudio();

                buffer = await decodeAudioData(
                    audioData,
                    audioContextRef.current!,
                    24000,
                    1 // Mono is fine for speech
                );
            }

            await playBuffer(buffer);

        } catch (err) {
            console.error("Audio playback error:", err);
            setIsPlaying(false);
            setCurrentItem(null);
        }
    };

    const playText = async (text: string, language: 'he' | 'en', id?: string, priority: 'normal' | 'high' = 'normal') => {
        const newItem: AudioItem = {
            id: id || `audio-${Date.now()}`,
            text,
            language,
            priority,
            status: 'pending'
        };

        if (priority === 'high') {
            // Interrupt immediately
            stop();
            // Wait a tiny bit for cleanup?
            setTimeout(() => {
                setQueue(prev => [newItem, ...prev]); // Put at front? Or just play?
                // Actually just play it
                playItem(newItem);
            }, 50);
        } else {
            // Add to queue
            setQueue(prev => [...prev, newItem]);
        }
    };

    const queueText = async (text: string, language: 'he' | 'en', id?: string) => {
        // Pre-fetch logic could go here
        const newItem: AudioItem = {
            id: id || `audio-${Date.now()}`,
            text,
            language,
            priority: 'normal',
            status: 'loading'
        };

        setQueue(prev => [...prev, newItem]);

        // Optimistic pre-fetch in background
        generateSpeech(text, language).then(async (base64) => {
            if (!base64 || !audioContextRef.current) return;
            const audioData = decode(base64);
            const buffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);

            // Update item in queue with buffer
            setQueue(prev => prev.map(i => i.id === newItem.id ? { ...i, audioBuffer: buffer, status: 'ready' } : i));
        }).catch(e => console.warn("Pre-fetch failed", e));
    };

    return (
        <AudioContext.Provider value={{
            isPlaying,
            currentItem,
            queue,
            isAudioReady,
            playText,
            queueText,
            stop,
            pause,
            resume,
            unlockAudio
        }}>
            {children}
        </AudioContext.Provider>
    );
};
