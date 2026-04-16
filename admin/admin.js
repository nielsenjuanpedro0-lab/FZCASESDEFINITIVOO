document.addEventListener('DOMContentLoaded', async () => {

    // ==============================================================================
    // CONFIGURACIÓN SUPABASE
    // ==============================================================================
    const SUPABASE_URL = 'https://sypleinfsemauzjcxxrx.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5cGxlaW5mc2VtYXV6amN4eHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMzExODYsImV4cCI6MjA5MTkwNzE4Nn0.p_EvcoFKwZ38HTvHK28NtlK573jVG2suR0OX17GA_IE';
    const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // 1. FECHA Y HORA HEADER
    const mainSubtitle = document.getElementById('main-subtitle');
    if (mainSubtitle) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        mainSubtitle.textContent = new Date().toLocaleDateString('es-AR', options);
    }

    // ==============================================================================
    // CUSTOM CONFIRM MODAL HELPER
    // ==============================================================================
    window.customConfirm = (config) => {
        return new Promise((resolve) => {
            const modal = document.getElementById('modal-confirm');
            const titleEl = document.getElementById('confirm-title');
            const msgEl = document.getElementById('confirm-message');
            const iconEl = document.getElementById('confirm-icon');
            const btnOk = document.getElementById('btn-confirm-ok');
            const btnCancel = document.getElementById('btn-confirm-cancel');

            if (!modal) return resolve(confirm(config.message || "¿Estás seguro?"));

            titleEl.textContent = config.title || "¿Estás seguro?";
            msgEl.textContent = config.message || "Esta acción no se puede deshacer.";
            iconEl.textContent = config.icon || "";

            btnOk.className = `btn ${config.btnOkClass || 'btn-danger'}`;
            btnOk.textContent = config.btnOkText || "Confirmar";

            modal.classList.remove('hidden');

            const onOk = () => {
                modal.classList.add('hidden');
                cleanup();
                resolve(true);
            };

            const onCancel = () => {
                modal.classList.add('hidden');
                cleanup();
                resolve(false);
            };

            const cleanup = () => {
                btnOk.removeEventListener('click', onOk);
                btnCancel.removeEventListener('click', onCancel);
            };

            btnOk.addEventListener('click', onOk);
            btnCancel.addEventListener('click', onCancel);
        });
    };

    // ==============================================================================
    // CARGA DE DATOS DESDE SUPABASE
    // ==============================================================================
    let memoryProducts = [];
    let memorySales = [];

    async function fetchData() {
        try {
            // Cargar Productos
            const { data: products, error: pError } = await _supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (!pError) memoryProducts = products;

            // Cargar Ventas
            const { data: sales, error: sError } = await _supabase
                .from('sales')
                .select('*')
                .order('fecha', { ascending: false });

            if (!sError) memorySales = sales;
        } catch (e) {
            console.error("Error cargando datos:", e);
        } finally {
            initRenders();
        }
    }

    // Llamada inicial a la base de datos
    fetchData();
ucts));
        }
    }

    seedInitialProducts();
    let memorySales = JSON.parse(localStorage.getItem('admin_sales'));
    let memoryCanjes = JSON.parse(localStorage.getItem('admin_canjes'));

    // ==============================================================================
    // RENDERIZADORES UI Y KPIS
    // ==============================================================================

    const formatMoney = (amount) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

    function calcularKPIs() {
        // Total productos
        document.getElementById('kpi-total-prod').textContent = memoryProducts.length;
        document.getElementById('badge-products').textContent = memoryProducts.length;

        // Filtrar Ventas de este mes
        const actualMonth = new Date().getMonth();
        const salesThisMonth = memorySales.filter(s => new Date(s.fecha).getMonth() === actualMonth);

        document.getElementById('kpi-total-sales').textContent = salesThisMonth.length;
        document.getElementById('badge-sales').textContent = memorySales.length;

        let grossRevenue = 0;
        let totalCost = 0;

        salesThisMonth.forEach(sale => {
            grossRevenue += (sale.precioFinal * sale.cantidad);
            totalCost += (sale.precioCosto * sale.cantidad);
        });

        const netProfit = grossRevenue - totalCost;

        // Tarjetas Generales en "Dashboard"
        document.getElementById('kpi-gross-revenue').textContent = formatMoney(grossRevenue);
        document.getElementById('kpi-net-profit').textContent = formatMoney(netProfit);
        if (netProfit < 0) {
            document.getElementById('kpi-net-profit').className = "kpi-number text-danger";
        } else {
            document.getElementById('kpi-net-profit').className = "kpi-number text-success";
        }

        // Tarjetas Especificas en "Ventas"
        document.getElementById('ventas-total-sales').textContent = salesThisMonth.length;
        document.getElementById('ventas-total-cost').textContent = formatMoney(totalCost);
        document.getElementById('ventas-net-profit').textContent = formatMoney(netProfit);
        if (netProfit < 0) {
            document.getElementById('ventas-net-profit').className = "kpi-number text-danger";
        } else {
            document.getElementById('ventas-net-profit').className = "kpi-number text-success";
        }

        document.getElementById('badge-canjes').textContent = memoryCanjes.length;
    }

    function renderProductos(filterText = "") {
        const tbody = document.getElementById('tbody-products');
        const emptyState = document.getElementById('empty-products');
        const table = document.getElementById('table-products');
        tbody.innerHTML = '';

        const arr = memoryProducts.filter(p => p.nombre.toLowerCase().includes(filterText.toLowerCase()));

        if (arr.length === 0) {
            table.classList.add('hidden');
            emptyState.classList.remove('hidden');
        } else {
            table.classList.remove('hidden');
            emptyState.classList.add('hidden');

            arr.forEach(prod => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><img src="${prod.imagen}" class="prod-thumb" alt="thumb" loading="lazy"></td>
                    <td><strong>${prod.nombre}</strong> <br> <small style="color:#9ca3af">ID: ${prod.id}</small></td>
                    <td>${prod.categoria} ${prod.subcategoria ? `(${prod.subcategoria})` : ''}</td>
                    <td>${formatMoney(prod.precioVenta)}</td>
                    <td>${formatMoney(prod.precioCosto)}</td>
                    <td>${prod.stock}</td>
                    <td><span class="pill-badge ${prod.activo ? 'badge-active' : 'badge-inactive'}">${prod.activo ? 'Activo' : 'Inactivo'}</span></td>
                    <td>
                        <button class="action-btn edit" title="Editar" onclick="window.editProduct(${prod.id})">
                             Editar
                         </button>
                         <button class="action-btn delete" title="Eliminar" onclick="window.deleteProduct(${prod.id})">
                             Eliminar
                         </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        // Actualizar Select de Modales Ventas
        const selectProd = document.getElementById('sale-prod');
        if (selectProd) {
            selectProd.innerHTML = '<option value="">Seleccione un producto...</option>';
            memoryProducts.filter(p => p.activo && p.stock > 0).forEach(p => {
                selectProd.innerHTML += `<option value="${p.id}" data-price="${p.precioVenta}" data-cost="${p.precioCosto}">[Stk: ${p.stock}] ${p.nombre}</option>`;
            });
        }
    }

    function renderVentas() {
        const tbody = document.getElementById('tbody-sales');
        const emptyState = document.getElementById('empty-sales');
        const table = document.getElementById('table-sales');
        tbody.innerHTML = '';

        if (memorySales.length === 0) {
            table.classList.add('hidden');
            emptyState.classList.remove('hidden');
        } else {
            table.classList.remove('hidden');
            emptyState.classList.add('hidden');

            // Order by date desc
            const arr = [...memorySales].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

            arr.forEach(sale => {
                const tr = document.createElement('tr');
                const ganancia = (sale.precioFinal - sale.precioCosto) * sale.cantidad;
                tr.innerHTML = `
                    <td><small>${new Date(sale.fecha).toLocaleDateString('es-AR')}</small></td>
                    <td><strong>${sale.productoNombre}</strong></td>
                    <td>${sale.cliente || '-'}</td>
                    <td>x${sale.cantidad}</td>
                    <td>${formatMoney(sale.precioFinal * sale.cantidad)}</td>
                    <td style="color:#6e6e73">${formatMoney(sale.precioCosto * sale.cantidad)}</td>
                    <td style="color:var(--admin-success); font-weight:600;">${formatMoney(ganancia)}</td>
                    <td><span class="pill-badge badge-info">${sale.metodoPago}</span></td>
                    <td>
                         <button class="action-btn delete" title="Cancelar Venta" onclick="window.deleteSale(${sale.id})">Eliminar</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    }


    function renderCanjes() {
        const tbody = document.getElementById('tbody-canjes');
        const emptyState = document.getElementById('empty-canjes');
        const table = document.getElementById('table-canjes');
        tbody.innerHTML = '';

        if (memoryCanjes.length === 0) {
            table.classList.add('hidden');
            emptyState.classList.remove('hidden');
        } else {
            table.classList.remove('hidden');
            emptyState.classList.add('hidden');

            memoryCanjes.forEach(c => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><small>${new Date(c.fecha).toLocaleDateString()}</small></td>
                    <td><strong>${c.modelo}</strong></td>
                    <td>${c.estado}</td>
                    <td>${c.bateria}%</td>
                    <td><span class="pill-badge badge-warning">Pendiente</span></td>
                    <td>
                         <button class="action-btn" title="Ignorar">Eliminar</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    }

    function initRenders() {
        calcularKPIs();
        renderProductos();
        renderVentas();
        renderCanjes();
    }


    // ==============================================================================
    // CONTROLADOR DE TABS Y SIDEBAR (SPA)
    // ==============================================================================

    const navItems = document.querySelectorAll('.nav-item');
    const panels = document.querySelectorAll('.tab-content');
    const mainTitle = document.getElementById('main-title');

    function switchTab(targetId, TitleName) {
        panels.forEach(p => {
            p.style.display = 'none';
            p.classList.remove('active');
        });
        navItems.forEach(n => n.classList.remove('active'));

        const targetPanel = document.getElementById(targetId);
        if (targetPanel) {
            targetPanel.style.display = 'block';
            targetPanel.classList.add('active');
        }

        document.querySelectorAll(`.nav-item[data-target="${targetId}"]`).forEach(el => el.classList.add('active'));
        if (mainTitle) mainTitle.textContent = TitleName;

        document.getElementById('admin-sidebar').classList.remove('open');
        const overlay = document.getElementById('sidebar-overlay');
        if (overlay) overlay.classList.remove('show');
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const navText = item.querySelector('.nav-text');
            switchTab(item.dataset.target, navText ? navText.textContent : 'Panel');
        });
    });

    // tabBtns removed


    // ==============================================================================
    // GESTIÓN DE PRODUCTOS (CRUD)
    // ==============================================================================

    const modalProduct = document.getElementById('modal-product');
    const formProduct = document.getElementById('form-product');
    const searchProd = document.getElementById('search-products');

    // ============== TOAST =================
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

    // ============ CHIP SELECTION HELPER ==========
    function initChipSelectors() {
        const containers = [
            'container-category',
            'container-condition',
            'container-location',
            'container-storage',
            'container-colors',
            'container-warranty'
        ];

        containers.forEach(id => {
            const container = document.getElementById(id);
            if (!container) return;

            const chips = container.querySelectorAll('.chip, .chip-pill');
            const hiddenInput = container.querySelector('input[type="hidden"]');

            chips.forEach(chip => {
                chip.addEventListener('click', () => {
                    // Deactivate all in this container
                    chips.forEach(c => c.classList.remove('active'));
                    // Activate this
                    chip.classList.add('active');
                    // Update hidden input
                    const val = chip.getAttribute('data-val');
                    if (hiddenInput) {
                        hiddenInput.value = val;
                        // Trigger change for conditional logic
                        hiddenInput.dispatchEvent(new Event('change'));
                    }
                });
            });
        });

    }

    // ============ MULTI-IMAGE UPLOAD ============
    function initTechImageUpload() {
        const slots = [1, 2, 3];
        slots.forEach(slot => {
            const fileInput = document.getElementById(`file-${slot}`);
            const hiddenInput = document.getElementById(`prod-img-${slot}`);
            const thumb = document.getElementById(`img-${slot}`);
            const placeholder = thumb.previousElementSibling;

            if (!fileInput) return;

            fileInput.addEventListener('change', e => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = ev => {
                    hiddenInput.value = ev.target.result;
                    thumb.src = ev.target.result;
                    thumb.classList.remove('hidden');
                    if (placeholder) placeholder.classList.add('hidden');
                };
                reader.readAsDataURL(file);
            });
        });
    }

    // ============ INIT MODAL HELPERS (TECH) ======
    // Global Modal Initialization (Run once)
    let modalHelpersInitialized = false;
    const CATEGORY_MODELS = {
        'iPhone': [
            'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max',
            'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max',
            'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max',
            'iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max',
            'iPhone 17', 'iPhone 17 Plus', 'iPhone 17 Pro', 'iPhone 17 Pro Max'
        ],
        'MacBook': ['MacBook Air M1', 'MacBook Air M2', 'MacBook Air M3', 'MacBook Pro 14"', 'MacBook Pro 16"'],
        'iPad': ['iPad Air', 'iPad Pro', 'iPad Mini', 'iPad (10th Gen)'],
        'AirPods': ['AirPods 2', 'AirPods 3', 'AirPods Pro 2', 'AirPods Max'],
        'Accesorios': ['Apple Watch', 'Cargador MagSafe', 'Cable Lightning/USB-C', 'Funda Silicone']
    };

    function updateModelDropdown(category) {
        const select = document.getElementById('prod-name');
        if (!select) return;

        const models = CATEGORY_MODELS[category] || CATEGORY_MODELS['iPhone'];

        // Save current value to restore if possible
        const currentVal = select.value;

        select.innerHTML = '';
        models.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = m;
            select.appendChild(opt);
        });

        // Restore or default to first
        if (models.includes(currentVal)) {
            select.value = currentVal;
        } else {
            select.value = models[0];
        }
    }

    function initModalOnce() {
        if (modalHelpersInitialized) return;

        initChipSelectors();
        initTechImageUpload();

        // Category change -> Update Models
        const catInput = document.getElementById('prod-cat');
        if (catInput) {
            catInput.addEventListener('change', () => {
                updateModelDropdown(catInput.value);
            });
        }

        // Specific Logic: Battery field visibility
        const conditionInput = document.getElementById('prod-subcat');
        const batteryGroup = document.getElementById('group-battery');
        if (conditionInput && batteryGroup) {
            conditionInput.addEventListener('change', () => {
                const val = conditionInput.value;
                if (val === 'Usado') {
                    batteryGroup.classList.remove('hidden');
                } else {
                    batteryGroup.classList.add('hidden');
                    document.getElementById('prod-battery').value = '';
                }
            });
        }

        modalHelpersInitialized = true;
    }

    function initModalHelpers() {
        initModalOnce();

        // Reset scroll
        const bodyScroll = document.querySelector('.tech-body-scroll');
        if (bodyScroll) bodyScroll.scrollTop = 0;

        // Force initial battery state
        const conditionInput = document.getElementById('prod-subcat');
        if (conditionInput) conditionInput.dispatchEvent(new Event('change'));

        // Force initial models state
        const catInput = document.getElementById('prod-cat');
        if (catInput) updateModelDropdown(catInput.value);
    }

    document.getElementById('btn-add-product').addEventListener('click', () => {
        initModalHelpers();
        document.getElementById('prod-id').value = '';
        document.getElementById('modal-prod-title').textContent = 'Nuevo Producto';
        formProduct.reset();

        // Reset chips to default active
        document.querySelectorAll('.chip, .chip-pill').forEach(c => c.classList.remove('active'));
        document.querySelectorAll('.chip-container, .chip-container-pills').forEach(container => {
            const first = container.querySelector('.chip, .chip-pill');
            if (first) first.click();
        });
        // Reset images
        const TRANSPARENT_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        for (let i = 1; i <= 3; i++) {
            const img = document.getElementById(`img-${i}`);
            const ph = img.previousElementSibling;
            img.src = TRANSPARENT_PIXEL;
            img.classList.add('hidden');
            if (ph) ph.classList.remove('hidden');
            document.getElementById(`prod-img-${i}`).value = '';
        }

        modalProduct.classList.remove('hidden');
    });

    // ============ GOOGLE SHEETS SYNC ============
    const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbwFkIAtzJACc47EOcNM-9BzkQBY6N_M8VuwEgrmwlFGugEqm8SsM4zKdG7t22h3WuRZOA/exec'; // PEGA TU URL AQUÍ

    async function syncWithGoogleSheets(prodData) {
        if (!GOOGLE_SHEET_URL || GOOGLE_SHEET_URL.includes('...')) {
            console.log('Sincronización con Google Sheets omitida: URL no configurada.');
            return;
        }

        try {
            // Usamos mode: 'no-cors' ya que Apps Script no siempre responde con cabeceras CORS correctas
            await fetch(GOOGLE_SHEET_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prodData)
            });
            console.log('Datos enviados a Google Sheets con éxito');
        } catch (error) {
            console.error('Error al sincronizar con Google Sheets:', error);
        }
    }

    formProduct.addEventListener('submit', async (e) => {
        e.preventDefault();
        const isEditing = document.getElementById('prod-id').value;
        const name = document.getElementById('prod-name').value;

        if (!name) {
            showToast('Seleccioná un modelo', 'error'); return;
        }

        const prodData = {
            nombre: name,
            categoria: document.getElementById('prod-cat').value,
            subcategoria: document.getElementById('prod-subcat').value,
            ubicacion: document.getElementById('prod-location').value,
            almacenamiento: document.getElementById('prod-storage').value,
            color: document.getElementById('prod-color-custom').value || document.getElementById('prod-color').value,
            precio_venta: Number(document.getElementById('prod-sell').value),
            precio_costo: Number(document.getElementById('prod-cost').value),
            activo: document.getElementById('prod-active').checked,
            battery: document.getElementById('prod-battery').value,
            notas: document.getElementById('prod-features').value,
            imagen: document.getElementById('prod-img-1').value || '/assets/iphone_case.png',
            stock: 1
        };

        if (isEditing) {
            const { error } = await _supabase
                .from('products')
                .update(prodData)
                .eq('id', isEditing);
            
            if (error) showToast('Error al actualizar', 'error');
            else showToast('Producto actualizado');
        } else {
            const { error } = await _supabase
                .from('products')
                .insert([prodData]);
            
            if (error) showToast('Error al guardar', 'error');
            else {
                showToast('Producto agregado con éxito');
                syncWithGoogleSheets(prodData);
            }
        }

        modalProduct.classList.add('hidden');
        fetchData(); // Recargar datos desde Supabase
    });

    searchProd.addEventListener('input', (e) => {
        renderProductos(e.target.value);
    });

    // Exponiendo globales
    window.editProduct = (id) => {
        const p = memoryProducts.find(x => x.id === id);
        if (!p) return;

        document.getElementById('prod-id').value = p.id;
        document.getElementById('modal-prod-title').textContent = 'Editar Producto';

        // Populate inputs
        document.getElementById('prod-name').value = p.nombre;
        document.getElementById('prod-imei').value = p.imei || '';
        document.getElementById('prod-serial').value = p.serial || '';
        document.getElementById('prod-sell').value = p.precioVenta;
        document.getElementById('prod-cost').value = p.precioCosto;
        document.getElementById('prod-active').checked = p.activo;
        document.getElementById('prod-battery').value = p.battery || '';
        document.getElementById('prod-features').value = p.notas || '';
        document.getElementById('prod-color-custom').value = p.color || '';

        // Chips
        const chipFields = [
            { id: 'container-category', val: p.categoria },
            { id: 'container-condition', val: p.subcategoria },
            { id: 'container-location', val: p.ubicacion },
            { id: 'container-storage', val: p.almacenamiento },
            { id: 'container-colors', val: p.color },
            { id: 'container-warranty', val: p.warranty }
        ];

        chipFields.forEach(field => {
            const container = document.getElementById(field.id);
            if (!container) return;
            const chips = container.querySelectorAll('.chip, .chip-pill');
            chips.forEach(c => {
                if (c.getAttribute('data-val') === field.val) {
                    c.click();
                } else {
                    c.classList.remove('active');
                }
            });
        });

        // Images
        const TRANSPARENT_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        if (p.images && p.images.length > 0) {
            p.images.forEach((imgSrc, idx) => {
                const slot = idx + 1;
                const img = document.getElementById(`img-${slot}`);
                const ph = img.previousElementSibling;
                const hidden = document.getElementById(`prod-img-${slot}`);
                if (imgSrc) {
                    img.src = imgSrc;
                    img.classList.remove('hidden');
                    if (ph) ph.classList.add('hidden');
                    hidden.value = imgSrc;
                } else {
                    img.src = TRANSPARENT_PIXEL;
                    img.classList.add('hidden');
                    if (ph) ph.classList.remove('hidden');
                    hidden.value = '';
                }
            });
        }

        modalProduct.classList.remove('hidden');
        initModalHelpers();
    };

    window.deleteProduct = async (id) => {
        const confirmed = await customConfirm({
            title: "¿Eliminar producto?",
            message: "Esta acción lo quitará permanentemente del catálogo.",
            icon: "🗑️"
        });

        if (confirmed) {
            const { error } = await _supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) showToast('Error al eliminar', 'error');
            else {
                showToast('Producto eliminado');
                fetchData();
            }
        }
    };


    // ==============================================================================
    // GESTIÓN DE VENTAS
    // ==============================================================================

    const modalSale = document.getElementById('modal-sale');
    const formSale = document.getElementById('form-sale');
    const inputSaleProd = document.getElementById('sale-prod');
    const inputSaleQty = document.getElementById('sale-qty');
    const inputSalePrice = document.getElementById('sale-price');

    document.getElementById('btn-add-sale').addEventListener('click', () => {
        formSale.reset();
        document.getElementById('preview-total').textContent = '$0';
        document.getElementById('preview-profit').textContent = '$0';
        document.getElementById('sale-cost-helper').textContent = 'Costo: $0';
        modalSale.classList.remove('hidden');
    });

    // Calculadoras vivas
    function refreshSaleMath() {
        const sel = inputSaleProd.options[inputSaleProd.selectedIndex];
        if (!sel || sel.value === "") return;

        const baseCosto = Number(sel.getAttribute('data-cost'));
        const unitCost = baseCosto;
        const finalPrice = Number(inputSalePrice.value) || 0;
        const qty = Number(inputSaleQty.value) || 1;

        const totalRow = finalPrice * qty;
        const costRow = unitCost * qty;
        const finalProfit = totalRow - costRow;

        document.getElementById('preview-total').textContent = formatMoney(totalRow);
        document.getElementById('preview-profit').textContent = formatMoney(finalProfit);
        document.getElementById('sale-cost-helper').textContent = `Costo Unitario: ${formatMoney(unitCost)}`;
    }

    inputSaleProd.addEventListener('change', () => {
        const sel = inputSaleProd.options[inputSaleProd.selectedIndex];
        if (sel && sel.value !== "") {
            inputSalePrice.value = sel.getAttribute('data-price');
            refreshSaleMath();
        }
    });

    inputSalePrice.addEventListener('input', refreshSaleMath);
    inputSaleQty.addEventListener('input', refreshSaleMath);

    formSale.addEventListener('submit', async (e) => {
        e.preventDefault();
        const sel = inputSaleProd.options[inputSaleProd.selectedIndex];
        if (!sel || sel.value === "") return;

        const qty = Number(inputSaleQty.value);
        const pid = Number(sel.value);

        // Verificar stock logico
        const rProd = memoryProducts.find(p => p.id === pid);
        if (rProd && rProd.stock < qty) {
            const confirmVenta = await window.customConfirm({
                title: 'Stock Insuficiente',
                message: `Solo hay ${rProd.stock} unidades disponibles pero intentas vender ${qty}. ¿Forzar venta?`,
                icon: '',
                btnOkClass: 'btn-warning'
            });
            if (!confirmVenta) return;
        }

        const nuevaVenta = {
            id: Date.now(),
            productoId: pid,
            productoNombre: sel.text.split('] ')[1] || "Desconocido",
            fecha: new Date().toISOString(),
            cantidad: qty,
            precioFinal: Number(inputSalePrice.value),
            precioCosto: Number(sel.getAttribute('data-cost')),
            cliente: document.getElementById('sale-client').value,
            metodoPago: document.getElementById('sale-method').value
        };

        memorySales.push(nuevaVenta);
        localStorage.setItem('admin_sales', JSON.stringify(memorySales));

        // Reducir stock del catalogo
        if (rProd) {
            rProd.stock -= qty;
            localStorage.setItem('fz_products', JSON.stringify(memoryProducts));
        }

        modalSale.classList.add('hidden');
        initRenders(); // Refresca tablas y kpis
    });

    window.deleteSale = async (id) => {
        const confirmDelete = await window.customConfirm({
            title: 'Anular Venta',
            message: '¿Estás seguro que deseas deshacer el registro de esta venta? (Esta acción no devolverá el stock automáticamente)',
            icon: '🔄',
            btnOkClass: 'btn-danger'
        });
        if (confirmDelete) {
            memorySales = memorySales.filter(p => p.id !== id);
            localStorage.setItem('admin_sales', JSON.stringify(memorySales));
            initRenders();
        }
    };


    // ==============================================================================
    // MISCELÁNEAS (Modales Close & Mobile Sidebar)
    // ==============================================================================

    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetModal = e.target.closest('.modal-overlay');
            if (targetModal) targetModal.classList.add('hidden');
        });
    });

    document.getElementById('mobile-menu-open')?.addEventListener('click', () => {
        document.getElementById('admin-sidebar').classList.add('open');
        document.getElementById('sidebar-overlay').classList.add('show');
    });

    document.getElementById('mobile-menu-close')?.addEventListener('click', () => {
        document.getElementById('admin-sidebar').classList.remove('open');
        document.getElementById('sidebar-overlay').classList.remove('show');
    });

    document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
        document.getElementById('admin-sidebar').classList.remove('open');
        document.getElementById('sidebar-overlay').classList.remove('show');
    });


    // ==============================================================================
    // LOGOUT
    // ==============================================================================

    window.logout = () => {
        localStorage.removeItem('admin_logged');
        window.location.href = '/admin';
    };

    // Boot
    initRenders();
});
