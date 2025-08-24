import { BaseBoxShapeUtil, HTMLContainer, T, Rectangle2d } from '@tldraw/tldraw';
import { FileCardShape } from '../types';
import { FileCard } from './FileCard';
import React from 'react';

export class FileCardShapeUtil extends BaseBoxShapeUtil<FileCardShape> {
	static override type = 'file-card' as const;

	static override props = {
		w: T.number,
		h: T.number,
		url: T.string,
		fileName: T.string,
		fileType: T.string,
		fileSize: T.number,
		assetId: T.string.nullable(),
	};

	override canResize = (_shape: FileCardShape) => true;
	override canBind = () => false;

	override getDefaultProps(): FileCardShape['props'] {
		return {
			w: 400,
			h: 300,
			url: '',
			fileName: 'file.txt',
			fileType: 'text/plain',
			fileSize: 0,
			assetId: null,
		};
	}
	
	override getGeometry(shape: FileCardShape) {
		return new Rectangle2d({ 
			width: shape.props.w, 
			height: shape.props.h, 
			x: 0, 
			y: 0, 
			isFilled: true 
		});
	}

	override component(shape: FileCardShape): React.ReactNode {
		return (
			<HTMLContainer
				id={shape.id}
				style={{
					overflow: 'hidden',
					backgroundColor: '#2D3748',
					border: '1px solid #4A5568',
					borderRadius: '8px',
					pointerEvents: 'all',
				}}
			>
				<FileCard
					url={shape.props.url}
					fileName={shape.props.fileName}
					fileType={shape.props.fileType}
					fileSize={shape.props.fileSize}
				/>
			</HTMLContainer>
		);
	}

	override indicator(shape: FileCardShape): React.ReactNode {
		return <rect width={shape.props.w} height={shape.props.h} />;
	}

	override onDoubleClick = (shape: FileCardShape) => {
		if (shape.props.url) {
			window.open(shape.props.url, '_blank');
		}
	}
}
