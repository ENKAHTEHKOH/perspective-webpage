// Global state variables
let memorialInterval = null;
let currentIndex = 0;
let backgroundAudio = null;
let currentNamesArray = [];

document.addEventListener("DOMContentLoaded", () => {
    // 1. Fetch and render the JSON content dynamically
    fetch('content/essay.json')
        .then(response => response.json())
        .then(data => {
            const articleElement = document.getElementById('essay-container');
            
            const titleHTML = `<h1>${data.title}</h1>`;
            const paragraphsHTML = data.sections.map(section => `<p>${section.text}</p>`).join('');
            
            // Append the memorial section container at the bottom with the End button included
            const memorialHTML = `
                <section class="memorial-container" id="memorial-container">
                    <h3>Some of The Names</h3>
                    <p>Do not let them be erased.</p>
                    <div class="memorial-controls">
                        <button class="memorial-btn" id="play-btn">Play Tribute</button>
                        <button class="memorial-btn" id="stop-btn" style="display: none;">Stop</button>
                        <button class="memorial-btn" id="continue-btn" style="display: none;">Continue</button>
                        <button class="memorial-btn" id="end-btn" style="display: none;">End / Skip</button>
                        <button class="memorial-btn" id="restart-btn" style="display: none;">Restart</button>
                    </div>
                    <div class="name-progress-wrapper" id="progress-wrapper" style="display: none;">
                        <div class="name-progress-container">
                            <div id="name-progress-fill" class="name-progress-fill"></div>
                        </div>
                        <div id="name-counter" class="name-counter">0 / 0</div>
                    </div>
                    <div id="memorial-display"></div>
                </section>
            `;
            
            articleElement.innerHTML = titleHTML + paragraphsHTML + memorialHTML;

            currentNamesArray = data.memorialNames;
            backgroundAudio = new Audio('audio/song.mp3');
            backgroundAudio.loop = true;

            // Event Listeners for all controls
            document.getElementById('play-btn').addEventListener('click', startTribute);
            document.getElementById('stop-btn').addEventListener('click', stopTribute);
            document.getElementById('continue-btn').addEventListener('click', continueTribute);
            document.getElementById('end-btn').addEventListener('click', endTribute);
            document.getElementById('restart-btn').addEventListener('click', restartTribute);
        })
        .catch(error => console.error('Error loading essay data:', error));

    // Scroll Progress Bar Logic
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.prepend(progressBar);

    window.addEventListener('scroll', () => {
        const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (window.scrollY / windowHeight) * 100;
        progressBar.style.width = scrolled + '%';
    });
});

// Tribute Actions
function startTribute() {
    currentIndex = 0;
    toggleButtons('playing');
    document.getElementById('progress-wrapper').style.display = 'block';
    fadeInAudio(backgroundAudio);
    runNameSequence();
}

function stopTribute() {
    clearInterval(memorialInterval);
    memorialInterval = null;
    toggleButtons('stopped');
    fadeOutAudio(backgroundAudio);
}

function continueTribute() {
    toggleButtons('playing');
    fadeInAudio(backgroundAudio);
    runNameSequence();
}

// NEW: Restart Action
function restartTribute() {
    // 1. Clear any running intervals to prevent overlapping timers
    clearInterval(memorialInterval);
    memorialInterval = null;

    // 2. Reset index and clear the display stage / permanent grid
    currentIndex = 0;
    const container = document.getElementById('memorial-display');
    container.innerHTML = ''; // Wipes out existing stage or grid

    // 3. Reset UI states and restart audio from the beginning
    toggleButtons('playing');
    document.getElementById('progress-wrapper').style.display = 'block';
    
    backgroundAudio.currentTime = 0; // Rewind song to start
    fadeInAudio(backgroundAudio);
    
    runNameSequence();
}

