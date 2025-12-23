/* 2025 Recap Side-Scroller (MVP)
 * Controls:
 * - Enter/Space: start, close modal
 * - Left/Right: move
 * - ESC: close modal
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

  const FINAL_ZONE_START = Math.floor(WORLD_LENGTH * 0.90); // last 10%
  const FINAL_ZONE_END = END_X;

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
  const now = () => performance.now();

  // Events (placeholders for media paths)
  const events = [
    { id:"A", name:"蛇年賀卡", sprite:"snake", x:1100, modalType:"video",
      media:{ type:"video", src:"media/A_snake.mp4" },
      caption:"蛇年賀卡影片（placeholder）", xp:15, coinCost:18000 },

    { id:"B", name:"你好礙眼 貼紙誕生", sprite:"eyes", x:2000, modalType:"ig",
      media:{ type:"ig", url:"https://instagram.com/your_account_here", img:"media/B_ig.jpg" },
      caption:"你好礙眼 IG（截圖＋外連）", xp:15, coinCost:21000 },

    { id:"C", name:"生日快樂", sprite:"strawberryCake", x:2900, modalType:"gallery",
      media:{ type:"gallery", srcs:["media/C_1.jpg","media/C_2.jpg"] },
      caption:"生日紀錄照片（placeholder）", xp:10, coinCost:24000 },

    { id:"D", name:"空心磚小誌 開始發想", sprite:"hollowBrick", x:3800, modalType:"gallery",
      media:{ type:"gallery", srcs:["media/D_1.jpg","media/D_2.jpg","media/D_3.jpg"] },
      caption:"空心磚製作過程（placeholder）", xp:20, coinCost:43000 },

    { id:"E", name:"參與新一代畢業展製作", sprite:"rollingBall", x:4900, modalType:"gallery",
      media:{ type:"gallery", srcs:["media/E_1.jpg","media/E_2.jpg"] },
      caption:"新一代製作花絮（placeholder）", xp:20, coinCost:38000 },

    { id:"F", name:"新一代周邊影片拍攝", sprite:"logo", x:6000, modalType:"video",
      media:{ type:"video", src:"media/F_video.mp4" },
      caption:"周邊影片（placeholder）", xp:15, coinCost:28000 },

    { id:"G", name:"九份旅遊", sprite:"cat", x:7100, modalType:"gallery",
      media:{ type:"gallery", srcs:["media/G_1.jpg","media/G_2.jpg"] },
      caption:"九份旅遊照片（placeholder）", xp:10, coinCost:26000 },

    { id:"H", name:"軟啤酒絲巾 開始製作", sprite:"beerCan", x:8200, modalType:"gallery",
      media:{ type:"gallery", srcs:["media/H_1.jpg","media/H_2.jpg"] },
      caption:"絲巾製作花絮（placeholder）", xp:20, coinCost:41000 },

    { id:"I", name:"去上書法課", sprite:"brush", x:9200, modalType:"gallery",
      media:{ type:"gallery", srcs:["media/I_1.jpg"] },
      caption:"書法課照片（placeholder）", xp:10, coinCost:24000 },

    { id:"J", name:"手掌便利貼製作", sprite:"giantHand", x:10200, modalType:"gallery",
      media:{ type:"gallery", srcs:["media/J_1.jpg","media/J_2.jpg"] },
      caption:"便利貼製作紀錄（placeholder）", xp:15, coinCost:32000 },

    // K: father's passing — NO TEXT in modal; coinCost = 0
    { id:"K", name:"爸爸離世", sprite:"flowers", x:11250, modalType:"gallery",
      media:{ type:"gallery", srcs:["media/K_1.jpg","media/K_2.jpg"] },
      caption:"", xp:50, coinCost:0, special:{ noCaption:true, silent:true } },

    { id:"L", name:"去日本旅遊", sprite:"luoWithSuitcase", x:12400, modalType:"gallery",
      media:{ type:"gallery", srcs:["media/L_1.jpg","media/L_2.jpg","media/L_3.jpg"] },
      caption:"日本旅遊照片（placeholder）", xp:15, coinCost:47000 },

    { id:"M", name:"去彰化設計展", sprite:"buddha", x:13450, modalType:"gallery",
      media:{ type:"gallery", srcs:["media/M_1.jpg","media/M_2.jpg"] },
      caption:"彰化旅遊／設計展照片（placeholder）", xp:10, coinCost:25000 },

    { id:"N", name:"燭籤 誕生", sprite:"questionCandle", x:14500, modalType:"gallery",
      media:{ type:"gallery", srcs:["media/N_1.jpg","media/N_2.jpg"] },
      caption:"燭籤製作花絮（placeholder）", xp:20, coinCost:40000 },

    { id:"O", name:"草率季", sprite:"ratAndFerret", x:15400, modalType:"gallery",
      media:{ type:"gallery", srcs:["media/O_1.jpg","media/O_2.jpg","media/O_3.jpg"] },
      caption:"草率季照片（placeholder）", xp:40, coinCost:97748 },
  ];

  const triggered = new Set();

  const player = {
    x: 200,
    y: GROUND_Y - 52,
    w: 26,
    h: 40,
    vx: 0,
    speed: 3.2,
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

  const keys = new Set();

  window.addEventListener("keydown", (e) => {
    const k = e.key;
    if (["ArrowLeft","ArrowRight","Enter"," ","Escape"].includes(k)) e.preventDefault();

    if ((k === "Enter" || k === " ") && !started) {
      startGame();
      return;
    }
    keys.add(k);

    if (k === "Escape" && isModalOpen()) closeModal();
    if ((k === "Enter" || k === " ") && isModalOpen()) closeModal();
  }, { passive:false });

  window.addEventListener("keyup", (e) => keys.delete(e.key));

  closeBtn.addEventListener("click", () => closeModal());

  function startGame(){
    started = true;
    titleScreen.classList.remove("show");
  }

  function isModalOpen(){
    return modal.classList.contains("show");
  }

  function addXP(amount){
    xp += amount;
    level = clamp(1 + Math.floor(xp / 60), 1, 99);
  }

  function spendCoins(amount){
    if (!amount) return;
    coins = Math.max(0, coins - amount);
  }

  function updateFinalZoneCoins(){
    if (player.x < FINAL_ZONE_START) return;

    if (!inFinalZone) {
      inFinalZone = true;
      finalZoneEnterCoins = coins;
    }

    const denom = (FINAL_ZONE_END - FINAL_ZONE_START);
    const p = denom > 0 ? clamp((player.x - FINAL_ZONE_START) / denom, 0, 1) : 1;

    const target = Math.round(finalZoneEnterCoins * (1 - p));

    // never increase coins due to correction
    coins = clamp(target, 0, coins);
  }

  function openModal(ev){
    paused = true;
    modal.classList.add("show");

    modalTitle.textContent = `${ev.id}｜${ev.name}`;

    const coinText = (ev.coinCost && ev.coinCost > 0) ? `　Coins -${fmt(ev.coinCost)}` : "";
    modalSubtitle.textContent = `XP +${ev.xp}${coinText}`;

    // media
    modalMedia.innerHTML = "";
    const m = ev.media || null;

    // caption (K must have no caption)
    const shouldHideCaption = !!(ev.special && ev.special.noCaption) || !ev.caption;
    if (shouldHideCaption) {
      modalCaption.textContent = "";
      modalCaption.classList.add("hidden");
    } else {
      modalCaption.textContent = ev.caption;
      modalCaption.classList.remove("hidden");
    }

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

  function galleryStep(wrap, media, dir){
    const srcs = media.srcs || [];
    if (!srcs.length) return;
    let idx = parseInt(wrap.dataset.idx || "0", 10);
    idx = (idx + dir + srcs.length) % srcs.length;
    wrap.dataset.idx = String(idx);
    const img = wrap.querySelector("img");
    if (img) img.src = srcs[idx];
    const idxLabel = document.getElementById("idxLabel");
    if (idxLabel) idxLabel.textContent = `${idx+1} / ${srcs.length}`;
  }

  function closeModal(){
    modal.classList.remove("show");
    paused = false;
  }

  function checkTriggers(){
    for (const ev of events) {
      if (triggered.has(ev.id)) continue;

      const ex = ev.x;
      const ew = 32;
      const px = player.x;
      const pw = player.w;

      if (px + pw > ex - ew && px < ex + ew) {
        triggered.add(ev.id);

        addXP(ev.xp || 0);
        spendCoins(ev.coinCost || 0);

        openModal(ev);
        break;
      }
    }
  }

  let lastT = now();
  function loop(){
    const t = now();
    lastT = t;

    if (started && !paused && !finished) {
      update();
    }

    render();
    requestAnimationFrame(loop);
  }

  function update(){
    player.vx = 0;
    if (keys.has("ArrowLeft")) { player.vx = -player.speed; player.facing = -1; }
    if (keys.has("ArrowRight")) { player.vx = +player.speed; player.facing = +1; }

    player.x = clamp(player.x + player.vx, 0, END_X);

    cameraX = clamp(player.x - W * 0.35, 0, WORLD_LENGTH - W);

    checkTriggers();
    updateFinalZoneCoins();

    if (player.x >= END_X - 2) {
      coins = 0;
      finished = true;
      ending.classList.add("show");
    }
  }

  function worldToScreenX(wx){
    return Math.round(wx - cameraX);
  }

  function render(){
    ctx.clearRect(0,0,W,H);
    drawSky();
    drawParallax();
    drawGround();

    for (const ev of events) drawEvent(ev);
    drawPlayer();
    drawHUD();
    drawFinalZoneTone();
  }

  function drawSky(){
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0, "#0a0b10");
    g.addColorStop(0.6, "#0d1020");
    g.addColorStop(1, "#07080c");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);
  }

  function drawParallax(){
    const baseY = Math.floor(H*0.64);
    ctx.fillStyle = "#0c1322";
    for (let i=0;i<10;i++){
      const x = ((i*220) - (cameraX*0.2 % 220));
      ctx.fillRect(Math.floor(x), baseY + (i%2)*12, 260, 90);
    }
    ctx.fillStyle = "#0a101b";
    for (let i=0;i<10;i++){
      const x = ((i*260) - (cameraX*0.12 % 260));
      ctx.fillRect(Math.floor(x), baseY + 30 + (i%3)*10, 320, 110);
    }
  }

  function drawGround(){
    ctx.fillStyle = "#0f1a16";
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

    ctx.fillStyle = "rgba(142,240,201,.07)";
    for (let x = - (cameraX % 32); x < W; x += 32) {
      ctx.fillRect(Math.floor(x), GROUND_Y, 1, H - GROUND_Y);
    }
    ctx.fillStyle = "rgba(255,255,255,.12)";
    ctx.fillRect(0, GROUND_Y, W, 2);
  }

  function drawEvent(ev){
    const sx = worldToScreenX(ev.x);
    const sy = GROUND_Y - 26;

    if (sx < -60 || sx > W + 60) return;

    const isK = ev.id === "K";
    const seen = triggered.has(ev.id);

    ctx.fillStyle = isK ? "rgba(255,255,255,.06)" : "rgba(142,240,201,.10)";
    ctx.fillRect(sx - 10, sy + 22, 20, 6);

    drawSprite(ev.sprite, sx, sy, isK);

    if (!seen) {
      ctx.fillStyle = isK ? "rgba(255,255,255,.18)" : "rgba(142,240,201,.55)";
      ctx.fillRect(sx - 1, sy - 34, 2, 10);
      ctx.fillRect(sx - 4, sy - 26, 8, 2);
    }
  }

  function drawSprite(name, x, y, isK){
    const c1 = isK ? "rgba(220,220,220,.55)" : "rgba(142,240,201,.70)";
    const c2 = isK ? "rgba(220,220,220,.22)" : "rgba(142,240,201,.30)";
    const dark = isK ? "rgba(200,200,200,.18)" : "rgba(0,0,0,.25)";

    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = dark;
    ctx.fillRect(-12, -12, 24, 24);

    ctx.fillStyle = c2;
    ctx.fillRect(-11, -11, 22, 22);

    ctx.fillStyle = c1;

    switch(name){
      case "snake":
        ctx.fillRect(-6, 6, 12, 3);
        ctx.fillRect(-6, 2, 3, 4);
        ctx.fillRect(3, -2, 3, 8);
        ctx.fillRect(-3, -6, 9, 3);
        break;
      case "eyes":
        ctx.fillRect(-8, -2, 6, 6);
        ctx.fillRect(2, -2, 6, 6);
        ctx.fillStyle = dark;
        ctx.fillRect(-6, 0, 2, 2);
        ctx.fillRect(4, 0, 2, 2);
        break;
      case "strawberryCake":
        ctx.fillRect(-8, 4, 16, 5);
        ctx.fillRect(-6, -2, 12, 6);
        ctx.fillRect(-2, -8, 4, 4);
        break;
      case "hollowBrick":
        ctx.fillRect(-9, -2, 18, 12);
        ctx.fillStyle = dark;
        ctx.fillRect(-6, 1, 4, 6);
        ctx.fillRect(2, 1, 4, 6);
        break;
      case "rollingBall":
        ctx.fillRect(-6, -6, 12, 12);
        ctx.fillRect(-12, -2, 5, 2);
        ctx.fillRect(-12, 2, 7, 2);
        break;
      case "logo":
        ctx.fillRect(-8, -8, 16, 16);
        ctx.fillStyle = dark;
        ctx.fillRect(-6, -1, 12, 2);
        ctx.fillRect(-1, -6, 2, 12);
        break;
      case "cat":
        ctx.fillRect(-5, -2, 10, 10);
        ctx.fillRect(-8, -6, 4, 4);
        ctx.fillRect(4, -6, 4, 4);
        ctx.fillRect(6, 2, 4, 2);
        break;
      case "beerCan":
        ctx.fillRect(-5, -8, 10, 16);
        ctx.fillRect(-3, -10, 6, 2);
        break;
      case "brush":
        ctx.fillRect(-2, -10, 4, 14);
        ctx.fillRect(-5, 4, 10, 4);
        break;
      case "giantHand":
        ctx.fillRect(-7, -4, 14, 12);
        ctx.fillRect(-8, -10, 3, 6);
        ctx.fillRect(-4, -10, 3, 6);
        ctx.fillRect(0, -10, 3, 6);
        ctx.fillRect(4, -10, 3, 6);
        break;
      case "flowers":
        ctx.fillRect(-2, -8, 4, 10);
        ctx.fillRect(-6, -2, 4, 4);
        ctx.fillRect(2, -2, 4, 4);
        ctx.fillRect(-2, -4, 4, 4);
        break;
      case "luoWithSuitcase":
        ctx.fillRect(-6, -8, 8, 8);
        ctx.fillRect(-6, 0, 8, 6);
        ctx.fillRect(4, 2, 6, 8);
        ctx.fillRect(5, 10, 2, 2);
        ctx.fillRect(8, 10, 2, 2);
        break;
      case "buddha":
        ctx.fillRect(-7, -8, 14, 10);
        ctx.fillRect(-10, 2, 20, 8);
        break;
      case "questionCandle":
        ctx.fillRect(-2, -6, 4, 12);
        ctx.fillRect(-6, -10, 12, 3);
        ctx.fillStyle = dark;
        ctx.fillRect(-1, -10, 2, 2);
        ctx.fillRect(-1, -13, 2, 2);
        break;
      case "ratAndFerret":
        ctx.fillRect(-8, -2, 6, 6);
        ctx.fillRect(2, -2, 6, 6);
        ctx.fillRect(-6, 4, 2, 2);
        ctx.fillRect(4, 4, 2, 2);
        break;
      default:
        ctx.fillRect(-6, -6, 12, 12);
    }

    ctx.restore();
  }

  function drawPlayer(){
    const sx = worldToScreenX(player.x);
    const sy = player.y;

    ctx.fillStyle = "rgba(142,240,201,.85)";
    ctx.fillRect(sx, sy, player.w, player.h);

    ctx.fillStyle = "rgba(142,240,201,.65)";
    ctx.fillRect(sx - 4, sy - 18, player.w + 8, 18);

    ctx.fillStyle = "rgba(0,0,0,.35)";
    if (player.facing === 1) ctx.fillRect(sx + player.w + 1, sy - 10, 3, 3);
    else ctx.fillRect(sx - 4, sy - 10, 3, 3);

    ctx.fillStyle = "rgba(0,0,0,.25)";
    ctx.fillRect(sx, sy + player.h, player.w, 4);
  }

  function drawHUD(){
    if (!started) return;

    ctx.save();
    ctx.globalAlpha = 0.95;

    ctx.fillStyle = "rgba(0,0,0,.30)";
    ctx.fillRect(14, 14, 320, 72);

    ctx.fillStyle = "rgba(255,255,255,.12)";
    ctx.fillRect(14, 14, 320, 2);

    ctx.fillStyle = "#e9ecf1";
    ctx.font = "700 16px ui-sans-serif, system-ui";
    ctx.fillText(`LV ${level}`, 24, 40);

    ctx.font = "600 14px ui-sans-serif, system-ui";
    ctx.fillStyle = "rgba(233,236,241,.92)";
    ctx.fillText(`XP: ${fmt(xp)}`, 24, 62);

    ctx.fillStyle = "rgba(142,240,201,.95)";
    ctx.fillText(`Coins: ${fmt(coins)}`, 140, 40);

    const prog = clamp(player.x / END_X, 0, 1);
    ctx.fillStyle = "rgba(255,255,255,.10)";
    ctx.fillRect(140, 52, 180, 8);
    ctx.fillStyle = "rgba(142,240,201,.55)";
    ctx.fillRect(140, 52, Math.floor(180 * prog), 8);

    ctx.restore();
  }

  function drawFinalZoneTone(){
    if (!started || finished) return;
    if (player.x < FINAL_ZONE_START) return;

    const denom = (FINAL_ZONE_END - FINAL_ZONE_START);
    const p = denom > 0 ? clamp((player.x - FINAL_ZONE_START) / denom, 0, 1) : 1;

    ctx.save();
    ctx.globalAlpha = 0.18 + p * 0.22;
    ctx.fillStyle = "#000";
    ctx.fillRect(0,0,W,H);
    ctx.restore();
  }

  // start loop
  loop();
})();
