/* Renders the 7 official form pages (vector, from the original PDF) and places
   the applicant's values into the exact table cells. All coordinates are PDF points
   (1pt = 1/72 inch) measured from the original form. Page size: 595.32 x 841.92 pt. */
(function () {
  const S = window.Schema;
  const PAGE_W = 595.32, PAGE_H = 841.92;

  // ---------- value formatters ----------
  const v = (d, id) => String(S.getVal(d, id) || '').trim();
  const join = (parts, sep) => parts.filter((p) => p && String(p).trim()).join(sep);
  const bnNum = (s) => S.toBn(s);
  const amount = (s) => {
    const n = S.parseNum(s);
    return n == null ? String(s || '') : S.money(n);
  };

  const F = {
    dob(d) {
      if (!d.dob) return '';
      const a = S.ageAt(d.dob);
      const age = a ? `বয়স: ${S.toBn(a.years)} বছর ${S.toBn(a.months)} মাস ${S.toBn(a.days)} দিন` : '';
      return join([S.fmtDate(d.dob), age], '; ');
    },
    edu: (d) => join([v(d, 'edu_exam'), v(d, 'edu_board'), bnNum(v(d, 'edu_year'))], ', '),
    phone: (d) => join([bnNum(v(d, 'phone')), bnNum(v(d, 'phone_alt'))], ' / '),
    bank(d) {
      const l1 = join([v(d, 'bank_name') && 'ব্যাংকের নাম: ' + v(d, 'bank_name'), v(d, 'bank_branch') && 'শাখা: ' + v(d, 'bank_branch')], ', ');
      const l2 = v(d, 'bank_acc_type') && 'হিসাবের ধরণ: ' + v(d, 'bank_acc_type');
      const l3 = v(d, 'bank_acc_no') && 'হিসাব নম্বর: ' + bnNum(v(d, 'bank_acc_no'));
      return join([l1, l2, l3], '\n');
    },
    yesDetail: (d, yn, det) => (v(d, yn) ? join([v(d, yn), d[yn] === 'হ্যাঁ' ? v(d, det) : ''], '; ') : ''),
    type: (d, t, desc) => join([v(d, t), v(d, desc)], ' — '),
    people(d, total, women) {
      if (!v(d, total) && !v(d, women)) return '';
      return `মোট ${bnNum(v(d, total)) || '.........'} জন, তন্মধ্যে নারী ${bnNum(v(d, women)) || '.........'} জন`;
    },
    license(d) {
      if (!v(d, 'p3_license')) return '';
      if (d.p3_license !== 'হ্যাঁ') return v(d, 'p3_license');
      return join(['হ্যাঁ', d.p3_license_date && 'ইস্যুর তারিখ: ' + S.fmtDate(d.p3_license_date), v(d, 'p3_license_no') && 'নম্বর: ' + bnNum(v(d, 'p3_license_no'))], '; ');
    },
  };

  // ---------- slots ----------
  // [page, x, y, w, h, valueFn, opts]   opts: { multi, size, align, cover }
  const T = (id) => (d) => v(d, id);
  const N = (id) => (d) => bnNum(v(d, id));
  const A = (id) => (d) => amount(v(d, id));
  const SLOTS = [];
  const add = (page, x, y, w, h, fn, opts = {}) => SLOTS.push({ page, x, y, w, h, fn, ...opts });

  // Page 1: Part-1 (01–10) + photo
  add(1, 434.3, 177.5, 124.2, 136.2, (d) => d.photo || '', { photo: true });
  add(1, 284.7, 441.2, 274, 39.2, T('name_bn'), { multi: true });
  add(1, 284.7, 480.9, 274, 37.4, (d) => v(d, 'name_en').toUpperCase(), { multi: true });
  add(1, 207.3, 518.8, 351.4, 22, T('father'));
  add(1, 207.3, 541.1, 351.4, 21.8, T('mother'));
  add(1, 207.3, 563.3, 351.4, 21.8, N('nid'));
  add(1, 207.3, 585.5, 351.4, 37.6, F.dob, { multi: true });
  add(1, 207.3, 623.6, 351.4, 21.9, T('marital'));
  const married = (d) => d.marital && d.marital !== 'অবিবাহিত';
  add(1, 207.3, 645.9, 351.4, 37.5, (d) => (married(d) ? v(d, 'spouse_name') : ''), { multi: true });
  add(1, 207.3, 683.9, 351.4, 21.8, (d) => (married(d) ? bnNum(v(d, 'spouse_nid')) : ''));
  add(1, 207.3, 706.2, 351.4, 37.4, F.edu, { multi: true });
  add(1, 207.3, 744.1, 351.4, 21.8, F.phone);
  add(1, 207.3, 766.4, 351.4, 21.7, T('email'));

  // Page 2: 11–16
  add(2, 207.3, 28.3, 351.6, 69.4, T('training'), { multi: true });
  add(2, 207.3, 98.3, 351.6, 119.4, T('experience'), { multi: true });
  add(2, 207.3, 240.3, 351.6, 94.4, F.bank, { multi: true });
  add(2, 207.3, 335.3, 351.6, 98.4, (d) => F.yesDetail(d, 'loan_has', 'loan_details'), { multi: true });
  const ADDR_X = [36.4, 120.2, 220.2, 298.2, 387.2, 470.2, 558.9];
  ['house', 'road', 'post', 'thana', 'district', 'division'].forEach((k, i) => {
    const x = ADDR_X[i], w = ADDR_X[i + 1] - x;
    add(2, x, 498.3, w, 67.4, k === 'post' ? N('pre_' + k) : T('pre_' + k), { multi: true });
    add(2, x, 629.3, w, 67.4, k === 'post' ? N('per_' + k) : T('per_' + k), { multi: true });
  });

  // Page 3: Part-2 (01–10)  — only when new venture
  const P2 = (fn) => (d) => (d.biz_mode === 'new' ? fn(d) : '');
  const P3 = (fn) => (d) => (d.biz_mode === 'existing' ? fn(d) : '');
  add(3, 202.3, 82.3, 356.6, 298.4, P2(T('p2_idea')), { multi: true });
  add(3, 202.3, 381.3, 356.6, 22.4, P2(T('p2_buyers')));
  add(3, 202.3, 404.3, 356.6, 36.4, P2(T('p2_start')), { multi: true });
  add(3, 202.3, 441.3, 356.6, 65.4, P2((d) => F.type(d, 'p2_type', 'p2_type_desc')), { multi: true });
  add(3, 202.3, 507.3, 356.6, 62.4, P2(T('p2_location')), { multi: true });
  add(3, 202.3, 570.3, 356.6, 53.4, P2(T('p2_product')), { multi: true });
  add(3, 202.3, 624.3, 356.6, 37.4, P2(T('p2_raw')), { multi: true });
  add(3, 202.3, 662.3, 356.6, 37.4, P2(T('p2_market')), { multi: true });
  const P3COLS = [[202.3, 110.6], [313.3, 119.6], [433.3, 125.6]];
  ['m', 'q', 'y'].forEach((k, i) => {
    add(3, P3COLS[i][0], 722.3, P3COLS[i][1], 22.4, P2(A('p2_sales_' + k)), { align: 'center' });
    add(3, P3COLS[i][0], 767.3, P3COLS[i][1], 21.4, P2(A('p2_profit_' + k)), { align: 'center' });
  });

  // Page 4: Part-2 (11–13) + Part-3 (01–08)
  add(4, 202.3, 28.3, 356.6, 96.4, P2(T('p2_risk')), { multi: true });
  add(4, 202.3, 125.3, 356.6, 53.4, P2((d) => F.people(d, 'p2_emp_total', 'p2_emp_women')), { multi: true });
  add(4, 202.3, 179.3, 356.6, 139.4, P2(T('p2_compete')), { multi: true });
  add(4, 202.3, 356.3, 356.6, 21.4, P3(T('p3_name')));
  add(4, 202.3, 378.3, 356.6, 53.4, P3((d) => F.type(d, 'p3_type', 'p3_type_desc')), { multi: true });
  add(4, 202.3, 432.3, 356.6, 21.4, P3((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.p3_start || '') ? S.fmtDate(d.p3_start) : v(d, 'p3_start')), { multi: true });
  add(4, 202.3, 454.3, 356.6, 53.4, P3(F.license), { multi: true });
  add(4, 202.3, 508.3, 356.6, 71.4, P3(T('p3_price')), { multi: true });
  const P4COLS = [[202.3, 104.6], [307.3, 122.6], [430.3, 128.6]];
  ['m', 'q', 'y'].forEach((k, i) => {
    add(4, P4COLS[i][0], 602.3, P4COLS[i][1], 22.4, P3(A('p3_sales_' + k)), { align: 'center' });
    add(4, P4COLS[i][0], 647.3, P4COLS[i][1], 21.4, P3(A('p3_profit_' + k)), { align: 'center' });
  });
  add(4, 202.3, 669.3, 356.6, 85.4, P3(T('p3_cost')), { multi: true });

  // Page 5: Part-3 (09–16)
  add(5, 202.3, 28.3, 356.6, 87.4, P3(T('p3_how')), { multi: true });
  add(5, 202.3, 116.3, 356.6, 37.4, P3(A('p3_invest')), { multi: true });
  add(5, 202.3, 154.3, 356.6, 51.4, P3(T('p3_raw')), { multi: true });
  add(5, 202.3, 206.3, 356.6, 21.4, P3(T('p3_area')));
  add(5, 202.3, 228.3, 356.6, 139.4, P3(T('p3_compete')), { multi: true });
  add(5, 202.3, 368.3, 356.6, 134.4, P3(T('p3_risk')), { multi: true });
  add(5, 202.3, 503.3, 356.6, 53.4, P3((d) => F.people(d, 'p3_staff_total', 'p3_staff_women')), { multi: true });
  add(5, 202.3, 557.3, 356.6, 202.4, P3(T('p3_expand')), { multi: true });

  // Page 6: Part-4
  add(6, 308.3, 120.3, 250.6, 16.6, A('f_total'), { align: 'center', size: 9 });
  add(6, 308.3, 137.3, 250.6, 17.4, A('f_own'), { align: 'center', size: 9 });
  add(6, 308.3, 155.3, 250.6, 16.6, A('f_req'), { align: 'center', size: 9 });
  const ROW_Y = [218.3, 236.3, 253.3, 270.3, 287.3, 305.3, 322.3, 339.3, 356.3, 374.3, 391.3, 408.3, 425.3];
  for (let i = 1; i <= 12; i++) {
    const y = ROW_Y[i - 1], h = ROW_Y[i] - y - 0.5;
    add(6, 234.3, y, 127.6, h, T('e' + i + '_desc'), { multi: true, size: 8 });
    add(6, 362.3, y, 108.6, h, A('e' + i + '_amt'), { align: 'center', size: 8.5 });
    add(6, 471.3, y, 87.6, h, T('e' + i + '_src'), { align: 'center', size: 8.5 });
  }
  add(6, 362.3, 425.3, 108.6, 17.4, (d) => S.money(S.expensesTotal(d)), { align: 'center', size: 8.5, bold: true });

  // Page 7: Part-5
  add(7, 319.3, 80.3, 239.6, 22.4, (d) => F.yesDetail(d, 'disab', 'disab_type'));
  add(7, 319.3, 103.3, 239.6, 21.4, T('ethnic'));
  add(7, 319.3, 125.3, 239.6, 21.4, T('other'));

  // Logo images (the PDF embeds them as bitmaps; everything else is vector)
  const LOGOS = { 1: [[36, 27.7, 59.2, 64.8]] };
  const FOOTER_LOGO = [128.3, 790.9, 11.7, 12];

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function pageHTML(p, d) {
    const imgs = (LOGOS[p] || []).concat([FOOTER_LOGO])
      .map(([x, y, w, h]) => `<img class="form-logo" src="assets/logo.png" alt="" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt">`).join('');
    const vals = SLOTS.filter((s) => s.page === p).map((s) => {
      const val = s.fn(d);
      if (!val) return '';
      const style = `left:${s.x}pt;top:${s.y}pt;width:${s.w}pt;height:${s.h}pt;`;
      if (s.photo) return `<div class="form-photo" style="${style}"><img src="${esc(val)}" alt=""></div>`;
      const cls = ['form-val', s.multi ? 'is-multi' : 'is-line', s.align === 'center' ? 'is-center' : '', s.bold ? 'is-bold' : ''].join(' ');
      return `<div class="${cls}" style="${style}" data-size="${s.size || 10}"><span style="font-size:${s.size || 10}pt">${esc(val)}</span></div>`;
    }).join('');
    return `<section class="form-page" data-page="${p}">${window.FORM_PAGES[p - 1]}${imgs}${vals}</section>`;
  }

  // Shrink text until it fits its cell (long answers stay inside the box).
  function fit(root) {
    root.querySelectorAll('.form-val').forEach((box) => {
      const span = box.firstElementChild;
      let size = parseFloat(box.dataset.size);
      const min = 4;
      const multi = box.classList.contains('is-multi');
      // Compact wrapped answers a little before reducing the font size. This
      // preserves more readable text in the taller cells while avoiding clips.
      span.style.lineHeight = multi ? '1.08' : '1.15';
      const over = () => (box.classList.contains('is-multi')
        ? span.scrollHeight > box.clientHeight + 0.5 || span.scrollWidth > box.clientWidth + 0.5
        : span.scrollWidth > box.clientWidth + 0.5);
      span.style.fontSize = size + 'pt';
      while (over() && size > min) { size -= 0.25; span.style.fontSize = size + 'pt'; }
    });
  }

  async function render(container, data) {
    container.innerHTML = [1, 2, 3, 4, 5, 6, 7].map((p) => pageHTML(p, data || {})).join('');
    try { await document.fonts.load('10pt Kalpurush', 'অআ'); await document.fonts.ready; } catch (e) {}
    fit(container);
  }

  window.FormPrint = { render, fit, SLOTS, PAGE_W, PAGE_H };
})();
