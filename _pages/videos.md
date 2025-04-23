---
title: "Videos Scientifiques et Pédagogiques"
layout: splash
permalink: /videos/
author_profile: false
classes: wide
header:
  overlay_image: ../assets/header/videos_banner.gif
  overlay_filter: 0.3
  overlay_full: true
---

{% include video-gallery-style.html %}

<div class="video-gallery">
  {% for group in site.data.videos %}
    <div class="category-group">
      <h2 class="category-title">{{ group.category }}</h2>  <!-- Category heading -->
      <div class="video-items">
        {% for video in group.videos %}
          <div class="video-item" data-id="{{ video.id }}">
            <div class="video-wrapper">
              <img src="{{ video.thumbnail }}" alt="{{ video.title }}">
            </div>
            <h3>{{ video.title }}</h3>
            <p>{{ video.description }}</p>
          </div>
        {% endfor %}
      </div>
    </div>
  {% endfor %}
</div>

<!-- Keep the existing modal and script -->

<!-- Modal for video playback -->
<div id="video-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background-color:rgba(0,0,0,0.8); justify-content:center; align-items:center; z-index:9999;">
  <div style="position:relative; width:80%; max-width:800px;">
    <iframe id="vimeo-player" width="100%" height="450" frameborder="0" allowfullscreen></iframe>
    <span onclick="closeVideo()" style="position:absolute; top:10px; right:15px; color:white; font-size:2rem; cursor:pointer;">&times;</span>
  </div>
</div>

<script>
  const modal = document.getElementById("video-modal");
  const player = document.getElementById("vimeo-player");

  document.querySelectorAll(".video-item").forEach(item => {
    item.addEventListener("click", () => {
      const id = item.getAttribute("data-id");
      player.src = `https://player.vimeo.com/video/${id}`;
      modal.style.display = "flex";
    });
  });

  function closeVideo() {
    modal.style.display = "none";
    player.src = "";
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeVideo();
    }
  });
</script>

