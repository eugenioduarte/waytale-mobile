# Subtasks

Uma subtask por ficheiro, nomeado `<nº da história>-slug.md` (ex.: `01.1-bootstrap-repositorio.md`
para a história 01.1 do épico). Cada subtask parte de uma história já escrita em
`../EPIC-XX-slug.md` — se a história ainda não existe lá, escrevê-la no épico primeiro.

Convenção de conteúdo, por subtask:

- **O quê**: 1-2 frases, âmbito fechado (deve caber numa PR).
- **Aceitação**: critério(s) verificável(is), herdado ou refinado a partir da história-mãe.
- **Dependências**: outras subtasks/épicos que têm de estar concluídos antes.

De subtask para GitHub Issue (task ligada à Issue do épico):

```bash
gh issue create --title "<slug do épico> · <título da subtask>" \
  --body-file .user_stories/epics/EPIC-XX-slug/subtasks/NN.N-slug.md \
  --label task
```

Nenhuma subtask é dada como pronta sem o que `../../README.md` já exige por história: teste
unitário, estado offline tratado, entrada no Storybook quando aplicável.
