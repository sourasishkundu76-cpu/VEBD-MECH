/**
 * VEND-MECH Procedural Mechanical Audio Synthesizer
 * Uses Web Audio API to create authentic mechanical acoustic feedback:
 * Gear meshes, ratchet clicks, flywheel resonance, spring release, and metallic thuds.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private gearOsc: OscillatorNode | null = null;
  private gearGain: GainNode | null = null;
  private flywheelOsc: OscillatorNode | null = null;
  private flywheelGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    // AudioContext is initialized on first user gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Create white noise buffer for friction sounds
      const bufferSize = this.ctx.sampleRate * 1;
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      // Initialize continuous gear drone
      this.gearOsc = this.ctx.createOscillator();
      this.gearOsc.type = 'triangle';
      this.gearGain = this.ctx.createGain();
      this.gearGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.gearOsc.connect(this.gearGain);
      this.gearGain.connect(this.ctx.destination);
      this.gearOsc.start();

      // Initialize continuous flywheel hum
      this.flywheelOsc = this.ctx.createOscillator();
      this.flywheelOsc.type = 'sine';
      this.flywheelGain = this.ctx.createGain();
      this.flywheelGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.flywheelOsc.connect(this.flywheelGain);
      this.flywheelGain.connect(this.ctx.destination);
      this.flywheelOsc.start();
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.gearGain && this.ctx) {
      if (muted) {
        this.gearGain.gain.setValueAtTime(0, this.ctx.currentTime);
        if (this.flywheelGain) this.flywheelGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMuted(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  // Update dynamic rotational engine sound based on current gear RPM
  public updateRPM(rpm: number) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.gearOsc || !this.gearGain || !this.flywheelOsc || !this.flywheelGain) return;

    const clampedRpm = Math.max(0, Math.min(rpm, 180));
    const now = this.ctx.currentTime;

    if (clampedRpm < 0.5) {
      this.gearGain.gain.setTargetAtTime(0, now, 0.05);
      this.flywheelGain.gain.setTargetAtTime(0, now, 0.08);
    } else {
      // Gear mesh pitch: proportional to tooth contact frequency
      const freq = 45 + clampedRpm * 3.2;
      this.gearOsc.frequency.setTargetAtTime(freq, now, 0.04);
      const targetGain = Math.min(0.04, (clampedRpm / 150) * 0.04);
      this.gearGain.gain.setTargetAtTime(targetGain, now, 0.04);

      // Heavy flywheel hum (lower frequency, smooth resonance)
      const fwFreq = 30 + clampedRpm * 1.5;
      this.flywheelOsc.frequency.setTargetAtTime(fwFreq, now, 0.06);
      const fwTargetGain = Math.min(0.035, (clampedRpm / 150) * 0.035);
      this.flywheelGain.gain.setTargetAtTime(fwTargetGain, now, 0.06);
    }
  }

  // Crisp ratchet tick when crank turns past an indexing detent
  public playRatchetTick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.025);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(600, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.028);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  // Solid mechanical lock release (ratchet pawl unlocks)
  public playLockRelease() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.09);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Metal gate slide / chute opening
  public playGateSlide() {
    if (this.isMuted || !this.noiseBuffer) return;
    this.initContext();
    if (!this.ctx || !this.noiseBuffer) return;

    const now = this.ctx.currentTime;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(3, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    source.start(now);
    source.stop(now + 0.18);
  }

  // Product landing thud in delivery tray
  public playDropThud() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Bass impact
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);

    // High metallic click of canister landing in metal tray
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(1800, now);
    clickOsc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

    clickGain.gain.setValueAtTime(0.08, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    clickOsc.connect(clickGain);
    clickGain.connect(this.ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.07);
  }

  // Spring recoil snap & lock reset
  public playSpringReset() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(860, now + 0.04);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.12);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  // Gentle UI tactile beep
  public playUiClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.03);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }
}

export const soundEngine = new SoundEngine();
