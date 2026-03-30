import { useEffect, useState } from 'react';
import { Badge } from 'react-bootstrap';

const AppVersionBadge = ({ bg = 'light', text = 'dark', className = '' }) => {
  const [version, setVersion] = useState(null);

  useEffect(() => {
    let active = true;

    const loadVersion = async () => {
      try {
        const response = await fetch('/version.json');
        if (!response.ok) {
          throw new Error('No se pudo obtener la versión actual');
        }

        const data = await response.json();
        if (active) {
          setVersion(data.version || null);
        }
      } catch (error) {
        console.error('Error al cargar la versión actual:', error);
      }
    };

    loadVersion();

    return () => {
      active = false;
    };
  }, []);

  if (!version) return null;

  return (
    <Badge bg={bg} text={text} className={className}>
      Versión {version}
    </Badge>
  );
};

export default AppVersionBadge;
