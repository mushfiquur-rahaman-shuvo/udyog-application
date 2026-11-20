/* preview.html page script */
(function () {
document.getElementById('hdr').outerHTML = UI.header('');
    document.getElementById('ftr').outerHTML = UI.footer('preview');
    document.getElementById('promo').innerHTML = UI.promo('side', 'preview');
    const S = Schema;
    const app = Store.get(UI.qs('id'));
    const sheet = document.getElementById('sheet'), root = document.getElementById('print-root');
    let zoom = null; // null = fit to width

    function applyZoom() {
      const pageW = 595.32 * 96 / 72; // pt → css px
      const main = document.querySelector('main');
      const pad = parseFloat(getComputedStyle(main).paddingLeft) * 2;
      const avail = Math.min(main.clientWidth - pad, 1400);
      const z = zoom ?? Math.min(1.25, avail / pageW);
      root.style.zoom = z;
      document.getElementById('zoom-fit').textContent = S.toBn(Math.round(z * 100)) + '%';
    }
    document.getElementById('zoom-in').onclick = () => { zoom = Math.min(2, (zoom ?? parseFloat(root.style.zoom)) + 0.1); applyZoom(); };
    document.getElementById('zoom-out').onclick = () => { zoom = Math.max(0.3, (zoom ?? parseFloat(root.style.zoom)) - 0.1); applyZoom(); };
    document.getElementById('zoom-fit').onclick = () => { zoom = null; applyZoom(); };
    window.addEventListener('resize', applyZoom);

    if (!app) {
      document.querySelector('main').innerHTML = `<div class="card mx-auto max-w-md p-8 text-center"><h1 class="text-xl font-bold">আবেদনটি পাওয়া যায়নি</h1>
        <p class="mt-2 text-muted">এটি হয়তো মুছে ফেলা হয়েছে অথবা অন্য ব্রাউজারে সংরক্ষিত।</p><a href="dashboard.html" class="btn btn-primary mt-5">ড্যাশবোর্ডে যান</a></div>`;
      document.getElementById('pv-bar').remove();
      document.getElementById('zoom-pill').remove();
      UI.icons();
    } else {
      const d = app.data || {};
      const p = S.progress(d);
      document.getElementById('btn-edit').href = `form.html?id=${app.id}`;
      document.getElementById('pv-name').textContent = d.name_bn || 'নামহীন আবেদন';
      document.getElementById('pv-meta').textContent = `৭ পৃষ্ঠা · ${S.toBn(p.pct)}% সম্পন্ন · সর্বশেষ পরিবর্তন ${UI.relTime(app.updatedAt)}`;
      let tipHidden = false;
      try { tipHidden = localStorage.getItem('udyog.tipHidden') === '1'; } catch (e) {}
      if (!tipHidden) document.getElementById('tip').innerHTML = `
        <div class="flex items-start gap-3 rounded-2xl border border-brand-100 bg-white p-3.5 text-sm leading-relaxed shadow-sm sm:p-4">
          <i data-lucide="lightbulb" class="mt-0.5 size-5 shrink-0 text-sun-500"></i>
          <p class="flex-1"><b>PDF হিসেবে সেভ করতে:</b> প্রিন্ট উইন্ডোতে Destination/প্রিন্টার থেকে <b>“Save as PDF”</b> বেছে নিন, Paper size <b>A4</b> ও Margins <b>None</b> রাখুন। সরাসরি প্রিন্টারেও প্রিন্ট করতে পারবেন।</p>
          <button type="button" id="tip-x" class="btn btn-ghost btn-icon -mt-1.5 -mr-1.5 size-8" aria-label="বন্ধ করুন"><i data-lucide="x"></i></button>
        </div>`;
      document.getElementById('tip-x')?.addEventListener('click', () => {
        document.getElementById('tip').innerHTML = '';
        try { localStorage.setItem('udyog.tipHidden', '1'); } catch (e) {}
      });
      UI.icons();
      FormPrint.render(sheet, d).then(applyZoom);
      applyZoom();

      document.getElementById('btn-print').addEventListener('click', async () => {
        const r = await UI.missingWarning(app);
        if (r !== 'print') return;
        const prev = document.title;
        const nm = (d.name_en || d.name_bn || 'application').trim().replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '-');
        document.title = `UDYOG-Application-${nm}`;
        await document.fonts.ready;
        FormPrint.fit(sheet);
        window.print();
        setTimeout(() => (document.title = prev), 500);
      });
    }
})();

