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

    window.logout = () => {
        localStorage.removeItem('admin_logged');
        window.location.href = '/admin';
    };

    // Logout button manual link
    document.getElementById('btn-logout').onclick = window.logout;

    // Mobile menu helpers
    document.getElementById('mobile-menu-open').onclick = () => {
        document.getElementById('admin-sidebar').classList.add('open');
        document.getElementById('sidebar-overlay').classList.add('show');
    };
    document.getElementById('mobile-menu-close').onclick = () => {
        document.getElementById('admin-sidebar').classList.remove('open');
        document.getElementById('sidebar-overlay').classList.remove('show');
    };

    // Inicializar
    fetchData();

    // Fecha Header
    const mainSubtitle = document.getElementById('main-subtitle');
    if (mainSubtitle) mainSubtitle.textContent = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

});
