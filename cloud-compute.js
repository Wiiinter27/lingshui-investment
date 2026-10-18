/* Cloud Compute by @XorDev. Original public shader:
 * https://fragcoord.xyz/s/c6zisyc6
 * https://x.com/XorDev/status/1918680610127659112
 * Original shader: all rights reserved, no license specified.
 * Integration: explicit variable initialization, bounded render resolution,
 * WebGL 1/2 support, context recovery and visibility-aware rendering.
 */
(() => {
  const canvas = document.getElementById('cloud-compute');
  if (!canvas) return;
  const hero = canvas.closest('.hero');
  const status = document.getElementById('background-status');
  const notices = {zh:'动态背景暂不可用，请检查浏览器图形加速设置。',en:'Animation unavailable. Check browser graphics acceleration.',ru:'Анимация недоступна. Проверьте графическое ускорение браузера.',fr:'Animation indisponible. Vérifiez l’accélération graphique du navigateur.',es:'Animación no disponible. Revise la aceleración gráfica del navegador.'};
  window.addEventListener('site-language-change', event => { if (status) status.textContent = notices[event.detail.locale] || notices.zh; });
  const options = {alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power', preserveDrawingBuffer: false};
  let gl = canvas.getContext('webgl2', options);
  const modern = !!gl;
  if (!gl) gl = canvas.getContext('webgl', options);
  let program, resolution, time, frame = 0, previous = 0, visible = true, lost = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let preference = null;
  try { preference = localStorage.getItem('lingshui-background-motion'); } catch {}
  let playing = preference === 'play' || (preference !== 'pause' && !reduced.matches);
  let elapsed = 5, lastTick = null;
  const control = document.createElement('button');
  control.type = 'button';
  control.className = 'background-toggle';
  control.setAttribute('aria-controls', 'cloud-compute');
  hero.append(control);
  const labels = {
    zh: ['播放背景', '暂停背景'], en: ['Play background', 'Pause background'],
    ru: ['Включить анимацию', 'Остановить анимацию'],
    fr: ['Animer le fond', 'Mettre en pause'], es: ['Animar fondo', 'Pausar fondo']
  };
  function updateControl() {
    const locale = document.documentElement.lang.split('-')[0];
    control.textContent = (playing ? 'Ⅱ ' : '▶ ') + (labels[locale] || labels.zh)[playing ? 1 : 0];
    canvas.dataset.motion = playing ? 'playing' : 'paused';
  }
  control.addEventListener('click', () => {
    playing = !playing;
    preference = playing ? 'play' : 'pause';
    try { localStorage.setItem('lingshui-background-motion', preference); } catch {}
    updateControl();
    resume();
  });
  window.addEventListener('site-language-change', updateControl);
  updateControl();
  const fail = () => {
    canvas.dataset.state = 'unavailable';
    control.hidden = true;
    if (status) status.hidden = false;
  };
  if (!gl) { fail(); return; }
  const fragmentBody = `
uniform vec2 u_resolution;
uniform float u_time;
void main() {
  float t = u_time;
  float z = 0.0;
  float d = 0.0;
  vec4 color = vec4(0.0);
  for (int i = 0; i < 80; i++) {
    vec3 p = z * normalize(vec3(2.0 * gl_FragCoord.xy, 0.0) - u_resolution.xxy);
    p.xz -= t;
    p.y = 4.0 - abs(p.y);
    d = 0.7;
    for (int j = 0; j < 5; j++) {
      p += cos(floor(p.yzx * d + 0.5) - 0.2 * t) / d;
      d += d;
    }
    d = 0.01 + abs(p.y) / 15.0;
    z += d;
    color += (cos(vec4(0.0, 1.0, 2.0, 0.0) - p.y * 2.0) + 1.1) / z / d;
  }
  vec4 scaled = color / 800.0;
  vec4 ex = exp(-2.0 * scaled);
  OUTPUT = vec4(((1.0 - ex) / (1.0 + ex)).rgb, 1.0);
}`;
  function compile(type, code) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, code);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      throw new Error('Background shader compilation failed');
    }
    return shader;
  }
  function initialize() {
    const vertex = compile(gl.VERTEX_SHADER, modern
      ? '#version 300 es\nin vec2 position; void main(){gl_Position=vec4(position,0.,1.);}'
      : 'attribute vec2 position; void main(){gl_Position=vec4(position,0.,1.);}');
    const fragment = compile(gl.FRAGMENT_SHADER, (modern
      ? '#version 300 es\nprecision highp float;\nout vec4 fragColor;\n'
      : 'precision highp float;\n') + fragmentBody.replace('OUTPUT', modern ? 'fragColor' : 'gl_FragColor'));
    program = gl.createProgram();
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    gl.deleteShader(vertex); gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Background shader link failed');
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    resolution = gl.getUniformLocation(program, 'u_resolution');
    time = gl.getUniformLocation(program, 'u_time');
    resize();
    canvas.dataset.state = 'ready';
    control.hidden = false;
    if (status) status.hidden = true;
  }
  function draw() {
    gl.useProgram(program);
    gl.uniform2f(resolution, canvas.width, canvas.height);
    gl.uniform1f(time, elapsed);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    canvas.dataset.animationTime = elapsed.toFixed(3);
  }
  function resize() {
    if (lost) return;
    // Shader cost scales with pixels; avoid devicePixelRatio on high-DPI desktops.
    const width = hero.clientWidth;
    const height = hero.clientHeight;
    const scale = Math.min(1, 960 / Math.max(width, 1), 540 / Math.max(height, 1));
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
    draw(performance.now());
  }
  function tick(now) {
    frame = 0;
    if (lost || document.hidden || !visible || !playing) { lastTick = null; return; }
    if (lastTick !== null) elapsed += Math.min((now - lastTick) / 1000, 0.1);
    lastTick = now;
    if (now - previous >= 1000 / 30) { draw(now); previous = now; }
    frame = requestAnimationFrame(tick);
  }
  function resume() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTick = null;
    if (!lost && visible && !document.hidden) {
      draw(performance.now());
      if (playing) frame = requestAnimationFrame(tick);
    }
  }
  try { initialize(); } catch (error) { console.warn(error.message); fail(); return; }
  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver(entries => {visible = entries[0].isIntersecting; resume();}).observe(hero);
  document.addEventListener('visibilitychange', resume);
  reduced.addEventListener('change', () => {
    if (preference !== 'play' && preference !== 'pause') playing = !reduced.matches;
    updateControl(); resume();
  });
  window.addEventListener('pageshow', resume);
  canvas.addEventListener('webglcontextlost', event => {event.preventDefault(); lost = true; cancelAnimationFrame(frame); fail();});
  canvas.addEventListener('webglcontextrestored', () => {lost = false; try {initialize(); resume();} catch {fail();}});
  resume();
})();
