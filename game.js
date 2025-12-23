/* 2025 Recap Side-Scroller
 * Controls:
 * ← → 移動
 * ↑ 跳躍
 * Enter / Space 開始、確認
 * ESC 關閉事件
 * M 靜音
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

  // 道具漂浮參數（可調）
  const FLOAT_AMPLITUDE = 4;   // 漂浮幅度：像素
  const FLOAT_SPEED = 1.6;     // 漂浮速度：越大越快
  const FLOAT_PHASE_STEP = 0.9; // 每個道具相位差，避免同步上下

  const titleScreen = document.getElementById("titleScreen");
  const modal = document.getElementById("modal");
  const ending = document.getElementById("ending");

  const modalTitle = document.getElementById("modalTitle");
  const modalSubtitle = document.getElementById("modalSubtitle");
  const modalMedia = document.getElementById("modalMedia");
  const modalCaption = document.getElementById("modalCaption");
  const closeBtn = document.getElementById("closeBtn");

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

  function toggleMute() {
    audio.muted = !audio.muted;
    Object.values(audio).forEach(a => {
      if (a instanceof Audio) a.muted = audio.muted;
    });
    if (!audio.muted) audio.bgm.play().catch(() => {});
    else audio.bgm.pause();
  }

  /* ================= PLAYER ================= */
  const player = {
    x: 200,
    y: GROUND_Y - 40,
    w: 26,
    h: 40,
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

  let finalZoneCoins = null;

  /* ================= EVENTS ================= */
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

  const triggered = new Set();

  // 給每個事件固定一個 phase，避免同步漂浮
  events.forEach((ev, i) => (ev.floatPhase = i * FLOAT_PHASE_STEP));

  /* ================= INPUT ================= */
  const keys = new Set();

  window.addEventListener("keydown", e => {
    const k = e.key;

    if (k.toLowerCase() === "m") toggleMute();

    if ((k === "Enter" || k === " ") && !started) {
      started = true;
      titleScreen.classList.remove("show");
      audio.bgm.play().catch(() => {});
      return;
    }

    // 跳躍
    if (k === "ArrowUp" && player.onGround && started && !paused) {
      player.vy = -player.jumpPower;
      player.onGround = false;
      playSFX(audio.pickup);
    }

    keys.add(k);

    if (k === "Escape" && modal.classList.contains("show")) closeModal();
    if ((k === "Enter" || k === " ") && modal.classList.contains("show")) closeModal();
  });

  window.addEventListener("keyup", e => keys.delete(e.key));

  closeBtn.onclick = closeModal;

  /* ================= GAME LOOP ================= */
  function update() {
    player.vx = 0;
    if (keys.has("ArrowLeft")) { player.vx = -player.speed; player.facing = -1; }
    if (keys.has("ArrowRight")) { player.vx = player.speed; player.facing = 1; }

    // 水平
    player.x = clamp(player.x + player.vx, 0, END_X);

    // 垂直（跳躍）
    player.vy += player.gravity;
    player.y += player.vy;

    if (player.y >= GROUND_Y - player.h) {
      player.y = GROUND_Y - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    cameraX = clamp(player.x - W * 0.35, 0, WORLD_LENGTH - W);

    // 事件觸發（不受漂浮影響，仍以 ev.x 為主）
    for (const ev of events) {
      if (triggered.has(ev.id)) continue;
      if (player.x + player.w > ev.x - 20 && player.x < ev.x + 20) {
        triggered.add(ev.id);
        xp += ev.xp;
        level = 1 + Math.floor(xp / 60);
        coins = Math.max(0, coins - ev.coinCost);
        openModal(ev);
        break;
      }
    }

    // 最後區段金幣歸零
    if (player.x > FINAL_ZONE_START) {
      if (finalZoneCoins === null) finalZoneCoins = coins;
      const p = (player.x - FINAL_ZONE_START) / (END_X - FINAL_ZONE_START);
      coins = Math.round(finalZoneCoins * (1 - clamp(p, 0, 1)));
    }

    if (player.x >= END_X && !finished) {
      finished = true;
      coins = 0;
      playSFX(audio.end);
      ending.classList.add("show");
    }
  }

  function render() {
    ctx.clearRect(0, 0, W, H);

    // 背景
    ctx.fillStyle = "#0b0c10";
    ctx.fillRect(0, 0, W, H);

    // 地面
    ctx.fillStyle = "#1a2a24";
    ctx.fillRect(0, GROUND_Y, W, H);

    // 道具（漂浮效果）
    const t = (performance.now() - startTime) / 1000;

    events.forEach(ev => {
      const sx = ev.x - cameraX;
      if (sx < -60 || sx > W + 60) return;

      // sin 漂浮：每個事件有不同 phase，避免同步
      const floatY = Math.sin(t * FLOAT_SPEED + ev.floatPhase) * FLOAT_AMPLITUDE;

      // 道具基準位置
      const baseY = GROUND_Y - 24;
      const y = baseY + floatY;

      // 這裡目前用方塊代表道具，你之後換 PNG 就把這段換成 drawImage
      ctx.fillStyle = "#8ef0c9";
      ctx.fillRect(sx - 8, y, 16, 16);

      // 小陰影，增加漂浮感
      ctx.fillStyle = "rgba(0,0,0,.25)";
      ctx.fillRect(sx - 7, baseY + 18, 14, 3);
    });

    // 玩家
    ctx.fillStyle = "#8ef0c9";
    ctx.fillRect(player.x - cameraX, player.y, player.w, player.h);

    // HUD
    ctx.fillStyle = "#fff";
    ctx.font = "14px sans-serif";
    ctx.fillText(`LV ${level}  XP ${xp}`, 16, 24);
    ctx.fillText(`Coins ${fmt(coins)}`, 16, 44);
  }

  function openModal(ev) {
    paused = true;
    modal.classList.add("show");
    playSFX(audio.open);

    modalTitle.textContent = `${ev.id}｜${ev.name}`;
    modalSubtitle.textContent = `XP +${ev.xp}  Coins -${fmt(ev.coinCost)}`;

    modalMedia.innerHTML = "";
    modalCaption.textContent = "";

    if (ev.media.type === "video") {
      const v = document.createElement("video");
      v.src = ev.media.src;
      v.controls = true;
      v.autoplay = true;
      modalMedia.appendChild(v);
    } else if (ev.media.type === "gallery") {
      const img = document.createElement("img");
      img.src = ev.media.srcs[0];
      modalMedia.appendChild(img);
    } else if (ev.media.type === "ig") {
      const img = document.createElement("img");
      img.src = ev.media.img;
      modalMedia.appendChild(img);

      const row = document.createElement("div");
      row.className = "linkRow";
      const a = document.createElement("a");
      a.href = ev.media.url || "#";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = "Open IG";
      row.appendChild(a);
      modalMedia.appendChild(row);
    }
  }

  function closeModal() {
    modal.classList.remove("show");
    paused = false;
    playSFX(audio.close);
  }

  function loop() {
    if (started && !paused && !finished) update();
    render();
    requestAnimationFrame(loop);
  }

  loop();
})();
