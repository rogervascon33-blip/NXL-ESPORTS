# NXL — versão pronta para Netlify

Esta versão usa Netlify Functions para a API Express e Netlify Blobs para persistir o banco `server/data/nxl.json`.

## Deploy
- Build command: `npm run build`
- Publish directory: `client/dist`
- Functions directory: `netlify/functions`

O primeiro deploy inicializa o banco persistente no Netlify Blobs usando `server/data/nxl.json` como base. Depois, os dados são salvos no store `nxl-data`.
