/* Imports */
import { ref, set, get, db, push } from './firebase.js';

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
let playerCount;
let currentPlayer = 1;
let currentColumns = 19; // Initial number of columns
let currentRows = 22; // Initial number of rows
let startTiles = [];
const playAreaGrid = []; // 2D grid to represent the play area
const wordsToCheck = []; // Array to store words in both directions

/*----- cached elements  -----*/
const messageElement = document.getElementById('message');
const messageSection = document.getElementById('message-section');
const randomizeButton = document.getElementById('randomize-tiles');
const modal = document.getElementById("myModal");
const btn = document.getElementById("dump");
const span = document.getElementsByClassName("dump")[0];
const playAreaElement = document.getElementById('play-area');
const playAreaRef = ref(db, 'gameRoom/playArea');
const playerId = `player${currentPlayer}`;
const playerTilesRef = ref(db, `gameRoom/players/${playerId}`);
const newGameRef = push(ref(db, 'gameRooms'));
const roomId = newGameRef.key;
letterTileElements = document.querySelectorAll('.player-tiles');

// can delete

// Add an event listener to prevent scroll during dragover
playAreaElement.addEventListener('dragover', (event) => {
    event.preventDefault();
});

/*----- event listeners -----*/
document.getElementById('split').addEventListener('click', () => {
    // Clear the play area grid
    for (let i = 0; i < currentRows; i++) {
        for (let j = 0; j < currentColumns; j++) {
            playAreaGrid[i][j] = { letter: '', direction: '' };
        }
    }

    buildOriginalTiles(); // Build the original tiles array
    shuffleOriginalTiles(document.getElementById('original-tiles')); // Shuffle the tiles
    split(shuffledTiles, 21, document.getElementById('player-tiles')); // Put 21 tiles into the players hand
    letterTileElements = document.querySelectorAll('.player-tiles');
    attachLetterTileEventListeners(); // Attach event listeners to the tiles in the player's hand
    randomizeButton.style.visibility = 'visible'; // Enable the "Randomize" button
    clearTilePlayArea(); // Clear the play area display
    messageSection.style.display = 'none'; // Hide the message section
    initializePlayerTilesFirebase();
    checkWords(); // Recheck words
});

document.getElementById('peel').addEventListener('click', () => {
    peel(document.getElementById('player-tiles')); // Take 1 tile from the tile area and put it into the player's hand
    letterTileElements = document.querySelectorAll('.player-tiles');
    attachLetterTileEventListeners(); // Attach event listeners to the tiles in the player's hand
});

document.getElementById('dump').addEventListener('click', () => {
    openDumpModal();
    letterTileElements = document.querySelectorAll('.player-tiles');
    attachLetterTileEventListeners();

    handleDumpButtonClick(selectedTile);
});

document.getElementById('randomize-tiles').addEventListener('click', () => {
    randomizePlayerTiles(); // Randomize the player's tiles
});

document.getElementById('closePlayerModal').addEventListener('click', () => {
    document.getElementById('playerModal').style.display = 'none';
});

document.getElementById('joinGameBtn').addEventListener('click', () => {
    const roomId = document.getElementById('roomIdInput').value.trim();

    if (roomId) {
        joinGame(roomId);
        document.getElementById('playerModal').style.display = 'none';
    } else {
        alert('Please enter a valid Room ID.');
    }
});

