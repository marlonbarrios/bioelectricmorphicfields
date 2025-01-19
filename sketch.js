// Constants and configurations
const proxyURL = "https://replicate-api-proxy.glitch.me/create_n_get/";
const MAX_PARTICLES = 10;
const MAX_HISTORY = 15;
const GENERATION_INTERVAL = 10000;
const synth = window.speechSynthesis;
const CENTER_PULL = 0.02;  // Force pulling particles to center
const ZOOM_SPEED = 0.003;  // Slower base speed for smoother movement
const ZOOM_RANGE = 400;    // Base zoom range
const ZOOM_OFFSET = 800;   // Base camera distance
let zoomFactor = 0;
let secondaryZoom = 0;
let breathingZoom = 0;

// System prompts
const system_prompt = `Generate complete, self-contained statements about bioelectricity, cellular development, and biological regeneration, drawing from Michael Levin's research on embodied intelligence. Focus on:

1. How electrical signals guide growth, healing, and pattern formation in living systems
2. The journey from matter to mind - how intelligence emerges and scales from cells to organisms
3. Bioelectric communication networks in non-neural tissues
4. The proto-cognitive abilities of cell collectives
5. How anatomical homeostasis and repair demonstrate problem-solving intelligence
6. The intersection of developmental biology, artificial life, and cognitive science
7. Morphogenesis as navigation through anatomical space
8. The role of bioelectric networks in storing and processing pattern information
9. Scale-invariant principles of biological intelligence
10. Novel synthetic living systems and their emergent behaviors
11. How biological memory manifests as physical form
12. The relationship between memory, pattern, and structure
13. The musical nature of bioelectric signaling frequencies
14. Visual patterns and geometric forms in morphogenesis
15. The choreography of cellular movement and organization
16. Harmonic relationships in biological pattern formation
17. The aesthetic principles of biological self-organization
18. Memory as a sculptural force in living systems
19. The relationship between form, function, and artistic expression in nature
20. How collective behavior creates complex spatial and temporal compositions

Each statement must be a complete thought that ends with a period. Include concepts about collective intelligence, bioelectric signaling, morphogenetic fields, and developmental decision-making. Frame biological processes in terms of information processing, problem-solving strategies, and their inherent artistic and musical qualities.`;

// Array of different prompts to cycle through
const prompts = [
    "Cellular choreography and dance patterns",
    "Bioelectric rhythms and musical structures",
    "Morphogenetic harmonies and resonance",
    "Memory as biological sculpture",
    "Form as crystallized memory",
    "Biological composition principles",
    "Cellular collective art-making",
    "Emergent aesthetic patterns",
    "Bioelectric symphonies",
    "Living architecture patterns",
    "Organic geometric forms",
    "Memory-shaped morphogenesis",
    "Natural compositional intelligence",
    "Biological improvisation patterns",
    "Cellular ensemble behaviors",
    "Morphic resonance in art",
    "Embodied memory patterns",
    "Bioelectric orchestration",
    "Living pattern languages",
    "Memory architectures in nature",
    "Cellular aesthetic emergence",
    "Biological composition rules",
    "Form as memory made visible",
    "Natural form generation",
    "Organic visual rhythms",
    "Memory-form relationships"
];

// Add to global variables
const DANCE_MODES = {
  PULSE: 0,
  SPIRAL: 1,
  WAVE: 2
};

// Add to global variables
const SHAPE_TYPES = {
  PLANE: 'plane'
};

// Global variables
let outputContainer;
let particles = [];
let isGenerating = false;
let autoGenerate = false;
let textHistory = [];
let lastUsedPrompts = new Set();
let isSpeaking = false;
let speechQueue = [];
let currentlySpokenText = null;
let audioContext;
let oscillators = [];
let gainNodes = [];
let filterNodes = [];
const NUM_OSCILLATORS = 4;  // Reduced from 6 for less complex sound
const BPM = 100;  // Slower tempo for calmer feel
const BEAT_INTERVAL = (60 / BPM) * 1000;  // Convert BPM to milliseconds

// Update constants for more stable sound
const SEPARATION_FORCE = 1.2;    // Reduced separation
const COHESION_FORCE = 0.8;      // Increased cohesion for stability
const ALIGNMENT_FORCE = 0.6;     // Increased alignment for smoother movement
const WANDER_STRENGTH = 0.002;   // Reduced random movement
const MAX_SPEED = 1.0;           // Slower movement
const MAX_FORCE = 0.04;          // Reduced force
const EDGE_BUFFER = 150;         // Softer boundaries

// Add new audio variables
let kickGain;
let hihatGain;
let delayNode;
let compressor;

// Add beat tracking to setupRhythm function
let beatTime = 0;
let lastBeatTime = 0;

let isAutoGenerating = false;
let generationInterval;
const AUTO_GENERATION_INTERVAL = 10000; // 10 seconds

// Add to global variables
let popSynth;
let hoverSynth;

// Add to global variables
let rhythmComplexity = 1;
const MAX_COMPLEXITY = 4;

// Add to global variables
const BASE_FREQUENCIES = [146.83, 220, 293.66, 440];  // Initial frequencies
let currentScale = 0;  // Track current musical scale
const SCALES = [
  [146.83, 220, 293.66, 440],     // D minor
  [174.61, 261.63, 349.23, 523.25], // F major
  [196, 293.66, 392, 587.33],     // G major
  [220, 329.63, 440, 659.25]      // A major
];

// Add to global variables
let mediaRecorder;
let recordedChunks = [];
let isRecording = false;
let recordingStream;
let destinationNode;
let recordingStartTime;
let recordingDuration = 0;

// Add to global variables
let streamingText = '';
let targetText = '';
let streamingIndex = 0;
let lastStreamTime = 0;
const STREAM_SPEED = 30; // Characters per second
const STREAM_INTERVAL = 1000 / STREAM_SPEED; // Milliseconds between each character

// Add to global variables
let popParticles = [];

class Particle {
  constructor(img, text) {
    this.pos = createVector(
      random(-width/3, width/3),
      random(-height/3, height/3),
      random(-300, 300)
    );
    this.vel = p5.Vector.random3D().mult(0.3);
    this.acc = createVector(0, 0, 0);
    this.img = img;
    this.text = text;
    this.originalSize = 200;
    this.size = this.originalSize;
    this.isHovered = false;
    this.targetSize = this.originalSize;
    this.hoverScale = 2.5;
    this.lastHoverState = false;
    this.currentUtterance = null;
    
    // Update movement parameters
    this.maxSpeed = MAX_SPEED;
    this.maxForce = MAX_FORCE;
    this.separationDist = 300;
    this.cohesionDist = 500;
    this.alignmentDist = 400;
    
    // Add parameters for organic movement
    this.wanderTheta = random(TWO_PI);
    this.wanderRadius = 50;
    this.wanderDistance = 100;
    this.phaseOffset = random(TWO_PI);
    
    // Add beat-related properties
    this.beatScale = 1;
    this.lastBeatScale = 1;
    this.beatPhase = random(TWO_PI);
    this.beatOffset = random(0.5);
    
    // Add dance properties with more dramatic values
    this.danceMode = floor(random(3));
    this.dancePhase = random(TWO_PI);
    this.danceAmplitude = random(1.0, 2.0);  // Increased amplitude range
    this.danceSpeed = random(1.2, 1.8);      // Increased speed range
    
    // Add rotation properties
    this.rotX = random(TWO_PI);
    this.rotY = random(TWO_PI);
    this.rotZ = random(TWO_PI);
    this.rotSpeedX = random(-0.05, 0.05);  // Increased rotation speed range
    this.rotSpeedY = random(-0.05, 0.05);  // Increased rotation speed range
    this.rotSpeedZ = random(-0.05, 0.05);  // Increased rotation speed range
    
    // Shape type is always PLANE
    this.shapeType = SHAPE_TYPES.PLANE;
  }

