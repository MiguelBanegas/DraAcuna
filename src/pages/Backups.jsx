import { useEffect, useState } from 'react';
import { Alert, Button, Card, Container, ListGroup, Spinner, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import API_URL from '../utils/apiConfig';
import { hardRefreshPage } from '../utils/browserRefresh';

const Backups = () => {
  const { token, isAdmin } = useAuth();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/backups`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron obtener los backups');
      setBackups(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin()) return;
    fetchBackups();
  }, [token, isAdmin]);

  const handleCreateBackup = async () => {
    try {
      setBusy(true);
      setError(null);
      setMessage(null);
      const response = await fetch(`${API_URL}/backups/create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo crear el backup');
      setMessage(`Backup creado: ${data.backup?.fileName || 'sin nombre'}`);
      await fetchBackups();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async (fileName) => {
    try {
      setBusy(true);
      setError(null);
      setMessage(null);
      const response = await fetch(`${API_URL}/backups/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fileName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo restaurar el backup');
      setMessage(`Restauración completada desde ${fileName}`);
      hardRefreshPage();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!isAdmin()) {
    return (
      <Container className="py-4">
        <Alert variant="danger">Acceso solo para administradores.</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-0">Backups y restauración</h4>
            <div className="text-muted">Solo administradores pueden crear o restaurar copias de seguridad.</div>
          </div>
          <Button variant="primary" onClick={handleCreateBackup} disabled={busy}>
            {busy ? <Spinner size="sm" animation="border" className="me-2" /> : null}
            Crear backup
          </Button>
        </Card.Header>
        <Card.Body>
          {message && <Alert variant="success">{message}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}

          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
            </div>
          ) : backups.length === 0 ? (
            <Alert variant="secondary">No hay backups disponibles.</Alert>
          ) : (
            <ListGroup>
              {backups.map((backup) => (
                <ListGroup.Item key={backup.fileName} className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{backup.fileName}</strong>
                    <div className="text-muted small">{new Date(backup.createdAt).toLocaleString('es-AR')}</div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Badge bg="secondary">{Math.round(backup.sizeBytes / 1024)} KB</Badge>
                    <Button size="sm" variant="outline-danger" onClick={() => handleRestore(backup.fileName)} disabled={busy}>
                      Restaurar
                    </Button>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Backups;
