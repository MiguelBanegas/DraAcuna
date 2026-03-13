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
  const inputRef = useRef(null);
  const [pos, setPos] = useState({ x: null, y: null });
  const draggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragStartPosRef = useRef({ x: 0, y: 0 });

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

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [mensajes, open]);

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (!draggingRef.current) return;
      const newX = event.clientX - dragOffsetRef.current.x;
      const newY = event.clientY - dragOffsetRef.current.y;
      setPos({
        x: Math.max(8, Math.min(newX, window.innerWidth - 260)),
        y: Math.max(8, Math.min(newY, window.innerHeight - 120)),
      });
    };

    const handleMouseUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const startDrag = (event) => {
    draggingRef.current = true;
    document.body.style.userSelect = "none";

    const rect = event.currentTarget.closest("[data-chat-window]")?.getBoundingClientRect();
    const startX = rect ? rect.left : event.clientX;
    const startY = rect ? rect.top : event.clientY;
    dragStartPosRef.current = { x: startX, y: startY };
    dragOffsetRef.current = {
      x: event.clientX - startX,
      y: event.clientY - startY,
    };

    if (pos.x === null || pos.y === null) {
      setPos({ x: startX, y: startY });
    }
  };

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
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  };

  if (!esDoctora(user)) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: pos.x === null ? "24px" : "auto",
        bottom: pos.y === null ? "24px" : "auto",
        left: pos.x === null ? "auto" : `${pos.x}px`,
        top: pos.y === null ? "auto" : `${pos.y}px`,
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
          data-chat-window
          className="bg-white border rounded-4 shadow-lg"
          style={{
            width: "320px",
            minWidth: "260px",
            maxWidth: "90vw",
            resize: "both",
            overflow: "hidden",
          }}
        >
          <div
            className="d-flex align-items-center justify-content-between px-3 py-2 bg-primary text-white"
            style={{ cursor: "move" }}
            onMouseDown={startDrag}
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
                ref={inputRef}
              />
              </Form.Group>
              <Button
                type="submit"
                disabled={enviando || !mensaje.trim()}
                onMouseDown={(e) => e.preventDefault()}
              >
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