  update() {
    if (!this.isHovered) {
      let time = frameCount * 0.02;
      let waveForce = createVector(
        sin(time) * 0.2,
        cos(time) * 0.1,
        sin(time * 0.7) * 0.15
      );
      this.acc.add(waveForce);
      
      // Add slight upward bias
      this.acc.add(createVector(0, -0.01, 0));
      
      // Calculate beat progress safely
      let beatProgress = 0;
      if (audioContext) {
        beatProgress = (audioContext.currentTime - lastBeatTime) / (BEAT_INTERVAL / 1000);
        beatProgress = constrain(beatProgress, 0, 1);
      }
      
      // Update beat scale
      this.lastBeatScale = this.beatScale;
      this.beatScale = 1 + (0.3 * Math.exp(-beatProgress * 8) * sin(this.beatPhase));
      
      // Add beat-synchronized movement
      let beatInfluence = sin(beatProgress * TWO_PI + this.beatPhase) * this.beatOffset * 1.5;
      this.vel.add(createVector(
        cos(this.beatPhase) * beatInfluence * 0.4,
        sin(this.beatPhase) * beatInfluence * 0.4,
        sin(beatProgress * PI) * beatInfluence * 0.2
      ));
      
      // Calculate forces
      let separation = this.separate();
      let alignment = this.align();
      let cohesion = this.cohesion();
      let wander = this.getWanderForce();
      
      // Apply forces with safety checks
      if (separation) this.acc.add(separation.mult(SEPARATION_FORCE));
      if (alignment) this.acc.add(alignment.mult(ALIGNMENT_FORCE));
      if (cohesion) this.acc.add(cohesion.mult(COHESION_FORCE));
      if (wander) this.acc.add(wander.mult(WANDER_STRENGTH));
      
      // Update velocity and position
      this.vel.add(this.acc);
      this.vel.limit(this.maxSpeed);
      this.pos.add(this.vel);
      
      // Reset acceleration
      this.acc.mult(0);
    }
    
    // Constrain to bounds
    this.pos.x = constrain(this.pos.x, -width/3, width/3);
    this.pos.y = constrain(this.pos.y, -height/3, height/3);
    this.pos.z = constrain(this.pos.z, -300, 300);
  }

  separate() {
    let steering = createVector(0, 0, 0);
    let count = 0;
    
    for (let other of particles) {
      if (other !== this) {
        let d = p5.Vector.dist(this.pos, other.pos);
        if (d > 0 && d < this.separationDist) {
          let diff = p5.Vector.sub(this.pos, other.pos);
          diff.normalize();
          diff.div(d);
          steering.add(diff);
          count++;
        }
      }
    }
    
    if (count > 0) {
      steering.div(count);
      steering.setMag(this.maxSpeed);
      steering.sub(this.vel);
      steering.limit(this.maxForce);
    }
    
    return steering;
  }

  align() {
    let steering = createVector(0, 0, 0);
    let count = 0;
    
    for (let other of particles) {
      if (other !== this) {
        let d = p5.Vector.dist(this.pos, other.pos);
        if (d > 0 && d < this.alignmentDist) {
          steering.add(other.vel);
          count++;
        }
      }
    }
    
    if (count > 0) {
      steering.div(count);
      steering.setMag(this.maxSpeed);
      steering.sub(this.vel);
      steering.limit(this.maxForce);
    }
    
    return steering;
  }

  cohesion() {
    let steering = createVector(0, 0, 0);
    let count = 0;
    
    for (let other of particles) {
      if (other !== this) {
        let d = p5.Vector.dist(this.pos, other.pos);
        if (d > 0 && d < this.cohesionDist) {
          steering.add(other.pos);
          count++;
        }
      }
    }
    
    if (count > 0) {
      steering.div(count);
      steering.sub(this.pos);
      steering.setMag(this.maxSpeed);
      steering.sub(this.vel);
      steering.limit(this.maxForce);
    }
    
    return steering;
  }

  getWanderForce() {
    this.wanderTheta += random(-0.3, 0.3);
    let wanderPoint = this.vel.copy();
    wanderPoint.normalize();
    wanderPoint.mult(this.wanderDistance);
    wanderPoint.add(this.pos);
    
    let theta = this.wanderTheta + this.vel.heading();
    let x = this.wanderRadius * cos(theta);
    let y = this.wanderRadius * sin(theta);
    wanderPoint.add(createVector(x, y, 0));
    
    let steer = p5.Vector.sub(wanderPoint, this.pos);
    steer.normalize();
    steer.mult(this.maxSpeed);
    steer.sub(this.vel);
    steer.limit(this.maxForce);
    
    return steer;
  }

