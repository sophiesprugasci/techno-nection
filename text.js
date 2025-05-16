const phrases = [
  `The easiest way to get into the meditative state is to begin by listening`,
  `If you simply close your eyes and allow yourself to hear all the sounds that are going on around you`,
  `Just listen to the general hum and buzz of the world as if you were listening to music`,
  `Don't try to identify the sounds you're hearing, don't put names on them, simply allow them to play with your eardrums`,
  `And let them go let your ears hear whatever they want to hear`,
  `Don't judge the sounds`,
  `There's no as it were proper sounds or improper sounds`,
  `It doesn't matter if someone coughs or sneezes or drops something: it's all just sound`,
  `Don't try to make any sense out of what I am saying because your brain will take care of that automatically`,
  `You don't have to try to understand anything`,
  `Just listen to the sound`,
  `Just listen to the sound`,
  `Just listen to the sound`,
  `Now it's amazing what doesn't exist in the real world`,
  `For example in the real world there aren't any things nor are there any events that doesn't mean to say that the real world is a perfectly features blank`,
  `It means that it is a marvelous system of wiggles in which we describe things and events in the same way as we would project images on a block`,
  `Or pick out particular groups of stars in the sky and call them constellations as if they were separate groups of stars`,
  `They're groups of stars in the mind's eye in our system of concepts`,
  `They are not out there as constellations already grouped in the sky`,
  `So in the same way the difference between myself and all the rest of the universe is nothing more than an idea`,
  `It is not a real difference`,
  `And meditation is the way in which we come to feel our basic inseparability from the whole universe`,
  `And what that requires is that we shut up`
];

// New intro phrases array
const introPhrases = [
  "Devi vederla così, la techno è tecnologica. È una maniera futuristica di fare musica: fare qualcosa che non è stato già fatto.",
  "Gli spazi che la club culture ha occupato e trasformato attraverso l'estasi e la scomparsa collettiva rappresentano una fantasia di liberazione, una fuga dalla propria identità. Un luogo dove non si è nessuno, ma al quale si appartiene tutti."
];

// Remove old preload, customFont and static draw logic and add dynamic reveal animation:
let currentPhraseIndex = 0;
let words = [];
let displayedWordsCount = 0;
let nextWordTime = 0;
let phraseSpeed = 0;
let isHolding = false;
let holdStartTime = 0;
const wordDelayMin = 50;
const wordDelayMax = 200;

// Background video container and elements
let bgVideos = [];
// Video sequence control: 1.mp4->3s, 2.mp4->4s, …, 8.mp4->10s
const clipFiles = Array.from({length: 8}, (_, i) => `clips/${i+1}.mp4`);
const clipDurations = clipFiles.map((_, i) => (i+3) * 1000);
let currentClipIndex = 0;

// Add these variables for motion detection
let prevPixels = null;
let motionBlobs = [];
const motionThreshold = 180;  // Even higher threshold (less sensitive)
const blobMinSize = 80;      // Smaller minimum blob size

// Add a new variable to track the black screen state
let showBlackScreen = true;
let blackScreenStartTime = 0;

// Add a variable to track which loop (first or second) is active
let phraseLoopCount = 0;
let betweenLoopsBlack = false;
let betweenLoopsStartTime = 0;

// === SET HOW MANY LOOPS BEFORE VIDEO APPEARS HERE ===
const LOOPS_BEFORE_VIDEO = 2; // <<<< CHANGE THIS NUMBER TO CONTROL LOOPS BEFORE VIDEO

let introIndex = 0;
let introStartTime = 0;
let inIntro = true;

// === INTRO PHASES ===
// 0: black (3s)
// 1: fade in (1s)
// 2: show (7s)
// 3: fade out (1s)
// 4: black (3s)
// 5: phrases loop
let introPhase = 0;
let introPhaseStartTime = 0;
let introAlpha = 0;

// For word-by-word reveal (no fade)
let currentWordRevealStart = 0;
const WORD_REVEAL_DURATION = 70; // ms, much faster

