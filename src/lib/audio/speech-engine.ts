/**
 * Medics AI Speech Engine
 * Uses Browser-native Web Speech API for free STT.
 */

export class SpeechEngine {
  private recognition: any;
  private isListening: boolean = false;
  private onResultCallback?: (text: string) => void;
  private onStatusChange?: (status: 'idle' | 'listening' | 'processing') => void;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('');
          
          if (event.results[0].isFinal && this.onResultCallback) {
            this.onResultCallback(transcript);
          }
        };

        this.recognition.onend = () => {
          this.isListening = false;
          if (this.onStatusChange) this.onStatusChange('idle');
        };

        this.recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          this.isListening = false;
          if (this.onStatusChange) this.onStatusChange('idle');
        };
      }
    }
  }

  public start(onResult: (text: string) => void, onStatus: (status: 'idle' | 'listening' | 'processing') => void) {
    if (!this.recognition) {
       console.error('Speech recognition not supported in this browser');
       return;
    }
    this.onResultCallback = onResult;
    this.onStatusChange = onStatus;
    
    try {
      this.recognition.start();
      this.isListening = true;
      this.onStatusChange('listening');
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  }

  public stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }
}

export const speechEngine = new SpeechEngine();
