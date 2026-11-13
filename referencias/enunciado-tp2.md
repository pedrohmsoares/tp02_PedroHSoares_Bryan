# Trabalho Prático 2 - Paraíso Pokémon

<table align="center">
  <tr>
    <!-- Card 1 -->
    <td align="center">
      <a href="https://www.instagram.com/p/C5hL1wcMKLB/">
        <img src="images/bulbasaur.webp" width="250" alt="Um diorama mostrando um pokémon bulbassauro em um cenário de floresta dentro de uma pokébola" />
      </a>
      <br />
      <b>Bulbassauro</b>
      <br />
      <a href="https://www.instagram.com/p/C5hL1wcMKLB/">Post do Douglas Tonelli 📸</a>
    </td>
    <!-- Card 2 -->
    <td align="center">
      <a href="https://www.instagram.com/p/C6AF8lksi4g/">
        <img src="images/charmander.webp" width="250" alt="Diorama mostrando um charmander ao lado de uma fogueira com marshmellows em espetos dentro de uma pokébola" />
      </a>
      <br />
      <b>Charmander</b>
      <br />
      <a href="https://www.instagram.com/p/C6AF8lksi4g/">Post do Douglas Tonelli 📸</a>
    </td>
    <!-- Card 3 -->
    <td align="center">
      <a href="https://www.instagram.com/p/C6xHUDksfW1/">
        <img src="images/squirtle.webp" width="250" alt="Diorama mostrando o squirtle surfando uma onda na prancha em uma praia dentro de uma pokébola" />
      </a>
      <br />
      <b>Squirtle</b>
      <br />
      <a href="https://www.instagram.com/p/C6xHUDksfW1/">Post do Douglas Tonelli 📸</a>
    </td>
    <!-- Card 4 -->
    <td align="center">
      <a href="https://www.instagram.com/p/C8-yW5rMLPJ/">
        <img src="images/pidgeotto.webp" width="250" alt="Diorama mostrando o pidgeotto pousado observando uma fonte de água com bico na forma de magikarp dentro de uma pokébola" />
      </a>
      <br />
      <b>Pidgeotto</b>
      <br />
      <a href="https://www.instagram.com/p/C8-yW5rMLPJ/">Post do Douglas Tonelli 📸</a>
    </td>
  </tr>
</table>

Pouco se sabe sobre o que acontece dentro de uma pokébola. Mas um fato conhecido
é que quando "guardadinho", um pokémon se sente em um paraíso. Neste trabalho,
vamos criar uma cena 3D em WebGL para recriar um paraíso pokémon. Ou um paraíso
digimon. Ou um paraíso para seu doguinho, gatinho ou papagaio -- o que você
escolher. Mais genericamente, podemos chamar de diorama.

Nosso objetivo é praticar os conceitos de projeção perspectiva,
iluminação dinâmica, modelagem hierárquica, sombreamento, modelagem e
efeitos visuais vistos em sala de aula. E também nos divertir.

A especificação básica consiste em:

- **Mundinho**:
  1. Deve haver um círculo representando o chão e, sobre ele os objetos que
     formarão o cenário (eg, grama, arbusto, árvores, tonéu, vulcão, lagoa)
     - Esses objetos podem ser desenhados usando sólidos feitos por você,
       da TWGL.js ou podem ser arquivos `.obj` (ou outro formato) importados
     - Deve haver pelo menos 03 tipos de objetos diferentes compondo o cenário
  1. Deve haver um hemisfério abaixo do círculo ("chão" da pokébola)
  1. Deve haver um outro objeto único no diorama que seja 
     **desenhado de forma hierárquica**. Por exemplo, um ventilador, 
     um moinho de vento, uma bicicleta, um móbile no teto. Ele deve 
     ser constituído de pelo menos 2 partes:
     - uma estrutura fixa (eg, haste do ventilador, estrutura do moinho)
     - uma parte giratória (pás do ventilador ou do moinho)
