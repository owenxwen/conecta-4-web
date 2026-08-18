/* ==========================================================
   CONECTA4 ONLINE
   Puerto a JavaScript de las reglas del Conecta4 en Python:
   - validación de nombre
   - validación de tablero (filas/columnas > 3)
   - caída de fichas por columna (con opción aleatoria)
   - verificación de 4 en línea (horizontal, vertical, 2 diagonales)
   - tablero lleno = empate
   La sincronización entre los dos dispositivos se hace con
   Firebase Realtime Database: cada jugada se escribe en la
   sala y el otro navegador la recibe automáticamente.
   ========================================================== */

// ---------- estado local ----------
let miNombre = "";
let miSimbolo = null;       // "X" o "O"
let codigoSala = null;
let refSala = null;
let filasSala = 6;
let columnasSala = 7;
let animandoJugada = false;
let contextoAudio = null;
let ultimoFotogramaSonoro = null;

// ---------- referencias a elementos ----------
const pantallaInicio = document.getElementById("pantalla-inicio");
const pantallaEspera = document.getElementById("pantalla-espera");
const pantallaJuego = document.getElementById("pantalla-juego");
const mensajeError = document.getElementById("mensaje-error");
const VELOCIDAD_CAIDA = 250;

function mostrarPantalla(pantalla) {
  [pantallaInicio, pantallaEspera, pantallaJuego].forEach(p => p.classList.remove("activa"));
  pantalla.classList.add("activa");
}

function mostrarError(texto) {
  mensajeError.textContent = texto;
}

function prepararSonido() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  if (!contextoAudio) {
    contextoAudio = new AudioContext();
  }

  if (contextoAudio.state === "suspended") {
    contextoAudio.resume();
  }

  // Reproduce un fotograma silencioso para desbloquear el audio en móviles.
  const silencio = contextoAudio.createBuffer(
    1,
    1,
    contextoAudio.sampleRate
  );

  const fuenteSilenciosa = contextoAudio.createBufferSource();
  fuenteSilenciosa.buffer = silencio;
  fuenteSilenciosa.connect(contextoAudio.destination);
  fuenteSilenciosa.start(0);
}

function sonarFicha() {
  if (!contextoAudio || contextoAudio.state !== "running") return;

  const oscilador = contextoAudio.createOscillator();
  const volumen = contextoAudio.createGain();
  const ahora = contextoAudio.currentTime;

  oscilador.type = "sine";
  oscilador.frequency.setValueAtTime(180, ahora);

  volumen.gain.setValueAtTime(0.001, ahora);
  volumen.gain.exponentialRampToValueAtTime(0.18, ahora + 0.01);
  volumen.gain.exponentialRampToValueAtTime(0.001, ahora + 0.09);

  oscilador.connect(volumen);
  volumen.connect(contextoAudio.destination);

  oscilador.start(ahora);
  oscilador.stop(ahora + 0.1);
}

function sonarFotograma(animacion) {
  if (!animacion) {
    ultimoFotogramaSonoro = null;
    return;
  }

  const identificador = `${animacion.ficha}-${animacion.columna}-${animacion.fila}`;

  if (identificador !== ultimoFotogramaSonoro) {
    ultimoFotogramaSonoro = identificador;
    sonarFicha();
  }
}

document.addEventListener("pointerdown", prepararSonido, { once: true });

// ---------- función que verifica el nombre (igual que verificar_nombre) ----------
function verificarNombre(nombre) {
  if (nombre === "") {
    return "Se te olvidó poner tu nombre";
  }
  if (nombre.length > 10) {
    return "El nombre es demasiado largo (máximo 10 caracteres)";
  }
  for (const caracter of nombre) {
    if ("0123456789".includes(caracter)) {
      return "No se admiten números en el nombre";
    }
  }
  return null; // sin errores
}

// ---------- función que crea el tablero vacío ----------
function crearTableroVacio(filas, columnas) {
  const tabla = [];
  for (let f = 0; f < filas; f++) {
    tabla.push(new Array(columnas).fill("#"));
  }
  return tabla;
}

