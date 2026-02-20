import { useEmpresa, EMPRESAS_CONFIG, Empresa } from '@/context/EmpresaContext';
import { useNavigate } from 'react-router-dom';

export default function SelecionarEmpresa() {
  const { selectEmpresa } = useEmpresa();
  const navigate = useNavigate();

  function handleSelect(id: Empresa) {
    selectEmpresa(id);
    navigate('/login');
  }

  const configs = Object.values(EMPRESAS_CONFIG);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4"
      style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 40%, rgba(30,40,60,0.8) 0%, #030712 100%)' }}
    >
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="tracking-[0.3em] text-xs text-gray-400 uppercase font-light">
          Grupo Empresarial
        </h1>
        <p className="text-gray-600 text-sm mt-2">
          Seleciona a tua empresa para continuar
        </p>
      </div>

      {/* Cards */}
      <div className="flex flex-col md:flex-row gap-5 w-full max-w-3xl">
        {configs.map((config, i) => (
          <button
            key={config.id}
            onClick={() => handleSelect(config.id)}
            className="group flex-1 p-8 rounded-2xl cursor-pointer flex items-center gap-6 text-left transition-all duration-300"
            style={{
              background: '#0a0f1a',
              border: '1px solid #1a2235',
              opacity: 0,
              animation: `slideUp 0.5s ease-out ${i * 0.12}s forwards`,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = config.cor;
              e.currentTarget.style.boxShadow = `0 0 30px ${config.cor}26`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#1a2235';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="bg-white rounded-2xl p-4 flex items-center justify-center w-36 h-20 shrink-0">
              <img
                src={config.logo}
                alt={config.nome}
                className="max-h-12 max-w-[128px] w-auto h-auto object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-semibold text-xl">{config.nome}</h2>
              <p className="text-gray-500 text-sm mt-1 whitespace-nowrap">Gestão de Stocks</p>
            </div>
            <span className="text-gray-600 group-hover:text-white text-xl ml-auto transition-colors duration-300">
              →
            </span>
          </button>
        ))}
      </div>

      {/* Footer */}
      <p className="absolute bottom-6 text-gray-800 text-xs">
        © 2025 Grupo Empresarial · Plataforma de Gestão de Stocks
      </p>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
