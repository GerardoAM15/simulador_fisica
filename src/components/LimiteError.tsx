import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Estado {
  error: Error | null;
}

/**
 * Captura errores de un módulo (por ejemplo, un navegador sin WebGL) y muestra un mensaje
 * en lugar de dejar la página en blanco.
 */
export default class LimiteError extends Component<{ children: ReactNode }, Estado> {
  state: Estado = { error: null };

  static getDerivedStateFromError(error: Error): Estado {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error en el módulo:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const sinWebGL = /webgl|context/i.test(this.state.error.message);
    return (
      <div className="mx-auto flex h-full max-w-lg flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-4xl">⚠</p>
        <h2 className="text-lg font-semibold">No se pudo mostrar este módulo</h2>
        <p className="text-sm text-slate-400">
          {sinWebGL
            ? 'Tu navegador o tarjeta gráfica no permite usar WebGL, necesario para las vistas 3D. Prueba con una versión reciente de Chrome, Edge o Firefox.'
            : this.state.error.message}
        </p>
        <div className="flex gap-2">
          <button className="boton" onClick={() => this.setState({ error: null })}>
            Reintentar
          </button>
          <Link className="boton-primario" to="/">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }
}
