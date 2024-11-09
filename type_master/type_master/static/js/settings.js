function settings_init(data){
    clickOutsideEnabled = false;
    $('#close-button-settings-modal').click(function(){
        $('#settings-modal-container').removeClass('settings-modal-container-active')
        clickOutsideEnabled = false;
    });
    let currentTheme = lazychameleon.getStoredTheme(); 
    let aspectRatio = null;

    setUserSettingsInSettingsModal()
    function setUserSettingsInSettingsModal(){
        $(`#${currentTheme}`).addClass('active-settings-option')
        $(`#font-size-selector option[value="${data.font_size}"]`).prop('selected', true);
        $(`#font-family option[value="${data.font_family}"]`).prop('selected', true);
        $('html').css('--test-font-size', data.font_size);
        $('html').css('--font-family', data.font_family);
        aspectRatio = window.innerWidth / window.innerHeight;
        if(aspectRatio > 2.1){
            $('.not-active').removeClass('not-active')
            $(`#ultra-wide-${data.ultra_wide_config}`).addClass('active-settings-option')
            if(data.ultra_wide_config === 'center'){
                $('html').css('--display-width', '2200px');
            }
            else if(data.ultra_wide_config === 'stretch'){
                $('html').css('--display-width', '100%');
            }
        }
    }


    $('section.theme-selector-option').on('click',(event)=>{
        if (!$(event.target).hasClass('active-settings-option')) {
            $('.theme-selector-option.active-settings-option').removeClass('active-settings-option');
            $(event.target).addClass('active-settings-option');
            let selectedTheme = $(event.target).text().toLowerCase().trim();
            lazychameleon.setTheme(selectedTheme);
            lazychameleon.sendChangeThemeEvent(selectedTheme)
            if(user.isAuthenticated){
                updateUserSettings(selectedTheme);
            }
        }
    });
    $('section.display-mode-selector').on('click', (event)=>{
        if(aspectRatio >2.1){
            if(!$(event.target).hasClass('active-settings-option')){
                $('section.display-mode-selector.active-settings-option').removeClass('active-settings-option')
                $(event.target).addClass('active-settings-option')
                if($(event.target).attr("id") === "ultra-wide-center"){
                    $('html').css('--display-width', '2200px');
                    updateLocalUserSettings(data.user, null, null, null, null, null, null, 'center')
                    if(user.isAuthenticated){
                        updateUserSettings(null, null, null, null, null, null, 'center');
                    }
                }
                else if($(event.target).attr("id") === "ultra-wide-stretch"){
                    $('html').css('--display-width', '100%');
                    updateLocalUserSettings(data.user, null, null, null, null, null, null, 'stretch')
                    if(user.isAuthenticated){
                        updateUserSettings(null, null, null, null, null, null, 'stretch');
                    }
                }
            }
        }
    })
    $('#font-family').on('change', function() {
        const fontfamily = $(this).val();
        $('html').css('--font-family', fontfamily);
        $('*').addClass('font-change');
        setTimeout(()=>{
            $('*').removeClass('font-change');
        },500)
        console.log($('#apperance-option').outerHeight())

        updateLocalUserSettings(data.user,null, null, null, null, null, null, null,null, fontfamily);
        if(user.isAuthenticated){
            updateUserSettings(null, null, null, null, null, null, null, null, fontfamily);
        }

        setTimeout(()=>{
            optionBoxResizeTransition()
        },100)

    });
    $('#font-size-selector').on('change', function() {
        const fontSizeSelected = $(this).val();
        $('html').css('--test-font-size', fontSizeSelected);
        updateLocalUserSettings(data.user,null, null, null, null, null, null, null, fontSizeSelected);
        if(user.isAuthenticated){
            updateUserSettings(null, null, null, null, null, null, null, fontSizeSelected);
        }
    });
    $('.settings-tab-link').on('click',(event)=>{
        event.preventDefault()
        if(!$(event.target).hasClass('setting-tab-active')){
            $('.settings-tab-link.setting-tab-active').removeClass('setting-tab-active');
            $(event.target).addClass('setting-tab-active')
            $('.settings-content-container.active-settings-content').removeClass('active-settings-content')
            if($(event.target).attr('id')==="general-option"){
                $('#general-container').addClass('active-settings-content')
            }
            else if($(event.target).attr('id')==="apperance-option"){
                $('#apperance-container').addClass('active-settings-content')
            }
        }
    })

    $('#settings-button').click(function(){
        $('#settings-modal-container').addClass('settings-modal-container-active')
        setTimeout(function() {
            clickOutsideEnabled = true;
        }, 0);
    });

    $('#theme-change').click(function() {
        if ($(this).hasClass('dark')) {
            $(this).removeClass('dark');
            $(this).addClass('light');
            lazychameleon.setTheme('light')
        } else if ($(this).hasClass('light')) {
            $(this).removeClass('light');
            $(this).addClass('dark');
            lazychameleon.setTheme('dark')
        }
    });

    window.addEventListener('resize', function() {
        aspectRatio = window.innerWidth / window.innerHeight;
        if(aspectRatio > 2.1){
            $('.not-active').removeClass('not-active')
            getLocalUserSettings(data.user, setUltraWideConfig)
        }
        else{
            $('.ultra-wide-mode').addClass("not-active")
            $('section.display-mode-selector.active-settings-option').removeClass('active-settings-option')
        }
    });
    function setUltraWideConfig(data){
        $(`#ultra-wide-${data.ultra_wide_config}`).addClass('active-settings-option')
        if(data.ultra_wide_config === 'center'){
            $('html').css('--display-width', '2200px');
        }
        else if(data.ultra_wide_config === 'stretch'){
            $('html').css('--display-width', '100%');
        }
    }

}