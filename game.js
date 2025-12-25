(() => {
  "use strict";

  /** =========================
   *  Paths (依你資料夾結構)
   *  ========================= */
  const PATHS = {
    bg: "media/backgrounds/bg_main.png",
    player: "media/player/player_main.png",
    sprites: {
      snake: "media/sprites/item_snake.png",
      eyes: "media/sprites/item_eyes.png",
      cake: "media/sprites/item_cake.png",
      hollow_brick: "media/sprites/item_hollow_brick.png",
      ball: "media/sprites/item_ball.png",
      logo: "media/sprites/item_logo.png",
      cat: "media/sprites/item_cat.png",
      beer_can: "media/sprites/item_beer_can.png",
      brush: "media/sprites/item_brush.png",
      hand: "media/sprites/item_hand.png",
      suitcase: "media/sprites/item_suitcase.png",
      buddha: "media/sprites/item_buddha.png",
      question_candle: "media/sprites/item_question_candle.png",
      rat_ferret: "media/sprites/item_rat_ferret.png",
    },
    audio: {
      bgm: "media/audio/bgm.mp3",
      open: "media/audio/sfx_open.wav",
      close: "media/audio/sfx_close.wav",
      pickup: "media/audio/fx_pickup.wav",
      end: "media/audio/sfx_end.wav",
    },
    achievements: {
      a1: "media/achievements/ach_1.jpg",
      a2: "media/achievements/ach_2.jpg",
      a3: { type: "video", src: "media/achievements/ach_3.mp4" },
      a4: "media/achievements/ach_4.jpg",
    }
  };

  /** =========================
   *  Game constants
   *  ========================= */
  const TOTAL_COINS = 524748;
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const W = canvas.width;
  const H = canvas.height;

  // 固定地板線
  const groundY = Math.floor(H * 0.78);

  /** =========================
   *  DOM overlays
   *  ========================= */
  const title = document.getElementById("title");

  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modalTitle");
  const modalMeta = document.getElementById("modalMeta");
  const mediaStage = document.getElementById("mediaStage");
  const mediaIndex = document.getElementById("mediaIndex");
  const modalCaption = document.getElementById("modalCaption");

  const ach = document.getElementById("ach");
  const ach1 = document.getElementById("ach1");
  const ach2 = document.getElementById("ach2");
  const ach3 = document.getElementById("ach3");
  const ach4 = document.getElementById("ach4");

  const ending = document.getElementById("ending");
  const endText = document.getElementById("endText");
  const endTap = document.getElementById("endTap");

  /** =========================
   *  Assets
   *  ========================= */
  const bgImg = new Image();
  bgImg.src = PATHS.bg;
  let bgReady = false;
  bgImg.onload = () => (bgReady = true);

  const playerImg = new Image();
  playerImg.src = PATHS.player;
  let playerReady = false;
  playerImg.onload = () => (playerReady = true);

  const iconImgs = {};
  const iconReady = {};
  for (const [k, src] of Object.entries(PATHS.sprites)) {
    const img = new Image();
    img.src = src;
    iconImgs[k] = img;
    iconReady[k] = false;
    img.onload = () => (iconReady[k] = true);
  }

  /** =========================
   *  Audio (BGM + SFX)
   *  ========================= */
  const audio = {
    bgm: new Audio(PATHS.audio.bgm),
    open: new Audio(PATHS.audio.open),
    close: new Audio(PATHS.audio.close),
    pickup: new Audio(PATHS.audio.pickup),
    end: new Audio(PATHS.audio.end),
  };
  audio.bgm.loop = true;
  audio.bgm.volume = 0.6;
  audio.open.volume = 0.8;
  audio.close.volume = 0.8;
  audio.pickup.volume = 0.9;
  audio.end.volume = 0.9;

  function playSfx(aud) {
    try {
      aud.currentTime = 0;
      aud.play();
    } catch {}
  }

  // 遊戲一開始就嘗試播放 BGM（若被瀏覽器擋，自動在第一次按鍵補播）
  let bgmPlaying = false;
  function tryPlayBgm() {
    if (bgmPlaying) return;
    audio.bgm.play().then(() => {
      bgmPlaying = true;
    }).catch(() => {
      bgmPlaying = false;
    });
  }
  tryPlayBgm();

  /** =========================
   *  Events (A–N，已刪 K)
   *  - 事件距離：更近
   *  ========================= */
  const events = [
    {
      id: "A", name: "蛇年賀卡", sprite: "snake", x: 1200,
      coinCost: 18000, caption: "蛇年賀卡",
      mediaItems: [
        { type: "img", src: "media/events/A_1.jpg" },
        { type: "img", src: "media/events/A_2.jpg" },
        { type: "img", src: "media/events/A_3.jpg" },
      ]
    },
    {
      id: "B", name: "你好礙眼", sprite: "eyes", x: 1720,
      coinCost: 21000, caption: "你好礙眼",
      mediaItems: [
        { type: "img", src: "media/events/B_1.jpg" },
        { type: "img", src: "media/events/B_2.jpg" },
        { type: "img", src: "media/events/B_3.jpg" },
      ]
    },
    {
      id: "C", name: "生日快樂", sprite: "cake", x: 2240,
      coinCost: 24000, caption: "生日快樂",
      mediaItems: [
        { type: "img", src: "media/events/C_1.jpg" },
        { type: "img", src: "media/events/C_2.jpg" },
        { type: "img", src: "media/events/C_3.jpg" },
      ]
    },
    {
      id: "D", name: "空心IN PLACE", sprite: "hollow_brick", x: 2760,
      coinCost: 43000, caption: "空心IN PLACE",
      mediaItems: [
        { type: "img", src: "media/events/D_1.jpg" },
        { type: "img", src: "media/events/D_2.jpg" },
        { type: "img", src: "media/events/D_3.jpg" },
        { type: "img", src: "media/events/D_4.jpg" },
        { type: "img", src: "media/events/D_5.jpg" },
        { type: "img", src: "media/events/D_6.jpg" },
        { type: "img", src: "media/events/D_7.jpg" },
        { type: "img", src: "media/events/D_8.jpg" },
        { type: "img", src: "media/events/D_9.jpg" },
        { type: "img", src: "media/events/D_10.jpg" },
        { type: "img", src: "media/events/D_11.jpg" },
        { type: "img", src: "media/events/D_12.jpg" },
        { type: "img", src: "media/events/D_13.jpg" },
        { type: "img", src: "media/events/D_14.jpg" },        
      ]
    },
    {
      id: "E", name: "校內展獎盃製作", sprite: "ball", x: 3280,
      coinCost: 38000, caption: "校內展獎盃製作",
      mediaItems: [
        { type: "img", src: "media/events/E_1.jpg" },
        { type: "img", src: "media/events/E_2.jpg" },
        { type: "img", src: "media/events/E_3.jpg" },
        { type: "img", src: "media/events/E_4.jpg" },
        { type: "img", src: "media/events/E_5.jpg" },
        { type: "img", src: "media/events/E_6.jpg" },
        { type: "img", src: "media/events/E_7.jpg" },
        { type: "img", src: "media/events/E_8.jpg" },
      ]
    },
    {
      id: "F", name: "偷偷參加新一代", sprite: "logo", x: 3800,
      coinCost: 28000, caption: "偷偷參加新一代",
      mediaItems: [
        { type: "img", src: "media/events/F_1.jpg" },
        { type: "img", src: "media/events/F_2.jpg" },
        { type: "img", src: "media/events/F_3.jpg" },
        { type: "img", src: "media/events/F_4.jpg" },
        { type: "img", src: "media/events/F_5.jpg" },
        { type: "img", src: "media/events/F_6.jpg" },
        { type: "img", src: "media/events/F_7.jpg" },
      ]
    },
    {
      id: "G", name: "九份旅遊", sprite: "cat", x: 4320,
      coinCost: 26000, caption: "九份旅遊",
      mediaItems: [
        { type: "img", src: "media/events/G_1.jpg" },
        { type: "img", src: "media/events/G_2.jpg" },
        { type: "img", src: "media/events/G_3.jpg" },
        { type: "img", src: "media/events/G_4.jpg" },
        { type: "img", src: "media/events/G_5.jpg" },
        { type: "img", src: "media/events/G_6.jpg" },
        { type: "img", src: "media/events/G_7.jpg" },
        { type: "img", src: "media/events/G_8.jpg" },
        { type: "img", src: "media/events/G_9.jpg" },
        { type: "img", src: "media/events/G_10.jpg" },
        { type: "img", src: "media/events/G_11.jpg" },
        { type: "img", src: "media/events/G_12.jpg" },
        { type: "img", src: "media/events/G_13.jpg" },
        { type: "img", src: "media/events/G_14.jpg" },
      ]
    },
    {
      id: "H", name: "軟", sprite: "beer_can", x: 4840,
      coinCost: 41000, caption: "軟",
      mediaItems: [
        { type: "img", src: "media/events/H_1.jpg" },
        { type: "img", src: "media/events/H_2.jpg" },
        { type: "img", src: "media/events/H_3.jpg" },
        { type: "img", src: "media/events/H_4.jpg" },
        { type: "img", src: "media/events/H_5.jpg" },
        { type: "img", src: "media/events/H_6.jpg" },
        { type: "img", src: "media/events/H_7.jpg" },
        { type: "img", src: "media/events/H_8.jpg" },
      ]
    },
    {
      id: "I", name: "書法課", sprite: "brush", x: 5360,
      coinCost: 24000, caption: "書法課",
      mediaItems: [
        { type: "img", src: "media/events/I_1.jpg" },
        { type: "img", src: "media/events/I_2.jpg" },
        { type: "img", src: "media/events/I_3.jpg" },
        { type: "img", src: "media/events/I_4.jpg" },
        { type: "img", src: "media/events/I_5.jpg" },
        { type: "img", src: "media/events/I_6.jpg" },
      ]
    },
    {
      id: "J", name: "手心貼手心", sprite: "hand", x: 5880,
      coinCost: 32000, caption: "手心貼手心",
      mediaItems: [
        { type: "img", src: "media/events/J_1.jpg" },
        { type: "img", src: "media/events/J_2.jpg" },
        { type: "img", src: "media/events/J_3.jpg" },
        { type: "img", src: "media/events/J_4.jpg" },
        { type: "img", src: "media/events/J_5.jpg" },
        { type: "img", src: "media/events/J_6.jpg" },
        { type: "img", src: "media/events/J_7.jpg" },
      ]
    },
    {
      id: "L", name: "日本東京行", sprite: "suitcase", x: 6400,
      coinCost: 47000, caption: "日本東京行",
      mediaItems: [
        { type: "img", src: "media/events/L_1.jpg" },
        { type: "img", src: "media/events/L_2.jpg" },
        { type: "img", src: "media/events/L_3.jpg" },
        { type: "img", src: "media/events/L_4.jpg" },
        { type: "img", src: "media/events/L_5.jpg" },
        { type: "img", src: "media/events/L_6.jpg" },
        { type: "img", src: "media/events/L_7.jpg" },
        { type: "img", src: "media/events/L_8.jpg" },
        { type: "img", src: "media/events/L_9.jpg" },
        { type: "img", src: "media/events/L_10.jpg" },
        { type: "img", src: "media/events/L_11.jpg" },
        { type: "img", src: "media/events/L_12.jpg" },
      ]
    },
    {
      id: "M", name: "彰化設計展", sprite: "buddha", x: 6920,
      coinCost: 25000, caption: "彰化設計展",
      mediaItems: [
        { type: "img", src: "media/events/M_1.jpg" },
        { type: "img", src: "media/events/M_2.jpg" },
        { type: "img", src: "media/events/M_3.jpg" },
        { type: "img", src: "media/events/M_4.jpg" },
      ]
    },
    {
      id: "N", name: "燭籤", sprite: "question_candle", x: 7440,
      coinCost: 40000, caption: "燭籤",
      mediaItems: [
        { type: "img", src: "media/events/N_1.jpg" },
        { type: "img", src: "media/events/N_2.jpg" },
        { type: "img", src: "media/events/N_3.jpg" },
        { type: "img", src: "media/events/N_4.jpg" },
        { type: "img", src: "media/events/N_5.jpg" },
        { type: "img", src: "media/events/N_6.jpg" },
      ]
    },
    {
      id: "O", name: "草率季", sprite: "rat_ferret", x: 7960,
      coinCost: 217748, caption: "草率季",
      mediaItems: [
        { type: "img", src: "media/events/O_1.jpg" },
        { type: "img", src: "media/events/O_2.jpg" },
        { type: "img", src: "media/events/O_3.jpg" },
        { type: "img", src: "media/events/O_4.jpg" },
        { type: "img", src: "media/events/O_5.jpg" },
        { type: "img", src: "media/events/O_6.jpg" },
        { type: "img", src: "media/events/O_7.jpg" },
        { type: "img", src: "media/events/O_8.jpg" },
        { type: "img", src: "media/events/O_9.jpg" },
        { type: "img", src: "media/events/O_10.jpg" },
        { type: "img", src: "media/events/O_11.jpg" },
        { type: "img", src: "media/events/O_12.jpg" },
        { type: "img", src: "media/events/O_13.jpg" },
        { type: "img", src: "media/events/O_14.jpg" },
        { type: "img", src: "media/events/O_15.jpg" },
        { type: "img", src: "media/events/O_16.jpg" },
        { type: "img", src: "media/events/O_17.jpg" },
        { type: "img", src: "media/events/O_18.jpg" },
        { type: "img", src: "media/events/O_19.jpg" },
        { type: "img", src: "media/events/O_20.jpg" },
      ]
    },
  ];

  const sumCoins = events.reduce((a, e) => a + (e.coinCost || 0), 0);
  if (sumCoins !== TOTAL_COINS) {
    console.warn("Coin sum mismatch:", sumCoins, "!= TOTAL_COINS", TOTAL_COINS);
  }

  /** =========================
   *  World length / finish line
   *  ========================= */
  const lastEventX = events[events.length - 1].x; // O
  const finishLineX = lastEventX + 520;           // 終點線在 O 後面
  const WORLD_LENGTH = finishLineX + 1200;

  const FINAL_ZONE_START = finishLineX - 900;
  const FINAL_ZONE_END = finishLineX;

  /** =========================
   *  Player state + jump physics
   *  ========================= */
  const player = {
    x: 180,
    y: groundY - 48,
    w: 32,
    h: 48,
    vx: 0,
    vy: 0,
    facing: 1,
    speed: 3.2,
    onGround: true,
  };

  const GRAVITY = 0.55;
  const JUMP_VELOCITY = -10.5;

  /** =========================
   *  Global state
   *  ========================= */
  let cameraX = 0;
  let started = false;
  let paused = false;

  let coins = TOTAL_COINS;
  let lv = 1;
  let xp = 0;

  const triggered = new Set();

  const floatTexts = [];
  const now = () => performance.now();
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const fmt = (n) => n.toLocaleString("en-US");

  function spawnLevelUp() {
    floatTexts.push({
      text: "LEVEL UP!",
      x: player.x,
      y: player.y - 10,
      t0: now(),
      dur: 900
    });
  }

  let crossedFinish = false;
  let showAchievements = false;
  let endingPhase = 0;
  let endSfxPlayed = false;

  let inFinalZone = false;
  let finalZoneEnterCoins = null;
  function updateFinalZoneCoins() {
    if (player.x < FINAL_ZONE_START) return;

    if (!inFinalZone) {
      inFinalZone = true;
      finalZoneEnterCoins = coins;
    }

    const p = clamp((player.x - FINAL_ZONE_START) / (FINAL_ZONE_END - FINAL_ZONE_START), 0, 1);
    const target = Math.round(finalZoneEnterCoins * (1 - p));
    coins = Math.min(coins, clamp(target, 0, coins));
  }

  /** =========================
   *  Modal state
   *  ========================= */
  let modalEvent = null;
  let modalIdx = 0;

  function isModalOpen() {
    return modal.classList.contains("show");
  }

  function openModal(ev) {
    paused = true;
    modal.classList.add("show");
    modalEvent = ev;
    modalIdx = 0;

    modalTitle.textContent = `${ev.id}｜${ev.name}`;
    modalMeta.textContent = `LV +1　Coins -${fmt(ev.coinCost || 0)}　（← → 瀏覽 / Enter 關閉）`;
    modalCaption.textContent = ev.caption || "";

    playSfx(audio.open);
    renderModalMedia();
  }

  function renderModalMedia() {
    if (!modalEvent) return;
    const items = modalEvent.mediaItems;
    const total = items.length;

    mediaStage.innerHTML = "";
    mediaIndex.textContent = `${modalIdx + 1} / ${total}`;

    const item = items[modalIdx];
    if (item.type === "video") {
      const v = document.createElement("video");
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      v.src = item.src || "";
      mediaStage.appendChild(v);
    } else {
      const img = document.createElement("img");
      img.alt = "event media";
      img.src = item.src || "";
      mediaStage.appendChild(img);
    }
  }

  function closeModal() {
    modal.classList.remove("show");
    paused = false;
    modalEvent = null;
    modalIdx = 0;
    playSfx(audio.close);
  }

  /** =========================
   *  Achievements & Ending
   *  ========================= */
  function openAchievements() {
    showAchievements = true;
    ach.classList.add("show");

    ach1.src = PATHS.achievements.a1;
    ach2.src = PATHS.achievements.a2;
    ach3.src = PATHS.achievements.a3;
    ach4.src = PATHS.achievements.a4;
  }

  function advanceFromAchievements() {
    if (!showAchievements) return;
    showAchievements = false;
    ach.classList.remove("show");
    setEndingPhase(1);
  }

  function setEndingPhase(phase) {
    endingPhase = phase;
    ending.classList.add("show");

    if (phase === 1) {
      endText.textContent = "所有夢想都有終點\n2025 byebye！";
      endTap.style.display = "block";
    } else if (phase === 2) {
      endText.textContent = "而每次的終點 也是新的起點\nHello ! 2026";
      endTap.style.display = "none";
    }
  }

  /** =========================
   *  Input
   *  ========================= */
  const keys = new Set();
  let jumpPressed = false;

  window.addEventListener("keydown", (e) => {
    const k = e.key;

    if (["ArrowLeft","ArrowRight","ArrowUp","Enter"," "].includes(k)) {
      e.preventDefault();
      if (k === "Enter" && e.repeat) return;
    }

    tryPlayBgm();

    if (!started && (k === "Enter" || k === " ")) {
      started = true;
      title.classList.remove("show");
      return;
    }

    if (showAchievements) {
      if (k === "Enter" || k === " ") advanceFromAchievements();
      return;
    }
    if (endingPhase === 1) {
      if (k === "Enter" || k === " ") setEndingPhase(2);
      return;
    }
    if (endingPhase === 2) return;

    if (isModalOpen()) {
      if (k === "ArrowLeft") {
        modalIdx = (modalIdx - 1 + modalEvent.mediaItems.length) % modalEvent.mediaItems.length;
        renderModalMedia();
      }
      if (k === "ArrowRight") {
        modalIdx = (modalIdx + 1) % modalEvent.mediaItems.length;
        renderModalMedia();
      }
      if (k === "Enter") closeModal();
      return;
    }

    if (k === "ArrowUp") {
      if (!jumpPressed && player.onGround && !paused) {
        player.vy = JUMP_VELOCITY;
        player.onGround = false;
      }
      jumpPressed = true;
    }

    keys.add(k);
  }, { passive: false });

  window.addEventListener("keyup", (e) => {
    keys.delete(e.key);
    if (e.key === "ArrowUp") jumpPressed = false;
  });

  ach.addEventListener("click", () => { tryPlayBgm(); advanceFromAchievements(); });
  ending.addEventListener("click", () => { tryPlayBgm(); if (endingPhase === 1) setEndingPhase(2); });

  /** =========================
   *  Collision helpers
   *  ========================= */
  function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function checkEventTriggers() {
    for (const ev of events) {
      if (triggered.has(ev.id)) continue;

      const hit = aabb(
        player.x, player.y, player.w, player.h,
        ev.x - 24, groundY - 48, 48, 48
      );

      if (hit) {
        triggered.add(ev.id);

        playSfx(audio.pickup);

        lv += 1;
        xp += 1;
        spawnLevelUp();

        coins = Math.max(0, coins - (ev.coinCost || 0));
        openModal(ev);
        break;
      }
    }
  }

  function checkFinishLine() {
    if (crossedFinish) return;
    if (!triggered.has("O")) return;

    if (player.x + player.w >= finishLineX) {
      crossedFinish = true;
      coins = 0;

      paused = true;
      openAchievements();

      if (!endSfxPlayed) {
        endSfxPlayed = true;
        playSfx(audio.end);
      }
    }
  }

  function worldToScreenX(wx) { return Math.round(wx - cameraX); }

  /** =========================
   *  Update
   *  ========================= */
  function update() {
    let vx = 0;
    if (keys.has("ArrowLeft")) { vx = -player.speed; player.facing = -1; }
    if (keys.has("ArrowRight")) { vx = +player.speed; player.facing = +1; }

    player.x = clamp(player.x + vx, 0, WORLD_LENGTH - 200);

    if (!player.onGround) {
      player.vy += GRAVITY;
      player.y += player.vy;

      const groundTop = groundY - player.h;
      if (player.y >= groundTop) {
        player.y = groundTop;
        player.vy = 0;
        player.onGround = true;
      }
    } else {
      player.y = groundY - player.h;
    }

    cameraX = clamp(player.x - W * 0.35, 0, WORLD_LENGTH - W);

    updateFinalZoneCoins();

    checkEventTriggers();
    checkFinishLine();
  }

  /** =========================
   *  Render
   *  ========================= */
  function drawBackground() {
    if (!bgReady) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#0a1030");
      g.addColorStop(1, "#05060a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      return;
    }

    const PARALLAX = 0.55;

    const bw = bgImg.width;
    const bh = bgImg.height;

    const scale = H / bh;
    const drawW = bw * scale;
    const drawH = H;

    let offsetX = -((cameraX * PARALLAX) % drawW);
    if (offsetX > 0) offsetX -= drawW;

    for (let x = offsetX; x < W; x += drawW) {
      ctx.drawImage(bgImg, x, 0, drawW, drawH);
    }
  }

  function drawGroundLine() {
    ctx.fillStyle = "rgba(0,0,0,.22)";
    ctx.fillRect(0, groundY, W, H - groundY);
    ctx.fillStyle = "rgba(255,255,255,.18)";
    ctx.fillRect(0, groundY, W, 2);
  }

  function drawFinishLine() {
    const sx = worldToScreenX(finishLineX);
    if (sx < -120 || sx > W + 120) return;

    const top = groundY - 120;
    ctx.fillStyle = "rgba(255,255,255,.20)";
    ctx.fillRect(sx - 2, top, 4, 120);

    const fw = 56, fh = 28;
    const fx = sx + 6, fy = top + 10;
    for (let y = 0; y < fh; y += 7) {
      for (let x = 0; x < fw; x += 7) {
        const isWhite = ((x / 7 + y / 7) % 2 === 0);
        ctx.fillStyle = isWhite ? "rgba(233,236,241,.78)" : "rgba(0,0,0,.45)";
        ctx.fillRect(fx + x, fy + y, 7, 7);
      }
    }

    ctx.fillStyle = "rgba(233,236,241,.78)";
    ctx.fillRect(sx - 30, groundY - 6, 60, 6);
    ctx.fillStyle = "rgba(0,0,0,.35)";
    for (let i = 0; i < 6; i++) ctx.fillRect(sx - 30 + i * 10, groundY - 6, 5, 6);
  }

  function drawIcon(ev) {
    if (triggered.has(ev.id)) return;
    const sx = worldToScreenX(ev.x);
    if (sx < -80 || sx > W + 80) return;

    const img = iconImgs[ev.sprite];
    if (iconReady[ev.sprite] && img) {
      ctx.drawImage(img, sx - 24, groundY - 48, 48, 48);
    } else {
      ctx.fillStyle = "rgba(142,240,201,.55)";
      ctx.fillRect(sx - 24, groundY - 48, 48, 48);
    }
  }

  function drawPlayer() {
    const sx = worldToScreenX(player.x);
    const FOOT_OFFSET = 2;

    const px = Math.round(sx);
    const py = Math.round(player.y + FOOT_OFFSET);

    if (!playerReady) {
      ctx.fillStyle = "rgba(142,240,201,.85)";
      ctx.fillRect(px, py, 32, 48);
      return;
    }

    ctx.save();
    if (player.facing === -1) {
      ctx.translate(px + 32, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(playerImg, 0, py, 32, 48);
    } else {
      ctx.drawImage(playerImg, px, py, 32, 48);
    }
    ctx.restore();
  }

  function drawHUD() {
    if (!started) return;

    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.fillRect(14, 14, 360, 78);

    ctx.fillStyle = "rgba(255,255,255,.14)";
    ctx.fillRect(14, 14, 360, 2);

    ctx.fillStyle = "#e9ecf1";
    ctx.font = "900 16px ui-sans-serif, system-ui";
    ctx.fillText(`LV ${lv}`, 24, 40);

    ctx.font = "700 14px ui-sans-serif, system-ui";
    ctx.fillStyle = "rgba(233,236,241,.92)";
    ctx.fillText(`XP: ${fmt(xp)}`, 24, 62);

    ctx.fillStyle = "rgba(142,240,201,.95)";
    ctx.fillText(`Coins: ${fmt(coins)}`, 140, 40);

    const prog = clamp(player.x / finishLineX, 0, 1);
    ctx.fillStyle = "rgba(255,255,255,.10)";
    ctx.fillRect(140, 52, 220, 8);
    ctx.fillStyle = "rgba(142,240,201,.55)";
    ctx.fillRect(140, 52, Math.floor(220 * prog), 8);

    ctx.restore();
  }

  function drawLevelUpTexts() {
    const t = now();
    for (let i = floatTexts.length - 1; i >= 0; i--) {
      const ft = floatTexts[i];
      const age = t - ft.t0;
      const p = clamp(age / ft.dur, 0, 1);
      if (p >= 1) { floatTexts.splice(i, 1); continue; }

      const sx = worldToScreenX(ft.x) + 12;
      const sy = ft.y - p * 22;

      const alpha = 1 - p;
      drawPixelOutlinedText(ft.text, Math.round(sx), Math.round(sy), alpha);
    }
  }

  function drawPixelOutlinedText(text, x, y, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = "1000 18px ui-sans-serif, system-ui";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    ctx.fillStyle = "rgba(0,0,0,.85)";
    const o = 2;
    const offsets = [[-o,0],[o,0],[0,-o],[0,o],[-o,-o],[o,-o],[-o,o],[o,o]];
    for (const [dx, dy] of offsets) ctx.fillText(text, x + dx, y + dy);

    ctx.fillStyle = "rgba(142,240,201,.95)";
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function drawFinalTone() {
    if (player.x < FINAL_ZONE_START) return;
    const p = clamp((player.x - FINAL_ZONE_START) / (FINAL_ZONE_END - FINAL_ZONE_START), 0, 1);
    ctx.save();
    ctx.globalAlpha = 0.10 + p * 0.22;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  /** =========================
   *  Main loop
   *  ========================= */
  function loop() {
    if (started && !paused && endingPhase === 0 && !showAchievements && !isModalOpen()) {
      update();
    }

    ctx.clearRect(0, 0, W, H);
    drawBackground();
    drawFinalTone();
    drawGroundLine();

    for (const ev of events) drawIcon(ev);

    drawFinishLine();

    drawPlayer();
    drawLevelUpTexts();
    drawHUD();

    requestAnimationFrame(loop);
  }

  loop();
})();
