/* Service worker da Prateleira de HQs.
   Guarda só a "casca" do app (HTML, ícones, bibliotecas). Drive, login do Google
   e arquivos de HQ NUNCA passam pelo cache. Para forçar atualização, mude VERSAO. */
const VERSAO = 'hq-v2';
const CDNS = ['cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];
const CASCA = ['./', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(CASCA)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  const guarda = res => { if (res && (res.ok || res.type === 'opaque')) { const c = res.clone(); caches.open(VERSAO).then(x => x.put(r, c)); } return res; };
  // páginas do próprio site: rede primeiro (pega atualizações do GitHub), cache se estiver sem internet
  if (u.origin === location.origin) {
    e.respondWith(fetch(r).then(guarda).catch(() => caches.match(r, {ignoreSearch: true}).then(m => m || caches.match('./'))));
    return;
  }
  // bibliotecas e fontes: cache primeiro, atualiza em segundo plano
  if (CDNS.includes(u.hostname)) {
    e.respondWith(caches.match(r).then(m => {
      const net = fetch(r).then(guarda).catch(() => m);
      return m || net;
    }));
  }
  // qualquer outro host (Drive, Google login) segue direto para a rede
});
