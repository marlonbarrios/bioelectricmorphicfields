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

Each statement must be a complete thought that ends with a period. Include concepts about collective intelligence, bioelectric signaling, morphogenetic fields, and developmental decision-making. Frame biological processes in terms of information processing and problem-solving strategies.`;

// Array of different prompts to cycle through
const prompts = [
    "Bioelectric signaling networks",
    "Voltage-guided regeneration",
    "Ion channel patterns",
    "Cellular electrical fields", 
    "Bioelectric memory",
    "Tissue voltage gradients",
    "Regenerative bioelectricity",
    "Gap junction networks",
    "Membrane voltage states",
    "Bioelectric circuits",
    "Developmental bioelectricity",
    "Wound healing fields",
    "Voltage-guided growth",
    "Bioelectric computation",
    "Pattern formation signals"
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
const NUM_OSCILLATORS = 6;  // More oscillators for richer sound
const BPM = 128;  // Standard techno tempo
const BEAT_INTERVAL = (60 / BPM) * 1000;  // Convert BPM to milliseconds

// Update constants for more dynamic swarm behavior
const SEPARATION_FORCE = 1.5;    // Stronger separation
const COHESION_FORCE = 0.6;      // Moderate cohesion
const ALIGNMENT_FORCE = 0.4;     // Light alignment
const WANDER_STRENGTH = 0.003;   // Random movement
const MAX_SPEED = 1.2;           // Faster movement
const MAX_FORCE = 0.05;          // Stronger steering
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
const AUTO_GENERATION_INTERVAL = 5000; // 5 seconds

// Add to global variables
let popSynth;
let hoverSynth;

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
    
    switch(this.danceMode) {
      case DANCE_MODES.PULSE:
        // Stronger pulsing movement
        let toCenter = createVector(0, 0, 0).sub(this.pos);
        toCenter.normalize();
        toCenter.mult(sin(time + this.dancePhase) * beatIntensity * 4);
        this.acc.add(toCenter);
        this.beatScale = 1 + sin(beatProgress * TWO_PI) * 0.4 * this.danceAmplitude;
        break;
        
      case DANCE_MODES.SPIRAL:
        // More pronounced spiral
        let spiralForce = createVector(
          -this.pos.y * 0.02,
          this.pos.x * 0.02,
          sin(time + this.dancePhase) * 1.0
        );
        spiralForce.mult(beatIntensity * this.danceAmplitude * 1.5);
        this.acc.add(spiralForce);
        break;
        
      case DANCE_MODES.WAVE:
        // Larger wave movement
        let waveForce = createVector(
          sin(time + this.dancePhase) * 4,
          cos(time * 0.5 + this.dancePhase) * 4,
          sin(time * 0.7) * 2
        );
        waveForce.mult(beatIntensity * this.danceAmplitude * 0.3);
        this.acc.add(waveForce);
        break;
    }
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  textFont('Courier New');
  setAttributes('antialias', true);
  
  // Create header container
  let headerContainer = createDiv();
  headerContainer.style('position', 'fixed');
  headerContainer.style('left', '30px');
  headerContainer.style('top', '20px');
  headerContainer.style('z-index', '1000');
  headerContainer.style('color', 'white');
  headerContainer.style('font-family', 'Courier New');
  
  // Add title and description
  headerContainer.html(`
    <h1 style="margin: 0; font-size: 1.5em; color: #4CAF50;">Bioelectric Patterns Explorer</h1>
    <p style="margin: 5px 0; font-size: 0.9em; color: #888;">
      An interactive visualization inspired by <a href="https://www.drmichaellevin.org/" target="_blank" style="color: #4CAF50; text-decoration: none; border-bottom: 1px dotted #4CAF50;">Michael Levin's</a> research on bioelectricity and cellular communication.
      <br>
      Exploring how electrical signals guide growth, healing, and pattern formation in living systems.
    </p>
    <p style="margin: 5px 0; font-size: 0.8em; color: #666;">
      From the Levin Lab at Tufts University: Understanding diverse intelligence in evolved, designed, and hybrid complex systems.
    </p>
    <p style="margin: 5px 0; font-size: 0.8em; color: #666; border-top: 1px solid #333; padding-top: 5px;">
      Powered by <span style="color: #4CAF50;">Meta's Llama 3</span> for text generation and 
      <span style="color: #4CAF50;">Stable Diffusion</span> for visuals via Replicate.
    </p>
  `);
  
  let container = createDiv();
  container.style('position', 'fixed');
  container.style('left', '30px');
  container.style('top', '120px'); // Adjusted to make room for header
  container.style('z-index', '1000');
  
  outputContainer = createDiv();
  outputContainer.parent(container);
  outputContainer.style('color', 'white');
  outputContainer.style('max-height', '70vh'); // Adjusted height
  outputContainer.style('overflow-y', 'auto');
  outputContainer.style('padding-right', '20px');
  outputContainer.style('scrollbar-width', 'thin');
  outputContainer.style('scrollbar-color', 'rgba(255, 255, 255, 0.5) transparent');
  
  // Updated instructions with more detail
  outputContainer.html(`
    <div style="background: rgba(255, 255, 255, 0.1); 
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 15px;">
      <p style="margin: 0;">
        Press <span style="color: #4CAF50; font-weight: bold;">SPACEBAR</span> to toggle continuous generation.
        <br><br>
        <span style="font-size: 0.9em; color: #888;">
          New content will be generated every 5 seconds when active.
          <br>
          Press SPACEBAR again to stop generation and show project information.
          <br>
          Each particle represents a unique insight into bioelectric patterns and cellular intelligence.
        </span>
      </p>
    </div>
  `);
}

function draw() {
  background(0);
  
  // Calculate zoom oscillation
  zoomFactor = sin(frameCount * ZOOM_SPEED) * 100;
  
  // Apply camera with zoom
  camera(0, 0, 800 + zoomFactor, 0, 0, 0, 0, 1, 0);
  
  ambientLight(100);
  pointLight(255, 255, 255, 0, 0, 1000);
  
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
      
      // Hide project description
      document.querySelector('h1').style.display = 'none';
      document.querySelectorAll('p').forEach(p => p.style.display = 'none');
      
      // Start continuous generation
      handleGeneration(); // Generate first one immediately
      generationInterval = setInterval(() => {
        if (!isGenerating) {
          handleGeneration();
        }
      }, AUTO_GENERATION_INTERVAL);
      
    } else {
      // Stop continuous generation
      clearInterval(generationInterval);
      
      // Show project description
      document.querySelector('h1').style.display = 'block';
      document.querySelectorAll('p').forEach(p => p.style.display = 'block');
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
    if (speechQueue.length > 0) {
      speakText(speechQueue.shift());
    }
  };
  
  synth.speak(utterance);
}

function updateHistoryDisplay() {
  let historyHTML = textHistory.map((item, index) => `
    <div style="background: rgba(255, 255, 255, ${0.95 - index * 0.05}); 
              padding: 15px;
              border-radius: 8px; 
              margin-bottom: 15px;
              width: 300px;
              backdrop-filter: blur(5px);
              box-shadow: 0 2px 10px rgba(0,0,0,${0.2 - index * 0.01});
              transition: all 0.3s ease-out;
              ${item.text === currentlySpokenText ? 'border: 2px solid #4CAF50; transform: scale(1.02);' : ''}">
      <div style="color: #000;">${item.timestamp}</div>
      <div style="color: #000;">${item.text}</div>
    </div>
  `).join('');
  
  outputContainer.html(historyHTML);
}

// Update setupAudio function
function setupAudio() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  // Add compressor for that techno punch
  compressor = audioContext.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 30;
  compressor.ratio.value = 12;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;
  compressor.connect(audioContext.destination);
  
  // Add delay effect
  delayNode = audioContext.createDelay(1.0);
  const feedback = audioContext.createGain();
  feedback.gain.value = 0.3;
  delayNode.delayTime.value = BEAT_INTERVAL / 1000 / 4; // 16th note delay
  delayNode.connect(feedback);
  feedback.connect(delayNode);
  delayNode.connect(compressor);

  // Create techno oscillators
  for (let i = 0; i < NUM_OSCILLATORS; i++) {
    const osc = audioContext.createOscillator();
    
    // Different waveforms for richer texture
    osc.type = ['sawtooth', 'square', 'triangle'][i % 3];
    
    // Techno-oriented frequencies
    const baseFreq = [146.83, 220, 293.66, 440][i % 4];  // D3, A3, D4, A4
    osc.frequency.value = baseFreq;
    
    const filter = audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = baseFreq;
    filter.Q.value = 8;
    
    const gain = audioContext.createGain();
    gain.gain.value = 0.05;  // Lower initial gain
    
    // Add stereo panning
    const panner = audioContext.createStereoPanner();
    panner.pan.value = (i % 2 === 0) ? -0.7 : 0.7;
    
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

  // Add rhythmic elements
  setupRhythm();

  // Setup pop synth
  popSynth = audioContext.createOscillator();
  const popGain = audioContext.createGain();
  popGain.gain.value = 0;
  popSynth.connect(popGain);
  popGain.connect(compressor);
  popSynth.start();

  // Setup hover synth
  hoverSynth = audioContext.createOscillator();
  const hoverGain = audioContext.createGain();
  hoverGain.gain.value = 0;
  hoverSynth.type = 'sine';
  hoverSynth.connect(hoverGain);
  hoverGain.connect(compressor);
  hoverSynth.start();
}

// Add rhythm section
function setupRhythm() {
  // Kick drum
  kickGain = audioContext.createGain();
  kickGain.gain.value = 0.3;
  kickGain.connect(compressor);
  
  // Hihat
  hihatGain = audioContext.createGain();
  hihatGain.gain.value = 0.1;
  hihatGain.connect(compressor);
  
  // Start rhythm
  setInterval(() => playKick(), BEAT_INTERVAL);
  setInterval(() => playHihat(), BEAT_INTERVAL / 2);
  
  // Add beat tracking
  setInterval(() => {
    lastBeatTime = beatTime;
    beatTime = audioContext.currentTime;
  }, BEAT_INTERVAL);
}

// Update modulation for more techno feel
function modulateSound(index) {
  const osc = oscillators[index];
  const filter = filterNodes[index];
  const gain = gainNodes[index];
  
  // Rhythmic filter modulation
  const filterLFO = audioContext.createOscillator();
  filterLFO.frequency.value = BPM / 60 / [4, 8, 16][index % 3];  // Sync to rhythm
  const filterGain = audioContext.createGain();
  filterGain.gain.value = 500 + index * 500;
  filterLFO.connect(filterGain);
  filterGain.connect(filter.frequency);
  filterLFO.start();
  
  // Amplitude modulation for movement
  const ampLFO = audioContext.createOscillator();
  ampLFO.frequency.value = BPM / 60 / [3, 6, 8][index % 3];
  const ampGain = audioContext.createGain();
  ampGain.gain.value = 0.1;
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
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  osc.frequency.setValueAtTime(800, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
  
  gain.gain.setValueAtTime(0.4, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
  
  osc.connect(gain);
  gain.connect(compressor);
  
  osc.start(audioContext.currentTime);
  osc.stop(audioContext.currentTime + 0.1);
}

// Add hover sound function
function playHoverSound() {
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.1);
  
  gain.gain.setValueAtTime(0.1, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
  
  osc.connect(gain);
  gain.connect(compressor);
  
  osc.start(audioContext.currentTime);
  osc.stop(audioContext.currentTime + 0.2);
}

// Add particle pop effect
class PopParticle {
  constructor(x, y, z) {
    this.pos = createVector(x, y, z);
    this.vel = p5.Vector.random3D().mult(random(2, 5));
    this.alpha = 255;
    this.size = random(10, 20);
  }

  update() {
    this.pos.add(this.vel);
    this.alpha -= 10;
    this.size *= 0.95;
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y, this.pos.z);
    noStroke();
    fill(255, 255, 255, this.alpha);
    sphere(this.size);
    pop();
  }

  isDead() {
    return this.alpha <= 0;
  }
}

// Add to global variables
let popParticles = [];