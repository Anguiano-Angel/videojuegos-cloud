import React, { useState, useRef, useEffect } from 'react';
import './AssistantChat.css';

const AssistantChat = () => {
  const [messages, setMessages] = useState([
    { sender: 'assistant', text: '¡Hola, Angel! Soy tu Asistente Cloud con IA. ¿Qué videojuego estás buscando o de qué título de nuestro catálogo te gustaría consultar información?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Obtener la URL del backend igual que en App.jsx
  const API_URL = import.meta.env.VITE_API_URL || "https://videojuegos-backend-api.onrender.com";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setLoading(true);

    try {
      // AQUÍ ESTABA EL ERROR: Apuntamos directamente al backend externo (Render)
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: userMessage }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages((prev) => [...prev, { sender: 'assistant', text: data.reply }]);
      } else {
        setMessages((prev) => [...prev, { sender: 'assistant', text: `Error del servidor: ${data.error || 'Desconocido'}` }]);
      }
    } catch (error) {
      console.error('Error de red:', error);
      setMessages((prev) => [...prev, { sender: 'assistant', text: 'Error de conexión con la API REST. Verifica que el backend esté activo.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assistant-chat-container">
      <div className="chat-header">
        <h3>🤖 Asistente Cloud con IA</h3>
        <span className="chat-subtitle">Catálogo de Videojuegos (Google Sheets)</span>
      </div>

      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message-bubble ${msg.sender}`}>
            <div className="message-text">
              {msg.text.split('\n').map((linea, idx) => {
                // Reemplazo básico y limpio para convertir **texto** en negritas visuales
                const partes = linea.split('**');
                return (
                  <p key={idx} style={{ margin: '4px 0' }}>
                    {partes.map((parte, i) => (
                      i % 2 === 1 ? <strong key={i}>{parte}</strong> : parte
                    ))}
                  </p>
                );
              })}
            </div>
          </div>
        ))}
        {loading && (
          <div className="message-bubble assistant loading">
            <div className="message-text">El asistente está consultando Google Sheets y generando la respuesta...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta sobre algún videojuego..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Enviar
        </button>
      </form>
    </div>
  );
};

export default AssistantChat;