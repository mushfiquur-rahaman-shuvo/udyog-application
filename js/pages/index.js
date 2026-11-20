/* index.html page script */
(function () {
document.getElementById('hdr').outerHTML = UI.header('home');
    document.getElementById('ftr').outerHTML = UI.footer('home');
    document.getElementById('partners').innerHTML = UI.promo('shop', 'home-banner') + UI.promo('sponsor', 'home-sponsor');
    document.getElementById('hero-sponsor').innerHTML = UI.promo('badge', 'home-hero');
    const S = Schema;

    // deadline countdown
    const days = Math.ceil((S.DEADLINE.getTime() + 864e5 - Date.now()) / 864e5);
    if (days > 0) document.getElementById('deadline-chip').textContent = `আবেদনের শেষ তারিখ ৩০ নভেম্বর ২০২৬ · আর ${S.toBn(days)} দিন বাকি`;

    const features = [
      ['scan-eye', 'হুবহু অফিসিয়াল ফরম', 'মূল PDF থেকে নেওয়া ৭ পৃষ্ঠার ফরম, প্রতিটি লাইন ও লেখা অপরিবর্তিত।'],
      ['save', 'প্রতি অক্ষরে অটোসেভ', 'টাইপ করার সাথে সাথে সংরক্ষণ, ব্রাউজার বন্ধ করলেও খসড়া থাকবে।'],
      ['copy', 'একাধিক আবেদন', 'ড্যাশবোর্ড থেকে প্রিভিউ, এডিট বা ডুপ্লিকেট করুন সহজেই।'],
      ['printer', 'প্রিন্ট ও PDF', 'এক ক্লিকে প্রিন্ট বা PDF হিসেবে সেভ, বাংলা যুক্তাক্ষর নির্ভুল।'],
    ];
    document.getElementById('features').innerHTML = features.map(([ic, t, d]) => `
      <div class="card p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
        <span class="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-600"><i data-lucide="${ic}" class="size-5.5"></i></span>
        <h3 class="mt-4 font-bold">${t}</h3><p class="mt-1.5 text-[15px] leading-relaxed text-muted">${d}</p>
      </div>`).join('');

    document.getElementById('steps').innerHTML = S.STEPS.map((s, i) => `
      <li class="bg-white p-6">
        <div class="flex items-center gap-3">
          <span class="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><i data-lucide="${s.icon}" class="size-5"></i></span>
          <span class="text-xs font-semibold text-muted">ধাপ ${S.toBn(i + 1)} · ${s.part}</span>
        </div>
        <h3 class="mt-3 font-bold">${s.title}</h3><p class="mt-1 text-sm leading-relaxed text-muted">${s.desc}</p>
      </li>`).join('');

    // resume last draft
    const last = Store.list()[0];
    if (last) {
      const p = S.progress(last.data);
      document.getElementById('resume').innerHTML = `
        <a href="form.html?id=${last.id}" class="group inline-flex max-w-full items-center gap-3 rounded-2xl border border-line bg-white/80 py-2.5 pr-4 pl-2.5 shadow-sm backdrop-blur transition hover:border-brand-300">
          <span class="grid size-9 place-items-center rounded-xl bg-sun-400/20 text-sun-500"><i data-lucide="history" class="size-4.5"></i></span>
          <span class="min-w-0 text-sm leading-tight"><span class="block truncate font-semibold">${UI.esc(last.data.name_bn || 'নামহীন আবেদন')} — চালিয়ে যান</span><span class="text-muted">${S.toBn(p.pct)}% সম্পন্ন · ${UI.relTime(last.updatedAt)}</span></span>
          <i data-lucide="arrow-right" class="size-4 text-muted transition group-hover:translate-x-0.5"></i>
        </a>`;
    }
    UI.icons();

    // live miniature of the real first page
    window.addEventListener('load', () => {
      const host = document.getElementById('hero-page');
      if (!window.FORM_PAGES) return;
      host.innerHTML = `<div style="position:absolute;left:0;top:0;width:595.32pt;transform-origin:0 0" id="hero-inner"><link rel="stylesheet" href="assets/form/form-fonts.css?v=202611191657"><link rel="stylesheet" href="css/form-print.css?v=202611191657"><section class="form-page">${FORM_PAGES[0]}<img class="form-logo" src="assets/logo.png" style="left:36pt;top:27.7pt;width:59.2pt;height:64.8pt"></section></div>`;
      const fit = () => { const inner = document.getElementById('hero-inner'); inner.style.transform = `scale(${host.clientWidth / inner.offsetWidth})`; };
      fit(); window.addEventListener('resize', fit);
    });
})();

