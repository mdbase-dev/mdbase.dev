// Silver sky: billowing mist with fine windborne grain, from the material studies.
(() => {
  const root = document.documentElement;
  const canvas = document.querySelector('#atmosphere');
  const ctx = canvas.getContext('2d', { alpha: false });
  const grain = document.querySelector('#grain');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const systemDark = matchMedia('(prefers-color-scheme: dark)');
  const motion = 65;
  let dark = root.dataset.theme ? root.dataset.theme === 'dark' : systemDark.matches;
  let paused = reducedMotion.matches;
  let phase = 0;
  let lastFrame = 0;
  let frameId;
  let baseRgb = '247,248,250';
  const colorProbe = document.createElement('canvas');
  colorProbe.width = colorProbe.height = 1;
  const colorContext = colorProbe.getContext('2d', { willReadFrequently: true });
  const mistCanvas = document.createElement('canvas');
  const mistContext = mistCanvas.getContext('2d');
  let mistImage;
  const noiseGrid = new Float32Array(64 * 64);
  let seed = 14923;
  for (let i = 0; i < noiseGrid.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    noiseGrid[i] = seed / 4294967296;
  }

  function noise(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y);
    let fx = x - ix, fy = y - iy;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    const a = noiseGrid[((iy & 63) << 6) + (ix & 63)];
    const b = noiseGrid[((iy & 63) << 6) + ((ix + 1) & 63)];
    const c = noiseGrid[(((iy + 1) & 63) << 6) + (ix & 63)];
    const d = noiseGrid[(((iy + 1) & 63) << 6) + ((ix + 1) & 63)];
    return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
  }
  function fbm(x, y) {
    return noise(x, y) * .57 + noise(x * 2.03 + 7, y * 2.03 + 11) * .28 + noise(x * 4.11 + 19, y * 4.11 + 3) * .15;
  }
  function mistField(u, v) {
    const t = phase * .30;
    const warp = fbm(u * .75 + t * .06, v * .75 - t * .04);
    return fbm(u - t * .29 + warp * 1.6, v + t * .10 + warp * .9);
  }
  // The same moving noise field shades the mist and steers the flock.
  window.mdbaseAtmosphere = {
    wind(x, y) {
      const u = x * 2.8, v = y * 2.8 / (canvas.width / canvas.height || 1);
      const e = .04;
      const dx = (mistField(u + e, v) - mistField(u - e, v)) / (2 * e);
      const dy = (mistField(u, v + e) - mistField(u, v - e)) / (2 * e);
      return { x: .2 + dy * 1.2, y: -.10 - dx * 1.2 };
    }
  };

  function readBase() {
    const base = getComputedStyle(root).getPropertyValue('--color-canvas').trim();
    colorContext.fillStyle = base;
    colorContext.fillRect(0, 0, 1, 1);
    baseRgb = [...colorContext.getImageData(0, 0, 1, 1).data].slice(0, 3).join(',');
  }
  function resize() {
    const scale = Math.min(1, 1100 / innerWidth);
    canvas.width = Math.round(innerWidth * scale);
    canvas.height = Math.round(innerHeight * scale);
    const mistScale = Math.min(1, 200 / innerWidth, 180 / innerHeight);
    mistCanvas.width = Math.max(1, Math.round(innerWidth * mistScale));
    mistCanvas.height = Math.max(1, Math.round(innerHeight * mistScale));
    mistImage = mistContext.createImageData(mistCanvas.width, mistCanvas.height);
    draw();
  }
  function drawMist() {
    const mw = mistCanvas.width, mh = mistCanvas.height;
    const rgb = baseRgb.split(',').map(Number);
    const data = mistImage.data;
    const aspect = canvas.width / canvas.height;
    for (let y = 0; y < mh; y++) {
      for (let x = 0; x < mw; x++) {
        const n = mistField(x / mw * 2.8, y / mh * 2.8 / aspect);
        const density = Math.max(0, Math.min(1, (n - .27) * 2.25));
        const shade = density * density;
        const index = (y * mw + x) * 4;
        for (let channel = 0; channel < 3; channel++) {
          const variation = dark ? shade * (channel === 2 ? 48 : 36) : 6 - shade * (channel === 0 ? 59 : 51);
          data[index + channel] = Math.max(0, Math.min(255, rgb[channel] + variation));
        }
        data[index + 3] = 255;
      }
    }
    mistContext.putImageData(mistImage, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(mistCanvas, 0, 0, canvas.width, canvas.height);
  }
  function glow(x, y, rx, ry, color, alpha) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(rx, ry);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    gradient.addColorStop(0, `rgba(${color},${alpha})`);
    gradient.addColorStop(.5, `rgba(${color},${alpha * .45})`);
    gradient.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = gradient; ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }
  function draw() {
    const w = canvas.width, h = canvas.height;
    if (!w || !h || !mistImage) return;
    drawMist();
    glow(w * (.72 + Math.sin(phase * .16) * .15), h * .48, w * .35, h * .55,
      dark ? '114,135,157' : '255,255,255', dark ? .07 : .18);
    // Fade the atmosphere toward the reading column, not the text itself.
    const veil = ctx.createLinearGradient(0, 0, w * .63, 0);
    veil.addColorStop(0, `rgb(${baseRgb})`); veil.addColorStop(.63, `rgb(${baseRgb})`);
    veil.addColorStop(1, `rgba(${baseRgb},0)`);
    ctx.fillStyle = veil; ctx.fillRect(0, 0, w, h);
    grain.style.backgroundPosition = `${phase * 8}px ${phase * 2.8}px`;
  }
  function frame(now) {
    if (now - lastFrame > 66) {
      const delta = Math.min(100, now - lastFrame || 66);
      lastFrame = now;
      if (!paused) { phase += delta / 1000 * (.15 + motion / 100 * 1.5); draw(); }
    }
    frameId = requestAnimationFrame(frame);
  }

  // The site's theme control owns the theme; the sky follows it.
  const pauseControl = document.querySelector('[data-motion-control]');
  const currentDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : systemDark.matches;
  function sync() {
    dark = currentDark();
    grain.style.backgroundImage = `url("/textures/${dark ? 'dark' : 'light'}-2.png")`;
    if (pauseControl) {
      pauseControl.textContent = paused ? 'Play motion' : 'Pause motion';
      pauseControl.hidden = reducedMotion.matches;
    }
    readBase();
    window.murmurationPreview?.pause(paused);
    draw();
  }
  addEventListener('mdbase:themechange', sync);
  systemDark.addEventListener('change', sync);
  pauseControl?.addEventListener('click', () => { paused = !paused; sync(); });
  reducedMotion.addEventListener('change', event => { paused = event.matches; sync(); });
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(frameId);
    if (!document.hidden) { lastFrame = performance.now(); frameId = requestAnimationFrame(frame); }
  });
  addEventListener('DOMContentLoaded', sync);
  readBase(); resize(); frameId = requestAnimationFrame(frame);
})();
