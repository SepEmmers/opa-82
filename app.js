/**
 * Opa Bert 82 Birthday Web App - Interactive Script
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- STATE VARIABLES ---
  let currentKm = 0;
  const targetKm = 82;
  let pedalingTimeout = null;
  let isCelebrationRunning = false;
  let isAudioEnabled = false;

  // --- AUDIO SYNTHESIZER (Web Audio API) ---
  const audioContextClass = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new audioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Synthesize a classic "Tring Tring" bicycle bell sound
  function playBikeBell() {
    if (!isAudioEnabled) return;
    initAudio();

    const now = audioCtx.currentTime;
    
    // Create two oscillators for a metallic double-tone bell
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    
    const gainNode1 = audioCtx.createGain();
    const gainNode2 = audioCtx.createGain();
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2000, now); // Principal high tone
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2045, now); // Slightly detuned for beating/ring effect
    
    // Envelopes for quick bell strikes
    gainNode1.gain.setValueAtTime(0, now);
    gainNode1.gain.linearRampToValueAtTime(0.15, now + 0.01);
    gainNode1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    gainNode2.gain.setValueAtTime(0, now);
    gainNode2.gain.linearRampToValueAtTime(0.1, now + 0.01);
    gainNode2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    
    // Double ring (tring-tring) effect - second strike after 100ms
    const osc3 = audioCtx.createOscillator();
    const gainNode3 = audioCtx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(2000, now + 0.12);
    gainNode3.gain.setValueAtTime(0, now + 0.12);
    gainNode3.gain.linearRampToValueAtTime(0.12, now + 0.13);
    gainNode3.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    // Connections
    osc1.connect(gainNode1);
    osc2.connect(gainNode2);
    osc3.connect(gainNode3);
    
    gainNode1.connect(audioCtx.destination);
    gainNode2.connect(audioCtx.destination);
    gainNode3.connect(audioCtx.destination);
    
    // Start and Stop
    osc1.start(now);
    osc1.stop(now + 0.4);
    osc2.start(now);
    osc2.stop(now + 0.4);
    osc3.start(now + 0.12);
    osc3.stop(now + 0.5);
  }

  // Synthesize a short victory fanfare
  function playFanfare() {
    if (!isAudioEnabled) return;
    initAudio();

    const now = audioCtx.currentTime;
    // Notes of a happy major chord: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz), C6 (1046.50Hz)
    const notes = [
      { f: 523.25, time: 0, dur: 0.15 },
      { f: 659.25, time: 0.15, dur: 0.15 },
      { f: 783.99, time: 0.3, dur: 0.15 },
      { f: 1046.50, time: 0.45, dur: 0.6 }
    ];

    notes.forEach(note => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now + note.time);
      
      gain.gain.setValueAtTime(0, now + note.time);
      gain.gain.linearRampToValueAtTime(0.15, now + note.time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.dur);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(now + note.time);
      osc.stop(now + note.time + note.dur);
    });
  }

  // Toggle Audio button
  const audioBtn = document.getElementById('audio-btn');
  audioBtn.addEventListener('click', () => {
    isAudioEnabled = !isAudioEnabled;
    if (isAudioEnabled) {
      audioBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
      audioBtn.style.color = 'var(--secondary-color)';
      audioBtn.style.borderColor = 'var(--secondary-color)';
      initAudio();
      playBikeBell(); // Confirm with a ring!
    } else {
      audioBtn.innerHTML = '<i class="fa-solid fa-volume-mute"></i>';
      audioBtn.style.color = 'var(--primary-color)';
      audioBtn.style.borderColor = 'var(--primary-color)';
    }
  });


  // --- INTERACTIVE TIMELINE / GAME ---
  const pedalBtn = document.getElementById('pedal-btn');
  const celebrateMoreBtn = document.getElementById('celebrate-more-btn');
  const odometerEl = document.getElementById('odometer');
  const mapCyclist = document.getElementById('map-cyclist');
  const mapProgress = document.getElementById('map-progress');
  const heroBikeContainer = document.querySelector('.hero-bike-container');

  // Milestone triggers (mapping km boundaries to their respective card/marker indices)
  const milestoneRanges = [
    { start: 0, end: 19, index: 0 },
    { start: 20, end: 44, index: 1 },
    { start: 45, end: 64, index: 2 },
    { start: 65, end: 81, index: 3 },
    { start: 82, end: 82, index: 4 }
  ];

  function updateOdometer(value) {
    const formatted = String(value).padStart(3, '0');
    odometerEl.textContent = formatted;
  }

  function triggerMilestoneCard(index) {
    // Hide all cards, show current one
    document.querySelectorAll('.milestone-card').forEach((card, idx) => {
      if (idx === index) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    // Update map marker active states
    document.querySelectorAll('.map-marker').forEach((marker, idx) => {
      if (idx === index) {
        marker.classList.add('active');
      } else if (idx < index) {
        marker.classList.add('completed');
        marker.classList.remove('active');
      } else {
        marker.classList.remove('active', 'completed');
      }
    });
  }

  function handlePedaling() {
    if (currentKm >= targetKm) return;

    currentKm++;
    updateOdometer(currentKm);
    
    // Play bell ring on every 10 km or just a subtle sound when pedaling starts
    if (currentKm % 5 === 0) {
      playBikeBell();
    }

    // Calculate progress percentages
    const pct = (currentKm / targetKm) * 100;
    mapCyclist.style.left = `${pct}%`;
    mapProgress.style.width = `${pct}%`;

    // Speed up hero bicycle animation temporarily
    if (heroBikeContainer) {
      heroBikeContainer.classList.add('pedaling');
      clearTimeout(pedalingTimeout);
      pedalingTimeout = setTimeout(() => {
        heroBikeContainer.classList.remove('pedaling');
      }, 800);
    }

    // Check milestones
    const currentMilestone = milestoneRanges.find(range => currentKm >= range.start && currentKm <= range.end);
    if (currentMilestone) {
      triggerMilestoneCard(currentMilestone.index);
    }

    // Check finish
    if (currentKm === targetKm) {
      handleFinish();
    }
  }

  function handleFinish() {
    isCelebrationRunning = true;
    startCelebration();
    playFanfare();
    
    // Disable pedal button
    pedalBtn.disabled = true;
    pedalBtn.style.opacity = '0.5';
    pedalBtn.innerHTML = '<i class="fa-solid fa-flag-checkered"></i> Aangekomen!';
    
    // Smooth scroll down to the finish card
    setTimeout(() => {
      document.getElementById('card-4').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);
  }

  // Bind pedaling events
  pedalBtn.addEventListener('click', handlePedaling);
  
  // Also support Spacebar for pedaling when section is in view
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      const rect = pedalBtn.getBoundingClientRect();
      const inView = (rect.top >= 0 && rect.bottom <= window.innerHeight);
      if (inView) {
        e.preventDefault();
        handlePedaling();
      }
    }
  });

  celebrateMoreBtn.addEventListener('click', () => {
    launchMultipleFireworks();
    playFanfare();
  });


  // --- CELEBRATION EFFECTS (FIREWORKS & CONFETTI) ---
  const canvas = document.getElementById('celebration-canvas');
  const ctx = canvas.getContext('2d');
  let animationFrameId = null;

  let particles = [];
  let fireworksList = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Particle Class (used for fireworks and confetti)
  class Particle {
    constructor(x, y, color, type) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.type = type; // 'confetti' or 'firework'
      
      if (type === 'firework') {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.gravity = 0.08;
        this.friction = 0.96;
        this.size = Math.random() * 3 + 1;
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.01;
      } else { // confetti
        this.vx = Math.random() * 4 - 2;
        this.vy = Math.random() * 3 + 2;
        this.gravity = 0.05;
        this.friction = 0.99;
        this.size = Math.random() * 6 + 4;
        this.width = this.size;
        this.height = this.size * (Math.random() * 0.5 + 0.5);
        this.alpha = 1;
        this.rotation = Math.random() * Math.PI;
        this.rotationSpeed = Math.random() * 0.1 - 0.05;
      }
    }

    update() {
      this.vx *= this.friction;
      this.vy *= this.friction;
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;

      if (this.type === 'firework') {
        this.alpha -= this.decay;
      } else {
        this.rotation += this.rotationSpeed;
        if (this.y > canvas.height) {
          this.y = -10;
          this.x = Math.random() * canvas.width;
          this.vy = Math.random() * 3 + 2;
        }
      }
    }

    draw() {
      if (this.alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = this.alpha;
      
      if (this.type === 'firework') {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      } else {
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
      }
      ctx.restore();
    }
  }

  // Firework Rocket Class
  class Firework {
    constructor() {
      this.startX = Math.random() * (canvas.width - 200) + 100;
      this.startY = canvas.height;
      this.targetY = Math.random() * (canvas.height / 2.5) + 50;
      this.x = this.startX;
      this.y = this.startY;
      
      const angle = -Math.PI / 2 + (Math.random() * 0.2 - 0.1);
      const speed = Math.sqrt(2 * 0.15 * (this.startY - this.targetY)); // Physics equations for peak height
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.gravity = 0.15;
      this.color = `hsl(${Math.random() * 360}, 100%, 60%)`;
      this.exploded = false;
    }

    update() {
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;

      // Explode at peak (vertical velocity near 0 or ascending limit)
      if (this.vy >= 0 && !this.exploded) {
        this.explode();
        this.exploded = true;
      }
    }

    explode() {
      const particleCount = 60 + Math.floor(Math.random() * 40);
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(this.x, this.y, this.color, 'firework'));
      }
    }

    draw() {
      if (this.exploded) return;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  }

  const confettiColors = ['#f59e0b', '#d97706', '#10b981', '#1b4d3e', '#ef4444', '#3b82f6'];

  function startCelebration() {
    // Generate initial confetti
    for (let i = 0; i < 80; i++) {
      particles.push(new Particle(
        Math.random() * canvas.width,
        Math.random() * canvas.height - canvas.height,
        confettiColors[Math.floor(Math.random() * confettiColors.length)],
        'confetti'
      ));
    }
    
    loopCelebration();
  }

  function launchMultipleFireworks() {
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        fireworksList.push(new Firework());
      }, i * 250);
    }
  }

  function loopCelebration() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Occasional new firework launch during celebration
    if (isCelebrationRunning && Math.random() < 0.02 && fireworksList.length < 5) {
      fireworksList.push(new Firework());
    }

    // Update & draw fireworks
    for (let i = fireworksList.length - 1; i >= 0; i--) {
      fireworksList[i].update();
      fireworksList[i].draw();
      if (fireworksList[i].exploded) {
        fireworksList.splice(i, 1);
      }
    }

    // Update & draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].draw();
      if (particles[i].type === 'firework' && particles[i].alpha <= 0) {
        particles.splice(i, 1);
      }
    }

    animationFrameId = requestAnimationFrame(loopCelebration);
  }


  // --- WISHES WALL (WENSMUUR) ---
  const wishesGrid = document.getElementById('wishes-grid');
  const openWishFormBtn = document.getElementById('open-wish-form-btn');
  const closeWishModalBtn = document.getElementById('close-modal-btn');
  const wishModal = document.getElementById('wish-modal');
  const addWishForm = document.getElementById('add-wish-form');
  const wishSenderInput = document.getElementById('wish-sender');
  const wishMessageInput = document.getElementById('wish-message');

  if (wishesGrid && openWishFormBtn && closeWishModalBtn && wishModal && addWishForm) {
    // Load and render custom wishes from local storage
    function loadWishes() {
      const savedWishes = JSON.parse(localStorage.getItem('opa_bert_wishes')) || [];
      
      savedWishes.forEach(wish => {
        renderWishCard(wish.sender, wish.message, false);
      });
    }

    function renderWishCard(sender, message, animate = true) {
      const card = document.createElement('div');
      card.className = 'wish-card';
      
      // Add red pin
      const pin = document.createElement('div');
      pin.className = 'wish-pin';
      card.appendChild(pin);

      // Add message
      const msgPara = document.createElement('p');
      msgPara.className = 'wish-text';
      msgPara.textContent = `"${message}"`;
      card.appendChild(msgPara);

      // Add author
      const authorDiv = document.createElement('div');
      authorDiv.className = 'wish-author';
      authorDiv.textContent = `- ${sender}`;
      card.appendChild(authorDiv);

      // Random rotation logic
      const rot = Math.random() * 6 - 3; // between -3 and 3 degrees
      card.style.transform = `rotate(${rot}deg)`;
      
      if (animate) {
        card.style.opacity = '0';
        card.style.transform = `rotate(${rot}deg) scale(0.8)`;
        wishesGrid.appendChild(card);
        
        // Trigger browser paint to enable transition
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = `rotate(${rot}deg) scale(1)`;
          card.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        }, 50);
      } else {
        wishesGrid.appendChild(card);
      }
    }

    // Open modal
    openWishFormBtn.addEventListener('click', () => {
      wishModal.classList.add('active');
    });

    // Close modal
    function closeModal() {
      wishModal.classList.remove('active');
      addWishForm.reset();
    }
    
    closeWishModalBtn.addEventListener('click', closeModal);
    wishModal.addEventListener('click', (e) => {
      if (e.target === wishModal) {
        closeModal();
      }
    });

    // Handle Form Submit
    addWishForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const sender = wishSenderInput.value.trim();
      const message = wishMessageInput.value.trim();
      
      if (!sender || !message) return;

      // Render immediately
      renderWishCard(sender, message, true);
      
      // Save to LocalStorage
      const savedWishes = JSON.parse(localStorage.getItem('opa_bert_wishes')) || [];
      savedWishes.push({ sender, message });
      localStorage.setItem('opa_bert_wishes', JSON.stringify(savedWishes));

      // Sound alert!
      playBikeBell();

      // Close modal
      closeModal();
    });

    // Run on load
    loadWishes();
  }
});
