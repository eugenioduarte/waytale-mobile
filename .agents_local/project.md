# Waytale — Contexto do Projeto

## O que é

App móvel de passeios a pé guiados por áudio. Em vez de indicar apenas o caminho mais rápido, o Waytale conta a história dos sítios por onde passas — narração no ouvido, mapa mínimo no ecrã, atenção na cidade e não no telemóvel.

**Posicionamento:** um guia turístico que cabe no bolso, para quem viaja sozinho, para locais curiosos e para quem tem 40 minutos livres numa cidade nova.

Ver `../description.md` para a descrição de produto completa (funcionalidades, linguagem visual). Este ficheiro é o resumo orientado a agentes: domínio, personas, regras de negócio.

## Princípios de produto

1. **Áudio primeiro, ecrã depois** — o telefone fica no bolso; o essencial ouve-se.
2. **Rotas vivas, não itinerários fixos** — desvios sugeridos em tempo real conforme os interesses.
3. **Sem ruído** — cada ecrã tem uma ação principal; nada de gamificação nem badges.
4. **Confiança nas histórias** — cada narrativa mostra as suas fontes e pode ser reportada.

## Persona

Produto de utilizador único (sem papéis operador/cliente separados):

| Persona | Acesso | Dispositivo |
|---|---|---|
| **Viajante / explorador local** | Registo por telemóvel (OTP) ou Apple/Google | Telemóvel próprio |

Free vs **Premium** é um nível de subscrição, não uma persona diferente.

## Domínio (entidades principais)

- **Route** — rota com paragens, duração, distância, coleção/tema.
- **Stop** — paragem de uma rota, ligada a um `Place`.
- **Story** — narrativa de áudio de uma paragem; tem fontes citadas e pode ser reportada.
- **StoryAudio** — ficheiro/faixa de áudio de uma `Story` (varia por voz/idioma).
- **Place** — local com contexto adicional, imagem, opção de guardar.
- **Journey** — percurso realizado por um utilizador (append-only: histórico não se reescreve).
- **JourneyEvent** — eventos dentro de um `Journey` (paragem visitada, história ouvida, etc.).
- **SavedItem** — locais/rotas guardados pelo utilizador para voltar mais tarde.
- **Download** — rota/áudio descarregado para uso offline.
- **User / Preferences** — perfil, **interesses** (história, arte, gastronomia, arquitetura, vida local...), **desvios** (tolerância a alongar o percurso), **voz** (narrador escolhido), idioma.

## Fluxo principal

```
Descobrir → Home (rota sugerida) / Pesquisa / Rotas recomendadas / Explore ("Surprise me")
  → Detalhe da rota (mapa, paragens, duração, prévia de áudio)
  → Caminhar: Navegação ao vivo → Story Player ao chegar a uma paragem
      → Detalhe do local, Fonte da história ("Reportar um erro")
      → Alerta de segurança em travessias/zonas de trânsito
      → "Sem histórias por aqui" quando a zona não tem conteúdo
  → Fim do percurso: Journey Summary → Partilhar journey → Locais guardados
```

Perfil e preferências (interesses/desvios/voz/idioma/download offline) são editáveis a qualquer momento, fora deste fluxo linear.

## Regras de negócio críticas

- **Offline-first**: toda a leitura da UI vem da base local (SQLite); a rede só alimenta essa base. Ver `stack.md`.
- **Áudio primeiro**: o Story Player e a navegação ao vivo são o núcleo da experiência; o mapa é mínimo, não o foco.
- Cada `Story` cita as suas fontes e permite "Reportar um erro" — nunca apresentar uma narrativa sem proveniência.
- **Desvios** é uma preferência contínua do utilizador (direto → sem pressa) que influencia a geração/sugestão de rota, não um toggle binário.
- Download offline é limitado no plano gratuito e ilimitado no Premium.
- Premium: rotas/coleções exclusivas de autor, downloads ilimitados, vozes adicionais, narração em mais idiomas, sem limite diário de histórias.
- Estados-limite a cobrir sempre: sem locais guardados, sem cobertura de histórias na zona, modo offline, permissões negadas (localização em segundo plano, notificações), alerta de segurança em navegação.

## Referência visual

Design ainda **não foi importado para este repositório**. Fonte prevista (Claude Design, ver `agentic.md`):

- `Waytale UI Screens.dc.html` — 29 ecrãs organizados por fluxo.
- `Waytale Design System.dc.html` — componentes, cores, tipografia.
- `Waytale Prototype.dc.html` — protótipo clicável com micro-interações.

Linguagem visual (de `../description.md`): navy `#14203d`, laranja como acento único (passo ativo, palavras-chave, pin do mapa), off-white `#faf8f3` fundo do board, `#eee9df` bordas de cartões. Muito espaço branco, tipografia sóbria, sem ilustrações ruidosas nem gradientes.
