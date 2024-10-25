function challenge_result_init(){
    $('.challenge-button').on('click',(event)=>{
        if(!$(event.target).hasClass('challenge-button-active')){
            $('.challenge-button.challenge-button-active').removeClass('challenge-button-active');
            $(event.target).addClass('challenge-button-active');
            const button_clicked =  $(event.target).attr('id')
            if(button_clicked == 'result-button-challenge'){
                $('.star-result').removeClass('challenge_result_screen_not_active')
                $('.stat-result').addClass('challenge_result_screen_not_active')
            }
            else{
                $('.stat-result').removeClass('challenge_result_screen_not_active')
                $('.star-result').addClass('challenge_result_screen_not_active')
            }
        }
    });
}