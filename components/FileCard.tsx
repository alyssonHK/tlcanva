import React, { useState } from 'react';
import { getFileIcon } from '../utils/files';
import { formatBytes } from '../utils/files';
import { InteractiveVideo } from './InteractiveVideo';
import { InteractivePDF } from './InteractivePDF';

interface FileCardProps {
	url: string;
	fileName: string;
	fileType: string;
	fileSize: number;
}

export const FileCard: React.FC<FileCardProps> = ({ url, fileName, fileType, fileSize }) => {
	const isUploading = fileName.startsWith('Uploading');
	const formattedSize = formatBytes(fileSize);
	const icon = getFileIcon(fileType, fileName);
	const [showPreview, setShowPreview] = useState(true);
	const [showModal, setShowModal] = useState(false);
	const [imageError, setImageError] = useState(false);

	const handleActionClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
		e.preventDefault();
		e.stopPropagation();
		if (url) {
			window.open(url, '_blank');
		}
	};

	const togglePreview = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		// Para links, abrimos um modal top-level ao invés de renderizar um iframe dentro do canvas
		if (fileType === 'link') {
			setShowModal(true);
			return;
		}
		setShowPreview(!showPreview);
	};

	const handleImageError = () => {
		setImageError(true);
	};

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

	// Função para renderizar conteúdo específico por tipo de arquivo
	const renderFileContent = () => {
		if (isUploading || !url || !showPreview) {
			return null;
		}

		// Arquivos Excel
		if (isExcelFile(fileType, fileName)) {
			return (
				<div className="w-full h-full overflow-hidden rounded">
					<ExcelViewer url={url} fileName={fileName} />
				</div>
			);
		}

		// Imagens
		if (fileType.startsWith('image/') && !imageError) {
			return (
				<div className="w-full h-full overflow-hidden rounded">
					<img
						src={url}
						alt={fileName}
						className="w-full h-full object-cover"
						onError={handleImageError}
						style={{ minHeight: '200px' }}
					/>
				</div>
			);
		}

		// Vídeos - Agora com componente interativo
		if (fileType.startsWith('video/')) {
			return (
				<div className="w-full h-full overflow-hidden rounded">
					<InteractiveVideo
						url={url}
						fileName={fileName}
						width={400}
						height={300}
					/>
				</div>
			);
		}

		// Áudio
		if (fileType.startsWith('audio/')) {
			return (
				<div className="w-full h-full flex items-center justify-center bg-gray-800 rounded">
					<div className="text-center">
						<div className="text-4xl mb-4">🎵</div>
						<audio src={url} controls className="w-full max-w-xs">
							Seu navegador não suporta áudio.
						</audio>
					</div>
				</div>
			);
		}

		// PDFs - Agora com componente interativo
		if (fileType === 'application/pdf') {
			return (
				<div className="w-full h-full overflow-hidden rounded">
					<InteractivePDF
						url={url}
						fileName={fileName}
						width={500}
						height={400}
					/>
				</div>
			);
		}

		// Documentos de texto simples
		if (fileType.startsWith('text/')) {
			return (
				<div className="w-full h-full bg-white text-black p-4 overflow-auto rounded">
					<TextFileViewer url={url} fileName={fileName} />
				</div>
			);
		}

		return null;
	};

	const fileContent = renderFileContent();
	const hasPreview = fileContent !== null;

	// Se tem preview e está mostrando o preview, renderiza o conteúdo do arquivo
	if (hasPreview && showPreview && !isUploading) {
		return (
			<>
			<div className="w-full h-full flex flex-col">
				{/* Header com nome do arquivo e ações, fora do preview */}
				<div
					className="w-full flex items-center justify-between px-2 pt-2 pb-1 bg-gray-800 cursor-move select-none"
					// Não faz stopPropagation aqui! Permite mover o card pelo TLDraw
					title="Clique e arraste aqui para mover"
				>
					<div className="flex flex-col flex-grow min-w-0">
						<p className="truncate font-medium text-sm text-white" title={fileName}>
							{fileName}
						</p>
						<p className="text-gray-400 text-xs">
							{fileType === 'link' ? 'Web Link' : `${fileType} - ${formattedSize}`}
						</p>
					</div>
					<div className="flex gap-1 ml-2">
						<button
							onClick={togglePreview}
							className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs"
							title="Mostrar cartão"
						>
							📄
						</button>
						{url && (
							<a
								href={url}
								target="_blank"
								rel="noopener noreferrer"
								download={fileType !== 'link' ? fileName : undefined}
								onClick={handleActionClick}
								className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
							>
								Open
							</a>
						)}
					</div>
				</div>
				{/* Preview do arquivo */}
				<div
					className="flex-1 flex min-h-0 min-w-0"
					onPointerDown={(e) => e.stopPropagation()}
					onPointerUp={(e) => e.stopPropagation()}
					onPointerMove={(e) => e.stopPropagation()}
					onClick={(e) => e.stopPropagation()}
				>
					{fileContent}
				</div>
			</div>
			{/* Modal top-level para links, posicionado fixed para ficar fora da área do canvas */}
			{showModal && (
				<div
					style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
					onClick={(e) => { e.stopPropagation(); setShowModal(false); }}
				>
					<div style={{ width: '90%', height: '90%', background: '#111', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
						<div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: '#1f2937', color: '#fff', gap: 8 }}>
							<span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</span>
							<div style={{ marginLeft: 'auto' }}>
								<button onClick={() => setShowModal(false)} style={{ background: '#ef4444', color: '#fff', borderRadius: 6, padding: '6px 10px', border: 'none', cursor: 'pointer' }}>Fechar</button>
							</div>
						</div>
						<div style={{ flex: 1, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
							<div style={{ textAlign: 'center', color: '#333' }}>
								<p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Visualização externa</p>
								<p style={{ marginBottom: 12, color: '#555' }}>Por segurança, esta visualização foi aberta fora do canvas. Abra em uma nova aba para ver o site completo.</p>
								<div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
									<button onClick={() => window.open(url, '_blank')} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}>Abrir em nova aba</button>
									<button onClick={() => setShowModal(false)} style={{ background: '#e5e7eb', color: '#111827', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}>Fechar</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
			</>
		);
	}

	// Renderização padrão (cartão)
	return (
		<div className="w-full h-full flex items-center p-3 text-white select-none">
			<div className="flex-shrink-0 w-12 h-12 flex items-center justify-center mr-3">
				{isUploading ? (
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
				) : (
					icon
				)}
			</div>
			<div className="flex-grow overflow-hidden">
				<p className="text-sm font-medium truncate" title={fileName}>
					{fileName}
				</p>
				<p className="text-xs text-gray-400">
					{fileType === 'link' ? 'Web Link' : `${fileType} - ${formattedSize}`}
				</p>
			</div>
			<div className="ml-3 flex gap-1">
				{hasPreview && !isUploading && (
					<button
						onClick={togglePreview}
						className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-3 rounded-md transition-colors duration-200"
						title="Visualizar arquivo"
					>
						👁️
					</button>
				)}
				{!isUploading && url && (
					<a
						href={url}
						target="_blank"
						rel="noopener noreferrer"
						download={fileType !== 'link' ? fileName : undefined}
						onClick={handleActionClick}
						className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-3 rounded-md transition-colors duration-200"
					>
						Open
					</a>
				)}
			</div>
		</div>
	);
};

// Componente para visualizar arquivos Excel
const ExcelViewer: React.FC<{ url: string; fileName: string }> = ({ url, fileName }) => {
	const [data, setData] = useState<any[][]>([]);
	const [sheets, setSheets] = useState<string[]>([]);
	const [activeSheet, setActiveSheet] = useState<string>('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string>('');

	React.useEffect(() => {
		const loadExcel = async () => {
			try {
				const XLSX = await import('xlsx');
				
				// Fazer download do arquivo
				const response = await fetch(url);
				if (!response.ok) {
					throw new Error('Falha ao carregar o arquivo');
				}
				
				const arrayBuffer = await response.arrayBuffer();
				const workbook = XLSX.read(arrayBuffer, { type: 'array' });
				
				const sheetNames = workbook.SheetNames;
				setSheets(sheetNames);
				setActiveSheet(sheetNames[0]);
				
				// Converter a primeira planilha para JSON
				const worksheet = workbook.Sheets[sheetNames[0]];
				const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
				setData(jsonData as any[][]);
				setLoading(false);
			} catch (err) {
				setError(`Erro ao carregar planilha: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
				setLoading(false);
			}
		};

		loadExcel();
	}, [url]);

	const handleSheetChange = async (sheetName: string) => {
		try {
			const XLSX = await import('xlsx');
			const response = await fetch(url);
			const arrayBuffer = await response.arrayBuffer();
			const workbook = XLSX.read(arrayBuffer, { type: 'array' });
			const worksheet = workbook.Sheets[sheetName];
			const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
			setData(jsonData as any[][]);
			setActiveSheet(sheetName);
		} catch (err) {
			setError(`Erro ao carregar aba: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
		}
	};

	if (loading) {
		return (
			<div className="w-full h-full flex items-center justify-center bg-white text-black">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
					<p>Carregando planilha...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="w-full h-full flex items-center justify-center bg-white text-red-600 p-4">
				<div className="text-center">
					<div className="text-4xl mb-2">⚠️</div>
					<p className="text-sm">{error}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full h-full bg-white text-black flex flex-col">
			{/* Header com seletor de abas */}
			<div className="p-2 border-b bg-gray-50 flex justify-between items-center">
				<h3 className="font-bold text-sm truncate">{fileName}</h3>
				{sheets.length > 1 && (
					<select 
						value={activeSheet} 
						onChange={(e) => handleSheetChange(e.target.value)}
						className="text-xs border rounded px-1 py-1"
					>
						{sheets.map(sheet => (
							<option key={sheet} value={sheet}>{sheet}</option>
						))}
					</select>
				)}
			</div>
			
			{/* Tabela */}
			<div className="flex-1 overflow-auto">
				<table className="w-full text-xs">
					<tbody>
						{data.map((row, rowIndex) => (
							<tr key={rowIndex} className={rowIndex === 0 ? 'bg-gray-100 font-semibold' : ''}>
								{Array.isArray(row) ? row.map((cell, colIndex) => (
									<td 
										key={colIndex} 
										className="border border-gray-300 px-2 py-1 max-w-32 truncate"
										title={String(cell || '')}
									>
										{String(cell || '')}
									</td>
								)) : (
									<td className="border border-gray-300 px-2 py-1">
										{String(row || '')}
									</td>
								)}
							</tr>
						))}
					</tbody>
				</table>
				
				{data.length === 0 && (
					<div className="flex items-center justify-center h-full text-gray-500">
						<p>Planilha vazia</p>
					</div>
				)}
			</div>
		</div>
	);
};

// Componente para visualizar arquivos de texto
const TextFileViewer: React.FC<{ url: string; fileName: string }> = ({ url, fileName }) => {
	const [content, setContent] = useState<string>('Carregando...');
	
	React.useEffect(() => {
		fetch(url)
			.then(response => response.text())
			.then(text => setContent(text))
			.catch(error => setContent(`Erro ao carregar arquivo: ${error.message}`));
	}, [url]);

	return (
		<div className="h-full overflow-auto">
			<h3 className="font-bold mb-2 text-sm">{fileName}</h3>
			<pre className="whitespace-pre-wrap text-xs font-mono">{content}</pre>
		</div>
	);
};
