export type LoopMode = 'loop' | 'once' | 'ping-pong';

export interface RuntimeClockState {
  currentTime: number;
  duration: number;
  fps: number;
  isPlaying: boolean;
  playbackRate: number;
  loopMode: LoopMode;
}

/**
 * OpenSVG Runtime Clock
 * Single authoritative source of truth for playback lifecycle & timeline time.
 * Invariant: Pure time management without DOM/React dependency.
 */
export class RuntimeClock {
  private currentTime: number = 0;
  private duration: number = 1;
  private fps: number = 60;
  private isPlaying: boolean = false;
  private playbackRate: number = 1.0;
  private loopMode: LoopMode = 'loop';
  private pingPongDirection: 1 | -1 = 1;

  constructor(duration: number = 3.0, fps: number = 60, loopMode: LoopMode = 'loop') {
    this.duration = Math.max(0.01, duration);
    this.fps = Math.max(1, fps);
    this.loopMode = loopMode;
  }

  public setDuration(duration: number): void {
    this.duration = Math.max(0.01, duration);
    if (this.currentTime > this.duration) {
      this.currentTime = this.duration;
    }
  }

  public setFps(fps: number): void {
    this.fps = Math.max(1, fps);
  }

  public setPlaybackRate(rate: number): void {
    this.playbackRate = rate;
  }

  public setLoopMode(mode: LoopMode): void {
    this.loopMode = mode;
  }

  public play(): void {
    this.isPlaying = true;
  }

  public pause(): void {
    this.isPlaying = false;
  }

  public togglePlay(): void {
    this.isPlaying = !this.isPlaying;
  }

  public seek(time: number): void {
    this.currentTime = Math.max(0, Math.min(this.duration, time));
    this.pingPongDirection = 1;
  }

  public reset(): void {
    this.currentTime = 0;
    this.isPlaying = false;
    this.pingPongDirection = 1;
  }

  /**
   * Advances the playback clock by dt seconds (delta-time)
   */
  public advance(dt: number): void {
    if (this.duration <= 0) return;

    const step = dt * this.playbackRate;

    if (this.loopMode === 'loop') {
      this.currentTime = (this.currentTime + step) % this.duration;
      if (this.currentTime < 0) {
        this.currentTime += this.duration;
      }
    } else if (this.loopMode === 'ping-pong') {
      const period = 2 * this.duration;
      const currentPhase = this.pingPongDirection === -1 ? (period - this.currentTime) : this.currentTime;
      let nextPhase = (currentPhase + step) % period;
      if (nextPhase < 0) nextPhase += period;

      if (nextPhase > this.duration) {
        this.currentTime = period - nextPhase;
        this.pingPongDirection = -1;
      } else {
        this.currentTime = nextPhase;
        this.pingPongDirection = 1;
      }
    } else {
      // 'once' mode
      const nextTime = this.currentTime + step;
      if (nextTime >= this.duration) {
        this.currentTime = this.duration;
        this.isPlaying = false;
      } else if (nextTime <= 0) {
        this.currentTime = 0;
      } else {
        this.currentTime = nextTime;
      }
    }
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public getDuration(): number {
    return this.duration;
  }

  public getFps(): number {
    return this.fps;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getPlaybackRate(): number {
    return this.playbackRate;
  }

  public getLoopMode(): LoopMode {
    return this.loopMode;
  }

  public getSnapshot(): RuntimeClockState {
    return {
      currentTime: this.currentTime,
      duration: this.duration,
      fps: this.fps,
      isPlaying: this.isPlaying,
      playbackRate: this.playbackRate,
      loopMode: this.loopMode
    };
  }
}
