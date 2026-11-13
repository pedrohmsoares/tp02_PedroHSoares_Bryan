# Diário de Bordo — TP2 Paraíso (Computação Gráfica)

Registro de todas as alterações e adições feitas no código.

**Padrão de cada entrada:**

```
## [AAAA-MM-DD] Título da adição

**Código alterado/adicionado/removido:**
(trecho do código)

**Descrição:** o que foi feito e por quê.
```

---

## [2026-11-11] Início do projeto

**Código alterado/adicionado/removido:** nenhum código ainda.

**Descrição:** Criei a pasta `referencias/` com o enunciado (`enunciado-tp2.md`) e o código-fonte dos slides das aulas (`aulas/`), para consultar sem depender da internet. O repositório `tp02_PedroHSoares_Bryan/` continua vazio.

---

## [2026-11-11] Referências visuais do tema (Luffy Gear 4)

**Código alterado/adicionado/removido:** nenhum código.

**Descrição:** Criei `referencias/imagens/` com as imagens das poses, do skydome (gaiola do Doflamingo) e da fumaça, e `referencias/videos/links.md` com o link do vídeo. A origem de cada imagem está em `imagens/links.md`.

**Decisões aprovadas:** Luffy montado com sólidos hierárquicos; animação do pulo com blend shape (squash & stretch); opcionais extras de neblina (tecla N) e poses alternativas, somando 6 opcionais.

---

## [2026-11-11] Ferramentas definidas

**Código alterado/adicionado/removido:** nenhum código.

**Descrição:** Fechamos o pacote de ferramentas, todas tiradas das aulas ou do enunciado:
- WebGL2 com GLSL 300 es, shaders em arquivos `.glsl` separados.
- Da TWGL.js, só `m4`, `v3` e `primitives`. Shaders, buffers e texturas em WebGL puro, como no código da aula.
- Módulos ES sem build. Servidor local com `python3 -m http.server`.
- Câmeras escritas por nós, com `pointermove` e `wheel`.
- Texturas em imagem (com créditos) e procedurais no shader (as linhas do skydome).
- Som com `new Audio()`, publicação no GitHub Pages, commits dos dois ao longo do tempo.
- Controle só pelo teclado (P, 1, 2, L, N), sem painel de interface.

---

## [2026-11-11] Estrutura inicial do repositório

**Código alterado/adicionado/removido:**

```
tp02_PedroHSoares_Bryan/
├── index.html, style.css, main.js, camera.js, README.md   (vazios)
├── twgl.full.module.js       (TWGL.js 7.0.0, copiada do repo da aula)
├── utils/   shader.js, buffers.js, texture.js              (vazios)
├── scene/   ground, rock, ruin, sunflower, pinwheel, luffy, skydome, smoke (.js, vazios)
├── shaders/ phong.*, sky.*, smoke.* (.vertex/.fragment.glsl), luffy.vertex.glsl (vazios)
└── assets/  textures/ (.gitkeep), sounds/luffyBouncing.mp3
```

**Descrição:** Criei as pastas e os arquivos vazios da estrutura aprovada, no padrão do repo `ufci-cg-dynamic-lighting`. A TWGL.js é a mesma versão da aula (7.0.0). Movi o som de `referencias/efeitosSonoros/` para `assets/sounds/` e corrigi o nome para `luffyBouncing.mp3`. Nomes de arquivos e do código em inglês. Nada foi commitado.

---

## [2026-11-11] Plano de desenvolvimento aprovado

**Código alterado/adicionado/removido:** nenhum código.

**Descrição:** Ordem de desenvolvimento aprovada pelo Pedro. O cenário fica fixo e só o Luffy muda de posição e orientação com a tecla P.
1. Base técnica: canvas, loop de render, `utils/`, câmeras 1 e 2, Phong (tecla L) e neblina (tecla N).
2. Chão e hemisfério inferior.
3. Pedra, ruína, girassol e catavento.
4. Skydome.
5. Luffy, pose 1.
6. Animação do pulo (blend shape) e som sincronizado.
7. Poses 2 e 3, com a tecla P.
8. Fumaça.
9. README, GitHub Pages e vídeo.

Cada passo é apresentado ao Pedro antes de ser implementado.

---

## [2026-11-11] Etapa 1: Base técnica (WebGL2, câmeras, Phong, neblina)

**Código alterado/adicionado/removido:**

Arquivos adicionados: `index.html`, `style.css`, `main.js`, `camera.js`, `utils/shader.js`, `utils/buffers.js`, `utils/texture.js`, `shaders/phong.vertex.glsl`, `shaders/phong.fragment.glsl`. Fora do repositório: `tp02/.claude/launch.json` (servidor local com `python3 -m http.server 8000`).

`utils/buffers.js`: transforma um sólido da TWGL em VAO + VBOs + IBO
```js
export function createMesh(gl, vertices) {
    const vao = gl.createVertexArray()
    gl.bindVertexArray(vao)
    createAttribute(gl, ATTRIBUTES.a_coords, vertices.position, 3)
    createAttribute(gl, ATTRIBUTES.a_normal, vertices.normal, 3)
    createAttribute(gl, ATTRIBUTES.a_texcoord, vertices.texcoord, 2)
    const ibo = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, vertices.indices, gl.STATIC_DRAW)
    ...
    return { vao, draw(gl) { gl.bindVertexArray(vao); gl.drawElements(gl.TRIANGLES, count, indexType, 0) } }
}
```

`shaders/phong.fragment.glsl`: Phong por fragmento com luz direcional, liga/desliga e neblina EXP2
```glsl
if (u_lightingEnabled) {
    vec3 N = normalize(v_normal);
    vec3 L = normalize(-u_lightDirection);
    vec3 V = normalize(u_cameraPosition - v_worldPos);
    vec3 R = reflect(-L, N);
    vec3 ambient = u_ambient * u_lightColor * albedo;
    float diffuseFactor = max(dot(N, L), 0.0);
    vec3 diffuse = u_diffuse * diffuseFactor * u_lightColor * albedo;
    float specularFactor = diffuseFactor > 0.0 ? pow(max(dot(R, V), 0.0), u_shininess) : 0.0;
    vec3 specular = u_specular * specularFactor * u_lightColor;
    color = ambient + diffuse + specular;
}
if (u_fogEnabled) {
    float d = distance(u_cameraPosition, v_worldPos);
    float fogFactor = exp(-pow(u_fogDensity * d, 2.0));
    color = mix(u_fogColor, color, fogFactor);
}
```

`camera.js`: câmera 1 (45°, girando sozinha) e câmera 2 (orbital pelo mouse), scroll nas duas
```js
1: { azimuth: 0, elevation: Math.PI / 4, distance: 14, speed: 0.2 },
2: { azimuth: Math.PI / 6, elevation: 0.4, distance: 14 }
...
export function updateCamera(dt) {
    cameras[1].azimuth += cameras[1].speed * dt
    const { azimuth, elevation, distance } = cameras[cameras.active]
    camera.position = [ ...coordenadas esféricas em volta do alvo... ]
    camera.viewMatrix = m4.inverse(m4.lookAt(camera.position, target, [0, 1, 0]))
}
```

`main.js`: estado da cena, teclado e loop de render
```js
light: { direction: [-0.4, -1.0, -0.3], color: [1.0, 0.88, 0.72], enabled: true },
fog:   { enabled: false, color: [0.55, 0.52, 0.48], density: 0.06 },
...
if (e.code === 'Digit1') selectCamera(1)
if (e.code === 'Digit2') selectCamera(2)
if (e.code === 'KeyL') state.light.enabled = !state.light.enabled
if (e.code === 'KeyN') state.fog.enabled = !state.fog.enabled
```

**Descrição:** Base técnica do projeto, seguindo o padrão do repo `ufci-cg-dynamic-lighting`:
- `utils/shader.js` carrega os `.glsl` com `fetch`, compila e linka o programa.
- `utils/buffers.js` cria o VAO a partir dos `primitives` da TWGL.
- `utils/texture.js` cria uma textura branca de 1x1, para o mesmo shader servir em objetos com e sem imagem.
- **Iluminação:** Phong com uma luz direcional quente vinda de cima e de lado, como combinamos. Cada objeto tem o próprio material (ka, kd, ks, brilho).
- **Neblina:** exponencial ao quadrado (`GL_EXP2` da aula de iluminação), cinza-poeira. A cor de fundo é a da neblina, como no `glFog`.
- **Teclas:** 1 e 2 trocam a câmera, L liga e desliga a luz, N liga e desliga a neblina.
- **Objetos de teste (temporários):** um cubo fosco, uma esfera brilhante e um anel de cubinhos para ver a neblina. Saem na etapa 2.
- **Teste no navegador:** câmeras, zoom, L e N funcionando, sem erros no console.