document.getElementById('bananas').addEventListener('click', async () => {
    messageSection.style.display = 'block';
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



const initializeGame = () => {
    // Code to initialize game state
    // buildPlayArea(document.getElementById('play-area')); // Create the play area

    // Attach event listeners
    //attachLetterTileEventListeners();

    // Enable the "Randomize" button
    randomizeButton.style.visibility = 'visible';

    // Clear the play area display
    clearTilePlayArea();

    // Hide the message section
    messageSection.style.display = 'none';

    // Initialize player tiles in Firebase
    initializePlayerTilesFirebase();

    // Check words
    checkWords();
};

const handleStartGame = async () => {
    playerCount = parseInt(document.getElementById('playerCountInput').value, 10);

    if (playerCount >= 2 && playerCount <= 4) {
        currentPlayer = 1; // Reset to player 1

        // Create the game and get player ID and room ID
        const { playerId, roomId } = await createGame();

        // Wait for all players to join
        const playersJoined = await waitForPlayersToJoin(roomId, playerCount);

        if (playersJoined) {
            initializeGame();
            document.getElementById('playerModal').style.display = 'none';
        } else {
            alert('Not all players have joined the room.');
        }
    } else {
        alert('Please select a valid number of players (2 to 4).');
    }
};

const waitForPlayersToJoin = async (roomId, expectedPlayerCount) => {
    return new Promise((resolve) => {
        const intervalId = setInterval(() => {
            const playersRef = ref(db, `gameRooms/${roomId}/players`);
            get(playersRef).then((snapshot) => {
                const players = snapshot.val();
                const joinedPlayerCount = players ? Object.keys(players).length : 0;
                console.log(joinedPlayerCount)
                if (joinedPlayerCount === expectedPlayerCount) {
                    clearInterval(intervalId);
                    resolve(true);
                }
            });
        }, 1000); // Check every second
    });
};

// Add event listener for the start game button
document.getElementById('startGameBtn').addEventListener('click', handleStartGame);

// Show the player count modal when the page loads
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('playerModal').style.display = 'block';
});

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
        letterTileElements.forEach((letterTile, index) => {
            letterTile.addEventListener('click', () => {
                // Check if the tile is already selected
                const isSelected = letterTile.classList.contains('selected-tile');

                letterTileElements.forEach((tile) => {
                    //tile.classList.remove('selected-tile');
                });
                
                if (!isSelected) {
                    // If it's not selected, add the class
                    selectedTile = letterTile.textContent;
                    selectedTileIndex = index;
                } else {
                    // If it's already selected, clear the selection
                    selectedTile = null;
                    selectedTileIndex = null;
                }
            });

            // Enable drag and drop
            letterTile.setAttribute('draggable', true);
            letterTile.addEventListener('dragstart', handleDragStart);
            
        });
    }
};

const updatePlayAreaInFirebase = (newPlayAreaData) => {
    //const playAreaRef = ref(db, 'gameRoom/playArea');
    set(playAreaRef, newPlayAreaData);
}

const updatePlayerTiles = () => {
    // Clear the player's hand
    const playerTilesElement = document.getElementById('player-tiles');
    playerTilesElement.innerHTML = '';

    // Rebuild the player's hand with the updated tiles
    const updatedTiles = randomValues.map((tile, index) => {
        const tileElement = document.createElement('div');
        tileElement.className = 'player-tiles';
        tileElement.setAttribute('data-index', index);
        tileElement.textContent = tile;
        playerTilesElement.appendChild(tileElement);
        return tile;
    });

    // Reattach event listeners to the new tiles
    letterTileElements = document.querySelectorAll('.player-tiles');
    attachLetterTileEventListeners();

    return updatedTiles;
}

const initializePlayerTilesFirebase = () => {
    const playerInitialTiles = updatePlayerTiles();
    const playerTilesData = { tiles: playerInitialTiles };

    //const playerTilesRef = ref(db, `gameRoom/players/${currentPlayerId}`);
    set(playerTilesRef, playerTilesData);
}

const updateOriginalTiles = (element) => {
    const originalTilesElement = document.getElementById('original-tiles');
    originalTilesElement.style.display = 'none';
    originalTilesElement.innerHTML = ''; // Clear the content
    
    shuffledTiles.forEach(() => {
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

            // Check if there's a letter in that position
            if (playAreaGrid[rowIndex][colIndex].letter === selectedTile) {
                // Update the `playAreaGrid` and `playAreaTile` content
                playAreaGrid[rowIndex][colIndex].letter = '';
                playAreaGrid[rowIndex][colIndex].direction = '';
                emptyTile.textContent = selectedTile;

                // Remove the letter from the player's tiles
                randomValues.splice(selectedTileIndex, 1);

                // Update the player's tiles on the screen
                updatePlayerTiles();
                selectedTile = null;

                // After updating the play area, check the words again
                checkWords();
            }
        }
    });

    // Enable drag and drop
    emptyTile.setAttribute('draggable', true);
    emptyTile.addEventListener('dragover', handleDragOver);
    emptyTile.addEventListener('drop', handleDrop);

    //emptyTile.addEventListener('touchmove', handleTouchMove);
    //emptyTile.addEventListener('touchend', handleTouchEnd);
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

