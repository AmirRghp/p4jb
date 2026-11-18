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

  function pickVideoSources(video, webmUrl, mp4Url) {
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
    var motionQuery = null;
    try {
      if (typeof window.matchMedia === 'function') {
        motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      }
    } catch (e) {}

    function isReducedMotion() {
      return !!(motionQuery && motionQuery.matches);
    }

    function markReady() {
      if (video.className.indexOf('is-ready') === -1) {
        video.className = video.className ? video.className + ' is-ready' : 'is-ready';
      }
    }

    function safePlay() {
      if (document.hidden || isReducedMotion() || video.style.display === 'none') {
        return;
      }
      if (typeof video.play === 'function') {
        try {
          var playPromise = video.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function () {});
          }
        } catch (e) {}
      }
    }

    function loadCurrentSource() {
      if (sourceIndex >= sources.length) {
        video.style.display = 'none';
        return;
      }
      video.style.display = '';
      video.src = sources[sourceIndex];
      if (typeof video.load === 'function') {
        try {
          video.load();
        } catch (e) {}
      }
      safePlay();
    }

    video.addEventListener('loadeddata', markReady);
    video.addEventListener('canplay', markReady);
    video.addEventListener('playing', markReady);

    video.addEventListener('error', function () {
      sourceIndex += 1;
      if (sourceIndex < sources.length) {
        loadCurrentSource();
      } else {
        video.style.display = 'none';
      }
    });

    function syncMotionAndVisibility() {
      if (isReducedMotion()) {
        try {
          video.pause();
        } catch (e) {}
        video.style.display = 'none';
        return;
      }

      if (sourceIndex < sources.length) {
        video.style.display = '';
        if (!video.getAttribute('src')) {
          loadCurrentSource();
          return;
        }
      }

      if (document.hidden) {
        try {
          video.pause();
        } catch (e) {}
      } else {
        safePlay();
      }
    }

    document.addEventListener('visibilitychange', syncMotionAndVisibility);
    window.addEventListener('pagehide', function () {
      try {
        video.pause();
      } catch (e) {}
    });
    window.addEventListener('pageshow', syncMotionAndVisibility);

    if (motionQuery) {
      if (typeof motionQuery.addEventListener === 'function') {
        motionQuery.addEventListener('change', syncMotionAndVisibility);
      } else if (typeof motionQuery.addListener === 'function') {
        motionQuery.addListener(syncMotionAndVisibility);
      }
    }

    function retryOnGesture() {
      document.removeEventListener('pointerdown', retryOnGesture);
      document.removeEventListener('keydown', retryOnGesture);
      if (video.paused) {
        safePlay();
      }
    }
    document.addEventListener('pointerdown', retryOnGesture);
    document.addEventListener('keydown', retryOnGesture);

    if (!isReducedMotion()) {
      loadCurrentSource();
      if (video.readyState >= 2) {
        markReady();
      }
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
