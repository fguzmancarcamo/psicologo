// script.js

document.addEventListener('DOMContentLoaded', () => {
    // Elementos DOM
    const btnNuevoPaciente = document.getElementById('btnNuevoPaciente');
    const modal = document.getElementById('modal');
    const closeModal = document.getElementById('closeModal');
    const cancelModal = document.getElementById('cancelModal');
    const patientForm = document.getElementById('patientForm');
    const patientGrid = document.getElementById('patientGrid');
    const searchInput = document.getElementById('searchInput');

    // Estado
    let pacientes = JSON.parse(localStorage.getItem('pacientes')) || [];
    let editingPacienteId = null;

    // Inicialización
    renderPacientes();

    // Event Listeners
    btnNuevoPaciente.addEventListener('click', () => {
        editingPacienteId = null;
        patientForm.reset();
        modal.style.display = 'flex';
    });

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    cancelModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    patientForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(patientForm);
        const paciente = Object.fromEntries(formData.entries());

        if (editingPacienteId) {
            // Actualizar paciente
            pacientes = pacientes.map(p => 
                p.id === editingPacienteId ? { ...p, ...paciente } : p
            );
        } else {
            // Agregar paciente nuevo
            paciente.id = Date.now();
            pacientes.push(paciente);
        }

        localStorage.setItem('pacientes', JSON.stringify(pacientes));
        renderPacientes();
        modal.style.display = 'none';
    });

    searchInput.addEventListener('input', renderPacientes);

    // Funciones
    function renderPacientes() {
        const term = searchInput.value.toLowerCase();
        const filtered = pacientes.filter(p => 
            p.name.toLowerCase().includes(term) ||
            p.diagnosis?.toLowerCase().includes(term)
        );

        if (filtered.length === 0) {
            patientGrid.innerHTML = `
                <div class="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                    <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-50 mb-4">
                        <div class="w-6 h-6 text-indigo-400"></div>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900">No se encontraron pacientes</h3>
                    <p class="mt-1 text-sm text-gray-500">Intenta ajustar tu búsqueda o agrega un nuevo paciente.</p>
                </div>
            `;
            return;
        }

        patientGrid.innerHTML = filtered.map(paciente => {
            const nextDate = getNextAppointmentDate(paciente.lastVisit);
            const statusColor = getStatusColor(nextDate);
            const statusText = getStatusText(nextDate);

            return `
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h3 class="font-bold text-slate-800 text-lg">${paciente.name}</h3>
                            <span class="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">
                                ${paciente.diagnosis || 'Sin diagnóstico'}
                            </span>
                        </div>
                        <div class="flex gap-1">
                            <button onclick="editarPaciente('${paciente.id}')" class="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors">
                                <div class="w-4 h-4"></div>
                            </button>
                            <button onclick="eliminarPaciente('${paciente.id}')" class="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-red-600 rounded-lg transition-colors">
                                <div class="w-4 h-4"></div>
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="space-y-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <p class="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Primera Vez</p>
                                    <div class="flex items-center text-slate-600 text-sm">
                                        <div class="w-3.5 h-3.5 mr-1.5"></div>
                                        ${formatDate(paciente.firstVisit)}
                                    </div>
                                </div>
                                <div>
                                    <p class="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Última Vez</p>
                                    <div class="flex items-center text-slate-600 text-sm">
                                        <div class="w-3.5 h-3.5 mr-1.5"></div>
                                        ${formatDate(paciente.lastVisit)}
                                    </div>
                                </div>
                            </div>
                            <div class="${statusColor} status-box">
                                <div class="flex items-center justify-between">
                                    <span class="text-xs font-bold uppercase tracking-wide opacity-80">Próxima Atención</span>
                                    <span class="text-xs font-bold px-2 py-0.5 bg-white bg-opacity-50 rounded-full">${statusText}</span>
                                </div>
                                <div class="font-semibold text-lg flex items-center">
                                    <div class="w-5 h-5 mr-2 opacity-80"></div>
                                    ${formatDate(nextDate)}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <button onclick="atendidoHoy('${paciente.id}')" class="w-full py-2 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 rounded-lg text-sm font-medium transition-all shadow-sm flex justify-center items-center gap-2 group">
                            <div class="w-4 h-4 group-hover:scale-110 transition-transform"></div>
                            Atendido Hoy
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Funciones auxiliares
    function formatDate(dateString) {
        if (!dateString) return 'Sin fecha';
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    }

    function getNextAppointmentDate(lastVisitDate) {
        if (!lastVisitDate) return '';
        const date = new Date(lastVisitDate);
        date.setMonth(date.getMonth() + 1);
        return date.toISOString().split('T')[0];
    }

    function getStatusColor(nextDate) {
        if (!nextDate) return 'bg-gray-100 text-gray-600 border-gray-200';
        const today = new Date();
        today.setHours(0,0,0,0);
        const next = new Date(nextDate);
        
        const diffTime = next - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'bg-red-50 text-red-700 border-red-200';
        if (diffDays <= 7) return 'bg-amber-50 text-amber-700 border-amber-200';
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    function getStatusText(nextDate) {
        if (!nextDate) return 'Sin programar';
        const today = new Date();
        today.setHours(0,0,0,0);
        const next = new Date(nextDate);
        
        const diffTime = next - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
        if (diffDays < 0) return `Atrasada por ${Math.abs(diffDays)} días`;
        if (diffDays === 0) return 'Es hoy';
        if (diffDays <= 7) return `En ${diffDays} días`;
        return 'Programada';
    }

    // Funciones globales para los botones
    window.editarPaciente = (id) => {
        editingPacienteId = id;
        const paciente = pacientes.find(p => p.id === id);
        if (paciente) {
            patientForm.elements.name.value = paciente.name;
            patientForm.elements.diagnosis.value = paciente.diagnosis;
            patientForm.elements.firstVisit.value = paciente.firstVisit;
            patientForm.elements.lastVisit.value = paciente.lastVisit;
            modal.style.display = 'flex';
        }
    };

    window.eliminarPaciente = (id) => {
        if (confirm('¿Estás seguro de eliminar este paciente?')) {
            pacientes = pacientes.filter(p => p.id !== id);
            localStorage.setItem('pacientes', JSON.stringify(pacientes));
            renderPacientes();
        }
    };

    window.atendidoHoy = (id) => {
        const hoy = new Date().toISOString().split('T')[0];
        pacientes = pacientes.map(p => 
            p.id === id ? { ...p, lastVisit: hoy } : p
        );
        localStorage.setItem('pacientes', JSON.stringify(pacientes));
        renderPacientes();
    };
});
