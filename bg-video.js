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

  function injectBackgroundVideo() {
    if (!document.body || document.getElementById('p4jb-bg-layer')) {
      return;
    }

    var prefix = getRootPrefix();
    var layer = document.createElement('div');
    layer.id = 'p4jb-bg-layer';
    layer.setAttribute('aria-hidden', 'true');

    var video = document.createElement('video');
    video.id = 'p4jb-bg-video';
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('autoplay', '');
    video.setAttribute('loop', '');
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('poster', prefix + 'img.jpg');
    video.src = prefix + 'public/assets/aistudio/Tanin1080p_b1930797.webm';

    video.addEventListener('error', function () {
      video.style.display = 'none';
    });

    var scrim = document.createElement('div');
    scrim.className = 'p4jb-bg-scrim';

    layer.appendChild(video);
    layer.appendChild(scrim);
    document.body.insertBefore(layer, document.body.firstChild);

    if (typeof video.play === 'function') {
      try {
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () {});
        }
      } catch (e) {}
    }
  }

  if (document.body) {
    injectBackgroundVideo();
  } else {
    document.addEventListener('DOMContentLoaded', injectBackgroundVideo);
  }
})();
