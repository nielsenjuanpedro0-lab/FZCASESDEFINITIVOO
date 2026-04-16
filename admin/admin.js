document.addEventListener('DOMContentLoaded', () => {

    // ==============================================================================
    // 1. NAVEGACIÓN (Prioridad Máxima)
    // ==============================================================================
    window.switchTab = function(targetId, TitleName) {
        const panels = document.querySelectorAll('.tab-content');
        const navItems = document.querySelectorAll('.nav-item');
        const mainTitle = document.getElementById('main-title');

        panels.forEach(p => { p.style.display = 'none'; p.classList.remove('active'); });
        navItems.forEach(n => n.classList.remove('active'));

        const targetPanel = document.getElementById(targetId);
        if (targetPanel) {
            targetPanel.style.display = 'block';
            targetPanel.classList.add('active');
        }

        document.querySelectorAll(`.nav-item[data-target="${targetId}"]`).forEach(el => el.classList.add('active'));
        if (mainTitle && TitleName) mainTitle.textContent = TitleName;

        const sidebar = document.getElementById('admin-sidebar');
        if (sidebar) sidebar.classList.remove('open');
        const overlay = document.getElementById('sidebar-overlay');
        if (overlay) overlay.classList.remove('show');
    };

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const navText = item.querySelector('.nav-text');
            window.switchTab(item.dataset.target, navText ? navText.textContent : 'Panel');
        });
    });

    // Accesos directos desde las tarjetas KPI
    const kpiProducts = document.querySelector('.icon-products');
    if (kpiProducts) kpiProducts.closest('.kpi-card').onclick = () => window.switchTab('view-productos', 'Productos');
    const kpiSales = document.querySelector('.icon-sales');
    if (kpiSales) kpiSales.closest('.kpi-card').onclick = () => window.switchTab('view-ventas', 'Ventas');

    // ==============================================================================
    // 2. CONFIGURACIÓN SUPABASE
    // ==============================================================================
    const SUPABASE_URL = 'https://sypleinfsemauzjcxxrx.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5cGxlaW5mc2VtYXV6amN4eHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMzExODYsImV4cCI6MjA5MTkwNzE4Nn0.p_EvcoFKwZ38HTvHK28NtlK573jVG2suR0OX17GA_IE';
    let _supabase = null;

    try {
        _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } catch (e) {
        console.error("Error inicializando Supabase:", e);
    }

    // ==============================================================================
    // 3. DATOS Y RENDERIZADO
    // ==============================================================================
    let memoryProducts = [];
    let memorySales = [];
    const formatMoney = (amount) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

    async function fetchData() {
        if (!_supabase) return;
        try {
            const { data: products } = await _supabase.from('products').select('*').order('created_at', { ascending: false });
            if (products) memoryProducts = products;

            const { data: sales } = await _supabase.from('sales').select('*').order('fecha', { ascending: false });
            if (sales) memorySales = sales;
        } catch (e) {
            console.error("Error al obtener datos:", e);
        } finally {
            initRenders();
        }
    }

    function initRenders() {
        calcularKPIs();
        renderProductos();
        renderVentas();
    }

    function calcularKPIs() {
        if (!document.getElementById('kpi-total-prod')) return;
        document.getElementById('kpi-total-prod').textContent = memoryProducts.length;
        document.getElementById('badge-products').textContent = memoryProducts.length;

        const actualMonth = new Date().getMonth();
        const salesThisMonth = memorySales.filter(s => new Date(s.fecha).getMonth() === actualMonth);

        document.getElementById('kpi-total-sales').textContent = salesThisMonth.length;
        document.getElementById('badge-sales').textContent = memorySales.length;

        let grossRevenue = 0;
        let totalCost = 0;
        salesThisMonth.forEach(sale => {
            grossRevenue += (sale.precio_final * sale.cantidad);
            totalCost += (sale.precio_costo * sale.cantidad);
        });

        document.getElementById('kpi-gross-revenue').textContent = formatMoney(grossRevenue);
        document.getElementById('kpi-net-profit').textContent = formatMoney(grossRevenue - totalCost);
    }

    function renderProductos(filterText = "") {
        const tbody = document.getElementById('tbody-products');
        if (!tbody) return;
        tbody.innerHTML = '';

        const arr = memoryProducts.filter(p => p.nombre.toLowerCase().includes(filterText.toLowerCase()));
        arr.forEach(prod => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${prod.imagen}" class="prod-thumb"></td>
                <td><strong>${prod.nombre}</strong> <br> <small>ID: ${prod.id}</small></td>
                <td>${prod.categoria}</td>
                <td>${formatMoney(prod.precio_venta)}</td>
                <td>${formatMoney(prod.precio_costo)}</td>
                <td>${prod.stock}</td>
                <td><span class="pill-badge ${prod.activo ? 'badge-active' : 'badge-inactive'}">${prod.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                    <button class="action-btn" onclick="window.editProduct(${prod.id})">Editar</button>
                    <button class="action-btn delete" onclick="window.deleteProduct(${prod.id})">Borrar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        const selectProd = document.getElementById('sale-prod');
        if (selectProd) {
            selectProd.innerHTML = '<option value="">Seleccione un producto...</option>';
            memoryProducts.filter(p => p.activo && p.stock > 0).forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = `[Stk: ${p.stock}] ${p.nombre}`;
                opt.dataset.price = p.precio_venta;
                opt.dataset.cost = p.precio_costo;
                selectProd.appendChild(opt);
            });
        }
    }

    function renderVentas() {
        const tbody = document.getElementById('tbody-sales');
        if (!tbody) return;
        tbody.innerHTML = '';

        memorySales.forEach(sale => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(sale.fecha).toLocaleDateString()}</td>
                <td><strong>${sale.producto_nombre}</strong></td>
                <td>${sale.cliente}</td>
                <td>x${sale.cantidad}</td>
                <td>${formatMoney(sale.precio_final)}</td>
                <td>${sale.metodo_pago}</td>
                <td><button class="action-btn delete" onclick="window.deleteSale(${sale.id})">X</button></td>
            `;
            tbody.appendChild(tr);
        });
    }

    // ==============================================================================
    // 4. FUNCIONES GLOBALES (CRUD)
    // ==============================================================================
    window.deleteProduct = async (id) => {
        if (!confirm("¿Borrar producto?")) return;
        const { error } = await _supabase.from('products').delete().eq('id', id);
        if (!error) fetchData();
    };

    // ==============================================================================
    // 4. MODALES Y FORMULARIOS (CRUD)
    // ==============================================================================
    const modalProduct = document.getElementById('modal-product');
    const formProduct = document.getElementById('form-product');
    const modalSale = document.getElementById('modal-sale');
    const formSale = document.getElementById('form-sale');

    // ============== TOAST HELPER =================
    function showToast(msg, type = 'success') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    // -- Helpers de UI (Chips, Imágenes, Modelos) --
    function initChipSelectors() {
        document.querySelectorAll('.chip-container, .chip-container-pills').forEach(container => {
            const chips = container.querySelectorAll('.chip, .chip-pill');
            const hiddenInput = container.querySelector('input[type="hidden"]');
            chips.forEach(chip => {
                chip.onclick = () => {
                    chips.forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    if (hiddenInput) {
                        hiddenInput.value = chip.getAttribute('data-val');
                        hiddenInput.dispatchEvent(new Event('change'));
                    }
                };
            });
        });
    }

    function initImageUpload() {
        [1, 2, 3].forEach(slot => {
            const fileInput = document.getElementById(`file-${slot}`);
            const hiddenInput = document.getElementById(`prod-img-${slot}`);
            const thumb = document.getElementById(`img-${slot}`);
            if (!fileInput) return;
            fileInput.onchange = e => {
                const reader = new FileReader();
                reader.onload = ev => {
                    hiddenInput.value = ev.target.result;
                    thumb.src = ev.target.result;
                    thumb.classList.remove('hidden');
                    if (thumb.previousElementSibling) thumb.previousElementSibling.classList.add('hidden');
                };
                reader.readAsDataURL(e.target.files[0]);
            };
        });
    }

    const CATEGORY_MODELS = {
        'iPhone': [
            'iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max', 
            'iPhone 12 Mini', 'iPhone 12', 'iPhone 12 Pro', 'iPhone 12 Pro Max', 
            'iPhone 13 Mini', 'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max', 
            'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max', 
            'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max', 
            'iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max',
            'iPhone 17', 'iPhone 17 Plus', 'iPhone 17 Pro', 'iPhone 17 Pro Max'
        ],
        'MacBook': [
            'MacBook Air M1', 'MacBook Air M2', 'MacBook Air M3', 
            'MacBook Pro 13"', 'MacBook Pro 14"', 'MacBook Pro 16"',
            'iMac 24"'
        ],
        'iPad': [
            'iPad (9na Gen)', 'iPad (10ma Gen)', 
            'iPad Mini (6ta Gen)', 
            'iPad Air (5ta Gen)', 'iPad Air (M2)', 
            'iPad Pro 11"', 'iPad Pro 12.9"', 'iPad Pro 13" (M4)'
        ],
        'AirPods': [
            'AirPods 2', 'AirPods 3', 'AirPods 4', 
            'AirPods Pro (1ra Gen)', 'AirPods Pro 2', 'AirPods Max'
        ],
        'Accesorios': [
            'Apple Watch SE', 'Apple Watch Series 8', 'Apple Watch Series 9', 'Apple Watch Series 10', 'Apple Watch Ultra', 'Apple Watch Ultra 2',
            'Cargador MagSafe', 'Cable Tipo C a Lightning', 'Cable Tipo C a Tipo C', 'Adaptador de corriente 20W',
            'Funda Silicone Case', 'Funda Clear Case', 'Funda FineWoven',
            'Apple Pencil (1ra Gen)', 'Apple Pencil (2da Gen)', 'Apple Pencil (USB-C)', 'Apple Pencil Pro'
        ]
    };

    function updateModelDropdown(category) {
        const select = document.getElementById('prod-name');
        if (!select) return;
        select.innerHTML = '';
        (CATEGORY_MODELS[category] || CATEGORY_MODELS['iPhone']).forEach(m => {
            const opt = document.createElement('option');
            opt.value = m; opt.textContent = m;
            select.appendChild(opt);
        });
    }

    // -- Listeners de Botones Abrir --
    document.getElementById('btn-add-product').onclick = () => {
        formProduct.reset();
        document.getElementById('prod-id').value = '';
        document.getElementById('modal-prod-title').textContent = 'Nuevo Producto';
        // Reset chips
        document.querySelectorAll('.chip, .chip-pill').forEach(c => c.classList.remove('active'));
        document.querySelectorAll('.chip-container, .chip-container-pills').forEach(container => {
            const first = container.querySelector('.chip, .chip-pill');
            if (first) first.click();
        });
        modalProduct.classList.remove('hidden');
    };

    document.getElementById('btn-add-sale').onclick = () => {
        formSale.reset();
        document.getElementById('preview-total').textContent = '$0';
        modalSale.classList.remove('hidden');
    };

    // -- Handlers de Envío --
    formProduct.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('prod-id').value;
        const prodData = {
            nombre: document.getElementById('prod-name').value,
            categoria: document.getElementById('prod-cat').value,
            subcategoria: document.getElementById('prod-subcat').value,
            almacenamiento: document.getElementById('prod-storage').value,
            color: document.getElementById('prod-color-custom').value || document.getElementById('prod-color').value,
            precio_venta: Number(document.getElementById('prod-sell').value),
            precio_costo: Number(document.getElementById('prod-cost').value),
            battery: document.getElementById('prod-battery').value,
            ubicacion: document.getElementById('prod-location') ? document.getElementById('prod-location').value : null,
            notas: document.getElementById('prod-features') ? document.getElementById('prod-features').value : null,
            imagen: document.getElementById('prod-img-1').value || '/assets/iphone_case.png',
            stock: 1,
            activo: document.getElementById('prod-active').checked
        };

        const { error } = id 
            ? await _supabase.from('products').update(prodData).eq('id', id)
            : await _supabase.from('products').insert([prodData]);

        if (!error) {
            modalProduct.classList.add('hidden');
            showToast(id ? 'Producto actualizado' : 'Producto agregado');
            fetchData();
        } else {
            console.error("Error BD:", error);
            alert("Error de BD: " + error.message + "\nDetalle: " + error.details);
        }
    };

    formSale.onsubmit = async (e) => {
        e.preventDefault();
        const sel = document.getElementById('sale-prod');
        const opt = sel.options[sel.selectedIndex];
        const saleData = {
            producto_id: Number(sel.value),
            producto_nombre: opt.text.split('] ')[1],
            cantidad: Number(document.getElementById('sale-qty').value),
            precio_final: Number(document.getElementById('sale-price').value),
            precio_costo: Number(opt.dataset.cost),
            cliente: document.getElementById('sale-client').value,
            metodo_pago: document.getElementById('sale-method').value,
            fecha: new Date().toISOString()
        };

        const { error } = await _supabase.from('sales').insert([saleData]);
        if (!error) {
            modalSale.classList.add('hidden');
            showToast('Venta registrada');
            fetchData();
        } else {
            console.error("Error BD Ventas:", error);
            alert("Error al registrar venta: " + error.message);
        }
    };

    // -- Inicializadores de Formulario --
    initChipSelectors();
    initImageUpload();
    document.getElementById('prod-cat').onchange = (e) => updateModelDropdown(e.target.value);
    document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => {
        b.closest('.modal-overlay').classList.add('hidden');
    });

    // Logout y Mobile
    document.getElementById('btn-logout').onclick = window.logout;
    document.getElementById('mobile-menu-open').onclick = () => {
        document.getElementById('admin-sidebar').classList.add('open');
        document.getElementById('sidebar-overlay').classList.add('show');
    };
    document.getElementById('mobile-menu-close').onclick = () => {
        document.getElementById('admin-sidebar').classList.remove('open');
        document.getElementById('sidebar-overlay').classList.remove('show');
    };

    window.editProduct = (id) => {
        const p = memoryProducts.find(x => x.id === id);
        if (!p) return;
        document.getElementById('prod-id').value = p.id;
        document.getElementById('modal-prod-title').textContent = 'Editar Producto';
        document.getElementById('prod-name').value = p.nombre;
        document.getElementById('prod-sell').value = p.precio_venta;
        document.getElementById('prod-cost').value = p.precio_costo;
        document.getElementById('prod-active').checked = p.activo;
        document.getElementById('prod-battery').value = p.battery || '';
        
        // Chips
        const fields = [
            { id: 'container-category', val: p.categoria },
            { id: 'container-condition', val: p.subcategoria },
            { id: 'container-storage', val: p.almacenamiento }
        ];
        fields.forEach(f => {
            const chip = document.getElementById(f.id).querySelector(`[data-val="${f.val}"]`);
            if (chip) chip.click();
        });

        modalProduct.classList.remove('hidden');
    };

    // Inicializar carga de datos
    fetchData();

    // Fecha Header
    const mainSubtitle = document.getElementById('main-subtitle');
    if (mainSubtitle) mainSubtitle.textContent = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

});