  display() {
    push();
    let zPos = this.pos.z;
    if (this.isHovered) {
      zPos = -400;
    }
    translate(this.pos.x, this.pos.y, zPos);
    
    if (this.img) {
      noStroke();
      ambientLight(60);
      pointLight(255, 255, 255, 0, 0, 500);
      texture(this.img);
      
      // Add beat-influenced rotation
      let beatInfluence = sin(frameCount * 0.1) * 0.2;
      
      // Apply dynamic rotations with beat influence
      rotateX(this.rotX + beatInfluence);
      rotateY(this.rotY + beatInfluence);
      rotateZ(this.rotZ + beatInfluence);
      
      // Update rotations with varying speeds
      this.rotX += this.rotSpeedX * (1 + sin(frameCount * 0.05) * 0.5);
      this.rotY += this.rotSpeedY * (1 + cos(frameCount * 0.05) * 0.5);
      this.rotZ += this.rotSpeedZ * (1 + sin(frameCount * 0.08) * 0.5);
      
      // Add more dramatic beat-based scaling
      let beatScale = 1 + sin(frameCount * 0.1 + this.beatPhase) * 0.3;
      scale(beatScale);
      
      // Draw plane with enhanced glow effect
      for(let i = 4; i >= 0; i--) {
        push();
        let glowAlpha = map(i, 0, 4, 255, 30);
        tint(255, glowAlpha);
        scale(1 + i * 0.15);
        plane(this.size, this.size);
        pop();
      }
      
      // Draw elastic lines between corners
      let halfSize = this.size / 2;
      let corners = [
        createVector(-halfSize, -halfSize, 0),
        createVector(halfSize, -halfSize, 0),
        createVector(halfSize, halfSize, 0),
        createVector(-halfSize, halfSize, 0)
      ];
      
      // Add dynamic displacement to corners
      let time = frameCount * 0.05;
      for (let corner of corners) {
        let displacement = 15 * sin(time + corner.x + corner.y);
        corner.add(
          sin(time + corner.y) * 5,
          cos(time + corner.x) * 5,
          displacement
        );
      }
      
      // Draw elastic lines with glow effect
      for (let i = 0; i < corners.length; i++) {
        let start = corners[i];
        let end = corners[(i + 1) % corners.length];
        
        // Draw multiple lines for glow effect
        for (let g = 3; g >= 0; g--) {
          stroke(100, 200, 255, map(g, 0, 3, 200, 50));
          strokeWeight(g * 1.5 + 1);
          noFill();
          
          // Draw curved line
          beginShape();
          for (let t = 0; t <= 1; t += 0.1) {
            let x = lerp(start.x, end.x, t);
            let y = lerp(start.y, end.y, t);
            let z = lerp(start.z, end.z, t);
            
            // Add sine wave displacement for elastic effect
            let wave = sin(t * PI + time) * 10;
            vertex(
              x + sin(time + y) * wave,
              y + cos(time + x) * wave,
              z + sin(time + x + y) * wave
            );
          }
          endShape();
        }
        
        // Add pulsing connection points
        push();
        translate(start.x, start.y, start.z);
        noStroke();
        fill(150, 220, 255, 200);
        sphere(3 + sin(time * 2) * 1);
        pop();
      }
    }
    pop();
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  textFont('Helvetica');
  setAttributes('antialias', true);
  
  // Create single header container
  let headerContainer = createDiv();
  headerContainer.style('position', 'fixed');
  headerContainer.style('left', '30px');
  headerContainer.style('top', '20px');
  headerContainer.style('z-index', '1001');
  headerContainer.style('width', '400px');
  
  // Simplified header content
  headerContainer.html(`
    <div style="
      background: rgba(0, 0, 0, 0.85);
      padding: 20px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);">
      
      <h1 style="margin: 0 0 15px 0; font-size: 1.8em; color: #4CAF50; font-weight: 300;">
        Bioelectric MetaMorphic Techno Fugue
      </h1>
      
      <p style="margin: 0 0 15px 0; font-size: 1em; color: #FFF; line-height: 1.5;">
        A generative exploration of bioelectricity and cellular memory, 
        based on Michael Levin's research.
      </p>
      
      <p style="margin: 0 0 15px 0; font-size: 0.9em; color: #AAA; line-height: 1.5;">
        Powered by multiple AI systems working in concert:
        LLaMA for generating scientific insights, Stable Diffusion for 
        creating cellular imagery, and neural text-to-speech for 
        real-time narration. Each element emerges through the 
        interaction of these generative systems.
      </p>
      
      <div style="
        font-size: 0.9em;
        color: #AAA;
        line-height: 1.5;
        padding-top: 15px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);">
        <span style="color: #4CAF50;">SPACEBAR</span> start/stop generation • 
        <span style="color: #4CAF50;">S</span> record • 
        hover to interact
      </div>
    </div>
  `);
  
  // Create container for generated text
  let textContainer = createDiv();
  textContainer.style('position', 'fixed');
  textContainer.style('left', '30px');
  textContainer.style('top', '180px');
  textContainer.style('z-index', '1002');
  textContainer.style('width', '400px');
  textContainer.style('max-height', 'calc(100vh - 200px)');
  textContainer.style('overflow-y', 'auto');
  textContainer.style('pointer-events', 'auto');
  
  // Assign to global outputContainer
  outputContainer = textContainer;
  
  // Add initial styles to outputContainer
  outputContainer.style('opacity', '1');
  outputContainer.style('display', 'block');
  outputContainer.style('transition', 'opacity 0.5s ease');
}

function draw() {
  // Create a subtle gradient background that shifts over time
  let bgTime = frameCount * 0.01;
  let bgColor1 = color(
    map(sin(bgTime), -1, 1, 0, 30),        // R: deep blue to purple
    map(sin(bgTime * 0.7), -1, 1, 0, 10),  // G: very subtle
    map(sin(bgTime * 0.5), -1, 1, 20, 40)  // B: deep blue range
  );
  let bgColor2 = color(
    map(cos(bgTime * 0.8), -1, 1, 10, 40), // R: deeper purple
    map(cos(bgTime * 0.6), -1, 1, 0, 15),  // G: very subtle
    map(cos(bgTime * 0.4), -1, 1, 30, 50)  // B: deep blue range
  );
  
  // Apply gradient background
  background(bgColor1);
  push();
  noStroke();
  translate(0, 0, -1000);
  beginShape();
  fill(bgColor1);
  vertex(-width, -height);
  vertex(width, -height);
  fill(bgColor2);
  vertex(width, height);
  vertex(-width, height);
  endShape(CLOSE);
  pop();
  
  // Calculate multi-layered zoom
  let zoomTime = frameCount * ZOOM_SPEED;
  zoomFactor = sin(zoomTime) * ZOOM_RANGE;  // Primary slow zoom
  secondaryZoom = sin(zoomTime * 2.5) * 100;  // Faster secondary movement
  breathingZoom = sin(zoomTime * 0.5) * 50;  // Very slow breathing motion

  // Combine zoom factors with beat influence
  let beatZoom = 0;
  if (audioContext) {
    let beatProgress = (audioContext.currentTime - lastBeatTime) / (BEAT_INTERVAL / 1000);
    beatProgress = constrain(beatProgress, 0, 1);
    beatZoom = sin(beatProgress * TWO_PI) * 150;  // Add beat-synchronized zoom
  }

  // Apply camera with combined zoom effects
  let totalZoom = ZOOM_OFFSET + zoomFactor + secondaryZoom + breathingZoom + beatZoom;
  camera(0, 0, totalZoom, 0, 0, 0, 0, 1, 0);
  
  // Create volumetric fog effect
  push();
  noStroke();
  for (let i = 0; i < 5; i++) {
    let fogTime = frameCount * 0.001 + i;
    let fogY = sin(fogTime) * 500;
    let fogAlpha = map(sin(fogTime * 2), -1, 1, 10, 30);
    fill(100, 150, 255, fogAlpha);
    translate(0, fogY, -500 + i * 200);
    plane(width * 2, height * 2);
  }
  pop();
  
  // Dynamic ambient light that shifts color over time
  let ambientTime = frameCount * 0.01;
  let ambientR = map(sin(ambientTime), -1, 1, 20, 50);
  let ambientG = map(sin(ambientTime * 0.7), -1, 1, 20, 40);
  let ambientB = map(sin(ambientTime * 0.5), -1, 1, 40, 80);
  ambientLight(ambientR, ambientG, ambientB);
  
  // Multiple moving point lights
  let time = frameCount * 0.02;
  
  // Orbital light 1 (warm purple)
  let x1 = cos(time) * 800;
  let z1 = sin(time) * 800;
  pointLight(255, 150, 255, x1, 0, z1);
  
  // Orbital light 2 (cool blue, opposite direction)
  let x2 = cos(time + PI) * 800;
  let z2 = sin(time + PI) * 800;
  pointLight(100, 150, 255, x2, 0, z2);
  
  // Pulsing central light (cyan)
  let centerIntensity = map(sin(time * 1.5), -1, 1, 80, 150);
  pointLight(150, centerIntensity + 50, centerIntensity + 100, 0, 0, 0);
  
  // Vertical moving lights (purple and blue)
  let y3 = sin(time * 0.5) * 500;
  pointLight(200, 100, 255, 0, y3, 400);
  pointLight(100, 150, 255, 0, -y3, -400);
  
  // Add subtle directional light for depth
  directionalLight(
    30 + sin(time) * 20,
    20 + sin(time * 0.7) * 15,
    50 + sin(time * 0.5) * 25,
    sin(time * 0.5),
    cos(time * 0.5),
    -1
  );
  
  // Draw bioelectric connections between particles
  drawBioelectricConnections();
  
  // Update and display pop particles
  for (let i = popParticles.length - 1; i >= 0; i--) {
    popParticles[i].update();
    popParticles[i].display();
    if (popParticles[i].isDead()) {
      popParticles.splice(i, 1);
    }
  }
  
  for (let particle of particles) {
    particle.update();
    particle.display();
  }
  
  // Draw recording indicator
  if (isRecording) {
    push();
    translate(-width/2 + 30, -height/2 + 30);
    
    // Pulsing red circle
    let pulseSize = 20 + sin(frameCount * 0.1) * 5;
    fill(255, 0, 0, 200);
    noStroke();
    circle(0, 0, pulseSize);
    
    // Show recording duration
    fill(255);
    noStroke();
    textAlign(LEFT, CENTER);
    textSize(14);
    recordingDuration = (Date.now() - recordingStartTime) / 1000;
    text(`Recording: ${recordingDuration.toFixed(1)}s`, 30, 0);
    
    pop();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
  if (key === ' ') {
    isAutoGenerating = !isAutoGenerating;
    
    if (isAutoGenerating) {
      // Initialize audio context on first interaction
      if (!audioContext) {
        setupAudio();
      }
      
      // Hide the header container with transition
      const header = document.querySelector('div[style*="backdrop-filter"]');
      header.style.transition = 'opacity 0.5s ease';
      header.style.opacity = '0';
      setTimeout(() => {
        header.style.display = 'none';
      }, 500);
      
      // Show text container
      outputContainer.style.transition = 'opacity 0.5s ease';
      outputContainer.style.opacity = '1';
      outputContainer.style.display = 'block';
      
      // Start continuous generation
      handleGeneration();
      generationInterval = setInterval(() => {
        if (!isGenerating && !isSpeaking) {
          handleGeneration();
        }
      }, AUTO_GENERATION_INTERVAL);
      
    } else {
      // Show the header container
      const header = document.querySelector('div[style*="backdrop-filter"]');
      header.style.display = 'block';
      setTimeout(() => {
        header.style.opacity = '1';
      }, 10);
      
      // Hide text container
      outputContainer.style.opacity = '0';
      setTimeout(() => {
        outputContainer.style.display = 'none';
      }, 500);
      
      // Stop continuous generation
      clearInterval(generationInterval);
    }
  } else if (key === 's' || key === 'S') {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  } else if (key === 'w' || key === 'W') {
    showWireframe = !showWireframe;
  }
}

function toggleAutoGenerate() {
  // Remove this function since we're not using auto-generate
}

function getNextPrompt() {
  let availablePrompts = prompts.filter(p => !lastUsedPrompts.has(p));
  if (availablePrompts.length === 0) {
    lastUsedPrompts.clear();
    availablePrompts = prompts;
  }
  const randomIndex = Math.floor(Math.random() * availablePrompts.length);
  const selectedPrompt = availablePrompts[randomIndex];
  lastUsedPrompts.add(selectedPrompt);
  return selectedPrompt;
}

// Add new function for image appearance sound
function playImageAppearSound() {
  if (!audioContext) return;
  
  const now = audioContext.currentTime;
  
  // Create deep mysterious base sound
  const baseOsc = audioContext.createOscillator();
  const baseGain = audioContext.createGain();
  baseOsc.type = 'sine';
  baseOsc.frequency.setValueAtTime(80, now);  // Much lower base frequency
  baseOsc.frequency.exponentialRampToValueAtTime(120, now + 1.5);  // Slower rise
  baseGain.gain.setValueAtTime(0.4, now);
  baseGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);  // Longer fade
  
  // Create ethereal sweep
  const sweepOsc = audioContext.createOscillator();
  const sweepGain = audioContext.createGain();
  sweepOsc.type = 'sine';
  sweepOsc.frequency.setValueAtTime(150, now);  // Lower sweep start
  sweepOsc.frequency.exponentialRampToValueAtTime(300, now + 1.8);  // Slower sweep
  sweepGain.gain.setValueAtTime(0.2, now);
  sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
  
  // Add mysterious overtones
  const mystOsc = audioContext.createOscillator();
  const mystGain = audioContext.createGain();
  mystOsc.type = 'triangle';  // Softer waveform
  mystOsc.frequency.setValueAtTime(200, now);
  mystOsc.frequency.exponentialRampToValueAtTime(100, now + 1.5);  // Downward sweep
  mystGain.gain.setValueAtTime(0.15, now);
  mystGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
  
  // Add filter for mysterious quality
  const filter = audioContext.createBiquadFilter();
  filter.type = 'lowpass';  // Changed to lowpass for darker sound
  filter.frequency.setValueAtTime(500, now);
  filter.frequency.exponentialRampToValueAtTime(200, now + 1.5);
  filter.Q.value = 3;
  
  // Add longer reverb-like delay
  const delay = audioContext.createDelay(2.0);
  const feedback = audioContext.createGain();
  delay.delayTime.value = 0.4;  // Longer delay time
  feedback.gain.value = 0.4;  // More feedback for mysterious echo
  
  // Connect everything
  baseOsc.connect(baseGain);
  sweepOsc.connect(sweepGain);
  mystOsc.connect(mystGain);
  
  baseGain.connect(filter);
  sweepGain.connect(filter);
  mystGain.connect(filter);
  
  filter.connect(delay);
  filter.connect(compressor);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(compressor);
  
  // Start oscillators with longer duration
  baseOsc.start(now);
  sweepOsc.start(now);
  mystOsc.start(now);
  baseOsc.stop(now + 2.0);
  sweepOsc.stop(now + 2.0);
  mystOsc.stop(now + 1.8);
}

// Modify handleGeneration to play sound when image appears
async function handleGeneration() {
  if (isGenerating) return;
  
  try {
    isGenerating = true;
    const currentPrompt = getNextPrompt();
    
    // Generate text and start speaking immediately
    const textResponse = await getChatResponse(currentPrompt);
    
    // Reset streaming state
    streamingText = '';
    streamingIndex = 0;
    targetText = textResponse;
    lastStreamTime = millis();
    
    // Add new text to history
    textHistory.unshift({
      text: textResponse,
      timestamp: new Date().toLocaleTimeString()
    });
    
    if (textHistory.length > MAX_HISTORY) {
      textHistory.pop();
    }

    // Handle speech
    if (!isSpeaking) {
      speakText(textResponse);
    } else {
      speechQueue.push(textResponse);
    }

    // Force immediate update of display
    updateHistoryDisplay();
    
    // Generate image and create new particle
    const imageResponse = await generateImage(currentPrompt);
    if (imageResponse) {
      loadImage(imageResponse, img => {
        if (particles.length >= MAX_PARTICLES) {
          particles.shift();
        }
        particles.push(new Particle(img, textResponse));
        playImageAppearSound(); // Play sound when new image appears
      });
    }
    
  } catch (error) {
    console.error("Generation error:", error);
  } finally {
    isGenerating = false;
  }
}

async function generateImage(prompt) {
  const data = {
    modelURL: "https://api.replicate.com/v1/models/stability-ai/stable-diffusion-3/predictions",
    input: {
      prompt: "scientific visualization, cellular networks, bioluminescent organisms, electric plasma, fire-like energy flows, lightning arcs, glowing neural pathways, " + prompt,
      width: 512,
      height: 512,
      num_outputs: 1,
      guidance_scale: 7.5,
      negative_prompt: "cartoon, illustration, abstract art, white background, dull colors, flat lighting, monochrome"
    },
  };

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };

