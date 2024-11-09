function profile_init(){
    $('#profile-button').on('click', () => {
        if (user.isAuthenticated) {
            $('#side-panel-container').addClass('side-panel-container-active')
            setTimeout(function() {
                $('#side-panel').addClass('active-side-panel')
                clickOutsideEnabled = true;
            }, 100);
            
        } else {
            window.location.href = loginUrl
        }
    });
    $('#close-button').on('click',()=>{
        $('#side-panel').removeClass('active-side-panel');
        setTimeout(()=>{
            $('#side-panel-container').removeClass('side-panel-container-active');
        },500)
        clickOutsideEnabled = false; // Reset the flag
    })
}