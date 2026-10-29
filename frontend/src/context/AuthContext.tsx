import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, type ApiSession, type ApiUser, type SubscriptionInfo, tokenStore } from "@/lib/api";
import { captureGuestSnapshot, hasGuestData, pushGuestSnapshotToServer } from "@/lib/guestSync";

type AuthResult = Promise<{ error: Error | null }>;

interface AuthContextType {
  user: ApiUser | null;
  session: ApiSession | null;
  loading: boolean;
  isAdmin: boolean;
  subscription: SubscriptionInfo | null;
  signUp: (email: string, password: string, fullName: string) => AuthResult;
  requestSignupOtp: (email: string) => Promise<{ error: Error | null; devOtp?: string; delivered?: boolean }>;
  verifySignupOtp: (email: string, password: string, fullName: string, otp: string) => AuthResult;
  signIn: (email: string, password: string, rememberMe?: boolean) => AuthResult;
  requestLoginOtp: (email: string) => Promise<{ error: Error | null; devOtp?: string; delivered?: boolean }>;
  verifyLoginOtp: (email: string, otp: string, rememberMe?: boolean) => AuthResult;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  setUser: (user: ApiUser | null) => void;
  guestSyncTick: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [session, setSession] = useState<ApiSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestSyncTick, setGuestSyncTick] = useState(0);

  const syncGuestData = (snapshot: ReturnType<typeof captureGuestSnapshot>) => {
    if (!hasGuestData(snapshot)) return;
    void pushGuestSnapshotToServer(snapshot)
      .then(() => setGuestSyncTick((tick) => tick + 1))
      .catch(() => undefined);
  };
  const subscription = user?.subscription || null;
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const restoreSession = async () => {
      const accessToken = tokenStore.getAccessToken();
      const refreshToken = tokenStore.getRefreshToken();
      if (!accessToken && !refreshToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await api.auth.me();
        setUser(data.user);
        setSession(accessToken ? { accessToken, refreshToken: refreshToken || undefined } : null);
      } catch {
        tokenStore.clear();
        setUser(null);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const guestSnapshot = captureGuestSnapshot();
    try {
      const data = await api.auth.signup(fullName, email, password);
      setUser(data.user);
      setSession(data.session);
      syncGuestData(guestSnapshot);
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error("Signup failed") };
    }
  };

  const requestSignupOtp = async (email: string) => {
    try {
      const data = await api.auth.requestSignupOtp(email);
      return { error: null, devOtp: data.devOtp, delivered: data.delivered };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error("Unable to send verification code") };
    }
  };

  const verifySignupOtp = async (email: string, password: string, fullName: string, otp: string) => {
    const guestSnapshot = captureGuestSnapshot();
    try {
      const data = await api.auth.verifySignupOtp(fullName, email, password, otp);
      setUser(data.user);
      setSession(data.session);
      syncGuestData(guestSnapshot);
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error("Signup verification failed") };
    }
  };

  const signIn = async (email: string, password: string, rememberMe = false) => {
    const guestSnapshot = captureGuestSnapshot();
    try {
      const data = await api.auth.login(email, password, rememberMe);
      setUser(data.user);
      setSession(data.session);
      syncGuestData(guestSnapshot);
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error("Login failed") };
    }
  };

  const requestLoginOtp = async (email: string) => {
    try {
      const data = await api.auth.requestLoginOtp(email);
      return { error: null, devOtp: data.devOtp, delivered: data.delivered };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error("Unable to send login code") };
    }
  };

  const verifyLoginOtp = async (email: string, otp: string, rememberMe = false) => {
    const guestSnapshot = captureGuestSnapshot();
    try {
      const data = await api.auth.verifyLoginOtp(email, otp, rememberMe);
      setUser(data.user);
      setSession(data.session);
      syncGuestData(guestSnapshot);
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error("Login failed") };
    }
  };

  const signOut = async () => {
    await api.auth.logout();
    setUser(null);
    setSession(null);
  };

  const refreshSubscription = async () => {
    if (!user) return;
    const data = await api.payments.subscription();
    setUser({ ...user, subscription: data.subscription });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAdmin,
        subscription,
        signUp,
        requestSignupOtp,
        verifySignupOtp,
        signIn,
        requestLoginOtp,
        verifyLoginOtp,
        signOut,
        refreshSubscription,
        setUser,
        guestSyncTick,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