  const response = await fetch(proxyURL, options);
  const json = await response.json();
  return json.output[0];
}

async function getChatResponse(userInput) {
  const data = {
    modelURL: "https://api.replicate.com/v1/models/meta/meta-llama-3-70b-instruct/predictions",
    input: {
      prompt: userInput + ". Express as a single, direct statement about bioelectricity or cellular behavior that ends with a period. Keep it under 20 words.",
      system_prompt: system_prompt,
      max_tokens: 30,  // Reduced from 60 to enforce brevity
      temperature: 0.7,
      top_p: 0.9,
    },
  };

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };

  const response = await fetch(proxyURL, options);
  const json_response = await response.json();
  let text = json_response.output.join("").trim();
  
  // Ensure text ends with a period
  if (!text.endsWith('.')) {
    text += '.';
  }
  
  // If text is too long, truncate to the last complete sentence
  if (text.length > 100) {
    const lastPeriodIndex = text.lastIndexOf('.');
    if (lastPeriodIndex > 20) {
      text = text.substring(0, lastPeriodIndex + 1);
    }
  }
  
  // Ensure we have a complete statement
  if (text.length < 10) { // If too short
    text = "Bioelectric fields guide cellular memory and pattern formation."; // fallback
  }
  
  return text;
}

function speakText(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Optimize voice settings
  utterance.rate = 0.85;      // Slightly slower
  utterance.pitch = 1.1;      // Slightly higher pitch
  utterance.volume = 1;       // Full volume
  
  // Get available voices and select a clear one
  const voices = speechSynthesis.getVoices();
  const preferredVoice = voices.find(voice => 
    voice.name.includes('Daniel') || // Good English voice
    voice.name.includes('Google') || // Google's voices are usually clear
    voice.name.includes('Premium')   // Premium voices tend to be better
  );
  
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }
  
  // Reset streaming state when speech starts
  utterance.onstart = () => {
    isSpeaking = true;
    currentlySpokenText = text;
    streamingText = '';
    streamingIndex = 0;
    targetText = text;
    lastStreamTime = millis();
    
    // Reduce background volume
    gainNodes.forEach(gain => {
      gain.gain.setTargetAtTime(0.03, audioContext.currentTime, 0.5);
    });
  };
  
  // Add boundary event to sync streaming with speech
  utterance.onboundary = (event) => {
    if (event.name === 'word') {
      const wordIndex = event.charIndex;
      streamingIndex = Math.min(wordIndex + event.charLength, text.length);
      streamingText = text.substring(0, streamingIndex);
      updateHistoryDisplay();
    }
  };
  
  utterance.onend = () => {
    isSpeaking = false;
    currentlySpokenText = null;
    streamingText = text; // Ensure full text is shown
    streamingIndex = text.length;
    
    // Restore background volume
    gainNodes.forEach(gain => {
      gain.gain.setTargetAtTime(0.1, audioContext.currentTime, 1);
    });
    updateHistoryDisplay();
    
    // Handle speech queue
    if (speechQueue.length > 0) {
      speakText(speechQueue.shift());
    }
  };
  
  synth.speak(utterance);
}

