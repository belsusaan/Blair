let keyX = 625, keyY = 70;
let keyCollected = false;
let dialogShown = false;
let gameStarted = false;
let gameOver = false;

// Mensaje de dialogo.
let params = {
    mensaje: "Recoge la llave para salvar a Child",
    porcentaje: 100
}
let gui;

// path de rect
 let path = [
    {x: 20,  y: 10,  w: 200, h: 90},
    {x: 65,  y: 90,  w: 120, h: 100},
    {x: 35,  y: 185, w: 215, h: 50},
    {x: 35,  y: 235, w: 215, h: 50},
    {x: 86,  y: 280, w: 140, h: 140},
    {x: 55,  y: 420, w: 205, h: 100},
    {x: 45,  y: 500, w: 550, h: 85},
    {x: 410, y: 400, w: 190, h: 120},
    {x: 430, y: 290, w: 190, h: 120},
    {x: 410, y: 180, w: 190, h: 120},
    {x: 410, y: 65,  w: 400, h: 120},
    {x: 650, y: 150, w: 190, h: 120},
    {x: 725, y: 260, w: 190, h: 120},
    {x: 785, y: 380, w: 100, h: 170}
  ]


function setup() {
  // Create the canvas
  createCanvas(1200, 600);
  x = 125;
  y = 60;
  inicio = millis();

  // Create screen reader accessible description
  textOutput();
  gui = new dat.GUI();
  gui.add(params, 'mensaje').name('');
  gui.add(params, 'porcentaje', 1, 100).name('');
}

// poner llave
let key
function preload() {
    key = loadImage("img/key.png");
    fondo = loadImage("img/fondo.png");
}

function draw() {
  image(fondo, 0, 0, width, height);

  // tiempo
  let tiempoPasado = millis() - inicio;
  if(tiempoPasado > 3000) {
    gameStarted = true;
  }

  if(gameStarted) {
    x = lerp(x, mouseX, 0.005);
    y = lerp(y, mouseY, 0.005);
  }

  // dibujar jugador
  fill(255, 204, 0);
  ellipse(x, y, 50, 50);

  if(!gameStarted) {
    fill(0);
  }

  if(gameOver) {
    fill(255, 204, 0);
    ellipse(x, y, 50, 50);
  }

  function reStart() {
    x = 125;
    y = 60;

    gameOver = false;
    gameStarted = false;

    inicio = millis();
  }

    // camino
  noStroke();
  noFill();

  for(let p of path) {
    rect(p.x, p.y, p.w, p.h);
  }

  let dentro = false;
  for(let p of path) {
    if(x > p.x && x < p.x + p.w && y > p.y && y < p.y + p.h) {
      dentro = true;
      break;
    }
  }
  if(!dentro && !gameOver) {
    gameOver = true;
    setTimeout(() => {
      alert("Te saliste del camino. Te jalaron las patas.");
      reStart();
    }, 100);
  }
}
/**
 *  // Si aun no se ha recogido la llave, la mostramos
  if(!keyCollected) {

    // iluminación para la llave
  fill(255, 155, 0, 50);
  ellipse(625, 70, 120, 120);

  fill(255, 155, 0, 100);
  ellipse(625, 70, 90, 90);

  fill(255, 155, 0, 200);
  ellipse(625, 70, 50, 50);
  // llave
  image(key, 600, 50, 50, 50);
  }

    // verificar si el usuario ha tocado la llave
  let d = dist(x, y, keyX, keyY)
  if (d<40 && !keyCollected) {
    keyCollected = true;
    setTimeout(() => {
        confirm(params.mensaje);
    }, params.porcentaje);
    dialogShown = true;
  }
 */