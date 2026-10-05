# Roleta da Sorte

Uma roleta 3D para sorteios, com dois modos de uso:

- **Criar lista de participantes** — digite um nome por linha e sorteie entre nomes.
- **Roleta Faster** — roleta com fotos (protegida por senha).

## Acesso

A versão publicada está disponível em:

**https://celsofabri.github.io/roulette/**

## Como funciona

- As pessoas são distribuídas em um carrossel 3D (coverflow) com 5 faces visíveis.
- O giro é contínuo; o botão **Sortear** desacelera e destaca o vencedor.
- Música de fundo com botão de mudo (♪) e play/pause (▶).
- É possível marcar/desmarcar quem participa do sorteio.

## Estrutura

| Arquivo | Descrição |
| --- | --- |
| `index.html` | Estrutura e telas (abertura, senha, lista, seleção) |
| `script.js` | Interface, animação e lista de fotos da Roleta Faster |
| `logic.js` | Lógica pura da roleta (sem DOM), exportada como UMD |
| `styles.css` | Estilos |
| `roulette.test.js` | Testes da lógica |
| `fotos/` | Fotos dos participantes da Roleta Faster |

## Roleta Faster

A lista de participantes fica no array `FILES` em `script.js`. Cada item é o nome do
arquivo em `fotos/` (formato `nome-sobrenome.ext`), que é convertido em
"Nome Sobrenome" para exibição.

A senha de acesso fica na constante `PASSWORD`, também em `script.js`.

## Desenvolvimento

```bash
# rodar os testes
npm test
```

O deploy para o GitHub Pages é feito automaticamente pelo workflow
`.github/workflows/deploy.yml` a cada push na branch `main`.
