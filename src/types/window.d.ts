export {};

declare global {
  interface Window {
    __suppressNavigationGuard?: boolean;
  }
}