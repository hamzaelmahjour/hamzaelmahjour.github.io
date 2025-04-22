---
layout: single
title: "Leave Your Anonymous Feedback"
permalink: /feedback/
---

We welcome your anonymous thoughts — on the teaching I make or the content created or this specific website.  
Your comments help us improve!

<!-- modify this form HTML and place wherever you want your form -->
<form action="https://formspree.io/f/mzzrpoor" method="POST">
  <fieldset>
    <legend>I am a…</legend>
    <label>
      <input type="radio" name="role" value="Visitor" required>
      Visitor
    </label><br>
    <label>
      <input type="radio" name="role" value="Former Colleague">
      Former Colleague
    </label><br>
    <label>
      <input type="radio" name="role" value="Former Student">
      Former Student
    </label>
  </fieldset>

  <label for="message">Your feedback:</label><br>
  <textarea id="message" name="message" rows="6" style="width:100%" required></textarea><br>

  <!-- optional if you ever want to reply:
       visitors can leave an email, but they don’t have to -->
  <input type="email" name="_replyto" placeholder="Your email (optional)"><br><br>

  <button type="submit">Send Feedback</button>
</form>
