// --- 1. PROTECCIÓN DE RUTAS (Seguridad básica) ---
const currentPath = window.location.pathname;
const session = localStorage.getItem('festiSession');

if (currentPath.includes('admin.html') && session !== 'admin') {
    window.location.href = 'login.html';
}
if (currentPath.includes('repertorio.html') && !session) {
    window.location.href = 'login.html';
}

// --- 2. CONFIGURACIÓN DE FIREBASE (Vínculo Real) ---
const firebaseConfig = {
    apiKey: "AIzaSyBKVZhJcIKPnixgYD3vQX6zoPg7x80qBeg",
    authDomain: "festi-band.firebaseapp.com",
    projectId: "festi-band",
    storageBucket: "festi-band.firebasestorage.app",
    messagingSenderId: "727482836910",
    appId: "1:727482836910:web:a4e20eb6a06e3b2eab0a3f",
    measurementId: "G-YYJJVEBHN6"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

let piezasData = {}; // Memoria local de las canciones

// --- 3. FUNCIONES DEL MODAL (VER DETALLES) ---
function abrirDetalle(id) {
    const p = piezasData[id];
    const display = document.getElementById('detalle-dinamico');
    
    if (!p || !display) return;

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
                <a href="${p.pdf}" target="_blank" class="click-score">📄 Click para ver partitura (PDF) →</a>
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
    const modal = document.getElementById('modal-detalle');
    if (modal) modal.style.display = "none";
    document.body.style.overflow = "auto";
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    const modal = document.getElementById('modal-detalle');
    if (event.target == modal) cerrarDetalle();
}

// --- 4. SISTEMA DE LOGIN ---
function validarLogin() {
    const user = document.getElementById('usuario').value.trim();
    const pass = document.getElementById('password').value.trim();

    if (user === "admin" && pass === "1234") {
        localStorage.setItem('festiSession', 'admin');
        window.location.href = "admin.html";
    } else if (user === "musico" && pass === "1234") {
        localStorage.setItem('festiSession', 'active');
        window.location.href = "repertorio.html";
    } else {
        alert("❌ Credenciales incorrectas");
    }
}

function cerrarSesion() {
    localStorage.removeItem('festiSession');
    window.location.href = "index.html";
}

// --- 5. PANEL ADMINISTRATIVO (SUBIDA A NUBE) ---
const formPieza = document.getElementById('form-pieza');
if (formPieza) {
    formPieza.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnGuardar = e.target.querySelector('button');
        btnGuardar.innerText = "⏳ Subiendo...";
        btnGuardar.disabled = true;

        const idExistente = document.getElementById('edit-id').value;
        const file = document.getElementById('pdf-file').files[0];
        
        let pdfUrl = idExistente && piezasData[idExistente] ? piezasData[idExistente].pdf : "#";

        try {
            if (file) {
                const storageRef = storage.ref('partituras/' + Date.now() + "_" + file.name);
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

            alert("✅ ¡Éxito! Guardado en la nube.");
            formPieza.reset();
            document.getElementById('edit-id').value = "";
        } catch (error) {
            console.error(error);
            alert("❌ Error al guardar.");
        } finally {
            btnGuardar.innerText = "Guardar Pieza";
            btnGuardar.disabled = false;
        }
    });
}

// --- 6. RENDERIZADO (DIBUJAR EN PANTALLA) ---
function actualizarInterfaces() {
    // Para el administrador
    const listaAdmin = document.getElementById('tabla-piezas');
    if (listaAdmin) {
        listaAdmin.innerHTML = '';
        Object.keys(piezasData).forEach(id => {
            const p = piezasData[id];
            listaAdmin.innerHTML += `
                <div class="admin-item">
                    <span>${p.titulo} <small>(G${p.grado})</small></span>
                    <div>
                        <button class="btn-edit" onclick="cargarParaEditar('${id}')">Editar</button>
                        <button class="btn-delete" onclick="eliminarPieza('${id}')">🗑️</button>
                    </div>
                </div>`;
        });
    }

    // Para el repertorio
    const gridRepertorio = document.querySelector('.repertorio-grid');
    if (gridRepertorio) {
        gridRepertorio.innerHTML = '';
        Object.keys(piezasData).forEach(id => {
            const p = piezasData[id];
            gridRepertorio.innerHTML += `
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
    if (confirm('¿Eliminar esta pieza permanentemente?')) {
        await db.collection("repertorio").doc(id).delete();
    }
}

// --- 7. BUSCADOR ---
const searchInput = document.getElementById('search-repertorio');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('.pieza-card').forEach(card => {
            card.style.display = card.innerText.toLowerCase().includes(query) ? "block" : "none";
        });
    });
}

// --- 8. INICIO EN TIEMPO REAL ---
document.addEventListener('DOMContentLoaded', () => {
    // Escuchar la nube
    db.collection("repertorio").orderBy("fecha", "desc").onSnapshot((snapshot) => {
        piezasData = {}; 
        snapshot.forEach(doc => { piezasData[doc.id] = doc.data(); });
        actualizarInterfaces();
    });

    // Botones de Admin
    const authBtn = document.getElementById('auth-btn');
    if (session === 'admin' && authBtn) {
        authBtn.innerText = "Panel Admin";
        authBtn.href = "admin.html";
        authBtn.style.background = "#d4af37";
    }
});