- **Personagem**:
  1. Deve haver um personagem (pokémon ou outro tipo) que habita o diorama.
     Novamente, pode desenhar usando uma combinação de sólidos (talvez fique
     "toscão", mas tudo bem) ou carregar modelos feitos por você ou de terceiros
  1. Ao pressionar <kbd>P</kbd> o personagem deve alternar entre 3 
     poses (posição + orientação):
    - A posição/orientação inicial
    - Outras duas posições/orientações (eg, na borda do diorama, de barriga 
      pra cima -- tipo dormindo)
- **Câmera**:
  1. Use projeção perspectiva 
  1. Deve haver 2 câmeras e o usuário pode alternar entre elas via as teclas
     <kbd>1</kbd> e <kbd>2</kbd>:
     1. Visão a ~45º acima do chão olhando para o centro do diorama e 
        rotacionando sua posição ao longo do tempo. O scroll do mouse deve
        aproximar ou distanciar a câmera do alvo
     1. Câmera orbital controlada pelo movimento do mouse com o alvo fixo 
        no centro do diorama
- **Gráficos**:
  1. Você deve usar um modelo de iluminação dinâmica, como o de Phong
     - Basta que sua cena tenha 1 fonte de luz direcional e que os 
       objetos possuam materiais diferentes
   1. Deve ser possível ativar/desativar o modelo de iluminação a partir de uma
      tecla (eg, <kbd>L</kbd>)
   1. Os objetos devem conter texturas, com materiais devidamente 
      configurados. A menos que você opte por fazer um 
      estilo _low-poly_ bonitão

Após a entrega do trabalho (URLs da cena publicada e do repositório no Github),
deve haver também um breve vídeo (30s?) hospedado no Youtube,
entregue até 1 semana depois (veja a seção "O que deve ser entregue").

Além de implementar esses itens obrigatórios, você deve também 
**escolher pelo menos 4 itens opcionais** para seu trabalho:

- Relativas ao **Mundo**:
  1. ⭐ **Modelos tridimensionais**: em vez de usar os
     sólidos próprios ou da TWGL.js, crie ou use modelos tridimensionais de
     terceiros e carregue-os no seu programa. Um formato simples é o `.obj`
     (mas ele não suporta animação). Tem também o formato glTF (mais complexo
     mas suporta animação)
     - Caso queira fazer sobre Pokémon mesmo, [dizem][ripped-pokemon-assets]
       que circulam por aí os modelos 3D de vários monstrinhos de bolso
  1. ⭐ **_Skybox_, _skyphere_ ou _skydome_**: se considerarmos
     que nosso mundo está definido dentro de um cubo (_skybox_), podemos
     colocar uma imagem de textura em cada face interna (são 6) que
     represente o horizonte naquela direção. Veja
     [exemplos de texturas de _skyboxes_][skybox] e nossa aula sobre
     [efeitos visuais][visual-fx]. Repare que o cubo do _skybox_ acompanha
     a posição, ou seja, não é possível se aproximar de uma parede, muito
     menos sair do cubo
  1. **Chão com relevo**: em vez de plano, faça com que o chão tenha relevo.
     Uma ideia é usar um _height-map_: uma textura em escala de cinza em que
     cada texel representa a altura do chão naquele pixel. Veja um
     [exemplo de _height map_][height-map] na aula sobre texturas
  1. **Vários tipos de objetos**: em vez de compor o cenário com apenas
     03 tipos de objetos, tenha uns 07 tipos diferentes para dar variedade
  1. ⭐ **Vento**: simule que existe vento e faça as coisas mexerem com ele. 
     Por exemplo, aplique um _shear_ com uma intensidade dada, em um 
     certo momento, por uma textura que contém ruído branco 
     (eg, _perlin noise_). Moitas de grama e a copa das árvores podem sofrer
     essa transformação
  1. **Líquido**: tenha uma região aquática como um lago, poça d'água, mar
     ou rio. Uma ideia para que um sólido pareça água é que ele (a) tenha certa
     transparência, (b) tenha uma textura com suas coordenadas animadas e
     (c-para oceano ou rio agitado) desloque verticalmente os vértices da 
     superfície ao longo do tempo para criar ondas 
