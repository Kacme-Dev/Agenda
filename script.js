// Chave para armazenar o array de todos os clientes no LocalStorage
const CLIENTS_ARRAY_KEY = 'allClientCards'; 
const EMPTY_CLIENT_DATA = {
    'data-inicio': '',
    'codigo': '',
    'nome-cliente': '',
    'nome-contato': '',
    'email': '',
    'telefone-01': '',
    'plano-acao': '',
    tarefas: []
};

let clients = []; 
let currentClientCode = null; 

// Instâncias dos Modais do Bootstrap
let clientDataModalInstance;
let summaryModalInstance;
let tasksModalInstance;
let messageModalInstance;
let globalTasksModalInstance;

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa instâncias
    clientDataModalInstance = new bootstrap.Modal(document.getElementById('client-data-modal'));
    summaryModalInstance = new bootstrap.Modal(document.getElementById('summary-modal'));
    tasksModalInstance = new bootstrap.Modal(document.getElementById('tasks-modal'));
    messageModalInstance = new bootstrap.Modal(document.getElementById('message-modal'));
    globalTasksModalInstance = new bootstrap.Modal(document.getElementById('global-tasks-modal'));

    loadAllClients();
    setupEventListeners();
    showClientListSidebar();
    updateOverdueAlert();
    initTheme(); // Inicializa o seletor de modo claro/escuro
});

// --- Utilidades ---

function getTodayDateString() {
    return new Date().toISOString().split('T')[0];
}

function showMessage(title, text, type = 'primary') {
    const modalLabel = document.getElementById('messageModalLabel');
    const modalBody = document.getElementById('messageModalBody');
    const modalFooter = document.getElementById('messageModalFooter');

    modalLabel.innerText = title;
    modalBody.innerHTML = `<p class="mb-0 text-${type}">${text}</p>`;
    modalFooter.innerHTML = `<button type="button" class="btn btn-${type}" data-bs-dismiss="modal">Entendido</button>`;
    
    messageModalInstance.show();
}

// --- Persistência ---

function loadAllClients() {
    const stored = localStorage.getItem(CLIENTS_ARRAY_KEY);
    clients = stored ? JSON.parse(stored) : [];
}

function saveAllClients() {
    localStorage.setItem(CLIENTS_ARRAY_KEY, JSON.stringify(clients));
    showClientListSidebar();
    updateOverdueAlert();
}

// --- Lógica de Clientes ---

function clearFormData(isNew = false) {
    const form = document.getElementById('client-form');
    form.reset();
    currentClientCode = null;
    document.getElementById('modal1-delete-btn').classList.add('d-none');

    if (isNew) {
        form.querySelector('[name="data-inicio"]').value = getTodayDateString();
    }
}

