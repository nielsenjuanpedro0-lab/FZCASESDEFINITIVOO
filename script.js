// Fallback mock data
const MOCK_PRODUCTS = [
    {
        id: 1,
        name: "iPhone 15 Pro 256GB",
        category: "iPhone",
        subcategory: "Nuevo",
        precio: 1200000,
        variantes: {
            colores: [
                { nombre: "Negro Titanio", hex: "#1d1d1f" },
                { nombre: "Blanco Titanio", hex: "#f5f5f7" }
            ],
            almacenamiento: ["256GB", "512GB"]
        },
        models: ["iPhone 15 Pro"],
        image: "assets/iphone_case.png",
        bestseller: true,
        features: ["Titanio aeroespacial", "Chip A17 Pro", "Botón de Acción"]
    }
];

// Load from LocalStorage
const storedProducts = localStorage.getItem('fz_products');
let products = [];

if (storedProducts === null) {
    // Primera vez: Usar mocks
    products = MOCK_PRODUCTS;
    localStorage.setItem('fz_products', JSON.stringify(MOCK_PRODUCTS));
} else {
    products = JSON.parse(storedProducts);
}

// Map admin structure to UI structure if needed
products = products.map(p => {
    // Generar características amigables para el cliente
    const baseFeatures = [
        "Garantía oficial de FZCASES",
        "Retiro inmediato en Tandil / Necochea",
        "Soporte técnico especializado"
    ];

    // Si hay notas en el admin, las agregamos como característica destacada
    const customFeatures = p.notas ? [p.notas] : [];
    const allFeatures = [...customFeatures, ...baseFeatures];

    return {
        id: p.id,
        name: p.nombre || p.name,
        category: p.categoria || p.category,
        subcategory: p.subcategoria || p.subcategory,
        precio: p.precioVenta || p.precio,
        storage: p.almacenamiento,
        color: p.color,
        image: p.imagen || p.image || "assets/iphone_case.png",
        models: [p.almacenamiento || 'Standard'].concat(p.color ? [p.color] : []),
        features: allFeatures,
        bestseller: p.bestseller || false
    };
});


const phoneNumber = "5491100000000";

