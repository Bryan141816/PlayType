class TypingTest {
    constructor(textInput, paragraphElement,retryButton, timer, onDone, resetTestBinding, amount, testType, testStatusCallBack, test_active = true) {
        this.all_words = null;
        (async () => { 
            try {
                const db = await initIndexedDB(this.background_word_prefetch_callback);
                const words = await getAllWords(db);
                const all_words = words.map(item => item.word);
                this.all_words = all_words; 
                if(testType != 'custom'){
        
                    this.getText(null, amount)
                    
                }
            } catch (error) {
                console.error("Error:", error);
            }
        })();
        this.test_active = test_active

        this.amount = amount
        this.textInput = $(textInput);
        this.paragraphElement = $(paragraphElement);
        this.retryButton = $(retryButton);
        this.started = false;
        this.currentIndex = 0;
        this.spaceCounter = 0;
        this.totalCharacters = 0;
        this.previousInputLength = 0;
        this.incorrectCounter = 0;
        this.extraLetterCounter = 0;
        this.timer = timer
        this.testDone = onDone;
        this.resetTestBinding = resetTestBinding
        this.testType = testType;
        this.testStatusCallBack = testStatusCallBack
        this.init();
    }
    background_word_prefetch_callback = async (db) => { 
        try {
            const words = await getAllWords(db);
            const all_words = words.map(item => item.word);
            this.all_words = all_words;
        } catch (error) {
            console.error("Error:", error);
        }
    }
    
    init() {
        this.test_finished = false;
        this.textInput.on('input', this.handleInput.bind(this));
        this.textInput.on('keydown', this.handleKeydown.bind(this));
        $(document).keypress(this.handleKeyPress.bind(this));
        this.paragraphElement.click(() => this.textInput.focus());
        this.textInput.on('focus', () => this.textInputFocus('focus'));
        this.textInput.on('blur', () => this.textInputFocus('blue'));
        this.retryButton.click(this.resetTest.bind(this));
        this.textInput.on('keydown', this.checkCapsLock.bind(this));
        this.textInput.on('keyup', this.checkCapsLock.bind(this));


    }
     checkCapsLock(event) {
        if(!this.test_active){
            return
        }
        if (event.originalEvent && event.originalEvent.getModifierState('CapsLock')) {
            $('#warning-text').removeClass('hidden')
        } else {
            $('#warning-text').addClass('hidden')
        }
    }
    textInputFocus(type){
        if(!this.test_active){
            return
        }
        if(!this.test_finished){
            if(type == 'focus'){
                this.paragraphElement.removeClass('text_input_unfocused')
            }
            else{
                this.paragraphElement.addClass('text_input_unfocused')
                this.testStatusCallBack(false)
            }
        }
    }


    setupInitialWord() {
        $('.word_container').first().addClass('active');
        this.activeWordsType = $('.word_container.active');
        this.activeText = this.activeWordsType.find('.letter').map(function() {
            return $(this).text();
        }).get();
    }

    handleInput() {
        if(!this.test_active){
            return
        }
        let activeContainer = document.querySelector('.active');
        if(activeContainer){
            const currentInput = this.textInput.val().split('');
            this.updateLetterClasses(currentInput);
            if((this.previousInputLength>currentInput.length)&&(currentInput.length+1>this.activeText.length)&&this.previousInputLength>0){
                $('.word_container.active .letter:last').remove();
            }
            if (!this.started) {
                if(this.testType == 'time' || this.testType == 'lobby'){
                    $('#counter').text(this.timer.formatMinutesAndSeconds(this.timer.set_time));
                }
                else if(this.testType == 'words' || this.testType == 'custom'){
                    $('#counter').text(`0/${this.amount}`);
                }
                $('#counter').removeClass('hidden');
                if(this.testType == 'challenge'){
                    $('#counter').text(`0/${this.amount}`);
                    $('#challenge-counter').removeClass('hidden');
                    $('#challenge-counter').text(this.timer.formatMinutesAndSeconds(this.timer.set_time));
                }
                this.timer.start();
                this.testStatusCallBack(true)
            }
            this.started = true;
            $('#pointer').removeClass('flash-animation');
            this.calculatePointerPosition(currentInput);
            this.previousInputLength = currentInput.length;
        } 
        this.testStatusCallBack(true)   
    }
    calculatePointerPosition(currentInput){

        let activeContainer = document.querySelector('.active');
        if(activeContainer != null){
            let x = 0;
            let y = 0;
            if(currentInput.length!=0 && currentInput.length != activeContainer.children.length){

                let activeLetter = activeContainer.children[currentInput.length]
                const relativePosition =this.getRelativePosition(activeContainer,activeLetter);
                x = relativePosition.childrenPos.x - relativePosition.containerPos.x;
                y = relativePosition.childrenPos.y - relativePosition.containerPos.y;
            }
            else if(currentInput.length == 0 || currentInput.length == 1){
                let activeLetter = activeContainer.children[0]
                const relativePosition =this.getRelativePosition(activeContainer,activeLetter);
                x = relativePosition.childrenPos.x - relativePosition.containerPos.x;
                y = relativePosition.childrenPos.y - relativePosition.containerPos.y;
                if(currentInput.length == 1){
                    x = x + relativePosition.childrenPos.width;
                }
            }
            else{
                let activeLetter = activeContainer.children[currentInput.length-1]
                const relativePosition =this.getRelativePosition(activeContainer,activeLetter);
                x = relativePosition.childrenPos.x - relativePosition.containerPos.x;
                y = relativePosition.childrenPos.y - relativePosition.containerPos.y;
                let xRelativeToParent = parseFloat(relativePosition.childrenPos.x-relativePosition.elementPos.x);
                x = x + (xRelativeToParent/currentInput.length-1)
                
            }
            this.movePointerTo(x,y);
        }
    }

    updateLetterClasses(currentInput) {
        if(!this.test_active){
            return
        }
        this.activeWordsType.find('.letter').removeClass('correct incorrect');
        currentInput.forEach((value, index) => {
            if (index < this.activeText.length) {
                const letterElement = this.activeWordsType.find('.letter').eq(index);
                if (currentInput[index] === this.activeText[index]) {
                    letterElement.addClass('correct');
                } else {
                    letterElement.addClass('incorrect');
                    this.incorrectCounter++;
                }
            } else if (index + 1 > this.previousInputLength) {
                let insertOverflowText = $(`<span class="letter incorrect_extra">${currentInput[currentInput.length - 1]}</span>`);
                this.activeWordsType.append(insertOverflowText);
                this.extraLetterCounter++;
            }
        });
        if((this.currentIndex == $('.word_container').length - 1) && (this.activeText.length == this.activeWordsType.find('.letter.correct').length)){
            this.timer.stop()
            this.testDone(this.testType, 'TypingTest')
            
        }   
    }

    handleKeydown(event) {
        if(!this.test_active){
            return
        }
        if (event.key === " " || event.keyCode === 32) {
            let inputted = this.textInput.val().trim();
            if (inputted !== "") {
                this.totalCharacters += this.activeText.length;
                this.moveToNextWord();
            }
            this.textInput.val('');
            event.preventDefault();
            this.testStatusCallBack(true)
        } else if (event.key === "Enter" || event.keyCode === 13) {
            event.preventDefault(); 
        }
        else if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowRight' || 
            event.keyCode === 37 || event.keyCode === 38 || event.keyCode === 39 || event.keyCode === 40) {
          event.preventDefault();  // Prevent the default behavior (e.g., scrolling)
        }
    }

    handleKeyPress(event) {
        if(!this.test_active){
            return
        }
        const char = String.fromCharCode(event.which);
        if (/^[a-z0-9]$/i.test(char)) {
            this.textInput.focus();
        }
    }

    moveToNextWord() {
        let activeContainer = document.querySelector('.active');
        if(!activeContainer){
            return
        }

        this.previousInputLength = 0;
        this.currentIndex++;
        if(this.testType == 'words' || this.testType == 'custom' || this.testType == 'challenge'){
            $('#counter').text(`${this.currentIndex}/${this.amount}`)
        }
        if(this.currentIndex > $('.word_container').length - 1 && $('.word_container').length > 0){
            this.testStopped = false;
            this.timer.stop()
            this.testDone(this.testType, 'TypingTest')
        }
        $('.word_container').removeClass('active');
        $('.word_container').eq(this.currentIndex).addClass('active');
        this.activeWordsType = $('.word_container.active');
        this.activeText = this.activeWordsType.find('.letter').map(function() {
            return $(this).text();
        }).get();
        this.spaceCounter++;
        const activeELement = document.querySelector('.active')

        const relativePosition = this.getRelativePosition(activeELement);
        let prevY = null;
        if (relativePosition.elementPos.top - relativePosition.containerPos.top > relativePosition.containerPos.height * 0.50) {
            const prev_element = $('.word_container').eq(this.currentIndex - 1);
            prevY = prev_element.offset().top;
            activeELement.scrollIntoView({
              behavior: 'smooth', // Adds smooth scrolling animation
              block: 'center',    // Aligns the element vertically in the center of the viewport
            });
        }
        let x = relativePosition.elementPos.x - relativePosition.containerPos.x;
        let y = relativePosition.elementPos.y - relativePosition.containerPos.y;
        if(prevY){
            y = prevY - relativePosition.containerPos.y;
        }
        this.movePointerTo(x,y);
    }

    movePointerTo(x,y){
        x = Math.floor(x)
        y = Math.floor(y)
        $('#pointer').stop(true, true).css(
            'top', y + 'px',
            'left', x + 'px'
        );
        $('#pointer').animate({
            top:  y + 'px',
            left: x + 'px'
        }, 100);
    }

    getRelativePosition(activeELement, childrenElement = null) {
        if(activeELement != null){
            const element       =   activeELement;
            const container     =   document.querySelector('.paragraph');
            const elementRect   =   element.getBoundingClientRect();
            const containerRect =   container.getBoundingClientRect();
            
            if(childrenElement!=null){
                const childrenRect = childrenElement.getBoundingClientRect();
                return {elementPos: elementRect,childrenPos: childrenRect ,containerPos: containerRect}
            }
            else{
                return {elementPos: elementRect, containerPos: containerRect}
            }
        }
    }
    requestResultData(){
        const data = {
            totalCharacter:         this.totalCharacters,
            previousInputLength:    this.previousInputLength,
            spaceCounter:           this.spaceCounter,
            totalCharacters:        this.totalCharacters,
            incorrectCounter:       this.incorrectCounter,
            extraLetterCounter:     this.extraLetterCounter,
            correctCount:           $('.letter.correct').length
        }
        return data;
    }
    
    getText(param = null) {
        const letters = this.all_words.map(word => word.split(""));
    
        // Shuffle the words array
        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]]; // Swap elements
            }
        }
        
        shuffleArray(letters);  // Shuffle the letters array
    
        // Select the first 'this.amount' words from the shuffled array
        const selectedWords = letters.slice(0, this.amount);
    
        const pointer = $(`<div class="pointer-area-field">
            <div id="pointer" class="flash-animation"></div>
        </div>`);
        const paragraph_container = $(`<div id="paragraph-container"></div>`);
        
        this.paragraphElement.html(""); // Clear existing content
        this.paragraphElement.append(pointer);
    
        selectedWords.forEach((word) => {
            const word_container = $(`<div class="word_container"></div>`);
            word.forEach((letter) => {
                const letter_container = $(`<span class="letter">${letter.toLowerCase()}</span>`);
                word_container.append(letter_container);
            });
            paragraph_container.append(word_container);
        });
    
        this.paragraphElement.append(paragraph_container);
        $('.word_container').first().addClass('active'); // Set first word as active
        this.activeWordsType = $('.word_container.active');
    
        // Extract active letters
        this.activeText = this.activeWordsType.find('.letter').map(function () {
            return $(this).text();
        }).get();
    
        if (param) {
            param(); // Execute param if passed
        }
    
        this.setupInitialWord();
    
        if (param) {
            param(); // Execute param again if passed
        }
    }
    
    useCustomSentence(param=null){
        let sentence    =   $('#sentence-text').val().trim();
        const words     =   sentence.split(" ");
        const letters   =   words.map(word => word.split(""));


        const pointer = $(`<div class="pointer-area-field">
            <div id="pointer" class="flash-animation"></div>
        </div>`)
        const paragraph_container = $(`<div id="paragraph-container"></div>`)

        this.paragraphElement.html("")
        this.paragraphElement.append(pointer)


        letters.forEach((word)=>{
            const word_container = $(`<div class="word_container"></div>`);
            word.forEach((letter)=>{
                const letter_container = $(`<span class="letter">${letter}</span>`)
                word_container.append(letter_container)
            })
            paragraph_container.append(word_container);
        })
        this.paragraphElement.append(paragraph_container)
        $('.word_container').first().addClass('active');
        this.activeWordsType = $('.word_container.active');
        this.activeText = this.activeWordsType.find('.letter').map(function() {
            return $(this).text();
        }).get();
        if(param){
            param();
        }
        this.updateWordAmount($('.word_container').length)
    }

    resetTest(origin) {
        this.testStatusCallBack(false)
        if(this.testType != 'custom'){
            this.getText(this.resetValues.bind(this), this.amount);
        }
        else{
            this.useCustomSentence(this.resetValues.bind(this))
        }
    }

    resetValues() {
        this.test_finished = false;
        this.currentIndex = 0;
        this.spaceCounter = 0;
        this.started = false;
        this.totalCharacters = 0;
        this.incorrectCounter = 0;
        this.extraLetterCounter = 0;
        this.previousInputLength = 0;
        this.timer.reset();
        this.resetTestBinding()
        $('#counter').addClass('hidden')
        $('#challenge-counter').addClass('hidden')
        this.textInput.val('').focus();
        $("#paragraph").scrollTop(0);
        $('#pointer').addClass('flash-animation');
    }

    updateDocumentSelector(textInput,paragraphElement,retryButton){
        this.textInput = $(textInput);
        this.paragraphElement = $(paragraphElement);
        this.retryButton = $(retryButton);
        this.init()
        this.resetValues()
    }

    updateWordAmount(newAmount){
        this.amount = newAmount;
    }
    updateTimer(newTimer){
        this.timer = newTimer
    }
    updateTestType(newTestType){
        this.testType = newTestType;
    }
    changeTestFinishedStat(stat){
        this.test_finished = stat;
    }
    changeTestActivity(bool){
        this.test_active = bool
    }
}