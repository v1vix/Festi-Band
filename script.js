// --- 1. BASE DE DATOS LOCAL ---
// Protección de rutas
if (window.location.pathname.includes('admin.html')) {
    if (localStorage.getItem('festiSession') !== 'admin') {
        window.location.href = 'login.html';
    }
}
if (window.location.pathname.includes('repertorio.html')) {
    if (!localStorage.getItem('festiSession')) {
        window.location.href = 'login.html';
    }
}

// Base de Datos del Repertorio
// --- 1. CONFIGURACIÓN DE LA NUBE (FIREBASE) ---
// --- 1. CONFIGURACIÓN DE FIREBASE (Vínculo Real) ---
const firebaseConfig = {
    apiKey: "AIzaSyBKVZhJcIKPnixgYD3vQX6zoPg7x80qBeg",
    authDomain: "festi-band.firebaseapp.com",
    projectId: "festi-band",
    storageBucket: "festi-band.firebasestorage.app", // Nota: .app es el nuevo estándar
    messagingSenderId: "727482836910",
    appId: "1:727482836910:web:a4e20eb6a06e3b2eab0a3f",
    measurementId: "G-YYJJVEBHN6"
};

// Inicializar los servicios (Formato Compatible)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// El resto de tus funciones (guardarPieza, eliminarPieza, etc.) siguen abajo...

// Esta variable ahora se llenará desde la nube
let piezasData = {};

function abrirDetalle(id) {
    const p = piezasData[id];
    const display = document.getElementById('detalle-dinamico');
    
    display.innerHTML = `
        <div class="detalle-info-texto">
            <h2>${p.titulo}</h2>
            <span class="meta"> Grade ${p.grado} | Autor/Arreglista: ${p.duracion}</span>
        </div>
        <div class="detalle-wrapper">
            <div class="detalle-info-visual">
                <img src="${p.imagen}" alt="${p.titulo}">
            </div>
            <div class="detalle-info-texto">
                <p>${p.descripcion}</p>
                <a href="${p.pdf}" target="_blank" class="click-score">Click para ver partitura (PDF) →</a>
            </div>
        </div>
        <div class="video-full-width">
            <div class="video-wrapper">
                <iframe 
                    src="https://www.youtube.com/embed/${p.youtubeId}?rel=0" 
                    frameborder="0" 
                    allowfullscreen>
                </iframe>
            </div>
        </div>`;
    
    document.getElementById('modal-detalle').style.display = "block";
    document.body.style.overflow = "hidden"; 
}

function cerrarDetalle() {
    document.getElementById('modal-detalle').style.display = "none";
    document.body.style.overflow = "auto";
}

// Cerrar al hacer clic fuera del cuadro blanco
window.onclick = function(event) {
    const modal = document.getElementById('modal-detalle');
    if (event.target == modal) cerrarDetalle();
}

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

document.addEventListener('DOMContentLoaded', () => {
    // 1. Obtenemos el tipo de usuario guardado al hacer login
    const tipoUsuario = localStorage.getItem('festiSession'); 
    const linkAdmin = document.getElementById('admin-link');

    // 2. Si el usuario es admin, le mostramos el botón
    if (tipoUsuario === 'admin' && linkAdmin) {
        linkAdmin.style.display = 'inline-block';
    }
});

/**
 * Borra la sesión y regresa al inicio.
 */
function cerrarSesion() {
    localStorage.removeItem('festiSession');
    window.location.href = "index.html";
}

function cerrarSesion() {
    localStorage.removeItem('festiSession');
    window.location.href = "index.html";
}


