function setMode() {
    const activeMode = $('.text-mode.option-active').text();
    timer = (activeMode === 'time') ? new CountdownTimer(parseInt($('.text-button.option-active').text()), '#counter', testDone)
           : (activeMode === 'words' || activeMode === 'custom') ? new CountupTimer()
           : null;

    if (!typingTest) {
        typingTest = new TypingTest('#text_input', '#paragraph', '#retry_button', timer, testDone, resetTest, 50, activeMode);
    } else {
        typingTest.updateTimer(timer);
    }

    function resetTest() {
        const counterValue = (activeMode === 'time') ? parseInt($('.text-button.option-active').text()) : '0';
        $('#counter').text(counterValue).removeClass('hidden');
    }
}