function updateHistoryDisplay() {
  let historyHTML = textHistory.map((item, index) => `
    <div style="
      background: transparent;
      padding: 20px;
      margin-bottom: 20px;
      width: 100%;
      position: relative;
      transform: translateY(${index * 10}px);
      transition: all 0.3s ease;
      border-left: 2px solid ${item.text === currentlySpokenText ? '#4CAF50' : 'rgba(255, 255, 255, 0.2)'};
      padding-left: 15px;">
      <div style="
        color: rgba(255, 255, 255, 0.5); 
        font-size: 0.8em; 
        font-family: 'Courier New', monospace;
        margin-bottom: 8px;">
        [${item.timestamp}] > BIOELECTRIC_SIGNAL_${String(index).padStart(3, '0')}
      </div>
      <div style="
        color: rgba(255, 255, 255, 0.85); 
        font-size: 1em; 
        line-height: 1.6;
        font-family: 'Courier New', monospace;
        letter-spacing: 0.5px;
        position: relative;
        overflow: hidden;">
        ${index === 0 && item.text === currentlySpokenText ? 
          `<span style="color: rgba(255, 255, 255, 0.85);">${streamingText}</span>` +
          (streamingIndex < item.text.length ? 
            '<span style="color: #4CAF50; animation: blink 1s infinite;">_</span>' : 
            '<span style="color: #4CAF50;">█</span>') : 
          item.text}
      </div>
    </div>
  `).join('');
  
  outputContainer.html(historyHTML);
}

// Update setupAudio function
function setupAudio() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  // Add compressor with gentler settings
  compressor = audioContext.createDynamicsCompressor();
  compressor.threshold.value = -18;  // Less compression
  compressor.knee.value = 20;        // Softer knee
  compressor.ratio.value = 4;        // Much gentler compression
  compressor.attack.value = 0.01;    // Slightly slower attack
  compressor.release.value = 0.3;    // Slightly longer release
  compressor.connect(audioContext.destination);
  
  // Adjust main output gain
  const masterGain = audioContext.createGain();
  masterGain.gain.value = 0.6;   // Lower overall volume
  compressor.connect(masterGain);
  masterGain.connect(audioContext.destination);
  
  // Add delay effect with reduced feedback
  delayNode = audioContext.createDelay(1.0);
  const feedback = audioContext.createGain();
  feedback.gain.value = 0.2;     // Reduced feedback
  delayNode.delayTime.value = BEAT_INTERVAL / 1000 / 3; // Triplet delay
  delayNode.connect(feedback);
  feedback.connect(delayNode);
  delayNode.connect(compressor);

  // Create oscillators with stable settings
  for (let i = 0; i < NUM_OSCILLATORS; i++) {
    const osc = audioContext.createOscillator();
    
    // Simpler waveforms
    osc.type = ['sine', 'triangle'][i % 2];
    
    // Base frequency that stays constant
    const baseFreq = BASE_FREQUENCIES[i % 4];
    osc.frequency.value = baseFreq;
    
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';  // Changed to lowpass for smoother sound
    filter.frequency.value = baseFreq * 2;
    filter.Q.value = 2;  // Lower resonance
    
    const gain = audioContext.createGain();
    gain.gain.value = 0.03;  // Lower initial gain
    
    // Add gentle stereo panning
    const panner = audioContext.createStereoPanner();
    panner.pan.value = (i % 2 === 0) ? -0.3 : 0.3;  // Less extreme panning
    
    // Connect through effects chain
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(delayNode);
    panner.connect(compressor);
    
    oscillators.push(osc);
    gainNodes.push(gain);
    filterNodes.push(filter);
    
    osc.start();
    modulateSound(i);
  }

  // Add rhythmic elements with gentler settings
  setupRhythm();
  
  // Setup pop synth
  popSynth = audioContext.createOscillator();
  const popGain = audioContext.createGain();
  popGain.gain.value = 0;
  popSynth.connect(popGain);
  popGain.connect(compressor);
  popSynth.start();

  // Setup hover synth with gentler settings
  hoverSynth = audioContext.createOscillator();
  const hoverGain = audioContext.createGain();
  hoverGain.gain.value = 0;
  hoverSynth.type = 'sine';
  hoverSynth.connect(hoverGain);
  hoverGain.connect(compressor);
  hoverSynth.start();
}

