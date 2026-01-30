export interface Post {
  id: string;
  user_id: string;
  tweet_id: string;
  tweet_url: string;
  author_handle: string | null;
  author_name: string | null;
  author_avatar: string | null;
  content: string | null;
  media: MediaItem[] | null;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  group_id: string | null;
  created_at: string;
}

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
}

export interface Group {
  id: string;
  user_id: string;
  name: string;
  color: string;
  position_x: number;
  position_y: number;
  created_at: string;
}

export interface CanvasState {
  x: number;
  y: number;
  scale: number;
}

export interface TextNote {
  id: string;
  user_id: string;
  content: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  font_size: number;
  color: string;
  created_at: string;
}

export interface Connection {
  id: string;
  user_id: string;
  from_id: string;
  from_type: 'post' | 'textNote';
  to_id: string;
  to_type: 'post' | 'textNote';
  created_at: string;
}

export type PortDirection = 'top' | 'right' | 'bottom' | 'left';

export interface PostCreateInput {
  tweet_id: string;
  tweet_url: string;
  author_handle?: string;
  author_name?: string;
  author_avatar?: string;
  content?: string;
  media?: MediaItem[];
  position_x?: number;
  position_y?: number;
}
