---
layout: single
title: "Leave Your Feedback"
permalink: /feedback/
---

Feel free to post a positive or a negative opinion about the way I teach, the contents on this website or anything else.
Your comments help us improve!

<!-- modify this form HTML and place wherever you want your form -->
<form action="https://formspree.io/f/mzzrpoor" method="POST">
  <fieldset style="border: none; padding: 0; margin-bottom: 1em;">
    <legend style="font-weight: bold;">I am a…</legend>
    
    <div style="display: flex; gap: 1em; flex-wrap: wrap;">
      <label style="display: flex; align-items: center; gap: 0.3em;">
        <input type="radio" name="role" value="Visitor" required>
        Visitor
      </label>
      
      <label style="display: flex; align-items: center; gap: 0.3em;">
        <input type="radio" name="role" value="Former Colleague">
        Former Colleague
      </label>

      <label style="display: flex; align-items: center; gap: 0.3em;">
        <input type="radio" name="role" value="Former Student">
        Former Student
      </label>
    </div>
  </fieldset>

  <label for="message">Your feedback:</label><br>
  <textarea id="message" name="message" rows="6" style="width:100%" required></textarea><br>

  <!-- optional if you ever want to reply:
       visitors can leave an email, but they don’t have to -->
  <input type="email" name="_replyto" placeholder="Your email (optional)"><br><br>

  <button type="submit">Send Feedback</button>
</form>
