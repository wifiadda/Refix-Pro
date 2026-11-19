import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Eye, FileText, Mail, Printer, X } from 'lucide-react';
import {
  DOCUMENT_PREVIEW_EVENT,
  buildFullHtmlDocument,
  downloadHtmlDocument,
  openEmailComposer,
  triggerDirectPrintHtml,
  type DocumentPreviewRequest,
} from '../utils/pdfExport';

export function DocumentPreviewModal({
  request,
  onClose,
}: {
  request: DocumentPreviewRequest | null;
  onClose: () => void;
}) {
  const htmlIframeRef = useRef<HTMLIFrameElement | null>(null);
  const [zoom, setZoom] = useState<'fit' | '100'>('fit');
  const [viewMode, setViewMode] = useState<'pdf' | 'html'>('pdf');

  useEffect(() => {
    if (request?.pdfBlobUrl) {
      setViewMode('pdf');
    } else {
      setViewMode('html');
    }
  }, [request]);

  useEffect(() => {
    const blobUrl = request?.pdfBlobUrl;
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [request?.pdfBlobUrl]);

  const fullHtml = useMemo(() => {
    if (!request) return '';
    return buildFullHtmlDocument(request.title, request.bodyHtml);
  }, [request]);

  if (!request) return null;

  const showingPdf = Boolean(request.pdfBlobUrl) && viewMode === 'pdf';

  const handlePrintNow = () => {
    if (showingPdf && request.onPrintPdf) {
      request.onPrintPdf();
      return;
    }
    const win = htmlIframeRef.current?.contentWindow;
    if (win) {
      win.focus();
      win.print();
    } else {
      triggerDirectPrintHtml(request.title, request.bodyHtml);
    }
  };

  const handleDownload = () => {
    if (request.onDownloadPdf) {
      request.onDownloadPdf();
      return;
    }
    downloadHtmlDocument(request.filename, request.title, request.bodyHtml);
  };

  return (
    <div className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl border border-[#E5E5EA] w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Top Toolbar */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#0F172A] text-white flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-blue-300 font-semibold">
              {request.pdfBlobUrl ? 'Branded PDF Preview & Print' : 'Print & PDF Preview'}
            </p>
            <h3 className="text-sm sm:text-base font-bold truncate">{request.title}</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {request.pdfBlobUrl && (
              <div className="inline-flex rounded-lg bg-white/10 p-0.5 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setViewMode('pdf')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-colors ${
                    viewMode === 'pdf' ? 'bg-white text-[#0F172A]' : 'text-white/80 hover:text-white'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  PDF View
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('html')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-colors ${
                    viewMode === 'html' ? 'bg-white text-[#0F172A]' : 'text-white/80 hover:text-white'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  Print Sheet
                </button>
              </div>
            )}

            {!showingPdf && (
              <div className="hidden sm:inline-flex rounded-lg bg-white/10 p-0.5 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setZoom('fit')}
                  className={`px-2.5 py-1.5 rounded-md transition-colors ${
                    zoom === 'fit' ? 'bg-white text-[#0F172A]' : 'text-white/80 hover:text-white'
                  }`}
                >
                  Fit Page
                </button>
                <button
                  type="button"
                  onClick={() => setZoom('100')}
                  className={`px-2.5 py-1.5 rounded-md transition-colors ${
                    zoom === '100' ? 'bg-white text-[#0F172A]' : 'text-white/80 hover:text-white'
                  }`}
                >
                  Full Width
                </button>
              </div>
            )}

            {request.emailDraft && (
              <button
                type="button"
                onClick={() => openEmailComposer(request.emailDraft!)}
                className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Email Customer
              </button>
            )}

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              {request.onDownloadPdf ? 'Download PDF' : 'Save File'}
            </button>

            <button
              type="button"
              onClick={handlePrintNow}
              className="inline-flex items-center gap-1.5 min-h-[36px] px-4 py-1.5 rounded-lg bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Print PDF
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close document preview"
              className="p-2 rounded-lg hover:bg-white/15 text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preview Canvas */}
        <div className="flex-1 bg-[#E5E5EA] p-3 sm:p-6 overflow-auto flex justify-center">
          <div
            className={`bg-white shadow-xl border border-[#CBD5E1] rounded-lg overflow-hidden transition-all h-full min-h-[580px] ${
              showingPdf || zoom === '100' ? 'w-full max-w-[900px]' : 'w-full max-w-[794px]'
            }`}
          >
            {showingPdf && request.pdfBlobUrl ? (
              <iframe
                title={`${request.title} PDF`}
                src={`${request.pdfBlobUrl}#toolbar=1&navpanes=0`}
                className="w-full h-full border-0 bg-white"
              />
            ) : (
              <iframe
                ref={htmlIframeRef}
                title={request.title}
                srcDoc={fullHtml}
                className="w-full h-full border-0 bg-white"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DocumentPreviewHost() {
  const [activeRequest, setActiveRequest] = useState<DocumentPreviewRequest | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<DocumentPreviewRequest>;
      if (custom.detail) {
        setActiveRequest(custom.detail);
      }
    };
    window.addEventListener(DOCUMENT_PREVIEW_EVENT, handler);
    return () => window.removeEventListener(DOCUMENT_PREVIEW_EVENT, handler);
  }, []);

  return (
    <DocumentPreviewModal request={activeRequest} onClose={() => setActiveRequest(null)} />
  );
}
