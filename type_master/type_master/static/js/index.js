$(document).ready(function() {
    var current_index = 0

    $('.words_type').first().addClass('active');

    $('#type_text').on('input', function() {
            $('.active').removeClass('wrong')
            const current_input = $(this).val().split('');
            const active_text = ($('.active').text()).split('');
    
            current_input.forEach(function(value, index) {
                // Make sure to check if index exists in active_text
                if (index < active_text.length) {
                    if(current_input[index] != active_text[index]){
                        $('.active').addClass('wrong')
                    }
                }
                else{
                    $('.active').addClass('wrong')
                }
            });
        
    });

    $('#type_text').on('keydown', function(event) {
        if (event.key === " " || event.keyCode === 32) {
            var inputed = $(this).val().trim()
            if( inputed==""){
                console.log("all empty")
            }
            else{
                if($('.active').text() == inputed){
                    $('.active').addClass('correct')
                }
                else{
                    $('.active').addClass('wrong')

                }
                current_index++;
                $('.words_type').each(function(index) {
                    $(this).removeClass('active');
                    if (index === current_index) {
                        $(this).addClass('active');
                    }
                });
            }
            $(this).val('');
            event.preventDefault(); 
        }
    });
});