// Core loop for flashing names sequentially
function runNameSequence() {
    const container = document.getElementById('memorial-display');
    const totalNames = currentNamesArray.length;
    
    let stage = document.getElementById('memorial-stage');
    if (!stage) {
        stage = document.createElement('div');
        stage.id = 'memorial-stage';
        stage.className = 'memorial-stage';
        container.appendChild(stage);
    }

    memorialInterval = setInterval(() => {
        if (currentIndex < totalNames) {
            stage.style.opacity = 0;
            stage.textContent = currentNamesArray[currentIndex];
            setTimeout(() => { stage.style.opacity = 1; }, 100);

            const progressPercent = ((currentIndex + 1) / totalNames) * 100;
            document.getElementById('name-progress-fill').style.width = `${progressPercent}%`;
            document.getElementById('name-counter').textContent = `${currentIndex + 1} of ${totalNames}`;

            currentIndex++;
        } else {
            clearInterval(memorialInterval);
            memorialInterval = null;
            document.getElementById('progress-wrapper').style.display = 'none';
            
            // Show restart button once sequence completes
            document.getElementById('stop-btn').style.display = 'none';
            document.getElementById('restart-btn').style.display = 'inline-block';

            stage.style.opacity = 0;
            setTimeout(() => {
                stage.remove();
                renderSmoothPermanentGrid(currentNamesArray, container);
            }, 500);
        }
    }, 2500); 
}

// UI State Controller (Expanded to handle Restart visibility)
function toggleButtons(state) {
    const playBtn = document.getElementById('play-btn');
    const stopBtn = document.getElementById('stop-btn');
    const continueBtn = document.getElementById('continue-btn');
    const endBtn = document.getElementById('end-btn');
    const restartBtn = document.getElementById('restart-btn');

    if (state === 'playing') {
        playBtn.style.display = 'none';
        continueBtn.style.display = 'none';
        stopBtn.style.display = 'inline-block';
        endBtn.style.display = 'inline-block';      // Visible while playing
        restartBtn.style.display = 'inline-block';
    } else if (state === 'stopped') {
        stopBtn.style.display = 'none';
        continueBtn.style.display = 'inline-block';
        endBtn.style.display = 'none';              // Hide End when paused
        restartBtn.style.display = 'inline-block';
    }
}

// Audio Fade-In Algorithm
function fadeInAudio(audio) {
    audio.volume = 0;
    audio.play().catch(e => console.log("Audio play blocked by browser policy:", e));
    
    let fadeStep = setInterval(() => {
        if (audio.volume < 0.9) {
            audio.volume += 0.05;
        } else {
            audio.volume = 1.0;
            clearInterval(fadeStep);
        }
    }, 100);
}

// Audio Fade-Out Algorithm
function fadeOutAudio(audio) {
    let fadeStep = setInterval(() => {
        if (audio.volume > 0.1) {
            audio.volume -= 0.05;
        } else {
            audio.volume = 0;
            audio.pause();
            clearInterval(fadeStep);
        }
    }, 100);
}

function renderSmoothPermanentGrid(names, container) {
    const wrapper = document.createElement('div');
    wrapper.className = 'memorial-grid-wrapper';
    
    wrapper.innerHTML = '<h3 style="margin-top: 1rem; color: #fff;">The Complete Record</h3>';
    const grid = document.createElement('div');
    grid.className = 'memorial-grid';
    
    names.forEach(name => {
        const item = document.createElement('span');
        item.className = 'keyword grid-name';
        item.textContent = name;
        grid.appendChild(item);
    });
    
    wrapper.appendChild(grid);
    container.appendChild(wrapper);

    setTimeout(() => {
        wrapper.classList.add('visible');
    }, 50);
}

function endTribute() {
    clearInterval(memorialInterval);
    memorialInterval = null;

    document.getElementById('progress-wrapper').style.display = 'none';

    const container = document.getElementById('memorial-display');
    container.innerHTML = ''; 

    document.getElementById('stop-btn').style.display = 'none';
    document.getElementById('continue-btn').style.display = 'none';
    document.getElementById('end-btn').style.display = 'none';
    document.getElementById('restart-btn').style.display = 'inline-block';

renderSmoothPermanentGrid(currentNamesArray, container);
}