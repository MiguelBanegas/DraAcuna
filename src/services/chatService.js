export async function enviarMensaje(mensaje) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ mensaje })
  });

  if (!res.ok) {
    throw new Error("No se pudo enviar el mensaje");
  }

  const data = await res.json();
  return data.respuesta;
}
