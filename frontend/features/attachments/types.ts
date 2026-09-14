export interface AttachmentRecord {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
  uploader: { id: string; fullName: string };
}
