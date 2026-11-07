/* =========================================================================
   NEXUS PLAY \u2014 DADOS
   Todo o conte\u00fado do site vive aqui. Para editar textos, pre\u00e7os, jogos,
   amigos ou mensagens, altere apenas este arquivo.
   ========================================================================= */
(function () {
  'use strict';

  /* ------------------------------- CAT\u00c1LOGO (fonte \u00fanica) ------------------------------- */
  var catalog = [
    {
      id: 'eclipse',
      title: 'Elden Ring',
      sub: 'Edi\u00e7\u00e3o Shadow of the Erdtree',
      publisher: 'FromSoftware',
      genre: 'RPG',
      group: 'RPG',
      tags: ['Souls-like', 'Mundo aberto', 'Single player'],
      price: 199.00,
      oldPrice: 249.00,
      rating: 4.9,
      size: '60 GB',
      year: 2024,
      badge: 'Top',
      reviews: '+53.000 avalia\u00e7\u00f5es',
      desc: 'Levante-se, Semgra\u00e7a, e atravesse as Terras Interm\u00e9dias \u2014 um mundo vasto e sombrio cheio de segredos, chefes lend\u00e1rios e liberdade total de explora\u00e7\u00e3o.',
      cover: 'assets/cover-eclipse.svg',
      owned: true, installed: true, hours: 412, lastPlayed: 'hoje'
    },
    {
      id: 'cordas',
      title: 'Cyberpunk 2077',
      sub: 'Edi\u00e7\u00e3o Ultimate',
      publisher: 'CD Projekt Red',
      genre: 'RPG',
      group: 'RPG',
      tags: ['RPG', 'Mundo aberto', 'Cyberpunk'],
      price: 149.00,
      oldPrice: 199.00,
      rating: 4.7,
      size: '70 GB',
      year: 2023,
      badge: '-25%',
      reviews: '+72.000 avalia\u00e7\u00f5es',
      desc: 'Night City espera. Torne-se um mercen\u00e1rio cyberpunk em uma aventura urbana \u00e9pica com escolhas que mudam tudo \u2014 incluindo o DLC Phantom Liberty.',
      cover: 'assets/cover-norte.svg',
      owned: true, installed: true, hours: 96, lastPlayed: 'h\u00e1 5 dias'
    },
    {
      id: 'metro',
      title: 'Forza Horizon 5',
      sub: 'Edi\u00e7\u00e3o Premium',
      publisher: 'Xbox Game Studios',
      genre: 'Corrida',
      group: 'Corrida',
      tags: ['Corrida', 'Mundo aberto', 'Online'],
      price: 129.00,
      oldPrice: 199.00,
      rating: 4.8,
      size: '115 GB',
      year: 2021,
      badge: '-35%',
      reviews: '+38.000 avalia\u00e7\u00f5es',
      desc: 'Explore o M\u00e9xico vibrante em centenas de carros dos sonhos \u2014 festivais, desafios e liberdade total em mundo aberto.',
      cover: 'assets/cover-metro.svg',
      owned: true, installed: true, hours: 265, lastPlayed: 'hoje'
    },
    {
      id: 'fronteira',
      title: 'Red Dead Redemption 2',
      sub: 'Edi\u00e7\u00e3o Ultimate',
      publisher: 'Rockstar Games',
      genre: 'A\u00e7\u00e3o',
      group: 'Aventura',
      tags: ['Mundo aberto', 'Faroeste', 'Single player'],
      price: 149.00,
      rating: 4.9,
      size: '120 GB',
      year: 2019,
      badge: 'Cl\u00e1ssico',
      reviews: '+45.000 avalia\u00e7\u00f5es',
      desc: 'Arthur Morgan e a gangue Van der Linde fogem em uma \u00e9pica jornada pelo cora\u00e7\u00e3o dos EUA \u2014 a maior hist\u00f3ria j\u00e1 contada em um jogo.',
      cover: 'assets/cover-fronteira.svg',
      owned: true, installed: true, hours: 318, lastPlayed: 'h\u00e1 3 dias'
    },
    {
      id: 'ruinas',
      title: 'God of War Ragnar\u00f6k',
      sub: 'Edi\u00e7\u00e3o Digital Deluxe',
      publisher: 'Santa Monica Studio',
      genre: 'A\u00e7\u00e3o',
      group: 'A\u00e7\u00e3o',
      tags: ['A\u00e7\u00e3o', 'Mitologia', 'Single player'],
      price: 179.00,
      oldPrice: 249.00,
      rating: 4.9,
      size: '90 GB',
      year: 2022,
      badge: '-28%',
      reviews: '+32.000 avalia\u00e7\u00f5es',
      desc: 'Kratos e Atreus enfrentam o Ragnar\u00f6k \u2014 combates brutais, mitologia n\u00f3rdica e uma hist\u00f3ria emocionante sobre pai e filho.',
      cover: 'assets/cover-ruinas.svg',
      owned: true, cloud: true, hours: 154, lastPlayed: 'h\u00e1 2 dias'
    },
    {
      id: 'silencio',
      title: 'Resident Evil 4 Remake',
      sub: 'Edi\u00e7\u00e3o Deluxe',
      publisher: 'Capcom',
      genre: 'Terror',
      group: 'Terror',
      tags: ['Terror', 'Sobreviv\u00eancia', 'A\u00e7\u00e3o'],
      price: 159.00,
      oldPrice: 229.00,
      rating: 4.8,
      size: '65 GB',
      year: 2023,
      badge: '-30%',
      reviews: '+28.000 avalia\u00e7\u00f5es',
      desc: 'Leon S. Kennedy resgata a filha do presidente em uma aldeia europeia cheia de horrores \u2014 o survival horror reimaginado.',
      cover: 'assets/cover-silencio.svg',
      owned: false
    },
    {
      id: 'aether',
      title: "Baldur's Gate 3",
      sub: 'Edi\u00e7\u00e3o Digital Deluxe',
      publisher: 'Larian Studios',
      genre: 'RPG',
      group: 'RPG',
      tags: ['RPG', 'Fantasia', 'Cooperativo'],
      price: 179.00,
      rating: 4.9,
      size: '122 GB',
      year: 2023,
      badge: 'Jogo do Ano',
      reviews: '+89.000 avalia\u00e7\u00f5es',
      desc: 'Re\u00fana seu grupo e volte \u00e0s Terras M\u00e9dias em um RPG \u00e9pico de escolhas \u2014 cada decis\u00e3o muda o mundo e sua hist\u00f3ria.',
      cover: 'assets/cover-circulo.svg',
      owned: true, installed: true, hours: 201, lastPlayed: 'ontem'
    },
    {
      id: 'quartica',
      title: 'GTA V',
      sub: 'Edi\u00e7\u00e3o Premium',
      publisher: 'Rockstar Games',
      genre: 'A\u00e7\u00e3o',
      group: 'Aventura',
      tags: ['Mundo aberto', 'Multijogador', 'A\u00e7\u00e3o'],
      price: 49.90,
      oldPrice: 99.90,
      rating: 4.8,
      size: '95 GB',
      year: 2015,
      badge: '-50%',
      reviews: '+120.000 avalia\u00e7\u00f5es',
      desc: 'Los Santos e GTA Online \u2014 tr\u00eas criminosos, in\u00fameras miss\u00f5es e o modo online mais jogado do mundo.',
      cover: 'assets/cover-neon.svg',
      owned: false
    },
    {
      id: 'aurora',
      title: 'Minecraft',
      sub: 'Edi\u00e7\u00e3o Java + Bedrock',
      publisher: 'Mojang Studios',
      genre: 'Simula\u00e7\u00e3o',
      group: 'Simula\u00e7\u00e3o',
      tags: ['Sobreviv\u00eancia', 'Criativo', 'Multiplayer'],
      price: 119.00,
      rating: 4.9,
      size: '2 GB',
      year: 2024,
      badge: 'Lend\u00e1rio',
      reviews: '+200.000 avalia\u00e7\u00f5es',
      desc: 'Construa, explore e sobreviva em um mundo de blocos infinito \u2014 o jogo mais vendido de todos os tempos.',
      cover: 'assets/cover-aurora.svg',
      owned: false
    },
    {
      id: 'trovao',
      title: 'EA Sports FC 25',
      sub: 'Edi\u00e7\u00e3o Ultimate',
      publisher: 'EA Sports',
      genre: 'Esporte',
      group: 'Esporte',
      tags: ['Esporte', 'Futebol', 'Online'],
      price: 279.00,
      oldPrice: 349.00,
      rating: 4.3,
      size: '50 GB',
      year: 2024,
      badge: 'Novo',
      reviews: '+18.000 avalia\u00e7\u00f5es',
      desc: 'O futebol mais realista j\u00e1 criado \u2014 Ultimate Team, Carreira e modo Club com amigos.',
      cover: 'assets/cover-trovao.svg',
      owned: false
    }
  ];

  var byId = {};
  catalog.forEach(function (g) { if (!g.preview) g.preview = g.cover; });
  catalog.forEach(function (g) { byId[g.id] = g; });
  function pick(ids) { return ids.map(function (id) { return byId[id]; }); }

  /* ------------------------------- HERO (In\u00edcio) ------------------------------- */
  var slides = [
    {
      id: 'eclipse',
      title: 'Elden Ring',
      desc: 'Levante-se, Semgra\u00e7a, e atravesse as Terras Interm\u00e9dias \u2014 um mundo vasto e sombrio cheio de segredos, chefes lend\u00e1rios e liberdade total de explora\u00e7\u00e3o.',
      tag: { icon: 'ic-flame', label: 'Em alta' },
      dots: ['ic-gamepad', 'ic-cloud'],
      players: ['av3', 'av6', 'av9'],
      reviews: '+53.000 avalia\u00e7\u00f5es',
      art: { filter: 'saturate(1.05)', flip: false },
      alt: 'Guerreiro das Terras Interm\u00e9dias empunhando espada sob luz dourada',
      grad: 'radial-gradient(115% 105% at 86% 12%, #7A2536 0%, #4E1828 46%, #3B1420 100%)'
    },
    {
      id: 'fronteira',
      title: 'Red Dead Redemption 2',
      desc: 'Arthur Morgan e a gangue Van der Linde fogem em uma \u00e9pica jornada pelo cora\u00e7\u00e3o dos EUA \u2014 a maior hist\u00f3ria j\u00e1 contada em um jogo.',
      tag: { icon: 'ic-gamepad', label: 'Faroeste' },
      dots: ['ic-flame', 'ic-cloud'],
      players: ['av5', 'av8', 'av2'],
      reviews: '+45.000 avalia\u00e7\u00f5es',
      art: { filter: 'hue-rotate(180deg) saturate(.92)', flip: true },
      alt: 'Cowboy da gangue Van der Linde sobre dunas sob sol poente',
      grad: 'radial-gradient(115% 105% at 86% 12%, #23503E 0%, #1B3A32 46%, #3B1420 100%)'
    },
    {
      id: 'ruinas',
      title: 'God of War Ragnar\u00f6k',
      desc: 'Kratos e Atreus enfrentam o Ragnar\u00f6k \u2014 combates brutais, mitologia n\u00f3rdica e uma hist\u00f3ria emocionante sobre pai e filho.',
      tag: { icon: 'ic-cloud', label: 'Nuvem pronta' },
      dots: ['ic-gamepad', 'ic-thumb'],
      players: ['av4', 'av10', 'av7'],
      reviews: '+32.000 avalia\u00e7\u00f5es',
      art: { filter: 'hue-rotate(285deg) saturate(1.08)', flip: false },
      alt: 'Kratos e Atreus enfrentando o Ragnar\u00f6k',
      grad: 'radial-gradient(115% 105% at 86% 12%, #6E4213 0%, #57301A 46%, #3B1420 100%)'
    },
    {
      id: 'metro',
      title: 'Forza Horizon 5',
      desc: 'Explore o M\u00e9xico vibrante em centenas de carros dos sonhos \u2014 festivais, desafios e liberdade total em mundo aberto.',
      tag: { icon: 'ic-flame', label: 'Temporada 7' },
      dots: ['ic-gauge', 'ic-users'],
      players: ['av9', 'av1', 'av6'],
      reviews: '+38.000 avalia\u00e7\u00f5es',
      art: { filter: 'hue-rotate(150deg) saturate(1.15)', flip: true },
      alt: 'Piloto do Forza Horizon 5 pronto para a largada',
      grad: 'radial-gradient(115% 105% at 86% 12%, #12495C 0%, #173849 46%, #3B1420 100%)'
    }
  ];

  /* ------------------------------- Amigos ------------------------------- */
  var friends = [
    { avatar: 'av5',  name: 'Caio', status: 'online',  game: 'Elden Ring' },
    { avatar: 'av4',  name: 'Bia',  status: 'online',  game: "Baldur's Gate 3" },
    { avatar: 'av6',  name: 'Nina', status: 'online',  game: '' },
    { avatar: 'av7',  name: 'Ivo',  status: 'offline', game: 'h\u00e1 2 h' },
    { avatar: 'av8',  name: 'Luna', status: 'online',  game: 'GTA V' },
    { avatar: 'av9',  name: 'Theo', status: 'online',  game: 'Forza Horizon 5' },
    { avatar: 'av1',  name: 'Duda', status: 'offline', game: 'h\u00e1 40 min' },
    { avatar: 'av3',  name: 'Rafa', status: 'online',  game: 'Red Dead Redemption 2' },
    { avatar: 'av2',  name: 'Z\u00e9',   status: 'online',  game: '' },
    { avatar: 'av10', name: 'Maya', status: 'offline', game: 'ontem' }
  ];

  window.NEXUS_DATA = {

    slides: slides,

    /* lista lateral do In\u00edcio (Novos Jogos) */
    list: pick(['cordas', 'metro', 'fronteira']),

    /* carrossel do In\u00edcio (os 4 primeiros + 2 extras revelados em \u201cVer mais\u201d) */
    games: pick(['ruinas', 'silencio', 'aether', 'quartica'])
      .concat(pick(['aurora', 'trovao']).map(function (g) { g.extra = true; return g; })),

    /* cat\u00e1logo unificado (loja, biblioteca, jogos\u2026) */
    catalog: catalog,

    /* ------------------------------- Loja ------------------------------- */
    storeFeaturedId: 'ruinas',
    flash: [
      { id: 'silencio', seconds: 5400 },
      { id: 'quartica', seconds: 3900 },
      { id: 'trovao', seconds: 7200 }
    ],

    /* ------------------------------- Estat\u00edsticas ------------------------------- */
    stats: {
      total: 12340,
      items: [
        { value: 2340, label: 'Em 2025', angle: 34 },
        { value: 5420, label: 'Em 2024', angle: 142 },
        { value: 4580, label: 'Em 2023', angle: 293 }
      ]
    },
    weekly: {
      labels: ['seg', 'ter', 'qua', 'qui', 'sex', 's\u00e1b', 'dom'],
      hours: [1.2, 2.4, 0.8, 3.1, 2.2, 4.6, 3.9]
    },
    trend: {
      labels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'],
      hours: [14, 18, 11, 22, 19, 27, 24, 31]
    },
    genres: [
      { name: 'A\u00e7\u00e3o', pct: 34, color: '#E8404A' },
      { name: 'Aventura', pct: 22, color: '#F5A63A' },
      { name: 'Corrida', pct: 18, color: '#A78BFA' },
      { name: 'RPG', pct: 16, color: '#35D0C5' },
      { name: 'Esporte', pct: 10, color: '#C9E8C2' }
    ],
    topGames: [
      { id: 'eclipse', hours: 412 },
      { id: 'fronteira', hours: 318 },
      { id: 'metro', hours: 265 },
      { id: 'aether', hours: 201 },
      { id: 'ruinas', hours: 154 }
    ],
    compare: [
      { name: 'Voc\u00ea', hours: 242, me: true },
      { name: 'Caio', hours: 198 },
      { name: 'Bia', hours: 176 },
      { name: 'Nina', hours: 132 },
      { name: 'Ivo', hours: 97 }
    ],
    achievements: [
      { game: 'aether', name: 'Primeira runa gravada', icon: 'ic-trophy', pct: 100 },
      { game: 'fronteira', name: 'Dom\u00ednio da zona cinzenta', icon: 'ic-flame', pct: 88 },
      { game: 'eclipse', name: 'Cem vit\u00f3rias no esquadr\u00e3o', icon: 'ic-trophy', pct: 74 },
      { game: 'metro', name: 'Sem um \u00fanico arranh\u00e3o', icon: 'ic-gauge', pct: 40 },
      { game: 'silencio', name: 'Fim do sil\u00eancio', icon: 'ic-bell', pct: 12 }
    ],

    /* ------------------------------- Amigos ------------------------------- */
    friends: friends,
    invites: [
      { name: 'Vitor', avatar: 'av11', mutual: 3 },
      { name: 'Sofia', avatar: 'av12', mutual: 1 }
    ],
    activity: [
      { who: 'Caio',  avatar: 'av5',  what: 'comprou EA Sports FC 25', when: 'h\u00e1 12 min', icon: 'ic-bag' },
      { who: 'Bia',   avatar: 'av4',  what: 'platina Baldur\'s Gate 3', when: 'h\u00e1 1 h', icon: 'ic-trophy' },
      { who: 'Nina',  avatar: 'av6',  what: 'come\u00e7ou a jogar Forza Horizon 5', when: 'h\u00e1 2 h', icon: 'ic-gamepad' },
      { who: 'Rafa',  avatar: 'av3',  what: 'conquistou \u201cDom\u00ednio do mapa\u201d', when: 'h\u00e1 5 h', icon: 'ic-flame' },
      { who: 'Luna',  avatar: 'av8',  what: 'entrou no cl\u00e3 Nexus', when: 'ontem', icon: 'ic-users' }
    ],

    /* ------------------------------- Downloads ------------------------------- */
    queue: [
      { name: 'Elden Ring',              tag: 'RPG',         thumb: 'assets/cover-eclipse.svg',    totalMB: 60000, start: 34, eta: 83 },
      { name: 'Cyberpunk 2077',          tag: 'RPG',         thumb: 'assets/cover-norte.svg',      totalMB: 70000, start: 0,  eta: 34 },
      { name: 'Red Dead Redemption 2',   tag: 'A\u00e7\u00e3o',        thumb: 'assets/cover-fronteira.svg',  totalMB: 120000, start: 0, eta: 52 },
      { name: 'Forza Horizon 5',         tag: 'Corrida',     thumb: 'assets/cover-metro.svg',      totalMB: 115000, start: 0,  eta: 12 }
    ],
    /* Armazenamento: 360 GB Jogos | 55 GB Sistema | 46 GB Outros | 539 GB Livre */
    storage: {
      total: 1000,
      used: 461,
      categories: [
        { label: 'Jogos', value: 360, color: '#E8404A' },
        { label: 'Sistema', value: 55, color: '#F5A63A' },
        { label: 'Outros', value: 46, color: '#A78BFA' },
        { label: 'Livre', value: 539, color: '#35D0C5' }
      ]
    },

    /* ------------------------------- Chat ------------------------------- */
    conversations: [
      {
        friend: 0, unread: 2,
        messages: [
          { from: 'them', text: 'bora? t\u00f4 no lobby', time: '19:40' },
          { from: 'them', text: 'chamei a Bia tb', time: '19:41' },
          { from: 'me',   text: 'feito \ud83d\udd25 entro em 5 min', time: '19:42' }
        ]
      },
      {
        friend: 1, unread: 0,
        messages: [
          { from: 'them', text: 'zerei o \u00c4ther no n\u00edvel hard', time: 'ontem' },
          { from: 'me',   text: 'como vc passou do chef\u00e3o do deserto??', time: 'ontem' },
          { from: 'them', text: 'runa de gelo + paci\u00eancia kkk', time: 'ontem' }
        ]
      },
      {
        friend: 2, unread: 1,
        messages: [
          { from: 'me',   text: 'vc j\u00e1 viu o modo foto do Ru\u00ednas?', time: '16:12' },
          { from: 'them', text: 'vi!! as fotos da sua galeria ficaram incr\u00edveis', time: '16:30' }
        ]
      },
      {
        friend: 3, unread: 0,
        messages: [
          { from: 'them', text: 'sexta tem campeonato de Qu\u00e2ntica, vai?', time: '11:05' },
          { from: 'me',   text: 'vou sim, j\u00e1 treinei o circuito novo', time: '11:20' }
        ]
      }
    ],
    replies: {
      Caio: ['j\u00e1 t\u00f4 dentro \ud83c\udfae', 'boa! t\u00f4 no lobby, chama', 'vamos de ranqueada ent\u00e3o', 'acabei de upar de n\u00edvel kkk'],
      Bia: ['boa! t\u00f4 terminando uma run', 'me chama depois do boss \ud83d\ude05', 'essa build t\u00e1 absurda', 'bora no fim de semana?'],
      Nina: ['boa! t\u00f4 s\u00f3 observando a galeria', 'me manda o convite que eu entro', 't\u00f4 um tempo fora, mas entro hoje', 'vamos sim!'],
      Ivo: ['boa! t\u00f4 fora do pc agora', 'te chamo quando voltar', 'sexta fechou ent\u00e3o', 'boa! t\u00f4 treinando o circuito novo'],
      'default': ['boa! \ud83d\udc4d', 'te chamo em uns minutos', 'bora sim', 'haha boa', 'feito!']
    }
  };
})();
