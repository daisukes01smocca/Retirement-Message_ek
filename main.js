const petalsContainer = document.getElementById("petals");
const messageScroll = document.getElementById("messageScroll");
const endingImage = document.getElementById("endingImage");
const audio = document.querySelector("audio");
audio.volume = 0.15; // ← ここ追加

const MUSIC_DURATION_SECONDS = 66;
const IMAGE_FADE_IN_SECONDS = 3.5;
const IMAGE_FADE_OUT_SECONDS = 1.8;
const IMAGE_VISIBLE_LEAD_SECONDS = 15;

const petals = Array.from({ length: 32 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  delay: Math.random() * 12,
  duration: 10 + Math.random() * 10,
  drift: -120 + Math.random() * 240,
  size: 10 + Math.random() * 18,
  opacity: 0.45 + Math.random() * 0.4
}));

petals.forEach((petal) => {
  const el = document.createElement("span");
  el.className = "petal";
  el.style.left = `${petal.left}%`;
  el.style.width = `${petal.size}px`;
  el.style.height = `${petal.size * 0.72}px`;
  el.style.animationDelay = `${petal.delay}s`;
  el.style.animationDuration = `${petal.duration}s`;
  el.style.setProperty("--drift", `${petal.drift}px`);
  el.style.setProperty("--petal-opacity", petal.opacity);
  petalsContainer.appendChild(el);
});

let rafId = null;
let playbackFinished = false;
let fadeOutTimeoutId = null;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function resetFadeOutTimer() {
  if (fadeOutTimeoutId) {
    clearTimeout(fadeOutTimeoutId);
    fadeOutTimeoutId = null;
  }
}

function setScrollPosition(currentTime) {
  const progress = clamp(currentTime / MUSIC_DURATION_SECONDS, 0, 1);

  const START_TRANSLATE_Y = 55;
  const END_TRANSLATE_Y = -145;

  const translateY =
    START_TRANSLATE_Y + (END_TRANSLATE_Y - START_TRANSLATE_Y) * progress;

  const opacity = 1;

  messageScroll.style.transform = `translateY(${translateY}%)`;
  messageScroll.style.opacity = opacity;
}

function updateEndingImage(currentTime) {
  const fadeInStart = MUSIC_DURATION_SECONDS - IMAGE_VISIBLE_LEAD_SECONDS;
  const fadeInProgress = clamp(
    (currentTime - fadeInStart) / IMAGE_FADE_IN_SECONDS,
    0,
    1
  );

  if (playbackFinished) return;

  endingImage.classList.remove("is-fading-out");
  endingImage.style.opacity = fadeInProgress;
  endingImage.style.transform = `translateY(${16 - 16 * fadeInProgress}px) scale(${0.96 + 0.04 * fadeInProgress})`;
}

function updateScene() {
  const currentTime = Math.min(audio.currentTime, MUSIC_DURATION_SECONDS);
  setScrollPosition(currentTime);
  updateEndingImage(currentTime);

  if (!audio.paused) {
    if (audio.currentTime >= MUSIC_DURATION_SECONDS) {
      finishPlayback();
      return;
    }
    rafId = requestAnimationFrame(updateScene);
  }
}

function startSceneLoop() {
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(updateScene);
}

function resetScene() {
  playbackFinished = false;
  resetFadeOutTimer();
  endingImage.classList.remove("is-fading-out");
  endingImage.style.opacity = 0;
  endingImage.style.transform = "translateY(16px) scale(0.96)";
  setScrollPosition(0);
}

function scheduleImageFadeOut() {
  resetFadeOutTimer();
  fadeOutTimeoutId = setTimeout(() => {
    endingImage.classList.add("is-fading-out");
  }, 80);
}

function finishPlayback() {
  if (playbackFinished) return;

  playbackFinished = true;
  cancelAnimationFrame(rafId);
  audio.pause();
  audio.currentTime = MUSIC_DURATION_SECONDS;
  setScrollPosition(MUSIC_DURATION_SECONDS);
  endingImage.style.opacity = 1;
  endingImage.style.transform = "translateY(0) scale(1)";
  scheduleImageFadeOut();
}

audio.addEventListener("play", () => {
  if (playbackFinished || audio.currentTime >= MUSIC_DURATION_SECONDS) {
    audio.currentTime = 0;
    resetScene();
  }
  startSceneLoop();
});

audio.addEventListener("pause", () => {
  cancelAnimationFrame(rafId);
});

audio.addEventListener("seeking", () => {
  if (audio.currentTime >= MUSIC_DURATION_SECONDS) {
    finishPlayback();
    return;
  }

  if (!playbackFinished) {
    setScrollPosition(audio.currentTime);
    updateEndingImage(audio.currentTime);
  }
});

audio.addEventListener("ended", finishPlayback);

resetScene();