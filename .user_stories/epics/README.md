# Waytale — Épicos

Backlog da app organizado em épicos. Ordem de execução recomendada é a numeração.

| # | Épico | Telas | Depende de |
|---|---|---|---|
| 01 | [Setup do projeto](./EPIC-01-setup-projeto.md) | — | — |
| 02 | [Design system: tokens e componentes](./EPIC-02-design-system.md) | — | 01 |
| 03 | [Welcome e walkthrough](./EPIC-03-welcome-walkthrough.md) | 01, 01A1–01A3 | 02 |
| 04 | [Autenticação](./EPIC-04-autenticacao.md) | 01B, 01B2–01B4, 01C | 02 |
| 05 | [Onboarding de preferências](./EPIC-05-onboarding-preferencias.md) | 02, 03, 04 | 04 |
| 06 | [Permissões](./EPIC-06-permissoes.md) | 13 | 05 |
| 07 | [Home](./EPIC-07-home.md) | 05 | 06 |
| 08 | [Busca](./EPIC-08-busca.md) | 06, 14 | 07 |
| 09 | [Rotas recomendadas](./EPIC-09-rotas-recomendadas.md) | 08 | 07 |
| 10 | [Preview e detalhe da rota](./EPIC-10-detalhe-rota.md) | 07, 09 | 07 |
| 11 | [Navegação ao vivo](./EPIC-11-navegacao-ao-vivo.md) | 08-nav, 24, 26 | 10 |
| 12 | [Story player](./EPIC-12-story-player.md) | 09, 25 | 11 |
| 13 | [Detalhe do local](./EPIC-13-place-detail.md) | 10 | 12 |
| 14 | [Journey summary e partilha](./EPIC-14-journey-summary.md) | 11, 27 | 11 |
| 15 | [Explore / Surprise me](./EPIC-15-explore.md) | 12 | 07 |
| 16 | [Locais guardados](./EPIC-16-saved-places.md) | 15 | 13 |
| 17 | [Perfil e preferências](./EPIC-17-perfil-preferencias.md) | 16–21 | 05 |
| 18 | [Offline e downloads](./EPIC-18-offline-downloads.md) | 23 | 10 |
| 19 | [Premium](./EPIC-19-premium.md) | 22 | 17 |
| 20 | [QA, observabilidade e release](./EPIC-20-qa-release.md) | — | todos |

## Convenções

- **Estimativa** em pontos (Fibonacci), por épico.
- Cada história segue `Como <persona>, quero <ação>, para <resultado>`.
- Critérios de aceitação em Gherkin simplificado (Dado / Quando / Então).
- Nenhuma história é dada como pronta sem: teste unitário (RNTL), estado offline tratado e entrada no Storybook quando envolve componente novo.

## De épico a GitHub Issue

Este ficheiro `.md` é a fonte de verdade (revisto por PR); a Issue é o que fica no Project board:

1. Escrever/editar `EPIC-XX-slug.md` aqui.
2. Criar a Issue correspondente a partir do ficheiro:
   `gh issue create --title "[EPIC] <título>" --body-file .user_stories/epics/EPIC-XX-slug.md --label epic`
3. Adicionar a Issue ao Project board.
