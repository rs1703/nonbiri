declare interface Entity {
  id: string;
  name?: string;
}

declare type Author = Entity;
declare type Artists = Entity;
declare type Group = Entity;
declare type Tag = Entity;
