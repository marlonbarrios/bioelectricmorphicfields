// Constants and configurations
const proxyURL = "https://replicate-api-proxy.glitch.me/create_n_get/";
const MAX_PARTICLES = 10;
const MAX_HISTORY = 15;
const GENERATION_INTERVAL = 10000;
const synth = window.speechSynthesis;
const CENTER_PULL = 0.02;  // Force pulling particles to center
const ZOOM_SPEED = 0.005;  // Speed of zoom pulse
let zoomFactor = 0;        // Current zoom state

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

Each statement must be a complete thought that ends with a period. Include concepts about collective intelligence, bioelectric signaling, morphogenetic fields, and developmental decision-making. Frame biological processes in terms of information processing, problem-solving strategies, and their inherent artistic and musical qualities.

Consider these additional artistic dimensions:

1. How biological systems create emergent compositions
2. The relationship between cellular patterns and artistic forms
3. Natural principles of aesthetic organization
4. The musical nature of bioelectric communication
5. Choreographic patterns in cellular behavior
6. The emergence of visual harmony in living systems
7. Biological principles of composition and form
8. Memory as an architect of biological form
9. Natural algorithms for pattern creation
10. The aesthetics of collective cellular behavior
11. How memories become embodied in physical structures
12. The sculptural nature of biological memory
13. Pattern formation as memory materialization
14. The relationship between time, memory, and form
15. How collective memory shapes biological architecture

+ Consider these digital art and gestalt principles:
+ 
+ 1. How biological patterns mirror generative art algorithms
+ 2. The relationship between cellular organization and gestalt principles
+ 3. Emergence of form through collective digital behaviors
+ 4. Self-organizing principles in both biology and digital art
+ 5. Pattern recognition and formation in living and digital systems
+ 6. The role of proximity, similarity, and continuity in biological organization
+ 7. How digital generative systems reflect biological growth patterns
+ 8. The relationship between code, memory, and biological form
+ 9. Computational aesthetics in natural and artificial systems
+ 10. The convergence of digital and biological pattern languages
+ 11. How gestalt principles guide both perception and growth
+ 12. The role of iteration and recursion in natural forms
+ 13. Digital morphogenesis and biological development
+ 14. The aesthetics of emergent computational behavior
+ 15. How code can simulate and extend biological principles

