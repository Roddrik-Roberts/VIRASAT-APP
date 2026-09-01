import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import InteractiveDotBackground from './InteractiveDotBackground';
import React from 'react';
import AIChatbot from './AIChatbot';

const STATE_DETAILS = {
  "Uttar Pradesh": {
    tagline: "The Heartland of Sacred Rivers & Dynasties",
    history: "Cradle of Vedic civilization along the sacred Ganges and Yamuna rivers. Uttar Pradesh was the birthplace of epic legends, the seat of the powerful Maurya and Mughal empires, and the cultural heartland of Nawabi art and literature.",
    facts: [
      "Host to the Kumbh Mela, recognized as the largest gathering of humanity on Earth.",
      "Varanasi is documented as one of the oldest continuously inhabited cities in human history.",
      "Home to three iconic UNESCO World Heritage Sites: Taj Mahal, Agra Fort, and Fatehpur Sikri."
    ]
  },
  "Rajasthan": {
    tagline: "The Royal Realm of Kings & Fortresses",
    history: "Forged by legendary Rajput dynasties, Rajasthan's heritage is defined by magnificent hilltop fortresses, desert trading routes, chivalric history, and vibrant folk traditions across the Thar Desert.",
    facts: [
      "Houses the Thar Desert, covering over 60% of the state's geographic area.",
      "Jaipur was painted pink in 1876 to welcome Edward, Prince of Wales, establishing its title as the Pink City.",
      "Kumbhalgarh Fort boasts the world's second-longest continuous defensive wall, extending 36 km."
    ]
  },
  "Kerala": {
    tagline: "God's Own Country on the Malabar Coast",
    history: "A premier global spice trading port since 3000 BCE, connecting ancient Roman, Arab, and Chinese maritime traders. Kerala's history is rich with unique architectural styles, temple arts, and peaceful cultural syncretism.",
    facts: [
      "Birthplace of Ayurveda, the world's oldest surviving holistic healing system.",
      "Features an interconnected network of brackish lagoons and lakes spanning over 900 kilometers.",
      "Home to the highest literacy rate and human development index in India."
    ]
  },
  "Assam": {
    tagline: "Land of the Red River & Lush Valleys",
    history: "Ruled for over six centuries by the resilient Ahom Kingdom, which successfully defended the region against repeated Mughal expansions and cultivated rich traditions of silk weaving and river trade.",
    facts: [
      "Generates more than 50% of India's total tea production.",
      "Kaziranga National Park shelters over two-thirds of the world's great one-horned rhinoceros population.",
      "Majuli, located on the Brahmaputra River, is recognized as the world's largest inhabited river island."
    ]
  },
  "Tamil Nadu": {
    tagline: "Cradle of Dravidian Architecture & Classical Arts",
    history: "Nurtured by ancient Tamil sea-faring empires including the Cholas, Cheras, and Pandyas. Tamil Nadu stands as an architectural treasure trove with a literary and cultural lineage spanning over two millennia.",
    facts: [
      "Houses over 33,000 ancient Hindu temples, many featuring towering multi-tiered gopurams.",
      "The Chola Dynasty built one of the longest-ruling naval empires in Indian history.",
      "Home to classical Bharatanatyam dance and Carnatic musical traditions."
    ]
  },
  "Delhi": {
    tagline: "The Capital Citadel of Seven Historic Cities",
    history: "Rebuilt seven distinct times throughout history, Delhi served as the strategic imperial capital for Rajputs, the Delhi Sultanate, the Mughal Empire, and British Raj before standing as modern India's capital.",
    facts: [
      "Qutub Minar is the world's tallest brick minaret, standing at 72.5 meters.",
      "Houses Khari Baoli, Asia's largest wholesale spice market operational since the 17th century.",
      "Over 20% of the national capital territory is covered under green forest and tree canopy."
    ]
  }
};

