# EPIC-02 — Design system: tokens e componentes

**Objetivo:** traduzir o `Waytale Design System` para código, com tokens versionados e todos os componentes reutilizáveis documentados em Storybook — nenhuma feature usa valores literais.

**Estimativa:** 13 pts · **Referência:** `Waytale Design System.dc.html`

## Tokens

```ts
// src/components/tokens.ts
export const color = {
  ink:        '#14203d', // texto e superfícies escuras
  inkMuted:   '#a19c90',
  inkFaint:   '#c2beb2',
  accent:     '#e2571f', // único acento
  surface:    '#ffffff',
  canvas:     '#faf8f3',
  border:     '#eee9df',
  borderSoft: '#f2eee5',
};
export const space  = { 1:4, 2:8, 3:12, 4:16, 5:20, 6:24, 7:32, 8:40, 9:56, 10:80 };
export const radius = { sm:8, md:14, lg:22, pill:999 };
export const type = {
  display: { size:26, weight:'600', lh:1.25, ls:-0.015 },
  title:   { size:24, weight:'600', lh:1.3,  ls:-0.01 },
  section: { size:17, weight:'600', lh:1.35 },
  body:    { size:14.5, weight:'400', lh:1.65 },
  label:   { size:13, weight:'500' },
  caption: { size:12.5, weight:'400' },
  mono:    { size:10, weight:'500', ls:0.1 },
};
export const motion = { fast:140, base:220, slow:420, easing:'cubic-bezier(.2,.8,.2,1)' };
```

**Regras:** um só acento (laranja) por ecrã; fundo branco em todos os ecrãs exceto área de mapa; CTA principal como link/texto alinhado à direita; sem gradientes, sem sombras fortes, sem emoji.

## Histórias

### 02.1 — Pacote de tokens
Como dev, quero tokens tipados e um `ThemeProvider`, para nunca escrever hex na feature.
- Export de `color/space/radius/type/motion`; hook `useTheme()`; suporte a escala de fonte do sistema (accessibility).
- Lint rule proibindo cor literal fora de `tokens.ts`.
- **Aceitação:** `yarn lint` falha ao introduzir `#fff` num ficheiro de feature.

### 02.2 — Primitivos
`Text` (variantes do `type`), `Box`/`Stack` (gap por token), `Divider`, `Screen` (safe-area + padding padrão), `Icon` (set linear 1.5px).

### 02.3 — Ações
`ButtonPrimary` (texto+seta, direita), `ButtonGhost`, `ButtonPill` (borda `border`, altura 52, raio pill), `TextLink`, `IconButton`.
- Estados: default, pressed (opacidade + escala 0.98), disabled, loading.
- Alvo de toque mínimo 44×44 em todos.

### 02.4 — Formulários
`InputUnderline` (linha `ink`, label flutuante), `InputPassword` (toggle "Ver"), `OTPInput` (4–6 caixas, auto-advance, colar código), `HelperText`, `FieldError`, `Checkbox`, `Switch`.
- **Aceitação:** OTP aceita colar de SMS e dispara submit ao completar.

### 02.5 — Seleção
`ChipToggle` (interesses), `SliderSteps` (desvios: direto → sem pressa), `RadioRow` (voz, idioma), `SegmentedControl`.

### 02.6 — Cartões e listas
`RouteCard` (título, duração, distância, nº paragens), `PlaceRow`, `StoryCard` (texto com palavras-chave em `accent`), `SourceCard`, `StatBlock` (journey summary), `ListSection`, `SettingsRow` (label + valor + chevron).

### 02.7 — Navegação e feedback
`TabBar` (4 abas), `HeaderBack`, `ProgressDots` (passo ativo = barra laranja 20×4), `Sheet` (bottom sheet), `Toast`, `Banner` (offline / alerta de segurança), `Skeleton`, `EmptyState`.

### 02.8 — Mapa e áudio
`MapCanvas` (única superfície não branca; estilo minimal, sem POIs), `RoutePolyline`, `MapPin` (ponto laranja), `AudioWave` (barras verticais animadas), `PlayerControls` (play/pause, repetir, saltar), `ProgressLine`.

### 02.9 — Documentação e testes
- Uma story por componente com todos os estados; snapshot a11y (labels, roles, contraste ≥ 4.5:1 para texto).
- **Aceitação:** nenhuma feature do EPIC-03 em diante introduz componente visual novo fora de `src/components`.
