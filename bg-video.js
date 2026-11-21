(function () {
  function getRootPrefix() {
    var links = document.getElementsByTagName('link');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href') || '';
      var idx = href.indexOf('style.css');
      if (idx !== -1) {
        return href.slice(0, idx);
      }
    }
    return '';
  }

  function isPS4Browser() {
    var ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : '';
    return /PlayStation 4/i.test(ua);
  }

  function isBrowserOffline() {
    return typeof navigator !== 'undefined' && navigator.onLine === false;
  }

  function pickVideoSources(video, webmUrl, mp4Url) {
    if (isPS4Browser()) {
      return [mp4Url];
    }

    if (typeof video.canPlayType === 'function') {
      try {
        if (video.canPlayType('video/webm; codecs="vp9"') === 'probably') {
          return [webmUrl, mp4Url];
        }
        if (video.canPlayType('video/mp4; codecs="avc1.4d401f"') !== '' || video.canPlayType('video/mp4') !== '') {
          return [mp4Url, webmUrl];
        }
        if (video.canPlayType('video/webm') !== '') {
          return [webmUrl, mp4Url];
        }
      } catch (e) {}
    }

    return [mp4Url, webmUrl];
  }

  function injectBackgroundVideo() {
    if (!document.body || document.getElementById('p4jb-bg-layer')) {
      return;
    }

    var prefix = getRootPrefix();
    var posterUrl = prefix + 'public/assets/aistudio/tanin-poster.jpg';
    var gifUrl = prefix + 'public/assets/aistudio/tanin-bg.gif';
    var webmUrl = prefix + 'public/assets/aistudio/Tanin1080p_b1930797.webm';
    var mp4Url = prefix + 'public/assets/aistudio/tanin-bg.mp4';

    var layer = document.createElement('div');
    layer.id = 'p4jb-bg-layer';
    layer.setAttribute('aria-hidden', 'true');
    layer.style.backgroundImage = 'url("' + posterUrl + '")';

    var video = document.createElement('video');
    video.id = 'p4jb-bg-video';
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.controls = false;
    video.preload = 'auto';
    video.poster = posterUrl;
    try {
      video.disablePictureInPicture = true;
      video.disableRemotePlayback = true;
    } catch (e) {}
    video.setAttribute('autoplay', '');
    video.setAttribute('loop', '');
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('disablepictureinpicture', '');
    video.setAttribute('disableremoteplayback', '');
    video.setAttribute('tabindex', '-1');

    var scrim = document.createElement('div');
    scrim.className = 'p4jb-bg-scrim';

    layer.appendChild(video);
    layer.appendChild(scrim);
    document.body.insertBefore(layer, document.body.firstChild);

    var sources = pickVideoSources(video, webmUrl, mp4Url);
    var sourceIndex = 0;
    var gifActive = false;
    var videoReady = false;
    var watchdogTimer = null;
    var gestureBound = false;

    var motionQuery = null;
    try {
      if (typeof window.matchMedia === 'function') {
        motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      }
    } catch (e) {}

    function isReducedMotion() {
      return !!(motionQuery && motionQuery.matches);
    }

    function isPageHidden() {
      return document.hidden === true || document.visibilityState === 'hidden';
    }

    function clearWatchdog() {
      if (watchdogTimer !== null) {
        clearTimeout(watchdogTimer);
        watchdogTimer = null;
      }
    }

    function unbindGestureListeners() {
      if (!gestureBound) {
        return;
      }
      gestureBound = false;
      document.removeEventListener('click', retryOnGesture, true);
      document.removeEventListener('mousedown', retryOnGesture, true);
      document.removeEventListener('touchstart', retryOnGesture, true);
      document.removeEventListener('keydown', retryOnGesture, true);
    }

    function activateGifFallback() {
      clearWatchdog();
      unbindGestureListeners();
      gifActive = true;
      try {
        video.pause();
      } catch (e) {}
      video.removeAttribute('src');
      video.style.display = 'none';
      if (!isReducedMotion()) {
        layer.style.backgroundImage = 'url("' + gifUrl + '")';
      } else {
        layer.style.backgroundImage = 'url("' + posterUrl + '")';
      }
    }

    function safePlay() {
      if (gifActive || isPageHidden() || isReducedMotion() || video.style.display === 'none') {
        return;
      }
      video.muted = true;
      video.defaultMuted = true;
      if (typeof video.play === 'function') {
        try {
          var playPromise = video.play();
          if (playPromise && typeof playPromise.then === 'function') {
            playPromise.then(function () {
              unbindGestureListeners();
            }, function () {});
          } else if (!video.paused) {
            unbindGestureListeners();
          }
        } catch (e) {}
      }
    }

    function retryOnGesture() {
      if (gifActive || isReducedMotion() || isPageHidden() || video.style.display === 'none') {
        return;
      }
      if (!video.getAttribute('src') && sourceIndex < sources.length) {
        loadCurrentSource();
        return;
      }
      if (video.paused) {
        safePlay();
      } else {
        unbindGestureListeners();
      }
    }

    function bindGestureListeners() {
      if (gestureBound) {
        return;
      }
      gestureBound = true;
      document.addEventListener('click', retryOnGesture, true);
      document.addEventListener('mousedown', retryOnGesture, true);
      document.addEventListener('touchstart', retryOnGesture, true);
      document.addEventListener('keydown', retryOnGesture, true);
    }

    function startWatchdog() {
      clearWatchdog();
      watchdogTimer = setTimeout(function () {
        watchdogTimer = null;
        if (!videoReady && (!video.readyState || video.readyState < 2)) {
          activateGifFallback();
        }
      }, 2500);
    }

    function loadCurrentSource() {
      if (isReducedMotion()) {
        clearWatchdog();
        video.style.display = 'none';
        layer.style.backgroundImage = 'url("' + posterUrl + '")';
        return;
      }
      if (isBrowserOffline() || sourceIndex >= sources.length) {
        activateGifFallback();
        return;
      }

      gifActive = false;
      videoReady = false;
      layer.style.backgroundImage = 'url("' + posterUrl + '")';
      video.style.display = '';
      video.muted = true;
      video.defaultMuted = true;
      video.src = sources[sourceIndex];
      if (typeof video.load === 'function') {
        try {
          video.load();
        } catch (e) {}
      }
      startWatchdog();
      safePlay();
    }

    function onVideoReady() {
      if (gifActive) {
        return;
      }
      videoReady = true;
      clearWatchdog();
      if (video.paused) {
        safePlay();
      } else {
        unbindGestureListeners();
      }
    }

    video.addEventListener('loadeddata', onVideoReady);
    video.addEventListener('canplay', onVideoReady);
    video.addEventListener('playing', function () {
      if (gifActive) {
        return;
      }
      videoReady = true;
      clearWatchdog();
      unbindGestureListeners();
    });
    video.addEventListener('error', function () {
      if (gifActive) {
        return;
      }
      sourceIndex += 1;
      loadCurrentSource();
    });

    function syncMotionAndVisibility() {
      if (isReducedMotion()) {
        clearWatchdog();
        try {
          video.pause();
        } catch (e) {}
        video.style.display = 'none';
        layer.style.backgroundImage = 'url("' + posterUrl + '")';
        return;
      }

      if (gifActive) {
        layer.style.backgroundImage = 'url("' + gifUrl + '")';
        return;
      }

      if (isBrowserOffline()) {
        activateGifFallback();
        return;
      }

      if (sourceIndex < sources.length) {
        video.style.display = '';
        if (!video.getAttribute('src')) {
          loadCurrentSource();
          return;
        }
      }

      if (isPageHidden()) {
        try {
          video.pause();
        } catch (e) {}
      } else {
        safePlay();
      }
    }

    document.addEventListener('visibilitychange', syncMotionAndVisibility);
    if (typeof window.addEventListener === 'function') {
      window.addEventListener('pagehide', function () {
        clearWatchdog();
        try {
          video.pause();
        } catch (e) {}
      });
      window.addEventListener('pageshow', syncMotionAndVisibility);
      window.addEventListener('offline', function () {
        if (!videoReady) {
          activateGifFallback();
        }
      });
    }

    if (motionQuery) {
      if (typeof motionQuery.addEventListener === 'function') {
        motionQuery.addEventListener('change', syncMotionAndVisibility);
      } else if (typeof motionQuery.addListener === 'function') {
        motionQuery.addListener(syncMotionAndVisibility);
      }
    }

    if (isReducedMotion()) {
      video.style.display = 'none';
      layer.style.backgroundImage = 'url("' + posterUrl + '")';
      return;
    }

    if (isBrowserOffline()) {
      activateGifFallback();
      return;
    }

    bindGestureListeners();
    setTimeout(function () {
      if (!gifActive && !isReducedMotion() && !video.getAttribute('src')) {
        loadCurrentSource();
      }
    }, 80);
  }

  if (document.body) {
    injectBackgroundVideo();
  } else {
    document.addEventListener('DOMContentLoaded', injectBackgroundVideo);
  }
})();
