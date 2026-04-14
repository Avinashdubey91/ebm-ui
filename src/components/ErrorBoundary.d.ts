import React from 'react';
interface Props {
    children: React.ReactNode;
}
interface State {
    hasError: boolean;
}
declare class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props);
    static getDerivedStateFromError(): {
        hasError: boolean;
    };
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void;
    render(): string | number | bigint | boolean | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | import("react/jsx-runtime").JSX.Element | null | undefined;
}
export default ErrorBoundary;
