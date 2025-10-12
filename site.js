/* =====================================================
   基础设置 & I18N
   ===================================================== */

   const DEFAULT_LOCALE = 'zh-HK';

   /* ---------- Locale ---------- */
   function getLocale(){
     const saved = localStorage.getItem('glowon-locale') || localStorage.getItem('dordor-locale');
     return saved === 'en' ? 'en' : DEFAULT_LOCALE;
   }
   function setLocale(lc){
     const v = lc === 'en' ? 'en' : DEFAULT_LOCALE;
     localStorage.setItem('glowon-locale', v);
     localStorage.removeItem('dordor-locale');
     applyI18N();
     window.dispatchEvent(new CustomEvent('locale-changed'));
   }
   
   /* ---------- I18N 文案 ---------- */
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
   
   /* ---------- 路由占位（与文件名一致） ---------- */
   const ROUTES = {
     preorder: 'preorder.html',
     instock:  'instock.html',
     service:  'buyagent.html'
   };
   
   function wireNavLinks(){
     document.querySelectorAll('[data-route]').forEach(a=>{
       const key = a.getAttribute('data-route');
       if (ROUTES[key]) a.setAttribute('href', ROUTES[key]);
     });
   }
   
   /* ---------- 应用 i18n & 页脚联动 ---------- */
   function applyI18N(){
     const lc = getLocale();
     document.documentElement.lang = lc;
   
     const dict = I18N[lc];
     [
       'brand','nav_preorder','nav_instock','nav_service','view_all',
       'section_preorder','section_instock','rights',
       'terms','privacy','returns','process','contact'
     ].forEach(k=>{
       document.querySelectorAll(`[data-i18n="${k}"]`).forEach(el=>{
         el.textContent = dict[k];
       });
     });
   
     const label = document.getElementById('langLabel');
     if (label) label.textContent = (lc === 'en') ? 'English' : '繁體中文';
   
     const y = document.getElementById('year');
     if (y) y.textContent = new Date().getFullYear();
   
     const zhRow = document.querySelector('.foot-row.zh');
     const enRow = document.querySelector('.foot-row.en');
     if (zhRow && enRow){
       if (lc === 'en'){ zhRow.style.display='none'; enRow.style.display='flex'; }
       else { zhRow.style.display='flex'; enRow.style.display='none'; }
     }
   }
   
   /* ---------- 语言下拉 ---------- */
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
         setLocale(e.currentTarget.getAttribute('data-lc'));
         close();
       });
     });
     document.addEventListener('click', close);
   }
   
   /* ---------- 移动端「更多」菜单 ---------- */
   (function () {
     const moreBtn  = document.getElementById('moreBtn');
     const moreMenu = document.getElementById('moreMenu');
     if (!moreBtn || !moreMenu) return;
   
     function openMenu() {
       moreMenu.hidden = false;
       moreBtn.setAttribute('aria-expanded', 'true');
     }
     function closeMenu() {
       moreMenu.hidden = true;
       moreBtn.setAttribute('aria-expanded', 'false');
     }
     moreBtn.addEventListener('click', (e) => {
       e.stopPropagation();
       if (moreMenu.hidden) openMenu(); else closeMenu();
     });
     document.addEventListener('click', (e) => {
       if (!moreMenu.hidden && !moreMenu.contains(e.target) && e.target !== moreBtn) closeMenu();
     });
   
     moreMenu.querySelectorAll('[data-set-lc]').forEach(btn => {
       btn.addEventListener('click', () => {
         setLocale(btn.getAttribute('data-set-lc'));
         closeMenu();
       });
     });
   
     const ms = document.getElementById('moreSearch');
     if (ms) ms.addEventListener('click', (e) => {
       e.preventDefault();
       closeMenu();
       window.scrollTo({ top: 0, behavior: 'smooth' });
     });
   })();
   
   /* ---------- DOM Ready ---------- */
   document.addEventListener('DOMContentLoaded', ()=>{
     wireNavLinks();
     applyI18N();
     setupLangDropdown();
   });
   
   /* =====================================================
      商品数据加载与渲染（从 products.json 读取）
      ===================================================== */
   
   // 小工具：按候选键取值
   function pick(o, keys, def='') {
     for (const k of keys) {
       if (o && o[k] !== undefined && o[k] !== null && String(o[k]).trim() !== '') return o[k];
     }
     return def;
   }
   
   // 构造图片地址；缺省用 id.png；加载失败再试 .PNG
   function buildImg(p) {
     const explicit = pick(p, ['img', 'image', 'image_url']);
     const idLike   = String(pick(p, ['id', 'image_id', 'img_id'], '')).trim();
     const base     = explicit || (idLike ? `Archive/Untitled_design/${idLike}.png` : '');
     return base;
   }
   
   /* ---------- 兼容加载：根数组 or { items: [...] }；路径双探测 ---------- */
   async function fetchProducts() {
     const cacheBust = 'ts=' + Date.now();
   
     // 先尝试与页面同层的 products.json（B 情况通常可用）
     let res = await fetch('./products.json?' + cacheBust).catch(()=>null);
     if (!res || !res.ok) {
       // 兜底：再尝试 /frontend/products.json（若页面在仓库根而文件在 frontend/ 里）
       res = await fetch('./frontend/products.json?' + cacheBust).catch(()=>null);
     }
     if (!res || !res.ok) {
       const code = res ? res.status : 'NETWORK';
       throw new Error('products.json load failed: ' + code);
     }
   
     const raw = await res.json();
     // 兼容两种结构
     const data = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.items) ? raw.items : []);
     return data;
   }
   
   window.loadProducts = async function () {
     if (window.PRODUCTS) return window.PRODUCTS;
     const arr = await fetchProducts();
   
     window.PRODUCTS = arr.map(raw => {
       const id        = String(pick(raw, ['id', 'ID', 'sku'], '')).trim();
       const category  = String(pick(raw, ['category', 'cat', 'type'], '')).toLowerCase();
       const title_zh  = pick(raw, ['title_zh','name_zh','title_cn','name_cn'], '');
       const title_en  = pick(raw, ['title_en','name_en'], '');
       const price     = pick(raw, ['price_hkd','price','hkd'], null);
       const desc_zh   = pick(raw, ['desc_zh','description_zh','details_zh','content_zh'], '');
       const desc_en   = pick(raw, ['desc_en','description_en','details_en','content_en'], '');
       const img       = buildImg({ ...raw, id });
   
       let price_text = (price || price === 0)
         ? ('HK$' + (Number(price) % 1 ? Number(price) : parseInt(price)))
         : (getLocale() === 'en' ? 'TBD' : '待定');
   
       return {
         ...raw,
         id, category, title_zh, title_en, desc_zh, desc_en,
         img, price_hkd: price, price_text
       };
     });
   
     return window.PRODUCTS;
   };
   
   // 图片 onerror 兜底：.png -> .PNG，仍失败就用占位
   function imgWithFallback(src, alt) {
     const esc = (s)=>String(s).replace(/"/g,'&quot;');
     return `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy"
         onerror="
           (function(img){
             if (!img.dataset.triedUpper) {
               img.dataset.triedUpper = '1';
               img.src = img.src.replace(/\.png($|\?)/i, '.PNG$1');
             } else {
               img.src = 'Archive/placeholder.png';
             }
           })(this)
         ">`;
   }
   
   // 卡片 HTML
   function cardHTML(p, lc) {
     const title = lc === 'en' ? (p.title_en || p.title_zh || '') : (p.title_zh || p.title_en || '');
     const imgEl = imgWithFallback(p.img, title);
     return `
       <a class="card" href="product.html?pid=${encodeURIComponent(p.id)}">
         <div class="thumb">${imgEl}</div>
         <div class="content">
           <div class="title">${title}</div>
           <div class="price">${p.price_text}</div>
         </div>
       </a>`;
   }
   
   // 渲染到容器（可传筛选函数）
   window.renderCardsInto = async function (selector, filterFn) {
     const lc = (getLocale && getLocale() === 'en') ? 'en' : 'zh';
     const list = await loadProducts();
     const items = typeof filterFn === 'function' ? list.filter(filterFn) : list;
     const html = items.map(p => cardHTML(p, lc)).join('') || `<div class="muted" data-i18n="empty_list">暫無商品</div>`;
     const el = document.querySelector(selector);
     if (el) el.innerHTML = html;
   };
   
   // 详情页渲染
   window.renderProductPage = async function () {
     const url = new URL(location.href);
     const pid = url.searchParams.get('pid');
     const lc  = (getLocale && getLocale() === 'en') ? 'en' : 'zh';
     const list = await loadProducts();
     const p = list.find(x => String(x.id) === String(pid));
     const notFound = lc === 'en' ? 'Product not found.' : '找不到此商品。';
   
     const host  = document.getElementById('product');
     const img   = document.getElementById('p-img');
     const title = document.getElementById('p-title');
     const price = document.getElementById('p-price');
     const desc  = document.getElementById('p-desc');
   
     if (!p) { if (host) host.innerHTML = `<p>${notFound}</p>`; return; }
   
     const theTitle = lc === 'en' ? (p.title_en || p.title_zh || '') : (p.title_zh || p.title_en || '');
     document.title = `${theTitle} · Glow On`;
   
     if (img) {
       img.src = p.img;
       img.alt = theTitle;
       img.onerror = function () {
         if (!img.dataset.triedUpper) {
           img.dataset.triedUpper = '1';
           img.src = img.src.replace(/\.png($|\?)/i, '.PNG$1');
         } else {
           img.src = 'Archive/placeholder.png';
         }
       };
     }
     if (title) title.textContent = theTitle;
     if (price) price.textContent = p.price_text;
   
     const rawDesc = lc === 'en'
       ? (p.desc_en || p.desc_zh || '')
       : (p.desc_zh || p.desc_en || '');
   
     if (desc) desc.innerHTML = /<\/(p|ul|ol|br)>/i.test(rawDesc)
         ? rawDesc
         : String(rawDesc).replace(/\n/g, '<br>');
   };
   