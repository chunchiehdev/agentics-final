import { useState, useRef, useEffect } from "react";
import axios from "axios";
import TaskResultDisplay from "./TaskResultDisplay";
import "../styles/Chat.css";

const SendIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: "24px", height: "24px" }}
  >
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor" />
  </svg>
);

const STORAGE_KEYS = {
  USER_ID: "userId",
  MESSAGES: "chatMessages",
};

const API_BASE_URL = "http://localhost:3001";

const ChatInterface = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [activeTasks, setActiveTasks] = useState(new Map());
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const websocketConnectionsRef = useRef(new Map());

  useEffect(() => {
    const storedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      const newUserId = `user_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 11)}`;
      localStorage.setItem(STORAGE_KEYS.USER_ID, newUserId);
      setUserId(newUserId);
    }

    const storedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }

    return () => {
      websocketConnectionsRef.current.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 建立 WebSocket 連接並處理實時更新
  const setupWebSocketConnection = (taskId, messageId) => {
    const wsUrl = `ws://localhost:3001/ws/${taskId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log(`WebSocket 連接已建立 - 任務 ${taskId}`);
      websocketConnectionsRef.current.set(messageId, ws);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("收到 WebSocket 更新:", data);

        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === messageId) {
              if (data.status === "completed") {
                return {
                  ...msg,
                  content: data.result
                    ? JSON.stringify(data.result, null, 2)
                    : "任務完成",
                  isTask: true,
                  taskStatus: {
                    status: "completed",
                    result: data.result,
                    progress: data.progress,
                  },
                };
              } else if (data.status === "error") {
                return {
                  ...msg,
                  content: `任務執行失敗: ${data.error}`,
                  isTask: true,
                  taskStatus: {
                    status: "error",
                    error: data.error,
                    logs: data.logs || [],
                  },
                };
              } else if (data.status === "running") {
                return {
                  ...msg,
                  content: data.progress || "任務執行中...",
                  isTask: true,
                  taskStatus: {
                    status: "running",
                    progress: data.progress,
                    currentIteration: data.currentIteration,
                    logs: data.logs || [],
                  },
                };
              }
            }
            return msg;
          })
        );

        if (
          data.final ||
          data.status === "completed" ||
          data.status === "error"
        ) {
          setActiveTasks((prev) => {
            const newMap = new Map(prev);
            newMap.delete(messageId);
            return newMap;
          });

          if (websocketConnectionsRef.current.has(messageId)) {
            const connection = websocketConnectionsRef.current.get(messageId);
            if (connection.readyState === WebSocket.OPEN) {
              connection.close();
            }
            websocketConnectionsRef.current.delete(messageId);
          }
        }
      } catch (error) {
        console.error("解析 WebSocket 訊息時出錯:", error);
      }
    };

    ws.onerror = (error) => {
      console.error(`WebSocket 錯誤 - 任務 ${taskId}:`, error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                content: "連接錯誤，請重試",
                role: "error",
                isTask: false,
              }
            : msg
        )
      );
    };

    ws.onclose = (event) => {
      console.log(`WebSocket 連接已關閉 - 任務 ${taskId}`, event);
      if (websocketConnectionsRef.current.has(messageId)) {
        websocketConnectionsRef.current.delete(messageId);
      }
    };

    return ws;
  };

  const handleTaskRetry = (messageId, originalMessage) => {
    setMessage(originalMessage);
    handleSend();

    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  };

  const handleSend = async () => {
    if (!message.trim() || !userId) return;

    const newMessage = {
      id: Date.now(),
      content: message,
      role: "user",
      timestamp: new Date().toISOString(),
    };

    const currentMessage = message;
    setMessages((prev) => [...prev, newMessage]);
    setMessage("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/chat`,
        {
          message: message.trim(),
          userId,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 30000,
          withCredentials: false,
        }
      );

      const { message: responseMessage, taskId, status } = response.data;
      const botMessageId = Date.now() + 1;

      const botMessage = {
        id: botMessageId,
        content: responseMessage,
        role: "assistant",
        timestamp: new Date().toISOString(),
        isTask: !!taskId,
        originalMessage: currentMessage,
      };

      if (taskId && status === "pending") {
        botMessage.taskStatus = {
          status: "running",
          progress: "任務已開始...",
          currentIteration: 0,
          logs: [],
        };
        setActiveTasks((prev) => new Map(prev).set(botMessageId, taskId));
        setupWebSocketConnection(taskId, botMessageId);
      }

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);

      let errorMessage = "Failed to send message. Please try again.";

      if (
        error.code === "ECONNREFUSED" ||
        error.message.includes("Network Error")
      ) {
        errorMessage = "無法連接到伺服器，請確保後端API服務器正在運行。";
      } else if (error.response?.status === 400) {
        errorMessage = "CORS 錯誤：請檢查後端CORS配置。";
      } else if (error.response?.status >= 500) {
        errorMessage = "伺服器內部錯誤，請稍後再試。";
      }

      setError(errorMessage);
      setMessages((prev) => prev.filter((msg) => msg.id !== newMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearHistory = () => {
    websocketConnectionsRef.current.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });
    websocketConnectionsRef.current.clear();
    setActiveTasks(new Map());

    setMessages([]);
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-container">
        {messages.length === 0 ? (
          <div className="welcome-container">
            <p className="welcome-text">
              我是你的 AI 助手，可以幫你搜尋資訊、瀏覽網頁！
            </p>
            <div className="welcome-tips">
              <p>你可以嘗試以下功能：</p>
              <ul>
                <li>📚 搜尋 arXiv 論文知識</li>
                <li>🌐 瀏覽網頁獲取最新資訊</li>
                <li>💬 一般問答和對話</li>
                <li>📊 數據分析和總結</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="messages-container">
            <div className="chat-header">
              <button onClick={clearHistory} className="clear-history-btn">
                Clear History
              </button>
            </div>
            {messages.map((msg) => (
              <div key={msg.id} className={`message-row ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === "user"
                    ? "👤"
                    : msg.role === "error"
                    ? "⚠️"
                    : "🤖"}
                </div>
                <div className="message-content-wrapper">
                  {msg.isTask && msg.taskStatus ? (
                    <TaskResultDisplay
                      taskStatus={msg.taskStatus}
                      onRetry={() =>
                        handleTaskRetry(msg.id, msg.originalMessage)
                      }
                    />
                  ) : (
                    <div
                      className={`message-content ${
                        msg.role === "error" ? "error" : ""
                      }`}
                    >
                      {msg.content}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message-row assistant">
                <div className="message-avatar">🤖</div>
                <div className="message-content-wrapper">
                  <div className="message-content">
                    <div className="loading-indicator">
                      <span>.</span>
                      <span>.</span>
                      <span>.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="message-row error">
                <div className="message-content-wrapper">
                  <div className="message-content error">{error}</div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="input-container">
        <div className="input-wrapper">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="input-form"
          >
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="輸入你的問題，我可以幫你搜尋資訊或瀏覽網頁..."
              disabled={isLoading}
              className="input-field"
              rows={1}
            />
            <button
              type="submit"
              disabled={isLoading || !message.trim() || !userId}
              className="submit-button"
            >
              <SendIcon />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
