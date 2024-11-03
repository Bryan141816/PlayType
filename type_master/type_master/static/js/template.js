function optionBoxResizeTransition(){
    setTimeout(()=>{
        const optionBox = document.getElementById("option-selector");
        const container = document.getElementById("options-container");
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width;
        const height = containerRect.height;
        optionBox.style.width = `${width}px`;
    },0)
}
function showNotification(icon, type, message){
    $('#notification-container').addClass('notification-container-active')
    $('#notification-icon').html(icon)
    $('#notification-type').html(type)
    $('#notification-message').html(message)
    setTimeout(()=>{
        $('#notification-container').removeClass('notification-container-active')
    },2000)
}