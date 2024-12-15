
const ADMIN_PASSWORD = "Sallano22";
let numbers = {};
let isAdminMode = false;

async function saveToDatabase(number, data) {
    try {
        const response = await fetch(`http://localhost:3000/api/numbers/${number}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to save to database');
    } catch (error) {
        console.error('Error saving to database:', error);
    }
}

async function loadFromDatabase() {
    try {
        const response = await fetch('http://localhost:3000/api/numbers');
        if (!response.ok) throw new Error('Failed to load from database');
        const data = await response.json();
        data.forEach(item => {
            numbers[item.number] = {
                selected: item.selected,
                buyer: item.buyer,
                paid: item.paid
            };
            updateNumberDisplay(item.number);
        });
        updateBuyerSummary();
    } catch (error) {
        console.error('Error loading from database:', error);
    }
}

function initializeNumbers() {
    const container = document.getElementById('numbersContainer');
    for (let i = 0; i <= 99; i++) {
        const number = i.toString().padStart(2, '0');
        const div = document.createElement('div');
        div.className = 'number-box';
        div.onclick = () => handleNumberClick(number);
        div.innerHTML = `
            <div>${number}</div>
            <div class="buyer-info" id="info-${number}"></div>
            <input type="checkbox" id="checkbox-${number}">
        `;
        container.appendChild(div);
        if (!numbers[number]) {
            numbers[number] = {
                selected: false,
                buyer: '',
                paid: false
            };
        }
    }
    loadFromDatabase(); // Load saved data after initializing
}

function handleNumberClick(number) {
    if (!numbers[number].selected) {
        document.getElementById('selectedNumber').textContent = number;
        document.getElementById('modal').style.display = 'block';
    }
}

function selectNumberForBuyer() {
    const number = prompt("Digite o número que deseja selecionar (00-99):");
    if (number && /^\d{1,2}$/.test(number)) {
        const paddedNumber = number.padStart(2, '0');
        if (!numbers[paddedNumber].selected) {
            const name = prompt("Digite o nome do comprador:");
            if (name && name.trim()) {
                numbers[paddedNumber] = {
                    selected: true,
                    buyer: name.trim(),
                    paid: false
                };
                updateNumberDisplay(paddedNumber);
                updateBuyerSummary();
                updateAdminList();
                saveToDatabase(paddedNumber, numbers[paddedNumber]); // Save after admin selection
            }
        } else {
            alert("Este número já está selecionado!");
        }
    } else {
        alert("Por favor, digite um número válido entre 00 e 99.");
    }
}

function exitAdminPanel() {
    document.getElementById('adminPanel').style.display = 'none';
    isAdminMode = false;
}

function updateBuyerSummary() {
    const buyerSummary = document.getElementById('buyerSummary');
    const buyers = {};
    
    Object.entries(numbers).forEach(([number, data]) => {
        if (data.selected && data.buyer) {
            if (!buyers[data.buyer]) {
                buyers[data.buyer] = [];
            }
            buyers[data.buyer].push(number);
        }
    });

    let summaryHTML = '';
    Object.entries(buyers).forEach(([buyer, nums]) => {
        if (nums.length > 1) {
            summaryHTML += `
                <div class="buyer-summary">
                    <strong>${buyer}</strong>: Números ${nums.join(', ')}
                </div>
            `;
        }
    });

    buyerSummary.innerHTML = summaryHTML;
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('buyerName').value = '';
    const number = document.getElementById('selectedNumber').textContent;
    document.getElementById(`checkbox-${number}`).checked = false;
}

async function confirmPurchase() {
    const number = document.getElementById('selectedNumber').textContent;
    const name = document.getElementById('buyerName').value.trim();
    
    if (name) {
        numbers[number] = {
            selected: true,
            buyer: name,
            paid: false
        };
        await saveToDatabase(number, numbers[number]);
        updateNumberDisplay(number);
        updateBuyerSummary();
        closeModal();
    } else {
        alert('Por favor, insira um nome.');
    }
}

function updateNumberDisplay(number) {
    const info = document.getElementById(`info-${number}`);
    const box = info.parentElement;
    const checkbox = document.getElementById(`checkbox-${number}`);
    
    if (numbers[number].selected) {
        info.textContent = `${numbers[number].buyer} ${numbers[number].paid ? '(Pago)' : '(Pendente)'}`;
        box.className = `number-box selected ${numbers[number].paid ? 'paid' : ''}`;
        checkbox.checked = true;
    } else {
        info.textContent = '';
        box.className = 'number-box';
        checkbox.checked = false;
    }
}

function showAdminLogin() {
    const password = prompt("Digite a senha de administrador:");
    if (password === ADMIN_PASSWORD) {
        showAdminPanel();
    } else {
        alert("Senha incorreta!");
    }
}

function showAdminPanel() {
    const adminPanel = document.getElementById('adminPanel');
    adminPanel.style.display = 'block';
    isAdminMode = true;
    updateAdminList();
}

function updateAdminList() {
    const adminList = document.getElementById('adminList');
    adminList.innerHTML = '';
    
    const buyerGroups = {};
    Object.entries(numbers).forEach(([number, data]) => {
        if (data.selected) {
            if (!buyerGroups[data.buyer]) {
                buyerGroups[data.buyer] = [];
            }
            buyerGroups[data.buyer].push(number);
        }
    });
    
    Object.entries(buyerGroups).forEach(([buyer, buyerNumbers]) => {
        const div = document.createElement('div');
        const paidStatus = numbers[buyerNumbers[0]].paid ? '(Pago)' : '(Pendente)';
        div.innerHTML = `
            <p><strong>${buyer}</strong> ${paidStatus}</p>
            <p>Números: ${buyerNumbers.join(', ')}</p>
            <button onclick="togglePaid('${buyerNumbers[0]}')">
                ${numbers[buyerNumbers[0]].paid ? 'Marcar como Não Pago' : 'Marcar como Pago'}
            </button>
            <button onclick="editBuyer('${buyerNumbers[0]}')">Editar</button>
            <button onclick="deleteBuyer('${buyerNumbers[0]}')">Excluir</button>
        `;
        adminList.appendChild(div);
    });
}

function togglePaid(number) {
    const buyer = numbers[number].buyer;
    const paid = !numbers[number].paid;
    
    Object.entries(numbers).forEach(([num, data]) => {
        if (data.selected && data.buyer === buyer) {
            numbers[num].paid = paid;
            updateNumberDisplay(num);
        }
    });
    
    updateAdminList();
    saveToDatabase(number, numbers[number]); // Save after toggling paid status
}

function editBuyer(number) {
    const oldBuyer = numbers[number].buyer;
    const newName = prompt("Digite o novo nome:", oldBuyer);
    if (newName && newName.trim()) {
        Object.entries(numbers).forEach(([num, data]) => {
            if (data.selected && data.buyer === oldBuyer) {
                numbers[num].buyer = newName.trim();
                updateNumberDisplay(num);
            }
        });
        updateAdminList();
        updateBuyerSummary();
        saveToDatabase(number, numbers[number]); // Save after editing
    }
}

async function deleteBuyer(number) {
    const buyer = numbers[number].buyer;
    if (confirm("Tem certeza que deseja excluir esta compra?")) {
        Object.entries(numbers).forEach(([num, data]) => {
            if (data.selected && data.buyer === buyer) {
                numbers[num] = {
                    selected: false,
                    buyer: '',
                    paid: false
                };
                updateNumberDisplay(num);
            }
        });
        updateAdminList();
        updateBuyerSummary();
        await saveToDatabase(number, numbers[number]); // Save after deleting
    }
}

async function clearAllRaffleData() {
    if (confirm("ATENÇÃO! Isso irá apagar todos os dados da rifa. Esta ação não pode ser desfeita. Deseja continuar?")) {
        try {
            const response = await fetch('http://localhost:3000/api/numbers/clear', {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to clear database');
            
            for (let i = 0; i <= 99; i++) {
                const number = i.toString().padStart(2, '0');
                numbers[number] = {
                    selected: false,
                    buyer: '',
                    paid: false
                };
                updateNumberDisplay(number);
            }
            
            updateAdminList();
            updateBuyerSummary();
            
            alert("Rifa limpa com sucesso!");
        } catch (error) {
            console.error('Error clearing database:', error);
            alert("Erro ao limpar a rifa. Tente novamente.");
        }
    }
}

// Load saved data when the page loads
window.addEventListener('load', loadFromDatabase);

// Inicializar a rifa
initializeNumbers();