import { useEmpresa, EMPRESAS_CONFIG, Empresa } from '@/context/EmpresaContext';
import { useNavigate } from 'react-router-dom';

export default function SelecionarEmpresa() {
  const { selectEmpresa } = useEmpresa();
  const navigate = useNavigate();

  function handleSelect(id: Empresa) {
    selectEmpresa(id);
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 40%, #111827 0%, #000000 70%)' }}
    >
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-[0.07]"
          style={{ background: '#1a56db', filter: 'blur(120px)', top: '-10%', left: '-10%' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full opacity-[0.06]"
          style={{ background: '#057a55', filter: 'blur(100px)', bottom: '-5%', right: '-8%' }} />
        <div className="absolute w-[300px] h-[300px] rounded-full opacity-[0.05]"
          style={{ background: '#1e40af', filter: 'blur(90px)', top: '60%', left: '50%' }} />
        <div className="absolute w-[250px] h-[250px] rounded-full opacity-[0.04]"
          style={{ background: '#065f46', filter: 'blur(80px)', top: '10%', right: '20%' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-[90%] max-w-[480px] animate-fade-in">
        <h1 className="text-xs font-light tracking-[0.35em] uppercase mb-2"
          style={{ color: '#9ca3af' }}>
          Grupo Empresarial
        </h1>
        <p className="text-sm mb-12" style={{ color: '#4b5563' }}>
          Seleciona a tua empresa para continuar
        </p>

        <div className="flex flex-col gap-4 w-full">
          {Object.values(EMPRESAS_CONFIG).map((config) => (
            <button
              key={config.id}
              onClick={() => handleSelect(config.id)}
              className="group w-full h-[120px] flex items-center rounded-2xl transition-all duration-[250ms] ease-out"
              style={{
                background: '#0f1117',
                border: '1px solid #1f2937',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = config.cor;
                e.currentTarget.style.boxShadow = `0 0 24px ${config.cor}66`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#1f2937';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div className="flex items-center justify-center px-6 shrink-0" style={{ width: '200px' }}>
                <img
                  src={config.logo}
                  alt={config.nome}
                  className="object-contain"
                  style={{ maxHeight: '52px', maxWidth: '180px', height: '52px' }}
                />
              </div>
              <div className="h-12 w-px shrink-0" style={{ background: '#1f2937' }} />
              <div className="flex flex-col justify-center px-6 text-left">
                <span className="text-white font-semibold text-base">{config.nome}</span>
                <span className="text-sm mt-0.5" style={{ color: '#6b7280' }}>Gestão de Stocks</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="absolute bottom-6 text-center text-xs" style={{ color: '#1f2937' }}>
        © 2025 Grupo Empresarial · Plataforma de Gestão de Stocks
      </p>
    </div>
  );
}
