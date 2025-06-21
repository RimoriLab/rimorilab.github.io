const canvas = document.getElementById('dino-game');
const ctx = canvas.getContext('2d');

// Resize canvas to full window size
function resizeCanvas() {
  let width = Math.min(window.innerWidth * 0.98, 600);
  let height = width * (window.innerWidth < 600 ? 0.5 : 0.4); // 50% tinggi di HP, 40% di desktop
  canvas.width = width;
  canvas.height = Math.min(height, window.innerWidth < 600 ? 320 : 260);
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Dino
const dino = {
  x: 50,
  y: 150,
  w: 40,
  h: 40,
  vy: 0,
  gravity: 1.5,
  jumpPower: -18,
  isJumping: false,
  jumpCount: 0,
  maxJump: 2,
  draw() {
     // Kepala
    ctx.fillStyle = '#43cea2';
    ctx.fillRect(this.x + 8, this.y, 24, 18);
    // Badan
    ctx.fillStyle = '#34ace0';
    ctx.fillRect(this.x + 12, this.y + 18, 16, 14);
    // Kaki kiri
    ctx.fillStyle = '#222';
    ctx.fillRect(this.x + 12, this.y + 32, 5, 8);
    // Kaki kanan
    ctx.fillRect(this.x + 23, this.y + 32, 5, 8);
    // Mata kiri
    ctx.fillStyle = '#fff';
    ctx.fillRect(this.x + 13, this.y + 6, 4, 4);
    // Mata kanan
    ctx.fillRect(this.x + 23, this.y + 6, 4, 4);
    // Antena
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x + 20, this.y);
    ctx.lineTo(this.x + 20, this.y - 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(this.x + 20, this.y - 8, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffb142';
    ctx.fill();
  }
};
 
// Obstacle
let obstacles = [];
function getObstacleSpeed(score) {
  if (score < 700) return 4;         // Level 1
  else if (score < 1400) return 5;   // Level 2
  else if (score < 2100) return 6;   // Level 3
  else if (score < 2800) return 7;   // Level 4
  else if (score < 3500) return 8;   // Level 5
  else if (score < 4200) return 9;   // Level 6
  else if (score < 4900) return 10;  // Level 7
  else if (score < 5600) return 11;  // Level 8
  else if (score < 6300) return 12;  // Level 9
  else return 13;                    // Level 10+
}

function spawnObstacle() {
   const baseHeights = [20, 30, 40, 50];
  const baseWidths = [12, 16, 20];
  const colors = ['#ff5252', '#ffb142', '#34ace0', '#33d9b2', '#706fd3'];

  let h = baseHeights[Math.floor(Math.random() * baseHeights.length)];
  let w = baseWidths[Math.floor(Math.random() * baseWidths.length)];
  let color = colors[Math.floor(Math.random() * colors.length)];

  // Level lebih sulit di score > 3500
  if (score > 3500 && score <= 5600) {
    h += Math.random() < 0.5 ? 10 : 0; // kadang lebih tinggi
    w += Math.random() < 0.5 ? 6 : 0;  // kadang lebih lebar
    // Kadang spawn dua rintangan berdekatan
    if (Math.random() < 0.25) {
      obstacles.push({
        x: canvas.width + 40,
        y: 190 - h,
        w: w,
        h: h,
        speed: getObstacleSpeed(score),
        color: color
      });
    }
  }

  // Level lebih sulit di score > 5600
  if (score > 5600) {
    h += Math.random() < 0.7 ? 15 : 0; // sering lebih tinggi
    w += Math.random() < 0.7 ? 10 : 0; // sering lebih lebar
    // Kadang spawn rintangan atas (harus lompat rendah)
    if (Math.random() < 0.2) {
      obstacles.push({
        x: canvas.width,
        y: 100, // rintangan atas
        w: w,
        h: 30,
        speed: getObstacleSpeed(score),
        color: '#222'
      });
    }
    // Kadang spawn dua rintangan bawah berdekatan
    if (Math.random() < 0.3) {
      obstacles.push({
        x: canvas.width + 30,
        y: 190 - h,
        w: w,
        h: h,
        speed: getObstacleSpeed(score),
        color: color
      });
    }
  }

  // Rintangan utama
  obstacles.push({
    x: canvas.width,
    y: 190 - h,
    w: w,
    h: h,
    speed: getObstacleSpeed(score),
    color: color
  });
}
let spawnTimer = 0;

// Score
let score = 0;
let gameOver = false;

function resetGame() {
  obstacles = [];
  score = 0;
  dino.y = 150;
  dino.vy = 0;
  dino.isJumping = false;
  dino.jumpCount = 0;
  gameOver = false;
}

function loop() {
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw ground
  ctx.fillStyle = '#888';
  ctx.fillRect(0, 190, canvas.width, 10);

  // Dino
  dino.draw();

  // Dino jump & gravity
  if (!gameOver) {
    dino.y += dino.vy;

    // Jika spasi masih ditekan DAN dino masih naik (vy < 0), slow fall
    if (spacePressed && dino.vy < 0) {
      dino.vy += dino.gravity * 0.15; // slow fall saat naik
    } else {
      dino.vy += dino.gravity; // normal gravity
    }

    // Batas atas
    if (dino.y < 0) {
      dino.y = 0;
    }

    // Batas bawah (tanah)
    if (dino.y > 150) {
      dino.y = 150;
      dino.vy = 0;
      dino.isJumping = false;
      dino.jumpCount = 0;
    }

    // Obstacles
    spawnTimer++;
    if (spawnTimer > 70 + Math.random() * 40) {
      spawnObstacle();
      spawnTimer = 0;
    }
    const COLLISION_MARGIN = 8; // Bisa diubah sesuai kebutuhan

    for (let i = 0; i < obstacles.length; i++) {
      let obs = obstacles[i];
      obs.x -= obs.speed;
      ctx.fillStyle = obs.color;
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

      // Collision detection dengan margin
      if (
        dino.x + COLLISION_MARGIN < obs.x + obs.w &&
        dino.x + dino.w - COLLISION_MARGIN > obs.x &&
        dino.y + COLLISION_MARGIN < obs.y + obs.h &&
        dino.y + dino.h - COLLISION_MARGIN > obs.y
      ) {
        gameOver = true;
        const gameoverAudio = document.getElementById('gameover-audio');
        if (gameoverAudio) {
          gameoverAudio.currentTime = 0;
          gameoverAudio.play().catch(()=>{});
        }
      }
    }
    obstacles = obstacles.filter(obs => obs.x + obs.w > 0);

    // Score
    ctx.fillStyle = '#222';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, canvas.width - 140, 30);
    score++;
  } else {
    // Tampilkan pesan Game Over dan Score terakhir
    ctx.fillStyle = '#222';
    ctx.font = '32px Arial';
    ctx.textAlign = "center";
    ctx.fillText('Game Over', canvas.width/2, 90);
    ctx.font = '18px Arial';
    ctx.fillText('Tekan [Space] atau Tap untuk ulang', canvas.width/2, 120);
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, canvas.width/2, 160);
    ctx.textAlign = "start";
  }

  requestAnimationFrame(loop);
}

