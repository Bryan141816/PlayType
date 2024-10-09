$(document).ready(function() {
    let typingTest = null;
    let timer = null;
    setMode();

    function setMode() {
        if ($('.text-mode.option-active').text() == 'time') {
            timer = new CountdownTimer(parseInt($('.text-button.option-active').text()), '#counter', testDone);
            if(!typingTest){
                typingTest = new TypingTest('#text_input', '#paragraph', '#retry_button', timer, testDone, resetTest, 50, 'time');
            }
            else{
                console.log('1')
                typingTest.updateTimer(timer)
            }

            function resetTest() {
                $('#counter').text(parseInt($('.text-button.option-active').text())).removeClass('hidden');
            }
        } else if ($('.text-mode.option-active').text() == 'words') {
            timer = new CountupTimer();
            if(!typingTest){
                typingTest = new TypingTest('#text_input', '#paragraph', '#retry_button', timer, testDone, resetTest, 50, 'words');
            }
            else{
                console.log('2')
                typingTest.updateTimer(timer)
            }

            function resetTest() {
                $('#counter').text('0').removeClass('hidden'); // Reset for count-up mode
            }
        }
    }

    $('button.text-button').on('click', (event) => {
        if (!$(event.target).hasClass('option-active')) {
            $('.text-button.option-active').removeClass('option-active');
            $(event.target).addClass('option-active');

            if ($('.text-mode.option-active').text() == 'time') {
                const targetTime = parseInt($(event.target).text());
                switch (targetTime) {
                    case 15:
                        typingTest.updateWordAmount(50);
                        break;
                    case 30:
                        typingTest.updateWordAmount(70);
                        break;
                    case 60:
                        typingTest.updateWordAmount(100);
                        break;
                    case 120:
                        typingTest.updateWordAmount(200);
                        break;
                }
                timer.update(targetTime);
                typingTest.resetTest();
            }
            else if($('.text-mode.option-active').text() == 'words'){
                const targetAmount = parseInt($(event.target).text());
                if(targetAmount<=120){
                    typingTest.updateWordAmount(targetAmount)
                }
                typingTest.resetTest();
            }
        }
    });

    $('button.text-mode').on('click', (event) => {
        if (!$(event.target).hasClass('option-active')) {
            $('.text-mode.option-active').removeClass('option-active');
            $('.text-button.option-active').removeClass('option-active');
            $('.text-button').first().addClass('option-active');
            $(event.target).addClass('option-active');
            if(timer){
                timer.stop()
            }
            switch($(event.target).text()){
                case 'time':
                    typingTest.updateWordAmount(50)
                    typingTest.updateTestType('time')
                    timer.reset()
                    break;
                case 'words':
                    typingTest.updateWordAmount(15)
                    typingTest.updateTestType('words')
                    timer.reset()
                    break;
            }
            setMode()
        }
    });

    function testDone() {
        const resultData = typingTest.requestResultData();
        resultData.totalCharacters += resultData.previousInputLength;
        const correctCount = $('.letter.correct').length;

        const minute = (timer instanceof CountdownTimer)
            ? (timer.original_time - timer.getRemainingTime()) / 60
            : (timer instanceof CountupTimer)
                ? (timer.getRemainingTime()) / 60 // Change to getElapsedTime for CountupTimer
                : null;

        let wpm = ((correctCount + resultData.spaceCounter) / 5) / minute;
        let accuracy = ((resultData.totalCharacters + resultData.spaceCounter - (resultData.incorrectCounter + resultData.extraLetterCounter)) / (resultData.totalCharacters + resultData.spaceCounter)) * 100;
        wpm = Math.ceil(wpm);
        accuracy = Math.ceil(accuracy);
        let stat = `${correctCount}/${resultData.incorrectCounter}/${resultData.extraLetterCounter}`
        if(accuracy<=0){
            wpm = '0'
            accuracy = '0'
            stat = 'invalid'
        }
        else{
            
        }
        
        let resultDisplay = $(`
            <div class="wpm_container">
            <div>
            <div class="blocker"></div>
            <h2>${wpm}</h2>
            <h3>wpm</h3>
            </div>
            <div>
            <div class="blocker"></div>
            <h2>${accuracy}%</h2>
            <h3>acc</h3>
            </div>
            <div>
            <div class="blocker"></div>
            <h2>${stat}</h2>
            <h3>cor/mis/ex</h3>
            </div>
            </div>
        `);

        $('#paragraph').html(resultDisplay);

        const blockers = $('.blocker');

        blockers.each((index, blocker) => {
            setTimeout(() => {
                $(blocker).addClass('blocker-hide');
            }, index * 100);
        });

        $('#counter').addClass('hidden');
    }
});
