$(document).ready(function() {

    
    let current_index = 0
    $('.word_container').first().addClass('active');
    let activeWordsType = $('.word_container.active');
    let active_text = activeWordsType.find('.letter').map(function() {
        return $(this).text();
    }).get();

    $('.word_container').first().find('.letter').first().addClass('current_pointer');
    let space_counter = 0;

    let started = false;
    let set_time = 15;
    let timeLeft = set_time;
    const countdownElement = $('#counter');
    let countdown;
    const text_input = $('#text_input')
    let total_characters = 0;

    text_input.focus();

    countdownElement.text(set_time);

    let previous_input_length = 0;
    let current_count = 0;
    let incorrect_counter = 0;

    text_input.on('input', function() {

        
        const current_input = $(this).val().split('');    
        activeWordsType.find('.letter').removeClass('correct');
        activeWordsType.find('.letter').removeClass('incorrect');
        activeWordsType.find('.letter').removeClass('current_pointer');
        activeWordsType.find('.letter').removeClass('current_pointer_edge');

        current_count = current_input.length
        
        if (!started) {
            countdownElement.removeClass('hidden');
            countdown = setInterval(function() {
                timeLeft--;
                countdownElement.text(timeLeft);
        
                if (timeLeft <= 0) {

                    total_characters += current_count

                    clearInterval(countdown);
                    const count = $('.letter.correct').length;
                    const minute = set_time / 60;
                    let wpm = ((count + space_counter) / 5) / minute;
                    let accuracy = ((((total_characters)+space_counter)-incorrect_counter)/(total_characters+space_counter))*100
                    console.log(count)
                    console.log(total_characters)
                    console.log(incorrect_counter)
                    console.log(space_counter)

                    wpm = Math.ceil(wpm);
                    accuracy = Math.ceil(accuracy)

                    let wpm_display = $(`
                        <div class="wpm_container">
                            <h2>${wpm} WPM</h2>
                            <br>
                            <h2>${accuracy}%</h2>
                        </div>`);
                    $('#paragraph').html(wpm_display);
                    $('#paragraph').removeClass('text_input_unfocused');
                    countdownElement.addClass('hidden');
                    $('#retry_button').focus();
                }
            }, 1000);
        }        
        started = true;

        if((previous_input_length>current_input.length)&&(current_input.length+1>active_text.length)&&previous_input_length!=0){
            $('.word_container.active .letter:last').remove();
        }
    
        current_input.forEach(function(value, index) {
            if (index < active_text.length) {
                
                if(current_input[index] == active_text[index]){
                    activeWordsType.find('.letter').eq(index).addClass('correct');
                }
                else if(current_input[index] != active_text[index]){
                    activeWordsType.find('.letter').eq(index).addClass('incorrect');
                    incorrect_counter++;
                }
            }
            else{
                if(index+1>previous_input_length){
                    let insert_overflow_text = $(`<span class="letter incorrect_extra">${current_input[current_input.length-1]}</span>`);
                    activeWordsType.append(insert_overflow_text);
                    incorrect_counter++;
                }
            }
        });
        previous_input_length = current_input.length
        
        if(activeWordsType.find('.letter').length == current_input.length){
            $('.word_container.active').find('.letter').eq(current_input.length -1).addClass('current_pointer_edge');
        }else{
            $('.word_container.active').find('.letter').eq(current_input.length).addClass('current_pointer');

        }
        
    });

    text_input.on('keydown', function(event) {
        if (event.key === " " || event.keyCode === 32) {
            let inputed = $(this).val().trim()
            if( inputed!=""){
                total_characters += active_text.length
                current_index++;
                $('.word_container').each(function(index) {
                    $(this).removeClass('active');
                    $(this).find('.letter').removeClass('current_pointer')
                    $(this).find('.letter').removeClass('current_pointer_edge')
                    previous_input_length = 0;
                    if (index === current_index) {
                        $(this).addClass('active');
                    }
                });
                activeWordsType = $('.word_container.active');
                active_text = activeWordsType.find('.letter').map(function() {
                    return $(this).text();
                }).get();
                $('.active').find('.letter').first().addClass('current_pointer');
                space_counter++;
                get_relative_position()
            }
            $(this).val('');
            event.preventDefault(); 
        }
        else if (event.key === "Enter" || event.keyCode === 13) {
            // Prevent the default action for the Enter key
            event.preventDefault();
        }
    });

    $(document).keypress(function(event) {
        let char = String.fromCharCode(event.which); // Get the character
        let isAlphanumeric = /^[a-z0-9]$/i.test(char); // Check if it's alphanumeric
    
        if (isAlphanumeric) {
            text_input.focus();
        }
    });
    
    $('#paragraph').click(()=>{
        text_input.focus();
    });

    text_input.on('focus', function() {
        $('#paragraph').removeClass('text_input_unfocused')
    });

    text_input.on('blur', function() {
        $('#paragraph').addClass('text_input_unfocused')
    });


    $('#retry_button').click(function() {
        $.ajax({
            url: 'refresh_words/',  // URL defined in urls.py
            method: 'GET',  // HTTP method
            data: {
                'csrfmiddlewaretoken': '{{ csrf_token }}',  // CSRF token
            },
            success: function(response) {
                $('#paragraph').html(response)
                reset_values()
            },
            error: function(xhr, status, error) {
            }
        });
    });
    
    function reset_values(){
        current_index = 0
        $('.word_container').first().addClass('active');
        activeWordsType = $('.word_container.active');
        active_text = activeWordsType.find('.letter').map(function() {
            return $(this).text();
        }).get();
    
        $('.word_container').first().find('.letter').first().addClass('current_pointer');
        
    
        space_counter = 0;

        started = false;
        timeLeft = set_time;
    
        text_input.focus();

        text_input.val('')
    
        previous_input_length = 0;
        clearInterval(countdown);
        countdownElement.text(set_time).addClass('hidden');

        const container = document.querySelector('.paragraph');
        container.scrollTop = 0;
        total_characters =0;
        incorrect_counter =0;
    }
    function get_relative_position(){

        // Get the element and its container
        const element = document.querySelector('.active');
        const container = document.querySelector('.paragraph');

        // Get bounding rectangles
        const elementRect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();


        // Calculate the position relative to the container
        const relativeX = elementRect.left - containerRect.left;
        const relativeY = elementRect.top - containerRect.top;
        if(relativeY > (containerRect.height*0.60)){
            container.scrollBy({
                top: containerRect.height/2, 
                behavior: 'smooth' 
            });
        }


    }

});