---

## [2026-11-11] Etapa 2: Chão e hemisfério inferior

**Código alterado/adicionado/removido:**

Adicionado: `scene/ground.js`. Texturas: `assets/textures/ground.jpg` (Poly Haven, *rock_face_03*, renomeada de `chao.jpg`) e `assets/textures/rock.jpg` (Poly Haven, *dark_rock*).

`utils/texture.js`: nova função para carregar uma imagem como textura
```js
export function loadTexture(gl, url) {
    return new Promise((resolve, reject) => {
        const image = new Image()
        image.onload = () => {
            const texture = gl.createTexture()
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
            gl.generateMipmap(gl.TEXTURE_2D)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
            resolve(texture)
        }
        ...
    })
}
```

`scene/ground.js`: disco e hemisfério da TWGL, com ajuste das coordenadas de textura
```js
export const GROUND_RADIUS = 6

const disc = primitives.createDiscVertices(GROUND_RADIUS, 64)
planarTexcoords(disc, GROUND_RADIUS, 3)          // (x, z) -> (s, t), repete 3x

// só a metade de baixo da esfera: latitude de π/2 (equador) até π (polo sul)
const hemisphere = primitives.createSphereVertices(GROUND_RADIUS, 64, 16, Math.PI / 2, Math.PI)
scaleTexcoords(hemisphere, 4, 1)                 // repete 4x na volta, 1x na altura

// rocha: color [1.8, 1.7, 1.6] e ambient 0.8 (textura muito escura)
```

`main.js`:
```js
// removido: createTestObjects() (cubo, esfera e anel de cubinhos da etapa 1)
// adicionado:
import { createGround } from './scene/ground.js'
state.objects.push(...await createGround(gl))
// no render, cada objeto usa a própria textura (ou a branca, se não tiver):
gl.bindTexture(gl.TEXTURE_2D, object.texture ?? state.whiteTexture)
```

**Descrição:**
- **Chão:** disco de raio 6 com a textura de terra rachada.
- **Hemisfério:** metade de baixo de uma esfera de mesmo raio, com a textura de rocha escura. Parece um pedaço de Dressrosa arrancado do chão.
- **Coordenadas de textura:**
  - O disco da TWGL vem com coordenadas polares, que deixariam a textura girando em volta do centro. Troquei por um mapeamento planar, a "função de mapeamento" da aula de texturas.
  - No hemisfério, aumentei a repetição na volta para a rocha não ficar esticada.
- **Ajuste da rocha:** a textura é muito escura (brilho médio de 0.12) e a parte de baixo só recebe luz ambiente, por isso ficava preta. Clareei a cor base e subi o `ambient` do material.
- **Objetos de teste:** removidos.
- **Teste no navegador:** sem erros no console, com as duas câmeras e a neblina.

---

## [2026-11-11] Etapa 3: Grafo de cena, pedra, ruína, girassol e catavento

**Código alterado/adicionado/removido:**

Adicionados: `utils/scene.js`, `scene/rock.js`, `scene/ruin.js`, `scene/sunflower.js`, `scene/pinwheel.js`. Texturas: `assets/textures/stone.jpg` (ambientCG *Rocks015*, só o mapa `_Color`) e `assets/textures/ruin.jpg` (ambientCG *Tiles135C*, só o mapa `_Color`). Os `.zip` originais foram movidos para `referencias/texturas/`, para não pesar no repositório.

`utils/scene.js`: nó do grafo de cena
```js
export function createNode({ mesh = null, texture = null, color = [1, 1, 1, 1], material = null,
                             matrix = m4.identity(), children = [], update = null } = {}) {
    return { mesh, texture, color, material, matrix, children, update }
}
export function transform({ translation, rotation, scale })   // T * Ry * Rx * Rz * S
export function updateNode(node, dt)                           // chama update de cada nó
```

`main.js`: desenho recursivo (no lugar do `for` sobre `state.objects`)
```js
function drawNode(gl, node, parentMatrix) {
    const worldMatrix = m4.multiply(parentMatrix, node.matrix)
    if (node.mesh) { /* textura, u_model = worldMatrix, cor, material, draw */ }
    for (const child of node.children) drawNode(gl, child, worldMatrix)
}
state.scene = createNode({ children: await Promise.all([
    createGround(gl), createRocks(gl), createRuin(gl), createSunflower(gl), createPinwheel(gl)
]) })
// no loop: updateNode(state.scene, dt)
```

`scene/ground.js`: passou a devolver um nó com 2 filhos (disco e hemisfério), em vez de uma lista.

`scene/rock.js`: pedra low-poly
```js
const rock = primitives.deindexVertices(primitives.createSphereVertices(1, 9, 6))
// cada vértice: raio * (0.75 + 0.4 * hash(posição)), achatado em y (0.7)
// normal de cada triângulo = normalize(cross(b - a, c - a))  -> flat shading
// mesma malha desenhada 3x com escalas/rotações diferentes
```

`scene/pinwheel.js`: catavento hierárquico
```js
// catavento -> mastro (fixo) + rotor (gira em z) -> eixo + 4 pás
update(node, dt) {
    node.angle = (node.angle ?? 0) + ROTOR_SPEED * dt
    node.matrix = m4.rotateZ(m4.translation(rotorPosition), node.angle)
}
```

**Descrição:**
- **Grafo de cena** (aula de otimização de cenas): cada objeto é uma árvore de nós, e a matriz de cada peça é a do pai vezes a dela. É isso que faz as pás do catavento girarem presas ao mastro.
- **Pedra:** esfera com poucas divisões e os vértices deslocados por um "hash" da posição. O hash é arredondado para os vértices repetidos da costura e dos polos receberem o mesmo deslocamento, sem abrir buracos na malha. As normais são calculadas por triângulo (flat shading), para dar o visual low-poly. São 3 pedras com a mesma malha, reaproveitando o VAO como na aula de otimização 1.
- **Ruína:** parede alta, parede lateral baixa, coluna em pé, coluna caída e 2 blocos soltos, todos feitos com cubo e cilindro escalados, com a textura de azulejo quebrado.
- **Girassol:** caule, 2 folhas e miolo, mais 5 das 12 posições de pétala, para parecer destruído. Só cores, com materiais diferentes (as pétalas são mais brilhantes).
- **Catavento:** mastro fixo e rotor girando a 2 rad/s, com o eixo amarelo e 4 pás vermelhas levemente inclinadas.
- **Disposição:** ruína atrás à esquerda, catavento atrás à direita, pedras à esquerda e girassol à direita. O centro fica livre para o Luffy.
- **Teste no navegador:** sem erros no console, e o catavento girando.

---

## [2026-11-11] Etapa 3 (ajuste): mais pedras e ruínas, muro na borda, catavento e girassol reposicionados

**Código alterado/adicionado/removido:**

`scene/rock.js`: a lista `ROCKS` passou de 3 para 13 pedras, e foi criada a pedra do girassol
```js
export const SUNFLOWER_ROCK = { translation: [4.56, 0.18, -0.08], rotation: [0, 0.8, 0], scale: 0.6 }
const ROCKS = [
    /* 3 pedras da esquerda (já existiam) */,
    { translation: [0.4, 0.15, -4.7], ... scale: 0.45 },     // ao lado da coluna
    { translation: [-1.57, 0.17, -3.0], ... scale: 0.5 },    // encostada na ruína
    SUNFLOWER_ROCK,
    /* 7 pedrinhas de cascalho (escala ~0.15) perto do centro */
]
```

`scene/ruin.js`: a ruína principal agora tem matriz exportada, há destroços espalhados e um muro na borda
```js
export const MAIN_RUIN = transform({ translation: [-2.4, 0, -3.0], rotation: [0, 0.4, 0] })
export const MAIN_WALL_TOP = [0.9, 2.4, 0]
const DEBRIS = [ /* toco de coluna, bloco tombado, parede desabada + 2 blocos, 3 blocos pequenos */ ]

// muro: 24 blocos num arco de raio 5.5, de 167° a 385° (esquerda -> fundo -> direita)
const height = 0.4 + 1.1 * random(i)              // altura irregular
if (random(i) < 0.12) continue                    // alguns blocos caíram (buracos)
translation: [R * cos(angle), height / 2, R * sin(angle)]
rotation: [0, -angle - Math.PI / 2, 0]            // tangente à borda
```

