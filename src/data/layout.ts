import {departments} from '../catalogue/departments.ts';
export interface SectionDefinition { id: number; label: string; x: number; z: number }
export const sections: SectionDefinition[] = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1, label: departments[i].shortName,
  x: i < 4 ? -8 : 8, z: -7 - (i % 4) * 8,
}));
export const fixtures = sections.flatMap(s => [-2.2, 2.2].map(offset => ({ x: s.x + offset, z: s.z })));
export const START = { x: 0, y: 1.65, z: 12 };
export const EYE_OFFSET = 0.75;
