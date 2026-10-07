/**
 * NeextPlay Synthesized Audio Engine (Web Audio API)
 * Zero external asset dependencies, zero 404s, works reliably
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  // Master, SFX and Music volume channels
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  private masterVolume: number = 0.85;
  private sfxVolume: number = 0.85;
  private musicVolume: number = 0.55;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedMaster = localStorage.getItem('neextplay_audio_master_vol');
        if (savedMaster !== null) this.masterVolume = Math.max(0, Math.min(1, parseFloat(savedMaster)));
        const savedSfx = localStorage.getItem('neextplay_audio_sfx_vol');
        if (savedSfx !== null) this.sfxVolume = Math.max(0, Math.min(1, parseFloat(savedSfx)));
        const savedMusic = localStorage.getItem('neextplay_audio_music_vol');
        if (savedMusic !== null) this.musicVolume = Math.max(0, Math.min(1, parseFloat(savedMusic)));
        const savedMute = localStorage.getItem('neextplay_audio_muted');
        if (savedMute !== null) this.isMuted = savedMute === 'true';
      } catch {}
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      // Initialize Gain Bus Hierarchy if not created
      if (!this.masterGain) {
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
        this.musicGain.connect(this.masterGain);
      }
    }
  }

  public getSfxDestination(): AudioNode | null {
    this.initContext();
    return this.sfxGain || this.masterGain || this.ctx?.destination || null;
  }

  public getMusicDestination(): AudioNode | null {
    this.initContext();
    return this.musicGain || this.masterGain || this.ctx?.destination || null;
  }

  public setMasterVolume(val: number) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
    try {
      localStorage.setItem('neextplay_audio_master_vol', this.masterVolume.toString());
    } catch {}
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public setSfxVolume(val: number) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
    try {
      localStorage.setItem('neextplay_audio_sfx_vol', this.sfxVolume.toString());
    } catch {}
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public setMusicVolume(val: number) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }
    try {
      localStorage.setItem('neextplay_audio_music_vol', this.musicVolume.toString());
    } catch {}
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
    try {
      localStorage.setItem('neextplay_audio_muted', this.isMuted.toString());
    } catch {}
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playReelSpin() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // AudioContext unavailable or error
    }
  }

  public playReelStop(reelIndex: number = 0) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const baseFreq = 220 + reelIndex * 40;
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.09);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {}
  }

  public playWin(multiplier: number = 1) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const notes = multiplier >= 10 ? [523.25, 659.25, 783.99, 1046.50] : [440, 554.37, 659.25];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.08);
        osc.stop(this.ctx.currentTime + idx * 0.08 + 0.26);
      });
    } catch {}
  }

  public playBonusTrigger() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const freqs = [392, 523.25, 659.25, 783.99, 1046.5, 1318.51];
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.07);

        gain.gain.setValueAtTime(0.08, this.ctx.currentTime + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.07 + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.07);
        osc.stop(this.ctx.currentTime + idx * 0.07 + 0.31);
      });
    } catch {}
  }

  public playClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);
    } catch {}
  }

  // --- AVIATOR MULTI-LAYER FLIGHT ENGINE SYNTHESIZER ---
  private aviatorOsc: OscillatorNode | null = null;
  private aviatorOsc2: OscillatorNode | null = null;
  private aviatorSubOsc: OscillatorNode | null = null;
  private aviatorGain: GainNode | null = null;
  private aviatorSubGain: GainNode | null = null;
  private aviatorLfo: OscillatorNode | null = null;
  private aviatorLfoGain: GainNode | null = null;
  private aviatorNoiseSource: AudioBufferSourceNode | null = null;
  private aviatorNoiseFilter: BiquadFilterNode | null = null;
  private aviatorNoiseGain: GainNode | null = null;
  private aviatorWhistleOsc: OscillatorNode | null = null;
  private aviatorWhistleGain: GainNode | null = null;
  private aviatorAfterburnerGain: GainNode | null = null;

  // --- TIK TIK MULTIPLIER TICKER ENGINE ---
  private tickerTimer: any = null;
  private tickerMultiplier: number = 1.00;

  public startAviatorTicker() {
    this.stopAviatorTicker();
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    this.tickerMultiplier = 1.00;

    const playTik = () => {
      if (this.isMuted) return;
      this.initContext();
      if (!this.ctx) return;
      const dest = this.getSfxDestination() || this.ctx.destination;
      if (!dest) return;

      try {
        const now = this.ctx.currentTime;
        const logMult = Math.log(Math.max(1, this.tickerMultiplier));
        const baseFreq = Math.min(3600, 2200 + logMult * 520);

        // Component 1: High crisp triangle impulse (10ms)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, now + 0.010);

        gain.gain.setValueAtTime(0.065, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(now);
        osc.stop(now + 0.013);

        // Component 2: Micro click metallic transient (5ms)
        const clickOsc = this.ctx.createOscillator();
        const clickGain = this.ctx.createGain();
        clickOsc.type = 'sine';
        clickOsc.frequency.setValueAtTime(baseFreq * 1.8, now);
        clickGain.gain.setValueAtTime(0.04, now);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.006);

        clickOsc.connect(clickGain);
        clickGain.connect(dest);

        clickOsc.start(now);
        clickOsc.stop(now + 0.007);
      } catch {}
    };

    const scheduleNextTik = () => {
      playTik();
      // Cadence: rhythmic 120ms at takeoff, pacing up to 75ms as multiplier climbs
      const intervalMs = Math.max(75, 120 - Math.log(Math.max(1, this.tickerMultiplier)) * 16);
      this.tickerTimer = setTimeout(scheduleNextTik, intervalMs);
    };

    scheduleNextTik();
  }

  public updateAviatorTickerMultiplier(multiplier: number) {
    this.tickerMultiplier = multiplier;
  }

  public stopAviatorTicker() {
    if (this.tickerTimer) {
      clearTimeout(this.tickerTimer);
      this.tickerTimer = null;
    }
  }

  private createNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds seamless loop
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      // Pink/Brownian filtered noise for aerodynamic wind rush
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.8;
    }
    return buffer;
  }

  public startAviatorEngine() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    this.stopAviatorEngine();

    // Start crisp continuous multiplier tik-tik ticker
    this.startAviatorTicker();

    const dest = this.getSfxDestination() || this.ctx.destination;

    try {
      const now = this.ctx.currentTime;

      // 1. Deep Sub-Bass Aerodynamic Body Rumble (52 Hz fundamental)
      this.aviatorSubOsc = this.ctx.createOscillator();
      this.aviatorSubGain = this.ctx.createGain();
      this.aviatorSubOsc.type = 'sine';
      this.aviatorSubOsc.frequency.setValueAtTime(52, now);
      this.aviatorSubGain.gain.setValueAtTime(0.001, now);
      this.aviatorSubGain.gain.linearRampToValueAtTime(0.045, now + 0.1);
      this.aviatorSubOsc.connect(this.aviatorSubGain);
      this.aviatorSubGain.connect(dest);
      this.aviatorSubOsc.start(now);

      // 2. Core Aviation Turbine Drone (Detuned Sawtooth + Octave Triangle)
      this.aviatorOsc = this.ctx.createOscillator();
      this.aviatorOsc2 = this.ctx.createOscillator();
      this.aviatorGain = this.ctx.createGain();

      this.aviatorOsc.type = 'sawtooth';
      this.aviatorOsc.frequency.setValueAtTime(92, now); // 92 Hz idle flight fundamental

      this.aviatorOsc2.type = 'triangle';
      this.aviatorOsc2.frequency.setValueAtTime(184, now); // Octave body harmonic

      // Lowpass resonant body filter
      const engineFilter = this.ctx.createBiquadFilter();
      engineFilter.type = 'lowpass';
      engineFilter.frequency.setValueAtTime(420, now);
      engineFilter.Q.value = 2.4;

      // Propeller blade flutter LFO (amplitude modulation at blade pass frequency)
      this.aviatorLfo = this.ctx.createOscillator();
      this.aviatorLfoGain = this.ctx.createGain();
      this.aviatorLfo.type = 'sine';
      this.aviatorLfo.frequency.setValueAtTime(22, now); // 22 Hz blade chop
      this.aviatorLfoGain.gain.setValueAtTime(0.04, now);

      this.aviatorGain.gain.setValueAtTime(0.001, now);
      this.aviatorGain.gain.linearRampToValueAtTime(0.055, now + 0.12);

      this.aviatorLfo.connect(this.aviatorGain.gain);
      this.aviatorOsc.connect(engineFilter);
      this.aviatorOsc2.connect(engineFilter);
      engineFilter.connect(this.aviatorGain);
      this.aviatorGain.connect(dest);

      this.aviatorOsc.start(now);
      this.aviatorOsc2.start(now);
      this.aviatorLfo.start(now);

      // 3. Aerodynamic Wind / Slipstream Vortex Noise Layer
      const noiseBuffer = this.createNoiseBuffer();
      if (noiseBuffer) {
        this.aviatorNoiseSource = this.ctx.createBufferSource();
        this.aviatorNoiseSource.buffer = noiseBuffer;
        this.aviatorNoiseSource.loop = true;

        this.aviatorNoiseFilter = this.ctx.createBiquadFilter();
        this.aviatorNoiseFilter.type = 'bandpass';
        this.aviatorNoiseFilter.frequency.setValueAtTime(480, now);
        this.aviatorNoiseFilter.Q.value = 1.6;

        this.aviatorNoiseGain = this.ctx.createGain();
        this.aviatorNoiseGain.gain.setValueAtTime(0.001, now);
        this.aviatorNoiseGain.gain.linearRampToValueAtTime(0.022, now + 0.15);

        this.aviatorNoiseSource.connect(this.aviatorNoiseFilter);
        this.aviatorNoiseFilter.connect(this.aviatorNoiseGain);
        this.aviatorNoiseGain.connect(dest);

        this.aviatorNoiseSource.start(now);
      }

      // 4. High-Altitude Turbocharger Whistle Layer
      this.aviatorWhistleOsc = this.ctx.createOscillator();
      this.aviatorWhistleGain = this.ctx.createGain();
      this.aviatorWhistleOsc.type = 'sine';
      this.aviatorWhistleOsc.frequency.setValueAtTime(1550, now);
      this.aviatorWhistleGain.gain.setValueAtTime(0.0001, now);
      this.aviatorWhistleGain.gain.linearRampToValueAtTime(0.006, now + 0.18);

      this.aviatorWhistleOsc.connect(this.aviatorWhistleGain);
      this.aviatorWhistleGain.connect(dest);
      this.aviatorWhistleOsc.start(now);
    } catch {}
  }

  public updateAviatorPitch(multiplier: number) {
    this.updateAviatorTickerMultiplier(multiplier);
    if (this.isMuted || !this.ctx || !this.aviatorOsc) return;
    try {
      const now = this.ctx.currentTime;
      const logMult = Math.log(Math.max(1, multiplier));

      // Core engine rises continuously from 84Hz up to 440Hz
      const targetFreq = Math.min(440, 84 + logMult * 78);
      const targetLfo = Math.min(52, 20 + logMult * 12);

      this.aviatorOsc.frequency.setTargetAtTime(targetFreq, now, 0.06);
      if (this.aviatorOsc2) {
        this.aviatorOsc2.frequency.setTargetAtTime(targetFreq * 2, now, 0.06);
      }
      if (this.aviatorSubOsc) {
        this.aviatorSubOsc.frequency.setTargetAtTime(Math.min(96, 48 + logMult * 16), now, 0.06);
      }
      if (this.aviatorLfo) {
        this.aviatorLfo.frequency.setTargetAtTime(targetLfo, now, 0.06);
      }

      // Wind vortex noise sweeps from 460Hz to 2800Hz and gains power as speed increases
      if (this.aviatorNoiseFilter && this.aviatorNoiseGain) {
        const noiseFreq = Math.min(2800, 460 + logMult * 620);
        const noiseVol = Math.min(0.045, 0.018 + logMult * 0.009);
        this.aviatorNoiseFilter.frequency.setTargetAtTime(noiseFreq, now, 0.06);
        this.aviatorNoiseGain.gain.setTargetAtTime(noiseVol, now, 0.06);
      }

      // Turbocharger whistle ascends smoothly into supersonic whine
      if (this.aviatorWhistleOsc && this.aviatorWhistleGain) {
        const whistleFreq = Math.min(3800, 1450 + logMult * 720);
        const whistleVol = Math.min(0.015, 0.005 + logMult * 0.003);
        this.aviatorWhistleOsc.frequency.setTargetAtTime(whistleFreq, now, 0.06);
        this.aviatorWhistleGain.gain.setTargetAtTime(whistleVol, now, 0.06);
      }
    } catch {}
  }

  public stopAviatorEngine() {
    this.stopAviatorTicker();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      if (this.aviatorGain) {
        this.aviatorGain.gain.linearRampToValueAtTime(0.0001, now + 0.1);
      }
      if (this.aviatorSubGain) {
        this.aviatorSubGain.gain.linearRampToValueAtTime(0.0001, now + 0.1);
      }
      if (this.aviatorNoiseGain) {
        this.aviatorNoiseGain.gain.linearRampToValueAtTime(0.0001, now + 0.1);
      }
      if (this.aviatorWhistleGain) {
        this.aviatorWhistleGain.gain.linearRampToValueAtTime(0.0001, now + 0.1);
      }

      setTimeout(() => {
        try {
          if (this.aviatorOsc) {
            this.aviatorOsc.stop();
            this.aviatorOsc.disconnect();
            this.aviatorOsc = null;
          }
          if (this.aviatorOsc2) {
            this.aviatorOsc2.stop();
            this.aviatorOsc2.disconnect();
            this.aviatorOsc2 = null;
          }
          if (this.aviatorSubOsc) {
            this.aviatorSubOsc.stop();
            this.aviatorSubOsc.disconnect();
            this.aviatorSubOsc = null;
          }
          if (this.aviatorLfo) {
            this.aviatorLfo.stop();
            this.aviatorLfo.disconnect();
            this.aviatorLfo = null;
          }
          if (this.aviatorNoiseSource) {
            this.aviatorNoiseSource.stop();
            this.aviatorNoiseSource.disconnect();
            this.aviatorNoiseSource = null;
          }
          if (this.aviatorWhistleOsc) {
            this.aviatorWhistleOsc.stop();
            this.aviatorWhistleOsc.disconnect();
            this.aviatorWhistleOsc = null;
          }
          this.aviatorGain = null;
          this.aviatorSubGain = null;
          this.aviatorNoiseGain = null;
          this.aviatorNoiseFilter = null;
          this.aviatorWhistleGain = null;
        } catch {}
      }, 120);
    } catch {}
  }

  public playAviatorCrash() {
    this.stopAviatorEngine();
    this.stopAviatorTicker();
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const dest = this.getSfxDestination() || this.ctx.destination;

    try {
      const now = this.ctx.currentTime;

      // 1. Explosive Crash Noise Blast (Fireball & Impact Shatter)
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.85);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Exponentially decaying explosion noise
        data[i] = white * Math.exp(-i / (bufferSize * 0.35));
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(2200, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(140, now + 0.8);
      noiseFilter.Q.value = 3.5;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.22, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(dest);
      noiseSource.start(now);

      // 2. Heavy Detonation Sub-Boom (Deep Sub-Bass Shockwave)
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(180, now);
      subOsc.frequency.exponentialRampToValueAtTime(28, now + 0.7);

      subGain.gain.setValueAtTime(0.24, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      subOsc.connect(subGain);
      subGain.connect(dest);
      subOsc.start(now);
      subOsc.stop(now + 0.78);

      // 3. High-Impact Metal Crunch & Disintegration Transient
      const impactOsc = this.ctx.createOscillator();
      const impactGain = this.ctx.createGain();
      const impactFilter = this.ctx.createBiquadFilter();

      impactOsc.type = 'sawtooth';
      impactOsc.frequency.setValueAtTime(450, now);
      impactOsc.frequency.exponentialRampToValueAtTime(65, now + 0.35);

      impactFilter.type = 'bandpass';
      impactFilter.frequency.setValueAtTime(1200, now);
      impactFilter.frequency.exponentialRampToValueAtTime(200, now + 0.35);
      impactFilter.Q.value = 2.0;

      impactGain.gain.setValueAtTime(0.18, now);
      impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      impactOsc.connect(impactFilter);
      impactFilter.connect(impactGain);
      impactGain.connect(dest);

      impactOsc.start(now);
      impactOsc.stop(now + 0.4);

      // 4. Supersonic Doppler Departure Echo
      const echoOsc = this.ctx.createOscillator();
      const echoGain = this.ctx.createGain();
      echoOsc.type = 'triangle';
      echoOsc.frequency.setValueAtTime(800, now);
      echoOsc.frequency.exponentialRampToValueAtTime(120, now + 0.6);

      echoGain.gain.setValueAtTime(0.08, now);
      echoGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      echoOsc.connect(echoGain);
      echoGain.connect(dest);
      echoOsc.start(now);
      echoOsc.stop(now + 0.68);
    } catch {}
  }

  public playAviatorFlewAway() {
    this.playAviatorCrash();
  }

  public playAviatorCashout(winAmount: number = 0) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Ultra-luxurious sparkling casino victory fanfare: C5 -> E5 -> G5 -> C6 -> E6 -> G6
      const chord = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
      chord.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.045);

        gain.gain.setValueAtTime(0.14, now + idx * 0.045);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.42);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.045);
        osc.stop(now + idx * 0.045 + 0.43);
      });

      // Shimmering golden coin showers
      for (let i = 0; i < 4; i++) {
        const coinTime = now + 0.18 + i * 0.06;
        const coinOsc = this.ctx.createOscillator();
        const coinGain = this.ctx.createGain();
        coinOsc.type = 'sine';
        coinOsc.frequency.setValueAtTime(2093 + i * 220, coinTime); // C7 harmonics
        coinGain.gain.setValueAtTime(0.04, coinTime);
        coinGain.gain.exponentialRampToValueAtTime(0.0001, coinTime + 0.09);

        coinOsc.connect(coinGain);
        coinGain.connect(this.ctx.destination);
        coinOsc.start(coinTime);
        coinOsc.stop(coinTime + 0.1);
      }
    } catch {}
  }

  public playCountdownBeep(isFinal: boolean = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isFinal ? 880 : 440, now);

      gain.gain.setValueAtTime(isFinal ? 0.08 : 0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {}
  }

  public playSplashIntro() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Futuristic ascending power-up chord
      const freqs = [220, 329.63, 440, 659.25, 880];
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + idx * 0.08 + 0.25);

        gain.gain.setValueAtTime(0.06, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.36);
      });
    } catch {}
  }

  public playSplashComplete() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Crisp confirmation chime
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch {}
  }

  // --- STEP SOUND EFFECTS ---
  public playBetPlaced() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Dual chip-click and confirmation tone
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.06); // G5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1046.50, now); // C6
      osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08); // E6

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.13);
      osc2.stop(now + 0.13);
    } catch {}
  }

  public playBetCancelled() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.09); // C4

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.11);
    } catch {}
  }

  public playChipSelect() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.04);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  }

  public playStepperStep(isUp: boolean = true) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      if (isUp) {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.04);
      } else {
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(360, now + 0.04);
      }

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  }

  public playMilestone(level: number = 2) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const baseNote = level >= 10 ? 1046.50 : level >= 5 ? 783.99 : 523.25;
      const chord = [baseNote, baseNote * 1.25, baseNote * 1.5];

      chord.forEach((f, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.04);

        gain.gain.setValueAtTime(0.06, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.19);
      });
    } catch {}
  }

  public playTabSwitch() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, now);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }

  public playHistoryPillClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.08);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {}
  }

  public playAutoToggle() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.06);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {}
  }

  public playTakeoff() {
    // Removed takeoff sound effect as requested by user.
    // Instead, the continuous synthesized flying engine sound runs from liftoff (takeoff) until crash.
  }

  // --- SWITCHABLE AMBIENT BACKGROUND CASINO MUSIC ENGINE ---
  private isMusicEnabled: boolean = true;
  private musicTimer: any = null;
  private musicStep: number = 0;

  public toggleMusic(): boolean {
    this.isMusicEnabled = !this.isMusicEnabled;
    if (this.isMusicEnabled && !this.isMuted) {
      this.startBackgroundMusic();
    } else {
      this.stopBackgroundMusic();
    }
    return this.isMusicEnabled;
  }

  public getMusicEnabled(): boolean {
    return this.isMusicEnabled;
  }

  public playProfileUpdate() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    const dest = this.getSfxDestination();
    if (!dest) return;

    try {
      const now = this.ctx.currentTime;
      // Dual crystal affirmation bell (F5 -> C6)
      const freqs = [698.46, 1046.50];
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.08, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.36);
      });
    } catch {}
  }

  public playChatSend() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    const dest = this.getSfxDestination();
    if (!dest) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(1080, now + 0.06);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {}
  }

  public startBackgroundMusic() {
    if (!this.isMusicEnabled || this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    if (this.musicTimer) return; // Already running

    const dest = this.getMusicDestination() || this.ctx.destination;

    // 8-Bar Rich Casino Synthwave Chord Progression
    const progression = [
      { chord: [220, 261.63, 329.63, 392, 493.88], root: 110, name: 'Am9' },
      { chord: [174.61, 220, 261.63, 329.63, 369.99], root: 87.31, name: 'Fmaj7#11' },
      { chord: [146.83, 220, 261.63, 329.63, 440], root: 73.42, name: 'Dm9' },
      { chord: [164.81, 196, 246.94, 293.66, 392], root: 82.41, name: 'Em7' },
      { chord: [196, 261.63, 293.66, 392, 440], root: 98.00, name: 'Gsus4' },
      { chord: [130.81, 196, 246.94, 329.63, 392], root: 65.41, name: 'Cmaj9' },
      { chord: [174.61, 261.63, 329.63, 392, 523.25], root: 87.31, name: 'Fmaj9' },
      { chord: [164.81, 207.65, 246.94, 293.66, 349.23], root: 82.41, name: 'E7b9' },
    ];

    const playBar = () => {
      if (!this.isMusicEnabled || this.isMuted || !this.ctx) return;

      try {
        const step = this.musicStep % progression.length;
        const current = progression[step];
        const now = this.ctx.currentTime;
        const barDuration = 2.2; // 2.2 seconds per groove bar

        // 1. Lush Analogue Poly-Pad with resonant filter sweep
        current.chord.forEach((freq, i) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const filter = this.ctx.createBiquadFilter();

          osc.type = i % 2 === 0 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, now);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(520, now);
          filter.frequency.exponentialRampToValueAtTime(1100, now + barDuration * 0.45);
          filter.frequency.exponentialRampToValueAtTime(460, now + barDuration);
          filter.Q.value = 1.8;

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.032, now + 0.3);
          gain.gain.setValueAtTime(0.032, now + barDuration - 0.4);
          gain.gain.linearRampToValueAtTime(0.001, now + barDuration);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(dest);

          osc.start(now);
          osc.stop(now + barDuration);
        });

        // 2. Punchy Synthwave Sub-Bass line (808 pulse + syncopated pickup)
        const bassNotes = [
          { time: now, freq: current.root, dur: 0.9 },
          { time: now + 1.1, freq: current.root * 1.5, dur: 0.45 },
          { time: now + 1.65, freq: current.root, dur: 0.5 },
        ];

        bassNotes.forEach(b => {
          if (!this.ctx) return;
          const bassOsc = this.ctx.createOscillator();
          const bassGain = this.ctx.createGain();
          bassOsc.type = 'sawtooth';
          bassOsc.frequency.setValueAtTime(b.freq, b.time);

          const bassFilter = this.ctx.createBiquadFilter();
          bassFilter.type = 'lowpass';
          bassFilter.frequency.setValueAtTime(180, b.time);
          bassFilter.frequency.exponentialRampToValueAtTime(60, b.time + b.dur);

          bassGain.gain.setValueAtTime(0.001, b.time);
          bassGain.gain.linearRampToValueAtTime(0.055, b.time + 0.05);
          bassGain.gain.exponentialRampToValueAtTime(0.001, b.time + b.dur);

          bassOsc.connect(bassFilter);
          bassFilter.connect(bassGain);
          bassGain.connect(dest);

          bassOsc.start(b.time);
          bassOsc.stop(b.time + b.dur + 0.02);
        });

        // 3. Crisp Rhythmic Hi-Hat Shakers (4 beats per bar)
        for (let b = 0; b < 4; b++) {
          const t = now + (b * barDuration) / 4;
          const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
          const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let k = 0; k < bufferSize; k++) {
            data[k] = (Math.random() * 2 - 1) * Math.exp(-k / (bufferSize * 0.25));
          }

          const noiseSrc = this.ctx.createBufferSource();
          noiseSrc.buffer = buffer;
          const hiFilter = this.ctx.createBiquadFilter();
          hiFilter.type = 'highpass';
          hiFilter.frequency.value = 6500;

          const hiGain = this.ctx.createGain();
          hiGain.gain.setValueAtTime(b % 2 === 0 ? 0.018 : 0.028, t);
          hiGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

          noiseSrc.connect(hiFilter);
          hiFilter.connect(hiGain);
          hiGain.connect(dest);

          noiseSrc.start(t);
        }

        // 4. Sparkling Arpeggio Bell melody notes
        const arpeggioNotes = [current.chord[1] * 2, current.chord[3] * 2, current.chord[2] * 2];
        arpeggioNotes.forEach((f, idx) => {
          if (!this.ctx) return;
          const noteTime = now + 0.45 + idx * 0.55;
          const bellOsc = this.ctx.createOscillator();
          const bellGain = this.ctx.createGain();
          bellOsc.type = 'sine';
          bellOsc.frequency.setValueAtTime(f, noteTime);

          bellGain.gain.setValueAtTime(0.001, noteTime);
          bellGain.gain.linearRampToValueAtTime(0.022, noteTime + 0.04);
          bellGain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.7);

          bellOsc.connect(bellGain);
          bellGain.connect(dest);

          bellOsc.start(noteTime);
          bellOsc.stop(noteTime + 0.75);
        });

        this.musicStep++;
      } catch {}
    };

    playBar();
    this.musicTimer = setInterval(playBar, 2200);
  }

  public stopBackgroundMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const soundFx = new AudioSynthesizer();
