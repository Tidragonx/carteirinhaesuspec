# Gerador Carteirinha SUS e-SUS

Extensao Chrome para inserir um botao na tela de cadastro do e-SUS e gerar uma carteirinha do SUS a partir dos dados visiveis na pagina.

## GitHub Pages

Os arquivos da politica de privacidade para publicacao no GitHub Pages estao em [docs](C:\Users\Tiagov\Documents\projetocarteirinhasus\docs).

Depois de subir o repositorio para o GitHub, ative o GitHub Pages apontando para a branch `main` e pasta `/docs`.
A URL publica da politica ficara neste formato:

`https://SEU-USUARIO.github.io/SEU-REPOSITORIO/privacy-policy.html`

## Como carregar

1. Abra `chrome://extensions`.
2. Ative o `Modo do desenvolvedor`.
3. Clique em `Carregar sem compactacao`.
4. Selecione a pasta `C:\Users\Tiagov\Documents\projetocarteirinhasus`.

## Como usar

1. Abra a tela de visualizacao de cadastro no e-SUS.
2. A extensao tenta inserir o botao `Gerar Carteirinha SUS` antes de `Atualizar Cadastro`.
3. Clique no botao para abrir a tela de pre-visualizacao.
4. Revise os dados extraidos e clique em `Imprimir / Salvar PDF`.

## Limitacao atual

Esta primeira versao usa reconhecimento por rotulos de campos na pagina. Como a estrutura HTML exata da sua tela do e-SUS ainda nao foi capturada aqui, os seletores podem precisar de ajuste fino para extrair todos os dados automaticamente.
