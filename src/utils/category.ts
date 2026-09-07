import type { Category } from '../types';

export function getCategorySlug(category?: Category): string {
  return category ? category.toLowerCase() : 'sin-categoria';
}

export function getCategoryLabel(category?: Category): string {
  return category ?? 'Sin categoría';
}