let spacePressed = false;

// Jump event
document.addEventListener('keydown', function(e) {
  if ((e.code === 'Space' || e.keyCode === 32)) {
    if (!spacePressed) {
      // Double jump
      if (dino.jumpCount < dino.maxJump) {
        dino.vy = dino.jumpPower;
        dino.isJumping = true;
        dino.jumpCount++;
      }
    }
    spacePressed = true;
    e.preventDefault();
  }
  if ((e.code === 'Space' || e.keyCode === 32) && gameOver) {
    resetGame();
  }
});

document.addEventListener('keyup', function(e) {
  if (e.code === 'Space' || e.keyCode === 32) {
    spacePressed = false;
  }
});

// Start game
loop();

let touchActive = false;

canvas.addEventListener('touchstart', function(e) {
  if (gameOver) {
    // Tunda reset agar audio game over sempat terdengar
    setTimeout(resetGame, 500);
    return;
  }
  e.preventDefault();
  if (!touchActive) {
    if (dino.jumpCount < dino.maxJump) {
      dino.vy = dino.jumpPower;
      dino.isJumping = true;
      dino.jumpCount++;
    }
  }
  touchActive = true;
  spacePressed = true;
}, { passive: false });

document.body.addEventListener('touchstart', function(e) {
  if (gameOver) {
    setTimeout(resetGame, 500);
    return;
  }
  if (!touchActive) {
    if (dino.jumpCount < dino.maxJump) {
      dino.vy = dino.jumpPower;
      dino.isJumping = true;
      dino.jumpCount++;
    }
  }
  touchActive = true;
  spacePressed = true;
}, { passive: false });

document.body.addEventListener('touchend', function(e) {
  touchActive = false;
  spacePressed = false;
}, { passive: false });

window.addEventListener('DOMContentLoaded', function() {
  const backsound = document.getElementById('backsound');
  if (backsound) {
    // Untuk mobile, harus ada interaksi user dulu
    const playAudio = () => {
      backsound.volume = 0.5; // Atur volume sesuai selera
      backsound.play().catch(()=>{});
      window.removeEventListener('click', playAudio);
      window.removeEventListener('touchstart', playAudio);
    };
    window.addEventListener('click', playAudio);
    window.addEventListener('touchstart', playAudio);
  }
});

function triggerGameOver() {
  gameOver = true;
  const gameoverAudio = document.getElementById('gameover-audio');
  if (gameoverAudio) {
    gameoverAudio.currentTime = 0;
    gameoverAudio.play().catch(()=>{});
  }
}