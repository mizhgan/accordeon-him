import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  GAME_WIDTH, GAME_HEIGHT, HALF_WIDTH, 
  PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_OFFSET_Y, PADDLE_SPEED,
  BALL_RADIUS, BALL_SPEED_BASE, MAX_BALL_SPEED,
  BRICK_ROWS, BRICK_COLS, BRICK_HEIGHT, BRICK_GAP, BRICK_OFFSET_TOP,
  MAX_HP, DAMAGE_PER_HIT, HEAL_AMOUNT, AVATAR_COLORS, DAMAGE_ON_DROP, AVATAR_NAMES
} from '../constants';
import { 
  Avatar, GameState, PlayerState, Ball, Brick, 
  PowerUp, PowerUpType, Vector, Particle 
} from '../types';

interface GameCanvasProps {
  playerAvatar: Avatar;
  onGameOver: (winner: 'PLAYER' | 'CPU') => void;
}

// --- UTILS ---
const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

const createBricks = (offsetX: number): Brick[] => {
  const bricks: Brick[] = [];
  const brickWidth = (HALF_WIDTH - (BRICK_COLS + 1) * BRICK_GAP) / BRICK_COLS;

  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      let type: Brick['type'] = 'NORMAL';
      let health = 1;
      let color = '#3b82f6'; // Blue-500

      const rand = Math.random();
      // Adjusted probabilities for more aggression
      if (rand < 0.20) { // 20% Chance for Attack
        type = 'ATTACK';
        color = '#ef4444'; // Red-500
      } else if (rand < 0.35) { // 15% Chance for Bonus
        type = 'BONUS';
        color = '#22c55e'; // Green-500
      } else if (rand < 0.45) { // 10% Chance for Hard
        type = 'HARD';
        health = 2;
        color = '#a855f7'; // Purple-500
      }

      bricks.push({
        pos: {
          x: offsetX + BRICK_GAP + c * (brickWidth + BRICK_GAP),
          y: BRICK_OFFSET_TOP + r * (BRICK_HEIGHT + BRICK_GAP)
        },
        width: brickWidth,
        height: BRICK_HEIGHT,
        active: true,
        type,
        health,
        color,
        value: 100
      });
    }
  }
  return bricks;
};

const createBall = (x: number, y: number): Ball => ({
  pos: { x, y },
  vel: { x: 0, y: 0 }, // Starts stationary
  radius: BALL_RADIUS,
  active: true,
  type: 'NORMAL',
  color: '#ffffff',
  width: BALL_RADIUS * 2,
  height: BALL_RADIUS * 2
});