// ---------- función que verifica si hay 4 fichas consecutivas ----------
function verificarGanador(tabla, ficha, filas, columnas) {
  // horizontal
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c <= columnas - 4; c++) {
      if (tabla[f][c] === ficha && tabla[f][c+1] === ficha && tabla[f][c+2] === ficha && tabla[f][c+3] === ficha) {
        return true;
      }
    }
  }
  // vertical
  for (let f = 0; f <= filas - 4; f++) {
    for (let c = 0; c < columnas; c++) {
      if (tabla[f][c] === ficha && tabla[f+1][c] === ficha && tabla[f+2][c] === ficha && tabla[f+3][c] === ficha) {
        return true;
      }
    }
  }
  // diagonal ascendente
  for (let f = 3; f < filas; f++) {
    for (let c = 0; c <= columnas - 4; c++) {
      if (tabla[f][c] === ficha && tabla[f-1][c+1] === ficha && tabla[f-2][c+2] === ficha && tabla[f-3][c+3] === ficha) {
        return true;
      }
    }
  }
  // diagonal descendente
  for (let f = 0; f <= filas - 4; f++) {
    for (let c = 0; c <= columnas - 4; c++) {
      if (tabla[f][c] === ficha && tabla[f+1][c+1] === ficha && tabla[f+2][c+2] === ficha && tabla[f+3][c+3] === ficha) {
        return true;
      }
    }
  }
  return false;
}

// ---------- función que revisa si ya no quedan casillas vacías ----------
function tableroLleno(tabla) {
  return tabla.every(fila => fila.every(celda => celda !== "#"));
}

// ---------- función que ejecuta la caída de una ficha en una columna ----------
// devuelve la fila donde cayó, o null si la columna está llena
function colocarFicha(tabla, columna, ficha) {
  for (let f = tabla.length - 1; f >= 0; f--) {
    if (tabla[f][columna] === "#") {
      tabla[f][columna] = ficha;
      return f;
    }
  }
  return null;
}

// ---------- columnas disponibles (para la opción "0 / aleatorio") ----------
function columnasDisponibles(tabla) {
  const columnas = [];
  for (let c = 0; c < tabla[0].length; c++) {
    if (tabla[0][c] === "#") columnas.push(c);
  }
  return columnas;
}

// ---------- código de sala aleatorio de 4 dígitos ----------
function generarCodigoSala() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/* ==========================================================
   PANTALLA 1: nombre + crear/unirse a sala
   ========================================================== */

document.getElementById("btn-mostrar-crear").addEventListener("click", () => {
  document.getElementById("btn-mostrar-crear").classList.add("activo");
  document.getElementById("btn-mostrar-unirse").classList.remove("activo");
  document.getElementById("bloque-crear").classList.remove("oculto");
  document.getElementById("bloque-unirse").classList.add("oculto");
});

document.getElementById("btn-mostrar-unirse").addEventListener("click", () => {
  document.getElementById("btn-mostrar-unirse").classList.add("activo");
  document.getElementById("btn-mostrar-crear").classList.remove("activo");
  document.getElementById("bloque-unirse").classList.remove("oculto");
  document.getElementById("bloque-crear").classList.add("oculto");
});

document.getElementById("btn-crear").addEventListener("click", () => {
  prepararSonido();

  const nombre = document.getElementById("input-nombre").value.trim();
  const errorNombre = verificarNombre(nombre);
  if (errorNombre) return mostrarError(errorNombre);

  const filas = parseInt(document.getElementById("input-filas").value, 10);
  const columnas = parseInt(document.getElementById("input-columnas").value, 10);
  if (!filas || !columnas || filas < 4 || columnas < 4) {
    return mostrarError("Filas y columnas deben ser mayores que 3");
  }

  mostrarError("");
  miNombre = nombre;
  miSimbolo = "X";
  filasSala = filas;
  columnasSala = columnas;
  codigoSala = generarCodigoSala();
  refSala = db.ref("rooms/" + codigoSala);

  const estadoInicial = {
    filas: filas,
    columnas: columnas,
    tablero: crearTableroVacio(filas, columnas),
    turno: "X",
    jugadorX: nombre,
    jugadorO: null,
    estado: "esperando",
    ganador: null,
    animacion: null,
    marcador: { X: 0, O: 0, empates: 0 }
  };

  refSala.set(estadoInicial).then(() => {
    document.getElementById("codigo-sala").textContent = codigoSala;
    mostrarPantalla(pantallaEspera);
    escucharSala();
  });
});

