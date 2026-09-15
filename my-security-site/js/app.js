// --- CONFIG & API ---
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzEs6TYK95CKK6bTPLH6dUgj-MC82wRHa_WKszWS-LyV4bJBmef9m4yWeh5hy72mJx0bQ/exec";
const SANITY_PROJECT_ID = 'mrqjlkyb';
const SANITY_DATASET = 'production';
const SANITY_API_VERSION = '2025-02-19';

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

// --- GLOBAL STATE ---
let state = { 
    currentPage: 'home',
    city: 'Тюмень',
    cart: JSON.parse(localStorage.getItem('uvb_cart')) || [], 
    banners: [],
    products: [], 
    contacts: [], 
    reviews: [], 
    blog: [],
    services: [],
    currentProduct: null,
    currentProdImages: [],
    currentProdImgIdx: 0,
    organizationName: null
};

// --- SPA ROUTER ---
function navigatePage(pageName, anchorId = null) {
    state.currentPage = pageName;
    
    // Toggle Views
    document.querySelectorAll('.page-view').forEach(view => view.classList.add('hidden'));
    const activeView = document.getElementById(`view-${pageName}`);
    if (activeView) activeView.classList.remove('hidden');

    // Update Header Nav Highlight
    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.className = "nav-tab px-4 py-2 rounded-full text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm transition";
    });
    const activeNavBtn = document.getElementById(`nav-btn-${pageName}`);
    if (activeNavBtn) {
        activeNavBtn.className = "nav-tab px-4 py-2 rounded-full text-sm font-bold text-brand-primary bg-white shadow-sm transition";
    } else if (pageName === 'product') {
        const catNav = document.getElementById('nav-btn-catalog');
        if (catNav) catNav.className = "nav-tab px-4 py-2 rounded-full text-sm font-bold text-brand-primary bg-white shadow-sm transition";
    }

    // Scroll Handling
    if (anchorId) {
        setTimeout(() => {
            const el = document.getElementById(anchorId);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Render specific components if needed
    if (pageName === 'catalog') renderCatalog();
    if (pageName === 'services') renderServices();
    if (pageName === 'home') renderHeroBanners();
}

function navigateCategoryTab(catQuery) {
    navigatePage('catalog');
    setTimeout(() => {
        const tabs = document.querySelectorAll('#categoryTabs button');
        for (let btn of tabs) {
            if (btn.innerText.toLowerCase().trim() === catQuery.toLowerCase().trim()) {
                btn.click();
                break;
            }
        }
    }, 150);
}

function scrollToElement(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// --- HERO BANNER SLIDER ---
let currentBannerIdx = 0;
let bannerInterval;

const PRIMARY_HERO_BANNER = {
    isPrimary: true,
    'Заголовок': 'Всё для вашего <br><span class="text-brand-primary">ДОМОФОНА</span>',
    'Подзаголовок': 'Собрали всё для вашего домофона в одном месте. От доставки ключей до современных систем безопасности',
    'Ссылка на картинку': 'https://i.ibb.co/SX1Xz6kL/Gemini-Generated-Image-cq44x8cq44x8cq44.jpg'
};

function getFilteredBanners() {
    let dynamic = (state.banners || []).filter(b => {
        const bCity = String(b['Город'] || '').trim();
        const matchCity = !bCity || bCity === 'Все города' || bCity === state.city;
        return matchCity && (b['Заголовок'] || b['Ссылка на картинку']);
    });
    return [PRIMARY_HERO_BANNER, ...dynamic];
}

function renderHeroBanners() {
    let validBanners = getFilteredBanners();
    if (currentBannerIdx >= validBanners.length) currentBannerIdx = 0;
    if (currentBannerIdx < 0) currentBannerIdx = validBanners.length - 1;

    const banner = validBanners[currentBannerIdx];
    const titleEl = document.getElementById('heroTitle');
    const subEl = document.getElementById('heroSubtitle');
    const imgEl = document.getElementById('heroImage');
    const decosEl = document.getElementById('heroExtraDecos');
    const dotsEl = document.getElementById('heroDots');
    const controlsEl = document.getElementById('heroControls');
    const counterEl = document.getElementById('heroCounter');

    if (!titleEl) return;

    titleEl.classList.add('opacity-0');
    subEl.classList.add('opacity-0');
    imgEl.classList.add('opacity-0');

    setTimeout(() => {
        titleEl.innerHTML = banner['Заголовок'] || '';
        subEl.innerText = banner['Подзаголовок'] || '';
        if (banner['Ссылка на картинку']) imgEl.src = banner['Ссылка на картинку'];

        if (decosEl) {
            if (banner.isPrimary) decosEl.classList.remove('hidden');
            else decosEl.classList.add('hidden');
        }

        titleEl.classList.remove('opacity-0');
        subEl.classList.remove('opacity-0');
        imgEl.classList.remove('opacity-0');
    }, 200);

    if (validBanners.length > 1) {
        dotsEl.innerHTML = validBanners.map((_, idx) => `
            <button onclick="currentBannerIdx = ${idx}; renderHeroBanners(); startBannerAutoPlay();" 
                class="h-2 rounded-full transition-all duration-300 ${idx === currentBannerIdx ? 'w-5 bg-brand-primary' : 'w-2 bg-gray-300 hover:bg-gray-400'}">
            </button>
        `).join('');
        counterEl.innerText = `${currentBannerIdx + 1} из ${validBanners.length}`;
        controlsEl.classList.remove('hidden');
    } else {
        controlsEl.classList.add('hidden');
    }
}

function nextBanner() { currentBannerIdx++; if (currentBannerIdx >= getFilteredBanners().length) currentBannerIdx = 0; renderHeroBanners(); startBannerAutoPlay(); }
function prevBanner() { currentBannerIdx--; if (currentBannerIdx < 0) currentBannerIdx = getFilteredBanners().length - 1; renderHeroBanners(); startBannerAutoPlay(); }
function startBannerAutoPlay() {
    clearInterval(bannerInterval);
    if (getFilteredBanners().length > 1) {
        bannerInterval = setInterval(() => {
            currentBannerIdx++;
            if (currentBannerIdx >= getFilteredBanners().length) currentBannerIdx = 0;
            renderHeroBanners();
        }, 6000);
    }
}

// --- CONSTRUCTOR STATE ---
let constrState = { zones: [], devices: [], floor: '', hasCamera: null };

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => { 
    loadDataSequentially(); 
    updateCartUI(); 
    setupPhoneMasks();

    window.addEventListener('scroll', () => {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (scrollTop / scrollHeight) * 100;
        document.getElementById('scrollProgress').style.width = scrolled + '%';
        
        const btn = document.getElementById('backToTop');
        if (scrollTop > 400) btn.classList.remove('opacity-0', 'translate-y-20');
        else btn.classList.add('opacity-0', 'translate-y-20');
    });
});

function toggleMobileMenu(e) { const m = document.getElementById('mobileMenu'); m.classList.toggle('hidden'); }
function closeMobileMenuOutside(e) { const m = document.getElementById('mobileMenu'); if(!m.classList.contains('hidden') && !e.target.closest('header')) m.classList.add('hidden'); }
function showToast() { const t = document.getElementById('toast'); t.classList.remove('translate-x-full'); setTimeout(() => t.classList.add('translate-x-full'), 3000); }
function setupPhoneMasks() {
    document.addEventListener('input', function (e) {
        if (e.target.classList.contains('phone-mask')) {
            let v = e.target.value.replace(/\D/g, '');
            if (!v) { e.target.value = '+7'; return; }
            if (v.startsWith('7') || v.startsWith('8')) v = v.slice(1);
            e.target.value = '+7' + v;
        }
    });
    document.addEventListener('focusin', (e) => { if (e.target.classList.contains('phone-mask') && !e.target.value) e.target.value = '+7'; });
}

// --- ПОШАГОВАЯ СИНХРОНИЗАЦИЯ И ТОЧЕЧНЫЙ ЗАПРОС ДАННЫХ ---
let initDataCachePromise = null;
async function getFallbackInitData(key) {
    if (!initDataCachePromise) {
        initDataCachePromise = fetch(`${GOOGLE_SCRIPT_URL}?action=get_init_data`)
            .then(res => res.json())
            .catch(err => {
                console.warn("Init data fallback error:", err);
                return {};
            });
    }
    const fullData = await initDataCachePromise;
    return fullData ? fullData[key] : null;
}

async function fetchGasStep(actionName, keyName) {
    try {
        const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=${actionName}`);
        if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json) && json.length) return json;
            if (json && Array.isArray(json[keyName])) return json[keyName];
            if (json && json.status === 'success' && json.data) return json.data;
        }
    } catch (err) {
        console.warn(`Direct fetch ${actionName} error, using fallback:`, err);
    }
    return await getFallbackInitData(keyName);
}

async function fetchSanityProducts() {
    const query = `*[_type == "product"] | order(_createdAt desc) {
        "Наименование": name,
        "Категория": category,
        "Цена продажи устройства": price,
        "Краткое описание": shortDescription,
        "Описание": description,
        "Ссылка на картинку": imageUrl,
        "Ссылка на картинку 1": imageUrl1,
        "Ссылка на картинку 2": imageUrl2,
        "Город": city,
        "Статус наличия": status,
        "Акция": promo,
        "Метка": tag,
        "Технические параметры": specifications
    }`;
    const endpoint = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodeURIComponent(query)}`;
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error(`Sanity products request failed: ${response.status}`);
    const payload = await response.json();
    return Array.isArray(payload.result) ? payload.result : [];
}

async function loadDataSequentially() {
    // 1. КОНТАКТЫ
    try {
        const contacts = await fetchGasStep('get_contacts', 'contacts');
        state.contacts = contacts || [];
        updateUIForCity();
    } catch (e) { console.error("Error loading contacts:", e); }

    // 2. БАННЕР
    try {
        const banners = await fetchGasStep('get_banners', 'banners');
        state.banners = banners || [];
        renderHeroBanners();
        startBannerAutoPlay();
    } catch (e) { console.error("Error loading banners:", e); }

    // 3. БЛОГ
    try {
        const blog = await fetchGasStep('get_blog', 'blog');
        state.blog = blog || [];
        renderBlog();
    } catch (e) { console.error("Error loading blog:", e); }

    // 4. ТОВАРЫ: сначала Sanity, затем старый источник как резерв
    try {
        let products = [];
        try {
            products = await fetchSanityProducts();
        } catch (sanityError) {
            console.warn('Sanity products error, using Google Apps Script:', sanityError);
        }
        if (!products.length) products = await fetchGasStep('get_products', 'products');
        state.products = products || [];
        renderCatalog();
        initConstructor();
    } catch (e) { console.error("Error loading products:", e); }

    // 5. УСЛУГИ
    try {
        const services = await fetchGasStep('get_services', 'services');
        state.services = services || [];
        renderServices();
    } catch (e) { console.error("Error loading services:", e); }

    // 6. ОТЗЫВЫ
    try {
        const reviews = await fetchGasStep('get_reviews', 'reviews');
        state.reviews = reviews || [];
    } catch (e) { console.error("Error loading reviews:", e); }
}

function updateUIForCity() {
    document.getElementById('headerCity').innerHTML = `<i class="fa-solid fa-location-dot"></i> Тюмень`;
    const c = state.contacts.find(x => x['Город'] === 'Тюмень') || state.contacts[0];
    if (c) {
        const phone1 = c['Телефон 1'] || '';
        const phone2 = c['Телефон 2'] || '';
        const cleanPhone = (p) => p ? p.toString().replace(/[^\d+]/g, '') : '';

        if (phone1) {
            const hp = document.getElementById('headerPhone');
            hp.innerText = phone1; 
            hp.href = `tel:${cleanPhone(phone1)}`;
            
            const cPhone = document.getElementById('contactsPhoneLink');
            if (cPhone) {
                cPhone.innerText = phone1;
                cPhone.href = `tel:${cleanPhone(phone1)}`;
            }
        }

        if (c['Адрес']) {
            const cOfficeAddr = document.getElementById('contactsOfficeAddr');
            if (cOfficeAddr) cOfficeAddr.innerText = c['Адрес'];
        }

        let footerHtml = '';
        if (phone1) footerHtml += `<div class="mb-1 font-bold text-white text-sm"><a href="tel:${cleanPhone(phone1)}" class="hover:text-brand-primary transition">${phone1}</a></div>`;
        if (phone2) footerHtml += `<div class="mb-1 font-bold text-white text-sm"><a href="tel:${cleanPhone(phone2)}" class="hover:text-brand-primary transition">${phone2}</a></div>`;
        if (c['Адрес']) footerHtml += `<div class="text-gray-400 text-xs mb-1">${c['Адрес']}</div>`;
        footerHtml += `<div class="text-gray-500 text-[11px] mb-3">ПН-ПТ 9:00 - 18:00</div>`;

        const orgName = c['Название организации'];
        const inn = c['ИНН/КПП'];
        state.organizationName = orgName || 'ООО "УВБ"';

        if (orgName || inn) {
            footerHtml += `<div class="pt-3 border-t border-white/10">`;
            if (orgName) footerHtml += `<div class="text-gray-300 text-xs font-semibold mb-0.5">${orgName}</div>`;
            if (inn) footerHtml += `<div class="text-gray-500 text-[11px]">ИНН/КПП: ${inn}</div>`;
            footerHtml += `</div>`;
        }

        document.getElementById('footerContacts').innerHTML = footerHtml;
    }
}

// --- PROMO BADGES BUILDER ---
function renderPromoBadges(rawPromo) {
    if (!rawPromo) return '';
    const items = String(rawPromo).split(';').map(s => s.trim()).filter(Boolean);
    if (!items.length) return '';

    const getBadgeConfig = (text) => {
        const t = text.toLowerCase();
        if (t.includes('хит')) {
            return { icon: 'fa-solid fa-fire text-amber-500', bg: 'bg-amber-50/95 text-amber-800 border-amber-300' };
        } else if (t.includes('покупател')) {
            return { icon: 'fa-solid fa-thumbs-up text-blue-500', bg: 'bg-blue-50/95 text-blue-800 border-blue-300' };
        } else if (t.includes('эксперт')) {
            return { icon: 'fa-solid fa-award text-purple-600', bg: 'bg-purple-50/95 text-purple-800 border-purple-300' };
        } else if (t.includes('распродаж')) {
            return { icon: 'fa-solid fa-percent text-rose-600', bg: 'bg-rose-50/95 text-rose-700 border-rose-300' };
        } else if (t.includes('лучшая цена') || t.includes('цена')) {
            return { icon: 'fa-solid fa-tag text-emerald-600', bg: 'bg-emerald-50/95 text-emerald-800 border-emerald-300' };
        } else if (t.includes('установк')) {
            return { icon: 'fa-solid fa-screwdriver-wrench text-sky-600', bg: 'bg-sky-50/95 text-sky-800 border-sky-300' };
        } else if (t.includes('умн')) {
            return { icon: 'fa-solid fa-microchip text-indigo-600', bg: 'bg-indigo-50/95 text-indigo-800 border-indigo-300' };
        }
        return { icon: 'fa-solid fa-check text-brand-primary', bg: 'bg-white/95 text-gray-800 border-gray-300' };
    };

    const badges = items.map(item => {
        const conf = getBadgeConfig(item);
        return `<span class="inline-flex items-center gap-1.5 text-xs md:text-[13px] font-bold px-3 py-1 rounded-full border ${conf.bg} shadow-sm backdrop-blur-xs whitespace-nowrap">
            <i class="${conf.icon} text-xs"></i>
            <span>${item}</span>
        </span>`;
    }).join('');

    return `<div class="absolute top-3.5 right-3.5 z-20 flex flex-col items-end gap-1.5 pointer-events-none">${badges}</div>`;
}

// --- ПАРАМЕТРЫ ВИДЕОМОНИТОРОВ ---
function extractMonitorSpec(product, specId) {
    const rawSpecs = product['Технические параметры'] || product['характеристики'] || product['Описание'] || '';
    if (!rawSpecs) return '-';

    const lines = String(rawSpecs).split(/;|\n/).map(s => s.trim()).filter(Boolean);

    const parsedItems = lines.map(line => {
        if (line.includes(':')) {
            const idx = line.indexOf(':');
            return { key: line.substring(0, idx).trim().toLowerCase(), val: line.substring(idx + 1).trim() };
        }
        if (line.includes('-') && !line.startsWith('-')) {
            const idx = line.indexOf('-');
            return { key: line.substring(0, idx).trim().toLowerCase(), val: line.substring(idx + 1).trim() };
        }
        return { key: line.toLowerCase(), val: line };
    });

    if (specId === 'display') {
        const found = parsedItems.find(i => i.key.includes('дисплей') || i.key.includes('экран') || i.key.includes('диагональ'));
        return found ? (found.val || '-') : '-';
    }

    if (specId === 'control') {
        const found = parsedItems.find(i => 
            (i.key.includes('управление') || i.key.includes('кнопки') || i.key.includes('сенсор') || i.key.includes('hands-free')) &&
            !i.key.includes('телефон') && !i.key.includes('смартфон') && !i.key.includes('wi-fi') && !i.key.includes('wifi') && !i.key.includes('приложен')
        );
        return found ? (found.val || '-') : '-';
    }

    if (specId === 'recording') {
        const found = parsedItems.find(i => i.key.includes('запись') || i.key.includes('фото/видео') || i.key.includes('фото и видео'));
        return found ? (found.val || '-') : '-';
    }

    if (specId === 'sd') {
        const found = parsedItems.find(i => i.key.includes('sd') || i.key.includes('карта памяти') || i.key.includes('карт памяти') || i.key.includes('microsd'));
        return found ? (found.val || '-') : '-';
    }

    if (specId === 'phone') {
        const found = parsedItems.find(i => i.key.includes('телефон') || i.key.includes('смартфон') || i.key.includes('переадресация') || i.key.includes('wi-fi') || i.key.includes('wifi') || i.key.includes('smart life'));
        return found ? (found.val || '-') : '-';
    }

    if (specId === 'dnd') {
        const found = parsedItems.find(i => i.key.includes('беспокоить') || i.key.includes('ночной режим') || i.key.includes('тихий режим'));
        return found ? (found.val || '-') : '-';
    }

    if (specId === 'size') {
        const found = parsedItems.find(i => i.key.includes('размер') || i.key.includes('габарит'));
        return found ? (found.val || '-') : '-';
    }

    return '-';
}

function formatSpecDisplayValue(val) {
    if (!val || val === '-' || val.trim() === '' || val === '—') {
        return '<span class="text-gray-400 font-normal text-xs">—</span>';
    }
    const low = val.toLowerCase().trim();
    if (low === 'есть' || low === 'да' || low === '+' || low === 'поддерживается') {
        return '<span class="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] border border-emerald-200"><i class="fa-solid fa-check text-[10px]"></i> Есть</span>';
    }
    if (low === 'нет' || low === '-' || low === 'отсутствует') {
        return '<span class="text-gray-400 font-normal text-xs">—</span>';
    }
    return `<span class="text-gray-800 font-medium leading-tight text-xs">${val}</span>`;
}

function getMonitorRequirementsBannerHtml() {
    return `
        <div class="bg-gradient-to-br from-blue-50/70 via-white to-brand-surfaceVariant/50 rounded-[2rem] sm:rounded-[2.5rem] border border-blue-100 p-6 sm:p-8 lg:p-9 shadow-g-card relative overflow-hidden">
            <div class="absolute -right-12 -bottom-12 w-52 h-52 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none"></div>

            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-7 relative z-10">
                <div class="max-w-2xl">
                    <div class="inline-flex items-center gap-2 bg-brand-surfaceVariant px-3.5 py-1 rounded-full text-brand-primary border border-blue-100 text-[11px] font-bold uppercase tracking-wider mb-3">
                        <i class="fa-solid fa-circle-info"></i>
                        <span>Важно знать перед установкой</span>
                    </div>
                    <h3 class="text-2xl sm:text-3xl font-display font-bold text-brand-dark leading-tight mb-2">
                        Видеомонитора недостаточно просто включить в розетку
                    </h3>
                    <p class="text-gray-600 text-xs sm:text-sm leading-relaxed">
                        Для корректной трансляции видео и работы с подъездным домофоном требуется комплекс монтажных работ. Мы профессионально реализуем подключение под ключ:
                    </p>
                </div>

                <div class="shrink-0 flex flex-col sm:items-start lg:items-end gap-1.5">
                    <button onclick="openServiceModal('Подключение к домофонной линии')" class="bg-brand-primary hover:bg-brand-primaryHover text-white font-medium py-3.5 px-7 rounded-full transition shadow-sm text-xs sm:text-sm flex items-center justify-center gap-2.5 group whitespace-nowrap">
                        <span>Проверить техническую возможность</span>
                        <i class="fa-solid fa-arrow-right text-xs group-hover:translate-x-1 transition-transform"></i>
                    </button>
                    <span class="text-[11px] text-gray-400 sm:self-start lg:self-center">Бесплатная проверка адреса и консультация</span>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 relative z-10">
                <div class="bg-white rounded-2xl p-4 border border-brand-border/80 shadow-xs hover:border-brand-primary transition flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-2.5">
                            <span class="w-7 h-7 rounded-full bg-brand-surfaceVariant text-brand-primary text-xs font-black flex items-center justify-center">1</span>
                            <i class="fa-solid fa-video text-brand-primary/70 text-sm"></i>
                        </div>
                        <h4 class="font-bold text-xs sm:text-[13px] text-brand-dark mb-1 leading-snug">Камера в домофоне</h4>
                        <p class="text-gray-500 text-[11px] leading-relaxed">Скрытый монтаж камеры в блок вызова или установка внешней видеокамеры</p>
                    </div>
                </div>

                <div class="bg-white rounded-2xl p-4 border border-brand-border/80 shadow-xs hover:border-brand-primary transition flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-2.5">
                            <span class="w-7 h-7 rounded-full bg-brand-surfaceVariant text-brand-primary text-xs font-black flex items-center justify-center">2</span>
                            <i class="fa-solid fa-network-wired text-brand-primary/70 text-sm"></i>
                        </div>
                        <h4 class="font-bold text-xs sm:text-[13px] text-brand-dark mb-1 leading-snug">Магистраль на 1 этаже</h4>
                        <p class="text-gray-500 text-[11px] leading-relaxed">Подключение домофона к общей магистрали подъезда</p>
                    </div>
                </div>

                <div class="bg-white rounded-2xl p-4 border border-brand-border/80 shadow-xs hover:border-brand-primary transition flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-2.5">
                            <span class="w-7 h-7 rounded-full bg-brand-surfaceVariant text-brand-primary text-xs font-black flex items-center justify-center">3</span>
                            <i class="fa-solid fa-route text-brand-primary/70 text-sm"></i>
                        </div>
                        <h4 class="font-bold text-xs sm:text-[13px] text-brand-dark mb-1 leading-snug">Протяжка кабеля</h4>
                        <p class="text-gray-500 text-[11px] leading-relaxed">Прокладка линий связи с 1-го этажа до вашей квартиры в кабель-канале</p>
                    </div>
                </div>

                <div class="bg-white rounded-2xl p-4 border border-brand-border/80 shadow-xs hover:border-brand-primary transition flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-2.5">
                            <span class="w-7 h-7 rounded-full bg-brand-surfaceVariant text-brand-primary text-xs font-black flex items-center justify-center">4</span>
                            <i class="fa-solid fa-microchip text-brand-primary/70 text-sm"></i>
                        </div>
                        <h4 class="font-bold text-xs sm:text-[13px] text-brand-dark mb-1 leading-snug">Коммутация в щитке</h4>
                        <p class="text-gray-500 text-[11px] leading-relaxed">Установка этажного оборудования для бесперебойного получения видеосигнала</p>
                    </div>
                </div>

                <div class="bg-white rounded-2xl p-4 border border-brand-border/80 shadow-xs hover:border-brand-primary transition flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-2.5">
                            <span class="w-7 h-7 rounded-full bg-brand-surfaceVariant text-brand-primary text-xs font-black flex items-center justify-center">5</span>
                            <i class="fa-solid fa-plug-circle-check text-brand-primary/70 text-sm"></i>
                        </div>
                        <h4 class="font-bold text-xs sm:text-[13px] text-brand-dark mb-1 leading-snug">Питание и Монтаж</h4>
                        <p class="text-gray-500 text-[11px] leading-relaxed">Прокладка питания 220В к месту монитора, монтаж и точная настройка сопряжения</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function createMonitorRequirementsBanner() {
    const wrap = document.createElement('div');
    wrap.className = "mt-8";
    wrap.innerHTML = getMonitorRequirementsBannerHtml();
    return wrap;
}

function toggleMonitorsTable() {
    const content = document.getElementById('monitorsTableContent');
    const icon = document.getElementById('monitorsTableIcon');
    const text = document.getElementById('monitorsTableToggleText');
    if (!content) return;
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        if (icon) icon.classList.add('rotate-180');
        if (text) text.innerText = 'Скрыть таблицу';
    } else {
        content.classList.add('hidden');
        if (icon) icon.classList.remove('rotate-180');
        if (text) text.innerText = 'Показать таблицу';
    }
}

function createMonitorsComparisonTable(monitors) {
    if (!monitors || !monitors.length) return null;

    const tableCard = document.createElement('div');
    tableCard.className = "mt-8 bg-white rounded-2xl sm:rounded-3xl border border-brand-border p-3.5 sm:p-5 md:p-6 shadow-g-card overflow-hidden";

    const specsList = [
        { id: 'display', title: 'Дисплей', icon: 'fa-desktop' },
        { id: 'control', title: 'Управление', icon: 'fa-sliders' },
        { id: 'recording', title: 'Запись фото/видео', icon: 'fa-video' },
        { id: 'sd', title: 'SD карта', icon: 'fa-sd-card' },
        { id: 'phone', title: 'Управление с телефона', icon: 'fa-mobile-screen-button' },
        { id: 'dnd', title: 'Режим «Не беспокоить»', icon: 'fa-moon' },
        { id: 'size', title: 'Размеры', icon: 'fa-ruler-combined' }
    ];

    let html = `
        <button type="button" onclick="toggleMonitorsTable()" class="w-full flex flex-col sm:flex-row sm:items-center justify-between text-left gap-3 group focus:outline-none">
            <div>
                <div class="inline-flex items-center gap-1.5 bg-brand-surfaceVariant text-brand-primary px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">
                    <i class="fa-solid fa-code-compare"></i> Сравнение моделей (${monitors.length})
                </div>
                <h3 class="text-lg sm:text-2xl font-display font-bold text-brand-dark group-hover:text-brand-primary transition">Сравнительная таблица видеомониторов</h3>
                <p class="text-gray-500 text-xs mt-0.5">Ключевые параметры без лишних деталей для быстрого выбора</p>
            </div>

            <div class="inline-flex items-center gap-2 self-start sm:self-center px-4 py-2 bg-brand-secondary group-hover:bg-brand-surfaceVariant border border-brand-border rounded-full text-xs font-semibold text-brand-dark transition">
                <span id="monitorsTableToggleText">Показать таблицу</span>
                <i id="monitorsTableIcon" class="fa-solid fa-chevron-down text-brand-primary transition-transform duration-300"></i>
            </div>
        </button>

        <div id="monitorsTableContent" class="hidden mt-5 pt-4 border-t border-brand-border">
            <div class="inline-flex items-center gap-1.5 text-[11px] text-brand-primary font-medium bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 sm:hidden mb-3 animate-pulse">
                <i class="fa-solid fa-arrows-left-right"></i> Свайп по горизонтали
            </div>

            <div class="overflow-x-auto no-scrollbar -mx-3.5 sm:-mx-5 md:-mx-6 px-3.5 sm:px-5 md:px-6 pb-2" style="-webkit-overflow-scrolling: touch;">
                <table class="w-full text-left border-collapse min-w-[540px] sm:min-w-[640px]">
                    <thead>
                        <tr class="border-b border-brand-border bg-slate-50/70">
                            <th class="table-sticky-col bg-[#f8f9fa] p-2.5 sm:p-3 w-32 sm:w-44 min-w-[125px] sm:min-w-[160px] text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 align-middle border-r border-brand-border">
                                Параметр
                            </th>
                            ${monitors.map(m => `
                                <th class="p-2 sm:p-3 w-32 sm:w-40 min-w-[130px] sm:min-w-[150px] align-top text-center group border-l border-brand-border/60">
                                    <div class="cursor-pointer" onclick="openProductPageByName('${(m['Наименование'] || '').replace(/'/g, "\\'")}')">
                                        <div class="font-bold text-xs sm:text-[13px] text-brand-dark line-clamp-2 h-7 sm:h-8 leading-tight group-hover:text-brand-primary transition">
                                            ${m['Наименование']}
                                        </div>
                                        <div class="text-xs sm:text-sm font-black text-brand-primary my-0.5">
                                            ${m['Цена продажи устройства'] || 0} ₽
                                        </div>
                                    </div>
                                    <button onclick="openProductPageByName('${(m['Наименование'] || '').replace(/'/g, "\\'")}')" class="w-full mt-1 py-1 px-1.5 bg-white hover:bg-brand-primary hover:text-white text-brand-dark border border-brand-border rounded-lg text-[10px] sm:text-[11px] font-semibold transition shadow-xs">
                                        Подробнее
                                    </button>
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 text-xs">
                        ${specsList.map((spec, sIdx) => {
                            const rowBg = sIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50';
                            const stickyColBg = sIdx % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fa]';
                            return `
                                <tr class="${rowBg} hover:bg-blue-50/40 transition">
                                    <td class="table-sticky-col ${stickyColBg} py-2 px-2.5 sm:py-2.5 sm:px-3 font-semibold text-brand-dark text-xs border-r border-brand-border">
                                        <div class="flex items-center gap-2">
                                            <div class="w-5 h-5 rounded bg-brand-surfaceVariant text-brand-primary flex items-center justify-center text-[10px] shrink-0">
                                                <i class="fa-solid ${spec.icon}"></i>
                                            </div>
                                            <span class="leading-tight text-[11px] sm:text-xs">${spec.title}</span>
                                        </div>
                                    </td>
                                    ${monitors.map(m => {
                                        const rawVal = extractMonitorSpec(m, spec.id);
                                        const formatted = formatSpecDisplayValue(rawVal);
                                        return `
                                            <td class="py-1.5 px-2 sm:py-2 sm:px-2.5 text-center border-l border-brand-border/50 text-xs">
                                                ${formatted}
                                            </td>
                                        `;
                                    }).join('')}
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    tableCard.innerHTML = html;
    return tableCard;
}

function openProductPageByName(name) {
    const found = state.products.find(p => p['Наименование'] === name);
    if (found) openProductPage(found);
}

// --- CATALOG RENDERING ---
function renderCatalog() {
    const container = document.getElementById('productsContainer');
    const tabs = document.getElementById('categoryTabs');
    if (!container || !tabs) return;
    container.innerHTML = ''; tabs.innerHTML = '';
    
    const valid = state.products.filter(p => !p['Город'] || p['Город'] === 'Все города' || p['Город'] === 'Тюмень');
    const cats = [...new Set(valid.map(p => p['Категория']))];

    cats.forEach((cat, idx) => {
        tabs.innerHTML += `<button onclick="document.getElementById('cat-${idx}').scrollIntoView({behavior:'smooth', block:'center'})" class="whitespace-nowrap px-4 py-2 rounded-full bg-brand-secondary border border-brand-border text-gray-700 hover:bg-brand-primary hover:text-white transition font-medium text-xs">${cat}</button>`;
        
        const section = document.createElement('div');
        section.id = `cat-${idx}`;
        section.className = "mb-14";
        section.innerHTML = `<h3 class="text-2xl md:text-3xl font-display font-bold mb-6 text-gray-900 tracking-tight">${cat}</h3>`;

        const grid = document.createElement('div');
        grid.className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6";
        
        const categoryProducts = valid.filter(p => p['Категория'] === cat);

        categoryProducts.forEach(p => {
            const price = p['Цена продажи устройства'];
            const desc = p['Краткое описание'] 
                ? `<p class="text-[13px] text-gray-500 line-clamp-2 h-10 leading-relaxed mb-4">${p['Краткое описание']}</p>` 
                : `<div class="h-10 mb-4"></div>`;
            
            const promoVal = p['Акция'] || p['акция'] || '';
            const promoBadges = renderPromoBadges(promoVal);

            let tagHtml = '';
            const tagVal = p['Метка'] || p['Tags'] || ''; 
            if(tagVal && !promoVal) {
                tagHtml = `<div class="absolute top-3.5 right-3.5 z-20 flex flex-col items-end gap-1.5 pointer-events-none"><span class="bg-red-500 text-white font-extrabold text-xs md:text-[13px] px-3 py-1 rounded-full shadow-sm">${tagVal}</span></div>`;
            }

            const card = document.createElement('div');
            card.className = "group cursor-pointer flex flex-col transition duration-200 bg-white hover:-translate-y-1";
            card.onclick = () => openProductPage(p);
            card.dataset.prodName = p['Наименование'];
            card.dataset.prodPrice = price;
            
            card.innerHTML = `
                <div class="w-full h-60 sm:h-64 bg-slate-50/60 border border-slate-100/80 rounded-[2rem] p-6 flex items-center justify-center relative overflow-hidden mb-4 transition duration-300 group-hover:bg-slate-100/50">
                    ${promoBadges || tagHtml}
                    <img src="${p['Ссылка на картинку'] || ''}" alt="${p['Наименование']}" class="max-h-full max-w-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105">
                </div>
                
                <h4 class="font-bold text-gray-900 text-[15px] leading-snug mb-1 h-11 overflow-hidden transition-colors group-hover:text-brand-primary">${p['Наименование']}</h4>
                
                ${desc}
                
                <div class="flex items-center justify-between mt-auto pt-1">
                    <span class="text-base font-bold text-gray-900">${price} ₽</span>
                    <div class="cart-action-container"></div>
                </div>
            `;
            grid.appendChild(card);
        });
        section.appendChild(grid);

        const isMonitorCategory = cat && (
            cat.toLowerCase().trim() === 'видеомониторы' || 
            cat.toLowerCase().includes('монитор') ||
            cat.toLowerCase().trim() === 'видеодомофоны'
        );
        if (isMonitorCategory && categoryProducts.length > 0) {
            const comparisonTableElement = createMonitorsComparisonTable(categoryProducts);
            if (comparisonTableElement) {
                section.appendChild(comparisonTableElement);
            }
            const bannerElement = createMonitorRequirementsBanner();
            if (bannerElement) {
                section.appendChild(bannerElement);
            }
        }

        container.appendChild(section);
    });
    updateProductButtons();
}

// --- ДЕТАЛЬНАЯ СТРАНИЦА ТОВАРА ---
function openProductPage(p) {
    state.currentProduct = p;
    
    document.querySelectorAll('.page-view').forEach(view => view.classList.add('hidden'));
    const pView = document.getElementById('view-product');
    if (pView) pView.classList.remove('hidden');

    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.className = "nav-tab px-4 py-2 rounded-full text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm transition";
    });
    const catNav = document.getElementById('nav-btn-catalog');
    if (catNav) catNav.className = "nav-tab px-4 py-2 rounded-full text-sm font-bold text-brand-primary bg-white shadow-sm transition";

    window.scrollTo({ top: 0, behavior: 'smooth' });

    document.getElementById('pdCategoryBreadcrumb').innerText = p['Категория'] || 'Каталог';
    document.getElementById('pdTitleBreadcrumb').innerText = p['Наименование'] || '';

    document.getElementById('pdCategoryTag').innerText = p['Категория'] || '';
    document.getElementById('pdTitle').innerText = p['Наименование'] || '';
    document.getElementById('pdPrice').innerText = (p['Цена продажи устройства'] || '0') + ' ₽';
    document.getElementById('pdDescription').innerText = p['Краткое описание'] || p['Описание'] || 'Для данного устройства нет подробного описания.';

    const rawStatus = (p['Остаток на складе'] || '').toString().trim();
    const availBadge = document.getElementById('pdAvailabilityBadge');
    const sLower = rawStatus.toLowerCase();
    if (!rawStatus || (sLower.includes('наличи') && !sLower.includes('нет'))) {
        availBadge.className = "text-brand-success text-xs font-semibold bg-green-50 px-3.5 py-1 rounded-full border border-green-200 flex items-center gap-1.5 shadow-sm";
        availBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${rawStatus || 'В наличии'}</span>`;
    } else if (sLower.includes('заказ')) {
        availBadge.className = "text-amber-700 text-xs font-semibold bg-amber-50 px-3.5 py-1 rounded-full border border-amber-200 flex items-center gap-1.5 shadow-sm";
        availBadge.innerHTML = `<i class="fa-solid fa-clock"></i> <span>${rawStatus}</span>`;
    } else if (sLower.includes('нет') || sLower.includes('законч') || sLower.includes('отсутств')) {
        availBadge.className = "text-brand-danger text-xs font-semibold bg-red-50 px-3.5 py-1 rounded-full border border-red-200 flex items-center gap-1.5 shadow-sm";
        availBadge.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> <span>${rawStatus}</span>`;
    } else {
        availBadge.className = "text-brand-accent text-xs font-semibold bg-sky-50 px-3.5 py-1 rounded-full border border-sky-200 flex items-center gap-1.5 shadow-sm";
        availBadge.innerHTML = `<i class="fa-solid fa-box"></i> <span>${rawStatus}</span>`;
    }

    const promoVal = p['Акция'] || p['акция'] || '';
    const promoContainer = document.getElementById('pdPromoBadgesContainer');
    if (promoContainer) {
        if (promoVal) {
            promoContainer.innerHTML = renderPromoBadges(promoVal);
        } else if (p['Метка'] || p['Tags']) {
            promoContainer.innerHTML = `<span class="bg-red-500 text-white font-extrabold text-xs md:text-sm px-3.5 py-1 rounded-full shadow-sm">${p['Метка'] || p['Tags']}</span>`;
        } else {
            promoContainer.innerHTML = '';
        }
    }

    state.currentProdImages = [
        p['Ссылка на картинку'], 
        p['Ссылка на картинку 1'],
        p['Ссылка на картинку 2']
    ].filter(Boolean);
    state.currentProdImgIdx = 0;
    updatePdImageGallery();

    const catLower = (p['Категория'] || '').toLowerCase();
    const isDomofonCategory = catLower.includes('видеодомофон') || catLower.includes('видеомонитор') || catLower.includes('домофон');
    
    const guideBlock = document.getElementById('pdDomofonGuide');
    if (guideBlock) {
        if (isDomofonCategory) guideBlock.classList.remove('hidden');
        else guideBlock.classList.add('hidden');
    }

    const monitorReqBanner = document.getElementById('pdMonitorRequirementsBanner');
    if (monitorReqBanner) {
        if (isDomofonCategory) {
            monitorReqBanner.innerHTML = getMonitorRequirementsBannerHtml();
            monitorReqBanner.classList.remove('hidden');
        } else {
            monitorReqBanner.classList.add('hidden');
            monitorReqBanner.innerHTML = '';
        }
    }

    renderProductSpecifications(p['Технические параметры'] || '');
    resetPdSpecsAccordion();
    loadRelatedProductsIndividually(p);
    updatePdCartAction();
}

function updatePdImageGallery() {
    const mainImg = document.getElementById('pdMainImage');
    const prevBtn = document.getElementById('pdPrevImgBtn');
    const nextBtn = document.getElementById('pdNextImgBtn');
    const thumbContainer = document.getElementById('pdThumbnails');

    if (!state.currentProdImages.length) {
        mainImg.src = '';
        prevBtn.classList.add('hidden');
        nextBtn.classList.add('hidden');
        thumbContainer.innerHTML = '';
        return;
    }

    mainImg.src = state.currentProdImages[state.currentProdImgIdx];

    if (state.currentProdImages.length > 1) {
        prevBtn.classList.remove('hidden');
        nextBtn.classList.remove('hidden');

        thumbContainer.innerHTML = state.currentProdImages.map((src, idx) => `
            <button onclick="setPdImageIdx(${idx})" class="w-16 h-16 rounded-xl bg-white border-2 p-1.5 shrink-0 transition overflow-hidden flex items-center justify-center ${idx === state.currentProdImgIdx ? 'border-brand-primary shadow-sm' : 'border-brand-border opacity-70 hover:opacity-100'}">
                <img src="${src}" class="max-h-full max-w-full object-contain">
            </button>
        `).join('');
    } else {
        prevBtn.classList.add('hidden');
        nextBtn.classList.add('hidden');
        thumbContainer.innerHTML = '';
    }
}

function changePdImage(dir) {
    let nextIdx = state.currentProdImgIdx + dir;
    if (nextIdx < 0) nextIdx = state.currentProdImages.length - 1;
    if (nextIdx >= state.currentProdImages.length) nextIdx = 0;
    state.currentProdImgIdx = nextIdx;
    updatePdImageGallery();
}

function setPdImageIdx(idx) {
    state.currentProdImgIdx = idx;
    updatePdImageGallery();
}

function resetPdSpecsAccordion() {
    const collapse = document.getElementById('pdSpecsCollapse');
    const chevron = document.getElementById('pdSpecsChevron');
    const hint = document.getElementById('pdSpecsToggleHint');
    if (collapse) collapse.classList.add('hidden');
    if (chevron) chevron.classList.remove('rotate-180');
    if (hint) hint.innerText = 'Показать';
}

function togglePdSpecs() {
    const collapse = document.getElementById('pdSpecsCollapse');
    const chevron = document.getElementById('pdSpecsChevron');
    const hint = document.getElementById('pdSpecsToggleHint');
    if (!collapse) return;

    if (collapse.classList.contains('hidden')) {
        collapse.classList.remove('hidden');
        if (chevron) chevron.classList.add('rotate-180');
        if (hint) hint.innerText = 'Скрыть';
    } else {
        collapse.classList.add('hidden');
        if (chevron) chevron.classList.remove('rotate-180');
        if (hint) hint.innerText = 'Показать';
    }
}

function renderProductSpecifications(rawSpecs) {
    const container = document.getElementById('pdSpecsCleanList');
    const specsWrapper = document.getElementById('pdSpecsContainer');
    if (!container || !specsWrapper) return;
    container.innerHTML = '';

    if (!rawSpecs || !rawSpecs.trim()) {
        specsWrapper.classList.add('hidden');
        return;
    }

    const rawItems = rawSpecs.split(/;|\n/).map(s => s.trim()).filter(Boolean);

    if (!rawItems.length) {
        specsWrapper.classList.add('hidden');
        return;
    }

    specsWrapper.classList.remove('hidden');

    rawItems.forEach(item => {
        let name = '';
        let val = '';

        if (item.includes(':')) {
            const parts = item.split(':');
            name = parts[0].trim();
            val = parts.slice(1).join(':').trim();
        } else if (item.includes('-') && !item.startsWith('-')) {
            const parts = item.split('-');
            name = parts[0].trim();
            val = parts.slice(1).join('-').trim();
        } else {
            name = item;
            val = '<i class="fa-solid fa-check text-brand-primary text-[10px]"></i>';
        }

        const row = document.createElement('div');
        row.className = "py-2.5 px-3 flex items-center justify-between gap-3 text-xs bg-gray-50/80 hover:bg-blue-50/40 border border-gray-100 rounded-xl transition";
        
        row.innerHTML = `
            <span class="text-gray-600 font-medium">${name}</span>
            <span class="text-gray-900 font-semibold text-right">${val}</span>
        `;
        container.appendChild(row);
    });
}

async function loadRelatedProductsIndividually(product) {
    const relSection = document.getElementById('pdRelatedSection');
    const relGrid = document.getElementById('pdRelatedGrid');
    if (!relSection || !relGrid) return;

    const relatedNamesRaw = product['Сопутствующие товары'] || product['сопутствующие товары'] || '';
    const relNames = String(relatedNamesRaw).split(/;|,/).map(s => s.trim().toLowerCase()).filter(Boolean);

    if (!relNames.length) {
        relSection.classList.add('hidden');
        return;
    }

    relSection.classList.remove('hidden');
    relGrid.innerHTML = `
        <div class="col-span-full text-center py-12">
            <div class="loader inline-block"></div>
            <p class="mt-3 text-xs text-gray-400">Загрузка сопутствующих товаров...</p>
        </div>
    `;

    let matchedProducts = [];

    try {
        const pNameParam = encodeURIComponent(product['Наименование'] || '');
        const relParam = encodeURIComponent(relatedNamesRaw);
        const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=get_related_products&product=${pNameParam}&related=${relParam}`);
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length) {
                matchedProducts = data;
            } else if (data && Array.isArray(data.products) && data.products.length) {
                matchedProducts = data.products;
            } else if (data && Array.isArray(data.related) && data.related.length) {
                matchedProducts = data.related;
            }
        }
    } catch (err) {
        console.warn("Individual related fetch notice:", err);
    }

    if (!matchedProducts.length && state.products.length) {
        const currentCityProducts = state.products.filter(p => !p['Город'] || p['Город'] === 'Все города' || p['Город'] === 'Тюмень');
        matchedProducts = currentCityProducts.filter(p => {
            if (!p['Наименование'] || p['Наименование'] === product['Наименование']) return false;
            const pNameLower = p['Наименование'].toLowerCase().trim();
            return relNames.some(targetName => pNameLower === targetName || pNameLower.includes(targetName) || targetName.includes(pNameLower));
        });
    }

    if (!matchedProducts.length) {
        relSection.classList.add('hidden');
        return;
    }

    relGrid.innerHTML = '';

    matchedProducts.forEach(relProd => {
        const price = relProd['Цена продажи устройства'];
        const card = document.createElement('div');
        card.className = "group cursor-pointer flex flex-col bg-white border border-brand-border rounded-[2rem] p-5 hover:shadow-g-card transition duration-200";
        card.onclick = () => openProductPage(relProd);
        card.dataset.prodName = relProd['Наименование'];
        card.dataset.prodPrice = price;

        const promoVal = relProd['Акция'] || relProd['акция'] || '';
        const promoBadges = renderPromoBadges(promoVal);

        card.innerHTML = `
            <div class="w-full h-48 bg-brand-secondary rounded-2xl p-4 flex items-center justify-center relative overflow-hidden mb-3 group-hover:bg-slate-100/70 transition">
                ${promoBadges}
                <img src="${relProd['Ссылка на картинку'] || ''}" alt="${relProd['Наименование']}" class="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105">
            </div>
            <div class="text-[11px] font-bold text-brand-primary uppercase tracking-wider mb-1">${relProd['Категория'] || ''}</div>
            <h4 class="font-bold text-gray-900 text-sm leading-snug mb-2 line-clamp-2 transition-colors group-hover:text-brand-primary">${relProd['Наименование']}</h4>
            <div class="flex items-center justify-between mt-auto pt-2 border-t border-brand-border">
                <span class="text-sm font-bold text-gray-900">${price} ₽</span>
                <div class="cart-action-container"></div>
            </div>
        `;
        relGrid.appendChild(card);
    });

    updateProductButtons();
}

function updatePdCartAction() {
    const container = document.getElementById('pdCartActionContainer');
    if (!container || !state.currentProduct) return;

    const name = state.currentProduct['Наименование'];
    const price = state.currentProduct['Цена продажи устройства'];
    const inCart = state.cart.find(i => i.name === name);

    if (inCart) {
        container.innerHTML = `
            <div class="flex items-center bg-brand-primary text-white rounded-full h-12 px-2 shadow-sm overflow-hidden max-w-[220px]">
                <button onclick="modCartByName('${name.replace(/'/g, "\\'")}', -1)" class="w-10 h-full flex items-center justify-center hover:bg-black/10 transition font-bold text-lg">-</button>
                <span class="flex-1 text-sm font-bold px-2 text-center">В корзине: ${inCart.count}</span>
                <button onclick="modCartByName('${name.replace(/'/g, "\\'")}', 1)" class="w-10 h-full flex items-center justify-center hover:bg-black/10 transition font-bold text-lg">+</button>
            </div>
        `;
    } else {
        container.innerHTML = `
            <button onclick="addCart('${name.replace(/'/g, "\\'")}', '${price}')" class="w-full sm:w-auto px-8 py-3.5 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-full font-medium transition shadow-sm flex items-center justify-center gap-2 text-sm">
                <i class="fa-solid fa-cart-plus"></i> Добавить в корзину
            </button>
        `;
    }
}

function updateProductButtons() {
    document.querySelectorAll('[data-prod-name]').forEach(card => {
        const name = card.dataset.prodName;
        const price = card.dataset.prodPrice;
        const container = card.querySelector('.cart-action-container');
        if (!container) return;
        const inCart = state.cart.find(i => i.name === name);

        if (inCart) {
            container.innerHTML = `
                <div class="flex items-center bg-brand-primary text-white rounded-full h-8 px-1 shadow-sm overflow-hidden" onclick="event.stopPropagation()">
                    <button onclick="modCartByName('${name.replace(/'/g, "\\'")}', -1)" class="w-6 h-full flex items-center justify-center hover:bg-black/10 transition font-bold text-xs">-</button>
                    <span class="text-xs font-bold px-2 text-center">${inCart.count}</span>
                    <button onclick="modCartByName('${name.replace(/'/g, "\\'")}', 1)" class="w-6 h-full flex items-center justify-center hover:bg-black/10 transition font-bold text-xs">+</button>
                </div>
            `;
        } else {
            container.innerHTML = `
                <button onclick="event.stopPropagation(); addCart('${name.replace(/'/g, "\\'")}', '${price}')" class="px-4 py-1.5 rounded-full border border-blue-200 text-brand-primary bg-white hover:bg-blue-50 hover:border-brand-primary transition text-xs font-semibold">
                    В корзину
                </button>
            `;
        }
    });

    updatePdCartAction();
}

function toggleCart() {
    const m = document.getElementById('cartModal'), p = document.getElementById('cartPanel');
    if(m.classList.contains('hidden')) {
        m.classList.remove('hidden'); setTimeout(()=>p.classList.remove('translate-x-full'),10);
    } else {
        p.classList.add('translate-x-full'); setTimeout(()=>m.classList.add('hidden'),300);
    }
}

function addCart(n, p) {
    const pr = parseFloat(String(p).replace(/[^\d.]/g,''));
    const ex = state.cart.find(x => x.name === n);
    if(ex) ex.count++; else state.cart.push({name:n, price:pr, count:1});
    saveCart(); updateCartUI(); 
}

function modCart(i, d) {
    state.cart[i].count += d;
    if(state.cart[i].count <= 0) state.cart.splice(i,1);
    saveCart(); updateCartUI();
}

function modCartByName(n, d) {
    const idx = state.cart.findIndex(x => x.name === n);
    if (idx !== -1) {
        state.cart[idx].count += d;
        if (state.cart[idx].count <= 0) state.cart.splice(idx, 1);
        saveCart(); updateCartUI();
    }
}

function saveCart() { localStorage.setItem('uvb_cart', JSON.stringify(state.cart)); }

function updateCartUI() {
    const count = state.cart.reduce((a,b)=>a+b.count,0);
    const total = state.cart.reduce((a,b)=>a+(b.price*b.count),0);
    
    const badge = document.getElementById('cartCount');
    badge.innerText = count;
    badge.classList.toggle('scale-0', count===0);
    document.getElementById('cartTotal').innerText = total + ' ₽';
    
    const list = document.getElementById('cartItems');
    list.innerHTML = state.cart.length ? '' : '<div class="text-center text-gray-400 mt-10 text-xs">Корзина пуста</div>';
    state.cart.forEach((i, idx) => {
        list.innerHTML += `<div class="bg-white p-3.5 rounded-xl border border-brand-border flex justify-between items-center">
            <div><div class="font-bold text-xs text-brand-dark">${i.name}</div><div class="text-xs text-brand-primary mt-0.5">${i.price} ₽ x ${i.count}</div></div>
            <div class="flex gap-1.5"><button onclick="modCart(${idx},-1)" class="w-6 h-6 bg-brand-secondary rounded-full text-brand-dark text-xs flex items-center justify-center">-</button><button onclick="modCart(${idx},1)" class="w-6 h-6 bg-brand-secondary rounded-full text-brand-dark text-xs flex items-center justify-center">+</button></div>
        </div>`;
    });
    updateProductButtons();
}

async function submitCartOrder(e) {
    e.preventDefault();
    let items = state.cart.map(i => `${i.name} (${i.count})`).join(', ');
    await submitLead(e, 'Корзина', null, null, `Заказ: ${items}. Сумма: ${document.getElementById('cartTotal').innerText}`);
    state.cart = []; saveCart(); updateCartUI(); toggleCart();
}

// --- SERVICES, BLOG ---
function renderServices() {
    const pageGrid = document.getElementById('servicesPageGrid');
    if (!pageGrid) return;
    pageGrid.innerHTML = '';
    const services = state.services.filter(s => !s['Город'] || s['Город'] === 'Все города' || s['Город'] === 'Тюмень');

    if (services.length === 0) {
        pageGrid.innerHTML = '<div class="col-span-full text-center text-gray-400 py-8 text-xs">Нет доступных услуг для города Тюмень.</div>';
        return;
    }

    services.forEach(service => {
        const title = service['Заголовок'] || 'Услуга';
        const desc = service['Описание'] || '';
        const iconClass = service['Иконка'] || 'fa-solid fa-screwdriver-wrench';

        const card = document.createElement('div');
        card.className = "p-6 rounded-2xl bg-white border border-brand-border hover:shadow-g-card transition cursor-pointer flex flex-col h-full group";
        card.onclick = () => openServiceModal(title);

        card.innerHTML = `
            <div class="w-12 h-12 rounded-full bg-brand-surfaceVariant text-brand-primary flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition">
                <i class="${iconClass}"></i>
            </div>
            <h3 class="text-lg font-bold mb-2 text-brand-dark leading-tight">${title}</h3>
            <p class="text-gray-500 text-xs mb-6 flex-1 leading-relaxed">${desc}</p>
            <span class="text-brand-primary font-medium text-xs mt-auto flex items-center gap-1 group-hover:gap-2 transition-all">
                Заказать <i class="fa-solid fa-chevron-right text-[10px]"></i>
            </span>
        `;
        pageGrid.appendChild(card);
    });
}

function renderBlog() {
    const grid = document.getElementById('blogGrid'); 
    if (!grid) return;
    grid.innerHTML = '';
    const posts = state.blog.filter(p => !p['Город'] || p['Город'] === 'Все города' || p['Город'] === 'Тюмень');
    if (posts.length === 0) { grid.innerHTML = '<div class="w-full text-center text-gray-500 py-10 text-xs">Новостей пока нет.</div>'; return; }
    posts.forEach(post => {
        const dateStr = post['Дата'] ? new Date(post['Дата']).toLocaleDateString('ru-RU', {day:'numeric', month:'long', year:'numeric'}) : '';
        const imgUrl = post['Ссылка на картинку'] || 'https://via.placeholder.com/600x400';
        const safePost = JSON.stringify(post).replace(/"/g, '&quot;');
        grid.innerHTML += `
        <div class="snap-start shrink-0 w-[290px] md:w-[340px] bg-white rounded-2xl overflow-hidden border border-brand-border hover:shadow-g-card transition duration-300 flex flex-col cursor-pointer group" onclick='openBlogModal(${safePost})'>
            <div class="h-44 overflow-hidden relative bg-brand-secondary">
                <img src="${imgUrl}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                <div class="absolute top-3 left-3 bg-white/90 backdrop-blur px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-brand-dark">${dateStr}</div>
            </div>
            <div class="p-5 flex flex-col flex-1">
                <h3 class="text-base font-bold text-brand-dark mb-1.5 group-hover:text-brand-primary transition line-clamp-2">${escapeHtml(post['Заголовок'])}</h3>
                <p class="text-xs text-gray-500 mb-4 flex-1 line-clamp-2 leading-relaxed">${escapeHtml(post['Подзаголовок'])}</p>
                <div class="flex justify-between items-center pt-3 border-t border-brand-border mt-auto">
                    <span class="text-brand-primary font-medium text-xs flex items-center gap-1">Читать <i class="fa-solid fa-arrow-right text-[10px]"></i></span>
                </div>
            </div>
        </div>`;
    });
}

function openBlogModal(p) {
    const m = document.getElementById('blogModal');
    document.getElementById('bmDate').innerText = p['Дата'] ? new Date(p['Дата']).toLocaleDateString('ru-RU') : '';
    document.getElementById('bmAuthor').querySelector('span').innerText = p['Автор'] || 'Редакция';
    document.getElementById('bmTitle').innerText = p['Заголовок'];
    document.getElementById('bmSubtitle').innerText = p['Подзаголовок'] || '';
    document.getElementById('bmImage').src = p['Ссылка на картинку'] || 'https://via.placeholder.com/800x400';
    document.getElementById('bmText').innerHTML = (p['Текст']||'').split('\n').map(para => para.trim() ? `<p class="mb-4">${escapeHtml(para)}</p>` : '').join('');
    m.classList.remove('hidden'); setTimeout(() => m.classList.remove('opacity-0'), 10);
}
function closeBlogModal(e) { if(e && e.target!==e.currentTarget) return; const m = document.getElementById('blogModal'); m.classList.add('opacity-0'); setTimeout(()=>{ m.classList.add('hidden'); },300); }

function openServiceModal(serviceName) {
    const m = document.getElementById('serviceModal');
    document.getElementById('serviceTargetName').innerText = serviceName;
    document.getElementById('serviceNote').value = serviceName;
    m.classList.remove('hidden');
    setTimeout(() => m.classList.remove('opacity-0'), 10);
}
function closeServiceModal(e) {
    if(e && e.target !== e.currentTarget) return;
    const m = document.getElementById('serviceModal');
    m.classList.add('opacity-0');
    setTimeout(() => m.classList.add('hidden'), 300);
}

// --- CONSTRUCTOR LOGIC ---
function initConstructor() { renderConstructorStep1(); }
function renderConstructorStep1() {
    const content = document.getElementById('constructor-content');
    if (!content) return;
    content.innerHTML = `
        <div id="c-step1">
            <h3 class="font-bold text-xl mb-6 text-brand-dark text-center">Какие зоны хотите смотреть и контролировать?</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                ${renderZoneOption('Вход в подъезд', 'fa-door-open')}
                ${renderZoneOption('Придомовая территория и парковка', 'fa-car')}
                ${renderZoneOption('Лестничная площадка', 'fa-stairs')}
                ${renderZoneOption('Квартира', 'fa-house')}
            </div>
            <div class="text-center">
                <button onclick="goToConstructorStep2()" class="bg-brand-primary px-8 py-3 rounded-full font-medium text-white hover:bg-brand-primaryHover transition text-sm">Далее <i class="fa-solid fa-arrow-right ml-1.5 text-xs"></i></button>
            </div>
        </div>
    `;
}

function renderZoneOption(val, icon) {
    const isChecked = constrState.zones.includes(val) ? 'checked' : '';
    return `
        <label class="cursor-pointer group relative">
            <input type="checkbox" class="hidden custom-checkbox" value="${val}" ${isChecked} onchange="toggleZone('${val}')">
            <div class="p-4 bg-white rounded-xl border border-brand-border hover:border-brand-primary transition flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-brand-surfaceVariant flex items-center justify-center text-brand-primary text-sm"><i class="fa-solid ${icon}"></i></div>
                <span class="text-brand-dark font-medium text-sm">${val}</span>
                <div class="ml-auto w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center check-icon opacity-0 transition scale-50 text-white bg-brand-primary"><i class="fa-solid fa-check text-[10px]"></i></div>
            </div>
        </label>
    `;
}

function toggleZone(val) {
    if (constrState.zones.includes(val)) constrState.zones = constrState.zones.filter(z => z !== val);
    else constrState.zones.push(val);
}

function goToConstructorStep2() {
    if (constrState.zones.length === 0) { alert('Пожалуйста, выберите хотя бы одну зону.'); return; }
    renderConstructorStep2();
}

function renderConstructorStep2() {
    const content = document.getElementById('constructor-content');
    let matchingDevices = [];
    const allProducts = state.products.filter(p => !p['Город'] || p['Город'] === 'Все города' || p['Город'] === 'Тюмень');

    constrState.zones.forEach(zone => {
        let zoneProducts = [];
        if (zone === 'Вход в подъезд') {
            zoneProducts = allProducts.filter(p => p['Категория'] === 'Видеодомофоны' || p['Категория'] === 'Видеомониторы');
        } else if (zone === 'Придомовая территория и парковка') {
            zoneProducts = allProducts.filter(p => p['Категория'] && p['Категория'].includes('Видеонаблюдени') && p['Наименование'] !== 'Камера внутриквартирная');
        } else if (zone === 'Лестничная площадка') {
            zoneProducts = allProducts.filter(p => p['Категория'] === 'Дверные видеозвонки');
        } else if (zone === 'Квартира') {
            zoneProducts = allProducts.filter(p => 
                p['Категория'] === 'Датчики' || 
                p['Категория'] === 'Умный дом' || 
                (p['Категория'] && p['Категория'].includes('Видеонаблюдени') && p['Наименование'] === 'Камера внутриквартирная')
            );
        }
        if (zoneProducts.length > 0) matchingDevices.push({ zone: zone, items: zoneProducts });
    });

    if (matchingDevices.length === 0) {
        content.innerHTML = `<div class="text-center text-brand-dark py-8"><h3 class="text-sm font-medium">К сожалению, для выбранных зон устройств пока нет в каталоге.</h3><button onclick="renderConstructorStep1()" class="mt-4 text-brand-primary underline text-xs">Назад</button></div>`;
        return;
    }

    let devicesHtml = '';
    matchingDevices.forEach(group => {
        devicesHtml += `<h4 class="text-brand-primary font-bold mb-2 mt-4 uppercase text-[11px] tracking-wider border-b border-brand-border pb-1">${group.zone}</h4><div class="grid grid-cols-1 md:grid-cols-2 gap-2">`;
        group.items.forEach(p => {
            const price = parseFloat(String(p['Цена продажи устройства']).replace(/[^\d.]/g,'')) || 0;
            const isChecked = constrState.devices.some(d => d.name === p['Наименование']) ? 'checked' : '';
            devicesHtml += `
                <label class="cursor-pointer">
                    <input type="checkbox" class="hidden custom-checkbox" onchange="toggleDevice('${p['Наименование']}', ${price})" ${isChecked}>
                    <div class="p-3 bg-white rounded-xl border border-brand-border hover:border-brand-primary transition flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <img src="${p['Ссылка на картинку']}" class="w-9 h-9 rounded-lg object-cover bg-brand-secondary">
                            <div class="text-xs">
                                <div class="text-brand-dark font-medium leading-tight">${p['Наименование']}</div>
                                <div class="text-gray-500 text-[11px] mt-0.5">${price} ₽</div>
                            </div>
                        </div>
                        <div class="w-4 h-4 rounded border border-gray-300 flex items-center justify-center check-icon opacity-0 transition scale-50 bg-brand-primary border-transparent"><i class="fa-solid fa-check text-[9px] text-white"></i></div>
                    </div>
                </label>
            `;
        });
        devicesHtml += `</div>`;
    });

    content.innerHTML = `
        <div id="c-step2" class="animate-fade-in">
            <h3 class="font-bold text-xl mb-1 text-brand-dark">Выберите устройства</h3>
            <p class="text-gray-500 text-xs mb-4">Отметьте оборудование, которое хотите включить в расчет.</p>
            <div class="max-h-[360px] overflow-y-auto custom-scrollbar pr-1 mb-6">${devicesHtml}</div>
            <div class="flex justify-between items-center pt-4 border-t border-brand-border">
                <button onclick="renderConstructorStep1()" class="text-gray-500 hover:text-brand-dark transition text-xs font-medium">Назад</button>
                <button onclick="goToConstructorStep3()" class="bg-brand-primary px-6 py-2.5 rounded-full font-medium text-white hover:bg-brand-primaryHover transition text-xs">Далее <i class="fa-solid fa-arrow-right ml-1"></i></button>
            </div>
        </div>
    `;
}

function toggleDevice(name, price) {
    const idx = constrState.devices.findIndex(d => d.name === name);
    if (idx > -1) constrState.devices.splice(idx, 1);
    else constrState.devices.push({ name, price });
}

function goToConstructorStep3() {
    if (constrState.zones.includes('Вход в подъезд')) renderConstructorStep3();
    else renderConstructorResult();
}

function renderConstructorStep3() {
     const content = document.getElementById('constructor-content');
     content.innerHTML = `
        <div id="c-step3" class="animate-fade-in max-w-lg mx-auto">
            <h3 class="font-bold text-xl mb-2 text-brand-dark text-center">Укажите ваш этаж</h3>
            <p class="text-gray-500 text-xs mb-6 text-center leading-relaxed">Укажите данные для предварительного расчета подключения к домофонной линии.</p>
            <div class="space-y-4 mb-6">
                <div>
                    <label class="text-xs font-bold text-brand-primary uppercase mb-1 block">Этаж</label>
                    <input type="number" id="c-floor" class="w-full bg-white border border-brand-border rounded-xl p-3 text-brand-dark outline-none focus:border-brand-primary transition text-center text-lg font-bold" placeholder="Например: 5" onchange="constrState.floor = this.value">
                </div>
                <div>
                    <label class="text-xs font-bold text-brand-primary uppercase mb-2 block text-center">Ваш домофон оборудован видеокамерой?</label>
                    <div class="flex gap-3">
                        <label class="flex-1 cursor-pointer">
                            <input type="radio" name="hasCam" value="yes" class="hidden peer" onchange="constrState.hasCamera = 'Да'">
                            <div class="p-3 rounded-xl bg-white border border-brand-border text-center text-brand-dark peer-checked:bg-brand-primary peer-checked:text-white peer-checked:border-brand-primary transition text-xs font-medium">Да</div>
                        </label>
                        <label class="flex-1 cursor-pointer">
                            <input type="radio" name="hasCam" value="no" class="hidden peer" onchange="constrState.hasCamera = 'Нет'">
                            <div class="p-3 rounded-xl bg-white border border-brand-border text-center text-brand-dark peer-checked:bg-brand-primary peer-checked:text-white peer-checked:border-brand-primary transition text-xs font-medium">Нет</div>
                        </label>
                    </div>
                </div>
            </div>
            <div class="flex justify-between items-center pt-4 border-t border-brand-border">
                <button onclick="renderConstructorStep2()" class="text-gray-500 hover:text-brand-dark transition text-xs font-medium">Назад</button>
                <button onclick="renderConstructorResult()" class="bg-brand-primary px-6 py-2.5 rounded-full font-medium text-white hover:bg-brand-primaryHover transition shadow-sm text-xs">Рассчитать стоимость</button>
            </div>
        </div>
     `;
}

function renderConstructorResult() {
    const total = constrState.devices.reduce((acc, curr) => acc + curr.price, 0);
    const content = document.getElementById('constructor-content');
    let note = `Зоны: ${constrState.zones.join(', ')}. Устройства: ${constrState.devices.map(d=>d.name).join(', ')}.`;
    if (constrState.floor) note += ` Этаж: ${constrState.floor}.`;
    if (constrState.hasCamera) note += ` Камера в домофоне: ${constrState.hasCamera}.`;
    note += ` Расчетная сумма: ${total} руб.`;

    content.innerHTML = `
        <div id="c-result" class="animate-fade-in text-center">
            <div class="inline-block p-3 rounded-full bg-green-100 text-brand-success text-2xl mb-3"><i class="fa-solid fa-calculator"></i></div>
            <h3 class="font-bold text-2xl mb-1 text-brand-dark">Предварительный расчет готов!</h3>
            <p class="text-gray-500 text-xs mb-4">Примерная стоимость системы безопасности под ключ в Тюмени:</p>
            <div class="text-4xl font-black text-brand-dark mb-6">${total.toLocaleString()} <span class="text-xl text-brand-primary">₽</span></div>
            <div class="bg-white rounded-2xl p-6 border border-brand-border text-left max-w-md mx-auto">
                <p class="text-xs text-gray-500 mb-4 text-center leading-relaxed">Оставьте контакты для получения профессиональной консультации.</p>
                <form onsubmit="submitLead(event, 'Конструктор', null, null, '${note}')" class="space-y-3">
                    <input type="text" name="name" placeholder="ФИО" required class="w-full p-3 bg-brand-secondary rounded-xl text-brand-dark outline-none border border-brand-border focus:border-brand-primary focus:bg-white text-xs">
                    <input type="tel" name="phone" placeholder="Номер телефона" required class="phone-mask w-full p-3 bg-brand-secondary rounded-xl text-brand-dark outline-none border border-brand-border focus:border-brand-primary focus:bg-white text-xs">
                    <div class="grid grid-cols-2 gap-2">
                        <select name="method" class="w-full p-3 bg-brand-secondary rounded-xl text-brand-dark outline-none border border-brand-border focus:border-brand-primary focus:bg-white text-xs">
                            <option value="MAX">MAX</option>
                            <option value="Phone">Звонок</option>
                        </select>
                        <input type="text" name="city" placeholder="Город" value="Тюмень" readonly class="w-full p-3 bg-brand-secondary rounded-xl text-gray-500 outline-none border border-brand-border text-xs cursor-not-allowed">
                    </div>
                    <button class="w-full bg-brand-primary py-3 rounded-full font-medium text-white hover:bg-brand-primaryHover transition text-xs shadow-sm">Получить смету</button>
                </form>
            </div>
            <button onclick="initConstructor()" class="mt-4 text-gray-500 text-xs hover:text-brand-dark underline">Начать заново</button>
        </div>
    `;
    setupPhoneMasks();
}

// --- SUBMIT HANDLERS ---
async function submitLead(e, formName, n, p, note) {
    if(e.preventDefault) e.preventDefault();
    const btn = e.target.querySelector ? e.target.querySelector('button') : null; 
    const originalText = btn ? btn.innerText : ''; 
    if(btn) btn.innerText = 'Отправка...';
    
    const fd = e.target.tagName === 'FORM' ? new FormData(e.target) : new FormData();
    let method = fd.get('method') ? `Способ: ${fd.get('method')}. ` : '';
    let finalNote = note || fd.get('note') || '';
    finalNote = method + finalNote;

    const payload = { 
        action: 'submit_lead', 
        city: 'Тюмень', 
        name: n || fd.get('name') || 'Клиент', 
        phone: p || fd.get('phone'), 
        note: finalNote, 
        formName: formName 
    };
    
    try {
        await fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
        if(formName === 'Услуги') closeServiceModal();
        showToast();
        if(e.target.reset) e.target.reset();
    } catch(err) { 
        console.error(err); 
        alert('Ошибка отправки. Попробуйте позже.'); 
    } finally { 
        if(btn) btn.innerText = originalText; 
    }
}

function submitSubscribe(e) {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]')?.value || '';
    submitLead(e, 'Подписка', 'Подписчик', '', email);
}

async function openPolicyModal() {
    const m = document.getElementById('policyModal');
    m.classList.remove('hidden');
    setTimeout(() => m.classList.remove('opacity-0'), 10);
    const content = document.getElementById('policyContentArea');
    content.innerHTML = `<div class="text-center py-10"><div class="loader mx-auto mb-4"></div><p class="text-gray-400 text-xs">Загрузка документа...</p></div>`;
    const org = state.organizationName || 'ООО "УВБ"'; 
    const currentCity = state.city || 'Тюмень';
    try {
        const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=get_policy&orgName=${encodeURIComponent(org)}&city=${encodeURIComponent(currentCity)}`);
        const data = await res.json();
        if(data.status === 'success') content.innerHTML = escapeHtml(data.policy).replace(/\n/g, '<br>');
        else content.innerHTML = '<div class="text-center text-red-500 py-10 text-xs">Не удалось загрузить документ.</div>';
    } catch(e) { content.innerHTML = '<div class="text-center text-red-500 py-10 text-xs">Ошибка соединения.</div>'; }
}

function closePolicyModal(e) {
    if(e && e.target !== e.currentTarget) return;
    const m = document.getElementById('policyModal');
    m.classList.add('opacity-0');
    setTimeout(() => m.classList.add('hidden'), 300);
}