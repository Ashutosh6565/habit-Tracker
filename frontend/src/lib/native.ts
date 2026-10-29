import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { runAndroidBackHandler } from "./backButton";

export const isNativeApp = Capacitor.isNativePlatform();

const ROOT_ROUTES = new Set([
  "/",
  "/dashboard",
  "/tracker",
  "/learning",
  "/templates",
  "/analytics",
  "/gamification",
  "/login",
  "/signup",
]);

export const hideSplash = () => {
  if (!isNativeApp) return;
  SplashScreen.hide({ fadeOutDuration: 220 }).catch(() => {});
};

export const openExternal = (url: string) => {
  if (isNativeApp) {
    Browser.open({ url, presentationStyle: "fullscreen" }).catch(() => {});
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
};

export const tapFeedback = () => {
  if (!isNativeApp) return;
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
};

const syncStatusBar = () => {
  const isDark = document.documentElement.classList.contains("dark");
  StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(() => {});
  StatusBar.setBackgroundColor({ color: isDark ? "#0B0F0D" : "#FAF9F5" }).catch(() => {});
};

const currentRoute = () => {
  const hash = window.location.hash.replace(/^#/, "");
  return hash.split("?")[0] || "/";
};

let started = false;

export const initNativeShell = () => {
  if (!isNativeApp || started) return;
  started = true;

  document.documentElement.classList.add("native-app");
  syncStatusBar();
  new MutationObserver(syncStatusBar).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  CapacitorApp.addListener("backButton", ({ canGoBack }) => {
    if (runAndroidBackHandler()) return;
    if (!ROOT_ROUTES.has(currentRoute()) && canGoBack) {
      window.history.back();
      return;
    }
    CapacitorApp.exitApp();
  });

  // Payments and policy links must leave the WebView: UPI apps and bank pages
  // refuse to load inside it.
  document.addEventListener(
    "click",
    (event) => {
      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      if (!/^https?:\/\//i.test(href)) return;
      if (href.startsWith(window.location.origin)) return;
      event.preventDefault();
      openExternal(href);
    },
    true
  );

  // Safety net: never leave the user stuck on the splash if the shell is slow.
  window.setTimeout(hideSplash, 6000);
};
