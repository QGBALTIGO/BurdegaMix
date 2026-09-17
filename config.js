/* EDITE AQUI links e funcionamento. Localização: edite somente location.json
   e execute python tools/sync_site.py; os campos abaixo são derivados do HTML.
   IMPORTANTE: horários ainda não confirmados.
   Linktree informa 14h–23h; Pedizap informa 15h–22h30 (consulta em 17/09/2026).
   Não há indicador de "aberto agora" nem sincronização com o Pedizap.
   Para exibir horários após confirmar, altere confirmed para true e preencha days:
   [{"label":"Segunda a domingo","hours":"15h às 22h30"}]
   O exemplo acima é apenas um formato, não uma confirmação do horário correto.
   publishedUrl deve receber a URL HTTPS real depois de publicar (opcional).
   Links presentes no HTML são alternativas de funcionamento sem JavaScript.
*/
(() => {
const location = JSON.parse(document.getElementById('location-data').textContent);
window.BURDEGA_CONFIG = {
  "brand": "Burdega Hamburgueria",
  "logo": {
    "loadRemoteWhenHosted": false,
    "url": "assets/logo-burdega.webp"
  },
  "links": {
    "menu": "https://burdegamix.pedizap.com.br/",
    "whatsapp": "https://wa.me/5588998047212?text=Oi%2C%20Burdega%21%20Vim%20pelo%20site%20e%20gostaria%20de%20fazer%20um%20pedido.%20%F0%9F%8D%94",
    "hoursWhatsapp": "https://wa.me/5588998047212?text=Oi%2C%20Burdega%21%20Qual%20%C3%A9%20o%20hor%C3%A1rio%20de%20atendimento%20hoje%3F",
    "maps": location.mapsUrl,
    "instagram": "https://www.instagram.com/burdegahamburgueria/",
    "tiktok": "https://www.tiktok.com/@burdega_mix"
  },
  "address": location.address,
  "openingHours": {
    "confirmed": false,
    "timezone": "America/Fortaleza",
    "notice": "Confira o atendimento de hoje no cardápio ou fale com a gente pelo WhatsApp.",
    "days": []
  },
  "share": {
    "title": "Burdega • Sua fome tem endereço.",
    "text": "Bateu a fome? Vem de Burdega! 🍔",
    "publishedUrl": ""
  }
};
})();
