// script.js

class PRNG {
    constructor(seed) {
        this.seed = Number(seed) || 1;
    }

    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
}

const GRID_SIZE = 5;
const START_POSITION = { row: 0, col: 0 };

const DIRECTIONS = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
    { row: -1, col: -1 },
    { row: -1, col: 1 },
    { row: 1, col: -1 },
    { row: 1, col: 1 }
];

function getPuzzleDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getDailySeed(date = new Date()) {
    return Number(getPuzzleDate(date).replaceAll('-', ''));
}

function applyOperation(currentValue, nextValue, operation) {
    switch (operation) {
        case '+':
            return currentValue + nextValue;
        case '-':
            return currentValue - nextValue;
        case '*':
            return currentValue * nextValue;
        case '/':
            if (nextValue === 0 || currentValue % nextValue !== 0) {
                return null;
            }
            return currentValue / nextValue;
        default:
            return null;
    }
}

function generateCandidateGrid(prng) {
    const grid = Array.from(
        { length: GRID_SIZE },
        () => Array(GRID_SIZE).fill(0)
    );

    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            grid[row][col] = prng.nextInt(1, 9);
        }
    }

    const blockedCellsCount = prng.nextInt(3, 7);
    let blockedCells = 0;

    while (blockedCells < blockedCellsCount) {
        const row = prng.nextInt(0, GRID_SIZE - 1);
        const col = prng.nextInt(0, GRID_SIZE - 1);

        if (
            grid[row][col] !== 'X' &&
            !(row === START_POSITION.row && col === START_POSITION.col)
        ) {
            grid[row][col] = 'X';
            blockedCells++;
        }
    }

    return grid;
}

function generatePuzzle(seed, options = {}) {
    const maxAttempts = options.maxAttempts || 250;
    const baseSeed = Number(seed) || getDailySeed();

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const prng = new PRNG(baseSeed + attempt);
        const goal = prng.nextInt(20, 100);
        const grid = generateCandidateGrid(prng);
        const solution = findValidSolution(grid, goal, START_POSITION);

        if (solution) {
            return {
                grid,
                goal,
                seed: baseSeed,
                attempt,
                puzzleDate: getPuzzleDate(),
                solution
            };
        }
    }

    throw new Error(
        `Unable to generate a solvable puzzle for seed ${baseSeed} after ${maxAttempts} attempts.`
    );
}

function findValidSolution(grid, goal, startPosition = START_POSITION) {
    const gridSize = grid.length;
    const visited = Array.from(
        { length: gridSize },
        () => Array(gridSize).fill(false)
    );

    const startValue = grid[startPosition.row][startPosition.col];

    function dfs(row, col, currentValue, path, pathOperations) {
        if (currentValue === goal) {
            return {
                result: currentValue,
                path: [...path],
                operations: [...pathOperations],
                equation: buildEquationFromPath(path, pathOperations, grid)
            };
        }

        visited[row][col] = true;

        for (const direction of DIRECTIONS) {
            const nextRow = row + direction.row;
            const nextCol = col + direction.col;

            if (
                nextRow >= 0 &&
                nextRow < gridSize &&
                nextCol >= 0 &&
                nextCol < gridSize &&
                !visited[nextRow][nextCol] &&
                grid[nextRow][nextCol] !== 'X'
            ) {
                const nextValue = grid[nextRow][nextCol];

                for (const operation of ['+', '-', '*', '/']) {
                    const nextResult = applyOperation(
                        currentValue,
                        nextValue,
                        operation
                    );

                    if (nextResult === null) {
                        continue;
                    }

                    const result = dfs(
                        nextRow,
                        nextCol,
                        nextResult,
                        [...path, { row: nextRow, col: nextCol }],
                        [...pathOperations, operation]
                    );

                    if (result) {
                        return result;
                    }
                }
            }
        }

        visited[row][col] = false;
        return null;
    }

    return dfs(
        startPosition.row,
        startPosition.col,
        startValue,
        [{ row: startPosition.row, col: startPosition.col }],
        []
    );
}

function hasValidSolution(grid, goal, startPosition = START_POSITION) {
    return Boolean(findValidSolution(grid, goal, startPosition));
}

function buildEquationFromPath(path, pathOperations, sourceGrid) {
    if (!path.length) return '';

    let equation = String(sourceGrid[path[0].row][path[0].col]);

    for (let i = 1; i < path.length; i++) {
        const operation = pathOperations[i - 1];
        const cellValue = sourceGrid[path[i].row][path[i].col];
        equation += ` ${operation} ${cellValue}`;
    }

    return equation;
}

