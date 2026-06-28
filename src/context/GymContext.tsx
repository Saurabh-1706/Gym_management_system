"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useParams } from "next/navigation";

type GymBranding = {
  name: string;
  logo?: string;
  primaryColor: string;
};

type GymContextType = {
  gym: GymBranding | null;
  loading: boolean;
};

const GymContext = createContext<GymContextType>({ gym: null, loading: true });

export function useGym() {
  return useContext(GymContext);
}

export function GymProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const tenantSlug = params?.tenantSlug as string | undefined;

  const [gym, setGym] = useState<GymBranding | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantSlug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/tenant?slug=${tenantSlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.tenant) {
          setGym({
            name: data.tenant.name,
            logo: data.tenant.logo || undefined,
            primaryColor: data.tenant.primaryColor || "#F97316",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenantSlug]);

  return (
    <GymContext.Provider value={{ gym, loading }}>
      {children}
    </GymContext.Provider>
  );
}
