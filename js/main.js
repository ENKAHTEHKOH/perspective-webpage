// Timing configuration constants
const NAME_CADENCE_MS = 2500;      // Duration per name to balance readability and pacing
const STAGE_REMOVE_DELAY_MS = 500; // Delay to allow final fade-out animation before grid replacement
const GRID_REVEAL_DELAY_MS = 50;   // Brief delay to ensure DOM paint before opacity transition

// Module-scoped state management variables for asynchronous controls
let memorialInterval = null;
let stageRemoveTimeout = null;
let gridRevealTimeout = null;
let audioFadeInterval = null;
let currentIndex = 0;
let backgroundAudio = null;
let currentNamesArray = [];
let reducedMotion = false;

document.addEventListener("DOMContentLoaded", () => {
  reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Fetch essay content dynamically to keep the raw HTML template decoupled from data
  fetch("content/essay.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} loading essay.json`);
      }
      return response.json();
    })
    .then((data) => {
      const articleElement = document.getElementById("essay-container");

      const titleHTML = `<h1>${data.title}</h1>`;
      const paragraphsHTML = data.sections
        .map((section) => `<p>${section.text}</p>`)
        .join("");

      // Markup uses the `hidden` attribute for consistent state management with assistive technologies
      const memorialHTML = `
        <section class="memorial-container" id="memorial-container">
          <h3>Some of The Names</h3>
          <p>Do not let them be erased.</p>
          <div class="memorial-controls">
            <button class="memorial-btn" id="play-btn">Play Tribute</button>
            <button class="memorial-btn" id="stop-btn" hidden>Stop</button>
            <button class="memorial-btn" id="continue-btn" hidden>Continue</button>
            <button class="memorial-btn" id="end-btn" hidden>End / Skip</button>
            <button class="memorial-btn" id="restart-btn" hidden>Restart</button>
          </div>
          <div class="name-progress-wrapper" id="progress-wrapper" hidden>
            <div class="name-progress-container">
              <div id="name-progress-fill" class="name-progress-fill"></div>
            </div>
            <div id="name-counter" class="name-counter" aria-live="polite">0 / 0</div>
          </div>
          <div id="memorial-display"></div>
        </section>
      `;

      articleElement.innerHTML = titleHTML + paragraphsHTML + memorialHTML;

      currentNamesArray = data.memorialNames;

      backgroundAudio = new Audio("audio/song.mp3");
      backgroundAudio.loop = true;

      // Bind UI event handlers
      document.getElementById("play-btn").addEventListener("click", startTribute);
      document.getElementById("stop-btn").addEventListener("click", stopTribute);
      document.getElementById("continue-btn").addEventListener("click", continueTribute);
      document.getElementById("end-btn").addEventListener("click", endTribute);
      document.getElementById("restart-btn").addEventListener("click", restartTribute);

      // Programmatically append the scroll progress bar to keep markup clean
      const progressBar = document.createElement("div");
      progressBar.className = "scroll-progress";
      document.body.prepend(progressBar);

      window.addEventListener("scroll", () => {
        const windowHeight =
          document.documentElement.scrollHeight -
          document.documentElement.clientHeight;
        const scrolled = (window.scrollY / windowHeight) * 100;
        progressBar.style.width = scrolled + "%";
      });
    })
    .catch((error) => {
      // Handle loading failures gracefully for the end user
      console.error("Error loading essay data:", error);
      const articleElement = document.getElementById("essay-container");
      if (articleElement) {
        articleElement.innerHTML =
          "<p>Something went wrong loading this page. Please refresh and try again.</p>";
      }
    });
});

// Clear all active timers and intervals to prevent execution overlap
function clearAllTimers() {
  clearInterval(memorialInterval);
  memorialInterval = null;
  clearTimeout(stageRemoveTimeout);
  stageRemoveTimeout = null;
  clearTimeout(gridRevealTimeout);
  gridRevealTimeout = null;
}

function startTribute() {
  clearAllTimers(); // Clear any existing timers prior to initialisation
  currentIndex = 0;
  toggleButtons("playing");
  if (!reducedMotion) {
    document.getElementById("progress-wrapper").hidden = false;
  }
  fadeInAudio(backgroundAudio);
  if (reducedMotion) {
    // Bypass the animated ticker for reduced-motion preference
    renderSmoothPermanentGrid(currentNamesArray, document.getElementById("memorial-display"));
    return;
  }
  runNameSequence();
}

function stopTribute() {
  clearAllTimers();
  toggleButtons("stopped");
  fadeOutAudio(backgroundAudio);
}

function continueTribute() {
  clearAllTimers(); // Prevent interval accumulation
  toggleButtons("playing");
  fadeInAudio(backgroundAudio);
  runNameSequence();
}

function restartTribute() {
  clearAllTimers();
  currentIndex = 0;
  const container = document.getElementById("memorial-display");
  container.innerHTML = "";
  toggleButtons("playing");
  if (!reducedMotion) {
    document.getElementById("progress-wrapper").hidden = false;
  }
  backgroundAudio.currentTime = 0;
  fadeInAudio(backgroundAudio);
  if (reducedMotion) {
    renderSmoothPermanentGrid(currentNamesArray, container);
    return;
  }
  runNameSequence();
}

