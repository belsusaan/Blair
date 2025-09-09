// Llave ahora estará en el camino superior (accesible con la plataforma especial)
let keyX = 960, keyY = 95;
let keyCollected = false;
let doorMessageShown = false; // Para evitar repetir el mensaje de la puerta
let dialogShown = false;
let gameStarted = false;
let gameOver = false;
let startTime = 0; // Marca cuando comienza el juego para dar gracia en colisiones
let showLoseMessage = false; // Para mostrar mensaje de pérdida
let loseMessageTimer = 0; // Timer para el mensaje
let loseMessageText = ''; // Texto del mensaje de pérdida
let grabKeyText = '';
let lastMouseX = 0, lastMouseY = 0; // Variables para rastrear posición anterior del mouse
let movedX = 0, movedY = 0; // Variables para rastrear movimiento del mouse
// Tamaño del mundo (coincide con path y fondo)
const WORLD_W = 1950;
const WORLD_H = 1200;
let zoom = 1.0; // escala de pantalla (se calcula para cubrir el área visible)
let zoomMultiplier = 1.8; // Multiplicador para zoom más cerca (1.0 = normal, >1.0 = acercar)
let camX = 0, camY = 0; // cámara
let x, y; // Posición del jugador
let targetX, targetY; // Posición objetivo para suavizar movimiento
// Objetos al rededor de la pantalla
let shoeX = 530, shoeY = 560;
let shirtX = 55, shirtY = 700;
let pantX = 150, pantY = 300;
let spikeX = 620, spikeY = -80;
let tvX = 290, tvY = 530;
let tv2X = 1000, tv2Y = 980;
let spike2X = 1400, spike2Y = -100;
let touchedObject = false;

// Ventilador rotativo con aspas
let fan = {
  x: 300, 
  y: 50,
  radius: 40,         // Radio del ventilador completo
  centerRadius: 10,   // Radio del centro del ventilador
  bladeLength: 120,   // Longitud de las aspas 
  bladeWidth: 10,     // Ancho de las aspas
  bladeCount: 3,      // Número de aspas
  angle: 0,           // Ángulo de rotación inicial
  speed: -0.03        // Velocidad de rotación (negativa para girar en sentido contrario)
};

// Mensaje de dialogo y configuración del jugador.
let params = {
    mensaje: "Recoge la llave para salvar a Child",
    porcentaje: 100,
    jugador: "man"
}
let gui;

// Variables para imágenes del jugador
let manImg, womanImg;

// Plataformas mecánicas (no sobre el camino)
// A y B: oscilan verticalmente; C: especial en L (siempre sube/baja/derecha/izquierda en ciclo)
const platforms = [
  // A toca el borde del camino (x=760 es el borde derecho del último tramo del camino)
  { id:'A', type:'oscV', x: 760, y0: 455, w: 80, h: 80, amp: 80, speed: 0.0010, phase: 0.0 },
  // B pegada a A y moviéndose en contrario (phase=PI)
  { id:'B', type:'oscV', x: 840, y0: 455, w: 80, h: 80, amp: 80, speed: 0.0010, phase: 3.14159265 },
  // C pegada a B; siempre hace L: sube -> pausa -> baja -> pausa -> derecha -> pausa -> izquierda -> pausa -> repite
  { id:'C', type:'specialC', x: 920, y: 470, w: 90, h: 90, baseY: 470, yUp: 240, rightX: 1040, leftX: 920,
    vx: 0.6, vy: 0.6, state: 'goingUp', pauseMs: 800, t: 0 },
    // Cuarta plataforma 
  {id: 'D', type: 'oscV', x: 1360, y0: 300, w: 70, h: 80, amp: 100, speed: 0.0015, phase: 0.0},
  // Quinta, la que cruza dos objetos
  {id: 'E', type: 'oscV', x: 1260, y0: 790, w: 200, h: 60, amp: 200, speed: 0.0008, phase: 0.0}
];

