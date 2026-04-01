/* eslint-disable @typescript-eslint/no-unused-vars */
/// <reference types="vite/client" />

declare module "*.css";
declare module "*.scss";
declare module "*.sass";
declare module "*.less";

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

declare global {
  interface Window {
    __suppressNavigationGuard?: boolean;
  }
}

export {};