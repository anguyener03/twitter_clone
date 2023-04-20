document.addEventListener("DOMContentLoaded",()=>{
    addChirpButtonEventListener();
    addChirpBoxExitListener();
});
// add a listener to the chirp button to bring up the chirp box screen
function addChirpButtonEventListener(){
    const chirpButton = document.getElementById("makeChirp");
    const chirpBox = document.getElementById("tweetBox");
    chirpButton.addEventListener("click", (e)=>{
        e.preventDefault();
        if(chirpBox.classList.contains("hidden")){
            chirpBox.classList.remove("hidden");
        }
        else{
            chirpBox.classList.add("hidden");
        }
    });}
// add a listener to the chirp exit button
function addChirpBoxExitListener(){
    const chirpButton = document.getElementById("exitChirpBox");
    const chirpBox = document.getElementById("tweetBox");
    chirpButton.addEventListener("click", (e)=>{
        e.preventDefault();
        chirpBox.classList.add("hidden");
    });
}