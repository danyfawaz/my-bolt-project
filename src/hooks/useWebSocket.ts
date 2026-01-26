import { useContext } from 'react';
import { WebSocketContext, WebSocketContextValue } from '../providers/WebSocketProvider';

export function useWebSocket(): WebSocketContextValue {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