- Relativas ao **Personagem**:
  1. 💣 **Animação de personagem**: faça o personagem executar um 
     clipe de animação que altera as coordenadas de seus vértices ao longo do
     tempo (técnicas de _skinning_ ou de _blend shapes_)
  1. **Poses alternativas**: ao alternar as poses do personagem com
     <kbd>P</kbd>, além de mudar a posição e orientação, coloque-o de fato
     em outra pose (eg, sentado, deitado, dormindo)
  1. ⭐ **Interação** (carinho): torne possível fazer um carinho no bichinho
     usando o mouse. Deve ter algum _feedback_: emitir um som, animação de 
     alegria, surgir um balãozinho com rosto feliz etc.
  1. 💣 **Movimentação autônoma**: dê vida ao personagem fazendo-o andar
     pelo cenário. Deve haver uma máquina de estados com pelo menos as 
     situações: (a) _idle_ e (b) _wandering_. O personagem deve andar apenas
     por locais válidos
     - Pode ser necessário ter um grafo não direcionado em que 
       cada nó representa um possível local de destino e as arestas existem 
       entre nós que podem ser alcançados andando em linha reta
     - Ao entrar em _wandering_, o grafo pode ser consultado para escolher
       um nó alvo que seja alcançável a partir da navegação de algumas arestas
       escolhidas de forma aleatória 
- Relativas à **Câmera**:
  1. 💣 **Clique em objetos**: para torná-los o alvo da câmera
     - Isto envolve [_object picking_][picking] e há diferentes abordagens
  1. ⭐ **Câmera de navegação livre** com 
     <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> para voar e mouse 
     para mudar direção
- Relativas a **Gráficos**:
  1. 🍔 **Efeitos de partículas**:  para simular fenômenos como fogo,
     fumaça, água etc. Falaremos disso na aula de [efeitos visuais][visual-fx]
  1. 🍔 **Ciclo dia/noite**: faça o tempo passar e que isso defina na forma 
     como o cenário é renderizado. Isso pode ser feito configurando-se
     a fonte de luz direcional com cores diferentes, dependendo 
     da hora do dia
     - Se tiver um _skybox_, você deve alterá-lo para refletir os horários
       diferentes
  1. **Fontes de luz pontuais**: coloque fontes de luz em alguns objetos 
     do cenário (eg, luz no poste ou uma poça de gosma radioativa)
  1. 💣 **Sombras**: faça objetos projetarem sombras de acordo com a(s)
     fonte(s) de luz da cena
  1. 🌟 **Neblina**: funcionalidade acrescentada por comando do 
     teclado (<kbd>N</kbd>), podendo ser habilitada e desabilitada 
     durante a execução
  1. **Efeitos de pós-processamento**: implemente uma etapa de pós-processamento
     de cada quadro para melhorar a qualidade da imagem aplicando borragem, ou
     vinheta, ou alguma outra técnica que faça sentido visualmente (eg., bloom,
     detecção de bordas para criar contornos, etc.)
  1. 💣 _**Normal mapping**_: use a técnica de _normal mapping_ para
     fazer com algum objeto tenha suas normais dadas por uma textura e, assim,
     ganhe um efeito de profundidade quando iluminado
  1. **Material transparente**: tenha algo como vidro ou outra coisa que seja
     semitransparente. Detalhe: objetos transparentes devem ser desenhados
     por último. Se fizer o opcional "Líquido", aí este não conta 2x 
  1. 💣 **Material reflexivo**: tenha algo reflexivo como um objeto metálico
     ou um espelho. Isto pode ser feito renderizando a cena 2x: uma de dentro do 
     objeto com a câmera olhando para fora, para uma textura _off-screen_,
     depois na posição "certa" da câmera, aplicando a textura gerada no objeto
     "espelho"
