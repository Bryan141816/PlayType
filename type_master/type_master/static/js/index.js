$(document).ready(function() {
    let typingTest = null;
    let timer = null;
    let prev_test_type = null;
    let challenges = null;
    let currentChallenge = null;
    let localUserSettings = null;
    let star_array = [];
    let testStarted = false;

    loadAndSetUserSettingsDefaultByLocalAndOnlineDB()
    addTextButtonClickListener()

    function setMode() {
        const activeMode = $('.text-mode.option-active').text();
        const activeTime = parseInt($('.text-button.option-active').text());
        let word_amount = 50;
        if(localUserSettings && activeMode === 'words'){
            word_amount = localUserSettings.word_amount_selected;
        }
        else if(localUserSettings && activeMode === 'time'){
            word_amount = calculateWordAmountByTime(localUserSettings.time_selected);
        }
    
        function resetTest(initialValue = '0') {
            $('#counter').text(initialValue).addClass('hidden');
        }
    
        function initializeTypingTest(timer, doneCallback, mode) {
            if (!typingTest) {
                typingTest = new TypingTest('#text_input', '#paragraph', '#retry_button', timer, doneCallback, resetTest,word_amount, mode, testStatusCallBack);
                if(mode === 'custom'){
                    typingTest.useCustomSentence();
                }
            } else {
                typingTest.updateTimer(timer);
            }
        }
    
        if (activeMode === 'time') {
            timer = new CountdownTimer(activeTime, '#counter', testDone, activeMode);
            initializeTypingTest(timer, testDone, 'time');
            resetTest(activeTime);
        } else if (activeMode === 'words' || activeMode === 'custom') {
            timer = new CountupTimer();
            initializeTypingTest(timer, testDone, activeMode, activeMode);
            resetTest();
        } else if (activeMode === 'challenge') {
            timer = new CountdownTimer(activeTime, '#counter', testDone, activeMode);
            initializeTypingTest(timer, testDone, 'challenge');
            resetTest();
        }
    }

    function testStatusCallBack(isStarted){
        if(isStarted){
            if(!($('#option-selector').hasClass('testStartedHidder')))
            {
                $('#option-selector').addClass('testStartedHidder')
                $('.tap-bar-button').addClass('testStartedHidder')
                $('#profile_image').addClass('testStartedHidder')
                $('#logo-image').addClass('testStartedHidderImage')
                $('body').css('cursor', 'none'); 
                testStarted = true;
            }
        }
        else{
            $('#option-selector').removeClass('testStartedHidder')
            $('.tap-bar-button').removeClass('testStartedHidder')
            $('#profile_image').removeClass('testStartedHidder')
            $('#logo-image').removeClass('testStartedHidderImage')
            $('body').css('cursor', 'auto'); 
            testStarted = false;
        }
    }
    $(document).on('mousemove', function() {
        if(testStarted){
            $('body').css('cursor', 'auto');
            testStatusCallBack(false)
        }
    });

    function checkOrCreateLocalUserSettings(userSettingsData, callback) {
        openDatabaseAndHandleUserSettings(userSettingsData)
            .then(result => {
                if (result) {
                    callback(result); // Pass result to the callback
                } else {
                    console.error('Result is undefined or null');
                }
            })
            .catch(error => {
                console.error('Error occurred: ' + error);
            });
    }
    
    function loadAndSetUserSettingsDefaultByLocalAndOnlineDB() {
        if (user.isAuthenticated) {
            checkOrCreateLocalUserSettings(userSettings, setUserSettings);
        } else {
            const userSettings = { user: 'local' }; 
            checkOrCreateLocalUserSettings(userSettings, setUserSettings);
        }
    }
    
    function setUserSettings(data) {
        localUserSettings = data;
        $('.text-mode.option-active').removeClass('option-active');
        $('.text-button.option-active').removeClass('option-active');
        $(`#text-mode-${localUserSettings.mode_used}`).addClass('option-active');
        
        if (localUserSettings.mode_used === 'time') {
            $(`#text-button-${localUserSettings.time_selected}`).addClass('option-active');
        } else if (localUserSettings.mode_used === 'words') {
            $(`#text-button-${localUserSettings.word_amount_selected}`).addClass('option-active');
        }
        $('#sentence-text').val(data.custome_sentence);
        settings_init(data)
        profile_init()
        setMode();
    }
    function calculateWordAmountByTime(time){
        let word_amount = 0;
        switch (time) {
            case 15:
                word_amount = 50;
                break;
            case 30:
                word_amount = 70;
                break;
            case 60:
                word_amount = 100;
                break;
            case 120:
                word_amount = 200;
                break;
        }
        return word_amount;
    }
    
    function addTextButtonClickListener(){
        $('button.text-button').on('click', (event) => {
    
            if (!$(event.target).hasClass('option-active')) {
                $('.text-button.option-active').removeClass('option-active');
                $(event.target).addClass('option-active');
    
                if ($('.text-mode.option-active').text() == 'time') {
                    const targetTime = parseInt($(event.target).text());
                    const word_amount = calculateWordAmountByTime(targetTime)
                    typingTest.updateWordAmount(word_amount);
                    timer.update(targetTime);
                    typingTest.resetTest('time selector');
                    if(user.isAuthenticated){
                        updateUserSettings(null,null, targetTime);
                        updateLocalUserSettings(localUserSettings.user,null,null, targetTime);
                    }else{
                        updateLocalUserSettings(localUserSettings.user,null,null, targetTime);
                    }
                }
                else if($('.text-mode.option-active').text() == 'words'){
                    const targetAmount = parseInt($(event.target).text());
                    if(targetAmount<=120){
                        typingTest.updateWordAmount(targetAmount)
                        typingTest.resetTest('words amount selector')
                    }
                    if(user.isAuthenticated){
                        updateUserSettings(null,null, null, targetAmount);
                        updateLocalUserSettings(localUserSettings.user,null,null, null, targetAmount);
                    }
                    else{
                        updateLocalUserSettings(localUserSettings.user,null,null, null, targetAmount);
                    }
                }
            }
        });
    }
    function setTextButtonActive(data){
        const selected_mode = $('.text-mode.option-active').text();
        if(selected_mode === 'time'){
            $(`#text-button-${data.time_selected}`).addClass('option-active')
            typingTest.updateWordAmount(calculateWordAmountByTime(data.time_selected));
            timer.update(data.time_selected);
        }
        else if(selected_mode === 'words'){
            $(`#text-button-${data.word_amount_selected}`).addClass('option-active')
            typingTest.updateWordAmount(data.word_amount_selected);
        }
        typingTest.resetTest(`${selected_mode} button active`)
    }

    $('button.text-mode').on('click', (event) => {
        if (!$(event.target).hasClass('option-active')) {
            $('.text-mode.option-active').removeClass('option-active');
            $('.text-button.option-active').removeClass('option-active');

            $(event.target).addClass('option-active');
            if(timer){
                timer.stop()
            }
            const selected_mode = $(event.target).text();

            switch(selected_mode){
                case 'time':
                    if(prev_test_type == 'custom'){
                        reInsertTimeWordSelector()
                        optionBoxResizeTransition()
                    }

                    else if(prev_test_type == 'challenge'){
                        reInsertTimeWordSelector()
                        $('#option-separator')
                            .css({
                                'display': 'flex',
                            });
                        optionBoxResizeTransition()
                        displayTypeTest()
                        typingTest.updateDocumentSelector('#text_input', '#paragraph', '#retry_button')
                    }

                    modeValueChanger(selected_mode)
                    break;
                case 'words':
                    
                    if(prev_test_type == 'custom'){
                        reInsertTimeWordSelector()
                        optionBoxResizeTransition()
                    }
                    else if(prev_test_type == 'challenge'){
                        reInsertTimeWordSelector()
                        $('#option-separator')
                            .css({
                                'display': 'flex',
                            });
                        optionBoxResizeTransition()
                        displayTypeTest()
                        typingTest.updateDocumentSelector('#text_input', '#paragraph', '#retry_button')
                    }

                    modeValueChanger(selected_mode)
                    break;
                case 'challenge':
                    $('#type-selector').html('')
                    $('#option-separator')
                        .css({
                            'display': 'none',
                        });
                    optionBoxResizeTransition()
                    getChallanges()
                    modeValueChanger(selected_mode)
                    break;
                case 'custom':

                    if(prev_test_type == 'challenge'){
                        $('#option-separator')
                            .css({
                                'display': 'flex',
                            });
                        optionBoxResizeTransition()
                        displayTypeTest()
                        typingTest.updateDocumentSelector('#text_input', '#paragraph', '#retry_button')
                    }

                    $('#type-selector')
                        .html(`<button id="edit-custom-sentence"><i class="fas fa-pen"></i>change</button>`)
                        $('#edit-custom-sentence').on('click',edit_sentence);
                    optionBoxResizeTransition()
                    modeValueChanger(selected_mode)
                    break;
            }
            if(user.isAuthenticated){
                updateUserSettings(null,selected_mode);
            }
            else{
                updateLocalUserSettings(localUserSettings.user, null,selected_mode)
            }
            getLocalUserSettings(localUserSettings.user, setTextButtonActive)
            setMode()
        }

        function reInsertTimeWordSelector(){
            $('#type-selector')
            .html(` <button class="text-button" id="text-button-15">15</button>
                    <button class="text-button" id="text-button-30">30</button>
                    <button class="text-button" id="text-button-60">60</button>
                    <button class="text-button" id="text-button-120">120</button>`
                )
            addTextButtonClickListener()
        }
        function modeValueChanger(type){ 
             
            prev_test_type = type;
            timer.updateTestType(type)
            typingTest.updateTestType(type)
            timer.reset()
        }
        function edit_sentence(){
            $('#custom-sentence-modal-container').addClass('custom-sentence-modal-container-active');
            setTimeout(function() {
                clickOutsideEnabled = true;
            }, 0);
        }
    });

    function displayTypeTest(){
        $('#typingtest-container').html(
            `<div id="counter-container">
                <div id="warning-text" class="hidden"><i class="fas fa-lock"></i> Caps Lock</div>
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
            <input type="text" id="text_input" spellcheck="false" autocomplete="off" autocomplete="off" autocapitalize="off" autocorrect="off" data-gramm="false" data-gramm_editor="false" data-enable-grammarly="false" list="autocompleteOff" spellcheck="false">
            <button id="retry_button">
                <i class="fas fa-redo"></i>
            </button>`
        )      
    }   
    function getChallanges(){
        fetch(challenge_json_url)
            .then(response => {
                if (!response.ok) {
                throw new Error('Network response was not ok');
                }
                return response.text(); 
            })
            .then(data => {
                challenges = JSON.parse(data);
                populateChallenge()
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
            });
            function populateChallenge(){
                getLocalUserSettings(localUserSettings.user, setChallengeStars)
                const typingTestContainer = $('#typingtest-container');
                typingTestContainer.html(
                    `<div id="challenges-level-container">  
                        <button id="challenge-level-changer-left"><i class="fas fa-caret-left"></i></button>
                        <div id="easy-challenge-container" class="difficulty-container difficulty-active"></div>
                        <div id="medium-challenge-container" class="difficulty-container"></div>
                        <div id="hard-challenge-container" class="difficulty-container"></div>
                        <button id="challenge-level-changer-right" class="challenge-level-changer-active"><i class="fas fa-caret-right"></i></button>
                    </div>`
                );
                challenges.forEach((level, index)=>{
                    const card_template = 
                            `<div class="option-card" id="card-${index+1}">
                                <input type="hidden" class="index" value="${index}">
                                <div class="card-content">
                                    <h3 class="${level.difficulty}-text">${index+1}</h3>
                                    <span class="stars">
                                        <i class="fas fa-star challenge-star"></i>
                                        <i class="fas fa-star challenge-star"></i>
                                        <i class="fas fa-star challenge-star"></i>
                                    </span>
                                    <div class="description-card">
                                        <p class="description-sentence">${level.description}</p>
                                    </div>
                                </div>
                            </div>`
                    $(`#${level.difficulty}-challenge-container`).append(card_template);
                });
                addChallengesListener()
        
            }
            function setChallengeStars(data){
                const history = [...data.challenge_achieved]
                $('.challenge-star.stars-active').removeClass('stars-active')
                history.forEach((item, index)=>{
                    const currentCard = $('.option-card').eq(index)
                    for(let i = 0; i<item; i++){
                        setTimeout(()=>{
                            currentCard.find('.challenge-star').eq(i).addClass('stars-active')
                        },(i+1)*100)
                    }
                })
            }
            function addChallengesListener(){
                challengeLevelChangerHandle()
                $('.option-card').on('click', (event) => {
                    const target = $(event.currentTarget);
                    const challenge_selected = challenges[parseInt((target.find('.index')).val())]
                    currentChallenge = challenge_selected;
                    displayTypeTest()
                    typingTest.updateDocumentSelector('#text_input', '#paragraph', '#retry_button')
                    typingTest.updateWordAmount(challenge_selected.word_amount)
                    timer = new CountdownTimer(challenge_selected.time, '#challenge-counter', testDone, "challenge");
                    typingTest.updateTimer(timer)
                    typingTest.resetTest('option card')
                });
            }
        
            function challengeLevelChangerHandle(){
                let challenge_level_index = 0;
                $('#challenge-level-changer-left').on('click',()=>{
                    if(challenge_level_index>0){
                        challenge_level_index--;
                        $('.difficulty-container.difficulty-active').removeClass('difficulty-active')
                        const new_active_difficulty = $('.difficulty-container').eq(challenge_level_index);
                        new_active_difficulty.addClass('difficulty-active')
                        
                    }
                    if(challenge_level_index == 1){
                        $('#challenge-level-changer-right').addClass('challenge-level-changer-active')
                    }
                    else if(challenge_level_index == 0){
                        $('#challenge-level-changer-left').removeClass('challenge-level-changer-active')
                    }
                    getLocalUserSettings(localUserSettings.user, setChallengeStars)
                })
                $('#challenge-level-changer-right').on('click',()=>{
                    if(challenge_level_index<3){
                        challenge_level_index++;
                        $('.difficulty-container.difficulty-active').removeClass('difficulty-active')
                        const new_active_difficulty = $('.difficulty-container').eq(challenge_level_index);
                        new_active_difficulty.addClass('difficulty-active')
                    }
                    if(challenge_level_index == 1){
                        $('#challenge-level-changer-left').addClass('challenge-level-changer-active')
                    }
                    else if(challenge_level_index == 2){
                        $('#challenge-level-changer-right').removeClass('challenge-level-changer-active')
                    }
                    getLocalUserSettings(localUserSettings.user, setChallengeStars)
                })
            }
            
    }



    function testDone(type, origin=null) {
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
        let resultDisplay = null;
        if(!(type === 'challenge')){

            resultDisplay = $(`
                <ins class="adsbygoogle"
                    style="display:block; height: 100px"
                    data-ad-client="ca-pub-8110498301533293"
                    data-ad-slot="8493252080"
                    data-ad-format="auto"
                    data-full-width-responsive="true"></ins>
                    <div class="wpm_container">
                    <div>
                    <div class="blocker" id="blocker1"></div>
                    <h2>${wpm}</h2>
                    <h3>wpm</h3>
                    </div>
                    <div>
                    <div class="blocker" id="blocker2"></div>
                    <h2>${accuracy}%</h2>
                    <h3>acc</h3>
                    </div>
                    <div>
                    <div class="blocker" id="blocker3"></div>
                    <h2>${stat}</h2>
                    <h3>cor/mis/ex</h3>
                    </div>
                    </div>
            `);
            const activeMode = $('.text-mode.option-active').text();
            const activeType = parseInt($('.text-button.option-active').text());

            const formData = {
              wpm: wpm,
              accuracy: accuracy,
              cormisex: stat,
              mode: activeMode,
              type: activeType,
            };
            $.ajax({
                url: '/user/test/history', // The URL where Django expects the request
                type: 'POST',
                contentType: 'application/x-www-form-urlencoded', // Data type
                data: formData,
                beforeSend: function(xhr, settings) {
                    // Include CSRF token if needed
                    xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
                },
                success: function (response) {
                  if(response.bpr){
                    let icon = '<i class="fas fa-crown"></i>'
                    showNotification(icon, 'Notification' ,response.message)
                    $('body').append(response.confitte);
                    setTimeout(()=>{
                        $('.confetti-wrapper').remove()
                    },5000)
                  }
                },
                error: function (xhr, status, error) {
                  console.log(error)
                }
              });
        }
        else{
            if(origin === 'TypingTest' && accuracy >=40){ 
                getLocalUserSettings(localUserSettings.user, addChallengeHistory)
                resultDisplay = $(`
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
                 
            }
            else{
                let reasonForFailure = "You ran out of time to finish the challenge.";
                if(accuracy<40){
                    reasonForFailure = "Your accuracy doesn't meet the challenge requirements."
                }
                resultDisplay = $(`
                                <div class="wpm_container">
                                    <div id="result-container">
                                        <span class="failed-challenge">Challenge Failed</span>
                                        <p>${reasonForFailure}</p>
                                    </div>
                                </div>
                                `);
            }
        }
        $('#paragraph').html(resultDisplay);
        setTimeout(()=>{
            (adsbygoogle = window.adsbygoogle || []).push({});
        },20)
        if(type === "challenge"){
            if(accuracy>=40){
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
            }
            challenge_result_init()

        }
        $('#counter').addClass('hidden');
        $('#challenge-counter').addClass('hidden')
    }
    function addChallengeHistory(data){
        let challengeHistory =  [...data.challenge_achieved];
        const challengeIndex = (currentChallenge.level_number)-1
        if(star_array.length > challengeHistory[challengeIndex]){
            challengeHistory[challengeIndex] = star_array.length 
        }
        if(user.isAuthenticated){
            updateUserSettings(null,null, null, null, challengeHistory)
            updateLocalUserSettings(localUserSettings.user,null,null, null, null, challengeHistory);
        }
        else{
            updateLocalUserSettings(localUserSettings.user,null,null, null, null, challengeHistory);
        }
    }


    $('#close-button-sentence-modal').on('click', ()=>{
        $('#custom-sentence-modal-container').removeClass('custom-sentence-modal-container-active')
        clickOutsideEnabled = false;
    });
    $('#enter-sentence').on('click',()=>{
        typingTest.resetTest();
        let sentence = $('#sentence-text').val().trim();
        if(user.isAuthenticated){
            updateUserSettings(null,null, null, null, null, sentence);
            updateLocalUserSettings(localUserSettings.user,null,null, null, null, null, sentence);
        }
        else{
            updateLocalUserSettings(localUserSettings.user,null,null, null, null, null, sentence);
        }
        $('#custom-sentence-modal-container').removeClass('custom-sentence-modal-container-active')
        clickOutsideEnabled = false;
    })
    setTimeout(()=>{
        optionBoxResizeTransition()
    },500)
    document.onreadystatechange = () => {
      if (document.readyState === "complete") {
      }
    };
});