document.getElementById("btn-unirse").addEventListener("click", () => {
  prepararSonido();

  const nombre = document.getElementById("input-nombre").value.trim();
  const errorNombre = verificarNombre(nombre);
  if (errorNombre) return mostrarError(errorNombre);

  const codigo = document.getElementById("input-codigo").value.trim();
  if (codigo === "") return mostrarError("Ingresa el código de la sala");

  mostrarError("");
  const ref = db.ref("rooms/" + codigo);

  ref.get().then(snapshot => {
    if (!snapshot.exists()) {
      return mostrarError("No existe una sala con ese código");
    }
    const sala = snapshot.val();
    if (sala.estado !== "esperando" || sala.jugadorO) {
      return mostrarError("Esa sala ya está llena");
    }

    miNombre = nombre;
    miSimbolo = "O";
    codigoSala = codigo;
    filasSala = sala.filas;
    columnasSala = sala.columnas;
    refSala = ref;

    // se une el jugador 2 y se decide aleatoriamente quién empieza
    const primerTurno = Math.random() < 0.5 ? "X" : "O";
    refSala.update({
      jugadorO: nombre,
      estado: "jugando",
      turno: primerTurno
    }).then(() => {
      escucharSala();
    });
  });
});

/* ==========================================================
   SINCRONIZACIÓN CON FIREBASE
   ========================================================== */

function escucharSala() {
  refSala.on("value", snapshot => {
    const sala = snapshot.val();
    if (!sala) return;

    if (sala.estado === "jugando" || sala.estado === "terminado") {
      mostrarPantalla(pantallaJuego);
      pintarSala(sala);
    }
  });
}

/* ==========================================================
   PANTALLA 3: dibujar el tablero y el estado actual
   ========================================================== */

function pintarSala(sala) {
  sonarFotograma(sala.animacion);

  document.getElementById("nombre-x").textContent = sala.jugadorX;
  document.getElementById("nombre-o").textContent = sala.jugadorO;
  document.getElementById("marcador-x").textContent = sala.marcador.X;
  document.getElementById("marcador-o").textContent = sala.marcador.O;
  document.getElementById("marcador-empates").textContent = sala.marcador.empates;

  const hayAnimacion = Boolean(sala.animacion);
  const esMiTurno = sala.turno === miSimbolo && sala.estado === "jugando" && !hayAnimacion;
  const turnoTexto = document.getElementById("turno-actual");
  if (sala.estado === "jugando") {
    const nombreEnTurno = sala.turno === "X" ? sala.jugadorX : sala.jugadorO;
    turnoTexto.textContent = esMiTurno ? "Es tu turno" : `Turno de ${nombreEnTurno}`;
  } else {
    turnoTexto.textContent = "";
  }

  dibujarTablero(sala.tablero, esMiTurno, sala.animacion || null);

  const panelResultado = document.getElementById("panel-resultado");
  const btnAleatorio = document.getElementById("btn-aleatorio");
  if (sala.estado === "terminado") {
    panelResultado.classList.remove("oculto");
    btnAleatorio.classList.add("oculto");
    const texto = document.getElementById("texto-resultado");
    if (sala.ganador === "empate") {
      texto.textContent = "La partida terminó en empate";
    } else {
      const nombreGanador = sala.ganador === "X" ? sala.jugadorX : sala.jugadorO;
      texto.textContent = `¡${nombreGanador} (${sala.ganador}) ganó la partida!`;
    }
  } else {
    panelResultado.classList.add("oculto");
    btnAleatorio.classList.remove("oculto");
  }
}

