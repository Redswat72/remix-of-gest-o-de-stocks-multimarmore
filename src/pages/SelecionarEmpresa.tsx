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
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-6">
      <h1 className="text-white text-2xl font-light tracking-widest mb-10 uppercase">
        Grupo Empresarial
      </h1>

      <div className="flex flex-col md:flex-row gap-6 w-full max-w-3xl">
        {Object.values(EMPRESAS_CONFIG).map((config) => (
          <button
            key={config.id}
            onClick={() => handleSelect(config.id)}
            className="group flex-1 flex flex-col items-center justify-center gap-6 p-10 rounded-2xl bg-gray-900 border-2 border-gray-800 hover:border-opacity-100 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            style={{ '--hover-color': config.cor } as React.CSSProperties}
            onMouseEnter={e => (e.currentTarget.style.borderColor = config.cor)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '')}
          >
            <img src={config.logo} alt={config.nome} className="h-20 w-auto object-contain" />
            <div className="text-center">
              <h2 className="text-white text-xl font-semibold">{config.nome}</h2>
              <p className="text-gray-400 text-sm mt-1">Gestão de Stocks</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
