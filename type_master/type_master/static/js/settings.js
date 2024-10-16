function settings_init(){
    $('#close-button-settings-modal').click(function(){
        $('#settings-modal-container').removeClass('settings-modal-container-active')
    });
    let currentTheme = lazychameleon.getStoredTheme(); 
    $(`.${currentTheme}`).first().addClass('active-theme')

    $('section.theme-selector-option').on('click',(event)=>{
        if (!$(event.target).hasClass('active-theme')) {
            $('.theme-selector-option.active-theme').removeClass('active-theme');
            $(event.target).addClass('active-theme');
            let selectedTheme = $(event.target).text().toLowerCase().trim();
            lazychameleon.setTheme(selectedTheme);
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

}