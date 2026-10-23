import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SpeechPlayerProps {
  text: string;
  language?: string; // 'en' | 'hi' | 'mr'
  className?: string;
}

export const SpeechPlayer: React.FC<SpeechPlayerProps> = ({
  text,
  language = 'en',
  className = '',
}) => {
  const { t } = useTranslation();
  const [isSupported, setIsSupported] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Stop speech if text changes
  useEffect(() => {
    if (isPlaying) {
      handleStop();
    }
  }, [text]);

  if (!isSupported || !text || text.trim().length === 0) {
    return null;
  }

  const cleanTextForSpeech = (raw: string): string => {
    return raw
      .replace(/[*#_`~>-]/g, ' ')
      .replace(/\[.*?\]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handlePlay = () => {
    if (!window.speechSynthesis) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();

    const cleaned = cleanTextForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(cleaned);
    utteranceRef.current = utterance;

    // Language mapping
    const langCode = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-US';
    utterance.lang = langCode;
    utterance.rate = 0.95; // slightly slower for clearer educational delivery
    utterance.pitch = 1.0;

    // Pick appropriate voice if available
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((v) => v.lang.startsWith(language));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
  };

  const handleStop = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700/60 bg-slate-800/80 text-slate-200 text-xs shadow-sm transition-all ${className}`}
      role="region"
      aria-label="Text to speech player"
    >
      <Volume2 className={`w-3.5 h-3.5 ${isPlaying ? 'text-blue-400 animate-pulse' : 'text-slate-400'}`} />

      {isPlaying ? (
        <button
          onClick={handlePause}
          className="p-1 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
          title={t('common.pause') || 'Pause'}
          aria-label={t('common.pause') || 'Pause'}
        >
          <Pause className="w-3.5 h-3.5" />
        </button>
      ) : (
        <button
          onClick={handlePlay}
          className="p-1 hover:text-white hover:bg-slate-700 rounded-md transition-colors flex items-center gap-1 font-semibold text-[11px]"
          title={isPaused ? (t('common.resume') || 'Resume') : (t('common.readAloud') || 'Listen')}
          aria-label={isPaused ? (t('common.resume') || 'Resume') : (t('common.readAloud') || 'Listen')}
        >
          <Play className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
          <span>{isPaused ? 'Resume' : 'Listen'}</span>
        </button>
      )}

      {(isPlaying || isPaused) && (
        <button
          onClick={handleStop}
          className="p-1 hover:text-rose-400 hover:bg-slate-700 rounded-md transition-colors"
          title={t('common.stop') || 'Stop'}
          aria-label={t('common.stop') || 'Stop'}
        >
          <Square className="w-3 h-3 fill-current" />
        </button>
      )}

      {isPlaying && (
        <span className="flex items-center gap-0.5 ml-1 text-blue-400">
          <span className="w-1 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1 h-3.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </span>
      )}
    </div>
  );
};
