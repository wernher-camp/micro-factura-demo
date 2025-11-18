const API = "/api/media";

const qs = id => document.getElementById(id);
const messages = qs("messages");
const grid = qs("grid");
const mediaModal = new bootstrap.Modal(qs("mediaModal"));

async function showMessage(txt, type="success", timeout=3000) {
  messages.innerHTML = `<div class="alert alert-${type}">${txt}</div>`;
  if (timeout) setTimeout(()=> messages.innerHTML = "", timeout);
}

async function fetchAll() {
  try {
    const res = await fetch(API);
    const data = await res.json();
    renderGrid(data);
  } catch (e) {
    console.error(e);
    showMessage("No se pudo obtener medios", "danger", 5000);
  }
}

function renderGrid(items) {
  grid.innerHTML = "";
  items.forEach(item => {
    const col = document.createElement("div");
    col.className = "col-sm-6 col-md-4 col-lg-3";
    col.innerHTML = `
      <div class="card">
        ${item.type === "image" ? `<img src="${item.url}" alt="${escapeHtml(item.title)}">` : `<div style="height:180px;display:flex;align-items:center;justify-content:center;background:#f1f1f1">${item.type.toUpperCase()}</div>`}
        <div class="card-body">
          <h6 class="card-title">${escapeHtml(item.title)}</h6>
          <p class="card-text text-truncate">${escapeHtml(item.description || "")}</p>
          <div class="d-flex justify-content-between">
            <button class="btn btn-sm btn-primary" onclick="openItem(${item.id})">Ver</button>
            <div>
              <button class="btn btn-sm btn-outline-secondary" onclick="editItem(${item.id})">Editar</button>
              <button class="btn btn-sm btn-outline-danger" onclick="delItem(${item.id})">Borrar</button>
            </div>
          </div>
        </div>
      </div>`;
    grid.appendChild(col);
  });
}

function escapeHtml(s=""){ return s.toString().replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"); }

async function openItem(id) {
  try {
    const res = await fetch(`${API}/${id}`);
    if (!res.ok) return showMessage("No encontrado", "warning");
    const item = await res.json();
    qs("modalTitle").innerText = item.title;
    const body = qs("modalBody");
    body.innerHTML = "";
    if (item.type === "image") {
      body.innerHTML = `<img src="${item.url}" style="width:100%;max-height:80vh;object-fit:contain;">`;
    } else if (item.type === "video") {
      const embed = youtubeEmbedFromUrl(item.url);
      body.innerHTML = embed ? `<div class="ratio ratio-16x9"><iframe src="${embed}" allowfullscreen></iframe></div>` : `<a href="${item.url}" target="_blank">${item.url}</a>`;
    } else {
      // documento: mostrar iframe si es Google Drive viewer o link
      const driveView = driveViewer(item.url);
      body.innerHTML = driveView ? `<iframe src="${driveView}" style="width:100%;height:80vh;border:0;"></iframe>` : `<a href="${item.url}" target="_blank">${item.url}</a>`;
    }
    qs("deleteBtn").onclick = async () => { await delItem(id); mediaModal.hide(); };
    mediaModal.show();
  } catch (err) {
    console.error(err);
    showMessage("Error al abrir item", "danger");
  }
}

function youtubeEmbedFromUrl(url) {
  if (!url) return null;
  // extrae id de youtube (varios formatos)
  const m = url.match(/(?:v=|be\/|embed\/)([A-Za-z0-9_-]{6,})/);
  if (!m) return null;
  return `https://www.youtube.com/embed/${m[1]}`;
}

function driveViewer(url) {
  // Si es un enlace de drive con id, usa viewer
  const m = url.match(/\/d\/([A-Za-z0-9_-]{10,})/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  if (url.includes("docs.google.com")) return url.replace("/view","/preview");
  return null;
}

// Form handling
qs("mediaForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = qs("mediaId").value;
  const payload = {
    title: qs("title").value.trim(),
    type: qs("type").value,
    url: qs("url").value.trim(),
    description: qs("description").value.trim()
  };
  try {
    if (id) {
      const res = await fetch(`${API}/${id}`, {
        method: "PUT",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const j = await res.json().catch(()=>({error:"error"}));
        return showMessage("Error al actualizar: " + (j.error||j.message||res.statusText), "danger");
      }
      showMessage("Actualizado correctamente");
    } else {
      const res = await fetch(API, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const j = await res.json().catch(()=>({error:"error"}));
        return showMessage("Error al crear: " + (j.error||j.message||res.statusText), "danger");
      }
      showMessage("Creado correctamente");
    }
    qs("mediaForm").reset();
    qs("mediaId").value = "";
    qs("form-title").innerText = "Agregar medio";
    qs("submitBtn").innerText = "Agregar";
    fetchAll();
    window.location.hash = "#gallery";
  } catch (err) {
    console.error(err);
    showMessage("Error en petición", "danger");
  }
});

qs("cancelBtn").addEventListener("click", () => {
  qs("mediaForm").reset();
  qs("mediaId").value = "";
  qs("form-title").innerText = "Agregar medio";
  qs("submitBtn").innerText = "Agregar";
});

async function editItem(id) {
  try {
    const res = await fetch(`${API}/${id}`);
    if (!res.ok) return showMessage("Registro no encontrado", "warning");
    const item = await res.json();
    qs("mediaId").value = item.id;
    qs("title").value = item.title;
    qs("type").value = item.type;
    qs("url").value = item.url;
    qs("description").value = item.description || "";
    qs("form-title").innerText = "Editar medio";
    qs("submitBtn").innerText = "Actualizar";
    window.scrollTo({ top:0, behavior:"smooth" });
  } catch (err) {
    console.error("Error al editar:", err);
    showMessage("Error al obtener el registro", "danger");
  }
}

async function delItem(id) {
  if (!confirm("Eliminar registro?")) return;
  try {
    const res = await fetch(`${API}/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json().catch(()=>({error:"error"}));
      return showMessage("Error al eliminar: " + (j.error||res.statusText), "danger");
    }
    showMessage("Eliminado", "success");
    fetchAll();
  } catch (err) {
    console.error(err);
    showMessage("Error al eliminar", "danger");
  }
}

// Inicializar
document.addEventListener("DOMContentLoaded", fetchAll);
