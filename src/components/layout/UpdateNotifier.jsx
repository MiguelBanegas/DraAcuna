import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { FaSyncAlt } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';
import { APP_VERSION } from '../../version';

const RELOAD_GUARD_KEY = 'dra-acuna-version-reload';

const UpdateNotifier = () => {
  const versionRef = useRef(null);
  const isFirstFetch = useRef(true);

  const checkVersion = useCallback(async () => {
    try {
      const response = await fetch(`/version.json?t=${new Date().getTime()}`);
      if (!response.ok) throw new Error('No se pudo obtener la versión');
      
      const data = await response.json();
      const newVersion = data.version;
      const reloadGuardVersion = sessionStorage.getItem(RELOAD_GUARD_KEY);

      if (isFirstFetch.current) {
        if (newVersion !== APP_VERSION && reloadGuardVersion !== newVersion) {
          sessionStorage.setItem(RELOAD_GUARD_KEY, newVersion);
          window.location.reload();
          return;
        }

        sessionStorage.removeItem(RELOAD_GUARD_KEY);
        versionRef.current = APP_VERSION;
        isFirstFetch.current = false;
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
                onClick={() => window.location.reload()}
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
        versionRef.current = newVersion;
      }
    } catch (error) {
      console.error('Error al verificar versión:', error);
    }
  }, []);

  useEffect(() => {
    checkVersion();

    const interval = setInterval(() => {
      checkVersion();
    }, 1000 * 60 * 5); 

    return () => clearInterval(interval);
  }, [checkVersion]);

  return null;
};

export default UpdateNotifier;
