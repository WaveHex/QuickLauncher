export type ProfileAction =
  | { type: "app"; path: string }
  | { type: "url"; url: string }
  | { type: "cmd"; command: string }
  | { type: "folder"; path: string }
  | { type: "file"; path: string };

export interface Profile {
  id: string;
  name: string;
  category: string;
  actions: ProfileAction[];
  bgType: 'color' | 'gradient' | 'image';
  bgValue: string;
}

export interface User {
  name: string;
  avatar?: string;
} 