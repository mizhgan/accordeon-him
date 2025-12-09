export enum Avatar {
  BIRDY = 'BIRDY',
  BLACKMAN = 'BLACKMAN',
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export enum PowerUpType {
  HEAL = 'HEAL',          // Restores HP
  MULTIBALL = 'MULTIBALL', // Adds an extra bayan
  EXPLOSIVE = 'EXPLOSIVE', // Large radius damage to bricks
  PIERCING = 'PIERCING',   // Goes through bricks
  ATTACK = 'ATTACK',       // Damages opponent directly
  WIDEN = 'WIDEN',         // Widens paddle
}

export interface Vector {
  x: number;
  y: number;
}

export interface Entity {
  pos: Vector;
  width: number;
  height: number;
}

export interface Ball extends Entity {
  vel: Vector;
  radius: number;
  active: boolean;
  type: 'NORMAL' | 'EXPLOSIVE' | 'PIERCING';
  color: string;
}

export interface Brick extends Entity {
  active: boolean;
  type: 'NORMAL' | 'HARD' | 'BONUS' | 'ATTACK';
  health: number;
  color: string;
  value: number;
}

export interface PowerUp extends Entity {
  active: boolean;
  type: PowerUpType;
  vel: Vector;
}

export interface PlayerState {
  id: number;
  hp: number;
  score: number;
  avatar: Avatar;
  paddle: Entity;
  balls: Ball[];
  bricks: Brick[];
  powerUps: PowerUp[];
  effects: string[]; // Active status effects text
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}
