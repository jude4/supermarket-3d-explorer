import { useExplorer } from '../stores/useExplorer';
class AudioManager {
  private context?: AudioContext;
  private buffers = new Map<string, AudioBuffer>();
  private ambience?: AudioBufferSourceNode;
  private ambientGain?: GainNode;
  private active = new Set<AudioBufferSourceNode>();
  async unlock() {
    this.context ??= new AudioContext();
    await this.context.resume();
    await Promise.all(['door-slide','footstep','ventilation'].map(async name => {
      if (this.buffers.has(name)) return;
      try { const res = await fetch(`/audio/${name}.wav`); if (!res.ok) throw new Error('audio'); this.buffers.set(name, await this.context!.decodeAudioData(await res.arrayBuffer())); } catch { /* Audio is optional; movement remains available. */ }
    }));
  }
  sync(playing: boolean, indoors: boolean) {
    if (!this.context) return;
    if (!playing) { if(this.context.state==='running')this.context.suspend().catch(() => {}); return; }
    if (this.context.state === 'suspended') this.context.resume().catch(() => {});
    if (!this.ambience && this.buffers.has('ventilation')) {
      this.ambience = this.context.createBufferSource(); this.ambience.buffer = this.buffers.get('ventilation')!; this.ambience.loop = true;
      this.ambientGain = this.context.createGain(); this.ambience.connect(this.ambientGain).connect(this.context.destination); this.ambience.start();
    }
    this.ambientGain?.gain.setTargetAtTime(useExplorer.getState().settings.master * (indoors ? .22 : .035), this.context.currentTime, .3);
  }
  play(name: 'door-slide' | 'footstep', pan = 0) {
    const state = useExplorer.getState();
    if (!this.context || state.mode !== 'playing' || !this.buffers.has(name)) return;
    const source = this.context.createBufferSource(); source.buffer = this.buffers.get(name)!;
    const gain = this.context.createGain(); gain.gain.value = state.settings.master * state.settings.effects * (name === 'footstep' ? .5 : .7);
    const panner = this.context.createStereoPanner(); panner.pan.value = Math.max(-1,Math.min(1,pan));
    source.connect(gain).connect(panner).connect(this.context.destination); source.start(); this.active.add(source);
    source.onended = () => { source.disconnect(); gain.disconnect(); panner.disconnect(); this.active.delete(source); };
  }
}
export const audio = new AudioManager();
