/* ============================================================================
   SORPRESA BEBÉ — CONFIGURACIÓN DEL BACKEND
   ----------------------------------------------------------------------------
   ESTE ES EL ÚNICO ARCHIVO QUE HAY QUE EDITAR PARA CONECTAR LA PÁGINA
   CON LA BASE DE DATOS.

   La Data API de MongoDB Atlas está RETIRADA (fin de vida útil), así que
   la página ya no habla directo con Atlas. Ahora habla con un backend
   pequeño en Vercel (ver ~/workspace/sorpresa-bebe-backend/), que es
   el que se conecta a Atlas con la contraseña guardada como variable
   de entorno en Vercel. Aquí NO va ninguna contraseña ni cadena de
   conexión: solo la URL pública del backend.

   - Si BACKEND_URL está vacío, la página SIGUE FUNCIONANDO: los votos,
     cartas y registros se guardan solo en el celular de cada persona
     (localStorage) y se muestra un aviso discreto.
   - Para activarlo, pon aquí la URL de Vercel, sin "/" al final, por
     ejemplo: "https://sorpresa-bebe-backend.vercel.app"
   - Para envíos reales de WhatsApp o correo, el registro del footer
     SOLO GUARDA el contacto. Enviar mensajes necesita un servicio
     aparte (por ejemplo Resend/SendGrid para correo, o la API de
     WhatsApp Business / Twilio para WhatsApp). Ver README.md.
   ========================================================================== */

window.SORPRESA_CONFIG = {
  // URL pública del backend en Render (sin "/" al final).
  // Ejemplo: "https://sorpresa-bebe-backend.onrender.com"
  BACKEND_URL: "https://sorpresa-bebe-backend.onrender.com",

  // Nombre de la base de datos en Atlas (informativo; la usa el backend).
  DATABASE: "sorpresa_bebe",

  // Nombres de las colecciones (informativo; las usa el backend).
  COLLECTIONS: {
    votes: "votes",                 // { name, sex: "nino" | "nina", voter, createdAt }
    letters: "letters",             // { author, message, createdAt }
    subscriptions: "subscriptions"  // { channel: "whatsapp" | "email", contact, name, createdAt }
  }
};
