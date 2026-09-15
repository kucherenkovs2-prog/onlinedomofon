const SANITY_PRODUCTS_QUERY = `*[_type == "product"] | order(_createdAt desc) {
    "name": name,
    "category": category,
    "price": price,
    "shortDescription": shortDescription,
    "imageUrl": imageUrl,
    "city": city,
    "status": status,
    "promo": promo,
    "tag": tag
}`;

const SANITY_PRODUCTS_URL = `https://mrqjlkyb.apicdn.sanity.io/v2025-02-19/data/query/production?query=${encodeURIComponent(SANITY_PRODUCTS_QUERY)}`;
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzEs6TYK95CKK6bTPLH6dUgj-MC82wRHa_WKszWS-LyV4bJBmef9m4yWeh5hy72mJx0bQ/exec';

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
}

function normalizeProduct(product) {
    return {
        name: product.name || product['Наименование'],
        category: product.category || product['Категория'] || 'Без категории',
        price: product.price ?? product['Цена продажи устройства'] ?? 0,
        shortDescription: product.shortDescription || product['Краткое описание'] || '',
        imageUrl: product.imageUrl || product['Ссылка на картинку'] || '',
        city: product.city || product['Город'] || 'Все города',
        status: product.status || product['Статус наличия'] || 'В наличии',
        promo: product.promo || product['Акция'] || '',
        tag: product.tag || product['Метка'] || ''
    };
}

async function loadProducts() {
    const status = document.getElementById('productsStatus');
    try {
        const response = await fetch(SANITY_PRODUCTS_URL);
        if (!response.ok) throw new Error(`Sanity request failed: ${response.status}`);
        const data = await response.json();
        const products = (data.result || []).map(normalizeProduct);
        if (products.length) return products;
    } catch (error) {
        console.warn('Sanity catalog unavailable, using fallback:', error);
    }

    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=get_products`);
    const data = await response.json();
    return (Array.isArray(data) ? data : data.products || []).map(normalizeProduct);
}

function renderProducts(products, selectedCategory = 'Все') {
    const grid = document.getElementById('productsGrid');
    const visibleProducts = products.filter(product =>
        selectedCategory === 'Все' || product.category === selectedCategory
    );

    grid.innerHTML = visibleProducts.length ? visibleProducts.map(product => `
        <article class="group bg-white border border-brand-border rounded-3xl overflow-hidden hover:-translate-y-1 hover:shadow-g-card transition duration-200">
            <div class="h-60 bg-slate-50/70 p-6 flex items-center justify-center relative">
                ${product.promo || product.tag ? `<span class="absolute top-3 right-3 z-10 bg-brand-primary text-white text-[11px] font-bold px-3 py-1 rounded-full">${escapeHtml(product.promo || product.tag)}</span>` : ''}
                <img src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.name)}" class="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300" loading="lazy">
            </div>
            <div class="p-5">
                <p class="text-[11px] uppercase tracking-wider text-brand-primary font-bold mb-2">${escapeHtml(product.category)}</p>
                <h2 class="font-bold text-gray-900 leading-snug min-h-12 mb-2">${escapeHtml(product.name)}</h2>
                <p class="text-xs text-gray-500 line-clamp-2 min-h-10 mb-4">${escapeHtml(product.shortDescription)}</p>
                <div class="flex items-center justify-between gap-3">
                    <strong class="text-lg text-gray-900">${escapeHtml(product.price)} ₽</strong>
                    <span class="text-[11px] font-semibold text-brand-success">${escapeHtml(product.status)}</span>
                </div>
            </div>
        </article>
    `).join('') : '<p class="col-span-full text-center text-gray-500 py-10">В этой категории пока нет товаров.</p>';
}

async function initProductsPage() {
    const status = document.getElementById('productsStatus');
    try {
        const products = await loadProducts();
        const categories = ['Все', ...new Set(products.map(product => product.category).filter(Boolean))];
        const tabs = document.getElementById('categoryTabs');
        let selectedCategory = 'Все';
        tabs.innerHTML = categories.map(category => `
            <button type="button" data-category="${escapeHtml(category)}" class="category-tab whitespace-nowrap px-4 py-2 rounded-full border border-brand-border bg-white text-gray-700 hover:border-brand-primary hover:text-brand-primary transition text-xs font-medium">
                ${escapeHtml(category)}
            </button>
        `).join('');

        tabs.querySelector('[data-category="Все"]')?.classList.add('bg-brand-primary', 'text-white', 'border-brand-primary');
        tabs.addEventListener('click', event => {
            const button = event.target.closest('[data-category]');
            if (!button) return;
            selectedCategory = button.dataset.category;
            tabs.querySelectorAll('.category-tab').forEach(tab => tab.classList.remove('bg-brand-primary', 'text-white', 'border-brand-primary'));
            button.classList.add('bg-brand-primary', 'text-white', 'border-brand-primary');
            renderProducts(products, selectedCategory);
        });

        status.classList.add('hidden');
        renderProducts(products);
    } catch (error) {
        console.error(error);
        status.innerText = 'Не удалось загрузить каталог. Попробуйте обновить страницу.';
    }
}

document.addEventListener('DOMContentLoaded', initProductsPage);