`scene/pinwheel.js`:
```js
const MAST_HEIGHT = 1.4                           // antes 2.4
matrix: m4.translate(MAIN_RUIN, MAIN_WALL_TOP)    // antes: chão em (2.8, 0, -2.8)
```

`scene/sunflower.js`:
```js
// antes: chão em (3.5, 0, 1.0)
matrix: transform({ translation: [SUNFLOWER_ROCK.translation[0], 0.35, SUNFLOWER_ROCK.translation[2]], rotation: [0, -0.9, 0] })
```

**Descrição:**
- **Origem das posições:** vieram do desenho do Pedro sobre a vista de cima (preto = pedras, azul = ruínas, vermelho = muro). Os pixels foram convertidos em coordenadas do mundo, com centro ≈ (252, 258) px e 39.5 px por unidade.
- **Pedras novas:** usam a mesma malha low-poly. O tamanho de cada uma segue o círculo desenhado.
- **Ruínas novas:** toco de coluna ao fundo, bloco tombado à direita, um pedaço de parede desabado na frente à direita e blocos pequenos perto do centro.
- **Muro na borda:** blocos tangentes ao círculo, com altura irregular e alguns buracos, para parecer destruído.
- **Catavento:** saiu do chão e foi para cima da parede principal da ruína, compondo a matriz da ruína com o ponto do topo da parede. O mastro diminuiu para 1.4.
- **Girassol:** a base ficou dentro da pedra da direita, então o caule parece sair de uma fresta.
- **Teste no navegador:** a vista de cima confere com o desenho, sem erros no console.

---

## [2026-11-11] Etapa 4: Skydome (céu com nuvens) e gaiola do Doflamingo

**Código alterado/adicionado/removido:**

Adicionados: `scene/skydome.js`, `scene/birdcage.js`, `shaders/cage.vertex.glsl`, `shaders/cage.fragment.glsl`. Preenchidos: `shaders/sky.vertex.glsl`, `shaders/sky.fragment.glsl`.

`shaders/sky.vertex.glsl`: o domo acompanha a posição da câmera, sem girar com ela
```glsl
v_direction = a_coords;
gl_Position = u_projection * u_view * vec4(a_coords + u_cameraPosition, 1.0);
```

`shaders/sky.fragment.glsl`: gradiente e nuvens procedurais (ruído de valor + fbm)
```glsl
vec3 color = mix(u_horizonColor, u_zenithColor, sqrt(height));
vec2 uv = dir.xz / (dir.y + 0.2) * 1.5 + vec2(u_time * 0.01, 0.0);   // "teto" plano, nuvens andando
float clouds = smoothstep(0.55, 0.62, fbm(uv)) * smoothstep(0.02, 0.2, dir.y);
color = mix(color, vec3(1.0), clouds * 0.9);
if (u_fogEnabled) color = mix(color, u_fogColor, mix(1.0, 0.5, smoothstep(0.0, 0.5, height)));
```

`shaders/cage.fragment.glsl`: linhas da gaiola como meridianos, vidro translúcido
```glsl
float longitude = atan(v_localPos.z, v_localPos.x);
float t = fract(longitude / (2.0 * PI) * u_lineCount);
float line = 1.0 - smoothstep(0.04, 0.08, min(t, 1.0 - t));
line = max(line, smoothstep(0.9, 1.0, height) * 0.8);        // topo mais branco
float rim = 1.0 - abs(dot(N, V));                            // borda mais visível
float alpha = mix(0.05 + 0.15 * rim, 0.65, line);
```

`scene/skydome.js`: hemisfério de raio 50, desenhado primeiro, sem teste de profundidade e sem culling
```js
primitives.createSphereVertices(SKY_RADIUS, 32, 16, 0, Math.PI / 2)
export const HORIZON_COLOR = [0.7, 0.83, 0.95]
const ZENITH_COLOR = [0.15, 0.45, 0.85]
```

`scene/birdcage.js`: hemisfério com o raio do chão e 15% mais alto, desenhado por último com blending
```js
primitives.createSphereVertices(GROUND_RADIUS, 64, 32, 0, Math.PI / 2)
const model = m4.scaling([1, 1.15, 1])
gl.enable(gl.BLEND)
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
gl.depthMask(false)
gl.disable(gl.CULL_FACE)
```

`main.js`:
```js
gl.clearColor(...(fog.enabled ? fog.color : HORIZON_COLOR), 1)   // antes: sempre a cor da neblina
state.sky.draw(gl, view)          // 1º: céu
drawNode(gl, state.scene, ...)    // 2º: objetos opacos
state.cage.draw(gl, view)         // 3º: transparentes por último
state.time += dt                  // tempo para as nuvens andarem
```

**Descrição:**
- **Interpretação aprovada:** a imagem de referência mostra a gaiola cobrindo a ilha por fora, com o céu atrás. Por isso são duas peças.
- **Skydome:** hemisfério que acompanha a câmera, como nos slides da aula de efeitos visuais.
  - **Desenho:** é o primeiro a ser desenhado, então tudo fica na frente dele.
  - **Shader:** azul mais claro no horizonte e nuvens geradas por ruído (textura procedural, aula de texturas). As nuvens andam devagar com o tempo.
  - **Neblina:** com N ligado, o horizonte vira a cor da neblina, como no exemplo do Temple Run 2.
- **Gaiola:** hemisfério fixo sobre o diorama, com 64 linhas que descem do topo.
  - **Linhas:** dependem só da longitude do ponto.
  - **Vidro:** é quase invisível no centro e um pouco mais visível na borda.
  - **Altura:** é 15% mais alta que meia esfera, para o catavento (em cima da ruína) caber dentro.
  - **Transparência:** é desenhada por último, com blending, sem gravar profundidade e sem culling, como o enunciado pede para objetos transparentes. Conta como o opcional "Material transparente".
- **Observação:** o navegador guardou os arquivos antigos em cache. Ao testar mudanças, use Ctrl+Shift+R.
- **Teste no navegador:** sem erros no console, com as câmeras e a neblina (N).

---

## [2026-11-11] Primeiro commit e push: cenário

**Código alterado/adicionado/removido:** nenhum código. Commit `7482b16` na branch `main`, enviado para `origin` (github.com/pedrohmsoares/tp02_PedroHSoares_Bryan).

**Descrição:**
- **Conteúdo:** primeiro commit, com todo o cenário (etapas 1 a 4).
- **Autor:** `pedrohmsoares`, com o e-mail configurado só neste repositório e sem linha de co-autoria.
- **Fora do commit:** os arquivos ainda vazios (`README.md`, `scene/luffy.js`, `scene/smoke.js`, `shaders/luffy.vertex.glsl`, `shaders/smoke.*.glsl`, `assets/textures/.gitkeep`) e o som (`assets/sounds/`). Entram quando forem usados.

---

## [2026-11-11] Etapa 5: Luffy Gear 4, pose 1 (neutra)

**Código alterado/adicionado/removido:**

Adicionado: `scene/luffy.js`. Alterados: `utils/texture.js` (nova função) e `main.js` (Luffy entra na cena).

`utils/texture.js`: textura procedural a partir de uma função de cor
```js
export function createProceduralTexture(gl, size, colorAt) {
    const data = new Uint8Array(size * size * 4)
    for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++)
            data.set([...colorAt(x / size, y / size), 255], (y * size + x) * 4)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, data)
    gl.generateMipmap(gl.TEXTURE_2D)   // + REPEAT e LINEAR_MIPMAP_LINEAR
}
```

