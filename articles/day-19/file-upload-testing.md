# Day 19: 檔案上傳測試

## 學習目標

- 了解檔案上傳元件的測試策略
- 學會如何模擬檔案選擇和上傳
- 掌握拖拽上傳的測試方法
- 測試檔案驗證和錯誤處理
- 測試上傳進度和狀態

## 檔案上傳測試策略

檔案上傳是常見的 Web 功能，但測試起來有一些挑戰：

### 主要挑戰

1. **無法直接操作檔案系統**：測試環境中無法讀取真實檔案
2. **模擬使用者行為**：拖拽、選擇檔案等操作需要模擬
3. **非同步處理**：上傳通常是非同步操作
4. **檔案驗證**：需要測試檔案類型、大小等驗證邏輯

### 測試重點

- 檔案選擇功能
- 檔案驗證（類型、大小）
- 拖拽上傳
- 上傳進度
- 錯誤處理
- 上傳完成狀態

## 基本檔案上傳元件

### FileUpload 元件

```typescript
// src/components/FileUpload.tsx
import React, { useState, useCallback } from 'react';

export interface FileUploadProps {
  accept?: string;
  maxSize?: number; // bytes
  multiple?: boolean;
  onFileSelect?: (files: File[]) => void;
  onUpload?: (files: File[]) => Promise<void>;
  disabled?: boolean;
}

interface UploadState {
  files: File[];
  uploading: boolean;
  progress: number;
  error: string | null;
  uploaded: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  accept = '*/*',
  maxSize = 5 * 1024 * 1024, // 5MB
  multiple = false,
  onFileSelect,
  onUpload,
  disabled = false,
}) => {
  const [state, setState] = useState<UploadState>({
    files: [],
    uploading: false,
    progress: 0,
    error: null,
    uploaded: false,
  });

  const validateFiles = (files: File[]): string | null => {
    for (const file of files) {
      if (file.size > maxSize) {
        return `檔案 ${file.name} 大小超過限制 (${maxSize / 1024 / 1024}MB)`;
      }
      
      if (accept !== '*/*') {
        const acceptedTypes = accept.split(',').map(type => type.trim());
        const isValid = acceptedTypes.some(type => {
          if (type.startsWith('.')) {
            return file.name.toLowerCase().endsWith(type.toLowerCase());
          }
          return file.type.match(type.replace('*', '.*'));
        });
        
        if (!isValid) {
          return `檔案 ${file.name} 格式不符合要求`;
        }
      }
    }
    return null;
  };

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const selectedFiles = multiple ? fileArray : [fileArray[0]];

    const error = validateFiles(selectedFiles);
    if (error) {
      setState(prev => ({ ...prev, error, uploaded: false }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      files: selectedFiles, 
      error: null, 
      uploaded: false 
    }));
    
    onFileSelect?.(selectedFiles);
  }, [multiple, maxSize, accept, onFileSelect]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event.target.files);
  };

  const handleUpload = async () => {
    if (state.files.length === 0 || !onUpload) return;

    setState(prev => ({ ...prev, uploading: true, progress: 0, error: null }));

    try {
      // 模擬上傳進度
      const interval = setInterval(() => {
        setState(prev => {
          if (prev.progress >= 90) {
            clearInterval(interval);
            return prev;
          }
          return { ...prev, progress: prev.progress + 10 };
        });
      }, 100);

      await onUpload(state.files);
      clearInterval(interval);

      setState(prev => ({ 
        ...prev, 
        uploading: false, 
        progress: 100, 
        uploaded: true 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        uploading: false, 
        progress: 0, 
        error: error instanceof Error ? error.message : '上傳失敗' 
      }));
    }
  };

  const handleReset = () => {
    setState({
      files: [],
      uploading: false,
      progress: 0,
      error: null,
      uploaded: false,
    });
  };

  return (
    <div className="file-upload">
      <div className="upload-area">
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled || state.uploading}
          data-testid="file-input"
        />
        
        {state.files.length > 0 && (
          <div className="file-list" data-testid="file-list">
            <h4>已選擇的檔案：</h4>
            <ul>
              {state.files.map((file, index) => (
                <li key={index} data-testid={`file-item-${index}`}>
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </li>
              ))}
            </ul>
          </div>
        )}

        {state.error && (
          <div className="error-message" role="alert" data-testid="error-message">
            {state.error}
          </div>
        )}

        {state.uploading && (
          <div className="upload-progress" data-testid="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${state.progress}%` }}
              />
            </div>
            <span>上傳中... {state.progress}%</span>
          </div>
        )}

        {state.uploaded && (
          <div className="success-message" data-testid="success-message">
            ✅ 檔案上傳成功！
          </div>
        )}

        <div className="upload-actions">
          <button
            onClick={handleUpload}
            disabled={state.files.length === 0 || state.uploading || state.uploaded}
            data-testid="upload-button"
          >
            {state.uploading ? '上傳中...' : '上傳檔案'}
          </button>
          
          <button
            onClick={handleReset}
            disabled={state.uploading}
            data-testid="reset-button"
          >
            重設
          </button>
        </div>
      </div>
    </div>
  );
};
```

### 檔案上傳測試

```typescript
// src/components/FileUpload.test.tsx
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUpload } from './FileUpload';

