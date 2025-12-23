(() => {
  "use strict";

  const TOTAL_COINS = 524748;

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const W = canvas.width;   // 1920
  const H = canvas.height;  // 540

  const GROUND_Y = Math.floor(H * 0.78);
  const WORLD_LENGTH = 16000;
  const END_X = WORLD_LENGTH - 300;
  const FINAL_ZONE_START = Math.floor(WORLD_LENGTH * 0.9);

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
  const bgm = new Audio("media/audio/bgm.mp3");
  bgm.loop = true;
  bgm.volume = 0.55;
  bgm.preload = "auto";

  const sfx_pickup = new Audio("media/audio/sfx_pickup.wav");
  const sfx_open = new Audio("media/audio/sfx_open.wav");
  const sfx_close = new Audio("media/audio/sfx_close.wav");
  const sfx_end = new Audio("media/audio/sfx_end.wav");

  let muted = false;

  function hookAudioDebug(a, name) {
    a.addEventListener("error", () => {
      console.warn(`[AUDIO ERROR] ${name} failed to load. Check path/format:`, a.src);
    });
  }
  hookAudioDebug(bgm, "bgm.mp3");
  hookAudioDebug(sfx_pickup, "sfx_pickup.wav");
  hookAudioDebug(sfx_open, "sfx_open.wav");
  hookAudioDebug(sfx_close, "sfx_close.wav");
  hookAudioDebug(sfx_end, "sfx_end.wav");

  function playSFX(a) {
    if (muted) return;
    try {
      a.currentTime = 0;
      a.play().catch(()=>{});
    } catch {}
  }

  async function startBGM() {
    if (muted) return;
    try {
      // 確保從頭載入一次（避免某些瀏覽器沒抓到）
      bgm.load();
      await bgm.play();
      // console.log("BGM playing");
    } catch (err) {
      console.warn("[BGM BLOCKED] Browser blocked autoplay or file missing:", err);
    }
  }

  function toggleMute() {
    muted = !muted;
    [bgm, sfx_pickup, sfx_open, sfx_close, sfx_end].forEach(a => a.muted = muted);
    if (!muted) startBGM();
    else bgm.pause();
  }

  /* ================= IMAGES ================= */
  function loadImage(src) {
    const img = new Image();
    img.loaded = false;
    img.onload = () => img.loaded = true;
    img.onerror = () => console.warn("[IMG ERROR] failed:", src);
    img.src = src;
    return img;
  }

  const bgMain = loadImage("media/backgrounds/bg_main.png"); // 1920x540
  const playerImage = loadImage("media/player/player_main.png");

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
  const events = [
    { id:"A", name:"蛇年賀卡", sprite:"snake", x:1100, media:{type:"video",src:"media/A_snake.mp4"}, coinCost:18000 },
    { id:"B", name:"你好礙眼", sprite:"eyes", x:2000, media:{type:"ig",img:"media/B_ig.jpg"}, coinCost:21000 },
    { id:"C", name:"生日快樂", sprite:"cake", x:2900, media:{type:"gallery",srcs:["media/C_1.jpg","media/C_2.jpg"]}, coinCost:24000 },
    { id:"D", name:"空心磚小誌", sprite:"brick", x:3800, media:{type:"gallery",srcs:["media/D_1.jpg","media/D_2.jpg"]}, coinCost:43000 },
    { id:"E", name:"新一代製作", sprite:"ball", x:4900, media:{type:"gallery",srcs:["media/E_1.jpg","media/E_2.jpg"]}, coinCost:38000 },
    { id:"F", name:"周邊影片", sprite:"logo", x:6000, media:{type:"video",src:"media/F_video.mp4"}, coinCost:28000 },
    { id:"G", name:"九份旅遊", sprite:"cat", x:7100, media:{type:"gallery",srcs:["media/G_1.jpg","media/G_2.jpg"]}, coinCost:26000 },
    { id:"H", name:"軟啤酒絲巾", sprite:"beer", x:8200, media:{type:"gallery",srcs:["media/H_1.jpg","media/H_2.jpg"]}, coinCost:41000 },
    { id:"I", name:"書法課", sprite:"brush", x:9200, media:{type:"gallery",srcs:["media/I_1.jpg"]}, coinCost:24000 },
    { id:"J", name:"手掌便利貼", sprite:"hand", x:10200, media:{type:"gallery",srcs:["media/J_1.jpg"]}, coinCost:32000 },
    { id:"L", name:"日本旅遊", sprite:"suitcase", x:12400, media:{type:"gallery",srcs:["media/L_1.jpg","media/L_2.jpg"]}, coinCost:47000 },
    { id:"M", name:"彰化設計展", sprite:"buddha", x:13450, media:{type:"gallery",srcs:["media/M_1.jpg"]}, coinCost:25000 },
    { id:"N", name:"燭籤", sprite:"candle", x:14500, media:{type:"gallery",srcs:["media/N_1.jpg"]}, coinCost:40000 },
    { id:"O", name:"草率季", sprite:"rat", x:15400, media:{type:"gallery",srcs:["media/O_1.jpg","media/O_2.jpg"]}, coinCost:97748 },
  ];

  const FLOAT_AMPLITUDE = 4;
  const FLOAT_SPEED = 1.6;
  const FLOAT_PHASE_STEP = 0.9;
  const ITEM_SIZE = 48;

  events.forEach((ev,i)=>ev.phase=i*FLOAT_PHASE_STEP);
  const triggered = new Set();

  /* ================= PLAYER ================= */
  const player = {
    x:200, y:GROUND_Y-48, w:32, h:48,
    vx:0, vy:0,
    speed:3.2, jumpPower:9.5, gravity:0.5,
    onGround:true
  };

  let cameraX = 0;
  let started = false;
  let paused = false;
  let finished = false;

  let coins = TOTAL_COINS;
  let finalZoneEnterCoins = null;

  /* ================= INPUT ================= */
  const keys = new Set();
  window.addEventListener("keydown", (e) => {
    const k = e.key;

    if (k.toLowerCase()==="m") { toggleMute(); return; }

    if (["ArrowLeft","ArrowRight","ArrowUp"," ","Enter","Escape"].includes(k)) e.preventDefault();

    if ((k==="Enter"||k===" ") && !started) {
      started = true;
      titleScreen.classList.remove("show");
      startBGM();                 // ✅ 使用者手勢後開始播放
      return;
    }

    if (k==="ArrowUp" && player.onGround && started && !paused && !finished) {
      player.vy = -player.jumpPower;
      player.onGround = false;
      playSFX(sfx_pickup);
    }

    keys.add(k);

    if ((k==="Escape"||k==="Enter"||k===" ") && modal.classList.contains("show")) closeModal();
  }, {passive:false});
  window.addEventListener("keyup", (e)=>keys.delete(e.key));
  closeBtn.addEventListener("click", ()=>closeModal());

  /* ================= DRAW ================= */
  function drawBackground() {
    ctx.imageSmoothingEnabled = false;

    // ✅ 因為 canvas 也是 1920x540，直接貼就不會變形
    if (bgMain.loaded) {
      ctx.drawImage(bgMain, 0, 0, W, H);
    } else {
      ctx.fillStyle = "#ccecf5";
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = "rgba(0,0,0,.6)";
      ctx.font = "16px system-ui";
      ctx.fillText("背景載入中…（若一直不出現，請檢查 bg_main.png 路徑/檔名）", 24, 40);
    }
  }

  function drawItems() {
    const t = (performance.now()-startTime)/1000;
    const baseY = GROUND_Y - 30;

    for (const ev of events) {
      if (triggered.has(ev.id)) continue;
      const sx = ev.x - cameraX;
      if (sx < -120 || sx > W+120) continue;

      const fy = Math.sin(t*FLOAT_SPEED + ev.phase) * FLOAT_AMPLITUDE;

      const img = spriteImages[ev.sprite];

      // shadow
      ctx.fillStyle = "rgba(0,0,0,.25)";
      ctx.fillRect(Math.round(sx - ITEM_SIZE*0.30), Math.round(baseY + ITEM_SIZE*0.60), Math.round(ITEM_SIZE*0.60), 3);

      if (img && img.loaded) {
        ctx.drawImage(img, Math.round(sx-ITEM_SIZE/2), Math.round(baseY+fy-ITEM_SIZE/2), ITEM_SIZE, ITEM_SIZE);
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
    ctx.fillStyle = "rgba(0,0,0,.30)";
    ctx.fillRect(14, 14, 320, 42);
    ctx.fillStyle = "rgba(233,236,241,.92)";
    ctx.font = "600 16px system-ui";
    ctx.fillText(`Coins: ${fmt(coins)}`, 24, 42);
  }

  /* ================= MODAL ================= */
  function openModal(ev) {
    paused = true;
    modal.classList.add("show");
    playSFX(sfx_open);

    modalTitle.textContent = `${ev.id}｜${ev.name}`;
    modalSubtitle.textContent = `Coins -${fmt(ev.coinCost||0)}`;

    modalMedia.innerHTML = "";
    const m = ev.media;
    if (!m) return;

    if (m.type==="video") {
      const v = document.createElement("video");
      v.src = m.src;
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      modalMedia.appendChild(v);
    } else {
      const img = document.createElement("img");
      img.src = m.img || m.srcs?.[0] || "";
      modalMedia.appendChild(img);
    }
  }

  function closeModal() {
    modal.classList.remove("show");
    paused = false;
    playSFX(sfx_close);
  }

  /* ================= UPDATE ================= */
  function update() {
    player.vx = 0;
    if (keys.has("ArrowLeft")) player.vx = -player.speed;
    if (keys.has("ArrowRight")) player.vx = player.speed;

    player.x = clamp(player.x + player.vx, 0, END_X);

    player.vy += player.gravity;
    player.y += player.vy;

    if (player.y >= GROUND_Y - player.h) {
      player.y = GROUND_Y - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    cameraX = clamp(player.x - W*0.35, 0, WORLD_LENGTH - W);

    for (const ev of events) {
      if (triggered.has(ev.id)) continue;
      if (player.x > ev.x-20 && player.x < ev.x+20) {
        triggered.add(ev.id);
        coins = Math.max(0, coins - (ev.coinCost||0));
        playSFX(sfx_pickup);
        openModal(ev);
        break;
      }
    }

    if (player.x > FINAL_ZONE_START) {
      if (finalZoneEnterCoins === null) finalZoneEnterCoins = coins;
      const denom = (END_X - FINAL_ZONE_START);
      const p = denom > 0 ? clamp((player.x - FINAL_ZONE_START)/denom, 0, 1) : 1;
      coins = Math.round(finalZoneEnterCoins * (1 - p));
    }

    if (player.x >= END_X - 1 && !finished) {
      finished = true;
      coins = 0;
      playSFX(sfx_end);
      ending.classList.add("show");
    }
  }

  /* ================= LOOP ================= */
  function loop() {
    if (started && !paused && !finished) update();
    ctx.clearRect(0,0,W,H);
    drawBackground();
    drawItems();
    drawPlayer();
    drawHUD();
    requestAnimationFrame(loop);
  }

  loop();
})();