`scene/luffy.js`: hierarquia, poses e texturas do haki e da tatuagem
```js
// luffy -> quadril -> (short, faixa, quadril_E/D -> coxa -> joelho -> canela/pé,
//                      coluna -> tronco/colete -> pescoço -> cabeça/cabelo/rosto,
//                                                ombro_E/D -> braço -> cotovelo -> antebraço/punho)
export const POSES = {
    neutral: {
        root: { translation: [0, 0, 0], rotation: [0, 0, 0] },
        joints: {
            spine: [0.05, 0, 0], neck: [0.1, 0, 0],
            shoulder_L: [0, 0, 0.28], shoulder_R: [0, 0, -0.28],
            elbow_L: [-0.5, 0, 0.1], elbow_R: [-0.5, 0, -0.1],
            hip_L: [-0.35, 0, 0.12], hip_R: [-0.35, 0, -0.12],
            knee_L: [0.6, 0, 0], knee_R: [0.6, 0, 0]
        }
    }
}

function hakiColor(s, t) {     // preto com listras vermelhas onduladas
    const wave = Math.sin(t * Math.PI * 6) * 0.05
    const stripe = Math.abs(((s * 5 + wave * 5) % 1) - 0.5)
    return stripe < 0.07 ? [150, 18, 18] : [22, 12, 12]
}
function chestColor(s, t) { /* pele + "chamas" vermelhas no alto do peito */ }

// colete: esfera aberta na frente (longitude em volta de +z fica de fora)
primitives.createSphereVertices(1, 24, 12, 0.15 * Math.PI, 0.75 * Math.PI,
                                Math.PI / 2 + 0.7, Math.PI / 2 + 2 * Math.PI - 0.7)

function joint(name, offset, children) { /* nó vazio; a rotação vem da pose */ }
export function applyPose(luffy, pose) {
    luffy.matrix = transform(pose.root)
    for (const [name, { node, offset }] of Object.entries(luffy.joints))
        node.matrix = transform({ translation: offset, rotation: pose.joints[name] ?? [0, 0, 0] })
}
```

`main.js`:
```js
import { createLuffy } from './scene/luffy.js'
// ... children: [..., createPinwheel(gl), createLuffy(gl)]
```

**Descrição:**
- **Modelagem:** o Luffy Gear 4 (Boundman) é feito só com sólidos da TWGL (esfera, cubo, cilindro, cone e toro), em hierarquia.
  - **Articulações:** quadris, joelhos, coluna, pescoço, ombros e cotovelos são nós vazios. A pose só muda a rotação deles, então as poses 2 e 3 (etapa 7) vão ser só outra entrada na tabela `POSES`.
  - **Proporções:** parte de cima enorme, com peito e braços inflados, pernas pequenas e cerca de 2.3 de altura com o cabelo.
- **Detalhes, como aprovado:**
  - **Rosto:** olhos inclinados, com cara de bravo, e sorriso de dentes.
  - **Cabelo:** uma "touca" preta e 12 espetos (cones).
  - **Roupa:** corda no pescoço, colete aberto na frente (uma esfera com um corte de longitude), faixa amarela com a ponta caída e punhos de pelo branco no short.
- **Texturas procedurais** (aula de texturas, `texImage2D` com array de cores):
  - **Haki:** preto avermelhado com listras vermelhas onduladas, nos braços e nas pernas.
  - **Peito:** pele com as marcas vermelhas em forma de chama.
- **Materiais:** o haki e o cabelo são bem brilhantes (ks 0.9, brilho 64), a pele é fosca e as roupas mais ainda.
- **Ajustes após o teste:** cabeça e cabelo maiores, olhos e sorriso reposicionados, corda abaixo do queixo e braços mais perto do corpo.
- **Teste no navegador:** sem erros no console, visto de frente e de lado.

---

## [2026-11-11] Luffy Boundman (modelo com esqueleto), skinning e as 3 poses (tecla P)

**Código alterado/adicionado/removido:**

Adicionados: `utils/xps.js`, `shaders/skin.vertex.glsl`, `assets/models/boundman/` (`boundman.xps` + 6 texturas `*_BCX.png`). Reescrito: `scene/luffy.js`. Alterados: `utils/buffers.js` e `main.js`.
Removido do repositório: o Luffy de sólidos, movido para `referencias/plano-b/luffy-solidos.js` (plano B).

`utils/xps.js`: leitor do formato binário XPS (XNALara 2.x) com `DataView`
```js
// cabeçalho (número mágico 323232) -> ossos (nome, pai, posição)
// -> malhas (nome, texturas, vértices: posição, normal, cor, uv, 4 ossos, 4 pesos; triângulos)
string() { /* tamanho em 7 bits por byte, depois o texto UTF-8 */ }
export async function loadXps(url) { ... return { bones, meshes } }
```

`shaders/skin.vertex.glsl`: skinning (aula de animação)
```glsl
layout(location = 3) in vec4 a_boneIndices;
layout(location = 4) in vec4 a_boneWeights;
uniform mat4 u_bones[MAX_BONES];          // MAX_BONES 180
mat4 skin = a_boneWeights.x * u_bones[bone.x] + a_boneWeights.y * u_bones[bone.y]
          + a_boneWeights.z * u_bones[bone.z] + a_boneWeights.w * u_bones[bone.w];
vec4 skinnedPosition = skin * vec4(a_coords, 1.0);
vec3 skinnedNormal = mat3(skin) * a_normal;
```

`utils/buffers.js`: atributos extras no VAO
```js
export const ATTRIBUTES = { a_coords: 0, a_normal: 1, a_texcoord: 2, a_boneIndices: 3, a_boneWeights: 4 }
export function createMesh(gl, vertices, extraAttributes = []) { ... }
```

`scene/luffy.js`: poses como tabelas de rotação de ossos
```js
export const POSES = [
    { name: 'neutra', root: { translation: [0, 0, 0], rotation: [0, 0, 0] }, gunArms: false,
      bones: { 'Bip001 L UpperArm': [0, 0, -0.25], 'Bip001 L Forearm': [-0.35, 0, 0], ... } },
    { name: 'ataque básico', root: { translation: [0.6, 0, 0.4], rotation: [0, -Math.PI / 2, 0] }, gunArms: false,
      bones: { 'Bip001 R UpperArm': [0, Math.PI / 2, -0.7], 'Bip001 L UpperArm': [0, 0.8, 0.5], ... } },
    { name: 'King Kong Gun', root: { translation: [-0.6, 0, 0.4], rotation: [0, Math.PI / 2, 0] }, gunArms: true,
      bones: { 'Hand03_R00': [0, -0.9, 0.6], 'Hand03_L00': [0, -Math.PI / 2, 0.75], ... } }
]
// osso no mundo = pai * T(posição - posição do pai) * R(pose)
// matriz do shader = mundo * T(-posição de bind)
function applyPose(pose) { ... }
```

`main.js`:
```js
const SKIN_UNIFORMS = [...UNIFORMS, 'u_bones']
state.skinProgram = await createProgramFromFiles(gl, 'shaders/skin.vertex.glsl', 'shaders/phong.fragment.glsl')
state.luffy = await createLuffy(gl)
if (e.code === 'KeyP') state.luffy.nextPose()
function setSceneUniforms(gl, locations) { /* câmera, luz e neblina: usada pelos 2 programas */ }
// render: cenário (Phong) -> Luffy (skinning) -> gaiola (transparente)
```

**Descrição:**
- **Troca do Luffy:** saiu o de sólidos e entrou o modelo **Boundman (Dressrosa)**, extraído do jogo *One Piece Fighting Path* por *o_dv89_o*, com texturas e esqueleto (177 ossos no padrão Biped).
- **Leitura:** o `.xps` binário é lido direto em JavaScript, sem Blender. São 9 malhas. A fumaça (`cloud`) fica escondida, porque faremos a nossa com partículas.
- **Skinning:** cada vértice segue até 4 ossos, conforme os pesos.
  - **Pose de bind:** o modelo está guardado com os ossos sem rotação, só com posição. Então a matriz de cada osso é `pai * T(deslocamento) * R(pose)`, e o shader recebe `mundo * T(-posição de bind)`.
- **3 poses na tecla P:** cada uma muda posição, orientação e ossos, e isso cumpre também o opcional "Poses alternativas".
  1. **Neutra:** de frente, braços para baixo.
  2. **Ataque básico:** virado para a esquerda, soco com o braço direito.
  3. **King Kong Gun:** virado para a direita, usando a malha de **braços inflados** (`ArmsGun`) que já vem no modelo.
- **Materiais:** os braços (haki) são mais brilhantes. Pele e roupas são foscas.
- **Sem animação ainda**, como o Pedro pediu.
- **Limite de uniforms:** o shader usa 180 matrizes (720 vetores de uniform). A placa deste computador aceita 1024.
- **Teste no navegador:** as 3 poses aparecem corretamente com a tecla P.

---

## [2026-11-11] Correção: Luffy sem rosto (ordem dos triângulos do XPS)

**Código alterado/adicionado/removido:**

