import React, { createContext, useContext, useState } from 'react';

interface CacheData {
  yearData: {
    [key: string]: any; // year -> data
  };
  monthData: {
    [key: string]: any; // year-month -> data
  };
}

interface CacheContextType {
  cache: CacheData;
  setYearData: (year: number, data: any) => void;
  setMonthData: (year: number, month: number, data: any) => void;
  getYearData: (year: number) => any;
  getMonthData: (year: number, month: number) => any;
  clearCache: () => void;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

export const CacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cache, setCache] = useState<CacheData>({
    yearData: {},
    monthData: {},
  });

  const setYearData = (year: number, data: any) => {
    setCache(prev => ({
      ...prev,
      yearData: {
        ...prev.yearData,
        [year]: data
      }
    }));
  };

  const setMonthData = (year: number, month: number, data: any) => {
    const key = `${year}-${month}`;
    setCache(prev => ({
      ...prev,
      monthData: {
        ...prev.monthData,
        [key]: data
      }
    }));
  };

  const getYearData = (year: number) => {
    return cache.yearData[year];
  };

  const getMonthData = (year: number, month: number) => {
    const key = `${year}-${month}`;
    return cache.monthData[key];
  };

  const clearCache = () => {
    setCache({
      yearData: {},
      monthData: {},
    });
  };

  return (
    <CacheContext.Provider value={{
      cache,
      setYearData,
      setMonthData,
      getYearData,
      getMonthData,
      clearCache
    }}>
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = () => {
  const context = useContext(CacheContext);
  if (context === undefined) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
};
