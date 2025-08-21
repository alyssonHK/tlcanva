import { TLBaseShape } from '@tldraw/tldraw';

export const FILE_CARD_TYPE = 'file-card' as const;

export type FileCardShape = TLBaseShape<
	typeof FILE_CARD_TYPE,
	{
		w: number
		h: number
		url: string
		fileName: string
		fileType: string
		fileSize: number
		assetId: string | null
	}
>;

export interface UploadedFile {
    url: string;
    name: string;
    mimeType: string;
    size: number;
}
