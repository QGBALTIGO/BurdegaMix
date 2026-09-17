// Public business data checked against the supplied Linktree and its official menu.
// Edit this file to change links/copy; do not hardcode business data in components.
export const site = {
  name: 'Burdega',
  legalDisplayName: 'Burdega Hamburgueria Artesanal',
  since: 2013,
  city: 'Várzea Alegre',
  state: 'CE',
  address: 'Rua Padre José Alves, 105',
  neighborhood: 'Centro',
  phone: '5588998047212',
  phoneDisplay: '(88) 99804-7212',
  instagramHandle: '@burdegahamburgueria',
  links: {
    menu: 'https://burdegamix.pedizap.com.br/',
    whatsapp: 'https://wa.me/5588998047212?text=Oi%2C%20Burdega!%20Vim%20pelo%20site%20e%20quero%20fazer%20um%20pedido.%20%F0%9F%8D%94',
    instagram: 'https://www.instagram.com/burdegahamburgueria/',
    maps: 'https://www.google.com/maps/search/?api=1&query=Burdega%20Mix%2C%20Rua%20Padre%20Jos%C3%A9%20Alves%2C%20105%2C%20Centro%2C%20V%C3%A1rzea%20Alegre%20CE',
    linktree: 'https://linktr.ee/burdegamix',
  },
  // Linktree: 14h–23h; Pedizap: 15h–22h30. No unverified live opening status.
  hoursMessage: 'Consulte os horários e a disponibilidade no cardápio on-line ou fale com a gente.',
  checkedAt: '2026-09-17',
}

export const media = {
  logo: { file: 'logo.webp', remote: 'https://ugc.production.linktr.ee/bWlHP1qBT42NM6PQbADk_0001-6067873187264833697.png?io=true&size=avatar-v3_0' },
  gourmet: { file: 'gourmet-miix.webp', remote: 'https://cdn.nsite.com.br/uploads/9210/product/photo_6a52a2e1a3f9b.jpeg' },
  bliss: { file: 'bacon-bliss.webp', remote: 'https://cdn.nsite.com.br/uploads/9210/product/photo_6a52a375a68b5.jpeg' },
  stick: { file: 'stick-b.webp', remote: 'https://cdn.nsite.com.br/uploads/9210/product/photo_6a52a34d9994b.jpeg' },
}

export const highlights = [
  { id: 'gourmet', name: 'Gourmet Miix', tag: 'O toque da casa', description: 'Queijo coalho, bacon e cebola caramelizada no brioche artesanal.', image: 'gourmet', number: '01' },
  { id: 'bliss', name: 'Bacon Bliss', tag: 'Pra quem ama bacon', description: 'Queijo coalho, cream cheese e bacon caramelizado. Finalizado com cebolinha.', image: 'bliss', number: '02' },
  { id: 'stick', name: 'Stick B', tag: 'Crocância em outro nível', description: 'Cheddar, geleia de pimenta artesanal e um stick de muçarela empanado.', image: 'stick', number: '03' },
]

export const quickLinks = [
  { id: 'menu', emoji: '🍔', title: 'Cardápio on-line', description: 'Escolha seu próximo favorito', label: 'Abrir cardápio on-line' },
  { id: 'whatsapp', emoji: '💬', title: 'Chama no Whats', description: 'Seu pedido, direto com a gente', label: 'Falar com a Burdega no WhatsApp' },
  { id: 'maps', emoji: '📍', title: 'Como chegar', description: 'Vem curtir no nosso salão', label: 'Ver a localização da Burdega no Google Maps' },
  { id: 'instagram', emoji: '📸', title: 'Nosso Instagram', description: 'Novidades que dão fome', label: 'Abrir Instagram da Burdega' },
]
