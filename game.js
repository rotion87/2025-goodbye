/* 2025 Recap Side-Scroller
 * Single Background Version
 * ← → 移動｜↑ 跳躍｜Enter/Space 開始/關閉｜ESC 關閉｜M 靜音
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

  /* ================= 工具 ================= */
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
    try { a.currentTime = 0; a.play(); } catch {}
  }

  function toggleMute() {
    audio.muted = !audio.muted;
    Object.values(audio).forEach(a => a.muted = audio.muted);
    if (!audio.muted) audio.bgm.play().catch(()=>{});
    else audio.bgm.pause();
  }

  /* ================= IMAGES ================= */
  function loadImage(src) {
    const img = new Image();
    img.loaded = false;
    img.onload = () => img.loaded = true;
    img.onerror = () => console.warn("Image failed:", src);
    img.src = src;
    return img;
  }

  // ✅ 單一背景
  const bgMain = loadImage("media/backgrounds/bg_main.png");

  // 角色
  const playerImage = loadImage("media/player/player_main.png");

  // 道具
  const ITEM_SIZE = 48;
  const FLOAT_AMPLITUDE = 4;
  const FLOAT_SPEED = 1.6;

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

  events.forEach((ev,i)=>ev.phase=i*0.9);
  const triggered = new Set();

  /* ================= PLAYER ================= */
  const player = {
    x:200, y:GROUND_Y-48, w:32, h:48,
    vx:0, vy:0, speed:3.2, jump:9.5, gravity:0.5, onGround:true
  };

  let cameraX = 0;
  let started=false, paused=false, finished=false;
  let coins = TOTAL_COINS, finalZoneCoins=null;

  /* ================= INPUT ================= */
  const keys = new Set();
  window.addEventListener("keydown", e=>{
    const k=e.key;
    if(k.toLowerCase()==="m") toggleMute();
    if(["ArrowLeft","ArrowRight","ArrowUp"," ","Enter","Escape"].includes(k)) e.preventDefault();

    if((k==="Enter"||k===" ")&&!started){
      started=true;
      titleScreen.classList.remove("show");
      audio.bgm.play().catch(()=>{});
      return;
    }

    if(k==="ArrowUp"&&player.onGround&&started&&!paused){
      player.vy=-player.jump;
      player.onGround=false;
      playSFX(audio.pickup);
    }

    keys.add(k);
    if((k==="Escape"||k==="Enter"||k===" ")&&modal.classList.contains("show")) closeModal();
  },{passive:false});
  window.addEventListener("keyup",e=>keys.delete(e.key));
  closeBtn.onclick=closeModal;

  /* ================= UPDATE ================= */
  function update(){
    player.vx=0;
    if(keys.has("ArrowLeft")) player.vx=-player.speed;
    if(keys.has("ArrowRight")) player.vx=player.speed;
    player.x=clamp(player.x+player.vx,0,END_X);

    player.vy+=player.gravity;
    player.y+=player.vy;
    if(player.y>=GROUND_Y-player.h){
      player.y=GROUND_Y-player.h;
      player.vy=0; player.onGround=true;
    }

    cameraX=clamp(player.x-W*0.35,0,WORLD_LENGTH-W);

    for(const ev of events){
      if(triggered.has(ev.id)) continue;
      if(player.x>ev.x-20&&player.x<ev.x+20){
        triggered.add(ev.id);
        coins=Math.max(0,coins-ev.coinCost);
        openModal(ev);
        break;
      }
    }

    if(player.x>FINAL_ZONE_START){
      if(finalZoneCoins===null) finalZoneCoins=coins;
      const p=(player.x-FINAL_ZONE_START)/(END_X-FINAL_ZONE_START);
      coins=Math.round(finalZoneCoins*(1-Math.min(p,1)));
    }

    if(player.x>=END_X&&!finished){
      finished=true; coins=0;
      playSFX(audio.end);
      ending.classList.add("show");
    }
  }

  /* ================= DRAW ================= */
  function drawBackground(){
    if(bgMain.loaded){
      ctx.drawImage(bgMain,0,0,W,H);
    }else{
      ctx.fillStyle="#0b0c10";
      ctx.fillRect(0,0,W,H);
    }
  }

  function drawGround(){
    ctx.fillStyle="rgba(0,0,0,.25)";
    ctx.fillRect(0,GROUND_Y,W,H-GROUND_Y);
  }

  function drawItems(){
    const t=(performance.now()-startTime)/1000;
    const baseY=GROUND_Y-30;
    for(const ev of events){
      if(triggered.has(ev.id)) continue;
      const sx=ev.x-cameraX;
      if(sx<-80||sx>W+80) continue;
      const fy=Math.sin(t*FLOAT_SPEED+ev.phase)*FLOAT_AMPLITUDE;
      const img=spriteImages[ev.sprite];
      if(img.loaded){
        ctx.drawImage(img,sx-ITEM_SIZE/2,baseY+fy-ITEM_SIZE/2,ITEM_SIZE,ITEM_SIZE);
      }
    }
  }

  function drawPlayer(){
    const sx=Math.round(player.x-cameraX);
    const sy=Math.round(player.y);
    if(playerImage.loaded){
      ctx.drawImage(playerImage,sx,sy,player.w,player.h);
    }
  }

  function drawHUD(){
    ctx.fillStyle="rgba(0,0,0,.35)";
    ctx.fillRect(14,14,260,36);
    ctx.fillStyle="#fff";
    ctx.font="14px system-ui";
    ctx.fillText(`Coins: ${fmt(coins)}`,24,38);
  }

  /* ================= MODAL ================= */
  function openModal(ev){
    paused=true; modal.classList.add("show");
    playSFX(audio.open);
    modalTitle.textContent=`${ev.id}｜${ev.name}`;
    modalSubtitle.textContent=`Coins -${fmt(ev.coinCost)}`;
    modalMedia.innerHTML="";
    if(ev.media.type==="video"){
      const v=document.createElement("video");
      v.src=ev.media.src; v.controls=true; v.autoplay=true;
      modalMedia.appendChild(v);
    }else{
      const img=document.createElement("img");
      img.src=ev.media.img||ev.media.srcs[0];
      modalMedia.appendChild(img);
    }
  }

  function closeModal(){
    modal.classList.remove("show");
    paused=false;
    playSFX(audio.close);
  }

  /* ================= LOOP ================= */
  function loop(){
    if(started&&!paused&&!finished) update();
    ctx.clearRect(0,0,W,H);
    drawBackground();
    drawGround();
    drawItems();
    drawPlayer();
    drawHUD();
    requestAnimationFrame(loop);
  }
  loop();
})();