const GameCanvas: React.FC<GameCanvasProps> = ({ playerAvatar, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // React state for HUD updates (minimized for performance)
  const [hudState, setHudState] = useState<{p1Hp: number, p2Hp: number, p1Score: number, p2Score: number}>({
    p1Hp: MAX_HP, p2Hp: MAX_HP, p1Score: 0, p2Score: 0
  });

  // Mutable Game State (Refs)
  const gameStateRef = useRef<{
    p1: PlayerState;
    p2: PlayerState;
    particles: Particle[];
    running: boolean;
    lastTime: number;
    mouseX: number;
  }>({
    p1: {
      id: 1,
      hp: MAX_HP,
      score: 0,
      avatar: playerAvatar,
      paddle: { pos: { x: HALF_WIDTH / 2 - PADDLE_WIDTH / 2, y: GAME_HEIGHT - PADDLE_OFFSET_Y }, width: PADDLE_WIDTH, height: PADDLE_HEIGHT },
      balls: [createBall(HALF_WIDTH / 2, GAME_HEIGHT - PADDLE_OFFSET_Y - BALL_RADIUS - 2)],
      bricks: createBricks(0),
      powerUps: [],
      effects: []
    },
    p2: {
      id: 2,
      hp: MAX_HP,
      score: 0,
      avatar: playerAvatar === Avatar.BIRDY ? Avatar.BLACKMAN : Avatar.BIRDY,
      paddle: { pos: { x: HALF_WIDTH + HALF_WIDTH / 2 - PADDLE_WIDTH / 2, y: GAME_HEIGHT - PADDLE_OFFSET_Y }, width: PADDLE_WIDTH, height: PADDLE_HEIGHT },
      balls: [createBall(HALF_WIDTH + HALF_WIDTH / 2, GAME_HEIGHT - PADDLE_OFFSET_Y - BALL_RADIUS - 2)],
      bricks: createBricks(HALF_WIDTH),
      powerUps: [],
      effects: []
    },
    particles: [],
    running: true,
    lastTime: 0,
    mouseX: 0
  });

  // --- GAME LOOP LOGIC ---

  const spawnPowerUp = (x: number, y: number, playerIdx: number) => {
    const types: PowerUpType[] = [PowerUpType.HEAL, PowerUpType.MULTIBALL, PowerUpType.EXPLOSIVE, PowerUpType.ATTACK, PowerUpType.PIERCING, PowerUpType.WIDEN];
    // Slightly weight ATTACK higher in random drops too
    const rand = Math.random();
    let type = types[Math.floor(Math.random() * types.length)];
    if (rand < 0.2) type = PowerUpType.ATTACK; 
    
    const powerUp: PowerUp = {
      pos: { x, y },
      width: 30,
      height: 30,
      active: true,
      type,
      vel: { x: 0, y: 3 } // Falls down
    };

    if (playerIdx === 1) gameStateRef.current.p1.powerUps.push(powerUp);
    else gameStateRef.current.p2.powerUps.push(powerUp);
  };

  const createParticles = (x: number, y: number, color: string, count: number = 5) => {
    for (let i = 0; i < count; i++) {
      gameStateRef.current.particles.push({
        x, y,
        vx: randomRange(-3, 3),
        vy: randomRange(-3, 3),
        life: 1.0,
        color,
        size: randomRange(2, 5)
      });
    }
  };

  const applyPowerUp = (player: PlayerState, opponent: PlayerState, type: PowerUpType) => {
    createParticles(player.paddle.pos.x + player.paddle.width/2, player.paddle.pos.y, '#FFD700', 10);
    
    switch (type) {
      case PowerUpType.HEAL:
        player.hp = Math.min(player.hp + HEAL_AMOUNT, MAX_HP);
        player.effects.push("+HP");
        break;
      case PowerUpType.ATTACK:
        opponent.hp = Math.max(opponent.hp - DAMAGE_PER_HIT, 0);
        opponent.effects.push("OUCH!");
        break;
      case PowerUpType.MULTIBALL:
        if (player.balls.length > 0) {
          const b = player.balls[0];
          player.balls.push({
            ...createBall(b.pos.x, b.pos.y),
            vel: { x: -b.vel.x, y: b.vel.y },
            active: true
          });
          player.effects.push("MULTI!");
        }
        break;
      case PowerUpType.EXPLOSIVE:
        player.balls.forEach(b => { b.type = 'EXPLOSIVE'; b.color = '#ef4444'; });
        player.effects.push("BOOM!");
        break;
      case PowerUpType.PIERCING:
        player.balls.forEach(b => { b.type = 'PIERCING'; b.color = '#fcd34d'; });
        player.effects.push("PIERCE!");
        break;
      case PowerUpType.WIDEN:
        player.paddle.width = Math.min(player.paddle.width + 40, PADDLE_WIDTH * 2);
        player.effects.push("BIG!");
        setTimeout(() => { player.paddle.width = PADDLE_WIDTH; }, 8000);
        break;
    }

    // Check Win/Loss via HP
    if (opponent.hp <= 0) {
      gameStateRef.current.running = false;
      onGameOver(player.id === 1 ? 'PLAYER' : 'CPU');
    }
  };

  const updatePlayer = (player: PlayerState, opponent: PlayerState, boundsX: { min: number, max: number }, isCpu: boolean) => {
    if (!gameStateRef.current.running) return;

    // 1. Move Paddle
    if (isCpu) {
      // Simple AI
      const targetX = player.balls.length > 0 && player.balls[0].active 
        ? player.balls[0].pos.x - player.paddle.width / 2
        : boundsX.min + (boundsX.max - boundsX.min) / 2; // Return to center if no ball
      
      const currentX = player.paddle.pos.x;
      const diff = targetX - currentX;
      const move = Math.sign(diff) * Math.min(Math.abs(diff), PADDLE_SPEED * 0.95); // Slightly slower than player
      
      player.paddle.pos.x += move;
    } else {
      // Mouse Control (Relative to canvas scale handled in event listener)
      // Smooth interpolation towards mouse
      const targetX = gameStateRef.current.mouseX - player.paddle.width / 2;
      player.paddle.pos.x = targetX; 
    }

    // Clamp Paddle
    if (player.paddle.pos.x < boundsX.min) player.paddle.pos.x = boundsX.min;
    if (player.paddle.pos.x + player.paddle.width > boundsX.max) player.paddle.pos.x = boundsX.max - player.paddle.width;

    // 2. Launch Ball logic
    player.balls.forEach(ball => {
      if (!ball.active) return;

      if (ball.vel.x === 0 && ball.vel.y === 0) {
        // Sticky/Start state
        ball.pos.x = player.paddle.pos.x + player.paddle.width / 2;
        ball.pos.y = player.paddle.pos.y - ball.radius - 2;
        
        // Auto launch for CPU
        if (isCpu && Math.random() < 0.02) {
           ball.vel = { x: randomRange(-4, 4), y: -BALL_SPEED_BASE };
        }
      } else {
        // Physics
        ball.pos.x += ball.vel.x;
        ball.pos.y += ball.vel.y;

        // Wall Collisions
        if (ball.pos.x - ball.radius < boundsX.min) {
          ball.pos.x = boundsX.min + ball.radius;
          ball.vel.x *= -1;
        }
        if (ball.pos.x + ball.radius > boundsX.max) {
          ball.pos.x = boundsX.max - ball.radius;
          ball.vel.x *= -1;
        }
        if (ball.pos.y - ball.radius < 0) {
          ball.pos.y = ball.radius;
          ball.vel.y *= -1;
        }

        // Floor Collision (Lose Ball -> Damage Player)
        if (ball.pos.y > GAME_HEIGHT) {
          ball.active = false;
          
          // Apply Damage
          player.hp = Math.max(0, player.hp - DAMAGE_ON_DROP);
          player.effects.push(`-${DAMAGE_ON_DROP} HP`);
          createParticles(ball.pos.x, GAME_HEIGHT - 10, '#ef4444', 15);

          // Check Death
          if (player.hp <= 0) {
            gameStateRef.current.running = false;
            // If current player dies, opponent wins
            onGameOver(player.id === 1 ? 'CPU' : 'PLAYER');
          }
        }

        // Paddle Collision
        if (
          ball.pos.y + ball.radius >= player.paddle.pos.y &&
          ball.pos.y - ball.radius <= player.paddle.pos.y + player.paddle.height &&
          ball.pos.x >= player.paddle.pos.x &&
          ball.pos.x <= player.paddle.pos.x + player.paddle.width
        ) {
          // Hit paddle
          ball.vel.y = -Math.abs(ball.vel.y); // Bounce up
          
          // Calculate hit point relative to center (-1 to 1)
          const hitPoint = (ball.pos.x - (player.paddle.pos.x + player.paddle.width / 2)) / (player.paddle.width / 2);
          
          // Add English/Spin
          ball.vel.x = hitPoint * 5; 

          // Prevent Vertical Lock (Zombie AI fix)
          // If the horizontal speed is too low, force it to angle out violently
          if (Math.abs(ball.vel.x) < 2.0) {
             // Force a stronger angle away from 0
             ball.vel.x = (ball.vel.x >= 0 ? 1 : -1) * (2.5 + Math.random());
          }
          
          // Add a tiny random jitter to prevent perfect loops
          ball.vel.x += (Math.random() - 0.5) * 0.5;
          
          // Speed up slightly
          const speed = Math.sqrt(ball.vel.x**2 + ball.vel.y**2);
          if (speed < MAX_BALL_SPEED) {
            // Normalize and scale up
            const scale = 1.05;
            ball.vel.x *= scale;
            ball.vel.y *= scale;
          }
        }

        // Brick Collision
        player.bricks.forEach(brick => {
          if (!brick.active) return;
          if (
            ball.pos.x + ball.radius > brick.pos.x &&
            ball.pos.x - ball.radius < brick.pos.x + brick.width &&
            ball.pos.y + ball.radius > brick.pos.y &&
            ball.pos.y - ball.radius < brick.pos.y + brick.height
          ) {
            // Check overlap
            const overlapX = Math.min(ball.pos.x + ball.radius - brick.pos.x, brick.pos.x + brick.width - (ball.pos.x - ball.radius));
            const overlapY = Math.min(ball.pos.y + ball.radius - brick.pos.y, brick.pos.y + brick.height - (ball.pos.y - ball.radius));

            if (ball.type !== 'PIERCING') {
              if (overlapX < overlapY) ball.vel.x *= -1;
              else ball.vel.y *= -1;
            }

            // Damage Brick
            if (ball.type === 'EXPLOSIVE') {
              // AOE
              player.bricks.forEach(b => {
                if (b.active && Math.hypot(b.pos.x - brick.pos.x, b.pos.y - brick.pos.y) < 100) {
                  b.health = 0;
                  b.active = false;
                  createParticles(b.pos.x + b.width/2, b.pos.y + b.height/2, b.color, 3);
                }
              });
            } else {
               brick.health--;
            }

            if (brick.health <= 0) {
              brick.active = false;
              player.score += brick.value;
              createParticles(brick.pos.x + brick.width/2, brick.pos.y + brick.height/2, brick.color);
              
              if (brick.type === 'ATTACK') spawnPowerUp(brick.pos.x, brick.pos.y, player.id);
              else if (brick.type === 'BONUS') spawnPowerUp(brick.pos.x, brick.pos.y, player.id);
              else if (Math.random() < 0.1) spawnPowerUp(brick.pos.x, brick.pos.y, player.id);
            }
          }
        });
      }
    });

    // Check Win Condition (Level Clear)
    const activeBricks = player.bricks.filter(b => b.active).length;
    if (activeBricks === 0) {
        gameStateRef.current.running = false;
        // If player clears bricks, player wins
        onGameOver(player.id === 1 ? 'PLAYER' : 'CPU');
    }

    // Clean up dead balls and respawn if empty
    player.balls = player.balls.filter(b => b.active);
    if (player.balls.length === 0 && gameStateRef.current.running) {
      // Only respawn if game is still running (player didn't die from the drop)
      player.balls.push(createBall(
        player.paddle.pos.x + player.paddle.width / 2, 
        player.paddle.pos.y - BALL_RADIUS - 5
      ));
    }

    // 3. PowerUps
    player.powerUps.forEach(p => {
      if (!p.active) return;
      p.pos.y += p.vel.y;

      // Check collision with paddle
      if (
        p.pos.y + p.height >= player.paddle.pos.y &&
        p.pos.y <= player.paddle.pos.y + player.paddle.height &&
        p.pos.x + p.width >= player.paddle.pos.x &&
        p.pos.x <= player.paddle.pos.x + player.paddle.width
      ) {
        p.active = false;
        applyPowerUp(player, opponent, p.type);
      }

      if (p.pos.y > GAME_HEIGHT) p.active = false;
    });
    
    // Clean powerups
    player.powerUps = player.powerUps.filter(p => p.active);

    // Clean effects timer
    if (Math.random() < 0.05 && player.effects.length > 0) {
      player.effects.shift();
    }
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, player: PlayerState) => {
    // Paddle
    ctx.fillStyle = AVATAR_COLORS[player.avatar];
    ctx.shadowBlur = 10;
    ctx.shadowColor = AVATAR_COLORS[player.avatar];
    ctx.fillRect(player.paddle.pos.x, player.paddle.pos.y, player.paddle.width, player.paddle.height);
    ctx.shadowBlur = 0;
    
    // Paddle Face/Decor
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(player.paddle.pos.x + 5, player.paddle.pos.y + 5, player.paddle.width - 10, player.paddle.height - 10);

    // Balls (The Bayan)
    player.balls.forEach(ball => {
      // Draw Bellows (Accordion center)
      ctx.fillStyle = ball.color;
      
      // Simple Bayan shape
      const w = ball.radius * 2.5;
      const h = ball.radius * 2;
      const x = ball.pos.x - w/2;
      const y = ball.pos.y - h/2;

      ctx.save();
      ctx.translate(ball.pos.x, ball.pos.y);
      // Rotation based on velocity
      const angle = ball.vel.x * 0.1;
      ctx.rotate(angle);

      // Left handle
      ctx.fillStyle = '#333';
      ctx.fillRect(-w/2, -h/2, w/4, h);
      // Right handle
      ctx.fillRect(w/4, -h/2, w/4, h);
      // Bellows (white stripes)
      ctx.fillStyle = '#eee';
      ctx.fillRect(-w/4, -h/2, w/2, h);
      // Stripes
      ctx.fillStyle = '#ccc';
      ctx.beginPath();
      for(let i=0; i<4; i++) {
        ctx.moveTo(-w/4, -h/2 + (i+1)*(h/5));
        ctx.lineTo(w/4, -h/2 + (i+1)*(h/5));
      }
      ctx.stroke();

      ctx.restore();
    });

    // Bricks
    player.bricks.forEach(brick => {
      if (!brick.active) return;
      ctx.fillStyle = brick.color;
      ctx.fillRect(brick.pos.x, brick.pos.y, brick.width, brick.height);
      
      // 3D Bevel effect
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(brick.pos.x, brick.pos.y, brick.width, 2); // Reduced bevel size for smaller bricks
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(brick.pos.x, brick.pos.y + brick.height - 2, brick.width, 2);

      // Icon for special bricks (Only if enough space)
      if (brick.height > 10) {
        if (brick.type === 'ATTACK') {
          ctx.fillStyle = 'white';
          ctx.font = '8px Arial'; // Smaller font
          ctx.fillText('⚔️', brick.pos.x + brick.width/2 - 4, brick.pos.y + brick.height/2 + 3);
        } else if (brick.type === 'BONUS') {
           ctx.fillStyle = 'white';
           ctx.font = '8px Arial';
           ctx.fillText('🎁', brick.pos.x + brick.width/2 - 4, brick.pos.y + brick.height/2 + 3);
        }
      }
    });

    // PowerUps
    player.powerUps.forEach(p => {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(p.pos.x + p.width/2, p.pos.y + p.height/2, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'black';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      
      let icon = '?';
      if (p.type === PowerUpType.HEAL) icon = '❤️';
      if (p.type === PowerUpType.ATTACK) icon = '💀';
      if (p.type === PowerUpType.MULTIBALL) icon = '🎹';
      if (p.type === PowerUpType.EXPLOSIVE) icon = '💣';
      if (p.type === PowerUpType.PIERCING) icon = '⚡';
      if (p.type === PowerUpType.WIDEN) icon = '↔️';

      ctx.fillText(icon, p.pos.x + p.width/2, p.pos.y + p.height/2 + 4);
    });

    // Floating Effects Text
    player.effects.forEach((text, i) => {
      ctx.fillStyle = 'white';
      ctx.font = 'bold 20px "Press Start 2P"';
      ctx.fillText(text, player.paddle.pos.x, player.paddle.pos.y - 20 - (i * 20));
    });
  };

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    gameStateRef.current.particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });
  };

  // Main Loop
  const loop = useCallback((time: number) => {
    if (!gameStateRef.current.running || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw Background Divider
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(HALF_WIDTH, 0);
    ctx.lineTo(HALF_WIDTH, GAME_HEIGHT);
    ctx.stroke();

    // Update & Draw Player 1
    updatePlayer(gameStateRef.current.p1, gameStateRef.current.p2, { min: 0, max: HALF_WIDTH }, false);
    drawPlayer(ctx, gameStateRef.current.p1);

    // Update & Draw Player 2 (CPU)
    updatePlayer(gameStateRef.current.p2, gameStateRef.current.p1, { min: HALF_WIDTH, max: GAME_WIDTH }, true);
    drawPlayer(ctx, gameStateRef.current.p2);

    // Update Particles
    gameStateRef.current.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
    });
    gameStateRef.current.particles = gameStateRef.current.particles.filter(p => p.life > 0);
    drawParticles(ctx);

    // Sync React UI (Throttle this in a real huge app, but fine here)
    if (time - gameStateRef.current.lastTime > 100) {
      setHudState({
        p1Hp: gameStateRef.current.p1.hp,
        p2Hp: gameStateRef.current.p2.hp,
        p1Score: gameStateRef.current.p1.score,
        p2Score: gameStateRef.current.p2.score
      });
      gameStateRef.current.lastTime = time;
    }

    requestAnimationFrame(loop);
  }, [onGameOver]); // Added dependency though it shouldn't change often

  // Input Handling
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = GAME_WIDTH / rect.width;
      gameStateRef.current.mouseX = (e.clientX - rect.left) * scaleX;
    };

    const handleClick = () => {
      // Launch ball if sticky
      const p1 = gameStateRef.current.p1;
      p1.balls.forEach(b => {
        if (b.active && b.vel.x === 0 && b.vel.y === 0) {
          b.vel = { x: randomRange(-4, 4), y: -BALL_SPEED_BASE };
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleClick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleClick);
    };
  }, []);

  // Start Loop
  useEffect(() => {
    const animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [loop]);


  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center bg-gray-950 p-4">
      
      {/* HUD - Top Bar */}
      <div className="w-full max-w-[1200px] flex justify-between items-center bg-gray-900 border-b-4 border-gray-800 p-4 mb-2 rounded-t-xl">
        {/* Player 1 HUD */}
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full border-4 border-blue-500 bg-gray-800 flex items-center justify-center overflow-hidden">
             {/* Simple avatar rep */}
             <div className="w-full h-full" style={{backgroundColor: AVATAR_COLORS[gameStateRef.current.p1.avatar]}}></div>
          </div>
          <div>
            <div className="text-yellow-400 font-bold pixel-font text-sm">
               {AVATAR_NAMES[gameStateRef.current.p1.avatar]} (YOU)
            </div>
            <div className="w-48 h-6 bg-gray-700 rounded-full overflow-hidden border border-gray-600 relative">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${(hudState.p1Hp / MAX_HP) * 100}%` }}
              ></div>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md">
                {Math.ceil(hudState.p1Hp)} / {MAX_HP}
              </span>
            </div>
            <div className="text-white text-xs mt-1">SCORE: {hudState.p1Score}</div>
          </div>
        </div>

        {/* VS LOGO */}
        <div className="text-4xl font-black italic text-red-600 animate-pulse pixel-font">VS</div>

        {/* Player 2 HUD */}
        <div className="flex items-center space-x-4 flex-row-reverse">
          <div className="w-16 h-16 rounded-full border-4 border-red-500 bg-gray-800 flex items-center justify-center overflow-hidden ml-4">
             <div className="w-full h-full" style={{backgroundColor: AVATAR_COLORS[gameStateRef.current.p2.avatar]}}></div>
          </div>
          <div className="text-right">
            <div className="text-red-400 font-bold pixel-font text-sm">
               {AVATAR_NAMES[gameStateRef.current.p2.avatar]} (CPU)
            </div>
            <div className="w-48 h-6 bg-gray-700 rounded-full overflow-hidden border border-gray-600 relative">
              <div 
                className="h-full bg-red-500 transition-all duration-300"
                style={{ width: `${(hudState.p2Hp / MAX_HP) * 100}%` }}
              ></div>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md">
                {Math.ceil(hudState.p2Hp)} / {MAX_HP}
              </span>
            </div>
            <div className="text-white text-xs mt-1">SCORE: {hudState.p2Score}</div>
          </div>
        </div>
      </div>

      {/* CANVAS CONTAINER */}
      <div className="relative shadow-2xl shadow-blue-900/20 rounded-b-xl overflow-hidden border-4 border-gray-800 bg-black">
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="w-full h-full max-h-[80vh] object-contain cursor-none"
          style={{ maxWidth: '100%', aspectRatio: `${GAME_WIDTH}/${GAME_HEIGHT}` }}
        />
        
        {/* Controls Hint */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/30 text-xs pixel-font pointer-events-none">
          MOUSE TO MOVE &bull; CLICK TO LAUNCH
        </div>
      </div>
    </div>
  );
};

export default GameCanvas;