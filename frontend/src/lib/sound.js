// =============================================================================
// NEON :: frontend - Generador de sonidos sinteticos (Web Audio API)
// Sin archivos externos. Exporta playSound(type).
// =============================================================================

/**
 * Reproduce un sonido sintetico segun el tipo indicado.
 *
 * @param {"success"|"warning"|"delete"} type - Tipo de sonido a reproducir
 * @returns {void}
 */
export function playSound(type) {
  // Respetar preferencia de sonido del usuario guardada en localStorage
  try {
    if (localStorage.getItem("neon_tec_sonido") === "false") {
      return;
    }
  } catch {
    // localStorage no disponible (modo privado, etc.): no bloquear la ejecucion
  }

  // AudioContext puede no estar disponible en todos los entornos/navegadores
  const AudioContextCls = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCls) {
    console.warn("[NEON sound] AudioContext no disponible en este entorno.");
    return;
  }

  const audioCtx = new AudioContextCls();
  const now = audioCtx.currentTime;

  try {
    // Reactivar contexto si el navegador lo mantuvo suspendido (autoplay policy)
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }

    if (type === "success") {
      // Dos tonos armonicos rapidos en 523 Hz y 659 Hz (do y mi)
      playTone(audioCtx, 523, now, 0.12);
      playTone(audioCtx, 659, now + 0.08, 0.12);
    } else if (type === "warning" || type === "delete") {
      // Tono grave descendente en 220 Hz (la)
      playDescendingTone(audioCtx, 220, now, 0.5);
    } else {
      return;
    }
  } catch (err) {
    console.warn("[NEON sound] No se pudo reproducir el sonido:", err);
  }

  // Liberar recursos tras la reproduccion
  setTimeout(() => {
    if (audioCtx.state !== "closed") {
      audioCtx.close().catch(() => {});
    }
  }, 1000);
}

/**
 * Reproduce un tono simple con OscillatorNode y ganancia con fade out.
 * @param {AudioContext} audioCtx - Contexto de audio
 * @param {number} frequency - Frecuencia en Hz
 * @param {number} startTime - Tiempo de inicio (contexto)
 * @param {number} duration - Duracion en segundos
 */
function playTone(audioCtx, frequency, startTime, duration) {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startTime);

  gainNode.gain.setValueAtTime(0.15, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

/**
 * Reproduce un tono grave con frecuencia descendente.
 * @param {AudioContext} audioCtx - Contexto de audio
 * @param {number} baseFrequency - Frecuencia inicial en Hz
 * @param {number} startTime - Tiempo de inicio (contexto)
 * @param {number} duration - Duracion en segundos
 */
function playDescendingTone(audioCtx, baseFrequency, startTime, duration) {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(baseFrequency, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(baseFrequency * 0.5, startTime + duration);

  gainNode.gain.setValueAtTime(0.15, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}
