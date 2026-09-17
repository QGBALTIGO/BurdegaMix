# Fontes, créditos e decisões

Verificação inicial: 17/09/2026.

## Código de origem

Adaptação de [mindset-code/burger-house-3d](https://github.com/mindset-code/burger-house-3d), árvore `c2bddc597efe4870326c843a6e056727752fc261`, licença MIT, Copyright (c) 2026 Mindset & Code. O aviso original está preservado em LICENSE.

Foram adaptados o App React com GSAP/ScrollTrigger, a estrutura HeroScene / Marquee / Projects / About / Contact e o padrão Canvas/useFrame/IntersectionObserver do GLBScene. A interface, os textos, os dados e os estilos foram reescritos para a Burdega.

Os GLBs de terceiros do original **não foram redistribuídos**: a documentação os chama de Creative Commons sem fornecer a licença/autoria individual de cada arquivo. A ilustração procedural incluída nesta adaptação foi criada em código, sem esses arquivos ou HDRs externos. Ela é identificada como ilustração e não como foto de produto.

## Identidade e informações comerciais

- https://linktr.ee/burdegamix — logo, nome da marca, desde 2013, delivery e salão, cardápio e WhatsApp.
- https://www.instagram.com/burdegahamburgueria/ — perfil indicado pelo proprietário; link mantido. O acesso automatizado ao feed estava bloqueado, portanto o feed não foi copiado e informações exclusivas dele não foram presumidas.
- https://burdegamix.pedizap.com.br/ — endereço, produtos e fotos dos produtos. Apenas uma seleção visual; preços, estoque, taxa de entrega, funcionamento e checkout continuam no cardápio oficial.
- WhatsApp extraído do botão oficial do Linktree: +55 88 99804-7212.
- Endereço no cardápio: R PE JOSE ALVES,105, CENTRO, VÁRZEA ALEGRE - CE. Na interface: Rua Padre José Alves, 105 — Centro, Várzea Alegre, CE.

### Horários divergentes

O Linktree indicava 14h–23h, enquanto o Pedizap indicava 15h–22h30. Por isso a interface não publica um horário fixo ou status "aberto agora". O visitante pode consultar o canal de pedidos/WhatsApp. Confirmar com o estabelecimento antes de habilitar qualquer automação de funcionamento.

### Fotografias

Logo: `https://ugc.production.linktr.ee/bWlHP1qBT42NM6PQbADk_0001-6067873187264833697.png?io=true&size=avatar-v3_0`.

Imagens identificadas no HTML do cardápio oficial, nas tags `img[data-src]`:

- Gourmet Miix: `photo_6a52a2e1a3f9b.jpeg`
- Bacon Bliss: `photo_6a52a375a68b5.jpeg`
- Stick B: `photo_6a52a34d9994b.jpeg`

Originais no diretório público `https://cdn.nsite.com.br/uploads/9210/product/`. O script `scripts/prepare-assets.mjs` baixa e otimiza em WebP; os arquivos ficam locais em `public/media`. A marca e as fotos pertencem aos respectivos titulares e **não** são relicenciadas pela MIT do código.

Fontes tipográficas: Barlow Condensed e DM Sans via Google Fonts, com fontes de sistema como alternativa. Nenhum arquivo de fonte é incluído neste repositório.

## Escopo

Landing page / guia rápido para substituir a experiência de Linktree. Sem pagamentos próprios, carrinho falso, formulário sem backend, avaliações inventadas, depoimentos inventados ou promoções não confirmadas. Sem integração de acompanhamento de visitantes ou cookies de marketing adicionados.
