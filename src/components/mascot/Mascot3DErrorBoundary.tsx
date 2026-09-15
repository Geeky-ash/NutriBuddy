import React from 'react';

interface ErrorBoundaryProps {
  fallback?: React.ReactNode;
  onError?: (error: any) => void;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: any;
}

/**
 * Mascot3DErrorBoundary
 * Intercepts WebGL / Three.js / R3F initialization and context errors
 * without pulling in heavy 3D dependencies into the bundle.
 */
export class Mascot3DErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.warn(
      '[NutriBuddy 3D] WebGL/Canvas failed to initialize in environment:',
      error?.message || error
    );
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback !== undefined ? this.props.fallback : null;
    }
    return this.props.children;
  }
}

export default Mascot3DErrorBoundary;
