
function showNotification(icon, type, message){
    $('#notification-container').addClass('notification-container-active')
    $('#notification-icon').html(icon)
    $('#notification-type').html(type)
    $('#notification-message').html(message)
    setTimeout(()=>{
        $('#notification-container').removeClass('notification-container-active')
    },2000)
}