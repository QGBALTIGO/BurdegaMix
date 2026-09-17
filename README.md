# 🍔 Burdega Mix

Landing page da **Burdega Hamburgueria Artesanal**, adaptada do [Burger House 3D](https://github.com/mindset-code/burger-house-3d). Preto, amarelo e vermelho da marca; fotos do cardápio oficial; pedidos a um toque.

## O que está pronto

- Hero com foto real do Gourmet Miix e modo 3D opcional, carregado somente ao clicar.
- Guia rápido: cardápio, WhatsApp, localização e Instagram.
- Seleção visual de Gourmet Miix, Bacon Bliss e Stick B. Valores e pedidos ficam no Pedizap, sem duplicar estoque ou preços.
- História desde 2013, endereço de Várzea Alegre, delivery e salão.
- Layout responsivo a partir de 320 px; barra de pedido fixa no celular.
- Navegação por teclado, texto alternativo, `prefers-reduced-motion`, controle de animações, compartilhamento e fallback para imagens/WebGL.
- Fotos locais otimizadas em WebP e dependências travadas no lockfile após o primeiro CI bem-sucedido.
- Build e testes automáticos no GitHub Actions; capturas desktop/mobile disponíveis nos artefatos.

## Rodar

Requer **Node.js 22.12+**.

```bash
npm install
npm run dev
```

Após a criação do `package-lock.json` pelo primeiro CI, prefira `npm ci` para instalações reproduzíveis.

```bash
npm test
npm run build
npm run preview
```

O primeiro `dev`/`build` executa `npm run assets`. Ele usa somente as URLs públicas declaradas em `src/data/site.js`; as próximas execuções reutilizam as imagens locais. Uma falha de download não derruba a página: a imagem tenta a URL oficial e, por último, uma ilustração local. O CI exige as fotos reais antes de aprovar o primeiro build.

## Personalizar

**`src/data/site.js`** concentra os links, telefone, endereço, textos dos produtos e fontes das imagens. **`src/App.css`** contém as cores e o layout. Para atualizar uma foto, altere sua URL e o nome de arquivo em `media`, depois rode `npm run assets`.

Os horários das duas fontes oficiais estavam divergentes; foi mantido um acesso para consultar o atendimento, **sem anunciar "aberto agora"**. Não foram inventados preços, ofertas ou avaliações. Detalhes e fontes em [SOURCES.md](./SOURCES.md).

## Hospedar

O código está preparado para hospedagem estática. Publicar os arquivos no GitHub não é o mesmo que ativar um domínio/site público.

### Vercel

Importe este repositório. Preset **Vite**; build `npm run build`; saída `dist`. O arquivo `vercel.json` já configura isso.

### Netlify

Importe o repositório; `netlify.toml` já define o build.

### GitHub Pages ou outro servidor estático

Faça `npm run build` e publique o conteúdo de `dist`. Os caminhos relativos suportam subpastas, inclusive `/BurdegaMix/`. Não é necessário backend ou banco de dados. Não há publicação automática em produção configurada.

Depois de definir um domínio, personalize os metadados de compartilhamento em `index.html` e adicione a URL canônica.

## Testes

```bash
npx playwright install chromium
npm run test:e2e
```

Os testes verificam links comerciais, layout em 320/390/768/1440 px, imagens reais, navegação mobile, compartilhamento, controles 3D e disponibilidade sem JavaScript. O workflow também disponibiliza a pasta `dist` pronta para hospedagem, capturas e relatório de testes.

O CI tem permissão para gravar **somente os artefatos gerados adicionados explicitamente pelo script** (`package-lock.json` e `public/media`) na branch `main`, após todos os testes passarem. Não envia dados para outros serviços além das fontes públicas e não publica um site em produção.

## Licença

Código sob MIT, com os créditos originais preservados. Marca e fotografias continuam pertencendo aos titulares; não fazem parte da licença MIT. Veja [LICENSE](./LICENSE) e [SOURCES.md](./SOURCES.md).
