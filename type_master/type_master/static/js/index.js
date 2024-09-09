class Timer {
    constructor(set_time, timer_label, on_done) {
        this.original_time = set_time;
        this.set_time = set_time;
        this.timer_label = timer_label;
        this.on_done = on_done;
    }

    start() {
        this.countdown = setInterval(() => { 
            this.set_time--;
            this.timer_label.text(this.set_time);

            if (this.set_time <= 0) {
                clearInterval(this.countdown);
                this.on_done();
            }
        }, 1000);
    }

    stop() {
        clearInterval(this.countdown);
    }

    reset() {
        this.stop()
        this.set_time = this.original_time; 
    }
}

class TypingTest {
    constructor(textInput, paragraphElement, countdownElement, retryButton, setTime) {
        this.textInput = $(textInput);
        this.paragraphElement = $(paragraphElement);
        this.countdownElement = $(countdownElement);
        this.retryButton = $(retryButton);
        this.setTime = setTime;
        this.started = false;
        this.currentIndex = 0;
        this.spaceCounter = 0;
        this.totalCharacters = 0;
        this.previousInputLength = 0;
        this.incorrectCounter = 0;
        this.timer = new Timer(setTime, this.countdownElement, this.timerDone.bind(this));
        this.init();
    }

    init() {
        this.setupInitialWord();
        this.countdownElement.text(this.setTime);
        this.textInput.on('input', this.handleInput.bind(this));
        this.textInput.on('keydown', this.handleKeydown.bind(this));
        $(document).keypress(this.handleKeyPress.bind(this));
        this.paragraphElement.click(() => this.textInput.focus());
        this.textInput.on('focus', () => this.paragraphElement.removeClass('text_input_unfocused'));
        this.textInput.on('blur', () => this.paragraphElement.addClass('text_input_unfocused'));
        this.retryButton.click(this.resetTest.bind(this));
    }

    setupInitialWord() {
        $('.word_container').first().addClass('active');
        this.activeWordsType = $('.word_container.active');
        this.activeText = this.activeWordsType.find('.letter').map(function() {
            return $(this).text();
        }).get();
    }

    handleInput() {
        const currentInput = this.textInput.val().split('');
        this.updateLetterClasses(currentInput);

        if((this.previousInputLength>currentInput.length)&&(currentInput.length+1>this.activeText.length)&&this.previousInputLength!=0){
            $('.word_container.active .letter:last').remove();
        }
        if (!this.started) {
            this.countdownElement.removeClass('hidden');
            this.timer.start();
        }
        this.started = true;
        $('#pointer').removeClass('flash-animation');
        this.calculatePointerPosition(currentInput);
        this.previousInputLength = currentInput.length;
    }
    calculatePointerPosition(currentInput){
        let activeContainer = document.querySelector('.active');
        let x = 0;
        let y = 0;
        if(currentInput.length!=0 && currentInput.length != activeContainer.children.length){
            let activeLetter = activeContainer.children[currentInput.length]
            const relativePosition =this.getRelativePosition(activeContainer,activeLetter);
    
            x = relativePosition.childrenPos.x - relativePosition.containerPos.x;
            y = relativePosition.childrenPos.y - relativePosition.containerPos.y;
            console.log(x/currentInput.length)
            console.log(`Container: ${relativePosition.containerPos.x}, Element: ${relativePosition.elementPos.x}, Children: ${relativePosition.childrenPos.x}`)
        }
        else if(currentInput.length == 0){
            let activeLetter = activeContainer.children[0]
            const relativePosition =this.getRelativePosition(activeContainer,activeLetter);
            x = relativePosition.childrenPos.x - relativePosition.containerPos.x;
            y = relativePosition.childrenPos.y - relativePosition.containerPos.y;
            console.log(`Container: ${relativePosition.containerPos.x}, Element: ${relativePosition.elementPos.x}, Children: ${relativePosition.childrenPos.x}`)
        }
        else{
            let activeLetter = activeContainer.children[currentInput.length-1]
            const relativePosition =this.getRelativePosition(activeContainer,activeLetter);
            x = relativePosition.childrenPos.x - relativePosition.containerPos.x;
            y = relativePosition.childrenPos.y - relativePosition.containerPos.y;
            let xRelativeToParent = parseFloat(relativePosition.childrenPos.x-relativePosition.elementPos.x);
            
            x = x + (xRelativeToParent/currentInput.length-1)

            console.log(`Container: ${relativePosition.containerPos.x}, Element: ${relativePosition.elementPos.x}, Children: ${relativePosition.childrenPos.x}`)

            
        }
        this.movePointerTo(x,y);
    }

