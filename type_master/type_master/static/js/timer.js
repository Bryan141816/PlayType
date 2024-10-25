class CountdownTimer {
    constructor(set_time, timer_label, on_done) {
        this.original_time = set_time;
        this.set_time = set_time;
        this.timer_label = $(timer_label);
        this.timer_label.text(this.formatMinutesAndSeconds(this.set_time));
        this.on_done = on_done;
    }

    start() {
        this.countdown = setInterval(() => { 
            this.set_time--;
            let time = this.formatMinutesAndSeconds(this.set_time)
            this.timer_label.text(time);

            if (this.set_time <= 0) {
                clearInterval(this.countdown);
                this.on_done();
            }
        }, 1000);
    }
    formatMinutesAndSeconds(seconds) {
        if(seconds>=60){
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
        
            // Add leading zeros to make sure it's two digits
            const minutesStr = minutes.toString().padStart(2, '0');
            const secondsStr = secs.toString().padStart(2, '0');
            
            return `${minutesStr}:${secondsStr}`;
        }
        else{
            return `${seconds}`
        }
    }

    stop() {
        clearInterval(this.countdown);
    }

    reset() {
        this.stop()
        this.set_time = this.original_time; 
    }

    update(newTime){
        this.stop()
        this.set_time = newTime
        this.original_time = newTime
        this.timer_label.text(newTime);
    }
    getRemainingTime(){
        return this.set_time;
    }
}

class CountupTimer {
    set_time = 0;
    start() {
        this.countup = setInterval(() => { 
            this.set_time++;
            if (this.set_time <= 0) {
                clearInterval(this.countup);
                this.on_done();
            }
        }, 1000);
    }
    stop() {
        clearInterval(this.countup);
    }
    reset() {
        this.stop()
        this.set_time = 0; 
    }
    getRemainingTime(){
        return this.set_time;
    }
}