document.addEventListener('DOMContentLoaded', () => {
    // Menú Hamburguesa
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });

    // Cerrar menú al tocar un link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            menuToggle.classList.remove('active');
        });
    });

    // Cerrar menú al tocar fuera (el fondo oscuro nav-links)
    navLinks.addEventListener('click', (e) => {
        if (e.target === navLinks) {
            navLinks.classList.remove('active');
            menuToggle.classList.remove('active');
        }
    });

    // Detectar scroll para el sticky navbar
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Relleno de Filtros
    const filterContainer = document.getElementById('filter-container');
    const allCategories = ['Todos', ...new Set(products.map(p => p.category))];
    
    let activeFilter = 'Todos';

    function renderFilters() {
        if (!filterContainer) return;
        filterContainer.innerHTML = '';
        allCategories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = `filter-btn ${cat === activeFilter ? 'active' : ''}`;
            btn.textContent = cat;
            btn.addEventListener('click', () => {
                activeFilter = cat;
                renderFilters();
                renderCatalog();
            });
            filterContainer.appendChild(btn);
        });
    }

    // Relleno de Catálogo
    const productGrid = document.getElementById('product-grid');

    function renderCatalog() {
        if (!productGrid) return;
        productGrid.innerHTML = '';
        const filteredProducts = activeFilter === 'Todos' 
            ? products 
            : products.filter(p => p.category === activeFilter);
        
        filteredProducts.forEach(product => {
            const waText = encodeURIComponent(`Hola, quiero consultar el stock de: ${product.name}`);
            const waLink = `https://wa.me/${phoneNumber}?text=${waText}`;

            const card = document.createElement('div');
            card.className = 'product-card scroll-animate fade-scale';
            card.innerHTML = `
                <div class="product-img-wrapper" onclick="openModal(${product.id})">
                    <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
                    ${product.bestseller ? '<span class="best-seller-tag">MÁS VENDIDO</span>' : ''}
                </div>
                <div class="product-info">
                    <div onclick="openModal(${product.id})" style="cursor: pointer;">
                        <h3>${product.name}</h3>
                        <p>Modelos: ${product.models.join(', ')}</p>
                    </div>
                    <a href="${waLink}" target="_blank" class="btn-wa-sm"><span>Consultar por WhatsApp</span></a>
                </div>
            `;
            productGrid.appendChild(card);
        });

        if (window.attachObserver) window.attachObserver();
    }

    // Modal
    const modal = document.getElementById('product-modal');
    if (modal) {
        const modalBody = document.getElementById('modal-body');
        const closeBtn = document.querySelector('.close-btn');

        window.openModal = (productId) => {
            const product = products.find(p => p.id === productId);
            if (!product) return;

            let selectedVariants = {
                color: null,
                almacenamiento: null
            };

            const updateWALink = () => {
                let message = `Hola, quiero consultar por:\n${product.name}`;
                if (selectedVariants.color) message += `\n- Color: ${selectedVariants.color}`;
                if (selectedVariants.almacenamiento) message += `\n- Almacenamiento: ${selectedVariants.almacenamiento}`;
                
                const waText = encodeURIComponent(message);
                const waLink = `https://wa.me/${phoneNumber}?text=${waText}`;
                const waBtn = document.getElementById('modal-wa-btn');
                if (waBtn) waBtn.href = waLink;
            };

            modalBody.innerHTML = `
                <div class="modal-img">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="modal-info">
                    <div class="modal-rating">⭐⭐⭐⭐⭐ <span class="rating-text">(34 valoraciones)</span></div>
                    <h2>${product.name}</h2>
                    <div class="cat">
                        ${product.category} | ${product.subcategory} 
                        ${product.bestseller ? '<span class="badge-premium">★ MÁS VENDIDO</span>' : ''}
                    </div>

                    <div class="payment-minimal">
                        <span class="payment-extra">Tarjetas de Crédito / Débito · Mercado Pago · Efectivo</span>
                    </div>
                    
                    <div class="modal-meta-row">
                        <div class="meta-item">
                            <span class="meta-label">Almacenamiento:</span>
                            <span class="meta-badge">${product.storage || '128GB'}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Color:</span>
                            <span class="meta-badge">${product.color || 'Standard'}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Condición:</span>
                            <span class="meta-badge">${product.subcategory}</span>
                        </div>
                    </div>

                    ${product.precio ? `<div class="modal-price">$${product.precio.toLocaleString('es-AR')}</div>` : ''}

                    <div id="variant-selectors" class="variant-selectors"></div>
                    
                    <div class="original-alert">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        Equipo 100% Original Apple
                    </div>

                    <ul class="specs">
                        ${product.features.map(f => `<li>${f}</li>`).join('')}
                    </ul>

                    <a href="" id="modal-wa-btn" target="_blank" class="btn-primary" style="display:block; text-align:center;">Consultar por WhatsApp</a>
                </div>
            `;

            // Variant Rendering
            const variantContainer = document.getElementById('variant-selectors');
            if (product.variantes) {
                // Colores
                if (product.variantes.colores) {
                    const section = document.createElement('div');
                    section.className = 'variant-section';
                    section.innerHTML = `<label class="variant-label">Color</label>`;
                    
                    const grid = document.createElement('div');
                    grid.className = 'color-selector';
                    
                    product.variantes.colores.forEach(c => {
                        const btn = document.createElement('button');
                        btn.className = 'color-btn';
                        btn.style.backgroundColor = c.hex;
                        btn.title = c.nombre;
                        btn.addEventListener('click', () => {
                            grid.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                            btn.classList.add('active');
                            selectedVariants.color = c.nombre;
                            updateWALink();
                        });
                        grid.appendChild(btn);
                    });
                    
                    section.appendChild(grid);
                    variantContainer.appendChild(section);
                }

                // Almacenamiento
                if (product.variantes.almacenamiento) {
                    const section = document.createElement('div');
                    section.className = 'variant-section';
                    section.innerHTML = `<label class="variant-label">Almacenamiento</label>`;
                    
                    const grid = document.createElement('div');
                    grid.className = 'pill-selector';
                    
                    product.variantes.almacenamiento.forEach(s => {
                        const btn = document.createElement('button');
                        btn.className = 'pill-btn-variant';
                        btn.textContent = s;
                        btn.addEventListener('click', () => {
                            grid.querySelectorAll('.pill-btn-variant').forEach(b => b.classList.remove('active'));
                            btn.classList.add('active');
                            selectedVariants.almacenamiento = s;
                            updateWALink();
                        });
                        grid.appendChild(btn);
                    });
                    
                    section.appendChild(grid);
                    variantContainer.appendChild(section);
                }

            }

            updateWALink();
            modal.style.display = 'flex';
            setTimeout(() => { modal.classList.add('show'); }, 10);
        };

        function closeModalFunc() {
            modal.classList.remove('show');
            setTimeout(() => modal.style.display = 'none', 300);
        }

        closeBtn.addEventListener('click', closeModalFunc);

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModalFunc();
            }
        });
    }

    // Lightbox Modal para Galería en Nosotros
    const galleryItems = document.querySelectorAll('.gallery-item img');
    if (galleryItems.length > 0) {
        // Crear dinámicamente el modal en el DOM
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox-modal';
        lightbox.innerHTML = `
            <span class="lightbox-close">&times;</span>
            <img class="lightbox-img" src="" alt="Vista ampliada">
        `;
        document.body.appendChild(lightbox);

        const lbImage = lightbox.querySelector('.lightbox-img');
        const lbClose = lightbox.querySelector('.lightbox-close');

        galleryItems.forEach(img => {
            img.addEventListener('click', () => {
                lbImage.src = img.src;
                lightbox.classList.add('show');
            });
        });

        lbClose.addEventListener('click', () => lightbox.classList.remove('show'));
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) lightbox.classList.remove('show');
        });
    }

    // Scroll Animations Observer
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    window.attachObserver = () => {
        const animatables = document.querySelectorAll('.scroll-animate:not(.animate-in)');
        animatables.forEach(el => scrollObserver.observe(el));
    };

    // =========================================================================
    // COMO FUNCIONA - ANIMATIONS
    // =========================================================================
    const stepCards = document.querySelectorAll('.step-card');
    if (stepCards.length > 0) {
        const stepsObserverOptions = {
            threshold: 0.2,
            rootMargin: '0px 0px -100px 0px'
        };

        const stepsObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('animate-in');
                    }, index * 200); // Delay progresivo
                    stepsObserver.unobserve(entry.target);
                }
            });
        }, stepsObserverOptions);

        stepCards.forEach(card => {
            card.classList.add('step-hidden');
            stepsObserver.observe(card);
        });
    }

    // =========================================================================
    // WIZARD PLAN CANJE
    // =========================================================================
    const wizardContainer = document.getElementById('plan-canje');
    if (wizardContainer) {
        
        // --- CTA Interaction ---
        const btnAbrirFormulario = document.getElementById('btn-abrir-formulario');
        const canjeCta = document.getElementById('canje-cta');
        const canjeFormulario = document.getElementById('canje-formulario');
        
        if (btnAbrirFormulario && canjeCta && canjeFormulario) {
            btnAbrirFormulario.addEventListener('click', () => {
                // Ocultar CTA
                canjeCta.style.display = 'none';
                
                // Mostrar formulario
                canjeFormulario.style.display = 'block';
                
                // Opcional: trigger animations de los elementos internos
                window.attachObserver();
                
                // Scroll suave al formulario
                canjeFormulario.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });

            const btnVolverCta = document.getElementById('btn-volver-cta');
            if (btnVolverCta) {
                btnVolverCta.addEventListener('click', () => {
                    canjeFormulario.style.display = 'none';
                    canjeCta.style.display = 'block';
                    canjeCta.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
            }
        }
        
        // --- Wizard Logic ---
        let currentStep = 1;
        const totalSteps = 4;
        let canjeData = {
            modelo: '',
            estado: '',
            funcionalidad: [],
            bateria: ''
        };

        // Try load from local storage
        try {
            const savedData = localStorage.getItem('fzcases_canje_data');
            if (savedData) {
                const parsed = JSON.parse(savedData);
                if (parsed.modelo) canjeData = parsed;
            }
        } catch(e) {}

        const btnPrev = document.getElementById('btn-prev');
        const btnNext = document.getElementById('btn-next');
        const progressBar = document.getElementById('progress-bar');
        const circles = document.querySelectorAll('.step-circle');
        const stepsBoxes = document.querySelectorAll('.wizard-step');
        
        // Paso 1
        const pillBtns = document.querySelectorAll('.pill-btn');
        const btnOtro = document.getElementById('btn-otro-modelo');
        const otherContainer = document.getElementById('other-model-container');
        const otherInput = document.getElementById('input-other-model');

        // Paso 2
        const stateCards = document.querySelectorAll('.state-card');

        // Paso 3
        const funcChecks = document.querySelectorAll('input[name="funcionalidad"]');
        const batteryInput = document.getElementById('battery-health');

        // Restore UI state from cached data if available
        function restoreCachedData() {
            if (canjeData.modelo) {
                let foundPill = Array.from(pillBtns).find(btn => btn.dataset.value === canjeData.modelo);
                if (foundPill) {
                    foundPill.classList.add('selected');
                } else {
                    btnOtro.classList.add('selected');
                    otherContainer.classList.add('active');
                    otherInput.value = canjeData.modelo;
                }
            }
            if (canjeData.estado) {
                let foundCard = Array.from(stateCards).find(card => card.dataset.value === canjeData.estado);
                if (foundCard) foundCard.classList.add('selected');
            }
            if (canjeData.funcionalidad.length > 0) {
                funcChecks.forEach(chk => {
                    if (canjeData.funcionalidad.includes(chk.value)) chk.checked = true;
                });
            }
            if (canjeData.bateria) batteryInput.value = canjeData.bateria;
        }

        function saveData() {
            localStorage.setItem('fzcases_canje_data', JSON.stringify(canjeData));
        }

        // Logic UI Step 1
        pillBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                pillBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                
                if (btn.id === 'btn-otro-modelo') {
                    otherContainer.classList.add('active');
                    canjeData.modelo = otherInput.value.trim();
                } else {
                    otherContainer.classList.remove('active');
                    otherInput.value = '';
                    canjeData.modelo = btn.dataset.value;
                }
                saveData();
                validateCurrentStep();
            });
        });

        otherInput.addEventListener('input', () => {
            if (btnOtro.classList.contains('selected')) {
                canjeData.modelo = otherInput.value.trim();
                saveData();
                validateCurrentStep();
            }
        });

        // Logic UI Step 2
        stateCards.forEach(card => {
            card.addEventListener('click', () => {
                stateCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                canjeData.estado = card.dataset.value;
                saveData();
                validateCurrentStep();
            });
        });

        // Logic UI Step 3
        funcChecks.forEach(chk => {
            chk.addEventListener('change', () => {
                canjeData.funcionalidad = Array.from(funcChecks).filter(c => c.checked).map(c => c.value);
                saveData();
                validateCurrentStep();
            });
        });

        batteryInput.addEventListener('input', () => {
            canjeData.bateria = batteryInput.value;
            saveData();
            validateCurrentStep();
        });

        function validateCurrentStep() {
            let isValid = false;
            
            if (currentStep === 1) {
                const selectedBtn = document.querySelector('.pill-btn.selected');
                if (selectedBtn) {
                    if (selectedBtn.id === 'btn-otro-modelo') {
                        isValid = otherInput.value.trim().length > 2;
                    } else {
                        isValid = true;
                    }
                }
            } 
            else if (currentStep === 2) {
                isValid = document.querySelector('.state-card.selected') !== null;
            } 
            else if (currentStep === 3) {
                // Al menos 1 checkbox y algo ingresado en batería
                const checkedCount = Array.from(funcChecks).filter(c => c.checked).length;
                const batteryVal = parseInt(batteryInput.value);
                isValid = checkedCount > 0 && !isNaN(batteryVal) && batteryVal >= 0 && batteryVal <= 100;
            } 
            else if (currentStep === 4) {
                isValid = true;
            }

            btnNext.disabled = !isValid;
        }

        function updateUI() {
            // Steps UI visibility
            stepsBoxes.forEach(box => {
                if(parseInt(box.id.split('-')[1]) === currentStep) {
                    box.classList.add('active');
                } else {
                    box.classList.remove('active');
                }
            });

            // Progress Bar Visuals
            const progressRatio = ((currentStep - 1) / (totalSteps - 1)) * 100;
            progressBar.style.width = progressRatio + '%';

            circles.forEach((circle, idx) => {
                const stepIdx = idx + 1;
                circle.classList.remove('active', 'completed');
                if (stepIdx === currentStep) {
                    circle.classList.add('active');
                } else if (stepIdx < currentStep) {
                    circle.classList.add('completed');
                }
            });

            // Navigation Buttons
            btnPrev.style.visibility = currentStep === 1 ? 'hidden' : 'visible';
            btnNext.style.display = currentStep === 4 ? 'none' : 'block';

            if (currentStep === 4) {
                renderSummary();
            }

            validateCurrentStep();
        }

        function renderSummary() {
            const summaryBox = document.getElementById('summary-card');
            
            const funcListDOM = canjeData.funcionalidad.length > 0 
                ? canjeData.funcionalidad.map(f => `<br> &nbsp;&nbsp;&nbsp;• ${f}`).join('')
                : 'Ninguna';

            summaryBox.innerHTML = `
                <p>📱 <b>Modelo:</b> ${canjeData.modelo}</p>
                <p>⭐ <b>Estado físico:</b> ${canjeData.estado}</p>
                <p>✅ <b>Funcionalidad:</b> ${funcListDOM}</p>
                <p>🔋 <b>Batería:</b> ${canjeData.bateria}%</p>
            `;
        }

        btnNext.addEventListener('click', () => {
            if (currentStep < totalSteps) {
                currentStep++;
                updateUI();
                wizardContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });

        btnPrev.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                updateUI();
                wizardContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });

        document.getElementById('btn-edit-answers').addEventListener('click', () => {
            currentStep = 1;
            updateUI();
            wizardContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        document.getElementById('btn-submit-wa').addEventListener('click', () => {
            const funcListWA = canjeData.funcionalidad.length > 0 
                ? canjeData.funcionalidad.map(f => `- ${f}`).join('%0A')
                : 'Ninguna';

            const message = `*PLAN CANJE - Nueva Consulta*%0A%0A*Modelo:* ${canjeData.modelo}%0A*Estado fisico:* ${canjeData.estado}%0A%0A*Funcionalidad:*%0A${funcListWA}%0A*Bateria:* ${canjeData.bateria}%25%0A%0A_Solicito tasacion para plan canje_`;
            
            // WA Default test number
            const waNumber = '1123456789'; // Esto se deberá cambiar por global_W_NUMBER si existiera
            const waURL = `https://wa.me/549${waNumber}?text=${message}`;
            
            window.open(waURL, '_blank');
            localStorage.removeItem('fzcases_canje_data'); // clean up after success!
        });

        // Initialize Wizard
        restoreCachedData();
        updateUI();
    }

    // FAQ Accordion Logic
    const faqHeaders = document.querySelectorAll('.accordion-header');
    
    faqHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const accordionItem = header.parentElement;
            const accordionContent = header.nextElementSibling;
            
            // Check if curr is already active
            const isActive = accordionItem.classList.contains('active');
            
            // Close all first (Singleton pattern)
            document.querySelectorAll('.accordion-item').forEach(item => {
                item.classList.remove('active');
                item.querySelector('.accordion-header').setAttribute('aria-expanded', 'false');
                item.querySelector('.accordion-content').style.maxHeight = null;
                item.querySelector('.accordion-content').style.opacity = '0';
            });
            
            if (!isActive) {
                accordionItem.classList.add('active');
                header.setAttribute('aria-expanded', 'true');
                accordionContent.style.maxHeight = accordionContent.scrollHeight + "px";
                accordionContent.style.opacity = '1';
            }
        });
    });
    // =========================================================================
    // CARRUSEL TESTIMONIOS
    // =========================================================================
    const track = document.querySelector('.testimonials-track');
    const testimoniosCards = document.querySelectorAll('.testimonial-card');
    const prevBtn = document.querySelector('.carousel-btn.prev');
    const nextBtn = document.querySelector('.carousel-btn.next');
    const dotsContainer = document.querySelector('.carousel-dots');

    if (track && testimoniosCards.length > 0) {
        let currentIndex = 0;
        const cardWidth = testimoniosCards[0].offsetWidth + 32; // width + gap
        // Usar Math.max para evitar divisiones por 0 o NaN
        const trackWidth = track.offsetWidth || 1;
        const visibleCards = Math.max(1, Math.floor(trackWidth / cardWidth));

        // Crear dots
        testimoniosCards.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToSlide(index));
            dotsContainer.appendChild(dot);
        });

        const dots = document.querySelectorAll('.dot');

        function goToSlide(index) {
            currentIndex = index;
            track.scrollTo({
                left: cardWidth * index,
                behavior: 'smooth'
            });
            updateDots();
        }

        function updateDots() {
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentIndex);
            });
        }

        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                goToSlide(currentIndex - 1);
            } else {
                // Loop to end
                goToSlide(testimoniosCards.length - 1);
            }
        });

        nextBtn.addEventListener('click', () => {
            if (currentIndex < testimoniosCards.length - visibleCards) {
                goToSlide(currentIndex + 1);
            } else {
                goToSlide(0); // Loop al inicio
            }
        });

        // Auto-play
        let autoplayInterval;

        function startAutoplay() {
            autoplayInterval = setInterval(() => {
                if (currentIndex < testimoniosCards.length - visibleCards) {
                    goToSlide(currentIndex + 1);
                } else {
                    goToSlide(0); // volver al inicio
                }
            }, 5000); // 5s
        }

        function stopAutoplay() {
            clearInterval(autoplayInterval);
        }

        startAutoplay();
        track.addEventListener('mouseenter', stopAutoplay);
        track.addEventListener('mouseleave', startAutoplay);

        // Swipe en mobile
        let startX = 0;
        let scrollLeft = 0;

        track.addEventListener('touchstart', (e) => {
            startX = e.touches[0].pageX;
            scrollLeft = track.scrollLeft;
            stopAutoplay();
        }, { passive: true });

        track.addEventListener('touchmove', (e) => {
            const x = e.touches[0].pageX;
            const walk = (startX - x) * 2;
            track.scrollLeft = scrollLeft + walk;
        }, { passive: true });
        
        track.addEventListener('touchend', () => {
            startAutoplay();
        }, { passive: true });
    }

    // Iniciar render globales
    if (typeof renderFilters === 'function') renderFilters();
    if (typeof renderCatalog === 'function') renderCatalog();
    if (window.attachObserver) window.attachObserver();
});
