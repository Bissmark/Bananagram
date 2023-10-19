/*
- Tiles are in the center of the board and they are randomly shuffled
- Each player starts with 21 tiles

- press new game, takes 12 tiles from the centre tiles area and give them to the player
- players can then create words using these tiles
- players can also swap tiles for new ones from the centre tiles area by pressing dump (take 3 tiles from the play area and return 1)
- players can also take a new tile from the centre tiles area by pressing peel (take 1 tile from the centre tiles area)

*/

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
const state = {
    tile: document.querySelectorAll('.tile'),
    player: 'player1',
    computer: 'computer'
}

const originalTilesElement = document.getElementById('original-tiles');

/*----- event listeners -----*/
document.getElementById('split').addEventListener('click', () => {
    buildOriginalTiles();
    shuffleTiles(document.getElementById('original-tiles'));
    split(shuffledTiles, 21, document.getElementById('player-tiles'));
    letterTileElements = document.querySelectorAll('.player-tiles');
    attachLetterTileEventListeners();
    //buildPlayArea(document.getElementById('play-area'));
});

document.getElementById('peel').addEventListener('click', () => {
    peel(document.getElementById('player-tiles'));
    letterTileElements = document.querySelectorAll('.player-tiles');
    attachLetterTileEventListeners();
});

document.getElementById('dump').addEventListener('click', () => {
    dump(3, document.getElementById('player-tiles'), 1);
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
        html += `<div class="tile-play-area"></div>`;
    }
    element.innerHTML = html;

    const playAreaTiles = document.querySelectorAll('.tile-play-area');
    playAreaTiles.forEach(tile => {
        tile.textContent = '';
    });
};

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
    const playAreaTiles = document.querySelectorAll('.tile-play-area');
    playAreaTiles.forEach(tile => {
        tile.textContent = '';
    });
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

const updateOriginalTiles = (element) => {
    const originalTilesElement = document.getElementById('original-tiles');
    originalTilesElement.innerHTML = ''; // Clear the content
    
    shuffledTiles.forEach((value) => {
        originalTilesElement.innerHTML += `<div class="tile-area">${value}</div>`;
    });
    element.innerHTML = htmlPlayer;
}

function peel(element) {
    htmlPlayer = '';
    //const startTilesCopy = [...array]; // Create a copy of the original array to avoid modifying it

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
    //startTiles = startTilesCopy; // Restore the original array

    return randomValues;
}

function dump(amountToTake, element, amountToReturn) {
    // // randomValues.length = 0;
    // // const startTilesCopy = [...randomValues]; // Create a copy of the original array to avoid modifying it
    // const tilesTaken = [];
    
    // // Get 21 random values
    // for (let i = 0; i < amountToTake; i++) {
    //     if (shuffledTiles.length > 0) {
    //         const randomIndex = Math.floor(Math.random() * shuffledTiles.length);
    //         const randomValue = shuffledTiles.splice(randomIndex, 1)[0]; // Remove the selected value from the array
    //         tilesTaken.push(randomValue);
    //         randomValues.push(randomValue);
    //         htmlPlayer += `<div class="player-tiles" data-index="${randomIndex}">${randomValue}</div>`;
    //     }
    // }

    // //  Update the original-tiles element with the 21 random tiles
    // updateOriginalTiles(element);

    // if (amountToReturn > 0) {
    //     if (randomValues.length > 0) {
    //         const tileToReturn = randomValues.pop();
    //         shuffledTiles.push(tileToReturn);
    //         //htmlPlayer += `<div class="player-tiles">${tileToReturn}</div>`;
    //     }
    // }

    // element.innerHTML = htmlPlayer;
    // //startTiles = startTilesCopy; // Restore the original array
    
    // return randomValues;
     const tilesTaken = [];
    //htmlPlayer = '';

    // Take 3 tiles from the tile area
    for (let i = 0; i < amountToTake; i++) {
        if (shuffledTiles.length > 0) {
            const randomIndex = Math.floor(Math.random() * shuffledTiles.length);
            const randomValue = shuffledTiles.splice(randomIndex, 1)[0];
            tilesTaken.push(randomValue);
            randomValues.push(randomValue);
        }
    }

    // Add the 3 tiles taken from the tile area to the player's tiles area
    tilesTaken.forEach((value) => {
        htmlPlayer += `<div class="player-tiles">${value}</div>`;
    });

    // Update the original-tiles element with the updated tiles
    updateOriginalTiles(element);

    // Return 1 tile to the tile area from the player's hand
    if (amountToReturn > 0) {
        if (randomValues.length >= 1) {
            const tileToReturn = randomValues.pop();
            shuffledTiles.push(tileToReturn);
        }
    }

    element.innerHTML = htmlPlayer;

    return randomValues;
}