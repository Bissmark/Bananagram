import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js'
import { getFirestore, doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js'

// If you enabled Analytics in your project, add the Firebase SDK for Google Analytics
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-analytics.js'

const firebaseConfig = {
    apiKey: "AIzaSyCc-D4BmYSU9S-PTKzshUojIr5THkvpYpI",
    authDomain: "bananagrams-26d56.firebaseapp.com",
    projectId: "bananagrams-26d56",
    storageBucket: "bananagrams-26d56.appspot.com",
    messagingSenderId: "583172000650",
    appId: "1:583172000650:web:42ff03eb30377391471673",
    measurementId: "G-2R9K0X5YNC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

document.getElementById('row').addEventListener('click', () => {
    addRow();
});

document.getElementById('column').addEventListener('click', () => {
    addColumn();
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

function addColumn() {
    // Increment the number of columns
    currentColumns += 1;

    // Find the play area
    const playArea = document.getElementById('play-area');
    const playAreaRows = playArea.querySelectorAll('.play-area-row');

    // Add cells to each row
    playAreaRows.forEach(row => {
        const newCell = document.createElement('div');
        newCell.className = 'tile-play-area';
        row.appendChild(newCell);
    });

    // Clear the play area
    clearTilePlayArea();
};

function addRow() {
    // Increment the number of rows
    currentRows += 1;

    // Find the play area
    const playArea = document.getElementById('play-area');

    // Create a new row
    const newRow = document.createElement('div');
    newRow.className = 'play-area-row';

    // Add cells to the new row for the entire row
    for (let j = 0; j < currentColumns; j++) {
        const newCell = document.createElement('div');
        newCell.className = 'tile-play-area';
        newRow.appendChild(newCell);
    }

    // Append the new row to the top of the play area
    playArea.insertBefore(newRow, playArea.firstChild);

    // Clear the play area
    clearTilePlayArea();
}

const buildPlayArea = (element) => {
    const currentColumns = 19; // Assuming 19 columns initially
    const currentRows = 22; // Assuming 22 rows initially

    const newColumns = currentColumns + 1; // Add an extra column
    const newRows = currentRows + 1; // Add an extra row

    html = '';

    for (let i = 0; i < newRows; i++) {
        for (let j = 0; j < newColumns; j++) {
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

emptyTiles.forEach(emptyTile => {
    emptyTile.addEventListener('click', () => {
        if (selectedTile && emptyTile.textContent === '') {
            // Place the selected tile's letter in the empty square
            emptyTile.textContent = selectedTile;

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
}

// Add a listener for the "Bananas" button
document.getElementById('bananas').addEventListener('click', () => {
    const horizontalWords = extractWordsFromPlayArea('horizontal');
    const verticalWords = extractWordsFromPlayArea('vertical');

    // Combine horizontal and vertical words and remove duplicates
    const allWords = [...new Set([...horizontalWords, ...verticalWords])];

    // Find and display the longest word from the list
    const longestWord = findLongestWord(allWords);
    if (longestWord) {
        messageElement.innerHTML = `<li class="message-box">"${longestWord}" exists in the dictionary.</li>`;
    } else {
        messageElement.innerHTML = 'No valid word found.';
    }
});

function findLongestWord(words) {
    let longestWord = '';
    words.forEach(word => {
        if (word.length > longestWord.length) {
            longestWord = word;
        }
    });
    return longestWord;
}

function extractWordsFromPlayArea(direction) {
    const playAreaTiles = document.querySelectorAll('.tile-play-area');
    let wordsInPlayArea = [];

    
    if (direction === 'vertical') {
        for (let i = 0; i < 19; i++) { // Assuming 19 columns
            for (let j = 0; j < 22; j++) { // Assuming 22 rows
                const index = j * 19 + i; // Calculate the index for the vertical check
                const playAreaTile = playAreaTiles[index];
                if (playAreaTile.textContent !== '') {
                    // Vertical words
                    const currentWord = getVerticalWord(playAreaTiles, j, i);
                    if (currentWord.length > 1) {
                        wordsInPlayArea.push(currentWord);
                    }

                    // Skip to the end of the current word
                    j += currentWord.length - 1;
                }
            }
        }
    } else if (direction === 'horizontal') {
        playAreaTiles.forEach((playAreaTile, index) => {
            if (playAreaTile.textContent !== '') {
                // Horizontal words
                const currentWord = getHorizontalWord(playAreaTiles, index);
                if (currentWord.length > 1) {
                    wordsInPlayArea.push(currentWord);
                }

                // Skip to the end of the current word
                index += currentWord.length - 1;
            }
        });
    } 

    return wordsInPlayArea;
}

function getHorizontalWord(playAreaTiles, startIndex) {
    const currentWord = [];
    let currentIndex = startIndex;

    while (currentIndex < playAreaTiles.length && playAreaTiles[currentIndex].textContent !== '') {
        currentWord.push(playAreaTiles[currentIndex].textContent);
        currentIndex++;
    }

    return currentWord.join('');
}

function getVerticalWord(playAreaTiles, rowIndex, colIndex) {
    const currentWord = [];
    let currentIndex = rowIndex * 19 + colIndex;

    while (currentIndex < playAreaTiles.length && playAreaTiles[currentIndex].textContent !== '') {
        currentWord.push(playAreaTiles[currentIndex].textContent);
        currentIndex += 19; // Move to the next column
    }

    return currentWord.join('');
}

function checkWordsInDictionary(words) {
    const messageElement = document.getElementById('message');
    messageElement.innerHTML = ''; // Clear any previous messages

    words.forEach(word => {
        if (word.length > 1) { // Check if the word has more than one letter
            // Construct the API URL for checking the word
            const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;

            // Send a GET request to the API
            fetch(apiUrl)
                .then(response => response.json())
                .then(data => {
                    if (Array.isArray(data) && data.length > 0) {
                        // The word exists in the dictionary
                        messageElement.innerHTML += `"${word}" exists in the dictionary.<br>`;
                    } else {
                        // The word does not exist in the dictionary
                        messageElement.innerHTML += `"${word}" does not exist in the dictionary.<br>`;
                    }
                })
                .catch(error => {
                    console.error(`Error checking "${word}" in the dictionary: ${error}`);
                });
        }
    });
};

function getPrefixes(word) {
    const prefixes = [];
    for (let i = 1; i < word.length; i++) {
        prefixes.push(word.slice(0, i));
    }
    return prefixes;
};