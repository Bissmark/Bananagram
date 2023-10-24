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

/*----- cached elements  -----*/

/*----- event listeners -----*/
document.getElementById('split').addEventListener('click', () => {
    buildOriginalTiles(); // Build the original tiles array
    shuffleTiles(document.getElementById('original-tiles')); // Shuffle the tiles
    split(shuffledTiles, 21, document.getElementById('player-tiles')); // Put 21 tiles into the players hand
    letterTileElements = document.querySelectorAll('.player-tiles');
    attachLetterTileEventListeners(); // Attach event listeners to the tiles in the player's hand
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

const buildPlayArea = (element) => {
    html = '';
    for (let i = 0; i < 418; i++) {
        html += `<div class="tile-play-area"></div>`; // Create 418 empty tiles
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
        originalTilesElement.innerHTML += `<div class="tile-area">${value}</div>`;
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