let userSettingsDebounce = null;

function openDatabaseAndHandleUserSettings(userSettings) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('UserSettingsDB', 1);
        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            const objectStore = db.createObjectStore('UserSettings', { keyPath: 'user' });
            objectStore.createIndex('theme', 'theme', { unique: false });
            objectStore.createIndex('mode_used', 'mode_used', { unique: false });
            objectStore.createIndex('time_selected', 'time_selected', { unique: false });
            objectStore.createIndex('word_amount_selected', 'word_amount_selected', { unique: false });
            objectStore.createIndex('challenge_achieved', 'challenge_achieved', { unique: false });
            objectStore.createIndex('custome_sentence', 'custome_sentence', { unique: false });
            objectStore.createIndex('last_updated', 'last_updated', { unique: false });
            objectStore.createIndex('ultra_wide_config', 'ultra_wide_config', { unique: false });
            objectStore.createIndex('font_size', 'font_size', { unique: false });
            objectStore.createIndex('font_family', 'font_family', { unique: false });
        };

        request.onerror = function(event) {
            console.error('Database error:', event.target.errorCode);
            reject('Database error');
        };

        request.onsuccess = function(event) {
            const db = event.target.result;

            // Check if the user settings already exist
            const transaction = db.transaction(['UserSettings'], 'readonly');
            const objectStore = transaction.objectStore('UserSettings');
            const getRequest = objectStore.get(userSettings.user);

            getRequest.onsuccess = function(event) {
                const now = new Date().toISOString();
                const existingSettings = event.target.result;

                if (existingSettings) {
                    if (userSettings.theme !== undefined) {
                        // Update existing settings
                        const updateTransaction = db.transaction(['UserSettings'], 'readwrite');
                        const updateObjectStore = updateTransaction.objectStore('UserSettings');
                        console.log(userSettings)
                        
                        const updatedSettings = {
                            user: userSettings.user,
                            theme: userSettings.theme,
                            mode_used: userSettings.mode_used,
                            time_selected: userSettings.time_selected,
                            word_amount_selected: userSettings.word_amount_selected,
                            challenge_achieved: userSettings.challenge_achieved,
                            custome_sentence: userSettings.custome_sentence,
                            last_updated: now,
                            ultra_wide_config: userSettings.ultra_wide_config,
                            font_size: userSettings.font_size,
                            font_family: userSettings.font_family,
                        };

                        const updateRequest = updateObjectStore.put(updatedSettings);

                        updateRequest.onsuccess = function() {
                            resolve(updatedSettings);
                        };

                        updateRequest.onerror = function(event) {
                            console.error('Error updating user settings:', event.target.errorCode);
                            reject('Error updating user settings');
                        };
                    } else {
                        // If no changes needed, resolve with the existing settings
                        resolve(existingSettings);
                    }
                } else {
                    // If not found, create new user settings with default values
                    const defaultValues = {
                        theme: 'dark',
                        mode_used: 'time',
                        time_selected: 15,
                        word_amount_selected: 15,
                        challenge_achieved: [0,0,0,0,0,0,0,0,0],
                        custome_sentence: "The quick brown fox jumps over the lazy dog.",
                        last_updated: now,
                        ultra_wide_config: 'center',
                        font_size: '40px',
                        font_family: 'VT323'
                    };

                    const finalSettings = {
                        user: userSettings.user,
                        theme: userSettings.theme || defaultValues.theme,
                        mode_used: userSettings.mode_used || defaultValues.mode_used,
                        time_selected: userSettings.time_selected || defaultValues.time_selected,
                        word_amount_selected: userSettings.word_amount_selected || defaultValues.word_amount_selected,
                        challenge_achieved: userSettings.challenge_achieved || defaultValues.challenge_achieved,
                        custome_sentence: userSettings.custome_sentence || defaultValues.custome_sentence,
                        last_updated: now,
                        ultra_wide_config: userSettings.ultra_wide_config || defaultValues.ultra_wide_config,
                        font_size: userSettings.font_size || defaultValues.font_size,
                        font_family: userSettings.font_family || defaultValues.font_family,
                    };

                    const writeTransaction = db.transaction(['UserSettings'], 'readwrite');
                    const writeObjectStore = writeTransaction.objectStore('UserSettings');
                    const addRequest = writeObjectStore.add(finalSettings);

                    addRequest.onsuccess = function() {
                        resolve(finalSettings);
                    };

                    addRequest.onerror = function(event) {
                        console.error('Error adding user settings:', event.target.errorCode);
                        reject('Error adding user settings');
                    };
                }
            };

            getRequest.onerror = function(event) {
                console.error('Error retrieving user settings:', event.target.errorCode);
                reject('Error retrieving user settings');
            };
        };
    });
}
function getLocalUserSettings(user, callback){
    const request = indexedDB.open('UserSettingsDB', 1);
    request.onsuccess = function(event){
        const db = event.target.result;
        const updateTransaction = db.transaction(['UserSettings'], 'readonly');
        const updateObjectStore = updateTransaction.objectStore('UserSettings');
        const getRequest = updateObjectStore.get(user);

        getRequest.onsuccess = function(event){
            const data = event.target.result;
            callback(data)
        }
    }
}
function updateLocalUserSettings(user, theme=null, mode_used=null, time_selected=null, word_amount_selected=null, challenge_achieved=null, custome_sentence=null, ultra_wide_config=null, font_size=null, font_family = null){
    const now = new Date().toISOString();
    const request = indexedDB.open('UserSettingsDB', 1);
    request.onsuccess = function(event) {
        const db = event.target.result;
        const updateTransaction = db.transaction(['UserSettings'], 'readwrite');
        const updateObjectStore = updateTransaction.objectStore('UserSettings');
        const getRequest = updateObjectStore.get(user);

        getRequest.onsuccess = function(event){
            const data = event.target.result;
            if (theme !== undefined && theme !== null) {
                data.theme = theme;
            }
            if (mode_used !== undefined && mode_used !== null) {
                data.mode_used = mode_used;
            }
            if (time_selected !== undefined && time_selected !== null) {
                data.time_selected = time_selected; // Ensure this is a valid integer
            }
            if (word_amount_selected !== undefined && word_amount_selected !== null) {
                data.word_amount_selected = word_amount_selected; // Ensure this is a valid integer
            }
            if (challenge_achieved !== undefined && challenge_achieved !== null) {
                data.challenge_achieved = challenge_achieved;
            }
            if (custome_sentence !== undefined && custome_sentence !== null) {
                data.custome_sentence = custome_sentence;
            }
            if(ultra_wide_config !== undefined && ultra_wide_config !== null){
                data.ultra_wide_config = ultra_wide_config
            }
            if(font_size !== undefined && font_size !== null){
                data.font_size = font_size
            }
            if(font_family !== undefined && font_family !== null){
                data.font_family = font_family
            }
            data.last_updated = now
        
            const updateRequest = updateObjectStore.put(data);
       
            updateRequest.onerror = function(event) {
                console.error('Error updating user settings:', event.target.errorCode);
                reject('Error updating user settings');
            };
        }
    
    }

}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Check if this cookie string begins with the desired name
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function updateUserSettings(theme=null, mode_used=null, time_selected=null, word_amount_selected=null, challenge_achieved=null, custome_sentence=null, ultra_wide_config=null, font_size = null, font_family = null) {
    if(userSettingsDebounce){
        clearTimeout(userSettingsDebounce)
    }
    userSettingsDebounce = setTimeout(()=>{
        const data = {};
        if (theme !== undefined && theme !== null) {
            data.theme = theme;
        }
        if (mode_used !== undefined && mode_used !== null) {
            data.mode_used = mode_used;
        }
        if (time_selected !== undefined && time_selected !== null) {
            data.time_selected = time_selected; // Ensure this is a valid integer
        }
        if (word_amount_selected !== undefined && word_amount_selected !== null) {
            data.word_amount_selected = word_amount_selected; // Ensure this is a valid integer
        }
        if (challenge_achieved !== undefined && challenge_achieved !== null) {
            data.challenge_achieved = JSON.stringify(challenge_achieved);
        }
        if (custome_sentence !== undefined && custome_sentence !== null) {
            data.custome_sentence = custome_sentence;
        }
        if(ultra_wide_config !== undefined && ultra_wide_config !==null){
            data.ultra_wide_config = ultra_wide_config
        }
        if(font_size !== undefined && font_size !==null){
            data.font_size = font_size
        }
        if(font_family !== undefined && font_family !==null){
            data.font_family = font_family
        }
        
        $.ajax({
            url: '/user/settings/update/', // The URL for the request
            type: 'POST', // or 'PUT'
            contentType: 'application/x-www-form-urlencoded', // Data type
            data: data, // Use the prepared data object
            beforeSend: function(xhr, settings) {
                // Include CSRF token if needed
                xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
            },
            success: function(response) {
            },
            error: function(xhr, status, error) {
            }
        });
    },1000)
}