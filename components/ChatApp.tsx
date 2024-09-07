'use client'

import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

import {
  AppBar,
  Toolbar,
  Typography,
  TextField,
  IconButton,
  Paper,
  Box,
  Popover,
  Button,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';

interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
}

const initialMessages: Message[] = [];
let socket = io();

const emojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '🎉', '❤️', '😎', '🙌', '🦆', '🦕'];

export default function ChatApp() {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState("N/A");
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (socket.connected) {
      onConnect();
    }

    function onConnect() {
      setIsConnected(true);
      setTransport(socket.io.engine.transport.name);

      socket.io.engine.on("upgrade", (transport) => {
        setTransport(transport.name);
      });
    }

    function onDisconnect() {
      setIsConnected(false);
      setTransport("N/A");
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  useEffect(() => {
    socket.on('message', (message: string) => {
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: prevMessages.length + 1,
          sender: 'Stranger',
          content: message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    });

    return () => {
      socket.off('message');
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      socket.emit('message', newMessage);
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: prevMessages.length + 1,
          sender: 'You',
          content: newMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setNewMessage('');
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setNewMessage(prevMessage => prevMessage + emoji);
    setAnchorEl(null);
  };

  const handleEmojiOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleEmojiClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'emoji-popover' : undefined;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Chat App - {isConnected ? `Connected via ${transport}` : 'Disconnected'}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box ref={chatContainerRef} sx={{ flexGrow: 1, overflow: 'auto', p: 2, backgroundColor: 'grey.100' }}>
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              justifyContent: message.sender === 'You' ? 'flex-end' : 'flex-start',
              mb: 2,
            }}
          >
            <Paper
              elevation={1}
              sx={{
                p: 2,
                backgroundColor: message.sender === 'You' ? 'primary.light' : 'white',
                maxWidth: '70%',
                borderRadius: '20px',
                borderTopLeftRadius: message.sender !== 'You' ? 0 : '20px',
                borderTopRightRadius: message.sender === 'You' ? 0 : '20px',
              }}
            >
              <Typography variant="body1" color={message.sender === 'You' ? 'white' : 'text.primary'}>
                {message.content}
              </Typography>
              <Typography variant="caption" color={message.sender === 'You' ? 'white' : 'text.secondary'} sx={{ display: 'block', mt: 1 }}>
                {message.timestamp}
              </Typography>
            </Paper>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>
      <Paper elevation={3} sx={{ p: 2, backgroundColor: 'background.default' }}>
        <form onSubmit={handleSendMessage}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={handleEmojiOpen} color="primary">
              <EmojiEmotionsIcon />
            </IconButton>
            <Popover
              id={id}
              open={open}
              anchorEl={anchorEl}
              onClose={handleEmojiClose}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
            >
              <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', maxWidth: '200px' }}>
                {emojis.map((emoji) => (
                  <Button key={emoji} onClick={() => handleEmojiClick(emoji)}>
                    {emoji}
                  </Button>
                ))}
              </Box>
            </Popover>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type a message"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              InputProps={{
                endAdornment: (
                  <IconButton type="submit" color="primary">
                    <SendIcon />
                  </IconButton>
                ),
              }}
            />
          </Box>
        </form>
      </Paper>
    </Box>
  );
}