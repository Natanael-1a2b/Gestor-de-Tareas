export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  isFavorite: boolean;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
}
