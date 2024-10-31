class LazyChameleon {

    constructor(name, json, default_theme) {
        this.#name = name;
        this.#json = json;
        this.default_theme = default_theme;
        this.#init();
    }

    #name;
    #json;
    #themes = null;
    #storedTheme = null;
    #broadcastchannel;

    async #init() {
        this.#storedTheme = localStorage.getItem(`${this.#name}-theme`);
        this.#broadcastchannel = new BroadcastChannel(`${this.#name}-channel`);
        this.#broadcastchannel.onmessage = this.#handleChangeThemeEvent.bind(this);


        const json = await this.#getThemeData();
        if (json) {
            this.#themes = json;
            if (this.#storedTheme) {
                let themeValue = this.#storedTheme;
                if(this.default_theme){
                    themeValue = this.default_theme;
                }
                this.setTheme(themeValue);
            } else {
                let themeValue = json[0].name;
                if(this.default_theme){
                    themeValue = this.default_theme;
                }
                localStorage.setItem(`${this.#name}-theme`, themeValue);
                this.setTheme(themeValue);
            }
        }
    }

    async #getThemeData() {
        const url = this.#json;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(error.message);
        }
    }

    setTheme(themeName) {
        const theme = this.#themes.find(theme => theme.name === themeName);
        if (theme) {
            const root = document.documentElement;
            theme.colors.forEach(color => {
                root.style.setProperty(color.name, color.value);
            });
            localStorage.setItem(`${this.#name}-theme`, theme.name);
        } else {
            console.error('Theme name not found:', themeName);
        }
    }

    #handleChangeThemeEvent(event) {
        const receivedData = event.data;
        this.setTheme(receivedData);
    }

    getStoredTheme() {
        return localStorage.getItem(`${this.#name}-theme`);
    }

    sendChangeThemeEvent(change) {
        this.#broadcastchannel.postMessage(change);
    }
}
