import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
    this.setState({ error, errorInfo });
    // Also save to a global or DOM element so it can be read
    const errDiv = document.createElement('div');
    errDiv.id = 'react-crash-report';
    errDiv.innerText = error.toString() + '\n' + (error.stack || '') + '\n' + (errorInfo.componentStack || '');
    errDiv.style.display = 'none';
    document.body.appendChild(errDiv);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', color: '#ff4444', backgroundColor: '#111', fontFamily: 'monospace', height: '100vh', overflow: 'auto' }}>
          <h2>Application Runtime Error:</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#ffaaaa' }}>{this.state.error?.toString()}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#888' }}>{this.state.error?.stack}</pre>
          <h3>Component Stack:</h3>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#aaa' }}>{this.state.errorInfo?.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Global unhandled error handler
window.addEventListener('error', (e) => {
  console.error('Global Error Event:', e.error || e.message);
  let el = document.getElementById('global-error-report');
  if (!el) {
    el = document.createElement('div');
    el.id = 'global-error-report';
    el.style.cssText = 'position:fixed;bottom:10px;left:10px;background:rgba(200,0,0,0.9);color:white;padding:12px;z-index:99999;font-family:monospace;max-width:80%;font-size:12px;border-radius:8px;';
    document.body.appendChild(el);
  }
  el.innerText = 'Global Error: ' + (e.error?.stack || e.message);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

