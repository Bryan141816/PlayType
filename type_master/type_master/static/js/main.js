class Timer{
    constructor(set_time,timer_label){
        this.set_time = set_time
        this.timer_label = timer_label
    }
    start(){
        console.log(this.set_time,this.timer_label)
        this.countdown = setInterval(function() {
            this.set_time--;
            this.timer_label.text(this.set_time);
    
            if (this.set_time <= 0) {
                clearInterval(this.countdown);
                this.emit('done')
            }
        }, 1000)
    }
    stop(){
        clearInterval(this.countdown)
    }
}