const GAME_2D_HTML = `
<!DOCTYPE html>
<html>
<head>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    background-color: #090d16;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 10px;
    user-select: none;
    overflow: hidden;
    height: 100vh;
  }
  #gameWrapper {
    position: relative;
    width: 780px;
    height: 380px;
    border-radius: 16px;
    overflow: hidden;
    border: 2px solid #f59e0b;
    box-shadow: 0 0 25px rgba(245, 158, 11, 0.4), inset 0 0 15px rgba(0, 0, 0, 0.8);
    background: #0f172a;
  }
  canvas { display: block; }
  
  .hud {
    position: absolute;
    top: 12px;
    left: 15px;
    right: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    padding: 8px 18px;
    border-radius: 12px;
    border: 1px solid rgba(245, 158, 11, 0.5);
    font-weight: 700;
    font-size: 13px;
    color: #f8fafc;
    z-index: 5;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  }
  .hud-badge { 
    color: #fbbf24; 
    font-size: 15px; 
    font-family: monospace; 
    letter-spacing: 0.5px;
  }

  .modal-overlay {
    display: none;
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background-size: cover !important;
    background-position: center !important;
    background-repeat: no-repeat !important;
    z-index: 10;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 15px;
    text-align: center;
  }

  .modal-overlay::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    z-index: -1;
  }

  .modal-content-box {
    background: rgba(15, 23, 42, 0.92);
    border: 1.5px solid rgba(245, 158, 11, 0.85);
    border-radius: 16px;
    padding: 20px 24px;
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.7);
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 520px;
    width: 90%;
  }

  .modal-title { 
    color: #fbbf24; 
    font-size: 22px; 
    font-weight: 800;
    margin-bottom: 8px; 
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.9);
  }
  .modal-desc { 
    font-size: 14px; 
    margin-bottom: 16px; 
    line-height: 1.4; 
    color: #ffffff; 
    font-weight: 600;
    text-shadow: 0 2px 5px rgba(0, 0, 0, 0.95);
  }
  .options-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }
  .btn {
    padding: 9px 14px;
    background: rgba(30, 41, 59, 0.85);
    border: 1px solid rgba(245, 158, 11, 0.75);
    color: #ffffff;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 700;
    font-size: 13.5px;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
    transition: all 0.2s ease;
  }
  .btn:hover {
    background: #f59e0b;
    color: #0f172a;
    text-shadow: none;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
  }

  .controls-hint {
    margin-top: 10px;
    font-size: 12.5px;
    color: #94a3b8;
    text-align: center;
  }
  .key {
    background: #1e293b;
    color: #f59e0b;
    padding: 2px 7px;
    border-radius: 5px;
    border: 1px solid rgba(245, 158, 11, 0.3);
    font-weight: bold;
    font-family: monospace;
  }
</style>
</head>
<body>

<div id="gameWrapper">
  <div class="hud">
    <div>📍 Region: <span id="hudRegion" class="hud-badge">Delhi</span></div>
    <div>🏆 Score: <span id="hudScore" class="hud-badge">0</span></div>
    <div>⭐ Heritage Badges: <span id="hudBadges" class="hud-badge">0/6</span></div>
  </div>

  <canvas id="gameCanvas" width="780" height="380"></canvas>

  <div class="modal-overlay" id="quizModal">
    <div class="modal-content-box">
      <h2 class="modal-title" id="qTitle">Heritage Station</h2>
      <p class="modal-desc" id="qText">Question text goes here...</p>
      <div class="options-grid" id="qOptions"></div>
    </div>
  </div>

  <div class="modal-overlay" id="victoryModal">
    <div class="modal-content-box">
      <h1 class="modal-title" style="font-size:28px; color:#10b981;">🏆 YOU WIN! 🏆</h1>
      <p class="modal-desc" id="victoryDesc">You completed the entire Indian Heritage Quest!</p>
      <button class="btn" onclick="restartGame()" style="background:#10b981; color:#0f172a; border-color:#059669; width:180px; margin-top:8px;">Play Again</button>
    </div>
  </div>
</div>

<div class="controls-hint">
  Controls: <span class="key">A</span> Move Left &nbsp;|&nbsp; <span class="key">D</span> Move Right &nbsp;|&nbsp; <span class="key">W</span> / <span class="key">Space</span> Jump
</div>

<script>
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const imgBg = new Image(); 
  imgBg.src = 'https://i.postimg.cc/gjds3kxf/HR-Mountain-View.png';

  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  let score = 0;
  let badges = 0;
  let cameraX = 0;
  let gamePaused = false;

  const groundY = 310;

  const player = {
    x: 80,
    y: 240,
    width: 64,
    height: 64,
    vx: 0,
    vy: 0,
    speed: 4.8,
    jumpPower: -12.5,
    gravity: 0.6,
    isGrounded: false,
    facing: 'right',
    animTick: 0
  };

  const checkpoints = [
    {
      x: 700,
      region: 'Delhi',
      passed: false,
      title: '🏛️ Stop 1: Delhi',
      monumentImg: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',
      q: 'Which iconic Mughal monument in Delhi is constructed using red sandstone?',
      opts: ['Red Fort', 'Amer Fort', 'Hawa Mahal', 'Victoria Memorial'],
      ans: 'Red Fort'
    },
    {
      x: 1400,
      region: 'Uttar Pradesh',
      passed: false,
      title: '🕌 Stop 2: Uttar Pradesh',
      monumentImg: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80',
      q: 'Lucknow is world-renowned for which delicate hand-embroidery art form?',
      opts: ['Phulkari', 'Chikan Embroidery', 'Kantha Work', 'Zardozi'],
      ans: 'Chikan Embroidery'
    },
    {
      x: 2100,
      region: 'Rajasthan',
      passed: false,
      title: '🏰 Stop 3: Rajasthan',
      monumentImg: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
      q: 'Which historic city in Rajasthan is globally recognized as the "Pink City"?',
      opts: ['Udaipur', 'Jodhpur', 'Jaipur', 'Jaisalmer'],
      ans: 'Jaipur'
    },
    {
      x: 2800,
      region: 'Assam',
      passed: false,
      title: '🦏 Stop 4: Assam',
      monumentImg: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80',
      q: 'Which UNESCO World Heritage National Park in Assam is famous for the Great One-Horned Rhinoceros?',
      opts: ['Kaziranga National Park', 'Manas National Park', 'Gir Forest', 'Jim Corbett Park'],
      ans: 'Kaziranga National Park'
    },
    {
      x: 3500,
      region: 'Tamil Nadu',
      passed: false,
      title: '🛕 Stop 5: Tamil Nadu',
      monumentImg: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
      q: 'The grand Brihadeeswarar Temple in Thanjavur was commissioned by which Chola emperor?',
      opts: ['Raja Raja Chola I', 'Rajendra Chola I', 'Karikala Chola', 'Kulothunga I'],
      ans: 'Raja Raja Chola I'
    },
    {
      x: 4200,
      region: 'Kerala',
      passed: false,
      title: '🌴 Stop 6: Kerala',
      monumentImg: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
      q: 'Which traditional classical dance-drama of Kerala is famous for vibrant face makeup and headgear?',
      opts: ['Kathakali', 'Mohiniyattam', 'Bharatanatyam', 'Kuchipudi'],
      ans: 'Kathakali'
    }
  ];

  const obstacles = [
    { x: 420, w: 38, h: 38 },
    { x: 1050, w: 38, h: 38 },
    { x: 1750, w: 38, h: 38 },
    { x: 2450, w: 38, h: 38 },
    { x: 3150, w: 38, h: 38 },
    { x: 3850, w: 38, h: 38 }
  ];

  const particles = Array.from({ length: 25 }, () => ({
    x: Math.random() * 5000,
    y: Math.random() * 250,
    size: Math.random() * 2 + 1,
    speed: Math.random() * 0.4 + 0.1
  }));

  function drawRoyalExplorer(x, y, w, h, facing, isGrounded, vx, vy, animTick) {
    ctx.save();
    
    if (facing === 'left') {
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(x, y);
    }

    let stride = Math.sin(animTick * 0.25);
    let legAngle = (Math.abs(vx) > 0.2 && isGrounded) ? stride * 22 : 0;
    let armAngle = (Math.abs(vx) > 0.2 && isGrounded) ? -stride * 20 : 0;

    if (!isGrounded) {
      legAngle = 15;
      armAngle = -35;
    }

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    let scarfWave = Math.sin(animTick * 0.3) * 5;
    let scarfLift = !isGrounded ? -10 : (Math.abs(vx) * 2.5);
    ctx.moveTo(18, 16);
    ctx.quadraticCurveTo(0 - scarfLift, 26 + scarfWave, -10 - scarfLift, 44 + scarfWave);
    ctx.lineTo(10, 40);
    ctx.lineTo(24, 22);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.translate(26, 42);
    ctx.rotate((-legAngle * Math.PI) / 180);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-4, 0, 8, 18);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-4, 13, 11, 7);
    ctx.restore();

    ctx.save();
    ctx.translate(36, 42);
    ctx.rotate((legAngle * Math.PI) / 180);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-4, 0, 8, 18);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-4, 13, 11, 7);
    ctx.restore();

    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.roundRect(18, 18, 26, 26, 6);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(20, 18, 22, 4);
    ctx.fillRect(28, 22, 6, 22);

    ctx.save();
    ctx.translate(22, 22);
    ctx.rotate((-armAngle * Math.PI) / 180);
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(-3, 0, 6, 18);
    ctx.restore();

    ctx.save();
    ctx.translate(38, 22);
    ctx.rotate((armAngle * Math.PI) / 180);
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(-3, 0, 6, 18);
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(0, 18, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(31, 12, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(31, 8, 11, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(20, 7, 22, 5);

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(31, 7, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(35, 11, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function update() {
    if (!gamePaused) {
      if (keys['KeyD'] || keys['ArrowRight']) {
        player.vx = player.speed;
        player.facing = 'right';
      } else if (keys['KeyA'] || keys['ArrowLeft']) {
        player.vx = -player.speed;
        player.facing = 'left';
      } else {
        player.vx *= 0.65;
      }

      if ((keys['KeyW'] || keys['Space'] || keys['ArrowUp']) && player.isGrounded) {
        player.vy = player.jumpPower;
        player.isGrounded = false;
      }

      player.vy += player.gravity;

      player.x += player.vx;
      if (player.x < 20) player.x = 20;

      obstacles.forEach(obs => {
        const obsTop = groundY - obs.h;
        if (player.y + player.height > obsTop + 4) {
          if (player.vx > 0 && player.x + player.width > obs.x && player.x < obs.x) {
            player.x = obs.x - player.width;
            player.vx = 0;
          } else if (player.vx < 0 && player.x < obs.x + obs.w && player.x + player.width > obs.x + obs.w) {
            player.x = obs.x + obs.w;
            player.vx = 0;
          }
        }
      });

      player.y += player.vy;
      player.isGrounded = false;

      if (player.y >= groundY - player.height) {
        player.y = groundY - player.height;
        player.vy = 0;
        player.isGrounded = true;
      }

      obstacles.forEach(obs => {
        const obsTop = groundY - obs.h;
        if (player.x + player.width > obs.x + 6 && player.x < obs.x + obs.w - 6) {
          if (player.y + player.height >= obsTop && player.y + player.height <= obsTop + 14 && player.vy >= 0) {
            player.y = obsTop - player.height;
            player.vy = 0;
            player.isGrounded = true;
          }
        }
      });

      cameraX = player.x - 180;
      if (cameraX < 0) cameraX = 0;

      if (player.vx > 0.5) {
        score += 0.8;
        document.getElementById('hudScore').innerText = Math.floor(score);
      }

      checkpoints.forEach((cp, idx) => {
        if (!cp.passed && player.x >= cp.x) {
          triggerQuiz(idx);
        }
      });

      player.animTick++;
    }

    draw();
    requestAnimationFrame(update);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-cameraX, 0);

    if (imgBg.complete && imgBg.naturalWidth !== 0) {
      let bgX = (cameraX * 0.25) % canvas.width;
      ctx.drawImage(imgBg, cameraX - bgX, 0, canvas.width, canvas.height);
      ctx.drawImage(imgBg, cameraX - bgX + canvas.width, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(cameraX, 0, canvas.width, canvas.height);
    }

    ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y + Math.sin(player.animTick * 0.05 + p.x) * 5, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#15803d';
    ctx.fillRect(cameraX - 100, groundY, canvas.width + 5000, 70);
    ctx.fillStyle = '#166534';
    ctx.fillRect(cameraX - 100, groundY + 12, canvas.width + 5000, 58);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(cameraX - 100, groundY, canvas.width + 5000, 4);

    checkpoints.forEach(cp => {
      const glowGrad = ctx.createLinearGradient(0, groundY - 110, 0, groundY);
      glowGrad.addColorStop(0, cp.passed ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(cp.x - 15, groundY - 110, 36, 110);

      ctx.fillStyle = cp.passed ? '#10b981' : '#f59e0b';
      ctx.fillRect(cp.x, groundY - 90, 6, 90);

      ctx.beginPath();
      ctx.arc(cp.x + 3, groundY - 90, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cp.x - 38, groundY - 128, 82, 22);
      ctx.strokeStyle = cp.passed ? '#10b981' : '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cp.x - 38, groundY - 128, 82, 22);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(cp.region, cp.x + 3, groundY - 113);
    });

    obstacles.forEach(obs => {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(obs.x, groundY - obs.h, obs.w, obs.h);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.strokeRect(obs.x, groundY - obs.h, obs.w, obs.h);
    });

    drawRoyalExplorer(player.x, player.y, player.width, player.height, player.facing, player.isGrounded, player.vx, player.vy, player.animTick);

    ctx.restore();
  }

  async function triggerQuiz(idx) {
    gamePaused = true;
    const cp = checkpoints[idx];
    document.getElementById('hudRegion').innerText = cp.region;

    const modal = document.getElementById('quizModal');
    modal.style.background = 'linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.25)), url("' + cp.monumentImg + '") center/cover no-repeat';

    document.getElementById('qTitle').innerText = cp.title + ' (AI Powered)';
    document.getElementById('qText').innerText = 'Generating live AI question for ' + cp.region + '...';
    
    const optsContainer = document.getElementById('qOptions');
    optsContainer.innerHTML = '<div style="color: #fbbf24; font-weight: bold; margin: 15px 0;">✨ Virasat AI is crafting your question...</div>';
    modal.style.display = 'flex';

    try {
      const res = await fetch('http://localhost:8000/api/ai/trivia/' + encodeURIComponent(cp.region));
      const aiData = await res.json();

      if (aiData && aiData.question && aiData.options) {
        renderQuizContent(aiData.question, aiData.options, aiData.answer, idx);
      } else {
        renderQuizContent(cp.q, cp.opts, cp.ans, idx);
      }
    } catch (err) {
      console.warn("AI backend unreachable, loading local checkpoint question:", err);
      renderQuizContent(cp.q, cp.opts, cp.ans, idx);
    }
  }

  function renderQuizContent(questionText, optionsArray, correctAnswer, idx) {
    document.getElementById('qText').innerText = questionText;
    const optsContainer = document.getElementById('qOptions');
    optsContainer.innerHTML = '';

    optionsArray.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.innerText = opt;
      btn.onclick = () => handleAnswer(opt, correctAnswer, idx);
      optsContainer.appendChild(btn);
    });
  }

  function handleAnswer(selected, correct, idx) {
    if (selected === correct) {
      score += 200;
      badges++;
      document.getElementById('hudScore').innerText = Math.floor(score);
      document.getElementById('hudBadges').innerText = badges + '/' + checkpoints.length;
    }

    checkpoints[idx].passed = true;
    document.getElementById('quizModal').style.display = 'none';

    if (idx === checkpoints.length - 1) {
      showVictoryScreen();
    } else {
      gamePaused = false;
    }
  }

  function showVictoryScreen() {
    document.getElementById('victoryDesc').innerText = 'Congratulations! You explored all ' + checkpoints.length + ' state heritage stops with a final score of ' + Math.floor(score) + ' points!';
    document.getElementById('victoryModal').style.display = 'flex';
  }

  function restartGame() {
    score = 0;
    badges = 0;
    player.x = 80;
    player.y = 240;
    player.vx = 0;
    player.vy = 0;
    checkpoints.forEach(cp => cp.passed = false);

    document.getElementById('hudScore').innerText = '0';
    document.getElementById('hudBadges').innerText = '0/' + checkpoints.length;
    document.getElementById('hudRegion').innerText = 'Delhi';
    document.getElementById('victoryModal').style.display = 'none';
    
    gamePaused = false;
  }

  update();
</script>
</body>
</html>
`;

