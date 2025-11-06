"use client";

import { createContext, useContext, useState } from "react";
import Loader from "@/components/Loader";

type LoaderContextType = {
  showLoader: (message?: string) => void;
  hideLoader: () => void;
};

const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

export const useLoader = () => {
  const ctx = useContext(LoaderContext);
  if (!ctx) throw new Error("useLoader must be used inside LoaderProvider");
  return ctx;
};

export function LoaderProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Loading...");

  const showLoader = (msg?: string) => {
    setMessage(msg || "Loading...");
    setLoading(true);
  };
  const hideLoader = () => setLoading(false);

  return (
    <LoaderContext.Provider value={{ showLoader, hideLoader }}>
      {loading && <Loader text={message} />}
      {children}
    </LoaderContext.Provider>
  );
}
