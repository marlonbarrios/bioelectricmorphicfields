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
    
    this.maxSpeed = 0.8;
    this.maxForce = 0.02;
    this.separationDist = 500;
    this.cohesionDist = 800;
    this.alignmentDist = 600;
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
    // Add center attraction force
    let toCenter = createVector(0, 0, 0).sub(this.pos);
    toCenter.mult(CENTER_PULL);
    this.acc.add(toCenter);
    
    let separation = this.separate();
    let cohesion = this.cohesion();
    let alignment = this.align();
    
    separation.mult(1.2);
    cohesion.mult(0.5);
    alignment.mult(0.3);
    
    this.acc.add(separation);
    this.acc.add(cohesion);
    this.acc.add(alignment);
    this.acc.add(p5.Vector.random3D().mult(0.002)); // Reduced random movement
    
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed * 0.8); // Reduced max speed
    this.pos.add(this.vel);
    this.acc.mult(0);
    
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
    
    if (this.img) {
      texture(this.img);
      noStroke();
      plane(this.size, this.size);
    }
    pop();
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
        Press <span style="color: #4CAF50; font-weight: bold;">SPACEBAR</span> to generate new insights into biological intelligence.
        <br><br>
        <span style="font-size: 0.9em; color: #888;">
          Each floating particle represents patterns of embodied intelligence, from cellular collectives to synthetic living systems.
          <br>
          Hover over particles to hear AI-generated insights about how bioelectricity guides growth, healing, and cognitive processes.
          <br>
          Watch as the particles interact, mimicking the information-processing networks that enable biological problem-solving.
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
    handleGeneration();
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
  isGenerating = true;

  try {
    const currentPrompt = getNextPrompt();
    const textResponse = await getChatResponse(currentPrompt);
    
    // Add new text to history
    textHistory.unshift({
      text: textResponse,
      timestamp: new Date().toLocaleTimeString()
    });
    
    if (textHistory.length > MAX_HISTORY) {
      textHistory.pop();
    }

    // Start speaking immediately
    if (!isSpeaking) {
      speakText(textResponse);
    } else {
      speechQueue.push(textResponse);
    }

    // Update display
    updateHistoryDisplay();
    
    // Generate image in background
    const imageResponse = await generateImage(currentPrompt);
    loadImage(imageResponse, img => {
      if (particles.length >= MAX_PARTICLES) {
        particles.pop();
      }
      particles.unshift(new Particle(img, textResponse));
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
  utterance.rate = 0.9;
  utterance.pitch = 1;
  
  utterance.onstart = () => {
    isSpeaking = true;
    currentlySpokenText = text;
    updateHistoryDisplay();
  };
  
  utterance.onend = () => {
    isSpeaking = false;
    currentlySpokenText = null;
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