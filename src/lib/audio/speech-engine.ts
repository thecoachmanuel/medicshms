/**
 * Medics AI Speech Engine
 * Uses Browser-native Web Speech API for free STT.
 */

export class SpeechEngine {
  private recognition: any;
  private audioContext?: AudioContext;
  private analyser?: AnalyserNode;
  private silenceTimer?: any;
  private silenceDelay: number = 1500; // 1.5 seconds

  private synthesis?: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.synthesis = window.speechSynthesis;

      // Pre-load voices
      if (this.synthesis) {
        this.synthesis.onvoiceschanged = () => {
          this.voices = this.synthesis?.getVoices() || [];
        };
      }

      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: any) => {
          this.resetSilenceTimer();
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('');
          
          if (this.onResultCallback) {
            this.onResultCallback(transcript);
          }
        };

        this.recognition.onend = () => {
          if (this.isListening) {
             try { this.recognition.start(); } catch (e) {}
          } else {
            if (this.onStatusChange) this.onStatusChange('idle');
          }
        };

        this.recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          this.stop();
        };
      }
    }
  }

  private resetSilenceTimer() {
    clearTimeout(this.silenceTimer);
    this.silenceTimer = setTimeout(() => {
      if (this.isListening) {
        this.stop();
      }
    }, this.silenceDelay);
  }

  public async start(onResult: (text: string) => void, onStatus: (status: 'idle' | 'listening' | 'processing' | 'speaking') => void) {
    if (!this.recognition) return;
    
    // Stop any current speech before listening
    this.cancelSpeech();

    this.onResultCallback = onResult;
    this.onStatusChange = onStatus;

    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = this.audioContext.createMediaStreamSource(stream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        source.connect(this.analyser);
      }

      this.recognition.start();
      this.isListening = true;
      this.onStatusChange('listening');
      this.resetSilenceTimer();
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  }

  public speak(text: string, onEnd?: () => void) {
    if (!this.synthesis) return;

    this.cancelSpeech();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Prefer professional voices (Google, Microsoft, etc.)
    const preferredVoice = this.voices.find(v => 
      (v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Natural')) && 
      v.lang.startsWith('en')
    ) || this.voices.find(v => v.lang.startsWith('en'));

    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      if (this.onStatusChange) this.onStatusChange('speaking');
    };

    utterance.onend = () => {
      if (this.onStatusChange) this.onStatusChange('idle');
      if (onEnd) onEnd();
    };

    this.synthesis.speak(utterance);
  }

  public cancelSpeech() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  public getVolumeData(): number {
    if (!this.analyser) return 0;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((prev, curr) => prev + curr, 0) / dataArray.length;
    return average / 128; // Normalized 0-1
  }

  public stop() {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.recognition.stop();
      clearTimeout(this.silenceTimer);
    }
  }
}

export const speechEngine = new SpeechEngine();
