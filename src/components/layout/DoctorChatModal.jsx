import { useEffect, useRef, useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
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
  const [show, setShow] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensajes, setMensajes] = useState([mensajeInicial]);
  const estabaLogueadaRef = useRef(false);

  useEffect(() => {
    const logueada = Boolean(user);

    if (logueada && !estabaLogueadaRef.current && esDoctora(user)) {
      setShow(true);
      setMensajes([mensajeInicial]);
      setMensaje("");
    }

    if (!logueada) {
      setShow(false);
      setMensajes([mensajeInicial]);
      setMensaje("");
    }

    estabaLogueadaRef.current = logueada;
  }, [user]);

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

  return (
    <Modal show={show} onHide={() => setShow(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title>Chat de asistencia</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div
          className="border rounded p-2 mb-3"
          style={{ maxHeight: "260px", overflowY: "auto" }}
        >
          {mensajes.map((item, idx) => (
            <div key={`${item.rol}-${idx}`} className="mb-2">
              <strong>{item.rol === "user" ? "Vos" : "Asistente"}:</strong>{" "}
              {item.texto}
            </div>
          ))}
        </div>

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
      </Modal.Body>
    </Modal>
  );
};

export default DoctorChatModal;
