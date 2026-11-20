/* Form definition: steps, fields, required rules and value formatting.
   Field labels follow the official UDYOG application form wording. */
(function () {
  // ---------- number / date helpers ----------
  const BN = '০১২৩৪৫৬৭৮৯';
  const toBn = (v) => String(v ?? '').replace(/[0-9]/g, (d) => BN[d]);
  const toEn = (v) => String(v ?? '').replace(/[০-৯]/g, (d) => BN.indexOf(d));
  const parseNum = (v) => {
    const s = toEn(v).replace(/[,\s৳টাকা]/g, '');
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };
  // Bangladeshi grouping: 12,34,567
  const groupBD = (n) => {
    const neg = n < 0; n = Math.abs(Math.round(n * 100) / 100);
    let [int, dec] = String(n).split('.');
    let last3 = int.slice(-3), rest = int.slice(0, -3);
    if (rest) last3 = ',' + last3;
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return (neg ? '-' : '') + rest + last3 + (dec ? '.' + dec : '');
  };
  const money = (n) => (n == null ? '' : toBn(groupBD(n)));
  const DEADLINE = new Date(2026, 10, 30); // ৩০ নভেম্বর ২০২৬
  function ageAt(dobStr, at = DEADLINE) {
    if (!dobStr) return null;
    const [y, m, d] = dobStr.split('-').map(Number);
    if (!y || !m || !d) return null;
    let years = at.getFullYear() - y, months = at.getMonth() + 1 - m, days = at.getDate() - d;
    if (days < 0) { months--; days += new Date(at.getFullYear(), at.getMonth(), 0).getDate(); }
    if (months < 0) { years--; months += 12; }
    if (years < 0) return null;
    return { years, months, days };
  }
  const fmtDate = (s) => {
    if (!s) return '';
    const [y, m, d] = s.split('-');
    return toBn(`${d}/${m}/${y}`);
  };
  const countWords = (s) => (String(s || '').trim().match(/\S+/g) || []).length;

  // ---------- option lists ----------
  const YES_NO = ['হ্যাঁ', 'না'];
  const MARITAL = ['অবিবাহিত', 'বিবাহিত', 'বিধবা', 'বিপত্নীক', 'তালাকপ্রাপ্ত'];
  const BIZ_TYPE = ['উৎপাদন', 'সেবা', 'ব্যবসা'];
  const MARKET = ['স্থানীয়', 'আন্তর্জাতিক', 'স্থানীয় ও আন্তর্জাতিক'];
  const ACC_TYPE = ['সঞ্চয়ী হিসাব', 'চলতি হিসাব', 'এসএনডি হিসাব', 'কৃষক/১০ টাকার হিসাব', 'অন্যান্য'];
  const DIVISIONS = ['ঢাকা', 'চট্টগ্রাম', 'রাজশাহী', 'খুলনা', 'বরিশাল', 'সিলেট', 'রংপুর', 'ময়মনসিংহ'];
  const FUND_SRC = ['নিজস্ব', 'ঋণ', 'অনুদান', 'নিজস্ব ও ঋণ', 'ঋণ ও অনুদান'];
  const EXPENSE_HEADS = [
    'যন্ত্রপাতি ও সরঞ্জাম ক্রয়', 'কাঁচামাল ও উপকরণ', 'পরিচলন ব্যয়', 'প্রোটোটাইপ/নমুনা উন্নয়ন',
    'প্যাকেজিং, লেবেল ও ব্র্যান্ডিং', 'ব্যবসা নিবন্ধন, লাইসেন্স ও ছাড়পত্র', 'বিপণন ও প্রচার', 'কর্মীর মজুরি',
    'পরিবহন ও সরবরাহ', 'প্রযুক্তি, সফটওয়্যার ও ইন্টারনেট', 'প্রশিক্ষণ ও দক্ষতা উন্নয়ন', 'অন্যান্য (উল্লেখ করুন)',
  ];

  const isNew = (d) => d.biz_mode === 'new';
  const isExisting = (d) => d.biz_mode === 'existing';
  const isMarried = (d) => d.marital && d.marital !== 'অবিবাহিত';

  // Field shape:
  // { id, num, label, sub, type, req, ph, help, opts, show(d), full, words, upper, digits, money, rows, list }
  // types: text | textarea | select | radio | date | tel | email | number | money | photo | check | triple | addr
  const STEPS = [
    {
      id: 'personal', title: 'ব্যক্তিগত তথ্য', part: 'পার্ট-১', icon: 'user-round',
      desc: 'আবেদনকারীর নাম, পরিচয় ও যোগাযোগের তথ্য',
      groups: [
        { title: 'আবেদনকারীর পরিচয়', fields: [
          { id: 'name_bn', num: '০১', label: 'আবেদনকারীর নাম', sub: 'বাংলায়', ui: 'আবেদনকারীর নাম (বাংলায়)', req: true, ph: 'যেমন: মোঃ রাকিব হাসান' },
          { id: 'name_en', num: '০১', label: 'আবেদনকারীর নাম', sub: 'In English (Block Letters)', ui: 'আবেদনকারীর নাম (In English, Block Letters)', req: true, upper: true, ph: 'e.g. MD. RAKIB HASAN' },
          { id: 'father', num: '০২', label: 'পিতার নাম', req: true },
          { id: 'mother', num: '০৩', label: 'মাতার নাম', req: true },
          { id: 'nid', num: '০৪', label: 'জাতীয় পরিচয়পত্র নম্বর', req: true, type: 'tel', digits: true, ph: '১০, ১৩ বা ১৭ সংখ্যার নম্বর' },
          { id: 'dob', num: '০৫', label: 'জন্ম তারিখ ও আবেদনের শেষ তারিখে বয়স', req: true, type: 'date', help: '৩০ নভেম্বর ২০২৬ তারিখে বয়স স্বয়ংক্রিয়ভাবে হিসাব হবে' },
          { id: 'photo', label: 'পাসপোর্ট সাইজ ছবি', type: 'photo', help: 'ঐচ্ছিক। দিলে ফরমের ছবির ঘরে বসবে; না দিলে ঘর ফাঁকা থাকবে, ছবি হাতে লাগাতে পারবেন।' },
        ] },
        { title: 'পারিবারিক অবস্থা', fields: [
          { id: 'marital', num: '০৬', label: 'বৈবাহিক অবস্থা', req: true, type: 'radio', opts: MARITAL, full: true },
          { id: 'spouse_name', num: '০৭', label: 'স্বামী/স্ত্রীর নাম', req: true, show: isMarried },
          { id: 'spouse_nid', num: '০৭', label: 'স্বামী/স্ত্রীর জাতীয় পরিচয়পত্র নম্বর', type: 'tel', digits: true, show: isMarried },
        ] },
        { title: 'শিক্ষা ও যোগাযোগ', fields: [
          { id: 'edu_exam', num: '০৮', label: 'শিক্ষাগত যোগ্যতা (সর্বশেষ পাসকৃত পরীক্ষা, বোর্ড/বিশ্ববিদ্যালয় ও সাল)', sub: 'সর্বশেষ পাসকৃত পরীক্ষা', ui: 'সর্বশেষ পাসকৃত পরীক্ষা', req: true, ph: 'যেমন: স্নাতক (সম্মান)', list: ['এসএসসি', 'দাখিল', 'এইচএসসি', 'আলিম', 'ডিপ্লোমা', 'স্নাতক', 'স্নাতক (সম্মান)', 'স্নাতকোত্তর', 'কামিল'] },
          { id: 'edu_board', num: '০৮', label: 'বোর্ড/বিশ্ববিদ্যালয়', sub: 'বোর্ড/বিশ্ববিদ্যালয়', ph: 'যেমন: জাতীয় বিশ্ববিদ্যালয়' },
          { id: 'edu_year', num: '০৮', label: 'পাসের সাল', sub: 'সাল', type: 'tel', digits: true, ph: 'যেমন: ২০২২' },
          { id: 'phone', num: '০৯', label: 'ফোন নম্বর / বিকল্প ফোন নম্বর', sub: 'ফোন নম্বর', ui: 'ফোন নম্বর', req: true, type: 'tel', digits: true, ph: '০১XXXXXXXXX' },
          { id: 'phone_alt', num: '০৯', label: 'বিকল্প ফোন নম্বর', sub: 'বিকল্প ফোন নম্বর', type: 'tel', digits: true },
          { id: 'email', num: '১০', label: 'ই-মেইল আইডি', req: true, type: 'email', ph: 'name@example.com' },
        ] },
      ],
    },
    {
      id: 'background', title: 'অভিজ্ঞতা ও আর্থিক তথ্য', part: 'পার্ট-১', icon: 'briefcase',
      desc: 'প্রশিক্ষণ, অভিজ্ঞতা, ব্যাংক হিসাব ও বিদ্যমান ঋণ',
      groups: [
        { title: 'দক্ষতা ও অভিজ্ঞতা', fields: [
          { id: 'training', num: '১১', label: 'দক্ষতা উন্নয়নমূলক কোনরূপ প্রশিক্ষণ থাকলে তার বিবরণ', help: 'প্রতিষ্ঠান, কোর্সের নাম, মেয়াদ ও সাল; সনদের কপি সংযুক্ত করুন', type: 'textarea', rows: 3, full: true },
          { id: 'experience', num: '১২', label: 'ব্যবসা/চাকরির অভিজ্ঞতা থাকলে তার বিবরণ', type: 'textarea', rows: 4, full: true },
        ] },
        { title: 'ব্যাংক হিসাব (থাকলে)', fields: [
          { id: 'bank_name', num: '১৩', label: 'ব্যাংকের নাম', sub: 'ব্যাংকের নাম' },
          { id: 'bank_branch', num: '১৩', label: 'শাখা', sub: 'শাখা' },
          { id: 'bank_acc_type', num: '১৩', label: 'হিসাবের ধরণ', sub: 'হিসাবের ধরণ', type: 'select', opts: ACC_TYPE },
          { id: 'bank_acc_no', num: '১৩', label: 'হিসাব নম্বর', sub: 'হিসাব নম্বর', type: 'tel', digits: true },
        ] },
        { title: 'বিদ্যমান ঋণ', fields: [
          { id: 'loan_has', num: '১৪', label: 'কোনো ব্যাংক/আর্থিক প্রতিষ্ঠানে বিদ্যমান ঋণ আছে কিনা', req: true, type: 'radio', opts: YES_NO, full: true },
          { id: 'loan_details', num: '১৪', label: 'বিদ্যমান ঋণের বিবরণ', req: true, type: 'textarea', rows: 3, full: true, show: (d) => d.loan_has === 'হ্যাঁ', ph: 'প্রতিষ্ঠানের নাম, ঋণের পরিমাণ, বকেয়া ইত্যাদি' },
        ] },
      ],
    },
    {
      id: 'address', title: 'ঠিকানা', part: 'পার্ট-১', icon: 'map-pin',
      desc: 'জাতীয় পরিচয়পত্র মোতাবেক বর্তমান ও স্থায়ী ঠিকানা',
      groups: [
        { title: '১৫. বর্তমান ঠিকানা (জাতীয় পরিচয়পত্র মোতাবেক)', fields: addrFields('pre', '১৫', 'বর্তমান ঠিকানা') },
        { title: '১৬. স্থায়ী ঠিকানা', fields: [
          { id: 'per_same', label: 'বর্তমান ঠিকানার মতোই', type: 'check', full: true },
          ...addrFields('per', '১৬', 'স্থায়ী ঠিকানা'),
        ] },
      ],
    },
    {
      id: 'business', title: 'ব্যবসায়িক তথ্য', part: 'পার্ট-২ / ৩', icon: 'store',
      desc: 'নতুন উদ্যোগের পরিকল্পনা অথবা চলমান ব্যবসার তথ্য',
      groups: [
        { title: 'আপনার অবস্থা', fields: [
          { id: 'biz_mode', label: 'আপনার কি বর্তমানে কোনো ব্যবসা আছে?', req: true, type: 'mode', full: true,
            opts: [
              { v: 'new', t: 'না, নতুন উদ্যোগ শুরু করব', d: 'পার্ট-২: ব্যবসায়িক পরিকল্পনা পূরণ করবেন' },
              { v: 'existing', t: 'হ্যাঁ, ব্যবসা চালু আছে', d: 'পার্ট-৩: ব্যবসা সম্পর্কিত তথ্য পূরণ করবেন' },
            ] },
        ] },
        { title: 'পার্ট-২: ব্যবসায়িক পরিকল্পনা সংক্রান্ত তথ্যাদি', show: isNew, fields: [
          { id: 'p2_idea', num: '০১', label: 'ব্যবসায়িক ধারণা/উদ্যোগের সংক্ষিপ্ত বিবরণ', help: '২০০ শব্দের মধ্যে', req: true, type: 'textarea', rows: 7, words: 200, full: true, show: isNew },
          { id: 'p2_buyers', num: '০২', label: 'সম্ভাব্য ক্রেতা', req: true, full: true, show: isNew },
          { id: 'p2_start', num: '০৩', label: 'কত সময়ের মধ্যে ব্যবসায় শুরু করার পরিকল্পনা রয়েছে', help: 'পরিকল্পিত সময় ও প্রয়োজনীয় ব্যাখ্যা লিখুন', req: true, type: 'textarea', rows: 3, full: true, show: isNew, ph: 'যেমন: ঋণ পাওয়ার ৩ মাসের মধ্যে; অনুমোদন পেলে দোকান প্রস্তুত করার কাজ শুরু হবে' },
          { id: 'p2_type', num: '০৪', label: 'ব্যবসার ধরন', sub: 'উৎপাদন / সেবা / ব্যবসা', req: true, type: 'radio', opts: BIZ_TYPE, full: true, show: isNew },
          { id: 'p2_type_desc', num: '০৪', label: 'ব্যবসার ধরনের বিবরণ', type: 'textarea', rows: 2, full: true, show: isNew },
          { id: 'p2_location', num: '০৫', label: 'ব্যবসার সম্ভাব্য অবস্থান', help: 'গ্রাম/মহল্লা, ইউনিয়ন, উপজেলা', req: true, type: 'textarea', rows: 2, full: true, show: isNew },
          { id: 'p2_product', num: '০৬', label: 'পণ্যের ধরন', help: 'আমদানির বিকল্প বা রপ্তানিযোগ্য পণ্য কিনা', type: 'textarea', rows: 2, full: true, show: isNew },
          { id: 'p2_raw', num: '০৭', label: 'কাঁচামালের উৎস', help: 'প্রযোজ্য ক্ষেত্রে বিস্তারিত লিখুন', type: 'textarea', rows: 3, full: true, show: isNew },
          { id: 'p2_market', num: '০৮', label: 'পণ্যের বাজার', sub: 'স্থানীয়/আন্তর্জাতিক', type: 'radio', opts: MARKET, full: true, show: isNew },
          { id: 'p2_sales', num: '০৯', label: 'সম্ভাব্য বিক্রয়ের পরিমাণ (টাকায়)', type: 'triple', full: true, show: isNew },
          { id: 'p2_profit', num: '১০', label: 'সম্ভাব্য লাভ/মুনাফা (টাকায়)', type: 'triple', full: true, show: isNew },
          { id: 'p2_risk', num: '১১', label: 'ব্যবসা পরিচালনার ক্ষেত্রে সম্ভাব্য সমস্যাসমূহ, ঝুঁকিসমূহ এবং ঝুঁকিসমূহ মোকাবেলায় পরিকল্পনা', type: 'textarea', rows: 4, full: true, show: isNew },
          { id: 'p2_emp_total', num: '১২', label: 'প্রথম বছরে সম্ভাব্য কর্মসংস্থান — মোট (জন)', type: 'tel', digits: true, show: isNew },
          { id: 'p2_emp_women', num: '১২', label: 'তন্মধ্যে নারী (জন)', type: 'tel', digits: true, show: isNew },
          { id: 'p2_compete', num: '১৩', label: 'যে পণ্য/সেবা বিক্রয় করা হবে, বর্তমানে বাজারে তার অবস্থান কেমন', help: 'কমপক্ষে ৩টি সম্ভাব্য প্রতিযোগী প্রতিষ্ঠানের তথ্যসহ', type: 'textarea', rows: 5, full: true, show: isNew },
        ] },
        { title: 'পার্ট-৩: ব্যবসা সম্পর্কিত তথ্যাবলি', show: isExisting, fields: [
          { id: 'p3_name', num: '০১', label: 'ব্যবসা প্রতিষ্ঠানের নাম', req: true, full: true, show: isExisting },
          { id: 'p3_type', num: '০২', label: 'ব্যবসার ধরন', sub: 'উৎপাদন / সেবা / ব্যবসা', req: true, type: 'radio', opts: BIZ_TYPE, full: true, show: isExisting },
          { id: 'p3_type_desc', num: '০২', label: 'ব্যবসার ধরনের বিবরণ', type: 'textarea', rows: 2, full: true, show: isExisting },
          { id: 'p3_start', num: '০৩', label: 'ব্যবসা শুরুর সময়/বিবরণ', help: 'সঠিক দিন জানা না থাকলে মাস/বছর বা আনুমানিক সময় লিখুন', req: true, type: 'textarea', rows: 3, ph: 'যেমন: ২০২২ সালের মাঝামাঝি; সঠিক তারিখ জানা নেই', full: true, show: isExisting },
          { id: 'p3_license', num: '০৪', label: 'ট্রেড লাইসেন্স আছে কিনা', req: true, type: 'radio', opts: YES_NO, show: isExisting },
          { id: 'p3_license_date', num: '০৪', label: 'ট্রেড লাইসেন্স ইস্যুর তারিখ', type: 'date', show: (d) => isExisting(d) && d.p3_license === 'হ্যাঁ' },
          { id: 'p3_license_no', num: '০৪', label: 'ট্রেড লাইসেন্স নম্বর', show: (d) => isExisting(d) && d.p3_license === 'হ্যাঁ' },
          { id: 'p3_price', num: '০৫', label: 'পণ্য/সেবার গড় বিক্রয়মূল্য (একক প্রতি)', type: 'textarea', rows: 2, full: true, show: isExisting },
          { id: 'p3_sales', num: '০৬', label: 'বিক্রয়ের পরিমাণ (টাকায়)', type: 'triple', full: true, show: isExisting },
          { id: 'p3_profit', num: '০৭', label: 'লাভ/মুনাফার পরিমাণ (টাকায়)', type: 'triple', full: true, show: isExisting },
          { id: 'p3_cost', num: '০৮', label: 'কাঁচামাল ও ব্যবসা পরিচালনা বাবদ বিভিন্ন খাতে মাসিক সম্ভাব্য খরচ (টাকা)', type: 'textarea', rows: 3, full: true, show: isExisting },
          { id: 'p3_how', num: '০৯', label: 'উদ্যোক্তা কীভাবে আলোচ্য ব্যবসায়ের সঙ্গে জড়িত হয়েছেন', type: 'textarea', rows: 3, full: true, show: isExisting },
          { id: 'p3_invest', num: '১০', label: 'ব্যবসার সঙ্গে সম্পর্কিত মোট বিনিয়োগের পরিমাণ (টাকা)', type: 'money', show: isExisting },
          { id: 'p3_raw', num: '১১', label: 'কাঁচামালের উৎস', help: 'প্রযোজ্য ক্ষেত্রে বিস্তারিত লিখুন', type: 'textarea', rows: 3, full: true, show: isExisting },
          { id: 'p3_area', num: '১২', label: 'পণ্য/সেবা বিপণন এলাকা', full: true, show: isExisting },
          { id: 'p3_compete', num: '১৩', label: 'যে পণ্য/সেবা বিক্রয় করা হয়, বর্তমানে বাজারে তার অবস্থান', help: 'কমপক্ষে ৩টি সম্ভাব্য প্রতিযোগী প্রতিষ্ঠানের তথ্যসহ', type: 'textarea', rows: 5, full: true, show: isExisting },
          { id: 'p3_risk', num: '১৪', label: 'বিদ্যমান ব্যবসায় পরিচালনায় সমস্যাসমূহ, ঝুঁকিসমূহ এবং ঝুঁকিসমূহ মোকাবেলায় পরিকল্পনা', type: 'textarea', rows: 4, full: true, show: isExisting },
          { id: 'p3_staff_total', num: '১৫', label: 'কর্মীর সংখ্যা — মোট (জন)', type: 'tel', digits: true, show: isExisting },
          { id: 'p3_staff_women', num: '১৫', label: 'তন্মধ্যে নারী (জন)', type: 'tel', digits: true, show: isExisting },
          { id: 'p3_expand', num: '১৬', label: 'চলমান ব্যবসায় সম্প্রসারণসহ কর্মী বাড়ানোর কোনো পরিকল্পনা রয়েছে কিনা; থাকলে বিবরণ', type: 'textarea', rows: 5, full: true, show: isExisting },
        ] },
      ],
    },
    {
      id: 'finance', title: 'অর্থায়ন পরিকল্পনা', part: 'পার্ট-৪', icon: 'wallet',
      desc: 'মূলধন, আবেদনকৃত অর্থ ও খাতভিত্তিক ব্যয় বিভাজন',
      groups: [
        { title: 'ক. অর্থায়ন প্যাকেজ', fields: [
          { id: 'f_total', num: '০১', label: 'প্রয়োজনীয় মোট মূলধনের পরিমাণ', req: true, type: 'money' },
          { id: 'f_own', num: '০২', label: 'নিজস্ব বিনিয়োগ (যদি থাকে)', type: 'money' },
          { id: 'f_req', num: '০৩', label: 'আবেদনকৃত অর্থায়নের পরিমাণ', req: true, type: 'money' },
        ] },
        { title: 'খ. খাতভিত্তিক ব্যয় বিভাজন (প্রযোজ্য ঘরসমূহ পূরণীয়)', fields: [
          { id: 'expenses', type: 'expenses', full: true },
        ] },
      ],
    },
    {
      id: 'others', title: 'অন্যান্য ও ঘোষণা', part: 'পার্ট-৫', icon: 'badge-check',
      desc: 'অন্যান্য তথ্য, ঘোষণা ও সংযুক্তির তালিকা',
      groups: [
        { title: 'পার্ট-৫: অন্যান্য তথ্য', fields: [
          { id: 'disab', num: '০১', label: 'শারীরিক প্রতিবন্ধকতা আছে কিনা', req: true, type: 'radio', opts: YES_NO },
          { id: 'disab_type', num: '০১', label: 'প্রতিবন্ধকতার ধরন', show: (d) => d.disab === 'হ্যাঁ' },
          { id: 'ethnic', num: '০২', label: 'ক্ষুদ্র নৃগোষ্ঠীভুক্ত কিনা', req: true, type: 'radio', opts: YES_NO },
          { id: 'other', num: '০৩', label: 'অন্যান্য', full: true },
        ] },
        { title: 'ঘোষণা', fields: [
          { id: 'declare', label: 'ঘোষণা', type: 'declare', req: true, full: true },
        ] },
      ],
    },
  ];

  // Example placeholder for every field that doesn't define its own `ph`.
  const EXAMPLES = {
    father: 'যেমন: মোঃ আব্দুল কাদের', mother: 'যেমন: মোসাম্মৎ রহিমা খাতুন',
    spouse_name: 'যেমন: সাবরিনা আক্তার', spouse_nid: 'যেমন: ১৯৯৮২৬১২৩৪৫৬৭',
    phone_alt: 'যেমন: ০১৮XXXXXXXX',
    training: 'যেমন: যুব উন্নয়ন অধিদপ্তর, গবাদিপশু পালন ও খামার ব্যবস্থাপনা, ৩ মাস, ২০২৩',
    experience: 'যেমন: ২০২১ থেকে পারিবারিক মুদি দোকানে হিসাব ও বিক্রয়ের কাজ (৩ বছর)',
    bank_name: 'যেমন: সোনালী ব্যাংক পিএলসি', bank_branch: 'যেমন: সাভার শাখা', bank_acc_no: 'যেমন: ১২৩৪৫৬৭৮৯০১২৩',
    pre_house: 'যেমন: বাড়ি নং ১২, মিয়া বাড়ি', pre_road: 'যেমন: রোড ৩, পূর্বপাড়া', pre_post: 'যেমন: সাভার-১৩৪০', pre_thana: 'যেমন: সাভার', pre_district: 'যেমন: ঢাকা',
    per_house: 'যেমন: বাড়ি নং ৫, খান বাড়ি', per_road: 'যেমন: গ্রাম: চরপাড়া', per_post: 'যেমন: ধামরাই-১৩৫০', per_thana: 'যেমন: ধামরাই', per_district: 'যেমন: ঢাকা',
    p2_idea: 'যেমন: গ্রামে ৫টি উন্নত জাতের গাভী নিয়ে একটি দুগ্ধ খামার স্থাপন করা হবে। উৎপাদিত দুধ স্থানীয় মিষ্টির দোকানে সরবরাহ করা হবে এবং গোবর থেকে জৈব সার তৈরি করে বিক্রি করা হবে…',
    p2_buyers: 'যেমন: স্থানীয় মিষ্টির দোকান, চা দোকান ও পরিবার',
    p2_type_desc: 'যেমন: দুগ্ধ উৎপাদন ও জৈব সার তৈরি',
    p2_location: 'যেমন: গ্রাম: বিলামালিয়া, ইউনিয়ন: বিলামালিয়া, উপজেলা: সাভার',
    p2_product: 'যেমন: আমদানির বিকল্প পণ্য (গুঁড়া দুধের বিকল্প)',
    p2_raw: 'যেমন: স্থানীয় খড়, ঘাস ও ফিড মিল',
    p2_risk: 'যেমন: গবাদিপশুর রোগ — নিয়মিত টিকা ও পশু চিকিৎসকের পরামর্শ নেওয়া হবে',
    p2_emp_total: 'যেমন: ৩', p2_emp_women: 'যেমন: ১',
    p2_compete: 'যেমন:\n১. করিম ডেইরি ফার্ম — ১০টি গাভী, দুধ ৮০ টাকা/লিটার\n২. আল-আমিন খামার — ৬টি গাভী\n৩. মিল্কভিটা সংগ্রহ কেন্দ্র',
    p3_name: 'যেমন: রাকিব এন্টারপ্রাইজ', p3_type_desc: 'যেমন: হাতে তৈরি পাটের ব্যাগ উৎপাদন',
    p3_license_no: 'যেমন: TRAD/DNCC/123456/2024',
    p3_price: 'যেমন: প্রতি ব্যাগ ২৫০ টাকা; প্রতি ডজন ২,৮০০ টাকা',
    p3_cost: 'যেমন: কাঁচামাল ৪০,০০০; মজুরি ২০,০০০; দোকান ভাড়া ৫,০০০; বিদ্যুৎ ২,০০০ টাকা',
    p3_how: 'যেমন: পারিবারিক ব্যবসা, ২০২০ সাল থেকে নিজে পরিচালনা করছি',
    p3_invest: 'যেমন: ৩০০০০০', p3_raw: 'যেমন: স্থানীয় পাট বাজার', p3_area: 'যেমন: সাভার, ধামরাই ও ঢাকা শহর',
    p3_compete: 'যেমন:\n১. সোনালী আঁশ হ্যান্ডিক্রাফটস\n২. জুট লাইফ\n৩. স্থানীয় হাটের বিক্রেতারা',
    p3_risk: 'যেমন: কাঁচামালের দাম বৃদ্ধি — আগাম মৌসুমে মজুত করা হবে',
    p3_staff_total: 'যেমন: ৫', p3_staff_women: 'যেমন: ৩',
    p3_expand: 'যেমন: নতুন সেলাই মেশিন কিনে আরও ৪ জন নারী কর্মী নিয়োগ করা হবে',
    f_total: 'যেমন: ৫০০০০০', f_own: 'যেমন: ১০০০০০', f_req: 'যেমন: ৪০০০০০',
    disab_type: 'যেমন: দৃষ্টি প্রতিবন্ধী', other: 'যেমন: প্রযোজ্য নয়',
  };
  // per-row example descriptions for the expense table (index 1–12)
  const EXPENSE_EX = ['যেমন: দুধ দোহন যন্ত্র', 'যেমন: গাভী ক্রয় (৫টি)', 'যেমন: খাদ্য ও ওষুধ (৩ মাস)', 'যেমন: নমুনা পণ্য তৈরি', 'যেমন: লেবেল ছাপা', 'যেমন: ট্রেড লাইসেন্স', 'যেমন: ফেসবুক বিজ্ঞাপন', 'যেমন: ২ জন কর্মী (৩ মাস)', 'যেমন: ভ্যান ভাড়া', 'যেমন: স্মার্টফোন ও ইন্টারনেট', 'যেমন: খামার ব্যবস্থাপনা কোর্স', 'যেমন: শেড নির্মাণ'];
  STEPS.forEach((s) => s.groups.forEach((g) => g.fields.forEach((f) => { if (!f.ph && EXAMPLES[f.id]) f.ph = EXAMPLES[f.id]; })));

  function addrFields(p, num, title) {
    const show = p === 'per' ? (d) => !d.per_same : undefined;
    return [
      { id: p + '_house', num, label: title + ' — বাড়ি/মহল্লার নং ও নাম', sub: 'বাড়ি/মহল্লার নং ও নাম', req: true, show },
      { id: p + '_road', num, label: title + ' — রোড নং/ এলাকা/ গ্রামের নাম', sub: 'রোড নং/ এলাকা/ গ্রামের নাম', req: true, show },
      { id: p + '_post', num, label: title + ' — ডাকঘর ও পোস্ট কোড', sub: 'ডাকঘর ও পোস্ট কোড', req: true, show },
      { id: p + '_thana', num, label: title + ' — থানা/উপজেলা', sub: 'থানা/উপজেলা', req: true, show },
      { id: p + '_district', num, label: title + ' — জেলা', sub: 'জেলা', req: true, show },
      { id: p + '_division', num, label: title + ' — বিভাগ', sub: 'বিভাগ', req: true, type: 'select', opts: DIVISIONS, show },
    ];
  }

  // ---------- derived values ----------
  const getVal = (d, id) => {
    if (id.startsWith('per_') && id !== 'per_same' && d.per_same) return d['pre_' + id.slice(4)] || '';
    return d[id] ?? '';
  };

  function expensesTotal(d) {
    let sum = 0, any = false;
    for (let i = 1; i <= 12; i++) {
      const n = parseNum(d['e' + i + '_amt']);
      if (n != null) { sum += n; any = true; }
    }
    return any ? sum : null;
  }

  function allFields() {
    const out = [];
    STEPS.forEach((s, si) => s.groups.forEach((g) => g.fields.forEach((f) => out.push({ ...f, step: si, groupShow: g.show }))));
    return out;
  }

  function isEmpty(d, f) {
    if (f.type === 'declare') return !d.declare;
    if (f.type === 'triple') return !d[f.id + '_m'] && !d[f.id + '_q'] && !d[f.id + '_y'];
    if (f.type === 'expenses') return false;
    return !String(getVal(d, f.id) || '').trim();
  }

  function visible(d, f) {
    if (f.groupShow && !f.groupShow(d)) return false;
    if (f.show && !f.show(d)) return false;
    return true;
  }

  function missing(d) {
    return allFields().filter((f) => f.req && visible(d, f) && isEmpty(d, f)).map((f) => ({
      id: f.id, step: f.step,
      label: [f.num, f.label.includes(' — ') ? f.label : f.label + (f.sub && f.type !== 'radio' && !f.label.includes(f.sub) ? ' — ' + f.sub : '')].filter(Boolean).join(' '),
    }));
  }

  function progress(d) {
    const req = allFields().filter((f) => f.req && visible(d, f));
    const done = req.filter((f) => !isEmpty(d, f)).length;
    return { done, total: req.length, pct: req.length ? Math.round((done / req.length) * 100) : 0 };
  }

  function stepProgress(d, si) {
    const req = allFields().filter((f) => f.step === si && f.req && visible(d, f));
    const filled = allFields().filter((f) => f.step === si && visible(d, f) && f.type !== 'expenses' && !isEmpty(d, f)).length;
    const done = req.filter((f) => !isEmpty(d, f)).length;
    return { done, total: req.length, filled, complete: req.length > 0 && done === req.length };
  }

  window.Schema = {
    STEPS, EXPENSE_HEADS, EXPENSE_EX, FUND_SRC, DEADLINE,
    toBn, toEn, parseNum, money, groupBD, ageAt, fmtDate, countWords,
    getVal, expensesTotal, allFields, missing, progress, stepProgress, visible, isEmpty,
  };
})();