const objects = [
  {id: "shoe", objectx: shoeX, objecty: shoeY, w: 120, h: 120, touched: false, message: "Tocaste el objeto maldito"},
  {id: "camisa", objectx: shirtX, objecty: shirtY, w: 140, h: 140, touched: false, message: "Tocaste el objeto maldito"},
  {id: "pantalon", objectx: pantX, objecty: pantY, w: 120, h: 120, touched: false, message: "Tocaste el objeto maldito"},
  {id: "puas", objectx: spikeX, objecty: spikeY, w: 200, h: 200, touched: false, message: "Tocaste el objeto maldito"},
  {id: "tv", objectx: tvX, objecty: tvY, w: 110, h: 110, touched: false, message: "Tocaste el objeto maldito"},
  {id: "tv2", objectx: tv2X, objecty: tv2Y, w: 110, h: 110, touched: false, message: "Tocaste el objeto maldito"}
]

let onPlatform = null; // índice de plataforma si estamos encima

function updatePlatforms() {
  const now = millis();
  platforms.forEach((p)=>{
    if (p.type === 'oscV') {
      p.y = p.y0 + Math.sin(now * p.speed + p.phase) * p.amp;
    } else if (p.type === 'specialC') {
      // Máquina de estados: sube -> pausa -> baja -> pausa -> derecha -> pausa -> izquierda -> pausa -> repite
      if (p.state === 'goingUp') {
        p.y -= p.vy;
        if (p.y <= p.yUp) { p.y = p.yUp; p.state = 'pauseTop'; p.t = now; }
      } else if (p.state === 'pauseTop') {
        if (now - p.t >= p.pauseMs) { p.state = 'goingDown'; }
      } else if (p.state === 'goingDown') {
        p.y += p.vy;
        if (p.y >= p.baseY) {
          p.y = p.baseY;
          p.state = 'pauseBottom';
          p.t = now;
        }
      } else if (p.state === 'pauseBottom') {
        if (now - p.t >= p.pauseMs) { p.state = 'goingRight'; }
      } else if (p.state === 'goingRight') {
        p.x += p.vx;
        if (p.x >= p.rightX) { p.x = p.rightX; p.state = 'pauseRight'; p.t = now; }
      } else if (p.state === 'pauseRight') {
        if (now - p.t >= p.pauseMs) { p.state = 'goingLeft'; }
      } else if (p.state === 'goingLeft') {
        p.x -= p.vx;
        if (p.x <= p.leftX) { p.x = p.leftX; p.state = 'pauseLeft'; p.t = now; }
      } else if (p.state === 'pauseLeft') {
        if (now - p.t >= p.pauseMs) { p.state = 'goingUp'; }
      }
    }
  });
}

function drawPlatforms() {
  push();
  noStroke();
  fill(50, 61, 63); // azul
  platforms.forEach(p=> rect(p.x, p.y, p.w, p.h));
  pop();
}

// Función para dibujar el ventilador rotativo
function drawFan() {
  push();
  // Dibujar el centro del ventilador
  fill(100, 100, 100); // Color gris para el centro
  noStroke();
  ellipse(fan.x, fan.y, fan.centerRadius * 2);
  
  // Dibujar las aspas rotando
  stroke(60, 60, 60); // Color oscuro para las aspas
  strokeWeight(fan.bladeWidth);
  strokeCap(ROUND);
  
  // Rotar cada aspa basada en el ángulo actual
  for (let i = 0; i < fan.bladeCount; i++) {
    let bladeAngle = fan.angle + (TWO_PI / fan.bladeCount) * i;
    let x1 = fan.x + cos(bladeAngle) * fan.centerRadius;
    let y1 = fan.y + sin(bladeAngle) * fan.centerRadius;
    let x2 = fan.x + cos(bladeAngle) * fan.bladeLength;
    let y2 = fan.y + sin(bladeAngle) * fan.bladeLength;
    line(x1, y1, x2, y2);
  }
  pop();
}

// Función para actualizar la rotación del ventilador
function updateFan() {
  fan.angle += fan.speed;
  // Mantener el ángulo entre 0 y 2π, considerando dirección negativa
  if (fan.angle >= TWO_PI) {
    fan.angle -= TWO_PI;
  } else if (fan.angle < 0) {
    fan.angle += TWO_PI;
  }
}

