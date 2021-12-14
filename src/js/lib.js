const fetch = require("cross-fetch");

// globals
const FILTER = "EgIQAQ%253D%253D"; // only video
const SEARCH_URL = "https://www.youtube.com/results";
const VIDEO_URL = "https://www.youtube.com/watch";
let isLoop = false;
let isInit = true;

window.addEventListener("load", () => {
    const playBtn = document.getElementById("play");
    const pauseBtn = document.getElementById("pause");
    const prevBtn = document.getElementById("previous");
    const nextBtn = document.getElementById("next");

    // disable previous button
    if (isInit) {
        prevBtn.classList.add("inactive");
    }
    // previous button click event
    prevBtn.addEventListener("click", (event) => {
        if (!isInit) {
            clickEffect(event);
        }
    });
    // next button click event
    nextBtn.addEventListener("click", (event) => {
        clickEffect(event);
    });
    // play button click event
    playBtn.addEventListener("click", (event) => {
        event.target.classList.add("hidden");
        pauseBtn.classList.remove("hidden");
    });
    // pause button click event
    pauseBtn.addEventListener("click", (event) => {
        event.target.classList.add("hidden");
        playBtn.classList.remove("hidden");
    });
    // loop button click event
    const loopBtn = document.getElementById("loop");
    loopBtn.addEventListener("click", (event) => {
        if (isLoop) {
            event.target.classList.remove("loop-active");
        } else {
            event.target.classList.add("loop-active");
        }
        isLoop = !isLoop;
    });

    // search
    const searchInput = document.getElementById("search");
    searchInput.addEventListener("keyup", async (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            const searchTerm = event.target.value;

            // clear value and focus out
            event.target.value = "";
            event.target.blur();

            // search on YouTube
            await YTsearch(searchTerm);
        }
    });
});

function clickEffect(event) {
    event.target.classList.add("clicked");
    setTimeout(() => {
        event.target.classList.remove("clicked");
    }, 200);
}

async function YTsearch(searchText) {
    const searchParams = new URLSearchParams({
        search_query: searchText,
        sp: FILTER,
    });

    const response = await fetch(`${SEARCH_URL}?${searchParams}`);
    const html = await response.text();
    const video = getFirstVideo(html);
    getVideoInfo(video.videoId);
}

function getFirstVideo(html) {
    let firstVideo = null;

    const regex = /var\sytInitialData\s=\s.*{.*}(?=;(\s)?<\/script>)/g;
    const found = html.match(regex)[0];
    const json = found.replace("var ytInitialData = ", "");
    const respObj = JSON.parse(json);
    const contents =
        respObj.contents.twoColumnSearchResultsRenderer.primaryContents
            .sectionListRenderer.contents[0].itemSectionRenderer.contents;
    for (const video of contents) {
        if (video.hasOwnProperty("videoRenderer")) {
            firstVideo = video;
            break;
        }
    }
    return firstVideo.videoRenderer;
}

async function getVideoInfo(videoId) {
    const response = await fetch(`${VIDEO_URL}?v=${videoId}`);
    const html = await response.text();
    console.log(html);
    videoInfo = getVideoDetails(html);
    const streams = videoInfo.streamingData.adaptiveFormats;
    console.log(videoInfo.videoDetails.title);
    let audio_link = null;
    for (const format of streams) {
        if (format.mimeType.includes("audio")) {
            audio_link = format.url;
            console.log(format.url);
            break;
        }
    }
    // await download(audio_link)
}

function getVideoDetails(html) {
    const regex =
        /var\sytInitialPlayerResponse\s=\s.*{.*}(?=;(\s)?<\/script>)/g;
    const found = html.match(regex)[0];
    console.log(found);
    const json = found.replace("var ytInitialPlayerResponse = ", "");
    const respObj = JSON.parse(json);
    const { playabilityStatus, videoDetails, streamingData } = respObj;
    return { playabilityStatus, videoDetails, streamingData };
}