let hasEnteredFullscreen = false;

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.style('position', 'relative');
  canvas.style('z-index', '1');
  textFont('Helvetica Neue, Arial, sans-serif');
  textStyle(BOLD);
  textSize(60);
  textLeading(60);
  fill(255);
  textAlign(LEFT, TOP);
  initPhrase();

  const container = document.getElementById('bgContainer');
  clipFiles.forEach((src) => {
    const vid = document.createElement('video');
    vid.src = src;
    vid.muted = true;
    vid.playsInline = true;
    vid.preload = 'auto';
    vid.style.position = 'absolute';
    vid.style.top = '0';
    vid.style.left = '0';
    vid.style.width = '100%';
    vid.style.height = '100%';
    vid.style.objectFit = 'cover';
    vid.style.filter = 'grayscale(1)';
    vid.style.opacity = '0';
    vid.style.transition = 'opacity 0.5s ease-in-out';
    // Add video load/error event logging
    vid.onerror = function() {
      console.error('Video failed to load:', src);
    };
    vid.onloadeddata = function() {
      console.log('Video loaded:', src);
    };
    container.appendChild(vid);
    bgVideos.push(vid);
  });
  // start video sequence with crossfade
  startVideoLoop();
  
  // Initialize motion detection
  prevPixels = createImage(width, height);
  blackScreenStartTime = millis();
  showBlackScreen = true;
  introIndex = 0;
  introStartTime = millis();
  inIntro = true;

  // Intro phase setup
  introPhase = 0;
  introPhaseStartTime = millis();
  introAlpha = 0;
}

function initPhrase() {
  const phrase = phrases[currentPhraseIndex];
  words = phrase.split(' ');
  displayedWordsCount = 0;
  currentWordRevealStart = millis();
  isHolding = false;
}


function draw() {
  if (fullscreen()) {
    noCursor();
  } else {
    cursor();
  }

  // --- MULTI-PHASE INTRO SEQUENCE ---
  if (introPhase < 5) {
    background(0);
    let now = millis();
    let elapsed = now - introPhaseStartTime;
    if (introPhase === 0) { // Black screen (3s)
      if (elapsed >= 3000) {
        introPhase = 1;
        introPhaseStartTime = now;
      }
    } else if (introPhase === 1) { // Fade in (1s)
      introAlpha = map(elapsed, 0, 1000, 0, 255, true);
      drawIntroPhrase(introAlpha);
      if (elapsed >= 1000) {
        introPhase = 2;
        introPhaseStartTime = now;
        introAlpha = 255;
      }
    } else if (introPhase === 2) { // Show (7s)
      drawIntroPhrase(255);
      if (elapsed >= 7000) {
        introPhase = 3;
        introPhaseStartTime = now;
      }
    } else if (introPhase === 3) { // Fade out (1s)
      introAlpha = map(elapsed, 0, 1000, 255, 0, true);
      drawIntroPhrase(introAlpha);
      if (elapsed >= 1000) {
        introPhase = 4;
        introPhaseStartTime = now;
      }
    } else if (introPhase === 4) { // Black screen (3s)
      if (elapsed >= 3000) {
        introPhase = 5;
        introPhaseStartTime = now;
      }
    }
    return;
  }

  // --- PHRASES LOOP: ALWAYS USE FIRST LOOP DYNAMIC FOREVER ---
  // Black screen logic for 10 seconds at the start of the first loop
  if (showBlackScreen) {
    background(0);
    if (millis() - blackScreenStartTime >= 10000) {
      showBlackScreen = false;
    }
    return;
  }

  // Black screen for 10s between loops
  if (betweenLoopsBlack) {
    background(0);
    if (millis() - betweenLoopsStartTime >= 10000) {
      betweenLoopsBlack = false;
      currentPhraseIndex = 0;
      initPhrase();
    }
    return;
  }

  // Handle video frame capture and motion detection
  let currentFrame = null;
  try {
    currentFrame = captureCurrentFrame();
  } catch (e) {
    console.warn('Error capturing current frame:', e);
    currentFrame = null;
  }
  if (currentFrame) {
    try {
      motionBlobs = detectBlobs(currentFrame);
    } catch (e) {
      console.warn('Error detecting blobs:', e);
      motionBlobs = [];
    }
  } else {
    motionBlobs = [];
  }

  // --- ALWAYS SHOW BLOBS ON BLACK BACKGROUND ---
  background(0);
  for (let blob of motionBlobs) {
    let region = null;
    try {
      if (!currentFrame) {
        console.warn('No currentFrame available, skipping blob drawing');
        continue;
      }
      region = currentFrame.get(blob.minX, blob.minY, blob.width, blob.height);
      region.loadPixels();
      for (let i = 0; i < region.pixels.length; i += 4) {
        let r = region.pixels[i];
        let g = region.pixels[i+1];
        let b = region.pixels[i+2];
        let gray = 0.299*r + 0.587*g + 0.114*b;
        region.pixels[i] = region.pixels[i+1] = region.pixels[i+2] = gray;
      }
      region.updatePixels();
      if (phraseLoopCount % 2 === 1) { // Odd loops: invert colors
        region.loadPixels();
        for (let i = 0; i < region.pixels.length; i += 4) {
          region.pixels[i] = 255 - region.pixels[i];     // R
          region.pixels[i+1] = 255 - region.pixels[i+1]; // G
          region.pixels[i+2] = 255 - region.pixels[i+2]; // B
        }
        region.updatePixels();
      }
      image(region, blob.minX, blob.minY);
    } catch (e) {
      console.warn('Error extracting or drawing blob region:', e);
      continue;
    }
  }
  // Draw the phrase text with word-by-word reveal (no fade)
  textFont('Helvetica Neue, Arial, sans-serif');
  textStyle(BOLD);
  textSize(60);
  textLeading(60);
  textAlign(LEFT, TOP);
  fill(255);
  const x = width * 0.01;
  const y = height * 0.01;
  const boxWidth = width * 0.7;
  let cursorX = x;
  let cursorY = y;
  let spaceW = textWidth(' ');
  for (let i = 0; i < words.length; i++) {
    if (i < displayedWordsCount) {
      // Already revealed, full opacity
      text(words[i], cursorX, cursorY);
    } else {
      // Not yet revealed
      break;
    }
    cursorX += textWidth(words[i]) + spaceW;
    // Wrap text if needed
    if (cursorX > x + boxWidth) {
      cursorX = x;
      cursorY += textLeading();
    }
  }
  // Reveal logic: only reveal next word after fixed duration
  if (!isHolding) {
    if (displayedWordsCount < words.length) {
      let t = (millis() - currentWordRevealStart) / WORD_REVEAL_DURATION;
      if (t >= 1) {
        displayedWordsCount++;
        currentWordRevealStart = millis();
      }
    } else {
      isHolding = true;
      holdStartTime = millis();
    }
  } else if (millis() >= holdStartTime + 7000) {
    currentPhraseIndex = (currentPhraseIndex + 1);
    console.log('Advancing to phrase', currentPhraseIndex, 'of', phrases.length, 'PhraseLoopCount:', phraseLoopCount);
    if (currentPhraseIndex >= phrases.length) {
      // Instead of advancing to video phase, just restart phrases
      currentPhraseIndex = 0;
    }
    initPhrase();
  }
  return;
}