function playerOnPlatform(px, py) {
  // punto dentro de plataforma (ajuste de tolerancia)
  for (let i=0;i<platforms.length;i++){
    const p = platforms[i];
  if (px >= p.x && px <= p.x + p.w && py >= p.y && py <= p.y + p.h) {
      return i;
    }
  }
  return null;
}

// Función para comprobar si el jugador colisiona con las aspas del ventilador
function checkFanCollision(px, py) {
  // Primero verificamos si está cerca del ventilador (optimización)
  const distToFan = dist(px, py, fan.x, fan.y);
  if (distToFan > fan.bladeLength) {
    return false;
  }
  
  // Verificar colisión con cada aspa
  const playerRadius = 12; // Radio aproximado del jugador
  
  for (let i = 0; i < fan.bladeCount; i++) {
    let bladeAngle = fan.angle + (TWO_PI / fan.bladeCount) * i;
    
    // Puntos de inicio y fin del aspa
    let x1 = fan.x + cos(bladeAngle) * fan.centerRadius;
    let y1 = fan.y + sin(bladeAngle) * fan.centerRadius;
    let x2 = fan.x + cos(bladeAngle) * fan.bladeLength;
    let y2 = fan.y + sin(bladeAngle) * fan.bladeLength;
    
    // Distancia desde el punto al segmento de línea (aspa)
    let d = distToLineSegment(px, py, x1, y1, x2, y2);
    
    if (d < playerRadius + fan.bladeWidth/2) {
      return true; // Colisión detectada
    }
  }
  
  return false;
}

// Función auxiliar para calcular la distancia de un punto a un segmento de línea
function distToLineSegment(px, py, x1, y1, x2, y2) {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  
  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;
  
  if (len_sq != 0) param = dot / len_sq;
  
  let xx, yy;
  
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  
  const dx = px - xx;
  const dy = py - yy;
  
  return sqrt(dx * dx + dy * dy);
}


let path = [

  {x: 40,  y: 40,  w: 100, h: 70},
  {x: 60,  y: 110, w: 130, h: 60},
  {x: 50,  y: 170, w: 130, h: 50},
  {x: 50,  y: 220, w: 160, h: 50},
  {x: 90,  y: 270, w: 110, h: 130},
  {x: 60,  y: 400, w: 100, h: 290},
  {x: 60,  y: 690, w: 270, h: 90},
  {x: 310, y: 560, w: 100, h: 210},
  {x: 410, y: 560, w: 180, h: 60},
  {x: 520, y: 470, w: 70, h: 100},
  {x: 380, y: 400,  w: 210, h: 70},
  {x: 380, y: 300, w: 60, h: 100},
  {x: 440, y: 300, w: 150, h: 50},
  {x: 550, y: 250, w: 40, h: 90},
  {x: 310, y: 200, w: 280, h: 50},
  {x: 300, y: 50, w: 100, h: 200},
  {x: 400, y: 50, w: 300, h: 90},
  {x: 650, y: 140, w: 50, h: 400},
  {x: 650, y: 540, w: 110, h: 70},

  // Después de la tercera platafora hay dos caminos
  // Camino 1
  {x: 950, y: 230, w: 40, h: 30},   
  {x: 950, y: 190, w: 30, h: 70},
  {x: 880, y: 190, w: 100, h: 30},
  {x: 880, y: 150, w: 30, h: 70},
  {x: 800, y: 150, w: 110, h: 30},
  {x: 800, y: 110, w: 30, h: 70},
  {x: 750, y: 50, w: 230, h: 70},

  // CAMINO 2
  {x: 1130, y: 470, w: 150, h: 90},
  {x: 1100, y: 560, w: 120, h: 90},
  {x: 1050, y: 650, w: 140, h: 90},
  {x: 1050, y: 740, w: 60, h: 340},
  {x: 1110, y: 990, w: 150, h: 90},
  {x: 1370, y: 470, w: 60, h: 150},
  {x: 1310, y: 20, w: 250, h: 200},
  {x: 1560, y: 20, w: 200, h: 300},
  {x: 1670, y: 320, w: 100, h: 290},
  {x: 1710, y: 610, w: 60, h: 290},
  {x: 1725, y: 900, w: 30, h: 90},
  {x: 1725, y: 990, w: 200, h: 30},
  {x: 1920, y: 990, w: 25, h: 90},
  {x: 1795, y: 1075, w: 150, h: 20},
  {x: 1795, y: 1095, w: 15, h: 50},
  {x: 1795, y: 1145, w: 150, h: 90},
  
  
];


