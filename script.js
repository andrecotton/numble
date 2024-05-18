// script.js
class PRNG {
    constructor(seed) {
        this.seed = seed;
    }

    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
}

function generatePuzzle(seed) {
    const prng = new PRNG(parseInt(seed));
    const gridSize = 5;
    const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
    const startPosition = { row: 0, col: 0 };

    // Generate the single goal
    const goal = prng.nextInt(20, 100);

    // Fill the grid with random numbers between 1 and 9
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            if (!(row === startPosition.row && col === startPosition.col)) {
                grid[row][col] = prng.nextInt(1, 9);
            } else {
                grid[row][col] = prng.nextInt(1, 9); // Start position number
            }
        }
    }

    // Generate some blocked cells randomly
    const blockedCellsCount = prng.nextInt(3, 7); // Random number of blocked cells between 3 and 7
    for (let i = 0; i < blockedCellsCount; i++) {
        let row, col;
        do {
            row = prng.nextInt(0, gridSize - 1);
            col = prng.nextInt(0, gridSize - 1);
        } while (grid[row][col] === 'X' || (row === startPosition.row && col === startPosition.col)); // Ensure not to block the start position
        grid[row][col] = 'X';
    }

    // Ensure the grid has a valid solution
    while (!hasValidSolution(grid, goal, startPosition)) {
        // Regenerate the grid until a valid solution is found
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                if (grid[row][col] !== 'X' && !(row === startPosition.row && col === startPosition.col)) {
                    grid[row][col] = prng.nextInt(1, 9);
                }
            }
        }
    }

    return { grid, goal };
}

function hasValidSolution(grid, goal, startPosition) {
    const directions = [
        { row: -1, col: 0 },
        { row: 1, col: 0 },
        { row: 0, col: -1 },
        { row: 0, col: 1 },
        { row: -1, col: -1 },
        { row: -1, col: 1 },
        { row: 1, col: -1 },
        { row: 1, col: 1 }
    ];

    const gridSize = grid.length;
    const visited = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));
    let currentResult = grid[startPosition.row][startPosition.col];

    function dfs(row, col) {
        if (currentResult === goal) {
            return true;
        }

        visited[row][col] = true;

        for (let dir of directions) {
            const newRow = row + dir.row;
            const newCol = col + dir.col;

            if (
                newRow >= 0 && newRow < gridSize &&
                newCol >= 0 && newCol < gridSize &&
                !visited[newRow][newCol] && grid[newRow][newCol] !== 'X'
            ) {
                const prevResult = currentResult;
                // Try all operations
                currentResult += grid[newRow][newCol];
                if (dfs(newRow, newCol)) return true;
                currentResult = prevResult;

                currentResult -= grid[newRow][newCol];
                if (dfs(newRow, newCol)) return true;
                currentResult = prevResult;

                currentResult *= grid[newRow][newCol];
                if (dfs(newRow, newCol)) return true;
                currentResult = prevResult;

                if (grid[newRow][newCol] !== 0) {
                    currentResult = Math.floor(prevResult / grid[newRow][newCol]);
                    if (dfs(newRow, newCol)) return true;
                    currentResult = prevResult;
                }
            }
        }

        visited[row][col] = false;
        return false;
    }

    return dfs(startPosition.row, startPosition.col);
}

// Game initialization and setup
document.addEventListener('DOMContentLoaded', () => {
    // Use current time to generate a 6-digit seed
    const now = new Date();
    const seed = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    console.log(`Seed: ${seed}`); // Debug: Log the seed value
    const { grid, goal } = generatePuzzle(seed);

    const gridContainer = document.querySelector('.grid');
    const goalElement = document.getElementById('target1');

    goalElement.innerText = goal;

    gridContainer.innerHTML = ''; // Clear existing grid

    grid.forEach((row, rowIndex) => {
        row.forEach((cellValue, colIndex) => {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.innerText = cellValue !== 'X' ? cellValue : 'X';
            if (cellValue === 'X') cell.classList.add('obstacle');
            cell.dataset.row = rowIndex;
            cell.dataset.col = colIndex;
            gridContainer.appendChild(cell);
        });
    });

    // Initialize game logic
    initializeGame(grid, goal);
});

// Game logic functions
let selectedCells = [{ row: 0, col: 0 }]; // Starting point at the top-left corner
let operations = ['+']; // Initial operation is addition
let achievedTarget = false;
let currentOperation = '+';
let grid, goal;
const originalGrid = [];

function initializeGame(generatedGrid, generatedGoal) {
    grid = generatedGrid;
    goal = generatedGoal;

    // Initialize originalGrid for tracking cell values
    const gridSize = grid.length;
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            originalGrid.push(grid[row][col]);
        }
    }

    const cells = document.querySelectorAll('.cell');
    cells.forEach((cell) => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (row === 0 && col === 0) {
            cell.classList.add('selected');
        }

        cell.addEventListener('click', (event) => {
            if (cell.classList.contains('obstacle')) {
                trembleGrid();
                navigator.vibrate(200); // Vibrate for 200ms
            } else {
                showPopupMenu(event, cell, row, col);
            }
        });
    });

    document.getElementById('undo-button').addEventListener('click', undoLastMove);
    document.getElementById('reset-button').addEventListener('click', resetPath);

    highlightValidMoves();
    updateTargetStatus();
    updateEquation();
}

