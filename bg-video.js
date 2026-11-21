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

  function getUrlApi() {
    return window.URL || window.webkitURL || null;
  }

  function pickVideoSources(video, webmUrl, mp4Url) {
    var mp4 = { url: mp4Url, type: 'video/mp4' };
    var webm = { url: webmUrl, type: 'video/webm' };

    if (isPS4Browser()) {
      return [mp4];
    }

    if (typeof video.canPlayType === 'function') {
      try {
        if (video.canPlayType('video/webm; codecs="vp9"') === 'probably') {
          return [webm, mp4];
        }
        if (video.canPlayType('video/mp4; codecs="avc1.4d401f"') !== '' || video.canPlayType('video/mp4') !== '') {
          return [mp4, webm];
        }
        if (video.canPlayType('video/webm') !== '') {
          return [webm, mp4];
        }
      } catch (e) {}
    }

    return [mp4, webm];
  }

  function buildAttempts(sources) {
    var attempts = [];
    for (var i = 0; i < sources.length; i++) {
      attempts.push({ url: sources[i].url, type: sources[i].type, mode: 'blob' });
      attempts.push({ url: sources[i].url, type: sources[i].type, mode: 'direct' });
    }
    return attempts;
  }

  function fetchBlobUrl(url, mimeType, onDone) {
    var urlApi = getUrlApi();
    if (!window.XMLHttpRequest || !urlApi || typeof urlApi.createObjectURL !== 'function') {
      onDone(null);
      return null;
    }

    var settled = false;
    function finish(result) {
      if (!settled) {
        settled = true;
        onDone(result);
      }
    }

    var xhr = new XMLHttpRequest();
    try {
      xhr.open('GET', url, true);
    } catch (e) {
      finish(null);
      return null;
    }

    try {
      xhr.responseType = 'blob';
    } catch (e) {}
    if (xhr.responseType !== 'blob') {
      try {
        xhr.responseType = 'arraybuffer';
      } catch (e) {}
    }

    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) {
        return;
      }
      var res = xhr.response;
      var okStatus = xhr.status === 200 || (xhr.status === 0 && !!res);
      if (!okStatus || !res) {
        finish(null);
        return;
      }

      var blob = null;
      try {
        if (typeof Blob !== 'undefined' && res instanceof Blob) {
          if (res.size <= 0) {
            finish(null);
            return;
          }
          if (res.type === mimeType) {
            blob = res;
          } else if (typeof res.slice === 'function') {
            blob = res.slice(0, res.size, mimeType);
          } else {
            blob = new Blob([res], { type: mimeType });
          }
        } else if (res.byteLength && res.byteLength > 0 && typeof Blob !== 'undefined') {
          blob = new Blob([res], { type: mimeType });
        }
      } catch (e) {
        blob = null;
      }

      if (!blob) {
        finish(null);
        return;
      }

      try {
        finish(urlApi.createObjectURL(blob));
      } catch (e) {
        finish(null);
      }
    };

    xhr.onerror = function () {
      finish(null);
    };

    try {
      xhr.send(null);
    } catch (e) {
      finish(null);
      return null;
    }

    return xhr;
  }

  function injectBackgroundVideo() {
    if (!document.body || document.getElementById('p4jb-bg-layer')) {
      return;
    }

    var prefix = getRootPrefix();
    var posterUrl = prefix + 'public/assets/aistudio/tanin-poster.jpg';
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

    var attempts = buildAttempts(pickVideoSources(video, webmUrl, mp4Url));
    var attemptIndex = 0;
    var activeObjectUrl = null;
    var activeXhr = null;
    var loadToken = 0;
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

    function revokeActiveObjectUrl() {
      if (!activeObjectUrl) {
        return;
      }
      var urlApi = getUrlApi();
      if (urlApi && typeof urlApi.revokeObjectURL === 'function') {
        try {
          urlApi.revokeObjectURL(activeObjectUrl);
        } catch (e) {}
      }
      activeObjectUrl = null;
    }

    function abortActiveXhr() {
      if (activeXhr) {
        try {
          activeXhr.abort();
        } catch (e) {}
        activeXhr = null;
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

    function safePlay() {
      if (isPageHidden() || isReducedMotion() || video.style.display === 'none') {
        return;
      }
      // Enforce muted state immediately before play() for strict WebKit autoplay policies
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
      if (isReducedMotion() || isPageHidden() || video.style.display === 'none') {
        return;
      }
      if (!video.getAttribute('src') && attemptIndex < attempts.length) {
        loadCurrentAttempt();
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

    function applyVideoSource(srcUrl, isBlob) {
      revokeActiveObjectUrl();
      if (isBlob) {
        activeObjectUrl = srcUrl;
      }
      video.style.display = '';
      video.muted = true;
      video.defaultMuted = true;
      video.src = srcUrl;
      if (typeof video.load === 'function') {
        try {
          video.load();
        } catch (e) {}
      }
      safePlay();
    }

    function advanceAttempt() {
      attemptIndex += 1;
      loadCurrentAttempt();
    }

    function loadCurrentAttempt() {
      loadToken += 1;
      var token = loadToken;
      abortActiveXhr();

      if (attemptIndex >= attempts.length) {
        revokeActiveObjectUrl();
        video.removeAttribute('src');
        video.style.display = 'none';
        unbindGestureListeners();
        return;
      }

      var attempt = attempts[attemptIndex];
      if (attempt.mode === 'blob') {
        activeXhr = fetchBlobUrl(attempt.url, attempt.type, function (objectUrl) {
          if (token !== loadToken) {
            if (objectUrl) {
              var urlApi = getUrlApi();
              if (urlApi && typeof urlApi.revokeObjectURL === 'function') {
                try {
                  urlApi.revokeObjectURL(objectUrl);
                } catch (e) {}
              }
            }
            return;
          }
          activeXhr = null;
          if (objectUrl) {
            applyVideoSource(objectUrl, true);
          } else {
            advanceAttempt();
          }
        });
      } else {
        applyVideoSource(attempt.url, false);
      }
    }

    function onVideoReady() {
      if (video.paused) {
        safePlay();
      } else {
        unbindGestureListeners();
      }
    }

    video.addEventListener('loadedmetadata', onVideoReady);
    video.addEventListener('loadeddata', onVideoReady);
    video.addEventListener('canplay', onVideoReady);
    video.addEventListener('playing', function () {
      unbindGestureListeners();
    });
    video.addEventListener('error', function () {
      advanceAttempt();
    });

    function syncMotionAndVisibility() {
      if (isReducedMotion()) {
        try {
          video.pause();
        } catch (e) {}
        video.style.display = 'none';
        return;
      }

      if (attemptIndex < attempts.length) {
        video.style.display = '';
        if (!video.getAttribute('src') && !activeXhr) {
          loadCurrentAttempt();
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
    window.addEventListener('pagehide', function (e) {
      try {
        video.pause();
      } catch (err) {}
      if (!e || !e.persisted) {
        loadToken += 1;
        abortActiveXhr();
        revokeActiveObjectUrl();
      }
    });
    window.addEventListener('pageshow', syncMotionAndVisibility);

    if (motionQuery) {
      if (typeof motionQuery.addEventListener === 'function') {
        motionQuery.addEventListener('change', syncMotionAndVisibility);
      } else if (typeof motionQuery.addListener === 'function') {
        motionQuery.addListener(syncMotionAndVisibility);
      }
    }

    bindGestureListeners();

    if (!isReducedMotion()) {
      // Defer async XHR slightly so exploit bootstrap scripts in g2all and legacy hosts run first
      setTimeout(function () {
        if (!isReducedMotion() && !video.getAttribute('src') && !activeXhr) {
          loadCurrentAttempt();
        }
      }, 80);
    } else {
      video.style.display = 'none';
    }
  }

  if (document.body) {
    injectBackgroundVideo();
  } else {
    document.addEventListener('DOMContentLoaded', injectBackgroundVideo);
  }
})();
