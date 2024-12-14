let selectedNumbers = [];
let reservedNumbers = {};

try {
  const saved = localStorage.getItem('reservedNumbers');
  if (saved) {
    reservedNumbers = JSON.parse(saved);
  }
} catch (e) {
  console.error('Erro ao carregar dados:', e);
  reservedNumbers = {};
}

const numbersGrid = document.getElementById('numbersGrid');
const buyerInfo = document.getElementById('buyerInfo');

function createNumberItem(i) {
  const div = document.createElement('div');
  div.className = 'number-item';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'number-checkbox';
  checkbox.id = `number-${i}`;

  const label = document.createElement('label');
  label.className = 'number-label';
  label.htmlFor = `number-${i}`;
  label.textContent = i.toString().padStart(2, '0');

  div.appendChild(checkbox);
  div.appendChild(label);

  if (reservedNumbers[i]) {
    checkbox.checked = true;
    checkbox.disabled = true;
    div.classList.add('selected');

    const buyerNameSpan = document.createElement('span');
    buyerNameSpan.className = 'buyer-name-display';
    buyerNameSpan.textContent = reservedNumbers[i].name;
    div.appendChild(buyerNameSpan);

    const actions = document.createElement('div');
    actions.className = 'actions';

    const paymentToggle = document.createElement('button');
    paymentToggle.className = 'payment-toggle';
    paymentToggle.textContent = reservedNumbers[i].paid ? 'Pago' : 'Não pago';
    paymentToggle.onclick = () => togglePaymentStatus(i);

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-btn';
    deleteButton.textContent = 'X';
    deleteButton.onclick = () => deleteNumber(i);

    actions.appendChild(paymentToggle);
    actions.appendChild(deleteButton);
    div.appendChild(actions);

    if (reservedNumbers[i].paid) {
      div.classList.add('paid');
    }
  }

  checkbox.addEventListener('change', () => selectNumber(i, checkbox));
  return div;
}

function updateGrid() {
  numbersGrid.innerHTML = '';
  for (let i = 0; i < 100; i++) {
    numbersGrid.appendChild(createNumberItem(i));
  }
}

function selectNumber(number, checkbox) {
  if (reservedNumbers[number]) return;

  if (checkbox.checked) {
    selectedNumbers.push(number);
    checkbox.closest('.number-item').classList.add('selected');
  } else {
    selectedNumbers = selectedNumbers.filter(n => n !== number);
    checkbox.closest('.number-item').classList.remove('selected');
  }

  buyerInfo.style.display = selectedNumbers.length > 0 ? 'block' : 'none';
}

function saveNumber() {
  const name = document.getElementById('buyerName').value.trim();
  const phone = document.getElementById('buyerPhone').value.trim();

  if (!name || !phone) {
    alert('Por favor, preencha todos os campos!');
    return;
  }

  try {
    selectedNumbers.forEach(number => {
      reservedNumbers[number] = {
        name: name,
        phone: phone,
        date: new Date().toLocaleDateString(),
        paid: false
      };
    });

    localStorage.setItem('reservedNumbers', JSON.stringify(reservedNumbers));

    document.getElementById('buyerName').value = '';
    document.getElementById('buyerPhone').value = '';
    buyerInfo.style.display = 'none';
    selectedNumbers = [];

    updateGrid();
  } catch (e) {
    console.error('Erro ao salvar:', e);
    alert('Erro ao salvar os números. Por favor, tente novamente.');
  }
}

function deleteNumber(number) {
  if (confirm(`Deseja realmente excluir o número ${number.toString().padStart(2, '0')}?`)) {
    try {
      delete reservedNumbers[number];
      localStorage.setItem('reservedNumbers', JSON.stringify(reservedNumbers));
      updateGrid();
    } catch (e) {
      console.error('Erro ao deletar:', e);
      alert('Erro ao deletar o número. Por favor, tente novamente.');
    }
  }
}

function togglePaymentStatus(number) {
  try {
    reservedNumbers[number].paid = !reservedNumbers[number].paid;
    localStorage.setItem('reservedNumbers', JSON.stringify(reservedNumbers));
    updateGrid();
  } catch (e) {
    console.error('Erro ao atualizar status:', e);
    alert('Erro ao atualizar o status de pagamento. Por favor, tente novamente.');
  }
}

updateGrid();