import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Document, Page, pdfjs } from "react-pdf";
import { saveAs } from "file-saver";
import {
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  Image,
  File,
  Archive,
  AlertCircle,
} from "lucide-react";
import "../styles/TaskResultDisplay.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const API_BASE_URL = "http://140.115.126.192:3001";

const TaskResultDisplay = ({ taskStatus, onRetry }) => {
  const [previewModal, setPreviewModal] = useState({
    show: false,
    type: null,
    content: null,
    files: [],
    currentIndex: 0,
  });
  const [downloadProgress, setDownloadProgress] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getFileInfo = (fileName, mimeType) => {
    const ext = fileName.split(".").pop().toLowerCase();

    const fileTypes = {
      image: {
        extensions: ["png", "jpg", "jpeg", "gif", "webp"],
        icon: <Image size={20} />,
        category: "screenshots",
      },
      pdf: {
        extensions: ["pdf"],
        icon: <FileText size={20} />,
        category: "documents",
      },
      markdown: {
        extensions: ["md"],
        icon: <FileText size={20} />,
        category: "summaries",
      },
      json: {
        extensions: ["json"],
        icon: <File size={20} />,
        category: "data",
      },
      default: {
        icon: <File size={20} />,
        category: "others",
      },
    };

    for (const [type, info] of Object.entries(fileTypes)) {
      if (info.extensions && info.extensions.includes(ext)) {
        return { ...info, type };
      }
    }

    return fileTypes.default;
  };

  const categorizeFiles = (files) => {
    const categories = {
      screenshots: [],
      documents: [],
      summaries: [],
      data: [],
      others: [],
    };

    files.forEach((file) => {
      const fileInfo = getFileInfo(file.name, file.mime_type);
      categories[fileInfo.category].push({
        ...file,
        fileInfo,
      });
    });

    return categories;
  };

  const previewFile = async (file, allFiles = [], currentIndex = 0) => {
    setLoading(true);
    setError(null);

    try {
      let previewUrl;
      if (file.preview_url) {
        previewUrl = file.preview_url;
      } else if (file.path) {
        previewUrl = `/api/preview/${
          taskStatus.result.task_id
        }/${encodeURIComponent(file.path)}`;
      } else {
        previewUrl = `/api/preview/${
          taskStatus.result.task_id
        }/${encodeURIComponent(file.name)}?search=true`;
      }

      const response = await fetch(`${API_BASE_URL}${previewUrl}`);

      if (!response.ok) {
        throw new Error(`預覽失敗: ${response.statusText}`);
      }

      const fileInfo = getFileInfo(file.name, file.mime_type);

      if (fileInfo.type === "image") {
        setPreviewModal({
          show: true,
          type: "image",
          content: `${API_BASE_URL}${previewUrl}`,
          files: allFiles,
          currentIndex,
          title: file.name,
        });
      } else if (fileInfo.type === "pdf") {
        setPreviewModal({
          show: true,
          type: "pdf",
          content: `${API_BASE_URL}${previewUrl}`,
          title: file.name,
        });
      } else if (fileInfo.type === "markdown" || fileInfo.type === "json") {
        const data = await response.json();
        setPreviewModal({
          show: true,
          type: fileInfo.type,
          content: data.content,
          title: file.name,
        });
      }
    } catch (err) {
      console.error("預覽錯誤詳情:", err);
      setError(`預覽文件失敗: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (file) => {
    setDownloadProgress((prev) => ({ ...prev, [file.name]: "downloading" }));

    try {
      let downloadUrl;
      if (file.download_url) {
        downloadUrl = file.download_url;
      } else if (file.path) {
        downloadUrl = `/api/files/${
          taskStatus.result.task_id
        }/${encodeURIComponent(file.path)}`;
      } else {
        downloadUrl = `/api/files/${
          taskStatus.result.task_id
        }/${encodeURIComponent(file.name)}?search=true`;
      }

      const response = await fetch(`${API_BASE_URL}${downloadUrl}`);
      if (!response.ok) throw new Error(`下載失敗: ${response.statusText}`);

      const blob = await response.blob();
      saveAs(blob, file.name);

      setDownloadProgress((prev) => ({ ...prev, [file.name]: "completed" }));
      setTimeout(() => {
        setDownloadProgress((prev) => {
          const newState = { ...prev };
          delete newState[file.name];
          return newState;
        });
      }, 2000);
    } catch (err) {
      console.error("下載錯誤詳情:", err);
      setDownloadProgress((prev) => ({ ...prev, [file.name]: "error" }));
      setError(`下載失敗: ${err.message}`);
    }
  };

  const closePreview = () => {
    setPreviewModal({
      show: false,
      type: null,
      content: null,
      files: [],
      currentIndex: 0,
    });
  };

  const navigateImage = (direction) => {
    const { files, currentIndex } = previewModal;
    const newIndex =
      direction === "next"
        ? (currentIndex + 1) % files.length
        : (currentIndex - 1 + files.length) % files.length;

    previewFile(files[newIndex], files, newIndex);
  };

  const renderScreenshotCategory = (files) => {
    if (files.length === 0) return null;

    return (
      <div className="screenshot-category">
        <div className="screenshots-row">
          {files.map((file, index) => (
            <div key={index} className="screenshot-thumb">
              <button
                onClick={() => previewFile(file, files, index)}
                className="screenshot-preview-btn"
                disabled={loading}
                title={file.name}
              >
                <Image size={16} />
                <span className="screenshot-number">{index + 1}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFileCategory = (title, files, icon) => {
    if (files.length === 0) return null;

    return (
      <div className="file-category">
        <div className="category-header">
          <div className="category-title">
            {icon}
            <h4>
              {title} ({files.length})
            </h4>
          </div>
        </div>

        <div className="files-grid">
          {files.map((file, index) => (
            <div key={index} className="file-card">
              <div className="file-header">
                <span className="file-icon">{file.fileInfo.icon}</span>
                <span className="file-name" title={file.name}>
                  {file.name.length > 25
                    ? `${file.name.slice(0, 25)}...`
                    : file.name}
                </span>
                <span className="file-size">{formatFileSize(file.size)}</span>
              </div>

              <div className="file-actions">
                <button
                  onClick={() => previewFile(file, files, index)}
                  className="action-button preview"
                  disabled={loading}
                >
                  <Eye size={16} />
                  預覽
                </button>

                <button
                  onClick={() => downloadFile(file)}
                  className="action-button download"
                  disabled={downloadProgress[file.name] === "downloading"}
                >
                  {downloadProgress[file.name] === "downloading" ? (
                    <div className="mini-spinner" />
                  ) : downloadProgress[file.name] === "completed" ? (
                    "✓"
                  ) : downloadProgress[file.name] === "error" ? (
                    <AlertCircle size={16} />
                  ) : (
                    <Download size={16} />
                  )}
                  {downloadProgress[file.name] === "downloading"
                    ? "下載中..."
                    : "下載"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (taskStatus.status === "running") {
    return (
      <div className="task-status running">
        <div className="status-header">
          <div className="loading-spinner"></div>
          <h3>任務執行中...</h3>
        </div>

        <div className="progress-info">
          <p className="progress-text">{taskStatus.progress}</p>
          {taskStatus.currentIteration > 0 && (
            <div className="iteration-badge">
              第 {taskStatus.currentIteration} 次迭代
            </div>
          )}
        </div>

        {taskStatus.logs && taskStatus.logs.length > 0 && (
          <div className="recent-logs">
            <h4>最新日誌</h4>
            <div className="logs-container">
              {taskStatus.logs.slice(-3).map((log, index) => (
                <div key={index} className="log-entry">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (taskStatus.status === "completed" && taskStatus.result) {
    const { result } = taskStatus;
    const categorizedFiles = categorizeFiles(result.files || []);

    return (
      <div className="task-status completed">
        {error && (
          <div className="error-message">
            <AlertCircle size={16} />
            {error}
            <button onClick={() => setError(null)} className="error-close">
              ×
            </button>
          </div>
        )}

        {result.summary && (
          <div className="summary-section">
            <h4>📄 任務摘要</h4>
            <div className="summary-content">
              <div className="summary-text">
                <ReactMarkdown>{result.summary}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        <div className="files-sections">
          {renderFileCategory(
            "📝 摘要文件",
            categorizedFiles.summaries,
            <FileText size={20} />
          )}
          {renderFileCategory(
            "📄 PDF 文檔",
            categorizedFiles.documents,
            <FileText size={20} />
          )}
          {renderScreenshotCategory(categorizedFiles.screenshots)}
        </div>

        {previewModal.show && (
          <div className="preview-modal-overlay" onClick={closePreview}>
            <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h4>{previewModal.title}</h4>
                <div className="modal-controls">
                  {previewModal.type === "image" &&
                    previewModal.files.length > 1 && (
                      <>
                        <button
                          onClick={() => navigateImage("prev")}
                          className="nav-button"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <span className="image-counter">
                          {previewModal.currentIndex + 1} /{" "}
                          {previewModal.files.length}
                        </span>
                        <button
                          onClick={() => navigateImage("next")}
                          className="nav-button"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </>
                    )}
                  <button onClick={closePreview} className="close-button">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="modal-content">
                {previewModal.type === "image" && (
                  <img
                    src={previewModal.content}
                    alt={previewModal.title}
                    className="preview-image"
                  />
                )}

                {previewModal.type === "pdf" && (
                  <iframe
                    src={previewModal.content}
                    className="preview-pdf"
                    title={previewModal.title}
                  />
                )}

                {previewModal.type === "markdown" && (
                  <div className="preview-markdown">
                    <ReactMarkdown>{previewModal.content}</ReactMarkdown>
                  </div>
                )}

                {previewModal.type === "json" && (
                  <pre className="preview-json">
                    {JSON.stringify(JSON.parse(previewModal.content), null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (taskStatus.status === "error") {
    return (
      <div className="task-status error">
        <div className="status-header">
          <div className="error-icon">❌</div>
          <h3>任務執行失敗</h3>
        </div>

        <div className="error-details">
          <p className="error-message">{taskStatus.error}</p>

          {taskStatus.logs && taskStatus.logs.length > 0 && (
            <details className="error-logs">
              <summary>查看錯誤日誌</summary>
              <div className="logs-container">
                {taskStatus.logs.slice(-5).map((log, index) => (
                  <div key={index} className="log-entry error">
                    {log}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>

        <div className="error-actions">
          <button onClick={onRetry} className="retry-button">
            🔄 重試任務
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default TaskResultDisplay;
