import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../contexts/supabaseClient';
import { Tldraw, Editor, TldrawProps, createShapeId } from '@tldraw/tldraw';
import { FileCardShapeUtil } from './FileCardShapeUtil';
import { useFileHandlers } from '../hooks/useFileHandlers';
import { Toast } from './Toast';
import { Header } from './Header';
import { deleteFile } from '../services/uploadService';
import { FileCardShape } from '../types';

const customShapeUtils = [FileCardShapeUtil];

// Utilitário para criar shape de arquivo
function makeFileCardShape({ url, name, mimeType, size }, idx = 0) {
	return {
		id: createShapeId(),
		type: 'file-card',
		x: 100 + idx * 40,
		y: 100 + idx * 40,
		props: {
			w: 300,
			h: 80,
			url,
			fileName: name,
			fileType: mimeType,
			fileSize: size,
			assetId: null,
		},
	};
}

// Função para obter o usuário logado (Supabase)
async function getCurrentUser() {
	const { data: { user } } = await supabase.auth.getUser();
	return user;
}

export function Canvas(): React.ReactNode {
	const [initialStore, setInitialStore] = useState<any | null>(null);
	const [editor, setEditor] = useState<Editor | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const onError = (message: string) => {
		setError(message);
		setTimeout(() => setError(null), 5000);
	};

	const fileHandlers = useFileHandlers(editor, onError);

const extractFilenameFromUrl = (url: string): string | null => {
    try {
        const urlObj = new URL(url);
        // O caminho do arquivo é a última parte do pathname
        const pathnameParts = urlObj.pathname.split('/');
        return pathnameParts[pathnameParts.length - 1] || null;
    } catch (e) {
        console.error("Invalid URL for filename extraction", e);
        return null;
    }
};

	const handleShapeDelete = useCallback(async (deletedShapes: FileCardShape[]) => {
		// Remove shape do canvas imediatamente (já é feito pelo editor.deleteShapes)
		// Salva novo layout sem as shapes deletadas
		if (editor && deletedShapes.length > 0) {
			const user = await getCurrentUser();
			if (user) {
				await supabase.from('canvases').upsert({
					user_id: user.id,
					layout_data: editor.store.serialize(),
					updated_at: new Date().toISOString(),
				});
			}
		}
		// Exclui arquivos do Supabase em background
		for (const shape of deletedShapes) {
			if (shape.type === 'file-card' && shape.props.url) {
				const filename = extractFilenameFromUrl(shape.props.url);
				if (filename) {
					deleteFile(filename)
						.then(() => {
							console.log(`File ${filename} deleted from server`);
						})
						.catch((error) => {
							console.error('Error deleting file from server:', error);
							if (typeof onError === 'function') {
								onError('Erro ao excluir arquivo do servidor.');
							}
						});
				}
			}
		}
	}, [editor, onError]);

	const handleMount = (editor: Editor) => {
		setEditor(editor);
	};

	useEffect(() => {
		if (!editor) return;

		editor.registerExternalContentHandler('files', fileHandlers.onFileDrop);
		editor.registerExternalContentHandler('url', fileHandlers.onUrlDrop);

		// Adicionar listener para detectar quando shapes são deletadas
		const handleShapeChange = () => {
			const currentShapes = editor.getCurrentPageShapes();
			const currentFileCardShapes = currentShapes.filter(shape => shape.type === 'file-card') as FileCardShape[];
			
			// Verificar se alguma shape foi deletada comparando com o estado anterior
			const previousShapes = (window as any).previousFileCardShapes || [];
			const deletedShapes = previousShapes.filter((prevShape: FileCardShape) => 
				!currentFileCardShapes.some(currentShape => currentShape.id === prevShape.id)
			);

			if (deletedShapes.length > 0) {
				handleShapeDelete(deletedShapes);
			}

			// Atualizar o estado anterior
			(window as any).previousFileCardShapes = currentFileCardShapes;
		};

		// Escutar mudanças no store
		const unsubscribe = editor.store.listen(handleShapeChange);

		return () => {
			unsubscribe();
		};
	}, [editor, fileHandlers.onFileDrop, fileHandlers.onUrlDrop, handleShapeDelete]);



					// Carregar store salvo do usuário
						useEffect(() => {
							(async () => {
								const user = await getCurrentUser();
								if (!user) { setLoading(false); return; }
								// Buscar layout salvo
								let layoutData = null;
								const { data, error } = await supabase
									.from('canvases')
									.select('layout_data')
									.eq('user_id', user.id)
									.single();
								if (data && data.layout_data) {
									layoutData = data.layout_data;
								}
								setInitialStore(layoutData);
								setLoading(false);
							})();
						}, []);

					// Após montar o editor, sincronizar arquivos do bucket com shapes do canvas
					useEffect(() => {
						if (!editor) return;
						(async () => {
									const { data: filesData } = await supabase.storage.from('uploads').list('', { limit: 100 });
									if (!filesData || !Array.isArray(filesData)) return;
									// Filtrar placeholder 'empty folder'
									const realFiles = filesData.filter(f => f.name && f.name !== '.emptyFolderPlaceholder');
									// Mapear URLs já presentes no canvas (apenas file-card)
									const shapes = editor.getCurrentPageShapes();
									const urlsInLayout = new Set(
										shapes
											.filter(s => s.type === 'file-card')
											.map(s => (s as FileCardShape).props.url)
									);
									// Adicionar shapes para arquivos não referenciados
									let added = false;
									for (let i = 0; i < realFiles.length; i++) {
										const file = realFiles[i];
										if (!file.name) continue;
										const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(file.name);
										if (!urlsInLayout.has(publicUrlData.publicUrl)) {
											// Criar shape usando a API do editor
											editor.createShapes([
												makeFileCardShape({
													url: publicUrlData.publicUrl,
													name: file.name,
													mimeType: file.metadata?.mimetype || '',
													size: file.metadata?.size || 0,
												}, i)
											]);
											added = true;
										}
									}
									// Se shapes foram adicionadas, salvar novo layout
									if (added) {
										const user = await getCurrentUser();
										if (user) {
											await supabase.from('canvases').upsert({
												user_id: user.id,
												layout_data: editor.store.serialize(),
												updated_at: new Date().toISOString(),
											});
										}
									}
								})();
							}, [editor]);

			// Salvar store serializado sempre que houver mudança
			useEffect(() => {
				if (!editor) return;
				const saveListener = () => {
					const storeData = editor.store.serialize();
					(async () => {
						const user = await getCurrentUser();
						if (!user) return;
						await supabase.from('canvases').upsert({
							user_id: user.id,
							layout_data: storeData,
							updated_at: new Date().toISOString(),
						});
					})();
				};
				const unsubscribe = editor.store.listen(saveListener);
				return () => unsubscribe();
			}, [editor]);

					const tldrawProps: TldrawProps = {
						shapeUtils: customShapeUtils,
						onMount: handleMount,
						persistenceKey: undefined, // Desativa localStorage
						initialData: initialStore || undefined,
						locale: 'en', // Força idioma inglês para evitar avisos de tradução
					};

				if (loading) {
					return (
						<div className="w-full h-full flex items-center justify-center">
							<p className="text-lg text-gray-500">Carregando canvas...</p>
						</div>
					);
				}

				return (
					<div className="fixed inset-0">
						<Header />
						<div className="pt-16 h-full">
							<Tldraw {...tldrawProps} />
						</div>
						{error && <Toast message={error} />}
					</div>
				);
}