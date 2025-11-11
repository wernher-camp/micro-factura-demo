const API = "/api/empleados";

async function listar() {
  try {
    const res = await fetch(API);
    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error("Respuesta inesperada:", data);
      alert("Error al obtener empleados. Revisa el backend.");
      return;
    }

    const tbody = document.getElementById("tbody");
    tbody.innerHTML = "";
    data.forEach(e => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${e.id}</td>
        <td>${e.nombreEmpleado}</td>
        <td>${e.direccion || ""}</td>
        <td>${e.edad || ""}</td>
        <td>${e.puesto || ""}</td>
        <td>
          <button class="btn btn-sm btn-info" onclick="editar(${e.id})">Editar</button>
          <button class="btn btn-sm btn-danger" onclick="eliminar(${e.id})">Eliminar</button>
        </td>`;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error al listar empleados:", err);
    alert("No se pudo conectar al servidor.");
  }
}

async function editar(id) {
  try {
    const res = await fetch(`${API}/${id}`);
    if (!res.ok) {
      alert("Error al obtener empleado (HTTP " + res.status + ")");
      return;
    }

    // Leer texto y convertir a JSON si aplica
    const text = await res.text();
    let e;
    try {
      e = JSON.parse(text);
    } catch {
      console.error("Respuesta no JSON:", text);
      alert("El backend devolvió una respuesta no válida.");
      return;
    }

    // Rellenar formulario
    document.getElementById("empId").value = e.id;
    document.getElementById("nombreEmpleado").value = e.nombreEmpleado || "";
    document.getElementById("direccion").value = e.direccion || "";
    document.getElementById("edad").value = e.edad || "";
    document.getElementById("puesto").value = e.puesto || "";
    document.getElementById("form-title").innerText = "Editar empleado";
    document.getElementById("submitBtn").innerText = "Actualizar";

  } catch (err) {
    console.error("Error al editar empleado:", err);
    alert("Error al conectar con el servidor.");
  }
}
async function eliminar(id) {
  if (!confirm("Eliminar empleado?")) return;
  await fetch(`${API}/${id}`, { method: "DELETE" });
  listar();
}

document.getElementById("cancelBtn").addEventListener("click", ()=> {
  document.getElementById("empleadoForm").reset();
  document.getElementById("empId").value = "";
  document.getElementById("form-title").innerText = "Agregar empleado";
  document.getElementById("submitBtn").innerText = "Guardar";
});

document.getElementById("empleadoForm").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const id = document.getElementById("empId").value;
  const payload = {
    nombreEmpleado: document.getElementById("nombreEmpleado").value,
    direccion: document.getElementById("direccion").value,
    edad: document.getElementById("edad").value || null,
    puesto: document.getElementById("puesto").value
  };
  if (id) {
    await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });
  } else {
    await fetch(API, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });
  }
  document.getElementById("empleadoForm").reset();
  document.getElementById("empId").value = "";
  document.getElementById("form-title").innerText = "Agregar empleado";
  document.getElementById("submitBtn").innerText = "Guardar";
  listar();
});

listar();