// 創建模擬檔案的工具函數
const createMockFile = (
  name: string, 
  size: number, 
  type: string = 'text/plain'
): File => {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', {
    value: size,
    writable: false,
  });
  return file;
};

describe('FileUpload Component', () => {
  const mockOnFileSelect = vi.fn();
  const mockOnUpload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders file input and buttons', () => {
      render(<FileUpload />);
      
      expect(screen.getByTestId('file-input')).toBeInTheDocument();
      expect(screen.getByTestId('upload-button')).toBeInTheDocument();
      expect(screen.getByTestId('reset-button')).toBeInTheDocument();
    });

    test('applies correct input attributes', () => {
      render(
        <FileUpload 
          accept="image/*" 
          multiple={true} 
          disabled={true}
        />
      );
      
      const input = screen.getByTestId('file-input');
      expect(input).toHaveAttribute('accept', 'image/*');
      expect(input).toHaveAttribute('multiple');
      expect(input).toBeDisabled();
    });
  });

  describe('File Selection', () => {
    test('handles single file selection', async () => {
      const user = userEvent.setup();
      render(<FileUpload onFileSelect={mockOnFileSelect} />);
      
      const file = createMockFile('test.txt', 1024);
      const input = screen.getByTestId('file-input');
      
      await user.upload(input, file);
      
      expect(mockOnFileSelect).toHaveBeenCalledWith([file]);
      expect(screen.getByTestId('file-list')).toBeInTheDocument();
      expect(screen.getByText('test.txt (1.0 KB)')).toBeInTheDocument();
    });

    test('handles multiple file selection', async () => {
      const user = userEvent.setup();
      render(
        <FileUpload 
          multiple={true} 
          onFileSelect={mockOnFileSelect} 
        />
      );
      
      const files = [
        createMockFile('file1.txt', 1024),
        createMockFile('file2.txt', 2048),
      ];
      const input = screen.getByTestId('file-input');
      
      await user.upload(input, files);
      
      expect(mockOnFileSelect).toHaveBeenCalledWith(files);
      expect(screen.getByText('file1.txt (1.0 KB)')).toBeInTheDocument();
      expect(screen.getByText('file2.txt (2.0 KB)')).toBeInTheDocument();
    });

    test('limits to single file when multiple is false', async () => {
      const user = userEvent.setup();
      render(<FileUpload onFileSelect={mockOnFileSelect} />);
      
      const files = [
        createMockFile('file1.txt', 1024),
        createMockFile('file2.txt', 2048),
      ];
      const input = screen.getByTestId('file-input');
      
      await user.upload(input, files);
      
      expect(mockOnFileSelect).toHaveBeenCalledWith([files[0]]);
    });
  });

  describe('File Validation', () => {
    test('validates file size', async () => {
      const user = userEvent.setup();
      render(
        <FileUpload 
          maxSize={1024} // 1KB limit
          onFileSelect={mockOnFileSelect} 
        />
      );
      
      const file = createMockFile('large.txt', 2048); // 2KB
      const input = screen.getByTestId('file-input');
      
      await user.upload(input, file);
      
      expect(mockOnFileSelect).not.toHaveBeenCalled();
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText(/大小超過限制/)).toBeInTheDocument();
    });

    test('validates file type by extension', async () => {
      const user = userEvent.setup();
      render(
        <FileUpload 
          accept=".jpg,.png" 
          onFileSelect={mockOnFileSelect} 
        />
      );
      
      const file = createMockFile('document.txt', 1024);
      const input = screen.getByTestId('file-input');
      
      await user.upload(input, file);
      
      expect(mockOnFileSelect).not.toHaveBeenCalled();
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText(/格式不符合要求/)).toBeInTheDocument();
    });

    test('validates file type by MIME type', async () => {
      const user = userEvent.setup();
      render(
        <FileUpload 
          accept="image/*" 
          onFileSelect={mockOnFileSelect} 
        />
      );
      
      const file = createMockFile('document.txt', 1024, 'text/plain');
      const input = screen.getByTestId('file-input');
      
      await user.upload(input, file);
      
      expect(mockOnFileSelect).not.toHaveBeenCalled();
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    test('accepts valid files', async () => {
      const user = userEvent.setup();
      render(
        <FileUpload 
          accept="image/*"
          maxSize={1024 * 1024} 
          onFileSelect={mockOnFileSelect} 
        />
      );
      
      const file = createMockFile('image.jpg', 1024, 'image/jpeg');
      const input = screen.getByTestId('file-input');
      
      await user.upload(input, file);
      
      expect(mockOnFileSelect).toHaveBeenCalledWith([file]);
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });
  });

  describe('File Upload', () => {
    test('handles successful upload', async () => {
      mockOnUpload.mockResolvedValue(undefined);
      const user = userEvent.setup();
      
      render(<FileUpload onUpload={mockOnUpload} />);
      
      const file = createMockFile('test.txt', 1024);
      const input = screen.getByTestId('file-input');
      
      await user.upload(input, file);
      await user.click(screen.getByTestId('upload-button'));
      
      expect(screen.getByTestId('upload-progress')).toBeInTheDocument();
      expect(mockOnUpload).toHaveBeenCalledWith([file]);
      
      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      expect(screen.getByText('✅ 檔案上傳成功！')).toBeInTheDocument();
    });

    test('handles upload failure', async () => {
      mockOnUpload.mockRejectedValue(new Error('網路錯誤'));
      const user = userEvent.setup();
      
      render(<FileUpload onUpload={mockOnUpload} />);
      
      const file = createMockFile('test.txt', 1024);
      const input = screen.getByTestId('file-input');
      
      await user.upload(input, file);
      await user.click(screen.getByTestId('upload-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
      
      expect(screen.getByText('網路錯誤')).toBeInTheDocument();
    });

    test('disables upload button when no files selected', () => {
      render(<FileUpload />);
      
      const uploadButton = screen.getByTestId('upload-button');
      expect(uploadButton).toBeDisabled();
    });

    test('disables input during upload', async () => {
      mockOnUpload.mockImplementation(() => new Promise(() => {})); // Never resolves
      const user = userEvent.setup();
      
      render(<FileUpload onUpload={mockOnUpload} />);
      
      const file = createMockFile('test.txt', 1024);
      const input = screen.getByTestId('file-input');
      
      await user.upload(input, file);
      await user.click(screen.getByTestId('upload-button'));
      
      expect(input).toBeDisabled();
    });
  });

  describe('Reset Functionality', () => {
    test('resets component state', async () => {
      const user = userEvent.setup();
      render(<FileUpload onFileSelect={mockOnFileSelect} />);
      
      const file = createMockFile('test.txt', 1024);
      const input = screen.getByTestId('file-input');
      
      await user.upload(input, file);
      expect(screen.getByTestId('file-list')).toBeInTheDocument();
      
      await user.click(screen.getByTestId('reset-button'));
      
      expect(screen.queryByTestId('file-list')).not.toBeInTheDocument();
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
      expect(screen.queryByTestId('success-message')).not.toBeInTheDocument();
    });
  });
});
```

## 拖拽上傳測試

### 拖拽上傳元件

```typescript
// src/components/DragDropUpload.tsx
import React, { useState, useCallback } from 'react';

