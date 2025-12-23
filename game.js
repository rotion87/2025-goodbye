/* 2025 Recap Side-Scroller (Stable Background Parallax)
 * ← → 移動
 * ↑ 跳躍
 * Enter / Space：開始、關閉事件
 * ESC：關閉事件
 * M：靜音
 */

(() => {
  "use strict";

  const TOTAL_COINS = 524748;

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const W = canvas.width;
  const H = canvas.height;

  const GROUND_Y = Math.floor(H * 0.78);
  const WORLD_LENGTH = 16000;
  const END_X = WORLD_LENGTH - 300;
  const FINAL_ZONE_START = Math.floor(WORLD_LENGTH * 0.9);

  /* ================= 背景參數 ================= */
  const BG_SPEED = {
    sky: 0.10,
    far: 0.30,
    near: 0.60,
    ground: 1.00,
  };

  /* ================= 道具漂浮參數 ================= */
  const FLOAT_AMPLITUDE = 4;
  const FLOAT_SPEED = 1.6;
  const FLOAT_PHASE_STEP = 0.9;
  const ITEM_SIZE = 48;

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const fmt = (n) => n.toLocaleString("en-US");
  const startTime = performance.now();

  /* ================= DOM ================= */
  const titleScreen = document.getElementById("titleScreen");
  const modal = document.getElementById("modal");
  const ending = document.getElementById("ending");
  const closeBtn = document.getElementById("closeBtn");

  const modalTitle = document.getElementById("modalTitle");
  const modalSubtitle = document.getElementById("modalSubtitle");
  const modalMedia = document.getElementById("modalMedia");

  /* ================= AUDIO ================= */
  const audio = {
    muted: false,
    bgm: new Audio("media/audio/bgm.mp3"),
    pickup: new Audio("media/audio/sfx_pickup.wav"),
    open: new Audio("media/audio/sfx_open.wav"),
    close: new Audio("media/audio/sfx_close.wav"),
    end: new Audio("media/audio/sfx_end.wav"),
  };
  audio.bgm.loop = true;
  audio.bgm.volume = 0.55;

  function playSFX(a) {
    if (audio.muted) return;
    try {
      a.currentTime = 0;
      a.play().catch(() => {});
    } catch {}
  }

  function startBGM() {
    if (audio.muted) return;
    audio.bgm.play().catch(() => {});
  }

  function toggleMute() {
    audio.muted = !audio.muted;
    Object.values(audio).forEach(v => {
      if (v instanceof Audio) v.muted = audio.muted;
    });
    if (!audio.muted) startBGM();
    else audio.bgm.pause();
  }

  /* ================= IMAGES ================= */
  function loadImage(src) {
    const img = new Image();
    img.loaded = false;
    img.onload = () => { img.loaded = true; };
    img.onerror = () => {
      img.loaded = false;
      console.warn("Image failed to load:", src);
    };
    img.src = src;
    return img;
  }

  // 背景（你自己的照片）
  const bg = {
    sky: loadImage("media/backgrounds/bg_sky.png"),
    far: loadImage("media/backgrounds/bg_far.png"),
    near: loadImage("media/backgrounds/bg_near.png"),
    ground: loadImage("media/backgrounds/bg_ground.png"),
  };

  // 角色（同一張）
  const playerImage = loadImage("media/player/player_main.png");

  // 道具（PNG）
  const spriteImages = {
    snake: loadImage("media/sprites/item_snake.png"),
    eyes: loadImage("media/sprites/item_eyes.png"),
    cake: loadImage("media/sprites/item_cake.png"),
    brick: loadImage("media/sprites/item_hollow_brick.png"),
    ball: loadImage("media/sprites/item_ball.png"),
    logo: loadImage("media/sprites/item_logo.png"),
    cat: loadImage("media/sprites/item_cat.png"),
    beer: loadImage("media/sprites/item_beer_can.png"),
    brush: loadImage("media/sprites/item_brush.png"),
    hand: loadImage("media/sprites/item_hand.png"),
    suitcase: loadImage("media/sprites/item_suitcase.png"),
    buddha: loadImage("media/sprites/item_buddha.png"),
    candle: loadImage("media/sprites/item_question_candle.png"),
    rat: loadImage("media/sprites/item_rat_ferret.png"),
  };

  /* ================= EVENTS ================= */
  // K（爸爸）已移除
  const events = [
    { id:"A", name:"蛇年賀卡", sprite:"snake", x:1100, media:{type:"video",src:"media/A_snake.mp4"}, xp:15, coinCost:18000 },
    { id:"B", name:"你好礙眼", sprite:"eyes", x:2000, media:{type:"ig",img:"media/B_ig.jpg",url:"https://instagram.com"}, xp:15, coinCost:21000 },
    { id:"C", name:"生日快樂", sprite:"cake", x:2900, media:{type:"gallery",srcs:["media/C_1.jpg","media/C_2.jpg"]}, xp:10, coinCost:24000 },
    { id:"D", name:"空心磚小誌", sprite:"brick", x:3800, media:{type:"gallery",srcs:["media/D_1.jpg","media/D_2.jpg"]}, xp:20, coinCost:43000 },
    { id:"E", name:"新一代製作", sprite:"ball", x:4900, media:{type:"gallery",srcs:["media/E_1.jpg","media/E_2.jpg"]}, xp:20, coinCost:38000 },
    { id:"F", name:"周邊影片", sprite:"logo", x:6000, media:{type:"video",src:"media/F_video.mp4"}, xp:15, coinCost:28000 },
    { id:"G", name:"九份旅遊", sprite:"cat", x:7100, media:{type:"gallery",srcs:["media/G_1.jpg","media/G_2.jpg"]}, xp:10, coinCost:26000 },
    { id:"H", name:"軟啤酒絲巾", sprite:"beer", x:8200, media:{type:"gallery",srcs:["media/H_1.jpg","media/H_2.jpg"]}, xp:20, coinCost:41000 },
    { id:"I", name:"書法課", sprite:"brush", x:9200, media:{type:"gallery",srcs:["media/I_1.jpg"]}, xp:10, coinCost:24000 },
    { id:"J", name:"手掌便利貼", sprite:"hand", x:10200, media:{type:"gallery",srcs:["media/J_1.jpg"]}, xp:15, coinCost:32000 },
    { id:"L", name:"日本旅遊", sprite:"suitcase", x:12400, media:{type:"gallery",srcs:["media/L_1.jpg","media/L_2.jpg"]}, xp:15, coinCost:47000 },
    { id:"M", name:"彰化設計展", sprite:"buddha", x:13450, media:{type:"gallery",srcs:["media/M_1.jpg"]}, xp:10, coinCost:25000 },
    { id:"N", name:"燭籤", sprite:"candle", x:14500, media:{type:"gallery",srcs:["media/N_1.jpg"]}, xp:20, coinCost:40000 },
    { id:"O", name:"草率季", sprite:"rat", x:15400, media:{type:"gallery",srcs:["media/O_1.jpg","media/O_2.jpg"]}, xp:40, coinCost:97748 },
  ];
  events.forEach((ev, i) => (ev.floatPhase = i * FLOAT_PHASE_STEP));
  const triggered = new Set();

  /* ================= PLAYER ================= */
  const player = {
    x: 200,
    y: GROUND_Y - 48,
    w: 32,
    h: 48,
    vx: 0,
    vy: 0,
    speed: 3.2,
    jumpPower: 9.5,
    gravity: 0.5,
    onGround: true,
  };

  let cameraX = 0;
  let started = false;
  let paused = false;
  let finished = false;

  let coins = TOTAL_COINS;
  let finalZoneCoins = null;

  /* ================= INPUT ================= */
  const keys = new Set();

  window.addEventListener("keydown", (e) => {
    const k = e.key;

    if (k.toLowerCase() === "m") {
      toggleMute();
      return;
    }

    // prevent page scroll on arrows/space
    if (["ArrowLeft", "ArrowRight", "ArrowUp", " ", "Enter", "Escape"].includes(k)) {
      e.preventDefault();
    }

    if ((k === "Enter" || k === " ") && !started) {
      started = true;
      titleScreen.classList.remove("show");
      startBGM();
      return;
    }

    if (k === "ArrowUp" && player.onGround && started && !paused && !finished) {
      player.vy = -player.jumpPower;
      player.onGround = false;
      playSFX(audio.pickup);
    }

    keys.add(k);

    if ((k === "Escape" || k === "Enter" || k === " ") && modal.classList.contains("show")) {
      closeModal();
    }
  }, { passive: false });

  window.addEventListener("keyup", (e) => keys.delete(e.key));
  closeBtn.addEventListener("click", () => closeModal());

  /* ================= BACKGROUND DRAW ================= */
  function drawFallbackBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0a0b10");
    g.addColorStop(0.6, "#0d1020");
    g.addColorStop(1, "#07080c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawLayer(img, speed, y = 0, heightOverride = null) {
    if (!img || !img.loaded || img.width <= 0) return;

    const iw = img.width;
    const ih = img.height;

    // offset based on parallax speed
    let offsetX = -((cameraX * speed) % iw);

    // draw extra tiles to avoid edges
    for (let x = offsetX - iw; x < W + iw; x += iw) {
      if (heightOverride !== null) {
        ctx.drawImage(img, x, y, iw, heightOverride);
      } else {
        ctx.drawImage(img, x, y, iw, ih);
      }
    }
  }

  function drawBackground() {
    // If no background loaded at all, still show something.
    const anyLoaded = bg.sky.loaded || bg.far.loaded || bg.near.loaded;
    if (!anyLoaded) {
      drawFallbackBackground();
      return;
    }

    // If some layers missing, still draw others
    drawLayer(bg.sky, BG_SPEED.sky, 0);
    drawLayer(bg.far, BG_SPEED.far, 0);
    drawLayer(bg.near, BG_SPEED.near, 0);
  }

  function drawGround() {
    // If ground missing, draw simple ground strip
    if (!bg.ground.loaded) {
      ctx.fillStyle = "#0f1a16";
      ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
      ctx.fillStyle = "rgba(255,255,255,.10)";
      ctx.fillRect(0, GROUND_Y, W, 2);
      return;
    }

    // Place ground at GROUND_Y; do NOT stretch unless you want to
    drawLayer(bg.ground, BG_SPEED.ground, GROUND_Y);
  }

  /* ================= GAME UPDATE ================= */
  function update() {
    // horizontal
    player.vx = 0;
    if (keys.has("ArrowLeft")) player.vx = -player.speed;
    if (keys.has("ArrowRight")) player.vx = player.speed;

    player.x = clamp(player.x + player.vx, 0, END_X);

    // vertical
    player.vy += player.gravity;
    player.y += player.vy;

    if (player.y >= GROUND_Y - player.h) {
      player.y = GROUND_Y - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // camera follow
    cameraX = clamp(player.x - W * 0.35, 0, WORLD_LENGTH - W);

    // triggers
    for (const ev of events) {
      if (triggered.has(ev.id)) continue;
      if (player.x > ev.x - 20 && player.x < ev.x + 20) {
        triggered.add(ev.id);
        coins = Math.max(0, coins - (ev.coinCost || 0));
        playSFX(audio.pickup);
        openModal(ev);
        break;
      }
    }

    // final zone => coins -> 0
    if (player.x > FINAL_ZONE_START) {
      if (finalZoneCoins === null) finalZoneCoins = coins;
      const denom = (END_X - FINAL_ZONE_START);
      const p = denom > 0 ? clamp((player.x - FINAL_ZONE_START) / denom, 0, 1) : 1;
      coins = Math.round(finalZoneCoins * (1 - p));
    }

    // end
    if (player.x >= END_X - 1 && !finished) {
      finished = true;
      coins = 0;
      playSFX(audio.end);
      ending.classList.add("show");
    }
  }

  /* ================= MODAL ================= */
  function openModal(ev) {
    paused = true;
    modal.classList.add("show");
    playSFX(audio.open);

    modalTitle.textContent = `${ev.id}｜${ev.name}`;
    modalSubtitle.textContent = `Coins -${fmt(ev.coinCost || 0)}`;

    modalMedia.innerHTML = "";

    const m = ev.media;
    if (!m) return;

    if (m.type === "video") {
      const v = document.createElement("video");
      v.src = m.src;
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      modalMedia.appendChild(v);
      return;
    }

    if (m.type === "gallery") {
      const img = document.createElement("img");
      img.src = m.srcs?.[0] || "";
      modalMedia.appendChild(img);
      return;
    }

    if (m.type === "ig") {
      const img = document.createElement("img");
      img.src = m.img || "";
      modalMedia.appendChild(img);
      return;
    }
  }

  function closeModal() {
    modal.classList.remove("show");
    paused = false;
    playSFX(audio.close);
  }

  /* ================= RENDER ================= */
  function drawItems() {
    const t = (performance.now() - startTime) / 1000;
    const baseY = GROUND_Y - 30;

    for (const ev of events) {
      if (triggered.has(ev.id)) continue;

      const sx = ev.x - cameraX;
      if (sx < -120 || sx > W + 120) continue;

      const fy = Math.sin(t * FLOAT_SPEED + ev.floatPhase) * FLOAT_AMPLITUDE;
      const img = spriteImages[ev.sprite];

      // shadow
      ctx.fillStyle = "rgba(0,0,0,.25)";
      ctx.fillRect(Math.round(sx - ITEM_SIZE * 0.30), Math.round(baseY + ITEM_SIZE * 0.60), Math.round(ITEM_SIZE * 0.60), 3);

      if (img && img.loaded) {
        ctx.drawImage(img, Math.round(sx - ITEM_SIZE / 2), Math.round(baseY + fy - ITEM_SIZE / 2), ITEM_SIZE, ITEM_SIZE);
      } else {
        // fallback
        ctx.fillStyle = "rgba(142,240,201,.85)";
        ctx.fillRect(Math.round(sx - 10), Math.round(baseY + fy - 10), 20, 20);
      }
    }
  }

  function drawPlayer() {
    const sx = Math.round(player.x - cameraX);
    const sy = Math.round(player.y);

    if (playerImage.loaded) {
      ctx.drawImage(playerImage, sx, sy, player.w, player.h);
    } else {
      ctx.fillStyle = "rgba(142,240,201,.85)";
      ctx.fillRect(sx, sy, player.w, player.h);
    }
  }

  function drawHUD() {
    if (!started) return;

    ctx.save();
    ctx.globalAlpha = 0.95;

    ctx.fillStyle = "rgba(0,0,0,.30)";
    ctx.fillRect(14, 14, 360, 44);

    ctx.fillStyle = "rgba(233,236,241,.92)";
    ctx.font = "600 14px ui-sans-serif, system-ui";
    ctx.fillText(`Coins: ${fmt(coins)}`, 24, 42);

    ctx.restore();
  }

  /* ================= LOOP ================= */
  function loop() {
    if (started && !paused && !finished) update();

    ctx.clearRect(0, 0, W, H);

    drawBackground();
    drawGround();
    drawItems();
    drawPlayer();
    drawHUD();

    requestAnimationFrame(loop);
  }

  loop();
})();
