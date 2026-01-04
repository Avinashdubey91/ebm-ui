declare module "@coreui/coreui" {
  export class MultiSelect {
    constructor(element: Element, config?: Record<string, unknown>);
    static getInstance(element: Element): MultiSelect | null;
    static getOrCreateInstance(
      element: Element,
      config?: Record<string, unknown>
    ): MultiSelect;
    dispose(): void;

    // Some CoreUI builds expose update()
    update?: (config?: Record<string, unknown>) => void;
  }
}