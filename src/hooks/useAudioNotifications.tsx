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

  const playRemoveFromCartSound = useCallback(() => {
    // Descending minor chime for removal
    createChordSound([659.25, 523.25, 415.30], 0.25); // E5, C5, G#4
  }, [createChordSound]);

  const playOrderSuccessSound = useCallback(() => {
    // Success fanfare - major chord progression
    setTimeout(() => createChordSound([523.25, 659.25, 783.99], 0.4), 0); // C5, E5, G5
    setTimeout(() => createChordSound([587.33, 739.99, 880.00], 0.4), 200); // D5, F#5, A5
    setTimeout(() => createChordSound([523.25, 659.25, 783.99, 1046.50], 0.6), 400); // C5, E5, G5, C6
  }, [createChordSound]);

  const playOrderCancelSound = useCallback(() => {
    // Soft descending tone for cancellation
    createChordSound([440.00, 349.23, 293.66], 0.4); // A4, F4, D4
  }, [createChordSound]);

  const playAdminActionSound = useCallback(() => {
    // Professional admin action sound - clean bell tones
    createChordSound([880.00, 1108.73], 0.2); // A5, C#6
    setTimeout(() => createChordSound([1174.66, 1318.51], 0.2), 100); // D6, E6
  }, [createChordSound]);

  const playCreateSound = useCallback(() => {
    // Creation sound - ascending progression
    setTimeout(() => createBeepSound(587.33, 0.15, 'sine'), 0); // D5
    setTimeout(() => createBeepSound(739.99, 0.15, 'sine'), 75); // F#5
    setTimeout(() => createBeepSound(880.00, 0.15, 'sine'), 150); // A5
    setTimeout(() => createBeepSound(1174.66, 0.2, 'sine'), 225); // D6
  }, [createBeepSound]);

  const playDeleteSound = useCallback(() => {
    // Soft delete sound - not harsh
    createBeepSound(392.00, 0.2, 'sine'); // G4
    setTimeout(() => createBeepSound(329.63, 0.2, 'sine'), 100); // E4
  }, [createBeepSound]);

  const playUpdateSound = useCallback(() => {
    // Quick update confirmation
    createBeepSound(1046.50, 0.1, 'sine'); // C6
    setTimeout(() => createBeepSound(1318.51, 0.1, 'sine'), 50); // E6
  }, [createBeepSound]);

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
    playRemoveFromCartSound,
    playOrderSuccessSound,
    playOrderCancelSound,
    playAdminActionSound,
    playCreateSound,
    playDeleteSound,
    playUpdateSound,
    playErrorSound,
    playNotificationSound,
    setEnabled: (newEnabled: boolean) => options.enabled = newEnabled,
  };
};