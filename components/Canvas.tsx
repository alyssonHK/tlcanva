import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../contexts/supabaseClient';
import { Tldraw, Editor, TldrawProps, createShapeId } from '@tldraw/tldraw';
import { FileCardShapeUtil } from './FileCardShapeUtil';
import { WebPageShapeUtil } from './WebPageShapeUtil';
import { useFileHandlers } from '../hooks/useFileHandlers';
import { Toast } from './Toast';
import { Header } from './Header';
import { deleteFile } from '../services/uploadService';
import { FileCardShape } from '../types';

const customShapeUtils = [FileCardShapeUtil, WebPageShapeUtil];
// Utilitário para criar shape de página web
function makeWebPageShape({ url }, idx = 0) {
	return {
		id: createShapeId(),
		type: 'web-page',
		x: 120 + idx * 40,
		y: 120 + idx * 40,
		props: {
			w: 600,
			h: 400,
			url,
		},
	};
}



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

	const fileHandlers = useFileHandlers(editor, onError, async () => {
		// Callback executado quando um arquivo é adicionado
		// Força o salvamento imediato do layout
		if (editor) {
			try {
				const user = await getCurrentUser();
				if (user) {
					const storeData = editor.store.serialize();
					await supabase.from('canvases').upsert({
						user_id: user.id,
						layout_data: storeData,
						updated_at: new Date().toISOString(),
					});
					console.log('Layout salvo após adicionar arquivo');
				}
			} catch (error) {
				console.error('Erro ao salvar após adicionar arquivo:', error);
			}
		}
	});

	// Extrai o caminho do objeto no Storage a partir de uma public URL do Supabase
	// Ex.: https://<proj>.supabase.co/storage/v1/object/public/uploads/<userId>/<filename>
	// Retorna: <userId>/<filename>
	const extractStoragePathFromUrl = (url: string): string | null => {
		try {
			const urlObj = new URL(url);
			const idx = urlObj.pathname.indexOf('/uploads/');
			if (idx === -1) return null;
			const rest = urlObj.pathname.substring(idx + '/uploads/'.length);
			return decodeURIComponent(rest);
		} catch (e) {
			console.error('Invalid URL for storage path extraction', e);
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
				const storagePath = extractStoragePathFromUrl(shape.props.url);
				if (storagePath) {
					deleteFile(storagePath)
						.then(() => {
							console.log(`File ${storagePath} deleted from storage`);
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

		// Migração: converter shapes antigas do tipo 'web-page' que apontam para
		// a mesma origem da aplicação em 'file-card' para evitar um canvas dentro do canvas.
		(async () => {
			try {
				const shapes = editor.getCurrentPageShapes();
				const webPageShapes = shapes.filter(s => s.type === 'web-page');
				if (webPageShapes.length === 0) return;
				const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
				let changed = false;
				for (const s of webPageShapes) {
					const url = (s as any).props?.url;
					if (!url) continue;
					try {
						const urlObj = new URL(url);
						if (urlObj.origin === currentOrigin) {
							// Criar um file-card no mesmo local e remover o web-page antigo
							editor.createShapes([
								{
									id: createShapeId(),
									type: 'file-card',
									x: (s as any).x ?? 100,
									y: (s as any).y ?? 100,
									props: {
										w: (s as any).props?.w ?? 300,
										h: (s as any).props?.h ?? 80,
										url: url,
										fileName: url,
										fileType: 'link',
										fileSize: 0,
										assetId: null,
									},
								},
							]);
							editor.deleteShapes([(s as any).id]);
							changed = true;
						}
					} catch (e) {
						// URL inválida - ignore
					}
				}
				if (changed) {
					// Salva novo layout do usuário
					const user = await getCurrentUser();
					if (user) {
						await supabase.from('canvases').upsert({
							user_id: user.id,
							layout_data: editor.store.serialize(),
							updated_at: new Date().toISOString(),
						});
					}
				}
			} catch (err) {
				console.error('Erro ao migrar web-page shapes:', err);
			}
		})();
		
		// Adicionar salvamento antes de sair da página
		const handleBeforeUnload = async () => {
			try {
				const storeData = editor.store.serialize();
				const user = await getCurrentUser();
				if (user) {
					// Usa sendBeacon para garantir que seja enviado mesmo quando a página está fechando
					const data = {
						user_id: user.id,
						layout_data: storeData,
						updated_at: new Date().toISOString(),
					};
					
					// Fallback para fetch síncrono se sendBeacon não estiver disponível
					await supabase.from('canvases').upsert(data);
				}
			} catch (error) {
				console.error('Erro ao salvar antes de sair:', error);
			}
		};
		
		window.addEventListener('beforeunload', handleBeforeUnload);
		window.addEventListener('pagehide', handleBeforeUnload);
		
		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
			window.removeEventListener('pagehide', handleBeforeUnload);
		};
	};

	// Forçar idioma inglês para evitar avisos de tradução pt-br incompleta
	useEffect(() => {
		const originalLanguage = navigator.language;
		Object.defineProperty(navigator, 'language', {
			writable: true,
			value: 'en-US'
		});
		return () => {
			Object.defineProperty(navigator, 'language', {
				writable: true,
				value: originalLanguage
			});
		};
	}, []);

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
			if (!user) { 
				setLoading(false); 
				return; 
			}
			
			try {
				// Buscar layout salvo do usuário
				const { data, error } = await supabase
					.from('canvases')
					.select('layout_data')
					.eq('user_id', user.id)
					.single();
				
				if (error && error.code !== 'PGRST116') {
					// PGRST116 = registro não encontrado (primeira vez do usuário)
					console.error('Erro ao carregar layout:', error);
				}
				
				if (data && data.layout_data) {
					console.log('Layout carregado do banco:', Object.keys(data.layout_data).length, 'itens');
					setInitialStore(data.layout_data);
				} else {
					console.log('Nenhum layout salvo encontrado - novo usuário');
					setInitialStore(null);
				}
			} catch (error) {
				console.error('Erro ao carregar layout:', error);
				setInitialStore(null);
			}
			
			setLoading(false);
		})();
	}, []);

	// Após montar o editor, sincronizar arquivos do bucket com shapes do canvas
		useEffect(() => {
			if (!editor) return;
			(async () => {
				const user = await getCurrentUser();
				if (!user) return;
				// Listar arquivos apenas da pasta do usuário
				const { data: filesData } = await supabase.storage.from('uploads').list(user.id + '/', { limit: 100 });
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
					const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(user.id + '/' + file.name);
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
					await supabase.from('canvases').upsert({
						user_id: user.id,
						layout_data: editor.store.serialize(),
						updated_at: new Date().toISOString(),
					});
				}
			})();
		}, [editor]);

	// Salvar store serializado sempre que houver mudança (com debounce)
	useEffect(() => {
		if (!editor) return;
		
		let saveTimeout: NodeJS.Timeout;
		
		const saveListener = () => {
			// Debounce para evitar muitas salvadas seguidas
			clearTimeout(saveTimeout);
			saveTimeout = setTimeout(async () => {
				try {
					const storeData = editor.store.serialize();
					const user = await getCurrentUser();
					if (!user) return;
					
					// Salva no Supabase com upsert para garantir que sempre funcione
					const { error } = await supabase.from('canvases').upsert({
						user_id: user.id,
						layout_data: storeData,
						updated_at: new Date().toISOString(),
					});
					
					if (error) {
						console.error('Erro ao salvar layout:', error);
					} else {
						console.log('Layout salvo com sucesso');
					}
				} catch (error) {
					console.error('Erro ao salvar layout:', error);
				}
			}, 500); // Aguarda 500ms após a última mudança
		};
		
		const unsubscribe = editor.store.listen(saveListener);
		return () => {
			clearTimeout(saveTimeout);
			unsubscribe();
		};
	}, [editor]);

	const tldrawProps: TldrawProps = {
		shapeUtils: customShapeUtils,
		onMount: handleMount,
		persistenceKey: undefined, // Desativa localStorage
		initialData: initialStore || undefined,
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