function saveOrUpdateClient() {
    const form = document.getElementById('client-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return false;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Se estivermos editando
    if (currentClientCode) {
        const idx = clients.findIndex(c => c.codigo === currentClientCode);
        if (idx !== -1) {
            clients[idx] = { ...clients[idx], ...data };
        }
    } else {
        // Novo Cliente: Verifica duplicidade de código
        if (clients.some(c => c.codigo === data.codigo)) {
            showMessage("Erro", "Já existe um cliente com este código!", "danger");
            return false;
        }
        data.tarefas = [];
        clients.push(data);
    }

    currentClientCode = data.codigo;
    saveAllClients();
    updateSummary();
    summaryModalInstance.show();
    return true;
}

function editClient(code) {
    const client = clients.find(c => c.codigo === code);
    if (!client) return;

    currentClientCode = code;
    const form = document.getElementById('client-form');
    
    Object.keys(client).forEach(key => {
        const input = form.querySelector(`[name="${key}"]`);
        if (input) input.value = client[key];
    });

    document.getElementById('modal1-delete-btn').classList.remove('d-none');
    clientDataModalInstance.show();
}

function deleteCurrentClient() {
    if (!currentClientCode) return;
    if (confirm("Deseja realmente excluir este cliente e todas as suas tarefas?")) {
        clients = clients.filter(c => c.codigo !== currentClientCode);
        saveAllClients();
        clientDataModalInstance.hide();
        showMessage("Sucesso", "Cliente removido.");
    }
}

// --- Resumo e Sidebar ---

function updateSummary() {
    const client = clients.find(c => c.codigo === currentClientCode);
    if (!client) return;

    const output = document.getElementById('summary-output');
    output.innerHTML = `
        <div class="row">
            <div class="col-6"><strong>Início:</strong> ${client['data-inicio']}</div>
            <div class="col-6"><strong>Código:</strong> ${client.codigo}</div>
            <div class="col-12 mt-2"><strong>Cliente:</strong> ${client['nome-cliente']}</div>
            <div class="col-12"><strong>Contato:</strong> ${client['nome-contato']}</div>
            <div class="col-6"><strong>E-mail:</strong> ${client.email}</div>
            <div class="col-6"><strong>Tel:</strong> ${client['telefone-01']}</div>
        </div>
    `;
    document.getElementById('summary-plano-output').innerText = client['plano-acao'] || "Nenhum plano definido.";
}

function showClientListSidebar() {
    const container = document.getElementById('client-list-output');
    if (clients.length === 0) {
        container.innerHTML = '<p class="text-center text-secondary small">Nenhum cliente cadastrado.</p>';
        return;
    }

    container.innerHTML = '';
    clients.forEach(c => {
        const div = document.createElement('div');
        div.className = 'client-item-card';
        div.onclick = () => editClient(c.codigo);
        div.innerHTML = `
            <div class="fw-bold text-white small">${c['nome-cliente']}</div>
            <div class="text-secondary" style="font-size: 0.75rem;">Cód: ${c.codigo}</div>
        `;
        container.appendChild(div);
    });
}

// --- Gestão de Tarefas ---

function openTasksModal() {
    const client = clients.find(c => c.codigo === currentClientCode);
    if (!client) return;

    document.getElementById('tasks-client-name').innerText = client['nome-cliente'];
    renderTasksList();
    tasksModalInstance.show();
}

/**
 * IMPLEMENTAÇÃO SOLICITADA: Lógica para editar tarefa.
 * Esta função carrega os dados da tarefa no formulário lateral e a remove do array 
 * para que possa ser salva novamente como uma "atualização".
 */
function editTarefa(index) {
    const client = clients.find(c => c.codigo === currentClientCode);
    const tarefa = client.tarefas[index];

    // Preenche o formulário com os dados atuais
    document.getElementById('tarefa-create-date').value = tarefa.criacao;
    document.getElementById('tarefa-due-date').value = tarefa.limite;
    document.getElementById('tarefa-title').value = tarefa.titulo;
    document.getElementById('tarefa-desc').value = tarefa.descricao;
    document.getElementById('tarefa-status').value = tarefa.status;

    // Remove a tarefa antiga para substituição no save
    client.tarefas.splice(index, 1);
    
    // Foca no primeiro campo para edição
    document.getElementById('tarefa-due-date').focus();
    
    // Atualiza a visualização da lista
    renderTasksList();
}

function renderTasksList() {
    const client = clients.find(c => c.codigo === currentClientCode);
    const container = document.getElementById('tasks-output');
    const badge = document.getElementById('task-count-badge');
    
    container.innerHTML = '';
    if (!client || client.tarefas.length === 0) {
        container.innerHTML = '<p class="text-muted text-center py-4">Nenhuma tarefa para este cliente.</p>';
        badge.innerText = '0';
        return;
    }

    badge.innerText = client.tarefas.length;
    const hoje = getTodayDateString();

    client.tarefas.forEach((t, index) => {
        const isAtrasada = t.limite < hoje && t.status !== 'Concluída';
        const cardClass = isAtrasada ? 'atrasada' : t.status.toLowerCase().replace(' ', '-');
        
        const div = document.createElement('div');
        div.className = `card task-card p-3 shadow-sm border-0 ${cardClass}`;
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h6 class="mb-1 fw-bold">${t.titulo}</h6>
                    <p class="small text-muted mb-2">${t.descricao}</p>
                    <div class="d-flex gap-3 small">
                        <span><i class="bi bi-calendar-plus me-1"></i>${t.criacao}</span>
                        <span class="${isAtrasada ? 'text-danger fw-bold' : ''}">
                            <i class="bi bi-calendar-check me-1"></i>${t.limite}
                        </span>
                    </div>
                </div>
                <div class="dropdown">
                    <button class="btn btn-sm btn-light border" data-bs-toggle="dropdown"><i class="bi bi-three-dots-vertical"></i></button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="#" onclick="editTarefa(${index})">Editar</a></li>
                        <li><a class="dropdown-item text-danger" href="#" onclick="deleteTarefa(${index})">Excluir</a></li>
                    </ul>
                </div>
            </div>
            <div class="mt-2 d-flex justify-content-between align-items-center">
                <span class="badge bg-secondary" style="font-size: 0.7rem;">${t.status}</span>
                ${isAtrasada ? '<span class="badge bg-danger">ATRASADA</span>' : ''}
            </div>
        `;
        container.appendChild(div);
    });
}

function addTarefa() {
    const client = clients.find(c => c.codigo === currentClientCode);
    const title = document.getElementById('tarefa-title').value;
    const limit = document.getElementById('tarefa-due-date').value;
    
    if (!title || !limit) {
        alert("Título e Data Limite são obrigatórios.");
        return;
    }

    const novaTarefa = {
        criacao: document.getElementById('tarefa-create-date').value,
        limite: limit,
        titulo: title,
        descricao: document.getElementById('tarefa-desc').value,
        status: document.getElementById('tarefa-status').value
    };

    client.tarefas.push(novaTarefa);
    saveAllClients();
    renderTasksList();
    
    // Limpa apenas os campos específicos
    document.getElementById('tarefa-title').value = '';
    document.getElementById('tarefa-desc').value = '';
    document.getElementById('tarefa-due-date').value = '';
    document.getElementById('tarefa-status').value = 'Pendente';
}

function deleteTarefa(index) {
    if (confirm("Excluir esta tarefa?")) {
        const client = clients.find(c => c.codigo === currentClientCode);
        client.tarefas.splice(index, 1);
        saveAllClients();
        renderTasksList();
    }
}

// --- Relatório Global ---

function showFixedGlobalTasks(filterType) {
    const hoje = getTodayDateString();
    let allTasks = [];
    
    clients.forEach(c => {
        c.tarefas.forEach(t => {
            allTasks.push({ ...t, clienteNome: c['nome-cliente'], clienteCodigo: c.codigo });
        });
    });

    let filtered = [];
    let title = "";

    switch(filterType) {
        case 'report':
            filtered = allTasks;
            title = "Relatório Geral de Tarefas";
            break;
        case 'today':
            filtered = allTasks.filter(t => t.limite === hoje);
            title = "Tarefas de Hoje";
            break;
        case 'overdue':
            filtered = allTasks.filter(t => t.limite < hoje && t.status !== 'Concluída');
            title = "Tarefas Atrasadas";
            break;
        case 'future':
            filtered = allTasks.filter(t => t.limite > hoje);
            title = "Tarefas Futuras";
            break;
    }

    renderGlobalTasksOutput(filtered, title);
}

function showGlobalTasks(clientCode = null, dateStr = null) {
    let tasksToShow = [];
    let title = "Filtro de Tarefas";

    if (clientCode) {
        const c = clients.find(x => x.codigo === clientCode);
        if (c) {
            tasksToShow = c.tarefas.map(t => ({ ...t, clienteNome: c['nome-cliente'] }));
            title = `Tarefas: ${c['nome-cliente']}`;
        }
    } else if (dateStr) {
        clients.forEach(c => {
            c.tarefas.forEach(t => {
                if (t.limite === dateStr) {
                    tasksToShow.push({ ...t, clienteNome: c['nome-cliente'] });
                }
            });
        });
        title = `Tarefas para o dia ${dateStr}`;
    }

    renderGlobalTasksOutput(tasksToShow, title);
}

function renderGlobalTasksOutput(tasks, title) {
    document.getElementById('globalTasksModalLabel').innerText = title;
    const out = document.getElementById('global-tasks-output');
    out.innerHTML = '';

    if (tasks.length === 0) {
        out.innerHTML = '<p class="text-center py-5 text-secondary">Nenhuma tarefa encontrada para este critério.</p>';
    } else {
        const table = document.createElement('table');
        table.className = "table table-hover align-middle";
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Cliente</th>
                    <th>Tarefa</th>
                    <th>Vencimento</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = table.querySelector('tbody');
        tasks.forEach(t => {
            const isAtrasada = t.limite < getTodayDateString() && t.status !== 'Concluída';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><small class="fw-bold">${t.clienteNome}</small></td>
                <td>
                    <div class="fw-bold">${t.titulo}</div>
                    <div class="small text-muted">${t.descricao}</div>
                </td>
                <td><span class="${isAtrasada ? 'text-danger fw-bold' : ''}">${t.limite}</span></td>
                <td><span class="badge ${t.status === 'Concluída' ? 'bg-success' : 'bg-secondary'}">${t.status}</span></td>
            `;
            tbody.appendChild(tr);
        });
        out.appendChild(table);
    }
    globalTasksModalInstance.show();
}

