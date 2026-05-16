import { Car, Bike, Wrench } from 'lucide-react'

const iconos = { carro: Car, moto: Bike }

export default function EspacioCard({ espacio, onClick, seleccionado }) {
  const disponible  = espacio.estado === 'disponible'
  const ocupado     = espacio.estado === 'ocupado'
  const mant        = espacio.estado === 'mantenimiento'
  const Icon        = iconos[espacio.tipo] ?? Car

  return (
    <button
      onClick={() => (disponible || ocupado) && onClick(espacio)}
      disabled={mant}
      className={`
        relative flex flex-col items-center justify-center gap-1.5
        rounded-xl p-3 transition-all duration-200 text-center
        ${disponible
          ? seleccionado
            ? 'bg-primary text-white shadow-md scale-105 ring-2 ring-primary/50'
            : 'slot-available hover:scale-105 hover:shadow-md cursor-pointer'
          : ocupado
            ? 'slot-occupied cursor-default'
            : 'slot-maint cursor-not-allowed'
        }
      `}
    >
      {/* Indicador pulsante si ocupado */}
      {ocupado && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger pulse-ring" />
      )}

      <div className={`w-8 h-8 rounded-lg flex items-center justify-center
        ${seleccionado ? 'bg-white/20' : disponible ? 'bg-success/15' : ocupado ? 'bg-danger/15' : 'bg-neutral-200'}`}>
        {mant ? <Wrench size={16} /> : <Icon size={16} />}
      </div>

      <span className="font-mono font-bold text-xs leading-none">{espacio.codigo}</span>

      {ocupado && espacio.vehiculo_placa && (
        <span className="text-[10px] font-mono font-semibold opacity-80 truncate max-w-full px-1">
          {espacio.vehiculo_placa}
        </span>
      )}

      {disponible && !seleccionado && (
        <span className="text-[10px] font-medium opacity-70">Libre</span>
      )}
      {seleccionado && (
        <span className="text-[10px] font-semibold">Seleccionado</span>
      )}
    </button>
  )
}