function setup() {
  // Crear canvas con el tamaño del contenedor #game
  const host = document.getElementById('game');
  const w = host ? host.clientWidth : window.innerWidth;
  const h = window.innerHeight;
  const cnv = createCanvas(w, h);
  if (host) cnv.parent('game');
  // Definir posición inicial del jugador
  x = 960;
  y = 95;
  targetX = x;
  targetY = y;
  inicio = millis();

  // Create screen reader accessible description
  textOutput();
  
  // Configurar GUI con estilo
  gui = { domElement: { style: {} } }; // GUI desactivado; usamos el panel lateral

  // Conectar selección de personaje en el panel lateral
  const radios = document.querySelectorAll('input[name="character"]');
  radios.forEach(r => r.addEventListener('change', (e)=>{
    params.jugador = e.target.value === 'woman' ? 'woman' : 'man';
  }));
}

function windowResized() {
  const host = document.getElementById('game');
  const w = host ? host.clientWidth : window.innerWidth;
  const h = window.innerHeight;
  resizeCanvas(w, h);
}

// poner llave
let key
let penumbraFont; // Fuente Penumbra
function preload() {
    key = loadImage("img/key.png");
    fondo = loadImage("img/fondo.png");
    manImg = loadImage("img/man.png");
    womanImg = loadImage("img/woman.png");
    penumbraFont = loadFont('font/penumbraserifstd-semibold.otf');
    camisa = loadImage("img/camisa.png");
    camisa2 = loadImage("img/camisa2.png");
    calcetas = loadImage("img/calcetas.png");
    pantalon = loadImage("img/pantalon.png");
    puas = loadImage("img/puas.png");
    tv = loadImage("img/tv.png");
    tv2 = loadImage("img/tv2.png");
    zapatos = loadImage("img/zapatos.png");
}

// Puerta de salida al final de la esquina inferior derecha
const door = { x: 1800, y: 1150, w: 50, h: 50 };

// Dibuja el camino de forma visible (sobre el fondo, debajo del jugador)
function drawPath() {
  push();
  noStroke();
  fill(194, 160, 120); // color arena sólido
  for (let p of path) {
    rect(p.x, p.y, p.w, p.h);
  }
  pop();
}

// Función para dibujar el jugador con imagen
function drawPlayer(x, y) {
  // Aislar cambios de estilo para no afectar otros dibujos (llave/fondo)
  push();
  imageMode(CENTER);
  
  // Seleccionar imagen según el parámetro del GUI
  const playerImage = (params.jugador === "man") ? manImg : womanImg;
  
  // Dibujar la imagen del jugador con tamaño reducido
  image(playerImage, x, y, 25, 25);
  pop();
}

