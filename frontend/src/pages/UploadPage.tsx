import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, FileCode, File, X, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Tag as TagIcon } from 'lucide-react';
import { api } from '../services/api';
import type { ToastMessage } from '../components/Toast';

interface UploadPageProps {
  setToast: (toast: ToastMessage | null) => void;
}

interface FileItem {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

export const UploadPage: React.FC<UploadPageProps> = ({ setToast }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileList, setFileList] = useState<FileItem[]>([]);
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const allowedTypes = ['.pdf', '.docx', '.doc', '.txt', '.md'];

  const validateAndAddFiles = (files: FileList | File[]) => {
    const newItems: FileItem[] = [];
    const invalidFiles: string[] = [];

    Array.from(files).forEach((file) => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedTypes.includes(ext)) {
        invalidFiles.push(file.name);
        return;
      }
      newItems.push({
        file,
        id: `${Date.now()}-${Math.random()}`,
        status: 'pending',
      });
    });

    if (invalidFiles.length > 0) {
      setToast({
        type: 'error',
        id: Date.now().toString(),
        text: `Unsupported format for ${invalidFiles.join(', ')}. Allowed: PDF, DOCX, TXT, MD.`,
      });
    }

    setFileList((prev) => [...prev, ...newItems]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (id: string) => {
    setFileList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleStartUpload = async () => {
    if (fileList.length === 0) return;

    setUploading(true);
    const rawFiles = fileList.map((f) => f.file);
    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    setFileList((prev) => prev.map((item) => ({ ...item, status: 'uploading' })));

    try {
      const uploadedDocs = await api.uploadDocuments(rawFiles, description, parsedTags);
      setFileList((prev) => prev.map((item) => ({ ...item, status: 'done' })));
      setToast({
        type: 'success',
        id: Date.now().toString(),
        text: `Successfully uploaded & indexed ${uploadedDocs.length} document(s).`,
      });
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Upload failed.';
      setFileList((prev) => prev.map((item) => ({ ...item, status: 'error', error: errorMsg })));
      setToast({
        type: 'error',
        id: Date.now().toString(),
        text: errorMsg,
      });
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-5 h-5 text-rose-400" />;
    if (ext === 'docx' || ext === 'doc') return <FileText className="w-5 h-5 text-sky-400" />;
    if (ext === 'txt' || ext === 'md') return <FileCode className="w-5 h-5 text-emerald-400" />;
    return <File className="w-5 h-5 text-indigo-400" />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Upload Documents</h1>
          <p className="text-slate-400 text-sm mt-1">
            Drag and drop your knowledge files for instant text extraction and indexing.
          </p>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-sky-500 bg-sky-500/10 scale-[1.01]'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900/90'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.txt,.md"
          onChange={(e) => e.target.files && validateAndAddFiles(e.target.files)}
          className="hidden"
        />

        <div className="w-16 h-16 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-sky-500/20">
          <Upload className="w-8 h-8 text-white" />
        </div>

        <h3 className="text-lg font-bold text-slate-200">
          Drag and drop files here or <span className="text-sky-400 underline">browse</span>
        </h3>
        <p className="text-xs text-slate-400 mt-2">
          Supported document types: PDF, DOCX, TXT, Markdown (.md) — Max 50MB per file
        </p>
      </div>

      {/* File Queue & Metadata Form */}
      {fileList.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6">
          <h3 className="text-sm font-semibold uppercase text-slate-400 tracking-wider">
            Selected Files ({fileList.length})
          </h3>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {fileList.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 bg-slate-950 rounded-2xl border border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                    {getFileIcon(item.file.name)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200 line-clamp-1">{item.file.name}</p>
                    <p className="text-xs text-slate-500 font-mono">
                      {(item.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {item.status === 'uploading' && (
                    <span className="text-xs text-amber-400 flex items-center gap-1">
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading & Extracting...
                    </span>
                  )}
                  {item.status === 'done' && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-4 h-4" /> Ready
                    </span>
                  )}
                  {item.status === 'error' && (
                    <span className="text-xs text-rose-400 flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-4 h-4" /> Failed
                    </span>
                  )}

                  {!uploading && (
                    <button
                      onClick={() => removeFile(item.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Metadata Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Optional Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={uploading}
                rows={2}
                placeholder="e.g. Unit 3 Computer Networks exam prep notes..."
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1">
                <TagIcon className="w-3.5 h-3.5 text-sky-400" />
                Optional Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                disabled={uploading}
                placeholder="e.g. CN, DAA, College, Research"
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setFileList([])}
              disabled={uploading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              Clear All
            </button>
            <button
              onClick={handleStartUpload}
              disabled={uploading || fileList.length === 0}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-lg shadow-sky-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing Documents...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Start Upload
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
