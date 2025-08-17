# Day 18: WebSocket 測試

## 學習目標

- 理解 WebSocket 測試的挑戰與策略
- 學會 Mock WebSocket 連接
- 掌握即時通訊功能的測試方法
- 了解連線狀態和錯誤處理的測試
- 熟悉 Socket.IO 和原生 WebSocket 的測試差異

## WebSocket 測試概述

WebSocket 測試比 HTTP API 測試更複雜，因為它涉及：

- **持續連線** - 長時間保持的雙向通訊
- **即時性** - 訊息的即時傳輸和接收
- **狀態管理** - 連線狀態的變化
- **錯誤處理** - 連線中斷、重連機制
- **事件驅動** - 基於事件的非同步通訊

### WebSocket 測試策略

```
End-to-End Tests (實際 WebSocket 連線)
    ↓
Integration Tests (模擬 WebSocket 服務器)
    ↓
Component Tests (Mock WebSocket 實例)
    ↓
Hook Tests (Mock WebSocket 行為)
    ↓
Utility Tests (WebSocket 工具函數)
```

## 原生 WebSocket 測試

### WebSocket Hook 實作

```typescript
// hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseWebSocketOptions {
  url: string;
  protocols?: string | string[];
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface WebSocketState {
  readyState: number;
  lastMessage: MessageEvent | null;
  error: Event | null;
  isConnected: boolean;
}

export interface UseWebSocketReturn extends WebSocketState {
  sendMessage: (message: string | ArrayBuffer | Blob) => void;
  connect: () => void;
  disconnect: () => void;
  reconnectAttempts: number;
}

export const useWebSocket = (options: UseWebSocketOptions): UseWebSocketReturn => {
  const {
    url,
    protocols,
    onOpen,
    onClose,
    onError,
    onMessage,
    reconnect = false,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [error, setError] = useState<Event | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);

  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      ws.current = new WebSocket(url, protocols);
      setReadyState(WebSocket.CONNECTING);
      setError(null);

      ws.current.onopen = (event) => {
        setReadyState(WebSocket.OPEN);
        setReconnectAttempts(0);
        onOpen?.(event);
      };

      ws.current.onclose = (event) => {
        setReadyState(WebSocket.CLOSED);
        onClose?.(event);

        if (reconnect && reconnectAttempts < maxReconnectAttempts && !event.wasClean) {
          reconnectTimer.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, reconnectInterval);
        }
      };

      ws.current.onerror = (event) => {
        setError(event);
        onError?.(event);
      };

      ws.current.onmessage = (event) => {
        setLastMessage(event);
        onMessage?.(event);
      };
    } catch (error) {
      setError(error as Event);
    }
  }, [url, protocols, onOpen, onClose, onError, onMessage, reconnect, reconnectInterval, maxReconnectAttempts, reconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    
    if (ws.current) {
      ws.current.close(1000, 'Manual disconnect');
    }
  }, []);

  const sendMessage = useCallback((message: string | ArrayBuffer | Blob) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(message);
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    readyState,
    lastMessage,
    error,
    isConnected: readyState === WebSocket.OPEN,
    sendMessage,
    connect,
    disconnect,
    reconnectAttempts,
  };
};
```

### WebSocket Hook 測試

