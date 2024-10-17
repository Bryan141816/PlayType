$(document).ready(function() {
    let typingTest = null;
    let timer = null;
    let prev_test_type = null;
    setMode();

    function setMode() {
        if ($('.text-mode.option-active').text() == 'time') {
            timer = new CountdownTimer(parseInt($('.text-button.option-active').text()), '#counter', testDone);
            if(!typingTest){
                typingTest = new TypingTest('#text_input', '#paragraph', '#retry_button', timer, testDone, resetTest, 50, 'time');
            }
            else{
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
                typingTest.updateTimer(timer)
            }

            function resetTest() {
                $('#counter').text('0').removeClass('hidden');
            }
        }
        else if ($('.text-mode.option-active').text() == 'custom') {
            console.log('custom')
            timer = new CountupTimer();
            if(!typingTest){
                typingTest = new TypingTest('#text_input', '#paragraph', '#retry_button', timer, testDone, resetTest, 50, 'custom');
            }
            else{
                typingTest.updateTimer(timer)
            }
            function resetTest() {
                $('#counter').text('0').removeClass('hidden');
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
                    if(prev_test_type == 'custom'){
                        $('#type-selector')
                        .html(` <button class="text-button option-active">15</button>
                                <button class="text-button">30</button>
                                <button class="text-button">60</button>
                                <button class="text-button">120</button>`)
                    }
                    prev_test_type = 'time';
                    $('.edit-custom-sentence-active').removeClass('edit-custom-sentence-active')
                    typingTest.updateWordAmount(50)
                    typingTest.updateTestType('time')
                    timer.reset()
                    break;
                case 'words':
                    if(prev_test_type == 'custom'){
                        $('#type-selector')
                        .html(` <button class="text-button option-active">15</button>
                                <button class="text-button">30</button>
                                <button class="text-button">60</button>
                                <button class="text-button">120</button>`)
                    }
                    prev_test_type = 'words';
                    $('.edit-custom-sentence-active').removeClass('edit-custom-sentence-active')
                    typingTest.updateWordAmount(15)
                    typingTest.updateTestType('words')
                    timer.reset()
                    break;
                case 'custom':
                    $('#type-selector')
                    .html(`<button id="edit-custom-sentence"><i class="fas fa-pen"></i>change</button>`)
                    $('#edit-custom-sentence').on('click',edit_sentence);
                    prev_test_type = 'custom';
                    $('#edit-custom-sentence').addClass('edit-custom-sentence-active')
                    typingTest.updateTestType('custom')
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
                ? (timer.getRemainingTime()) / 60 
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
    function edit_sentence(){
        $('#custom-sentence-modal-container').addClass('custom-sentence-modal-container-active');
        setTimeout(function() {
            clickOutsideEnabled = true;
        }, 0);
    }
    $('#close-button-sentence-modal').on('click', ()=>{
        $('#custom-sentence-modal-container').removeClass('custom-sentence-modal-container-active')
        clickOutsideEnabled = false;
    });
    $('#enter-sentence').on('click',()=>{
        typingTest.resetTest();
        $('#custom-sentence-modal-container').removeClass('custom-sentence-modal-container-active')
        clickOutsideEnabled = false;
    })
});