// Update setupRhythm function
function setupRhythm() {
  // Kick drum with reduced volume
  kickGain = audioContext.createGain();
  kickGain.gain.value = 0.2;  // Reduced from 0.3
  kickGain.connect(compressor);
  
  // Hihat with reduced volume
  hihatGain = audioContext.createGain();
  hihatGain.gain.value = 0.05;  // Reduced from 0.1
  hihatGain.connect(compressor);
  
  // Simpler rhythm patterns
  setInterval(() => {
    if (Math.random() < 0.4) {  // Reduced probability
      playKick();
    }
  }, BEAT_INTERVAL);
  
  setInterval(() => {
    if (Math.random() < 0.3) {  // Reduced probability
      playHihat();
    }
  }, BEAT_INTERVAL / 2);
}

// Update modulateSound function
function modulateSound(index) {
  const osc = oscillators[index];
  const filter = filterNodes[index];
  const gain = gainNodes[index];
  
  // Gentler filter modulation
  const filterLFO = audioContext.createOscillator();
  filterLFO.frequency.value = 0.2;  // Much slower modulation
  const filterGain = audioContext.createGain();
  filterGain.gain.value = 200 + index * 100;  // Reduced range
  filterLFO.connect(filterGain);
  filterGain.connect(filter.frequency);
  filterLFO.start();
  
  // Gentler amplitude modulation
  const ampLFO = audioContext.createOscillator();
  ampLFO.frequency.value = 0.1;  // Slower modulation
  const ampGain = audioContext.createGain();
  ampGain.gain.value = 0.05;  // Reduced modulation depth
  ampLFO.connect(ampGain);
  ampGain.connect(gain.gain);
  ampLFO.start();
}

// Add percussion functions
function playKick() {
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  osc.frequency.setValueAtTime(150, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  
  gain.gain.setValueAtTime(1, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  
  osc.connect(gain);
  gain.connect(kickGain);
  
  osc.start(audioContext.currentTime);
  osc.stop(audioContext.currentTime + 0.5);
}

function playHihat() {
  const bufferSize = audioContext.sampleRate * 0.1;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
  }
  
  const noise = audioContext.createBufferSource();
  noise.buffer = buffer;
  
  const filter = audioContext.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 7000;
  
  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0.3, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
  
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(hihatGain);
  
  noise.start();
}

// Add pop sound function
function playPopSound() {
  const now = audioContext.currentTime;
  
  // Create drum-like oscillator
  const drumOsc = audioContext.createOscillator();
  const drumGain = audioContext.createGain();
  drumOsc.frequency.setValueAtTime(150, now);
  drumOsc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
  drumGain.gain.setValueAtTime(0.8, now);
  drumGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
  
  // Create electric zap sound
  const zapOsc = audioContext.createOscillator();
  const zapGain = audioContext.createGain();
  zapOsc.type = 'square';
  zapOsc.frequency.setValueAtTime(2000, now);
  zapOsc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
  zapGain.gain.setValueAtTime(0.2, now);
  zapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
  
  // Add filter for zap sound
  const zapFilter = audioContext.createBiquadFilter();
  zapFilter.type = 'bandpass';
  zapFilter.frequency.setValueAtTime(3000, now);
  zapFilter.Q.value = 5;
  
  // Connect everything
  drumOsc.connect(drumGain);
  drumGain.connect(compressor);
  zapOsc.connect(zapGain);
  zapGain.connect(zapFilter);
  zapFilter.connect(compressor);
  
  // Start and stop oscillators
  drumOsc.start(now);
  zapOsc.start(now);
  drumOsc.stop(now + 0.2);
  zapOsc.stop(now + 0.1);
  
  // Create more particles
  for (let i = 0; i < 15; i++) {  // Increased number of particles
    popParticles.push(new PopParticle(
      random(-width/3, width/3),
      random(-height/3, height/3),
      random(-300, 300)
    ));
  }
}

// Update hover sound function with techno-style sound
function playHoverSound() {
  // Create audio nodes
  const osc = audioContext.createOscillator();
  const noise = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  
  // Create noise buffer for techno percussion
  const bufferSize = audioContext.sampleRate * 0.1;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.05));
  }
  noise.buffer = buffer;
  
  // Set up filter for techno character
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1000, audioContext.currentTime);
  filter.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
  filter.Q.value = 8;
  
  // Set up oscillator
  osc.type = 'square';
  osc.frequency.setValueAtTime(200, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.1);
  
  // Set up gain envelope
  gain.gain.setValueAtTime(0.2, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
  
  // Connect nodes
  osc.connect(filter);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(compressor);
  
  // Add delay for techno feel
  const hoverDelay = audioContext.createDelay(0.5);
  hoverDelay.delayTime.value = BEAT_INTERVAL / 1000 / 8; // Sync with beat
  const feedbackGain = audioContext.createGain();
  feedbackGain.gain.value = 0.3;
  
  gain.connect(hoverDelay);
  hoverDelay.connect(feedbackGain);
  feedbackGain.connect(hoverDelay);
  hoverDelay.connect(compressor);
  
  // Start audio
  osc.start(audioContext.currentTime);
  noise.start(audioContext.currentTime);
  osc.stop(audioContext.currentTime + 0.2);
  noise.stop(audioContext.currentTime + 0.2);
  
  // Sync with current rhythm complexity
  filter.frequency.value *= rhythmComplexity;
  gain.gain.value *= (0.8 + (rhythmComplexity * 0.2));
}

// Add particle pop effect
class PopParticle {
  constructor(x, y, z) {
    this.pos = createVector(x, y, z);
    this.vel = p5.Vector.random3D().mult(random(3, 8)); // Faster movement
    this.alpha = 255;
    this.size = random(5, 15);  // Smaller particles
    this.color = color(
      random([255, 100, 150]), // Electric blue/white variations
      random([200, 255, 220]),
      255,
      this.alpha
    );
    this.rotation = random(TWO_PI);
    this.rotSpeed = random(-0.2, 0.2);
  }

  update() {
    this.pos.add(this.vel);
    this.vel.mult(0.95); // Slow down
    this.alpha -= 15;  // Faster fade
    this.size *= 0.92;
    this.rotation += this.rotSpeed;
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y, this.pos.z);
    rotateX(this.rotation);
    rotateY(this.rotation);
    noStroke();
    fill(this.color);
    
