let songQueue = [];

function PlayAudio(audio_url, song_id) {
    var audio = document.getElementById('player');
    var source = document.getElementById('audioSource');
    source.src = audio_url;
    var name = document.getElementById(song_id+"-n").textContent;
    var album = document.getElementById(song_id+"-a").textContent;
    var image = document.getElementById(song_id+"-i").getAttribute("src");
    
    document.title = name+" - "+album;
    var bitrate = document.getElementById('saavn-bitrate');
    var bitrate_i = bitrate.options[bitrate.selectedIndex].value;
    var quality = "";
    if (bitrate_i == 4) {quality = 320} else {quality = 160;}

    document.getElementById("player-name").innerHTML = name;
    document.getElementById("player-album").innerHTML = album;
    document.getElementById("player-image").setAttribute("src",image);

    var promise = audio.load();
    if (promise) {
        promise.catch(function(error) { console.error(error); });
    }
    audio.play();

    var loopButton = document.getElementById('loopButton');
    var isLooping = false;
  
    loopButton.addEventListener('click', toggleLoop);
  
    function toggleLoop() {
      isLooping = !isLooping;
      audio.loop = isLooping;
      updateLoopButtonState();
    }
  
    function updateLoopButtonState() {
      loopButton.textContent = isLooping ? 'repeat_one' : 'repeat';
      loopButton.style.color = isLooping ? '#bb86fc' : '';
    }
  
    audio.addEventListener('ended', function() {
      if (isLooping) {
        audio.currentTime = 0;
        audio.play();
      }
    });
  
    // Set initial loop button state
    updateLoopButtonState();
    
    audio.onended = function() {
        if (songQueue.length > 0) {
            playNextInQueue();
        } else {
            // If the queue is empty, you might want to stop or loop the current song
            audio.currentTime = 0;
            if (!isLooping) {
                audio.pause();
                updatePlayPauseIcon();
            }
        }
    };
}

function searchSong(search_term) {
    document.getElementById('search-box').value=search_term;
    var goButton = document.getElementById("search-trigger");
    goButton.click();
}

var DOWNLOAD_API = "https://openmp3compiler.astudy.org"
function AddDownload(id) {
    var bitrate = document.getElementById('saavn-bitrate');
    var bitrate_i = bitrate.options[bitrate.selectedIndex].value;
    var MP3DL = DOWNLOAD_API+"/add?id="+id;
    fetch(MP3DL)
    .then(response => response.json())
    .then(data => {
        if (data.status == "success") {
            var download_list = document.getElementById("download-list");
            var download_item = document.createElement("li");
            download_item.innerHTML = `
            <div class="col">
            <img class="track-img" src="${data.image}" width="50px">
            <div style="display: inline;">
              <span class="track-name"> ${id}</span> - 
              <span class="track-album"> ${data.album}</span>
              <br>
              <span class="track-size"> Size : Null</span>
              <span class="track-status" style="color:green"> </span>
            </div>
          </div>
          <hr>
            `;
            download_item.setAttribute("track_tag",id);
            download_item.className = "no-bullets";
            download_list.appendChild(download_item);
            var STATUS_URL = DOWNLOAD_API+"/status?id="+id;
            var download_status_span = document.querySelector('[track_tag="'+id+'"] .track-status');
            var download_name = document.querySelector('[track_tag="'+id+'"] .track-name');
            var download_album = document.querySelector('[track_tag="'+id+'"] .track-album');
            var download_img = document.querySelector('[track_tag="'+id+'"] .track-img');
            var download_size = document.querySelector('[track_tag="'+id+'"] .track-size');
            
            download_name.innerHTML= results_objects[id].track.name;
            download_status_span.innerHTML = data.status;
            download_album.innerHTML = results_objects[id].track.album.name;
            download_img.setAttribute("src",results_objects[id].track.image[2].link);
            
            var float_tap = document.getElementById('mpopupLink');
            float_tap.style.backgroundColor = "green";
            float_tap.style.borderColor = "green";

            setTimeout(function() {
                float_tap.style.backgroundColor = "#007bff";
                float_tap.style.borderColor = "#007bff";
            }, 1000);
            
            var interval = setInterval(function() {
                fetch(STATUS_URL)
                .then(response => response.json())
                .then(data => {
                    if (data.status) {
                        download_status_span.textContent = data.status;
                        if(data.size) {
                            download_size.textContent = "Size: "+data.size;
                        }
                        if (data.status == "Done") {
                            download_status_span.innerHTML = `<a href="${DOWNLOAD_API}${data.url}" target="_blank">Download MP3</a>`;
                            clearInterval(interval);
                            return;
                  }}
              });}, 3000);
        }
    });
}

function addToQueue(song_id) {
    songQueue.push(song_id);
    M.toast({html: 'Song added to queue', classes: 'rounded'});
    updateQueueDisplay();
}

function removeFromQueue(index) {
    songQueue.splice(index, 1);
    updateQueueDisplay();
}

function playNextInQueue() {
    if (songQueue.length > 0) {
        const nextSong = songQueue.shift();
        PlayAudio(results_objects[nextSong].track.downloadUrl[4].link, nextSong);
        updateQueueDisplay();
    } else {
        M.toast({html: 'No more songs in the queue', classes: 'rounded'});
    }
}

function updateQueueDisplay() {
    const queueList = document.getElementById('queueList');
    queueList.innerHTML = '';
    songQueue.forEach((song_id, index) => {
        const song = results_objects[song_id].track;
        const li = document.createElement('li');
        li.className = 'collection-item';
        li.innerHTML = `
            <div>${song.name} - ${song.album.name}
                <a href="#" class="secondary-content" onclick="removeFromQueue(${index})"><i class="material-icons">clear</i></a>
            </div>
        `;
        queueList.appendChild(li);
    });
}
