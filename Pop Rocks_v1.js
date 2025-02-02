let particles = [];
// Original colors for drag with added lavender
const colors = ['#FFF9C4', '#FFFFFF', '#89CFF0', '#F8BBD0', '#00FFFF']; 
// Modified colors for click explosions
const explosionColors = ['#FF00FF', '#D90707', '#FFA500', '#6EF56E']; // 
// Modified colors for mega explosion
const megaExplosionColors = [
  '#FFD700',    // Bright yellow
  '#89CFF0',    // Baby blue
  '#F8BBD0',    // Baby pink
  '#FFFFFF',    // White
  '#00B4FF',    // Electric Blue
  '#40E0D0',    // Turquoise added
  '#39FF14',    // Neon Green added
];
const borderSize = 90;
const bounceMargin = 60;
let interactiveArea;
const maxParticles = 2000;
let gravityToggle = true;
let lastX = 0, lastY = 0;
const gravity = 0.098;
let lastClickTime = 0; // Variable to track last click time

function setup() {
  createCanvas(420, 680);
  pixelDensity(1); 
  background(255);
  interactiveArea = {
    left: borderSize,
    right: width - borderSize,
    top: borderSize,
    bottom: height - borderSize,
  };
}

function draw() {
  background(255);

  // Draw black border
  noStroke();
  fill(0); 
  rect(0, 0, width, borderSize); 
  rect(0, 0, borderSize, height); 
  rect(width - borderSize, 0, borderSize, height); 
  rect(0, height - borderSize, width, borderSize); 

  // Update and display particles
  for (let i = particles.length - 1; i >= 0; i--) {
    if (particles[i].update()) {
      particles.splice(i, 1);
    } else if (inInteractiveArea(particles[i].pos.x, particles[i].pos.y, true)) {
      particles[i].display();
    }
  }
}

// Function to save the current canvas as an image
function saveImage() {
  saveCanvas('particle-art', 'png');
}

// Helper function for checking if a position is within interactive area
function inInteractiveArea(x, y, withMargin = false) {
  let margin = withMargin ? bounceMargin : 0;
  return x > interactiveArea.left - margin && 
         x < interactiveArea.right + margin && 
         y > interactiveArea.top - margin && 
         y < interactiveArea.bottom + margin;
}

class Particle {
  constructor(x, y, isExplosion = false, isMega = false) {
    this.pos = createVector(x, y);
    this.isExplosion = isExplosion;
    this.isMega = isMega;
    if (isExplosion) {
      this.vel = p5.Vector.random2D().mult(random(3.15, 10.5));
      this.acc = createVector(0, gravity); 
      this.lifespan = 250;
      if (random() < 0.05) { 
        this.size = random(10, 17.8); 
      } else {
        this.size = random(1, 10); 
      }
      this.colors = isMega ? megaExplosionColors : explosionColors;
      this.explosionChance = 0; 
      this.rotation = random(TWO_PI); 
      this.rotationSpeed = random(-0.1, 0.1); 
      this.shapeType = isMega ? floor(random(3)) : 1; // 0: Circle, 1: Triangle, 2: Square for mega explosion
    } else {
      this.vel = p5.Vector.random2D().mult(random(2.1, 5.25));
      this.acc = createVector(0, gravity); 
      this.lifespan = 300;
      this.size = random(1, 14.4);
      this.colors = colors;
      this.explosionChance = 0.0006; 
      this.shapeType = 0; // Circles for drag particles
    }
    this.colorIndex = floor(random(this.colors.length));
    this.colorChangeTimer = 0;
    this.transitionColor = {
      start: color(this.colors[this.colorIndex]),
      end: color(this.colors[this.colorIndex]),
      progress: 0
    };
  }

  update() {
    if (gravityToggle) {
      this.vel.add(this.acc); 
    }

    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;

    this.lifespan -= this.isExplosion ? 2.5 : 3;

    this.colorChangeTimer++;
    if (this.colorChangeTimer > (this.isExplosion ? 8 : 13)) {
      this.colorChangeTimer = 0;
      if (this.isExplosion) {
        this.transitionColor.start = color(this.colors[this.colorIndex]);
        this.transitionColor.end = color(this.colors[(this.colorIndex + 1) % this.colors.length]);
        this.transitionColor.progress = 0;
      }
      this.colorIndex = (this.colorIndex + 1) % this.colors.length;
    }

    // Check for secondary explosion only for regular particles
    if (!this.isExplosion && random() < this.explosionChance && particles.length < maxParticles) {
      this.spawnSecondaryExplosion();
    }

    // Update rotation for explosion particles
    if (this.isExplosion) {
      this.rotation += this.rotationSpeed;
    }

    return this.lifespan < 0 || this.pos.y > height;
  }