function shuffleOriginalTiles() {
    shuffledTiles.length = 0;
    const shuffledOriginalTiles = [...originalTiles]; // Make a copy of the originalTiles array to shuffle
    for (let i = 0; i < originalTiles.length; i++) {
        const randomIndex = Math.floor(Math.random() * shuffledOriginalTiles.length);
        shuffledTiles.push(shuffledOriginalTiles.splice(randomIndex, 1)[0]);
    }
}

// Function to handle the drag start event
function handleDragStart(event) {
    const tile = event.target;
    event.dataTransfer.setData('text/plain', tile.textContent);

    tile.classList.add('selected-tile');
    playAreaElement.classList.add('dragging');
}

// Function to handle the drag over event (to allow dropping)
function handleDragOver(event) {
    event.preventDefault();
}

// Function to handle the drop event
function handleDrop(event) {
    event.preventDefault();
    const tile = event.dataTransfer.getData('text/plain');
    const playAreaTile = event.target;


    // Check if the drop target is a valid play area tile
    if (playAreaTile.classList.contains('tile-play-area')) {

        // Handle the drop (move tile to play area)
        playAreaTile.textContent = tile;

        // Find the position in the play area grid
        const rowIndex = Math.floor(Array.from(playAreaTile.parentNode.children).indexOf(playAreaTile) / currentColumns);
        const colIndex = Array.from(playAreaTile.parentNode.children).indexOf(playAreaTile) % currentColumns;

        // Update the playAreaGrid
        playAreaGrid[rowIndex][colIndex].letter = tile;
        playAreaGrid[rowIndex][colIndex].direction = '';

        // Remove the tile from the player's tiles visually and from the array
        for (let i = 0; i < randomValues.length; i++) {
            if (randomValues[i] === tile) {
                randomValues.splice(i, 1);
                break;
            }
        }

        // Update the player's tiles on the screen
        updatePlayerTiles();

        // Check words after updating the grid
        checkWords();

        // console.log('Tile dropped successfully');

        // Uncomment the line below if you want to keep the dragging class removed
        playAreaElement.classList.remove('dragging');

        // Uncomment the line below if you want to update the play area in Firebase
        updatePlayAreaInFirebase(playAreaGrid);
    }
}

// async function split(array, count, element) {
//     wordsToCheck.length = 0; // Clear the existing words
//     randomValues.length = 0;
//     html = '';
//     htmlPlayer = '';
//     messageElement.innerHTML = ''; // Clear the message area
//     clearTilePlayArea(); // Clear the play area

//     const startTilesCopy = [...array]; // Create a copy of the original array to avoid modifying it
    
//     try {
//         const playersSnapshot = await get(playersRef);
//         const numPlayers = playersSnapshot.val();

//         for (let i = 0; i <= numPlayers; i++) {
//             const playerTiles = [];

//             for (let j = 0; j < count; j++) {
//                 const randomIndex = Math.floor(Math.random() * startTilesCopy.length);
//                 const randomValue = startTilesCopy.splice(randomIndex, 1)[0]; // Remove the selected value from the array
//                 randomValues.push(randomValue);
//                 shuffledTiles.splice(randomIndex, 1);
//                 htmlPlayer += `<div class="player-tiles" data-index="${randomIndex}">${randomValue}</div>`;
//             }

//         const currentPlayerId = `player${i + 1}`;
//         const playerTilesRef = ref(db, `gameRoom/players/${currentPlayerId}`);
//         set(playerTilesRef, { tiles: playerTiles }); // Initialize player data
//         } 
//         updateOriginalTiles(element);
//         startTiles = startTilesCopy; // Restore the original array
        
//         return randomValues;
//     }   catch (error) {
//             console.error('Error splitting tiles:', error);
//             throw error;
//     }
// };