export interface DragDropUploadProps {
  onFileDrop?: (files: File[]) => void;
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
}

export const DragDropUpload: React.FC<DragDropUploadProps> = ({
  onFileDrop,
  accept = '*/*',
  maxSize = 5 * 1024 * 1024,
  multiple = false,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFiles = (files: File[]): string | null => {
    for (const file of files) {
      if (file.size > maxSize) {
        return `檔案 ${file.name} 大小超過限制`;
      }
    }
    return null;
  };

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    setError(null);

    if (disabled) return;

    const droppedFiles = Array.from(event.dataTransfer.files);
    const files = multiple ? droppedFiles : [droppedFiles[0]];

    const validationError = validateFiles(files);
    if (validationError) {
      setError(validationError);
      return;
    }

    onFileDrop?.(files);
  }, [disabled, multiple, maxSize, onFileDrop]);

  return (
    <div
      className={`drag-drop-area ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid="drag-drop-area"
    >
      <div className="drag-drop-content">
        <p>拖拽檔案到此處或點擊選擇</p>
        {error && (
          <div className="error-message" role="alert" data-testid="drag-drop-error">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
```

### 拖拽上傳測試

```typescript
// src/components/DragDropUpload.test.tsx
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DragDropUpload } from './DragDropUpload';

// 模擬拖拽事件的工具函數
const createDragEvent = (type: string, files: File[] = []) => {
  const event = new DragEvent(type, {
    bubbles: true,
    cancelable: true,
  });

  Object.defineProperty(event, 'dataTransfer', {
    value: {
      files: {
        ...files,
        length: files.length,
        item: (index: number) => files[index],
        [Symbol.iterator]: function* () {
          yield* files;
        },
      },
    },
    configurable: true,
  });

  return event;
};

const createMockFile = (name: string, size: number, type: string = 'text/plain'): File => {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', {
    value: size,
    writable: false,
  });
  return file;
};

describe('DragDropUpload Component', () => {
  const mockOnFileDrop = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders drag drop area', () => {
      render(<DragDropUpload />);
      
      expect(screen.getByTestId('drag-drop-area')).toBeInTheDocument();
      expect(screen.getByText('拖拽檔案到此處或點擊選擇')).toBeInTheDocument();
    });

    test('applies disabled class when disabled', () => {
      render(<DragDropUpload disabled={true} />);
      
      const dragDropArea = screen.getByTestId('drag-drop-area');
      expect(dragDropArea).toHaveClass('disabled');
    });
  });

  describe('Drag and Drop', () => {
    test('applies dragging class on drag over', () => {
      render(<DragDropUpload />);
      
      const dragDropArea = screen.getByTestId('drag-drop-area');
      const dragEvent = createDragEvent('dragover');
      
      fireEvent(dragDropArea, dragEvent);
      
      expect(dragDropArea).toHaveClass('dragging');
    });

    test('removes dragging class on drag leave', () => {
      render(<DragDropUpload />);
      
      const dragDropArea = screen.getByTestId('drag-drop-area');
      
      fireEvent(dragDropArea, createDragEvent('dragover'));
      expect(dragDropArea).toHaveClass('dragging');
      
      fireEvent(dragDropArea, createDragEvent('dragleave'));
      expect(dragDropArea).not.toHaveClass('dragging');
    });

    test('handles file drop', () => {
      render(<DragDropUpload onFileDrop={mockOnFileDrop} />);
      
      const dragDropArea = screen.getByTestId('drag-drop-area');
      const files = [createMockFile('test.txt', 1024)];
      const dropEvent = createDragEvent('drop', files);
      
      fireEvent(dragDropArea, dropEvent);
      
      expect(mockOnFileDrop).toHaveBeenCalledWith(files);
      expect(dragDropArea).not.toHaveClass('dragging');
    });

    test('handles multiple file drop when multiple is enabled', () => {
      render(
        <DragDropUpload 
          multiple={true}
          onFileDrop={mockOnFileDrop} 
        />
      );
      
      const dragDropArea = screen.getByTestId('drag-drop-area');
      const files = [
        createMockFile('file1.txt', 1024),
        createMockFile('file2.txt', 2048),
      ];
      const dropEvent = createDragEvent('drop', files);
      
      fireEvent(dragDropArea, dropEvent);
      
      expect(mockOnFileDrop).toHaveBeenCalledWith(files);
    });

    test('limits to single file when multiple is disabled', () => {
      render(<DragDropUpload onFileDrop={mockOnFileDrop} />);
      
      const dragDropArea = screen.getByTestId('drag-drop-area');
      const files = [
        createMockFile('file1.txt', 1024),
        createMockFile('file2.txt', 2048),
      ];
      const dropEvent = createDragEvent('drop', files);
      
      fireEvent(dragDropArea, dropEvent);
      
      expect(mockOnFileDrop).toHaveBeenCalledWith([files[0]]);
    });

    test('validates file size on drop', () => {
      render(
        <DragDropUpload 
          maxSize={1024}
          onFileDrop={mockOnFileDrop} 
        />
      );
      
      const dragDropArea = screen.getByTestId('drag-drop-area');
      const files = [createMockFile('large.txt', 2048)];
      const dropEvent = createDragEvent('drop', files);
      
      fireEvent(dragDropArea, dropEvent);
      
      expect(mockOnFileDrop).not.toHaveBeenCalled();
      expect(screen.getByTestId('drag-drop-error')).toBeInTheDocument();
      expect(screen.getByText(/大小超過限制/)).toBeInTheDocument();
    });

    test('ignores events when disabled', () => {
      render(
        <DragDropUpload 
          disabled={true}
          onFileDrop={mockOnFileDrop} 
        />
      );
      
      const dragDropArea = screen.getByTestId('drag-drop-area');
      const files = [createMockFile('test.txt', 1024)];
      
      fireEvent(dragDropArea, createDragEvent('dragover'));
      expect(dragDropArea).not.toHaveClass('dragging');
      
      fireEvent(dragDropArea, createDragEvent('drop', files));
      expect(mockOnFileDrop).not.toHaveBeenCalled();
    });
  });
});
```

## 圖片預覽上傳測試

### 圖片預覽元件

```typescript
// src/components/ImageUploadPreview.tsx
import React, { useState, useCallback } from 'react';

export interface ImageUploadPreviewProps {
  onImageSelect?: (file: File, preview: string) => void;
  maxSize?: number;
  disabled?: boolean;
}

export const ImageUploadPreview: React.FC<ImageUploadPreviewProps> = ({
  onImageSelect,
  maxSize = 5 * 1024 * 1024,
  disabled = false,
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    // 驗證檔案類型
    if (!file.type.startsWith('image/')) {
      setError('請選擇圖片檔案');
      return;
    }

    // 驗證檔案大小
    if (file.size > maxSize) {
      setError(`檔案大小超過限制 (${maxSize / 1024 / 1024}MB)`);
      return;
    }

    // 建立預覽
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      setSelectedFile(file);
      setError(null);
      onImageSelect?.(file, result);
    };

    reader.onerror = () => {
      setError('讀取檔案失敗');
    };

    reader.readAsDataURL(file);
  }, [maxSize, onImageSelect]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleReset = () => {
    setPreview(null);
    setSelectedFile(null);
    setError(null);
  };

  return (
    <div className="image-upload-preview">
      <input
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        disabled={disabled}
        data-testid="image-input"
      />

      {error && (
        <div className="error-message" role="alert" data-testid="image-error">
          {error}
        </div>
      )}

      {preview && (
        <div className="image-preview" data-testid="image-preview">
          <img 
            src={preview} 
            alt="預覽圖片" 
            data-testid="preview-image"
          />
          <div className="image-info" data-testid="image-info">
            <p>檔名: {selectedFile?.name}</p>
            <p>大小: {selectedFile && (selectedFile.size / 1024).toFixed(1)} KB</p>
          </div>
          <button 
            onClick={handleReset}
            data-testid="reset-preview"
          >
            移除
          </button>
        </div>
      )}
    </div>
  );
};
```

### 圖片預覽測試

```typescript
// src/components/ImageUploadPreview.test.tsx
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageUploadPreview } from './ImageUploadPreview';

// Mock FileReader
const mockFileReader = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readAsDataURL: vi.fn(),
  result: null,
  error: null,
  onload: null,
  onerror: null,
};

Object.defineProperty(window, 'FileReader', {
  writable: true,
  value: vi.fn(() => mockFileReader),
});

const createImageFile = (name: string, size: number): File => {
  const file = new File([''], name, { type: 'image/jpeg' });
  Object.defineProperty(file, 'size', {
    value: size,
    writable: false,
  });
  return file;
};

describe('ImageUploadPreview Component', () => {
  const mockOnImageSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFileReader.result = null;
    mockFileReader.error = null;
    mockFileReader.onload = null;
    mockFileReader.onerror = null;
  });

  describe('Rendering', () => {
    test('renders image input', () => {
      render(<ImageUploadPreview />);
      
      expect(screen.getByTestId('image-input')).toBeInTheDocument();
      expect(screen.getByTestId('image-input')).toHaveAttribute('accept', 'image/*');
    });

    test('disables input when disabled prop is true', () => {
      render(<ImageUploadPreview disabled={true} />);
      
      expect(screen.getByTestId('image-input')).toBeDisabled();
    });
  });

  describe('File Selection and Validation', () => {
    test('accepts valid image file', async () => {
      const user = userEvent.setup();
      render(<ImageUploadPreview onImageSelect={mockOnImageSelect} />);
      
      const file = createImageFile('test.jpg', 1024);
      const input = screen.getByTestId('image-input');
      
      await user.upload(input, file);
      
      // 觸發 FileReader onload
      const fakeDataUrl = 'data:image/jpeg;base64,fake-data';
      mockFileReader.result = fakeDataUrl;
      mockFileReader.onload?.({ target: { result: fakeDataUrl } } as any);
      
      await waitFor(() => {
        expect(mockOnImageSelect).toHaveBeenCalledWith(file, fakeDataUrl);
        expect(screen.getByTestId('image-preview')).toBeInTheDocument();
      });
    });

    test('rejects non-image file', async () => {
      const user = userEvent.setup();
      render(<ImageUploadPreview onImageSelect={mockOnImageSelect} />);
      
      const file = new File([''], 'document.txt', { type: 'text/plain' });
      const input = screen.getByTestId('image-input');
      
      await user.upload(input, file);
      
      expect(mockOnImageSelect).not.toHaveBeenCalled();
      expect(screen.getByTestId('image-error')).toBeInTheDocument();
      expect(screen.getByText('請選擇圖片檔案')).toBeInTheDocument();
    });

    test('rejects oversized file', async () => {
      const user = userEvent.setup();
      render(
        <ImageUploadPreview 
          maxSize={1024} 
          onImageSelect={mockOnImageSelect} 
        />
      );
      
      const file = createImageFile('large.jpg', 2048);
      const input = screen.getByTestId('image-input');
      
      await user.upload(input, file);
      
      expect(mockOnImageSelect).not.toHaveBeenCalled();
      expect(screen.getByTestId('image-error')).toBeInTheDocument();
      expect(screen.getByText(/檔案大小超過限制/)).toBeInTheDocument();
    });

    test('handles FileReader error', async () => {
      const user = userEvent.setup();
      render(<ImageUploadPreview onImageSelect={mockOnImageSelect} />);
      
      const file = createImageFile('test.jpg', 1024);
      const input = screen.getByTestId('image-input');
      
      await user.upload(input, file);
      
      // 觸發 FileReader onerror
      mockFileReader.onerror?.();
      
      await waitFor(() => {
        expect(screen.getByTestId('image-error')).toBeInTheDocument();
        expect(screen.getByText('讀取檔案失敗')).toBeInTheDocument();
      });
    });
  });

  describe('Image Preview', () => {
    test('displays image preview and info', async () => {
      const user = userEvent.setup();
      render(<ImageUploadPreview onImageSelect={mockOnImageSelect} />);
      
      const file = createImageFile('test.jpg', 2048);
      const input = screen.getByTestId('image-input');
      
      await user.upload(input, file);
      
      const fakeDataUrl = 'data:image/jpeg;base64,fake-data';
      mockFileReader.result = fakeDataUrl;
      mockFileReader.onload?.({ target: { result: fakeDataUrl } } as any);
      
      await waitFor(() => {
        const previewImage = screen.getByTestId('preview-image');
        expect(previewImage).toHaveAttribute('src', fakeDataUrl);
        expect(previewImage).toHaveAttribute('alt', '預覽圖片');
        
        const imageInfo = screen.getByTestId('image-info');
        expect(imageInfo).toHaveTextContent('檔名: test.jpg');
        expect(imageInfo).toHaveTextContent('大小: 2.0 KB');
      });
    });

    test('resets preview when reset button clicked', async () => {
      const user = userEvent.setup();
      render(<ImageUploadPreview />);
      
      const file = createImageFile('test.jpg', 1024);
      const input = screen.getByTestId('image-input');
      
      await user.upload(input, file);
      
      const fakeDataUrl = 'data:image/jpeg;base64,fake-data';
      mockFileReader.result = fakeDataUrl;
      mockFileReader.onload?.({ target: { result: fakeDataUrl } } as any);
      
      await waitFor(() => {
        expect(screen.getByTestId('image-preview')).toBeInTheDocument();
      });
      
      await user.click(screen.getByTestId('reset-preview'));
      
      expect(screen.queryByTestId('image-preview')).not.toBeInTheDocument();
      expect(screen.queryByTestId('image-error')).not.toBeInTheDocument();
    });
  });
});
```

## 常見問題

**Q: 如何測試真實的檔案上傳到伺服器？**
A: 在單元測試中，建議 mock HTTP 請求。真實的檔案上傳應該在整合測試或 E2E 測試中進行。可以使用 MSW (Mock Service Worker) 來模擬上傳 API。

**Q: 如何測試拖拽功能？**
A: 使用 `fireEvent` 觸發拖拽相關事件（dragover、drop 等），並模擬 `dataTransfer.files` 屬性。

**Q: 如何測試檔案讀取失敗的情況？**
A: Mock FileReader，然後在測試中觸發其 `onerror` 事件。

**Q: 大檔案上傳的進度如何測試？**
A: 模擬非同步上傳過程，使用 `waitFor` 等待進度更新，測試進度條的顯示和狀態變化。

## 練習題

1. **基礎練習**：建立一個 `MultipleFileUpload` 元件
   - 支援多檔案選擇和預覽
   - 每個檔案可以單獨移除
   - 顯示檔案列表和總大小

2. **進階練習**：建立一個 `DocumentUpload` 元件
   - 只接受特定格式（PDF、DOC、TXT）
   - 顯示檔案圖示和詳細資訊
   - 支援檔案重新命名

3. **挑戰練習**：建立一個 `BatchImageUpload` 元件
   - 支援批量圖片上傳
   - 圖片壓縮功能
   - 拖拽排序功能
   - 上傳隊列管理

## 延伸閱讀

- [File API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/File)
- [FileReader API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/FileReader)
- [Drag and Drop API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)
- [Testing File Uploads - Testing Library](https://testing-library.com/docs/ecosystem-user-event/#upload)

## 本日重點回顧

✅ 了解檔案上傳元件的測試策略和挑戰
✅ 學會如何模擬檔案選擇和驗證
✅ 掌握拖拽上傳功能的測試方法
✅ 實作圖片預覽上傳的完整測試
✅ 處理檔案讀取和上傳的非同步操作測試
✅ 測試各種錯誤情況和邊界條件

明天我們將學習國際化 (i18n) 測試，了解如何測試多語系應用！