    // Draw electric spark
    beginShape(LINES);
    for (let i = 0; i < 4; i++) {
      const angle = (i * TWO_PI) / 4;
      const x1 = cos(angle) * this.size;
      const y1 = sin(angle) * this.size;
      const x2 = -x1;
      const y2 = -y1;
      vertex(x1, y1, 0);
      vertex(x2, y2, 0);
    }
    endShape();
    
    pop();
  }

  isDead() {
    return this.alpha <= 0;
  }
}

// Add progression function
function updateProgression() {
  const progressionFactor = particles.length / MAX_PARTICLES;
  
  // Update scale based on progression with more dramatic changes
  currentScale = Math.floor(progressionFactor * SCALES.length);
  currentScale = Math.min(currentScale, SCALES.length - 1);
  
  // Update oscillator frequencies with more variation
  oscillators.forEach((osc, index) => {
    const baseFreq = SCALES[currentScale][index % 4];
    const harmonicOffset = index % 3;  // 0, 1, or 2
    const progressionMultiplier = 1 + (progressionFactor * 1.5);  // More dramatic frequency change
    
    // Create more complex harmonic relationships
    const newFreq = baseFreq * progressionMultiplier * (1 + (harmonicOffset * 0.25));
    
    // Smoother transition to new frequency
    osc.frequency.exponentialRampToValueAtTime(
      newFreq,
      audioContext.currentTime + 0.5
    );
    
    // Update filter characteristics with more dramatic changes
    const filter = filterNodes[index];
    filter.Q.value = 4 + (progressionFactor * 8);  // More resonance variation
    filter.frequency.exponentialRampToValueAtTime(
      newFreq * (2 + progressionFactor * 4),  // Wider filter sweep
      audioContext.currentTime + 0.5
    );
    
    // Update gain for dynamic volume changes
    const gain = gainNodes[index];
    gain.gain.setTargetAtTime(
      0.05 * (1 - (progressionFactor * 0.5)),  // Volume decreases as more particles are added
      audioContext.currentTime,
      0.1
    );
  });
  
  // Update rhythm complexity more dramatically
  rhythmComplexity = 1 + (progressionFactor * (MAX_COMPLEXITY - 1));
  
  // More dramatic compressor changes
  compressor.threshold.value = -30 - (progressionFactor * 20);  // More compression with more particles
  compressor.ratio.value = 8 + (progressionFactor * 12);  // More compression ratio variation
  compressor.knee.value = 10 + (progressionFactor * 20);  // Softer knee with more particles
  
  // Update delay time with more variation
  delayNode.delayTime.setValueAtTime(
    (BEAT_INTERVAL / 1000) * (0.5 - progressionFactor * 0.3),
    audioContext.currentTime
  );
}

// Add recording functions
function setupRecording() {
  // Create a stream from the canvas
  const canvasStream = document.querySelector('canvas').captureStream(30); // 30 FPS
  
  // Create audio destination node with better quality settings
  destinationNode = audioContext.createMediaStreamDestination();
  
  // Create a master gain for recording
  const recordingMasterGain = audioContext.createGain();
  recordingMasterGain.gain.value = 0.7; // Reduce overall volume to prevent distortion
  
  // Connect audio nodes to recording through the master gain
  compressor.connect(recordingMasterGain);
  delayNode.connect(recordingMasterGain);
  
  // Connect oscillators with individual gains
  oscillators.forEach((osc, index) => {
    const recordingGain = audioContext.createGain();
    recordingGain.gain.value = 0.4; // Lower gain for cleaner mix
    osc.connect(recordingGain);
    recordingGain.connect(recordingMasterGain);
  });
  
  // Connect master gain to destination
  recordingMasterGain.connect(destinationNode);
  
  // Combine audio and video streams
  const audioStream = destinationNode.stream;
  const tracks = [...canvasStream.getVideoTracks(), ...audioStream.getAudioTracks()];
  recordingStream = new MediaStream(tracks);
  
  // Create media recorder with better audio settings
  mediaRecorder = new MediaRecorder(recordingStream, {
    mimeType: 'video/webm;codecs=vp9,opus',
    videoBitsPerSecond: 5000000, // 5 Mbps
    audioBitsPerSecond: 128000   // 128 kbps audio
  });
  
  // Handle recorded data
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
}

function startRecording() {
  if (!mediaRecorder) setupRecording();
  recordedChunks = [];
  recordingStartTime = Date.now();
  mediaRecorder.start();
  isRecording = true;
  console.log('Recording started');
}

function stopRecording() {
  mediaRecorder.stop();
  isRecording = false;
  console.log('Recording stopped');
}

function handleDataAvailable(event) {
  if (event.data.size > 0) {
    recordedChunks.push(event.data);
  }
}

