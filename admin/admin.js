document.addEventListener('DOMContentLoaded', () => {

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
    // BASE DE DATOS TEMPORAL (Mocks & LocalStorage)
    // ==============================================================================

    // Si no existen en localStorage las creamos las ventas y canjes (Productos se maneja abajo)

    if (!localStorage.getItem('admin_sales')) {
        const defaultSale = [{
            id: Date.now() + 1,
            productoId: Date.now(),
            productoNombre: "iPhone 15 Pro",
            fecha: new Date().toISOString(),
            cantidad: 1,
            precioFinal: 1200000,
            precioCosto: 950000,
            metodoPago: "Efectivo",
            cliente: "Juan"
        }];
        localStorage.setItem('admin_sales', JSON.stringify(defaultSale));
    }

    if (!localStorage.getItem('admin_canjes')) {
        localStorage.setItem('admin_canjes', JSON.stringify([]));
        // Si hay data global 'fzcases_canje_data' (abandonada sin enviar wp) se podria chupar, pero por ahora array vacio.
    }

    // Cargar desde cache a RAM
    let memoryProducts = JSON.parse(localStorage.getItem('fz_products')) || [];

    // Función para precargar productos si está vacío (Seeding)
    function seedInitialProducts() {
        if (memoryProducts.length === 0) {
            const initialMocks = [
                {
                    id: 1,
                    nombre: "iPhone 15 Pro 256GB",
                    categoria: "iPhone",
                    subcategoria: "Nuevo",
                    precioVenta: 1200,
                    precioCosto: 950,
                    ubicacion: "Tandil",
                    almacenamiento: "256GB",
                    color: "Titanio Negro",
                    activo: true,
                    imagen: "/assets/iphone_case.png",
                    images: ["/assets/iphone_case.png"],
                    notas: "Titanio aeroespacial, Chip A17 Pro",
                    stock: 1
                },
                {
                    id: 2,
                    nombre: "MacBook Air M2 2023 256GB",
                    categoria: "MacBook",
                    subcategoria: "Nuevo",
                    precioVenta: 1450,
                    precioCosto: 1100,
                    ubicacion: "Necochea",
                    almacenamiento: "256GB",
                    color: "Medianoche",
                    activo: true,
                    imagen: "assets/charger_cable.png",
                    images: ["assets/charger_cable.png"],
                    notas: "Chip M2, Pantalla Liquid Retina",
                    stock: 1
                },
                {
                    id: 3,
                    nombre: "iPhone 13 Pro 128GB",
                    categoria: "iPhone",
                    subcategoria: "Usado",
                    precioVenta: 650,
                    precioCosto: 450,
                    ubicacion: "Tandil",
                    almacenamiento: "128GB",
                    color: "Sierra Blue",
                    battery: "89",
                    activo: true,
                    imagen: "/assets/iphone_case.png",
                    images: ["/assets/iphone_case.png"],
                    notas: "Pantalla ProMotion 120Hz",
                    stock: 1
                }
            ];
            
            memoryProducts = initialMocks;
            localStorage.setItem('fz_products', JSON.stringify(memoryProducts));
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
    const tabBtns = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.tab-content'); // Cambiamos a capturar los tab-contents
    const mainTitle = document.getElementById('main-title');

    function switchTab(targetId, TitleName) {
        // Ocultar todos
        panels.forEach(p => {
            p.style.display = 'none';
            p.classList.remove('active');
        });
        navItems.forEach(n => n.classList.remove('active'));

        // Activar correspondientes
        const targetPanel = document.getElementById(targetId);
        if (targetPanel) {
            targetPanel.style.display = 'block';
            targetPanel.classList.add('active');
        }

        document.querySelectorAll(`.nav-item[data-target="${targetId}"]`).forEach(el => el.classList.add('active'));

        mainTitle.textContent = TitleName;

        // Cierra sidebar si es mobile
        document.getElementById('admin-sidebar').classList.remove('open');
        document.getElementById('sidebar-overlay').classList.remove('show');
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            switchTab(item.dataset.target, item.querySelector('.nav-text').textContent);
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
            id: isEditing ? Number(isEditing) : Date.now(),
            nombre: name,
            categoria: document.getElementById('prod-cat').value,
            subcategoria: document.getElementById('prod-subcat').value, // Sellado/Usado
            ubicacion: document.getElementById('prod-location').value,
            imei: document.getElementById('prod-imei').value,
            serial: document.getElementById('prod-serial').value,
            almacenamiento: document.getElementById('prod-storage').value,
            color: document.getElementById('prod-color-custom').value || document.getElementById('prod-color').value,
            precioVenta: Number(document.getElementById('prod-sell').value),
            precioCosto: Number(document.getElementById('prod-cost').value),
            activo: document.getElementById('prod-active').checked,
            battery: document.getElementById('prod-battery').value,
            warranty: document.getElementById('prod-warranty').value,
            notas: document.getElementById('prod-features').value,
            images: [
                document.getElementById('prod-img-1').value,
                document.getElementById('prod-img-2').value,
                document.getElementById('prod-img-3').value
            ],
            fecha: new Date().toISOString(),
            stock: 1
        };

        // Legacy field compatibility
        prodData.imagen = prodData.images[0] || 'https://via.placeholder.com/150';

        if (isEditing) {
            const index = memoryProducts.findIndex(p => p.id === prodData.id);
            if (index !== -1) memoryProducts[index] = prodData;
            showToast('Producto actualizado');
        } else {
            memoryProducts.push(prodData);
            showToast('Producto agregado con éxito');
            // Sincronizar con Google Sheets solo al crear nuevo
            syncWithGoogleSheets(prodData);
        }

        localStorage.setItem('fz_products', JSON.stringify(memoryProducts));
        modalProduct.classList.add('hidden');
        initRenders();
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
        const confirmDelete = await window.customConfirm({
            title: 'Eliminar Producto',
            message: '¿Estás seguro que deseas eliminar permanentemente este producto?',
            btnOkClass: 'btn-danger'
        });
        if (confirmDelete) {
            memoryProducts = memoryProducts.filter(p => p.id !== id);
            localStorage.setItem('fz_products', JSON.stringify(memoryProducts));
            initRenders();
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
        window.location.href = '/admin/index.html';
    };

    // Boot
    initRenders();
});
