import { useCallback, useRef } from 'react';

interface AudioNotificationOptions {
  volume?: number;
  enabled?: boolean;
}

export const useAudioNotifications = (options: AudioNotificationOptions = {}) => {
  const { volume = 0.5, enabled = true } = options;
  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const createBeepSound = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!enabled) return;

    const audioContext = initAudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }, [enabled, volume, initAudioContext]);

  const createChordSound = useCallback((frequencies: number[], duration: number) => {
    if (!enabled) return;

    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        createBeepSound(freq, duration * 0.8, 'sine');
      }, index * 50);
    });
  }, [enabled, createBeepSound]);

  const playAddToCartSound = useCallback(() => {
    // Pleasant ascending chime
    createChordSound([523.25, 659.25, 783.99], 0.3); // C5, E5, G5
  }, [createChordSound]);

  const playOrderSuccessSound = useCallback(() => {
    // Success fanfare - major chord progression
    setTimeout(() => createChordSound([523.25, 659.25, 783.99], 0.4), 0); // C5, E5, G5
    setTimeout(() => createChordSound([587.33, 739.99, 880.00], 0.4), 200); // D5, F#5, A5
    setTimeout(() => createChordSound([523.25, 659.25, 783.99, 1046.50], 0.6), 400); // C5, E5, G5, C6
  }, [createChordSound]);

  const playErrorSound = useCallback(() => {
    // Low error tone
    createBeepSound(220, 0.3, 'sawtooth');
    setTimeout(() => createBeepSound(196, 0.3, 'sawtooth'), 150);
  }, [createBeepSound]);

  const playNotificationSound = useCallback(() => {
    // Simple notification beep
    createBeepSound(800, 0.2, 'sine');
    setTimeout(() => createBeepSound(1000, 0.2, 'sine'), 100);
  }, [createBeepSound]);

  return {
    playAddToCartSound,
    playOrderSuccessSound,
    playErrorSound,
    playNotificationSound,
    setEnabled: (newEnabled: boolean) => options.enabled = newEnabled,
  };
};