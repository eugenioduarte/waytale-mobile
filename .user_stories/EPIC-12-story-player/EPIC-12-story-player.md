# EPIC-12 — Story player

**Objetivo:** reproduzir a narração com texto acompanhado, controlos simples e transparência de fontes.

**Estimativa:** 8 pts · **Telas:** 09 Story player · 25 Fonte da história · **Depende de:** EPIC-11

## Histórias

### 12.1 — Cartão de história
Como utilizador, quero ouvir e, se quiser, ler.

- Título, local, texto com palavras-chave em laranja, AudioWave, linha de progresso
- Controlos: play/pause, −15 s, repetir, próxima

**Aceitação:** texto acompanha o áudio (destaque do parágrafo atual) e é legível sem áudio.

### 12.2 — Áudio em background
Como caminhante, quero o telefone no bolso.

- Controlos no ecrã de bloqueio e em auscultadores (play/pause, próxima)

**Aceitação:** ligar/desligar auscultadores pausa/retoma corretamente; chamada telefónica pausa e retoma.

### 12.3 — Velocidade e idioma
Como utilizador, quero ajustar o ritmo e a língua.

- 0.8×–1.5×; idioma herda das preferências, com override por história

**Aceitação:** a preferência persiste entre histórias e sessões.

### 12.4 — Fonte da história
Como utilizador cético, quero saber de onde vem a informação.

- Lista de fontes com entidade e ano; link externo quando existe
- Botão "Reportar um erro" com motivo e comentário livre

**Aceitação:** toda a história publicada tem ≥1 fonte; reporte cria registo no Supabase mesmo criado offline.

### 12.5 — Transcrição e acessibilidade
Como utilizador surdo, quero ler tudo.

**Aceitação:** transcrição integral disponível; leitor de ecrã lê o texto na ordem correta.

