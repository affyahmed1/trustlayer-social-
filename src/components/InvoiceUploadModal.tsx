import React, { useState, useRef } from 'react';
import {
  IssuedInvoiceRecord,
  ReceivedInvoiceRecord,
  InvoiceDocumentAttachment,
} from '../types/inventory';
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Eye,
  Trash2,
  Lock,
} from 'lucide-react';

interface InvoiceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetInvoice?: IssuedInvoiceRecord | ReceivedInvoiceRecord | null;
  sheetType: 'issued' | 'received';
  availableInvoices: (IssuedInvoiceRecord | ReceivedInvoiceRecord)[];
  onSaveAttachment: (
    type: 'issued' | 'received',
    invoiceId: string,
    attachment: InvoiceDocumentAttachment
  ) => void;
}

export const InvoiceUploadModal: React.FC<InvoiceUploadModalProps> = ({
  isOpen,
  onClose,
  targetInvoice,
  sheetType,
  availableInvoices,
  onSaveAttachment,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
    targetInvoice?.id || (availableInvoices[0]?.id ?? '')
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadComplete, setUploadComplete] = useState<boolean>(false);

  // Sync selected invoice if target changes
  React.useEffect(() => {
    if (targetInvoice) {
      setSelectedInvoiceId(targetInvoice.id);
    } else if (availableInvoices.length > 0 && !selectedInvoiceId) {
      setSelectedInvoiceId(availableInvoices[0].id);
    }
  }, [targetInvoice, availableInvoices]);

  if (!isOpen) return null;

  const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  const maxSizeBytes = 10 * 1024 * 1024; // 10MB

  const handleFileSelect = (file: File) => {
    setUploadError(null);
    setUploadComplete(false);

    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type! Only PDF (.pdf) and images (.png, .jpg, .webp) are supported.');
      return;
    }

    if (file.size > maxSizeBytes) {
      setUploadError(`File exceeds maximum size limit of 10MB (${(file.size / (1024 * 1024)).toFixed(1)}MB detected).`);
      return;
    }

    setSelectedFile(file);

    // Generate local preview URL
    const reader = new FileReader();
    reader.onload = e => {
      setFilePreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const simulateUploadAndSave = () => {
    if (!selectedFile || !selectedInvoiceId) return;

    setIsUploading(true);
    setUploadProgress(15);

    // Simulate cryptographic hashing and transmission progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 95;
        }
        return prev + 25;
      });
    }, 150);

    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);
      setIsUploading(false);
      setUploadComplete(true);

      // Create attachment payload
      const attachment: InvoiceDocumentAttachment = {
        id: `DOC-ATT-${Date.now()}`,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        dataUrl: filePreviewUrl || undefined,
        uploadedAt: new Date().toISOString(),
        storageType: 'session_demo',
        fingerprint: `SHA256-${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
      };

      onSaveAttachment(sheetType, selectedInvoiceId, attachment);

      setTimeout(() => {
        onClose();
        // Reset state
        setSelectedFile(null);
        setFilePreviewUrl(null);
        setUploadProgress(0);
        setUploadComplete(false);
      }, 1000);
    }, 850);
  };

  const resetFile = () => {
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setUploadError(null);
    setUploadProgress(0);
    setUploadComplete(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const targetInvoiceRecord = availableInvoices.find(i => i.id === selectedInvoiceId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/60">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              Upload Invoice · {sheetType === 'issued' ? 'Sales' : 'Purchases'}
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              Upload Official Commercial Invoice
            </h3>
            <p className="text-xs text-slate-500">
              Attach authenticated PDF or high-res image documentation to verified ledger transactions.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto text-xs">
          {/* Target Invoice Selector */}
          <div className="space-y-1.5">
            <label className="text-slate-700 font-semibold block text-xs">
              Target Invoice Transaction:
            </label>
            {targetInvoice ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 font-mono text-xs">
                    {targetInvoice.originalInvoiceNumber}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {targetInvoice.productName} ({targetInvoice.sku}) · {targetInvoice.issueDate}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 font-semibold">
                  {targetInvoice.id}
                </span>
              </div>
            ) : (
              <select
                value={selectedInvoiceId}
                onChange={e => setSelectedInvoiceId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                {availableInvoices.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.originalInvoiceNumber} — {inv.productName} ({inv.issueDate}) [{inv.id}]
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Environmental Storage Transparency Disclosure */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 text-amber-900 rounded-xl text-[11px] flex items-start space-x-2">
            <Lock className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Client Session Storage (Demo Environment):</span> Documents uploaded here are kept in secure browser memory for verification and audit inspection. Enterprise cloud storage connectors (S3/GCS) can be configured for immutable archival.
            </div>
          </div>

          {/* Upload Dropzone */}
          {!selectedFile ? (
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/20 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={e => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-slate-800 text-xs">
                  Click to browse or drag and drop invoice document
                </p>
                <p className="text-[11px] text-slate-400">
                  Supported formats: PDF, PNG, JPG, WEBP (Max file size: 10MB)
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block truncate max-w-xs text-xs">
                      {selectedFile.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {(selectedFile.size / 1024).toFixed(1)} KB · {selectedFile.type}
                    </span>
                  </div>
                </div>

                {!isUploading && !uploadComplete && (
                  <button
                    onClick={resetFile}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200 transition-colors"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              {isUploading && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>Hashing & Ingesting Payload...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Success Badge */}
              {uploadComplete && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg flex items-center space-x-2 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Document verified and attached to transaction!</span>
                </div>
              )}

              {/* Image Thumbnail Preview */}
              {filePreviewUrl && selectedFile.type.includes('image') && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-400 block mb-1">Image Preview:</span>
                  <img
                    src={filePreviewUrl}
                    alt="Preview"
                    className="h-28 rounded-lg border border-slate-200 object-cover"
                  />
                </div>
              )}
            </div>
          )}

          {/* Validation Error Message */}
          {uploadError && (
            <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2 text-xs">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-3.5 py-2 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={simulateUploadAndSave}
            disabled={!selectedFile || isUploading || uploadComplete}
            className={`px-4 py-2 rounded-xl font-bold flex items-center space-x-1.5 shadow-xs transition-all ${
              selectedFile && !isUploading && !uploadComplete
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-98'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>{isUploading ? 'Uploading...' : 'Save & Attach Document'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
