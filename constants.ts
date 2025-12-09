import { Avatar } from "./types";

export const GAME_WIDTH = 1200;
export const GAME_HEIGHT = 800;
export const HALF_WIDTH = GAME_WIDTH / 2;

// Paddle
export const PADDLE_WIDTH = 100;
export const PADDLE_HEIGHT = 20;
export const PADDLE_SPEED = 8;
export const PADDLE_OFFSET_Y = 50; // Distance from bottom

// Ball
export const BALL_RADIUS = 8;
export const BALL_SPEED_BASE = 5; // Reduced from 6 for easier gameplay
export const MAX_BALL_SPEED = 9;  // Reduced from 12

// Bricks
export const BRICK_ROWS = 12; // Increased from 6
export const BRICK_COLS = 12; // Increased from 6
export const BRICK_HEIGHT = 12; // Reduced from 25
export const BRICK_GAP = 10;
export const BRICK_OFFSET_TOP = 80;

// Game
export const MAX_HP = 100;
export const DAMAGE_PER_HIT = 15; // Damage from Attack Powerup
export const DAMAGE_ON_DROP = 15; // Damage when ball is lost
export const HEAL_AMOUNT = 15;

export const AVATAR_COLORS: Record<Avatar, string> = {
  [Avatar.BIRDY]: '#fbbf24', // Amber 400
  [Avatar.BLACKMAN]: '#1f2937', // Gray 800 (represented visibly)
};

export const AVATAR_NAMES: Record<Avatar, string> = {
  [Avatar.BIRDY]: 'Birdy',
  [Avatar.BLACKMAN]: 'Blackman',
};