# NXL — versão corrigida para Netlify

Esta versão mantém a aplicação atual e prepara a publicação da API Express como Netlify Function, com persistência em Netlify Blobs.

## Alterações desta versão
- Node fixado em `22.12.0` para alinhar build e runtime.
- Arquivo `server/data/nxl.json` incluído no pacote das Functions como fallback.
- Inicialização do banco no Netlify Blobs ficou explícita e com log de erro.
- Mantidos o mata-mata, escudos, destaque de posições e campeão da versão anterior.

## Deploy
- Build command: `npm run build`
- Publish directory: `client/dist`
- Functions directory: `netlify/functions`

A API continua disponível em `/api/*` e é reescrita para `/.netlify/functions/api/:splat`.