function calculatePathResult(path, pathOperations, sourceGrid) {
    if (!path.length) {
        return null;
    }

    let currentResult = Number(sourceGrid[path[0].row][path[0].col]);

    for (let i = 1; i < path.length; i++) {
        const cellValue = Number(sourceGrid[path[i].row][path[i].col]);
        const nextResult = applyOperation(
            currentResult,
            cellValue,
            pathOperations[i - 1]
        );

        if (nextResult === null) {
            return null;
        }

        currentResult = nextResult;
    }

    return currentResult;
}

if (typeof window !== 'undefined') {
    window.NumbleEngine = {
        PRNG,
        getPuzzleDate,
        getDailySeed,
        generatePuzzle,
        findValidSolution,
        hasValidSolution,
        applyOperation,
        calculatePathResult
    };
}

let selectedCells = [{ row: 0, col: 0 }];
let operations = [];
let achievedTarget = false;
let grid;
let goal;
let currentPuzzle;
let originalGrid = [];
let redirectScheduled = false;

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        currentPuzzle = generatePuzzle(getDailySeed());
        grid = currentPuzzle.grid;
        goal = currentPuzzle.goal;

        console.log(`Numble seed: ${currentPuzzle.seed}`);
        console.log(`Numble generation attempt: ${currentPuzzle.attempt}`);

        const gridContainer = document.querySelector('.grid');
        const goalElement = document.getElementById('target1');

        goalElement.innerText = goal;
        gridContainer.innerHTML = '';

        grid.forEach((row, rowIndex) => {
            row.forEach((cellValue, colIndex) => {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.innerText = cellValue !== 'X' ? cellValue : 'X';

                if (cellValue === 'X') {
                    cell.classList.add('obstacle');
                }

                cell.dataset.row = rowIndex;
                cell.dataset.col = colIndex;
                gridContainer.appendChild(cell);
            });
        });

        initializeGame(grid, goal);
    });
}

function initializeGame(generatedGrid, generatedGoal) {
    grid = generatedGrid;
    goal = generatedGoal;
    selectedCells = [{ row: 0, col: 0 }];
    operations = [];
    achievedTarget = false;
    redirectScheduled = false;
    originalGrid = [];

    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid.length; col++) {
            originalGrid.push(grid[row][col]);
        }
    }

    const cells = document.querySelectorAll('.cell');

    cells.forEach((cell) => {
        const row = parseInt(cell.dataset.row, 10);
        const col = parseInt(cell.dataset.col, 10);

        if (row === 0 && col === 0) {
            cell.classList.add('selected');
        }

        cell.addEventListener('click', (event) => {
            if (cell.classList.contains('obstacle')) {
                rejectMove();
            } else {
                showPopupMenu(event, cell, row, col);
            }
        });
    });

    document
        .getElementById('undo-button')
        .addEventListener('click', undoLastMove);

    document
        .getElementById('reset-button')
        .addEventListener('click', resetPath);

    highlightValidMoves();
    updateTargetStatus();
    updateEquation();
}

function showPopupMenu(event, cell, row, col) {
    const existingPopup = document.querySelector('.popup-menu');

    if (existingPopup) {
        existingPopup.remove();
    }

    if (selectedCells.some((selected) => selected.row === row && selected.col === col)) {
        handleCellSelection(cell, row, col);
        return;
    }

    const popupMenu = document.createElement('div');
    popupMenu.classList.add('popup-menu');

    ['+', '-', '*', '/'].forEach((operation) => {
        const button = document.createElement('button');
        button.innerText = operation;
        button.addEventListener('click', () => {
            handleCellSelection(cell, row, col, operation);
        });
        popupMenu.appendChild(button);
    });

    document.body.appendChild(popupMenu);

    const rect = cell.getBoundingClientRect();
    popupMenu.style.left = `${rect.right + window.scrollX}px`;
    popupMenu.style.top = `${rect.top + window.scrollY}px`;

    function removePopup(clickEvent) {
        if (!popupMenu.contains(clickEvent.target)) {
            popupMenu.remove();
            document.body.removeEventListener('click', removePopup);
        }
    }

    setTimeout(() => {
        document.body.addEventListener('click', removePopup);
    }, 0);
}

function handleCellSelection(cell, row, col, operation) {
    if (selectedCells.some((selected) => selected.row === row && selected.col === col)) {
        const deselectIndex = selectedCells.findIndex(
            (selected) => selected.row === row && selected.col === col
        );

        while (selectedCells.length > deselectIndex + 1) {
            const removed = selectedCells.pop();
            operations.pop();

            const removedCell = document.querySelector(
                `[data-row="${removed.row}"][data-col="${removed.col}"]`
            );

            removedCell.classList.remove('selected');
            removedCell.innerText = originalGrid[removed.row * grid.length + removed.col];
        }

        updateCellValues();
        updateEquation();
    } else {
        if (!isValidMove(row, col)) {
            rejectMove();
            return;
        }

        const currentResult = calculateCurrentResult();
        const nextValue = Number(originalGrid[row * grid.length + col]);

        const nextResult = applyOperation(
            currentResult,
            nextValue,
            operation
        );

        if (nextResult === null) {
            rejectMove();
            return;
        }

        selectedCells.push({ row, col });
        operations.push(operation);
        cell.classList.add('selected');

        updateEquation();
        updateCellValues();
    }

    highlightValidMoves();
}

