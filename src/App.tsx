import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import Categorias from './pages/Categorias';
import ItensCardapio from './pages/ItensCardapio';
import CardapioPublico from './pages/CardapioPublico';
import QRCodeGenerator from './pages/QRCode';
import Configuracoes from './pages/Configuracoes';
import ConfirmEmail from './pages/ConfirmEmail';

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 p-8 flex flex-col items-center justify-center text-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl border-2 border-red-200 max-w-lg">
            <h2 className="text-2xl font-black text-red-600 mb-4 uppercase italic">Ops! Algo deu errado.</h2>
            <p className="text-gray-600 mb-6 font-medium">Capture uma print desta mensagem para me ajudar a resolver:</p>
            <pre className="bg-red-50 p-4 rounded-xl text-left text-xs text-red-800 overflow-auto max-h-40 border border-red-100 mb-6 font-mono">
              {this.state.error?.toString()}
              {"\n"}
              {this.state.error?.stack}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-red-700 transition"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center p-8">Carregando permissões...</div>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Redirecionamento padrão para o login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/confirm-email" element={<ConfirmEmail />} />

          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="categorias" element={<Categorias />} />
            <Route path="itens" element={<ItensCardapio />} />
            <Route path="qrcode" element={<QRCodeGenerator />} />
            <Route path="configuracoes" element={<Configuracoes />} />
            <Route path="preview" element={
              <div className="bg-gray-200 p-8 rounded-xl border border-gray-300 min-h-screen relative overflow-hidden">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1 text-sm font-bold rounded-full z-50 uppercase tracking-widest shadow-lg">Modo de Pré-Visualização Mobile</div>
                <div className="max-w-[400px] mx-auto bg-white h-full border-[10px] border-gray-900 rounded-[40px] shadow-2xl overflow-y-auto">
                  <CardapioPublico isPreview={true} />
                </div>
              </div>
            } />
          </Route>

          {/* Rota dinâmica do cardápio público deve vir por último */}
          <Route path="/:slug" element={<CardapioPublico />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
