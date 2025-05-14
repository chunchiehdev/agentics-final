import ChatInterface from './components/ChatInterface'
import './App.css'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <div className="avatar-container">
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
            alt="User Avatar" 
            className="user-avatar"
          />
        </div>
      </header>
      <main className="App-main">
        <ChatInterface />
      </main>
    </div>
  )
}

export default App