```typescript
// hooks/useWebSocket.test.ts
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWebSocket, UseWebSocketOptions } from './useWebSocket';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  protocols?: string | string[];
  readyState: number = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  private listeners: Map<string, Function[]> = new Map();

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    this.protocols = protocols;
    
    // 模擬異步連接
    setTimeout(() => {
      if (this.readyState === MockWebSocket.CONNECTING) {
        this.readyState = MockWebSocket.OPEN;
        this.triggerEvent('open');
      }
    }, 10);
  }

  send(data: string | ArrayBuffer | Blob) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    // 模擬發送成功
  }

  close(code?: number, reason?: string) {
    if (this.readyState === MockWebSocket.OPEN || this.readyState === MockWebSocket.CONNECTING) {
      this.readyState = MockWebSocket.CLOSED;
      const closeEvent = new CloseEvent('close', {
        code: code || 1000,
        reason: reason || '',
        wasClean: code === 1000,
      });
      this.triggerEvent('close', closeEvent);
    }
  }

  // 測試輔助方法
  simulateMessage(data: any) {
    if (this.readyState === MockWebSocket.OPEN) {
      const messageEvent = new MessageEvent('message', { data });
      this.triggerEvent('message', messageEvent);
    }
  }

  simulateError() {
    const errorEvent = new Event('error');
    this.triggerEvent('error', errorEvent);
  }

  simulateClose(wasClean = true, code = 1000, reason = '') {
    this.readyState = MockWebSocket.CLOSED;
    const closeEvent = new CloseEvent('close', { wasClean, code, reason });
    this.triggerEvent('close', closeEvent);
  }

  private triggerEvent(type: string, event?: Event) {
    switch (type) {
      case 'open':
        this.onopen?.(event || new Event('open'));
        break;
      case 'close':
        this.onclose?.(event as CloseEvent);
        break;
      case 'error':
        this.onerror?.(event || new Event('error'));
        break;
      case 'message':
        this.onmessage?.(event as MessageEvent);
        break;
    }
  }
}

// Mock global WebSocket
(global as any).WebSocket = MockWebSocket;

describe('useWebSocket', () => {
  let mockWebSocket: MockWebSocket;
  const mockUrl = 'ws://localhost:8080';

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const renderWebSocketHook = (options: UseWebSocketOptions) => {
    return renderHook(() => useWebSocket(options));
  };

  test('should connect to WebSocket on mount', async () => {
    const onOpen = vi.fn();
    const { result } = renderWebSocketHook({
      url: mockUrl,
      onOpen,
    });

    // 初始狀態
    expect(result.current.readyState).toBe(WebSocket.CONNECTING);
    expect(result.current.isConnected).toBe(false);

    // 等待連接完成
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    await waitFor(() => {
      expect(result.current.readyState).toBe(WebSocket.OPEN);
    });

    expect(result.current.isConnected).toBe(true);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  test('should send messages when connected', async () => {
    const { result } = renderWebSocketHook({ url: mockUrl });

    // 等待連接完成
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // 測試發送訊息
    const sendSpy = vi.spyOn(MockWebSocket.prototype, 'send');
    
    act(() => {
      result.current.sendMessage('Hello World');
    });

    expect(sendSpy).toHaveBeenCalledWith('Hello World');
  });

  test('should not send messages when not connected', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderWebSocketHook({ url: mockUrl });

    // 嘗試在未連接時發送訊息
    act(() => {
      result.current.sendMessage('Hello World');
    });

    expect(consoleSpy).toHaveBeenCalledWith('WebSocket is not connected');
    consoleSpy.mockRestore();
  });

  test('should handle incoming messages', async () => {
    const onMessage = vi.fn();
    const { result } = renderWebSocketHook({
      url: mockUrl,
      onMessage,
    });

    // 等待連接完成
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // 模擬接收訊息
    const testMessage = 'Test message';
    act(() => {
      // 取得當前的 WebSocket 實例並模擬訊息
      const ws = (global as any).WebSocket.instances?.[0];
      if (ws) {
        ws.simulateMessage(testMessage);
      }
    });

    expect(onMessage).toHaveBeenCalled();
    expect(result.current.lastMessage?.data).toBe(testMessage);
  });

  test('should handle connection errors', async () => {
    const onError = vi.fn();
    const { result } = renderWebSocketHook({
      url: mockUrl,
      onError,
    });

    // 等待連接完成
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    // 模擬錯誤
    act(() => {
      const ws = (global as any).WebSocket.instances?.[0];
      if (ws) {
        ws.simulateError();
      }
    });

    expect(onError).toHaveBeenCalled();
    expect(result.current.error).toBeTruthy();
  });

  test('should handle disconnection', async () => {
    const onClose = vi.fn();
    const { result } = renderWebSocketHook({
      url: mockUrl,
      onClose,
    });

    // 等待連接完成
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // 手動斷線
    act(() => {
      result.current.disconnect();
    });

    expect(result.current.readyState).toBe(WebSocket.CLOSED);
    expect(result.current.isConnected).toBe(false);
    expect(onClose).toHaveBeenCalled();
  });

  test('should attempt reconnection when enabled', async () => {
    const onClose = vi.fn();
    const { result } = renderWebSocketHook({
      url: mockUrl,
      reconnect: true,
      reconnectInterval: 1000,
      maxReconnectAttempts: 3,
      onClose,
    });

    // 等待連接完成
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // 模擬非正常斷線
    act(() => {
      const ws = (global as any).WebSocket.instances?.[0];
      if (ws) {
        ws.simulateClose(false, 1006, 'Connection lost');
      }
    });

    expect(result.current.isConnected).toBe(false);

    // 等待重連嘗試
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.reconnectAttempts).toBe(1);

    // 等待新連接建立
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  test('should stop reconnecting after max attempts', async () => {
    const { result } = renderWebSocketHook({
      url: mockUrl,
      reconnect: true,
      reconnectInterval: 100,
      maxReconnectAttempts: 2,
    });

    // 等待連接完成
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    // 模擬多次連接失敗
    for (let i = 0; i < 3; i++) {
      act(() => {
        const ws = (global as any).WebSocket.instances?.[i];
        if (ws) {
          ws.simulateClose(false, 1006, 'Connection lost');
        }
      });

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      await act(async () => {
        vi.advanceTimersByTime(10);
      });
    }

    expect(result.current.reconnectAttempts).toBe(2);
  });
});
```

