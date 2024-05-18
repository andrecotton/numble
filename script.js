// script.js
let selectedCells = [0]; // Starting point at the top-left corner
let operations = ['']; // Initial operation is empty
let targetNumbers = [42, 56, 84];
let achievedTargets = [false, false, false];
let currentOperation = '';
const originalGrid = Array.from(document.querySelectorAll('.cell')).map(cell => cell.innerText);

document.querySelectorAll('.cell').forEach((cell, index) => {
    if (index === 0) {
        cell.classList.add('selected');
    }
    cell.addEventListener('click', () => {
        if (cell.classList.contains('obstacle')) {
            alert('Invalid move!');
            navigator.vibrate(200); // Vibrate for 200ms
        } else {
            handleCellSelection(cell, index);
        }
    });
});

function handleCellSelection(cell, cellIndex) {
    if (selectedCells.includes(cellIndex)) {
        // Backtracking up to the clicked square
        const deselectIndex = selectedCells.indexOf(cellIndex);
        while (selectedCells.length > deselectIndex + 1) {
            const removedIndex = selectedCells.pop();
            operations.pop();
            document.querySelectorAll('.cell')[removedIndex].classList.remove('selected');
            document.querySelectorAll('.cell')[removedIndex].innerText = originalGrid[removedIndex];
        }
        updateCellValues();
        updateEquation(); // Recalculate equation after backtracking
    } else {
        if (!currentOperation) {
            alert('You must select a mathematical operation before making a move!');
            navigator.vibrate(200); // Vibrate for 200ms
            return;
        }
        if (isValidMove(cellIndex) && !selectedCells.includes(cellIndex)) {
            selectedCells.push(cellIndex);
            operations.push(currentOperation);
            cell.classList.add('selected');
            updateEquation();
            updateCellValues();
        } else {
            alert('Invalid move!');
            navigator.vibrate(200); // Vibrate for 200ms
        }
    }

    highlightValidMoves();
}

function isValidMove(cellIndex) {
    const lastCellIndex = selectedCells[selectedCells.length - 1];
    const lastCellRow = Math.floor(lastCellIndex / 6);
    const lastCellCol = lastCellIndex % 6;
    const cellRow = Math.floor(cellIndex / 6);
    const cellCol = cellIndex % 6;

    return Math.abs(lastCellRow - cellRow) <= 1 && Math.abs(lastCellCol - cellCol) <= 1;
}

function setOperation(operation) {
    currentOperation = operation;
    document.querySelectorAll('.operations button').forEach(button => {
        button.classList.remove('selected');
    });
    document.querySelector(`.operations button[onclick="setOperation('${operation}')"]`).classList.add('selected');
}

function updateEquation() {
    let equation = '';
    let currentResult = parseInt(originalGrid[selectedCells[0]]);
    equation += currentResult;

    for (let i = 1; i < selectedCells.length; i++) {
        const cellValue = parseInt(originalGrid[selectedCells[i]]);
        equation += ` ${operations[i]} ${cellValue}`;
        switch (operations[i]) {
            case '+':
                currentResult += cellValue;
                break;
            case '-':
                currentResult -= cellValue;
                break;
            case '*':
                currentResult *= cellValue;
                break;
            case '/':
                currentResult /= cellValue;
                break;
        }
    }

    document.getElementById('equation').innerText = equation;
    checkTargets(currentResult);
}

function checkTargets(result) {
    for (let i = 0; i < targetNumbers.length; i++) {
        if (result === targetNumbers[i]) {
            if (i === 0 || achievedTargets[i - 1]) {
                achievedTargets[i] = true;
            }
        } else {
            achievedTargets[i] = false; // Reset target if it is no longer achieved
        }
    }

    updateTargetStatus();
    checkAllTargetsAchieved();
}

function checkAllTargetsAchieved() {
    if (achievedTargets.every(target => target)) {
        alert('All targets achieved! Redirecting to results...');
        setTimeout(() => {
            window.location.href = 'results.html';
        }, 1000); // Redirect after 1 second
    }
}

function updateTargetStatus() {
    targetNumbers.forEach((target, index) => {
        const targetElement = document.getElementById(`target${index + 1}`);
        if (achievedTargets[index]) {
            targetElement.style.color = 'green';
        } else {
            targetElement.style.color = '#4E5180'; // Slate blue for targets
        }
    });
}

function updateCellValues() {
    const cells = document.querySelectorAll('.cell');
    let currentResult = parseInt(originalGrid[selectedCells[0]]);

    for (let i = 1; i < selectedCells.length; i++) {
        const cellValue = parseInt(originalGrid[selectedCells[i]]);
        switch (operations[i]) {
            case '+':
                currentResult += cellValue;
                break;
            case '-':
                currentResult -= cellValue;
                break;
            case '*':
                currentResult *= cellValue;
                break;
            case '/':
                currentResult /= cellValue;
                break;
        }
    }

    selectedCells.forEach((cellIndex, idx) => {
        if (idx === selectedCells.length - 1) {
            cells[cellIndex].innerText = currentResult;
        } else {
            cells[cellIndex].innerText = originalGrid[cellIndex];
        }
    });
}

function highlightValidMoves() {
    document.querySelectorAll('.cell').forEach((cell, index) => {
        cell.classList.remove('valid-move');
        if (isValidMove(index) && !selectedCells.includes(index)) {
            cell.classList.add('valid-move');
        }
    });
}

highlightValidMoves(); // Initial highlight of valid moves
updateTargetStatus(); // Initial update of target status
