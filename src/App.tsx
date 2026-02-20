import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { EmpresaProvider } from "@/context/EmpresaContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { UpdatePrompt } from "@/components/pwa/UpdatePrompt";

import SelecionarEmpresa from "./pages/SelecionarEmpresa";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Stock from "./pages/Stock";
import NovoMovimento from "./pages/NovoMovimento";
import Historico from "./pages/Historico";
import Superadmin from "./pages/Superadmin";
import Auditoria from "./pages/Auditoria";
import Produtos from "./pages/Produtos";
import ImportarStock from "./pages/ImportarStock";
import ImportarInventario from "./pages/ImportarInventario";
import Perfil from "./pages/Perfil";
import ProdutoPublico from "./pages/ProdutoPublico";
import ProdutoFicha from "./pages/ProdutoFicha";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <EmpresaProvider>
        <AuthProvider>
          <TooltipProvider>
            <OfflineIndicator />
            <UpdatePrompt />
            <InstallPrompt />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Entrada — selecionar empresa */}
                <Route path="/selecionar-empresa" element={<SelecionarEmpresa />} />

                {/* Login */}
                <Route path="/login" element={<Login />} />

                {/* Rota pública QR Code */}
                <Route path="/p/:idmm" element={<ProdutoPublico />} />

                {/* Rotas protegidas */}
                <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
                <Route path="/stock" element={<ProtectedRoute><AppLayout><Stock /></AppLayout></ProtectedRoute>} />
                <Route path="/movimento/novo" element={<ProtectedRoute><AppLayout><NovoMovimento /></AppLayout></ProtectedRoute>} />
                <Route path="/historico" element={<ProtectedRoute><AppLayout><Historico /></AppLayout></ProtectedRoute>} />
                <Route path="/superadmin" element={<ProtectedRoute superadminOnly><AppLayout><Superadmin /></AppLayout></ProtectedRoute>} />
                <Route path="/auditoria" element={<ProtectedRoute superadminOnly><AppLayout><Auditoria /></AppLayout></ProtectedRoute>} />
                <Route path="/importar-stock" element={<ProtectedRoute superadminOnly><AppLayout><ImportarStock /></AppLayout></ProtectedRoute>} />
                <Route path="/importar-inventario" element={<ProtectedRoute superadminOnly><AppLayout><ImportarInventario /></AppLayout></ProtectedRoute>} />
                <Route path="/produtos" element={<ProtectedRoute adminOnly><AppLayout><Produtos /></AppLayout></ProtectedRoute>} />
                <Route path="/produto/:id" element={<ProtectedRoute><AppLayout><ProdutoFicha /></AppLayout></ProtectedRoute>} />
                <Route path="/clientes" element={<ProtectedRoute adminOnly><AppLayout><div className="text-center py-12"><h1 className="text-2xl font-bold mb-2">Gestão de Clientes</h1><p className="text-muted-foreground">Em desenvolvimento...</p></div></AppLayout></ProtectedRoute>} />
                <Route path="/perfil" element={<ProtectedRoute><AppLayout><Perfil /></AppLayout></ProtectedRoute>} />
                <Route path="/configuracoes" element={<ProtectedRoute><AppLayout><div className="text-center py-12"><h1 className="text-2xl font-bold mb-2">Configurações</h1><p className="text-muted-foreground">Em desenvolvimento...</p></div></AppLayout></ProtectedRoute>} />

                {/* Redirecionar raiz para selecionar empresa se não autenticado */}
                <Route path="*" element={<Navigate to="/selecionar-empresa" replace />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </EmpresaProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
