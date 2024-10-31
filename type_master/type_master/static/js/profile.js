function profile_init(){
    clickOutsideEnabled = false;
    $('#profile-button').on('click', () => {
        if (user.isAuthenticated) {
            $.get(showProfileUrl, function(data) {
                $('#side-panel-container').append(data);
                $('#side-panel').addClass('active-side-panel')
                $('#side-panel-container').addClass('side-panel-container-active')
                $('#close-button').on('click',()=>{
                    $("#side-panel-container").removeClass('side-panel-container-active')
                    $('#side-panel').removeClass('active-side-panel')
                    $('#side-panel').addClass('slide-out')
                    setTimeout(function(){
                        $('#side-panel').remove()
                    },500)
                    
                })
            });

        } else {
            window.location.href = loginUrl
        }
    });
}