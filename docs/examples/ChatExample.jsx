import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext'; // Context de autenticación
import './ChatExample.css'; // Estilos (definidos abajo)

const ChatExample = () => {
    const { token } = useAuth();
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [newChatTitle, setNewChatTitle] = useState('');
    const [showNewChatForm, setShowNewChatForm] = useState(false);

    const messagesEndRef = useRef(null);

    // Configuración del cliente Axios
    const api = axios.create({
        baseURL: 'http://localhost:3000/api',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    // Cargar chats al inicio
    useEffect(() => {
        const fetchChats = async () => {
            try {
                const response = await api.get('/chats');
                setChats(response.data.data);
            } catch (error) {
                console.error('Error al cargar chats:', error);
            }
        };

        fetchChats();
    }, [token]);

    // Cargar mensajes cuando se selecciona un chat
    useEffect(() => {
        const fetchMessages = async () => {
            if (!selectedChat) return;

            try {
                const response = await api.get(`/chats/${selectedChat._id}/messages`);
                setMessages(response.data.data);
            } catch (error) {
                console.error('Error al cargar mensajes:', error);
            }
        };

        fetchMessages();
    }, [selectedChat]);

    // Auto-scroll al último mensaje
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Crear un nuevo chat
    const handleCreateChat = async (e) => {
        e.preventDefault();
        if (!newChatTitle.trim()) return;

        try {
            const response = await api.post('/chats', { title: newChatTitle });
            setChats([...chats, response.data.data]);
            setSelectedChat(response.data.data);
            setNewChatTitle('');
            setShowNewChatForm(false);
        } catch (error) {
            console.error('Error al crear chat:', error);
        }
    };

    // Enviar mensaje
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!prompt.trim() || !selectedChat) return;

        setLoading(true);
        try {
            const response = await api.post(`/chats/${selectedChat._id}/messages`, { prompt });
            setMessages([...messages, response.data.data.userMessage, response.data.data.aiMessage]);
            setPrompt('');
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
        } finally {
            setLoading(false);
        }
    };

    // Archivar chat
    const handleArchiveChat = async (chatId) => {
        try {
            await api.patch(`/chats/${chatId}/archive`);
            setChats(chats.filter((chat) => chat._id !== chatId));
            if (selectedChat && selectedChat._id === chatId) {
                setSelectedChat(null);
                setMessages([]);
            }
        } catch (error) {
            console.error('Error al archivar chat:', error);
        }
    };

    // Formatear el contenido de los mensajes (incluye código)
    const formatMessageContent = (content) => {
        if (!content) return '';

        // Reemplazar bloques de código
        const formattedContent = content.replace(
            /```([a-z]*)([\s\S]*?)```/g,
            '<pre class="code-block"><code>$2</code></pre>'
        );

        // Reemplazar saltos de línea por <br>
        return formattedContent.replace(/\n/g, '<br>');
    };

    return (
        <div className="chat-container">
            <div className="chat-sidebar">
                <div className="chat-sidebar-header">
                    <h3>Chats</h3>
                    <button className="new-chat-btn" onClick={() => setShowNewChatForm(!showNewChatForm)}>
                        {showNewChatForm ? '✕' : '+'}
                    </button>
                </div>

                {showNewChatForm && (
                    <form onSubmit={handleCreateChat} className="new-chat-form">
                        <input
                            type="text"
                            placeholder="Título del chat"
                            value={newChatTitle}
                            onChange={(e) => setNewChatTitle(e.target.value)}
                        />
                        <button type="submit">Crear</button>
                    </form>
                )}

                <div className="chats-list">
                    {chats.length === 0 ? (
                        <div className="no-chats">No hay chats disponibles</div>
                    ) : (
                        chats.map((chat) => (
                            <div
                                key={chat._id}
                                className={`chat-item ${selectedChat && selectedChat._id === chat._id ? 'active' : ''}`}
                                onClick={() => setSelectedChat(chat)}
                            >
                                <span className="chat-title">{chat.title}</span>
                                <button
                                    className="archive-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleArchiveChat(chat._id);
                                    }}
                                >
                                    🗑️
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="chat-main">
                {selectedChat ? (
                    <>
                        <div className="chat-header">
                            <h3>{selectedChat.title}</h3>
                        </div>

                        <div className="messages-container">
                            {messages.map((message) => (
                                <div
                                    key={message._id}
                                    className={`message ${
                                        message.requestType === 'user_message' ? 'user-message' : 'ai-message'
                                    }`}
                                >
                                    <div className="message-header">
                                        {message.requestType === 'user_message' ? 'Tú' : '🤖 IA'}
                                    </div>
                                    <div
                                        className="message-content"
                                        dangerouslySetInnerHTML={{
                                            __html:
                                                message.requestType === 'user_message'
                                                    ? message.prompt
                                                    : formatMessageContent(message.response.content),
                                        }}
                                    />
                                </div>
                            ))}
                            {loading && (
                                <div className="message ai-message">
                                    <div className="message-header">🤖 IA</div>
                                    <div className="message-content typing">
                                        <span>.</span>
                                        <span>.</span>
                                        <span>.</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form className="message-form" onSubmit={handleSendMessage}>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Escribe tu mensaje..."
                                disabled={loading}
                                rows={2}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage(e);
                                    }
                                }}
                            />
                            <button type="submit" disabled={loading || !prompt.trim()}>
                                {loading ? '...' : 'Enviar'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <h3>Selecciona un chat o crea uno nuevo</h3>
                        <p>Puedes mantener múltiples conversaciones con la IA sobre diversos temas</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatExample;
