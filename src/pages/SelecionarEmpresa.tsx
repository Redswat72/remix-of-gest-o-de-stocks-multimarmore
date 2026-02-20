import { useEmpresa, EMPRESAS_CONFIG, Empresa } from '@/context/EmpresaContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function SelecionarEmpresa() {
  const { selectEmpresa, empresa, session } = useEmpresa();
  const navigate = useNavigate();

  useEffect(() => {
    if (empresa && session) navigate('/');
    else if (empresa && !session) navigate('/login');
  }, [empresa, session]);

  function handleSelect(id: Empresa) {
    selectEmpresa(id);
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Grupo Empresarial
          </h1>
          <p className="mt-2 text-muted-foreground">
            Seleciona a empresa para continuar
          </p>
        </div>

        <div className="space-y-4">
          {Object.values(EMPRESAS_CONFIG).map((config) => (
            <button
              key={config.id}
              onClick={() => handleSelect(config.id)}
              className="w-full p-6 rounded-xl border-2 border-border hover:border-primary bg-card hover:bg-muted transition-all duration-200 text-left group"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: config.cor }}
                >
                  {config.nome.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    {config.nome}
                  </h2>
                  <p className="text-sm text-muted-foreground">Gestão de Stocks</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