function draw() {
  // Dibujar el fondo ocupando exactamente todo el canvas (esto limpia el frame)
  // Calcular cámara centrada en el jugador con zoom suave
  // Escala para cubrir el área visible (cover)
  const scaleX = width / WORLD_W;
  const scaleY = height / WORLD_H;
  const baseZoom = Math.max(scaleX, scaleY);
  const targetZoom = baseZoom * zoomMultiplier; // Aplicar multiplicador para zoom más cerca
  zoom = lerp(zoom, targetZoom, 0.35);
  
  // Ocultar el cursor predeterminado para usar nuestro propio cursor
  noCursor();

  // Centro ideal de cámara en el jugador
  const viewW = width / zoom;
  const viewH = height / zoom;
  let desiredX = x - viewW/2;
  let desiredY = y - viewH/2;
  // Limitar a los bordes del mundo
  desiredX = constrain(desiredX, 0, max(0, WORLD_W - viewW));
  desiredY = constrain(desiredY, 0, max(0, WORLD_H - viewH));
  camX = lerp(camX, desiredX, 0.015);
  camY = lerp(camY, desiredY, 0.015);

  push();
  translate(-camX * zoom, -camY * zoom);
  scale(zoom);
  // Dibujar fondo en mosaico para cubrir todo el viewport
  const tileW = fondo.width;
  const tileH = fondo.height;
  const startTX = Math.floor(camX / tileW) - 1;
  const startTY = Math.floor(camY / tileH) - 1;
  const tilesX = Math.ceil((camX + viewW) / tileW) - startTX + 1;
  const tilesY = Math.ceil((camY + viewH) / tileH) - startTY + 1;
  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      const px = (startTX + tx) * tileW;
      const py = (startTY + ty) * tileH;
      image(fondo, px, py, tileW, tileH);
    }
  }

  // tiempo
  let tiempoPasado = millis() - inicio;
  if(!gameStarted && tiempoPasado > 1000) {
    gameStarted = true;
    startTime = millis();
  }

  // Convertir mouse de pantalla a mundo con cámara y zoom
  const worldMouseX = camX + (mouseX / zoom);
  const worldMouseY = camY + (mouseY / zoom);
  
  // Calcular el movimiento del mouse para la orientación del cursor
  movedX = mouseX - lastMouseX;
  movedY = mouseY - lastMouseY;
  lastMouseX = mouseX;
  lastMouseY = mouseY;

  if(gameStarted && !showLoseMessage) {
    // Solo seguir el mouse si no estamos en periodo de gracia inicial
    if (millis() - startTime > 500) {
      targetX = worldMouseX;
      targetY = worldMouseY;
    }
    // Suavizar movimiento del jugador hacia la posición del mouse
    x = lerp(x, targetX, 0.05); // Factor de suavizado (0.1 = suave, 0.3 = más rápido)
    y = lerp(y, targetY, 0.05);
    // Limitar jugador a los bordes del mapa
    x = constrain(x, 0, WORLD_W);
    y = constrain(y, 0, WORLD_H);
  }

  if(!showLoseMessage) {
    // Mostrar visualmente el camino para guiar al jugador
    drawPath();

    // Actualizar y dibujar plataformas
    updatePlatforms();
    drawPlatforms();
    
    // Actualizar y dibujar el ventilador
    updateFan();
    drawFan();

    // Dibujar llave (si no recogida) dentro del mundo - solo la llave sin glow extra
    if(!keyCollected) {
      imageMode(CORNER);
      image(key, keyX - 12, keyY - 12, 24, 24);
    }

    // Dibujar puerta dentro del mundo
    push();
    noStroke();
    fill(80, 55, 45);
    rect(door.x, door.y, door.w, door.h);
    fill(220, 210, 160);
    ellipse(door.x + door.w - 8, door.y + door.h/2, 4, 4);
    pop();

    // ELEMENTOS POR ENCIMA,EXTRA
    image(zapatos, shoeX, shoeY, 120, 120);
    image(camisa2, shirtX, shirtY, 120, 120);
    image(pantalon, pantX, pantY, 120, 120);
    image(puas, spikeX, spikeY, 200, 200);
    image(tv2, tvX, tvY, 120, 120);
    image(tv, tv2X, tv2Y, 120, 120);
    image(puas, spike2X, spike2Y, 300, 300);

    // Si estamos sobre una plataforma, el jugador “viaja” con ella (se pega)
    const currentPlatform = playerOnPlatform(x, y);
    if (currentPlatform !== null) {
      onPlatform = currentPlatform;
    } else if (onPlatform !== null) {
      // Solo perder si NO está sobre el camino al salir de una plataforma
      let sobreCamino = false;
      for (let p of path) {
        if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) { sobreCamino = true; break; }
      }
      if (!sobreCamino) {
        showLoseMessage = true;
        loseMessageTimer = millis();
        loseMessageText = 'Te caíste de la plataforma.';
        setTimeout(() => {
          reStart();
        }, 2000);
        onPlatform = null;
      } else {
        onPlatform = null;
      }
    }

    // Verificar colisión con el ventilador
    if (checkFanCollision(x, y)) {
      showLoseMessage = true;
      loseMessageTimer = millis();
      loseMessageText = 'Te cortaron las aspas del ventilador.';
      setTimeout(() => {
        reStart();
      }, 2000);
    }

    // llamar función colisión de objetos
    checkObjectsCollision(x, y, 25, 25); // 25x25 es el tamaño del jugador

    // dibujar jugador con imagen
    drawPlayer(x, y);
    
    // Dibujar cursor personalizado en la posición del mouse
  push();
  translate(worldMouseX, worldMouseY);
  
  // Calcular ángulo basado en la dirección de movimiento del mouse
  // mouseX/Y son globales de p5js que se actualizan cada frame
  let deltaMouseX = movedX;
  let deltaMouseY = movedY;
  
  // Solo rotar si hay movimiento significativo
  if (abs(deltaMouseX) > 0.1 || abs(deltaMouseY) > 0.1) {
    let angle = atan2(deltaMouseY, deltaMouseX);
    rotate(angle + PI/2); // Rotar para que apunte en dirección del movimiento
  }
  
  // Dibujar triángulo pequeño
  noStroke();
  fill(255, 0, 0);
  triangle(0, -6, -3, 3, 3, 3); // Triángulo con punta hacia arriba por defecto
  pop();
  }
  
  pop(); // fin cámara

  // Dibujar overlay de mensaje de pérdida si está activo
  if (showLoseMessage) {
    push();
    textFont(penumbraFont); // Usar fuente Penumbra
    noStroke();
    fill(0, 0, 0, 180);
    rect(0, 0, width, height);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(32);
    text(loseMessageText, width/2, height/2);
    pop();
  }

  // grab key
  if(dialogShown) {
    push();
    textFont(penumbraFont); // Usar fuente Penumbra
    noStroke();
    fill(186,155,151, 100);
    rect(0, 0, width, height);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(32);
    text(grabKeyText, width/2, height/2);
    pop();
  }

  // door mensaje
  if(doorMessageShown) {
    push();
    textFont(penumbraFont); // Usar fuente Penumbra
    noStroke();
    fill(186,155,151, 100);
    rect(0, 0, width, height);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(32);
    text(doorText, width/2, height/2);
    pop();
  }


  if(!gameStarted) {
    // Overlay semitransparente en coordenadas de pantalla
    push();
    textFont(penumbraFont); // Usar fuente Penumbra
    noStroke();
    fill(0, 0, 0, 180);
    rect(0, 0, width, height);
    
    // Countdown 3, 2, 1 (evitar mostrar 0)
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(64);
    const restante = max(0, 1000 - tiempoPasado);
    const countdown = max(1, Math.ceil(restante / (1000 / 3)));
    text(countdown, width/2, height/2);
    
    // Texto instructivo
    textSize(24);
    text("Prepárate para empezar...", width/2, height/2 + 80);
    pop();
  }

  // (Llave y puerta ya se dibujaron dentro de la cámara)

  // verificar si el usuario ha tocado la llave
  let d = dist(x, y, keyX, keyY)
  if (d<40 && !keyCollected) {
    keyCollected = true;
    dialogShown = true;
    grabKeyText = 'Bien, sigue adelante';
    setTimeout(() => {
     dialogShown = false;
    }, 1000);
  }

  // Chequear llegada a la puerta
  if (x > door.x && x < door.x + door.w && y > door.y && y < door.y + door.h) {
    if (keyCollected && !gameOver) {
      gameOver = true;
      dialogShown = true;
      doorText = '¡Puerta abierta! Nivel superado.'
      doorMessageShown = true; // Evitar repetir el mensaje
      setTimeout(() => {
     dialogShown = false;
    }, 1000);
    } else if (!keyCollected && !doorMessageShown) {
      // Mostrar mensaje si no tiene la llave
      dialogShown = true;
      doorText = 'Debes ir a traer la llave para abrir la puerta.'
      doorMessageShown = true; // Evitar repetir el mensaje
      setTimeout(() => {
     dialogShown = false;
    }, 1000);
    }
  } else {
    // Resetear el mensaje si sale de la puerta
    doorMessageShown = false;
  }

  function reStart() {
    x = 125;
    y = 60;
    targetX = x;
    targetY = y;
    gameOver = false;
    gameStarted = true;
    startTime = millis();
    inicio = millis();
    objects.forEach(function(obj) {
      obj.touched = false;
    });
    doorMessageShown = false; // Resetear mensaje de puerta
    showLoseMessage = false; // Resetear mensaje de pérdida
    candleStart = performance.now(); // Reiniciar vela al perder
    // Resetear barra de progreso
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    if (progressFill) progressFill.style.width = '0%';
    if (progressText) progressText.textContent = '0%';
  }

  
