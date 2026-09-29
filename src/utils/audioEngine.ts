// Audio Engine using Web Audio API for synthetic Sultan beats and audio preview

class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private currentTrackId: string | null = null;
  private beatInterval: number | null = null;
  private step: number = 0;
  private audioElement: HTMLAudioElement | null = null;
  private audioSourceNode: MediaElementAudioSourceNode | null = null;
  private volume: number = 0.6;
  private isMuted: boolean = false;

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

      this.analyser.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    if (this.audioElement) {
      this.audioElement.volume = this.isMuted ? 0 : this.volume;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.setVolume(this.volume);
    return this.isMuted;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getFrequencyData(array: Uint8Array): void {
    if (this.analyser) {
      // Cast to satisfy TS DOM type requirement between ArrayBuffer and ArrayBufferLike
      (this.analyser as unknown as { getByteFrequencyData: (arr: Uint8Array) => void }).getByteFrequencyData(array);
    }
  }

  // Play real audio file (from custom upload or URL)
  public playAudioFile(urlOrBlob: string, onEnded?: () => void) {
    this.stop();

    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.preload = 'auto';
    }

    this.audioElement.src = urlOrBlob;
    this.audioElement.volume = this.isMuted ? 0 : this.volume;
    this.audioElement.onended = () => {
      this.isPlaying = false;
      if (onEnded) onEnded();
    };

    const playPromise = this.audioElement.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isPlaying = true;
        })
        .catch((err) => {
          console.warn('Playback error:', err);
        });
    }
    this.isPlaying = true;
  }

  public getAudioElement(): HTMLAudioElement | null {
    return this.audioElement;
  }

  public getCurrentPlaybackTime(): number {
    if (this.audioElement && this.isPlaying) {
      return this.audioElement.currentTime;
    }
    return 0;
  }

  public seek(seconds: number) {
    if (this.audioElement) {
      this.audioElement.currentTime = seconds;
    }
  }

  // Play custom synthesized Sultan beat based on track specs
  public playSyntheticBeat(trackId: string, tempo: number, style: string) {
    this.init();
    this.stop();

    if (!this.ctx || !this.analyser) return;

    this.currentTrackId = trackId;
    this.isPlaying = true;
    this.step = 0;

    const intervalMs = (60 / tempo / 4) * 1000; // 16th note steps

    this.beatInterval = window.setInterval(() => {
      if (!this.isPlaying || !this.ctx) return;
      this.triggerStep(this.step, style);
      this.step = (this.step + 1) % 16;
    }, intervalMs);
  }

  private triggerStep(step: number, style: string) {
    if (!this.ctx || !this.analyser) return;

    const t = this.ctx.currentTime;

    // KICK / 808
    if (
      step === 0 ||
      (style === 'drill' && (step === 6 || step === 10)) ||
      (style === 'trap' && step === 8) ||
      (style === 'energy' && step % 4 === 0) ||
      (style === 'anthem' && (step === 6 || step === 12))
    ) {
      this.playKick(t, style === 'heavy' ? 45 : style === 'anthem' ? 50 : 55, style === 'heavy' ? 0.35 : 0.25);
    }

    // SNARE / CLAP
    if (step === 4 || step === 12) {
      this.playSnare(t, style === 'drill' || style === 'anthem' ? 'clap' : 'snare');
    }

    // HI-HATS
    if (step % 2 === 0 || ((style === 'heavy' || style === 'drill') && (step === 14 || step === 15))) {
      this.playHiHat(t, step % 4 === 2);
    }

    // MELODIC BASSLINE / SYNTH CHORD
    if (step === 0 || step === 8) {
      const freq = style === 'chill' ? 146.83 : style === 'energy' ? 174.61 : style === 'anthem' ? 130.81 : 110.0;
      this.playSynthNote(t, freq, 0.4);
    }
  }

  private playKick(time: number, startFreq: number, duration: number) {
    if (!this.ctx || !this.analyser) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(startFreq + 90, time);
    osc.frequency.exponentialRampToValueAtTime(startFreq, time + 0.08);

    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.analyser);

    osc.start(time);
    osc.stop(time + duration);
  }

  private playSnare(time: number, type: 'snare' | 'clap') {
    if (!this.ctx || !this.analyser) return;

    // White noise burst
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = type === 'clap' ? 'bandpass' : 'highpass';
    filter.frequency.setValueAtTime(type === 'clap' ? 1200 : 1000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.analyser);

    whiteNoise.start(time);
  }

  private playHiHat(time: number, accent: boolean) {
    if (!this.ctx || !this.analyser) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'highpass' as unknown as OscillatorType;
    osc.frequency.setValueAtTime(10000, time);

    gain.gain.setValueAtTime(accent ? 0.2 : 0.09, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);

    osc.connect(gain);
    gain.connect(this.analyser);

    osc.start(time);
    osc.stop(time + 0.04);
  }

  private playSynthNote(time: number, freq: number, duration: number) {
    if (!this.ctx || !this.analyser) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(700, time);
    filter.frequency.exponentialRampToValueAtTime(250, time + duration);

    gain.gain.setValueAtTime(0.22, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.analyser);

    osc.start(time);
    osc.stop(time + duration);
  }

  public stop() {
    this.isPlaying = false;
    this.currentTrackId = null;

    if (this.beatInterval) {
      clearInterval(this.beatInterval);
      this.beatInterval = null;
    }

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
  }

  public pause() {
    this.isPlaying = false;
    if (this.beatInterval) {
      clearInterval(this.beatInterval);
      this.beatInterval = null;
    }
    if (this.audioElement) {
      this.audioElement.pause();
    }
  }

  public resume() {
    if (this.audioElement && this.audioElement.src) {
      this.audioElement.play().catch(() => {});
      this.isPlaying = true;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentTrackId(): string | null {
    return this.currentTrackId;
  }

  // SOUND EFFECTS
  public playClickSound() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.045);
  }

  public playJumpSound() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.13);
  }

  public playRoyalFanfare() {
    this.init();
    if (!this.ctx) return;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = this.ctx.currentTime + idx * 0.12;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.36);
    });
  }

  public playNotificationPing() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5 chime

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  public playCrashSound() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.26);
  }
}

export const audioEngine = new AudioEngine();
