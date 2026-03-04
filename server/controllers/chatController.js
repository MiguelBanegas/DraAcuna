export const responder = async (req, res) => {
  const { mensaje } = req.body || {};

  if (!mensaje || typeof mensaje !== "string") {
    return res.status(400).json({ error: "El mensaje es obligatorio" });
  }

  const texto = mensaje.trim();
  const textoLower = texto.toLowerCase();

  let respuesta = "Recibido. Contame un poco mas para poder ayudarte mejor.";

  if (textoLower.includes("hola")) {
    respuesta = "Hola doctora. Estoy lista para ayudarte con lo que necesites.";
  } else if (textoLower.includes("turno")) {
    respuesta = "Si queres, puedo ayudarte a organizar pendientes y recordatorios de turnos.";
  } else if (textoLower.includes("paciente")) {
    respuesta = "Perfecto. Decime el contexto del paciente y te ayudo a ordenarlo.";
  } else if (textoLower.includes("gracias")) {
    respuesta = "De nada. Cuando quieras seguimos.";
  }

  return res.json({ respuesta });
};