// Immediately display the complete records grid
function endTribute() {
  clearAllTimers();
  document.getElementById("progress-wrapper").hidden = true;
  const container = document.getElementById("memorial-display");
  container.innerHTML = "";
  fadeOutAudio(backgroundAudio);
  document.getElementById("stop-btn").hidden = true;
  document.getElementById("continue-btn").hidden = true;
  document.getElementById("end-btn").hidden = true;
  document.getElementById("restart-btn").hidden = false;
  renderSmoothPermanentGrid(currentNamesArray, container);
}

/*
  Centralised progress update utility to keep the progress bar
  and counter synchronised.
*/
function updateProgress(done, total) {
  document.getElementById("name-progress-fill").style.width =
    `${(done / total) * 100}%`;
  document.getElementById("name-counter").textContent = `${done} of ${total}`;
}

/*
  Iterates through the name sequence using the configured cadence.
*/
function runNameSequence() {
  const container = document.getElementById("memorial-display");
  const totalNames = currentNamesArray.length;

  let stage = document.getElementById("memorial-stage");
  if (!stage) {
    stage = document.createElement("div");
    stage.id = "memorial-stage";
    stage.className = "memorial-stage";
    stage.setAttribute("aria-live", "polite"); // Ensure screen readers announce updates
    container.appendChild(stage);
  }

  const tick = () => {
    if (currentIndex < totalNames) {
      /*
        Reset opacity and update text content to trigger 
        the CSS fade transition cleanly on each iteration.
      */
      stage.style.opacity = 0;
      stage.textContent = currentNamesArray[currentIndex];
      setTimeout(() => {
        stage.style.opacity = 1;
      }, 100);

      updateProgress(currentIndex + 1, totalNames);
      currentIndex++;
    } else {
      clearInterval(memorialInterval);
      memorialInterval = null;
      document.getElementById("progress-wrapper").hidden = true;
      stage.style.opacity = 0;
      // Timeout is tracked to allow cancellation if user restarts mid-fade
      stageRemoveTimeout = setTimeout(() => {
        stage.remove();
        renderSmoothPermanentGrid(currentNamesArray, container);
      }, STAGE_REMOVE_DELAY_MS);
    }
  };

  tick(); // Execute immediately to prevent initial delay
  memorialInterval = setInterval(tick, NAME_CADENCE_MS);
}

// Manage control button visibility states based on application status
function toggleButtons(state) {
  const playBtn = document.getElementById("play-btn");
  const stopBtn = document.getElementById("stop-btn");
  const continueBtn = document.getElementById("continue-btn");
  const endBtn = document.getElementById("end-btn");
  const restartBtn = document.getElementById("restart-btn");

  if (state === "playing") {
    playBtn.hidden = true;
    continueBtn.hidden = true;
    stopBtn.hidden = false;
    endBtn.hidden = false;
    restartBtn.hidden = false;
  } else if (state === "stopped") {
    stopBtn.hidden = true;
    continueBtn.hidden = false;
    endBtn.hidden = true;
    restartBtn.hidden = false;
  }
}

/*
  Handles audio playback with safeguards for browser autoplay policies.
  Active intervals are tracked to prevent conflicting volume modifications.
*/
function fadeInAudio(audio) {
  clearInterval(audioFadeInterval);
  audioFadeInterval = null;
  audio.volume = 0;
  audio.play().catch((e) =>
    console.log("Audio play restricted by browser policy:", e)
  );
  audioFadeInterval = setInterval(() => {
    if (audio.volume < 0.9) {
      audio.volume = Math.min(1.0, audio.volume + 0.05);
    } else {
      audio.volume = 1.0;
      clearInterval(audioFadeInterval);
      audioFadeInterval = null;
    }
  }, 100);
}

// Gradually reduce audio volume before pausing playback
function fadeOutAudio(audio) {
  clearInterval(audioFadeInterval);
  audioFadeInterval = null;
  audioFadeInterval = setInterval(() => {
    if (audio.volume > 0.1) {
      audio.volume = Math.max(0, audio.volume - 0.05);
    } else {
      audio.volume = 0;
      audio.pause();
      clearInterval(audioFadeInterval);
      audioFadeInterval = null;
    }
  }, 100);
}

function renderSmoothPermanentGrid(names, container) {
  const wrapper = document.createElement("div");
  wrapper.className = "memorial-grid-wrapper";
  wrapper.innerHTML = '<h3 style="margin-top: 1rem; color: #fff;">The Complete Record</h3>';

  const grid = document.createElement("div");
  grid.className = "memorial-grid";
  names.forEach((name) => {
    const item = document.createElement("span");
    item.className = "keyword grid-name";
    item.textContent = name;
    grid.appendChild(item);
  });
  wrapper.appendChild(grid);
  container.appendChild(wrapper);

  /*
    Ensure the DOM element is painted before adding the visible class
    to guarantee the CSS transition triggers correctly.
  */
  if (reducedMotion) {
    wrapper.classList.add("visible");
    return;
  }
  gridRevealTimeout = setTimeout(() => {
    wrapper.classList.add("visible");
  }, GRID_REVEAL_DELAY_MS);
}