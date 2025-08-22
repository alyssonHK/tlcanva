import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../contexts/supabaseClient';
import { Tldraw, Editor, TldrawProps } from '@tldraw/tldraw';
import { FileCardShapeUtil } from './FileCardShapeUtil';
import { useFileHandlers } from '../hooks/useFileHandlers';
import { Toast } from './Toast';
import { Header } from './Header';
import { deleteFile } from '../services/uploadService';
import { FileCardShape } from '../types';

const customShapeUtils = [FileCardShapeUtil];

// Função para obter o usuário logado (Supabase)
async function getCurrentUser() {
	const { data: { user } } = await supabase.auth.getUser();
	return user;
}

export function Canvas(): React.ReactNode {
	const [initialStore, setInitialStore] = useState<any | null>(null);
	const [editor, setEditor] = useState<Editor | null>(null);
	const [error, setError] = useState<string | null>(null);

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
		for (const shape of deletedShapes) {
			if (shape.type === 'file-card' && shape.props.url) {
				const filename = extractFilenameFromUrl(shape.props.url);
				if (filename) {
					try {
						await deleteFile(filename);
						console.log(`File ${filename} deleted from server`);
					} catch (error) {
						console.error('Error deleting file from server:', error);
						// Não mostrar erro ao usuário para não atrapalhar a UX
					}
				}
			}
		}
	}, []);

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



			// Carregar store salvo do usuário ao montar
			useEffect(() => {
				(async () => {
					const user = await getCurrentUser();
					if (!user) return;
					const { data, error } = await supabase
						.from('canvases')
						.select('layout_data')
						.eq('user_id', user.id)
						.single();
					if (data && data.layout_data) {
						setInitialStore(data.layout_data);
					}
				})();
			}, []);

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
			};

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