`utils/xps.js`:
```js
// antes:
for (let i = 0; i < indices.length; i++) indices[i] = r.u32()

// depois: troca o 2º e o 3º vértice de cada triângulo
for (let t = 0; t < triangleCount; t++) {
    indices[t * 3] = r.u32()
    indices[t * 3 + 2] = r.u32()
    indices[t * 3 + 1] = r.u32()
}
```

**Descrição:**
- **Problema:** o Luffy aparecia sem rosto. Não faltava textura: as 9 malhas do XPS guardam os triângulos em sentido horário, o padrão do DirectX. Conferi comparando a normal de cada triângulo com as normais dos vértices: 0% batiam no sentido anti-horário.
- **Causa:** o WebGL considera frente o sentido anti-horário. Com o `CULL_FACE` ligado, ele descartava as faces da frente e mostrava as de trás, ou seja, o lado de dentro da cabeça e do corpo.
- **Correção:** inverter a ordem ao carregar. O rosto, o colete e o peito agora aparecem pela frente.

---

## [2026-11-11] Pose 1: rosto bravo, punhos cerrados e braços arqueados

**Código alterado/adicionado/removido:**

`scene/luffy.js`: um osso da pose pode receber `{ rotation, translation }`, além da rotação simples
```js
const value = pose.bones[bone.name] ?? {}
const { rotation = [0, 0, 0], translation = [0, 0, 0] } = Array.isArray(value) ? { rotation: value } : value
const local = transform({ translation: offset.map((v, k) => v + translation[k]), rotation })
```

Rosto bravo (ossos faciais do modelo):
```js
const ANGRY_FACE = {
    'facebone_15': { translation: [-0.004, -0.012, -0.004] },   // entre as sobrancelhas: franze
    'facebone_050': { translation: [0.004, -0.012, -0.004] },
    'facebone_05': { translation: [0, -0.006, 0] },              // meio das sobrancelhas desce
    'facebone_051': { translation: [0, -0.006, 0] },
    'facebone_01': [0.22, 0, 0],                                 // mandíbula abre
    'facebone_22': { translation: [0, 0.008, 0] }, /* ... */     // lábio de cima sobe
    'facebone_13': { translation: [0.008, -0.002, -0.002] },     // cantos da boca para os lados
    'facebone_30': { translation: [-0.008, -0.002, -0.002] }
}
```

Punhos cerrados (3 falanges por dedo, mais o polegar):
```js
const CURL = 0.85
function fist(fingers, thumb, side) {
    for (const name of fingers) bones[name] = [0, 0, CURL * side]   // dobra para a palma
    bones[thumb[0]] = [0, 0.5 * -side, 0.4 * side]                  // polegar fecha por cima
    ...
}
const LEFT_FIST = fist([...range('Hand01_L', 2, 4), ...], range('Hand01_L', 14, 16), -1)
const RIGHT_FIST = fist([...range('Hand01_R', 3, 5), ...], range('Hand01_R', 12, 14), 1)
```

Pose 1 (neutra):
```js
bones: {
    ...ANGRY_FACE, ...LEFT_FIST, ...RIGHT_FIST,
    'Bip001 L UpperArm': [-0.2, -0.3, -0.45],   // antes [0, 0, -0.25]
    'Bip001 R UpperArm': [-0.2, 0.3, 0.45],     // antes [0, 0, 0.25]
    'Bip001 L Forearm': [-0.8, 0.3, -0.1],      // antes [-0.35, 0, 0]
    'Bip001 R Forearm': [-0.8, -0.3, 0.1],      // antes [-0.35, 0, 0]
    ...
}
```

**Descrição:**
- **Rosto bravo:** o modelo tem ossos no rosto. As sobrancelhas franzem (o meio desce e vai para trás), a mandíbula abre mostrando os dentes cerrados e os cantos da boca abrem para os lados. A textura já tem as linhas de testa franzida. Para mexer nos ossos do rosto, a pose passou a aceitar translação, além da rotação.
- **Punhos cerrados:** as 3 falanges dos 4 dedos dobram em z, na direção da palma, e o polegar fecha por cima.
  - **Mão esquerda:** `Hand01_L02` a `L13`.
  - **Mão direita:** `Hand01_R03` a `R17`.
- **Braços arqueados:** os ombros abaixam e vão para frente, e os cotovelos dobram para frente e para dentro. Os punhos ficam na frente do quadril, em arco, como na figure de referência.
- **Teste:** para ver o rosto de perto, mudei temporariamente o alvo e a distância mínima da câmera em `camera.js` e **voltei ao original** (alvo [0, 0, 0], distância mínima 4).
- **Poses 2 e 3:** não foram alteradas, como o Pedro pediu.

---

## [2026-11-11] Pose 1: punhos totalmente fechados (dedos dobrando no eixo certo)

**Código alterado/adicionado/removido:**

`scene/luffy.js`: removidos `CURL`, `fist()`, `range()`, `LEFT_FIST` e `RIGHT_FIST`. Entram:
```js
const HANDS = [
    { side: 1, fingers: [['Hand01_L11', 'Hand01_L12', 'Hand01_L13'], /* médio, anelar, mindinho */],
      thumb: ['Hand01_L14', 'Hand01_L15', 'Hand01_L16'], wrist: 'Hand01_L01' },
    { side: -1, fingers: [['Hand01_R15', 'Hand01_R16', 'Hand01_R17'], /* ... */],
      thumb: ['Hand01_R12', 'Hand01_R13', 'Hand01_R14'], wrist: 'Hand01_R02' }
]
const FINGER_CURL = [1.4, 1.5, 1.2]
const THUMB_TURN = 1.0
const THUMB_CURL = [0.5, 0.9]

function fistBones(bones) {
    // eixo dos nós dos dedos: do mindinho até o indicador (posições de bind)
    const knuckles = v3.normalize(v3.subtract(position[index[0]], position[pinky[0]]))
    const along = v3.normalize(v3.subtract(position[hand.fingers[1][0]], position[hand.wrist]))
    result[falange] = { matrix: m4.axisRotation(knuckles, FINGER_CURL[k] * hand.side) }
    // polegar: base gira em torno do eixo da mão, falanges dobram por cima dos dedos
    result[base] = { matrix: m4.axisRotation(along, THUMB_TURN * hand.side) }
    ...
}
```

Pose aceita uma matriz de rotação pronta, e a pose 1 liga os punhos:
```js
const poseBones = pose.fists ? { ...fists, ...pose.bones } : pose.bones
const { rotation = [0, 0, 0], translation = [0, 0, 0], matrix } = Array.isArray(value) ? { rotation: value } : value
const local = matrix ? m4.multiply(m4.translation(moved), matrix) : transform({ translation: moved, rotation })
// POSES[0]: fists: true
```

**Descrição:**
- **Problema:** os dedos ficavam tortos e para fora da mão. A dobra era uma rotação no eixo z do mundo, mas os nós dos dedos do modelo não ficam alinhados com esse eixo.
- **Correção:** cada falange agora gira em torno do **eixo dos nós dos dedos** (a linha do mindinho até o indicador), calculado a partir das posições dos ossos no bind, com `m4.axisRotation`. Com ângulos maiores (1.4, 1.5 e 1.2 rad), as pontas dos dedos tocam a palma.
- **Polegar:** gira em torno do eixo da mão (do pulso até a base do dedo médio) e dobra por cima dos dedos.
- **Mão direita:** usa o mesmo cálculo, com o sinal invertido (espelhada).
- **Teste:** câmera apontada temporariamente para cada punho, vista por 4 lados. Os dois ficaram fechados. A câmera voltou ao original e o código de depuração foi removido.

---

## [2026-11-11] Pose 1: punhos virados para dentro (torção do pulso)

**Código alterado/adicionado/removido:**

`scene/luffy.js`:
```js
// torção do pulso: com os braços na pose 1, a palma ficava virada para fora
const WRIST_TWIST = Math.PI + 0.25

// em fistBones(), antes dos dedos:
result[hand.wrist] = { matrix: m4.axisRotation(along, WRIST_TWIST * hand.side) }
```

