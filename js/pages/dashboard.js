/* dashboard.html page script */
(function () {
document.getElementById('hdr').outerHTML = UI.header('dashboard');
    document.getElementById('ftr').outerHTML = UI.footer('dashboard');
    document.getElementById('promo').innerHTML = UI.promo('shop', 'dashboard-banner');
    const S = Schema, esc = UI.esc;
    let filter = 'all', query = '';

    function statCard(icon, label, value, tone, unit = '') {
      return `<div class="card flex items-center gap-3 p-3 sm:gap-3.5 sm:p-4">
        <span class="grid size-10 shrink-0 place-items-center rounded-xl sm:size-11 sm:rounded-2xl ${tone}"><i data-lucide="${icon}" class="size-5"></i></span>
        <div class="min-w-0"><div class="text-xl font-bold leading-none sm:text-2xl">${S.toBn(value)}${unit ? ` <span class="text-sm font-semibold text-muted">${unit}</span>` : ''}</div><div class="mt-1 truncate text-[13px] text-muted sm:text-sm">${label}</div></div></div>`;
    }

    function render() {
      const all = Store.list();
      const withP = all.map((a) => ({ a, p: S.progress(a.data || {}) }));
      const done = withP.filter((x) => x.p.pct === 100).length;
      document.getElementById('stats').innerHTML =
        statCard('files', 'মোট আবেদন', all.length, 'bg-brand-50 text-brand-600') +
        statCard('pencil-line', 'খসড়া', all.length - done, 'bg-sun-400/15 text-sun-500') +
        statCard('circle-check-big', 'সম্পূর্ণ', done, 'bg-brand-100 text-brand-700') +
        statCard('hard-drive', 'স্টোরেজ ব্যবহৃত', Math.round(((localStorage.getItem(Store.KEY) || '').length * 2) / 1024), 'bg-black/5 text-muted', 'KB');

      document.querySelectorAll('#filters button').forEach((b) => b.className = 'flex-1 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition sm:flex-none ' + (b.dataset.f === filter ? 'bg-brand-800 text-white' : 'text-muted hover:text-ink'));

      const q = S.toEn(query.trim().toLowerCase());
      const items = withP.filter(({ a, p }) => {
        if (filter === 'draft' && p.pct === 100) return false;
        if (filter === 'done' && p.pct !== 100) return false;
        if (!q) return true;
        const d = a.data || {};
        return [d.name_bn, d.name_en, d.nid, d.phone, d.p3_name].some((x) => S.toEn(String(x || '').toLowerCase()).includes(q));
      });

      const list = document.getElementById('list');
      if (!all.length) {
        list.className = 'mt-5';
        list.innerHTML = `<div class="card flex flex-col items-center px-6 py-16 text-center">
          <span class="grid size-16 place-items-center rounded-3xl bg-brand-50 text-brand-500"><i data-lucide="file-plus-2" class="size-8"></i></span>
          <h2 class="mt-5 text-xl font-bold">এখনো কোনো আবেদন নেই</h2>
          <p class="mt-2 max-w-sm text-muted">নতুন আবেদন শুরু করুন। প্রতিটি তথ্য স্বয়ংক্রিয়ভাবে এখানে সংরক্ষিত হবে।</p>
          <a href="form.html" class="btn btn-primary mt-6 h-11 px-5"><i data-lucide="plus"></i>নতুন আবেদন শুরু করুন</a></div>`;
        return UI.icons();
      }
      list.className = 'mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3';
      if (!items.length) {
        list.innerHTML = `<div class="col-span-full py-12 text-center text-muted">কোনো আবেদন মেলেনি।</div>`;
        return UI.icons();
      }
      list.innerHTML = items.map(({ a, p }) => {
        const d = a.data || {};
        const complete = p.pct === 100;
        const initials = (d.name_bn || d.name_en || '?').trim().charAt(0);
        const mode = d.biz_mode === 'new' ? 'নতুন উদ্যোগ' : d.biz_mode === 'existing' ? 'চলমান ব্যবসা' : '';
        return `<article class="card group flex flex-col p-4 transition hover:shadow-lg sm:p-5">
          <div class="flex items-start gap-3.5">
            ${d.photo ? `<img src="${esc(d.photo)}" class="size-12 shrink-0 rounded-2xl object-cover" alt="">` : `<span class="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-800 text-lg font-bold text-white">${esc(initials)}</span>`}
            <div class="min-w-0 flex-1">
              <h3 class="truncate text-[17px] font-bold">${esc(d.name_bn || 'নামহীন আবেদন')}</h3>
              <p class="truncate text-sm text-muted">${esc(d.name_en || '—')}</p>
            </div>
            <span class="chip ${complete ? 'bg-brand-100 text-brand-700' : 'bg-sun-400/15 text-sun-500'}"><i data-lucide="${complete ? 'circle-check' : 'pencil-line'}" class="size-3.5"></i>${complete ? 'সম্পূর্ণ' : 'খসড়া'}</span>
          </div>
          <dl class="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
            <div class="min-w-0"><dt class="text-xs text-muted">জাতীয় পরিচয়পত্র</dt><dd class="truncate font-medium">${esc(S.toBn(d.nid || '—'))}</dd></div>
            <div class="min-w-0"><dt class="text-xs text-muted">ফোন</dt><dd class="truncate font-medium">${esc(S.toBn(d.phone || '—'))}</dd></div>
            <div class="min-w-0"><dt class="text-xs text-muted">ধরন</dt><dd class="truncate font-medium">${mode || '—'}</dd></div>
            <div class="min-w-0"><dt class="text-xs text-muted">আবেদনকৃত অর্থ</dt><dd class="truncate font-medium">${d.f_req ? '৳ ' + esc(S.money(S.parseNum(d.f_req)) || d.f_req) : '—'}</dd></div>
          </dl>
          <div class="mt-4">
            <div class="flex justify-between text-xs"><span class="text-muted">প্রয়োজনীয় ঘর পূরণ</span><span class="font-semibold">${S.toBn(p.done)}/${S.toBn(p.total)} · ${S.toBn(p.pct)}%</span></div>
            <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-brand-50"><div class="h-full rounded-full ${complete ? 'bg-brand-500' : 'bg-sun-400'}" style="width:${p.pct}%"></div></div>
          </div>
          <p class="mt-3 flex items-center gap-1.5 text-xs text-muted"><i data-lucide="clock" class="size-3.5"></i>সর্বশেষ পরিবর্তন ${UI.relTime(a.updatedAt)}</p>
          <div class="mt-4 flex items-center gap-1.5 border-t border-line pt-4">
            <a href="form.html?id=${a.id}" class="btn btn-soft flex-1"><i data-lucide="pencil"></i>এডিট</a>
            <a href="preview.html?id=${a.id}" class="btn btn-outline flex-1"><i data-lucide="eye"></i>প্রিভিউ</a>
            <button data-dup="${a.id}" class="btn btn-ghost btn-icon" title="ডুপ্লিকেট"><i data-lucide="copy"></i></button>
            <button data-del="${a.id}" class="btn btn-ghost btn-icon hover:text-berry-500" title="মুছুন"><i data-lucide="trash-2"></i></button>
          </div>
        </article>`;
      }).join('');
      UI.icons();
    }

    document.getElementById('list').addEventListener('click', async (e) => {
      const dup = e.target.closest('[data-dup]'), del = e.target.closest('[data-del]');
      if (dup) {
        const copy = Store.duplicate(dup.dataset.dup);
        if (copy) { UI.toast('আবেদনের একটি কপি তৈরি হয়েছে'); render(); }
      }
      if (del) {
        const a = Store.get(del.dataset.del);
        const ok = await UI.dialog({ title: 'আবেদনটি মুছে ফেলবেন?', icon: 'trash-2', tone: 'danger', ok: 'হ্যাঁ, মুছুন',
          body: `<b class="text-ink">${esc(a?.data?.name_bn || 'নামহীন আবেদন')}</b> স্থায়ীভাবে মুছে যাবে। এটি আর ফেরত আনা যাবে না।` });
        if (ok) { Store.remove(del.dataset.del); UI.toast('আবেদন মুছে ফেলা হয়েছে'); render(); }
      }
    });
    document.getElementById('q').addEventListener('input', (e) => { query = e.target.value; render(); });
    document.getElementById('filters').addEventListener('click', (e) => { const b = e.target.closest('[data-f]'); if (b) { filter = b.dataset.f; render(); } });
    document.getElementById('btn-export').addEventListener('click', () => {
      if (!Store.list().length) return UI.toast('ব্যাকআপ নেওয়ার মতো কোনো আবেদন নেই', 'warn');
      UI.download(`udyog-backup-${new Date().toISOString().slice(0, 10)}.json`, Store.exportJSON());
    });
    document.getElementById('btn-import').addEventListener('click', () => document.getElementById('file-import').click());
    document.getElementById('file-import').addEventListener('change', async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try { const n = Store.importJSON(await f.text()); UI.toast(`${S.toBn(n)}টি আবেদন ইমপোর্ট হয়েছে`); render(); }
      catch (err) { UI.toast('ফাইলটি সঠিক ব্যাকআপ নয়', 'err'); }
      e.target.value = '';
    });
    window.addEventListener('storage', (e) => { if (e.key === Store.KEY) render(); });
    render();
})();