// función para comprobar si el jugador colisiona con los objetos en medio del camino
function checkObjectsCollision(px, py, pw, ph) {
  for (let obj of objects) {
    let margin = 16;
    if (
      px + margin < obj.objectx + obj.w - margin &&
      px + pw - margin > obj.objectx + margin &&
      py + margin < obj.objecty + obj.h - margin &&
      py + ph - margin > obj.objecty + margin
    ) {
      if (!obj.touched) {
        obj.touched = true;
        showLoseMessage = true;
        loseMessageTimer = millis();
        loseMessageText = obj.message;
        setTimeout(() => {
          reStart();
        }, 2000);
      }
    }
  }
}

  // Verificar colisiones con el camino (con breve período de gracia)
  let dentro = false;
  for(let p of path) {
    if(x > p.x && x < p.x + p.w && y > p.y && y < p.y + p.h) {
      dentro = true;
      break;
    }
  }
  const collisionsEnabled = gameStarted && (millis() - startTime) > 350; // gracia 350ms
  if(!dentro && !gameOver && collisionsEnabled && onPlatform === null) {
    showLoseMessage = true;
    loseMessageTimer = millis();
    loseMessageText = 'Te saliste del camino. Te jalaron las patas.';
    setTimeout(() => {
      reStart();
    }, 2000);
  }

  // Actualizar barra de progreso basada en posición x
  const progressPercent = Math.min(100, (x / WORLD_W) * 100);
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  if (progressFill) {
    progressFill.style.width = progressPercent + '%';
  }
  if (progressText) {
    progressText.textContent = Math.round(progressPercent) + '%';
  }

  // Controles de zoom con teclado
  if (keyIsPressed) {
    if (key === '+') {
      zoomMultiplier = min(zoomMultiplier + 0.1, 2.0); // Máximo zoom in
    } else if (key === '-') {
      zoomMultiplier = max(zoomMultiplier - 0.1, 0.5); // Mínimo zoom out
    }
  }
}

