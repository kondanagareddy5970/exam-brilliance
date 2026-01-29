import React, { createContext, useContext, ReactNode } from 'react';
import { useWebRTCProctoring } from '@/hooks/useWebRTCProctoring';

interface WebRTCContextType {
  remoteStreams: Map<string, MediaStream>;
  connectedUsers: Set<string>;
  isInitialized: boolean;
  startStreaming: () => Promise<void>;
  stopStreaming: () => void;
  cleanup: () => void;
}

const WebRTCContext = createContext<WebRTCContextType | null>(null);

export const useWebRTCContext = () => {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTCContext must be used within WebRTCProvider');
  }
  return context;
};

interface WebRTCProviderProps {
  children: ReactNode;
  examCode: string;
  userId: string;
  isAdmin: boolean;
}

export const WebRTCProvider: React.FC<WebRTCProviderProps> = ({
  children,
  examCode,
  userId,
  isAdmin
}) => {
  const webrtc = useWebRTCProctoring(examCode, userId, isAdmin);

  return (
    <WebRTCContext.Provider value={webrtc}>
      {children}
    </WebRTCContext.Provider>
  );
};
