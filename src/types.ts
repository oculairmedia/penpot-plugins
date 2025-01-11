import { Shape, Penpot } from '@penpot/plugin-types';

// Declare penpot as an ambient variable
declare const penpot: Penpot;

// Define Stroke interface
export interface Stroke {
  strokeColor: string;
  strokeOpacity: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted' | 'mixed';
  strokeWidth: number;
  strokeAlignment: 'center' | 'inner' | 'outer';
  strokeCapEnd: 'none' | 'round' | 'square';
  strokeCapStart: 'none' | 'round' | 'square';
}

export type ShapeType = "boolean" | "group" | "board" | "rectangle" | "path" | "text" | "ellipse" | "svg-raw" | "image";

export interface TemplateElement {
  id: string;
  type: ShapeType;
  name: string;
  data: Shape;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  boardId?: string;
  elements: TemplateElement[];
}

export interface TemplateModification {
  elementId: string;
  properties: Record<string, any>;
}

export interface ExportOptions {
  type: 'svg' | 'png' | 'jpeg' | 'pdf';
  scale?: number;
  suffix?: string;
}