## 聊天室元件測試

### 聊天室元件實作

```typescript
// components/ChatRoom.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

interface Message {
  id: string;
  username: string;
  content: string;
  timestamp: Date;
  type: 'message' | 'join' | 'leave';
}

interface ChatRoomProps {
  roomId: string;
  username: string;
  websocketUrl?: string;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  roomId,
  username,
  websocketUrl = 'ws://localhost:8080',
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const { sendMessage, isConnected, lastMessage } = useWebSocket({
    url: `${websocketUrl}/rooms/${roomId}`,
    onOpen: () => {
      sendMessage(JSON.stringify({
        type: 'join',
        roomId,
        username,
      }));
    },
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    },
  });

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'message':
      case 'join':
      case 'leave':
        const message: Message = {
          id: data.id || Date.now().toString(),
          username: data.username,
          content: data.content,
          timestamp: new Date(data.timestamp),
          type: data.type,
        };
        setMessages(prev => [...prev, message]);
        break;
      
      case 'typing':
        setIsTyping(data.username !== username && data.isTyping);
        break;
      
      case 'users':
        setOnlineUsers(data.users || []);
        break;
      
      default:
        console.warn('Unknown message type:', data.type);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !isConnected) {
      return;
    }

    const message = {
      type: 'message',
      roomId,
      username,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    sendMessage(JSON.stringify(message));
    setNewMessage('');
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.trim()) {
      sendMessage(JSON.stringify({
        type: 'typing',
        roomId,
        username,
        isTyping: true,
      }));

      typingTimeoutRef.current = setTimeout(() => {
        sendMessage(JSON.stringify({
          type: 'typing',
          roomId,
          username,
          isTyping: false,
        }));
      }, 1000);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-room">
      <div className="chat-header">
        <h2>Room: {roomId}</h2>
        <div className="connection-status">
          Status: {isConnected ? 'Connected' : 'Disconnected'}
        </div>
        <div className="online-users">
          Online ({onlineUsers.length}): {onlineUsers.join(', ')}
        </div>
      </div>

      <div className="messages" data-testid="messages-container">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message message-${message.type}`}
            data-testid={`message-${message.id}`}
          >
            {message.type === 'message' ? (
              <>
                <span className="username">{message.username}:</span>
                <span className="content">{message.content}</span>
                <span className="timestamp">{formatTimestamp(message.timestamp)}</span>
              </>
            ) : (
              <span className="system-message">
                {message.username} {message.type === 'join' ? 'joined' : 'left'} the room
              </span>
            )}
          </div>
        ))}
        
        {isTyping && (
          <div className="typing-indicator" data-testid="typing-indicator">
            Someone is typing...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="message-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => handleTyping(e.target.value)}
          placeholder={isConnected ? "Type a message..." : "Connecting..."}
          disabled={!isConnected}
          data-testid="message-input"
        />
        <button
          type="submit"
          disabled={!isConnected || !newMessage.trim()}
          data-testid="send-button"
        >
          Send
        </button>
      </form>
    </div>
  );
};
```

### 聊天室元件測試

```typescript
// components/ChatRoom.test.tsx
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatRoom } from './ChatRoom';

