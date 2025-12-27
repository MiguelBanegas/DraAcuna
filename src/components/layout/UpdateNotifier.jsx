import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { FaSyncAlt } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';

const UpdateNotifier = () => {
  const versionRef = useRef(null);
  const isFirstFetch = useRef(true);
  const [checking, setChecking] = useState(false);

  const checkVersion = useCallback(async () => {
    // Usamos el estado checking solo para UI o prevención, 
    // pero evitamos usarlo como dependencia en useCallback para no romper useEffect
    try {
      const response = await fetch(`/version.json?t=${new Date().getTime()}`);
      if (!response.ok) throw new Error('No se pudo obtener la versión');
      
      const data = await response.json();
      const newVersion = data.version;

      if (isFirstFetch.current) {
        versionRef.current = newVersion;
        isFirstFetch.current = false;
        console.log(`Versión base establecida en: ${newVersion}`);
      } else if (versionRef.current && newVersion !== versionRef.current) {
        console.log(`¡Nueva versión detectada! ${versionRef.current} -> ${newVersion}`);
        
        if (!toast.isActive("update-toast")) {
          toast.info(
            <div className="d-flex flex-column gap-2">
              <div>
                <strong>¡Nueva actualización disponible!</strong>
                <p className="mb-0 small text-muted">Se han realizado mejoras en la aplicación.</p>
              </div>
              <button 
                className="btn btn-primary btn-sm d-flex align-items-center justify-content-center gap-2"
                onClick={() => window.location.reload(true)}
              >
                <FaSyncAlt /> Actualizar ahora
              </button>
            </div>,
            {
              toastId: "update-toast",
              position: "bottom-right",
              autoClose: false,
              closeOnClick: false,
              draggable: false,
              closeButton: true,
              theme: "colored"
            }
          );
        }
        // Actualizamos la referencia para no volver a notificar la misma versión
        versionRef.current = newVersion;
      }
    } catch (error) {
      console.error('Error al verificar versión:', error);
    }
  }, []); // Sin dependencias para que la identidad de la función sea estable

  useEffect(() => {
    // Ejecutar inmediatamente al montar
    checkVersion();

    // Configurar intervalo (5 minutos para producción)
    const interval = setInterval(() => {
      checkVersion();
    }, 1000 * 60 * 5); 

    return () => clearInterval(interval);
  }, [checkVersion]);

  return null;
};

export default UpdateNotifier;
