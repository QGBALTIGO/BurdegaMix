# Burdega — página-guia

Site estático da Burdega Hamburgueria, em HTML, CSS e JavaScript. O visual existente é preservado: pôster com a foto real do hambúrguer, marca transparente, links de pedidos e redes sociais, faixa animada e cartão do Google Maps.

O site não exige framework, Node, Python, API paga ou banco de dados para funcionar. Python é usado **somente na manutenção/validação**; Playwright é usado **somente nos testes**, nunca no navegador do cliente. Os pedidos continuam no Pedizap e no WhatsApp, sem carrinho ou cadastro próprios.

## Abrir e publicar

Para uma prévia com o comportamento de um servidor local:

```bash
python -m http.server 8000
```

Abra `http://localhost:8000`. Abrir `index.html` diretamente também permite uma prévia, mas compartilhamento/área de transferência dependem das permissões e do contexto do navegador. Os destinos externos e o mapa precisam de internet.

O GitHub Pages publica a **raiz** da `main`, sem pasta `dist` ou comando `npm run build`. Preserve `.nojekyll` e `CNAME`; o domínio definido é `burdegamix.com.br`. Não altere DNS ou domínio como parte de uma edição de conteúdo. Para outra hospedagem estática, envie `index.html`, `styles.css`, `config.js`, `script.js` e `assets/`, preservando os caminhos relativos.

## Onde editar

| Arquivo ou pasta | Responsabilidade |
|---|---|
| `index.html` | Estrutura e textos fora dos blocos marcados como gerados. |
| `config.js` | Links de pedidos/redes, horários, compartilhamento e opção de logo. |
| `location.json` | Única fonte editável do endereço, Place ID e CID. |
| `templates/location-card.html` | Estrutura do cartão do mapa, com campos preenchidos pelo gerador. |
| `styles/base.css` | Layout original, tipografia, cores-base, cartões e regras responsivas. |
| `styles/appearance.css` | Modo claro/escuro e apresentação da marca transparente. |
| `styles/burger.css` | Composição da foto, sombra e estilos de interação do hambúrguer. |
| `styles/icons.css` | Ícones vetoriais decorativos. |
| `styles/location.css` | Caixa de localização e seus pontos de quebra. |
| `styles/ticker.css` | Apresentação da faixa com/sem animação. |
| `styles/recovery.css` | Estilos críticos de recuperação, cópia e alternativa sem JavaScript. |
| `script.js` | Interações, janelas, compartilhamento, faixa e animação do hambúrguer. |
| `recovery.js` | Recuperação independente da imagem/mapa e cópia do endereço. |
| `tools/sync_site.py` | Gera os blocos do HTML e o pacote de estilos; detecta divergências. |
| `tests/` e `tests/browser/` | Testes de estrutura/consistência e testes no navegador. |

### Fontes versus arquivos gerados

**Não edite `styles.css` diretamente.** Ele é gerado a partir dos módulos em `styles/`, na ordem explícita `STYLE_SOURCES` de `tools/sync_site.py`. Essa ordem preserva a cascata anterior; não é alfabética. Os visitantes baixam **um único pacote de CSS**, não uma requisição para cada módulo. A URL inclui uma versão derivada do conteúdo para invalidar o cache ao alterar estilos.

Os blocos do HTML delimitados por `styles:bundle`, `location:card`, `location:data`, `recovery:style` e `recovery:script` são gerados. Edite suas fontes, não as cópias. A exceção intencional ao CSS externo é o pequeno bloco **crítico de recuperação**, gerado de `styles/recovery.css`: a interface de falha não deve depender de mais uma requisição externa. Não há CSS criado por `script.js`; ele alterna classes e calcula apenas valores dinâmicos de animação/medidas.

Após editar fontes de estilos, localização, recuperação ou o template do mapa:

```bash
python tools/sync_site.py
python tools/sync_site.py --check
python -m unittest discover -s tests -v
```

Inclua no mesmo commit as fontes e os arquivos gerados. Não publique apenas metade da alteração. O comando `--check` e a validação do GitHub **detectam** divergências; não corrigem arquivos silenciosamente. Ao alterar `script.js` ou `config.js`, atualize a versão na respectiva URL no HTML para evitar uma cópia antiga em cache.

## Imagens atuais e carregamento

A foto real aprovada está em **`assets/burger-640.webp`**, com transparência e composição preservadas; a marca transparente está em **`assets/logo-burdega.webp`**. São cópias locais otimizadas das imagens aprovadas, não novas ilustrações. O site normal **não baixa a foto ou a logo do ImgBB/Linktree**. Origem, medidas e pesos constam em `assets/media-manifest.json`.