// Mock useWebSocket hook
const mockSendMessage = vi.fn();
const mockWebSocketHook = {
  sendMessage: mockSendMessage,
  isConnected: true,
  lastMessage: null,
  readyState: WebSocket.OPEN,
  error: null,
  connect: vi.fn(),
  disconnect: vi.fn(),
  reconnectAttempts: 0,
};

vi.mock('../hooks/useWebSocket', () => ({
  useWebSocket: vi.fn(() => mockWebSocketHook),
}));

describe('ChatRoom', () => {
  const mockProps = {
    roomId: 'test-room',
    username: 'testuser',
    websocketUrl: 'ws://localhost:8080',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockWebSocketHook.isConnected = true;
    mockWebSocketHook.lastMessage = null;
  });

  test('should render chat room with correct header information', () => {
    render(<ChatRoom {...mockProps} />);

    expect(screen.getByText('Room: test-room')).toBeInTheDocument();
    expect(screen.getByText('Status: Connected')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
  });

  test('should send join message on connection', () => {
    render(<ChatRoom {...mockProps} />);

    expect(mockSendMessage).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'join',
        roomId: 'test-room',
        username: 'testuser',
      })
    );
  });

  test('should send message when form is submitted', async () => {
    const user = userEvent.setup();
    render(<ChatRoom {...mockProps} />);

    const messageInput = screen.getByTestId('message-input');
    const sendButton = screen.getByTestId('send-button');

    await user.type(messageInput, 'Hello World');
    await user.click(sendButton);

    expect(mockSendMessage).toHaveBeenCalledWith(
      expect.stringContaining('"type":"message"')
    );
    expect(mockSendMessage).toHaveBeenCalledWith(
      expect.stringContaining('"content":"Hello World"')
    );
    
    // 確認輸入框已清空
    expect(messageInput).toHaveValue('');
  });

  test('should not send empty messages', async () => {
    const user = userEvent.setup();
    render(<ChatRoom {...mockProps} />);

    const sendButton = screen.getByTestId('send-button');
    
    // 嘗試發送空訊息
    await user.click(sendButton);
    
    // 應該只有初始的 join 訊息
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
  });

  test('should disable input when not connected', () => {
    mockWebSocketHook.isConnected = false;
    render(<ChatRoom {...mockProps} />);

    expect(screen.getByText('Status: Disconnected')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Connecting...')).toBeInTheDocument();
    expect(screen.getByTestId('message-input')).toBeDisabled();
    expect(screen.getByTestId('send-button')).toBeDisabled();
  });

  test('should display received messages', async () => {
    const { rerender } = render(<ChatRoom {...mockProps} />);

    // 模擬接收訊息
    const messageEvent = new MessageEvent('message', {
      data: JSON.stringify({
        type: 'message',
        id: 'msg-1',
        username: 'otheruser',
        content: 'Hello from other user',
        timestamp: '2023-01-01T10:00:00Z',
      }),
    });

    // 更新 lastMessage 並重新渲染
    mockWebSocketHook.lastMessage = messageEvent;
    rerender(<ChatRoom {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('otheruser:')).toBeInTheDocument();
      expect(screen.getByText('Hello from other user')).toBeInTheDocument();
    });
  });

  test('should display system messages for user join/leave', async () => {
    const { rerender } = render(<ChatRoom {...mockProps} />);

    // 模擬用戶加入訊息
    const joinEvent = new MessageEvent('message', {
      data: JSON.stringify({
        type: 'join',
        id: 'join-1',
        username: 'newuser',
        timestamp: '2023-01-01T10:00:00Z',
      }),
    });

    mockWebSocketHook.lastMessage = joinEvent;
    rerender(<ChatRoom {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('newuser joined the room')).toBeInTheDocument();
    });

    // 模擬用戶離開訊息
    const leaveEvent = new MessageEvent('message', {
      data: JSON.stringify({
        type: 'leave',
        id: 'leave-1',
        username: 'newuser',
        timestamp: '2023-01-01T10:01:00Z',
      }),
    });

    mockWebSocketHook.lastMessage = leaveEvent;
    rerender(<ChatRoom {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('newuser left the room')).toBeInTheDocument();
    });
  });

  test('should show typing indicator', async () => {
    const { rerender } = render(<ChatRoom {...mockProps} />);

    // 模擬其他用戶正在輸入
    const typingEvent = new MessageEvent('message', {
      data: JSON.stringify({
        type: 'typing',
        username: 'otheruser',
        isTyping: true,
      }),
    });

    mockWebSocketHook.lastMessage = typingEvent;
    rerender(<ChatRoom {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
      expect(screen.getByText('Someone is typing...')).toBeInTheDocument();
    });

    // 模擬停止輸入
    const stopTypingEvent = new MessageEvent('message', {
      data: JSON.stringify({
        type: 'typing',
        username: 'otheruser',
        isTyping: false,
      }),
    });

    mockWebSocketHook.lastMessage = stopTypingEvent;
    rerender(<ChatRoom {...mockProps} />);

    await waitFor(() => {
      expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument();
    });
  });

  test('should update online users list', async () => {
    const { rerender } = render(<ChatRoom {...mockProps} />);

    // 模擬在線用戶列表更新
    const usersEvent = new MessageEvent('message', {
      data: JSON.stringify({
        type: 'users',
        users: ['testuser', 'otheruser', 'thirduser'],
      }),
    });

    mockWebSocketHook.lastMessage = usersEvent;
    rerender(<ChatRoom {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Online (3): testuser, otheruser, thirduser')).toBeInTheDocument();
    });
  });

  test('should send typing notification when user types', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    
    render(<ChatRoom {...mockProps} />);

    const messageInput = screen.getByTestId('message-input');
    
    // 清除初始的 join 訊息調用
    mockSendMessage.mockClear();

    await user.type(messageInput, 'Hello');

    // 應該發送正在輸入的通知
    expect(mockSendMessage).toHaveBeenCalledWith(
      expect.stringContaining('"type":"typing"')
    );
    expect(mockSendMessage).toHaveBeenCalledWith(
      expect.stringContaining('"isTyping":true')
    );

    // 等待停止輸入的超時
    vi.advanceTimersByTime(1000);

    expect(mockSendMessage).toHaveBeenCalledWith(
      expect.stringContaining('"isTyping":false')
    );

    vi.useRealTimers();
  });

  test('should handle invalid JSON messages gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { rerender } = render(<ChatRoom {...mockProps} />);

    // 模擬無效的 JSON 訊息
    const invalidEvent = new MessageEvent('message', {
      data: 'invalid json',
    });

    mockWebSocketHook.lastMessage = invalidEvent;
    rerender(<ChatRoom {...mockProps} />);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to parse WebSocket message:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  test('should handle unknown message types', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(<ChatRoom {...mockProps} />);

    // 模擬未知類型的訊息
    const unknownEvent = new MessageEvent('message', {
      data: JSON.stringify({
        type: 'unknown',
        data: 'some data',
      }),
    });

    mockWebSocketHook.lastMessage = unknownEvent;
    rerender(<ChatRoom {...mockProps} />);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Unknown message type:',
      'unknown'
    );

    consoleSpy.mockRestore();
  });
});
```

## Socket.IO 測試

### Socket.IO Hook 實作

```typescript
// hooks/useSocketIO.ts
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface UseSocketIOOptions {
  url: string;
  options?: any;
  autoConnect?: boolean;
}

