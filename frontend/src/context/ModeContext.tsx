import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModeContextType {
  selectedPort: string;
  setSelectedPort: (port: string) => void;
  selectedBoard: string;
  setSelectedBoard: (board: string) => void;
  output: string;
  setOutput: React.Dispatch<React.SetStateAction<string>>;
  serialLog: string;
  setSerialLog: React.Dispatch<React.SetStateAction<string>>;
  baudRate: string;
  setBaudRate: (rate: string) => void;
  isSerialOpen: boolean;
  setIsSerialOpen: (open: boolean) => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export const ModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedPort, setSelectedPort] = useState('');
  const [selectedBoard, setSelectedBoard] = useState('arduino:avr:uno'); 
  const [output, setOutput] = useState('');
  const [serialLog, setSerialLog] = useState('');
  const [baudRate, setBaudRate] = useState('9600');
  const [isSerialOpen, setIsSerialOpen] = useState(false);

  return (
    <ModeContext.Provider value={{ 
      selectedPort, setSelectedPort, 
      selectedBoard, setSelectedBoard,
      output, setOutput,
      serialLog, setSerialLog,
      baudRate, setBaudRate,
      isSerialOpen, setIsSerialOpen
    }}>
      {children}
    </ModeContext.Provider>
  );
};

export const useModeState = () => {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error('useModeState must be used within a ModeProvider');
  }
  return context;
};