A foto tem prioridade de carregamento e só aparece quando está pronta. A recuperação oferece aviso se demorar, uma tentativa automática limitada e nova tentativa manual. A faixa e a interação do hambúrguer respeitam a preferência de reduzir movimento.

`logo.loadRemoteWhenHosted` está desativado. A opção legada de sobrescrita remota permanece disponível no código, mas não é usada pela configuração atual. `assets/marca-apoio.svg` é o favicon; `assets/burger-ilustrado.svg` é um arquivo legado, não a foto usada no destaque.

## Localização fixa e proteção contra divergências

O botão do Google usa o Place ID, e a incorporação usa o CID **do mesmo cadastro verificado**. A conferência por nome, telefone e cardápio está registrada em `location.json`. Não volte a usar uma busca textual para substituir esses identificadores. Não use `q=place_id:...` na incorporação antiga por busca: esse formato retornou um local diferente na verificação anterior.

A partir de `location.json`, o gerador sincroniza endereço exibido, texto copiado, botão externo, mini mapa, alternativa sem JavaScript e JSON interno. Uma verificação de consistência não confirma que um novo cadastro escolhido seja correto: valide Place ID e CID no Google antes de trocar o estabelecimento.

`recovery.js` é incorporado no HTML e não depende de `config.js` ou `script.js`. Assim, uma falha nesses arquivos não desativa a cópia do endereço, a recuperação da foto ou o mapa. O mapa começa perto da área visível e mantém acesso externo e controle de recarregamento. O evento `load` de um iframe de outro domínio **não comprova** que o conteúdo do Google está saudável; uma página de erro também pode dispará-lo.

## Horários, links e conteúdo

Os horários **continuam pendentes de confirmação**. Mantenha `openingHours.confirmed` como `false` até confirmar com a hamburgueria; não há indicação de aberto/fechado em tempo real. Não preencha horários apenas com base nos exemplos de código.

Ao editar links em `config.js`, atualize também os `href` equivalentes fora dos blocos gerados no HTML, para manter a alternativa sem JavaScript. Os testes comparam essas referências. Endereço e Maps são exceção: edite somente `location.json` e gere novamente.

## Testes automatizados

### Estrutura e consistência — sem dependências adicionais

```bash
python tools/sync_site.py --check
python -m unittest discover -s tests -v
node --check script.js
node --check config.js
node --check recovery.js
```

Os testes verificam a fonte da localização, sincronização dos estilos, ausência de CSS avulso no HTML/JS, arquivos de imagem, referências locais, links de alternativa e exportação portátil.

### Navegador — instalação apenas para desenvolvimento/CI

```bash
python -m venv .venv
# Ative a .venv conforme seu sistema operacional.
python -m pip install -r requirements-test.txt
python -m playwright install --with-deps chromium webkit
python -m unittest discover -s tests/browser -v
```

Chromium é o padrão. Para WebKit em Linux/macOS:

```bash
BURDEGA_BROWSER=webkit python -m unittest discover -s tests/browser -v
```

No PowerShell, defina `$env:BURDEGA_BROWSER="webkit"` antes de executar o comando. A suíte inicia e encerra seu próprio servidor local. `CHROMIUM_EXECUTABLE` permite usar um Chromium já instalado durante testes locais; não é necessário no CI.

Os testes abrangem links/cliques, imagens carregadas, cópia e confirmação, recuperação com scripts ausentes/imagem corrompida, mapa fixo e recarregamento, modos claro/escuro, larguras responsivas, faixa avançando/pausando/retomando, redução de movimento, interação do hambúrguer e janelas.

**Limites:** chamadas para serviços externos são interceptadas e respondidas por conteúdo de teste. Não são enviados pedidos ou mensagens. A área de transferência é simulada para conferir o texto e os fluxos de permissão; isso não substitui um teste manual em iPhone/Android. Os testes de mapa validam o destino e o funcionamento da integração, não a disponibilidade em tempo real do Google. WebKit automatizado não equivale a um iPhone físico.

O workflow **Validate site** executa os testes em cada push na `main` e em pull requests: estrutura/consistência e navegador em **Chromium e WebKit**. Falhas de navegador salvam capturas em `test-results/`, disponibilizadas como artefatos da execução. Os testes não modificam o site nem publicam commits.

## HTML portátil

```bash
python gerar_html_unico.py --saida burdega.html
```

A exportação reúne os estilos atuais, scripts e imagens locais em um HTML único. O arquivo é ignorado pelo Git para evitar duas versões editáveis da página. Mapa e destinos externos continuam exigindo internet. Use o pacote de arquivos normal na publicação do site; a exportação é opcional.

Marca e imagens pertencem aos respectivos titulares. Nenhum relatório de clientes foi incluído no site.
