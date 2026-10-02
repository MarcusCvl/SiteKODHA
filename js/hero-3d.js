// o K do hero em 3D (protótipo): três blocos de verdade, montados no código com three.js.
// ao abrir a página as peças se encaixam; depois o K inclina seguindo o mouse
// (no celular, seguindo a rolagem). se algo falhar, o hero volta para a imagem (js/hero.js)
//
// medidas, câmera e luz não são chute: foram ajustadas comparando, pixel a pixel, o 3D
// com o render do K (assets/img/k-kodha.webp) até os contornos, as faces e os tons baterem.
// a unidade é a largura da haste
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const hero = document.querySelector(".hero");
const caixa = document.querySelector(".hero-k");

function voltarParaImagem() {
  hero.classList.remove("hero-3d");
}

if (hero && caixa && hero.classList.contains("hero-3d")) {
  try {
    iniciar();
  } catch (erro) {
    console.warn("K em 3D indisponível, usando a imagem.", erro);
    voltarParaImagem();
  }
}

function iniciar() {
  /*==========cena==========*/
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  // o fundo do render é branco e o do hero é cinza-claro: o K fica um pouco mais escuro
  // que no render, para manter a mesma diferença entre as faces e o fundo
  renderer.toneMappingExposure = 0.88;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = "hero-k-3d";
  renderer.domElement.setAttribute("aria-hidden", "true");
  caixa.appendChild(renderer.domElement);
  hero.classList.add("hero-3d-carregado");

  const cena = new THREE.Scene();

  /*==========luz (ajustada para as faces terem os tons do render)==========*/
  // muita luz ambiente, como num estúdio de fundo branco
  const pmrem = new THREE.PMREMGenerator(renderer);
  cena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  cena.environmentIntensity = 0.55;
  cena.add(new THREE.HemisphereLight(0xffffff, 0x8f95a3, 1.22));

  // luz principal quase a pino, um pouco atrás e à esquerda
  const luz = new THREE.DirectionalLight(0xffffff, 1.44);
  luz.position.set(0.03, 11.67, -1.63);
  luz.target.position.set(2, 2, 0);
  luz.castShadow = true;
  luz.shadow.mapSize.set(2048, 2048);
  luz.shadow.camera.left = -6;
  luz.shadow.camera.right = 6;
  luz.shadow.camera.top = 6;
  luz.shadow.camera.bottom = -6;
  luz.shadow.bias = -0.0008;
  luz.shadow.normalBias = 0.04;
  cena.add(luz, luz.target);

  /*==========acabamento fosco==========*/
  // um ruído fino no relevo dá a textura de papel/gesso do render
  const ruido = document.createElement("canvas");
  ruido.width = ruido.height = 256;
  const pincel = ruido.getContext("2d");
  const pixels = pincel.createImageData(256, 256);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const tom = 128 + (Math.random() - 0.5) * 90;
    pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = tom;
    pixels.data[i + 3] = 255;
  }
  pincel.putImageData(pixels, 0, 0);
  const texturaRuido = new THREE.CanvasTexture(ruido);
  texturaRuido.wrapS = texturaRuido.wrapT = THREE.RepeatWrapping;
  texturaRuido.colorSpace = THREE.NoColorSpace;

  // as duas cores saíram do render
  // o branco é um pouco mais escuro que o do render: o fundo do hero é cinza-claro, e com o
  // branco puro o topo da haste sumia nele
  const branco = new THREE.MeshStandardMaterial({ color: "#e4e5e9", roughness: 0.9, metalness: 0, bumpScale: 0.3 });
  const azul = new THREE.MeshStandardMaterial({ color: "#004ee2", roughness: 0.8, metalness: 0, bumpScale: 0.3 });

  /*==========o K==========*/
  const profundidade = 1.37; // a haste é mais funda do que larga

  // o K gira em torno do meio dele (x = 2), não da haste
  const k = new THREE.Group();
  k.position.x = 2;
  cena.add(k);
  const pecasDoK = new THREE.Group();
  pecasDoK.position.x = -2;
  k.add(pecasDoK);

  function acabamento(malha, repeticaoX, repeticaoY) {
    const grao = texturaRuido.clone();
    grao.repeat.set(repeticaoX, repeticaoY);
    grao.needsUpdate = true;
    malha.material.bumpMap = grao;
    malha.castShadow = true;
    malha.receiveShadow = true;
    malha.material.transparent = true;
    malha.material.opacity = 0;
    return malha;
  }

  // haste: bloco de x -1 a 0, do chão até 6,23.
  // o ruído repete conforme o tamanho, para o grão ficar do mesmo tamanho em todas as peças
  const alturaHaste = 6.23;
  const haste = acabamento(new THREE.Mesh(new RoundedBoxGeometry(1, alturaHaste, profundidade, 5, 0.05), branco.clone()), 2.5, alturaHaste * 2.5);
  haste.position.set(-0.5, alturaHaste / 2, 0);

  // as diagonais são peças de 4 cantos no plano da letra, com o lado esquerdo cortado rente à
  // haste (como as hastes de um K de verdade). os cantos vieram do ajuste com o render.
  // as duas ficam um pouco à frente da haste: por isso a ponta cortada da azul aparece,
  // escura, ao lado dela. cada peça gira e se move em torno do ponto onde encosta na haste
  function diagonal(cantos, fundo, frente, material, pivo) {
    const bisel = 0.04;
    const forma = new THREE.Shape(cantos.map(([x, y]) => new THREE.Vector2(x - pivo[0], y - pivo[1])));
    const geometria = new THREE.ExtrudeGeometry(forma, {
      depth: fundo - 2 * bisel,
      bevelEnabled: true,
      bevelThickness: bisel,
      bevelSize: bisel,
      bevelSegments: 3,
      curveSegments: 1,
    });
    geometria.translate(0, 0, -(fundo - 2 * bisel) / 2);
    const malha = acabamento(new THREE.Mesh(geometria, material.clone()), 2.5, 2.5);
    const peca = new THREE.Group();
    peca.position.set(pivo[0], pivo[1], frente);
    peca.add(malha);
    return { peca, malha };
  }

  // peça azul: rente à haste de 2,64 a 4,25 do chão; a ponta passa do topo da haste.
  // perto da haste ela fica na frente da branca, como no render
  const { peca: pecaAzul, malha: blocoAzul } = diagonal(
    [
      [0, 2.644],
      [4.82, 6.667],
      [3.826, 7.378],
      [0, 4.252],
    ],
    profundidade * 0.98,
    0.29,
    azul,
    [0, 3.45]
  );

  // peça branca: cortada em chanfro rente à borda de baixo da azul, como uma peça apoiada
  // na outra (as duas nunca se atravessam). entre a ponta dela e a haste sobra um vão
  // pequeno, como no render. o pé apoia no chão
  const { peca: pecaBranca, malha: blocoBranco } = diagonal(
    [
      [0.974, 3.437],
      [0.121, 2.725],
      [3.493, -0.286],
      [4.849, 0.205],
    ],
    profundidade * 0.94,
    0.3,
    branco,
    [0.6, 2.9]
  );


  /*==========sombras de contato==========*/
  // onde as diagonais encostam, o render escurece a face clara da haste perto da borda
  // direita. é um degradê pintado por cima da face
  function degradeContato(desenhar) {
    const tela = document.createElement("canvas");
    tela.width = tela.height = 128;
    const pincelContato = tela.getContext("2d");
    const imagem = pincelContato.createImageData(128, 128);
    for (let y = 0; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        const i = (y * 128 + x) * 4;
        imagem.data[i] = 22;
        imagem.data[i + 1] = 24;
        imagem.data[i + 2] = 34;
        imagem.data[i + 3] = Math.round(255 * desenhar(x / 127, 1 - y / 127));
      }
    }
    pincelContato.putImageData(imagem, 0, 0);
    const textura = new THREE.CanvasTexture(tela);
    textura.wrapS = textura.wrapT = THREE.ClampToEdgeWrapping;
    return textura;
  }
  const materialContato = (textura) =>
    new THREE.MeshBasicMaterial({ map: textura, transparent: true, depthWrite: false, opacity: 0, polygonOffset: true, polygonOffsetFactor: -2 });

  // face clara da haste: escurece da borda direita para dentro, mais forte embaixo
  const contatoHaste = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 4),
    materialContato(degradeContato((x, y) => 0.42 * Math.pow(x, 2.2) * Math.min(1, (1 - y) * 1.6)))
  );
  contatoHaste.position.set(-0.25, 2, profundidade / 2 + 0.002);
  pecasDoK.add(contatoHaste);


  pecasDoK.add(haste, pecaAzul, pecaBranca);

  /*==========sombra no chão==========*/
  // manchas suaves desenhadas embaixo da haste e do pé da peça branca
  const mancha = document.createElement("canvas");
  mancha.width = mancha.height = 128;
  const pincelMancha = mancha.getContext("2d");
  const degrade = pincelMancha.createRadialGradient(64, 64, 0, 64, 64, 64);
  degrade.addColorStop(0, "rgba(20, 22, 32, 0.55)");
  degrade.addColorStop(0.45, "rgba(20, 22, 32, 0.22)");
  degrade.addColorStop(1, "rgba(20, 22, 32, 0)");
  pincelMancha.fillStyle = degrade;
  pincelMancha.fillRect(0, 0, 128, 128);
  const texturaMancha = new THREE.CanvasTexture(mancha);

  function sombra(x, y, largura, fundo, forca) {
    const material = new THREE.MeshBasicMaterial({ map: texturaMancha, transparent: true, depthWrite: false, opacity: 0 });
    const plano = new THREE.Mesh(new THREE.PlaneGeometry(largura, fundo), material);
    plano.rotation.x = -Math.PI / 2;
    plano.position.set(x, y, 0);
    plano.userData.forca = forca;
    pecasDoK.add(plano);
    return plano;
  }
  // o pé da peça branca fica um pouco abaixo do pé da haste, como no render
  const sombraHaste = sombra(-0.4, 0.002, 2.8, 2.6, 0.85);
  const sombraPe = sombra(3.9, -0.28, 2.4, 2, 0.75);

  /*==========câmera (a mesma do render)==========*/
  // o enquadramento do render (1212 x 1298) cai exatamente onde a imagem do K ficava;
  // o canvas sobra 10% para cada lado, para a inclinação não cortar nada (ver .hero-k-3d)
  const quadroLargura = 1212;
  const quadroAltura = 1298;
  const sobra = 0.1;
  const camera = new THREE.PerspectiveCamera(19.92, quadroLargura / quadroAltura, 0.1, 100);
  const giroCamera = THREE.MathUtils.degToRad(-42.57);
  camera.position.set(1.25 + 24.5 * Math.sin(giroCamera), 2.17, 24.5 * Math.cos(giroCamera));
  camera.lookAt(1.25, 3.38, 0);
  camera.setViewOffset(
    quadroLargura,
    quadroAltura,
    -sobra * quadroLargura,
    -sobra * quadroAltura,
    quadroLargura * (1 + 2 * sobra),
    quadroAltura * (1 + 2 * sobra)
  );

  function ajustarTamanho() {
    const largura = renderer.domElement.clientWidth;
    const altura = renderer.domElement.clientHeight;
    if (!largura || !altura) return;
    renderer.setSize(largura, altura, false);
  }
  new ResizeObserver(ajustarTamanho).observe(renderer.domElement);
  ajustarTamanho();

  /*==========montagem==========*/
  // cada peça sai de um ponto e chega no lugar: posição, giro e opacidade
  const pecas = [
    { objeto: haste, malha: haste, inicio: 150, duracao: 900, de: { x: 0, y: -2, z: 0, rx: 0, ry: 0, rz: 0 }, volta: false },
    { objeto: pecaBranca, malha: blocoBranco, inicio: 520, duracao: 950, de: { x: 3.6, y: -0.5, z: 2.4, rx: 0, ry: 0.7, rz: -0.45 }, volta: true },
    { objeto: pecaAzul, malha: blocoAzul, inicio: 820, duracao: 1000, de: { x: 2.8, y: 3.8, z: -2, rx: 0.5, ry: -0.6, rz: 0.55 }, volta: true },
  ];
  pecas.forEach((peca) => {
    peca.final = {
      x: peca.objeto.position.x,
      y: peca.objeto.position.y,
      z: peca.objeto.position.z,
      rx: peca.objeto.rotation.x,
      ry: peca.objeto.rotation.y,
      rz: peca.objeto.rotation.z,
    };
  });

  const suave = (t) => 1 - Math.pow(1 - t, 3);
  // passa um pouco do ponto e volta: o "encaixe" das diagonais
  const encaixe = (t) => {
    const c = 1.4;
    return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
  };

  let comeco = null;
  let montado = false;

  function montar(agora) {
    if (comeco === null) comeco = agora;
    let terminou = true;

    pecas.forEach((peca) => {
      const t = Math.min(Math.max((agora - comeco - peca.inicio) / peca.duracao, 0), 1);
      if (t < 1) terminou = false;
      const p = (peca.volta ? encaixe : suave)(t);
      const resto = 1 - p;
      const { final, de, objeto } = peca;
      objeto.position.set(final.x + de.x * resto, final.y + de.y * resto, final.z + de.z * resto);
      objeto.rotation.set(final.rx + de.rx * resto, final.ry + de.ry * resto, final.rz + de.rz * resto);
      peca.malha.material.opacity = suave(Math.min(t * 1.8, 1));
      // a sombra não fica transparente junto com a peça: só aparece quando ela já está quase inteira
      peca.malha.castShadow = t > 0.5;
      peca.t = t;
    });

    // a sombra no chão aparece junto com a peça que está em cima dela
    sombraHaste.material.opacity = sombraHaste.userData.forca * suave(pecas[0].t);
    sombraPe.material.opacity = sombraPe.userData.forca * suave(pecas[1].t);
    contatoHaste.material.opacity = suave(pecas[1].t);

    if (terminou) {
      montado = true;
      // opaco de novo: sem transparência o three.js desenha as peças com a ordem certa
      pecas.forEach((peca) => (peca.malha.material.transparent = false));
    }
  }

  /*==========inclinação: mouse no computador, rolagem no celular==========*/
  const semMouse = window.matchMedia("(hover: none)").matches;
  const inclinacao = { x: 0, y: 0 };
  const destino = { x: 0, y: 0 };

  if (!semMouse) {
    window.addEventListener(
      "pointermove",
      (evento) => {
        const mx = (evento.clientX / window.innerWidth) * 2 - 1;
        const my = (evento.clientY / window.innerHeight) * 2 - 1;
        destino.y = mx * 0.12;
        destino.x = my * 0.04;
      },
      { passive: true }
    );
  }

  function inclinacaoPelaRolagem() {
    const caixaHero = hero.getBoundingClientRect();
    const progresso = Math.min(Math.max(-caixaHero.top / caixaHero.height, 0), 1);
    destino.y = progresso * 0.5;
    destino.x = progresso * 0.06;
  }

  /*==========desenho: só enquanto o hero está na tela==========*/
  let visivel = true;
  let quadro = null;

  function desenhar(agora) {
    quadro = null;
    if (!montado) montar(agora);
    if (semMouse) inclinacaoPelaRolagem();

    inclinacao.x += (destino.x - inclinacao.x) * 0.06;
    inclinacao.y += (destino.y - inclinacao.y) * 0.06;
    k.rotation.set(inclinacao.x, inclinacao.y, 0);

    renderer.render(cena, camera);
    if (visivel) quadro = requestAnimationFrame(desenhar);
  }

  new IntersectionObserver(([entrada]) => {
    visivel = entrada.isIntersecting;
    if (visivel && quadro === null) quadro = requestAnimationFrame(desenhar);
  }).observe(hero);

  quadro = requestAnimationFrame(desenhar);
}
