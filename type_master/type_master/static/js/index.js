$(document).ready(function() {
    let typingTest = null;
    let timer = null;
    let prev_test_type = null;
    let challenges = null;
    let currentChallenge = null;

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
        else if ($('.text-mode.option-active').text() == 'challenge') {

            if(!typingTest){
                typingTest = new TypingTest('#text_input', '#paragraph', '#retry_button', timer, testDone, resetTest, 50, 'challenge');
            }
            function resetTest() {
                $('#counter').text('0').removeClass('hidden');
            }
        }
        else if ($('.text-mode.option-active').text() == 'custom') {
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
                    else if(prev_test_type == 'challenges'){
                        displayTypeTest()
                        typingTest.updateDocumentSelector('#text_input', '#paragraph', '#retry_button')
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
                    else if(prev_test_type == 'challenges'){
                        displayTypeTest()
                        typingTest.updateDocumentSelector('#text_input', '#paragraph', '#retry_button')

                    }
                    prev_test_type = 'words';
                    $('.edit-custom-sentence-active').removeClass('edit-custom-sentence-active')
                    typingTest.updateWordAmount(15)
                    typingTest.updateTestType('words')
                    timer.reset()
                    break;
                case 'challenge':
                    prev_test_type = 'challenges';
                    timer.reset()
                    getChallanges()
                    typingTest.updateTestType('challenge')
                    break;
                case 'custom':
                    if(prev_test_type == 'challenges'){
                        displayTypeTest()
                        typingTest.updateDocumentSelector('#text_input', '#paragraph', '#retry_button')
                    }
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
    function displayTypeTest(){
        $('#typingtest-container').html(
            `<div id="counter-container">
                <div id="counter" class="hidden"></div>
                <div id="challenge-counter" class="hidden">10</div>
            </div>
            <div class="paragraph" id="paragraph">
                <div class="pointer-area-field">
                    <div id="pointer" class="flash-animation"></div>
                </div>
                <div id="paragraph-container">
                </div>
            </div>
            <input type="text" id="text_input">
            <button id="retry_button">
                <i class="fas fa-redo"></i>
            </button>`
        )
        
    }

    function getChallanges(){

        $.get(challenges_url)
            .done((response)=>{
                $('#typingtest-container').html(response)
                addChallengesListener()
            })
        fetch(challenge_json_url)
            .then(response => {
                if (!response.ok) {
                throw new Error('Network response was not ok');
                }
                return response.text(); 
            })
            .then(data => {
                challenges = JSON.parse(data);
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
            });

    }

    function addChallengesListener(){
        $('.option-card').on('click', (event) => {
            const challenge_selected = challenges[$(event.target).index()]
            currentChallenge = challenge_selected;
            displayTypeTest()
            typingTest.updateDocumentSelector('#text_input', '#paragraph', '#retry_button')
            typingTest.updateWordAmount(challenge_selected.word_amount)
            typingTest.updateTestDone(testDone_challenge)
            timer = new CountdownTimer(challenge_selected.time, '#challenge-counter', testDone_challenge);
            typingTest.updateTimer(timer)
        });
    }
    


    function testDone() {
        typingTest.test_finished = true;
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
            }, ((index+1) * 100));
        });

        $('#counter').addClass('hidden');
    }
    function testDone_challenge(origin) {
        typingTest.changeTestFinishedStat(true)
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
        
        if(origin == 'typetest'){  
            if(accuracy<=0){
                wpm = '0'
                accuracy = '0'
                stat = 'invalid'
            }
            let resultDisplay = $(`
                <div class="wpm_container">
                    <div id="result-container">
                        <span>Challenge Completed</span>
                        <div id="challenge-stat-result"><button id="result-button-challenge" class="challenge-button challenge-button-active">Result</button><button id="stat-button-challenge" class="challenge-button">Stat</button></div>
                        <div class="star-result">
                            <i class="fas fa-star result-star-1"></i>
                            <p class="result-star-1">Complete the challenge with an accuracy of 40%</p>
                            <i class="fas fa-star result-star-2"></i>
                            <p class="result-star-2">Complete the challenge with an accuracy of 55%</p>
                            <i class="fas fa-star result-star-3"></i>
                            <p class="result-star-3">Complete the challenge with an accuracy of 70%</p>
                        </div>
                        <div class="stat-result challenge_result_screen_not_active">
                            <ul>
                                <li><span>level:</span>${currentChallenge.level_number}</li>
                                <li><span>difficulty:</span>${currentChallenge.difficulty}</li>
                                <li><span>time:</span>${timer.formatMinutesAndSeconds(currentChallenge.time)}</li>
                            </ul>
                            <ul>
                                <li><span>wpm:</span> ${wpm}</li>
                                <li><span>accuracy:</span> ${accuracy}</li>
                                <li><span>cor/mis/ex:</span> ${stat}</li>
                            </ul>
                        </div>
                    </div>
                </div>
                `);
                
            $('#paragraph').html(resultDisplay);
            let star_array = null;
            if(accuracy >= 40 && accuracy < 55){
                star_array = [$('.result-star-1')]
            }
            else if(accuracy >= 55 && accuracy < 70){
                star_array = [$('.result-star-1'),$('.result-star-2')]
            }
            else if(accuracy >= 70 && accuracy <= 100){
                star_array = [$('.result-star-1'),$('.result-star-2'),$('.result-star-3')]
            }
            star_array.forEach((element, index) => {
                setTimeout(() => {
                    element.each((index, el)=>{
                        $(el).addClass('result-star-achieved')
                    })
                }, ((index+1) * 200));
            });


            
            // const blockers = $('.blocker');
            
            // blockers.each((index, blocker) => {
            //     setTimeout(() => {
            //         $(blocker).addClass('blocker-hide');
            //     }, ((index+1) * 100));
            // });
            challenge_result_init()
        }
        else{
            let resultDisplay = $(`
                <div class="wpm_container">
                    <div id="result-container">
                        <span class="failed-challenge">Challenge Failed</span>
                        <p>You ran out of time to finish the challenge.</p>
                    </div>
                </div>
                `);
                
            $('#paragraph').html(resultDisplay);
        }
            
        $('#counter').addClass('hidden');
        $('#challenge-counter').addClass('hidden')
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
