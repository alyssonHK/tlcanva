import { Editor, getEmbedInfo, createShapeId, TLExternalContent } from '@tldraw/tldraw';
import { useCallback } from 'react';
import { FILE_CARD_TYPE, UploadedFile } from '../types';
import { uploadFile } from '../services/uploadService';

const isImage = (file: File) => /image/.test(file.type);
const isVideo = (file: File) => /video/.test(file.type);

// Função para verificar se é arquivo Excel
const isExcelFile = (mimeType: string, fileName: string) => {
	const excelMimes = [
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
		'application/vnd.ms-excel', // .xls
		'text/csv', // .csv
	];
	const excelExtensions = ['.xlsx', '.xls', '.csv'];
	return excelMimes.includes(mimeType) || excelExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
};

// Função para determinar o tamanho ideal baseado no tipo de arquivo
const getFileDimensions = (fileType: string, fileName: string = '') => {
	// Arquivos Excel
	if (isExcelFile(fileType, fileName)) {
		return { w: 600, h: 400 };
	}
	if (fileType.startsWith('image/') || fileType.startsWith('video/')) {
		return { w: 400, h: 300 };
	}
	if (fileType === 'application/pdf') {
		return { w: 500, h: 400 };
	}
	if (fileType.startsWith('text/')) {
		return { w: 400, h: 300 };
	}
	if (fileType.startsWith('audio/')) {
		return { w: 350, h: 150 };
	}
	// Tamanho padrão para outros tipos
	return { w: 300, h: 80 };
};

export function useFileHandlers(editor: Editor | null, onError: (message: string) => void, onFileAdded?: () => void) {
	const onFileDrop = useCallback(
		async (info: TLExternalContent) => {
			if (!editor || info.type !== 'files') return;

			const point = info.point ?? editor.getViewportScreenCenter();

			for (let i = 0; i < info.files.length; i++) {
				const file = info.files[i];
				const offsetPoint = { x: point.x + i * 12, y: point.y + i * 12 };
				const dimensions = getFileDimensions(file.type, file.name);

				// Show a temporary "uploading" card. This is for UX.
				const tempId = createShapeId();
				editor.createShapes([
					{
						id: tempId,
						type: FILE_CARD_TYPE,
						x: offsetPoint.x,
						y: offsetPoint.y,
						props: {
							w: dimensions.w,
							h: dimensions.h,
							url: '',
							fileName: `Uploading ${file.name}...`,
							fileType: file.type,
							fileSize: file.size,
							assetId: null,
						},
					},
				]);
				
				try {
					// Upload all files and create custom file cards
					const uploadedFile: UploadedFile = await uploadFile(file);
					
					editor.updateShapes([
						{
							id: tempId,
							type: FILE_CARD_TYPE,
							props: {
								w: dimensions.w,
								h: dimensions.h,
								url: uploadedFile.url,
								fileName: uploadedFile.name,
								fileType: uploadedFile.mimeType,
								fileSize: uploadedFile.size,
							},
						},
					]);
					
					// Notifica que um arquivo foi adicionado para salvar o layout
					onFileAdded?.();
				} catch (err: unknown) {
					const message = err instanceof Error ? err.message : 'An unknown error occurred during upload.';
					console.error('Upload failed:', message);
					onError(message);
					editor.deleteShapes([tempId]); // Remove temp card on error
				}
			}
		},
		[editor, onError, onFileAdded]
	);

	const onUrlDrop = useCallback(
		(info: TLExternalContent) => {
			if (!editor || info.type !== 'url') return;
			const point = info.point ?? editor.getViewportScreenCenter();
			const { url } = info;

			const embedInfo = getEmbedInfo(url);

			if (embedInfo) {
				editor.createShapes([
					{
						type: 'embed',
						x: point.x,
						y: point.y,
						props: {
							w: embedInfo.definition.width ?? 640,
							h: embedInfo.definition.height ?? 480,
							url: embedInfo.embedUrl,
						},
					},
				]);
			} else {
							// Se for uma URL http(s), criar shape do tipo 'web-page' para iframe interativo
							if (/^https?:\/\//.test(url)) {
								editor.createShapes([
									{
										type: 'web-page',
										x: point.x,
										y: point.y,
										props: {
											w: 600,
											h: 400,
											url: url,
										},
									},
								]);
							} else {
								// fallback: file-card para outros links
								const linkDimensions = getFileDimensions('link', url);
								editor.createShapes([
									{
										type: FILE_CARD_TYPE,
										x: point.x,
										y: point.y,
										props: {
											w: linkDimensions.w,
											h: linkDimensions.h,
											url: url,
											fileName: url,
											fileType: 'link',
											fileSize: 0,
											assetId: null,
										},
									},
								]);
							}
			}
		},
		[editor]
	);
	
	return { onFileDrop, onUrlDrop };
}