async function handleStop() {
  const duration = (Date.now() - recordingStartTime) / 1000;
  const timestamp = new Date().toLocaleString().replace(/[/:]/g, '-');
  const blob = new Blob(recordedChunks, { type: 'video/webm' });
  const suggestedName = `bioelectric-morphic-rap-${timestamp}-${duration.toFixed(1)}s.webm`;
  
  // Create dialog with more information
  const saveDialog = document.createElement('div');
  saveDialog.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    padding: 25px;
    border-radius: 12px;
    color: white;
    text-align: left;
    z-index: 1000;
    min-width: 400px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  `;
  
  saveDialog.innerHTML = `
    <h3 style="margin: 0 0 15px 0; color: #4CAF50;">Recording Complete</h3>
    <div style="margin-bottom: 20px; padding: 15px; background: rgba(255, 255, 255, 0.1); border-radius: 8px;">
      <p style="margin: 0 0 10px 0; color: #CCC;">
        <strong>Duration:</strong> ${duration.toFixed(1)} seconds<br>
        <strong>Format:</strong> WebM (VP9 + Opus)<br>
        <strong>Quality:</strong> High Definition (5 Mbps)
      </p>
    </div>
    <p style="margin: 0 0 20px 0; font-size: 0.9em; color: #AAA;">
      Choose where to save:<br>
      <span style="color: #FFF; word-break: break-all; font-family: monospace;">
        ${suggestedName}
      </span>
    </p>
    <div style="display: flex; justify-content: flex-end; gap: 10px;">
      <button onclick="this.parentElement.parentElement.remove();"
        style="
          background: transparent;
          border: 1px solid #666;
          padding: 8px 15px;
          color: #CCC;
          border-radius: 5px;
          cursor: pointer;
        "
      >Cancel</button>
      <button onclick="saveRecording(this)"
        style="
          background: #4CAF50;
          border: none;
          padding: 8px 15px;
          color: white;
          border-radius: 5px;
          cursor: pointer;
          font-weight: bold;
        "
      >Choose Location...</button>
    </div>
  `;
  
  document.body.appendChild(saveDialog);
  
  // Store blob in global scope for saving
  window.recordingBlob = blob;
}

// Add new function to save recording
async function saveRecording(buttonElement) {
  try {
    // Show file picker
    const handle = await window.showSaveFilePicker({
      suggestedName: `bioelectric-morphic-rap-${new Date().toLocaleString().replace(/[/:]/g, '-')}.webm`,
      types: [{
        description: 'WebM Video',
        accept: {
          'video/webm': ['.webm'],
        },
      }],
    });
    
    // Create writable stream
    const writable = await handle.createWritable();
    
    // Write the blob
    await writable.write(window.recordingBlob);
    await writable.close();
    
    // Remove dialog
    buttonElement.parentElement.parentElement.remove();
    
    // Clean up
    delete window.recordingBlob;
    
    // Show success message
    const successMsg = document.createElement('div');
    successMsg.style.cssText = `
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(76, 175, 80, 0.9);
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      font-family: Helvetica, Arial, sans-serif;
      z-index: 1000;
    `;
    successMsg.textContent = 'Recording saved successfully!';
    document.body.appendChild(successMsg);
    
    setTimeout(() => successMsg.remove(), 3000);
    
  } catch (err) {
    console.error('Failed to save file:', err);
    if (err.name !== 'AbortError') {
      alert('Failed to save recording. Please try again.');
    }
  }
}

// Add collision sound function
function playCollisionSound(intensity) {
  if (!audioContext) return;
  
  // Create soft sine oscillator for collision
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  // Use intensity to affect frequency and volume
  const baseFreq = 200;
  const volume = Math.min(intensity * 0.1, 0.2); // Cap volume
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(baseFreq, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, audioContext.currentTime + 0.1);
  
  gain.gain.setValueAtTime(volume, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
  
  // Add soft filter
  const filter = audioContext.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;
  filter.Q.value = 1;
  
  // Connect nodes
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(compressor);
  
  // Play sound
  osc.start(audioContext.currentTime);
  osc.stop(audioContext.currentTime + 0.1);
}

// Add new function for bioelectric connections
function drawBioelectricConnections() {
  // Only draw connections if we have particles
  if (particles.length < 2) return;
  
  // Calculate corners for all particles first
  let allCorners = [];
  for (let particle of particles) {
    let halfSize = particle.size / 2;
    let corners = [
      createVector(-halfSize, -halfSize, 0),
      createVector(halfSize, -halfSize, 0),
      createVector(halfSize, halfSize, 0),
      createVector(-halfSize, halfSize, 0)
    ];
    
    // Transform corners based on particle's rotation and position
    let time = frameCount * 0.05;
    for (let corner of corners) {
      // Add dynamic displacement
      let displacement = 15 * sin(time + corner.x + corner.y);
      corner.add(
        sin(time + corner.y) * 5,
        cos(time + corner.x) * 5,
        displacement
      );
      
      // Apply particle's rotation
      let rotatedCorner = createVector(
        corner.x * cos(particle.rotZ) - corner.y * sin(particle.rotZ),
        corner.x * sin(particle.rotZ) + corner.y * cos(particle.rotZ),
        corner.z
      );
      
      // Add particle's position
      rotatedCorner.add(particle.pos);
      allCorners.push(rotatedCorner);
    }
  }
  
  // Draw elastic connections between corners of different images
  for (let i = 0; i < allCorners.length; i++) {
    for (let j = i + 1; j < allCorners.length; j++) {
      let start = allCorners[i];
      let end = allCorners[j];
      let d = p5.Vector.dist(start, end);
      
      // Only connect corners within a certain distance
      if (d < 300) {
        let time = frameCount * 0.05;
        
        // Draw elastic line with glow effect
        for (let g = 2; g >= 0; g--) {
          stroke(100, 200, 255, map(g, 0, 2, 150, 30));
          strokeWeight(g * 1.5 + 1);
          noFill();
          
          // Draw curved line
          beginShape();
          for (let t = 0; t <= 1; t += 0.1) {
            let x = lerp(start.x, end.x, t);
            let y = lerp(start.y, end.y, t);
            let z = lerp(start.z, end.z, t);
            
            // Add sine wave displacement for elastic effect
            let wave = sin(t * PI + time) * 8;
            vertex(
              x + sin(time + y) * wave,
              y + cos(time + x) * wave,
              z + sin(time + x + y) * wave
            );
          }
          endShape();
        }
        
        // Add small connection points
        push();
        translate(start.x, start.y, start.z);
        noStroke();
        fill(150, 220, 255, 150);
        sphere(2 + sin(time * 2) * 0.5);
        pop();
      }
    }
  }
  
  // Continue with original bioelectric connections
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      let p1 = particles[i];
      let p2 = particles[j];
      let d = p5.Vector.dist(p1.pos, p2.pos);
      
      // Only draw connections within a certain distance
      if (d < 400) {
        // Dynamic color based on time and distance
        let hue = (frameCount * 0.5 + d * 0.1) % 360;
        let baseColor = color(`hsb(${hue}, 100%, 100%)`);
        let alpha = map(d, 0, 400, 255, 50);  // Increased minimum alpha for better visibility
        let energyIntensity = map(d, 0, 400, 1.5, 0.5);  // Increased minimum intensity
        
        // Draw main connection line with fluctuating color
        push();
        strokeWeight(3);  // Thicker line for better visibility
        let lineColor = color(red(baseColor), green(baseColor), blue(baseColor), alpha * 0.7);
        stroke(lineColor);
        noFill();
        
        // Add glow effect to the line
        for (let g = 3; g >= 0; g--) {
          strokeWeight(g * 2 + 1);
          stroke(red(baseColor), green(baseColor), blue(baseColor), alpha * (0.2 / (g + 1)));
          beginShape();
          for (let t = 0; t <= 1; t += 0.1) {
            // Create curved path between particles
            let x = lerp(p1.pos.x, p2.pos.x, t);
            let y = lerp(p1.pos.y, p2.pos.y, t);
            let z = lerp(p1.pos.z, p2.pos.z, t);
            
            // Add sine wave displacement for energy flow effect
            let time = frameCount * 0.1;
            let displacement = sin((t * 10 + time)) * 15;  // Increased wave amplitude
            let perpX = -(p2.pos.y - p1.pos.y);
            let perpY = (p2.pos.x - p1.pos.x);
            let perpLen = sqrt(perpX * perpX + perpY * perpY);
            if (perpLen !== 0) {
              perpX /= perpLen;
              perpY /= perpLen;
            }
            
            vertex(
              x + perpX * displacement,
              y + perpY * displacement,
              z
            );
          }
          endShape();
        }
        pop();
        
        // Draw energy particles with dynamic colors
        push();
        let numParticles = floor(map(d, 0, 400, 12, 5));  // More particles
        for (let k = 0; k < numParticles; k++) {
          let t = (frameCount * 0.03 + k/numParticles) % 1;
          let x = lerp(p1.pos.x, p2.pos.x, t);
          let y = lerp(p1.pos.y, p2.pos.y, t);
          let z = lerp(p1.pos.z, p2.pos.z, t);
          
          // Particle color fluctuation
          let particleHue = (hue + k * 30) % 360;  // Color variation for each particle
          let particleColor = color(`hsb(${particleHue}, 100%, 100%)`);
          
          // Energy particle effect with enhanced glow
          push();
          translate(x, y, z);
          noStroke();
          
          // Core of the particle
          fill(red(particleColor), green(particleColor), blue(particleColor), alpha);
          sphere(4 * energyIntensity);
          
          // Multi-layered glow effect
          for (let s = 1; s <= 4; s++) {
            let glowAlpha = alpha * (1 - s/4) * 0.5;
            fill(red(particleColor), green(particleColor), blue(particleColor), glowAlpha);
            sphere(4 * s * energyIntensity);
          }
          pop();
        }
        pop();
      }
    }
  }
}