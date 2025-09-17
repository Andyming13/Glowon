const DEFAULT_LOCALE = 'zh-HK';
function getLocale(){
  const saved = localStorage.getItem('glowon-locale');
  return (saved === 'en') ? 'en' : 'zh-HK';
}
function setLocale(lc){
  const v = (lc === 'en') ? 'en' : 'zh-HK';
  localStorage.setItem('glowon-locale', v);
  applyI18N();
  window.dispatchEvent(new CustomEvent('locale-changed'));
}

const I18N = {
  'zh-HK': {
    brand:'Glow On',
    nav_preorder:'精選預購',
    nav_instock:'現貨專區',
    nav_service:'澳洲代購服務',
    view_all:'查看全部',
    section_preorder:'精選預購',
    section_instock:'現貨好物',
    rights:'版權所有',
    terms:'條款及細則',
    privacy:'私隱政策',
    returns:'退換貨政策',
    process:'購買流程',
    contact:'聯絡我們',
    empty_list:'暫無商品'
  },
  'en': {
    brand:'Glow On',
    nav_preorder:'Pre-Order',
    nav_instock:'In Stock',
    nav_service:'AUS Shopping Agent',
    view_all:'View all',
    section_preorder:'Featured Pre-Orders',
    section_instock:'In-Stock Picks',
    rights:'All Rights Reserved',
    terms:'Terms & Conditions',
    privacy:'Privacy Policy',
    returns:'Return & Exchange Policy',
    process:'Shopping Process',
    contact:'Contact Us',
    empty_list:'No products yet'
  }
};

// ===== Routes（与你的实际文件名一致）=====
const ROUTES = {
  preorder: 'preorder.html',
  instock:  'instock.html',
  service:  'buyagent.html'   // 代購頁是 buyagent.html
};

function wireNavLinks(){
  document.querySelectorAll('[data-route]').forEach(a=>{
    const key=a.getAttribute('data-route');
    if(ROUTES[key]) a.setAttribute('href', ROUTES[key]);
  });
}

// ===== 公共 i18n 应用 =====
function applyI18N(){
  const lc = getLocale();
  document.documentElement.lang = (lc === 'en') ? 'en' : 'zh-HK';

  const dict = I18N[lc];
  [
    'brand','nav_preorder','nav_instock','nav_service','view_all',
    'section_preorder','section_instock','rights','terms','privacy','returns','process','contact'
  ].forEach(k=>{
    document.querySelectorAll(`[data-i18n="${k}"]`).forEach(el=>{
      el.textContent = dict[k];
    });
  });

  const label = document.getElementById('langLabel');
  if(label) label.textContent = (lc === 'en') ? 'English' : '繁體中文';

  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
}

// ===== 语言下拉 =====
function setupLangDropdown(){
  const btn  = document.getElementById('langBtn');
  const menu = document.getElementById('langMenu');
  if(!btn || !menu) return;

  const close = ()=>{ menu.hidden = true; btn.setAttribute('aria-expanded','false'); };
  const open  = ()=>{ menu.hidden = false; btn.setAttribute('aria-expanded','true'); };

  btn.addEventListener('click', e=>{
    e.stopPropagation();
    if(menu.hidden) open(); else close();
  });
  menu.querySelectorAll('button[data-lc]').forEach(b=>{
    b.addEventListener('click', e=>{
      const lc = e.currentTarget.getAttribute('data-lc');
      setLocale(lc);
      close();
    });
  });
  document.addEventListener('click', close);
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', ()=>{
  wireNavLinks();
  applyI18N();
  setupLangDropdown();
});