function drawIntroPhrase(alpha) {
  push();
  textFont('Courier New');
  textStyle(NORMAL);
  textSize(28);
  textLeading(28);
  fill(255, alpha);
  textAlign(CENTER, CENTER);
  const introText = introPhrases[0];
  const x = width / 6;
  const y = height / 2;
  const boxWidth = width * 0.7;
  text(introText, x, y, boxWidth);
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Crossfade between preloaded video elements
function startVideoLoop() {
  const nextIdx = currentClipIndex;
  const prevIdx = (currentClipIndex + clipFiles.length - 1) % clipFiles.length;
  const nextVid = bgVideos[nextIdx];
  const prevVid = bgVideos[prevIdx];
  // start next video at random segment start, avoiding the first 10 seconds
  const durSec = nextVid.duration || 0;
  const segSec = clipDurations[nextIdx] / 1000;
  let startTime = 0;
  if (durSec > segSec + 10) {
    startTime = 10 + Math.random() * (durSec - segSec - 10);
  } else if (durSec > segSec) {
    startTime = Math.random() * (durSec - segSec);
  }
  nextVid.currentTime = startTime;
  nextVid.play();
  // fade in next, fade out previous
  nextVid.style.opacity = '1';
  prevVid.style.opacity = '0';
  // pause prev after fade
  setTimeout(() => prevVid.pause(), 500);
  // schedule next segment
  const delay = clipDurations[nextIdx];
  currentClipIndex = (currentClipIndex + 1) % clipFiles.length;
  setTimeout(startVideoLoop, delay);
}

// Add this function to capture current frame
function captureCurrentFrame() {
  // Create a frame capture from the currently visible video
  const currentVid = bgVideos.find(vid => vid.style.opacity > 0.5);
  if (!currentVid || currentVid.paused || currentVid.readyState < 2) return null;
  
  let capture = createImage(width, height);
  let canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  let ctx = canvas.getContext('2d');
  ctx.drawImage(currentVid, 0, 0, width, height);
  capture.drawingContext.drawImage(canvas, 0, 0, width, height);
  
  return capture;
}

// Modify the detectBlobs function to avoid text areas completely
function detectBlobs(currentFrame) {
  if (!currentFrame || !prevPixels) return [];
  
  currentFrame.loadPixels();
  prevPixels.loadPixels();
  
  // Store the binary motion mask
  let motionMask = createImage(width, height);
  motionMask.loadPixels();
  
  // Define text safe zones to completely avoid
  const textTopSafeZone = height * 0.25;  // Top 25% for phrase text
  const tableStartY = height * 0.95;     // From 65% down is table area
  
  // Create binary mask of motion
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      
      // Skip text areas entirely - no motion detection in these regions
      if (y < textTopSafeZone || y > tableStartY) {
        motionMask.pixels[i] = 0;
        motionMask.pixels[i + 1] = 0;
        motionMask.pixels[i + 2] = 0;
        motionMask.pixels[i + 3] = 255;
        continue;
      }
      
      // Get the RGB values from both frames
      const r1 = currentFrame.pixels[i];
      const g1 = currentFrame.pixels[i + 1];
      const b1 = currentFrame.pixels[i + 2];
      
      const r2 = prevPixels.pixels[i];
      const g2 = prevPixels.pixels[i + 1];
      const b2 = prevPixels.pixels[i + 2];
      
      // Calculate the difference
      const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
      
      // Set motion mask pixel based on higher threshold
      const motionDetected = diff > motionThreshold;
      motionMask.pixels[i] = motionDetected ? 255 : 0;
      motionMask.pixels[i + 1] = motionDetected ? 255 : 0;
      motionMask.pixels[i + 2] = motionDetected ? 255 : 0;
      motionMask.pixels[i + 3] = 255;
    }
  }
  motionMask.updatePixels();
  
  // Now find connected components (blobs) using a simplified algorithm
  let blobs = [];
  let visited = new Array(width * height).fill(false);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const idx = y * width + x;
      
      // Skip if already visited or no motion
      if (visited[idx] || motionMask.pixels[i] === 0) continue;
      
      // Start a new blob
      let blob = { minX: x, minY: y, maxX: x, maxY: y, size: 0 };
      let queue = [{x, y}];
      visited[idx] = true;
      
      // Breadth-first search to find connected pixels
      while (queue.length > 0) {
        const {x: cx, y: cy} = queue.shift();
        blob.size++;
        
        // Update blob boundaries
        blob.minX = Math.min(blob.minX, cx);
        blob.minY = Math.min(blob.minY, cy);
        blob.maxX = Math.max(blob.maxX, cx);
        blob.maxY = Math.max(blob.maxY, cy);
        
        // Check neighbors (4-connected)
        const neighbors = [
          {x: cx+1, y: cy}, {x: cx-1, y: cy},
          {x: cx, y: cy+1}, {x: cx, y: cy-1}
        ];
        
        for (let neighbor of neighbors) {
          const nx = neighbor.x;
          const ny = neighbor.y;
          
          // Skip if out of bounds
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          
          const nidx = ny * width + nx;
          const ni = nidx * 4;
          
          // Skip if already visited or no motion
          if (visited[nidx] || motionMask.pixels[ni] === 0) continue;
          
          // Mark as visited and add to queue
          visited[nidx] = true;
          queue.push({x: nx, y: ny});
        }
      }
      
      // Only add blobs that are big enough
      if (blob.size > blobMinSize) {
        // Add width and height properties
        blob.width = blob.maxX - blob.minX;
        blob.height = blob.maxY - blob.minY;
        
        // Skip if the blob is too small in either dimension
        if (blob.width >= blobMinSize && blob.height >= blobMinSize) {
          blobs.push(blob);
        }
      }
    }
  }
  
  // Final filtering - reject any blob that overlaps with text areas
  let filteredBlobs = [];
  for (let blob of blobs) {
    // Skip if blob overlaps with text areas
    if (blob.minY < textTopSafeZone || blob.maxY > tableStartY) {
      continue;
    }
    filteredBlobs.push(blob);
  }
  
  // Store the current frame for the next comparison
  prevPixels = currentFrame.get();
  
  return filteredBlobs;
}

function keyPressed() {
  if (!hasEnteredFullscreen && (keyCode === ENTER || key === 'Enter')) {
    let fs = fullscreen();
    if (!fs) {
      fullscreen(true);
      hasEnteredFullscreen = true;
    }
  }
}
