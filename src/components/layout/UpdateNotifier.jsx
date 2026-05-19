import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { FaSyncAlt } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';

const RELOAD_GUARD_KEY = 'dra-acuna-version-reload';
const CURRENT_VERSION_KEY = 'dra-acuna-current-version';
const SNOOZE_UNTIL_KEY = 'dra-acuna-update-snooze-until';
const SNOOZE_MINUTES = 30;

const UpdateNotifier = () => {
  const versionRef = useRef(null);
  const showUpdateToast = useCallback((newVersion) => {
    const snoozeUntil = Number(localStorage.getItem(SNOOZE_UNTIL_KEY) || 0);
    if (Date.now() < snoozeUntil) {
      return;
    }

    if (toast.isActive('update-toast')) {
      return;
    }

    toast.info(
      <div className="d-flex flex-column gap-2">
        <div>
          <strong>¡Nueva actualización disponible!</strong>
          <p className="mb-0 small text-muted">Se han realizado mejoras en la aplicación.</p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => {
              const until = Date.now() + SNOOZE_MINUTES * 60 * 1000;
              localStorage.setItem(SNOOZE_UNTIL_KEY, String(until));
              toast.dismiss('update-toast');
            }}
          >
            Recordarme más tarde
          </button>
          <button
            className="btn btn-primary btn-sm d-flex align-items-center justify-content-center gap-2"
            onClick={() => {
              localStorage.removeItem(SNOOZE_UNTIL_KEY);
              localStorage.setItem(CURRENT_VERSION_KEY, newVersion);
              window.location.reload();
            }}
          >
            <FaSyncAlt /> Actualizar ahora
          </button>
        </div>
      </div>,
      {
        toastId: 'update-toast',
        position: 'bottom-right',
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: true,
        theme: 'colored'
      }
    );
  }, []);

  const checkVersion = useCallback(async () => {
    try {
      const response = await fetch(`/version.json?t=${new Date().getTime()}`);
      if (!response.ok) throw new Error('No se pudo obtener la versión');
      
      const data = await response.json();
      const newVersion = data.version;
      const reloadGuardVersion = sessionStorage.getItem(RELOAD_GUARD_KEY);
      const currentVersion = localStorage.getItem(CURRENT_VERSION_KEY);

      if (!versionRef.current) {
        if (currentVersion && newVersion !== currentVersion) {
          if (reloadGuardVersion !== newVersion) {
            sessionStorage.setItem(RELOAD_GUARD_KEY, newVersion);
            showUpdateToast(newVersion);
          }
          versionRef.current = currentVersion;
          return;
        }

        sessionStorage.removeItem(RELOAD_GUARD_KEY);
        versionRef.current = newVersion;
        localStorage.setItem(CURRENT_VERSION_KEY, newVersion);
      } else if (versionRef.current && newVersion !== versionRef.current) {
        console.log(`¡Nueva versión detectada! ${versionRef.current} -> ${newVersion}`);
        showUpdateToast(newVersion);
      }
    } catch (error) {
      console.error('Error al verificar versión:', error);
    }
  }, [showUpdateToast]);

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
