/* API stuff  */
let wordToCheck;
const word = `https://api.dictionaryapi.dev/api/v2/entries/en/${wordToCheck}`;

/*----- constants -----*/
const letters = {'a': 13, 'b': 3, 'c': 3, 'd': 6, 'e': 18, 'f': 3, 'g': 4, 'h': 3, 'i': 12, 'j': 2, 'k': 2, 'l': 5, 'm': 3, 'n': 8, 'o': 11, 'p': 3, 'q': 2, 'r': 9, 's': 6, 't': 9, 'u': 6, 'v': 3, 'w': 3, 'y': 3, 'z': 2
};

/*----- state variables -----*/
const originalTiles = [];
const shuffledTiles = [];
const randomValues = [];
let html = '';
let htmlPlayer = '';
let selectedTile = null;
let selectedTileIndex = null;
let letterTileElements;
let currentColumns = 19; // Initial number of columns
let currentRows = 22; // Initial number of rows
let startTiles = [];
const playAreaGrid = []; // 2D grid to represent the play area
let wordsToCheck = []; // Array to store words in both directions

/*----- cached elements  -----*/
const messageElement = document.getElementById('message');
const randomizeButton = document.getElementById('randomize-tiles');

/*----- event listeners -----*/
document.getElementById('split').addEventListener('click', () => {
    buildOriginalTiles(); // Build the original tiles array
    shuffleTiles(document.getElementById('original-tiles')); // Shuffle the tiles
    split(shuffledTiles, 21, document.getElementById('player-tiles')); // Put 21 tiles into the players hand
    letterTileElements = document.querySelectorAll('.player-tiles');
    attachLetterTileEventListeners(); // Attach event listeners to the tiles in the player's hand
    randomizeButton.style.visibility = 'visible'; // Enable the "Randomize" button
    wordsToCheck = [];
});

document.getElementById('peel').addEventListener('click', () => {
    peel(document.getElementById('player-tiles')); // Take 1 tile from the tile area and put it into the player's hand
    letterTileElements = document.querySelectorAll('.player-tiles');
    attachLetterTileEventListeners(); // Attach event listeners to the tiles in the player's hand
});

document.getElementById('dump').addEventListener('click', () => {
    dump(document.getElementById('player-tiles')); // Take 3 tiles from the tile area and put them into the player's hand, then return 1 tile to the tile area
    letterTileElements = document.querySelectorAll('.player-tiles');
    attachLetterTileEventListeners();
});

document.getElementById('randomize-tiles').addEventListener('click', () => {
    randomizePlayerTiles(); // Randomize the player's tiles
})

// document.getElementById('row').addEventListener('click', () => {
//     addRow();
// });

// document.getElementById('column').addEventListener('click', () => {
//     addColumn();
// });

document.getElementById('bananas').addEventListener('click', async () => {
    const messageElement = document.getElementById('message');
    messageElement.innerHTML = '';

    // Create a set to store the unique words to check
    const uniqueWordsToCheck = new Set();

    for (const word of wordsToCheck) {
        // Check if the word is not a substring of any other word
        let isSubstring = false;

        for (const otherWord of wordsToCheck) {
            if (word !== otherWord && otherWord.includes(word)) {
                isSubstring = true;
                break;
            }
        }

        if (!isSubstring) {
            uniqueWordsToCheck.add(word);
        }
    }

    for (const word of uniqueWordsToCheck) {
        const isValidWord = await checkWord(word);
        const listItem = document.createElement('li');
        listItem.textContent = word + (isValidWord ? ' exists' : ' does not exist') + ' in the dictionary';
        messageElement.appendChild(listItem);
    }
    console.log(wordsToCheck);
});

/*----- functions -----*/
function buildOriginalTiles() {
    originalTiles.length = 0;
    for (let letter in letters) {
        for (let i = 0; i < letters[letter]; i++) {
            originalTiles.push(letter);
        }
    }
    return originalTiles;
};

// function addColumn() {
//     // Increment the number of columns
//     currentColumns += 1;

//     // Find the play area
//     const playArea = document.getElementById('play-area');
//     const playAreaRows = playArea.querySelectorAll('.play-area-row');

//     // Add cells to each row
//     playAreaRows.forEach(row => {
//         const newCell = document.createElement('div');
//         newCell.className = 'tile-play-area';
//         row.appendChild(newCell);
//     });

//     // Clear the play area
//     clearTilePlayArea();
// };

// function addRow() {
//     // Increment the number of rows
//     currentRows += 1;

//     // Find the play area
//     const playArea = document.getElementById('play-area');

//     // Create a new row
//     const newRow = document.createElement('div');
//     newRow.className = 'play-area-row';

