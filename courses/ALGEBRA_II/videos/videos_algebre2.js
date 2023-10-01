const video = document.querySelector("iframe");
const playPauseButton = document.getElementById("play-pause-button");
const progressBar = document.getElementById("progress-bar");
const volumeButton = document.getElementById("volume-button");

let isPlaying = false;

playPauseButton.addEventListener("click", togglePlayPause);
volumeButton.addEventListener("click", toggleMute);
video.addEventListener("timeupdate", updateProgressBar);
video.addEventListener("ended", videoEnded);

function togglePlayPause() {
    if (isPlaying) {
        video.pause();
        playPauseButton.classList.remove("pause");
        playPauseButton.classList.add("play");
    } else {
        video.play();
        playPauseButton.classList.remove("play");
        playPauseButton.classList.add("pause");
    }
    isPlaying = !isPlaying;
}

function toggleMute() {
    if (video.muted) {
        video.muted = false;
        volumeButton.classList.remove("mute");
    } else {
        video.muted = true;
        volumeButton.classList.add("mute");
    }
}

function updateProgressBar() {
    const progress = (video.currentTime / video.duration) * 100;
    progressBar.style.width = `${progress}%`;
}

function videoEnded() {
    playPauseButton.classList.remove("pause");
    playPauseButton.classList.add("play");
    isPlaying = false;
    progressBar.style.width = "0";
}
