
export interface PetStats {
  hunger: number;
  energy: number;
  happiness: number;
  hygiene: number;
  level: number;
  xp: number;
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
}
