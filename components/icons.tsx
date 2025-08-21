
import React from 'react';

const iconProps = {
	className: "w-8 h-8 text-gray-300",
	strokeWidth: "1.5",
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
};

export const FileIcon = (): React.ReactNode => (
	<svg {...iconProps}>
		<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
		<polyline points="14 2 14 8 20 8"></polyline>
		<line x1="16" y1="13" x2="8" y2="13"></line>
		<line x1="16" y1="17" x2="8" y2="17"></line>
		<polyline points="10 9 9 9 8 9"></polyline>
	</svg>
);

export const ImageIcon = (): React.ReactNode => (
	<svg {...iconProps}>
		<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
		<circle cx="8.5" cy="8.5" r="1.5"></circle>
		<polyline points="21 15 16 10 5 21"></polyline>
	</svg>
);

export const VideoIcon = (): React.ReactNode => (
	<svg {...iconProps}>
		<polygon points="23 7 16 12 23 17 23 7"></polygon>
		<rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
	</svg>
);

export const PdfIcon = (): React.ReactNode => (
	<svg {...iconProps}>
		<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
		<polyline points="14 2 14 8 20 8"></polyline>
		<path d="M10 12h4"></path><path d="M10 16h4"></path><path d="M8 12h.01"></path><path d="M8 16h.01"></path>
	</svg>
);

export const ZipIcon = (): React.ReactNode => (
	<svg {...iconProps}>
		<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
		<polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
		<line x1="12" y1="22.08" x2="12" y2="12"></line>
	</svg>
);

export const LinkIcon = (): React.ReactNode => (
	<svg {...iconProps}>
		<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path>
		<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path>
	</svg>
);

export const ExcelIcon = (): React.ReactNode => (
	<svg {...iconProps} className="w-8 h-8 text-green-400">
		<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
		<polyline points="14 2 14 8 20 8"></polyline>
		<path d="M8 13h8"></path>
		<path d="M8 17h8"></path>
		<path d="M8 9h8"></path>
	</svg>
);