function dibujarTablero(tabla, esMiTurno, fichaEnCaida = null) {
  const contenedor = document.getElementById("tablero");
  contenedor.innerHTML = "";
  contenedor.style.gridTemplateColumns = `repeat(${columnasSala}, 1fr)`;

  for (let f = 0; f < tabla.length; f++) {
    for (let c = 0; c < tabla[f].length; c++) {
      const celda = document.createElement("button");
      celda.classList.add("celda");
      if (tabla[f][c] === "X") celda.classList.add("x");
      if (tabla[f][c] === "O") celda.classList.add("o");
      if (fichaEnCaida && fichaEnCaida.fila === f && fichaEnCaida.columna === c) {
        celda.classList.add(fichaEnCaida.ficha === "X" ? "x" : "o", "ficha-en-caida");
      }
      if (!fichaEnCaida && esMiTurno && tabla[0][c] === "#") {
        celda.classList.add("jugable");
        celda.addEventListener("click", () => jugarColumna(c));
      } else {
        celda.disabled = true;
      }
      contenedor.appendChild(celda);
    }
  }
}

/* ==========================================================
   JUGAR UNA FICHA (equivalente a la función movimientos)
   ========================================================== */

function jugarColumna(columna) {
  if (animandoJugada) return;

  refSala.get().then(snapshot => {
    const sala = snapshot.val();
    if (!sala || sala.turno !== miSimbolo || sala.estado !== "jugando") return;
    animarYAplicarJugada(sala, columna);
  });
}

document.getElementById("btn-aleatorio").addEventListener("click", () => {
  if (animandoJugada) return;

  refSala.get().then(snapshot => {
    const sala = snapshot.val();
    if (!sala || sala.turno !== miSimbolo || sala.estado !== "jugando") return;

    const disponibles = columnasDisponibles(sala.tablero);
    if (disponibles.length === 0) return;
    const columna = disponibles[Math.floor(Math.random() * disponibles.length)];
    animarYAplicarJugada(sala, columna);
  });
});

// Muestra una ficha por cada fila de la columna, dejando cada fotograma
// visible medio segundo antes de pasar al siguiente.
function esperarFotograma(milisegundos) {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      setTimeout(resolve, milisegundos);
    });
  });
}

async function animarYAplicarJugada(sala, columna) {
  if (animandoJugada) return;

  // Se copia el tablero para no modificar el estado recibido hasta el final.
  const tabla = sala.tablero.map(fila => [...fila]);
  const filaDestino = colocarFicha(tabla, columna, miSimbolo);
  if (filaDestino === null) return;

  animandoJugada = true;
  document.getElementById("btn-aleatorio").disabled = true;

  for (let fila = 0; fila <= filaDestino; fila++) {
    const fichaEnCaida = {
      fila,
      columna,
      ficha: miSimbolo
    };

    refSala.update({ animacion: fichaEnCaida });

    dibujarTablero(sala.tablero, false, fichaEnCaida);

    await new Promise(resolve => setTimeout(resolve, VELOCIDAD_CAIDA));
  }

  animandoJugada = false;
  document.getElementById("btn-aleatorio").disabled = false;
  aplicarJugada(sala, tabla);
}

function aplicarJugada(sala, tabla) {
  const gano = verificarGanador(tabla, miSimbolo, sala.filas, sala.columnas);
  const lleno = tableroLleno(tabla);

  const actualizacion = {
    tablero: tabla,
    animacion: null
  };

  if (gano) {
    actualizacion.estado = "terminado";
    actualizacion.ganador = miSimbolo;
    actualizacion[`marcador/${miSimbolo}`] = sala.marcador[miSimbolo] + 1;
  } else if (lleno) {
    actualizacion.estado = "terminado";
    actualizacion.ganador = "empate";
    actualizacion["marcador/empates"] = sala.marcador.empates + 1;
  } else {
    actualizacion.turno = miSimbolo === "X" ? "O" : "X";
  }

  refSala.update(actualizacion);
}

/* ==========================================================
   JUGAR DE NUEVO (nueva ronda, mismo marcador y sala)
   ========================================================== */

document.getElementById("btn-jugar-de-nuevo").addEventListener("click", () => {
  refSala.get().then(snapshot => {
    const sala = snapshot.val();
    const primerTurno = Math.random() < 0.5 ? "X" : "O";
    refSala.update({
      tablero: crearTableroVacio(sala.filas, sala.columnas),
      estado: "jugando",
      ganador: null,
      turno: primerTurno
    });
  });
});
