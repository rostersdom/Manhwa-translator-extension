(() => {
  'use strict';

  let settings = {
    translationEnabled: true, autoDetect: true, hoverEnabled: true,
    targetLang: 'ru', showOriginal: true, showRomanization: true,
    highlightOnHover: true, pinOnDoubleClick: true, cacheEnabled: true,
    showPinyin: true
  };

  let tooltip = null, translationTimeout = null, isPinned = false;
  let currentText = '', currentTranslation = '';
  let translationCache = new Map(), history = [];
  let isSelectingRegion = false, regionStart = null, regionOverlay = null;
  let tessWorker = null, tessReady = false;
  let pendingCapture = null;

  const CJK = /[\u4E00-\u9FFF\u3400-\u4DBF\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\u3040-\u309F\u30A0-\u30FF]/;
  const KOREAN = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/;
  const JP_HIRA = /[\u3040-\u309F]/;
  const JP_KATA = /[\u30A0-\u30FF]/;
  const CHINESE = /[\u4E00-\u9FFF\u3400-\u4DBF]/;

  // ==================== MANHWA DICTIONARY ====================
  const MANHWA_DICT = {
    // Chinese terms
    '前辈': 'старший', '后辈': 'младший', '师父': 'мастер', '弟子': 'ученик',
    '掌门': 'глава sect', '宗门': 'sect', '修炼': 'тренировка', '突破': 'прорыв',
    '境界': 'уровень', '实力': 'сила', '功法': 'техника', '丹药': 'пилюля',
    '灵石': 'камень духов', '法宝': 'сокровище', '飞剑': 'летающий меч',
    '渡劫': 'пройти испытание', '飞升': 'вос升ение', '轮回': 'реинкарнация',
    '因果': 'карма', '天道': 'небесный путь', '大道': 'великий путь',
    '修仙': 'бессмертие', '修真': 'истинная практика',
    '龙': 'дракон', '凤': 'феникс', '虎': 'тигр', '麒麟': 'цилинь',
    '妖': 'демон', '魔': 'демон', '鬼': 'призрак', '仙': 'бессмертный',
    '神': 'бог', '佛': 'будда', '圣': 'святой', '帝': 'император',
    '王': 'король', '将': 'генерал', '兵': 'солдат', '城': 'город',
    '国': 'страна', '天下': 'поднебесная', '江湖': 'мировое сообщество',
    '帮派': 'клан', '门派': 'секта', '家族': 'семья',
    // Common speech
    '你': 'ты', '您': 'вы', '小子': 'парень', '姑娘': 'девушка',
    '大人': 'лорд', '少爷': 'молодой хозяин', '小姐': 'миледи',
    '老爷': 'хозяин', '夫人': 'жена хозяина',
    '大哥': 'старший брат', '小弟': 'младший брат',
    // Actions
    '去死': 'умри', '找死': 'ищешь смерти', '受死': 'прими смерть',
    '找死吗': 'хочешь умереть?', '不想活了': 'жизнь надоела?',
    '滚': 'вали', '闭嘴': 'заткнись', '废物': 'никчёмный',
    '蠢货': 'идиот', '笨蛋': 'дурак',
    // Korean honorifics
    '님': '-nim (уважит.)', '씨': '-ssi (уважит.)', '군': '-gun (мужчина)',
    '양': '-yang (женщина)', '형': 'старший брат (м)', '누나': 'старшая сестра (м)',
    '오빠': 'старший брат (ж)', '언니': 'старшая сестра (ж)',
    '선생님': 'учитель', '스승님': 'мастер',
  };

  // ==================== PINYIN ====================
  const PINYIN = {
    '你':'nǐ','我':'wǒ','他':'tā','好':'hǎo','是':'shì','的':'de','了':'le',
    '在':'zài','有':'yǒu','这':'zhè','那':'nà','不':'bù','也':'yě','就':'jiù',
    '都':'dōu','会':'huì','要':'yào','来':'lái','说':'shuō','看':'kàn','想':'xiǎng',
    '大':'dà','小':'xiǎo','人':'rén','天':'tiān','日':'rì','月':'yuè','水':'shuǐ',
    '火':'huǒ','山':'shān','花':'huā','爸':'bà','妈':'mā','中':'zhōng','国':'guó',
    '美':'měi','语':'yǔ','文':'wén','字':'zì','书':'shū','吃':'chī','走':'zǒu',
    '做':'zuò','用':'yòng','给':'gěi','开':'kāi','买':'mǎi','新':'xīn','高':'gāo',
    '快':'kuài','慢':'màn','早':'zǎo','晚':'wǎn','冷':'lěng','热':'rè','真':'zhēn',
    '对':'duì','错':'cuò','爱':'ài','喜欢':'xǐhuān','谢谢':'xièxiè','你好':'nǐhǎo',
    '朋友':'péngyǒu','工作':'gōngzuò','时间':'shíjiān','现在':'xiànzài',
    '知道':'zhīdào','什么':'shénme','怎么':'zěnme','哪里':'nǎlǐ','这里':'zhèlǐ',
    '没有':'méiyǒu','可以':'kěyǐ','好的':'hǎo de','已经':'yǐjīng','正在':'zhèngzài',
    '个月':'gè yuè','半年':'bàn nián','之后':'zhī hòu','以后':'yǐ hòu',
    '前世':'qián shì','今生':'jīn shēng','来世':'lái shì',
    '命运':'mìng yùn','缘分':'yuán fèn','因果':'yīn guǒ',
    '修炼':'xiū liàn','突破':'tū pò','境界':'jìng jiè',
    '力量':'lì liàng','速度':'sù dù','智慧':'zhì huì',
    '战斗':'zhàn dòu','胜利':'shèng lì','失败':'shī bài',
    '师父':'shī fu','弟子':'dì zǐ','师兄':'shī xiōng',
    '前辈':'qián bèi','后辈':'hòu bèi','掌门':'zhǎng mén',
  };

  // ==================== KOREAN HONORIFICS ====================
  const HONORIFICS = {
    '님': '', '씨': '', '군': '', '양': '',
    '형': 'старший брат', '누나': 'старшая сестра',
    '오빠': 'старший брат', '언니': 'старшая сестра',
    '선생님': 'учитель', '스승님': 'мастер',
    '아저씨': 'дядя', '아줌마': 'тётя',
    '할아버지': 'дедушка', '할머ني': 'бабушка',
    '오빠': 'старший брат (обращение ж.)',
    '형': 'старший брат (обращение м.)',
  };

  // ==================== INIT ====================
  function init() {
    loadSettings(); loadCache(); loadHistory();
    createTooltip(); createRegionSelector(); bindEvents(); injectStyles();
    initTesseract();
  }

  async function initTesseract() {
    if (typeof Tesseract === 'undefined') { console.log('[MT] Tesseract NOT loaded'); return; }
    try {
      console.log('[MT] Creating Tesseract worker...');
      tessWorker = await Tesseract.createWorker('chi_sim+chi_tra+jpn+kor', 1, {
        logger: m => { if (m.status==='recognizing text') console.log('[MT] OCR:', Math.round(m.progress*100)+'%'); }
      });
      tessReady = true;
      console.log('[MT] Tesseract READY');
    } catch(e) { console.error('[MT] Tesseract init failed:', e); }
  }

  // ==================== STYLES ====================
  function injectStyles() {
    const s = document.createElement('style');
    s.textContent = `
      .mh-hl { outline: 2px solid rgba(233,69,96,0.6) !important; outline-offset: 2px !important; }
      #manhwa-translator-tooltip {
        position: fixed !important; z-index: 2147483647 !important;
        background: linear-gradient(145deg, #1e1e2e, #181825) !important;
        color: #cdd6f4 !important; padding: 0 !important; border-radius: 12px !important;
        font-size: 14px !important; line-height: 1.5 !important; max-width: 480px !important;
        min-width: 200px !important; word-wrap: break-word !important;
        box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(233,69,96,0.3) !important;
        pointer-events: auto !important; font-family: 'Segoe UI', system-ui, sans-serif !important;
        overflow: hidden !important; animation: ms 0.2s cubic-bezier(0.16,1,0.3,1) !important;
      }
      @keyframes ms { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
      .mh-h { background: rgba(233,69,96,0.12); padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between; gap: 8px; }
      .mh-hl2 { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #a6adc8; flex-wrap: wrap; }
      .mh-t { background: rgba(233,69,96,0.25); color: #e94560; padding: 3px 10px; border-radius: 4px; font-weight: 600; font-size: 10px; }
      .mh-s { background: rgba(137,180,250,0.15); color: #89b4fa; padding: 2px 8px; border-radius: 4px; font-size: 9px; }
      .mh-c { background: rgba(166,227,161,0.15); color: #a6e3a1; padding: 2px 8px; border-radius: 4px; font-size: 9px; }
      .mh-d { background: rgba(249,226,175,0.15); color: #f9e2af; padding: 2px 8px; border-radius: 4px; font-size: 9px; }
      .mh-bs { display: flex; gap: 4px; }
      .mh-b { background: rgba(255,255,255,0.06); border: none; color: #a6adc8; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
      .mh-b:hover { background: rgba(233,69,96,0.25); color: #e94560; }
      .mh-b.ok { background: rgba(166,227,161,0.2); color: #a6e3a1; }
      .mh-bd { padding: 14px; }
      .mh-o { font-size: 12px; color: #6c7086; margin-bottom: 10px; padding: 8px 12px; background: rgba(0,0,0,0.25); border-radius: 8px; border-left: 3px solid #e94560; word-break: break-word; max-height: 80px; overflow-y: auto; }
      .mh-py { font-size: 11px; color: #89b4fa; margin-bottom: 8px; padding: 4px 10px; background: rgba(137,180,250,0.08); border-radius: 6px; }
      .mh-r { font-size: 11px; color: #89b4fa; margin-bottom: 10px; padding: 4px 10px; background: rgba(137,180,250,0.08); border-radius: 6px; }
      .mh-tr { font-size: 15px; color: #cdd6f4; font-weight: 500; line-height: 1.6; padding: 8px 0; }
      .mh-f { padding: 8px 14px; background: rgba(0,0,0,0.15); border-top: 1px solid rgba(255,255,255,0.04); font-size: 10px; color: #585b70; }
      .mh-ld { padding: 18px; text-align: center; color: #6c7086; display: flex; flex-direction: column; align-items: center; gap: 10px; }
      .mh-sp { width: 28px; height: 28px; border: 3px solid rgba(233,69,96,0.15); border-top-color: #e94560; border-radius: 50%; animation: msp 0.8s linear infinite; }
      @keyframes msp { to { transform: rotate(360deg); } }
      .mh-pr { font-size: 12px; color: #a6adc8; }
      .mh-n { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%) translateY(20px); background: linear-gradient(135deg, #e94560, #c73e54); color: #fff; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 500; z-index: 2147483647; box-shadow: 0 8px 30px rgba(233,69,96,0.4); opacity: 0; transition: all 0.3s ease; pointer-events: none; }
      .mh-n.show { opacity: 1; transform: translateX(-50%) translateY(0); }
      .mh-rg { position: fixed; z-index: 2147483646; border: 2px dashed rgba(233,69,96,0.9); background: rgba(233,69,96,0.08); pointer-events: none; backdrop-filter: blur(1px); }
    `;
    document.head.appendChild(s);
  }

  // ==================== SETTINGS/CACHE/HISTORY ====================
  function loadSettings() {
    try { chrome.storage.sync.get(settings, s => { if (s) settings = Object.assign({}, settings, s); }); } catch(e) {}
  }
  function loadCache() {
    try { const s = localStorage.getItem('mt_c'); if (s) translationCache = new Map(Object.entries(JSON.parse(s))); } catch(e) { translationCache = new Map(); }
  }
  function saveCache() {
    if (!settings.cacheEnabled) return;
    try { const o = {}; translationCache.forEach((v,k) => o[k]=v); localStorage.setItem('mt_c', JSON.stringify(o)); } catch(e) {}
  }
  function getC(text, lang) {
    const k = text+'|'+lang+'|'+settings.targetLang, c = translationCache.get(k);
    if (c && Date.now()-c.t < 3600000) return c.v;
    translationCache.delete(k); return null;
  }
  function setC(text, lang, v) {
    if (!settings.cacheEnabled) return;
    translationCache.set(text+'|'+lang+'|'+settings.targetLang, {v, t:Date.now()});
    if (translationCache.size > 200) translationCache.delete(translationCache.keys().next().value);
    saveCache();
  }
  function loadHistory() {
    try { const s = localStorage.getItem('mt_h'); if (s) history = JSON.parse(s).slice(0,100); } catch(e) { history=[]; }
  }
  function saveHist(o, t, l) {
    history.unshift({o:o.substring(0,200), t:t.substring(0,200), l, ts:Date.now()});
    history = history.slice(0,100);
    try { localStorage.setItem('mt_h', JSON.stringify(history)); } catch(e) {}
  }

  // ==================== TOOLTIP ====================
  function createTooltip() {
    tooltip = document.createElement('div');
    tooltip.id = 'manhwa-translator-tooltip';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);
    tooltip.addEventListener('mouseenter', () => clearTimeout(translationTimeout));
    tooltip.addEventListener('mouseleave', () => { if (!isPinned) hide(); });
    tooltip.addEventListener('click', e => {
      const b = e.target.closest('.mh-b');
      if (b) { e.stopPropagation(); doBtn(b); return; }
      if (!e.target.closest('.mh-bs')) { isPinned = !isPinned; upPin(); }
    });
  }
  function doBtn(b) {
    const a = b.dataset.a;
    if (a==='c') { navigator.clipboard.writeText(currentText+'\n'+currentTranslation).catch(()=>{}); b.classList.add('ok'); b.textContent='✓'; setTimeout(()=>{b.classList.remove('ok');b.textContent='📋';},1500); }
    else if (a==='s') speak(currentText);
    else if (a==='x') { isPinned=false; upPin(); hide(); }
  }
  function upPin() { tooltip.style.boxShadow = isPinned ? '0 20px 60px rgba(0,0,0,0.6), 0 0 0 2px #e94560' : ''; }
  function showLd(x, y, msg) {
    if (!tooltip) return;
    tooltip.innerHTML = '<div class="mh-ld"><div class="mh-sp"></div><div class="mh-pr">' + (msg||'...') + '</div></div>';
    pos(x, y); tooltip.style.display = 'block';
  }
  function showRes(o, t, l, img, cached, dict) {
    if (!tooltip) return;
    currentText = o; currentTranslation = t;
    const ln = {ko:'한국어',ja:'日本語',zh:'中文',ru:'Русский',en:'English'};
    const src = img ? '📷 OCR' : '📝';
    const rom = l==='ko' ? kr(o) : null;
    const py = (l==='zh' && settings.showPinyin) ? pin(o) : null;
    let h = '<div class="mh-h"><div class="mh-hl2">';
    h += '<span class="mh-t">'+(ln[l]||l)+' → '+(ln[settings.targetLang]||settings.targetLang)+'</span>';
    h += '<span class="mh-s">'+src+'</span>';
    if (cached) h += '<span class="mh-c">кэш</span>';
    if (dict) h += '<span class="mh-d">словарь</span>';
    h += '</div><div class="mh-bs">';
    h += '<button class="mh-b" data-a="s" title="Слушать">🔊</button>';
    h += '<button class="mh-b" data-a="c" title="Копировать">📋</button>';
    h += '<button class="mh-b" data-a="x" title="Закрыть">✕</button>';
    h += '</div></div><div class="mh-bd">';
    if (settings.showOriginal && o) h += '<div class="mh-o">'+esc(o)+'</div>';
    if (py) h += '<div class="mh-py">📖 '+py+'</div>';
    if (settings.showRomanization && rom) h += '<div class="mh-r">🔍 '+rom+'</div>';
    h += '<div class="mh-tr">'+esc(t)+'</div></div>';
    h += '<div class="mh-f">'+(isPinned?'📌 Закреплено':'Клик = закрепить | Esc = закрыть')+'</div>';
    tooltip.innerHTML = h; tooltip.style.display = 'block';
    saveHist(o, t, l);
  }
  function pos(x, y) {
    if (!tooltip) return;
    const r = tooltip.getBoundingClientRect(), vw = innerWidth, vh = innerHeight, m = 15;
    let l = x+m, t = y+m;
    if (l+r.width > vw-m) l = x-r.width-m;
    if (t+r.height > vh-m) t = y-r.height-m;
    tooltip.style.left = Math.max(m,l)+'px'; tooltip.style.top = Math.max(m,t)+'px';
  }
  function hide() { if (tooltip && !isPinned) { tooltip.style.display='none'; tooltip.innerHTML=''; } }

  // ==================== REGION ====================
  function createRegionSelector() {
    regionOverlay = document.createElement('div');
    regionOverlay.className = 'mh-rg';
    regionOverlay.style.display = 'none';
    document.body.appendChild(regionOverlay);
  }
  function startRegion() {
    isSelectingRegion=true;
    document.body.style.cursor='crosshair';
    notif('Выдели область с текстом на картинке');
    const onEsc = (e) => {
      if (e.key === 'Escape' && isSelectingRegion) {
        isSelectingRegion=false; regionStart=null;
        regionOverlay.style.display='none';
        document.body.style.cursor='';
        notif('Отменено');
        document.removeEventListener('keydown', onEsc);
      }
    };
    document.addEventListener('keydown', onEsc);
  }
  function onRDown(e) { if (!isSelectingRegion||e.button!==0) return; e.preventDefault(); regionStart={x:e.clientX,y:e.clientY}; }
  function onRMove(e) {
    if (!isSelectingRegion||!regionStart) return;
    const r = gR(regionStart.x,regionStart.y,e.clientX,e.clientY);
    Object.assign(regionOverlay.style,{left:r.l+'px',top:r.t+'px',width:r.w+'px',height:r.h+'px',display:'block'});
  }
  function onRUp(e) {
    if (!isSelectingRegion||!regionStart) return;
    const r = gR(regionStart.x,regionStart.y,e.clientX,e.clientY);
    regionStart=null; regionOverlay.style.display='none'; isSelectingRegion=false; document.body.style.cursor='';
    if (r.w>20 && r.h>20) {
      const tmp = document.createElement('div');
      Object.assign(tmp.style, {position:'fixed',zIndex:'2147483646',pointerEvents:'none',left:r.l+'px',top:r.t+'px',width:r.w+'px',height:r.h+'px',border:'3px solid #e94560',background:'rgba(233,69,96,0.15)',borderRadius:'4px',transition:'opacity 0.5s'});
      document.body.appendChild(tmp);
      setTimeout(()=>{tmp.style.opacity='0';},100);
      setTimeout(()=>tmp.remove(),600);
      ocrRegion(r);
    }
  }
  function gR(x1,y1,x2,y2) { return {l:Math.min(x1,x2),t:Math.min(y1,y2),w:Math.abs(x2-x1),h:Math.abs(y2-y1)}; }

  function ocrRegion(rect) {
    showLd(rect.l+rect.w/2, rect.t+rect.h+10, '📷 Скриншот области...');
    if (pendingCapture) { const d=pendingCapture; pendingCapture=null; processCrop(d,rect); return; }
    chrome.runtime.sendMessage({action:'captureScreen'}, resp => {
      if (!resp || resp.error || !resp.dataUrl) { showRes('Ошибка', resp?.error||'Используй Ctrl+Shift+R', 'zh', true); return; }
      processCrop(resp.dataUrl, rect);
    });
  }
  function processCrop(dataUrl, rect) {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'), ctx = c.getContext('2d');
      const sx = img.naturalWidth/innerWidth, sy = img.naturalHeight/innerHeight;
      const cropW = rect.w*sx, cropH = rect.h*sy;
      const scale = Math.max(1, 1500/Math.max(cropW, cropH));
      c.width = Math.round(cropW*scale); c.height = Math.round(cropH*scale);
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, rect.l*sx, rect.t*sy, cropW, cropH, 0, 0, c.width, c.height);
      console.log('[MT] Crop:', c.width+'x'+c.height);
      ocrTesseractWithFallback(c, rect.l+rect.w/2, rect.t+rect.h+10);
    };
    img.onerror = () => showRes('Ошибка', 'Не загрузился скриншот', 'zh', true);
    img.src = dataUrl;
  }

  // ==================== OCR ====================
  function ocrImage(el, x, y) {
    const tag = el.tagName ? el.tagName.toLowerCase() : '';
    if (tag === 'img') {
      el.scrollIntoView({ block:'nearest', behavior:'smooth' });
      el.style.outline='3px solid #e94560'; el.style.outlineOffset='4px';
      setTimeout(()=>{el.style.outline='';el.style.outlineOffset='';},2000);
      showLd(x,y,'📷 Подготовка...');
      setTimeout(()=>{const r=el.getBoundingClientRect(); captureCrop(r,x,y);},100);
      return;
    }
    if (tag === 'canvas') {
      try { const c=document.createElement('canvas'),ctx=c.getContext('2d'); c.width=el.width||el.offsetWidth; c.height=el.height||el.offsetHeight; ctx.drawImage(el,0,0); ocrTesseract(c,x,y); } catch(e) { showRes('Ошибка','Canvas','zh',true); }
      return;
    }
    const bg = getComputedStyle(el).backgroundImage;
    const m = bg.match(/url\(["']?(.+?)["']?\)/);
    if (m && m[1]) { el.style.outline='3px solid #e94560'; setTimeout(()=>{el.style.outline='';},2000); showLd(x,y,'📷 ...'); setTimeout(()=>{const r=el.getBoundingClientRect(); captureCrop(r,x,y);},100); }
  }
  function captureCrop(rect, x, y) {
    chrome.runtime.sendMessage({action:'captureScreen'}, resp => {
      if (!resp||resp.error||!resp.dataUrl) { showRes('Ошибка', resp?.error||'Ctrl+Shift+R', 'zh', true); return; }
      const img = new Image();
      img.onload = () => {
        const c=document.createElement('canvas'),ctx=c.getContext('2d');
        const sx=img.naturalWidth/window.innerWidth, sy=img.naturalHeight/window.innerHeight;
        const pad=30;
        const cropX=Math.max(0,(rect.left-pad)*sx), cropY=Math.max(0,(rect.top-pad)*sy);
        const cropW=Math.min(img.naturalWidth-cropX,(rect.width+pad*2)*sx);
        const cropH=Math.min(img.naturalHeight-cropY,(rect.height+pad*2)*sy);
        const scale=Math.max(2,1500/Math.max(cropW,cropH));
        c.width=Math.round(cropW*scale); c.height=Math.round(cropH*scale);
        ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
        ctx.drawImage(img,cropX,cropY,cropW,cropH,0,0,c.width,c.height);
        console.log('[MT] Crop:',cropW+'x'+cropH,'->',c.width+'x'+c.height);
        ocrTesseractWithFallback(c,x,y);
      };
      img.onerror = () => showRes('Ошибка','Не загрузился скриншот','zh',true);
      img.src = resp.dataUrl;
    });
  }
  async function ocrTesseractWithFallback(canvas, x, y) {
    if (!tessReady) { showRes('Tesseract не готов','Обнови страницу','zh',true); return; }
    showLd(x,y,'📷 Распознаём (original)...');
    try {
      const r=await tessWorker.recognize(canvas);
      const text=r.data.text.trim();
      console.log('[MT] OCR 1:',text||'(empty)');
      if(text&&text.length>0){showLd(x,y,'⏳ Переводим...');translate(text,true);return;}
    } catch(e){console.error('[MT] OCR err:',e);}
    showLd(x,y,'📷 Улучшаем контраст...');
    try {
      const p=preprocessCanvas(canvas);
      const r2=await tessWorker.recognize(p);
      const text2=r2.data.text.trim();
      console.log('[MT] OCR 2:',text2||'(empty)');
      if(text2&&text2.length>0){showLd(x,y,'⏳ Переводим...');translate(text2,true);return;}
    } catch(e){console.error('[MT] OCR err2:',e);}
    showRes('Нет текста','Tesseract не нашёл. Используй Ctrl+Shift+R','zh',true);
  }
  function preprocessCanvas(src) {
    const w=src.width,h=src.height;
    const c=document.createElement('canvas'); c.width=w; c.height=h;
    const ctx=c.getContext('2d'); ctx.drawImage(src,0,0);
    const img=ctx.getImageData(0,0,w,h); const d=img.data;
    for(let i=0;i<d.length;i+=4){const g=d[i]*0.299+d[i+1]*0.587+d[i+2]*0.114;d[i]=d[i+1]=d[i+2]=g;}
    const f=(259*(1.8*128+255))/(255*(259-1.8*128));
    for(let i=0;i<d.length;i+=4){d[i]=d[i+1]=d[i+2]=Math.max(0,Math.min(255,f*(d[i]-128)+128));}
    let sum=0,cnt=0; for(let i=0;i<d.length;i+=16){sum+=d[i];cnt++;}
    const th=(sum/cnt)*0.9;
    for(let i=0;i<d.length;i+=4){const v=d[i]>th?255:0;d[i]=d[i+1]=d[i+2]=v;}
    ctx.putImageData(img,0,0); return c;
  }
  async function ocrTesseract(canvas,x,y) {
    if (!tessReady) { showRes('Tesseract не готов','Обнови страницу','zh',true); return; }
    showLd(x,y,'📷 Распознаём...');
    try { const r=await tessWorker.recognize(canvas); const t=r.data.text.trim(); console.log('[MT] OCR:',t); if(t){showLd(x,y,'⏳ Переводим...');translate(t,true);} else showRes('Нет текста','','zh',true); } catch(e){showRes('Ошибка',e.message,'zh',true);}
  }

  // ==================== EVENTS ====================
  function bindEvents() {
    document.addEventListener('mouseover', onOver, true);
    document.addEventListener('mouseout', onOut, true);
    document.addEventListener('dblclick', onDbl);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onRDown);
    document.addEventListener('mousemove', onRMove);
    document.addEventListener('mouseup', onRUp);
    chrome.runtime.onMessage.addListener(msg => {
      if (msg.action==='updateSettings') settings=Object.assign({},settings,msg.settings);
      if (msg.action==='startRegionSelect') startRegion();
      if (msg.action==='startRegionSelectWithCapture') { pendingCapture=msg.dataUrl; startRegion(); }
      if (msg.action==='translateImage') { const img=document.querySelector('img[src="'+msg.srcUrl+'"]'); if(img){showLd(innerWidth/2,innerHeight/2,'📷 ...');ocrImage(img,innerWidth/2,innerHeight/2);} }
      if (msg.action==='translateSelection'&&msg.text&&CJK.test(msg.text)) { showLd(innerWidth/2,innerHeight/2,'⏳ ...');translate(msg.text,false); }
      if (msg.action==='clearHistory') { history=[];localStorage.removeItem('mt_h'); }
      if (msg.action==='exportHistory') expHist();
    });
  }
  function onOver(e) {
    if (!settings.translationEnabled||!settings.hoverEnabled||isPinned||isSelectingRegion) return;
    clearTimeout(translationTimeout);
    let el=e.target;
    for(let i=0;i<10&&el;i++){
      if(el.id==='manhwa-translator-tooltip')return;
      if(el.classList&&(el.classList.contains('mh-n')||el.classList.contains('mh-rg')))return;
      const tag=el.tagName?el.tagName.toLowerCase():'';
      if(tag==='img'||tag==='canvas'){if(settings.highlightOnHover)el.classList.add('mh-hl');showLd(e.clientX,e.clientY,'📷 ...');translationTimeout=setTimeout(()=>ocrImage(el,e.clientX,e.clientY),200);return;}
      const bg=getComputedStyle(el).backgroundImage;
      if(bg&&bg!=='none'&&bg.indexOf('url(')!==-1){if(settings.highlightOnHover)el.classList.add('mh-hl');showLd(e.clientX,e.clientY,'📷 ...');translationTimeout=setTimeout(()=>ocrImage(el,e.clientX,e.clientY),200);return;}
      const text=getTxt(el);
      if(text){if(settings.highlightOnHover)el.classList.add('mh-hl');const c=getC(text,dL(text));if(c)showRes(text,c,dL(text),false,true);else{showLd(e.clientX,e.clientY,'⏳ ...');translationTimeout=setTimeout(()=>translate(text,false),200);}return;}
      el=el.parentElement;
    }
  }
  function onOut(e){if(e.target.classList)e.target.classList.remove('mh-hl');if(e.relatedTarget&&tooltip&&tooltip.contains(e.relatedTarget))return;if(!isPinned&&!isSelectingRegion){clearTimeout(translationTimeout);hide();}}
  function onDbl(e){
    if(!settings.pinOnDoubleClick||isSelectingRegion)return;
    let el=e.target;
    for(let i=0;i<10&&el;i++){
      if(el.id==='manhwa-translator-tooltip')return;
      const tag=el.tagName?el.tagName.toLowerCase():'';
      if(tag==='img'||tag==='canvas'){showLd(e.clientX,e.clientY,'📷 ...');ocrImage(el,e.clientX,e.clientY);setTimeout(()=>{isPinned=true;upPin();},500);return;}
      const bg=getComputedStyle(el).backgroundImage;
      if(bg&&bg!=='none'&&bg.indexOf('url(')!==-1){showLd(e.clientX,e.clientY,'📷 ...');ocrImage(el,e.clientX,e.clientY);setTimeout(()=>{isPinned=true;upPin();},500);return;}
      const text=getTxt(el);
      if(text){showLd(e.clientX,e.clientY,'⏳ ...');translate(text,false);setTimeout(()=>{isPinned=true;upPin();},250);return;}
      el=el.parentElement;
    }
  }
  function onUp(e){if(isSelectingRegion)return;setTimeout(()=>{const s=window.getSelection(),t=s?s.toString().trim():null;if(t&&t.length>=1&&t.length<=300&&CJK.test(t)){const c=getC(t,dL(t));if(c)showRes(t,c,dL(t),false,true);else{showLd(e.clientX+10,e.clientY+10,'⏳ ...');translate(t,false);}}},30);}
  function onKey(e){
    if(e.key==='Escape'){if(isSelectingRegion){isSelectingRegion=false;regionStart=null;regionOverlay.style.display='none';document.body.style.cursor='';notif('Отменено');}isPinned=false;upPin();hide();}
    if(e.ctrlKey&&e.shiftKey&&e.key==='T'){e.preventDefault();settings.translationEnabled=!settings.translationEnabled;try{chrome.storage.sync.set({translationEnabled:settings.translationEnabled});}catch(e){}notif(settings.translationEnabled?'✓ Вкл':'✗ Выкл');}
    if(e.ctrlKey&&e.shiftKey&&e.key==='H'){e.preventDefault();settings.hoverEnabled=!settings.hoverEnabled;try{chrome.storage.sync.set({hoverEnabled:settings.hoverEnabled});}catch(e){}notif(settings.hoverEnabled?'✓ Наведение вкл':'✗ Наведение выкл');}
    if(e.ctrlKey&&e.shiftKey&&e.key==='R'){e.preventDefault();startRegion();}
  }

  // ==================== TEXT ====================
  function getTxt(el) {
    if(!el)return null;
    const tag=el.tagName?el.tagName.toLowerCase():'';
    if(['script','style','noscript','iframe','svg','path','img','canvas','video','audio','button','input','select','textarea'].includes(tag))return null;
    if(el.id==='manhwa-translator-tooltip')return null;
    let raw='';
    try{raw=(el.innerText||el.textContent||'').trim();}catch(e){return null;}
    if(!raw||!CJK.test(raw))return null;
    let c=raw.replace(/[\r\n]+/g,' ').replace(/\s+/g,' ').trim();
    if(c.length>500)c=c.substring(0,500);
    return c;
  }

  // ==================== TRANSLATE (IMPROVED) ====================
  async function translate(text, fromImg) {
    if (!text) return;
    const clean = text.replace(/\s+/g,' ').trim();
    if (!clean) return;
    const lim = clean.substring(0,500), lang = dL(lim);

    // Check cache first
    const cached = getC(lim, lang);
    if (cached) { showRes(lim, cached, lang, fromImg, true); return; }

    // Check dictionary for known terms
    const dictResult = dictLookup(lim, lang);
    if (dictResult) { setC(lim,lang,dictResult); showRes(lim, dictResult, lang, fromImg, false, true); return; }

    // Split long text into sentences for better translation
    const sentences = splitSentences(lim, lang);
    if (sentences.length > 1) {
      const translated = await translateSentences(sentences, lang);
      if (translated) { setC(lim,lang,translated); showRes(lim,translated,lang,fromImg,false); return; }
    }

    // Full text translation — try multiple APIs
    const result = await translateWithFallback(lim, lang);
    if (result) {
      const cleaned = postProcessTranslation(result, lang);
      setC(lim,lang,cleaned);
      showRes(lim, cleaned, lang, fromImg, false);
    } else {
      showRes(lim, 'Ошибка перевода. Проверьте соединение.', lang, fromImg, false);
    }
  }

  // Dictionary lookup for known manhwa terms
  function dictLookup(text, lang) {
    // Check if entire text is a known term
    if (MANHWA_DICT[text]) return MANHWA_DICT[text];

    // Check for known terms in text
    let result = text;
    let found = false;
    for (const [key, val] of Object.entries(MANHWA_DICT)) {
      if (result.includes(key)) {
        result = result.replace(new RegExp(esc(key), 'g'), val);
        found = true;
      }
    }

    // If we found and replaced some terms, but text has mostly CJK, use dict result
    if (found) {
      const remaining = (result.match(CJK) || []).length;
      if (remaining === 0) return result; // All translated via dict
    }

    return null; // Need API translation
  }

  // Split text into sentences
  function splitSentences(text, lang) {
    const delimiters = lang === 'zh' ? /[。！？!?]+/ : lang === 'ja' ? /[。！？!?]+/ : /[.!?]+/;
    const parts = text.split(delimiters).filter(s => s.trim().length > 0);
    return parts.length > 1 ? parts : [text];
  }

  // Translate sentences individually
  async function translateSentences(sentences, lang) {
    const results = [];
    for (const sent of sentences) {
      const trimmed = sent.trim();
      if (!trimmed) continue;
      const t = await translateWithFallback(trimmed, lang);
      if (t) results.push(postProcessTranslation(t, lang));
    }
    return results.length > 0 ? results.join(' ') : null;
  }

  // Main translation with API fallback chain
  async function translateWithFallback(text, lang) {
    const apis = [
      { name: 'Google', fn: googleT },
      { name: 'MyMemory', fn: mmT },
      { name: 'Google-zhCN', fn: (t, l) => googleT(t, 'zh-CN') },
    ];

    for (const api of apis) {
      try {
        const r = await api.fn(text, lang);
        if (r && r !== text && r.toUpperCase() !== text.toUpperCase()) {
          console.log('[MT] ' + api.name + ' success');
          return r;
        }
      } catch(e) {
        console.log('[MT] ' + api.name + ' failed:', e.message);
      }
    }
    return null;
  }

  // Google Translate with better parameters
  function googleT(text, sl) {
    return new Promise((resolve, reject) => {
      const src = settings.autoDetect ? 'auto' : sl;
      // Better Google Translate URL with more parameters
      const params = new URLSearchParams({
        client: 'gtx',
        sl: src,
        tl: settings.targetLang,
        dt: 't',  // translation
        dt: 'at', // alternate translations
        dt: 'bd', // dictionary
        dt: 'ex', // examples
        dt: 'md', // definitions
        dt: 'qc', // synonyms
        dt: 'rm', // transliteration
        q: text
      });
      fetch('https://translate.googleapis.com/translate_a/single?' + params.toString())
        .then(r => { if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
        .then(d => {
          if(d&&d[0]&&Array.isArray(d[0])) {
            const r=d[0].filter(i=>i&&i[0]).map(i=>i[0]).join('');
            r?resolve(r):reject(new Error('empty'));
          } else reject(new Error('bad'));
        })
        .catch(reject);
    });
  }

  // MyMemory with better validation
  function mmT(text, sl) {
    return new Promise((resolve, reject) => {
      const src = settings.autoDetect ? 'autodetect' : (sl==='zh' ? 'zh-CN' : sl);
      const url = 'https://api.mymemory.translated.net/get?q='+encodeURIComponent(text)+'&langpair='+src+'|'+settings.targetLang;
      fetch(url)
        .then(r => { if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
        .then(d => {
          if(d&&d.responseData&&d.responseData.translatedText) {
            const r=d.responseData.translatedText;
            // Validate translation is different from source
            if(r && r !== text && r.toUpperCase() !== text.toUpperCase() && !r.startsWith('MYMEMORY WARNING')) {
              resolve(r);
            } else reject(new Error('same'));
          } else reject(new Error('bad'));
        })
        .catch(reject);
    });
  }

  // Post-process translation for better quality
  function postProcessTranslation(text, lang) {
    let result = text;
    // Fix common artifacts
    result = result.replace(/\s+/g, ' ').trim();
    // Fix punctuation spacing
    result = result.replace(/\s+([.,!?;:])/g, '$1');
    // Fix quotes
    result = result.replace(/«\s+/g, '«').replace(/\s+»/g, '»');
    result = result.replace(/"\s+/g, '"').replace(/\s+"/g, '"');
    // Fix ellipsis
    result = result.replace(/\.\.\.\./g, '...');
    // Capitalize first letter if it's a sentence
    if (result.length > 0 && result[0] === result[0].toLowerCase()) {
      result = result[0].toUpperCase() + result.substring(1);
    }
    return result;
  }

  // Detect language
  function dL(t) {
    if(JP_HIRA.test(t)||(JP_KATA.test(t)&&!KOREAN.test(t)))return 'ja';
    if(KOREAN.test(t))return 'ko';
    return 'zh';
  }

  // ==================== PINYIN/ROM ====================
  function pin(t) {
    if(!t)return null;
    let r='',i=0;
    while(i<t.length){
      if(i<t.length-1){const tw=t[i]+t[i+1];if(PINYIN[tw]){r+=PINYIN[tw]+' ';i+=2;continue;}}
      const ch=t[i];
      if(PINYIN[ch])r+=PINYIN[ch]+' ';
      else if(CHINESE.test(ch))r+=ch+' ';
      i++;
    }
    return r.trim()||null;
  }
  function kr(t) {
    const iR=['g','kk','n','d','tt','r','m','b','pp','s','ss','','j','jj','ch','k','t','p','h'];
    const mR=['a','ae','ya','yae','eo','e','yeo','ye','o','wa','wae','oe','yo','u','wo','we','wi','yu','eu','ui','i'];
    const fR=['','g','k','n','n','n','d','l','l','m','m','l','l','l','l','l','m','p','p','s','s','s','j','ch','k','t','p','h'];
    let r='';
    for(let i=0;i<t.length;i++){
      const c=t.charCodeAt(i);
      if(c>=0xAC00&&c<=0xD7AF){const b=c-0xAC00;r+=(iR[Math.floor(b/588)]||'')+(mR[Math.floor((b%588)/28)]||'')+(fR[b%28]||'');}
      else r+=t[i];
    }
    return r;
  }

  // ==================== UTILS ====================
  function esc(t){const d=document.createElement('div');d.textContent=t;return d.innerHTML;}
  function speak(t){if(!('speechSynthesis' in window))return;const u=new SpeechSynthesisUtterance(t);u.lang=dL(t)==='ko'?'ko-KR':dL(t)==='ja'?'ja-JP':'zh-CN';u.rate=0.9;speechSynthesis.speak(u);}
  function notif(m){const o=document.querySelector('.mh-n');if(o)o.remove();const n=document.createElement('div');n.className='mh-n';n.textContent=m;document.body.appendChild(n);requestAnimationFrame(()=>n.classList.add('show'));setTimeout(()=>{n.classList.remove('show');setTimeout(()=>n.remove(),300);},2500);}
  function expHist(){
    if(!history.length){notif('Пусто');return;}
    let c='=== Manhwa Translator ===\n\n';
    history.forEach((h,i)=>{c+=(i+1)+'. ['+h.l+'] '+h.o+'\n   → '+h.t+'\n\n';});
    const b=new Blob([c],{type:'text/plain;charset=utf-8'}),u=URL.createObjectURL(b);
    const a=document.createElement('a');a.href=u;a.download='history_'+Date.now()+'.txt';a.click();
    URL.revokeObjectURL(u);notif('✓ Экспортировано');
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
