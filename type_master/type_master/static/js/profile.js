let userLevel = null;
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

function setLevel(exp){
    const levelResult = calculateLevel(exp)
    if(userLevel){
        if(levelResult.currentLevel > userLevel.currentLevel){
            $.ajax({
              url: `/achivementCheck/Level equal to/${levelResult.currentLevel}/`, // The URL where Django expects the request
              type: 'POST',
              contentType: 'application/x-www-form-urlencoded', // Data type
              beforeSend: function(xhr, settings) {
                  // Include CSRF token if needed
                  xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
              },
              success: function (response) {
                let icon = '<i class="fas fa-crown"></i>'
                showNotification(icon, 'Notification' ,`You've reached level ${levelResult.currentLevel}`)
                setTimeout(()=>{
                    let image = `<img src="/static/images//${response.data.achivement_image}">`
                    showNotification(image, `Achivement` ,response.data.title)
                },3000)
              },
              error: function (xhr, status, error) {
                let icon = '<i class="fas fa-crown"></i>'
                showNotification(icon, 'Notification' ,`You've reached level ${levelResult.currentLevel}`)
              }
            });
        }
    }
    userLevel = levelResult;
    $('#level-amount-profile').text(`LVL ${levelResult.currentLevel}`)
    $('#lvl-value-meter').text(`${exp}/${levelResult.requiredExp}`)
    $('#lvl-amount').css('width', `${levelResult.progressPercentage}%`);

}

const baseExp = 0; // EXP required for level 1 (starts at 0)
const growthRate = 100; // Initial EXP increment for level 2
const multiplier = 1.1; // Growth rate for each subsequent level

/**
 * Function to calculate level and required EXP
 * @param {number} exp - The current experience points
 * @returns {object} - Current level, EXP for the next level, remaining EXP, and progress percentage
 */
function calculateLevel(exp) {
    let level = 1; // Start at level 1
    let expForCurrentLevel = baseExp; // Total EXP for the start of the current level
    let expForNextLevel = growthRate; // EXP required to reach the next level

    // Loop to find the current level
    while (exp >= expForNextLevel) {
        expForCurrentLevel = expForNextLevel;
        expForNextLevel += Math.round(growthRate * Math.pow(multiplier, level - 1));
        level++;
    }

    // Calculate progress percentage for the current level
    const progress = Math.round(
        ((exp - expForCurrentLevel) / (expForNextLevel - expForCurrentLevel)) * 100
    );

    return {
        currentLevel: level,
        requiredExp: expForNextLevel,
        remainingExp: expForNextLevel - exp,
        progressPercentage: progress // Keep 2 decimal points
    };
}
