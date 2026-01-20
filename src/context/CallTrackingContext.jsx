import { createContext, useContext, useState, useEffect } from 'react';

const CallTrackingContext = createContext(null);

const STORAGE_KEY = 'prometheus_call_history';

export function CallTrackingProvider({ children }) {
  const [callHistory, setCallHistory] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(callHistory));
  }, [callHistory]);

  const recordCall = (leadId, leadName, phone) => {
    setCallHistory(prev => ({
      ...prev,
      [leadId]: {
        leadId,
        leadName,
        phone,
        callCount: (prev[leadId]?.callCount || 0) + 1,
        lastCalled: new Date().toISOString(),
        firstCalled: prev[leadId]?.firstCalled || new Date().toISOString(),
      }
    }));
  };

  const getCallInfo = (leadId) => {
    return callHistory[leadId] || null;
  };

  const hasBeenCalled = (leadId) => {
    return !!callHistory[leadId];
  };

  const getAllCalls = () => {
    return Object.values(callHistory).sort((a, b) => 
      new Date(b.lastCalled) - new Date(a.lastCalled)
    );
  };

  const getStats = () => {
    const calls = Object.values(callHistory);
    const totalCalls = calls.reduce((sum, c) => sum + c.callCount, 0);
    const uniqueLeadsCalled = calls.length;
    
    const today = new Date().toDateString();
    const callsToday = calls.filter(c => 
      new Date(c.lastCalled).toDateString() === today
    ).length;

    return {
      totalCalls,
      uniqueLeadsCalled,
      callsToday,
    };
  };

  const clearHistory = () => {
    setCallHistory({});
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <CallTrackingContext.Provider value={{
      callHistory,
      recordCall,
      getCallInfo,
      hasBeenCalled,
      getAllCalls,
      getStats,
      clearHistory,
    }}>
      {children}
    </CallTrackingContext.Provider>
  );
}

export function useCallTracking() {
  const context = useContext(CallTrackingContext);
  if (!context) {
    throw new Error('useCallTracking must be used within a CallTrackingProvider');
  }
  return context;
}