function updateOverdueAlert() {
    const hoje = getTodayDateString();
    let count = 0;
    clients.forEach(c => {
        c.tarefas.forEach(t => {
            if (t.limite < hoje && t.status !== 'Concluída') count++;
        });
    });

    let btn = document.getElementById('global-overdue-alert');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'global-overdue-alert';
        btn.className = 'btn btn-danger overdue-alert-btn';
        btn.onclick = () => showFixedGlobalTasks('overdue');
        document.body.appendChild(btn);
    }

    if (count > 0) {
        btn.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2"></i> ${count} TAREFAS ATRASADAS`;
        btn.style.display = 'block';
    } else {
        btn.style.display = 'none';
    }
}

// --- Event Listeners e Init ---

function setupEventListeners() {
    document.getElementById('new-client-btn').onclick = () => { clearFormData(true); clientDataModalInstance.show(); };
    document.getElementById('modal1-back-btn').onclick = () => { clientDataModalInstance.hide(); };
    document.getElementById('modal1-save-btn').onclick = () => saveOrUpdateClient();
    document.getElementById('modal1-delete-btn').onclick = () => deleteCurrentClient(); 
    document.getElementById('modal2-save-btn').onclick = () => { if(saveOrUpdateClient()) summaryModalInstance.hide(); };
    document.getElementById('modal3-add-btn').onclick = () => addTarefa();

    // IMPLEMENTAÇÃO: Botões de Relatório Global Fixos
    document.getElementById('show-report-btn').onclick = () => showFixedGlobalTasks('report');
    document.getElementById('show-today-tasks-btn').onclick = () => showFixedGlobalTasks('today');
    document.getElementById('show-overdue-tasks-btn').onclick = () => showFixedGlobalTasks('overdue');
    document.getElementById('show-future-tasks-btn').onclick = () => showFixedGlobalTasks('future');

    document.getElementById('search-date-btn').onclick = () => {
        const d = document.getElementById('search-date-input').value;
        if (d) showGlobalTasks(null, d);
    };

    document.getElementById('tasks-modal').addEventListener('show.bs.modal', () => {
        document.getElementById('tarefa-create-date').value = getTodayDateString();
    });
}

function initTheme() {
    const storedTheme = localStorage.getItem('theme') || 'auto';
    setTheme(storedTheme);

    document.querySelectorAll('[data-bs-theme-value]').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-bs-theme-value');
            localStorage.setItem('theme', theme);
            setTheme(theme);
        });
    });
}

function setTheme(theme) {
    if (theme === 'auto') {
        const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
        document.documentElement.setAttribute('data-bs-theme', darkQuery.matches ? 'dark' : 'light');
    } else {
        document.documentElement.setAttribute('data-bs-theme', theme);
    }
}