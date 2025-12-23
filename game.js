/* 2025 Recap Side-Scroller
 * Controls:
 * ← → 移動
 * ↑ 跳躍
 * Enter / Space：開始、關閉視窗
 * ESC：關閉視窗
 * M：靜音/取消靜音
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

  // 漂浮參數（可調）
  const FLOAT_AMPLITUDE = 4;     // px
  const FLOAT_SPEED = 1.6;       // 越大越快
  const FLOAT_PHASE_STEP = 0.9;  // 每個道具相位差

  // 道具尺寸（你做 48×48 就維持這個）
  const ITEM_SIZE = 48;

  const titleScreen = document.getElementById("titleScreen");
  const modal = document.getElementById("modal");
  const ending = document.getElementById("ending");

  const closeBtn = document.getElementById("closeBtn");
  const modalTitle = document.getElementById("modalTitle");
  const modalSubtitle = document.getElementById("modalSubtitle");
  const modalMedia = document.getElementById("modalMedia");
  const modalCaption = document.getElementById("modalCaption");

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const fmt = (n) => n.toLocaleString("en-US");

  const startTime = performance.now();

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
  // 角色（所有動作都用同一張）
  const playerImage = new Image();
  playerImage.src = "media/player/player_main.png";

  // 道具（PNG）
  function loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
  }

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
    {
      id: "A",
      name: "蛇年賀卡",
      sprite: "snake",
      x: 1100,
      media: { type: "video", src: "media/A_snake.mp4" },
      caption: "",
      xp: 15,
      coinCost: 18000,
    },
    {
      id: "B",
      name: "你好礙眼",
      sprite: "eyes",
      x: 2000,
      media: { type: "ig", img: "media/B_ig.jpg", url: "https://instagram.com" },
      caption: "",
      xp: 15,
      coinCost: 21000,
    },
    {
      id: "C",
      name: "生日快樂",
      sprite: "cake",
      x: 2900,
      media: { type: "gallery", srcs: ["media/C_1.jpg", "media/C_2.jpg"] },
      caption: "",
      xp: 10,
      coinCost: 24000,
    },
    {
      id: "D",
      name: "空心磚小誌",
      sprite: "brick",
      x: 3800,
      media: { type: "gallery", srcs: ["media/D_1.jpg", "media/D_2.jpg"] },
      caption: "",
      xp: 20,
      coinCost: 43000,
    },
    {
      id: "E",
      name: "新一代製作",
      sprite: "ball",
      x: 4900,
      media: { type: "gallery", srcs: ["media/E_1.jpg", "media/E_2.jpg"] },
      caption: "",
      xp: 20,
      coinCost: 38000,
    },
    {
      id: "F",
      name: "周邊影片",
      sprite: "logo",
      x: 6000,
      media: { type: "video", src: "media/F_video.mp4" },
      caption: "",
      xp: 15,
      coinCost: 28000,
    },
    {
      id: "G",
      name: "九份旅遊",
      sprite: "cat",
      x: 7100,
      media: { type: "gallery", srcs: ["media/G_1.jpg", "media/G_2.jpg"] },
      caption: "",
      xp: 10,
      coinCost: 26000,
    },
    {
      id: "H",
      name: "軟啤酒絲巾",
      sprite: "beer",
      x: 8200,
      media: { type: "gallery", srcs: ["media/H_1.jpg", "media/H_2.jpg"] },
      caption: "",
      xp: 20,
      coinCost: 41000,
    },
    {
      id: "I",
      name: "書法課",
      sprite: "brush",
      x: 9200,
      media: { type: "gallery", srcs: ["media/I_1.jpg"] },
      caption: "",
      xp: 10,
      coinCost: 24000,
    },
    {
      id: "J",
      name: "手掌便利貼",
      sprite: "hand",
      x: 10200,
      media: { type: "gallery", srcs: ["media/J_1.jpg"] },
      caption: "",
      xp: 15,
      coinCost: 32000,
    },
    {
      id: "L",
      name: "日本旅遊",
      sprite: "suitcase",
      x: 12400,
      media: { type: "gallery", srcs: ["media/L_1.jpg", "media/L_2.jpg"] },
      caption: "",
      xp: 15,
      coinCost: 47000,
    },
    {
      id: "M",
      name: "彰化設計展",
      sprite: "buddha",
      x: 13450,
      media: { type: "gallery", srcs: ["media/M_1.jpg"] },
      caption: "",
      xp: 10,
      coinCost: 25000,
    },
    {
      id: "N",
      name: "燭籤",
      sprite: "candle",
      x: 14500,
      media: { type: "gallery", srcs: ["media/N_1.jpg"] },
      caption: "",
      xp: 20,
      coinCost: 40000,
    },
    {
      id: "O",
      name: "草率季",
      sprite: "rat",
      x: 15400,
      media: { type: "gallery", srcs: ["media/O_1.jpg", "media/O_2.jpg"] },
      caption: "",
      xp: 40,
      coinCost: 97748,
    },
  ];

  const triggered = new Set();
  events.forEach((ev, i) => (ev.floatPhase = i * FLOAT_PHASE_STEP));

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
    facing: 1,
  };

  let cameraX = 0;
  let started = false;
  let paused = false;
  let finished = false;

  let xp = 0;
  let level = 1;
  let coins = TOTAL_COINS;

  let inFinalZone = false;
  let finalZoneEnterCoins = null;

  /* ================= INPUT ================= */
  const keys = new Set();

  window.addEventListener(
    "keydown",
    (e) => {
      const k = e.key;

      if (k.toLowerCase() === "m") {
        toggleMute();
        return;
      }

      if (["ArrowLeft", "ArrowRight", "ArrowUp", "Enter", " ", "Escape"].includes(k)) {
        e.preventDefault();
      }

      // Start
      if ((k === "Enter" || k === " ") && !started) {
        started = true;
        titleScreen.classList.remove("show");
        startBGM();
        return;
      }

      // Jump
      if (k === "ArrowUp" && player.onGround && started && !paused && !finished) {
        player.vy = -player.jumpPower;
        player.onGround = false;
        // 如果你不想跳躍也用 pickup 音效，就把這行註解掉
        playSFX(audio.pickup);
      }

      keys.add(k);

      // Close modal
      if (k === "Escape" && isModalOpen()) closeModal();
      if ((k === "Enter" || k === " ") && isModalOpen()) closeModal();
    },
    { passive: false }
  );

  window.addEventListener("keyup", (e) => keys.delete(e.key));
  closeBtn.addEventListener("click", () => closeModal());

  function isModalOpen() {
    return modal.classList.contains("show");
  }

  /* ================= GAME LOGIC ================= */
  function addXP(amount) {
    xp += amount;
    level = clamp(1 + Math.floor(xp / 60), 1, 99);
  }

  function spendCoins(amount) {
    if (!amount) return;
    coins = Math.max(0, coins - amount);
  }

  function updateFinalZoneCoins() {
    if (player.x < FINAL_ZONE_START) return;

    if (!inFinalZone) {
      inFinalZone = true;
      finalZoneEnterCoins = coins;
    }

    const denom = (END_X - FINAL_ZONE_START);
    const p = denom > 0 ? clamp((player.x - FINAL_ZONE_START) / denom, 0, 1) : 1;

    const target = Math.round(finalZoneEnterCoins * (1 - p));
    coins = clamp(target, 0, coins);
  }

  function openModal(ev) {
    paused = true;
    modal.classList.add("show");
    playSFX(audio.open);

    modalTitle.textContent = `${ev.id}｜${ev.name}`;
    const coinText = (ev.coinCost && ev.coinCost > 0) ? `　Coins -${fmt(ev.coinCost)}` : "";
    modalSubtitle.textContent = `XP +${ev.xp}${coinText}`;

    modalMedia.innerHTML = "";
    modalCaption.textContent = ev.caption || "";

    const m = ev.media || null;
    if (!m) {
      const d = document.createElement("div");
      d.textContent = "（無素材）";
      modalMedia.appendChild(d);
      return;
    }

    if (m.type === "video") {
      const v = document.createElement("video");
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      v.src = m.src || "";
      modalMedia.appendChild(v);
      return;
    }

    if (m.type === "gallery") {
      const wrap = document.createElement("div");
      wrap.className = "galleryWrap";
      wrap.dataset.idx = "0";

      const img = document.createElement("img");
      img.alt = "gallery";
      img.src = (m.srcs && m.srcs[0]) ? m.srcs[0] : "";
      wrap.appendChild(img);

      const nav = document.createElement("div");
      nav.className = "linkRow";

      const prev = document.createElement("a");
      prev.href = "javascript:void(0)";
      prev.textContent = "← Prev";
      prev.onclick = () => galleryStep(wrap, m, -1);

      const next = document.createElement("a");
      next.href = "javascript:void(0)";
      next.textContent = "Next →";
      next.onclick = () => galleryStep(wrap, m, +1);

      const idxLabel = document.createElement("span");
      idxLabel.style.color = "var(--muted)";
      idxLabel.textContent = `1 / ${m.srcs?.length ?? 0}`;
      idxLabel.id = "idxLabel";

      nav.appendChild(prev);
      nav.appendChild(next);
      nav.appendChild(idxLabel);

      modalMedia.appendChild(wrap);
      modalMedia.appendChild(nav);
      return;
    }

    if (m.type === "ig") {
      if (m.img) {
        const img = document.createElement("img");
        img.alt = "ig screenshot";
        img.src = m.img;
        modalMedia.appendChild(img);
      }
      const row = document.createElement("div");
      row.className = "linkRow";
      const a = document.createElement("a");
      a.href = m.url || "#";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = "Open IG";
      row.appendChild(a);
      modalMedia.appendChild(row);
      return;
    }
  }

  function galleryStep(wrap, media, dir) {
    const srcs = media.srcs || [];
    if (!srcs.length) return;
    let idx = parseInt(wrap.dataset.idx || "0", 10);
    idx = (idx + dir + srcs.length) % srcs.length;
    wrap.dataset.idx = String(idx);
    const img = wrap.querySelector("img");
    if (img) img.src = srcs[idx];
    const idxLabel = document.getElementById("idxLabel");
    if (idxLabel) idxLabel.textContent = `${idx + 1} / ${srcs.length}`;
  }

  function closeModal() {
    modal.classList.remove("show");
    paused = false;
    playSFX(audio.close);
  }

  function checkTriggers() {
    for (const ev of events) {
      if (triggered.has(ev.id)) continue;

      const ex = ev.x;
      const hitW = 28; // 觸發寬度（可調）
      if (player.x + player.w > ex - hitW && player.x < ex + hitW) {
        triggered.add(ev.id);
        addXP(ev.xp || 0);
        spendCoins(ev.coinCost || 0);
        playSFX(audio.pickup);
        openModal(ev);
        break;
      }
    }
  }

  function endGame() {
    coins = 0;
    finished = true;
    playSFX(audio.end);
    ending.classList.add("show");
  }

  /* ================= RENDER ================= */
  function worldToScreenX(wx) {
    return Math.round(wx - cameraX);
  }

  function drawBackground() {
    // 先用純色（你之後要加背景圖，我再幫你升級成平鋪）
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0a0b10");
    g.addColorStop(0.6, "#0d1020");
    g.addColorStop(1, "#07080c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawGround() {
    ctx.fillStyle = "#0f1a16";
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    ctx.fillStyle = "rgba(255,255,255,.12)";
    ctx.fillRect(0, GROUND_Y, W, 2);
  }

  function drawItem(ev, sx, baseY, tSec) {
    const floatY = Math.sin(tSec * FLOAT_SPEED + ev.floatPhase) * FLOAT_AMPLITUDE;
    const y = baseY + floatY;

    // shadow (固定在地面，強化漂浮感)
    ctx.fillStyle = "rgba(0,0,0,.25)";
    ctx.fillRect(sx - (ITEM_SIZE * 0.30), baseY + ITEM_SIZE * 0.60, ITEM_SIZE * 0.60, 3);

    const img = spriteImages[ev.sprite];
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(
        img,
        Math.round(sx - ITEM_SIZE / 2),
        Math.round(y - ITEM_SIZE / 2),
        ITEM_SIZE,
        ITEM_SIZE
      );
    } else {
      // fallback
      ctx.fillStyle = "rgba(142,240,201,.85)";
      ctx.fillRect(Math.round(sx - 10), Math.round(y - 10), 20, 20);
    }
  }

  function drawPlayer() {
    const sx = Math.round(player.x - cameraX);
    const sy = Math.round(player.y);

    if (playerImage.complete && playerImage.naturalWidth > 0) {
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
    ctx.fillRect(14, 14, 380, 72);

    ctx.fillStyle = "#e9ecf1";
    ctx.font = "700 16px ui-sans-serif, system-ui";
    ctx.fillText(`LV ${level}`, 24, 40);

    ctx.font = "600 14px ui-sans-serif, system-ui";
    ctx.fillStyle = "rgba(233,236,241,.92)";
    ctx.fillText(`XP: ${fmt(xp)}`, 24, 62);

    ctx.fillStyle = "rgba(142,240,201,.95)";
    ctx.fillText(`Coins: ${fmt(coins)}`, 140, 40);

    ctx.fillStyle = "rgba(233,236,241,.55)";
    ctx.fillText(audio.muted ? "MUTE" : "SOUND", 310, 40);

    const prog = clamp(player.x / END_X, 0, 1);
    ctx.fillStyle = "rgba(255,255,255,.10)";
    ctx.fillRect(140, 52, 240, 8);
    ctx.fillStyle = "rgba(142,240,201,.55)";
    ctx.fillRect(140, 52, Math.floor(240 * prog), 8);

    ctx.restore();
  }

  /* ================= LOOP ================= */
  const keysAllowedDuringModal = new Set(["Escape", "Enter", " "]);

  function update() {
    // horizontal
    player.vx = 0;
    if (keys.has("ArrowLeft")) { player.vx = -player.speed; player.facing = -1; }
    if (keys.has("ArrowRight")) { player.vx = +player.speed; player.facing = +1; }

    player.x = clamp(player.x + player.vx, 0, END_X);

    // vertical (jump + gravity)
    player.vy += player.gravity;
    player.y += player.vy;

    if (player.y >= GROUND_Y - player.h) {
      player.y = GROUND_Y - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // camera
    cameraX = clamp(player.x - W * 0.35, 0, WORLD_LENGTH - W);

    checkTriggers();
    updateFinalZoneCoins();

    if (player.x >= END_X - 1) {
      endGame();
    }
  }

  function render() {
    ctx.clearRect(0, 0, W, H);

    drawBackground();
    drawGround();

    const tSec = (performance.now() - startTime) / 1000;
    const baseY = GROUND_Y - 30;

    for (const ev of events) {
      const sx = worldToScreenX(ev.x);
      if (sx < -120 || sx > W + 120) continue;
      drawItem(ev, sx, baseY, tSec);
    }

    drawPlayer();
    drawHUD();
  }

  function loop() {
    if (started && !paused && !finished) update();
    render();
    requestAnimationFrame(loop);
  }

  loop();
})();