function TripPlannerTab({ states }) {
  const [selectedState, setSelectedState] = useState('Rajasthan');
  const [days, setDays] = useState(3);
  const [style, setStyle] = useState('Heritage & Cultural');
  const [itinerary, setItinerary] = useState(null);

  const ROUTE_DATA = {
    "Rajasthan": {
      stays: [
        { name: "Chokhi Dhani Resort", type: "Heritage Resort", price: "₹5,500/night", location: "Jaipur" },
        { name: "Zostel Jaipur", type: "Backpacker Hostel", price: "₹800/night", location: "Jaipur City Center" },
        { name: "Umaid Bhawan Hotel", type: "Boutique Heritage", price: "₹3,200/night", location: "Bani Park, Jaipur" }
      ],
      generateDays: (numDays) => [
        { day: 1, title: "Royal Jaipur Exploration", route: "Amber Fort ➔ Jal Mahal ➔ City Palace", stay: "Jaipur City Center" },
        { day: 2, title: "Bazaars & Crafts", route: "Hawa Mahal ➔ Johari Bazaar ➔ Albert Hall Museum", stay: "Jaipur City Center" },
        { day: 3, title: "Forts & Sunset", route: "Nahargarh Fort ➔ Jaigarh Fort ➔ Chokhi Dhani", stay: "Jaipur Outskirts" },
        { day: 4, title: "Blue City Transit", route: "Jaipur ➔ Ajmer Dargah ➔ Jodhpur Old City", stay: "Jodhpur" },
        { day: 5, title: "Jodhpur Citadel & Lakes", route: "Mehrangarh Fort ➔ Jaswant Thada ➔ Umaid Bhawan", stay: "Jodhpur" }
      ].slice(0, numDays)
    },
    "Uttar Pradesh": {
      stays: [
        { name: "Taj Hotel & Convention Centre", type: "Luxury", price: "₹7,000/night", location: "Agra" },
        { name: "BrijRama Palace", type: "Heritage Ghat Hotel", price: "₹12,000/night", location: "Varanasi Ghats" },
        { name: "Hotel Clarks Avadh", type: "Comfort Hotel", price: "₹4,000/night", location: "Lucknow" }
      ],
      generateDays: (numDays) => [
        { day: 1, title: "Mughal Heritage Trail", route: "Taj Mahal ➔ Agra Fort ➔ Mehtab Bagh", stay: "Agra" },
        { day: 2, title: "Nawabi Culture & Culinary", route: "Bara Imambara ➔ Rumi Darwaza ➔ Hazratganj", stay: "Lucknow" },
        { day: 3, title: "Sacred Spiritual Ghats", route: "Dashashwamedh Ghat ➔ Kashi Vishwanath ➔ Evening Aarti", stay: "Varanasi" },
        { day: 4, title: "Sarnath & Weaving Hubs", route: "Sarnath Museum ➔ Dhamek Stupa ➔ Banarasi Silk Weaving Village", stay: "Varanasi" }
      ].slice(0, numDays)
    }
  };

  const handleGeneratePlan = (e) => {
    e.preventDefault();
    const data = ROUTE_DATA[selectedState] || {
      stays: [
        { name: "State Tourism Hotel", type: "Standard", price: "₹2,500/night", location: "Main City" }
      ],
      generateDays: (n) => Array.from({ length: n }, (_, i) => ({
        day: i + 1,
        title: `Explore Top Monuments Day ${i + 1}`,
        route: "Central Monument ➔ Local Market ➔ Heritage Walking Tour",
        stay: "City Center"
      }))
    };

    setItinerary({
      daysPlan: data.generateDays(days),
      stays: data.stays
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <span>🧭</span> Plan Your Cultural Itinerary
        </h2>
        <p className="text-slate-400 text-sm mb-6">Select your destination and travel details to get optimal routes and accommodation recommendations.</p>

        <form onSubmit={handleGeneratePlan} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-2">Destination State</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500"
            >
              {states.length > 0 ? states.map(st => <option key={st} value={st}>{st}</option>) : <option value="Rajasthan">Rajasthan</option>}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-2">Trip Duration (Days)</label>
            <input
              type="number"
              min="1"
              max="7"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-2">Travel Style</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500"
            >
              <option value="Heritage & Cultural">Heritage & Cultural</option>
              <option value="Budget Explorer">Budget Explorer</option>
              <option value="Luxury Experience">Luxury Experience</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold py-3.5 rounded-xl hover:opacity-95 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Generate Optimal Route & Accommodations
            </button>
          </div>
        </form>
      </div>

      {itinerary && (
        <div className="space-y-8 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>🗺️</span> Recommended Day-by-Day Route
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-amber-400 uppercase text-xs font-bold">
                  <tr>
                    <th className="p-3.5 rounded-l-xl">Day</th>
                    <th className="p-3.5">Title</th>
                    <th className="p-3.5">Suggested Route</th>
                    <th className="p-3.5 rounded-r-xl">Overnight Stay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {itinerary.daysPlan.map((item) => (
                    <tr key={item.day} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-bold text-amber-400">Day {item.day}</td>
                      <td className="p-3.5 font-semibold text-white">{item.title}</td>
                      <td className="p-3.5 text-slate-300">{item.route}</td>
                      <td className="p-3.5 text-slate-400">{item.stay}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>🏨</span> Recommended Places to Stay
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {itinerary.stays.map((stay, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded border border-amber-400/20 inline-block">
                    {stay.type}
                  </span>
                  <h4 className="text-lg font-bold text-white">{stay.name}</h4>
                  <p className="text-xs text-slate-400">📍 {stay.location}</p>
                  <p className="text-amber-400 font-bold text-sm pt-2">{stay.price}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  // Set Dashboard as initial active tab on page load
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [states, setStates] = useState([]);
  const [activeState, setActiveState] = useState('Uttar Pradesh');
  const [heritageData, setHeritageData] = useState({ sites: [], dishes: [] });
  const [events, setEvents] = useState([]);
  const [mapSites, setMapSites] = useState([]);

  const containerRef = useRef(null);
  const heroTextRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const navItems = [
    { name: 'Dashboard', icon: '📊' },
    { name: 'States & Culture', icon: '🏛️' },
    { name: 'Heritage & Monuments', icon: '🏰' },
    { name: 'Cultural Events', icon: '🎉' },
    { name: 'Cultural Games', icon: '🎮' },
    { name: 'Trip Planner', icon: '🗺️' },
    { name: 'User Account', icon: '👤' },
    { name: 'Settings', icon: '⚙️' }
  ];

  // Fetch initial API data
  useEffect(() => {
    axios.get('http://localhost:8000/api/states')
      .then(res => setStates(res.data))
      .catch(err => console.error(err));

    axios.get('http://localhost:8000/api/events')
      .then(res => setEvents(res.data))
      .catch(err => console.error(err));

    axios.get('http://localhost:8000/api/map-sites')
      .then(res => setMapSites(res.data))
      .catch(err => console.error(err));
  }, []);

  // Fetch state details on active state change
  useEffect(() => {
    if (activeState) {
      axios.get(`http://localhost:8000/api/heritage/${activeState}`)
        .then(res => setHeritageData(res.data))
        .catch(err => console.error(err));
    }
  }, [activeState]);

  // Leaflet Map Initialization for Dashboard
  useEffect(() => {
    if (activeTab === 'Dashboard' && mapContainerRef.current && mapSites.length > 0) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapContainerRef.current).setView([22.5937, 78.9629], 5);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      const customPinIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div class="w-4 h-4 bg-amber-400 rounded-full border-2 border-slate-950 shadow-lg shadow-amber-500/80 animate-pulse"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      mapSites.forEach(site => {
        L.marker([site.lat, site.lon], { icon: customPinIcon })
          .addTo(map)
          .bindPopup(`
            <div style="color: #0f172a; font-family: sans-serif; padding: 2px;">
              <strong style="font-size: 14px; color: #d97706;">${site.site}</strong><br/>
              <span style="font-size: 12px; color: #475569;">${site.city} (${site.state})</span>
            </div>
          `);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeTab, mapSites]);

  // GSAP Animations
  useGSAP(() => {
    if (activeTab === 'Dashboard' || activeTab === 'States & Culture' || activeTab === 'Heritage & Monuments') {
      const tl = gsap.timeline();

      if (heroTextRef.current) {
        tl.fromTo(heroTextRef.current,
          { scale: 0.2, opacity: 0, y: 50 },
          { scale: 1, opacity: 1, y: 0, duration: 0.7, ease: 'back.out(1.7)' }
        );
      }

      tl.fromTo('.anim-reveal',
        { y: 35, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.15, ease: 'power2.out' },
        '-=0.2'
      );
    } else {
      gsap.fromTo('.anim-card',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'power2.out' }
      );
    }
  }, { scope: containerRef, dependencies: [activeTab, activeState] });

  const currentDetails = STATE_DETAILS[activeState] || {
    tagline: "Explore regional Indian heritage",
    history: "Rich cultural traditions and historic monuments.",
    facts: ["Historic cultural site.", "Vibrant local cuisine.", "Traditional architecture."]
  };

  return (
    <div ref={containerRef} className="relative flex h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* 🌟 Interactive Canvas Background */}
      <InteractiveDotBackground />

    
      

      {/* Fixed Left Sidebar Navigation */}
      <aside className="relative z-10 w-64 bg-slate-900/80 backdrop-blur-md border-r border-slate-800/80 p-6 flex flex-col justify-between shrink-0 hidden md:flex h-full">
        <div>
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20">
              V
            </div>
            <span className="text-xl font-black tracking-wide bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Virasat
            </span>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  activeTab === item.name
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400">
          <p className="font-semibold text-slate-300">Virasat Portal v1.0</p>
          <p className="mt-0.5 text-slate-500">Cultural & Heritage Directory</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 h-full p-6 md:p-12 overflow-y-auto bg-slate-950/50 backdrop-blur-sm">
        
        {/* Header Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800/80">
          <div>
            <h1 className="text-3xl font-extrabold text-white">{activeTab}</h1>
            <p className="text-slate-400 text-sm mt-1">Explore, preserve, and celebrate Indian heritage.</p>
          </div>

          {(activeTab === 'States & Culture' || activeTab === 'Heritage & Monuments') && (
            <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl shadow-md">
              <label htmlFor="state-select" className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Select State:
              </label>
              <select
                id="state-select"
                value={activeState}
                onChange={(e) => setActiveState(e.target.value)}
                className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {states.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          )}
        </header>

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'Dashboard' && (
          <div className="space-y-8">
            {/* Glowing Hero App Title Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-amber-500/15 via-slate-900/90 to-slate-950 border border-amber-500/30 p-8 md:p-12 text-center shadow-2xl shadow-amber-500/10">
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>
              
              <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/30 px-4 py-1.5 rounded-full mb-4 shadow-sm">
                National Cultural & Heritage Portal
              </span>

              <h1 
                ref={heroTextRef} 
                className="text-6xl md:text-8xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-orange-500 filter drop-shadow-[0_0_35px_rgba(245,158,11,0.55)]"
              >
                VIRASAT
              </h1>

              <p className="anim-reveal text-slate-300 text-base md:text-lg mt-4 max-w-2xl mx-auto font-medium leading-relaxed">
                Preserving, showcasing, and connecting India's timeless monuments, living traditions, and rich cultural tapestry.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="anim-card bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Total Monuments Listed</span>
                <p className="text-4xl font-extrabold text-amber-400 mt-2">{mapSites.length}</p>
              </div>
              <div className="anim-card bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">States Covered</span>
                <p className="text-4xl font-extrabold text-amber-400 mt-2">{states.length}</p>
              </div>
              <div className="anim-card bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Upcoming Cultural Events</span>
                <p className="text-4xl font-extrabold text-amber-400 mt-2">{events.length}</p>
              </div>
            </div>

            {/* Interactive Map */}
            <div className="anim-card bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>🗺️</span> Interactive Heritage Map
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Click any glowing marker to explore monument details and location.</p>
                </div>
                <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                  {mapSites.length} Live Pins
                </span>
              </div>

              <div ref={mapContainerRef} className="h-[480px] w-full rounded-2xl overflow-hidden border border-slate-800 shadow-inner z-0" />
            </div>
          </div>
        )}

        {/* TAB 2: STATES & CULTURE */}
{activeTab === 'States & Culture' && (
  <div className="space-y-16">
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-amber-500/10 via-slate-900/80 to-slate-950 border border-slate-800 p-8 md:p-12 shadow-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
      
      {/* Left Column: State Overview Info */}
      <div className="space-y-4 max-w-2xl flex-1">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3.5 py-1 rounded-full">
          State Culture Overview
        </span>

        <h1 ref={heroTextRef} className="text-5xl md:text-7xl font-black tracking-tight text-white bg-gradient-to-r from-amber-200 via-amber-400 to-orange-500 bg-clip-text text-transparent">
          {activeState}
        </h1>

        <p className="anim-reveal text-lg font-medium text-slate-300">
          {currentDetails.tagline}
        </p>
      </div>

      {/* Right Column: Embedded AIChatbot */}
      <div className="shrink-0 w-full lg:w-auto flex justify-end relative z-10">
        <AIChatbot />
      </div>

    </section>

            <section className="anim-reveal bg-slate-900/80 border border-slate-800/80 p-8 md:p-12 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-8 items-center shadow-xl">
              <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-slate-800 pb-6 md:pb-0 md:pr-8">
                <span className="text-3xl mb-2 block">📜</span>
                <h2 className="text-3xl font-black text-amber-400 leading-tight">Historic Legacy</h2>
                <p className="text-xs text-slate-400 mt-2">Origins and cultural evolution of {activeState}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-slate-200 text-base md:text-lg leading-relaxed font-normal">
                  {currentDetails.history}
                </p>
              </div>
            </section>

            <section className="anim-reveal">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">💡</span>
                <h2 className="text-2xl font-bold text-slate-100">Did You Know? (Fun Facts)</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {currentDetails.facts.map((fact, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl relative overflow-hidden shadow-lg">
                    <span className="absolute -top-2 -right-2 text-6xl font-black text-slate-800/40 select-none">
                      #{idx + 1}
                    </span>
                    <p className="text-slate-300 text-sm leading-relaxed relative z-10">
                      {fact}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="anim-reveal space-y-8 pb-8">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-3">
                <span className="text-2xl">🍲</span>
                <h2 className="text-2xl font-bold text-slate-100">Traditional Delicacies</h2>
              </div>

              <div className="space-y-12">
                {heritageData.dishes.map((dish, index) => {
                  const isEven = index % 2 === 0;
                  return (
                    <div 
                      key={index} 
                      className={`anim-reveal flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8 bg-slate-900/60 border border-slate-800/80 p-6 md:p-8 rounded-3xl shadow-xl hover:border-amber-500/30 transition-all`}
                    >
                      <div className="w-full md:w-1/2 h-64 md:h-80 rounded-2xl overflow-hidden shrink-0 shadow-lg border border-slate-800">
                        <img src={dish.img} alt={dish.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="w-full md:w-1/2 space-y-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                          Regional Specialty #{index + 1}
                        </span>
                        <h3 className="text-2xl md:text-3xl font-extrabold text-white">{dish.name}</h3>
                        <p className="text-slate-300 text-sm md:text-base leading-relaxed">{dish.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* TAB 3: HERITAGE & MONUMENTS */}
        {activeTab === 'Heritage & Monuments' && (
          <div className="space-y-10">
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-amber-500/10 via-slate-900/80 to-slate-950 border border-slate-800 p-8 text-center shadow-xl">
              <h1 ref={heroTextRef} className="text-4xl md:text-6xl font-black tracking-tight text-white bg-gradient-to-r from-amber-200 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                {activeState} Monuments
              </h1>
              <p className="text-slate-400 text-sm mt-2">Explore iconic architectural marvels and heritage sites in {activeState}.</p>
            </section>

            <section className="anim-reveal">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {heritageData.sites.map((site, index) => (
                  <div key={index} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-amber-500/40 transition-all shadow-xl">
                    <div className="h-52 overflow-hidden relative">
                      <img src={site.img} alt={site.title} className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md text-slate-300 text-xs px-2.5 py-1 rounded-md">
                        {site.loc}
                      </span>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-white">{site.title}</h3>
                      <p className="text-xs font-semibold text-amber-500/90 mb-2">{site.period}</p>
                      <p className="text-slate-400 text-xs leading-relaxed">{site.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* TAB 4: CULTURAL EVENTS */}
        {activeTab === 'Cultural Events' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((evt, idx) => (
              <div key={idx} className="anim-card bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded border border-amber-400/20">
                  {evt.date}
                </span>
                <h3 className="text-xl font-bold text-white mt-3">{evt.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{evt.location}</p>
                <p className="text-slate-300 text-sm mt-3 leading-relaxed">{evt.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: CULTURAL GAMES */}
        {activeTab === 'Cultural Games' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3.5 py-1 rounded-full">
                Interactive Side-Scroller
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-white">Virasat Expedition Quest</h2>
              <p className="text-slate-400 text-sm">Run, jump across platforms, and unlock heritage badges at state checkpoints.</p>
            </div>

            <div className="anim-card bg-slate-900 border border-slate-800 p-4 md:p-6 rounded-3xl shadow-2xl flex justify-center items-center overflow-hidden">
              <iframe
                title="Virasat 2D Game"
                srcDoc={GAME_2D_HTML}
                className="w-full max-w-[820px] h-[460px] border-0 rounded-2xl"
                scrolling="no"
              />
            </div>
          </div>
        )}

        {/* TAB 6: TRIP PLANNER */}
        {activeTab === 'Trip Planner' && (
          <TripPlannerTab states={states} />
        )}

        {/* TAB 7: USER ACCOUNT */}
        {activeTab === 'User Account' && (
          <div className="anim-card max-w-xl bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4">User Profile</h2>
            <div className="space-y-4 text-sm">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Display Name</label>
                <input type="text" defaultValue="Heritage Explorer" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Email Address</label>
                <input type="email" defaultValue="user@virasat.org" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500" />
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: SETTINGS */}
        {activeTab === 'Settings' && (
          <div className="anim-card max-w-xl bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 shadow-xl">
            <h2 className="text-lg font-bold text-white">Application Preferences</h2>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <p className="text-sm font-semibold text-slate-200">Dark Theme</p>
                <p className="text-xs text-slate-400">Keep application interface in dark mode</p>
              </div>
              <input type="checkbox" defaultChecked className="accent-amber-500 w-4 h-4 cursor-pointer" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-200">Cultural Event Notifications</p>
                <p className="text-xs text-slate-400">Receive alerts regarding upcoming regional festivals</p>
              </div>
              <input type="checkbox" defaultChecked className="accent-amber-500 w-4 h-4 cursor-pointer" />
            </div>
          </div>
        )}

      </main>
    </div>
  );
}