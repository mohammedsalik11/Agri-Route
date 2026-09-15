'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

interface ReadAloudProps {
  text: string;
  label?: string;
  className?: string;
}

export const ReadAloud: React.FC<ReadAloudProps> = ({ text, label, className = '' }) => {
  const { language } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'kn' ? 'kn-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.9; // Slightly slower for rural accessibility

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <button
      type="button"
      onClick={handleSpeak}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
        isPlaying
          ? 'bg-field-green text-white shadow-xs animate-pulse'
          : 'bg-paper text-ink hover:bg-field-green/10 hover:text-field-green border border-border'
      } ${className}`}
      title={isPlaying ? 'Stop reading' : `Read aloud: ${label || text.slice(0, 30)}`}
      aria-label="Read aloud audio support"
    >
      {isPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      <span>{isPlaying ? 'Stop' : 'Listen'}</span>
    </button>
  );
};