**Descrição:**
- **Problema:** os punhos fechavam virados para fora, com a palma e as pontas dos dedos para o lado de fora do corpo.
- **Correção:** o osso do pulso (`Hand01_L01` / `Hand01_R02`) gira em torno do eixo da própria mão (do pulso até a base do dedo médio). Os dedos são filhos dele, então o punho inteiro gira junto.
- **Escolha do ângulo:** medi a direção nó do dedo → ponta do dedo para 12 ângulos de torção. Com 0, era (0.77, 0.23, -0.6), para fora. Com π + 0.25, fica perto de (-0.97, -0.1, 0.1), virada para o corpo.
- **Teste:** câmera temporária no punho e depuração temporária no código. As duas foram removidas e a câmera voltou ao original.

---

## [2026-11-12] Poses vindas do Blender: leitor de `.pose` (XPS)

**Código alterado/adicionado/removido:**

Adicionados: `utils/pose.js` e a pasta `assets/poses/` (por enquanto vazia). Alterado: `scene/luffy.js`.

`utils/pose.js`:
```js
// cada linha: "nome do osso: rotX rotY rotZ moveX moveY moveZ escalaX escalaY escalaZ" (graus)
const ROTATION_ORDER = ['y', 'x', 'z']
export async function loadPose(url) {
    ...
    bones[name] = { matrix: rotationMatrix(values.slice(0, 3)), translation: values.slice(3, 6), scale: values.slice(6, 9) }
}
```

`scene/luffy.js`:
```js
const POSE_FOLDER = 'assets/poses/'
// POSES[0]: file: 'pose1.pose', keepFace: true

for (const pose of POSES) {
    if (!pose.file) continue
    const fileBones = await loadPose(POSE_FOLDER + pose.file)
    if (Object.keys(fileBones).length > 0) pose.fileBones = fileBones   // sem arquivo: pose do código
}

const poseBones = pose.fileBones
    ? { ...pose.fileBones, ...(pose.keepFace ? ANGRY_FACE : {}) }
    : pose.fists ? { ...fists, ...pose.bones } : pose.bones

// a pose agora também aplica escala: T * R * S
const local = matrix
    ? m4.scale(m4.multiply(m4.translation(moved), matrix), scale)
    : transform({ translation: moved, rotation, scale })
```

**Descrição:**
- **Por quê:** o Pedro vai ajustar as poses no Blender, com o add-on XPS Tools, e exportar arquivos `.pose`.
- **Formato:** o `.pose` é texto, com uma linha por osso: rotação em graus, translação e escala.
- **Pose 1:** se existir `assets/poses/pose1.pose`, ele substitui a tabela da pose 1 do código. O **rosto bravo** continua vindo do código (`keepFace`). Sem o arquivo, a pose do código continua valendo. Enquanto o arquivo não existir, o console mostra um 404, o que é esperado.
- **Teste:** com um arquivo temporário girando os dois braços (já apagado), a leitura funcionou.
- **A confirmar com o primeiro arquivo real do Blender:** a ordem das rotações (`ROTATION_ORDER`) e o sinal dos ângulos.

---

## [2026-11-12] Plano B para poses do Blender: script de exportação (sem o add-on)

**Código alterado/adicionado/removido:**

Fora do repositório:
- `referencias/blender/exportar_pose.py`: script para rodar na aba *Scripting* do Blender.
- Add-on XPS Tools (`~/.config/blender/5.3/scripts/addons/XNALaraMesh/`): `try/except` na criação de materiais. Os originais estão salvos como `.bak`.

```python
# deformação de cada osso, no sistema do modelo (Y para cima)
d = mundo @ osso_pose.matrix @ osso_pose.bone.matrix_local.inverted() @ mundo.inverted()
d = BLENDER_PARA_XPS @ d @ XPS_PARA_BLENDER          # XPS (x, y, z) -> Blender (x, -z, y)
# rotação local do osso = parte de rotação de D_pai^-1 * D_osso
rotacao = (d_pai.inverted() @ d).to_3x3().normalized()
angulos = rotacao.to_euler('YXZ')                     # mesma ordem de utils/pose.js
linhas.append(f'{osso.name}: {rx} {ry} {rz} 0 0 0 1 1 1')
```

**Descrição:**
- **Por que o plano B:** o add-on XPS Tools é antigo demais para o Blender 5.3. O primeiro erro veio do `ShaderNodeSeparateRGB`, que contornei pulando os materiais. O segundo veio do `pose.bone_groups`, removido no Blender 4. Consertar tudo iria longe.
- **Como funciona:** o Pedro abre o `.blend` que já vem com o modelo (`OPFPLuffyDressRosaGear4.blend`, com o esqueleto pronto), faz a pose e roda o script. O script grava `assets/poses/pose1.pose` no formato que o `utils/pose.js` já lê.
- **A conta:** no projeto, a matriz do shader de cada osso é `S = mundo do osso * T(-posição de bind)`, que é igual à deformação `D = pose * repouso⁻¹` do Blender. Então a rotação local de cada osso é a parte de rotação de `D_pai⁻¹ * D_osso`, depois de converter os eixos do Blender (Z para cima) para os do modelo (Y para cima).
- **Conferência:** o script imprime a posição da mão esquerda convertida. Ela deve dar perto de (1.355, 0.913, -0.128), que é o valor do `.xps`. Se não der, a conversão de eixos precisa de ajuste.

---

## [2026-11-12] Pose 1: braços arqueados a 60°, punhos virados para o corpo e rosto neutro

**Código alterado/adicionado/removido:**

`scene/luffy.js`:
```js
// pose 1 (neutra): sem ANGRY_FACE e sem file/keepFace
'Bip001 L UpperArm': [0, 0, 0.26],
'Bip001 R UpperArm': [0, 0, -0.26],
'Bip001 L Forearm': [0, 0, -1.4],
'Bip001 R Forearm': [0, 0, 1.4],

// fistBones: dedos dobram para o lado da palma; sem torção do pulso (WRIST_TWIST removido)
result[name] = { matrix: m4.axisRotation(knuckles, -FINGER_CURL[k] * hand.side) }
// polegar: o eixo já sai espelhado pelo produto vetorial, então não leva side
result[middle] = { matrix: m4.axisRotation(thumbAxis, THUMB_CURL[0]) }
result[tip] = { matrix: m4.axisRotation(thumbAxis, THUMB_CURL[1]) }

// applyPose: pose vinda de arquivo mantém o punho fechado do código (fists)
const poseBones = pose.fileBones
    ? { ...pose.fileBones, ...(pose.fists ? fists : {}), ...(pose.keepFace ? ANGRY_FACE : {}) }
    : pose.fists ? { ...fists, ...pose.bones } : pose.bones
```

**Descrição:**
- **Braços:** ajustados ao vivo no navegador com o Pedro. O braço sobe 15° em relação ao bind (que está a 45°) e fica a ~60° do tronco. O cotovelo dobra para dentro, no plano do corpo, e o punho volta para perto do quadril.
- **Dedos dobravam para trás:** o eixo dos nós dos dedos aponta para +z nas duas mãos. Com o ângulo `+side`, a mão esquerda dobrava os dedos para as costas da mão, e o `WRIST_TWIST = π+0.25` girava a mão ~194° só para esconder isso. Esse giro rasgava a malha no pulso, e passar o giro para o antebraço deixava o antebraço invertido. Com `-side`, os dedos dobram para a palma, e o pulso não precisa mais girar.
- **Dedão para fora:** o eixo das falanges do polegar (`cross(thumbDirection, along)`) já espelha sozinho entre as mãos. Multiplicar também por `side` invertia uma das mãos, que deixava o dedão para fora. Tirei o `side`.
- **Rosto neutro:** a pose 1 agora usa o rosto do próprio modelo. O `ANGRY_FACE` continua no código para outras poses.
- **Arquivo `.pose`:** a pose 1 não lê mais o `pose1.pose`. Se uma pose usar `file`, o punho fechado (`fists`) e o rosto bravo (`keepFace`) continuam vindo do código, porque os nomes dos dedos não espelham no Blender.

---

## [2026-11-12] Pose 1: animação de respiração

**Código alterado/adicionado/removido:**

`scene/luffy.js`:
```js
const BREATH_PERIOD = 3.5
const BREATH = { chest: 0.035, shoulders: 0.05 }

function breathingBones(time) {
    const breath = (1 - Math.cos(2 * Math.PI * time / BREATH_PERIOD)) / 2   // 0 a 1
    const chest = -BREATH.chest * breath
    const shoulders = BREATH.shoulders * breath
    return {
        'Bip001 Spine1': [chest / 2, 0, 0],
        'Bip001 Spine2': [chest / 2, 0, 0],
        'Bip001 Neck': [-chest, 0, 0],
        'Bip001 L Clavicle': [0, 0, shoulders],
        'Bip001 R Clavicle': [0, 0, -shoulders]
    }
}

// POSES[0]: breathing: true
// applyPose(pose, extra = {}): os ossos de extra vão por cima da pose
update(time) {
    const pose = POSES[poseIndex]
    if (pose.breathing) applyPose(pose, breathingBones(time))
}
```

