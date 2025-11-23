// scrip.js

// ⭐️ 1. Importar las funciones de Firebase CRUD desde el archivo de configuración
import { 
    getOrders, 
    addOrder, 
    updateOrderStatus, 
    deleteOrder 
} from './firebaseConfig.js'; 

document.addEventListener('DOMContentLoaded', () => {
    // ------------------------------------------------------------------
    // --- ELEMENTOS DEL DOM Y ESTADO ---
    // ------------------------------------------------------------------
    const mainFab = document.querySelector('.main-fab');
    const subFabs = document.querySelector('.sub-fabs');
    const adminButton = document.querySelector('.admin-access');
    const adminModal = document.getElementById('admin-modal');
    const closeButton = adminModal.querySelector('.close-button');
    const loginForm = document.getElementById('admin-login-form');
    const passwordInput = document.getElementById('admin-password');
    const loginError = document.getElementById('login-error');
    const ordersTbody = document.getElementById('orders-tbody');
    const noOrdersMessage = document.getElementById('no-orders-message');
    const orderTableContainer = document.getElementById('order-table-container');
    const modeElement = document.querySelector('.mode');
    const filterSelect = document.getElementById('filter-by');

    const addFab = document.getElementById('add-fab');
    const addOrderModal = document.getElementById('add-order-modal');
    const addOrderCloseButton = document.querySelector('.add-order-close');
    const addOrderForm = document.getElementById('add-order-form');
    const addClientInput = document.getElementById('add-client');
    const addSpecsTextarea = document.getElementById('add-specs');
    const addDateInput = document.getElementById('add-date');
    const addDeliveredCheckbox = document.getElementById('add-delivered');
    const addDownloadCheckbox = document.getElementById('add-download');
    const addPhotoInput = document.getElementById('add-photo');
    const addAnticipoInput = document.getElementById('add-anticipo');
    const addDeliveryDateInput = document.getElementById('add-delivery-date');

    const CORRECT_PASSWORD = 'o'; 
    let isAdminLoggedIn = false;
    let ORDERS_DATA = []; // Los datos de Firebase se guardan aquí
    
    // ------------------------------------------------------------------
    // --- FUNCIONES DE MODO Y SESIÓN ---
    // ------------------------------------------------------------------

    const showAdminModal = () => {
        adminModal.style.display = 'flex';
        passwordInput.focus();
    }

    function logoutAdmin() {
        isAdminLoggedIn = false;
        updateAdminMode(false);
        refreshData(); 
        alert('Sesión de administrador cerrada.');
    }

    function updateAdminMode(isLoggedIn) {
        modeElement.textContent = isLoggedIn 
            ? 'Modo: ADMINISTRADOR' 
            : 'Modo: PÚBLICO / CLIENTE';
        
        adminButton.textContent = isLoggedIn ? 'Cerrar Sesión' : 'Acceso Admin';
        addFab.classList.toggle('hidden', !isLoggedIn);

        adminButton.removeEventListener('click', showAdminModal);
        adminButton.removeEventListener('click', logoutAdmin);
        
        if (isLoggedIn) {
            adminButton.addEventListener('click', logoutAdmin);
        } else {
            adminButton.addEventListener('click', showAdminModal);
        }
    }


    // ------------------------------------------------------------------
    // --- GESTIÓN DE DATOS (Interacción con Firebase) ---
    // ------------------------------------------------------------------

    /** Carga los datos de Firebase y actualiza la interfaz. */
    async function refreshData() {
        ORDERS_DATA = await getOrders(); // ⬅️ LEE desde Firebase
        applyFilter(filterSelect.value);
    }
    
    /** Crea un nuevo pedido en Firebase. */
    async function addNewOrder(client, specs, date, delivered, canDownload, photo, anticipo, deliveryDate) {
        const newOrderData = {
            client: client,
            specs: specs,
            date: date,
            delivered: delivered,
            canDownload: canDownload,
            photo: photo,
            anticipo: parseFloat(anticipo) || 0,
            deliveryDate: deliveryDate || '',
        };
        
        const result = await addOrder(newOrderData); // ⬅️ ESCRIBE en Firebase
        
        if (result.success) {
            addOrderForm.reset();
            addOrderModal.style.display = 'none';
            alert(`Nuevo Pedido de ${client} añadido.`);
            await refreshData(); 
        } else {
            alert('Error al añadir el pedido. Vea la consola para más detalles.');
        }
    }

    /** Elimina un pedido de Firebase. */
    async function removeOrder(orderId) {
        const result = await deleteOrder(orderId); // ⬅️ BORRA en Firebase
        
        if (result.success) {
            alert(`Pedido ID ${orderId} eliminado correctamente.`);
            await refreshData(); 
        } else {
            alert('Error al eliminar el pedido. Vea la consola para más detalles.');
        }
    }

    /** Actualiza el estado de 'delivered' en Firebase. */
    async function toggleOrderDelivery(orderId, newStatus) {
        const result = await updateOrderStatus(orderId, { delivered: newStatus }); // ⬅️ ACTUALIZA en Firebase
        
        if (result.success) {
            alert(`¡Estado del Pedido ${orderId} actualizado!`);
            // Nota: refreshData() ya se encarga de re-renderizar y aplicar el filtro.
        } else {
            alert('Error al actualizar el estado. Vea la consola para más detalles.');
        }
        await refreshData();
    }


    // ------------------------------------------------------------------
    // --- LÓGICA DE FILTRO Y RENDERIZADO (NO CAMBIA) ---
    // ------------------------------------------------------------------

    function applyFilter(filterValue) {
        let filteredData = ORDERS_DATA;
        
        if (filterValue === 'pending') {
            filteredData = ORDERS_DATA.filter(order => !order.delivered);
        } else if (filterValue === 'delivered') {
            filteredData = ORDERS_DATA.filter(order => order.delivered);
        }
        
        loadOrders(filteredData, isAdminLoggedIn);
    }
    
    function loadOrders(data, isAdmin) {
        const totalOrders = ORDERS_DATA.length;
        const filteredCount = data.length;
        
        filterSelect.querySelector('option[value="all"]').textContent = `Todos (${totalOrders})`;

        if (totalOrders === 0) {
            noOrdersMessage.classList.remove('hidden');
            orderTableContainer.classList.add('hidden');
            noOrdersMessage.querySelector('p').textContent = `Aún no hay pedidos DTF cargados en Firebase.`;
        } else if (filteredCount === 0) {
            noOrdersMessage.classList.remove('hidden');
            noOrdersMessage.querySelector('p').textContent = `No hay pedidos que coincidan con el filtro.`;
            orderTableContainer.classList.add('hidden');
        } else {
            noOrdersMessage.classList.add('hidden');
            orderTableContainer.classList.remove('hidden');
            renderOrderRows(data, isAdmin);
        }
    }

    function renderOrderRows(data, isAdmin) {
        ordersTbody.innerHTML = '';
        
        const tableHeader = document.querySelector('.order-table-container thead tr');
        tableHeader.innerHTML = ''; 
        
        tableHeader.innerHTML += '<th>Imagen</th><th>Cliente</th><th>Especificaciones</th><th>Fecha</th>';
        
        if (isAdmin) {
            tableHeader.innerHTML += '<th class="admin-detail-cell">Anticipo</th>';
            tableHeader.innerHTML += '<th class="admin-detail-cell">Entrega Real</th>';
        }
        tableHeader.innerHTML += '<th class="status-col">Entregado</th>'; 

        data.forEach(order => {
            const row = ordersTbody.insertRow();
            
            row.insertCell().innerHTML = '<div class="image-placeholder">IMG</div>';
            row.insertCell().textContent = order.client;
            row.insertCell().textContent = order.specs;
            row.insertCell().textContent = order.date;
            
            if (isAdmin) {
                row.insertCell().innerHTML = `<span class="admin-detail-cell">$${order.anticipo.toFixed(2)}</span>`;
                const deliveryDateText = order.deliveryDate && order.deliveryDate !== '' ? order.deliveryDate : 'N/A';
                row.insertCell().innerHTML = `<span class="admin-detail-cell">${deliveryDateText}</span>`;
            }
            
            const statusCell = row.insertCell();
            statusCell.classList.add('status-col');
            
            if (isAdmin) {
                statusCell.innerHTML = `
                    <div class="action-buttons">
                        <input type="checkbox" class="delivered-checkbox" 
                            data-order-id="${order.id}" ${order.delivered ? 'checked' : ''}>
                        <button class="delete-button" data-order-id="${order.id}">Eliminar</button>
                    </div>
                `;
            } else if (order.canDownload) {
                statusCell.innerHTML = `
                    <button class="download-button" data-order-id="${order.id}">Descargar</button>
                `;
            } else {
                statusCell.innerHTML = order.delivered 
                    ? '<span style="color: #6eff6e;">✔️ Entregado</span>' 
                    : '<span style="color: #ffda5f;">⏳ En Proceso</span>';
            }
        });
        
        // CONEXIÓN DE LISTENERS TRAS RENDERIZAR
        if (isAdmin) {
            addAdminListeners(); 
        } else {
            addPublicListeners(); 
        }
    }


    // ------------------------------------------------------------------
    // --- MANEJADORES DE EVENTOS ---
    // ------------------------------------------------------------------

    function addPublicListeners() {
        document.querySelectorAll('.download-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const orderId = event.target.dataset.orderId;
                alert(`¡Preparando descarga del Pedido ID ${orderId}!`);
            });
        });
    }

    function addAdminListeners() {
        // 1. Checkbox de Entregado (Llama a toggleOrderDelivery)
        document.querySelectorAll('.delivered-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', async (event) => {
                const orderId = event.target.dataset.orderId;
                const newStatus = event.target.checked;
                
                await toggleOrderDelivery(orderId, newStatus);
            });
        });

        // 2. Botón de Eliminar (Llama a removeOrder)
        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', async (event) => {
                const orderId = event.target.dataset.orderId;
                if (confirm(`¿Estás seguro de que quieres eliminar el Pedido ID ${orderId}? Esta acción es permanente.`)) {
                    await removeOrder(orderId);
                }
            });
        });
    }

    mainFab.addEventListener('click', () => {
        if (isAdminLoggedIn) {
            subFabs.classList.toggle('show');
        }
    });

    document.addEventListener('click', (event) => {
        if (!mainFab.contains(event.target) && !subFabs.contains(event.target) && subFabs.classList.contains('show')) {
            subFabs.classList.remove('show');
        }
    });

    // Login de Administrador
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const enteredPassword = passwordInput.value;

        if (enteredPassword === CORRECT_PASSWORD) {
            isAdminLoggedIn = true;
            closeModals(); 
            updateAdminMode(true);
            applyFilter(filterSelect.value);
            alert('¡Bienvenido, Administrador!');
        } else {
            loginError.textContent = 'Contraseña incorrecta. Inténtalo de nuevo.';
            loginError.style.display = 'block';
            passwordInput.value = '';
            passwordInput.focus();
        }
    });

    // Submit de Añadir Pedido (Llama a addNewOrder)
    addOrderForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const client = addClientInput.value;
        const specs = addSpecsTextarea.value;
        const date = addDateInput.value;
        const delivered = addDeliveredCheckbox.checked;
        const canDownload = addDownloadCheckbox.checked;
        
        const photoFile = addPhotoInput.files[0];
        const anticipo = addAnticipoInput.value;
        const deliveryDate = addDeliveryDateInput.value;

        const photoPath = photoFile ? photoFile.name : 'No file uploaded';

        await addNewOrder(client, specs, date, delivered, canDownload, photoPath, anticipo, deliveryDate);
    });
    
    // Apertura y Cierre de Modales
    const closeModals = () => {
        adminModal.style.display = 'none';
        addOrderModal.style.display = 'none';
        loginError.style.display = 'none';
        passwordInput.value = '';
    };

    closeButton.addEventListener('click', closeModals);
    addOrderCloseButton.addEventListener('click', closeModals);
    window.addEventListener('click', (event) => {
        if (event.target === adminModal || event.target === addOrderModal) {
            closeModals();
        }
    });
    
    addFab.addEventListener('click', () => {
        addOrderModal.style.display = 'flex';
        subFabs.classList.remove('show');
        addOrderForm.reset(); 
        addClientInput.focus();
    });

    // Filtro de pedidos
    filterSelect.addEventListener('change', (event) => {
        applyFilter(event.target.value);
    });

    // ------------------------------------------------------------------
    // --- INICIALIZACIÓN ---
    // ------------------------------------------------------------------
    updateAdminMode(false);
    refreshData(); // ⭐️ Inicia la carga de datos desde Firebase
});