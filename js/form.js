/* Multi-step application form. Every keystroke is written to localStorage. */
(function () {
  const S = window.Schema, esc = UI.esc;
  const STEPS = S.STEPS;

  // ---------- state ----------
  let app = Store.get(UI.qs('id'));
  if (UI.qs('id') && !app) UI.toast('আবেদনটি পাওয়া যায়নি, নতুন আবেদন খোলা হলো', 'warn');
  let data = app ? app.data : {};
  let step = Math.min(Math.max(parseInt(UI.qs('step') ?? (app ? app.step : 0), 10) || 0, 0), STEPS.length - 1);
  let savedAt = app ? app.updatedAt : null;

  // ---------- header ----------
  document.getElementById('hdr').outerHTML = UI.header('', `
    <span data-save-state class="mx-1 hidden items-center gap-1.5 text-xs font-medium text-muted lg:inline-flex"></span>
    <button data-clear class="btn btn-ghost hover:text-berry-500 max-lg:hidden" title="সব তথ্য মুছুন"><i data-lucide="eraser"></i>Clear All</button>
    <button id="btn-preview" class="btn btn-primary max-sm:px-3.5"><i data-lucide="eye"></i>প্রিভিউ</button>`, { menu: true });

  // Progress card + step list: shown in the desktop sidebar and in the mobile drawer.
  const sideHTML = (where) => `
    <div class="card p-4 sm:p-5">
      <div class="flex items-center gap-4">
        <div class="relative size-16 shrink-0">
          <svg viewBox="0 0 36 36" class="size-16 -rotate-90"><circle cx="18" cy="18" r="15.5" fill="none" class="stroke-brand-50" stroke-width="4"/><circle data-ring cx="18" cy="18" r="15.5" fill="none" class="stroke-brand-500 transition-all duration-500" stroke-width="4" stroke-linecap="round" stroke-dasharray="97.4" stroke-dashoffset="97.4"/></svg>
          <span data-ring-pct class="absolute inset-0 grid place-items-center text-sm font-bold"></span>
        </div>
        <div class="min-w-0">
          <div data-side-name class="truncate font-bold"></div>
          <div data-side-meta class="text-sm text-muted"></div>
        </div>
      </div>
    </div>
    <nav data-steps class="card p-2" aria-label="ধাপসমূহ"></nav>
    ${UI.promo('side', 'form-' + where)}
    ${where === 'drawer' ? `<button type="button" data-clear class="btn btn-danger h-11 w-full"><i data-lucide="eraser"></i>Clear All · সব তথ্য মুছুন</button>` : ''}
    <div class="rounded-card border border-brand-100 bg-brand-50/70 p-4 text-sm leading-relaxed text-brand-800">
      <div class="flex items-center gap-2 font-semibold"><i data-lucide="shield-check" class="size-4"></i>তথ্য নিরাপদ</div>
      <p class="mt-1 text-brand-700/90">সব তথ্য শুধু আপনার ব্রাউজারে থাকে, কোনো সার্ভারে পাঠানো হয় না।</p>
    </div>`;
  document.querySelector('[data-side]').innerHTML = sideHTML('side');
  const menu = UI.drawer(sideHTML('drawer'));
  document.getElementById('m-bar').addEventListener('click', menu.open);

  function persist() {
    if (!app) {
      app = Store.create(data);
      if (!app) return;
      data = app.data;
      history.replaceState(null, '', `form.html?id=${app.id}&step=${step}`);
    } else {
      app.data = data;
      app.step = step;
      if (!Store.save(app)) return;
    }
    savedAt = Date.now();
    renderSaveState(true);
    renderProgress();
  }

  function renderSaveState(flash) {
    const html = !savedAt
      ? '<i data-lucide="cloud" class="size-3.5"></i>এখনো কিছু লেখা হয়নি'
      : `<i data-lucide="${flash ? 'cloud-upload' : 'circle-check'}" class="size-3.5 ${flash ? 'text-sun-500' : 'text-brand-500'}"></i>${flash ? 'সংরক্ষণ হচ্ছে…' : 'সংরক্ষিত · ' + UI.relTime(savedAt)}`;
    document.querySelectorAll('[data-save-state]').forEach((el) => (el.innerHTML = html));
    UI.icons();
    if (flash) { clearTimeout(renderSaveState.t); renderSaveState.t = setTimeout(() => renderSaveState(false), 600); }
  }
  setInterval(() => renderSaveState(false), 30000);

  // ---------- field templates ----------
  const lbl = (f, forId) => `
    <label ${forId ? `for="${forId}"` : ''} class="mb-1.5 flex items-start gap-2 text-[14.5px] font-semibold leading-snug text-ink">
      ${f.num ? `<span class="mt-px shrink-0 rounded-md bg-brand-50 px-1.5 py-px text-xs font-bold text-brand-700">${f.num}</span>` : ''}
      <span>${esc(f.ui || f.label.replace(/^.*? — /, ''))}${f.req ? '<span class="ml-0.5 text-berry-500">*</span>' : ''}</span>
    </label>`;
  const help = (f) => (f.help ? `<p class="mt-1.5 text-[13px] leading-snug text-muted">${esc(f.help)}</p>` : '');
  const err = (f) => `<p class="field-err mt-1.5 hidden items-center gap-1 text-[13px] font-medium text-berry-500" data-err="${f.id}"></p>`;
  const val = (k) => esc(data[k] ?? '');

  function input(f, k = f.id, extra = '') {
    const type = f.type === 'date' ? 'date' : f.type === 'email' ? 'email' : 'text';
    const im = f.digits || f.type === 'tel' || f.type === 'money' ? 'inputmode="numeric"' : '';
    const ac = { name_en: 'name', phone: 'tel', email: 'email' }[k] ? `autocomplete="${{ name_en: 'name', phone: 'tel', email: 'email' }[k]}"` : 'autocomplete="off"';
    const list = f.list ? `list="dl-${k}"` : '';
    return `<input id="f-${k}" data-k="${k}" type="${type}" maxlength="${f.digits || f.type === 'tel' ? 25 : f.type === 'email' ? 100 : 200}" ${im} ${ac} ${list} value="${val(k)}" placeholder="${esc(f.ph || '')}" class="field-input ${f.upper ? 'uppercase' : ''}" ${extra}>
      ${f.list ? `<datalist id="dl-${k}">${f.list.map((o) => `<option value="${esc(o)}">`).join('')}</datalist>` : ''}`;
  }

  function moneyInput(k, ph = '০') {
    ph = ph || '০';
    return `<div class="relative"><span class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted">৳</span>
      <input id="f-${k}" data-k="${k}" data-money maxlength="20" inputmode="numeric" autocomplete="off" value="${val(k)}" placeholder="${ph}" class="field-input pl-8"></div>
      <p class="mt-1 min-h-5 text-xs text-muted" data-money-hint="${k}">${hintMoney(data[k])}</p>`;
  }
  const hintMoney = (raw) => { const n = S.parseNum(raw); return n != null && n >= 1000 ? `৳ ${S.money(n)}` : ''; };

  function field(f) {
    const wrap = (inner) => `<div class="${f.full ? 'md:col-span-2' : ''}" data-fid="${f.id}">${inner}</div>`;
    switch (f.type) {
      case 'textarea': {
        const counter = f.words ? `<span class="text-xs font-medium" data-words="${f.id}"></span>` : '';
        return wrap(`${lbl(f, 'f-' + f.id)}<textarea id="f-${f.id}" data-k="${f.id}" maxlength="3000" rows="${f.rows || 3}" placeholder="${esc(f.ph || '')}" class="field-input resize-y leading-relaxed">${val(f.id)}</textarea>
          <div class="flex items-start justify-between gap-3">${help(f) || '<span></span>'}${counter ? `<span class="mt-1.5">${counter}</span>` : ''}</div>${err(f)}`);
      }
      case 'select':
        return wrap(`${lbl(f, 'f-' + f.id)}<div class="relative"><select id="f-${f.id}" data-k="${f.id}" class="field-input appearance-none pr-10">
          <option value="">— নির্বাচন করুন —</option>${f.opts.map((o) => `<option ${data[f.id] === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>
          <i data-lucide="chevron-down" class="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted"></i></div>${help(f)}${err(f)}`);
      case 'radio':
        return wrap(`${lbl(f)}<div class="flex flex-wrap gap-2" role="radiogroup">${f.opts.map((o) => `
          <label class="cursor-pointer"><input type="radio" class="peer sr-only" name="${f.id}" data-k="${f.id}" value="${esc(o)}" ${data[f.id] === o ? 'checked' : ''}>
          <span class="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-[15px] font-medium transition peer-checked:border-brand-500 peer-checked:bg-brand-50 peer-checked:text-brand-800 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-500/15 hover:border-brand-300">
          <span class="grid size-4 place-items-center rounded-full border-2 border-current opacity-60"><span class="size-1.5 rounded-full bg-current ${data[f.id] === o ? '' : 'hidden'}" data-dot></span></span>${esc(o)}</span></label>`).join('')}</div>${help(f)}${err(f)}`);
      case 'mode':
        return wrap(`<p class="mb-3 text-[15px] font-semibold">${esc(f.label)}<span class="ml-0.5 text-berry-500">*</span></p>
          <div class="grid gap-3 sm:grid-cols-2">${f.opts.map((o, i) => `
          <label class="cursor-pointer"><input type="radio" class="peer sr-only" name="${f.id}" data-k="${f.id}" value="${o.v}" ${data[f.id] === o.v ? 'checked' : ''}>
          <span class="flex h-full items-start gap-3.5 rounded-2xl border-2 border-line bg-white p-4 transition peer-checked:border-brand-500 peer-checked:bg-brand-50 hover:border-brand-300">
            <span class="grid size-11 shrink-0 place-items-center rounded-xl ${i ? 'bg-sun-400/20 text-sun-500' : 'bg-brand-100 text-brand-700'}"><i data-lucide="${i ? 'store' : 'lightbulb'}" class="size-5.5"></i></span>
            <span><span class="block font-bold">${o.t}</span><span class="mt-0.5 block text-sm text-muted">${o.d}</span></span></span></label>`).join('')}</div>${err(f)}`);
      case 'check':
        return wrap(`<label class="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-brand-50/50 px-4 py-3">
          <input type="checkbox" data-k="${f.id}" ${data[f.id] ? 'checked' : ''} class="size-5 accent-brand-600">
          <span class="font-medium">${esc(f.label)}</span><i data-lucide="copy-check" class="ml-auto size-4.5 text-brand-500"></i></label>`);
      case 'date':
        return wrap(`${lbl(f, 'f-' + f.id)}${input(f)}${f.id === 'dob' ? `<p class="mt-1.5 text-sm font-medium text-brand-700" data-age></p>` : ''}${help(f)}${err(f)}`);
      case 'money':
        return wrap(`${lbl(f, 'f-' + f.id)}${moneyInput(f.id, f.ph)}${err(f)}`);
      case 'triple':
        return wrap(`${lbl(f)}<div class="grid grid-cols-3 gap-2 sm:gap-3">${[['m', 'মাসিক'], ['q', 'ত্রৈমাসিক'], ['y', 'বার্ষিক']].map(([s, t]) => `
          <div class="min-w-0"><div class="mb-1 text-xs font-semibold text-muted">${t}</div>${moneyInput(f.id + '_' + s, { m: '৬০০০০', q: '১৮০০০০', y: '৭২০০০০' }[s])}</div>`).join('')}</div>
          <p class="text-xs text-muted"><i data-lucide="sparkles" class="mr-1 inline size-3.5 text-sun-500"></i>মাসিক লিখলে ত্রৈমাসিক (×৩) ও বার্ষিক (×১২) স্বয়ংক্রিয়ভাবে বসবে, চাইলে বদলাতে পারবেন।</p>`);
      case 'photo':
        return wrap(`${lbl(f)}<div class="flex items-center gap-4">
          <div id="photo-box" class="grid h-28 w-24 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-dashed border-line bg-canvas text-muted">${data.photo ? `<img src="${esc(data.photo)}" class="size-full object-cover">` : '<i data-lucide="image-plus" class="size-7"></i>'}</div>
          <div class="space-y-2"><label class="btn btn-outline cursor-pointer"><i data-lucide="upload"></i>ছবি বাছাই করুন<input type="file" accept="image/*" id="photo-input" class="sr-only"></label>
          <button type="button" id="photo-remove" class="btn btn-ghost ${data.photo ? '' : 'hidden'}"><i data-lucide="x"></i>সরান</button></div></div>${help(f)}`);
      case 'expenses':
        return wrap(expensesTable());
      case 'declare':
        return wrap(declaration());
      default:
        return wrap(`${lbl(f, 'f-' + f.id)}${input(f)}${help(f)}${err(f)}`);
    }
  }

  function expensesTable() {
    const rows = S.EXPENSE_HEADS.map((h, i) => {
      const n = i + 1;
      return `<div class="grid grid-cols-2 gap-2 border-b border-line py-3.5 last:border-0 md:grid-cols-[2.25rem_1fr_1.1fr_9rem_8.5rem] md:items-center md:gap-3 md:py-3">
        <span class="text-sm font-bold text-brand-700 max-md:hidden">${S.toBn(String(n).padStart(2, '0'))}</span>
        <span class="col-span-2 text-[15px] font-semibold md:col-span-1 md:text-[14.5px] md:font-medium"><span class="text-brand-700 md:hidden">${S.toBn(String(n).padStart(2, '0'))}. </span>${esc(h)}</span>
        <input data-k="e${n}_desc" maxlength="120" value="${val('e' + n + '_desc')}" placeholder="${esc(S.EXPENSE_EX[i])}" aria-label="${esc(h)} — বিবরণ" class="field-input col-span-2 py-2 md:col-span-1">
        <div class="relative"><span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted">৳</span><input data-k="e${n}_amt" data-money data-exp maxlength="20" inputmode="numeric" value="${val('e' + n + '_amt')}" placeholder="টাকা, যেমন: ৫০০০০" aria-label="${esc(h)} — মোট টাকা" class="field-input py-2 pl-7"></div>
        <input data-k="e${n}_src" maxlength="40" list="dl-src" value="${val('e' + n + '_src')}" placeholder="উৎস, যেমন: ঋণ" aria-label="${esc(h)} — অর্থের উৎস" class="field-input py-2">
      </div>`;
    }).join('');
    return `<div class="mb-4">${UI.promo('shop-tip', 'form-expenses')}</div>
      <div class="hidden grid-cols-[2.25rem_1fr_1.1fr_9rem_8.5rem] gap-3 border-b border-line pb-2 text-xs font-semibold uppercase tracking-wide text-muted md:grid">
        <span>ক্রম</span><span>ব্যয়ের খাত</span><span>বিবরণ</span><span>মোট (টাকা)</span><span>অর্থের উৎস</span></div>
      ${rows}<datalist id="dl-src">${S.FUND_SRC.map((o) => `<option value="${o}">`).join('')}</datalist>
      <div class="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-800 px-4 py-3 text-white">
        <span class="font-semibold">সর্বমোট</span><span class="text-lg font-bold" data-exp-total></span></div>
      <p class="mt-2 text-sm" data-exp-check></p>`;
  }

  function declaration() {
    const atts = ['জাতীয় পরিচয়পত্র/জন্মনিবন্ধন সনদের কপি', 'সর্বশেষ শিক্ষাগত যোগ্যতার সনদের কপি (যদি থাকে)', 'দক্ষতা উন্নয়ন/উদ্যোক্তা উন্নয়ন প্রশিক্ষণ সনদ (যদি থাকে)', 'ওয়ার্ড কমিশনার/কাউন্সিলর কর্তৃক প্রদত্ত নাগরিক সনদ', 'পাসপোর্ট সাইজ ছবি (২ কপি)'];
    return `<div class="space-y-3 rounded-2xl border border-line bg-canvas/70 p-4 text-[15px] leading-relaxed text-ink/90 sm:p-5">
        <p>আমি এই মর্মে ঘোষণা করছি যে, উপরে প্রদত্ত সমস্ত তথ্য সত্য ও সঠিক। কোনো তথ্য অসত্য প্রমাণিত হলে আমার আবেদন/অনুমোদন যেকোনো পর্যায়ে বাতিলযোগ্য হবে।</p>
        <p>আমি আরও ঘোষণা করছি যে, বাংলাদেশ ব্যাংকের এসএমইএসপিডি সার্কুলার নং-০৫, তারিখ: ১৩ সেপ্টেম্বর ২০২৬-এ উল্লিখিত সকল শর্তাবলি সম্পর্কে আমি অবগত আছি।</p>
        <p>আমি অবগত আছি যে অনুমোদিত হলে, প্রাপ্ত ঋণ ও অনুদান নির্ধারিত খাতে ব্যবহৃত হলে এবং ঋণ অংশ সম্পূর্ণ ও যথাসময়ে পরিশোধ করলেই কেবল অনুদানের প্রাপ্ত অর্থ অনুদান হিসেবে বিবেচিত হবে এবং ঋণের সদ্ব্যবহার না করা হলে অনুদান অংশ ঋণে পরিণত হবে এবং সম্পূর্ণ অর্থ ঋণ হিসেবে গণ্য হয়ে আমি খেলাপি হিসেবে চিহ্নিত হব। আমি অঙ্গীকার করছি যে প্রদানকৃত অর্থ ব্যক্তিগত ভোগ, জমি বা যানবাহন ক্রয়ে ব্যবহার করব না; প্রতিটি ব্যয়ের ভাউচার সংরক্ষণ করব এবং চাহিদামতো প্রতিবেদন দাখিল করব।</p>
      </div>
      <label class="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border-2 border-line bg-white p-4 transition has-checked:border-brand-500 has-checked:bg-brand-50">
        <input type="checkbox" data-k="declare" ${data.declare ? 'checked' : ''} class="mt-0.5 size-5 shrink-0 accent-brand-600">
        <span class="font-semibold">আমি উপরের ঘোষণা পড়েছি এবং এর সাথে একমত<span class="text-berry-500">*</span><span class="mt-0.5 block text-sm font-normal text-muted">প্রিন্ট করা ফরমে ঘোষণার নিচে নিজ হাতে স্বাক্ষর ও তারিখ দিন।</span></span>
      </label>${err({ id: 'declare' })}
      <div class="mt-5">
        <p class="mb-2 font-semibold">সংযুক্তি চেকলিস্ট <span class="text-sm font-normal text-muted">(শুধু আপনার মনে রাখার জন্য, ফরমে প্রিন্ট হবে না)</span></p>
        <div class="grid gap-2 sm:grid-cols-2">${atts.map((a, i) => `<label class="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-white px-3.5 py-2.5 text-[14.5px] has-checked:border-brand-300 has-checked:bg-brand-50/60">
          <input type="checkbox" data-k="att_${i + 1}" ${data['att_' + (i + 1)] ? 'checked' : ''} class="size-4.5 accent-brand-600">${a}</label>`).join('')}</div>
      </div>`;
  }

  // ---------- render ----------
  function renderStep() {
    const s = STEPS[step];
    document.getElementById('step-head').innerHTML = `
      <div class="flex items-center gap-2 text-sm font-semibold text-brand-600"><span class="chip bg-brand-800 text-white">${s.part}</span>ধাপ ${S.toBn(step + 1)} / ${S.toBn(STEPS.length)}</div>
      <h1 class="mt-2 text-[22px] leading-snug font-bold text-brand-900 sm:mt-2.5 sm:text-[28px]">${s.title}</h1>
      <p class="mt-0.5 text-[15px] text-muted sm:mt-1 sm:text-base">${s.desc}</p>`;
    document.getElementById('form').innerHTML = s.groups.map((g, gi) => `
      <section class="card p-4 sm:p-6" data-gi="${gi}">
        <h2 class="mb-4 flex items-start gap-2.5 text-base leading-snug font-bold sm:mb-5 sm:text-[17px]"><span class="mt-0.5 h-5 w-1 shrink-0 rounded-full bg-sun-400"></span>${esc(g.title)}</h2>
        <div class="grid gap-x-5 gap-y-4 sm:gap-y-5 md:grid-cols-2">${g.fields.map(field).join('')}</div>
      </section>`).join('');
    document.getElementById('prev').disabled = step === 0;
    const last = step === STEPS.length - 1;
    const next = document.getElementById('next');
    next.innerHTML = last ? '<i data-lucide="file-check-2"></i><span class="max-sm:hidden">প্রিভিউ ও প্রিন্ট</span>' : '<span class="max-sm:hidden">পরবর্তী ধাপ</span><i data-lucide="arrow-right"></i>';
    next.setAttribute('aria-label', last ? 'প্রিভিউ ও প্রিন্ট' : 'পরবর্তী ধাপ');
    applyVisibility();
    updateDerived();
    renderSteps();
    UI.icons();
  }

  function renderSteps() {
    const items = STEPS.map((s, i) => {
      const p = S.stepProgress(data, i);
      const active = i === step;
      const icon = p.complete ? 'circle-check' : s.icon;
      return { s, i, p, active, icon };
    });
    const html = items.map(({ s, i, p, active, icon }) => `
      <button type="button" data-step="${i}" ${active ? 'aria-current="step"' : ''} class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${active ? 'bg-brand-800 text-white' : 'hover:bg-brand-50'}">
        <span class="grid size-9 shrink-0 place-items-center rounded-lg ${active ? 'bg-white/15' : p.complete ? 'bg-brand-100 text-brand-600' : 'bg-canvas text-muted'}"><i data-lucide="${icon}" class="size-4.5"></i></span>
        <span class="min-w-0 flex-1"><span class="block truncate text-[15px] font-semibold">${S.toBn(i + 1)}. ${s.title}</span>
        <span data-step-meta class="block text-xs ${active ? 'text-white/70' : 'text-muted'}"></span></span>
      </button>`).join('');
    document.querySelectorAll('[data-steps]').forEach((el) => (el.innerHTML = html));
    renderProgress();
    UI.icons();
  }

  function renderProgress() {
    const p = S.progress(data);
    document.querySelectorAll('[data-ring]').forEach((el) => el.setAttribute('stroke-dashoffset', String(97.4 * (1 - p.pct / 100))));
    document.querySelectorAll('[data-ring-pct]').forEach((el) => (el.textContent = S.toBn(p.pct) + '%'));
    document.querySelectorAll('[data-side-name]').forEach((el) => (el.textContent = data.name_bn || 'নতুন আবেদন'));
    document.querySelectorAll('[data-side-meta]').forEach((el) => (el.textContent = `${S.toBn(p.done)}/${S.toBn(p.total)} প্রয়োজনীয় ঘর পূরণ`));
    renderDots();
    // refresh step counts without rebuilding focus-sensitive parts
    STEPS.forEach((s, i) => {
      const sp = S.stepProgress(data, i);
      document.querySelectorAll(`[data-steps] [data-step="${i}"] [data-step-meta]`).forEach((el) => (el.textContent = `${s.part} · ${sp.total ? S.toBn(sp.done) + '/' + S.toBn(sp.total) + ' ঘর' : 'ঐচ্ছিক'}`));
    });
  }

  // Numbered step dots in the bottom bar: click any to jump straight to that step.
  function renderDots() {
    document.getElementById('step-dots').innerHTML = STEPS.map((s, i) => {
      const done = S.stepProgress(data, i).complete;
      const cls = i === step
        ? 'bg-brand-800 text-white ring-4 ring-brand-500/20'
        : done ? 'bg-brand-100 text-brand-700 hover:bg-brand-200' : 'bg-white text-muted ring-1 ring-line hover:text-ink hover:ring-brand-300';
      const line = i ? `<span class="h-0.5 w-2 min-[380px]:w-3 sm:w-6 ${i <= step || done ? 'bg-brand-200' : 'bg-line'}"></span>` : '';
      return `${line}<button type="button" data-step="${i}" title="${S.toBn(i + 1)}. ${s.title}" aria-label="ধাপ ${S.toBn(i + 1)}: ${s.title}" ${i === step ? 'aria-current="step"' : ''}
        class="grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold transition sm:size-9 ${cls}">${done && i !== step ? '<i data-lucide="check" class="size-4"></i>' : S.toBn(i + 1)}</button>`;
    }).join('');
    UI.icons();
  }

  function applyVisibility() {
    const s = STEPS[step];
    s.groups.forEach((g, gi) => {
      const sec = document.querySelector(`[data-gi="${gi}"]`);
      if (sec) sec.classList.toggle('hidden', !!g.show && !g.show(data));
      g.fields.forEach((f) => {
        const el = document.querySelector(`[data-fid="${f.id}"]`);
        if (el) el.classList.toggle('hidden', !!f.show && !f.show(data));
      });
    });
  }

  function updateDerived() {
    const age = document.querySelector('[data-age]');
    if (age) {
      const a = S.ageAt(data.dob);
      age.innerHTML = a ? `<i data-lucide="cake" class="mr-1 inline size-4"></i>৩০ নভেম্বর ২০২৬ তারিখে বয়স: ${S.toBn(a.years)} বছর ${S.toBn(a.months)} মাস ${S.toBn(a.days)} দিন` : '';
    }
    document.querySelectorAll('[data-words]').forEach((el) => {
      const f = S.allFields().find((x) => x.id === el.dataset.words);
      const n = S.countWords(data[f.id]);
      el.textContent = `${S.toBn(n)}/${S.toBn(f.words)} শব্দ`;
      el.className = 'text-xs font-semibold ' + (n > f.words ? 'text-berry-500' : 'text-muted');
    });
    const tot = document.querySelector('[data-exp-total]');
    if (tot) {
      const t = S.expensesTotal(data);
      tot.textContent = t == null ? '৳ ০' : '৳ ' + S.money(t);
      const chk = document.querySelector('[data-exp-check]');
      const cap = S.parseNum(data.f_total);
      if (t != null && cap != null && t !== cap) chk.innerHTML = `<span class="inline-flex items-center gap-1.5 font-medium text-sun-500"><i data-lucide="info" class="size-4"></i>খাতভিত্তিক সর্বমোট (৳ ${S.money(t)}) প্রয়োজনীয় মোট মূলধনের (৳ ${S.money(cap)}) সাথে মিলছে না।</span>`;
      else if (t != null && cap != null) chk.innerHTML = `<span class="inline-flex items-center gap-1.5 font-medium text-brand-600"><i data-lucide="circle-check" class="size-4"></i>মোট মূলধনের সাথে মিলেছে।</span>`;
      else chk.innerHTML = '';
    }
    if (step === 4) {
      const total = S.parseNum(data.f_total), own = S.parseNum(data.f_own);
      const h = document.querySelector('[data-money-hint="f_req"]');
      if (h && total != null && !data.f_req) h.textContent = `পরামর্শ: মোট মূলধন − নিজস্ব বিনিয়োগ = ৳ ${S.money(total - (own || 0))}`;
    }
    UI.icons();
  }

  // ---------- validation (soft, on blur) ----------
  const RULES = {
    nid: (v) => (v && ![10, 13, 17].includes(S.toEn(v).replace(/\D/g, '').length) ? 'জাতীয় পরিচয়পত্র নম্বর ১০, ১৩ বা ১৭ সংখ্যার হয়' : ''),
    spouse_nid: (v) => RULES.nid(v),
    phone: (v) => (v && !/^01[3-9]\d{8}$/.test(S.toEn(v).replace(/[\s-]/g, '').replace(/^\+?88/, '')) ? 'সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন (০১XXXXXXXXX)' : ''),
    phone_alt: (v) => RULES.phone(v),
    email: (v) => (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'সঠিক ই-মেইল ঠিকানা দিন' : ''),
    edu_year: (v) => (v && !/^(19|20)\d{2}$/.test(S.toEn(v)) ? 'চার সংখ্যার সাল দিন' : ''),
    p2_idea: (v) => (S.countWords(v) > 200 ? '২০০ শব্দের বেশি হয়ে গেছে' : ''),
  };
  function validate(k, show) {
    const f = S.allFields().find((x) => x.id === k);
    const box = document.querySelector(`[data-err="${k}"]`);
    if (!f || !box) return;
    let msg = RULES[k] ? RULES[k](data[k]) : '';
    if (!msg && f.req && show && S.visible(data, f) && S.isEmpty(data, f)) msg = 'এই ঘরটি পূরণ করা প্রয়োজন';
    box.innerHTML = msg ? `<i data-lucide="circle-alert" class="size-3.5"></i>${msg}` : '';
    box.classList.toggle('hidden', !msg);
    box.classList.toggle('flex', !!msg);
    document.querySelectorAll(`[data-k="${k}"]`).forEach((el) => el.setAttribute('aria-invalid', msg ? 'true' : 'false'));
    UI.icons();
  }

  // ---------- events ----------
  const VIS_KEYS = ['marital', 'loan_has', 'per_same', 'biz_mode', 'p3_license', 'disab'];
  const form = document.getElementById('form');

  // ---------- anti-automation guard ----------
  // Values set from the console or by scripts/extensions that fake events
  // (el.value = ...; el.dispatchEvent(new Event('input'))) arrive with isTrusted === false.
  // Those are not saved and the field is restored. Real typing, paste, OS keyboards
  // (Avro, Ridmik, Gboard voice) and browser autofill produce trusted events and work normally.
  const BLOCK_SYNTHETIC_INPUT = true;
  let warnedSynthetic = false;
  function rejectSynthetic(el) {
    const k = el.dataset.k;
    if (el.type === 'checkbox') el.checked = !!data[k];
    else if (el.type === 'radio') document.querySelectorAll(`[data-k="${k}"]`).forEach((r) => (r.checked = data[k] === r.value));
    else el.value = data[k] ?? '';
    if (!warnedSynthetic) { warnedSynthetic = true; UI.toast('স্বয়ংক্রিয়/স্ক্রিপ্ট দিয়ে দেওয়া তথ্য গ্রহণ করা হয় না। নিজে টাইপ করুন।', 'warn'); }
  }
  // Untrusted events are stopped in the capture phase so no other handler sees them.
  ['input', 'change'].forEach((type) => form.addEventListener(type, (e) => {
    if (BLOCK_SYNTHETIC_INPUT && !e.isTrusted && e.target.dataset?.k) { e.stopImmediatePropagation(); rejectSynthetic(e.target); }
  }, true));
  // Catch values changed silently (el.value = ... with no event at all): before the next real
  // keystroke is applied, the field must still hold exactly what was saved; otherwise restore it.
  const silentlyChanged = (el) => el.dataset?.k && el.type !== 'radio' && el.type !== 'checkbox' && el.type !== 'file' && el.value !== String(data[el.dataset.k] ?? '');
  form.addEventListener('beforeinput', (e) => { if (BLOCK_SYNTHETIC_INPUT && silentlyChanged(e.target)) rejectSynthetic(e.target); }, true);
  form.addEventListener('focusin', (e) => { if (BLOCK_SYNTHETIC_INPUT && silentlyChanged(e.target)) rejectSynthetic(e.target); });

  form.addEventListener('input', (e) => {
    const el = e.target, k = el.dataset.k;
    if (!k) return;
    const max = +el.getAttribute('maxlength') || 0;
    if (max && el.value.length > max) el.value = el.value.slice(0, max);
    if (el.type === 'checkbox') data[k] = el.checked;
    else if (el.type === 'radio') { if (el.checked) data[k] = el.value; }
    else {
      let value = el.value;
      if (el.classList.contains('uppercase')) { const p = el.selectionStart; value = value.toUpperCase(); if (value !== el.value) { el.value = value; el.setSelectionRange(p, p); } }
      data[k] = value;
    }
    // money hint + auto quarterly/annual from monthly
    if (el.dataset.money !== undefined) {
      const h = document.querySelector(`[data-money-hint="${k}"]`);
      if (h) h.textContent = hintMoney(data[k]);
      const m = k.match(/^(p[23]_(?:sales|profit))_(m|q|y)$/);
      if (m) {
        const base = m[1];
        if (m[2] === 'm') {
          const n = S.parseNum(data[k]);
          [['q', 3], ['y', 12]].forEach(([s, mul]) => {
            const kk = base + '_' + s;
            if (!data[kk] || data['_auto_' + kk]) {
              data[kk] = n == null ? '' : S.toBn(String(n * mul));
              data['_auto_' + kk] = true;
              const t = document.getElementById('f-' + kk); if (t) t.value = data[kk];
              const hh = document.querySelector(`[data-money-hint="${kk}"]`); if (hh) hh.textContent = hintMoney(data[kk]);
            }
          });
        } else delete data['_auto_' + k];
      }
    }
    if (el.type === 'radio') el.closest('[role="radiogroup"]')?.querySelectorAll('[data-dot]').forEach((d) => d.classList.toggle('hidden', !d.closest('label').querySelector('input').checked));
    persist();
    if (VIS_KEYS.includes(k)) applyVisibility();
    updateDerived();
    if (document.querySelector(`[data-err="${k}"]:not(.hidden)`)) validate(k, true);
    if (k === 'p2_idea') validate(k, false);
  });
  form.addEventListener('change', (e) => { if (e.target.dataset.k && (e.target.type === 'radio' || e.target.tagName === 'SELECT')) validate(e.target.dataset.k, true); });
  form.addEventListener('focusout', (e) => { const k = e.target.dataset?.k; if (k && e.target.type !== 'radio') validate(k, true); });
  form.addEventListener('submit', (e) => e.preventDefault());

  // photo: downscale to keep localStorage small
  form.addEventListener('change', async (e) => {
    if (e.target.id !== 'photo-input' || !e.target.files[0]) return;
    try {
      const url = await shrinkImage(e.target.files[0], 360, 420);
      data.photo = url;
      persist();
      document.getElementById('photo-box').innerHTML = `<img src="${url}" class="size-full object-cover">`;
      document.getElementById('photo-remove').classList.remove('hidden');
    } catch (err) { UI.toast('ছবিটি পড়া যায়নি', 'err'); }
    e.target.value = '';
  });
  form.addEventListener('click', (e) => {
    if (e.target.closest('#photo-remove')) {
      delete data.photo; persist();
      document.getElementById('photo-box').innerHTML = '<i data-lucide="image-plus" class="size-7"></i>';
      e.target.closest('#photo-remove').classList.add('hidden');
      UI.icons();
    }
  });
  function shrinkImage(file, maxW, maxH) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // crop to passport ratio (maxW:maxH) from the center, then scale down
        const ratio = maxW / maxH;
        let sw = img.width, sh = img.height, sx = 0, sy = 0;
        if (sw / sh > ratio) { sw = sh * ratio; sx = (img.width - sw) / 2; } else { sh = sw / ratio; sy = (img.height - sh) / 2; }
        const c = document.createElement('canvas');
        const scale = Math.min(1, maxW / sw);
        c.width = Math.round(sw * scale); c.height = Math.round(sh * scale);
        c.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
        URL.revokeObjectURL(img.src);
        resolve(c.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  function goto(i, focusId) {
    step = Math.min(Math.max(i, 0), STEPS.length - 1);
    if (app) { app.step = step; Store.save(app); history.replaceState(null, '', `form.html?id=${app.id}&step=${step}`); }
    renderStep();
    if (focusId) {
      const el = document.querySelector(`[data-k="${focusId}"]`) || document.querySelector(`[data-fid="${focusId}"]`);
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => el.focus({ preventScroll: true }), 350); validate(focusId, true); }
    } else window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.addEventListener('click', (e) => {
    const s = e.target.closest('[data-step]');
    if (s) goto(+s.dataset.step);
  });
  document.getElementById('prev').addEventListener('click', () => goto(step - 1));
  document.getElementById('next').addEventListener('click', () => {
    if (step < STEPS.length - 1) return goto(step + 1);
    openPreview();
  });
  function openPreview() {
    if (!app) return UI.toast('প্রিভিউ দেখতে আগে কিছু তথ্য লিখুন', 'warn');
    location.href = `preview.html?id=${app.id}`;
  }
  document.getElementById('btn-preview').addEventListener('click', openPreview);
  document.querySelectorAll('[data-clear]').forEach((b) => b.addEventListener('click', clearAll));
  async function clearAll() {
    menu.close();
    if (!app || !Object.keys(data).length) return UI.toast('মুছে ফেলার মতো কোনো তথ্য নেই', 'warn');
    const ok = await UI.dialog({ title: 'সব তথ্য মুছে ফেলবেন?', icon: 'eraser', tone: 'danger', ok: 'হ্যাঁ, সব মুছুন',
      body: 'এই আবেদনের সব ঘরের লেখা ও ছবি মুছে যাবে এবং আর ফেরত আনা যাবে না। আবেদনটি ড্যাশবোর্ডে ফাঁকা অবস্থায় থাকবে।' });
    if (!ok) return;
    data = {}; app.data = data; Store.save(app);
    savedAt = Date.now();
    goto(0);
    UI.toast('সব তথ্য মুছে ফেলা হয়েছে');
  }

  // keep in sync if the same application is edited in another tab
  window.addEventListener('storage', (e) => {
    if (e.key !== Store.KEY || !app) return;
    const fresh = Store.get(app.id);
    if (fresh && fresh.updatedAt > (app.updatedAt || 0) && document.activeElement?.dataset?.k === undefined) {
      app = fresh; data = fresh.data; renderStep();
    }
  });

  renderSaveState(false);
  renderStep();
  const focus = UI.qs('focus');
  if (focus) setTimeout(() => goto(step, focus), 50);
})();
