// --- 1. BASE DE DATOS LOCAL ---
// Protección de rutas
const path = window.location.pathname;
const currentSession = localStorage.getItem('festiSession');

// Si intenta entrar a admin sin ser admin
if (path.includes('admin.html') && currentSession !== 'admin') {
    window.location.href = 'login.html';
}
if (path.includes('repertorio.html') && !currentSession) {
    window.location.href = 'login.html';
}

// Base de Datos del Repertorio
// Piezas por defecto para que la web no inicie vacía en GitHub
const piezasSemilla = {
    "pieza_1": {
        titulo: "Example Song",
        grado: "3",
        autor: "Composer Name",
        youtubeId: "dQw4w9WgXcQ",
        imagen: "https://via.placeholder.com/500x400",
        descripcion: "Welcome to your repertoire. You can add more from the Admin panel.",
        pdf: "#"
    }
};

let piezasData = JSON.parse(localStorage.getItem('festiPiezas')) || piezasSemilla;

if (!localStorage.getItem('festiPiezas')) {
    localStorage.setItem('festiPiezas', JSON.stringify(piezasData));
}

function abrirDetalle(id) {
    const p = piezasData[id];
    const display = document.getElementById('detalle-dinamico');

    display.innerHTML = `
        <div class="detalle-info-texto">
            <h2>${p.titulo}</h2>
            <span class="meta"> Grade ${p.grado} | Autor: ${p.autor}'</span>
        </div>
        <div class="detalle-wrapper">
            <div class="detalle-info-visual">
                <img src="${p.imagen}" alt="${p.titulo}">
            </div>
            <div class="detalle-info-texto">
                <p>${p.descripcion}</p>
                <a href="${p.pdf}" target="_blank" class="click-score">Click to view score →</a>
            </div>
        </div>
        <div class="video-full-width">
            <div class="video-wrapper">
                <iframe src="https://www.youtube.com/embed/${p.youtubeId}" frameborder="0" allowfullscreen></iframe>
            </div>
        </div>
    `;

    document.getElementById('modal-detalle').style.display = "block";
    document.body.style.overflow = "hidden"; // Bloquea el scroll de atrás
}

function cerrarDetalle() {
    const modal = document.getElementById('modal-detalle');
    if (modal) {
        modal.style.display = "none";
        document.getElementById('detalle-dinamico').innerHTML = ""; 
        document.body.style.overflow = "auto";
    }
}

// Cerrar al hacer clic fuera del cuadro blanco
window.addEventListener('click', (event) => {
    const modal = document.getElementById('modal-detalle');
    if (event.target === modal) cerrarDetalle();
});

// --- 2. LOGIN (Músico y Admin) ---
function validarLogin() {
    // Obtenemos los valores y quitamos espacios en blanco
    const user = document.getElementById('usuario').value.trim();
    const pass = document.getElementById('password').value.trim();

    // Verificación de Administrador
    if (user === "admin" && pass === "1234") {
        localStorage.setItem('festiSession', 'admin'); // Sesión de admin
        window.location.href = "admin.html";
        return; // Detenemos la función aquí si es admin
    } 
    
    // Verificación de Músico (Tu código anterior)
    if (user === "musico" && pass === "1234") {
        localStorage.setItem('festiSession', 'active'); // Sesión de músico
        window.location.href = "repertorio.html";
        return;
    }

    // Si no coincide ninguno
    alert("❌ Credenciales incorrectas ❌");
}

/*Cierra la sesión y regresa al inicio.*/
function cerrarSesion() {
    localStorage.removeItem('festiSession');
    window.location.href = "index.html";
}


// --- 3. PANEL ADMINISTRATIVO ---
const formPieza = document.getElementById('form-pieza');
if (formPieza) {
    formPieza.addEventListener('submit', (e) => {
        e.preventDefault();
        const idExistente = document.getElementById('edit-id').value;
        const id = idExistente || 'pieza_' + Date.now();
        
        piezasData[id] = {
            titulo: document.getElementById('admin-titulo').value,
            grado: document.getElementById('admin-grado').value,
            autor: document.getElementById('admin-autor').value,
            youtubeId: document.getElementById('admin-yt').value,
            imagen: document.getElementById('admin-img').value || 'https://via.placeholder.com/500x400',
            descripcion: document.getElementById('admin-desc').value,
            pdf: "#"
        };

        localStorage.setItem('festiPiezas', JSON.stringify(piezasData));
        alert("✅ Cambios guardados.");
        formPieza.reset();
        document.getElementById('edit-id').value = "";
        renderAdminList();
    });
}

function renderAdminList() {
    const lista = document.getElementById('tabla-piezas');
    if (!lista) return;
    lista.innerHTML = '';
    
    Object.keys(piezasData).forEach(id => {
        const p = piezasData[id];
        lista.innerHTML += `
            <div class="admin-item">
                <span>${p.titulo} <small>(Grade ${p.grado})</small></span>
                <div>
                    <button class="btn-edit" onclick="cargarParaEditar('${id}')">Editar</button>
                    <button class="btn-delete" onclick="eliminarPieza('${id}')">🗑️</button>
                </div>
            </div>`;
    });
}

function cargarParaEditar(id) {
    const p = piezasData[id];
    document.getElementById('edit-id').value = id;
    document.getElementById('admin-titulo').value = p.titulo;
    document.getElementById('admin-grado').value = p.grado;
    document.getElementById('admin-autor').value = p.autor;
    document.getElementById('admin-yt').value = p.youtubeId;
    document.getElementById('admin-img').value = p.imagen;
    document.getElementById('admin-desc').value = p.descripcion;
}

function eliminarPieza(id) {
    if (confirm('¿Eliminar pieza?')) {
        delete piezasData[id];
        localStorage.setItem('festiPiezas', JSON.stringify(piezasData));
        renderAdminList();
    }
}

// --- 4. REPERTORIO Y BUSCADOR ---
function renderRepertorio() {
    const grid = document.querySelector('.repertorio-grid');
    if (!grid) return;
    grid.innerHTML = '';
    Object.keys(piezasData).forEach(id => {
        const p = piezasData[id];
        grid.innerHTML += `
            <div class="pieza-card" onclick="abrirDetalle('${id}')">
                <div class="video-preview-img" style="background-image: url('${p.imagen}');">
                    <div class="play-overlay">▶ Ver Detalles</div>
                </div>
                <div class="pieza-content">
                    <h3>${p.titulo}</h3>
                    <p>Grade ${p.grado} | ${p.autor}</p>
                </div>
            </div>`;
    });
}

const searchInput = document.getElementById('search-repertorio');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('.pieza-card').forEach(card => {
            card.style.display = card.innerText.toLowerCase().includes(query) ? "block" : "none";
        });
    });
}

// --- 5. MODAL DETALLE ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Ejecutar renders si los contenedores existen
    if (document.querySelector('.repertorio-grid')) renderRepertorio();
    if (document.getElementById('tabla-piezas')) renderAdminList();

    // 2. Control Central de Visibilidad Admin
    const session = localStorage.getItem('festiSession');
    const btnAdmin = document.getElementById('btn-volver-admin');
    const linkAdmin = document.getElementById('admin-link'); // El link "Admin" del menu

    if (session === 'admin') {
        if (btnAdmin) btnAdmin.style.display = 'inline-block';
        if (linkAdmin) linkAdmin.style.display = 'inline-block';
    } else {
        if (btnAdmin) btnAdmin.style.display = 'none';
        if (linkAdmin) linkAdmin.style.display = 'none';
    }
});