// --- Vela y temporizador de 2 minutos ---
let candleCtx;
let candleCanvas;
let candleStart = 0;
let candleDuration = 120000; // 2 minutos en ms

function setupCandle() {
  candleCanvas = document.getElementById('candle');
  if (!candleCanvas) return;
  candleCtx = candleCanvas.getContext('2d');
  candleStart = performance.now();
  requestAnimationFrame(drawCandle);
}

function drawCandle(ts) {
  if (!candleCtx) return;
  const w = candleCanvas.width, h = candleCanvas.height;
  const elapsed = Math.min(candleDuration, ts - candleStart);
  const t = elapsed / candleDuration; // 0..1

  // Limpiar
  candleCtx.clearRect(0,0,w,h);

  // Base del candelabro
  candleCtx.fillStyle = '#3a2f2a';
  candleCtx.fillRect(w/2 - 24, h-18, 48, 8);
  candleCtx.fillRect(w/2 - 6, h-40, 12, 24);

  // Altura de la vela decreciente
  const maxHeight = 160;
  const minHeight = 12;
  const melt = maxHeight - (maxHeight - minHeight) * t;

  // Cera
  const candleX = w/2 - 16;
  const candleY = h - 40 - melt;
  candleCtx.fillStyle = '#f6e7c9';
  candleCtx.strokeStyle = '#e3d5b5';
  candleCtx.lineWidth = 2;
  // rounded rect helper
  (function rr(ctx, x, y, w2, h2, r){
    const r2 = Math.min(r, w2/2, h2/2);
    ctx.beginPath();
    ctx.moveTo(x + r2, y);
    ctx.lineTo(x + w2 - r2, y);
    ctx.quadraticCurveTo(x + w2, y, x + w2, y + r2);
    ctx.lineTo(x + w2, y + h2 - r2);
    ctx.quadraticCurveTo(x + w2, y + h2, x + w2 - r2, y + h2);
    ctx.lineTo(x + r2, y + h2);
    ctx.quadraticCurveTo(x, y + h2, x, y + h2 - r2);
    ctx.lineTo(x, y + r2);
    ctx.quadraticCurveTo(x, y, x + r2, y);
    ctx.closePath();
  })(candleCtx, candleX, candleY, 32, melt, 8);
  candleCtx.fill();
  candleCtx.stroke();

  // Gotas de cera (animación simple)
  for (let i=0;i<3;i++){
    const phase = (ts*0.001 + i*0.7);
    const gy = candleY + 12 + (Math.sin(phase)*4 + 4*i);
    candleCtx.fillStyle = '#efe0c2';
    candleCtx.beginPath();
    candleCtx.arc(candleX + 6 + 8*i, Math.min(h-42, gy), 2, 0, Math.PI*2);
    candleCtx.fill();
  }

  // Mecha
  const wickX = w/2;
  const wickY = candleY - 6;
  candleCtx.strokeStyle = '#2b2b2b';
  candleCtx.lineWidth = 2;
  candleCtx.beginPath();
  candleCtx.moveTo(wickX, wickY);
  candleCtx.lineTo(wickX, wickY+6);
  candleCtx.stroke();

  // Llama (con parpadeo)
  const flicker = 1 + Math.sin(ts*0.02) * 0.12 + Math.cos(ts*0.031)*0.08;
  const flameH = 22 * flicker * (0.9 + 0.1*Math.sin(ts*0.009));
  if (melt > minHeight + 2) {
    const grad = candleCtx.createRadialGradient(wickX, wickY, 0, wickX, wickY, flameH);
    grad.addColorStop(0, 'rgba(255, 240, 180, 0.95)');
    grad.addColorStop(0.4, 'rgba(255, 170, 60, 0.75)');
    grad.addColorStop(1, 'rgba(255, 90, 10, 0.05)');
    candleCtx.fillStyle = grad;
    candleCtx.beginPath();
    candleCtx.ellipse(wickX, wickY, 10*flicker, flameH, 0, 0, Math.PI*2);
    candleCtx.fill();
  }

  // Luz ambiental alrededor de la llama
  candleCtx.globalCompositeOperation = 'lighter';
  candleCtx.fillStyle = 'rgba(255, 210, 120, 0.12)';
  candleCtx.beginPath();
  candleCtx.ellipse(wickX, wickY+8, 36, 22, 0, 0, Math.PI*2);
  candleCtx.fill();
  candleCtx.globalCompositeOperation = 'source-over';

  // Game over cuando se apague
  if (elapsed >= candleDuration && !gameOver) {
    showLoseMessage = true;
    loseMessageTimer = millis();
    loseMessageText = 'SE FUE LA LUZ';
    setTimeout(() => {
      reStart();
    }, 2000);
  }

  requestAnimationFrame(drawCandle);
}

// Iniciar la animación de la vela (aunque el DOM ya esté listo)
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', setupCandle);
} else {
  setupCandle();
}