//     // Add cells to the new row for the entire row
//     for (let j = 0; j < currentColumns; j++) {
//         const newCell = document.createElement('div');
//         newCell.className = 'tile-play-area';
//         newRow.appendChild(newCell);
//     }

//     // Append the new row to the top of the play area
//     playArea.insertBefore(newRow, playArea.firstChild);

//     // Clear the play area
//     clearTilePlayArea();
// }

const buildPlayArea = (element) => {
    const currentColumns = 19; // Assuming 19 columns initially
    const currentRows = 22; // Assuming 22 rows initially

    const newColumns = currentColumns + 1; // Add an extra column
    const newRows = currentRows + 1; // Add an extra row

    html = '';

    for (let i = 0; i < newRows; i++) {
        playAreaGrid.push([]);
        for (let j = 0; j < newColumns; j++) {
            playAreaGrid[i][j] = { letter: '', direction: '' };
            if (i < currentRows && j < currentColumns) {
                html += `<div class="tile-play-area"></div>`;
            } else {
                // Add new cells for the extra row and column
                html += `<div class="tile-play-area"></div>`;
            }
        }
    }
    element.innerHTML = html;

    clearTilePlayArea();

    const playAreaTiles = document.querySelectorAll('.tile-play-area');
    playAreaTiles.forEach(playAreaTile => {
    playAreaTile.addEventListener('click', () => {
        if (playAreaTile.textContent !== '') {
            // Get the tile's letter
            const letter = playAreaTile.textContent;

            // Add the letter back to the player's tiles
            randomValues.push(letter);

            // Update the player's tiles on the screen
            updatePlayerTiles();

            // Clear the play area tile
            playAreaTile.textContent = '';

            checkWords();
        }
    });
});
};

const clearTilePlayArea = () => {
    const playAreaTiles = document.querySelectorAll('.tile-play-area');
    playAreaTiles.forEach(tile => {
        tile.textContent = ''; // Clear the play tile area (when restarting the game)
    });
}

buildPlayArea(document.getElementById('play-area'));

// Adding event listeners to the tiles in the player's hand, so we can move them to the play area
const attachLetterTileEventListeners = () => {
    if (letterTileElements) {
        let previousSelectedTile = null;
        letterTileElements.forEach((letterTile, index) => {
            letterTile.addEventListener('click', () => {
                if (previousSelectedTile) {
                    previousSelectedTile.style.backgroundColor = '';
                }
                letterTile.style.backgroundColor = 'mediumseagreen';
                selectedTile = letterTile.textContent;
                selectedTileIndex = index;
                previousSelectedTile = letterTile;
            });
        });
    }
}

const updatePlayerTiles = () => {
    // Clear the player's hand
    const playerTilesElement = document.getElementById('player-tiles');
    playerTilesElement.innerHTML = '';

    // Rebuild the player's hand with the updated tiles
    randomValues.forEach((tile, index) => {
        playerTilesElement.innerHTML += `<div class="player-tiles" data-index="${index}">${tile}</div>`;
    });

    // Reattach event listeners to the new tiles
    letterTileElements = document.querySelectorAll('.player-tiles');
    attachLetterTileEventListeners();
}

const updateOriginalTiles = (element) => {
    const originalTilesElement = document.getElementById('original-tiles');
    originalTilesElement.innerHTML = ''; // Clear the content
    
    shuffledTiles.forEach((value) => {
        originalTilesElement.innerHTML += `<div class="tile-area"></div>`;
    });
    element.innerHTML = htmlPlayer;
}

const emptyTiles = document.querySelectorAll('.tile-play-area');

emptyTiles.forEach((emptyTile, emptyTileIndex) => {
    emptyTile.addEventListener('click', () => {
        if (selectedTile && emptyTile.textContent === '') {
            const rowIndex = Math.floor(emptyTileIndex / currentColumns);
            const colIndex = emptyTileIndex % currentColumns;

            // Place the selected tile's letter on the grid
            playAreaGrid[rowIndex][colIndex].letter = selectedTile;
            emptyTile.textContent = selectedTile;

            // Call checkWords to add new words associated with the placed tile
            checkWords(); // No need to specify false for the 'remove' parameter here

            if (selectedTileIndex !== null) {
                // Remove the selected tile from the player's hand
                randomValues.splice(selectedTileIndex, 1);
                updatePlayerTiles(); // Update the player's tiles on the screen
                selectedTileIndex = null;
            }

            selectedTile = null; // Clear the selected tile
        }
    });
});

function randomizePlayerTiles() {
    const playerTilesElement = document.getElementById('player-tiles');
    const playerTiles = Array.from(playerTilesElement.querySelectorAll('.player-tiles'));

    // Shuffle the order of player tiles
    shuffleArray(playerTiles);

    // Clear the player's hand
    playerTilesElement.innerHTML = '';

    // Reattach the shuffled tiles
    playerTiles.forEach((tile, index) => {
        playerTilesElement.appendChild(tile);
    })
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
}

