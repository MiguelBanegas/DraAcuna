import { useEffect, useRef, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import { enviarMensaje } from "../../services/chatService";

const mensajeInicial = {
  rol: "assistant",
  texto: "Hola doctora, soy tu asistente. Escribime y empezamos."
};

const esDoctora = (user) => {
  if (!user) return false;
  const nombre = (user.nombre || user.name || "").toLowerCase();
  const username = (user.username || "").toLowerCase();
  const rol = (user.rol || "").toLowerCase();
  return (
    nombre.includes("dra") ||
    username.includes("dra") ||
    rol.includes("doct") ||
    rol === "admin"
  );
};

const DoctorChatModal = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensajes, setMensajes] = useState([mensajeInicial]);
  const estabaLogueadaRef = useRef(false);
  const mensajesRef = useRef(null);

  useEffect(() => {
    const logueada = Boolean(user);

    if (logueada && !estabaLogueadaRef.current && esDoctora(user)) {
      setOpen(true);
      setMensajes([mensajeInicial]);
      setMensaje("");
    }

    if (!logueada) {
      setOpen(false);
      setMensajes([mensajeInicial]);
      setMensaje("");
    }

    estabaLogueadaRef.current = logueada;
  }, [user]);

  useEffect(() => {
    if (!open) return;
    if (!mensajesRef.current) return;
    mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
  }, [mensajes, open]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const texto = mensaje.trim();
    if (!texto || enviando) return;

    setEnviando(true);
    setMensaje("");
    setMensajes((prev) => [...prev, { rol: "user", texto }]);

    try {
      const respuesta = await enviarMensaje(texto);
      setMensajes((prev) => [...prev, { rol: "assistant", texto: respuesta }]);
    } catch (error) {
      setMensajes((prev) => [
        ...prev,
        { rol: "assistant", texto: "No pude responder en este momento." }
      ]);
    } finally {
      setEnviando(false);
    }
  };

  if (!esDoctora(user)) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: "24px",
        bottom: "24px",
        zIndex: 1060,
      }}
    >
      {!open && (
        <Button
          variant="primary"
          onClick={() => setOpen(true)}
          style={{ boxShadow: "0 8px 20px rgba(0,0,0,0.15)" }}
        >
          Chat de asistencia
        </Button>
      )}

      {open && (
        <div
          className="bg-white border rounded-4 shadow-lg"
          style={{ width: "320px", overflow: "hidden" }}
        >
          <div
            className="d-flex align-items-center justify-content-between px-3 py-2 bg-primary text-white"
          >
            <strong>Chat de asistencia</strong>
            <Button
              variant="light"
              size="sm"
              onClick={() => setOpen(false)}
              style={{ lineHeight: 1 }}
            >
              x
            </Button>
          </div>
          <div
            ref={mensajesRef}
            data-testid="chat-mensajes"
            className="p-3 border-bottom"
            style={{
              height: "260px",
              minHeight: "160px",
              maxHeight: "70vh",
              overflowY: "auto",
              resize: "vertical",
            }}
          >
            {mensajes.map((item, idx) => (
              <div key={`${item.rol}-${idx}`} className="mb-2">
                <strong>{item.rol === "user" ? "Vos" : "Asistente"}:</strong>{" "}
                {item.texto}
              </div>
            ))}
          </div>
          <div className="p-3">
            <Form onSubmit={onSubmit}>
              <Form.Group className="mb-2">
                <Form.Control
                  type="text"
                  placeholder="Escribí un mensaje..."
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  disabled={enviando}
                />
              </Form.Group>
              <Button type="submit" disabled={enviando || !mensaje.trim()}>
                {enviando ? "Enviando..." : "Enviar"}
              </Button>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorChatModal;
