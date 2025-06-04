# ArxivGrab - AI Web Agent Chat Interface

這是一個整合了 AI Web Agent 的聊天介面，可以進行智能對話、文檔搜尋和網頁瀏覽。

## 🚀 快速開始

### 前端 (React + Vite)

```bash
# 安裝依賴
npm install

# 開發模式
npm run dev

# 建置
npm run build
```

### 後端 (Python Web Agent API)

```bash
# 安裝 Python 依賴
pip install -r requirements.txt

# 設定環境變數
export GOOGLE_API_KEY="your_google_api_key_here"

# 啟動 API 伺服器
python start_api_server.py
```

### 同時運行前後端

```bash
# 方式一：分別運行
# Terminal 1: 後端
python start_api_server.py

# Terminal 2: 前端  
npm run dev
```

## 📋 功能特色

- 🤖 **智能對話**：整合 Google Gemini API
- 📚 **文檔搜尋**：RAG 系統支援 arXiv 論文搜尋
- 🌐 **網頁瀏覽**：異步網頁瀏覽和資訊擷取
- 💾 **持久化**：聊天記錄本地儲存
- ⚡ **即時更新**：異步任務狀態追蹤
- 🎨 **美觀介面**：響應式設計

## 🔧 API 端點

- `POST /api/chat` - 發送訊息
- `GET /api/task/{task_id}` - 查詢任務狀態
- `GET /api/health` - 健康檢查
- `GET /api/sessions/{user_id}` - 獲取聊天歷史

## 🧪 測試

```bash
# 運行測試
npm run test

# 測試覆蓋率
npm run test:coverage
```

## 📁 專案結構

```
├── src/
│   ├── components/
│   │   └── ChatInterface.jsx    # 主要聊天介面
│   ├── styles/
│   │   └── Chat.css            # 聊天介面樣式
│   └── __tests__/              # 測試檔案
├── server/
│   └── index.js                # 開發用後端
├── public/                     # 靜態資源
└── api_server.py              # Web Agent API 伺服器
```

## ⚙️ 環境變數

- `GOOGLE_API_KEY`: Google Gemini API 金鑰（必需）
- `VITE_API_URL`: API 伺服器 URL（預設：http://localhost:3001）

## 📝 使用說明

1. 確保 Google API Key 已正確設定
2. 啟動後端 API 伺服器
3. 啟動前端開發伺服器
4. 開始與 AI 助手對話！

支援的查詢類型：
- 一般問答
- arXiv 論文搜尋
- 網頁資訊檢索
- 複雜的多步驟任務

## 🔄 異步任務處理

當用戶發送需要網頁瀏覽的複雜查詢時：

1. 系統會返回 `taskId` 和初始訊息
2. 前端自動開始輪詢任務狀態（每2秒）
3. 顯示處理進度和任務完成狀態
4. 最終結果會替換初始訊息

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 授權

MIT License+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
