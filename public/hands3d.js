// ══════════════════════════════════════════════════════════════
// 3D Battle Animation Renderer - Rock Paper Scissors!
// ══════════════════════════════════════════════════════════════

class Hand3DBattleRenderer {
  constructor(containerId) {
    console.log(`Creating Hand3DBattleRenderer for: ${containerId}`);
    
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container ${containerId} not found`);
      throw new Error(`Container ${containerId} not found`);
    }

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, this.container.offsetWidth / this.container.offsetHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: 'high-performance'
    });
    
    this.setupRenderer();
    this.setupLights();
    this.setupCamera();
    
    this.leftHand = null;
    this.rightHand = null;
    this.animationId = null;
    this.particles = [];
    this.animationProgress = 0;
    this.currentAnimation = null;
    
    this.animate = this.animate.bind(this);
    
    console.log('Hand3DBattleRenderer initialized!');
  }

  setupRenderer() {
    const width = this.container.offsetWidth;
    const height = this.container.offsetHeight;
    
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);
  }

  setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xaabbff, 0.4);
    fillLight.position.set(-5, 3, -3);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xff9966, 0.6);
    rimLight.position.set(-3, 2, -8);
    this.scene.add(rimLight);
  }

  setupCamera() {
    this.camera.position.set(0, 0, 10);
    this.camera.lookAt(0, 0, 0);
  }

  // ── Hand Materials ─────────────────────────────────────────
  
  createSkinMaterial() {
    return new THREE.MeshStandardMaterial({
      color: 0xffdbac,
      roughness: 0.7,
      metalness: 0.05,
      emissive: 0xffaa88,
      emissiveIntensity: 0.05,
    });
  }

  // ── Simple Hand Shapes ─────────────────────────────────────
  
  createRock() {
    const group = new THREE.Group();
    const material = this.createSkinMaterial();
    
    // Main fist
    const fistGeometry = new THREE.SphereGeometry(1, 20, 20);
    fistGeometry.scale(1.3, 1, 0.9);
    const fist = new THREE.Mesh(fistGeometry, material);
    fist.castShadow = true;
    group.add(fist);

    // Knuckles
    for (let i = 0; i < 4; i++) {
      const knuckle = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 12, 12),
        material
      );
      knuckle.position.set(-0.6 + i * 0.4, 0.7, 0.8);
      knuckle.castShadow = true;
      group.add(knuckle);
    }

    // Thumb
    const thumb = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.25, 0.8, 8, 12),
      material
    );
    thumb.position.set(-1.2, -0.1, 0.5);
    thumb.rotation.set(0.4, 0, 0.8);
    thumb.castShadow = true;
    group.add(thumb);

    return group;
  }

  createPaper() {
    const group = new THREE.Group();
    const material = this.createSkinMaterial();
    
    // Palm
    const palm = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2.5, 0.4),
      material
    );
    palm.castShadow = true;
    group.add(palm);

    // Fingers
    const fingerPositions = [
      { x: -0.75, y: 1.5, height: 1.2 },
      { x: -0.25, y: 1.7, height: 1.5 },
      { x: 0.25, y: 1.75, height: 1.6 },
      { x: 0.75, y: 1.6, height: 1.4 },
    ];

    fingerPositions.forEach(pos => {
      const finger = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.18, pos.height, 8, 12),
        material
      );
      finger.position.set(pos.x, pos.y, 0);
      finger.castShadow = true;
      group.add(finger);
    });

    // Thumb
    const thumb = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.2, 1, 8, 12),
      material
    );
    thumb.position.set(-1.3, 0.2, 0.3);
    thumb.rotation.set(0.3, 0, 0.8);
    thumb.castShadow = true;
    group.add(thumb);

    return group;
  }

  createScissors() {
    const group = new THREE.Group();
    const material = this.createSkinMaterial();
    
    // Palm
    const palm = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 2, 0.4),
      material
    );
    palm.castShadow = true;
    group.add(palm);

    // Index finger (extended)
    const index = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.18, 1.5, 8, 12),
      material
    );
    index.position.set(0.6, 1.5, 0);
    index.rotation.z = -0.3;
    index.castShadow = true;
    group.add(index);

    // Middle finger (extended)
    const middle = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.18, 1.6, 8, 12),
      material
    );
    middle.position.set(-0.1, 1.6, 0);
    middle.rotation.z = 0.2;
    middle.castShadow = true;
    group.add(middle);

    // Curled fingers (knuckles)
    const knuckle1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 12, 12),
      material
    );
    knuckle1.position.set(-0.7, 0.9, 0.2);
    knuckle1.castShadow = true;
    group.add(knuckle1);

    const knuckle2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 12, 12),
      material
    );
    knuckle2.position.set(-1, 0.6, 0.2);
    knuckle2.castShadow = true;
    group.add(knuckle2);

    // Thumb
    const thumb = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.2, 0.9, 8, 12),
      material
    );
    thumb.position.set(-1.2, -0.3, 0.4);
    thumb.rotation.set(0.4, 0.2, 0.9);
    thumb.castShadow = true;
    group.add(thumb);

    return group;
  }

  // ── Particle Effects ───────────────────────────────────────
  
  createImpactParticles(position, color) {
    const particleCount = 40;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = position.x;
      positions[i3 + 1] = position.y;
      positions[i3 + 2] = position.z;
      
      velocities.push({
        x: (Math.random() - 0.5) * 0.3,
        y: Math.random() * 0.3,
        z: (Math.random() - 0.5) * 0.3,
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: color,
      size: 0.3,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    particles.userData.velocities = velocities;
    particles.userData.life = 1.0;

    return particles;
  }

  updateParticles() {
    this.particles.forEach((particleSystem, index) => {
      const positions = particleSystem.geometry.attributes.position.array;
      const velocities = particleSystem.userData.velocities;

      for (let i = 0; i < velocities.length; i++) {
        const i3 = i * 3;
        positions[i3] += velocities[i].x;
        positions[i3 + 1] += velocities[i].y;
        positions[i3 + 2] += velocities[i].z;
        velocities[i].y -= 0.01;
      }

      particleSystem.geometry.attributes.position.needsUpdate = true;
      particleSystem.userData.life -= 0.02;
      particleSystem.material.opacity = particleSystem.userData.life;

      if (particleSystem.userData.life <= 0) {
        this.scene.remove(particleSystem);
        this.particles.splice(index, 1);
      }
    });
  }

  // ── Battle Animations ──────────────────────────────────────
  
  playBattle(yourChoice, opponentChoice, result) {
    console.log(`Playing battle: ${yourChoice} vs ${opponentChoice}, result: ${result}`);
    
    // Clear existing hands
    if (this.leftHand) this.scene.remove(this.leftHand);
    if (this.rightHand) this.scene.remove(this.rightHand);
    this.particles.forEach(p => this.scene.remove(p));
    this.particles = [];
    
    // Create hands
    this.leftHand = this.createHandByType(yourChoice);
    this.rightHand = this.createHandByType(opponentChoice);
    
    // Initial positions
    this.leftHand.position.set(-3, 0, 0);
    this.rightHand.position.set(3, 0, 0);
    this.rightHand.rotation.y = Math.PI;
    
    this.scene.add(this.leftHand);
    this.scene.add(this.rightHand);
    
    // Determine animation
    this.animationProgress = 0;
    if (result === 'draw') {
      this.currentAnimation = 'draw';
    } else if (result === 'win') {
      this.currentAnimation = this.getWinAnimation(yourChoice, opponentChoice);
    } else {
      this.currentAnimation = this.getLoseAnimation(yourChoice, opponentChoice);
    }
    
    console.log(`Animation: ${this.currentAnimation}`);
    
    if (!this.animationId) {
      this.animate();
    }
  }

  createHandByType(type) {
    switch(type) {
      case 'rock': return this.createRock();
      case 'paper': return this.createPaper();
      case 'scissors': return this.createScissors();
      default: return this.createRock();
    }
  }

  getWinAnimation(yourChoice, opponentChoice) {
    if (yourChoice === 'rock' && opponentChoice === 'scissors') return 'rock_smash_scissors';
    if (yourChoice === 'scissors' && opponentChoice === 'paper') return 'scissors_cut_paper';
    if (yourChoice === 'paper' && opponentChoice === 'rock') return 'paper_wrap_rock';
    return 'draw';
  }

  getLoseAnimation(yourChoice, opponentChoice) {
    if (opponentChoice === 'rock' && yourChoice === 'scissors') return 'rock_smash_scissors_reverse';
    if (opponentChoice === 'scissors' && yourChoice === 'paper') return 'scissors_cut_paper_reverse';
    if (opponentChoice === 'paper' && yourChoice === 'rock') return 'paper_wrap_rock_reverse';
    return 'draw';
  }

  updateBattleAnimation() {
    if (!this.leftHand || !this.rightHand) return;
    
    this.animationProgress += 0.015;
    const t = Math.min(this.animationProgress, 1);
    
    switch(this.currentAnimation) {
      case 'rock_smash_scissors':
        this.animateRockSmashScissors(t, false);
        break;
      case 'rock_smash_scissors_reverse':
        this.animateRockSmashScissors(t, true);
        break;
      case 'scissors_cut_paper':
        this.animateScissorsCutPaper(t, false);
        break;
      case 'scissors_cut_paper_reverse':
        this.animateScissorsCutPaper(t, true);
        break;
      case 'paper_wrap_rock':
        this.animatePaperWrapRock(t, false);
        break;
      case 'paper_wrap_rock_reverse':
        this.animatePaperWrapRock(t, true);
        break;
      case 'draw':
        this.animateDraw(t);
        break;
    }
  }

  animateRockSmashScissors(t, reverse) {
    const rock = reverse ? this.rightHand : this.leftHand;
    const scissors = reverse ? this.leftHand : this.rightHand;
    
    if (t < 0.3) {
      // Move into position
      const slideT = t / 0.3;
      rock.position.x = reverse ? (3 - slideT * 1.5) : (-3 + slideT * 1.5);
      scissors.position.x = reverse ? (-3 + slideT * 1.5) : (3 - slideT * 1.5);
    } else if (t < 0.6) {
      // Rock rises up
      const liftT = (t - 0.3) / 0.3;
      rock.position.y = liftT * 3;
    } else if (t < 0.8) {
      // Rock SMASHES down
      const smashT = (t - 0.6) / 0.2;
      rock.position.y = 3 - smashT * 3.5;
      
      if (smashT > 0.8 && this.particles.length === 0) {
        const particles = this.createImpactParticles(scissors.position, 0xffaa00);
        this.scene.add(particles);
        this.particles.push(particles);
        scissors.visible = false;
      }
    } else {
      // Hold
      rock.position.y = -0.5;
      scissors.visible = false;
    }
  }

  animateScissorsCutPaper(t, reverse) {
    const scissors = reverse ? this.rightHand : this.leftHand;
    const paper = reverse ? this.leftHand : this.rightHand;
    
    if (t < 0.4) {
      // Move together
      const slideT = t / 0.4;
      scissors.position.x = reverse ? (3 - slideT * 2) : (-3 + slideT * 2);
      paper.position.x = reverse ? (-3 + slideT * 2) : (3 - slideT * 2);
    } else if (t < 0.7) {
      // Scissors makes cutting motion
      const cutT = (t - 0.4) / 0.3;
      scissors.position.y = Math.sin(cutT * Math.PI * 3) * 0.8;
      scissors.rotation.z = Math.sin(cutT * Math.PI * 4) * 0.3;
    } else {
      // Paper splits and falls
      const fallT = (t - 0.7) / 0.3;
      paper.position.y = -fallT * 2;
      paper.rotation.z = fallT * Math.PI * 0.5;
      
      if (fallT > 0.2 && this.particles.length === 0) {
        const particles = this.createImpactParticles(paper.position, 0x6bb6ff);
        this.scene.add(particles);
        this.particles.push(particles);
      }
    }
  }

  animatePaperWrapRock(t, reverse) {
    const paper = reverse ? this.rightHand : this.leftHand;
    const rock = reverse ? this.leftHand : this.rightHand;
    
    if (t < 0.4) {
      // Move together
      const slideT = t / 0.4;
      paper.position.x = reverse ? (3 - slideT * 2.5) : (-3 + slideT * 2.5);
      rock.position.x = reverse ? (-3 + slideT * 2.5) : (3 - slideT * 2.5);
    } else if (t < 0.8) {
      // Paper wraps around rock
      const wrapT = (t - 0.4) / 0.4;
      paper.rotation.y = wrapT * Math.PI * 2;
      paper.scale.set(1 + wrapT * 0.5, 1 + wrapT * 0.5, 1 - wrapT * 0.5);
      rock.scale.set(1 - wrapT * 0.6, 1 - wrapT * 0.6, 1 - wrapT * 0.6);
      
      if (wrapT > 0.5 && this.particles.length === 0) {
        const particles = this.createImpactParticles(rock.position, 0xff6b9d);
        this.scene.add(particles);
        this.particles.push(particles);
      }
    }
  }

  animateDraw(t) {
    if (t < 0.5) {
      // Move together
      const slideT = t / 0.5;
      this.leftHand.position.x = -3 + slideT * 1.5;
      this.rightHand.position.x = 3 - slideT * 1.5;
    } else {
      // Bounce
      const bounceT = (t - 0.5) / 0.5;
      const bounce = Math.sin(bounceT * Math.PI * 3) * 0.3;
      this.leftHand.position.y = bounce;
      this.rightHand.position.y = bounce;
    }
  }

  // ── Animation Loop ─────────────────────────────────────────
  
  animate() {
    this.animationId = requestAnimationFrame(this.animate);
    
    this.updateBattleAnimation();
    this.updateParticles();
    
    this.renderer.render(this.scene, this.camera);
  }

  clear() {
    if (this.leftHand) this.scene.remove(this.leftHand);
    if (this.rightHand) this.scene.remove(this.rightHand);
    this.leftHand = null;
    this.rightHand = null;
    this.particles.forEach(p => this.scene.remove(p));
    this.particles = [];
    this.animationProgress = 0;
    this.currentAnimation = null;
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  resize() {
    const width = this.container.offsetWidth;
    const height = this.container.offsetHeight;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}
