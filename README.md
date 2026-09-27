# NXL eFootball Tournament Manager v3

Plataforma local para criação e gestão de campeonatos NXL.

## Recursos
- Jogadores com cadastro e remoção.
- Pontos corridos com turno único ou ida e volta.
- Mata-mata com jogo único ou ida e volta.
- Chaveamento completo e tratamento de byes.
- Grupos + mata-mata com grupos configuráveis e classificados por grupo.
- Geração automática de partidas.
- Lançamento de resultados e classificação automática.
- Resumo de jogos e gols.
- Dados locais em `server/data/nxl.json`.

## Rodar
```bash
npm install
npm run install:all
npm run dev
```
Abra `http://localhost:5173`.

## Observação
Para ida e volta no mata-mata, em caso de empate no agregado o sistema pede o vencedor no segundo jogo para definir a classificação.

## Escudos manuais
Na tela **Jogadores**, é possível escolher um escudo manualmente ao cadastrar o jogador ou trocar o escudo de um jogador já cadastrado. São aceitos PNG, JPG e WebP. A imagem é redimensionada automaticamente para uso no NXL.

## Acesso e moderadores
Na primeira abertura do painel, o NXL pede a criação da conta principal (proprietário). Depois, em **Moderadores**, o proprietário pode criar acessos individuais.

Moderadores podem criar/editar campeonatos, gerar/atualizar rodadas, lançar/editar resultados, avançar fases, configurar cores e compartilhar tabelas. Eles não podem gerenciar outros moderadores nem apagar jogadores/campeonatos.
