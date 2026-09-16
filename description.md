# Waytale

App móvel de passeios a pé guiados por áudio. Em vez de indicar apenas o caminho mais rápido, o Waytale conta a história dos sítios por onde passas — narração no ouvido, mapa mínimo no ecrã, atenção na cidade e não no telemóvel.

**Posicionamento:** um guia turístico que cabe no bolso, para quem viaja sozinho, para locais curiosos e para quem tem 40 minutos livres numa cidade nova.

---

## Princípios de produto

1. **Áudio primeiro, ecrã depois** — o telefone fica no bolso; o essencial ouve-se.
2. **Rotas vivas, não itinerários fixos** — desvios sugeridos em tempo real conforme os interesses.
3. **Sem ruído** — cada ecrã tem uma ação principal; nada de gamificação nem badges.
4. **Confiança nas histórias** — cada narrativa mostra as suas fontes e pode ser reportada.

---

## Funcionalidades

### 1. Registo e onboarding

- Registo por telemóvel com verificação por código OTP; Apple e Google como atalhos.
- **Interesses**: história, arte, gastronomia, arquitetura, vida local, etc. — definem que histórias entram na rota.
- **Desvios**: quanto o utilizador aceita alongar o percurso por algo interessante (direto → sem pressa).
- **Voz**: escolha do narrador (tom, ritmo, género) com pré-escuta.
- **Permissões**: localização em segundo plano e notificações, explicadas em linguagem simples.

### 2. Descobrir rotas

- **Home** com rota sugerida para o momento (hora, tempo disponível, localização).
- **Pesquisa** por cidade, bairro ou tema.
- **Rotas recomendadas** — coleções curadas, com duração, distância e nº de paragens.
- **Explore / Surprise me** — uma rota inesperada gerada na hora, para quem não quer decidir.
- **Detalhe da rota**: mapa, paragens, duração estimada, prévia de áudio.

### 3. Caminhar com o Waytale

- **Navegação ao vivo** — mapa limpo, próxima indicação e distância à paragem seguinte.
- **Story Player** — cartão de história que aparece ao chegar a um ponto; controlos de play/pause, saltar, repetir; palavras-chave destacadas no texto.
- **Detalhe do local** — contexto adicional, imagem e opção de guardar.
- **Fonte da história** — arquivos e entidades citados, com "Reportar um erro".
- **Alerta de segurança** — aviso discreto em travessias e zonas de trânsito.
- **Sem histórias por aqui** — estado alternativo quando a zona não tem conteúdo, com sugestão do ponto interessante mais próximo.

### 4. Fim do percurso

- **Journey Summary** — distância, tempo, paragens visitadas e histórias ouvidas.
- **Partilhar journey** — cartão visual do percurso para redes sociais.
- **Locais guardados** — biblioteca pessoal de sítios e rotas para voltar mais tarde.

### 5. Perfil e preferências

- Perfil com histórico de percursos.
- Edição de **interesses**, **desvios** e **voz** a qualquer momento.
- **Idioma** da narração e da interface.
- **Download offline** de rotas e áudio — funciona sem dados no estrangeiro.

### 6. Premium

- Rotas exclusivas e coleções de autor.
- Downloads offline ilimitados.
- Vozes adicionais e narração em mais idiomas.
- Sem limite diário de histórias.

---

## Estados e casos-limite cobertos

Estado vazio (sem locais guardados), sem cobertura de histórias na zona, modo offline, permissões negadas, alerta de segurança em navegação.

---

## Linguagem visual

|                 |                                                        |
| --------------- | ------------------------------------------------------ |
| Navy            | `#14203d` — texto, superfícies escuras                 |
| Laranja         | acento único: passo ativo, palavras-chave, pin do mapa |
| Off-white       | `#faf8f3` fundo do board, `#eee9df` bordas de cartões  |
| Fundo dos ecrãs | branco, exceto área de mapa                            |

Muito espaço branco, tipografia sóbria, cartões com borda cinzenta subtil, CTAs alinhados à direita, indicadores de onboarding centrados. Sem ilustrações ruidosas nem gradientes.

---

## Ficheiros do projeto

- `Waytale UI Screens.dc.html` — 29 ecrãs organizados por fluxo (onboarding → app → definições → estados).
- `Waytale Design System.dc.html` — componentes, cores, tipografia.
- `Waytale Prototype.dc.html` — protótipo clicável com micro-interações (em curso).