const shuffleTiles = (element) => {
    html = '';
    shuffledTiles.length = 0;
    // make a varible called tiles that has the keys of the letters object and the value of the letters object is how many of that letter there are
    for (let i = 0; i < originalTiles.length; i++) {
        const randomIndex = Math.floor(Math.random() * originalTiles.length);
        shuffledTiles.push(originalTiles[randomIndex]);
        html += `<div class="tile-area">${originalTiles[randomIndex]}</div>`;
    }

    element.innerHTML = html;
    return shuffledTiles;
}

function split(array, count, element) {
    randomValues.length = 0;
    html = '';
    htmlPlayer = '';
    messageElement.innerHTML = ''; // Clear the message area
    clearTilePlayArea();
    const startTilesCopy = [...array]; // Create a copy of the original array to avoid modifying it
    
    // Get 21 random values
    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * startTilesCopy.length);
        const randomValue = startTilesCopy.splice(randomIndex, 1)[0]; // Remove the selected value from the array
        randomValues.push(randomValue);
        shuffledTiles.splice(randomIndex, 1);
        htmlPlayer += `<div class="player-tiles" data-index="${randomIndex}">${randomValue}</div>`;
    }

    //  Update the original-tiles element with the 21 random tiles
    updateOriginalTiles(element);
    startTiles = startTilesCopy; // Restore the original array
    
    return randomValues;
};

function peel(element) {
    htmlPlayer = '';

    // Get 1 random tile
    const randomIndex = Math.floor(Math.random() * shuffledTiles.length);
    const randomValue = shuffledTiles.splice(randomIndex, 1)[0]; // Remove the selected value from the shuffledTiles array
    randomValues.push(randomValue);
    randomValues.forEach((value) => {
        htmlPlayer += `<div class="player-tiles" data-index="${randomIndex}">${value}</div>`;
    });

    // Update the original-tiles element with the updated tiles
    updateOriginalTiles(element);
    element.innerHTML = htmlPlayer;

    return randomValues;
}

function dump(element) {
    // Check if there are at least 3 tiles in the original-tiles
    if (shuffledTiles.length < 3) {
        alert("Not enough tiles in the original-tiles to perform a dump.");
        return;
    }

    // Prompt the player to select one tile to return to original-tiles
    const tileToReturn = prompt("Select one of your tiles to return to the original-tiles:");
    
    // Check if the selected tile is in the player's tiles
    const playerTileIndex = randomValues.indexOf(tileToReturn);
    if (playerTileIndex !== -1) {
        // Remove the selected tile from the player's tiles
        randomValues.splice(playerTileIndex, 1);
        
        // Add the selected tile back to the original-tiles
        shuffledTiles.push(tileToReturn);
    } else {
        alert("Invalid tile selection. The tile must be in your tiles.");
        return;
    }

    // Take 3 random tiles from the original-tiles
    const tilesTaken = [];
    for (let i = 0; i < 3; i++) {
        if (shuffledTiles.length > 0) {
            const randomIndex = Math.floor(Math.random() * shuffledTiles.length);
            const randomValue = shuffledTiles.splice(randomIndex, 1)[0];
            tilesTaken.push(randomValue);
            randomValues.push(randomValue);
        }
    }

    // Update the original-tiles element with the updated tiles
    updateOriginalTiles(element);

    // Update the player's tiles area
    updatePlayerTiles();
};

async function checkWord(wordToCheck) {
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${wordToCheck}`);
        const data = await response.json();

        return data.length > 0; // Check if the API returned any results
    } catch (error) {
        console.error("Error checking word:", error);
        return false;
    }
}

function checkWords() {
    wordsToCheck.length = 0; // Clear the existing words

    // Check horizontally
    for (let rowIndex = 0; rowIndex < currentRows; rowIndex++) {
        let word = '';
        for (let colIndex = 0; colIndex < currentColumns; colIndex++) {
            const letter = playAreaGrid[rowIndex][colIndex].letter;
            if (letter !== '') {
                word += letter;
            } else if (word !== '') {
                wordsToCheck.push(word);
                word = '';
            }
        }
        if (word !== '') {
            wordsToCheck.push(word);
        }
    }

    // Check vertically
    for (let colIndex = 0; colIndex < currentColumns; colIndex++) {
        let word = '';
        for (let rowIndex = 0; rowIndex < currentRows; rowIndex++) {
            const letter = playAreaGrid[rowIndex][colIndex].letter;
            if (letter !== '') {
                word += letter;
            } else if (word !== '') {
                wordsToCheck.push(word);
                word = '';
            }
        }
        if (word !== '') {
            wordsToCheck.push(word);
        }
    }
}