`main.js`:
```js
state.luffy.update(state.time)   // no frame(), antes do render
```

**Descrição:**
- **O que faz:** na pose 1, o Luffy respira. Um ciclo leva 3,5 s. Ao puxar o ar, o peito inclina um pouco para trás e os ombros sobem, e os braços vão junto porque são filhos das clavículas. O pescoço desfaz a inclinação do peito, e a cabeça fica quase parada.
- **Curva:** `(1 - cos) / 2` vai de 0 a 1 e começa e termina devagar, sem tranco no fim de cada ciclo.
- **Como:** a cada quadro, o `update` recalcula a pose com os ossos da respiração por cima. Esses ossos não estão na tabela da pose 1, então só somam ao que já existe. As outras poses não têm `breathing` e continuam paradas.

---

## [2026-11-12] Pose 2: Gear 4 quicando, palma de kung fu e punho armado

**Código alterado/adicionado/removido:**

`scene/luffy.js`:
```js
// cotovelo dobra em torno do eixo da articulação (d x z), não de um eixo do mundo
function elbowBend(position, side, angle) {
    const d = v3.normalize(v3.subtract(position[`Bip001 ${side} Hand`], position[`Bip001 ${side} Forearm`]))
    return { matrix: m4.axisRotation(v3.normalize(v3.cross(d, [0, 0, 1])), angle) }
}

// mão aberta: pulso dobrado para as costas da mão, dedos quase retos, polegar junto
const PALM = { wrist: 1.2, curl: 0.1, thumb: 0.3 }
function palmBones(position, hand, scale) { ... }
const BIG_HANDS = 1.8

// POSES[1]
root: { translation: [0, 0.5, 0], rotation: [0, 0, 0] },
fists: true,
build: position => ({
    'Bip001 R Forearm': elbowBend(position, 'R', 1.6),
    'Bip001 L Forearm': elbowBend(position, 'L', 2.2),
    ...palmBones(position, HANDS[1], BIG_HANDS)
}),
bones: { ...ANGRY_FACE, 'facebone_01': [0.3, 0, 0], 'Bip001 Spine1': [0.1, -0.2, 0], 'Bip001 Head': [0.15, 0.1, 0],
         'Bip001 R UpperArm': [0, 0.9, -0.4], 'Bip001 L UpperArm': [0, 0.6, 1.4], 'Bip001 L Hand': { scale: [1.8, 1.8, 1.8] },
         /* pernas dobradas como molas */ }

// createLuffy: ossos que dependem das posições do bind
for (const pose of POSES) {
    if (pose.build) pose.bones = { ...pose.bones, ...pose.build(position) }
}
```

**Descrição:**
- **A pose:** ajustada ao vivo no navegador com o Pedro. O Luffy flutua 0,5 acima do chão, de frente para a câmera, com o tronco um pouco torcido e a cabeça inclinada para a frente. O braço direito vem para a frente com a mão aberta em palma de kung fu. O esquerdo fica erguido e recuado, com o punho perto do ombro, armando o soco. As pernas ficam encolhidas como molas, com os joelhos para fora e os pés esticados.
- **Mãos gigantes:** escala 1,8 só no osso da mão. Os dedos crescem junto porque são filhos dela, e o antebraço não fica mais comprido.
- **Cotovelo:** girar em torno do eixo y do mundo quase não dobrava o braço, porque o antebraço está a 45° no bind e a rotação virava parte torção. O eixo `d × (0, 0, 1)` é perpendicular ao antebraço, então a rotação é uma dobra pura para a frente.
- **`build`:** o cotovelo e a palma dependem das posições dos ossos no bind, que só existem depois de carregar o `.xps`. Por isso a pose tem uma função `build`, chamada uma vez no `createLuffy`. Os ossos que ela devolve vão por cima dos punhos fechados, e a mão direita fica aberta.
- **Testado e descartado:** o tronco inflado e os antebraços em bulbo (escala nos ossos) e as pernas mais encolhidas. O Pedro preferiu a versão anterior.

---

## [2026-11-12] Pose 2: antebraço direito alinhado com o braço

**Código alterado/adicionado/removido:**

`scene/luffy.js` (`build` da pose 2):
```js
// antes: elbowBend(position, 'R', 1.6)
'Bip001 R Forearm': elbowBend(position, 'R', 0.5),
```

**Descrição:**
- **Por quê:** vista de cima, o antebraço direito dobrava para dentro, na direção do centro do corpo. O Pedro marcou numa foto que ele deveria seguir a linha do braço.
- **O que mudou:** a dobra do cotovelo caiu de 1,6 para 0,5 rad. Agora o braço direito forma quase uma linha reta do ombro até a palma, para a frente e para o lado. Conferido no navegador, de cima e de frente.

---

## [2026-11-12] Pose 2: mãos no tamanho normal, punho para fora e palma em pé

**Código alterado/adicionado/removido:**

`scene/luffy.js`:
```js
// elbowBend ganhou twist: gira o antebraço dobrado em torno do eixo do braço
function elbowBend(position, side, angle, twist = 0) {
    ...
    const upperArm = v3.normalize(v3.subtract(position[`Bip001 ${side} Forearm`], position[`Bip001 ${side} UpperArm`]))
    const bend = m4.axisRotation(v3.normalize(v3.cross(d, [0, 0, 1])), angle)
    return { matrix: m4.multiply(m4.axisRotation(upperArm, twist), bend) }
}

const PALM = { wrist: 1.5, curl: 0.1, thumb: 0.3 }      // antes wrist: 1.2
'Bip001 L Forearm': elbowBend(position, 'L', 2.2, 0.9),  // antes sem twist
// removidos: BIG_HANDS, a escala da mão em palmBones e 'Bip001 L Hand': { scale }
```

**Descrição:**
- **Mãos:** voltaram ao tamanho normal, a pedido do Pedro.
- **Punho esquerdo para fora:** depois da dobra do cotovelo, o antebraço gira 0,9 rad em torno do eixo do braço (ombro → cotovelo). Assim o antebraço e o punho vão para fora do corpo, sem mudar o ângulo do cotovelo. O sinal foi testado no navegador: com +0,9 o punho vai para fora e para baixo, e com −0,9 vai para cima e para trás.
- **Palma em pé:** o pulso da palma de kung fu dobra 1,5 rad (~86°) para as costas da mão, e a palma fica quase perpendicular ao antebraço.

---

## [2026-11-12] Pose 2: palma deitada e punho esquerdo colado ao corpo

**Código alterado/adicionado/removido:**

`scene/luffy.js`:
```js
function forearmAxis(position, side) {   // eixo cotovelo -> pulso
    return v3.normalize(v3.subtract(position[`Bip001 ${side} Hand`], position[`Bip001 ${side} Forearm`]))
}

// palmBones: depois de dobrar o pulso, a mão gira em torno do antebraço
const PALM = { wrist: 1.5, twist: 1.5, curl: 0.1, thumb: 0.3 }
[hand.bone]: { matrix: m4.multiply(m4.axisRotation(forearm, PALM.twist * hand.side), bend) }

// build da pose 2
'Bip001 L Forearm': elbowBend(position, 'L', 2.6, 0.4),                      // antes (2.2, 0.9)
'Bip001 L Hand': { matrix: m4.axisRotation(forearmAxis(position, 'L'), 1.6) },
```

**Descrição:**
- **Palma de kung fu:** o Pedro pediu os dedos a ~90° do eixo y, ou seja, na horizontal. Com o pulso já dobrado, a mão gira ~86° em torno do antebraço, e os dedos ficam deitados, apontando para o centro do corpo, com a palma para a frente. O sinal foi testado no navegador: com +1,5 os dedos iam para fora, e por isso ficou `PALM.twist * side`, que dá −1,5 na mão direita.
- **Punho esquerdo:** o cotovelo dobra mais (2,6 rad) e o giro para fora diminuiu (0,4), e o punho fica colado ao corpo, perto do ombro. A mão gira 1,6 rad em torno do antebraço, e os dedos dobrados (a palma) ficam virados para fora. Conferido olhando de fora do braço.

