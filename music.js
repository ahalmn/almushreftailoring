'use strict';

const soundToggle = document.querySelector('#sound-toggle');
const backgroundSound = document.querySelector('#background-sound');

if (soundToggle && backgroundSound) {
  const preferenceKey = 'almushref.background-sound';
  const fadeSeconds = 0.8;
  let wantsSound = true;
  let audible = false;
  let mediaPlaying = false;
  let context;
  let gain;
  let fadeStart = 0;
  let fadeFrom = 0;
  let fadeTarget = 0;

  try {
    wantsSound = localStorage.getItem(preferenceKey) !== 'off';
  } catch {
    // The control still works without storage.
  }

  function setVolume(target) {
    if (!gain) return;
    const now = context.currentTime;
    const progress = Math.min(1, (now - fadeStart) / fadeSeconds);
    const current = fadeFrom + (fadeTarget - fadeFrom) * progress;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(current, now);
    gain.gain.linearRampToValueAtTime(target, now + fadeSeconds);
    fadeStart = now;
    fadeFrom = current;
    fadeTarget = target;
  }

  function syncSound() {
    const nextAudible = wantsSound && mediaPlaying && (!context || context.state === 'running');
    if (nextAudible === audible) return;
    setVolume(nextAudible ? 1 : 0);
    audible = nextAudible;
    soundToggle.textContent = t(audible ? 'Music Off' : 'Music On');
    soundToggle.setAttribute('aria-pressed', String(audible));
  }

  function prepareAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (context || !AudioContext) return;
    try {
      context = new AudioContext();
      const output = context.createGain();
      output.gain.value = 0;
      output.connect(context.destination);
      context.createMediaElementSource(backgroundSound).connect(output);
      gain = output;
      context.addEventListener('statechange', syncSound);
    } catch {
      context?.close().catch(() => {});
      context = undefined;
    }
  }

  function playBackgroundSound() {
    prepareAudio();

    // Both calls must run directly in the tap handler when autoplay is blocked.
    if (context && context.state !== 'running') context.resume().then(syncSound, () => {});
    if (backgroundSound.paused) {
      backgroundSound.play().catch(() => {
        if (backgroundSound.paused) {
          mediaPlaying = false;
          syncSound();
        }
      });
    }
    syncSound();
  }

  function startSoundOnInteraction(event) {
    if (!wantsSound || audible || !event.isTrusted || soundToggle.contains(event.target)) return;
    if (event.target.closest?.('a[href^="https:"], a[href^="mailto:"], a[href^="tel:"]')) return;
    if (event.type === 'pointerup' && event.pointerType === 'mouse') return;
    if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
    playBackgroundSound();
  }

  backgroundSound.addEventListener('playing', () => {
    if (!wantsSound && !gain) {
      backgroundSound.pause();
      return;
    }
    mediaPlaying = true;
    syncSound();
  });

  for (const event of ['pause', 'error']) {
    backgroundSound.addEventListener(event, () => {
      mediaPlaying = false;
      syncSound();
    });
  }

  soundToggle.addEventListener('click', () => {
    wantsSound = !audible;
    try {
      localStorage.setItem(preferenceKey, wantsSound ? 'on' : 'off');
    } catch {
      // Storage is optional.
    }
    if (wantsSound) {
      playBackgroundSound();
    } else {
      // With Web Audio, leave the native player running to avoid a restart click.
      if (!gain) backgroundSound.pause();
      syncSound();
    }
  });

  soundToggle.hidden = false;
  document.addEventListener('pointerup', startSoundOnInteraction, true);
  document.addEventListener('click', startSoundOnInteraction, true);
  document.addEventListener('keydown', startSoundOnInteraction, true);
  if (wantsSound) playBackgroundSound();
}