- Outros opcionais:
  1. 🌟 **Música, efeitos sonoros e/ou som ambiente**: inclua música de fundo,
     sons ambiente e efeitos sonoros (este último, caso haja algum tipo de 
     interação)
  1. (+0) **Usar a TWGL.js**: neste trabalho está liberado
     usar a biblioteca (não conta como adicional, tampouco debita)
  1. (-7) **Usar a THREE.js**: a THREE.js pode ser usada, mas torna necessário
     conquistar os pontinhos por meio dos adicionais. É preciso fazer a 
     implementação básica +11 itens opcionais (em vez de +4)

Legenda dos ícones:
- 🌟 Esforço baixo
- ⭐ Esforço médio porém muito importante
- 🍔 Esforço médio mas professor adoraria ver implementado
- 💣 Esforço alto, melhor correr senão explode
- 💥 Arriscado, muitos trilharam este caminho, poucos voltaram



## O que deve ser entregue

Até a data de entrega do trabalho (vide sistema acadêmico), você deve enviar 
links para o repositório Github e para o a cena publicada em um fórum de entrega
da disciplina com o seguinte conteúdo:

- Repositório: https://github.com/SEU-USUARIO/REPOSITORIO
- Cena: https://SEU-USUARIO.github.io/REPOSITORIO

O repositório deve conter:
1. O código fonte, com os recursos (imagens, sons) usados
1. Arquivo `README.md` contendo 5 seções: 
   - (a) **A Cena**: brevíssima descrição dela 
   - (b) **Criador(es)**: nome(s) e contato para empresas contratarem você(s)
   - (c) **Media kit**: 1 a 3 screenshots ilustrando a cena
   - (d) **Opcionais**: lista de itens opcionais implementados
     - copiar/colar o texto desses itens do enunciado
     - ⚠️ esquecer isto pode acarretar em notas mais baixas porque ao corrigir
       o trabalho eu não percebi o item
   - (e) **Créditos**: links para quem criou os recursos de terceiros usados 
     (eg, músicas, efeitos sonoros, imagens, modelos etc)


ℹ️ **Importante**: até 1 semana depois, você deve postar o link para o vídeo
(~30s) em resposta ao post de entrega no sistema acadêmico.


## Avaliação

O(s) aluno(s) deve(m) ser o(s) autor(es) do código (e não de _prompts_). 
O trabalho será avaliado pelo professor seguindo os critérios:

1. **Qualidade do resultado** final
   - Quanto maior o sorriso do professor ao corrigir, melhor
1. **O esforço de programação** do aluno
   - Quanto mais opcionais implementados, melhor
   - Escrever _prompt_ para gerar código não conta como esforço: 
     ativa o modo LLM¹
1. A distribuição de **_commits_ ao longo do tempo** segundo o repositório
   - Trabalhos iniciados muito próximo da entrega: ativa o modo LLM¹
   - Se for em grupo, todos participantes devem ter _commits_ relevantes
1. Qualidade do **código-fonte**
   - Há indicadores de código gerado por LLM. Fuja deles para não
     ativar o modo LLM¹
1. Entrega do **vídeo** de ~30s (1 semana depois)
   - Faça um vídeo curto, não precisa ter um trabalhão



### ¹Correção Modo LLM

Em caso de **⚠️suspeita⚠️ de uso excessivo de código gerado por LLMs**, 
o professor irá corrigir o trabalho usando uma LLM também. 
Afinal, não é justo ele ter mais trabalho para corrigir do que o aluno 
para fazer a aplicação.



[lighting-directional]: http://fegemo.github.io/utf-cg/classes/lighting/#1
[visual-fx]: http://fegemo.github.io/utf-cg/classes/visual-effects/#1
[height-map]: http://fegemo.github.io/utf-cg/classes/textures/#43
[skybox]: https://www.google.com.br/search?q=skybox&safe=off&hl=pt-BR&source=lnms&tbm=isch&sa=X&ei=jMM_VenRNKuasQSCwYDABw&ved=0CAgQ_AUoAg&biw=1366&bih=599
[lighting]: http://fegemo.github.io/utf-cg/classes/lighting/#1
[picking]: https://webgl2fundamentals.org/webgl/lessons/webgl-picking.html
[ripped-pokemon-assets]: https://models.spriters-resource.com/nintendo_switch/pokemonscarletviolet/