// --- 3. PANEL ADMINISTRATIVO ---
// --- 3. PANEL ADMINISTRATIVO (CON SUBIDA DE PDF) ---
const formPieza = document.getElementById('form-pieza');
if (formPieza) {
    formPieza.addEventListener('submit', async (e) => { // Agregamos async
        e.preventDefault();
        const idExistente = document.getElementById('edit-id').value;
        const file = document.getElementById('pdf-file').files[0]; // El input file que creamos
        
        let pdfUrl = "#";

        // Si seleccionaste un archivo, lo subimos a Storage
        if (file) {
            const storageRef = storage.ref('partituras/' + file.name);
            await storageRef.put(file);
            pdfUrl = await storageRef.getDownloadURL();
        }

        const datosPieza = {
            titulo: document.getElementById('admin-titulo').value,
            grado: document.getElementById('admin-grado').value,
            duracion: document.getElementById('admin-duracion').value,
            youtubeId: document.getElementById('admin-yt').value,
            imagen: document.getElementById('admin-img').value || 'https://via.placeholder.com/500x400',
            descripcion: document.getElementById('admin-desc').value,
            pdf: pdfUrl,
            fecha: new Date()
        };

        if (idExistente) {
            await db.collection("repertorio").doc(idExistente).update(datosPieza);
        } else {
            await db.collection("repertorio").add(datosPieza);
        }

        alert("✅ Cambios guardados en la nube.");
        formPieza.reset();
        document.getElementById('edit-id').value = "";
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
    document.getElementById('admin-duracion').value = p.duracion;
    document.getElementById('admin-yt').value = p.youtubeId;
    document.getElementById('admin-img').value = p.imagen;
    document.getElementById('admin-desc').value = p.descripcion;
}

async function eliminarPieza(id) {
    if (confirm('¿Eliminar esta pieza de la nube?')) {
        await db.collection("repertorio").doc(id).delete();
        alert("Eliminado.");
    }
}

// --- 4. REPERTORIO Y BUSCADOR ---
function escucharRepertorio() {
    db.collection("repertorio").orderBy("fecha", "desc").onSnapshot((snapshot) => {
        piezasData = {}; // Limpiamos localmente
        snapshot.forEach(doc => {
            piezasData[doc.id] = doc.data();
        });
        
        // Llamamos a las funciones que dibujan en pantalla
        actualizarInterfazRepertorio();
        actualizarInterfazAdmin();
    });
}

function actualizarInterfazRepertorio() {
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
                    <p>Grade ${p.grado} | ${p.duracion}</p>
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
function abrirDetalle(id) {
    const p = piezasData[id];
    const display = document.getElementById('detalle-dinamico');
    display.innerHTML = `
        <div class="detalle-info-texto">
            <h2>${p.titulo}</h2>
            <span class="meta"> Grade ${p.grado} | Autor: ${p.duracion}'</span>
        </div>
        <div class="detalle-wrapper">
            <div class="detalle-info-visual"><img src="${p.imagen}"></div>
            <div class="detalle-info-texto">
                <p>${p.descripcion}</p>
                <a href="${p.pdf}" target="_blank" class="click-score">Click to view score →</a>
            </div>
        </div>
            <div class="video-full-width">
                <div class="video-wrapper">
                    <iframe 
                        src="https://www.youtube.com/embed/${p.youtubeId}?rel=0" 
                        frameborder="0" 
                        allowfullscreen>
                    </iframe>
                </div>
            </div>`;
    document.getElementById('modal-detalle').style.display = "block";
}

function cerrarDetalle() {
    document.getElementById('modal-detalle').style.display = "none";
    document.getElementById('detalle-dinamico').innerHTML = "";
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Escuchar cambios en la nube en tiempo real
    db.collection("repertorio").orderBy("fecha", "desc").onSnapshot((snapshot) => {
        piezasData = {}; 
        snapshot.forEach(doc => {
            piezasData[doc.id] = doc.data(); 
        });
        
        // Ejecutamos los renders si los elementos existen en la página actual
        if (typeof renderAdminList === 'function') renderAdminList();
        if (typeof actualizarInterfazRepertorio === 'function') actualizarInterfazRepertorio();
    });

    // 2. Control de botones según sesión
    const session = localStorage.getItem('festiSession');
    const btnAdmin = document.getElementById('btn-volver-admin');
    const linkAdmin = document.getElementById('admin-link');
    const authBtn = document.getElementById('auth-btn');

    if (session === 'admin') {
        if (btnAdmin) btnAdmin.style.display = 'inline-block';
        if (linkAdmin) linkAdmin.style.display = 'inline-block';
        if (authBtn) {
            authBtn.innerText = "Panel Admin";
            authBtn.href = "admin.html";
            authBtn.style.background = "#d4af37";
        }
    }
});
