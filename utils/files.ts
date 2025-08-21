import React from 'react';
import { FileIcon, ImageIcon, LinkIcon, PdfIcon, VideoIcon, ZipIcon, ExcelIcon } from '../components/icons';

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Função para verificar se é arquivo Excel
const isExcelFile = (fileType: string, fileName: string = '') => {
  const excelMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
  ];
  const excelExtensions = ['.xlsx', '.xls', '.csv'];
  return excelMimes.includes(fileType) || excelExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
};

export function getFileIcon(fileType: string, fileName: string = ''): React.ReactNode {
  // Arquivos Excel
  if (isExcelFile(fileType, fileName)) {
    return React.createElement(ExcelIcon);
  }
  if (fileType.startsWith('image/')) {
    return React.createElement(ImageIcon);
  }
  if (fileType.startsWith('video/')) {
    return React.createElement(VideoIcon);
  }
  if (fileType === 'application/pdf') {
    return React.createElement(PdfIcon);
  }
  if (fileType === 'application/zip' || fileType === 'application/x-zip-compressed') {
    return React.createElement(ZipIcon);
  }
  if (fileType === 'link') {
    return React.createElement(LinkIcon);
  }
  return React.createElement(FileIcon);
}