  display() {
    noStroke();
    let currentColor;
    if (this.isExplosion) {
      currentColor = this.getColorWithTransition();
      fill(currentColor);
      push(); 
      translate(this.pos.x, this.pos.y);
      rotate(this.rotation); 
      let halfSize = this.size / 2;
      
      switch(this.shapeType) {
        case 0: // Circle
          circle(0, 0, this.size);
          break;
        case 1: // Triangle
          triangle(0, -halfSize, -halfSize, halfSize, halfSize, halfSize);
          break;
        case 2: // Square
          rect(-halfSize, -halfSize, this.size, this.size);
          break;
      }
      pop(); 
    } else {
      currentColor = color(this.colors[this.colorIndex]);
      currentColor.setAlpha(this.lifespan);
      fill(currentColor); 
      ellipse(this.pos.x, this.pos.y, this.size, this.size);
    }
  }

  getColorWithTransition() {
    this.transitionColor.progress += 0.1; 
    if (this.transitionColor.progress >= 1) {
      this.transitionColor.progress = 1;
    }
    let currentColor = lerpColor(this.transitionColor.start, this.transitionColor.end, this.transitionColor.progress);
    currentColor.setAlpha(this.lifespan);
    return currentColor;
  }

  spawnSecondaryExplosion() {
    let explosionSize = random(5, 15); 
    for (let i = 0; i < explosionSize && particles.length < maxParticles; i++) {
      let newVel = p5.Vector.random2D().mult(random(2, 6));
      let newPos = this.pos.copy().add(random(-10, 10), random(-10, 10));
      particles.push(new Particle(newPos.x, newPos.y, false));
    }
  }
}

// Function to add particles with speed-based variation
function addParticles(x, y) {
  if (inInteractiveArea(x, y)) {
    let speed = dist(x, y, lastX, lastY);
    let particleCount = constrain(map(speed, 0, 20, 1, 16), 1, 16);
    for (let i = 0; i < particleCount && particles.length < maxParticles; i++) {
      particles.push(new Particle(x + random(-10, 10), y + random(-10, 10)));
    }
    lastX = x;
    lastY = y;
  }
}

// Function for explosion effect
function explodeParticles(x, y, isMega = false) {
  if (inInteractiveArea(x, y)) {
    let explosionSize = isMega ? 200 : 50; // More particles for mega explosion
    for (let i = 0; i < explosionSize && particles.length < maxParticles; i++) { 
      particles.push(new Particle(x + random(-50, 50), y + random(-50, 50), true, isMega));
    }
  }
}

// Mouse and Touch Events
function mousePressed() {
  lastX = mouseX;
  lastY = mouseY;
  let currentTime = millis();
  if (currentTime - lastClickTime < 300) { // If less than 300ms (0.3s) has passed, it's a double click
    explodeParticles(mouseX, mouseY, true); // Mega explosion
  } else {
    explodeParticles(mouseX, mouseY); // Regular explosion
  }
  lastClickTime = currentTime; // Update last click time
}

function mouseDragged() {
  addParticles(mouseX, mouseY);
}

function touchStarted() {
  if (touches.length > 0) {
    lastX = touches[0].x;
    lastY = touches[0].y;
    let currentTime = millis();
    if (currentTime - lastClickTime < 300) { // If less than 300ms (0.3s) has passed, it's a double tap
      explodeParticles(touches[0].x, touches[0].y, true); // Mega explosion on double tap
    } else {
      explodeParticles(touches[0].x, touches[0].y); // Regular explosion on single tap
    }
    lastClickTime = currentTime; // Update last tap time
  }
  return false;
}

function touchMoved() {
  if (touches.length > 0) {
    addParticles(touches[0].x, touches[0].y);
  }
  return false;
}

// Key press events
function keyPressed() {
  if (key === 's' || key === 'S') {
    saveImage();
  } else if (key === 'g' || key === 'G') {
    gravityToggle = !gravityToggle;
  }
}