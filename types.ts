
export interface PetStats {
  id?: string;
  user_id?: string;
  hunger: number;
  energy: number;
  happiness: number;
  hygiene: number;
  health: number;
  level: number;
  xp: number;
  is_dead: boolean;
  last_updated: string;
}

export interface Message {
  role: 'user' | 'pet';
  text: string;
}

export enum PetState {
  HAPPY = 'happy',
  SAD = 'sad',
  SLEEPING = 'sleeping',
  ANGRY = 'angry',
  HUNGRY = 'hungry',
  DIRTY = 'dirty',
  DEAD = 'dead'
}
