// Touch buttons (multi-touch), optional tilt steering and keyboard controls for desktop testing.
export function createInput() {
  const state = { left: false, right: false, gas: false, brake: false, handbrake: false, horn: false };
  const keys = new Set();
  let tilt = 0;
  let tiltEnabled = false;
  let tiltInvert = false;
  let steerSmooth = 0;

  function bindHold(el, name, onChange) {
    const active = new Set();
    const set = () => {
      const on = active.size > 0;
      if (state[name] !== on) {
        state[name] = on;
        el.classList.toggle('pressed', on);
        onChange?.(on);
      }
    };
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      el.setPointerCapture?.(e.pointerId);
      active.add(e.pointerId);
      set();
    });
    const up = (e) => {
      active.delete(e.pointerId);
      set();
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  window.addEventListener('keydown', (e) => {
    keys.add(e.code);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  // In landscape the phone's long axis (device y) is horizontal: turning the phone like a
  // steering wheel moves gravity along it.
  window.addEventListener('devicemotion', (e) => {
    const g = e.accelerationIncludingGravity;
    if (!g || g.y == null) return;
    const angle = screen.orientation?.angle ?? window.orientation ?? 90;
    const sign = angle === 270 || angle === -90 ? -1 : 1;
    tilt = Math.max(-1, Math.min(1, (sign * g.y) / 4.5)) * (tiltInvert ? -1 : 1);
  });

  return {
    bindHold,
    setTilt(on, invert = false) {
      tiltEnabled = on;
      tiltInvert = invert;
    },
    /** Driving input for this frame. */
    read(dt) {
      const k = (...codes) => codes.some((c) => keys.has(c));
      const left = state.left || k('ArrowLeft', 'KeyA', 'KeyQ');
      const right = state.right || k('ArrowRight', 'KeyD');
      const target = tiltEnabled && !left && !right ? -tilt : (left ? 1 : 0) - (right ? 1 : 0);
      // Buttons ease in so a tap makes a small correction and a hold turns fully.
      const rate = tiltEnabled ? 10 : 3.2;
      steerSmooth += Math.max(-rate * dt, Math.min(rate * dt, target - steerSmooth));
      if (target === 0 && !tiltEnabled) steerSmooth *= Math.max(0, 1 - dt * 8);
      return {
        throttle: state.gas || k('ArrowUp', 'KeyW', 'KeyZ') ? 1 : 0,
        brake: state.brake || k('ArrowDown', 'KeyS') ? 1 : 0,
        steer: steerSmooth,
        handbrake: state.handbrake || k('Space'),
        horn: state.horn || k('KeyH'),
      };
    },
    keyPressed: (code) => keys.has(code),
  };
}
