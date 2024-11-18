let all_words = null;
function initIndexedDB(background_fecth_callback) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("word_list", 1);

        // Run when the database is created or upgraded
        request.onupgradeneeded = function (event) {
            const db = event.target.result;

            // Create object store with "id" as the primary key
            const store = db.createObjectStore("words", { keyPath: "id", autoIncrement: true });
            console.log("IndexedDB initialized with store 'words'");
        };

        request.onsuccess = async function (event) {
            const db = event.target.result;

            try {
                // Count the entries in the 'words' store
                const wordCount = await countWords(db);
                
                // If no words exist in the DB, fetch the first batch of words
                if (wordCount === 0) {
                    const firstWords = await fetchWordsFromAPI();
                    // Insert the first batch of words into IndexedDB
                    await insertWords(db, firstWords.words);
                }

                // Immediately allow retrieval of data from IndexedDB
                const allWords = await getAllWords(db);

                // Fetch next 4 batches of words in the background
                const fetchPromises = [];
                for (let i = 0; i < 4; i++) {
                    fetchPromises.push(fetchWordsFromAPI().then((words) => {
                        return insertWords(db, words.words);
                    }));
                }

                // Wait for all fetches and insertions to complete in the background (optional)
                Promise.all(fetchPromises)
                    .then(() => background_fecth_callback(db))
                    .catch((error) => console.error("Error with background fetches", error));

                resolve(db); // Resolve once the database is ready and retrieval is possible
            } catch (error) {
                console.error("Error fetching or inserting words:", error);
                reject(error);
            }
        };

        request.onerror = function (event) {
            console.error("Error initializing IndexedDB:", event.target.error);
            reject(event.target.error);
        };
    });
}

// Function to count the number of entries in the 'words' store
function countWords(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("words", "readonly");
        const store = transaction.objectStore("words");

        const request = store.count();

        request.onsuccess = function (event) {
            resolve(event.target.result); // Return the count of words
        };

        request.onerror = function (event) {
            console.error("Error counting words:", event.target.error);
            reject(event.target.error);
        };
    });
}

  

function insertWords(db, words) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("words", "readwrite");
        const store = transaction.objectStore("words");

        // Insert all new words into the database
        words.forEach((word) => {
            const wordData = { word: word }; // Insert the word

            const request = store.put(wordData);

            request.onerror = function (event) {
                console.error("Error inserting word:", event.target.error);
                reject(event.target.error);
            };
        });

        // After inserting the words, check the total count and delete if necessary
        transaction.oncomplete = function () {


            // **Create a new transaction to count the entries**
            const countTransaction = db.transaction("words", "readonly");
            const countStore = countTransaction.objectStore("words");

            // Get the total count of words in the store
            const countRequest = countStore.count();

            countRequest.onsuccess = function (event) {
                const wordCount = event.target.result;

                // If more than 1000 words, remove the first 200
                if (wordCount > 1000) {
                    cleanupOldWords(db);
                }

                resolve();
            };

            countRequest.onerror = function (event) {
                console.error("Error checking word count:", event.target.error);
                reject(event.target.error);
            };
        };

        transaction.onerror = function (event) {
            console.error("Error in transaction:", event.target.error);
            reject(event.target.error);
        };
    });
}

// Function to remove the first 200 words from the IndexedDB
function cleanupOldWords(db) {
    const transaction = db.transaction("words", "readwrite");
    const store = transaction.objectStore("words");

    const request = store.openCursor();  // Open a cursor to iterate through the records

    let count = 0;
    request.onsuccess = function (event) {
        const cursor = event.target.result;

        if (cursor && count < 200) {
            // Delete the first 200 records
            store.delete(cursor.primaryKey);
            count++;

            cursor.continue();  // Move to the next record
        } else {
        }
    };

    request.onerror = function (event) {
        console.error("Error in cursor operation:", event.target.error);
    };
}


// Function to fetch words from the API
function fetchWordsFromAPI() {
    return $.ajax({
        url: "/refresh_words/",
        method: "GET",
        dataType: "json",
    })
        .done(function (response) {
            return response.words; // Assuming response contains the list of words
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            console.error(`Error fetching words from API: ${textStatus}`, errorThrown);
            throw new Error(`Failed to fetch: ${textStatus}`);
        });
}

// Function to retrieve all words
function getAllWords(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("words", "readonly");
        const store = transaction.objectStore("words");

        const request = store.getAll();

        request.onsuccess = function (event) {
            resolve(event.target.result);
        };

        request.onerror = function (event) {
            console.error("Error retrieving words:", event.target.error);
            reject(event.target.error);
        };
    });
}