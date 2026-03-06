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

// --- 1. CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyBKVZhJcIKPnixgYD3vQX6zoPg7x80qBeg",
    authDomain: "festi-band.firebaseapp.com",
    projectId: "festi-band",
    storageBucket: "festi-band.firebasestorage.app",
    messagingSenderId: "727482836910",
    appId: "1:727482836910:web:a4e20eb6a06e3b2eab0a3f"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Ya no usamos localStorage para las piezas, usamos esta variable global
let piezasData = {};

// --- FUNCIÓN PARA CARGAR DATOS DE LA NUBE ---
async function cargarDatosNube() {
    try {
        const snapshot = await db.collection('piezas').get();
        piezasData = {}; // Limpiamos
        snapshot.forEach(doc => {
            piezasData[doc.id] = doc.data();
        });
        // Una vez cargados, refrescamos las listas
        renderRepertorio();
        renderAdminList();
    } catch (error) {
        console.error("Error cargando nube:", error);
    }
}

function abrirDetalle(id) {
    const p = piezasData[id];
    const modal = document.getElementById('modal-detalle');
    const display = document.getElementById('detalle-dinamico');

    modal.style.background = `linear-gradient(rgba(27, 55, 93, 0.22), rgba(27, 55, 93, 0.46)), url('${p.imagen}') center/cover no-repeat`;

    display.innerHTML = `
        <div class="detalle-info-texto">
            <h2>${p.titulo}</h2>
            <span class="meta"> Grade ${p.grado} | ${p.autor}</span>
        </div>
        <div class="detalle-wrapper">
            <div class="detalle-info-visual">
                <img src="${p.imagen}" alt="${p.titulo}" style="object-fit: cover; background: #000;">
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
// --- 3. PANEL ADMINISTRATIVO (NUBE) ---
const formPieza = document.getElementById('form-pieza');
if (formPieza) {
    formPieza.addEventListener('submit', async (e) => { // Agregamos 'async'
        e.preventDefault();
        const idExistente = document.getElementById('edit-id').value;
        
        const datosPieza = {
            titulo: document.getElementById('admin-titulo').value,
            grado: document.getElementById('admin-grado').value,
            autor: document.getElementById('admin-autor').value,
            youtubeId: document.getElementById('admin-yt').value,
            imagen: document.getElementById('admin-img').value || 'https://via.placeholder.com/500x400',
            descripcion: document.getElementById('admin-desc').value,
            pdf: "#" // Aquí podrías poner el link al PDF si usas Storage
        };

        try {
            if (idExistente) {
                // ACTUALIZAR en Firebase
                await db.collection('piezas').doc(idExistente).update(datosPieza);
                alert("✅ Pieza actualizada en la nube.");
            } else {
                // CREAR nueva en Firebase
                await db.collection('piezas').add(datosPieza);
                alert("✅ Pieza creada en la nube.");
            }
            
            formPieza.reset();
            document.getElementById('edit-id').value = "";
            cargarDatosNube(); // Recargamos los datos para ver los cambios
        } catch (error) {
            console.error("Error al guardar:", error);
            alert("❌ Error al conectar con Firebase.");
        }
    });
}

function renderAdminList() {
    const lista = document.getElementById('tabla-piezas');
    if (!lista) return;
    lista.innerHTML = '';
    
    // Ahora recorremos piezasData que viene de la nube
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

async function eliminarPieza(id) {
    if (confirm('¿Eliminar de la nube permanentemente?')) {
        try {
            await db.collection('piezas').doc(id).delete();
            alert("🗑️ Eliminado de la nube.");
            cargarDatosNube();
        } catch (error) {
            console.error("Error al eliminar:", error);
        }
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
                    <div class="play-overlay">Ver Detalles</div>
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
    // 1. IMPORTANTE: Cargar datos desde Firebase al iniciar
    cargarDatosNube(); 

    // 2. Control de Visibilidad Admin
    const session = localStorage.getItem('festiSession');
    const btnAdmin = document.getElementById('btn-volver-admin');
    const linkAdmin = document.getElementById('admin-link');

    if (session === 'admin') {
        if (btnAdmin) btnAdmin.style.display = 'inline-block';
        if (linkAdmin) linkAdmin.style.display = 'inline-block';
    } else {
        if (btnAdmin) btnAdmin.style.display = 'none';
        if (linkAdmin) linkAdmin.style.display = 'none';
    }
});