function showPopupMenu(event, cell, row, col) {
    const popupMenu = document.createElement('div');
    popupMenu.classList.add('popup-menu');

    ['+', '-', '*', '/'].forEach(operation => {
        const button = document.createElement('button');
        button.innerText = operation;
        button.addEventListener('click', () => handleCellSelection(cell, row, col, operation));
        popupMenu.appendChild(button);
    });

    document.body.appendChild(popupMenu);
    const rect = cell.getBoundingClientRect();
    popupMenu.style.left = `${rect.right + window.scrollX}px`;
    popupMenu.style.top = `${rect.top + window.scrollY}px`;

    function removePopup() {
        document.body.removeChild(popupMenu);
        document.body.removeEventListener('click', removePopup);
    }

    setTimeout(() => {
        document.body.addEventListener('click', removePopup);
    }, 0);
}

function handleCellSelection(cell, row, col, operation) {
    if (selectedCells.some(selected => selected.row === row && selected.col === col)) {
        // Backtracking up to the clicked square
        const deselectIndex = selectedCells.findIndex(selected => selected.row === row && selected.col === col);
        while (selectedCells.length > deselectIndex + 1) {
            const removed = selectedCells.pop();
            operations.pop();
            const removedCell = document.querySelector(`[data-row="${removed.row}"][data-col="${removed.col}"]`);
            removedCell.classList.remove('selected');
            removedCell.innerText = originalGrid[removed.row * grid.length + removed.col];
        }
        updateCellValues();
        updateEquation(); // Recalculate equation after backtracking
    } else {
        if (!currentOperation) {
            trembleGrid();
            navigator.vibrate(200); // Vibrate for 200ms
            return;
        }
        if (isValidMove(row, col) && !selectedCells.some(selected => selected.row === row && selected.col === col)) {
            selectedCells.push({ row, col });
            operations.push(operation);
            cell.classList.add('selected');
            updateEquation();
            updateCellValues();
        } else {
            trembleGrid();
            navigator.vibrate(200); // Vibrate for 200ms
        }
    }

    highlightValidMoves();
}

function isValidMove(row, col) {
    const lastCell = selectedCells[selectedCells.length - 1];
    return Math.abs(lastCell.row - row) <= 1 && Math.abs(lastCell.col - col) <= 1;
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
    let currentResult = parseInt(originalGrid[selectedCells[0].row * grid.length + selectedCells[0].col]);
    equation += currentResult;

    for (let i = 1; i < selectedCells.length; i++) {
        const cellValue = parseInt(originalGrid[selectedCells[i].row * grid.length + selectedCells[i].col]);
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

    document.getElementById('equation').innerText = `${equation} = ${currentResult}`;
    checkTarget(currentResult);
}

function calculateCurrentResult() {
    let currentResult = parseInt(originalGrid[selectedCells[0].row * grid.length + selectedCells[0].col]);

    for (let i = 1; i < selectedCells.length; i++) {
        const cellValue = parseInt(originalGrid[selectedCells[i].row * grid.length + selectedCells[i].col]);
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

    return currentResult;
}

function checkTarget(result) {
    if (result === goal) {
        achievedTarget = true;
    } else {
        achievedTarget = false;
    }

    updateTargetStatus();
    checkIfGameWon();
}

function checkIfGameWon() {
    if (achievedTarget) {
        setTimeout(() => {
            window.location.href = 'results.html';
        }, 1000); // Redirect after 1 second
    }
}

function updateTargetStatus() {
    const targetElement = document.getElementById('target1');
    if (achievedTarget) {
        targetElement.style.color = 'green';
    } else {
        targetElement.style.color = '#4E5180'; // Slate blue for target
    }
}

function updateCellValues() {
    const cells = document.querySelectorAll('.cell');
    let currentResult = parseInt(originalGrid[selectedCells[0].row * grid.length + selectedCells[0].col]);

    for (let i = 1; i < selectedCells.length; i++) {
        const cellValue = parseInt(originalGrid[selectedCells[i].row * grid.length + selectedCells[i].col]);
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

    selectedCells.forEach((selected, idx) => {
        const cell = document.querySelector(`[data-row="${selected.row}"][data-col="${selected.col}"]`);
        if (idx === selectedCells.length - 1) {
            cell.innerText = currentResult;
        } else {
            cell.innerText = originalGrid[selected.row * grid.length + selected.col];
        }
    });
}

function highlightValidMoves() {
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('valid-move');
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        if (isValidMove(row, col) && !selectedCells.some(selected => selected.row === row && selected.col === col)) {
            cell.classList.add('valid-move');
        }
    });
}

function trembleGrid() {
    const grid = document.querySelector('.grid');
    grid.classList.add('tremble');
    setTimeout(() => {
        grid.classList.remove('tremble');
    }, 300);
}

function undoLastMove() {
    if (selectedCells.length > 1) {
        const removed = selectedCells.pop();
        operations.pop();
        const removedCell = document.querySelector(`[data-row="${removed.row}"][data-col="${removed.col}"]`);
        removedCell.classList.remove('selected');
        removedCell.innerText = originalGrid[removed.row * grid.length + removed.col];
        updateCellValues();
        updateEquation();
        highlightValidMoves();
    }
}

function resetPath() {
    selectedCells = [selectedCells[0]];
    operations = ['+'];
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('selected');
        cell.innerText = originalGrid[parseInt(cell.dataset.row) * grid.length + parseInt(cell.dataset.col)];
    });
    document.querySelector(`[data-row="0"][data-col="0"]`).classList.add('selected');
    updateCellValues();
    updateEquation();
    highlightValidMoves();
}