    updateLetterClasses(currentInput) {
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
                this.incorrectCounter++;
            }
        });
    }

    handleKeydown(event) {
        if (event.key === " " || event.keyCode === 32) {
            let inputted = this.textInput.val().trim();
            if (inputted !== "") {
                this.totalCharacters += this.activeText.length;
                this.moveToNextWord();
            }
            this.textInput.val('');
            event.preventDefault();
        } else if (event.key === "Enter" || event.keyCode === 13) {
            event.preventDefault(); 
        }
    }

    handleKeyPress(event) {
        const char = String.fromCharCode(event.which);
        if (/^[a-z0-9]$/i.test(char)) {
            this.textInput.focus();
        }
    }

    moveToNextWord() {
        this.currentIndex++;
        $('.word_container').removeClass('active');
        $('.word_container').eq(this.currentIndex).addClass('active');
        this.activeWordsType = $('.word_container.active');
        this.activeText = this.activeWordsType.find('.letter').map(function() {
            return $(this).text();
        }).get();
        this.spaceCounter++;
        const activeELement = document.querySelector('.active')
        const relativePosition = this.getRelativePosition(activeELement);

        let scrollOffset = 0;

        const container = document.querySelector('.paragraph');
        if (relativePosition.elementPos.top - relativePosition.containerPos.top > relativePosition.containerPos.height * 0.6) {
            scrollOffset = relativePosition.containerPos.height / 2;
            container.scrollBy({
                top: scrollOffset,
                behavior: 'smooth'
            });
            let topValue = parseInt($('.pointer-area-field').css('top'), 10);
            $('.pointer-area-field').css(
                'top',topValue + scrollOffset +'px'
            )
        }
        let x = relativePosition.elementPos.x - relativePosition.containerPos.x;
        let y = relativePosition.elementPos.y - relativePosition.containerPos.y - scrollOffset;
        this.movePointerTo(x,y);
    }

    movePointerTo(x,y){
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
        const element = activeELement;
        const container = document.querySelector('.paragraph');
        const elementRect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        if(childrenElement!=null){
            const childrenRect = childrenElement.getBoundingClientRect();
            return {elementPos: elementRect,childrenPos: childrenRect ,containerPos: containerRect}
        }
        else{
            return {elementPos: elementRect, containerPos: containerRect}
        }
    }

    timerDone() {
        this.totalCharacters += this.previousInputLength;
        const correctCount = $('.letter.correct').length;
        const minute = this.setTime / 60;
        let wpm = ((correctCount + this.spaceCounter) / 5) / minute;
        let accuracy = ((this.totalCharacters + this.spaceCounter - this.incorrectCounter) / (this.totalCharacters + this.spaceCounter)) * 100;

        wpm = Math.ceil(wpm);
        accuracy = Math.ceil(accuracy);
        let resultDisplay = $(`
            <div class="wpm_container">
                <h2>${wpm} WPM</h2>
                <br>
                <h2>${accuracy}%</h2>
            </div>
        `);
        this.paragraphElement.html(resultDisplay);
        this.countdownElement.addClass('hidden');
        this.retryButton.focus();
    }

    resetTest() {
        $.ajax({
            url: 'refresh_words/',
            method: 'GET',
            data: {
                'csrfmiddlewaretoken': '{{ csrf_token }}',
            },
            success: (response) => {
                this.paragraphElement.html(response);
                this.resetValues();
            },
            error: function(xhr, status, error) {
                console.error('Error refreshing words:', error);
            }
        });
    }

    resetValues() {
        this.currentIndex = 0;
        this.setupInitialWord();
        this.spaceCounter = 0;
        this.started = false;
        this.totalCharacters = 0;
        this.incorrectCounter = 0;
        this.previousInputLength = 0;
        this.timer.reset();
        this.countdownElement.text(this.setTime).addClass('hidden');
        this.textInput.val('').focus();
        $('#pointer').addClass('flash-animation');
    }
}

$(document).ready(function() {
    const typingTest = new TypingTest('#text_input', '#paragraph', '#counter', '#retry_button', 15);
});