Frame responses to emphasize the artistic and compositional aspects of biological processes, 
exploring how nature creates beauty through pattern, rhythm, form, and the embodiment of memory,
and how these principles manifest in both biological and digital generative systems.`;

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

// Add to global variables
const DANCE_MODES = {
  PULSE: 0,
  SPIRAL: 1,
  WAVE: 2
};

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
    this.separationDist = 300;    // Closer separation distance
    this.cohesionDist = 500;      // Larger cohesion range
    this.alignmentDist = 400;     // Moderate alignment range
    
    // Add parameters for organic movement
    this.wanderTheta = random(TWO_PI);
    this.wanderRadius = 50;
    this.wanderDistance = 100;
    this.phaseOffset = random(TWO_PI);
    
    // Add beat-related properties
    this.beatScale = 1;
    this.lastBeatScale = 1;
    this.beatPhase = random(TWO_PI);
    this.beatOffset = random(0.5); // Random offset for varied movement
    
    // Add dance properties
    this.danceMode = floor(random(3));  // Random dance mode
    this.dancePhase = random(TWO_PI);
    this.danceAmplitude = random(0.5, 1.5);
    this.danceSpeed = random(0.8, 1.2);
    
    // Add pop effect
    playPopSound();
    for (let i = 0; i < 10; i++) {
      popParticles.push(new PopParticle(
        random(-width/3, width/3),
        random(-height/3, height/3),
        random(-300, 300)
      ));
    }
    
    this.radius = this.originalSize / 2;  // Add radius for collision detection
    this.lastCollisionTime = 0;  // Track last collision to prevent too frequent sounds
  }

  separate() {
    let steering = createVector();
    let count = 0;
    
    for (let other of particles) {
      let d = p5.Vector.dist(this.pos, other.pos);
      if (d > 0 && d < this.separationDist) {
        let diff = p5.Vector.sub(this.pos, other.pos);
        diff.normalize();
        diff.div(d);
        steering.add(diff);
        count++;
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
    let steering = createVector();
    let count = 0;
    
    for (let other of particles) {
      let d = p5.Vector.dist(this.pos, other.pos);
      if (d > 0 && d < this.alignmentDist) {
        steering.add(other.vel);
        count++;
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
    let steering = createVector();
    let count = 0;
    
    for (let other of particles) {
      let d = p5.Vector.dist(this.pos, other.pos);
      if (d > 0 && d < this.cohesionDist) {
        steering.add(other.pos);
        count++;
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

  update() {
    if (!this.isHovered) {
      // Get beat progress (remove duplicate)
      let beatProgress = (audioContext?.currentTime - lastBeatTime) / (BEAT_INTERVAL / 1000);
      beatProgress = constrain(beatProgress, 0, 1);
      
      // Apply dance movement based on mode
      this.applyDanceMovement(beatProgress);
      
      // Create beat pulse
      this.lastBeatScale = this.beatScale;
      this.beatScale = 1 + (0.3 * Math.exp(-beatProgress * 8) * sin(this.beatPhase));
      
      // Add stronger beat-synchronized movement
      let beatInfluence = sin(beatProgress * TWO_PI + this.beatPhase) * this.beatOffset * 1.5;
      
      // Modify velocity based on beat with stronger effect
      this.vel.add(
        cos(this.beatPhase) * beatInfluence * 0.4,
        sin(this.beatPhase) * beatInfluence * 0.4,
        sin(beatProgress * PI) * beatInfluence * 0.2
      );
      
      // Calculate swarm forces
      let separation = this.separate().mult(SEPARATION_FORCE);
      let cohesion = this.cohesion().mult(COHESION_FORCE);
      let alignment = this.align().mult(ALIGNMENT_FORCE);
      
      // Add wandering behavior
      let wander = this.getWanderForce().mult(WANDER_STRENGTH);
      
      // Add forces
      this.acc.add(separation);
      this.acc.add(cohesion);
      this.acc.add(alignment);
      this.acc.add(wander);
      
      // Add sinusoidal vertical motion
      let time = frameCount * 0.02;
      this.acc.add(0, sin(time + this.phaseOffset) * 0.001, cos(time + this.phaseOffset) * 0.001);
      
      // Update velocity with improved damping
      this.vel.add(this.acc);
      this.vel.limit(this.maxSpeed * (0.8 + sin(time) * 0.2)); // Variable speed
      
      // Add slight spiral motion
      let toCenter = createVector(-this.pos.x, -this.pos.y, -this.pos.z);
      toCenter.normalize();
      let spiral = createVector(
        -this.pos.y * 0.001,
        this.pos.x * 0.001,
        sin(time + this.phaseOffset) * 0.001
      );
      this.vel.add(spiral);
      
      // Update position
      this.pos.add(this.vel);
      
      // Soft boundary handling
      this.handleBounds();
      
      // Reset acceleration
      this.acc.mult(0);
      
      // Add collision check
      if (particles.length > 1) {
        this.checkCollisions(particles);
      }
    }
    
    // Constrain to smaller space
    this.pos.x = constrain(this.pos.x, -width/3, width/3);
    this.pos.y = constrain(this.pos.y, -height/3, height/3);
    this.pos.z = constrain(this.pos.z, -200, 200);
    
    let screenPos = this.getScreenPosition();
    let d = dist(mouseX - width/2, mouseY - height/2, screenPos.x, screenPos.y);
    this.isHovered = d < this.size/2;
    
    this.targetSize = this.isHovered ? this.originalSize * this.hoverScale : this.originalSize;
    this.size = lerp(this.size, this.targetSize, 0.1);
    
    if (this.isHovered) {
      this.vel.mult(0.8);
    }

    this.edges();

    // Add hover sound
    if (this.isHovered && !this.lastHoverState) {
      playHoverSound();
    }
    this.lastHoverState = this.isHovered;
  }

  edges() {
    let buffer = 100;
    if (this.pos.x < -width/2 - buffer) this.pos.x = width/2 + buffer;
    if (this.pos.x > width/2 + buffer) this.pos.x = -width/2 - buffer;
    if (this.pos.y < -height/2 - buffer) this.pos.y = height/2 + buffer;
    if (this.pos.y > height/2 + buffer) this.pos.y = -height/2 - buffer;
    if (this.pos.z < -800) this.pos.z = 800;
    if (this.pos.z > 800) this.pos.z = -800;
  }

  getScreenPosition() {
    return createVector(this.pos.x, this.pos.y, this.pos.z);
  }

  display() {
    push();
    let zPos = this.pos.z;
    if (this.isHovered) {
      zPos = -400;
    }
    translate(this.pos.x, this.pos.y, zPos);
    
    // Add dance-specific rotation
    if (audioContext) {
      let beatProgress = (audioContext.currentTime - lastBeatTime) / (BEAT_INTERVAL / 1000);
      let rotationAmount = sin(beatProgress * TWO_PI + this.dancePhase) * 0.1;
      
      switch(this.danceMode) {
        case DANCE_MODES.PULSE:
          rotateZ(rotationAmount);
          break;
        case DANCE_MODES.SPIRAL:
          rotateY(rotationAmount);
          rotateZ(frameCount * 0.01 * this.danceSpeed);
          break;
        case DANCE_MODES.WAVE:
          rotateX(rotationAmount * 0.5);
          rotateY(rotationAmount * 0.5);
          break;
      }
    }
    
    // Apply scale with beat influence
    scale(this.beatScale);
    
    if (this.img) {
      texture(this.img);
      noStroke();
      plane(this.size, this.size);
    }
    pop();
  }

  getWanderForce() {
    // Calculate wander point
    this.wanderTheta += random(-0.3, 0.3);
    let wanderPoint = this.vel.copy();
    wanderPoint.normalize();
    wanderPoint.mult(this.wanderDistance);
    wanderPoint.add(this.pos);
    
    let theta = this.wanderTheta + this.vel.heading();
    let x = this.wanderRadius * cos(theta);
    let y = this.wanderRadius * sin(theta);
    wanderPoint.add(x, y, 0);
    
    let steer = p5.Vector.sub(wanderPoint, this.pos);
    steer.normalize();
    steer.mult(this.maxSpeed);
    steer.sub(this.vel);
    steer.limit(this.maxForce);
    return steer;
  }

  handleBounds() {
    let buffer = EDGE_BUFFER;
    let bounds = createVector(width/2, height/2, 300);
    let desired = null;
    
    if (this.pos.x < -bounds.x + buffer) {
      desired = createVector(this.maxSpeed, this.vel.y, this.vel.z);
    } else if (this.pos.x > bounds.x - buffer) {
      desired = createVector(-this.maxSpeed, this.vel.y, this.vel.z);
    }
    
    if (this.pos.y < -bounds.y + buffer) {
      desired = createVector(this.vel.x, this.maxSpeed, this.vel.z);
    } else if (this.pos.y > bounds.y - buffer) {
      desired = createVector(this.vel.x, -this.maxSpeed, this.vel.z);
    }
    
    if (this.pos.z < -bounds.z + buffer) {
      desired = createVector(this.vel.x, this.vel.y, this.maxSpeed);
    } else if (this.pos.z > bounds.z - buffer) {
      desired = createVector(this.vel.x, this.vel.y, -this.maxSpeed);
    }
    
    if (desired !== null) {
      desired.normalize();
      desired.mult(this.maxSpeed);
      let steer = p5.Vector.sub(desired, this.vel);
      steer.limit(this.maxForce);
      this.acc.add(steer);
    }
  }

  applyDanceMovement(beatProgress) {
    const time = frameCount * 0.02 * this.danceSpeed;
    const beatIntensity = (1 + sin(beatProgress * TWO_PI)) * 0.5;
    // Scale movement intensity with rhythm complexity
    const complexityFactor = rhythmComplexity / MAX_COMPLEXITY;
    
    switch(this.danceMode) {
      case DANCE_MODES.PULSE:
        // Stronger pulsing movement that scales with complexity
        let toCenter = createVector(0, 0, 0).sub(this.pos);
        toCenter.normalize();
        toCenter.mult(sin(time + this.dancePhase) * beatIntensity * 4 * complexityFactor);
        this.acc.add(toCenter);
        this.beatScale = 1 + sin(beatProgress * TWO_PI) * 0.4 * this.danceAmplitude * complexityFactor;
        break;
        
      case DANCE_MODES.SPIRAL:
        // More pronounced spiral that intensifies with complexity
        let spiralForce = createVector(
          -this.pos.y * 0.02 * complexityFactor,
          this.pos.x * 0.02 * complexityFactor,
          sin(time + this.dancePhase) * complexityFactor
        );
        spiralForce.mult(beatIntensity * this.danceAmplitude * 1.5);
        this.acc.add(spiralForce);
        break;
        
      case DANCE_MODES.WAVE:
        // Larger wave movement that grows with complexity
        let waveForce = createVector(
          sin(time + this.dancePhase) * 4 * complexityFactor,
          cos(time * 0.5 + this.dancePhase) * 4 * complexityFactor,
          sin(time * 0.7) * 2 * complexityFactor
        );
        waveForce.mult(beatIntensity * this.danceAmplitude * 0.3);
        this.acc.add(waveForce);
        break;
    }
    
    // Add extra movement based on rhythm complexity
    if (complexityFactor > 0.5) {
      let chaosForce = p5.Vector.random3D();
      chaosForce.mult(0.1 * (complexityFactor - 0.5) * beatIntensity);
      this.acc.add(chaosForce);
    }
  }

  checkCollisions(others) {
    const now = audioContext?.currentTime || 0;
    const minTimeBetweenCollisions = 0.1; // Minimum time between collision sounds

    for (let other of others) {
      if (other === this) continue;
      
      let d = p5.Vector.dist(this.pos, other.pos);
      let minDist = this.radius + other.radius;
      
      if (d < minDist && now - this.lastCollisionTime > minTimeBetweenCollisions) {
        // Calculate collision velocity for sound intensity
        let relativeVel = p5.Vector.sub(this.vel, other.vel).mag();
        
        // Play collision sound with intensity based on relative velocity
        playCollisionSound(relativeVel);
        
        // Update last collision time
        this.lastCollisionTime = now;
        
        // Calculate collision response
        let normal = p5.Vector.sub(this.pos, other.pos).normalize();
        let relativeVelocity = p5.Vector.sub(this.vel, other.vel);
        let velocityAlongNormal = p5.Vector.dot(relativeVelocity, normal);
        
        // Only bounce if objects are moving towards each other
        if (velocityAlongNormal > 0) return;
        
        // Bounce with some energy loss
        let restitution = 0.8; // Bounciness factor (0.8 = 80% energy preserved)
        let j = -(1 + restitution) * velocityAlongNormal;
        
        // Apply equal and opposite forces
        let impulse = p5.Vector.mult(normal, j);
        this.vel.add(p5.Vector.mult(impulse, 0.5));
        other.vel.sub(p5.Vector.mult(impulse, 0.5));
        
        // Ensure minimum separation to prevent sticking
        let overlap = minDist - d;
        let separation = p5.Vector.mult(normal, overlap * 0.5);
        this.pos.add(separation);
        other.pos.sub(separation);
      }
    }
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
        Bioelectric Morphic Rap
      </h1>
      
      <p style="margin: 0 0 15px 0; font-size: 1em; color: #FFF; line-height: 1.5;">
        A generative exploration of bioelectricity and cellular memory, 
        based on Michael Levin's research.
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
  background(0);
  
  // Calculate zoom oscillation
  zoomFactor = sin(frameCount * ZOOM_SPEED) * 100;
  
  // Apply camera with zoom
  camera(0, 0, 800 + zoomFactor, 0, 0, 0, 0, 1, 0);
  
  ambientLight(100);
  pointLight(255, 255, 255, 0, 0, 1000);
  
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

async function handleGeneration() {
  if (isGenerating) return;
  
  try {
    isGenerating = true;
    const currentPrompt = getNextPrompt();
    
    // Generate text and start speaking immediately
    const textResponse = await getChatResponse(currentPrompt);
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

    updateHistoryDisplay();
    
    // Generate image in parallel
    generateImage(currentPrompt).then(imageResponse => {
      loadImage(imageResponse, img => {
        if (particles.length >= MAX_PARTICLES) {
          particles.pop();
        }
        particles.unshift(new Particle(img, textResponse));
      });
    }).catch(error => {
      console.error("Image generation failed:", error);
    });
    
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
      prompt: "scientific visualization, cellular networks, " + prompt,
      width: 512,
      height: 512,
      num_outputs: 1,
      guidance_scale: 7.5,
      negative_prompt: "cartoon, illustration, abstract art, white background"
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
      prompt: userInput + ". Express as a complete statement that ends with a period.",
      system_prompt: system_prompt,
      max_tokens: 60,
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
    // Find the last complete sentence if there is one
    const lastPeriodIndex = text.lastIndexOf('.');
    if (lastPeriodIndex > 0) {
      text = text.substring(0, lastPeriodIndex + 1);
    } else {
      // If no period found, add one
      text += '.';
    }
  }
  
  // Remove any incomplete sentences at the start
  const firstPeriodIndex = text.indexOf('.');
  if (firstPeriodIndex > 0 && firstPeriodIndex < text.length - 1) {
    text = text.substring(firstPeriodIndex + 1).trim();
  }
  
  // Ensure we have a complete statement
  if (text.length < 20) { // If too short, likely incomplete
    text = "Biological systems process information through distributed networks."; // fallback
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
  
  // Lower background sound when speaking
  utterance.onstart = () => {
    isSpeaking = true;
    currentlySpokenText = text;
    // Reduce background volume
    gainNodes.forEach(gain => {
      gain.gain.setTargetAtTime(0.03, audioContext.currentTime, 0.5);
    });
    updateHistoryDisplay();
  };
  
  utterance.onend = () => {
    isSpeaking = false;
    currentlySpokenText = null;
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
      background: rgba(0, 0, 0, 0.5);
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 30px;
      width: 100%;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      position: relative;
      transform: translateY(${index * 10}px);
      transition: all 0.3s ease;
      ${item.text === currentlySpokenText ? `
        border: 2px solid #4CAF50;
        transform: scale(1.02);
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        background: rgba(0, 0, 0, 0.6);
      ` : ''}">
      <div style="
        color: rgba(255, 255, 255, 0.7); 
        font-size: 0.8em; 
        margin-bottom: 10px;
        font-family: 'Helvetica', sans-serif;">
        ${item.timestamp}
      </div>
      <div style="
        color: rgba(255, 255, 255, 1); 
        font-size: 1em; 
        line-height: 1.6;
        font-family: 'Helvetica', sans-serif;">
        ${item.text}
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

// Add to global variables
let popParticles = [];

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