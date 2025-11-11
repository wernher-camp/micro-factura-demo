const API = "/api/empleados";

async function listar() {
  const res = await fetch(API);
  const data = await res.json();
  const tbody = document.getElementById("tbody");
  tbody.innerHTML = "";
  data.forEach(e => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.id}</td>
      <td>${e.nombreEmpleado}</td>
      <td>${e.direccion||""}</td>
      <td>${e.edad||""}</td>
      <td>${e.puesto||""}</td>
      <td>
        <button class="btn btn-sm btn-info" onclick="editar(${e.id})">Editar</button>
        <button class="btn btn-sm btn-danger" onclick="eliminar(${e.id})">Eliminar</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

async function editar(id) {
  const res = await fetch(`${API}/${id}`);
  if (!res.ok) return alert("No encontrado");
  const e = await res.json();
  document.getElementById("empId").value = e.id;
  document.getElementById("nombreEmpleado").value = e.nombreEmpleado;
  document.getElementById("direccion").value = e.direccion||"";
  document.getElementById("edad").value = e.edad||"";
  document.getElementById("puesto").value = e.puesto||"";
  document.getElementById("form-title").innerText = "Editar empleado";
  document.getElementById("submitBtn").innerText = "Actualizar";
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