function split(array, count, element) {
    wordsToCheck.length = 0; // Clear the existing words
    randomValues.length = 0;
    html = '';
    htmlPlayer = '';
    messageElement.innerHTML = ''; // Clear the message area
    clearTilePlayArea(); // Clear the play area
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

const peel = (element) => {
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
};

function handleDumpButtonClick() {
    const tileSelectionInput = document.getElementById("tileSelectionInput");
    const selectedTile = tileSelectionInput.value;

    if (selectedTile) {
        // Add the selected tile back to the shuffledTiles array
        shuffledTiles.push(selectedTile);

        // Remove the selected tile from the player's tiles visually
        const playerTiles = document.querySelectorAll('.player-tiles');
        let isValidTile = false;

        playerTiles.forEach((tile, index) => {
            if (tile.textContent === selectedTile) {
                isValidTile = true;
                tile.remove();
                selectedTileIndex = index; // Update selectedTileIndex
            }
        });

        if (isValidTile) {
            // Remove the selected tile from the randomValues array
            randomValues.splice(selectedTileIndex, 1);

            // Call the dump function to add 3 random tiles from #original-tiles
            dump(document.getElementById('player-tiles'));

            // Clear the input field
            tileSelectionInput.value = '';

            // Close the modal
            modal.style.display = "none";
        } else {
            alert("Please select a valid tile from your tiles.");
        }
    }
}

function openDumpModal() {
    const modal = document.getElementById("myModal");
    const dumpButton = document.getElementById("dumpButton");
    const tileSelectionInput = document.getElementById("tileSelectionInput");

    // Clear the input field when opening the modal
    tileSelectionInput.value = '';

    modal.style.display = "block";

    // Remove any existing click event listeners on the "Dump" button
    dumpButton.removeEventListener('click', handleDumpButtonClick);

    // Add a new click event listener to handle the "Dump" button click
    dumpButton.addEventListener('click', handleDumpButtonClick);
}


function dump(element) {
    // Check if there are at least 3 tiles in the originalTiles (shuffledTiles)
    if (shuffledTiles.length < 3) {
        alert("Not enough tiles in the original-tiles to perform a dump.");
        return;
    }

    // Add the selected tile back to the shuffledTiles (shuffledTiles)
    if (selectedTile) {
        shuffledTiles.push(selectedTile);
    }

    // Take exactly 3 random tiles from the shuffledTiles (shuffledTiles)
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

    if (tilesTaken.length < 3) {
        alert("Not enough tiles left in the original-tiles to complete the dump.");
    }
}

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
            } else if (word !== '' && word.length > 1) { // Check if the word is more than one character
                wordsToCheck.push(word);
                word = '';
            }
        }
        if (word !== '' && word.length > 1) { // Check if the last word is more than one character
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
            } else if (word !== '' && word.length > 1) { // Check if the word is more than one character
                wordsToCheck.push(word);
                word = '';
            }
        }
        if (word !== '' && word.length > 1) { // Check if the last word is more than one character
            wordsToCheck.push(word);
        }
    }
};

// When the user clicks on the button, open the modal
btn.onclick = function() {
  modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
  modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}

const joinGame = (roomId, playerId) => {
    const roomRef = ref(db, `gameRooms/${roomId}`);
    get(roomRef).then((snapshot) => {
        if (snapshot.exists()) {
            const playerRef = ref(db, `gameRooms/${roomId}/players/${playerId}`);
            set(playerRef, { tiles: [] }); // Initialize player data
            console.log(`Joined game room: ${roomId}`);
        } else {
            alert('Invalid Room ID. Please enter a valid Room ID.');
        }
    });
}

const createGame = async () => {
    // Initialize the game state (e.g., play area)
    await set(ref(db, `gameRooms/${roomId}/playArea`), { /* ... */ });

    // Set the room ID
    await set(ref(db, `gameRooms/${roomId}`), { roomId });

    // Join the game as the first player
    const playerId = 'player1'; // Replace with your preferred identifier logic
    console.log('Game created', roomId);

    // Return the player ID and room ID
    return { playerId, roomId };
}
