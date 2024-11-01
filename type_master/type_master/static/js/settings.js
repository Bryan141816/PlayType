function settings_init(){
    clickOutsideEnabled = false;
    $('#close-button-settings-modal').click(function(){
        $('#settings-modal-container').removeClass('settings-modal-container-active')
        clickOutsideEnabled = false;
    });
    let currentTheme = lazychameleon.getStoredTheme(); 
    $(`#${currentTheme}`).addClass('active-theme')

    $('section.theme-selector-option').on('click',(event)=>{
        if (!$(event.target).hasClass('active-theme')) {
            $('.theme-selector-option.active-theme').removeClass('active-theme');
            $(event.target).addClass('active-theme');
            let selectedTheme = $(event.target).text().toLowerCase().trim();
            lazychameleon.setTheme(selectedTheme);
            lazychameleon.sendChangeThemeEvent(selectedTheme)
            updateUserSettings(selectedTheme);
        }
    });

    $('section.theme-selector-option').hover(
        function() {
            let selectedTheme = $(event.target).text().toLowerCase().trim();
            lazychameleon.setTheme(selectedTheme);
        },
        function() {
            let currentTheme = $('section.theme-selector-option.active-theme').text().toLowerCase().trim();
            lazychameleon.setTheme(currentTheme);
        }
    )
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
        console.log('hello')
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

}