---

## [2026-11-12] Pose 2: antebraço da palma reto e braço do punho mais alto

**Código alterado/adicionado/removido:**

`scene/luffy.js` (pose 2):
```js
'Bip001 R Forearm': elbowBend(position, 'R', 0),   // antes 0.5
'Bip001 L UpperArm': [0, 0.6, 1.8],                 // antes [0, 0.6, 1.4]
```

**Descrição:**
- **Palma:** vista de cima, o antebraço direito ainda dobrava um pouco para dentro. Sem dobra no cotovelo, o braço fica reto do ombro até a palma, como o Pedro desenhou.
- **Punho:** o braço esquerdo subiu 0,4 rad (~23°) em torno de z. O punho sobe junto e fica na altura da cabeça, ainda colado ao corpo.

---

## [2026-11-12] Pose 2: braço do punho volta à altura anterior

**Código alterado/adicionado/removido:**

`scene/luffy.js` (pose 2):
```js
'Bip001 L UpperArm': [0, 0.6, 1.4],   // desfaz o [0, 0.6, 1.8] da entrada anterior
```

**Descrição:**
- O Pedro preferiu o punho na altura anterior. A palma reta (`elbowBend(position, 'R', 0)`) continua.

---

## [2026-11-12] Pose 2: cabeça olhando ao longo do braço da palma

**Código alterado/adicionado/removido:**

`scene/luffy.js` (pose 2):
```js
'Bip001 Head': [0.3, -0.67, 0],   // antes [0.15, 0.1, 0]
```

**Descrição:**
- **Conta:** a direção do braço direito sai das rotações do próprio braço. No bind, o braço aponta para (−0,71, −0,71, 0). Aplicando Rz(−0,4), depois Ry(0,9) e depois o Ry(−0,2) do tronco, ele fica em ~(−0,71, −0,38, 0,60). Isso dá ~50° para a direita do Luffy (atan2(x, z)) e ~22° para baixo.
- **Cabeça:** o tronco já gira −0,2, e a cabeça gira o resto (−0,67) em y. Ela também inclina 0,3 para baixo em x, e o olhar fica ao longo do braço. Conferido no navegador com a câmera na linha do braço, onde o rosto aparece de frente, e também de cima.

---

## [2026-11-12] Pose 2: cabeça mais erguida

**Código alterado/adicionado/removido:**

`scene/luffy.js` (pose 2):
```js
'Bip001 Head': [0.05, -0.67, 0],   // antes [0.3, -0.67, 0]
```

**Descrição:**
- Com a cabeça inclinada 0,3 para baixo, o queixo encostava no peito. Com 0,05 o pescoço aparece e o queixo fica acima do colar. O giro para o lado do braço da palma (−0,67) não mudou. Conferido no navegador, de frente, comparando os dois valores.

---

## [2026-11-12] Pose 2: animação de quique copiada do vídeo de referência

**Código alterado/adicionado/removido:**

`scene/luffy.js`:
```js
const BOUNCE = { period: 1.5, drop: 0.35, armDelay: 0.05 }
// quadros-chave [tempo (s), profundidade 0..1]
const BOUNCE_KEYS = [[0, 0], [0.25, 1], [0.3, 0.25], [0.55, 0], [1.5, 0]]

function bounceDepth(time) {
    const t = ((time % BOUNCE.period) + BOUNCE.period) % BOUNCE.period
    for (let k = 1; k < BOUNCE_KEYS.length; k++) {
        ...
        s = k === 1 ? s * s : s * s * (3 - 2 * s)   // queda acelera; resto suaviza
        return d0 + (d1 - d0) * s
    }
}

function bouncingBones(pose, time) {
    // corpo baixa BOUNCE.drop, coxas e canelas encolhem, tronco inclina para a frente,
    // braços descem um pouco com BOUNCE.armDelay de atraso
    return { root: { ...pose.root, translation: [x, y - BOUNCE.drop * depth, z] }, bones: { ... } }
}

// POSES[1]: bouncing: true
update(time) {
    ...
    if (pose.bouncing) {
        const { root, bones } = bouncingBones(pose, time)
        applyPose({ ...pose, root }, bones)
    }
}
```

**Descrição:**
- **Referência:** um trecho de 1:21 a 1:26 de um vídeo do Gear 4, escolhido pelo Pedro. Abri o vídeo no navegador, desenhei cada quadro num `canvas` e medi a altura do topo da cabeça, a primeira linha com pixels bem escuros (o cabelo) na faixa central. Medi de 0,1 em 0,1 s e, no trecho da descida, de 0,05 em 0,05 s.
- **O que a medição mostrou:** o ciclo se repete a cada 1,5 s (as quedas aconteceram em 82,2, 83,7 e 85,2 s). Ele fica parado no alto, desce acelerando em 0,25 s, volta num tranco em 0,05 s até 1/4 da descida e se acomoda em mais 0,25 s. A cabeça desce ~20% da altura do corpo, o que dá ~0,35 no modelo. Os punhos descem junto, com ~0,05 s de atraso.
- **Interpolação:** a profundidade vem de quadros-chave interpolados com o tempo. O trecho da queda usa `s²`, que acelera, e os outros usam smoothstep `s²(3 − 2s)`, que começa e termina devagar.
- **Ossos:** a animação soma deltas às rotações da pose 2 (coluna, coxas, canelas e braços) e baixa a translação do `root`. As matrizes do `build` (antebraços e mãos) não mudam.
- **Teste:** câmera lenta no navegador (só no console, com o `requestAnimationFrame` a 1/10 da velocidade), conferindo a descida, as pernas encolhendo e o tranco de volta. O console não mostrou erros.

---

## [2026-11-12] Pose 2: som do quique sincronizado com a animação

**Código alterado/adicionado/removido:**

`scene/luffy.js`:
```js
const BOUNCE_SOUND = {
    file: 'assets/sounds/luffyBouncing.mp3',
    start: 1.0, length: 2 * BOUNCE.period, lead: 0.4 - 0.22, tolerance: 0.08
}

const bounceSound = new Audio(BOUNCE_SOUND.file)

function syncBounceSound(time) {
    if (bounceSound.paused) return
    const { start, length, lead } = BOUNCE_SOUND
    const expected = start + ((((time + lead) % length) + length) % length)
    if (Math.abs(bounceSound.currentTime - expected) > BOUNCE_SOUND.tolerance) {
        bounceSound.currentTime = expected
    }
}

// nextPose: toca na pose com bouncing, pausa nas outras
if (POSES[poseIndex].bouncing) bounceSound.play().catch(() => {})
else bounceSound.pause()

// update: depois do quique
syncBounceSound(time)
```

**Descrição:**
- **Arquivo:** `assets/sounds/luffyBouncing.mp3` (5,49 s). Ele não estava em `referencias/`. Era o único áudio do projeto.
- **Análise do som:** decodifiquei o mp3 no navegador (Web Audio, `decodeAudioData`) e calculei a energia (RMS) em janelas de 10 ms. As batidas começam em 0,03, 1,40, 2,90 e 4,40 s, ou seja, também a cada 1,5 s, o mesmo período medido no vídeo.
- **Trecho em loop:** o arquivo não tem um número inteiro de ciclos (5,49 s), e por isso não uso `loop`. Uso o trecho de 1,0 a 4,0 s, que tem dois ciclos inteiros.
- **Sincronia:** o tempo certo do áudio é calculado a partir do tempo da animação: `1,0 + ((tempo + 0,18) mod 3,0)`. A batida de 1,40 s cai em 0,22 s do ciclo, logo antes do fundo da descida, e o pico do som (~0,1 s depois) cai no tranco de volta. Se o áudio estiver mais de 0,08 s fora do lugar, ou passar do fim do trecho, ele é reposicionado. Isso também corrige o desvio quando a aba fica em segundo plano, porque o `dt` é limitado a 0,1 s e a animação atrasa em relação ao áudio.
- **Só na pose 2:** o `play()` é chamado na troca de pose, pela tecla P, porque o navegador só deixa tocar som depois de uma ação do usuário. Nas outras poses o som pausa.
- **Teste:** com a tecla P de verdade no navegador, o som toca na pose 2, o tempo do áudio passa de 3,75 para 1,02 sem perder o ritmo e o som pausa na pose 3. O console não mostrou erros. O som em si não foi ouvido no teste, então quem confere o ouvido é o Pedro.
