# 🍔 Burdega — página-guia

Nova página-guia da Burdega, em HTML, CSS e JavaScript puros. Esta versão substitui integralmente o projeto anterior em React/Vite. O histórico do Git foi mantido para recuperação, mas os arquivos antigos não fazem parte da versão atual.

## Abrir

Abra `index.html` no navegador. Não é necessário instalar Node, dependências, framework ou executar build. Os destinos de cardápio, WhatsApp, redes sociais e mapa precisam de internet.

## Editar

- `index.html`: estrutura, textos e links de alternativa sem JavaScript.
- `styles.css`: cores, layout responsivo e animações.
- `config.js`: links, referência da logo, horários e compartilhamento.
- `location.json`: fonte única do endereço e dos identificadores do Google Maps.
- `script.js`: janelas, cópia de endereço, compartilhamento e botão de pedido no celular.
- `assets/`: ilustrações SVG locais.
- `gerar_html_unico.py`: gerador opcional de uma cópia portátil.

Ao alterar links no `config.js`, atualize também os `href` correspondentes no HTML para manter o funcionamento sem JavaScript.

## Publicar

Publique `index.html`, `styles.css`, `config.js`, `script.js` e a pasta `assets/`, preservando os caminhos relativos. A pasta de publicação é a raiz do projeto, não `dist`. O arquivo `.nojekyll` permite servir os arquivos estáticos diretamente no GitHub Pages.

Em uma hospedagem anteriormente configurada para o projeto antigo, remova o preset React/Vite e os comandos `npm install`/`npm run build`; use hospedagem estática, sem build, com saída na raiz. Configurações externas de hospedagem e domínio não são alteradas por estes arquivos.

## Gerar um HTML único (opcional)

Com Python 3:

```bash
python gerar_html_unico.py
```

Isso gera `burdega.html`, que pode ser publicado sozinho com o nome `index.html`. Esse arquivo é ignorado pelo Git para não manter duas cópias divergentes. O site normal não depende de Python.

## Atendimento, imagens e pedidos

Os horários continuam pendentes de confirmação: as referências consultadas na criação divergiam. Mantenha `openingHours.confirmed` como `false` até confirmar com a hamburgueria. A página não anuncia se está aberta ou fechada em tempo real.

O hambúrguer é uma ilustração decorativa, não uma fotografia de produto. A logo tenta carregar a imagem pública do Linktree quando a página é hospedada; a ilustração local serve de alternativa se o carregamento falhar. Para independência completa, use o arquivo oficial local e desative `logo.loadRemoteWhenHosted`.

Pedidos continuam no cardápio existente; não há carrinho próprio, banco de dados, cadastro, API paga ou rastreamento neste código. Nenhum relatório de clientes foi incluído.

## Referências utilizadas na criação

- https://linktr.ee/burdegamix
- https://burdegamix.pedizap.com.br/
- https://www.instagram.com/burdegahamburgueria/

Marca e imagens pertencem aos respectivos titulares.

## Localização fixa e recuperação de carregamento

A única fonte editável de localização é `location.json`. O Place ID é usado no
botão externo. O mini mapa usa a incorporação com o CID do **mesmo cadastro**;
nome, telefone e cardápio foram conferidos na resposta pública do Google em
17/09/2026. Os identificadores e a conferência estão registrados nesse arquivo.
Não use `q=place_id:...` na antiga incorporação por busca: esse formato retornou
um local diferente durante a verificação. Não há chave/API paga nesta integração.

Depois de editar a localização, execute:

```bash
python tools/sync_site.py
python tools/sync_site.py --check
python -m unittest discover -s tests -v
```

O gerador sincroniza endereço exibido, valor copiado, URL do botão, mini mapa,
alternativa sem JavaScript e JSON interno. `config.js` consome esse JSON, sem
manter outra cópia editável do endereço. O workflow `Validate location and
recovery` detecta divergências em pushes/PRs; ele não altera dados nem corrige
silenciosamente um Place ID/CID inválido. Confirme ambos no Google ao mudar de local.

`recovery.js` e `styles/recovery.css` também são incorporados no HTML pelo gerador.
Isso evita novas requisições e mantém a cópia, o mapa e a recuperação da imagem
independentes de uma falha no carregamento de `config.js`/`script.js`. A imagem
WebP local continua sendo priorizada; após erro há uma repetição automática
limitada e um botão para tentar novamente. O mapa só inicia perto da tela e
mantém links nativos para recarregar e abrir o estabelecimento externamente.

O evento `load` de um iframe de outro domínio não comprova que os mapas/tiles
foram carregados. Por isso o site não anuncia sucesso confirmado: o estado de
carregamento é discreto, há aviso se demorar e o controle de recarregar permanece
acessível mesmo após um evento `load` de uma página de erro do navegador.