export const useSocketIO = ({ url, options = {}, autoConnect = true }: UseSocketIOOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (autoConnect) {
      socketRef.current = io(url, options);
      const socket = socketRef.current;

      socket.on('connect', () => {
        setIsConnected(true);
        setError(null);
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      socket.on('connect_error', (err) => {
        setError(err.message);
        setIsConnected(false);
      });

      return () => {
        socket.close();
      };
    }
  }, [url, options, autoConnect]);

  const emit = (event: string, data: any) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  };

  const on = (event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
      return () => {
        socketRef.current?.off(event, callback);
      };
    }
  };

  const off = (event: string, callback?: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    error,
    emit,
    on,
    off,
  };
};
```

### Socket.IO Hook 測試

```typescript
// hooks/useSocketIO.test.ts
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSocketIO } from './useSocketIO';

// Mock Socket.IO
const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  close: vi.fn(),
  connected: false,
};

const mockIO = vi.fn(() => mockSocket);

vi.mock('socket.io-client', () => ({
  io: mockIO,
}));

describe('useSocketIO', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.connected = false;
  });

  test('should connect to socket server on mount', () => {
    const url = 'http://localhost:3001';
    const options = { transports: ['websocket'] };

    renderHook(() => useSocketIO({ url, options }));

    expect(mockIO).toHaveBeenCalledWith(url, options);
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
  });

  test('should not connect when autoConnect is false', () => {
    const url = 'http://localhost:3001';

    renderHook(() => useSocketIO({ url, autoConnect: false }));

    expect(mockIO).not.toHaveBeenCalled();
  });

  test('should emit events through socket', () => {
    const { result } = renderHook(() => useSocketIO({ url: 'http://localhost:3001' }));

    result.current.emit('test-event', { data: 'test' });

    expect(mockSocket.emit).toHaveBeenCalledWith('test-event', { data: 'test' });
  });

  test('should register event listeners', () => {
    const { result } = renderHook(() => useSocketIO({ url: 'http://localhost:3001' }));
    const callback = vi.fn();

    result.current.on('test-event', callback);

    expect(mockSocket.on).toHaveBeenCalledWith('test-event', callback);
  });

  test('should cleanup socket on unmount', () => {
    const { unmount } = renderHook(() => useSocketIO({ url: 'http://localhost:3001' }));

    unmount();

    expect(mockSocket.close).toHaveBeenCalled();
  });
});
```

## 常見問題

**Q: 如何測試 WebSocket 的重連機制？**
A: 模擬連線中斷事件，然後驗證重連邏輯是否按預期執行，包括重連次數和間隔時間。

**Q: 為什麼要 Mock WebSocket 而不是使用真實連線？**
A: Mock 可以讓測試更快速、可靠且獨立，不受網路狀況影響，也容易模擬各種錯誤情況。

**Q: 如何測試大量訊息的性能？**
A: 可以模擬快速連續的訊息事件，測試元件的渲染性能和記憶體使用。

**Q: 如何測試跨瀏覽器 tab 的 WebSocket 行為？**
A: 這通常需要 E2E 測試工具，或者測試 SharedWorker/BroadcastChannel 等跨 tab 通訊機制。

## 練習題

1. **即時協作編輯器**
   ```typescript
   // 實作類似 Google Docs 的協作編輯功能：
   // - 即時同步文字變更
   // - 顯示其他用戶的游標位置
   // - 衝突解決機制
   // - 離線/上線狀態處理
   ```

2. **遊戲房間系統**
   ```typescript
   // 實作多人遊戲房間：
   // - 房間建立和加入
   // - 遊戲狀態同步
   // - 玩家準備狀態
   // - 遊戲開始和結束事件
   ```

3. **股價即時監控**
   ```typescript
   // 實作股價即時更新系統：
   // - 訂閱特定股票
   // - 價格警報功能
   // - 歷史數據緩存
   // - 網路異常處理
   ```

## 延伸閱讀

- [WebSocket API MDN 文件](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Socket.IO 測試指南](https://socket.io/docs/v4/testing/)
- [WebSocket 測試最佳實踐](https://blog.logrocket.com/websocket-testing-strategies/)
- [Mock Service Worker WebSocket 支援](https://mswjs.io/docs/api/setup-worker/start-options#websocket)
- [WebSocket 安全性考量](https://tools.ietf.org/html/rfc6455#section-10)

## 本日重點回顧

✅ 理解 WebSocket 測試的特殊挑戰
✅ 學會建立 WebSocket Mock 和測試工具
✅ 掌握連線狀態和錯誤處理的測試
✅ 熟悉即時訊息傳輸的測試策略
✅ 了解重連機制的測試方法
✅ 完成聊天室元件的完整測試
✅ 學習 Socket.IO 的測試差異

明天我們將學習檔案上傳功能的測試方法！