function isValidMove(row, col) {
    const lastCell = selectedCells[selectedCells.length - 1];

    return (
        Math.abs(lastCell.row - row) <= 1 &&
        Math.abs(lastCell.col - col) <= 1
    );
}

function updateEquation() {
    const equation = buildEquationFromPath(selectedCells, operations, grid);
    const currentResult = calculateCurrentResult();

    document.getElementById('equation').innerText =
        `${equation} = ${currentResult}`;

    checkTarget(currentResult, equation);
}

function calculateCurrentResult() {
    return calculatePathResult(selectedCells, operations, grid);
}

function checkTarget(result, equation) {
    achievedTarget = result === goal;

    updateTargetStatus();
    checkIfGameWon(result, equation);
}

function checkIfGameWon(result, equation) {
    if (achievedTarget && !redirectScheduled) {
        redirectScheduled = true;
        saveResult(result, equation);

        setTimeout(() => {
            window.location.href = 'results.html';
        }, 1000);
    }
}

function saveResult(result, equation) {
    const resultPayload = {
        puzzleDate: currentPuzzle?.puzzleDate || getPuzzleDate(),
        seed: currentPuzzle?.seed || getDailySeed(),
        target: goal,
        result,
        equation,
        steps: selectedCells.length - 1,
        path: selectedCells,
        operations,
        completedAt: new Date().toISOString()
    };

    localStorage.setItem(
        'numble:lastResult',
        JSON.stringify(resultPayload)
    );
}

function updateTargetStatus() {
    const targetElement = document.getElementById('target1');

    targetElement.style.color = achievedTarget
        ? 'green'
        : '#4E5180';
}

function updateCellValues() {
    const currentResult = calculateCurrentResult();

    selectedCells.forEach((selected, index) => {
        const cell = document.querySelector(
            `[data-row="${selected.row}"][data-col="${selected.col}"]`
        );

        if (index === selectedCells.length - 1) {
            cell.innerText = currentResult;
        } else {
            cell.innerText = originalGrid[selected.row * grid.length + selected.col];
        }
    });
}

function highlightValidMoves() {
    document.querySelectorAll('.cell').forEach((cell) => {
        cell.classList.remove('valid-move');

        const row = parseInt(cell.dataset.row, 10);
        const col = parseInt(cell.dataset.col, 10);

        if (
            isValidMove(row, col) &&
            !selectedCells.some((selected) => selected.row === row && selected.col === col) &&
            !cell.classList.contains('obstacle')
        ) {
            cell.classList.add('valid-move');
        }
    });
}

function rejectMove() {
    trembleGrid();

    if (navigator.vibrate) {
        navigator.vibrate(200);
    }
}

function trembleGrid() {
    const gridElement = document.querySelector('.grid');

    gridElement.classList.add('tremble');

    setTimeout(() => {
        gridElement.classList.remove('tremble');
    }, 300);
}

function undoLastMove() {
    if (selectedCells.length > 1) {
        const removed = selectedCells.pop();
        operations.pop();

        const removedCell = document.querySelector(
            `[data-row="${removed.row}"][data-col="${removed.col}"]`
        );

        removedCell.classList.remove('selected');
        removedCell.innerText = originalGrid[removed.row * grid.length + removed.col];

        updateCellValues();
        updateEquation();
        highlightValidMoves();
    }
}

function resetPath() {
    selectedCells = [{ row: 0, col: 0 }];
    operations = [];
    achievedTarget = false;
    redirectScheduled = false;

    document.querySelectorAll('.cell').forEach((cell) => {
        cell.classList.remove('selected');

        const row = parseInt(cell.dataset.row, 10);
        const col = parseInt(cell.dataset.col, 10);

        cell.innerText = originalGrid[row * grid.length + col];
    });

    document
        .querySelector('[data-row="0"][data-col="0"]')
        .classList.add('selected');

    updateCellValues();
    updateEquation();
    highlightValidMoves();
}

if (typeof module !== 'undefined') {
    module.exports = {
        PRNG,
        getPuzzleDate,
        getDailySeed,
        generatePuzzle,
        findValidSolution,
        hasValidSolution,
        applyOperation,
        calculatePathResult,
        buildEquationFromPath
    };
}
