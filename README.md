# Geometria Espacial

Material interativo para o **Capítulo 9 – Explorando os objetos que nos cercam** (9º ano): volume de prismas e cilindros, volume e capacidade, sólidos de revolução, planificação e área da superfície, projeções ortogonais e vistas ortográficas. Feito para projetar em sala e para os alunos abrirem no celular.

Segue os princípios dos projetos *Relações Métricas Dinâmicas* e *Fábrica de Funções*:

- **Nada começa sozinho**: cada movimento espera o clique em avançar (setas, espaço ou passador de slides). Voltar desfaz com animação; **Rever movimento** (tecla `R`) refaz só o passo atual.
- **Um movimento por clique**, com o cartão ao lado explicando o que aconteceu.
- Tema claro por padrão; HTML, CSS e JavaScript puros, sem etapa de build; funciona sem internet.

## Volume (Fase 1)

- Sólidos: **cubo**, **prisma de base quadrada**, **paralelepípedo**, **prisma triangular** (base triângulo retângulo), **prisma hexagonal regular** e **cilindro** (em pé ou **deitado**, como o reservatório de gás).
- Figura 3D desenhada ao vivo: **arraste para girar**; **Vista padrão** (tecla `0`) volta à posição inicial. Arestas escondidas aparecem **tracejadas** (tecla `H`).
- Passo a passo: o sólido → **as bases** em azul → **área da base** numa figura plana ao lado:
  - retângulo e quadrado: os quadradinhos de 1 cm² preenchem a base fileira por fileira;
  - triângulo: uma cópia girada completa o retângulo (metade de *b* · *c*);
  - hexágono regular: 6 triângulos equiláteros e a altura de cada um pelo **Teorema de Pitágoras** (*h* = *L*√3/2), como pedem as orientações da Atividade 4;
  - círculo: fatias que se encaixam num quase paralelogramo de base π*r* e altura *r*.
- **Uma camada** (1 cm de altura, com os cubinhos quando as medidas são pequenas) e depois as camadas **empilhadas** até a altura: *V* = *A*<sub>base</sub> · *h*.
- **Capacidade**: o sólido vira um recipiente de vidro e **enche de água**; 1 cm³ = 1 mL, 1 dm³ = 1 L, 1 m³ = 1 000 L.
- **Inclinar** (Princípio de Cavalieri): as camadas deslizam como uma pilha de moedas; a altura continua perpendicular às bases e o volume não muda.
- **Descobrir**: o volume, a **altura** (*h* = *V* ÷ *A*<sub>base</sub>) ou a **aresta/raio** (raiz quadrada da área da base, raiz cúbica no cubo), como na piscina da Atividade 2.
- π pode valer **3,14**, **3** ou ficar **indicado** (100π), no painel do professor.

### Atividades do livro prontas

| Atividade | Situação |
|---|---|
| 1d | aquário cúbico de 30 cm |
| 1e | aquário 20 × 40 × 40 cm |
| 2 | piscina de 3 125 m³ e 5 m de altura: aresta da base |
| 3 | caixa de chocolate: prisma triangular 6, 8 e 10 cm |
| 4 | embalagem hexagonal de lado 4 cm e altura 12 cm |
| 7d | aquário cilíndrico: *r* = 10 cm, *h* = 30 cm |
| 8 | reservatório de gás deitado (diâmetro → raio) e botijões de 13 L |

## Mexer na figura com o mouse (todas as figuras 3D)

- **Arrastar**: gira o sólido para vê-lo de qualquer ângulo.
- **Botão direito** (ou **Shift** + arrastar): move a figura na tela.
- **Roda do mouse**: aproxima e afasta; no celular, **pinça** com dois dedos (e arrastar com dois dedos move).
- Botões **Perspectiva** (vista padrão, tecla `0`), **Frente**, **Cima** e **Lado**: a câmera vai até lá com animação.
- **−** e **+** (teclas `−` e `+`) e **Girar sozinho** (tecla `G`): o sólido fica girando até clicar de novo.

## Revolução (Fase 2)

As **bandeirinhas** da Atividade 5 e do *Organizando as ideias*: uma figura plana presa a um palito (o **eixo**) gira **um quarto de volta por clique** (90°, 180°, 360°), desenhando a superfície; linhas tracejadas mostram o caminho circular dos pontos.

- Retângulo → **cilindro**; triângulo retângulo → **cone** (com altura, raio e **geratriz**); semicírculo → **esfera**; bandeira azul (retângulo com meia-lua) → **esfera achatada**.
- Para explorar: trapézio → **tronco de cone**; triângulo com um lado no palito → **dois cones**; retângulo longe do palito → **cilindro oco** (cano); círculo longe do palito → **toro** (rosquinha).
- **Votação**: antes de girar, a turma escolhe que sólido vai aparecer; o resultado e o placar aparecem no último passo, com exemplos do dia a dia.

## Planificação (Fase 2)

O sólido **abre um movimento por clique**, como uma caixa de papelão: as faces laterais deitam em volta da base, depois a tampa. No cilindro, as bases abrem e a parede **desenrola** até virar um retângulo cujo comprimento é o **contorno do círculo** (2π*r*).

- Cada face mostra a sua área (em azul as bases, em verde as faces laterais); área lateral = perímetro da base × altura; área total = 2 · *A*<sub>base</sub> + *A*<sub>lateral</sub>. No prisma triangular, a hipotenusa da base sai por Pitágoras.
- **Atividade 11 (silo)**: só a tampa e a parede são pintadas (o piso fica cinza); *C* = 4π m, parede 80π m², tampa 4π m², total 252 m² com π = 3 e **42 litros** de tinta.
- Também: caixa de papelão e lata de alumínio. No último passo, o sólido **se monta de novo**.

## Ferramentas de aula

- **Copiar imagem** (tecla `C`): a figura como PNG, fundo branco, pronta para listas.
- **Anotar** (tecla `A`): caneta, marca-texto, laser, desfazer.
- **Painel do professor** (tecla `P`): valor de π, casas decimais, tema, tamanho do texto, velocidade, **link compartilhável** (leva a aba e o passo), **QR code** e **cenários salvos**.

## Como publicar (GitHub Pages, gratuito)

1. Junte este branch ao `main` (abra e aceite o pull request).
2. No GitHub, vá em **Settings → Pages** e em **Source** escolha **GitHub Actions**.
3. A cada envio para o `main`, o site é publicado em `https://maiconcentner.github.io/geometria_espacial/`.

Para usar sem internet, basta abrir o `index.html` no navegador.

## Estrutura

```
index.html          página única
css/style.css       visual (tema claro/escuro, responsivo)
js/core.js          estado, números, link, animação e o controlador de passos (comum a todas as abas)
js/g3.js            motor 3D em SVG: câmera, malhas, sombreamento, arestas ocultas, controle da vista
js/icons.js         desenhos dos sólidos nos botões
js/volume.js        aba Volume
js/rev.js           aba Revolução (bandeirinhas)
js/net.js           aba Planificação (área da superfície)
js/annotate.js      caneta, marca-texto e laser por cima da figura
js/export.js        copiar a figura como imagem PNG
js/share.js         link, cenários salvos e QR code
js/vendor/qrcode.js gerador de QR code (qrcode-generator, licença MIT)
js/app.js           abas, painel do professor, atalhos
```
